"use client";

/**
 * Feature-local coverage hook with domain grouping and gap data.
 * Falls back to fixture data when backend is unavailable.
 */

import { useQuery } from "@tanstack/react-query";
import { bomApi } from "@/lib/api";
import { bomKeys } from "@/lib/hooks/useBom";
import type { BomSlot, CoverageSummary } from "@/lib/types";

// Extended coverage shape that includes domain breakdown
export interface DomainCoverage {
  domain: string;
  total: number;
  filled: number;
  required: number;
  required_complete: number;
  coverage_pct: number;
}

export interface ExtendedCoverage extends CoverageSummary {
  required_slots: number;
  required_complete: number;
  optional_slots: number;
  optional_complete: number;
  stale_count: number;
  blocked_count: number;
  partial_count: number;
  by_domain: DomainCoverage[];
}

function computeExtendedCoverage(bom_id: string, slots: BomSlot[]): ExtendedCoverage {
  const activeSlots = slots.filter((s) => s.status !== "not_applicable");
  const required = activeSlots.filter((s) => s.required);
  const optional = activeSlots.filter((s) => !s.required);

  const required_complete = required.filter((s) => s.status === "complete").length;
  const optional_complete = optional.filter((s) => s.status === "complete").length;

  const filled = activeSlots.filter(
    (s) => s.status === "complete" || s.status === "in_progress",
  ).length;

  const coverage_pct =
    required.length > 0 ? Math.round((required_complete / required.length) * 100) : 0;

  // Domain breakdown
  const domainMap = new Map<string, BomSlot[]>();
  for (const slot of slots) {
    const d = slot.domain ?? "uncategorized";
    if (!domainMap.has(d)) domainMap.set(d, []);
    domainMap.get(d)!.push(slot);
  }

  const by_domain: DomainCoverage[] = Array.from(domainMap.entries()).map(
    ([domain, dslots]) => {
      const dActive = dslots.filter((s) => s.status !== "not_applicable");
      const dRequired = dActive.filter((s) => s.required);
      const dRequiredComplete = dRequired.filter((s) => s.status === "complete").length;
      const dFilled = dActive.filter(
        (s) => s.status === "complete" || s.status === "in_progress",
      ).length;
      const dPct = dRequired.length > 0
        ? Math.round((dRequiredComplete / dRequired.length) * 100)
        : dActive.length === 0 ? 100 : 0;
      return {
        domain,
        total: dslots.length,
        filled: dFilled,
        required: dRequired.length,
        required_complete: dRequiredComplete,
        coverage_pct: dPct,
      };
    },
  );

  return {
    bom_id,
    total_slots: slots.length,
    filled_slots: filled,
    missing_slots: slots.filter((s) => s.status === "missing").length,
    coverage_pct,
    required_slots: required.length,
    required_complete,
    optional_slots: optional.length,
    optional_complete,
    stale_count: slots.filter((s) => s.status === "stale").length,
    blocked_count: slots.filter((s) => s.status === "blocked").length,
    partial_count: slots.filter((s) => s.status === "partial").length,
    by_domain,
  };
}

export function useBomCoverageExtended(
  bomId: string | null | undefined,
  slots: BomSlot[],
) {
  return useQuery({
    queryKey: [...bomKeys.coverage(bomId ?? ""), "extended"],
    queryFn: async (): Promise<ExtendedCoverage> => {
      if (!bomId) {
        return computeExtendedCoverage("", slots);
      }
      try {
        const summary = await bomApi.getCoverage(bomId, "domain");
        // Augment with local slot computation for extended fields
        return {
          ...computeExtendedCoverage(bomId, slots),
          by_domain:
            summary.by_domain?.map((d) => ({
              domain: d.domain,
              total: d.total,
              filled: d.filled,
              required: d.total,
              required_complete: d.filled,
              coverage_pct: d.coverage_pct,
            })) ?? computeExtendedCoverage(bomId, slots).by_domain,
        };
      } catch {
        return computeExtendedCoverage(bomId, slots);
      }
    },
    enabled: true,
    staleTime: 30_000,
  });
}
