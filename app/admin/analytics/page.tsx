import { createClient } from "@/lib/supabase/server";
import { countRows } from "@/lib/admin/stats";
import { compactNumber } from "@/lib/utils";
import { StatTile } from "@/components/stat-tile";
import { TrafficChart } from "@/components/analytics-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AnalyticsDashboard() {
  const supabase = await createClient();

  const { data: pageViews } = await supabase
    .from("analytics")
    .select("value, captured_at")
    .eq("metric", "page_views")
    .order("captured_at", { ascending: true })
    .limit(30);

  const latest = async (metric: string) => {
    const { data } = await supabase
      .from("analytics")
      .select("value")
      .eq("metric", metric)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.value ?? 0;
  };

  const [followers, engagement, publishedArticles] = await Promise.all([
    latest("linkedin_followers"),
    latest("linkedin_engagement"),
    countRows("articles", { status: "published" }),
  ]);

  const totalViews = (pageViews ?? []).reduce((sum, r) => sum + r.value, 0);
  const chartData = (pageViews ?? []).map((r) => ({
    label: new Date(r.captured_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    value: r.value,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Traffic, engagement and growth. Wire your real GA / LinkedIn data into
          the <code>analytics</code> table.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Page views (30d)" value={compactNumber(totalViews)} />
        <StatTile label="LinkedIn followers" value={compactNumber(followers)} />
        <StatTile label="Engagement rate" value={`${engagement}%`} />
        <StatTile label="Published articles" value={publishedArticles} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website traffic</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <TrafficChart data={chartData} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No traffic data yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
