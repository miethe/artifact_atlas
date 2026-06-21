"use client";

/**
 * CoverageLegend — slot status legend and coverage rules explanation.
 * BOM-UI-006
 */

import * as React from "react";
import { clsx } from "clsx";
import type { BomSlotStatus } from "@/lib/types";

const LEGEND_ENTRIES: Array<{
  status: BomSlotStatus;
  label: string;
  description: string;
  dot: string;
}> = [
  {
    status: "complete",
    label: "Complete",
    description: "Selected/canonical asset, review satisfied",
    dot: "bg-green-500",
  },
  {
    status: "in_progress",
    label: "In Progress",
    description: "Accepted asset in raw/candidate/in_progress state",
    dot: "bg-sky-500",
  },
  {
    status: "partial",
    label: "Partial",
    description: "Only suggested/uncertain assignment, or min count unmet",
    dot: "bg-amber-400",
  },
  {
    status: "missing",
    label: "Missing",
    description: "Required slot with no accepted assignment (counts as gap)",
    dot: "bg-red-500",
  },
  {
    status: "stale",
    label: "Stale",
    description: "Assigned asset exceeded staleness threshold or superseded",
    dot: "bg-orange-400",
  },
  {
    status: "blocked",
    label: "Blocked",
    description: "Missing dependency or explicit blocker (counts as gap)",
    dot: "bg-gray-400",
  },
  {
    status: "not_applicable",
    label: "N/A",
    description: "Excluded from required denominator",
    dot: "bg-gray-300",
  },
];

export interface CoverageLegendProps {
  className?: string;
  compact?: boolean;
}

export function CoverageLegend({ className, compact = false }: CoverageLegendProps) {
  return (
    <div
      className={clsx("rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]", className)}
      role="complementary"
      aria-label="Coverage status legend"
    >
      <div className="px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
          Status Legend
        </h3>
      </div>
      <div
        className={clsx(
          "px-3 py-2",
          compact
            ? "grid grid-cols-2 gap-x-4 gap-y-2"
            : "flex flex-col gap-2",
        )}
      >
        {LEGEND_ENTRIES.map((entry) => (
          <div key={entry.status} className="flex items-start gap-2">
            <span
              aria-hidden
              className={clsx("w-2 h-2 rounded-full shrink-0 mt-1", entry.dot)}
            />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[var(--ink)]">
                {entry.label}
              </span>
              {!compact && (
                <p className="text-[10px] text-[var(--ink-faint)] leading-snug">
                  {entry.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="px-3 pb-3">
          <div className="rounded bg-amber-50 border border-amber-100 px-2 py-1.5 mt-1">
            <p className="text-[10px] text-amber-700 leading-snug">
              <strong>Score formula:</strong> required_complete / required_active.
              Stale and blocked count as gaps even when assigned.
              not_applicable is excluded from the denominator.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
