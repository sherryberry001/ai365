import "server-only";

/**
 * Minimal GitHub helper. Pushes a file into a repo via the Contents API.
 * Requires GITHUB_TOKEN (a PAT with `repo` / contents:write) and GITHUB_REPO
 * in "owner/repo" form. Returns the file's GitHub html_url, or null if GitHub
 * is not configured.
 */
export function githubConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function pushFileToRepo(
  path: string,
  content: string,
  message: string,
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/repo"
  if (!token || !repo) return null;

  const [owner, name] = repo.split("/");
  const api = `https://api.github.com/repos/${owner}/${name}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // If the file already exists we need its sha to update it.
  let sha: string | undefined;
  const head = await fetch(api, { headers });
  if (head.status === 200) {
    const existing = await head.json();
    sha = existing.sha;
  }

  const res = await fetch(api, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub push failed (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  return json.content?.html_url ?? null;
}
