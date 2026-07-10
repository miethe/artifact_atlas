"use client";

/**
 * RecentAssetsPanel — thumbnail grid of the most recently captured assets,
 * per the command-center mockup. Data from useAssets (sorted captured_at
 * desc). Preview shows 6; the expanded (fullscreen) view shows all.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Clock, FileText } from "lucide-react";
import { StatusBadge, EmptyState, SkeletonRow } from "@/components/ui";
import { AssetThumbnail } from "@/features/assets/components/AssetThumbnail";
import { AssetLink } from "@/features/assets/components/AssetLink";
import { PanelShell } from "./PanelShell";
import type { Asset } from "@/lib/types";

// ============================================================
// Helper — relative time label
// ============================================================

function relativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================
// Thumbnail card + grid
// ============================================================

function AssetCardTile({
  asset,
  onOpenAsset,
}: {
  asset: Asset;
  onOpenAsset?: (id: string) => void;
}) {
  const body = (
    <>
      {/* Wide thumbnail */}
      <AssetThumbnail
        asset={asset}
        size="lg"
        className="!w-full !h-20 rounded-b-none border-0 border-b border-[var(--border)]"
      />
      <span className="flex flex-col gap-0.5 px-2 py-1.5 min-w-0 text-left">
        <span className="block text-[11px] font-medium text-[var(--ink)] truncate leading-tight">
          {asset.title}
        </span>
        <span className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-[var(--ink-faint)] truncate leading-tight">
            {asset.source_kind} · {relativeTime(asset.captured_at)}
          </span>
          <StatusBadge status={asset.status} size="xs" />
        </span>
      </span>
    </>
  );

  const tileClasses = clsx(
    "flex flex-col w-full overflow-hidden rounded-md border border-[var(--border)] bg-white",
    "hover:border-blue-300 hover:shadow-card-hover transition-all duration-[150ms]",
  );

  if (onOpenAsset) {
    return (
      <AssetLink
        assetId={asset.id}
        onOpen={onOpenAsset}
        aria-label={`Open ${asset.title}`}
        className={tileClasses}
      >
        {body}
      </AssetLink>
    );
  }
  return <div className={tileClasses}>{body}</div>;
}

function AssetGrid({
  assets,
  onOpenAsset,
  columns = "grid-cols-2 lg:grid-cols-3",
}: {
  assets: Asset[];
  onOpenAsset?: (id: string) => void;
  columns?: string;
}) {
  return (
    <ul role="list" className={clsx("grid gap-2 p-2", columns)}>
      {assets.map((asset) => (
        <li key={asset.id} className="min-w-0">
          <AssetCardTile asset={asset} onOpenAsset={onOpenAsset} />
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Component
// ============================================================

interface RecentAssetsPanelProps {
  projectId: string;
  assets: Asset[] | undefined;
  isLoading: boolean;
  viewAllHref?: string;
  onOpenAsset?: (id: string) => void;
}

export function RecentAssetsPanel({
  projectId: _projectId,
  assets,
  isLoading,
  viewAllHref,
  onOpenAsset,
}: RecentAssetsPanelProps) {
  // Sort by captured_at descending
  const sorted = React.useMemo(() => {
    if (!assets) return [];
    return [...assets].sort(
      (a, b) =>
        new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime(),
    );
  }, [assets]);

  const preview = sorted.slice(0, 6);

  return (
    <PanelShell
      title="Recent Assets"
      subtitle={
        sorted.length > 0
          ? `Showing ${preview.length} of ${sorted.length}`
          : undefined
      }
      icon={<Clock className="w-3.5 h-3.5" />}
      ariaLabel="Recently captured assets"
      viewAllHref={viewAllHref}
      viewAllLabel="Browse all"
      expandedContent={
        <AssetGrid
          assets={sorted}
          onOpenAsset={onOpenAsset}
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        />
      }
    >
      {isLoading && !assets ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : preview.length === 0 ? (
        <EmptyState
          size="sm"
          title="No assets yet"
          description="Captured assets will appear here."
          icon={<FileText className="w-8 h-8" />}
        />
      ) : (
        <AssetGrid assets={preview} onOpenAsset={onOpenAsset} />
      )}
    </PanelShell>
  );
}
