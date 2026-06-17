/**
 * Claude model registry. IDs are the exact current strings — do NOT append
 * date suffixes. Default is Opus 4.8; switch to Sonnet/Haiku via CLAUDE_MODEL
 * for cheaper, high-volume drafting.
 */
export const MODELS = {
  opus: "claude-opus-4-8",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export const DEFAULT_MODEL: string = process.env.CLAUDE_MODEL || MODELS.opus;
