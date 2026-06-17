import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import type { ArticleRow } from "@/lib/database.types";
import { formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { GlassCard } from "@/components/ui/glass-card";

export function ArticleCard({ article }: { article: ArticleRow }) {
  return (
    <Link href={`/articles/${article.slug}`} className="group block h-full">
      <GlassCard className="flex h-full flex-col overflow-hidden p-0">
        {article.cover_image_url && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={article.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={article.category} />
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {article.excerpt ?? article.subtitle}
        </p>
        <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span>{formatDate(article.published_at)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.reading_minutes ?? 5} min
          </span>
        </div>
        </div>
      </GlassCard>
    </Link>
  );
}
