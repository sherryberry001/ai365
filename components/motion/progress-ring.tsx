"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";

/** Animated radial progress ring with a Copilot-gradient stroke. */
export function ProgressRing({
  value,
  goal,
  label,
  size = 150,
  stroke = 12,
}: {
  value: number;
  goal: number;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const ref = React.useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gid = React.useId();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg ref={ref} width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(199 95% 55%)" />
              <stop offset="50%" stopColor="hsl(265 89% 64%)" />
              <stop offset="100%" stopColor="hsl(330 85% 60%)" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={inView ? { strokeDashoffset: c * (1 - pct) } : {}}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tabular-nums">
            {value}
          </span>
          <span className="text-xs text-muted-foreground">of {goal}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">
          {Math.round(pct * 100)}% to goal
        </div>
      </div>
    </div>
  );
}
