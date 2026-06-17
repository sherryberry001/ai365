"use client";

import * as React from "react";

import { setToggle } from "@/app/admin/settings/actions";
import { cn } from "@/lib/utils";

export function SettingsToggle({
  settingKey,
  initial,
  label,
  description,
  locked,
}: {
  settingKey: string;
  initial: boolean;
  label: string;
  description?: string;
  locked?: boolean;
}) {
  const [on, setOn] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  function toggle() {
    if (locked) return;
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await setToggle(settingKey, next);
      if (!res.ok) setOn(!next); // revert on failure
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0">
      <div>
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
        {locked && (
          <div className="text-xs text-amber-600">
            Requires API credentials & platform approval before it can be turned
            on safely.
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={pending || locked}
        onClick={toggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          on ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            on ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
