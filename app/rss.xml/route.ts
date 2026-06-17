import { siteConfig } from "@/lib/site";
import { getPublishedArticles } from "@/lib/queries";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

export const revalidate = 600;

export async function GET() {
  const articles = await getPublishedArticles();
  const base = siteConfig.url;

  const items = articles
    .map((a) => {
      const link = `${base}/articles/${a.slug}`;
      const date = a.published_at
        ? new Date(a.published_at).toUTCString()
        : new Date(a.created_at).toUTCString();
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(a.excerpt ?? a.subtitle ?? "")}</description>
      <category>${escapeXml(a.category)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} Articles</title>
    <link>${base}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en-gb</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}
