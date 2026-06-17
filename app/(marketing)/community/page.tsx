import type { Metadata } from "next";
import { Github, Star } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { getGithubIdeas } from "@/lib/queries";
import { CategoryBadge } from "@/components/category-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Community and open source",
  description:
    "PowerShell scripts for Microsoft 365 and other things I build in the open.",
};

export default async function CommunityPage() {
  const ideas = await getGithubIdeas();
  const scripts = ideas.filter((i) => i.code);
  const others = ideas.filter((i) => !i.code);

  return (
    <>
      <section className="border-b border-border">
        <div className="container max-w-5xl py-16 md:py-20">
          <Reveal className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Community and open source
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              I spend time in the Microsoft community, on the Tech Community
              forums, Microsoft Learn and GitHub. I answer questions when I can,
              and I share the PowerShell scripts I write for real Microsoft 365
              work so other admins can use them.
            </p>
            <div className="mt-7 flex flex-wrap gap-4 text-sm">
              <a
                href={siteConfig.links.github}
                className="inline-flex items-center gap-2 font-medium text-primary"
              >
                <Github className="h-4 w-4" /> GitHub
              </a>
              <a
                href={siteConfig.links.techCommunity}
                className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground"
              >
                Microsoft Tech Community
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PowerShell scripts */}
      <section className="container max-w-5xl py-16">
        <Reveal className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Microsoft 365 PowerShell scripts
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Scripts I use on real tenants. Copy what you need, or grab them from
            GitHub. Read them before you run them, and test in a safe tenant
            first.
          </p>
        </Reveal>

        {scripts.length > 0 ? (
          <div className="space-y-6">
            {scripts.map((s) => (
              <Reveal key={s.id}>
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-4">
                    <div>
                      <h3 className="font-semibold">{s.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <CategoryBadge category={s.category} />
                      {s.repo_url && (
                        <a
                          href={s.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                        >
                          <Github className="h-4 w-4" /> GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  {s.filename && (
                    <div className="border-b border-border bg-slate-950 px-5 py-2 font-mono text-xs text-slate-400">
                      {s.filename}
                    </div>
                  )}
                  <pre className="max-h-96 overflow-auto bg-slate-950 p-5 font-mono text-[0.8rem] leading-relaxed text-slate-100">
                    <code>{s.code}</code>
                  </pre>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
            Scripts are on the way.
          </div>
        )}
      </section>

      {/* Other projects */}
      {others.length > 0 && (
        <section className="container max-w-5xl pb-16">
          <Reveal className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Other things I&apos;m building
            </h2>
          </Reveal>
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((idea) => (
              <RevealItem key={idea.id} className="h-full">
                <GlassCard className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={idea.category} />
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5" /> {idea.stars ?? 0}
                    </span>
                  </div>
                  <h3 className="mt-4 font-mono text-base font-semibold">
                    {idea.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {idea.description}
                  </p>
                  {idea.repo_url && (
                    <a
                      href={idea.repo_url}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                    >
                      <Github className="h-4 w-4" /> View repo
                    </a>
                  )}
                </GlassCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}
    </>
  );
}
