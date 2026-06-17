import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { ContentCategory } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { githubIdeasSchema } from "@/lib/agents/schemas";

interface GithubIdeas {
  ideas: {
    title: string;
    description: string;
    idea_type: string;
    category: ContentCategory;
  }[];
}

/**
 * MVP Agent — feeds the MVP portfolio. Generates GitHub open-source project
 * ideas and reconciles the MVP activity log so every published artifact is
 * counted as a contribution.
 */
export class MvpAgent extends BaseAgent {
  readonly name = "mvp-agent";

  constructor(private opts: { ideas?: number } = {}) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    let created = 0;
    let tokens = 0;
    let lastModel = "";

    // 1. GitHub project ideas
    const ideaCount = this.opts.ideas ?? 5;
    const { data, usage, model } = await generateJSON<GithubIdeas>({
      system: buildSystemPrompt(styleProfile),
      prompt: `Generate ${ideaCount} concrete, buildable open-source GitHub project ideas that would strengthen a Microsoft MVP portfolio. Mix of Copilot prompt libraries, AI agent templates, Azure templates, sample apps, and learning resources. Each: a crisp repo-style title, a 1-2 sentence description of what it does and who it helps, an idea_type, and a category.`,
      schema: githubIdeasSchema as unknown as Record<string, unknown>,
      maxTokens: 4000,
    });
    tokens += usage.inputTokens + usage.outputTokens;
    lastModel = model;

    for (const idea of data.ideas) {
      await supabase.from("github_ideas").insert({
        title: idea.title,
        description: idea.description,
        idea_type: idea.idea_type,
        category: idea.category,
        status: "idea",
        generated_by: this.name,
      });
      created++;
    }

    // 2. Reconcile MVP activity log for published articles not yet counted
    const { data: published } = await supabase
      .from("articles")
      .select("id, title, category, published_at")
      .eq("status", "published");

    const { data: logged } = await supabase
      .from("mvp_activities")
      .select("source_id")
      .eq("source_type", "article");
    const loggedIds = new Set((logged ?? []).map((l) => l.source_id));

    for (const art of published ?? []) {
      if (loggedIds.has(art.id)) continue;
      await supabase.from("mvp_activities").insert({
        activity_type: "article",
        title: art.title,
        category: art.category,
        platform: "website",
        impact: "Published long-form article",
        activity_date: (art.published_at ?? new Date().toISOString()).slice(0, 10),
        source_type: "article",
        source_id: art.id,
      });
      created++;
    }

    return {
      itemsCreated: created,
      summary: `Added ${data.ideas.length} GitHub ideas and reconciled the MVP activity log.`,
      tokensUsed: tokens,
      model: lastModel,
    };
  }
}
