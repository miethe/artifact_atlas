"use client";

/**
 * CoverageRulesTabPanel — "Coverage Rules" tab for the CoverageSlotTabRegistry (P2B-003).
 * Shows: coverage rule definitions and the slot's current evaluation.
 */

import * as React from "react";
import { useBom } from "@/lib/hooks/useBom";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

const COVERAGE_RULES = [
  {
    status: "missing",
    color: "bg-red-50 text-red-700 border-red-200",
    desc: "Required slot with no accepted assignment.",
  },
  {
    status: "partial",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Suggested only, or minimum asset count unmet.",
  },
  {
    status: "in_progress",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Accepted asset in raw or candidate state.",
  },
  {
    status: "complete",
    color: "bg-green-50 text-green-700 border-green-200",
    desc: "Canonical asset present and review satisfied.",
  },
  {
    status: "stale",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    desc: "Past staleness threshold or superseded by newer.",
  },
  {
    status: "blocked",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    desc: "Missing dependency or explicit blocker set.",
  },
] as const;

export default function CoverageRulesTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data: bom, isLoading } = useBom(projectId);
  const slot = (bom?.slots ?? []).find((s) => s.id === entityId);

  if (isLoading) return <PanelSkeleton />;

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Current evaluation */}
      {slot && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
            Current evaluation
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700">
              {slot.status}
            </span>
            <span className="text-xs text-[var(--ink-muted)]">
              {slot.required ? "required slot" : "optional slot"} •{" "}
              {slot.assignment_count} assignment{slot.assignment_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Rules reference */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          Status definitions
        </p>
        <ul className="space-y-1.5">
          {COVERAGE_RULES.map(({ status, color, desc }) => (
            <li key={status} className="flex items-start gap-2">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium capitalize border shrink-0 ${color}`}
              >
                {status}
              </span>
              <span className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                {desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
