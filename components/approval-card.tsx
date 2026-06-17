"use client";

import * as React from "react";
import { Check, ExternalLink, Send, X } from "lucide-react";

import type { ApprovalRow } from "@/lib/database.types";
import { CHANNELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  approveItem,
  publishItem,
  rejectItem,
} from "@/app/admin/approvals/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ApprovalCard({ approval }: { approval: ApprovalRow }) {
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState<string | null>(null);

  function run(fn: () => Promise<unknown>, label: string) {
    startTransition(async () => {
      await fn();
      setDone(label);
    });
  }

  if (done) {
    return (
      <Card className="opacity-70">
        <CardContent className="p-5 text-sm text-muted-foreground">
          {approval.title ?? approval.content_type}: <strong>{done}</strong>.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{CHANNELS[approval.channel].label}</Badge>
          <span className="text-xs text-muted-foreground">
            {approval.content_type.replace(/_/g, " ")} ·{" "}
            {formatDate(approval.created_at)}
          </span>
        </div>
        <h3 className="font-semibold">
          {approval.title ?? "Untitled content"}
        </h3>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {approval.preview && (
          <p className="whitespace-pre-wrap text-muted-foreground">
            {approval.preview}
          </p>
        )}
        {approval.reason && (
          <p>
            <span className="font-medium">Why it matters: </span>
            <span className="text-muted-foreground">{approval.reason}</span>
          </p>
        )}
        {approval.suggested_hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {approval.suggested_hashtags.map((h) => (
              <span
                key={h}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {h}
              </span>
            ))}
          </div>
        )}
        {approval.suggested_post_at && (
          <p className="text-xs text-muted-foreground">
            Suggested time: {formatDate(approval.suggested_post_at)}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => approveItem(approval.id), "approved")}
          >
            <Check className="h-4 w-4" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => publishItem(approval.id), "published")}
          >
            <Send className="h-4 w-4" /> Publish now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => rejectItem(approval.id), "rejected")}
          >
            <X className="h-4 w-4" /> Reject
          </Button>
          {approval.platform_link && (
            <Button asChild size="sm" variant="ghost">
              <a href={approval.platform_link} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Open
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
