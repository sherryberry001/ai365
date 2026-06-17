import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Build a Metadata object for a sub-page with sensible OG/Twitter defaults.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const desc = description ?? siteConfig.description;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title,
      description: desc,
      siteName: siteConfig.name,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
  };
}

/** schema.org Person — used for the homepage / about page. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.owner.name,
    jobTitle: siteConfig.owner.role,
    worksFor: { "@type": "Organization", name: siteConfig.owner.company },
    url: siteConfig.url,
    email: siteConfig.owner.email,
    sameAs: [siteConfig.links.linkedin, siteConfig.links.github],
    knowsAbout: [
      "Microsoft Copilot",
      "Azure AI",
      "AI Agents",
      "Microsoft 365",
      "AI Governance",
      "Automation",
    ],
  };
}

/** schema.org WebSite — enables sitelinks search box etc. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };
}
