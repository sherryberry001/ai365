-- ============================================================================
-- 0001_schema.sql — Shehryar MVP Platform core schema
-- Run order: 0001_schema → 0002_rls → 0003_seed
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'editor', 'viewer');

-- The single content lifecycle every artifact moves through.
create type content_status as enum (
  'idea', 'draft', 'review', 'approved', 'published', 'archived'
);

-- Topic taxonomy used to categorize every piece of content.
create type content_category as enum (
  'copilot',
  'azure_ai',
  'ai_agents',
  'governance',
  'automation',
  'microsoft_365',
  'digital_transformation'
);

-- Where a piece of content is destined to live.
create type publish_channel as enum (
  'website',
  'linkedin',
  'microsoft_tech_community',
  'microsoft_learn',
  'azure_community',
  'github_discussions',
  'newsletter'
);

create type approval_status as enum (
  'pending', 'approved', 'rejected', 'scheduled', 'published'
);

create type agent_run_status as enum ('queued', 'running', 'success', 'error');

create type automation_cadence as enum ('daily', 'weekly', 'monthly', 'adhoc');

-- ----------------------------------------------------------------------------
-- updated_at helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles  (spec: "users") — mirrors auth.users, holds role + brand bio
-- ----------------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  bio         text,
  role        user_role not null default 'viewer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- articles — long-form, MDX-bodied, full SEO surface
