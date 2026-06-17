import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";

import { getPublishedResources } from "@/lib/queries";
import { formatDate } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides, checklists and templates I use on Microsoft Copilot, Azure AI and automation projects.",
};

export default async function ResourcesPage() {
  const resources = await getPublishedResources();

  return (
    <>
      <section className="border-b border-border">
        <div className="container max-w-5xl py-16 md:py-20">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Resources
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Checklists, guides and templates I have put together on real
              projects. The kind of thing I wish I had the first time around.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container max-w-5xl py-16">
        {resources.length > 0 ? (
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <RevealItem key={r.id} className="h-full">
                <GlassCard className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={r.category} />
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" /> {r.resource_type}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.published_at)}
                    </span>
                    {r.file_url ? (
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </div>
                </GlassCard>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
            Nothing to download yet. I add things here as projects produce them.
          </div>
        )}
      </section>
    </>
  );
}
