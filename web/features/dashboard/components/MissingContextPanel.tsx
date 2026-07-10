"use client";

/**
 * MissingContextPanel — "Missing Context / Attention Needed" per the
 * command-center mockup. BOM slots that are missing or partial, with
 * priority chips and an "N items need attention / Open all" footer.
 * Uses the shared useBomGaps hook (same data as the Open Tasks KPI).
 */

import * as React from "react";
import { clsx } from "clsx";
import { AlertTriangle } from "lucide-react";
import { EmptyState, SkeletonRow } from "@/components/ui";
import { PanelShell } from "./PanelShell";
import { useBomGaps } from "../hooks/useBomGaps";
import type { BomSlot, BomSlotStatus } from "@/lib/types";

// ============================================================
// Status label and accent color
// ============================================================

const GAP_STATUS_LABELS: Partial<Record<BomSlotStatus, string>> = {
  missing: "Missing",
  partial: "Partial",
};

const GAP_STATUS_CLASSES: Partial<Record<BomSlotStatus, string>> = {
  missing: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
};

// ============================================================
// Row + list
// ============================================================

function GapRow({ slot }: { slot: BomSlot }) {
  // High priority: a required slot with no coverage at all (P2-10 urgency treatment).
  const isHighPriority = slot.status === "missing" && !!slot.required;
  return (
    <div
      className={clsx(
        isHighPriority && "border-l-2 border-red-500 bg-red-50/40",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
        <AlertTriangle
          aria-hidden
          className={`w-3.5 h-3.5 shrink-0 ${
            slot.status === "missing" ? "text-red-500" : "text-amber-500"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
            {slot.name}
          </p>
          {slot.phase && (
            <p className="text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px capitalize">
              {slot.phase}
              {slot.required && (
                <span className="ml-1 text-red-500 font-semibold">
                  · Required
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Priority chip (mockup: High/Medium) */}
          <span
            role="status"
            aria-label={`Priority: ${isHighPriority ? "High" : "Medium"}`}
            className={clsx(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
              isHighPriority
                ? "bg-red-600 text-white"
                : "bg-amber-100 text-amber-700",
            )}
          >
            {isHighPriority ? "High" : "Medium"}
          </span>
          <span
            role="status"
            aria-label={`Slot status: ${GAP_STATUS_LABELS[slot.status] ?? slot.status}`}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${GAP_STATUS_CLASSES[slot.status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {GAP_STATUS_LABELS[slot.status] ?? slot.status}
          </span>
        </div>
      </div>
    </div>
  );
}

function GapList({ gaps }: { gaps: BomSlot[] }) {
  return (
    <ul role="list" className="divide-y divide-[var(--border)]">
      {gaps.map((slot) => (
        <li key={slot.id}>
          <GapRow slot={slot} />
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Component
// ============================================================

interface MissingContextPanelProps {
  projectId: string;
  viewAllHref?: string;
}

export function MissingContextPanel({
  projectId,
  viewAllHref,
}: MissingContextPanelProps) {
  const { data: gaps, isLoading } = useBomGaps(projectId);
  const gapList = gaps ?? [];
  const preview = gapList.slice(0, 6);

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-[var(--ink-faint)] tabular-nums">
        {gapList.length} item{gapList.length !== 1 ? "s" : ""} need
        {gapList.length === 1 ? "s" : ""} attention
      </span>
      {viewAllHref && (
        <a
          href={viewAllHref}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 focus-ring rounded"
        >
          Open all →
        </a>
      )}
    </div>
  );

  return (
    <PanelShell
      title="Missing Context / Attention Needed"
      subtitle="BOM gaps"
      icon={<AlertTriangle className="w-3.5 h-3.5" />}
      ariaLabel="Missing context — BOM slot gaps"
      viewAllHref={viewAllHref}
      footer={gapList.length > 0 ? footer : undefined}
      expandedContent={<GapList gaps={gapList} />}
    >
      {isLoading && !gaps ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : gapList.length === 0 ? (
        <EmptyState
          size="sm"
          title="All slots covered"
          description="No BOM gaps detected for this project."
          icon={<AlertTriangle className="w-8 h-8" />}
        />
      ) : (
        <GapList gaps={preview} />
      )}
    </PanelShell>
  );
}
