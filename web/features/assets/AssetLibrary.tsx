"use client";

/**
 * AssetLibrary — main client component for the asset library page.
 * Wires: FilterBar + URL state, view tabs (Gallery | Table | Board | Timeline),
 * sort/count/density toolbar, AssetGallery/Table/Board/Timeline, BulkActionBar.
 *
 * P2b: When flag:ui-tabbed-modal (or flag:ui-tabbed-modal-asset) is on, asset
 * inspection uses EntityModal (URL-driven, tabbed). Legacy RightDrawer + AssetDrawerContent
 * remain available when both flags are off.
 */

import * as React from "react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Plus, FolderOpen, AlertCircle } from "lucide-react";
import { RightDrawer } from "@/components/shell/RightDrawer";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAssets } from "@/lib/hooks/useAssets";
import { useProjects } from "@/lib/hooks/useProjects";
import { isFlagEnabled } from "@/lib/flags";
import type { Asset } from "@/lib/types";
import { FilterBar, datePresetToCapturedAfter } from "./components/FilterBar";
import type { FilterOption } from "./components/FilterBar";
import { AssetCard, AssetCardSkeleton } from "./components/AssetCard";
import type { CardDensity } from "./components/AssetCard";
import { AssetTable } from "./components/AssetTable";
import { AssetBoardView } from "./components/AssetBoardView";
import { AssetTimelineView } from "./components/AssetTimelineView";
import { AssetDrawerContent } from "./components/AssetDrawerContent";
import { BulkActionBar } from "./components/BulkActionBar";
import { SortMenu } from "./components/SortMenu";
import { MetadataEditDialog } from "./components/MetadataEditForm";
import { useAssetFilters } from "./hooks/useAssetFilters";
import { EntityModal, useEntityModalUrl } from "@/features/ui/components/EntityModal";
import { ASSET_TAB_REGISTRY } from "./components/EntityModal/AssetTabRegistry";

// ============================================================
// View mode tabs
// ============================================================

type ViewMode = "gallery" | "table" | "board" | "timeline";

const VIEW_TABS: { value: ViewMode; label: string }[] = [
  { value: "gallery", label: "Gallery" },
  { value: "table", label: "Table" },
  { value: "board", label: "Board" },
  { value: "timeline", label: "Timeline" },
];

