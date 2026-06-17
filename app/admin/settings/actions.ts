"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const ALLOWED_KEYS = new Set([
  "auto_publish_website",
  "auto_publish_linkedin",
  "auto_publish_community",
  "auto_publish_github",
  "automation_daily_enabled",
  "automation_weekly_enabled",
  "automation_monthly_enabled",
]);

export async function setToggle(key: string, value: boolean) {
  const profile = await requireAdmin();
  if (!ALLOWED_KEYS.has(key)) return { ok: false, error: "Unknown setting" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ value, updated_by: profile.id })
    .eq("key", key);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}
