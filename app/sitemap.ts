import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";
import { getPublishedArticles, getPublishedResources } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes = [
    "",
    "/articles",
    "/resources",
    "/community",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const [articles, resources] = await Promise.all([
    getPublishedArticles(),
    getPublishedResources(),
  ]);

  const articleRoutes = articles.map((a) => ({
    url: `${base}/articles/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const resourceRoutes = resources.map((r) => ({
    url: `${base}/resources#${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes, ...resourceRoutes];
}
