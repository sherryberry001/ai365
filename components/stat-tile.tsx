import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
        {hint && (
          <div className={cn("mt-1 text-xs text-muted-foreground")}>{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
