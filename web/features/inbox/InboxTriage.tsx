"use client";

/**
 * InboxTriage — full inbox triage layout
 * Queue list (left) | Preview pane (center) | Classification panel (right)
 * UI-INBOX-001 + UI-INBOX-002
 *
 * P2b: When flag:ui-tabbed-modal (or flag:ui-tabbed-modal-inbox) is on, the
 * center preview column + right classification column are replaced by EntityModal
 * triggered by item selection. The queue column fills the remaining width.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Inbox, RefreshCw } from "lucide-react";
import {
  useInboxItems,
  useImportToInbox,
  useBulkStatusChange,
  useBulkDelete,
} from "@/lib/hooks/useInbox";
import { useImportAsset } from "@/lib/hooks/useAssets";
import { isFlagEnabled } from "@/lib/flags";
import { InboxQueueItem } from "./InboxQueueItem";
import { InboxPreviewPane } from "./InboxPreviewPane";
import { InboxClassificationForm } from "./InboxClassificationForm";
import { InboxBulkActionBar } from "./InboxBulkActionBar";
import { InboxCaptureBar } from "./InboxCaptureBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EntityModal, useEntityModalUrl } from "@/features/ui/components/EntityModal";
import { INBOX_ITEM_TAB_REGISTRY } from "./EntityModal/InboxItemTabRegistry";
import type { AssetCreate, AssetStatus, InboxItem } from "@/lib/types";

// ============================================================
// InboxTriage
// ============================================================

interface InboxTriageProps {
  projectId: string;
}

export function InboxTriage({ projectId }: InboxTriageProps) {
  const { data, isLoading, isError, refetch } = useInboxItems(projectId);
  const importToInbox = useImportToInbox(projectId);
  const importAsset = useImportAsset(projectId);
  const bulkStatusMutation = useBulkStatusChange();
  const bulkDeleteMutation = useBulkDelete();

  // Feature flag: EntityModal (P2b) vs legacy 3-column layout.
  const useEntityModalFlag =
    isFlagEnabled("ui-tabbed-modal") || isFlagEnabled("ui-tabbed-modal-inbox");

  // EntityModal URL state (always called per hook rules).
  const { isOpen: modalIsOpen, itemId: modalItemId, open: modalOpen, close: modalClose } =
    useEntityModalUrl(INBOX_ITEM_TAB_REGISTRY);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [multiSelectedIds, setMultiSelectedIds] = React.useState<Set<string>>(new Set());

  // Classification state per item (track success/error per id)
  const [classifyState, setClassifyState] = React.useState<{
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    errorMessage?: string;
  }>({ isLoading: false, isSuccess: false, isError: false });

  const items: InboxItem[] = data?.items ?? [];

  // Auto-select first item when list loads
  React.useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  // ---- Selection handlers ----
  const handleSelect = (id: string) => {
    setSelectedId(id);
    // Clear multi-select if no modifier
    setMultiSelectedIds(new Set());
    // EntityModal path: open/toggle modal on selection.
    if (useEntityModalFlag) {
      if (modalIsOpen && modalItemId === id) {
        modalClose();
      } else {
        modalOpen(id);
      }
    }
  };

  const handleToggleMultiSelect = (id: string) => {
    setMultiSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearMultiSelect = () => setMultiSelectedIds(new Set());

  // ---- Classification ----
  const handleClassify = async (assetData: AssetCreate) => {
    setClassifyState({ isLoading: true, isSuccess: false, isError: false });
    try {
      await importAsset.mutateAsync(assetData);
      setClassifyState({ isLoading: false, isSuccess: true, isError: false });
      // Auto-advance to next item
      const currentIdx = items.findIndex((i) => i.id === selectedId);
      const next = items[currentIdx + 1];
      if (next) {
        setTimeout(() => {
          setSelectedId(next.id);
          setClassifyState({ isLoading: false, isSuccess: false, isError: false });
        }, 800);
      }
    } catch (err) {
      setClassifyState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: err instanceof Error ? err.message : "Classification failed",
      });
    }
  };

  // ---- Bulk actions ----
  const handleBulkStatus = async (status: AssetStatus) => {
    const assetIds = Array.from(multiSelectedIds);
    try {
      await bulkStatusMutation.mutateAsync({ assetIds, status });
    } finally {
      clearMultiSelect();
    }
  };

  const handleBulkDelete = async () => {
    const assetIds = Array.from(multiSelectedIds);
    try {
      await bulkDeleteMutation.mutateAsync({ assetIds });
    } finally {
      clearMultiSelect();
    }
  };

  // ---- Import ----
  const handleImport = (req: Parameters<typeof importToInbox.mutate>[0]) => {
    importToInbox.mutate(req);
  };

  // ---- Keyboard navigation in queue ----
  const handleQueueKeyDown = (e: React.KeyboardEvent) => {
    if (!items.length) return;
    const idx = items.findIndex((i) => i.id === selectedId);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[Math.min(idx + 1, items.length - 1)];
      setSelectedId(next.id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[Math.max(idx - 1, 0)];
      setSelectedId(prev.id);
    }
  };

  const multiSelectedArr = Array.from(multiSelectedIds);
  const showBulkBar = multiSelectedArr.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Bulk action bar — above everything when active */}
      {showBulkBar && (
        <InboxBulkActionBar
          selectedIds={multiSelectedArr}
          onClearSelection={clearMultiSelect}
          onBulkStatus={handleBulkStatus}
          onBulkDelete={handleBulkDelete}
          isLoading={bulkStatusMutation.isPending || bulkDeleteMutation.isPending}
        />
      )}

      {/* Main 3-column layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ---- Left: Queue ---- */}
        <div
          className={clsx(
            "flex flex-col w-72 shrink-0",
            "border-r border-[var(--border)] bg-[var(--surface)]",
            "overflow-hidden",
          )}
        >
          {/* Queue header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
            <div className="flex items-center gap-1.5">
              <Inbox aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <span className="text-xs font-medium text-[var(--ink-muted)]">
                Queue
              </span>
              {!isLoading && items.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-100 text-blue-700 text-[10px] px-1.5 font-medium">
                  {items.length}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Refresh inbox"
              onClick={() => refetch()}
              className={clsx(
                "p-0.5 rounded text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-gray-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors",
              )}
            >
              <RefreshCw aria-hidden className={clsx("w-3 h-3", isLoading && "animate-spin")} />
            </button>
          </div>

          {/* Capture bar */}
          <div className="px-3 py-3 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
            <InboxCaptureBar
              onImport={handleImport}
              isLoading={importToInbox.isPending}
              isSuccess={importToInbox.isSuccess}
              isError={importToInbox.isError}
            />
          </div>

          {/* Queue list */}
          <div
            role="listbox"
            aria-label="Inbox items"
            aria-activedescendant={selectedId ?? undefined}
            className="flex-1 overflow-y-auto"
            onKeyDown={handleQueueKeyDown}
          >
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <EmptyState
                  size="sm"
                  title="Failed to load inbox"
                  description="Check backend connection or use demo fixtures."
                  action={
                    <Button size="xs" variant="secondary" onClick={() => refetch()}>
                      Retry
                    </Button>
                  }
                />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                size="sm"
                title="Inbox empty"
                description="Drop files above or use URL import to add assets."
              />
            ) : (
              items.map((item) => (
                <InboxQueueItem
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  multiSelected={multiSelectedIds.has(item.id)}
                  onSelect={handleSelect}
                  onToggleMultiSelect={handleToggleMultiSelect}
                />
              ))
            )}
          </div>
        </div>

        {/* ---- Center: Preview (legacy, flag OFF) ---- */}
        {!useEntityModalFlag && (
          <div
            className={clsx(
              "flex flex-col flex-1 min-w-0",
              "border-r border-[var(--border)] bg-[var(--surface-sunken)]",
              "overflow-hidden",
            )}
          >
            <InboxPreviewPane item={selectedItem} />
          </div>
        )}

        {/* ---- Right: Classification form (legacy, flag OFF) ---- */}
        {!useEntityModalFlag && (
          <div
            className={clsx(
              "flex flex-col w-72 shrink-0",
              "bg-[var(--surface)] overflow-hidden",
            )}
          >
            {selectedItem ? (
              <InboxClassificationForm
                key={selectedItem.id}
                item={selectedItem}
                onClassify={handleClassify}
                isLoading={classifyState.isLoading}
                isSuccess={classifyState.isSuccess}
                isError={classifyState.isError}
                errorMessage={classifyState.errorMessage}
              />
            ) : (
              <div className="flex flex-col h-full">
                <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)]">
                  <h3 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                    Classify Asset
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                  <EmptyState
                    size="sm"
                    title="Select an item"
                    description="Choose an inbox item from the queue to classify it."
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EntityModal — inbox item detail (P2b, flag:ui-tabbed-modal ON) */}
      {useEntityModalFlag && modalIsOpen && (
        <EntityModal
          entityType="inbox-item"
          entityId={modalItemId ?? undefined}
          projectId={projectId}
          tabRegistry={INBOX_ITEM_TAB_REGISTRY}
          onClose={modalClose}
          title={items.find((i) => i.id === modalItemId)?.title}
        />
      )}
    </div>
  );
}
