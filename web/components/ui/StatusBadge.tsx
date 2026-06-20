import * as React from "react";
import { clsx } from "clsx";
import type { AssetStatus } from "@/lib/types";

// ============================================================
// StatusBadge — color ALWAYS paired with text label (WCAG)
// ============================================================

const STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  inbox: {
    label: "Inbox",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  raw: {
    label: "Raw",
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  candidate: {
    label: "Candidate",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  in_review: {
    label: "In Review",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-sky-100",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  selected: {
    label: "Selected",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  canonical: {
    label: "Canonical",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-600",
  },
  archived: {
    label: "Archived",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-300",
  },
};

export interface StatusBadgeProps {
  status: AssetStatus;
  size?: "xs" | "sm" | "md";
  /** Show dot indicator alongside text */
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = "sm",
  showDot = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full",
        config.bg,
        config.text,
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden
          className={clsx("rounded-full shrink-0", config.dot, {
            "w-1.5 h-1.5": size === "xs" || size === "sm",
            "w-2 h-2": size === "md",
          })}
        />
      )}
      {config.label}
    </span>
  );
}
