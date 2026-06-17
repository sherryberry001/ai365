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

/** Pull a JSON object out of free text (handles ```json fences or raw braces). */
function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text;
}

/**
 * Generate JSON while letting Claude use the web search tool first. Used to
 * ground answers in real, current pages. We can't combine the web_search tool
 * with output_config.format, so the JSON shape is described in the prompt and
 * parsed from the final text.
 */
export async function generateJSONWithSearch<T>(opts: {
  system: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}): Promise<{ data: T; usage: Usage; model: string }> {
  const model = opts.model ?? DEFAULT_MODEL;
  const client = getClaude();
  const tools = [{ type: "web_search_20260209", name: "web_search" }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [{ role: "user", content: opts.prompt }];

  let message: Anthropic.Message | undefined;
  let inputTokens = 0;
  let outputTokens = 0;

  for (let i = 0; i < 6; i++) {
    const params = {
      model,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      tools,
      messages,
    } as unknown as Anthropic.MessageCreateParamsNonStreaming;
    message = await client.messages.create(params);
    inputTokens += message.usage.input_tokens;
    outputTokens += message.usage.output_tokens;
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    break;
  }

  const text = extractText(message!);
  let data: T;
  try {
    data = JSON.parse(extractJson(text)) as T;
  } catch {
    throw new Error(`Model did not return valid JSON from search: ${text.slice(0, 200)}`);
  }
  return { data, usage: { inputTokens, outputTokens }, model };
}
