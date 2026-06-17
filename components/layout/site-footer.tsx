import Link from "next/link";
import { Github, Linkedin, Rss } from "lucide-react";

import { mainNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container grid grid-cols-1 gap-10 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            AI365
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Where I write about working with Microsoft Copilot, Azure AI and
            automation. Notes, lessons learned, and the occasional opinion.
          </p>
          <p className="text-sm text-muted-foreground">
            By {siteConfig.author.name}, {siteConfig.author.role}.
          </p>
        </div>

        <FooterCol title="Pages" links={mainNav.map((n) => [n.title, n.href])} />
        <FooterCol
          title="Elsewhere"
          links={[
            ["LinkedIn", siteConfig.links.linkedin],
            ["GitHub", siteConfig.links.github],
            ["Tech Community", siteConfig.links.techCommunity],
          ]}
        />
        <FooterCol
          title="Follow"
          links={[
            ["RSS", "/rss.xml"],
            ["Sitemap", "/sitemap.xml"],
          ]}
        />
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {siteConfig.author.name}
          </span>
          <div className="flex items-center gap-4">
            <a href={siteConfig.links.linkedin} aria-label="LinkedIn" className="hover:text-foreground">
              <Linkedin className="h-4 w-4" />
            </a>
            <a href={siteConfig.links.github} aria-label="GitHub" className="hover:text-foreground">
              <Github className="h-4 w-4" />
            </a>
            <Link href="/rss.xml" aria-label="RSS" className="hover:text-foreground">
              <Rss className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-medium">{title}</div>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            {href.startsWith("/") ? (
              <Link href={href} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            ) : (
              <a href={href} className="transition-colors hover:text-foreground">
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
