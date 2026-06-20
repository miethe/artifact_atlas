"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inboxApi } from "../api";
import { fixtureInboxPage } from "../fixtures";
import type { InboxImportRequest } from "../types";

// ============================================================
// Query Keys
// ============================================================

export const inboxKeys = {
  all: ["inbox"] as const,
  list: (projectId: string, params?: Record<string, unknown>) =>
    [...inboxKeys.all, projectId, params] as const,
};

// ============================================================
// useInboxItems
// ============================================================

export function useInboxItems(
  projectId: string | null | undefined,
  params?: {
    cursor?: string;
    limit?: number;
    source_kind?: string[];
  },
) {
  return useQuery({
    queryKey: inboxKeys.list(projectId ?? "", params),
    queryFn: async () => {
      if (!projectId) return fixtureInboxPage();
      try {
        return await inboxApi.list(projectId, params);
      } catch {
        return fixtureInboxPage(projectId);
      }
    },
    enabled: !!projectId,
    staleTime: 15_000,
    placeholderData: () => fixtureInboxPage(projectId ?? undefined),
  });
}

// ============================================================
// Mutations
// ============================================================

export function useImportToInbox(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InboxImportRequest) => inboxApi.import(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inboxKeys.all });
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
