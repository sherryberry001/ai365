/**
 * Generate real downloadable resource files, upload them to Supabase Storage,
 * and attach them to the matching resource rows (and publish them).
 *
 *   node --env-file=.env.local scripts/build-resources.mjs
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const DOCS = [
  {
    slug: "copilot-readiness-checklist",
    file: "copilot-readiness-checklist.md",
    markdown: `# Microsoft 365 Copilot Readiness Checklist

A practical checklist I run with customers before turning Copilot on. Work top
to bottom. If you cannot tick an item, that is your next piece of work, not a
reason to delay the whole rollout.

## 1. Data access and oversharing

- [ ] Run the SharePoint Advanced Management data access report and note the sites shared with "Everyone except external users".
- [ ] Decide what to do with each oversharing finding. Triage by sensitivity, not by site name.
- [ ] Confirm OneDrive and Teams sharing defaults are sensible for your tenant.
- [ ] If cleanup will take longer than the rollout, plan to use Restricted SharePoint Search as a temporary bridge.

## 2. Sensitivity labels

- [ ] Confirm you have a labeling taxonomy that people actually understand.
- [ ] Check label coverage. Copilot only protects what is labeled.
- [ ] Test that encrypted and labeled files behave the way you expect inside Copilot.

## 3. Identity and access

- [ ] Confirm Conditional Access policies apply to the Copilot apps.
- [ ] Review which accounts have broad read access across the tenant.
- [ ] Check any app registrations and agents that hold tenant wide read scopes.

## 4. Licensing and scope

- [ ] Decide who gets a license first. Start with two or three teams, not the whole company.
- [ ] Pick two real workflows to measure, for example meeting follow ups and first draft documents.

## 5. Measurement

- [ ] Baseline one concrete metric before go live.
- [ ] Turn on Copilot interaction auditing in Purview and watch which sources it grounds on for the first two weeks.

## 6. People

- [ ] Line up a small group of champions per team.
- [ ] Prepare short, task specific guidance. Long training decks do not get read.

If you want help working through any of this on your own tenant, get in touch.
`,
  },
  {
    slug: "azure-ai-governance-whitepaper",
    file: "azure-ai-governance.md",
    markdown: `# Governing Azure AI Without Slowing Everyone Down

A short, practical guide to the governance decisions that matter most when you
put Azure AI into production. It is written for the people who have to answer
for it later, not for a slide.

## Start with the landing zone

Put AI workloads in a dedicated subscription with private networking and no
public model endpoints. Most governance problems are architecture problems that
surfaced late. Deciding this early is cheaper than fixing it during an audit.

## Use identity, not keys

Managed identities everywhere. If you are still passing API keys between
services, that is the first thing to remove. Keys leak, identities can be
scoped and revoked.

## Put a safety gate in front of generation

Azure AI Content Safety should sit in front of anything that generates content
for users, with logging to a central workspace. You want to be able to answer
"what did it produce and why" months later.

## Log prompts and responses

Decide up front what you keep, for how long, and who can read it. This is both a
security control and the thing that lets you debug behavior.

## Decide who owns an agent

When an agent acts on a user's behalf across systems, write down who is
accountable for what it does, and how its actions are audited. This question
gets harder as agents touch more systems, so answer it before that happens.

## A reasonable order of work

1. Landing zone and private networking.
2. Managed identity for every service.
3. Content Safety as a gate, with central logging.
4. Prompt and response logging with a clear retention rule.
5. Ownership and audit for any agent that takes actions.

None of this is exotic. It is just deciding governance early instead of during
the review. If you want a second opinion on your setup, reach out.
`,
  },
];

async function run() {
  for (const doc of DOCS) {
    const path = `resources/${doc.file}`;
    const { error: upErr } = await sb.storage
      .from("media")
      .upload(path, Buffer.from(doc.markdown, "utf8"), {
        contentType: "text/markdown; charset=utf-8",
        upsert: true,
      });
    if (upErr) {
      console.log(`  ${doc.slug}: upload failed (${upErr.message})`);
      continue;
    }
    const fileUrl = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    const { error } = await sb
      .from("resources")
      .update({ file_url: fileUrl, status: "published" })
      .eq("slug", doc.slug);
    console.log(
      error ? `  ${doc.slug}: db update failed (${error.message})` : `  ${doc.slug}: published with file`,
    );
  }
  console.log("done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
