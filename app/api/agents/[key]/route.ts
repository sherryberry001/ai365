import { NextResponse, type NextRequest } from "next/server";

import { authorizeAutomation } from "@/lib/api-auth";
import {
  adminClient,
  loadStyleProfile,
  newRunId,
} from "@/lib/agents/base";
import { makeAgent } from "@/lib/agents";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const auth = await authorizeAutomation(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const agent = makeAgent(key);
  if (!agent) {
    return NextResponse.json({ error: `Unknown agent: ${key}` }, { status: 404 });
  }

  const supabase = adminClient();
  const styleProfile = await loadStyleProfile(supabase);
  const result = await agent.run({
    supabase,
    styleProfile,
    runId: newRunId(),
    cadence: "adhoc",
  });

  return NextResponse.json(result);
}
