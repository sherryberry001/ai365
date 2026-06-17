/**
 * Remove em/en dashes from all stored content (em dashes are forbidden in the
 * house style). Replaces them with commas; keeps numeric ranges as hyphens.
 * Never collapses newlines or indentation, so code blocks stay intact.
 *
 *   node --env-file=.env.local scripts/scrub-content.mjs
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const scrub = (s) =>
  s == null
    ? s
    : s
        .replace(/(\d)[ \t]*–[ \t]*(\d)/g, "$1-$2") // numeric range → hyphen
        .replace(/[ \t]*–[ \t]*/g, ", ") // other en dash → comma
        .replace(/[ \t]*—[ \t]*/g, ", "); // em dash → comma

const TABLES = {
  articles: [
    "title", "subtitle", "excerpt", "body_mdx", "seo_title", "seo_description",
    "og_title", "og_description", "linkedin_version", "newsletter_version", "community_version",
  ],
  linkedin_posts: ["hook", "body", "reason", "mvp_impact"],
  linkedin_comments: ["comment_text", "target_summary"],
  community_answers: ["question_title", "answer_text", "follow_up_question"],
  github_ideas: ["title", "description"],
  resources: ["title", "description"],
  newsletters: ["subject", "preview_text", "body"],
};

async function run() {
  for (const [table, fields] of Object.entries(TABLES)) {
    const { data, error } = await sb.from(table).select(["id", ...fields].join(","));
    if (error) {
      console.log(`  ${table}: skip (${error.message})`);
      continue;
    }
    let changed = 0;
    for (const row of data ?? []) {
      const patch = {};
      for (const f of fields) {
        const next = scrub(row[f]);
        if (next !== row[f]) patch[f] = next;
      }
      if (Object.keys(patch).length) {
        await sb.from(table).update(patch).eq("id", row.id);
        changed++;
      }
    }
    console.log(`  ${table}: scrubbed ${changed}/${(data ?? []).length} rows`);
  }
  console.log("done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
