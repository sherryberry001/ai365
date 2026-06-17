import "server-only";

import { generateJSON } from "@/lib/ai/claude";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { githubConfigured, pushFileToRepo } from "@/lib/github";
import { slugify } from "@/lib/utils";
import type { ContentCategory } from "@/lib/database.types";
import { BaseAgent, type AgentContext, type AgentOutcome } from "@/lib/agents/base";
import { powershellScriptsSchema } from "@/lib/agents/schemas";

interface ScriptBatch {
  scripts: {
    title: string;
    description: string;
    filename: string;
    category: ContentCategory;
    code: string;
  }[];
}

/**
 * GitHub Script Agent. Writes real, usable Microsoft 365 PowerShell scripts,
 * publishes them on the Community page, and (when GitHub is configured) pushes
 * each one to the repo so people can grab them from GitHub.
 */
export class GithubScriptAgent extends BaseAgent {
  readonly name = "github-script-agent";

  constructor(private opts: { count?: number } = {}) {
    super();
  }

  protected async execute(ctx: AgentContext): Promise<AgentOutcome> {
    const { supabase, styleProfile } = ctx;
    const count = this.opts.count ?? 4;

    const prompt = `Write ${count} genuinely useful Microsoft 365 administration PowerShell scripts that an admin would actually run. Cover a range of real tasks, for example: reporting on SharePoint sites shared with "Everyone except external users", exporting Copilot license assignments, finding inactive guest accounts, auditing Teams with no owners, or listing mailboxes over a size threshold.

For each script provide:
- title: a clear, plain title.
- description: 1-2 sentences on what it does and when you would use it.
- filename: a kebab-case name ending in .ps1.
- category: the closest topic.
- code: a complete, working PowerShell script. Use the current modules (Microsoft.Graph, ExchangeOnlineManagement, PnP.PowerShell as appropriate). Start with a comment block explaining requirements and required permissions, then a clear Connect step, then the logic. Include basic error handling. Real, runnable code, not pseudo-code.

Do not use em dashes or en dashes anywhere. Write comments like a working admin would.`;

    const { data, usage, model } = await generateJSON<ScriptBatch>({
      system: buildSystemPrompt(styleProfile),
      prompt,
      schema: powershellScriptsSchema as unknown as Record<string, unknown>,
      maxTokens: 12000,
      effort: "high",
    });

    const canPush = githubConfigured();
    let stored = 0;
    let pushed = 0;

    for (const s of data.scripts) {
      const filename = s.filename.endsWith(".ps1")
        ? s.filename
        : `${slugify(s.filename)}.ps1`;

      let repoUrl: string | null = null;
      if (canPush) {
        try {
          repoUrl = await pushFileToRepo(
            `scripts/${filename}`,
            s.code,
            `Add ${filename}`,
          );
        } catch {
          repoUrl = null;
        }
      }

      await supabase.from("github_ideas").insert({
        title: s.title,
        description: s.description,
        idea_type: "powershell_script",
        category: s.category,
        code: s.code,
        filename,
        repo_url: repoUrl,
        status: "published", // shown on the public Community page
        generated_by: this.name,
      });
      stored++;
      if (repoUrl) pushed++;
    }

    const summary = canPush
      ? `Wrote ${stored} PowerShell scripts and pushed ${pushed} to GitHub.`
      : `Wrote ${stored} PowerShell scripts (shown on the Community page). Set GITHUB_TOKEN and GITHUB_REPO to push them to GitHub.`;

    return {
      itemsCreated: stored,
      summary,
      tokensUsed: usage.inputTokens + usage.outputTokens,
      model,
    };
  }
}
