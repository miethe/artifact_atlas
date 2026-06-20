"use client";

/**
 * Context Packs feature-local hooks.
 * Calls web/lib/api.ts (contextPacksApi + assetsApi) — do NOT import from web/lib/hooks/.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contextPacksApi, assetsApi } from "@/lib/api";
import { FIXTURE_CONTEXT_PACKS } from "./fixtures";
import type { ContextPack, ContextPackCreate, Asset } from "@/lib/types";
import type { BuilderDraft, PublishGate, TokenEstimate, BuilderItem } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ============================================================
// Query keys
// ============================================================

export const cpKeys = {
  all: ["context-packs"] as const,
  list: (projectId: string) =>
    [...cpKeys.all, "list", projectId] as const,
  detail: (packId: string) =>
    [...cpKeys.all, "detail", packId] as const,
  preview: (packId: string) =>
    [...cpKeys.all, "preview", packId] as const,
};

// ============================================================
// useContextPacks — list packs for a project
// ============================================================

export function useContextPacks(projectId: string) {
  return useQuery({
    queryKey: cpKeys.list(projectId),
    queryFn: async (): Promise<ContextPack[]> => {
      try {
        const page = await contextPacksApi.list(projectId, { limit: 200 });
        return page.items;
      } catch {
        return FIXTURE_CONTEXT_PACKS.filter(
          (p) => p.project_id === projectId,
        );
      }
    },
    staleTime: 30_000,
    placeholderData: FIXTURE_CONTEXT_PACKS.filter(
      (p) => p.project_id === projectId,
    ),
  });
}

// ============================================================
// useContextPack — single pack detail
// ============================================================

export function useContextPack(packId: string | null | undefined) {
  return useQuery({
    queryKey: cpKeys.detail(packId ?? ""),
    queryFn: async () => {
      if (!packId) return null;
      try {
        return await contextPacksApi.get(packId);
      } catch {
        return null;
      }
    },
    enabled: !!packId,
    staleTime: 30_000,
  });
}

// ============================================================
// useProjectAssets — assets available to include in pack
// ============================================================

export function useProjectAssets(projectId: string) {
  return useQuery({
    queryKey: ["assets", "list", projectId],
    queryFn: async (): Promise<Asset[]> => {
      try {
        const page = await assetsApi.list(projectId, { limit: 200 });
        return page.items;
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });
}

// ============================================================
// useCreateContextPack — mutation to create a draft pack
// ============================================================

export function useCreateContextPack(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContextPackCreate) =>
      contextPacksApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cpKeys.list(projectId) });
    },
  });
}

// ============================================================
// useUpdateContextPack — mutation to patch an existing pack
// ============================================================

export interface ContextPackUpdatePayload {
  packId: string;
  data: Partial<ContextPackCreate>;
}

export function useUpdateContextPack(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ packId, data }: ContextPackUpdatePayload) => {
      const response = await fetch(
        `${API_BASE}/api/context-packs/${packId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) throw new Error(`PATCH failed: ${response.status}`);
      return response.json() as Promise<ContextPack>;
    },
    onSuccess: (_data, { packId }) => {
      qc.invalidateQueries({ queryKey: cpKeys.list(projectId) });
      qc.invalidateQueries({ queryKey: cpKeys.detail(packId) });
    },
  });
}

// ============================================================
// usePreviewContextPack — fetch preview (token estimate + YAML)
// ============================================================

export interface ContextPackPreview {
  pack_id: string;
  token_estimate: number;
  manifest_yaml: string;
  sensitive_item_count?: number | null;
  warnings?: string[] | null;
}

export function usePreviewContextPack(packId: string | null | undefined) {
  return useQuery({
    queryKey: cpKeys.preview(packId ?? ""),
    queryFn: async (): Promise<ContextPackPreview | null> => {
      if (!packId) return null;
      const response = await fetch(
        `${API_BASE}/api/context-packs/${packId}/preview`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
      return response.json() as Promise<ContextPackPreview>;
    },
    enabled: !!packId,
    staleTime: 10_000,
    retry: false,
  });
}

// ============================================================
// useExportContextPack — export pack YAML to file
// ============================================================

export function useExportContextPack() {
  return useMutation({
    mutationFn: async ({
      packId,
      outputPath,
    }: {
      packId: string;
      outputPath?: string;
    }) => {
      const url = `${API_BASE}/api/context-packs/${packId}/export${outputPath ? `?output_path=${encodeURIComponent(outputPath)}` : ""}`;
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) throw new Error(`Export failed: ${response.status}`);
      return response.json() as Promise<{ pack_id: string; export_path: string }>;
    },
  });
}

// ============================================================
// usePublishContextPack — publish pack
// ============================================================

export function usePublishContextPack(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      packId,
      destination,
      outputPath,
    }: {
      packId: string;
      destination: string;
      outputPath?: string;
    }) => {
      const response = await fetch(
        `${API_BASE}/api/context-packs/${packId}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            output_path: outputPath ?? null,
          }),
        },
      );
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(
          (errJson as Record<string, { message?: string }>).error?.message ??
            `Publish failed: ${response.status}`,
        );
      }
      return response.json() as Promise<ContextPack>;
    },
    onSuccess: (_data, { packId }) => {
      qc.invalidateQueries({ queryKey: cpKeys.list(projectId) });
      qc.invalidateQueries({ queryKey: cpKeys.detail(packId) });
    },
  });
}

// ============================================================
// computePublishGate — pure helper (no hook)
// ============================================================

const SENSITIVE_LEVELS = new Set(["client_sensitive", "restricted"]);

export function computePublishGate(draft: BuilderDraft): PublishGate {
  const sensitiveItems = draft.items.filter(
    (item) => item.sensitivity && SENSITIVE_LEVELS.has(item.sensitivity),
  );

  // Pack-level sensitivity
  const packSensitive = SENSITIVE_LEVELS.has(draft.sensitivity);

  if (packSensitive) {
    return {
      canPublish: false,
      blockReason:
        "Pack sensitivity is client-sensitive or restricted. Review required before publish.",
      sensitiveItems,
    };
  }

  if (sensitiveItems.length > 0) {
    return {
      canPublish: false,
      blockReason: `${sensitiveItems.length} item(s) require review before publish (client_sensitive or restricted).`,
      sensitiveItems,
    };
  }

  return { canPublish: true, blockReason: null, sensitiveItems: [] };
}

// ============================================================
// computeTokenEstimate — pure helper (no hook)
// ============================================================

const TOKEN_ESTIMATE_BY_MODE: Record<string, number> = {
  metadata: 120,
  link_only: 30,
  preview: 400,
  summary: 800,
  full: 2500,
};

export function computeTokenEstimate(items: BuilderItem[]): TokenEstimate {
  const itemBreakdown = items.map((item) => ({
    label: item.label,
    tokens: TOKEN_ESTIMATE_BY_MODE[item.include_mode] ?? 200,
  }));

  const totalTokens = itemBreakdown.reduce((sum, i) => sum + i.tokens, 0);
  const contextWindowPct = Math.min(100, (totalTokens / 128_000) * 100);

  return { totalTokens, itemBreakdown, contextWindowPct };
}
