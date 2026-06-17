import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/lib/database.types";

type CountableTable =
  | "articles"
  | "resources"
  | "linkedin_posts"
  | "linkedin_comments"
  | "community_answers"
  | "image_prompts"
  | "github_ideas"
  | "newsletters"
  | "mvp_activities"
  | "approvals"
  | "agent_logs";

export async function countRows(
  table: CountableTable,
  filters?: { status?: ContentStatus; column?: string; value?: string },
): Promise<number> {
  const supabase = await createClient();
  // The table is a union, so `.eq()` can't be statically column-checked here —
  // this is a generic counter, so we filter through a loosely-typed builder.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.column && filters.value)
    query = query.eq(filters.column, filters.value);
  const { count } = await query;
  return count ?? 0;
}

export async function countByStatus(
  table: CountableTable,
): Promise<Record<ContentStatus, number>> {
  const statuses: ContentStatus[] = [
    "idea",
    "draft",
    "review",
    "approved",
    "published",
    "archived",
  ];
  const entries = await Promise.all(
    statuses.map(
      async (s) => [s, await countRows(table, { status: s })] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<ContentStatus, number>;
}
