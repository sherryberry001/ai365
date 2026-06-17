import { NextResponse, type NextRequest } from "next/server";

import { authorizeAutomation } from "@/lib/api-auth";
import { runCadence } from "@/lib/agents/orchestrator";
import type { AutomationCadence } from "@/lib/database.types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow long agent runs (adjust per host plan)

const VALID: AutomationCadence[] = ["daily", "weekly", "monthly", "adhoc"];

async function handle(request: NextRequest) {
  const auth = await authorizeAutomation(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cadence = (new URL(request.url).searchParams.get("cadence") ??
    "daily") as AutomationCadence;
  if (!VALID.includes(cadence)) {
    return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
  }

  // Cron (secret) runs respect toggles; manual UI runs force.
  const report = await runCadence(cadence, { force: auth.via === "session" });
  return NextResponse.json(report);
}

// Vercel Cron calls GET; manual/external triggers may POST.
export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
