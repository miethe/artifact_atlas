"use client";

/**
 * BomSlotAssignmentsTabPanel — Assignments tab for the SlotTabRegistry (P2B-002).
 * Shows: assignment count, assignment status hints, and a placeholder for
 * the slot-assignment table (full implementation in P-assignments epic).
 */

import * as React from "react";
import { useBom } from "@/lib/hooks/useBom";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function BomSlotAssignmentsTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data: bom, isLoading } = useBom(projectId);
  const slot = (bom?.slots ?? []).find((s) => s.id === entityId);

  if (isLoading) return <PanelSkeleton />;

  if (!slot) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        BOM slot not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Summary */}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-2xl font-bold tabular-nums text-[var(--ink)]">
          {slot.assignment_count}
        </span>
        <div>
          <p className="text-xs font-medium text-[var(--ink)]">
            {slot.assignment_count === 1 ? "Assignment" : "Assignments"}
          </p>
          <p className="text-[11px] text-[var(--ink-muted)]">
            accepted for this slot
          </p>
        </div>
      </div>

      {/* Status guidance */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          Slot status: <span className="capitalize normal-case text-[var(--ink)]">{slot.status}</span>
        </p>
        {slot.assignment_count === 0 && slot.required && (
          <p className="text-xs text-red-600">
            This required slot has no accepted assignment. Assign an asset to satisfy it.
          </p>
        )}
        {slot.assignment_count === 0 && !slot.required && (
          <p className="text-xs text-[var(--ink-muted)]">
            No assignments yet. This slot is optional.
          </p>
        )}
        {slot.assignment_count > 0 && (
          <p className="text-xs text-[var(--ink-muted)]">
            {slot.assignment_count} asset{slot.assignment_count > 1 ? "s" : ""} accepted.
          </p>
        )}
      </div>

      {/* Full assignment table — deferred to P-assignments epic */}
      <div className="px-4 py-3">
        <p className="text-xs text-[var(--ink-faint)]">
          Full assignment table available in a future milestone.
        </p>
      </div>
    </div>
  );
}
