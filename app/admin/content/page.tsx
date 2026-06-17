import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { PIPELINE } from "@/lib/content/workflow";
import { STATUS_META, CHANNELS } from "@/lib/constants";
import type {
  ArticleRow,
  CommunityAnswerRow,
  GithubIdeaRow,
  LinkedInCommentRow,
  LinkedInPostRow,
  PublishChannel,
} from "@/lib/database.types";
import { timeAgo } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ContentDashboard() {
  const supabase = await createClient();

  const [
    { data: articles },
    { data: linkedin },
    { data: comments },
    { data: community },
    { data: ideas },
    { data: images },
  ] = await Promise.all([
    supabase.from("articles").select("*").order("updated_at", { ascending: false }),
    supabase.from("linkedin_posts").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("linkedin_comments").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("community_answers").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("github_ideas").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("image_prompts").select("related_id, generated_url").eq("related_type", "linkedin_post").not("generated_url", "is", null),
  ]);

  const imageByPost = new Map<string, string>();
  for (const i of images ?? []) {
    if (i.related_id && i.generated_url) imageByPost.set(i.related_id, i.generated_url);
  }

  const byStatus = (status: string) =>
    (articles ?? []).filter((a) => a.status === status);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Content</h1>
        <p className="text-muted-foreground">
          Everything drafted so far. Read it, then approve from the{" "}
          <Link href="/admin/approvals" className="text-primary underline">
            approval queue
          </Link>
          .
        </p>
      </header>

      {/* Article kanban */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Articles</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {PIPELINE.map((status) => {
            const items = byStatus(status);
            return (
              <div key={status} className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{STATUS_META[status].label}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((a: ArticleRow) => (
                    <Link
                      key={a.id}
                      href={a.status === "published" ? `/articles/${a.slug}` : "/admin/content"}
                      className="block rounded-md border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow"
                    >
                      <div className="mb-2 line-clamp-2 font-medium">{a.title}</div>
                      <CategoryBadge category={a.category} />
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <p className="px-1 text-xs text-muted-foreground">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LinkedIn posts */}
      <ContentList title="LinkedIn posts" count={linkedin?.length ?? 0} empty="No LinkedIn drafts yet.">
        {(linkedin ?? []).map((p: LinkedInPostRow) => (
          <Item key={p.id} status={p.status} category={p.category} when={p.created_at} title={p.hook ?? "Untitled"}>
            <div className="flex gap-4">
              {imageByPost.get(p.id) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageByPost.get(p.id)}
                  alt=""
                  className="h-28 w-28 shrink-0 rounded-xl border border-border object-cover"
                />
              )}
              <div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.body}</p>
                {p.hashtags.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-primary">{p.hashtags.join(" ")}</p>
                )}
              </div>
            </div>
          </Item>
        ))}
      </ContentList>

      {/* Community answers */}
      <ContentList title="Community answers" count={community?.length ?? 0} empty="No community answers yet.">
        {(community ?? []).map((c: CommunityAnswerRow) => (
          <Item
            key={c.id}
            status={c.status}
            category={c.category}
            when={c.created_at}
            title={c.question_title}
            badge={CHANNELS[c.platform as PublishChannel]?.label}
          >
            {c.question_url && (
              <a
                href={c.question_url}
                target="_blank"
                rel="noreferrer"
                className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Open question on {CHANNELS[c.platform as PublishChannel]?.label ?? "the forum"} ↗
              </a>
            )}
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.answer_text}</p>
            {c.follow_up_question && (
              <p className="mt-2 text-sm italic text-foreground/70">Follow up: {c.follow_up_question}</p>
            )}
          </Item>
        ))}
      </ContentList>

      {/* Comments */}
      <ContentList title="LinkedIn comments" count={comments?.length ?? 0} empty="No comment drafts yet.">
        {(comments ?? []).map((c: LinkedInCommentRow) => (
          <Item
            key={c.id}
            status={c.status}
            category={c.category}
            when={c.created_at}
            title={`Re: ${c.target_author ?? "post"}`}
            badge={c.insight_type ?? undefined}
          >
            {c.target_summary && (
              <p className="mb-1 text-xs text-muted-foreground">on: {c.target_summary}</p>
            )}
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.comment_text}</p>
          </Item>
        ))}
      </ContentList>

      {/* GitHub ideas */}
      <ContentList title="GitHub ideas" count={ideas?.length ?? 0} empty="No GitHub ideas yet.">
        {(ideas ?? []).map((g: GithubIdeaRow) => (
          <Item key={g.id} status={g.status} category={g.category} when={g.created_at} title={g.title} badge={g.idea_type}>
            <p className="text-sm text-muted-foreground">{g.description}</p>
          </Item>
        ))}
      </ContentList>
    </div>
  );
}

function ContentList({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground">
          {count}
        </span>
      </CardHeader>
      <CardContent>
        {count > 0 ? (
          <div className="space-y-3">{children}</div>
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Item({
  status,
  category,
  when,
  title,
  badge,
  children,
}: {
  status: string;
  category: string;
  when: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={status as never} />
        <CategoryBadge category={category as never} />
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(when)}</span>
      </div>
      <div className="font-medium">{title}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
