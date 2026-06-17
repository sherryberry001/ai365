# Local setup

## Prerequisites

- Node.js 18.18+ (tested on 22)
- An Anthropic API key (for the content engine)
- The Supabase project is already created & migrated — keys are in `.env.local`

## 1. Install & run

```bash
npm install
npm run dev          # http://localhost:3000
```

## 2. Environment variables

`.env.local` was generated with the live Supabase credentials. The only value you must add yourself is the Claude key:

```bash
CLAUDE_API_KEY=sk-ant-...
```

Full reference (`.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-only; bypasses RLS (agents/automation) |
| `CLAUDE_API_KEY` | ✅ (for agents) | Anthropic API key |
| `CLAUDE_MODEL` | — | `claude-opus-4-8` (default) · `claude-sonnet-4-6` (cheaper) · `claude-haiku-4-5` |
| `OPENAI_API_KEY` | — | Optional, for future image rendering |
| `NEXT_PUBLIC_SITE_URL` | — | Canonical URL for SEO/sitemap/RSS (set to your domain in prod) |
| `AUTOMATION_SECRET` | — | Bearer token to trigger automation endpoints |
| `NEXT_PUBLIC_OWNER_NAME` / `_EMAIL` | — | Owner identity shown across the site |

`SUPABASE_DB_PASSWORD` in `.env.local` is for the CLI/migrations only — the app never uses it at runtime.

## 3. Create your admin user

The app uses Supabase Auth. Public visitors can read published content; the `/admin` area requires an `admin` or `editor` profile role.

1. **Supabase dashboard → Authentication → Users → Add user** — create yourself with an email + password.
2. **SQL Editor** — promote the auto-created profile:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
   (A `profiles` row is created automatically by a trigger when the auth user is added.)
3. Go to `/login`, sign in → you land in `/admin`.

## 4. Generate content

- **Admin → Automation** → "Run daily" (or run a single agent).
- Drafts appear under **Content**; items needing sign-off appear under **Approvals**.
- Approve a website article → it publishes and shows on the public site.

## Troubleshooting

- **"CLAUDE_API_KEY is not set"** — add it to `.env.local` and restart `npm run dev`.
- **Agents error with permission denied** — confirm `SUPABASE_SERVICE_ROLE_KEY` is set (agents use it to bypass RLS).
- **Can't see drafts on the public site** — that's correct; RLS only exposes `published` content to anonymous users.
- **Regenerate DB types** after schema changes: `npm run db:types` (requires `supabase link`).
