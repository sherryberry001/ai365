import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { slugify } from "@/lib/utils";
import type { ContentCategory } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { contentBatchSchema } from "@/lib/agents/schemas";

interface ContentBatch {
  linkedin_posts: {
    hook: string;
    body: string;
    hashtags: string[];
    category: ContentCategory;
    reason: string;
    mvp_impact: string;
  }[];
  article_ideas: {
    title: string;
    angle: string;
    excerpt: string;
    category: ContentCategory;
  }[];
  image_prompts: {
    purpose: string;
    prompt: string;
    aspect_ratio: string;
    category: ContentCategory;
  }[];
}

/**
 * Content Agent. Drafts LinkedIn posts, article ideas and image prompts about
 * Microsoft Copilot, Azure AI and automation. LinkedIn drafts also get an
 * approval-queue entry.
 */
export class ContentAgent extends BaseAgent {
  readonly name = "content-agent";

  constructor(
    private opts: { posts?: number; ideas?: number; images?: number } = {},
  ) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    const posts = this.opts.posts ?? 3;
    const ideas = this.opts.ideas ?? 5;
    const images = this.opts.images ?? 5;

    const prompt = `Generate a fresh batch of content about Microsoft Copilot, Azure AI and automation for today.

Produce exactly:
- ${posts} LinkedIn post drafts. Each: a scroll-stopping hook, a short body (under 1300 chars) that teaches one concrete thing, 2-4 relevant hashtags, the topic category, a one-line reason why it matters, and an MVP impact note.
- ${ideas} article ideas. Each: a specific title, a one-line angle, a 1-2 sentence excerpt, and a category.
- ${images} image prompts for article covers or LinkedIn visuals. Each: purpose, a detailed prompt (professional, Microsoft-inspired, clean, modern, no text in image), aspect ratio (e.g. 16:9 or 1:1), and a category.

Spread across the focus areas. Ground everything in real, current Microsoft AI topics (Copilot, Azure AI Foundry, agents, governance, automation). Vary angles so nothing feels templated.`;

    const { data, usage, model } = await generateJSON<ContentBatch>({
      system: buildSystemPrompt(styleProfile),
      prompt,
      schema: contentBatchSchema as unknown as Record<string, unknown>,
      maxTokens: 8000,
    });

    let created = 0;

    // LinkedIn posts → drafts + approval-queue entries
    for (const p of data.linkedin_posts) {
      const { data: post } = await supabase
        .from("linkedin_posts")
        .insert({
          hook: p.hook,
          body: p.body,
          hashtags: p.hashtags,
          category: p.category,
          status: "draft",
          reason: p.reason,
          mvp_impact: p.mvp_impact,
          generated_by: this.name,
          source_model: model,
        })
        .select("id")
        .single();
      created++;

      if (post) {
        await supabase.from("approvals").insert({
          content_type: "linkedin_post",
          content_id: post.id,
          channel: "linkedin",
          status: "pending",
          title: p.hook,
          preview: p.body.slice(0, 280),
          reason: p.reason,
          mvp_impact_category: p.category,
          submitted_by: this.name,
          suggested_hashtags: p.hashtags,
        });
      }
    }

    // Article ideas → articles in `idea` status
    for (const idea of data.article_ideas) {
      await supabase.from("articles").insert({
        slug: `${slugify(idea.title)}-${Math.floor(Math.random() * 10000)}`,
        title: idea.title,
        subtitle: idea.angle,
        excerpt: idea.excerpt,
        category: idea.category,
        status: "idea",
        generated_by: this.name,
        source_model: model,
      });
      created++;
    }

    // Image prompts → drafts
    for (const img of data.image_prompts) {
      await supabase.from("image_prompts").insert({
        purpose: img.purpose,
        prompt: img.prompt,
        aspect_ratio: img.aspect_ratio,
        category: img.category,
        status: "draft",
        generated_by: this.name,
      });
      created++;
    }

    return {
      itemsCreated: created,
      summary: `Drafted ${data.linkedin_posts.length} LinkedIn posts, ${data.article_ideas.length} article ideas, ${data.image_prompts.length} image prompts.`,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      model,
    };
  }
}
