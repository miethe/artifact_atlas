"use client";

/**
 * CandidateAssetsPanel — assets in candidate/selected/in_review states,
 * rendered as a thumbnail strip per the command-center mockup.
 * Preview shows 4; the expanded (fullscreen) view shows all.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Sparkles } from "lucide-react";
import { StatusBadge, EmptyState, SkeletonRow } from "@/components/ui";
import { AssetThumbnail } from "@/features/assets/components/AssetThumbnail";
import { AssetLink } from "@/features/assets/components/AssetLink";
import { PanelShell } from "./PanelShell";
import type { Asset } from "@/lib/types";

// ============================================================
// Thumbnail tile + grid
// ============================================================

function CandidateTile({
  asset,
  onOpenAsset,
}: {
  asset: Asset;
  onOpenAsset?: (id: string) => void;
}) {
  const body = (
    <>
      <AssetThumbnail
        asset={asset}
        size="lg"
        className="!w-full !h-16 rounded-b-none border-0 border-b border-[var(--border)]"
      />
      <span className="flex flex-col gap-0.5 px-1.5 py-1 min-w-0 text-left">
        <span className="block text-[10px] font-medium text-[var(--ink)] truncate leading-tight">
          {asset.title}
        </span>
        <span className="flex items-center justify-between gap-1">
          <span className="text-[9px] text-[var(--ink-faint)] truncate leading-tight">
            {asset.source_kind}
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

function CandidateGrid({
  assets,
  onOpenAsset,
  columns = "grid-cols-2 lg:grid-cols-4",
}: {
  assets: Asset[];
  onOpenAsset?: (id: string) => void;
  columns?: string;
}) {
  return (
    <ul role="list" className={clsx("grid gap-2 p-2", columns)}>
      {assets.map((asset) => (
        <li key={asset.id} className="min-w-0">
          <CandidateTile asset={asset} onOpenAsset={onOpenAsset} />
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Component
// ============================================================

interface CandidateAssetsPanelProps {
  projectId: string;
  assets: Asset[] | undefined;
  isLoading: boolean;
  viewAllHref?: string;
  onOpenAsset?: (id: string) => void;
}

export function CandidateAssetsPanel({
  projectId: _projectId,
  assets,
  isLoading,
  viewAllHref,
  onOpenAsset,
}: CandidateAssetsPanelProps) {
  const candidates = React.useMemo(
    () =>
      (assets ?? []).filter((a) =>
        ["candidate", "selected", "in_review", "in_progress"].includes(a.status),
      ),
    [assets],
  );

  const preview = candidates.slice(0, 4);

  return (
    <PanelShell
      title="Candidate Assets"
      subtitle={`${candidates.length} in pipeline`}
      icon={<Sparkles className="w-3.5 h-3.5" />}
      ariaLabel="Candidate assets in promotion pipeline"
      viewAllHref={viewAllHref}
      viewAllLabel="Browse candidates"
      expandedContent={
        <CandidateGrid
          assets={candidates}
          onOpenAsset={onOpenAsset}
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        />
      }
    >
      {isLoading && !assets ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : preview.length === 0 ? (
        <EmptyState
          size="sm"
          title="No candidates"
          description="Classify raw assets to begin the promotion pipeline."
          icon={<Sparkles className="w-8 h-8" />}
        />
      ) : (
        <CandidateGrid assets={preview} onOpenAsset={onOpenAsset} />
      )}
    </PanelShell>
  );
}
