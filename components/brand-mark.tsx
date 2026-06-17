import { cn } from "@/lib/utils";

/**
 * AI365 brand mark — a Copilot-gradient rounded tile with a subtle spark.
 * Pure CSS/SVG, server-safe.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl shadow-sm",
        className,
      )}
      aria-hidden
    >
      <span className="copilot-ring absolute inset-0" />
      <span className="absolute inset-[1.5px] rounded-[10px] bg-white/15 backdrop-blur-sm" />
      <svg
        viewBox="0 0 24 24"
        className="relative h-1/2 w-1/2 text-white drop-shadow"
        fill="currentColor"
      >
        {/* four-point sparkle */}
        <path d="M12 2c.4 3.6 1.8 5 5.4 5.4-3.6.4-5 1.8-5.4 5.4-.4-3.6-1.8-5-5.4-5.4C10.2 7 11.6 5.6 12 2Z" />
        <path
          d="M18.5 13.5c.2 1.9.9 2.6 2.8 2.8-1.9.2-2.6.9-2.8 2.8-.2-1.9-.9-2.6-2.8-2.8 1.9-.2 2.6-.9 2.8-2.8Z"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}
