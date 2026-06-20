import * as React from "react";
import { clsx } from "clsx";
import type { BomSlotStatus } from "@/lib/types";

// ============================================================
// SlotStatusBadge — covers all BOM slot status states
// WCAG: color always paired with text label
// ============================================================

export interface SlotStatusConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  ring?: string;
}

export const SLOT_STATUS_CONFIG: Record<BomSlotStatus, SlotStatusConfig> = {
  missing: {
    label: "Missing",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    ring: "ring-red-200",
  },
  partial: {
    label: "Partial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
  },
  complete: {
    label: "Complete",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  stale: {
    label: "Stale",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    ring: "ring-orange-200",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-600",
    ring: "ring-red-300",
  },
  not_applicable: {
    label: "N/A",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-300",
    ring: "ring-gray-200",
  },
};

export interface SlotStatusBadgeProps {
  status: BomSlotStatus;
  size?: "xs" | "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export function SlotStatusBadge({
  status,
  size = "sm",
  showDot = true,
  className,
}: SlotStatusBadgeProps) {
  const cfg = SLOT_STATUS_CONFIG[status];

  return (
    <span
      role="status"
      aria-label={`Slot status: ${cfg.label}`}
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full",
        cfg.bg,
        cfg.text,
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        className,
      )}
    >
      {showDot && (
        <span
          aria-hidden
          className={clsx("rounded-full shrink-0", cfg.dot, {
            "w-1.5 h-1.5": size === "xs" || size === "sm",
            "w-2 h-2": size === "md",
          })}
        />
      )}
      {cfg.label}
    </span>
  );
}
