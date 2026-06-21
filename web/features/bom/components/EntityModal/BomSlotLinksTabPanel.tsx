"use client";

/**
 * BomSlotLinksTabPanel — Links tab for the SlotTabRegistry (P2B-002).
 * Shows: coverage rules reference, artifact type link, BOM context.
 */

import * as React from "react";
import { useBom } from "@/lib/hooks/useBom";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function BomSlotLinksTabPanel({
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
      {/* Coverage rules */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          Coverage rules
        </p>
        <ul className="text-xs text-[var(--ink-muted)] space-y-1 list-disc list-inside">
          <li>missing: required slot, no accepted assignment</li>
          <li>partial: suggested only or min-count unmet</li>
          <li>in_progress: accepted asset in raw/candidate state</li>
          <li>complete: canonical asset + review satisfied</li>
          <li>stale: past staleness threshold or superseded</li>
          <li>blocked: missing dependency or explicit blocker</li>
        </ul>
      </div>

      {/* BOM context */}
      {bom && (
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
            BOM context
          </p>
          <div className="flex flex-col gap-1 text-xs text-[var(--ink-muted)]">
            <span>
              BOM:{" "}
              <span className="font-medium text-[var(--ink)]">{bom.name}</span>
            </span>
            <span>
              Total slots:{" "}
              <span className="font-medium text-[var(--ink)]">
                {(bom.slots ?? []).length}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
