-- ============================================================================
-- 0003_seed.sql — baseline settings, style profile, and sample content
-- Safe to re-run: uses ON CONFLICT / WHERE NOT EXISTS guards where it matters.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Automation toggles (spec defaults). Website auto-publish ON; externals OFF.
-- ----------------------------------------------------------------------------
insert into app_settings (key, value, description) values
  ('auto_publish_website',   'true'::jsonb,  'Publish approved articles to the website automatically'),
  ('auto_publish_linkedin',  'false'::jsonb, 'Auto-publish to LinkedIn (requires API + manual enable)'),
  ('auto_publish_community', 'false'::jsonb, 'Auto-publish to Microsoft communities (manual enable)'),
  ('auto_publish_github',    'false'::jsonb, 'Auto-publish GitHub resources (manual enable)'),
  ('automation_daily_enabled',   'true'::jsonb,  'Run the daily content engine'),
  ('automation_weekly_enabled',  'true'::jsonb,  'Run the weekly content engine'),
  ('automation_monthly_enabled', 'true'::jsonb,  'Run the monthly reporting engine'),
  ('default_model', '"claude-opus-4-8"'::jsonb, 'Default Claude model for drafting')
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Default style profile for the Personal Brand Agent
-- ----------------------------------------------------------------------------
insert into style_profiles (name, profile, sample_count, version, is_active)
select 'default',
  jsonb_build_object(
    'voice', 'Human, personal, direct, experienced consultant. Writes like a practitioner who has actually shipped Microsoft AI projects.',
    'perspective', 'first-person, lessons-learned, real adoption stories',
    'sentence_style', 'short-to-medium sentences, concrete examples, minimal jargon',
    'do', jsonb_build_array(
      'Open with a real scenario or a sharp observation',
      'Use specific Microsoft product names and versions',
      'Share trade-offs and what did not work',
      'End with a question or a practical takeaway'
    ),
    'avoid', jsonb_build_array(
      'Generic AI phrasing ("In today''s fast-paced world")',
      'Buzzword stuffing', 'Empty praise ("Great post!")',
      'Over-polished corporate tone', 'Fake experience or invented metrics'
    ),
    'topics', jsonb_build_array('Copilot','Azure AI','AI Agents','Governance','Automation','Microsoft 365')
  ),
  0, 1, true
where not exists (select 1 from style_profiles where name = 'default');

-- ----------------------------------------------------------------------------
-- Sample published articles
-- ----------------------------------------------------------------------------
insert into articles (slug, title, subtitle, excerpt, body_mdx, category, tags, status,
  seo_title, seo_description, og_title, og_description, reading_minutes, generated_by, published_at)
values
(
  'rolling-out-copilot-without-the-hype',
  'Rolling Out Microsoft 365 Copilot Without the Hype',
  'What actually moves the needle in the first 90 days',
  'A field-tested look at what makes a Copilot rollout stick — beyond the demo magic.',
  E'## The demo is the easy part\n\nEvery Copilot pilot I have run starts the same way: a room full of people impressed by a meeting recap. Ninety days later the question is different — *did anything change?*\n\nHere is what separated the deployments that stuck from the ones that fizzled.\n\n### 1. Pick two workflows, not twenty\n\nThe teams that won narrowed Copilot to two repeated tasks — usually meeting follow-ups and first-draft documents. Focus beats breadth.\n\n### 2. Data hygiene is the real project\n\nCopilot surfaces whatever Graph can see. If your SharePoint permissions are a mess, Copilot will cheerfully expose it. Budget for an oversharing review *before* go-live.\n\n### 3. Measure something concrete\n\n"Saves time" is not a metric. Pick one: drafting time per document, or minutes-to-first-response in support. Baseline it, then compare.\n\n> The organisations that treated Copilot as a change-management project, not a license purchase, are the ones still using it.\n\nWhat are you measuring in your rollout?',
  'copilot', array['copilot','adoption','change-management'], 'published',
  'Rolling Out Microsoft 365 Copilot Without the Hype',
  'A practical, field-tested guide to making a Microsoft 365 Copilot rollout actually stick in the first 90 days.',
  'How to roll out Microsoft 365 Copilot (without the hype)',
  'Lessons from real Copilot deployments: focus, data hygiene, and metrics that matter.',
  6, 'content-agent', now() - interval '3 days'
),
(
  'designing-governed-azure-ai-architecture',
  'Designing a Governed Azure AI Architecture',
  'A reference pattern for enterprise-grade AI workloads',
  'How to structure Azure AI so security and governance are built in, not bolted on.',
  E'## Governance is an architecture decision\n\nMost Azure AI governance problems are really architecture problems that surfaced late. Here is the pattern I keep coming back to.\n\n### Landing zone first\n\nPut your AI workloads in a dedicated subscription with private endpoints, a managed VNet, and no public model endpoints. Azure AI Foundry plus Private Link is the baseline.\n\n### Identity over keys\n\nManaged identities everywhere. If you are still passing API keys around, that is your first refactor.\n\n### Content safety as a gate\n\nAzure AI Content Safety should sit in front of any user-facing generation, with logging to a central workspace.\n\nThis is not exotic — it is just deciding governance early instead of during the audit.',
  'azure_ai', array['azure','architecture','governance'], 'published',
  'Designing a Governed Azure AI Architecture',
  'A reference architecture pattern for enterprise Azure AI workloads with security and governance built in.',
  'Designing a Governed Azure AI Architecture',
  'Landing zones, managed identity, and content safety — a practical Azure AI governance pattern.',
  7, 'content-agent', now() - interval '8 days'
);

