import "server-only";

import { BaseAgent } from "@/lib/agents/base";
import { ContentAgent } from "@/lib/agents/content-agent";
import { ArticleAgent } from "@/lib/agents/article-agent";
import { CommentAgent } from "@/lib/agents/comment-agent";
import { CommunityAgent } from "@/lib/agents/community-agent";
import { ImageAgent } from "@/lib/agents/image-agent";
import { MvpAgent } from "@/lib/agents/mvp-agent";
import { AnalyticsAgent } from "@/lib/agents/analytics-agent";
import { PersonalBrandAgent } from "@/lib/agents/personal-brand-agent";
import { GithubScriptAgent } from "@/lib/agents/github-script-agent";

export {
  ContentAgent,
  ArticleAgent,
  CommentAgent,
  CommunityAgent,
  ImageAgent,
  MvpAgent,
  AnalyticsAgent,
  PersonalBrandAgent,
  GithubScriptAgent,
};

/** The catalog shown on the Automation dashboard. */
export const AGENT_CATALOG: {
  key: string;
  label: string;
  description: string;
  make: () => BaseAgent;
}[] = [
  {
    key: "content",
    label: "Content Agent",
    description: "Drafts LinkedIn posts, article ideas, and image prompts.",
    make: () => new ContentAgent(),
  },
  {
    key: "article",
    label: "Article Agent",
    description: "Expands ideas into full long-form articles (in review).",
    make: () => new ArticleAgent(),
  },
  {
    key: "comment",
    label: "Comment Agent",
    description: "Drafts thoughtful comments for Microsoft/Azure/Copilot posts.",
    make: () => new CommentAgent(),
  },
  {
    key: "community",
    label: "Community Agent",
    description: "Drafts answers for Learn / Tech Community / Azure / GitHub.",
    make: () => new CommunityAgent(),
  },
  {
    key: "image",
    label: "Image Agent",
    description: "Creates cover-image prompts for in-flight articles.",
    make: () => new ImageAgent(),
  },
  {
    key: "mvp",
    label: "MVP Agent",
    description: "Generates GitHub ideas and reconciles the MVP log.",
    make: () => new MvpAgent(),
  },
  {
    key: "github-scripts",
    label: "PowerShell Script Agent",
    description: "Writes Microsoft 365 PowerShell scripts, shows them on Community, pushes to GitHub.",
    make: () => new GithubScriptAgent(),
  },
  {
    key: "analytics",
    label: "Analytics Agent",
    description: "Snapshots growth metrics for the analytics dashboard.",
    make: () => new AnalyticsAgent(),
  },
  {
    key: "personal-brand",
    label: "Personal Brand Agent",
    description: "Learns your voice from approved content; updates the style profile.",
    make: () => new PersonalBrandAgent(),
  },
];

export function makeAgent(key: string): BaseAgent | null {
  return AGENT_CATALOG.find((a) => a.key === key)?.make() ?? null;
}
