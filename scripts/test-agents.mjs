/**
 * End-to-end test of every agent via the running dev server's API route.
 *   node --env-file=.env.local scripts/test-agents.mjs [baseUrl]
 *
 * Hits POST /api/agents/<key> with the AUTOMATION_SECRET bearer and reports
 * ok / itemsCreated / summary / tokens for each. Ordered so dependent agents
 * (article needs ideas; personal-brand needs approved content) have inputs.
 */
const base = process.argv[2] || "http://localhost:3001";
const secret = process.env.AUTOMATION_SECRET;
if (!secret) {
  console.error("Missing AUTOMATION_SECRET. Run: node --env-file=.env.local scripts/test-agents.mjs");
  process.exit(1);
}

// content first (creates article ideas), then article (expands them), etc.
const AGENTS = [
  "content",
  "article",
  "comment",
  "community",
  "image",
  "mvp",
  "analytics",
  "personal-brand",
];

async function runAgent(key) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 290_000);
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}/api/agents/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: ctrl.signal,
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const body = await res.json().catch(() => ({}));
    return { key, http: res.status, secs, ...body };
  } catch (e) {
    return { key, http: "ERR", secs: ((Date.now() - t0) / 1000).toFixed(1), ok: false, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
let totalTokens = 0;
for (const key of AGENTS) {
  process.stdout.write(`▶ ${key.padEnd(15)} … `);
  const r = await runAgent(key);
  results.push(r);
  totalTokens += r.tokensUsed ?? 0;
  const mark = r.ok ? "✓" : "✗";
  console.log(
    `${mark} [${r.http}] ${r.secs}s · items=${r.itemsCreated ?? 0}${r.tokensUsed ? ` · ${r.tokensUsed} tok` : ""}`,
  );
  console.log(`    ${r.error ? "ERROR: " + r.error : r.summary ?? ""}`);
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n=== ${passed}/${AGENTS.length} agents OK · ~${totalTokens.toLocaleString()} tokens total ===`);
if (passed < AGENTS.length) process.exitCode = 1;