-- A draft + a review-stage article so dashboards show the pipeline
insert into articles (slug, title, excerpt, category, status, generated_by) values
  ('ai-agents-that-actually-ship', 'AI Agents That Actually Ship', 'Moving from agent demos to production agents.', 'ai_agents', 'review', 'content-agent'),
  ('governance-checklist-for-copilot', 'A Governance Checklist for Copilot', 'The pre-flight list before you flip Copilot on.', 'governance', 'draft', 'content-agent');

-- ----------------------------------------------------------------------------
-- Sample resources
-- ----------------------------------------------------------------------------
insert into resources (slug, title, description, resource_type, category, status, generated_by, published_at) values
  ('copilot-readiness-checklist', 'Copilot Readiness Checklist', 'A 20-point checklist to assess Copilot readiness before rollout.', 'checklist', 'copilot', 'published', 'content-agent', now() - interval '2 days'),
  ('azure-ai-governance-whitepaper', 'Azure AI Governance Whitepaper', 'A reference whitepaper on governing Azure AI at enterprise scale.', 'whitepaper', 'governance', 'draft', 'content-agent', null);

-- ----------------------------------------------------------------------------
-- Sample LinkedIn posts
-- ----------------------------------------------------------------------------
insert into linkedin_posts (hook, body, hashtags, category, status, reason, mvp_impact, generated_by) values
  ('Everyone wants Copilot. Few prepare their data.',
   E'Everyone wants Copilot. Few prepare their data.\n\nLast month a client asked why Copilot "made things up." It did not — it surfaced a document nobody should have had access to.\n\nCopilot is a permissions mirror. Fix the oversharing first.\n\nWhat is your pre-rollout data review process?',
   array['#MicrosoftCopilot','#M365','#DataGovernance'], 'copilot', 'draft',
   'Ties a common fear (hallucination) to a concrete governance lesson — drives discussion.',
   'Thought leadership on Copilot governance', 'content-agent');

-- ----------------------------------------------------------------------------
-- Sample LinkedIn comments
-- ----------------------------------------------------------------------------
insert into linkedin_comments (target_author, target_summary, comment_text, insight_type, category, status, generated_by) values
  ('Microsoft', 'Announcement about new Copilot agents in Microsoft 365',
   E'The autonomous agent direction is the interesting part here. The open question for most orgs is governance: who owns an agent that acts on a user''s behalf, and how is that audited? Curious whether the new admin controls expose per-agent action logs.',
   'question', 'ai_agents', 'draft', 'comment-agent');

