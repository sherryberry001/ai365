import type { Metadata } from "next";
import Link from "next/link";

import { CATEGORIES, CATEGORY_KEYS } from "@/lib/constants";
import type { ContentCategory } from "@/lib/database.types";
import { getPublishedArticles } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ArticleCard } from "@/components/article-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Notes and lessons learned from working with Microsoft Copilot, Azure AI and automation.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = CATEGORY_KEYS.includes(category as ContentCategory)
    ? (category as ContentCategory)
    : undefined;
  const articles = await getPublishedArticles(active);

  return (
    <>
      <section className="border-b border-border">
        <div className="container max-w-5xl py-16 md:py-20">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Articles
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Notes from real projects. What worked, what did not, and what I
              would do differently next time.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <FilterChip href="/articles" active={!active}>
                All
              </FilterChip>
              {CATEGORY_KEYS.map((key) => (
                <FilterChip
                  key={key}
                  href={`/articles?category=${key}`}
                  active={active === key}
                >
                  {CATEGORIES[key].label}
                </FilterChip>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container max-w-5xl py-16">
        {articles.length > 0 ? (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <RevealItem key={a.id} className="h-full">
                <ArticleCard article={a} />
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
            Nothing here in this category yet.
          </div>
        )}
      </section>
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
