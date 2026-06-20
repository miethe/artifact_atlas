import * as React from "react";
import { clsx } from "clsx";
import type { BomSlotStatus } from "@/lib/types";
import { SLOT_STATUS_CONFIG } from "./SlotStatusBadge";

// ============================================================
// SlotLegend — compact color-key for the slot grid
// WCAG: color + label + optional description
// ============================================================

const LEGEND_ITEMS: { status: BomSlotStatus; description?: string }[] = [
  { status: "missing", description: "Required, no asset" },
  { status: "partial", description: "Suggested or uncertain" },
  { status: "in_progress", description: "Asset in progress" },
  { status: "complete", description: "Canonical + review satisfied" },
  { status: "stale", description: "Past threshold or superseded" },
  { status: "blocked", description: "Missing dependency" },
  { status: "not_applicable", description: "Excluded from scoring" },
];

export interface SlotLegendProps {
  className?: string;
}

export function SlotLegend({ className }: SlotLegendProps) {
  return (
    <div
      aria-label="Slot status legend"
      className={clsx("flex items-center flex-wrap gap-x-4 gap-y-1.5", className)}
    >
      {LEGEND_ITEMS.map(({ status, description }) => {
        const cfg = SLOT_STATUS_CONFIG[status];
        return (
          <div
            key={status}
            className="flex items-center gap-1.5"
            title={description}
          >
            <span
              aria-hidden
              className={clsx("w-2 h-2 rounded-full shrink-0", cfg.dot)}
            />
            <span className="text-[11px] text-[var(--ink-muted)]">{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}
