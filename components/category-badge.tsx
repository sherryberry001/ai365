import { CATEGORIES } from "@/lib/constants";
import type { ContentCategory } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  category,
  className,
}: {
  category: ContentCategory;
  className?: string;
}) {
  const meta = CATEGORIES[category];
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
