import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { countRows } from "@/lib/admin/stats";
import { timeAgo } from "@/lib/utils";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [
    publishedArticles,
    draftArticles,
    pendingApprovals,
    linkedinDrafts,
    communityDrafts,
    mvpActivities,
  ] = await Promise.all([
    countRows("articles", { status: "published" }),
    countRows("articles", { status: "draft" }),
    countRows("approvals", { column: "status", value: "pending" }),
    countRows("linkedin_posts", { status: "draft" }),
    countRows("community_answers", { status: "draft" }),
    countRows("mvp_activities"),
  ]);

  const { data: recentLogs } = await supabase
    .from("agent_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(6);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Your drafts, approvals and progress at a glance.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/automation">Run automation</Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Published articles" value={publishedArticles} />
        <StatTile
          label="Pending approvals"
          value={pendingApprovals}
          hint="Awaiting your review"
        />
        <StatTile label="Article drafts" value={draftArticles} />
        <StatTile label="LinkedIn drafts" value={linkedinDrafts} />
        <StatTile label="Community answer drafts" value={communityDrafts} />
        <StatTile label="MVP activities logged" value={mvpActivities} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent agent runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentLogs && recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-medium">{log.agent_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {log.output_summary ?? "-"}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <StatusBadge
                    status={log.status === "success" ? "published" : "draft"}
                  />
                  <div className="mt-1">{timeAgo(log.started_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No agent runs yet. Trigger the daily engine from Automation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
