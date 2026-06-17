import "server-only";

import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Authorize an automation/agent endpoint. Accepts EITHER:
 *  - a `Bearer <AUTOMATION_SECRET>` header (used by cron / external triggers), OR
 *  - a logged-in staff session (admin|editor).
 */
export async function authorizeAutomation(
  request: NextRequest,
): Promise<{ ok: boolean; via?: "secret" | "session" }> {
  const auth = request.headers.get("authorization");
  // AUTOMATION_SECRET for manual/external triggers; CRON_SECRET is what Vercel
  // Cron injects automatically. Either is accepted.
  const secrets = [process.env.AUTOMATION_SECRET, process.env.CRON_SECRET].filter(
    Boolean,
  );
  if (auth && secrets.some((s) => auth === `Bearer ${s}`)) {
    return { ok: true, via: "secret" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && (profile.role === "admin" || profile.role === "editor")) {
    return { ok: true, via: "session" };
  }
  return { ok: false };
}
