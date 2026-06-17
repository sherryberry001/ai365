import { createClient } from "@/lib/supabase/server";
import { ApprovalCard } from "@/components/approval-card";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("approvals")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Approval queue</h1>
        <p className="text-muted-foreground">
          Human-in-the-loop review. Nothing goes out until you approve it.
        </p>
      </header>

      {pending && pending.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pending.map((a) => (
            <ApprovalCard key={a.id} approval={a} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          🎉 Inbox zero. No items waiting for review.
        </div>
      )}
    </div>
  );
}
