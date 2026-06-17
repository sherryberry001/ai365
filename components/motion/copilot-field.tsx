"use client";

import { motion } from "framer-motion";

/**
 * Animated Copilot-style gradient orbs for hero/section backdrops.
 * Pure decoration — sits behind content with pointer-events disabled.
 */
export function CopilotField({ className = "" }: { className?: string }) {
  const orbs = [
    { c: "var(--cp-4)", x: "-10%", y: "-20%", s: 520, dur: 17 },
    { c: "var(--cp-3)", x: "70%", y: "-10%", s: 460, dur: 21 },
    { c: "var(--cp-2)", x: "30%", y: "40%", s: 420, dur: 25 },
    { c: "var(--cp-1)", x: "85%", y: "55%", s: 360, dur: 19 },
  ];
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: o.x,
            top: o.y,
            width: o.s,
            height: o.s,
            background: `radial-gradient(circle at 35% 35%, hsl(${o.c} / 0.55), transparent 62%)`,
            filter: "blur(56px)",
          }}
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 25, 0],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{
            duration: o.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
