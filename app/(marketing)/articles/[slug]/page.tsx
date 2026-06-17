import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { getArticleBySlug, getPublishedArticles } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 600; // ISR — refresh published articles every 10 min

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };

  const title = article.seo_title ?? article.title;
  const description =
    article.seo_description ?? article.excerpt ?? siteConfig.description;
  const url = `${siteConfig.url}/articles/${article.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.og_title ?? title,
      description: article.og_description ?? description,
      publishedTime: article.published_at ?? undefined,
      images: article.og_image_url
        ? [{ url: article.og_image_url }]
        : article.cover_image_url
          ? [{ url: article.cover_image_url }]
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.og_title ?? title,
      description: article.og_description ?? description,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const url = `${siteConfig.url}/articles/${article.slug}`;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt ?? article.seo_description,
          datePublished: article.published_at,
          dateModified: article.updated_at,
          author: {
            "@type": "Person",
            name: siteConfig.author.name,
            url: siteConfig.links.linkedin,
          },
          publisher: { "@type": "Organization", name: siteConfig.name },
          mainEntityOfPage: url,
          image: article.cover_image_url ?? undefined,
        }}
      />

      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-3xl py-14 md:py-16">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <CategoryBadge category={article.category} />
            <span className="text-sm text-muted-foreground">
              {formatDate(article.published_at)} · {article.reading_minutes ?? 5}{" "}
              min read
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {article.subtitle}
            </p>
          )}

          <p className="mt-7 text-sm text-muted-foreground">
            By {siteConfig.author.name}, {siteConfig.author.role}
          </p>
        </div>
      </header>

      {/* Cover */}
      {article.cover_image_url && (
        <div className="container max-w-3xl pt-10">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/60 fluent-shadow">
            <Image
              src={article.cover_image_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="container max-w-3xl py-12 md:py-16">
        <div className="prose-article">
          {article.body_mdx ? (
            <MDXRemote source={article.body_mdx} />
          ) : (
            <p className="text-muted-foreground">This article has no body yet.</p>
          )}
        </div>

        {article.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-border/60 pt-6">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
