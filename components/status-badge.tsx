import { STATUS_META } from "@/lib/constants";
import type { ContentStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.badge,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
