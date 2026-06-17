import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { ContentCategory } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { articleSchema } from "@/lib/agents/schemas";

interface FullArticle {
  title: string;
  subtitle: string;
  excerpt: string;
  body_mdx: string;
  tags: string[];
  reading_minutes: number;
  seo_title: string;
  seo_description: string;
  og_title: string;
  og_description: string;
  cover_image_prompt: string;
  linkedin_version: string;
  newsletter_version: string;
  community_version: string;
}

/**
 * Article Agent — the weekly long-form engine. Takes article ideas sitting in
 * `idea` status and writes them into full, SEO-complete articles in `review`,
 * with derivative LinkedIn / newsletter / community versions, a cover image
 * prompt, and a website approval-queue entry.
 */
export class ArticleAgent extends BaseAgent {
  readonly name = "content-agent";

  constructor(private opts: { count?: number } = {}) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    // Default to one article per call so a single request stays within
    // serverless time limits (the scheduler calls this endpoint directly).
    const count = this.opts.count ?? 1;

    const { data: ideas } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "idea")
      .order("created_at", { ascending: true })
      .limit(count);

    if (!ideas || ideas.length === 0) {
      return { itemsCreated: 0, summary: "No article ideas in the backlog to expand." };
    }

    let created = 0;
    let tokens = 0;
    let lastModel = "";

    // When the website auto-publish toggle is on, articles go straight live
    // instead of waiting in the approval queue.
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_publish_website")
      .maybeSingle();
    const autoPublish = setting?.value === true;
    const nowIso = new Date().toISOString();

    for (const idea of ideas) {
      const prompt = `Write a complete, consultant-level long-form article.

Working title: "${idea.title}"
Angle: ${idea.subtitle ?? idea.excerpt ?? ""}
Category: ${idea.category}

Requirements:
- body_mdx: 800-1400 words of Markdown. Open with a real scenario or sharp observation. Use ## / ### headings, concrete examples, and at least one trade-off or "what didn't work". End with a takeaway or question. No "In conclusion".
- Provide SEO title/description, Open Graph title/description, a cover image prompt (professional, Microsoft-inspired, no text), reading_minutes (integer), 3-6 tags.
- Provide a LinkedIn version (under 1300 chars), a newsletter version (warmer, ~250 words), and a short community discussion version.`;

      const { data, usage, model } = await generateJSON<FullArticle>({
        system: buildSystemPrompt(styleProfile),
        prompt,
        schema: articleSchema as unknown as Record<string, unknown>,
        maxTokens: 12000,
        effort: "high",
      });
      tokens += usage.inputTokens + usage.outputTokens;
      lastModel = model;

      // Cover image prompt
      const { data: imagePrompt } = await supabase
        .from("image_prompts")
        .insert({
          purpose: "article_cover",
          prompt: data.cover_image_prompt,
          aspect_ratio: "16:9",
          category: idea.category as ContentCategory,
          related_type: "article",
          related_id: idea.id,
          status: "draft",
          generated_by: this.name,
        })
        .select("id")
        .single();

      // Expand the idea into a full article (now in review)
      await supabase
        .from("articles")
        .update({
          title: data.title,
          subtitle: data.subtitle,
          excerpt: data.excerpt,
          body_mdx: data.body_mdx,
          tags: data.tags,
          reading_minutes: data.reading_minutes,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          og_title: data.og_title,
          og_description: data.og_description,
          linkedin_version: data.linkedin_version,
          newsletter_version: data.newsletter_version,
          community_version: data.community_version,
          cover_prompt_id: imagePrompt?.id ?? null,
          status: autoPublish ? "published" : "review",
          published_at: autoPublish ? nowIso : null,
          source_model: model,
        })
        .eq("id", idea.id);

      // Versioned draft snapshot
      await supabase.from("article_drafts").insert({
        article_id: idea.id,
        version: 1,
        title: data.title,
        body_mdx: data.body_mdx,
        prompt,
        generated_by: this.name,
        source_model: model,
      });

      if (autoPublish) {
        // Published straight to the site: log the MVP activity, no approval.
        await supabase.from("mvp_activities").insert({
          activity_type: "article",
          title: data.title,
          category: idea.category as ContentCategory,
          platform: "website",
          topic: data.subtitle,
          impact: "Published long-form article",
          impact_score: 7,
          activity_date: nowIso.slice(0, 10),
          source_type: "article",
          source_id: idea.id,
        });
      } else {
        // Route through the approval queue.
        await supabase.from("approvals").insert({
          content_type: "article",
          content_id: idea.id,
          channel: "website",
          status: "pending",
          title: data.title,
          preview: data.excerpt,
          reason: `Long-form article on ${idea.category}`,
          mvp_impact_category: idea.category as ContentCategory,
          submitted_by: this.name,
        });
      }

      created++;
    }

    return {
      itemsCreated: created,
      summary: autoPublish
        ? `Wrote and published ${created} article${created === 1 ? "" : "s"} to the site.`
        : `Wrote ${created} full article${created === 1 ? "" : "s"} (in review, website approvals queued).`,
      tokensUsed: tokens,
      model: lastModel,
    };
  }
}
