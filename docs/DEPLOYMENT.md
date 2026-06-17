# Deployment

The app builds to Next.js `standalone` output, so it deploys cleanly to **Vercel** (recommended — cron is built in) or **Azure App Service** (matches your other apps).

## 1. Push to GitHub

```bash
cd shehryar-mvp-platform
git init
git add -A
git commit -m "Initial commit: Shehryar MVP platform"
gh repo create shehryar-mvp-platform --private --source=. --push
# or: create the repo in the GitHub UI and `git remote add origin … && git push -u origin main`
```

`.gitignore` already excludes `.env*.local` — your keys are **not** committed.

## 2. Deploy to Vercel

1. **vercel.com → Add New → Project → import the GitHub repo.** Framework auto-detects Next.js.
2. **Environment Variables** — add every value from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `CLAUDE_API_KEY`, `CLAUDE_MODEL`
   - `AUTOMATION_SECRET`
   - `NEXT_PUBLIC_SITE_URL` → your production URL (e.g. `https://shehryarhassan.com`)
   - `NEXT_PUBLIC_OWNER_NAME`, `NEXT_PUBLIC_OWNER_EMAIL`
   - `CRON_SECRET` → set this so Vercel Cron can authenticate (the automation endpoint accepts `CRON_SECRET` or `AUTOMATION_SECRET`).
3. **Deploy.**

### Cron

`vercel.json` already schedules:

| Cadence | Schedule (UTC) | Endpoint |
|---|---|---|
| daily | `0 6 * * *` | `/api/automation?cadence=daily` |
| weekly | `0 5 * * 1` | `/api/automation?cadence=weekly` |
| monthly | `0 4 1 * *` | `/api/automation?cadence=monthly` |

Vercel injects `Authorization: Bearer $CRON_SECRET` on cron calls; the route verifies it. Long agent runs are allowed via `maxDuration = 300` — on Hobby, function duration is capped, so heavy daily runs may need the Pro plan (or trigger agents individually).

## 3. Custom domain

1. Vercel → Project → **Settings → Domains** → add your domain.
2. Point DNS (A/CNAME) per Vercel's instructions; TLS is automatic.
3. Update `NEXT_PUBLIC_SITE_URL` to the final URL and redeploy (so canonical URLs, sitemap, RSS, and OG tags are correct).

## 4. Supabase Auth redirect URLs

In the Supabase dashboard → **Authentication → URL Configuration**, add your production URL to **Site URL** and **Redirect URLs** so login works in production.

## Alternative: Azure App Service

The `standalone` build runs on Azure too (your `svenska-skydd-crm` pattern):

```bash
npm run build
# deploy .next/standalone (+ .next/static and public) via zip deploy
```

Set the same env vars in App Service → Configuration. Disable Oryx build (`SCM_DO_BUILD_DURING_DEPLOYMENT=false`) and run `node server.js`. For cron on Azure, use a scheduled WebJob or Azure Logic App hitting `/api/automation?cadence=…` with the `Authorization: Bearer <AUTOMATION_SECRET>` header.

## Post-deploy checklist

- [ ] Create your admin user + set role (see [SETUP.md](SETUP.md)).
- [ ] Add Claude key; run **Automation → daily** once to confirm drafts appear.
- [ ] Approve one website article; confirm it shows publicly.
- [ ] Check `/sitemap.xml`, `/rss.xml`, `/robots.txt`.
- [ ] Rotate the Supabase access token shared during setup.
- [ ] Leave LinkedIn/community/GitHub auto-publish OFF until you build those integrations and confirm each platform's automation rules.
