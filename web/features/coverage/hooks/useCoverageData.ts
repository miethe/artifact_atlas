"use client";

/**
 * useCoverageData — feature-local hook for Coverage & Gaps dashboard.
 * Composes useBom + useCoverage from lib/hooks and adds gap-slot convenience.
 */

import { useQuery } from "@tanstack/react-query";
import { useBom, useCoverage } from "@/lib/hooks/useBom";
import { bomApi } from "@/lib/api";
import type { BomSlot, BomSlotStatus } from "@/lib/types";

// ============================================================
// Gap recommendation shape (feature-local)
// ============================================================

/**
 * Priority tiers aligned with the backend GapRecommendation model
 * (api/app/models/bom.py): "high" | "medium" | "low".
 * The former frontend-only "critical" tier maps to "high" — required missing
 * slots surface as high-priority with a distinct recommendation message.
 */
export interface GapRecommendation {
  slotId: string;
  slotName: string;
  domain: string | null;
  phase: string | null;
  status: BomSlotStatus;
  priority: "high" | "medium" | "low";
  /** True when the slot is required AND status is missing — used for urgent styling. */
  isRequiredMissing?: boolean;
  recommendation: string;
}

// ============================================================
// Fixture gaps (fallback when API unreachable)
// ============================================================

function buildFixtureGaps(slots: BomSlot[]): GapRecommendation[] {
  const GAP_STATUSES: BomSlotStatus[] = [
    "missing",
    "partial",
    "stale",
    "blocked",
  ];
  return slots
    .filter((s) => GAP_STATUSES.includes(s.status))
    .map((s) => {
      const isCritical = s.required && s.status === "missing";
      const isStale = s.status === "stale";
      const isBlocked = s.status === "blocked";
      return {
        slotId: s.id,
        slotName: s.name,
        domain: s.domain ?? null,
        phase: s.phase ?? null,
        status: s.status,
        priority: isStale || isBlocked ? "high" : isCritical ? "high" : "medium",
        isRequiredMissing: isCritical,
        recommendation: isCritical
          ? `No asset assigned to required slot "${s.name}". Assign or upload a matching artifact.`
          : isStale
            ? `Asset for "${s.name}" is stale. Refresh or replace with a current version.`
            : isBlocked
              ? `"${s.name}" is blocked by an unresolved dependency. Resolve the blocker first.`
              : `Slot "${s.name}" has only a partial or suggested assignment. Confirm or replace.`,
      };
    });
}

// ============================================================
// useCoverageData
// ============================================================

export function useCoverageData(projectId: string | null | undefined) {
  const bomQuery = useBom(projectId);
  const bomId = bomQuery.data?.id ?? null;

  const coverageQuery = useCoverage(bomId, "domain");

  // Gaps — feature-local query that falls back to BOM slots
  const gapsQuery = useQuery({
    queryKey: ["coverage", "gaps", bomId ?? ""],
    queryFn: async (): Promise<GapRecommendation[]> => {
      if (!bomId) return [];
      try {
        const res = await bomApi.getGaps(bomId);
        return buildFixtureGaps(res.gaps ?? []);
      } catch {
        // Fall back to BOM slots already loaded
        const slots = bomQuery.data?.slots ?? [];
        return buildFixtureGaps(slots);
      }
    },
    enabled: !!bomId || !!bomQuery.data?.slots,
    staleTime: 30_000,
    placeholderData: bomQuery.data?.slots
      ? buildFixtureGaps(bomQuery.data.slots)
      : [],
  });

  return {
    bom: bomQuery.data,
    coverage: coverageQuery.data,
    gaps: gapsQuery.data ?? [],
    isLoading: bomQuery.isLoading || coverageQuery.isLoading,
    isError: bomQuery.isError || coverageQuery.isError,
    refetch: () => {
      bomQuery.refetch();
      coverageQuery.refetch();
      gapsQuery.refetch();
    },
  };
}
