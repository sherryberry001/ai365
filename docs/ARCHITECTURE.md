# Architecture

## Layers

```
                ┌─────────────────────────────────────────────┐
   Visitors ───▶│  Public site  (app/(marketing))             │  anon key, RLS
                │  Home · Articles · Resources · Community ·   │  → published only
                │  MVP Journey · About · Contact               │
                └─────────────────────────────────────────────┘
                ┌─────────────────────────────────────────────┐
   Owner ──────▶│  Admin  (app/admin)  — session, role-gated   │  user key, RLS
                │  Overview · Content · Approvals · Automation  │  → staff sees all
                │  · MVP · Analytics · Settings                 │
                └───────────────┬─────────────────────────────┘
                                │ server actions / API
                ┌───────────────▼─────────────────────────────┐
   Cron ───────▶│  Orchestrator (lib/agents/orchestrator.ts)   │  service-role key
   /api/automation              │                               │  → bypasses RLS
                │   runs the agent line-up per cadence          │
                └───────────────┬─────────────────────────────┘
                                │
              ┌─────────────────▼──────────────────┐
              │  8 Agents (lib/agents/*)            │──▶ Claude (lib/ai/claude.ts)
              │  Content/Article/Comment/Community/ │    Messages API,
              │  Image/MVP/Analytics/PersonalBrand  │    output_config.format
              └─────────────────┬──────────────────┘
                                │ writes
              ┌─────────────────▼──────────────────┐
              │  Supabase Postgres (18 tables, RLS) │
              └─────────────────────────────────────┘
```

## Three Supabase clients (lib/supabase)

| Client | File | Auth | Use |
|---|---|---|---|
| Browser | `client.ts` | anon | client components |
| Server | `server.ts` | anon + session cookies | server components, actions, route handlers (RLS as the user) |
| Public | `public.ts` | anon, **no cookies** | build-time reads (`sitemap`, `rss`, `generateStaticParams`) |
| Admin | `admin.ts` | **service role** | agents/automation only — never imported into client code |

`middleware.ts` refreshes the session cookie on every request and bounces unauthenticated users away from `/admin`.

## Content lifecycle

`lib/content/workflow.ts` is the state machine. You can never jump to `published` without passing `approved`, which enforces *human approval before publication*.

```
idea → draft → review → approved → published → archived
        ↑________________↓ (rejection sends back)
```

## Approval queue (the hub)

The `approvals` table is polymorphic (`content_type` + `content_id`) so any content type routes through one queue. Each row carries everything the spec asked agents to "prepare": final text preview, suggested hashtags, suggested time, platform link, reason it matters, and MVP impact category.

`approveItem()` checks the channel's auto-publish toggle (`lib/constants.ts → CHANNEL_AUTOPUBLISH_KEY`). Website is on by default → approving a website article publishes it and logs an MVP activity (`lib/publishing.ts`). External channels are off → approving just marks it ready; you publish manually until those integrations exist.

## The voice guardrails

Every agent's system prompt is built by `lib/ai/prompts.ts` on top of fixed rules (human, personal, no buzzwords, no "Great post"), and injects the active **style profile**. The Personal Brand Agent analyzes approved content monthly and writes a new style-profile version — so the system literally learns the owner's voice over time.

## Structured output

`lib/ai/claude.ts` uses the Messages API with `output_config.format: { type: "json_schema", schema }` (schemas in `lib/agents/schemas.ts`) so agent output is validated JSON, not parsed prose. Token usage is captured from `response.usage` and logged per run in `agent_logs`.

## Why the DB types are hand-maintained

`lib/database.types.ts` is a hand-written, accurate mirror of the schema (Insert/Update simplified to `Partial<Row>`). After any schema change, regenerate the exact version with `npm run db:types`.