const DENSITY_OPTIONS = [
  {
    value: "comfortable" as CardDensity,
    icon: <LayoutGrid className="w-3.5 h-3.5" aria-hidden />,
    ariaLabel: "Comfortable grid density",
    label: "Grid",
  },
  {
    value: "compact" as CardDensity,
    icon: <List className="w-3.5 h-3.5" aria-hidden />,
    ariaLabel: "Compact grid density",
    label: "List",
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
  const router = useRouter();
  const { filters, sortField, sortDir, setFilters, setSort } = useAssetFilters();

  // Feature flag: use EntityModal (P2b) vs legacy RightDrawer.
  const useEntityModalFlag =
    isFlagEnabled("ui-tabbed-modal") || isFlagEnabled("ui-tabbed-modal-asset");

  const [viewMode, setViewMode] = React.useState<ViewMode>("gallery");
  const [density, setDensity] = React.useState<CardDensity>("comfortable");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  // Legacy drawer state (used when flag is off).
  const [legacyInspectId, setLegacyInspectId] = React.useState<string | null>(null);
  const [editAssetId, setEditAssetId] = React.useState<string | null>(null);

  // EntityModal URL state (used when flag is on — always called per hook rules).
  const { isOpen: modalIsOpen, itemId: modalItemId, open: modalOpen, close: modalClose } =
    useEntityModalUrl(ASSET_TAB_REGISTRY);

  // Date preset → captured_after ISO timestamp (memoized so the query key stays stable)
  const capturedAfter = React.useMemo(
    () => datePresetToCapturedAfter(filters.date),
    [filters.date],
  );

  // Data
  const { data, isLoading, isError } = useAssets(projectId, {
    q: filters.q,
    status: filters.status?.length ? filters.status : undefined,
    sensitivity: filters.sensitivity,
    source_kind: filters.source_kind?.length ? filters.source_kind : undefined,
    artifact_type_id: filters.artifact_type_id,
    agent_access: filters.agent_access,
    captured_after: capturedAfter,
    starred: filters.starred,
  });

  // Projects (for the Project scope chip)
  const { data: projectsData } = useProjects({ limit: 100 });
  const projectOptions = React.useMemo<FilterOption[]>(
    () =>
      (projectsData?.items ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projectsData?.items],
  );

  const allAssets = data?.items ?? [];
  const totalCount = data?.total ?? allAssets.length;
  const sortedAssets = React.useMemo(
    () => sortAssets(allAssets, sortField, sortDir),
    [allAssets, sortField, sortDir],
  );

  // Artifact-type options derived from loaded data (chip hidden when empty)
  const typeOptions = React.useMemo<FilterOption[]>(() => {
    const seen = new Set<string>();
    for (const a of allAssets) {
      if (a.artifact_type_id) seen.add(a.artifact_type_id);
    }
    if (filters.artifact_type_id) seen.add(filters.artifact_type_id);
    return [...seen].sort().map((id) => ({ value: id, label: id }));
  }, [allAssets, filters.artifact_type_id]);

  // Legacy: inspected asset object (only needed when drawer is active).
  const legacyInspectAsset = legacyInspectId
    ? sortedAssets.find((a) => a.id === legacyInspectId) ?? null
    : null;

  // Edit asset (used by legacy drawer's MetadataEditDialog).
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
    if (useEntityModalFlag) {
      // Toggle: close modal if same asset is clicked while open.
      if (modalIsOpen && modalItemId === assetId) {
        modalClose();
      } else {
        modalOpen(assetId);
      }
    } else {
      setLegacyInspectId((prev) => (prev === assetId ? null : assetId));
    }
  }

  function handleCopyLink(assetId: string) {
    void navigator.clipboard.writeText(
      `${window.location.origin}/projects/${projectId}/assets/${assetId}`,
    );
  }

  function handleProjectChange(nextProjectId: string) {
    if (nextProjectId !== projectId) {
      router.push(`/projects/${nextProjectId}/assets`);
    }
  }

  const drawerOpen = !useEntityModalFlag && !!legacyInspectId;
  const isEmpty = !isLoading && !isError && sortedAssets.length === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter chips row (P2-2): filters on the left, bulk actions/add on the right */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        projectOptions={projectOptions}
        currentProjectId={projectId}
        onProjectChange={handleProjectChange}
        typeOptions={typeOptions}
        trailing={
          <>
            {/* BulkActionBar */}
            {selectedIds.size > 0 && (
              <BulkActionBar
                selectedIds={Array.from(selectedIds)}
                onClear={() => setSelectedIds(new Set())}
              />
            )}

            {/* Add button */}
            <Button
              size="sm"
              variant="primary"
              iconLeft={<Plus aria-hidden className="w-3.5 h-3.5" />}
              aria-label="Add asset"
            >
              Add Asset
            </Button>
          </>
        }
      />

      {/* View tabs + sort / count / density toolbar */}
      <div
        className={clsx(
          "flex items-center gap-2 px-4",
          "border-b border-[var(--border)] bg-[var(--surface)] shrink-0",
        )}
      >
        <div role="tablist" aria-label="Asset views" className="flex items-center gap-1">
          {VIEW_TABS.map((tab) => {
            const active = viewMode === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(tab.value)}
                className={clsx(
                  "px-3 py-2.5 text-xs font-medium -mb-px border-b-2 transition-colors duration-[100ms]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                  active
                    ? "border-blue-600 text-blue-700 dark:text-blue-300"
                    : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 py-1.5">
          {/* Sort */}
          <SortMenu field={sortField} dir={sortDir} onChange={setSort} />

          {/* Asset count */}
          <span className="text-xs text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
            {isLoading
              ? "Loading…"
              : `${totalCount.toLocaleString()} asset${totalCount !== 1 ? "s" : ""}`}
          </span>

          {/* Density toggle — applies to gallery */}
          {viewMode === "gallery" && (
            <SegmentedControl
              value={density}
              onChange={(v) => setDensity(v as CardDensity)}
              options={DENSITY_OPTIONS}
              size="sm"
              iconOnly
              label="Grid density"
            />
          )}
        </div>
      </div>

      {/* Content area: view + right drawer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className={clsx("flex-1 overflow-y-auto", drawerOpen ? "min-w-0" : "")}>
          {/* Error state */}
          {isError && (
            <div className="p-8 text-center">
              <EmptyState
                icon={<AlertCircle className="w-10 h-10" aria-hidden />}
                title="Failed to load assets"
                description="The API may be unavailable. Demo data shown below."
              />
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="p-8">
              <EmptyState
                icon={<FolderOpen className="w-10 h-10" aria-hidden />}
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
              role="listbox"
              aria-label="Asset gallery"
              aria-multiselectable="true"
              className={clsx(
                "p-4 grid gap-3",
                density === "comfortable"
                  ? drawerOpen
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5"
                  : drawerOpen
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
              )}
            >
              {isLoading ? (
                <AssetCardSkeleton count={drawerOpen ? 4 : 8} />
              ) : (
                sortedAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    density={density}
                    selected={selectedIds.has(asset.id)}
                    multiSelectActive={multiSelectActive}
                    onSelect={handleSelect}
                    onOpen={handleOpen}
                    onCopyLink={handleCopyLink}
                    onAddToPack={(id) =>
                      useEntityModalFlag ? modalOpen(id) : setLegacyInspectId(id)
                    }
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

          {/* Board view — kanban grouped by lifecycle status */}
          {viewMode === "board" && !isLoading && !isEmpty && (
            <AssetBoardView assets={sortedAssets} onOpen={handleOpen} />
          )}

          {/* Timeline view — date-bucketed vertical timeline */}
          {viewMode === "timeline" && !isLoading && !isEmpty && (
            <AssetTimelineView assets={sortedAssets} onOpen={handleOpen} />
          )}

          {/* Loading skeleton for board/timeline */}
          {(viewMode === "board" || viewMode === "timeline") && isLoading && (
            <div className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <AssetCardSkeleton count={8} />
            </div>
          )}
        </div>

        {/* Legacy Right Inspector Drawer — shown only when flag is OFF */}
        {!useEntityModalFlag && (
          <RightDrawer
            open={drawerOpen}
            onClose={() => setLegacyInspectId(null)}
            title="Inspector"
            width="md"
            overlay={false}
          >
            <AssetDrawerContent
              asset={legacyInspectAsset}
              loading={isLoading}
              projectId={projectId}
              onEdit={(id) => setEditAssetId(id)}
              onCopyLink={handleCopyLink}
              onAddToPack={(id) => setLegacyInspectId(id)}
            />
          </RightDrawer>
        )}
      </div>

      {/* EntityModal — shown only when flag is ON */}
      {useEntityModalFlag && modalIsOpen && (
        <EntityModal
          entityType="asset"
          entityId={modalItemId ?? undefined}
          projectId={projectId}
          tabRegistry={ASSET_TAB_REGISTRY}
          onClose={modalClose}
          title={
            sortedAssets.find((a) => a.id === modalItemId)?.title
          }
        />
      )}

      {/* Metadata edit dialog (legacy path — Details tab owns it when flag is on) */}
      {!useEntityModalFlag && (
        <MetadataEditDialog
          asset={editAsset}
          open={!!editAssetId}
          onClose={() => setEditAssetId(null)}
        />
      )}
    </div>
  );
}
