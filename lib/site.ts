/**
 * Central site configuration. AI365 is the brand; Shehryar Hassan is the
 * author/person behind it (publication byline model).
 */
const author = {
  name: process.env.NEXT_PUBLIC_OWNER_NAME ?? "Shehryar Hassan",
  email: process.env.NEXT_PUBLIC_OWNER_EMAIL ?? "Shehryar.hassan@dizparc.se",
  company: "Dizparc",
  role: "Microsoft AI & Copilot Consultant",
};

export const siteConfig = {
  name: "AI365",
  shortName: "AI365",
  tagline:
    "Practical notes on Microsoft Copilot, Azure AI and automation, from real projects.",
  title: "AI365 · Microsoft Copilot, Azure AI and automation",
  description:
    "AI365 is where Shehryar Hassan shares practical notes on Microsoft Copilot, Azure AI and automation, written from real customer projects.",
  author,
  // `owner` kept as an alias so existing references keep working.
  owner: author,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  links: {
    linkedin: "https://se.linkedin.com/in/it-konsult",
    github: "https://github.com/sherryberry001",
    techCommunity: "https://techcommunity.microsoft.com/users/sherryberry/3549563",
  },
  // Long-term MVP portfolio targets (shown on the MVP Journey page).
  goals: {
    articles: 100,
    comments: 500,
    communityAnswers: 1000,
    githubResources: 20,
  },
} as const;

/** Public navigation. (MVP tracking is private — admin only.) */
export const mainNav = [
  { title: "Articles", href: "/articles" },
  { title: "Resources", href: "/resources" },
  { title: "Community", href: "/community" },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
] as const;

/** Admin navigation. */
export const adminNav = [
  { title: "Overview", href: "/admin" },
  { title: "Content", href: "/admin/content" },
  { title: "Approvals", href: "/admin/approvals" },
  { title: "Automation", href: "/admin/automation" },
  { title: "MVP", href: "/admin/mvp" },
  { title: "Analytics", href: "/admin/analytics" },
  { title: "Settings", href: "/admin/settings" },
] as const;