-- ----------------------------------------------------------------------------
create table articles (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  subtitle          text,
  excerpt           text,
  body_mdx          text,                       -- MDX source
  category          content_category not null default 'copilot',
  tags              text[] not null default '{}',
  status            content_status not null default 'idea',
  cover_image_url   text,
  cover_prompt_id   uuid,                        -- → image_prompts.id
  reading_minutes   int,
  -- SEO
  seo_title         text,
  seo_description   text,
  og_title          text,
  og_description    text,
  og_image_url      text,
  canonical_url     text,
  -- derivative versions (kept inline for convenience)
  linkedin_version  text,
  newsletter_version text,
  community_version text,
  -- workflow + provenance
  author_id         uuid references profiles (id) on delete set null,
  generated_by      text,                        -- agent name, null if human
  source_model      text,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_articles_status on articles (status);
create index idx_articles_category on articles (category);
create index idx_articles_published_at on articles (published_at desc);
create trigger trg_articles_updated before update on articles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- article_drafts — versioned AI/human draft snapshots for an article
-- ----------------------------------------------------------------------------
create table article_drafts (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references articles (id) on delete cascade,
  version      int not null default 1,
  title        text,
  body_mdx     text,
  notes        text,
  prompt       text,                              -- prompt used to generate
  generated_by text,                              -- agent name
  source_model text,
  created_at   timestamptz not null default now(),
  unique (article_id, version)
);
create index idx_article_drafts_article on article_drafts (article_id);

-- ----------------------------------------------------------------------------
-- resources — downloadable guides / whitepapers / templates / checklists
-- ----------------------------------------------------------------------------
create table resources (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  description    text,
  resource_type  text not null default 'guide',   -- guide|whitepaper|template|checklist
  category       content_category not null default 'copilot',
  file_url       text,                             -- Supabase Storage path
  cover_image_url text,
  status         content_status not null default 'idea',
  download_count int not null default 0,
  generated_by   text,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger trg_resources_updated before update on resources
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- linkedin_posts
-- ----------------------------------------------------------------------------
create table linkedin_posts (
  id                 uuid primary key default gen_random_uuid(),
  hook               text,
  body               text not null,
  hashtags           text[] not null default '{}',
  category           content_category not null default 'copilot',
  status             content_status not null default 'draft',
  image_prompt_id    uuid,
  suggested_post_at  timestamptz,
  mvp_impact         text,
  reason             text,                          -- why this matters
  related_article_id uuid references articles (id) on delete set null,
  generated_by       text,
  source_model       text,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_linkedin_posts_status on linkedin_posts (status);
create trigger trg_linkedin_posts_updated before update on linkedin_posts
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- linkedin_comments — drafted comments for other people's posts
-- ----------------------------------------------------------------------------
create table linkedin_comments (
  id              uuid primary key default gen_random_uuid(),
  target_post_url text,
  target_author   text,
  target_summary  text,                            -- what the post was about
  comment_text    text not null,
  insight_type    text,                            -- insight|question|experience
  category        content_category not null default 'copilot',
  status          content_status not null default 'draft',
  generated_by    text,
  source_model    text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger trg_linkedin_comments_updated before update on linkedin_comments
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- community_answers — Microsoft Learn / Tech Community / Azure / GH Discussions
-- ----------------------------------------------------------------------------
create table community_answers (
  id                 uuid primary key default gen_random_uuid(),
  platform           publish_channel not null default 'microsoft_tech_community',
  question_title     text not null,
  question_url       text,
  answer_text        text not null,
  doc_references     text[] not null default '{}', -- Microsoft docs links
  follow_up_question text,
  category           content_category not null default 'copilot',
  status             content_status not null default 'draft',
  generated_by       text,
  source_model       text,
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger trg_community_answers_updated before update on community_answers
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- image_prompts — prompts for covers / LinkedIn images / banners
-- ----------------------------------------------------------------------------
create table image_prompts (
  id            uuid primary key default gen_random_uuid(),
  purpose       text not null default 'article_cover', -- article_cover|linkedin_image|website_banner
  prompt        text not null,
  negative_prompt text,
  aspect_ratio  text default '16:9',
  model         text,                                  -- dall-e-3 | gpt-image-1 | etc.
  generated_url text,                                  -- rendered image (if any)
  related_type  text,                                  -- article|linkedin_post|resource
  related_id    uuid,
  category      content_category,
  status        content_status not null default 'draft',
  generated_by  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_image_prompts_updated before update on image_prompts
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- github_ideas — open-source project / template ideas (GitHub system)
-- ----------------------------------------------------------------------------
create table github_ideas (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  idea_type    text not null default 'sample_app', -- copilot_prompt|agent_template|azure_template|sample_app|learning_resource
  category     content_category not null default 'ai_agents',
  repo_url     text,
  stars        int default 0,
  status       content_status not null default 'idea',
  generated_by text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_github_ideas_updated before update on github_ideas
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- newsletters — standalone newsletter issues
-- ----------------------------------------------------------------------------
create table newsletters (
  id           uuid primary key default gen_random_uuid(),
  subject      text not null,
  preview_text text,
  body         text not null,
  category     content_category,
  status       content_status not null default 'draft',
  sent_at      timestamptz,
  generated_by text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_newsletters_updated before update on newsletters
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- mvp_activities — the MVP contribution database
-- ----------------------------------------------------------------------------
create table mvp_activities (
  id                uuid primary key default gen_random_uuid(),
  activity_type     text not null,                  -- article|comment|community_answer|github_project|resource|guide
  title             text not null,
  category          content_category,
  platform          publish_channel,
  topic             text,
  impact            text,                            -- qualitative impact note
  impact_score      int,                             -- 1-10 optional
  url               text,
  activity_date     date not null default current_date,
  source_type       text,                            -- which table it came from
  source_id         uuid,
  created_at        timestamptz not null default now()
);
create index idx_mvp_activities_date on mvp_activities (activity_date desc);
create index idx_mvp_activities_type on mvp_activities (activity_type);

-- ----------------------------------------------------------------------------
-- analytics — flexible metric store (traffic / engagement / growth)
-- ----------------------------------------------------------------------------
create table analytics (
  id            uuid primary key default gen_random_uuid(),
  metric        text not null,                       -- page_views|linkedin_engagement|followers|...
  value         numeric not null default 0,
  channel       publish_channel,
  category      content_category,
  entity_type   text,                                -- article|linkedin_post|...
  entity_id     uuid,
  metadata      jsonb not null default '{}',
  period_start  date,
  period_end    date,
  captured_at   timestamptz not null default now()
);
create index idx_analytics_metric on analytics (metric, captured_at desc);

-- ----------------------------------------------------------------------------
-- agent_logs — every agent run
-- ----------------------------------------------------------------------------
create table agent_logs (
  id            uuid primary key default gen_random_uuid(),
  agent_name    text not null,
  run_id        uuid,                                -- groups logs from one automation run
  status        agent_run_status not null default 'queued',
  cadence       automation_cadence,
  input         jsonb not null default '{}',
  output_summary text,
  items_created int default 0,
  tokens_used   int,
  source_model  text,
  error         text,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index idx_agent_logs_agent on agent_logs (agent_name, started_at desc);
create index idx_agent_logs_run on agent_logs (run_id);

-- ----------------------------------------------------------------------------
-- automation_tasks — scheduled / queued jobs
-- ----------------------------------------------------------------------------
create table automation_tasks (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  cadence       automation_cadence not null default 'daily',
  status        agent_run_status not null default 'queued',
  payload       jsonb not null default '{}',
  result        jsonb,
  scheduled_for timestamptz,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index idx_automation_tasks_status on automation_tasks (status, scheduled_for);

-- ----------------------------------------------------------------------------
-- approvals — the human-in-the-loop approval queue (polymorphic)
-- ----------------------------------------------------------------------------
create table approvals (
  id                  uuid primary key default gen_random_uuid(),
  content_type        text not null,                 -- article|linkedin_post|linkedin_comment|community_answer|image_prompt|resource|github_idea|newsletter
  content_id          uuid not null,
  channel             publish_channel not null,
  status              approval_status not null default 'pending',
  title               text,                          -- denormalized for the queue UI
  preview             text,                          -- short text preview
  payload             jsonb not null default '{}',   -- full snapshot at submission
  -- "prepare everything" fields from the spec
  suggested_post_at   timestamptz,
  suggested_hashtags  text[] not null default '{}',
  suggested_image_url text,
  platform_link       text,
  reason              text,                          -- why this content matters
  mvp_impact_category content_category,
  -- review
  submitted_by        text,                          -- agent name
  reviewed_by         uuid references profiles (id) on delete set null,
  review_notes        text,
  reviewed_at         timestamptz,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_approvals_status on approvals (status, created_at desc);
create index idx_approvals_content on approvals (content_type, content_id);
create trigger trg_approvals_updated before update on approvals
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- style_profiles — Personal Brand Agent learned style (style-profile.json)
-- ----------------------------------------------------------------------------
create table style_profiles (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null default 'default',
  profile            jsonb not null default '{}',     -- tone, cadence, do/don't, samples
  sample_count       int not null default 0,
  version            int not null default 1,
  is_active          boolean not null default true,
  updated_at         timestamptz not null default now()
);
create trigger trg_style_profiles_updated before update on style_profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- app_settings — automation toggles & misc config
-- ----------------------------------------------------------------------------
create table app_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_by  uuid references profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger trg_app_settings_updated before update on app_settings
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- contact_messages — Contact page submissions
-- ----------------------------------------------------------------------------
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- FK that had to wait until image_prompts existed.
alter table articles
  add constraint fk_articles_cover_prompt
  foreign key (cover_prompt_id) references image_prompts (id) on delete set null;
alter table linkedin_posts
  add constraint fk_linkedin_posts_image_prompt
  foreign key (image_prompt_id) references image_prompts (id) on delete set null;
