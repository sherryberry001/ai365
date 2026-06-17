import "server-only";

import { publicClient } from "@/lib/supabase/public";
import type {
  ArticleRow,
  ContentCategory,
  GithubIdeaRow,
  MvpActivityRow,
  ResourceRow,
} from "@/lib/database.types";

/**
 * Read helpers for the public site. All of these run against the anon client
 * and therefore only ever see rows RLS allows (published content).
 */

export async function getPublishedArticles(
  category?: ContentCategory,
): Promise<ArticleRow[]> {
  const supabase = publicClient();
  let query = supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data } = await query;
  return data ?? [];
}

export async function getArticleBySlug(
  slug: string,
): Promise<ArticleRow | null> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ?? null;
}

export async function getPublishedResources(): Promise<ResourceRow[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return data ?? [];
}

export async function getGithubIdeas(): Promise<GithubIdeaRow[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("github_ideas")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMvpActivities(
  limit = 50,
): Promise<MvpActivityRow[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("mvp_activities")
    .select("*")
    .order("activity_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export interface MvpProgress {
  articles: number;
  comments: number;
  communityAnswers: number;
  githubResources: number;
}

export async function getMvpProgress(): Promise<MvpProgress> {
  const activities = await getMvpActivities(1000);
  const count = (type: string) =>
    activities.filter((a) => a.activity_type === type).length;
  return {
    articles: count("article"),
    comments: count("comment"),
    communityAnswers: count("community_answer"),
    githubResources: count("github_project") + count("resource"),
  };
}
