import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { ContentCategory } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { commentBatchSchema } from "@/lib/agents/schemas";

interface CommentBatch {
  comments: {
    target_author: string;
    target_summary: string;
    comment_text: string;
    insight_type: "insight" | "question" | "experience";
    category: ContentCategory;
  }[];
}

/**
 * Comment Agent — drafts thoughtful comments for Microsoft / Azure / Copilot
 * posts. Every comment must add insight, ask a smart question, or share real
 * experience. Never empty praise.
 */
export class CommentAgent extends BaseAgent {
  readonly name = "comment-agent";

  constructor(private opts: { count?: number } = {}) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    const count = this.opts.count ?? 10;

    const prompt = `Draft ${count} LinkedIn comments for posts from Microsoft, Azure, Copilot teams, and Microsoft executives.

For each, invent a realistic target: the author (e.g. "Microsoft", "Satya Nadella", "Azure") and a one-line summary of what their post was about (a plausible recent announcement). Then write the comment.

Each comment must add insight, ask a smart question, or share real experience — and encourage discussion. NEVER write "Great post", "Amazing", or empty praise. Keep each to 2-4 sentences. Mark each as insight, question, or experience, and tag a category.`;

    const { data, usage, model } = await generateJSON<CommentBatch>({
      system: buildSystemPrompt(styleProfile),
      prompt,
      schema: commentBatchSchema as unknown as Record<string, unknown>,
      maxTokens: 6000,
    });

    for (const c of data.comments) {
      await supabase.from("linkedin_comments").insert({
        target_author: c.target_author,
        target_summary: c.target_summary,
        comment_text: c.comment_text,
        insight_type: c.insight_type,
        category: c.category,
        status: "draft",
        generated_by: this.name,
        source_model: model,
      });
    }

    return {
      itemsCreated: data.comments.length,
      summary: `Drafted ${data.comments.length} LinkedIn comments.`,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      model,
    };
  }
}
