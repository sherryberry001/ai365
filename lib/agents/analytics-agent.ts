import "server-only";

import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";

/**
 * Analytics Agent — snapshots growth metrics into the `analytics` table so the
 * dashboard can chart progress over time. (No LLM; wire real GA / LinkedIn
 * numbers in here when you connect those APIs.)
 */
export class AnalyticsAgent extends BaseAgent {
  readonly name = "analytics-agent";

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase } = ctx;

    const count = async (
      table: "articles" | "mvp_activities" | "approvals" | "linkedin_posts",
      filter?: { column: string; value: string },
    ) => {
      let q = supabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = q.eq(filter.column, filter.value);
      const { count: c } = await q;
      return c ?? 0;
    };

    const snapshots = [
      { metric: "published_articles", value: await count("articles", { column: "status", value: "published" }) },
      { metric: "mvp_activities_total", value: await count("mvp_activities") },
      { metric: "pending_approvals", value: await count("approvals", { column: "status", value: "pending" }) },
      { metric: "linkedin_drafts", value: await count("linkedin_posts", { column: "status", value: "draft" }) },
    ];

    const now = new Date().toISOString();
    for (const s of snapshots) {
      await supabase.from("analytics").insert({
        metric: s.metric,
        value: s.value,
        channel: "website",
        captured_at: now,
      });
    }

    return {
      itemsCreated: snapshots.length,
      summary: `Recorded ${snapshots.length} growth metric snapshots.`,
    };
  }
}
