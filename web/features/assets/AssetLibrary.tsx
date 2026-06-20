"use client";

/**
 * AssetLibrary — main client component for the asset library page.
 * Wires: FilterBar + URL state, ViewToggle, AssetGallery/Table, BulkActionBar, RightDrawer.
 * ViewModes: gallery (default), table. Board/timeline scaffolded but hidden.
 */

import * as React from "react";
import { clsx } from "clsx";
import { LayoutGrid, List, Plus } from "lucide-react";
import { RightDrawer } from "@/components/shell/RightDrawer";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAssets } from "@/lib/hooks/useAssets";
import type { Asset } from "@/lib/types";
import { FilterBar } from "./components/FilterBar";
import { AssetCard, AssetCardSkeleton } from "./components/AssetCard";
import { AssetTable } from "./components/AssetTable";
import { AssetDrawerContent } from "./components/AssetDrawerContent";
import { BulkActionBar } from "./components/BulkActionBar";
import { SortMenu } from "./components/SortMenu";
import { MetadataEditDialog } from "./components/MetadataEditForm";
import { useAssetFilters } from "./hooks/useAssetFilters";

// ============================================================
// View mode options
// ============================================================

type ViewMode = "gallery" | "table";

const VIEW_OPTIONS = [
  {
    value: "gallery" as ViewMode,
    label: "Gallery",
    icon: <LayoutGrid className="w-3.5 h-3.5" aria-hidden />,
    ariaLabel: "Gallery view",
  },
  {
    value: "table" as ViewMode,
    label: "Table",
    icon: <List className="w-3.5 h-3.5" aria-hidden />,
    ariaLabel: "Table view",
  },
];

// ============================================================
// Client-side sort helper
// ============================================================

function sortAssets(
  assets: Asset[],
  field: string,
  dir: "asc" | "desc",
): Asset[] {
  return [...assets].sort((a, b) => {
    let av: string | number | null = null;
    let bv: string | number | null = null;

    if (field === "title") {
      av = a.title.toLowerCase();
      bv = b.title.toLowerCase();
    } else if (field === "status") {
      av = a.status;
      bv = b.status;
    } else if (field === "size_bytes") {
      av = a.size_bytes ?? 0;
      bv = b.size_bytes ?? 0;
    } else {
      // Default: captured_at
      av = a.captured_at;
      bv = b.captured_at;
    }

    if (av === null) av = "";
    if (bv === null) bv = "";

    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ============================================================
// AssetLibrary
// ============================================================

export interface AssetLibraryProps {
  projectId: string;
}

export function AssetLibrary({ projectId }: AssetLibraryProps) {
  const { filters, sortField, sortDir, setFilters, setSort } = useAssetFilters();

  const [viewMode, setViewMode] = React.useState<ViewMode>("gallery");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [inspectAssetId, setInspectAssetId] = React.useState<string | null>(null);
  const [editAssetId, setEditAssetId] = React.useState<string | null>(null);

  // Data
  const { data, isLoading, isError } = useAssets(projectId, {
    q: filters.q,
    status: filters.status,
    sensitivity: filters.sensitivity,
    source_kind: filters.source_kind,
    artifact_type_id: filters.artifact_type_id,
  });

  const allAssets = data?.items ?? [];
  const totalCount = data?.total ?? allAssets.length;
  const sortedAssets = React.useMemo(
    () => sortAssets(allAssets, sortField, sortDir),
    [allAssets, sortField, sortDir],
  );

  // Inspected asset
  const inspectAsset = inspectAssetId
    ? sortedAssets.find((a) => a.id === inspectAssetId) ?? null
    : null;

  // Edit asset
  const editAsset = editAssetId
    ? sortedAssets.find((a) => a.id === editAssetId) ?? null
    : null;

  // Selection helpers
  const multiSelectActive = selectedIds.size > 0;

  function handleSelect(assetId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }

  function handleOpen(assetId: string) {
    setInspectAssetId((prev) => (prev === assetId ? null : assetId));
  }

  function handleCopyLink(assetId: string) {
    void navigator.clipboard.writeText(
      `${window.location.origin}/projects/${projectId}/assets/${assetId}`,
    );
  }

  const drawerOpen = !!inspectAssetId;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* FilterBar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        totalCount={isLoading ? undefined : totalCount}
      />

      {/* Toolbar: view toggle + sort + add */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        {/* View toggle */}
        <SegmentedControl
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          options={VIEW_OPTIONS}
          size="sm"
          iconOnly
          label="View mode"
        />

        {/* Sort */}
        <SortMenu field={sortField} dir={sortDir} onChange={setSort} />

        {/* BulkActionBar */}
        {selectedIds.size > 0 && (
          <BulkActionBar
            selectedIds={Array.from(selectedIds)}
            onClear={() => setSelectedIds(new Set())}
            className="mx-auto"
          />
        )}

        {/* Spacer + add button */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            iconLeft={<Plus aria-hidden className="w-3.5 h-3.5" />}
            aria-label="Add asset"
          >
            Add Asset
          </Button>
        </div>
      </div>

      {/* Content area: gallery/table + right drawer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div
          role="listbox"
          aria-label="Asset gallery"
          aria-multiselectable="true"
          className={clsx("flex-1 overflow-y-auto", drawerOpen ? "min-w-0" : "")}
        >
          {/* Error state */}
          {isError && (
            <div className="p-8 text-center">
              <EmptyState
                title="Failed to load assets"
                description="The API may be unavailable. Demo data shown below."
              />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && sortedAssets.length === 0 && (
            <div className="p-8">
              <EmptyState
                title="No assets found"
                description="Try adjusting your filters or add a new asset."
                action={
                  <Button variant="primary" size="sm" iconLeft={<Plus aria-hidden className="w-3.5 h-3.5" />}>
                    Add Asset
                  </Button>
                }
              />
            </div>
          )}

          {/* Gallery view */}
          {viewMode === "gallery" && (
            <div
              className={clsx(
                "p-4 grid gap-3",
                drawerOpen
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
              )}
            >
              {isLoading ? (
                <AssetCardSkeleton count={drawerOpen ? 4 : 8} />
              ) : (
                sortedAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={selectedIds.has(asset.id)}
                    multiSelectActive={multiSelectActive}
                    onSelect={handleSelect}
                    onOpen={handleOpen}
                    onCopyLink={handleCopyLink}
                    onAddToPack={(id) => setInspectAssetId(id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Table view */}
          {viewMode === "table" && (
            <AssetTable
              assets={sortedAssets}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onOpen={handleOpen}
              className="h-full"
            />
          )}
        </div>

        {/* Right Inspector Drawer — uses shell RightDrawer for focus-trap + Escape */}
        <RightDrawer
          open={drawerOpen}
          onClose={() => setInspectAssetId(null)}
          title="Inspector"
          width="md"
          overlay={false}
        >
          <AssetDrawerContent
            asset={inspectAsset}
            loading={isLoading}
            projectId={projectId}
            onEdit={(id) => setEditAssetId(id)}
            onCopyLink={handleCopyLink}
            onAddToPack={(id) => setInspectAssetId(id)}
          />
        </RightDrawer>
      </div>

      {/* Metadata edit dialog */}
      <MetadataEditDialog
        asset={editAsset}
        open={!!editAssetId}
        onClose={() => setEditAssetId(null)}
      />
    </div>
  );
}
