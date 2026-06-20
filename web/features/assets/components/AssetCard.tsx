"use client";

/**
 * AssetCard — gallery card for the asset library grid.
 *
 * States: default, hover, focus, selected, multi-selected, loading skeleton.
 * Keyboard selectable (Enter/Space toggles selection).
 * Quick actions: Open detail, copy link, add to pack.
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
import { AssetThumbnail } from "./AssetThumbnail";
import { PolicyBadge } from "./PolicyBadge";

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

  const handleClick = (e: React.MouseEvent) => {
    if (multiSelectActive || e.metaKey || e.ctrlKey || e.shiftKey) {
      onSelect?.(asset.id);
    } else {
      onOpen?.(asset.id);
    }
  };

  const derivedTags = tags ?? (asset.metadata ? Object.keys(asset.metadata).slice(0, 2) : []);

  return (
    <article
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      className={clsx(
        "group relative flex flex-col bg-white border rounded-[8px]",
        "cursor-pointer select-none transition-shadow duration-[100ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        selected
          ? "border-blue-400 ring-1 ring-blue-400 shadow-card-hover"
          : "border-[var(--border)] shadow-card hover:shadow-card-hover hover:border-gray-300",
        className,
      )}
    >
      {/* Selection checkbox (visible when multiselect active or card hovered/focused/selected) */}
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
            "rounded text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          {selected ? (
            <CheckSquare aria-hidden className="w-4 h-4" />
          ) : (
            <Square aria-hidden className="w-4 h-4 text-gray-300" />
          )}
        </button>
      )}

      {/* Multi-select checkbox on hover (even when not in multiselect mode) */}
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
            "rounded text-gray-400 hover:text-blue-600 transition-opacity duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:opacity-100",
          )}
        >
          <Square aria-hidden className="w-4 h-4" />
        </button>
      )}

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Thumbnail row */}
        <div className="flex items-start gap-2.5">
          <AssetThumbnail asset={asset} size="sm" />
          <div className="flex-1 min-w-0">
            <p
              className="text-[13px] font-medium text-[var(--ink)] leading-tight line-clamp-2"
              title={asset.title}
            >
              {asset.title}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              {sourceLabel(asset.source_kind)}
              {asset.size_bytes ? ` · ${formatBytes(asset.size_bytes)}` : ""}
            </p>
          </div>
        </div>

        {/* Status + sensitivity row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={asset.status} size="xs" />
          <SensitivityBadge sensitivity={asset.sensitivity} size="xs" showIcon={false} />
        </div>

        {/* Tags row */}
        {derivedTags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {derivedTags.slice(0, 3).map((tag) => (
              <TagChip key={tag} label={tag} size="xs" />
            ))}
            {derivedTags.length > 3 && (
              <span className="text-[10px] text-[var(--ink-faint)] py-0.5">
                +{derivedTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: links, BOM, policy, quick actions */}
      <div className="flex items-center gap-1.5 px-3 pb-2.5 border-t border-[var(--border)] pt-2">
        <PolicyBadge agentAccess={asset.agent_access} size="xs" />

        {linkCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--ink-muted)]">
            <Link2 aria-hidden className="w-2.5 h-2.5" />
            {linkCount}
          </span>
        )}

        {bomSlot && (
          <span className="text-[10px] text-orange-600 font-medium truncate max-w-[80px]" title={bomSlot}>
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
      </div>
    </article>
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
