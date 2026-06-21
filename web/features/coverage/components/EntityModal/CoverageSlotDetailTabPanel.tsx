"use client";

/**
 * CoverageSlotDetailTabPanel — "Slot Detail" tab for the CoverageSlotTabRegistry (P2B-003).
 * Shows: slot status, required, domain, phase, assignment count, and BOM link.
 */

import * as React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBom } from "@/lib/hooks/useBom";
import { Button } from "@/components/ui/Button";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function CoverageSlotDetailTabPanel({
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
      {/* Slot name + status */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">
          Slot
        </p>
        <h3 className="text-sm font-semibold text-[var(--ink)]">{slot.name}</h3>
        <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700">
          {slot.status}
        </span>
      </div>

      {/* Key fields */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          ["Required", slot.required ? "Yes" : "No"],
          ["Domain", slot.domain ?? "—"],
          ["Phase", slot.phase ?? "—"],
          ["Assignments", slot.assignment_count],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
              {label}
            </span>
            <span className={`text-xs capitalize ${label === "Required" && slot.required ? "text-red-600 font-medium" : "text-[var(--ink)]"}`}>
              {String(value)}
            </span>
          </div>
        ))}
      </div>

      {/* Go to BOM slot */}
      <div className="px-4 py-3">
        <Link href={`/projects/${projectId}/bom`}>
          <Button
            variant="outline"
            size="xs"
            fullWidth
            iconRight={<ChevronRight aria-hidden className="w-3 h-3" />}
          >
            Go to BOM slot
          </Button>
        </Link>
      </div>
    </div>
  );
}
