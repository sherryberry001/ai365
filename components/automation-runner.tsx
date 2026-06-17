"use client";

import * as React from "react";
import { Loader2, Play } from "lucide-react";

import {
  runAutomation,
  runSingleAgent,
} from "@/app/admin/automation/actions";
import type { AutomationCadence } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AgentItem = { key: string; label: string; description: string };

export function AutomationRunner({ agents }: { agents: AgentItem[] }) {
  const [pending, startTransition] = React.useTransition();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  function runCadence(cadence: AutomationCadence) {
    setBusy(cadence);
    setMessage(null);
    startTransition(async () => {
      const res = await runAutomation(cadence);
      setMessage(res.summary);
      setBusy(null);
    });
  }

  function runAgent(key: string) {
    setBusy(key);
    setMessage(null);
    startTransition(async () => {
      const res = await runSingleAgent(key);
      setMessage(res.summary);
      setBusy(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {(["daily", "weekly", "monthly"] as AutomationCadence[]).map((c) => (
          <Button key={c} disabled={pending} onClick={() => runCadence(c)}>
            {busy === c ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run {c}
          </Button>
        ))}
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {agents.map((a) => (
            <div
              key={a.key}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <div className="text-sm font-medium">{a.label}</div>
                <div className="text-xs text-muted-foreground">
                  {a.description}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAgent(a.key)}
              >
                {busy === a.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Run"
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
