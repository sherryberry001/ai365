import "server-only";

import { generateText } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { generateAndStore, imageProvider } from "@/lib/ai/images";
import { CATEGORIES } from "@/lib/constants";
import type { ContentCategory } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";

/**
 * Image Agent — generates a custom image for each LinkedIn post (and any
 * in-flight article cover) that lacks one. If an image provider is configured
 * (Azure OpenAI or OpenAI) it RENDERS and stores a real PNG; otherwise it
 * falls back to creating a reviewable prompt only.
 */
export class ImageAgent extends BaseAgent {
  readonly name = "image-agent";

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    const provider = imageProvider();
    let rendered = 0;
    let prompted = 0;
    let tokens = 0;
    let lastModel = "";

    // 1. LinkedIn posts without an image
    const { data: posts } = await supabase
      .from("linkedin_posts")
      .select("id, hook, body, category")
      .is("image_prompt_id", null)
      .limit(8);

    for (const p of posts ?? []) {
      const label = CATEGORIES[p.category as ContentCategory]?.label ?? p.category;
      const prompt = `Professional, Microsoft-inspired editorial illustration for a LinkedIn post about ${label}. Theme: "${p.hook ?? p.body.slice(0, 80)}". Soft Copilot-style blue/teal/violet gradient, clean and modern, abstract, generous negative space, high quality. No text, no words, no logos.`;

      let url: string | null = null;
      if (provider) {
        try {
          url = await generateAndStore(supabase, prompt, "linkedin", "1:1");
        } catch {
          url = null;
        }
      }

      const { data: img } = await supabase
        .from("image_prompts")
        .insert({
          purpose: "linkedin_image",
          prompt,
          aspect_ratio: "1:1",
          generated_url: url,
          related_type: "linkedin_post",
          related_id: p.id,
          category: p.category,
          model: url ? provider : null,
          status: url ? "published" : "draft",
          generated_by: this.name,
        })
        .select("id")
        .single();

      if (img) {
        await supabase
          .from("linkedin_posts")
          .update({ image_prompt_id: img.id })
          .eq("id", p.id);
      }
      if (url) rendered++;
      else prompted++;
    }

    // 2. Article covers (review/approved/published) without one
    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, category, cover_prompt_id")
      .in("status", ["review", "approved", "published"])
      .is("cover_prompt_id", null)
      .limit(6);

    for (const a of articles ?? []) {
      const { text, usage, model } = await generateText({
        system: buildSystemPrompt(styleProfile),
        prompt: `Write a single image-generation prompt for the cover of this article: "${a.title}" (topic: ${a.category}). Professional, Microsoft-inspired, clean, modern, lots of negative space, NO text in the image. Return only the prompt.`,
        maxTokens: 300,
        effort: "low",
      });
      tokens += usage.inputTokens + usage.outputTokens;
      lastModel = model;

      let url: string | null = null;
      if (provider) {
        try {
          url = await generateAndStore(supabase, text.trim(), "covers", "16:9");
        } catch {
          url = null;
        }
      }

      const { data: img } = await supabase
        .from("image_prompts")
        .insert({
          purpose: "article_cover",
          prompt: text.trim(),
          aspect_ratio: "16:9",
          generated_url: url,
          related_type: "article",
          related_id: a.id,
          category: a.category,
          model: url ? provider : null,
          status: url ? "published" : "draft",
          generated_by: this.name,
        })
        .select("id")
        .single();

      if (img) {
        const patch: { cover_prompt_id: string; cover_image_url?: string } = {
          cover_prompt_id: img.id,
        };
        if (url) patch.cover_image_url = url;
        await supabase.from("articles").update(patch).eq("id", a.id);
      }
      if (url) rendered++;
      else prompted++;
    }

    const summary = provider
      ? `Rendered ${rendered} images via ${provider}${prompted ? ` (+${prompted} prompt-only fallbacks)` : ""}.`
      : `No image provider configured — created ${prompted} prompts only. Set AZURE_OPENAI_* or OPENAI_API_KEY to render real images.`;

    return {
      itemsCreated: rendered + prompted,
      summary,
      tokensUsed: tokens || undefined,
      model: lastModel || undefined,
    };
  }
}
