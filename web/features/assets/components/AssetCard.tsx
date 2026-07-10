"use client";

/**
 * AssetCard — gallery card for the asset library grid (mockup-fidelity pass).
 *
 * Layout (per asset_library_dashboard_interface_snapshot.png):
 *   Thumbnail   — large preview via AssetViewer mode="thumbnail", with a
 *                 file-type badge overlay (top-left) and selection checkbox
 *                 (top-right, hover-revealed).
 *   Title       — filename, then source icon + origin label.
 *   Tags        — up to 3 metadata.tags chips (+N overflow).
 *   Footer      — color-coded status chip + relative time (left);
 *                 star toggle, comment count (if data), overflow menu (right).
 *
 * Star toggle persists metadata.starred via PATCH /api/assets/{assetId}.
 * Density prop: "comfortable" (default, taller thumbnail) | "compact".
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
  Star,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TagChip } from "@/components/ui/TagChip";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { Asset } from "@/lib/types";
import { useUpdateAsset } from "@/lib/hooks/useAssets";
import { AssetViewer } from "./AssetViewer";
import { isInteractiveTarget } from "@/features/ui/components/Card";
import {
  assetTags,
  commentCount,
  formatBytes,
  isStarred,
  relativeTime,
  sourceKindAccent,
  sourceLabel,
  SourceIcon,
  typeBadge,
} from "./assetDisplay";

export type CardDensity = "comfortable" | "compact";

// ============================================================
// Star toggle — persists metadata.starred via PATCH
// ============================================================

function StarToggle({ asset, className }: { asset: Asset; className?: string }) {
  const update = useUpdateAsset(asset.id);
  const starred = isStarred(asset);

  return (
    <button
      type="button"
      aria-label={starred ? "Unstar asset" : "Star asset"}
      aria-pressed={starred}
      disabled={update.isPending}
      onClick={(e) => {
        e.stopPropagation();
        update.mutate({
          metadata: { ...(asset.metadata ?? {}), starred: !starred },
        });
      }}
      className={clsx(
        "inline-flex items-center justify-center w-6 h-6 rounded",
        "transition-colors duration-[100ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        starred
          ? "text-amber-500"
          : "text-[var(--ink-faint)] hover:text-amber-500",
        className,
      )}
    >
      <Star
        aria-hidden
        className={clsx("w-3.5 h-3.5", starred && "fill-amber-500")}
      />
    </button>
  );
}

// ============================================================
// Overflow menu
// ============================================================

interface OverflowMenuProps {
  asset: Asset;
  onOpen?: (assetId: string) => void;
  onCopyLink?: (assetId: string) => void;
  onAddToPack?: (assetId: string) => void;
}

function OverflowMenu({ asset, onOpen, onCopyLink, onAddToPack }: OverflowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (
        e instanceof MouseEvent &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [open]);

  const originalHref =
    asset.original_uri && /^https?:\/\//.test(asset.original_uri)
      ? asset.original_uri
      : /^https?:\/\//.test(asset.uri)
        ? asset.uri
        : null;

  const items: { label: string; onClick: () => void; icon: React.ReactNode }[] = [];
  if (onOpen) {
    items.push({
      label: "Open detail",
      icon: <ExternalLink aria-hidden className="w-3 h-3" />,
      onClick: () => onOpen(asset.id),
    });
  }
  if (originalHref) {
    items.push({
      label: `Open in ${sourceLabel(asset.source_kind)}`,
      icon: <ExternalLink aria-hidden className="w-3 h-3" />,
      onClick: () => window.open(originalHref, "_blank", "noopener,noreferrer"),
    });
  }
  if (onCopyLink) {
    items.push({
      label: "Copy link",
      icon: <Copy aria-hidden className="w-3 h-3" />,
      onClick: () => onCopyLink(asset.id),
    });
  }
  if (onAddToPack) {
    items.push({
      label: "Add to context pack",
      icon: <Package aria-hidden className="w-3 h-3" />,
      onClick: () => onAddToPack(asset.id),
    });
  }

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={clsx(
          "inline-flex items-center justify-center w-6 h-6 rounded",
          "text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)]",
          "transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
      >
        <MoreHorizontal aria-hidden className="w-3.5 h-3.5" />
      </button>
      {open && (
        <ul
          role="menu"
          aria-label="Asset actions"
          className={clsx(
            "absolute right-0 bottom-full mb-1 z-20 w-44",
            "bg-[var(--surface-overlay)] border border-[var(--border)] rounded shadow-modal py-1",
            "animate-fade-in",
          )}
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  setOpen(false);
                }}
                className={clsx(
                  "w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs",
                  "text-[var(--ink)] hover:bg-[var(--surface-sunken)]",
                  "focus-visible:outline-none focus-visible:bg-[var(--blue-50)]",
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
  /** Card density — "comfortable" (default) has a taller thumbnail. */
  density?: CardDensity;
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
  density = "comfortable",
  className,
}: AssetCardProps) {
  const derivedTags = tags ?? assetTags(asset);
  const badge = typeBadge(asset);
  const comments = commentCount(asset);

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
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (multiSelectActive) {
        onSelect?.(asset.id);
      } else {
        onOpen?.(asset.id);
      }
    }
  };

  return (
    <article
      role="option"
      tabIndex={0}
      aria-selected={selected}
      aria-label={asset.title}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-lg cursor-pointer select-none",
        "border border-[var(--border)] border-l-4",
        sourceKindAccent(asset.source_kind),
        "bg-[var(--surface)] transition-shadow duration-[100ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        selected
          ? "border-blue-400 ring-1 ring-blue-400 shadow-card-hover"
          : "shadow-card hover:shadow-card-hover hover:border-[var(--border-strong)]",
        className,
      )}
    >
      {/* Thumbnail — larger preview per mockup (AssetViewer used AS-IS) */}
      <div
        className={clsx(
          "relative w-full flex-shrink-0 overflow-hidden bg-[var(--surface-sunken)]",
          density === "comfortable" ? "h-36" : "h-24",
        )}
      >
        <AssetViewer asset={asset} mode="thumbnail" className="w-full h-full" />

        {/* File-type badge overlay */}
        {badge && (
          <span
            aria-hidden
            className={clsx(
              "absolute top-2 left-2 z-10 inline-flex items-center justify-center",
              "h-5 min-w-5 px-1 rounded text-[9px] font-bold tracking-wide shadow-sm",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        )}

        {/* Selection checkbox — top-right, hover-revealed (always visible when active) */}
        <button
          type="button"
          aria-label={selected ? "Deselect asset" : "Select asset"}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(asset.id);
          }}
          className={clsx(
            "absolute top-2 right-2 z-10 rounded",
            "transition-opacity duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:opacity-100",
            multiSelectActive || selected
              ? "opacity-100 text-blue-600"
              : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-[var(--ink-faint)] hover:text-blue-600",
          )}
        >
          {selected ? (
            <CheckSquare aria-hidden className="w-4 h-4" />
          ) : (
            <Square aria-hidden className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-1.5 p-3">
        {/* Title */}
        <p
          className="text-[13px] font-medium text-[var(--ink)] leading-tight line-clamp-2"
          title={asset.title}
        >
          {asset.title}
        </p>

        {/* Source icon + origin label */}
        <p className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
          <SourceIcon kind={asset.source_kind} className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {sourceLabel(asset.source_kind)}
            {asset.size_bytes ? ` · ${formatBytes(asset.size_bytes)}` : ""}
          </span>
          {linkCount > 0 && (
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <Link2 aria-hidden className="w-2.5 h-2.5" />
              {linkCount}
            </span>
          )}
          {bomSlot && (
            <span
              className="text-[10px] text-orange-600 dark:text-orange-400 font-medium truncate max-w-[80px] shrink-0"
              title={bomSlot}
            >
              BOM: {bomSlot}
            </span>
          )}
        </p>

        {/* Tag chips (≤3, +N overflow) */}
        {derivedTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
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

        {/* Footer: status + time · star / comments / overflow */}
        <div className="flex items-center gap-1.5 mt-auto pt-1.5">
          <StatusBadge status={asset.status} size="xs" />
          <span className="text-[10px] text-[var(--ink-faint)] whitespace-nowrap">
            {relativeTime(asset.captured_at)}
          </span>

          <div className="ml-auto flex items-center gap-0.5">
            <StarToggle asset={asset} />
            {comments !== null && comments > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] text-[var(--ink-muted)]"
                aria-label={`${comments} comment${comments !== 1 ? "s" : ""}`}
              >
                <MessageCircle aria-hidden className="w-3 h-3" />
                {comments}
              </span>
            )}
            <OverflowMenu
              asset={asset}
              onOpen={onOpen}
              onCopyLink={onCopyLink}
              onAddToPack={onAddToPack}
            />
          </div>
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
