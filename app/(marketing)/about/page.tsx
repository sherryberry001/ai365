import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.author.name}, a consultant working with Microsoft Copilot, Azure AI and automation.`,
};

export default function AboutPage() {
  return (
    <section className="container max-w-2xl py-20 md:py-24">
      <Reveal>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">About</h1>

        <div className="prose-article mt-8">
          <p>
            I&apos;m {siteConfig.author.name}. I work as a consultant at{" "}
            {siteConfig.author.company}, mostly with Microsoft Copilot, Azure AI
            and automation. The short version of what I do: I sit with teams who
            want to use this technology and help them figure out what is worth
            doing, what can wait, and what they should leave alone for now.
          </p>
          <p>
            I got here out of curiosity more than anything. I like
            understanding how things actually work, not just what the product
            page says they do. A lot of my time goes into testing tools on real
            problems, finding where they break, and explaining the result to
            people in plain language.
          </p>

          <h2>What I&apos;ve learned</h2>
          <p>
            The technology is rarely the hard part. The hard parts are the
            boring ones. Who has access to what. Whether the data is in a state
            anyone can use. Whether people will actually change how they work.
            Most projects that struggle do not struggle because the model was
            not clever enough. They struggle because nobody did the unglamorous
            work first.
          </p>
          <p>
            So I try to be honest with customers about that. Sometimes the right
            advice is to start small, or to fix the foundation before adding
            anything new, or to not build the thing at all. That is not the most
            exciting answer, but it is usually the one that holds up a year
            later.
          </p>

          <h2>Why this site exists</h2>
          <p>
            I write here to think things through and to keep notes I can point
            people to. When I work out something useful on a project, or get a
            question often enough, it usually ends up as an article. If a piece
            saves someone a week of trial and error, it has done its job.
          </p>
          <p>
            If you are working on something similar, or you just want to argue
            about an approach, the fastest way to reach me is the{" "}
            <a href="/contact">contact page</a> or{" "}
            <a href={`mailto:${siteConfig.author.email}`}>email</a>.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
