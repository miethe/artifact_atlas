"use client";

/**
 * AssetCard — gallery card for the asset library grid.
 *
 * Zone model (P3-002):
 *   HeaderZone  — AssetViewer mode="thumbnail" (full-width ~96px)
 *   ContentZone — title, source/size
 *   StatusZone  — StatusBadge, SensitivityBadge, tags
 *   ActionZone  — PolicyBadge, linkCount, BOM slot, quick-action buttons
 *
 * States: default, hover, focus, selected, multi-selected, loading skeleton.
 * Click-to-open guard: e.target.closest check prevents modal open on action clicks.
 * Keyboard: Enter/Space activates card; tabIndex=0 on card root.
 * Multi-select checkbox: absolute overlay, preserved behavior.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  ExternalLink,
  Copy,
  Package,
  CheckSquare,
  Square,
  Link2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { TagChip } from "@/components/ui/TagChip";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { Asset } from "@/lib/types";
import { PolicyBadge } from "./PolicyBadge";
import { AssetViewer } from "./AssetViewer";
import { ZoneCard, isInteractiveTarget } from "@/features/ui/components/Card";

// ============================================================
// Helpers
// ============================================================

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceLabel(kind: Asset["source_kind"]): string {
  const MAP: Record<Asset["source_kind"], string> = {
    vault: "Vault",
    local: "Local",
    chatgpt: "ChatGPT",
    claude: "Claude",
    figma: "Figma",
    canva: "Canva",
    drive: "Drive",
    sharepoint: "SharePoint",
    github: "GitHub",
    notion: "Notion",
    url: "URL",
    eagle: "Eagle",
    tagspaces: "TagSpaces",
    immich: "Immich",
    nextcloud: "Nextcloud",
    manual: "Manual",
  };
  return MAP[kind] ?? kind;
}

/** Maps source_kind to a border-l-{color} accent class for the left bar. */
function sourceKindAccent(kind: Asset["source_kind"]): string {
  const MAP: Record<Asset["source_kind"], string> = {
    vault: "border-l-blue-500",
    local: "border-l-slate-400",
    chatgpt: "border-l-green-500",
    claude: "border-l-orange-500",
    figma: "border-l-purple-500",
    canva: "border-l-pink-500",
    drive: "border-l-yellow-500",
    sharepoint: "border-l-sky-600",
    github: "border-l-gray-600",
    notion: "border-l-gray-500",
    url: "border-l-sky-400",
    eagle: "border-l-amber-500",
    tagspaces: "border-l-teal-500",
    immich: "border-l-blue-400",
    nextcloud: "border-l-blue-600",
    manual: "border-l-slate-300",
  };
  return MAP[kind] ?? "border-l-gray-300";
}

// ============================================================
// AssetCardThumbnail — full-width top thumbnail via AssetViewer
// ============================================================

function AssetCardThumbnail({ asset }: { asset: Asset }) {
  return (
    <AssetViewer
      asset={asset}
      mode="thumbnail"
      className="w-full h-full"
    />
  );
}

// ============================================================
// AssetCard
// ============================================================

export interface AssetCardProps {
  asset: Asset;
  selected?: boolean;
  multiSelectActive?: boolean;
  onSelect?: (assetId: string) => void;
  onOpen?: (assetId: string) => void;
  /** Metadata tags to show (derived externally, e.g. from asset.metadata) */
  tags?: string[];
  /** Number of entity links */
  linkCount?: number;
  /** BOM slot name if assigned */
  bomSlot?: string;
  /** Called when "copy link" action fires */
  onCopyLink?: (assetId: string) => void;
  /** Called when "add to context pack" action fires */
  onAddToPack?: (assetId: string) => void;
  className?: string;
}

