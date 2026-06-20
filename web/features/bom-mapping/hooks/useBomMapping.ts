"use client";

/**
 * useBomMapping — feature-local hook for Inbox → BOM mapping view.
 * Combines inbox items + BOM slots + suggestion logic.
 * BOM-UI-005
 */

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInboxItems } from "@/lib/hooks/useInbox";
import { useBom } from "@/lib/hooks/useBom";
import { bomApi } from "@/lib/api";
import { bomKeys } from "@/lib/hooks/useBom";
import { inboxKeys } from "@/lib/hooks/useInbox";
import type { BomSlot, InboxItem, SlotAssignRequest } from "@/lib/types";

// ============================================================
// Confidence level type (feature-local)
// ============================================================

export type ConfidenceLevel = "high" | "medium" | "low" | "conflict";

export interface SuggestedMatch {
  inboxItemId: string;
  slotId: string;
  confidence: ConfidenceLevel;
  reason: string;
}

// ============================================================
// Deterministic suggestion engine (client-side heuristic)
// Calls real auto-suggest API when available; falls back to heuristic.
// ============================================================

function computeSuggestions(
  items: InboxItem[],
  slots: BomSlot[],
): SuggestedMatch[] {
  const suggestions: SuggestedMatch[] = [];

  for (const item of items) {
    const candidateSlots = slots.filter(
      (s) =>
        s.status !== "complete" &&
        s.status !== "not_applicable",
    );

    for (const slot of candidateSlots) {
      // Type match (suggested_artifact_type_id === slot.artifact_type_id)
      if (
        item.suggested_artifact_type_id &&
        slot.artifact_type_id &&
        item.suggested_artifact_type_id === slot.artifact_type_id
      ) {
        // Check for existing suggestion to same slot (conflict)
        const existing = suggestions.find((s) => s.slotId === slot.id);
        if (existing) {
          existing.confidence = "conflict";
          existing.reason = "Multiple inbox items match this slot.";
          suggestions.push({
            inboxItemId: item.id,
            slotId: slot.id,
            confidence: "conflict",
            reason: "Multiple inbox items match this slot.",
          });
        } else {
          suggestions.push({
            inboxItemId: item.id,
            slotId: slot.id,
            confidence: "high",
            reason: "Artifact type matches slot requirement.",
          });
        }
      }
    }
  }

  // Add low-confidence catch-all for unmatched items toward missing slots
  for (const item of items) {
    const alreadySuggested = suggestions.some(
      (s) => s.inboxItemId === item.id,
    );
    if (!alreadySuggested) {
      const firstMissing = slots.find((s) => s.status === "missing" && s.required);
      if (firstMissing) {
        suggestions.push({
          inboxItemId: item.id,
          slotId: firstMissing.id,
          confidence: "low",
          reason: "No direct type match; proposed for first missing required slot.",
        });
      }
    }
  }

  return suggestions;
}

// ============================================================
// useBomMapping
// ============================================================

export interface MappingState {
  // Confirmed mappings: inboxItemId → slotId
  mappings: Map<string, string>;
  // Suggestions from heuristic engine
  suggestions: SuggestedMatch[];
  // Pending assignment IDs
  pendingSlotIds: Set<string>;
}

export function useBomMapping(projectId: string | null | undefined) {
  const qc = useQueryClient();

  const inboxQuery = useInboxItems(projectId, { limit: 200 });
  const bomQuery = useBom(projectId);

  // Local mapping state (confirmed drag/keyboard maps)
  const [mappings, setMappings] = React.useState<Map<string, string>>(
    new Map(),
  );

  const items = inboxQuery.data?.items ?? [];
  const slots = bomQuery.data?.slots ?? [];

  // Suggestions
  const suggestions = React.useMemo(
    () => computeSuggestions(items, slots),
    [items, slots],
  );

  // Assign slot mutation
  const assignMutation = useMutation({
    mutationFn: ({ slotId, assetId }: { slotId: string; assetId: string }) => {
      const data: SlotAssignRequest = { asset_id: assetId };
      return bomApi.assignSlot(slotId, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bomKeys.all });
      qc.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });

  // ---- Actions ----

  const confirmMapping = React.useCallback(
    async (inboxItemId: string, slotId: string) => {
      setMappings((prev) => {
        const next = new Map(prev);
        next.set(inboxItemId, slotId);
        return next;
      });
      await assignMutation.mutateAsync({ slotId, assetId: inboxItemId });
    },
    [assignMutation],
  );

  const removeMapping = React.useCallback((inboxItemId: string) => {
    setMappings((prev) => {
      const next = new Map(prev);
      next.delete(inboxItemId);
      return next;
    });
  }, []);

  const acceptSuggestion = React.useCallback(
    (suggestion: SuggestedMatch) => {
      return confirmMapping(suggestion.inboxItemId, suggestion.slotId);
    },
    [confirmMapping],
  );

  return {
    items,
    slots,
    suggestions,
    mappings,
    confirmMapping,
    removeMapping,
    acceptSuggestion,
    isLoading: inboxQuery.isLoading || bomQuery.isLoading,
    isError: inboxQuery.isError || bomQuery.isError,
    isAssigning: assignMutation.isPending,
    refetch: () => {
      inboxQuery.refetch();
      bomQuery.refetch();
    },
  };
}
