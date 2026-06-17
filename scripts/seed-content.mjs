/**
 * Seed real, published articles into Supabase from content/articles.json.
 *
 *   node --env-file=.env.local scripts/seed-content.mjs
 *
 * Idempotent: upserts by slug, replaces the original generic seed articles,
 * and creates a cover image prompt + MVP activity for each.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env. Run with: node --env-file=.env.local scripts/seed-content.mjs");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

const articles = JSON.parse(readFileSync(join(root, "content/articles.json"), "utf8"));

// Original generic seed slugs to retire so the new content takes over.
const RETIRE = [
  "rolling-out-copilot-without-the-hype",
  "designing-governed-azure-ai-architecture",
  "ai-agents-that-actually-ship",
  "governance-checklist-for-copilot",
];

async function retireOldSeed() {
  const { data: old } = await sb.from("articles").select("id").in("slug", RETIRE);
  const ids = (old ?? []).map((r) => r.id);
  if (ids.length) {
    await sb.from("approvals").delete().eq("content_type", "article").in("content_id", ids);
    await sb.from("mvp_activities").delete().eq("source_type", "article").in("source_id", ids);
    await sb.from("articles").delete().in("id", ids);
    console.log(`retired ${ids.length} original seed articles`);
  }
}

async function run() {
  await retireOldSeed();

  let n = 0;
  for (const a of articles) {
    const slug = slugify(a.title);
    const publishedAt = new Date(Date.now() - n * 4 * 86400000).toISOString();

    // cover image prompt
    const { data: img } = await sb
      .from("image_prompts")
      .insert({
        purpose: "article_cover",
        prompt: a.cover_image_prompt,
        aspect_ratio: "16:9",
        category: a.category,
        related_type: "article",
        status: "published",
        generated_by: "content-agent",
      })
      .select("id")
      .single();

    const { data: art, error } = await sb
      .from("articles")
      .upsert(
        {
          slug,
          title: a.title,
          subtitle: a.subtitle,
          excerpt: a.excerpt,
          body_mdx: a.body_mdx,
          category: a.category,
          tags: a.tags ?? [],
          status: "published",
          reading_minutes: a.reading_minutes ?? 7,
          seo_title: a.seo_title,
          seo_description: a.seo_description,
          og_title: a.og_title,
          og_description: a.og_description,
          linkedin_version: a.linkedin_version,
          newsletter_version: a.newsletter_version,
          community_version: a.community_version,
          cover_prompt_id: img?.id ?? null,
          generated_by: "content-agent",
          source_model: "claude-opus-4-8",
          published_at: publishedAt,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error) {
      console.error("  failed:", a.title, error.message);
      continue;
    }

    // MVP activity (idempotent: clear any prior entry for this article first)
    await sb
      .from("mvp_activities")
      .delete()
      .eq("source_type", "article")
      .eq("source_id", art.id);
    await sb.from("mvp_activities").insert({
      activity_type: "article",
      title: a.title,
      category: a.category,
      platform: "website",
      topic: a.subtitle,
      impact: "Published long-form technical article",
      impact_score: 7,
      activity_date: publishedAt.slice(0, 10),
      source_type: "article",
      source_id: art.id,
    });

    n++;
    console.log(`  published [${a.category}] ${slug}`);
  }
  console.log(`done — ${n} articles published.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
