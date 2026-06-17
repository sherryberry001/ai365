import type {
  ContentCategory,
  ContentStatus,
  PublishChannel,
} from "@/lib/database.types";

// ----------------------------------------------------------------------------
// Categories — the topic taxonomy used across the whole platform.
// `badge` maps to a Tailwind class set for consistent coloring.
// ----------------------------------------------------------------------------
export const CATEGORIES: Record<
  ContentCategory,
  { label: string; description: string; badge: string }
> = {
  copilot: {
    label: "Copilot",
    description: "Microsoft 365 Copilot, Copilot Studio, adoption.",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  azure_ai: {
    label: "Azure AI",
    description: "Azure AI Foundry, models, architecture.",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  ai_agents: {
    label: "AI Agents",
    description: "Autonomous and assistive agents in the Microsoft stack.",
    badge:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  },
  governance: {
    label: "Governance",
    description: "Security, compliance and responsible AI.",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  automation: {
    label: "Automation",
    description: "Power Automate, Logic Apps, workflow automation.",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  microsoft_365: {
    label: "Microsoft 365",
    description: "M365 platform, Graph, productivity.",
    badge:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  },
  digital_transformation: {
    label: "Digital Transformation",
    description: "Adoption, change management and strategy.",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as ContentCategory[];

// ----------------------------------------------------------------------------
// Content lifecycle
// ----------------------------------------------------------------------------
export const STATUS_META: Record<
  ContentStatus,
  { label: string; badge: string; order: number }
> = {
  idea: { label: "Idea", order: 0, badge: "bg-slate-100 text-slate-700" },
  draft: { label: "Draft", order: 1, badge: "bg-zinc-100 text-zinc-700" },
  review: { label: "In review", order: 2, badge: "bg-amber-100 text-amber-800" },
  approved: {
    label: "Approved",
    order: 3,
    badge: "bg-emerald-100 text-emerald-800",
  },
  published: {
    label: "Published",
    order: 4,
    badge: "bg-blue-100 text-blue-800",
  },
  archived: {
    label: "Archived",
    order: 5,
    badge: "bg-neutral-100 text-neutral-500",
  },
};

export const CHANNELS: Record<PublishChannel, { label: string }> = {
  website: { label: "Website" },
  linkedin: { label: "LinkedIn" },
  microsoft_tech_community: { label: "MS Tech Community" },
  microsoft_learn: { label: "Microsoft Learn" },
  azure_community: { label: "Azure Community" },
  github_discussions: { label: "GitHub Discussions" },
  newsletter: { label: "Newsletter" },
};

/** Which automation toggle key gates each channel. */
export const CHANNEL_AUTOPUBLISH_KEY: Partial<
  Record<PublishChannel, string>
> = {
  website: "auto_publish_website",
  linkedin: "auto_publish_linkedin",
  microsoft_tech_community: "auto_publish_community",
  microsoft_learn: "auto_publish_community",
  azure_community: "auto_publish_community",
  github_discussions: "auto_publish_github",
};
