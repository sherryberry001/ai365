// Re-export the row/enum types so app code imports from one place.
export type {
  UserRole,
  ContentStatus,
  ContentCategory,
  PublishChannel,
  ApprovalStatus,
  AgentRunStatus,
  AutomationCadence,
  ProfileRow,
  ArticleRow,
  ArticleDraftRow,
  ResourceRow,
  LinkedInPostRow,
  LinkedInCommentRow,
  CommunityAnswerRow,
  ImagePromptRow,
  GithubIdeaRow,
  NewsletterRow,
  MvpActivityRow,
  AnalyticsRow,
  AgentLogRow,
  AutomationTaskRow,
  ApprovalRow,
  StyleProfileRow,
  AppSettingRow,
  ContactMessageRow,
} from "@/lib/database.types";

/** A single dashboard KPI tile. */
export interface StatCard {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number;
}

/** Generic agent result envelope returned by every agent run. */
export interface AgentResult {
  agent: string;
  ok: boolean;
  itemsCreated: number;
  summary: string;
  tokensUsed?: number;
  model?: string;
  error?: string;
}
