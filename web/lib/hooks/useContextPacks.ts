"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contextPacksApi } from "../api";
import { fixtureContextPacksPage } from "../fixtures";
import type { ContextPackCreate } from "../types";

// ============================================================
// Query Keys
// ============================================================

export const contextPackKeys = {
  all: ["context-packs"] as const,
  list: (projectId: string, params?: Record<string, unknown>) =>
    [...contextPackKeys.all, "list", projectId, params] as const,
  detail: (packId: string) =>
    [...contextPackKeys.all, "detail", packId] as const,
};

// ============================================================
// useContextPacks
// ============================================================

export function useContextPacks(
  projectId: string | null | undefined,
  params?: {
    cursor?: string;
    limit?: number;
    status?: string;
    audience?: string;
  },
) {
  return useQuery({
    queryKey: contextPackKeys.list(projectId ?? "", params),
    queryFn: async () => {
      if (!projectId) return fixtureContextPacksPage();
      try {
        return await contextPacksApi.list(projectId, params);
      } catch {
        return fixtureContextPacksPage(projectId);
      }
    },
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: () => fixtureContextPacksPage(projectId ?? undefined),
  });
}

// ============================================================
// useContextPack — single pack
// ============================================================

export function useContextPack(packId: string | null | undefined) {
  return useQuery({
    queryKey: contextPackKeys.detail(packId ?? ""),
    queryFn: async () => {
      if (!packId) throw new Error("No packId");
      try {
        return await contextPacksApi.get(packId);
      } catch {
        throw new Error(`Context pack ${packId} not found`);
      }
    },
    enabled: !!packId,
    staleTime: 30_000,
  });
}

// ============================================================
// Mutations
// ============================================================

export function useCreateContextPack(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContextPackCreate) =>
      contextPacksApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contextPackKeys.all });
    },
  });
}
