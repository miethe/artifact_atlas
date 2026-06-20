"use client";

/**
 * Feature-local BOM slot hooks.
 * Wraps the global useBom/useAssignSlot with slot-level granularity
 * and adds unassign, mark N/A, and request-asset mutations.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bomKeys } from "@/lib/hooks/useBom";
import { bomApi } from "@/lib/api";
import type { BomSlot, BomSlotStatus, SlotAssignRequest } from "@/lib/types";

// ============================================================
// useSlotAssign
// ============================================================

export function useSlotAssign(slotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SlotAssignRequest) => bomApi.assignSlot(slotId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
    },
  });
}

// ============================================================
// useSlotUnassign
// ============================================================

export function useSlotUnassign(slotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      // DELETE /api/bom/slots/:slotId/assignments/:assignmentId
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/bom/slots/${slotId}/assignments/${assignmentId}`,
        { method: "DELETE", headers: { Accept: "application/json" } },
      );
      if (!response.ok && response.status !== 204) {
        throw new Error(`Unassign failed: ${response.status}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
    },
  });
}

// ============================================================
// useSlotMarkNA
// ============================================================

export function useSlotMarkNA(slotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/bom/slots/${slotId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ status: "not_applicable" satisfies BomSlotStatus }),
        },
      );
      if (!response.ok) throw new Error(`Mark N/A failed: ${response.status}`);
      return response.json() as Promise<BomSlot>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
    },
  });
}

// ============================================================
// useSlotRequestAsset
// ============================================================

export interface RequestAssetPayload {
  notes?: string;
  urgency?: "low" | "medium" | "high";
}

export function useSlotRequestAsset(slotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RequestAssetPayload) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/bom/slots/${slotId}/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
    },
  });
}
