import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { styleProfileSchema } from "@/lib/agents/schemas";

interface StyleProfile {
  voice: string;
  perspective: string;
  sentence_style: string;
  do: string[];
  avoid: string[];
  topics: string[];
}

/**
 * Personal Brand Agent — learns the writing voice from approved/published work
 * and writes an updated, versioned style profile that every other agent then
 * uses. This is the system getting better at sounding like the owner.
 */
export class PersonalBrandAgent extends BaseAgent {
  readonly name = "personal-brand-agent";

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;

    // Gather approved/published samples across content types.
    const [articles, posts, comments] = await Promise.all([
      supabase
        .from("articles")
        .select("body_mdx")
        .in("status", ["approved", "published"])
        .limit(8),
      supabase
        .from("linkedin_posts")
        .select("body")
        .in("status", ["approved", "published"])
        .limit(15),
      supabase
        .from("linkedin_comments")
        .select("comment_text")
        .in("status", ["approved", "published"])
        .limit(20),
    ]);

    const samples = [
      ...(articles.data ?? []).map((a) => a.body_mdx).filter(Boolean),
      ...(posts.data ?? []).map((p) => p.body).filter(Boolean),
      ...(comments.data ?? []).map((c) => c.comment_text).filter(Boolean),
    ] as string[];

    if (samples.length < 3) {
      return {
        itemsCreated: 0,
        summary: `Not enough approved content to learn from yet (${samples.length} samples). Approve more content first.`,
      };
    }

    const corpus = samples.join("\n\n---\n\n").slice(0, 30000);
    const { data, usage, model } = await generateJSON<StyleProfile>({
      system: buildSystemPrompt(styleProfile),
      prompt: `Below are samples of the owner's APPROVED writing. Analyze them and produce a concise style profile that future drafts should match.

Capture: voice, perspective, sentence_style, a list of things to "do", a list of things to "avoid", and the dominant topics. Base everything on patterns you actually see in the samples.

SAMPLES:
${corpus}`,
      schema: styleProfileSchema as unknown as Record<string, unknown>,
      maxTokens: 3000,
      effort: "high",
    });

    const nextVersion = (styleProfile?.version ?? 0) + 1;

    // Deactivate the current active profile, then write the new one.
    await supabase
      .from("style_profiles")
      .update({ is_active: false })
      .eq("is_active", true);

    await supabase.from("style_profiles").insert({
      name: "default",
      profile: data as unknown as Record<string, unknown>,
      sample_count: samples.length,
      version: nextVersion,
      is_active: true,
    });

    return {
      itemsCreated: 1,
      summary: `Updated style profile to v${nextVersion} from ${samples.length} approved samples.`,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      model,
    };
  }
}
