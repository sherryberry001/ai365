"use server";

import { revalidatePath } from "next/cache";

import { requireStaff } from "@/lib/auth";
import { runCadence } from "@/lib/agents/orchestrator";
import {
  adminClient,
  loadStyleProfile,
  newRunId,
} from "@/lib/agents/base";
import { makeAgent } from "@/lib/agents";
import type { AutomationCadence } from "@/lib/database.types";
import type { AgentResult } from "@/lib/types";

export async function runAutomation(cadence: AutomationCadence) {
  await requireStaff();
  const report = await runCadence(cadence, { force: true });
  revalidatePath("/admin/automation");
  revalidatePath("/admin");
  return {
    ok: report.ran,
    summary: report.ran
      ? `${cadence}: ${report.itemsCreated} items across ${report.results.length} agents.`
      : (report.skippedReason ?? "Skipped"),
  };
}

export async function runSingleAgent(
  key: string,
): Promise<{ ok: boolean; summary: string }> {
  await requireStaff();
  const agent = makeAgent(key);
  if (!agent) return { ok: false, summary: `Unknown agent: ${key}` };

  const supabase = adminClient();
  const styleProfile = await loadStyleProfile(supabase);
  const result: AgentResult = await agent.run({
    supabase,
    styleProfile,
    runId: newRunId(),
    cadence: "adhoc",
  });

  revalidatePath("/admin/automation");
  return { ok: result.ok, summary: result.error ?? result.summary };
}
