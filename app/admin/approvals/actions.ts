"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { publishApproval } from "@/lib/publishing";
import { CHANNEL_AUTOPUBLISH_KEY } from "@/lib/constants";

/** Approve an item — and auto-publish if its channel's toggle is on. */
export async function approveItem(approvalId: string) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const { data: approval } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();
  if (!approval) return { ok: false, error: "Approval not found" };

  await supabase
    .from("approvals")
    .update({
      status: "approved",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", approvalId);

  // Auto-publish only if the channel toggle is enabled.
  const toggleKey = CHANNEL_AUTOPUBLISH_KEY[approval.channel];
  if (toggleKey) {
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", toggleKey)
      .maybeSingle();
    if (setting?.value === true) {
      await publishApproval({ ...approval, status: "approved" });
    }
  }

  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  return { ok: true };
}

export async function rejectItem(approvalId: string, notes?: string) {
  const profile = await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("approvals")
    .update({
      status: "rejected",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes ?? null,
    })
    .eq("id", approvalId);
  revalidatePath("/admin/approvals");
  return { ok: true };
}

/** Manually publish an already-approved item (e.g. website channel). */
export async function publishItem(approvalId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data: approval } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", approvalId)
    .maybeSingle();
  if (!approval) return { ok: false, error: "Approval not found" };

  const result = await publishApproval(approval);
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  return result;
}
