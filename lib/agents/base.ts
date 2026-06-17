import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AutomationCadence,
  Database,
  StyleProfileRow,
} from "@/lib/database.types";
import type { AgentResult } from "@/lib/types";

export type Admin = SupabaseClient<Database>;

export interface AgentContext {
  supabase: Admin;
  styleProfile: StyleProfileRow | null;
  runId: string;
  cadence: AutomationCadence;
}

export interface AgentOutcome {
  itemsCreated: number;
  summary: string;
  tokensUsed?: number;
  model?: string;
}

/**
 * Every agent extends this. `run()` wraps `execute()` with agent_logs
 * bookkeeping (running → success/error) so the Automation dashboard always
 * reflects reality.
 */
export abstract class BaseAgent {
  abstract readonly name: string;

  protected abstract execute(ctx: AgentContext): Promise<AgentOutcome>;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const { supabase } = ctx;

    const { data: logRow } = await supabase
      .from("agent_logs")
      .insert({
        agent_name: this.name,
        run_id: ctx.runId,
        status: "running",
        cadence: ctx.cadence,
      })
      .select("id")
      .single();

    try {
      const outcome = await this.execute(ctx);
      await supabase
        .from("agent_logs")
        .update({
          status: "success",
          output_summary: outcome.summary,
          items_created: outcome.itemsCreated,
          tokens_used: outcome.tokensUsed ?? null,
          source_model: outcome.model ?? null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", logRow?.id ?? "");

      return {
        agent: this.name,
        ok: true,
        itemsCreated: outcome.itemsCreated,
        summary: outcome.summary,
        tokensUsed: outcome.tokensUsed,
        model: outcome.model,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase
        .from("agent_logs")
        .update({
          status: "error",
          error: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", logRow?.id ?? "");

      return {
        agent: this.name,
        ok: false,
        itemsCreated: 0,
        summary: "Agent failed",
        error: message,
      };
    }
  }
}

/** Load the active style profile once per run. */
export async function loadStyleProfile(
  supabase: Admin,
): Promise<StyleProfileRow | null> {
  const { data } = await supabase
    .from("style_profiles")
    .select("*")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Helper to make a fresh admin client + run id for an automation run. */
export function newRunId(): string {
  return crypto.randomUUID();
}

export function adminClient(): Admin {
  return createAdminClient();
}
