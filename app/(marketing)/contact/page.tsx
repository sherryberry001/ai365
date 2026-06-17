import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${siteConfig.author.name} about Microsoft Copilot, Azure AI and automation.`,
};

export default function ContactPage() {
  return (
    <section className="container max-w-5xl py-20">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
            Working on something with Copilot, Azure AI or automation, or just
            want a second opinion? Send me a note. I read everything and reply
            when I can.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <a
              href={`mailto:${siteConfig.author.email}`}
              className="flex items-center gap-3 text-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              {siteConfig.author.email}
            </a>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {siteConfig.author.company}, Sweden
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-xl border border-border bg-card p-7 md:p-8">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
