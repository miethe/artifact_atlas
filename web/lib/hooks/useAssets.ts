"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "../api";
import { fixtureAssetsPage, FIXTURE_ASSETS } from "../fixtures";
import type {
  Asset,
  AssetCreate,
  AssetFilters,
  AssetLinkCreate,
  AssetPromoteRequest,
  AssetUpdate,
  SlotAssignRequest,
} from "../types";

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
  filters?: AssetFilters,
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
