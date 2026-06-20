import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// MetricCard — KPI card for dashboard/command center
// Dense operational layout — no decorative blobs
// ============================================================

export interface MetricCardProps {
  label: string;
  value: string | number;
  /** Optional delta indicator */
  delta?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  /** Optional icon to the left of the label */
  icon?: React.ReactNode;
  /** Optional color accent for the value */
  accent?: "blue" | "green" | "amber" | "red" | "purple" | "default";
  /** Optional sublabel or context */
  sublabel?: string;
  /** Additional content (mini chart, progress bar, etc.) */
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const accentValueClasses: Record<
  NonNullable<MetricCardProps["accent"]>,
  string
> = {
  default: "text-[var(--ink)]",
  blue: "text-blue-600",
  green: "text-green-600",
  amber: "text-amber-600",
  red: "text-red-600",
  purple: "text-purple-600",
};

export function MetricCard({
  label,
  value,
  delta,
  icon,
  accent = "default",
  sublabel,
  footer,
  className,
  onClick,
}: MetricCardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={clsx(
        "bg-white border border-[var(--border)] rounded-lg p-4",
        "flex flex-col gap-2",
        onClick &&
          "cursor-pointer hover:border-blue-300 hover:shadow-card-hover transition-all duration-[150ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "text-left",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <span
              aria-hidden
              className="shrink-0 text-[var(--ink-muted)] w-3.5 h-3.5"
            >
              {icon}
            </span>
          )}
          <span className="text-xs font-medium text-[var(--ink-muted)] truncate">
            {label}
          </span>
        </div>
        {delta && (
          <span
            aria-label={`${delta.direction === "up" ? "Increased" : delta.direction === "down" ? "Decreased" : "Unchanged"} by ${delta.value}`}
            className={clsx(
              "text-[10px] font-medium shrink-0",
              delta.direction === "up" && "text-green-600",
              delta.direction === "down" && "text-red-600",
              delta.direction === "neutral" && "text-gray-500",
            )}
          >
            {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"}{" "}
            {delta.value}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          className={clsx(
            "text-2xl font-semibold tabular-nums leading-none",
            accentValueClasses[accent],
          )}
        >
          {value}
        </span>
        {sublabel && (
          <span className="text-xs text-[var(--ink-faint)] mb-0.5 leading-none">
            {sublabel}
          </span>
        )}
      </div>

      {/* Footer slot */}
      {footer && <div className="pt-1">{footer}</div>}
    </Tag>
  );
}
