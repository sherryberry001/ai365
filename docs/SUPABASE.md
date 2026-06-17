# Supabase

## The provisioned project

A dedicated project has been created and fully migrated:

| | |
|---|---|
| Organization | **Shehryar Hassan** (`nfchwcymzdxrubnvuymg`) — a new org, separate from Dizparc |
| Project | **shehryar-mvp-platform** (`hqdpnyxgofavccsfgqht`) |
| Region | `eu-north-1` (Stockholm) |
| Postgres | 17 |
| Dashboard | https://supabase.com/dashboard/project/hqdpnyxgofavccsfgqht |

Keys are in `.env.local`. The DB password used for migrations is in `.env.local` as `SUPABASE_DB_PASSWORD`.

> **Security:** rotate the personal access token you shared in chat (Supabase → Account → Access Tokens) once you've confirmed everything works — it grants full account access.

## Schema (18 tables)

`profiles`, `articles`, `article_drafts`, `resources`, `linkedin_posts`, `linkedin_comments`, `community_answers`, `image_prompts`, `github_ideas`, `newsletters`, `mvp_activities`, `analytics`, `agent_logs`, `automation_tasks`, `approvals`, `style_profiles`, `app_settings`, `contact_messages`.

Enums: `user_role`, `content_status`, `content_category`, `publish_channel`, `approval_status`, `agent_run_status`, `automation_cadence`.

(Webinars/Speaking were intentionally dropped per the MVP-growth direction.)

## Row Level Security

RLS is on for every table:

- **Anonymous/public** can `SELECT` only **published** content (`articles`, `resources`, `github_ideas`, `newsletters`) plus all `mvp_activities` (the MVP journey is public) and may `INSERT` into `contact_messages`.
- **Staff** (`admin`|`editor`) can do everything via the dashboard.
- The **service-role key** (used by agents/automation server-side) bypasses RLS entirely.
- `profiles` are auto-created on signup via the `on_auth_user_created` trigger.

## Migrations

```
supabase/migrations/
  0001_schema.sql   tables, enums, triggers, FKs
  0002_rls.sql      RLS policies + is_staff()/is_admin() helpers
  0003_seed.sql     automation toggles, default style profile, sample content
```

Re-apply / update from the project root (already linked):

```bash
export SUPABASE_ACCESS_TOKEN=<your token>
supabase db push                 # apply pending migrations
supabase migration new <name>    # author a new migration
npm run db:types                 # regenerate lib/database.types.ts
```

> `0003_seed.sql` inserts sample content. Before pushing to a clean production project you don't want seeded, delete that file (the `app_settings` and default `style_profiles` rows it creates are worth keeping — move them into a separate migration if so).

## Automation defaults (seeded in `app_settings`)

```
auto_publish_website   = true     # approved articles publish to the site
auto_publish_linkedin  = false    # external channels stay OFF until configured
auto_publish_community = false
auto_publish_github    = false
automation_daily_enabled / weekly / monthly = true
default_model = "claude-opus-4-8"
```

Toggle these in **Admin → Settings** (admin role required).

## Storage (optional)

The schema references Supabase Storage for resource downloads and rendered images. Create a public bucket (e.g. `media`) in the dashboard and store file URLs in `resources.file_url` / `image_prompts.generated_url`. The `next.config.mjs` `images.remotePatterns` already allows `*.supabase.co`.
