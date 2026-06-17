import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ApprovalRow,
  ContentCategory,
  PublishChannel,
} from "@/lib/database.types";

/** Maps an approval content_type to its table + how to mark it published. */
const CONTENT_TABLES: Record<
  string,
  { table: string; hasPublishedAt: boolean; titleColumn: string }
> = {
  article: { table: "articles", hasPublishedAt: true, titleColumn: "title" },
  resource: { table: "resources", hasPublishedAt: true, titleColumn: "title" },
  linkedin_post: {
    table: "linkedin_posts",
    hasPublishedAt: true,
    titleColumn: "hook",
  },
  linkedin_comment: {
    table: "linkedin_comments",
    hasPublishedAt: true,
    titleColumn: "comment_text",
  },
  community_answer: {
    table: "community_answers",
    hasPublishedAt: true,
    titleColumn: "question_title",
  },
  github_idea: {
    table: "github_ideas",
    hasPublishedAt: false,
    titleColumn: "title",
  },
  newsletter: {
    table: "newsletters",
    hasPublishedAt: false,
    titleColumn: "subject",
  },
  image_prompt: {
    table: "image_prompts",
    hasPublishedAt: false,
    titleColumn: "purpose",
  },
};

const ACTIVITY_TYPE: Record<string, string> = {
  article: "article",
  resource: "resource",
  linkedin_post: "linkedin_post",
  linkedin_comment: "comment",
  community_answer: "community_answer",
  github_idea: "github_project",
  newsletter: "newsletter",
};

/**
 * Marks the content behind an approval as published, records an MVP activity,
 * and flips the approval row to `published`. Uses the service-role client so it
 * works from API routes / cron as well as from the admin UI.
 *
 * NOTE: this publishes to OUR database (the website). It never calls external
 * APIs — external posting stays manual until those modules are enabled.
 */
export async function publishApproval(approval: ApprovalRow): Promise<{
  ok: boolean;
  title?: string;
  error?: string;
}> {
  const supabase = createAdminClient();
  const def = CONTENT_TABLES[approval.content_type];
  if (!def) return { ok: false, error: `Unknown content type ${approval.content_type}` };

  const update: Record<string, unknown> = { status: "published" };
  if (def.hasPublishedAt) update.published_at = new Date().toISOString();

  // `def.table` is a runtime string, so this one call can't be statically typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dyn = supabase.from(def.table as any) as any;
  const { data: updated, error } = await dyn
    .update(update)
    .eq("id", approval.content_id)
    .select()
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  const title =
    approval.title ??
    (updated?.[def.titleColumn] as string | undefined) ??
    approval.content_type;

  // Record the MVP contribution.
  await supabase.from("mvp_activities").insert({
    activity_type: ACTIVITY_TYPE[approval.content_type] ?? "other",
    title,
    category: approval.mvp_impact_category as ContentCategory | null,
    platform: approval.channel as PublishChannel,
    topic: approval.reason,
    impact: "Published via approval queue",
    url: approval.platform_link,
    source_type: approval.content_type,
    source_id: approval.content_id,
  });

  // Flip the approval to published.
  await supabase
    .from("approvals")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", approval.id);

  return { ok: true, title };
}
