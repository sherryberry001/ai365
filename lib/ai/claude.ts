import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { DEFAULT_MODEL } from "@/lib/ai/models";

let _client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error("CLAUDE_API_KEY is not set, content drafting cannot run.");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }
  return _client;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function usageOf(message: Anthropic.Message): Usage {
  return {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

/** Plain text generation. */
export async function generateText(opts: {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}): Promise<{ text: string; usage: Usage; model: string }> {
  const model = opts.model ?? DEFAULT_MODEL;
  const client = getClaude();

  // `output_config` is a current API field; cast keeps it compiling across
  // SDK minor versions that may not yet type it.
  const params = {
    model,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    output_config: { effort: opts.effort ?? "medium" },
  } as unknown as Anthropic.MessageCreateParamsNonStreaming;

  const message = await client.messages.create(params);
  return { text: extractText(message), usage: usageOf(message), model };
}

/**
 * Structured JSON generation. Constrains the response to `schema`
 * (a JSON Schema object) via `output_config.format` and parses the result.
 */
export async function generateJSON<T>(opts: {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  model?: string;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}): Promise<{ data: T; usage: Usage; model: string }> {
  const model = opts.model ?? DEFAULT_MODEL;
  const client = getClaude();

  const params = {
    model,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    output_config: {
      effort: opts.effort ?? "medium",
      format: { type: "json_schema", schema: opts.schema },
    },
  } as unknown as Anthropic.MessageCreateParamsNonStreaming;

  const message = await client.messages.create(params);
  const text = extractText(message);
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(`Model did not return valid JSON: ${text.slice(0, 200)}`);
  }
  return { data, usage: usageOf(message), model };
}
