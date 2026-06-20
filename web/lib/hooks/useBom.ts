"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bomApi } from "../api";
import { FIXTURE_BOM } from "../fixtures";
import type { SlotAssignRequest } from "../types";

// ============================================================
// Query Keys
// ============================================================

export const bomKeys = {
  all: ["bom"] as const,
  project: (projectId: string) =>
    [...bomKeys.all, "project", projectId] as const,
  coverage: (bomId: string) =>
    [...bomKeys.all, "coverage", bomId] as const,
  gaps: (bomId: string) =>
    [...bomKeys.all, "gaps", bomId] as const,
};

// ============================================================
// useBom
// ============================================================

export function useBom(projectId: string | null | undefined) {
  return useQuery({
    queryKey: bomKeys.project(projectId ?? ""),
    queryFn: async () => {
      if (!projectId) return FIXTURE_BOM;
      try {
        return await bomApi.get(projectId);
      } catch {
        return FIXTURE_BOM;
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: FIXTURE_BOM,
  });
}

// ============================================================
// useCoverage
// ============================================================

export function useCoverage(
  bomId: string | null | undefined,
  groupBy?: "domain" | "phase" | "template",
) {
  return useQuery({
    queryKey: bomKeys.coverage(bomId ?? ""),
    queryFn: async () => {
      if (!bomId) {
        return {
          bom_id: "bom_artifact_atlas_mvp",
          total_slots: 5,
          filled_slots: 2,
          missing_slots: 3,
          coverage_pct: 40,
        };
      }
      try {
        return await bomApi.getCoverage(bomId, groupBy);
      } catch {
        return {
          bom_id: bomId,
          total_slots: 5,
          filled_slots: 2,
          missing_slots: 3,
          coverage_pct: 40,
        };
      }
    },
    enabled: !!bomId,
    staleTime: 30_000,
  });
}

// ============================================================
// Mutations
// ============================================================

export function useAssignSlot(slotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SlotAssignRequest) => bomApi.assignSlot(slotId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
    },
  });
}
