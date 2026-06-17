// ----------------------------------------------------------------------------
// Database types.
//
// This is a hand-maintained, pragmatic version of the types you would normally
// generate with `npm run db:types` (which runs `supabase gen types typescript`).
// It is intentionally simplified: Insert/Update are Partial<Row>. After linking
// your real project, regenerate this file for exact column nullability.
// ----------------------------------------------------------------------------

export type UserRole = "admin" | "editor" | "viewer";

export type ContentStatus =
  | "idea"
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "archived";

export type ContentCategory =
  | "copilot"
  | "azure_ai"
  | "ai_agents"
  | "governance"
  | "automation"
  | "microsoft_365"
  | "digital_transformation";

export type PublishChannel =
  | "website"
  | "linkedin"
  | "microsoft_tech_community"
  | "microsoft_learn"
  | "azure_community"
  | "github_discussions"
  | "newsletter";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published";

export type AgentRunStatus = "queued" | "running" | "success" | "error";

export type AutomationCadence = "daily" | "weekly" | "monthly" | "adhoc";

// --- Row shapes -------------------------------------------------------------

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body_mdx: string | null;
  category: ContentCategory;
  tags: string[];
  status: ContentStatus;
  cover_image_url: string | null;
  cover_prompt_id: string | null;
  reading_minutes: number | null;
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  linkedin_version: string | null;
  newsletter_version: string | null;
  community_version: string | null;
  author_id: string | null;
  generated_by: string | null;
  source_model: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ArticleDraftRow = {
  id: string;
  article_id: string;
  version: number;
  title: string | null;
  body_mdx: string | null;
  notes: string | null;
  prompt: string | null;
  generated_by: string | null;
  source_model: string | null;
  created_at: string;
}

export type ResourceRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  resource_type: string;
  category: ContentCategory;
  file_url: string | null;
  cover_image_url: string | null;
  status: ContentStatus;
  download_count: number;
  generated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LinkedInPostRow = {
  id: string;
  hook: string | null;
  body: string;
  hashtags: string[];
  category: ContentCategory;
  status: ContentStatus;
  image_prompt_id: string | null;
  suggested_post_at: string | null;
  mvp_impact: string | null;
  reason: string | null;
  related_article_id: string | null;
  generated_by: string | null;
  source_model: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LinkedInCommentRow = {
  id: string;
  target_post_url: string | null;
  target_author: string | null;
  target_summary: string | null;
  comment_text: string;
  insight_type: string | null;
  category: ContentCategory;
  status: ContentStatus;
  generated_by: string | null;
  source_model: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CommunityAnswerRow = {
  id: string;
  platform: PublishChannel;
  question_title: string;
  question_url: string | null;
  answer_text: string;
  doc_references: string[];
  follow_up_question: string | null;
  category: ContentCategory;
  status: ContentStatus;
  generated_by: string | null;
  source_model: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ImagePromptRow = {
  id: string;
  purpose: string;
  prompt: string;
  negative_prompt: string | null;
  aspect_ratio: string | null;
  model: string | null;
  generated_url: string | null;
  related_type: string | null;
  related_id: string | null;
  category: ContentCategory | null;
  status: ContentStatus;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type GithubIdeaRow = {
  id: string;
  title: string;
  description: string | null;
  idea_type: string;
  category: ContentCategory;
  repo_url: string | null;
  stars: number | null;
  status: ContentStatus;
  generated_by: string | null;
  code: string | null;
  filename: string | null;
  created_at: string;
  updated_at: string;
}

export type NewsletterRow = {
  id: string;
  subject: string;
  preview_text: string | null;
  body: string;
  category: ContentCategory | null;
  status: ContentStatus;
  sent_at: string | null;
  generated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MvpActivityRow = {
  id: string;
  activity_type: string;
  title: string;
  category: ContentCategory | null;
  platform: PublishChannel | null;
  topic: string | null;
  impact: string | null;
  impact_score: number | null;
  url: string | null;
  activity_date: string;
  source_type: string | null;
  source_id: string | null;
  created_at: string;
}

export type AnalyticsRow = {
  id: string;
  metric: string;
  value: number;
  channel: PublishChannel | null;
  category: ContentCategory | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  period_start: string | null;
  period_end: string | null;
  captured_at: string;
}

export type AgentLogRow = {
  id: string;
  agent_name: string;
  run_id: string | null;
  status: AgentRunStatus;
  cadence: AutomationCadence | null;
  input: Record<string, unknown>;
  output_summary: string | null;
  items_created: number | null;
  tokens_used: number | null;
  source_model: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export type AutomationTaskRow = {
  id: string;
  name: string;
  cadence: AutomationCadence;
  status: AgentRunStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export type ApprovalRow = {
  id: string;
  content_type: string;
  content_id: string;
  channel: PublishChannel;
  status: ApprovalStatus;
  title: string | null;
  preview: string | null;
  payload: Record<string, unknown>;
  suggested_post_at: string | null;
  suggested_hashtags: string[];
  suggested_image_url: string | null;
  platform_link: string | null;
  reason: string | null;
  mvp_impact_category: ContentCategory | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StyleProfileRow = {
  id: string;
  name: string;
  profile: Record<string, unknown>;
  sample_count: number;
  version: number;
  is_active: boolean;
  updated_at: string;
}

export type AppSettingRow = {
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

// --- Database shape expected by @supabase/supabase-js -----------------------

type TableDef<R> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      articles: TableDef<ArticleRow>;
      article_drafts: TableDef<ArticleDraftRow>;
      resources: TableDef<ResourceRow>;
      linkedin_posts: TableDef<LinkedInPostRow>;
      linkedin_comments: TableDef<LinkedInCommentRow>;
      community_answers: TableDef<CommunityAnswerRow>;
      image_prompts: TableDef<ImagePromptRow>;
      github_ideas: TableDef<GithubIdeaRow>;
      newsletters: TableDef<NewsletterRow>;
      mvp_activities: TableDef<MvpActivityRow>;
      analytics: TableDef<AnalyticsRow>;
      agent_logs: TableDef<AgentLogRow>;
      automation_tasks: TableDef<AutomationTaskRow>;
      approvals: TableDef<ApprovalRow>;
      style_profiles: TableDef<StyleProfileRow>;
      app_settings: TableDef<AppSettingRow>;
      contact_messages: TableDef<ContactMessageRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      content_category: ContentCategory;
      publish_channel: PublishChannel;
      approval_status: ApprovalStatus;
      agent_run_status: AgentRunStatus;
      automation_cadence: AutomationCadence;
    };
    CompositeTypes: Record<string, never>;
  };
}
