# Shehryar MVP Platform

An AI-powered personal-brand & **Microsoft MVP growth** platform for Shehryar Hassan — a public website plus an autonomous content engine that drafts articles, LinkedIn posts, comments, community answers, GitHub ideas, and image prompts across the Microsoft AI ecosystem.

> **Nothing publishes to external platforms automatically.** Every piece of content flows through a human approval queue. Website auto-publish is on by default; LinkedIn / community / GitHub stay off until you wire up credentials and explicitly enable them.

## What it does

- **Public site** — Home, Articles (MDX), Resources, Community/Open-Source, MVP Journey, About, Contact. Full SEO: metadata, Open Graph, Twitter cards, JSON-LD, sitemap, RSS.
- **Content engine** — 8 AI agents (Content, Article, Comment, Community, Image, MVP, Analytics, Personal Brand) powered by Claude, all writing in a guarded, human voice.
- **Approval workflow** — `idea → draft → review → approved → published → archived`. A polymorphic approval queue prepares everything (final text, hashtags, suggested time, reason, MVP impact) for one-click review.
- **Admin dashboards** — Overview, Content (kanban), Approvals, Automation (run agents + see logs), MVP (contribution tracker), Analytics, Settings (per-channel automation toggles).
- **Automation** — daily / weekly / monthly cadences via Vercel Cron, or run on demand from the dashboard.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · MDX · Supabase (Postgres + Auth + Storage + RLS) · Anthropic Claude · Vercel · GitHub.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env (a live .env.local was generated for you — see below)
cp .env.example .env.local   # only if .env.local is missing

# 3. Add your Claude API key to .env.local
#    CLAUDE_API_KEY=sk-ant-...

# 4. Run
npm run dev        # http://localhost:3000
```

The Supabase project is **already provisioned and migrated** (see [docs/SUPABASE.md](docs/SUPABASE.md)); `.env.local` holds the live keys. You only need to add `CLAUDE_API_KEY` to run the agents.

### Create your admin login

1. Supabase dashboard → **Authentication → Users → Add user** (email + password).
2. SQL editor: `update profiles set role = 'admin' where email = 'you@example.com';`
3. Visit `/login`, sign in, and you're in `/admin`.

## Project structure

```
app/
  (marketing)/            Public site (header+footer layout)
    page.tsx              Home
    articles/             List + [slug] (MDX, ISR, JSON-LD)
    resources/  community/  mvp-journey/  about/  contact/
  admin/                  Auth-guarded dashboards
    page.tsx              Overview
    content/ approvals/ automation/ mvp/ analytics/ settings/
  api/
    automation/           Cron + manual cadence trigger
    agents/[key]/         Run a single agent
  login/                  Supabase auth
  sitemap.ts  robots.ts  rss.xml/route.ts   globals.css  layout.tsx
components/
  ui/                     shadcn primitives (button, card, table, ...)
  layout/                 site-header, site-footer, admin-sidebar
  *.tsx                   article-card, approval-card, settings-toggle, ...
lib/
  supabase/               client / server / admin / public / middleware
  ai/                     claude.ts (Messages API), models.ts, prompts.ts
  agents/                 base + 8 agents + orchestrator + schemas
  content/workflow.ts     state machine
  queries.ts  auth.ts  constants.ts  site.ts  database.types.ts  utils.ts
supabase/
  migrations/             0001_schema · 0002_rls · 0003_seed
docs/                     SETUP · SUPABASE · DEPLOYMENT · ARCHITECTURE
vercel.json               Cron schedules
```

## The agents

| Agent | Cadence | Output |
|---|---|---|
| **Content** | daily / weekly | LinkedIn posts, article ideas, image prompts |
| **Article** | weekly | Full long-form articles (→ review) + LinkedIn/newsletter/community versions |
| **Comment** | daily / weekly | Thoughtful LinkedIn comments (never empty praise) |
| **Community** | daily / weekly | Answers for Learn / Tech Community / Azure / GitHub |
| **Image** | daily | Cover-image prompts for in-flight articles |
| **MVP** | weekly / monthly | GitHub project ideas + reconciles the MVP activity log |
| **Analytics** | every run | Growth-metric snapshots |
| **Personal Brand** | monthly | Learns your voice from approved content → updates the style profile |

Run them from **Admin → Automation**, via `POST /api/agents/<key>`, or let cron drive `daily`/`weekly`/`monthly`.

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run start        # serve the build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run db:types     # regenerate lib/database.types.ts from the linked project
```

## Docs

- [docs/SETUP.md](docs/SETUP.md) — local setup, env vars, first admin user
- [docs/SUPABASE.md](docs/SUPABASE.md) — the provisioned project, schema, RLS, migrations
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — GitHub + Vercel + custom domain + cron
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
