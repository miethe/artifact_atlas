"use client";

/**
 * useAssetFilters — URL-state filters for the asset library.
 * Reads/writes URL search params for persistent, shareable filter state.
 * Falls back to useAssets (with fixtures) when backend is unreachable.
 */

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AgentAccess, AssetStatus, Sensitivity, SourceKind } from "@/lib/types";
import type { ActiveFilters, DatePreset } from "../components/FilterBar";
import type { SortField, SortDir } from "../components/SortMenu";

// ============================================================
// URL param helpers
// ============================================================

const DATE_PRESETS: DatePreset[] = ["24h", "7d", "30d", "90d", "year"];

function parseArray<T extends string>(params: URLSearchParams, key: string): T[] {
  return params.getAll(key) as T[];
}

function buildParams(
  filters: ActiveFilters,
  sortField: SortField,
  sortDir: SortDir,
): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.q) p.set("q", filters.q);
  if (filters.sensitivity) p.set("sensitivity", filters.sensitivity);
  if (filters.artifact_type_id) p.set("artifact_type_id", filters.artifact_type_id);
  if (filters.date) p.set("date", filters.date);
  if (filters.starred !== undefined) p.set("starred", String(filters.starred));
  if (filters.agent_access) p.set("agent_access", filters.agent_access);
  (filters.status ?? []).forEach((s) => p.append("status", s));
  (filters.source_kind ?? []).forEach((s) => p.append("source_kind", s));
  if (sortField !== "captured_at") p.set("sort_field", sortField);
  if (sortDir !== "desc") p.set("sort_dir", sortDir);
  return p;
}

// ============================================================
// Hook
// ============================================================

export interface UseAssetFiltersResult {
  filters: ActiveFilters;
  sortField: SortField;
  sortDir: SortDir;
  setFilters: (f: ActiveFilters) => void;
  setSort: (field: SortField, dir: SortDir) => void;
  clearAll: () => void;
  /** Query params ready for API consumption */
  apiFilters: ActiveFilters;
}

export function useAssetFilters(): UseAssetFiltersResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<ActiveFilters>(() => {
    const rawDate = searchParams.get("date");
    const rawStarred = searchParams.get("starred");
    return {
      q: searchParams.get("q") ?? undefined,
      status: parseArray<AssetStatus>(searchParams, "status"),
      sensitivity: (searchParams.get("sensitivity") as Sensitivity) || undefined,
      source_kind: parseArray<SourceKind>(searchParams, "source_kind"),
      artifact_type_id: searchParams.get("artifact_type_id") ?? undefined,
      date: rawDate && DATE_PRESETS.includes(rawDate as DatePreset)
        ? (rawDate as DatePreset)
        : undefined,
      starred: rawStarred === "true" ? true : rawStarred === "false" ? false : undefined,
      agent_access: (searchParams.get("agent_access") as AgentAccess) || undefined,
    };
  }, [searchParams]);

  const sortField = (searchParams.get("sort_field") as SortField) ?? "captured_at";
  const sortDir = (searchParams.get("sort_dir") as SortDir) ?? "desc";

  const push = useCallback(
    (nextFilters: ActiveFilters, nextSortField: SortField, nextSortDir: SortDir) => {
      const params = buildParams(nextFilters, nextSortField, nextSortDir);
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [pathname, router],
  );

  const setFilters = useCallback(
    (f: ActiveFilters) => push(f, sortField, sortDir),
    [push, sortField, sortDir],
  );

  const setSort = useCallback(
    (field: SortField, dir: SortDir) => push(filters, field, dir),
    [push, filters],
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  // API-ready filters (omit empty arrays)
  const apiFilters = useMemo<ActiveFilters>(() => ({
    q: filters.q,
    status: filters.status?.length ? filters.status : undefined,
    sensitivity: filters.sensitivity,
    source_kind: filters.source_kind?.length ? filters.source_kind : undefined,
    artifact_type_id: filters.artifact_type_id,
    date: filters.date,
    starred: filters.starred,
    agent_access: filters.agent_access,
  }), [filters]);

  return { filters, sortField, sortDir, setFilters, setSort, clearAll, apiFilters };
}
