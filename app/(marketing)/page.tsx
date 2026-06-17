import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Cloud,
  Network,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Workflow,
} from "lucide-react";

import { siteConfig } from "@/lib/site";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/constants";
import type { ContentCategory } from "@/lib/database.types";
import { getPublishedArticles } from "@/lib/queries";
import { ArticleCard } from "@/components/article-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

const CATEGORY_ICONS: Record<ContentCategory, React.ElementType> = {
  copilot: Bot,
  azure_ai: Cloud,
  ai_agents: Network,
  governance: ShieldCheck,
  automation: RefreshCw,
  microsoft_365: Workflow,
  digital_transformation: TrendingUp,
};

export default async function HomePage() {
  const articles = await getPublishedArticles();
  const latest = articles.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container max-w-4xl py-24 md:py-32">
          <Reveal>
            <p className="text-sm font-medium text-muted-foreground">
              Microsoft Copilot, Azure AI and automation
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl">
              I help organizations get real value from Microsoft Copilot, AI and
              automation.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              I&apos;m {siteConfig.author.name}, a consultant at{" "}
              {siteConfig.author.company}. I spend most of my time helping teams
              figure out where this technology actually helps, and where it
              probably won&apos;t. This is where I write down what I learn along
              the way.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/articles"
                className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Read the articles
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                More about me
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What I work on */}
      <section className="container max-w-5xl py-20">
        <Reveal className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            What I work on
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Most of my projects sit somewhere in these areas. Usually a few of
            them at once.
          </p>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_KEYS.map((key) => {
            const Icon = CATEGORY_ICONS[key];
            return (
              <RevealItem key={key}>
                <Link
                  href={`/articles?category=${key}`}
                  className="flex h-full flex-col gap-3 bg-background p-6 transition-colors hover:bg-secondary/40"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{CATEGORIES[key].label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {CATEGORIES[key].description}
                  </p>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      {/* Recent writing */}
      <section className="border-t border-border bg-secondary/30">
        <div className="container max-w-5xl py-20">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Recent writing
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Notes from real projects. The trade-offs, the mistakes, and what
                I would do differently.
              </p>
            </div>
            <Link
              href="/articles"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              All articles
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          {latest.length > 0 ? (
            <RevealGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {latest.map((a) => (
                <RevealItem key={a.id} className="h-full">
                  <ArticleCard article={a} />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <p className="text-muted-foreground">New writing is on the way.</p>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="container max-w-5xl py-24">
        <Reveal>
          <div className="rounded-xl border border-border p-10 md:p-14">
            <h2 className="max-w-xl text-2xl font-bold tracking-tight md:text-3xl">
              Working on something with Microsoft AI or automation?
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              If you are dealing with the same questions I write about here, I am
              always happy to compare notes. No pitch, just a conversation.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get in touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
