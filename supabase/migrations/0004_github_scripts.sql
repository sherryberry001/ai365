-- ============================================================================
-- 0004_github_scripts.sql — store real script content on github_ideas so the
-- PowerShell scripts can be shown on the public Community page and pushed to
-- GitHub.
-- ============================================================================

alter table github_ideas
  add column if not exists code text,
  add column if not exists filename text;
