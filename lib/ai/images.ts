import "server-only";

import OpenAI, { AzureOpenAI } from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type ImageProvider = "azure" | "openai" | null;

/** Which image backend is configured (Azure preferred for Microsoft shops). */
export function imageProvider(): ImageProvider {
  if (
    process.env.AZURE_OPENAI_API_KEY &&
    process.env.AZURE_OPENAI_ENDPOINT &&
    process.env.AZURE_OPENAI_DEPLOYMENT
  ) {
    return "azure";
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

// gpt-image-* and DALL·E-3 accept different landscape/portrait sizes.
const GPT_IMAGE_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1536x1024",
  "9:16": "1024x1536",
};
const DALLE_SIZE: Record<string, string> = {
  "1:1": "1024x1024",
  "16:9": "1792x1024",
  "9:16": "1024x1792",
};

const sizeFor = (model: string, aspect: string) =>
  (/image/i.test(model) ? GPT_IMAGE_SIZE : DALLE_SIZE)[aspect] ?? "1024x1024";

/** Render an image from a prompt, returning raw PNG bytes — or null if no provider. */
async function render(
  prompt: string,
  aspect: string,
): Promise<Buffer | null> {
  const provider = imageProvider();
  if (!provider) return null;

  if (provider === "azure") {
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
    const client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
      deployment,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21",
    });
    const params = {
      prompt,
      size: sizeFor(deployment, aspect),
      n: 1,
    } as unknown as OpenAI.Images.ImageGenerateParams;
    return decode(await client.images.generate(params));
  }

  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const params = {
    model,
    prompt,
    size: sizeFor(model, aspect),
    n: 1,
  } as unknown as OpenAI.Images.ImageGenerateParams;
  return decode(await client.images.generate(params));
}

async function decode(res: OpenAI.Images.ImagesResponse): Promise<Buffer | null> {
  const item = res.data?.[0];
  if (!item) return null;
  if (item.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item.url) {
    const r = await fetch(item.url);
    return Buffer.from(await r.arrayBuffer());
  }
  return null;
}

/**
 * Render + upload to the `media` bucket. Returns the public URL, or null if no
 * provider is configured (caller falls back to prompt-only).
 */
export async function generateAndStore(
  sb: SupabaseClient<Database>,
  prompt: string,
  pathPrefix: string,
  aspect = "1:1",
): Promise<string | null> {
  const bytes = await render(prompt, aspect);
  if (!bytes) return null;

  const path = `${pathPrefix}/${crypto.randomUUID()}.png`;
  const { error } = await sb.storage
    .from("media")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}
