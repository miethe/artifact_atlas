"use client";

/**
 * detailApi — feature-local API helpers + hooks for the asset detail view.
 *
 * Covers surfaces not in web/lib/api.ts:
 *   - GET /api/assets/{assetId}/links
 *   - GET /api/assets/{assetId}/relationships
 *   - Context-pack item append (GET detail + PATCH items)
 *   - Asset activity (audit events filtered to this asset)
 *
 * Also defines the structured metadata conventions used by the detail view.
 * These live in the asset `metadata` dict and persist via the existing
 * PATCH /api/assets/{assetId}:
 *   metadata.provenance   { model, temperature, run_id, source_conversation, prompt_excerpt }
 *   metadata.annotations  [{ author, at, text }]
 *   metadata.associations { topic, feature, epic }
 *   metadata.policy       { allow_training, pii, auto_redact }
 *   metadata.ai_summary   string
 *   metadata.tags         string[]
 *   metadata.version      string (e.g. "v3")
 *   metadata.dimensions   string (e.g. "1024 × 768")
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiAbsoluteUrl, assetsApi, auditApi, contextPacksApi } from "@/lib/api";
import { assetKeys, useUpdateAsset } from "@/lib/hooks/useAssets";
import type {
  Asset,
  AssetLink,
  AssetRelationshipType,
  AuditEvent,
  CursorPage,
} from "@/lib/types";

// ============================================================
// Types
// ============================================================

/** Typed asset-to-asset relationship (matches backend AssetRelationship). */
export interface AssetRelationship {
  id: string;
  source_asset_id: string;
  target_asset_id: string;
  relationship_type: AssetRelationshipType;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** metadata.provenance */
export interface ProvenanceMeta {
  model?: string;
  temperature?: number | string;
  run_id?: string;
  source_conversation?: string;
  source_conversation_url?: string;
  prompt_excerpt?: string;
  generated_at?: string;
}

/** metadata.annotations[i] */
export interface AnnotationMeta {
  author?: string;
  at?: string;
  text: string;
}

/** metadata.associations */
export interface AssociationsMeta {
  topic?: string;
  feature?: string;
  epic?: string;
}

/** metadata.policy */
export interface PolicyMeta {
  allow_training?: boolean;
  pii?: boolean;
  auto_redact?: boolean;
}

/** Parsed view of the structured detail metadata conventions. */
export interface AssetDetailMeta {
  provenance: ProvenanceMeta;
  annotations: AnnotationMeta[];
  associations: AssociationsMeta;
  policy: PolicyMeta;
  aiSummary: string | null;
  tags: string[];
  version: string | null;
  dimensions: string | null;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** Parse the structured metadata conventions off an asset (fail-safe). */
export function readDetailMeta(asset: Asset | null | undefined): AssetDetailMeta {
  const md = asRecord(asset?.metadata);

  const annotationsRaw = Array.isArray(md.annotations) ? md.annotations : [];
  const annotations: AnnotationMeta[] = annotationsRaw
    .map((a) => asRecord(a))
    .filter((a) => typeof a.text === "string" && (a.text as string).length > 0)
    .map((a) => ({
      author: typeof a.author === "string" ? a.author : undefined,
      at: typeof a.at === "string" ? a.at : undefined,
      text: a.text as string,
    }));

  let tags: string[] = [];
  if (Array.isArray(md.tags)) {
    tags = md.tags.filter((t): t is string => typeof t === "string");
  } else if (typeof md.tags === "string") {
    tags = md.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  const dims = md.dimensions;
  const width = md.width;
  const height = md.height;
  const dimensions =
    typeof dims === "string"
      ? dims
      : typeof width === "number" && typeof height === "number"
        ? `${width} × ${height}`
        : null;

  return {
    provenance: asRecord(md.provenance) as ProvenanceMeta,
    annotations,
    associations: asRecord(md.associations) as AssociationsMeta,
    policy: asRecord(md.policy) as PolicyMeta,
    aiSummary: typeof md.ai_summary === "string" && md.ai_summary ? md.ai_summary : null,
    tags,
    version: typeof md.version === "string" && md.version ? md.version : null,
    dimensions,
  };
}

// ============================================================
// Local fetch helper (error-envelope aware; no edits to lib/api.ts)
// ============================================================

async function detailFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const response = await fetch(apiAbsoluteUrl(path), {
    method: init?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errJson = (await response.json()) as {
        error?: { message?: string };
      };
      message = errJson.error?.message ?? message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

// ============================================================
// Query keys
// ============================================================

export const assetDetailKeys = {
  links: (assetId: string) => ["assets", "detail", assetId, "links"] as const,
  relationships: (assetId: string) =>
    ["assets", "detail", assetId, "relationships"] as const,
  related: (assetId: string, ids: string[]) =>
    ["assets", "detail", assetId, "related", ids] as const,
  activity: (assetId: string, projectId: string) =>
    ["assets", "detail", assetId, "activity", projectId] as const,
};

// ============================================================
// Links + relationships
// ============================================================

export function useAssetLinks(assetId: string | null | undefined) {
  return useQuery({
    queryKey: assetDetailKeys.links(assetId ?? ""),
    queryFn: () =>
      detailFetch<CursorPage<AssetLink>>(`/api/assets/${assetId}/links?limit=200`),
    enabled: !!assetId,
    staleTime: 15_000,
    retry: false,
  });
}

export function useAssetRelationships(assetId: string | null | undefined) {
  return useQuery({
    queryKey: assetDetailKeys.relationships(assetId ?? ""),
    queryFn: () =>
      detailFetch<CursorPage<AssetRelationship>>(
        `/api/assets/${assetId}/relationships?direction=both&limit=200`,
      ),
    enabled: !!assetId,
    staleTime: 15_000,
    retry: false,
  });
}

/** Fetch counterpart assets for a set of relationships (missing ones dropped). */
export function useRelatedAssets(
  assetId: string,
  relationships: AssetRelationship[] | undefined,
) {
  const counterpartIds = Array.from(
    new Set(
      (relationships ?? []).map((r) =>
        r.source_asset_id === assetId ? r.target_asset_id : r.source_asset_id,
      ),
    ),
  ).sort();

  return useQuery({
    queryKey: assetDetailKeys.related(assetId, counterpartIds),
    queryFn: async () => {
      const results = await Promise.all(
        counterpartIds.map((id) => assetsApi.get(id).catch(() => null)),
      );
      return results.filter((a): a is Asset => a !== null);
    },
    enabled: counterpartIds.length > 0,
    staleTime: 30_000,
  });
}

// ============================================================
// Activity (audit events for this asset)
// ============================================================

export function useAssetActivity(
  assetId: string | null | undefined,
  projectId: string | null | undefined,
) {
  return useQuery({
    queryKey: assetDetailKeys.activity(assetId ?? "", projectId ?? ""),
    queryFn: async () => {
      const page = await auditApi.list({ project_id: projectId ?? undefined, limit: 200 });
      return page.items.filter(
        (e: AuditEvent) => e.target_id === assetId,
      );
    },
    enabled: !!assetId && !!projectId,
    staleTime: 30_000,
    retry: false,
  });
}

// ============================================================
// Metadata merge mutation
// ============================================================

/**
 * Merge a patch into the asset metadata dict and persist via PATCH.
 * The backend replaces the metadata dict wholesale, so we merge
 * client-side against the latest known asset.
 */
export function useMergeAssetMetadata(asset: Asset) {
  const update = useUpdateAsset(asset.id);

  function merge(
    patch: Record<string, unknown>,
    opts?: { onSuccess?: () => void },
  ) {
    update.mutate(
      { metadata: { ...asRecord(asset.metadata), ...patch } },
      { onSuccess: opts?.onSuccess },
    );
  }

  return { merge, isPending: update.isPending, isError: update.isError, error: update.error };
}

// ============================================================
// Summarize
// ============================================================

export function useSummarizeAsset(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      detailFetch<{ asset_id: string; status: string; note?: string }>(
        `/api/assets/${assetId}/summarize`,
        { method: "POST" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
    },
  });
}

// ============================================================
// Context packs — list for project + append asset as pack item
// ============================================================

/** Backend context-pack shape (uses `title`; web types.ts uses `name`). */
interface PackHeader {
  id: string;
  title?: string;
  name?: string;
  status?: string;
}

interface PackItem {
  item_type: string;
  item_id: string;
  include_mode: string;
  display_order?: number | null;
  required?: boolean;
}

interface PackDetail extends PackHeader {
  items?: PackItem[] | null;
}

export function usePackOptions(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ["context-packs", "options", projectId],
    queryFn: async () => {
      const page = await contextPacksApi.list(projectId ?? "", { limit: 100 });
      return (page.items as unknown as PackHeader[]).map((p) => ({
        id: p.id,
        label: p.title ?? p.name ?? p.id,
        status: p.status ?? "draft",
      }));
    },
    enabled: !!projectId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAddAssetToPack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ packId, assetId }: { packId: string; assetId: string }) => {
      const detail = await detailFetch<PackDetail>(`/api/context-packs/${packId}`);
      const existing = detail.items ?? [];
      if (existing.some((i) => i.item_type === "asset" && i.item_id === assetId)) {
        return { alreadyPresent: true as const, packId };
      }
      const items = [
        ...existing.map((i) => ({
          item_type: i.item_type,
          item_id: i.item_id,
          include_mode: i.include_mode,
          display_order: i.display_order ?? undefined,
          required: i.required ?? false,
        })),
        {
          item_type: "asset",
          item_id: assetId,
          include_mode: "preview",
          display_order: existing.length,
          required: false,
        },
      ];
      await detailFetch(`/api/context-packs/${packId}`, {
        method: "PATCH",
        body: { items },
      });
      return { alreadyPresent: false as const, packId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["context-packs"] });
    },
  });
}
