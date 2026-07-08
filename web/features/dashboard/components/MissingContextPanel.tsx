"use client";

/**
 * MissingContextPanel — BOM slots that are missing or partial.
 * Derived from the BOM hook; highlights gaps in artifact coverage.
 */

import * as React from "react";
import { clsx } from "clsx";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
import { PanelShell } from "./PanelShell";
import type { BomSlotStatus } from "@/lib/types";

// ============================================================
// Inline BOM hook (uses fixture-backed useBom pattern)
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { bomApi } from "@/lib/api";
import { FIXTURE_BOM } from "@/lib/fixtures";
import type { BomSlot } from "@/lib/types";

function useBomGaps(projectId: string) {
  return useQuery({
    queryKey: ["bom", projectId, "gaps"],
    queryFn: async () => {
      try {
        const bom = await bomApi.get(projectId);
        return (bom.slots ?? []).filter(
          (s) => s.status === "missing" || s.status === "partial",
        );
      } catch {
        return (FIXTURE_BOM.slots ?? []).filter(
          (s) => s.status === "missing" || s.status === "partial",
        );
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: (FIXTURE_BOM.slots ?? []).filter(
      (s) => s.status === "missing" || s.status === "partial",
    ),
  });
}

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

  return (
    <PanelShell
      title="Missing Context"
      subtitle="BOM gaps"
      icon={<AlertTriangle className="w-3.5 h-3.5" />}
      ariaLabel="Missing context — BOM slot gaps"
      viewAllHref={viewAllHref}
    >
      {isLoading && !gaps ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : !gaps || gaps.length === 0 ? (
        <EmptyState
          size="sm"
          title="All slots covered"
          description="No BOM gaps detected for this project."
          icon={<AlertTriangle className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {(gaps as BomSlot[]).map((slot) => {
            // High priority: a required slot with no coverage at all (P2-10 urgency treatment).
            const isHighPriority = slot.status === "missing" && !!slot.required;
            return (
              <li
                key={slot.id}
                className={clsx(
                  isHighPriority && "border-l-2 border-red-500 bg-red-50/40",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
                  <AlertTriangle
                    aria-hidden
                    className={`w-3.5 h-3.5 shrink-0 ${
                      slot.status === "missing"
                        ? "text-red-500"
                        : "text-amber-500"
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
                    {isHighPriority && (
                      <span
                        role="status"
                        aria-label="Needs attention: required slot with no coverage"
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wide"
                      >
                        Needs Attention
                      </span>
                    )}
                    <span
                      role="status"
                      aria-label={`Slot status: ${GAP_STATUS_LABELS[slot.status] ?? slot.status}`}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${GAP_STATUS_CLASSES[slot.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {GAP_STATUS_LABELS[slot.status] ?? slot.status}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}
