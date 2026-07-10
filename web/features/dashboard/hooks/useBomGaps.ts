"use client";

/**
 * useBomGaps — missing/partial BOM slots for a project.
 * Shared by the KPI row (Open Tasks count) and MissingContextPanel (rows)
 * so the two always agree; react-query dedupes on the key.
 */

import { useQuery } from "@tanstack/react-query";
import { bomApi } from "@/lib/api";
import { FIXTURE_BOM } from "@/lib/fixtures";
import type { BomSlot } from "@/lib/types";

function filterGaps(slots: BomSlot[] | undefined | null): BomSlot[] {
  return (slots ?? []).filter(
    (s) => s.status === "missing" || s.status === "partial",
  );
}

export function useBomGaps(projectId: string) {
  return useQuery({
    queryKey: ["bom", projectId, "gaps"],
    queryFn: async () => {
      try {
        const bom = await bomApi.get(projectId);
        return filterGaps(bom.slots);
      } catch {
        return filterGaps(FIXTURE_BOM.slots);
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: filterGaps(FIXTURE_BOM.slots),
  });
}
