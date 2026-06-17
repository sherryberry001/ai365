import "server-only";

import type { AutomationCadence } from "@/lib/database.types";
import type { AgentResult } from "@/lib/types";
import {
  BaseAgent,
  adminClient,
  loadStyleProfile,
  newRunId,
  type Admin,
  type AgentContext,
} from "@/lib/agents/base";
import {
  AnalyticsAgent,
  ArticleAgent,
  CommentAgent,
  CommunityAgent,
  ContentAgent,
  ImageAgent,
  MvpAgent,
  PersonalBrandAgent,
} from "@/lib/agents";

const CADENCE_SETTING: Record<AutomationCadence, string | null> = {
  daily: "automation_daily_enabled",
  weekly: "automation_weekly_enabled",
  monthly: "automation_monthly_enabled",
  adhoc: null,
};

async function isEnabled(supabase: Admin, cadence: AutomationCadence) {
  const key = CADENCE_SETTING[cadence];
  if (!key) return true;
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value === true;
}

/** The agent line-up per cadence (spec daily/weekly/monthly tasks). */
function lineup(cadence: AutomationCadence): BaseAgent[] {
  switch (cadence) {
    case "daily":
      return [
        new ContentAgent({ posts: 3, ideas: 5, images: 5 }),
        new CommentAgent({ count: 10 }),
        new CommunityAgent({ count: 5 }),
        new ImageAgent(),
        new AnalyticsAgent(),
      ];
    case "weekly":
      return [
        new ArticleAgent({ count: 3 }),
        new ContentAgent({ posts: 10, ideas: 5, images: 5 }),
        new CommentAgent({ count: 25 }),
        new CommunityAgent({ count: 20 }),
        new MvpAgent({ ideas: 5 }),
        new AnalyticsAgent(),
      ];
    case "monthly":
      return [new PersonalBrandAgent(), new MvpAgent({ ideas: 5 }), new AnalyticsAgent()];
    default:
      return [];
  }
}

export interface OrchestrationReport {
  cadence: AutomationCadence;
  ran: boolean;
  results: AgentResult[];
  itemsCreated: number;
  skippedReason?: string;
}

/**
 * Run a full automation cadence: respects the per-cadence enable toggle, logs
 * an automation_task, and runs each agent sequentially (kinder to API rate
 * limits than firing them all at once).
 */
export async function runCadence(
  cadence: AutomationCadence,
  opts: { force?: boolean } = {},
): Promise<OrchestrationReport> {
  const supabase = adminClient();

  if (!opts.force && !(await isEnabled(supabase, cadence))) {
    return {
      cadence,
      ran: false,
      results: [],
      itemsCreated: 0,
      skippedReason: `${cadence} automation is disabled in settings`,
    };
  }

  const runId = newRunId();
  const styleProfile = await loadStyleProfile(supabase);
  const ctx: AgentContext = { supabase, styleProfile, runId, cadence };

  const { data: task } = await supabase
    .from("automation_tasks")
    .insert({
      name: `${cadence[0].toUpperCase() + cadence.slice(1)} content run`,
      cadence,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const results: AgentResult[] = [];
  for (const agent of lineup(cadence)) {
    results.push(await agent.run(ctx));
  }

  const itemsCreated = results.reduce((sum, r) => sum + r.itemsCreated, 0);
  const ok = results.every((r) => r.ok);

  await supabase
    .from("automation_tasks")
    .update({
      status: ok ? "success" : "error",
      result: { results, itemsCreated },
      finished_at: new Date().toISOString(),
    })
    .eq("id", task?.id ?? "");

  return { cadence, ran: true, results, itemsCreated };
}
