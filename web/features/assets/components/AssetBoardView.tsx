"use client";

/**
 * AssetBoardView — Board tab of the asset library.
 *
 * Read-focused kanban: columns grouped by asset lifecycle status, respecting
 * the library's active filters/sort (assets are passed in pre-filtered).
 * For the drag-to-move status board, see features/board/AssetBoard (route
 * /projects/{id}/board) — this view is intentionally lighter.
 */

import * as React from "react";
import { clsx } from "clsx";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Asset, AssetStatus } from "@/lib/types";
import { AssetViewer } from "./AssetViewer";
import {
  relativeTime,
  sourceKindAccent,
  sourceLabel,
  SourceIcon,
  typeBadge,
} from "./assetDisplay";

// ============================================================
// Column config
// ============================================================

const STATUS_ORDER: { status: AssetStatus; label: string }[] = [
  { status: "inbox", label: "Inbox" },
  { status: "raw", label: "Raw" },
  { status: "candidate", label: "Candidate" },
  { status: "in_review", label: "In Review" },
  { status: "in_progress", label: "In Progress" },
  { status: "selected", label: "Selected" },
  { status: "canonical", label: "Canonical" },
  { status: "archived", label: "Archived" },
];

// ============================================================
// Board card — compact
// ============================================================

function BoardCard({
  asset,
  onOpen,
}: {
  asset: Asset;
  onOpen?: (assetId: string) => void;
}) {
  const badge = typeBadge(asset);
  return (
    <button
      type="button"
      onClick={() => onOpen?.(asset.id)}
      aria-label={asset.title}
      className={clsx(
        "w-full text-left flex flex-col overflow-hidden rounded-md",
        "border border-[var(--border)] border-l-4",
        sourceKindAccent(asset.source_kind),
        "bg-[var(--surface)] shadow-card hover:shadow-card-hover",
        "transition-shadow duration-[100ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      )}
    >
      <div className="relative w-full h-20 flex-shrink-0 overflow-hidden bg-[var(--surface-sunken)]">
        <AssetViewer asset={asset} mode="thumbnail" className="w-full h-full" />
        {badge && (
          <span
            aria-hidden
            className={clsx(
              "absolute top-1.5 left-1.5 inline-flex items-center justify-center",
              "h-4 min-w-4 px-1 rounded text-[8px] font-bold tracking-wide shadow-sm",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-2">
        <p className="text-xs font-medium text-[var(--ink)] leading-tight line-clamp-2" title={asset.title}>
          {asset.title}
        </p>
        <p className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
          <SourceIcon kind={asset.source_kind} className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{sourceLabel(asset.source_kind)}</span>
          <span className="ml-auto shrink-0 text-[var(--ink-faint)]">
            {relativeTime(asset.captured_at)}
          </span>
        </p>
      </div>
    </button>
  );
}

// ============================================================
// AssetBoardView
// ============================================================

export interface AssetBoardViewProps {
  assets: Asset[];
  onOpen?: (assetId: string) => void;
  className?: string;
}

export function AssetBoardView({ assets, onOpen, className }: AssetBoardViewProps) {
  const columns = React.useMemo(() => {
    const byStatus = new Map<AssetStatus, Asset[]>();
    for (const asset of assets) {
      const list = byStatus.get(asset.status) ?? [];
      list.push(asset);
      byStatus.set(asset.status, list);
    }
    // Show every status column that has assets; keep canonical ordering.
    return STATUS_ORDER.filter((c) => (byStatus.get(c.status)?.length ?? 0) > 0).map(
      (c) => ({ ...c, assets: byStatus.get(c.status) ?? [] }),
    );
  }, [assets]);

  if (columns.length === 0) return null;

  return (
    <div
      className={clsx("flex gap-3 p-4 overflow-x-auto items-start h-full", className)}
      role="list"
      aria-label="Assets grouped by status"
    >
      {columns.map((col) => (
        <section
          key={col.status}
          role="listitem"
          aria-label={`${col.label} (${col.assets.length})`}
          className={clsx(
            "flex flex-col w-64 shrink-0 max-h-full rounded-lg",
            "bg-[var(--surface-sunken)] border border-[var(--border)]",
          )}
        >
          <header className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
            <StatusBadge status={col.status} size="xs" />
            <span className="text-xs text-[var(--ink-muted)] tabular-nums ml-auto">
              {col.assets.length}
            </span>
          </header>
          <div className="flex flex-col gap-2 p-2 overflow-y-auto">
            {col.assets.map((asset) => (
              <BoardCard key={asset.id} asset={asset} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
