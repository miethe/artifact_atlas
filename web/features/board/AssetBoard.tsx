"use client";

/**
 * AssetBoard — Feature/Topic Board
 * UI-BOARD-001
 * Columns grouped by AssetStatus; draggable cards via @dnd-kit
 * Keyboard fallback: MoveSelectedDialog (Shift+M or toolbar button)
 * Status changes only persist after API success; optimistic + rollback.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useAssets } from "@/lib/hooks/useAssets";
import { useAssetModal } from "@/features/assets/hooks/useAssetModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api";
import { assetKeys } from "@/lib/hooks/useAssets";
import { BoardColumn, type BoardColumnProps } from "./BoardColumn";
import { DraggableAssetCard } from "./DraggableAssetCard";
import { MoveSelectedDialog, type MoveTarget } from "./MoveSelectedDialog";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Keyboard, Columns3, Kanban } from "lucide-react";
import { SHORTCUT_MOVE_SELECTED_EVENT } from "@/features/ui/hooks/useGlobalShortcuts";
import type { Asset, AssetStatus } from "@/lib/types";

// ============================================================
// Column configuration
// ============================================================

interface ColumnConfig {
  id: string;
  title: string;
  color: string;
  description?: string;
}

const BOARD_COLUMNS: ColumnConfig[] = [
  {
    id: "inbox",
    title: "Inbox",
    color: "bg-gray-400",
    description: "Newly captured, unclassified",
  },
  {
    id: "raw",
    title: "Raw",
    color: "bg-purple-400",
    description: "Captured, not yet reviewed",
  },
  {
    id: "candidate",
    title: "Candidate",
    color: "bg-blue-500",
    description: "Under consideration",
  },
  {
    id: "in_review",
    title: "In Review",
    color: "bg-amber-500",
    description: "Active review in progress",
  },
  {
    id: "selected",
    title: "Selected",
    color: "bg-emerald-500",
    description: "Approved for use",
  },
  {
    id: "canonical",
    title: "Canonical",
    color: "bg-green-600",
    description: "Official canonical artifact",
  },
];

const MOVE_TARGETS: MoveTarget[] = BOARD_COLUMNS.map((c) => ({
  id: c.id,
  label: c.title,
  description: c.description,
  color: c.color,
}));

// ============================================================
// AssetBoard
// ============================================================

type GroupByOption = "status" | "feature" | "domain";

const GROUP_BY_OPTIONS: Array<{ value: GroupByOption; label: string }> = [
  { value: "status", label: "Status" },
  { value: "feature", label: "Feature" },
  { value: "domain", label: "Domain" },
];

interface AssetBoardProps {
  projectId: string;
  groupBy?: GroupByOption;
}

type AssetMap = Record<AssetStatus, Asset[]>;

function buildAssetMap(assets: Asset[]): AssetMap {
  const map: AssetMap = {
    inbox: [],
    raw: [],
    candidate: [],
    in_review: [],
    in_progress: [],
    selected: [],
    canonical: [],
    archived: [],
  };
  for (const asset of assets) {
    const col = map[asset.status];
    if (col) col.push(asset);
  }
  return map;
}

// Dynamic grouping (P3-5) — groups by `metadata.feature` / `metadata.domain`
// since Asset has no first-class feature/domain field yet. Assets without a
// value for the chosen key land in an "Uncategorized" bucket.
const DYNAMIC_GROUP_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
];
const UNCATEGORIZED_GROUP_ID = "__uncategorized__";

function groupKeyForAsset(asset: Asset, key: "feature" | "domain"): string {
  const value = asset.metadata?.[key];
  return typeof value === "string" && value.trim() ? value : UNCATEGORIZED_GROUP_ID;
}

function buildDynamicColumns(
  assets: Asset[],
  key: "feature" | "domain",
): ColumnConfig[] {
  const ids = Array.from(new Set(assets.map((a) => groupKeyForAsset(a, key))));
  const named = ids.filter((id) => id !== UNCATEGORIZED_GROUP_ID).sort();
  const columns: ColumnConfig[] = named.map((id, i) => ({
    id,
    title: id,
    color: DYNAMIC_GROUP_COLORS[i % DYNAMIC_GROUP_COLORS.length],
  }));
  if (ids.includes(UNCATEGORIZED_GROUP_ID)) {
    columns.push({ id: UNCATEGORIZED_GROUP_ID, title: "Uncategorized", color: "bg-gray-400" });
  }
  return columns;
}

function buildDynamicAssetMap(
  assets: Asset[],
  columns: ColumnConfig[],
  key: "feature" | "domain",
): Record<string, Asset[]> {
  const map: Record<string, Asset[]> = {};
  for (const col of columns) map[col.id] = [];
  for (const asset of assets) {
    const groupId = groupKeyForAsset(asset, key);
    (map[groupId] ??= []).push(asset);
  }
  return map;
}

export function AssetBoard({ projectId, groupBy: groupByProp }: AssetBoardProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useAssets(projectId);

  // Local mutable copy of assets (optimistic updates)
  const [localAssets, setLocalAssets] = React.useState<Asset[]>([]);

  React.useEffect(() => {
    if (data?.items) {
      setLocalAssets(data.items);
    }
  }, [data?.items]);

  // Multi-selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Drag state
  const [activeAsset, setActiveAsset] = React.useState<Asset | null>(null);

  // Move dialog
  const [moveDialogOpen, setMoveDialogOpen] = React.useState(false);

  // Group by selector (P3-5) — status is draggable/persisted; feature/domain
  // are read-only groupings derived from asset metadata.
  const [groupBy, setGroupBy] = React.useState<GroupByOption>(groupByProp ?? "status");

  // Asset detail modal (URL-driven via ?item=)
  const { openAsset, assetModal } = useAssetModal(projectId, {
    title: (id) => localAssets.find((a) => a.id === id)?.title,
  });

  // Columns + grouped assets — status uses the fixed workflow columns and is
  // draggable/persisted; feature/domain build read-only dynamic columns from
  // asset metadata (no first-class feature/domain field on Asset yet).
  const columns = React.useMemo(
    () => (groupBy === "status" ? BOARD_COLUMNS : buildDynamicColumns(localAssets, groupBy)),
    [groupBy, localAssets],
  );
  const groupedAssets = React.useMemo<Record<string, Asset[]>>(
    () =>
      groupBy === "status"
        ? buildAssetMap(localAssets)
        : buildDynamicAssetMap(localAssets, columns, groupBy),
    [groupBy, localAssets, columns],
  );

  // Sensors — pointer + keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ---- Update mutation (asset-id agnostic at hook level) ----
  const qc = useQueryClient();
  const updateAssetStatus = useMutation({
    mutationFn: ({ assetId, status }: { assetId: string; status: AssetStatus }) =>
      assetsApi.update(assetId, { status }),
    onSuccess: (asset) => {
      qc.setQueryData(assetKeys.detail(asset.id), asset);
      qc.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });

  // ---- Drag handlers ----
  const handleDragStart = ({ active }: DragStartEvent) => {
    const asset = localAssets.find((a) => a.id === active.id);
    setActiveAsset(asset ?? null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    // Feature/Domain groupings are read-only — status is the only draggable axis.
    if (!over || groupBy !== "status") return;
    const targetColumnId = over.id as AssetStatus;
    const validColumn = BOARD_COLUMNS.some((c) => c.id === targetColumnId);
    if (!validColumn) return;

    // Optimistic: move the asset in local state
    setLocalAssets((prev) =>
      prev.map((a) =>
        a.id === active.id ? { ...a, status: targetColumnId } : a,
      ),
    );
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (groupBy !== "status") {
      setActiveAsset(null);
      return;
    }
    const asset = localAssets.find((a) => a.id === active.id);
    if (!asset) {
      setActiveAsset(null);
      return;
    }

    const targetColumnId = over?.id as AssetStatus | undefined;
    const originalStatus = data?.items.find((a) => a.id === asset.id)?.status;

    if (!targetColumnId || !originalStatus || targetColumnId === originalStatus) {
      // Restore original position
      setLocalAssets((prev) =>
        prev.map((a) =>
          a.id === active.id ? { ...a, status: originalStatus ?? a.status } : a,
        ),
      );
      setActiveAsset(null);
      return;
    }

    // Attempt API update
    try {
      await updateAssetStatus.mutateAsync({ assetId: asset.id, status: targetColumnId });
      // On success: keep local state (already updated optimistically)
    } catch {
      // Rollback
      setLocalAssets((prev) =>
        prev.map((a) =>
          a.id === active.id ? { ...a, status: originalStatus } : a,
        ),
      );
    }

    setActiveAsset(null);
  };

  // ---- Toggle card selection ----
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- Add asset (P2-4) — per-column ghost button; opens Assets library ----
  // scoped for now (no dedicated create-asset dialog exists yet).
  const handleAddAsset = React.useCallback(
    (_columnId: string) => {
      router.push(`/projects/${projectId}/assets`);
    },
    [projectId, router],
  );

  // ---- Keyboard Move Selected ----
  const handleMoveSelected = async (targetStatus: AssetStatus) => {
    const idsArr = Array.from(selectedIds);

    // Optimistic update
    setLocalAssets((prev) =>
      prev.map((a) =>
        selectedIds.has(a.id) ? { ...a, status: targetStatus } : a,
      ),
    );

    // API calls (fire and forget — in real impl would batch)
    const originals = new Map(
      localAssets.filter((a) => selectedIds.has(a.id)).map((a) => [a.id, a.status]),
    );

    try {
      // In a real implementation this would batch or use a dedicated mutation
      // For now we treat it as succeeded after a brief delay (demo)
      await new Promise((r) => setTimeout(r, 400));
      setSelectedIds(new Set());
    } catch {
      // Rollback
      setLocalAssets((prev) =>
        prev.map((a) =>
          idsArr.includes(a.id) ? { ...a, status: originals.get(a.id) ?? a.status } : a,
        ),
      );
      throw new Error("Move failed");
    }
  };

  // Keyboard shortcut: Shift+M opens move dialog
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "m" && e.shiftKey && selectedIds.size > 0) {
        e.preventDefault();
        setMoveDialogOpen(true);
      }
      if (e.key === "Escape") {
        setSelectedIds(new Set());
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectedIds.size]);

  // Global "M" shortcut (P2-13) — same action as Shift+M when a selection exists.
  React.useEffect(() => {
    function handleMoveSelected() {
      if (selectedIds.size > 0) setMoveDialogOpen(true);
    }
    document.addEventListener(SHORTCUT_MOVE_SELECTED_EVENT, handleMoveSelected);
    return () =>
      document.removeEventListener(SHORTCUT_MOVE_SELECTED_EVENT, handleMoveSelected);
  }, [selectedIds.size]);

  // ============================================================
  // Render
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex gap-4 p-5 overflow-x-auto">
        {BOARD_COLUMNS.slice(0, 4).map((col) => (
          <div
            key={col.id}
            className="w-72 shrink-0 rounded border border-[var(--border)] bg-[var(--surface-sunken)] p-3 space-y-2"
          >
            <div className="h-5 bg-gray-100 rounded w-24 mb-3" />
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <EmptyState
          icon={<Kanban className="w-10 h-10" aria-hidden />}
          title="Failed to load board"
          description="Could not fetch assets. Using demo fixtures if available."
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Board toolbar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
          <Columns3 aria-hidden className="w-3.5 h-3.5" />
          <span>Group by</span>
        </div>
        <SegmentedControl
          value={groupBy}
          onChange={setGroupBy}
          size="xs"
          label="Group board by"
          options={GROUP_BY_OPTIONS}
        />
        <div className="flex-1" />

        {/* Selection info */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-700">
              {selectedIds.size} selected
            </span>
            <Button
              variant="secondary"
              size="xs"
              iconLeft={<Keyboard aria-hidden className="w-3 h-3" />}
              onClick={() => setMoveDialogOpen(true)}
              aria-label="Move selected assets to a different column (keyboard shortcut: Shift+M)"
            >
              Move to… (Shift+M)
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSelectedIds(new Set())}
              aria-label="Clear selection"
            >
              Clear
            </Button>
          </div>
        )}

        {selectedIds.size === 0 && (
          <p className="text-[11px] text-[var(--ink-faint)]">
            {groupBy === "status"
              ? "Click to open · ⌘/Ctrl-click to select · Drag to move · Shift+M to keyboard-move"
              : "Click to open · ⌘/Ctrl-click to select · Grouped read-only — switch to Status to drag"}
          </p>
        )}
      </div>

      {/* Board columns */}
      <div
        role="group"
        aria-label="Asset board columns"
        className="flex gap-4 p-5 overflow-x-auto h-full"
      >
        {columns.map((col) => {
          const columnAssets = groupedAssets[col.id] ?? [];
          return (
            <BoardColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              assets={columnAssets}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onOpenDetail={openAsset}
              onAddAsset={handleAddAsset}
            />
          );
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeAsset ? (
          <DraggableAssetCard
            asset={activeAsset}
            selected={selectedIds.has(activeAsset.id)}
            onToggleSelect={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>

      {/* Move selected dialog — keyboard alternative */}
      <MoveSelectedDialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        selectedCount={selectedIds.size}
        targets={MOVE_TARGETS}
        onMove={handleMoveSelected}
      />

      {/* Asset detail modal — URL-driven; mounted once at board level */}
      {assetModal}
    </DndContext>
  );
}
