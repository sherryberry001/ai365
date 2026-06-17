"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Acrylic glass surface with a Fluent-style spring hover-lift.
 * `interactive` enables the lift; off for static panels.
 */
export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive = true, children, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      whileHover={interactive ? { y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "glass rounded-2xl",
        interactive && "transition-shadow hover:shadow-xl",
        className,
      )}
      // framer-motion + native DOM props overlap on a few event handlers
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
});
GlassCard.displayName = "GlassCard";
