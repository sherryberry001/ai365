-- ============================================================================
-- 0002_rls.sql — Row Level Security
--
-- Model: single-owner brand platform.
--   * Anonymous + logged-in visitors may READ published content only.
--   * Staff (role = admin|editor) may do everything through the UI.
--   * The Supabase service-role key (used by server-side agents / automation)
--     BYPASSES RLS entirely, so the content engine always works.
-- ============================================================================

-- Role helpers ---------------------------------------------------------------
create or replace function is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Enable RLS on everything ---------------------------------------------------
alter table profiles           enable row level security;
alter table articles           enable row level security;
alter table article_drafts     enable row level security;
alter table resources          enable row level security;
alter table linkedin_posts     enable row level security;
alter table linkedin_comments  enable row level security;
alter table community_answers  enable row level security;
alter table image_prompts      enable row level security;
alter table github_ideas       enable row level security;
alter table newsletters        enable row level security;
alter table mvp_activities     enable row level security;
alter table analytics          enable row level security;
alter table agent_logs         enable row level security;
alter table automation_tasks   enable row level security;
alter table approvals          enable row level security;
alter table style_profiles     enable row level security;
alter table app_settings       enable row level security;
alter table contact_messages   enable row level security;

-- profiles -------------------------------------------------------------------
create policy "own profile read"   on profiles for select using (auth.uid() = id or is_admin());
create policy "own profile update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin manage profiles" on profiles for all using (is_admin()) with check (is_admin());

-- A reusable pattern: public reads published rows, staff manage all rows.
-- (Written out per-table because policy bodies can't be parameterized.)

-- articles
create policy "public read published articles" on articles
  for select using (status = 'published' or is_staff());
create policy "staff manage articles" on articles
  for all using (is_staff()) with check (is_staff());

-- resources
create policy "public read published resources" on resources
  for select using (status = 'published' or is_staff());
create policy "staff manage resources" on resources
  for all using (is_staff()) with check (is_staff());

-- github_ideas (published ones are shown on the public Community/Resources area)
create policy "public read published github_ideas" on github_ideas
  for select using (status = 'published' or is_staff());
create policy "staff manage github_ideas" on github_ideas
  for all using (is_staff()) with check (is_staff());

-- newsletters (only sent issues are public)
create policy "public read sent newsletters" on newsletters
  for select using (status = 'published' or is_staff());
create policy "staff manage newsletters" on newsletters
  for all using (is_staff()) with check (is_staff());

-- mvp_activities — public read (the MVP Journey page is built in public)
create policy "public read mvp_activities" on mvp_activities
  for select using (true);

-- Staff-only tables (no public read) -----------------------------------------
create policy "staff manage article_drafts" on article_drafts
  for all using (is_staff()) with check (is_staff());
create policy "staff manage linkedin_posts" on linkedin_posts
  for all using (is_staff()) with check (is_staff());
create policy "staff manage linkedin_comments" on linkedin_comments
  for all using (is_staff()) with check (is_staff());
create policy "staff manage community_answers" on community_answers
  for all using (is_staff()) with check (is_staff());
create policy "staff manage image_prompts" on image_prompts
  for all using (is_staff()) with check (is_staff());
create policy "staff manage mvp_activities" on mvp_activities
  for all using (is_staff()) with check (is_staff());
create policy "staff manage analytics" on analytics
  for all using (is_staff()) with check (is_staff());
create policy "staff manage agent_logs" on agent_logs
  for all using (is_staff()) with check (is_staff());
create policy "staff manage automation_tasks" on automation_tasks
  for all using (is_staff()) with check (is_staff());
create policy "staff manage approvals" on approvals
  for all using (is_staff()) with check (is_staff());
create policy "staff manage style_profiles" on style_profiles
  for all using (is_staff()) with check (is_staff());

-- app_settings — staff read, admin write
create policy "staff read settings"  on app_settings for select using (is_staff());
create policy "admin write settings" on app_settings for all using (is_admin()) with check (is_admin());

-- contact_messages — anyone can submit, staff can read/manage
create policy "anyone can submit contact" on contact_messages
  for insert with check (true);
create policy "staff read contact" on contact_messages
  for select using (is_staff());
create policy "staff manage contact" on contact_messages
  for update using (is_staff()) with check (is_staff());
