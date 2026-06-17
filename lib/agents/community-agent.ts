import "server-only";

import { generateJSONWithSearch } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import type { ContentCategory, PublishChannel } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";

interface CommunityBatch {
  answers: {
    platform: PublishChannel;
    question_title: string;
    question_url: string;
    answer_text: string;
    doc_references: string[];
    follow_up_question: string;
    category: ContentCategory;
  }[];
}

/** A question link is usable if it actually resolves (not 404/410). */
async function linkResolves(url: string): Promise<boolean> {
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
      headers: { "User-Agent": "Mozilla/5.0 (AI365 link check)" },
    });
    return res.status !== 404 && res.status !== 410;
  } catch {
    return false;
  }
}

/**
 * Community Agent. Uses web search to find REAL, current Microsoft Tech
 * Community / Microsoft Q&A questions, drafts a practical consultant answer
 * for each, and stores it with the real question URL (verified to resolve) so
 * it can be opened and pasted manually.
 */
export class CommunityAgent extends BaseAgent {
  readonly name = "community-agent";

  constructor(private opts: { count?: number } = {}) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    const count = this.opts.count ?? 5;

    const prompt = `Use web search to find up to ${count} real, recent questions on Microsoft Tech Community (techcommunity.microsoft.com) or Microsoft Q&A (learn.microsoft.com/answers) about Microsoft Copilot, Azure AI, AI agents, governance, automation or Microsoft 365 that you could genuinely help with.

For each, write a helpful, practical answer the way a consultant would explain it to a customer.

Return ONLY a JSON object, no other text, of exactly this shape:
{"answers":[{"platform":"microsoft_tech_community" or "microsoft_learn","question_title":"the real title","question_url":"the exact real URL from the search result","answer_text":"your answer","doc_references":["real learn.microsoft.com urls"],"follow_up_question":"one follow up question","category":"copilot" or "azure_ai" or "ai_agents" or "governance" or "automation" or "microsoft_365" or "digital_transformation"}]}

Critical: question_url MUST be a real URL you actually found in search results. Never invent or guess a URL. If you cannot find enough real questions, return fewer. Do not use em dashes or en dashes.`;

    const { data, usage, model } = await generateJSONWithSearch<CommunityBatch>({
      system: buildSystemPrompt(styleProfile),
      prompt,
      maxTokens: 9000,
    });

    let stored = 0;
    let dropped = 0;
    for (const a of data.answers ?? []) {
      if (!(await linkResolves(a.question_url))) {
        dropped++;
        continue;
      }
      await supabase.from("community_answers").insert({
        platform: a.platform,
        question_title: a.question_title,
        question_url: a.question_url,
        answer_text: a.answer_text,
        doc_references: a.doc_references ?? [],
        follow_up_question: a.follow_up_question,
        category: a.category,
        status: "draft",
        generated_by: this.name,
        source_model: model,
      });
      stored++;
    }

    return {
      itemsCreated: stored,
      summary: `Drafted ${stored} community answers tied to real questions${dropped ? ` (${dropped} dropped: link did not resolve)` : ""}.`,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      model,
    };
  }
}
