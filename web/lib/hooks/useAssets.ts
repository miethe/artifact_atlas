"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi, searchApi } from "../api";
import { fixtureAssetsPage, FIXTURE_ASSETS } from "../fixtures";
import type {
  Asset,
  AssetBrowseParams,
  AssetCreate,
  AssetFilters,
  AssetLinkCreate,
  AssetPromoteRequest,
  AssetUpdate,
  SearchResult,
  SlotAssignRequest,
} from "../types";

// ============================================================
// List filter superset (WS-3): additive backend list params.
// Kept feature-local (here) instead of widening the shared AssetFilters type.
// ============================================================

export interface AssetListFilters extends AssetFilters {
  /** ISO timestamp — only assets captured at/after this instant. */
  captured_after?: string;
  /** ISO timestamp — only assets captured at/before this instant. */
  captured_before?: string;
  /** Filter by metadata.starred flag. */
  starred?: boolean;
}

// ============================================================
// Query Keys
// ============================================================

export const assetKeys = {
  all: ["assets"] as const,
  lists: () => [...assetKeys.all, "list"] as const,
  list: (projectId: string, filters?: AssetFilters) =>
    [...assetKeys.lists(), projectId, filters] as const,
  detail: (id: string) => [...assetKeys.all, "detail", id] as const,
};

// ============================================================
// useAssets — list assets for a project with filters
// ============================================================

export function useAssets(
  projectId: string | null | undefined,
  filters?: AssetListFilters,
) {
  return useQuery({
    queryKey: assetKeys.list(projectId ?? "", filters),
    queryFn: async () => {
      if (!projectId) return fixtureAssetsPage();
      try {
        return await assetsApi.list(projectId, filters);
      } catch {
        return fixtureAssetsPage(projectId);
      }
    },
    enabled: !!projectId,
    staleTime: 15_000,
    placeholderData: () => fixtureAssetsPage(projectId ?? undefined),
  });
}

// Alias for search-oriented usage
export const useAssetSearch = useAssets;

// ============================================================
// useAssetBrowse — cross-project browse view (M4 AC2)
// Backed by GET /api/search with no project_id, so it spans every project.
// ============================================================

function fixtureBrowseResults(): SearchResult[] {
  return FIXTURE_ASSETS.map((a) => ({
    asset_id: a.id,
    title: a.title,
    score: 1,
    status: a.status,
    sensitivity: a.sensitivity,
    source_kind: a.source_kind,
    artifact_type_id: a.artifact_type_id ?? null,
    project_id: a.project_id ?? null,
    tags: a.tags ?? [],
  }));
}

export const assetBrowseKeys = {
  all: ["assets", "browse"] as const,
  list: (params?: AssetBrowseParams) => [...assetBrowseKeys.all, params] as const,
};

export function useAssetBrowse(params?: AssetBrowseParams) {
  return useQuery({
    queryKey: assetBrowseKeys.list(params),
    queryFn: async () => {
      try {
        return await searchApi.browse(params);
      } catch {
        return { results: fixtureBrowseResults(), total: FIXTURE_ASSETS.length };
      }
    },
    staleTime: 15_000,
  });
}

// ============================================================
// useAsset — single asset detail
// ============================================================

export function useAsset(assetId: string | null | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(assetId ?? ""),
    queryFn: async () => {
      if (!assetId) throw new Error("No assetId");
      try {
        return await assetsApi.get(assetId);
      } catch {
        const fixture = FIXTURE_ASSETS.find((a) => a.id === assetId);
        if (fixture) return fixture;
        throw new Error(`Asset ${assetId} not found in fixtures`);
      }
    },
    enabled: !!assetId,
    staleTime: 15_000,
  });
}

// ============================================================
// Mutations
// ============================================================

export function useCreateAsset(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetCreate) => assetsApi.create(projectId, data),
    onSuccess: (asset: Asset) => {
      qc.invalidateQueries({ queryKey: assetKeys.lists() });
      qc.setQueryData(assetKeys.detail(asset.id), asset);
    },
  });
}

export function useUpdateAsset(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetUpdate) => assetsApi.update(assetId, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: assetKeys.detail(assetId) });
      const previous = qc.getQueryData<Asset>(assetKeys.detail(assetId));
      if (previous) {
        qc.setQueryData(assetKeys.detail(assetId), { ...previous, ...data });
      }
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(assetKeys.detail(assetId), ctx.previous);
      }
    },
    onSuccess: (asset: Asset) => {
      qc.setQueryData(assetKeys.detail(asset.id), asset);
      qc.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function usePromoteAsset(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetPromoteRequest) => assetsApi.promote(assetId, data),
    onSuccess: (asset: Asset) => {
      qc.setQueryData(assetKeys.detail(asset.id), asset);
      qc.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
}

export function useLinkAsset(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetLinkCreate) => assetsApi.link(assetId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
    },
  });
}

export function useAssignAssetToSlot(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SlotAssignRequest) => assetsApi.assignSlot(assetId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      qc.invalidateQueries({ queryKey: ["bom"] });
    },
  });
}

export function useImportAsset(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetCreate) => assetsApi.create(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.lists() });
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}