-- ----------------------------------------------------------------------------
-- Sample community answer
-- ----------------------------------------------------------------------------
insert into community_answers (platform, question_title, answer_text, doc_references, follow_up_question, category, status, generated_by) values
  ('microsoft_tech_community', 'Why does Copilot not see my SharePoint files?',
   E'This is almost always a Graph indexing or permissions issue rather than Copilot itself.\n\n1. Confirm the user has at least read access to the library.\n2. Check the site is being crawled (search results should return the file).\n3. Verify the file type is supported and not encrypted/IRM-protected.\n\nIf search returns the file but Copilot does not cite it, it is usually a semantic index lag — give it 24h after permission changes.',
   array['https://learn.microsoft.com/microsoft-365-copilot/'],
   'Are you seeing this for one user or tenant-wide?', 'copilot', 'draft', 'community-agent');

-- ----------------------------------------------------------------------------
-- Sample GitHub idea
-- ----------------------------------------------------------------------------
insert into github_ideas (title, description, idea_type, category, status, generated_by) values
  ('copilot-prompt-library', 'A curated, categorized library of Microsoft 365 Copilot prompts with before/after examples.', 'copilot_prompt', 'copilot', 'idea', 'mvp-agent'),
  ('azure-ai-landing-zone-bicep', 'Bicep templates for a governed Azure AI landing zone with Private Link and content safety.', 'azure_template', 'azure_ai', 'idea', 'mvp-agent');

-- ----------------------------------------------------------------------------
-- Sample image prompt
-- ----------------------------------------------------------------------------
insert into image_prompts (purpose, prompt, aspect_ratio, model, category, status, generated_by) values
  ('article_cover',
   'A clean, modern, minimalist editorial illustration representing Microsoft 365 Copilot adoption: abstract blue and teal geometric shapes, a subtle network motif, plenty of negative space, professional tech-editorial style. No text.',
   '16:9', 'dall-e-3', 'copilot', 'draft', 'image-agent');

-- ----------------------------------------------------------------------------
-- Sample MVP activities
-- ----------------------------------------------------------------------------
insert into mvp_activities (activity_type, title, category, platform, topic, impact, impact_score, activity_date) values
  ('article', 'Rolling Out Microsoft 365 Copilot Without the Hype', 'copilot', 'website', 'Copilot adoption', 'Published long-form article', 7, current_date - 3),
  ('article', 'Designing a Governed Azure AI Architecture', 'azure_ai', 'website', 'Azure AI governance', 'Published reference architecture', 7, current_date - 8),
  ('community_answer', 'Why does Copilot not see my SharePoint files?', 'copilot', 'microsoft_tech_community', 'Copilot troubleshooting', 'Resolved a common support question', 5, current_date - 1);

-- ----------------------------------------------------------------------------
-- Sample analytics (last 6 days of traffic + a follower count)
-- ----------------------------------------------------------------------------
insert into analytics (metric, value, channel, captured_at)
select 'page_views', (200 + (g * 37) % 180), 'website', now() - (g || ' days')::interval
from generate_series(0, 6) as g;
insert into analytics (metric, value, channel, captured_at) values
  ('linkedin_followers', 1240, 'linkedin', now()),
  ('linkedin_engagement', 4.8, 'linkedin', now());

-- ----------------------------------------------------------------------------
-- Sample agent log + automation task
-- ----------------------------------------------------------------------------
insert into agent_logs (agent_name, status, cadence, output_summary, items_created, source_model, finished_at) values
  ('content-agent', 'success', 'daily', 'Generated 3 LinkedIn drafts, 5 article ideas, 5 image prompts.', 13, 'claude-sonnet-4-6', now() - interval '6 hours');
insert into automation_tasks (name, cadence, status, finished_at) values
  ('Daily content engine', 'daily', 'success', now() - interval '6 hours');

-- ----------------------------------------------------------------------------
-- Sample approval queue entries
-- ----------------------------------------------------------------------------
insert into approvals (content_type, content_id, channel, status, title, preview, reason, mvp_impact_category, submitted_by, suggested_hashtags)
select 'linkedin_post', lp.id, 'linkedin', 'pending',
  'Everyone wants Copilot. Few prepare their data.',
  'Everyone wants Copilot. Few prepare their data...',
  'Ties a common fear to a governance lesson — drives discussion.',
  'copilot', 'comment-agent', array['#MicrosoftCopilot','#M365','#DataGovernance']
from linkedin_posts lp limit 1;
