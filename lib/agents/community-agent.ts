import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { ContentCategory, PublishChannel } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { communityBatchSchema } from "@/lib/agents/schemas";

interface CommunityBatch {
  answers: {
    platform: PublishChannel;
    question_title: string;
    answer_text: string;
    doc_references: string[];
    follow_up_question: string;
    category: ContentCategory;
  }[];
}

/**
 * Community Agent — drafts answers for Microsoft Learn, Tech Community, Azure
 * forums and GitHub Discussions. Answers solve the problem, reference docs,
 * include a practical example, and end with a follow-up question.
 */
export class CommunityAgent extends BaseAgent {
  readonly name = "community-agent";

  constructor(private opts: { count?: number } = {}) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    const count = this.opts.count ?? 5;

    const prompt = `Draft ${count} community answers for realistic questions people actually ask across Microsoft Learn, Microsoft Tech Community, Azure community, and GitHub Discussions.

For each: invent a plausible, specific question title; pick the platform; write an answer that genuinely solves the problem, references relevant Microsoft documentation (real doc area URLs like https://learn.microsoft.com/...), includes a concrete step or example, and ends with a follow-up question. Tag a category.`;

    const { data, usage, model } = await generateJSON<CommunityBatch>({
      system: buildSystemPrompt(styleProfile),
      prompt,
      schema: communityBatchSchema as unknown as Record<string, unknown>,
      maxTokens: 7000,
    });

    for (const a of data.answers) {
      await supabase.from("community_answers").insert({
        platform: a.platform,
        question_title: a.question_title,
        answer_text: a.answer_text,
        doc_references: a.doc_references,
        follow_up_question: a.follow_up_question,
        category: a.category,
        status: "draft",
        generated_by: this.name,
        source_model: model,
      });
    }

    return {
      itemsCreated: data.answers.length,
      summary: `Drafted ${data.answers.length} community answers.`,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      model,
    };
  }
}
