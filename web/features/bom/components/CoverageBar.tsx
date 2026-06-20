import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// CoverageBar — segmented horizontal progress bar
// Shows required-complete (green), in_progress (sky), partial (amber),
// stale/blocked (orange/red), missing (light red), N/A (gray)
// ============================================================

export interface CoverageBarProps {
  /** 0-100 */
  pct: number;
  /** Show percentage label */
  showLabel?: boolean;
  size?: "xs" | "sm" | "md";
  accent?: "green" | "blue" | "amber";
  className?: string;
  "aria-label"?: string;
}

const trackH = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
};

const accentFill = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
};

export function CoverageBar({
  pct,
  showLabel = false,
  size = "sm",
  accent = "green",
  className,
  "aria-label": ariaLabel,
}: CoverageBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? `Coverage: ${clamped}%`}
        className={clsx(
          "flex-1 bg-gray-200 rounded-full overflow-hidden",
          trackH[size],
        )}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-[400ms] ease-out",
            accentFill[accent],
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-semibold tabular-nums text-[var(--ink-muted)] shrink-0 w-9 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
