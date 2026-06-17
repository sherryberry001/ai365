import { cn } from "@/lib/utils";

/**
 * GitHub-style contribution heatmap. Renders the last `weeks` weeks of MVP
 * activity, colored by how many contributions landed each day.
 */
export function ContributionHeatmap({
  dates,
  weeks = 26,
}: {
  dates: string[]; // 'YYYY-MM-DD' per activity (repeats allowed)
  weeks?: number;
}) {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const key = d.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Build the grid ending today, aligned so each column is one week.
  const today = new Date();
  const totalDays = weeks * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  // back up to the start of that week (Sunday)
  start.setDate(start.getDate() - start.getDay());

  const cells: { key: string; count: number }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    cells.push({ key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const level = (n: number) =>
    n === 0
      ? "bg-muted"
      : n === 1
        ? "bg-primary/30"
        : n === 2
          ? "bg-primary/55"
          : n === 3
            ? "bg-primary/80"
            : "bg-primary";

  return (
    <div className="overflow-x-auto">
      <div
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: "repeat(7, 1fr)" }}
      >
        {cells.map((c) => (
          <div
            key={c.key}
            title={`${c.key}: ${c.count} contribution${c.count === 1 ? "" : "s"}`}
            className={cn("h-3 w-3 rounded-[3px]", level(c.count))}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {["bg-muted", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"].map(
          (cls) => (
            <span key={cls} className={cn("h-3 w-3 rounded-[3px]", cls)} />
          ),
        )}
        <span>More</span>
      </div>
    </div>
  );
}
