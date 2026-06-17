import { siteConfig } from "@/lib/site";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/constants";
import type { ContentCategory } from "@/lib/database.types";
import { getMvpActivities, getMvpProgress } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { StatTile } from "@/components/stat-tile";
import { ProgressRing } from "@/components/motion/progress-ring";
import { ContributionHeatmap } from "@/components/contribution-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminMvpDashboard() {
  const [progress, activities] = await Promise.all([
    getMvpProgress(),
    getMvpActivities(500),
  ]);

  const goals = [
    { label: "Articles", value: progress.articles, goal: siteConfig.goals.articles },
    { label: "Comments", value: progress.comments, goal: siteConfig.goals.comments },
    { label: "Community answers", value: progress.communityAnswers, goal: siteConfig.goals.communityAnswers },
    { label: "GitHub resources", value: progress.githubResources, goal: siteConfig.goals.githubResources },
  ];

  const byCategory = CATEGORY_KEYS.map((key) => ({
    key,
    label: CATEGORIES[key].label,
    count: activities.filter((a) => a.category === key).length,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">MVP Dashboard</h1>
        <p className="text-muted-foreground">
          Private scoreboard of contributions toward Microsoft MVP. Not shown on
          the public site.
        </p>
      </header>

      {/* Goal rings */}
      <Card>
        <CardHeader>
          <CardTitle>Progress to goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {goals.map((g) => (
              <div key={g.label} className="flex justify-center">
                <ProgressRing value={g.value} goal={g.goal} label={g.label} size={128} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Heatmap + topic mix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contribution activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ContributionHeatmap dates={activities.map((a) => a.activity_date)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By topic</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length > 0 ? (
              <div className="space-y-3.5">
                {byCategory.map((c) => (
                  <div key={c.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{c.label}</span>
                      <span className="font-mono text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                        style={{ width: `${(c.count / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contributions logged yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {goals.map((g) => (
          <StatTile key={g.label} label={g.label} value={g.value} hint={`Goal: ${g.goal}`} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution log</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(a.activity_date)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {a.activity_type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{a.title}</TableCell>
                    <TableCell>
                      {a.category
                        ? CATEGORIES[a.category as ContentCategory].label
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.impact_score ? `${a.impact_score}/10` : (a.impact ?? "-")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No contributions logged yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