export function AssetCard({
  asset,
  selected = false,
  multiSelectActive = false,
  onSelect,
  onOpen,
  tags,
  linkCount = 0,
  bomSlot,
  onCopyLink,
  onAddToPack,
  className,
}: AssetCardProps) {
  const derivedTags = tags ?? (asset.metadata ? Object.keys(asset.metadata).slice(0, 2) : []);

  // ── P3-006: Click-to-open guard ──────────────────────────────
  const handleCardClick = (e: React.MouseEvent) => {
    if (isInteractiveTarget(e)) return;
    if (multiSelectActive || e.metaKey || e.ctrlKey || e.shiftKey) {
      onSelect?.(asset.id);
    } else {
      onOpen?.(asset.id);
    }
  };

  // ── P3-007: Keyboard activation (Enter/Space on card root) ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (multiSelectActive) {
        onSelect?.(asset.id);
      } else {
        onOpen?.(asset.id);
      }
    }
  };

  // ── Selection checkbox overlay ───────────────────────────────
  const selectionOverlay = (
    <>
      {(multiSelectActive || selected) && (
        <button
          type="button"
          aria-label={selected ? "Deselect asset" : "Select asset"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(asset.id);
          }}
          className={clsx(
            "absolute top-2 left-2 z-10",
            "rounded text-blue-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          {selected ? (
            <CheckSquare aria-hidden className="w-4 h-4" />
          ) : (
            <Square aria-hidden className="w-4 h-4 text-gray-300" />
          )}
        </button>
      )}
      {!multiSelectActive && !selected && (
        <button
          type="button"
          aria-label="Select asset"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(asset.id);
          }}
          className={clsx(
            "absolute top-2 left-2 z-10",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "rounded text-gray-400 hover:text-blue-600",
            "transition-opacity duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:opacity-100",
          )}
        >
          <Square aria-hidden className="w-4 h-4" />
        </button>
      )}
    </>
  );

  return (
    <ZoneCard
      accentColor={sourceKindAccent(asset.source_kind)}
      tier="default"
      role="option"
      tabIndex={0}
      aria-selected={selected}
      aria-label={asset.title}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        selected
          ? "border-blue-400 ring-1 ring-blue-400 shadow-card-hover"
          : "shadow-card hover:shadow-card-hover hover:border-gray-300",
        className,
      )}
      overlay={selectionOverlay}
      header={<AssetCardThumbnail asset={asset} />}
      content={
        <>
          <p
            className="text-[13px] font-medium text-[var(--ink)] leading-tight line-clamp-2"
            title={asset.title}
          >
            {asset.title}
          </p>
          <p className="text-[11px] text-[var(--ink-muted)]">
            {sourceLabel(asset.source_kind)}
            {asset.size_bytes ? ` · ${formatBytes(asset.size_bytes)}` : ""}
          </p>
        </>
      }
      status={
        <>
          <StatusBadge status={asset.status} size="xs" />
          <SensitivityBadge
            sensitivity={asset.sensitivity}
            size="xs"
            showIcon={false}
          />
          {derivedTags.slice(0, 3).map((tag) => (
            <TagChip key={tag} label={tag} size="xs" />
          ))}
          {derivedTags.length > 3 && (
            <span className="text-[10px] text-[var(--ink-faint)] py-0.5">
              +{derivedTags.length - 3}
            </span>
          )}
        </>
      }
      actions={
        <>
          <PolicyBadge agentAccess={asset.agent_access} size="xs" />

          {linkCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--ink-muted)]">
              <Link2 aria-hidden className="w-2.5 h-2.5" />
              {linkCount}
            </span>
          )}

          {bomSlot && (
            <span
              className="text-[10px] text-orange-600 font-medium truncate max-w-[80px]"
              title={bomSlot}
            >
              BOM: {bomSlot}
            </span>
          )}

          {/* Quick actions — visible on hover/focus */}
          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-[100ms]">
            {onOpen && (
              <Tooltip content="Open detail" side="top">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Open asset detail"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(asset.id);
                  }}
                >
                  <ExternalLink aria-hidden className="w-3 h-3" />
                </IconButton>
              </Tooltip>
            )}
            {onCopyLink && (
              <Tooltip content="Copy link" side="top">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Copy asset link"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyLink(asset.id);
                  }}
                >
                  <Copy aria-hidden className="w-3 h-3" />
                </IconButton>
              </Tooltip>
            )}
            {onAddToPack && (
              <Tooltip content="Add to context pack" side="top">
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label="Add to context pack"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPack(asset.id);
                  }}
                >
                  <Package aria-hidden className="w-3 h-3" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        </>
      }
    />
  );
}

// ============================================================
// AssetCardSkeleton
// ============================================================

export function AssetCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
