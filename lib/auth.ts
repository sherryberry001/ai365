import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/database.types";

/** Returns the logged-in user's profile, or null. */
export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
}

/**
 * Guard for the admin area. Redirects to /login when not signed in, and to the
 * homepage when signed in but lacking a staff role.
 */
export async function requireStaff(): Promise<ProfileRow> {
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "admin" && profile.role !== "editor") redirect("/");
  return profile;
}

/** Stricter guard for admin-only actions (e.g. changing settings). */
export async function requireAdmin(): Promise<ProfileRow> {
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "admin") redirect("/admin");
  return profile;
}
