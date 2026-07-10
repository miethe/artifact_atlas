"use client";

/**
 * AssetTimelineView — Timeline tab of the asset library.
 *
 * Groups assets into date buckets (Today, Yesterday, This Week, This Month,
 * then per calendar month) by captured_at and renders a vertical timeline.
 * Assets are passed in pre-filtered/sorted by the library.
 */

import * as React from "react";
import { clsx } from "clsx";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TagChip } from "@/components/ui/TagChip";
import type { Asset } from "@/lib/types";
import { AssetViewer } from "./AssetViewer";
import {
  assetTags,
  formatBytes,
  relativeTime,
  sourceLabel,
  SourceIcon,
  typeBadge,
} from "./assetDisplay";

// ============================================================
// Date bucketing
// ============================================================

interface TimelineBucket {
  key: string;
  label: string;
  assets: Asset[];
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function bucketFor(iso: string, now: Date): { key: string; label: string; order: number } {
  const date = new Date(iso);
  const todayStart = startOfDay(now);
  const ts = date.getTime();
  const dayMs = 24 * 3600_000;

  if (ts >= todayStart) return { key: "today", label: "Today", order: 0 };
  if (ts >= todayStart - dayMs) return { key: "yesterday", label: "Yesterday", order: 1 };
  if (ts >= todayStart - 6 * dayMs) return { key: "week", label: "Earlier this week", order: 2 };
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (ts >= monthStart) return { key: "month", label: "Earlier this month", order: 3 };

  // Per calendar month, newest first
  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
  const order = 4 + (now.getFullYear() * 12 + now.getMonth()) - (date.getFullYear() * 12 + date.getMonth());
  return { key: `m-${date.getFullYear()}-${date.getMonth()}`, label, order };
}

function buildBuckets(assets: Asset[]): TimelineBucket[] {
  const now = new Date();
  const map = new Map<string, { label: string; order: number; assets: Asset[] }>();
  for (const asset of assets) {
    const b = bucketFor(asset.captured_at, now);
    const entry = map.get(b.key) ?? { label: b.label, order: b.order, assets: [] };
    entry.assets.push(asset);
    map.set(b.key, entry);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].order - b[1].order)
    .map(([key, v]) => ({ key, label: v.label, assets: v.assets }));
}

// ============================================================
// Timeline row
// ============================================================

function TimelineRow({
  asset,
  onOpen,
}: {
  asset: Asset;
  onOpen?: (assetId: string) => void;
}) {
  const badge = typeBadge(asset);
  const tags = assetTags(asset);
  return (
    <li className="relative pl-6">
      {/* Timeline dot */}
      <span
        aria-hidden
        className="absolute left-0 top-4 w-2.5 h-2.5 rounded-full bg-[var(--surface)] border-2 border-blue-500 -translate-x-[calc(50%-1px)]"
      />
      <button
        type="button"
        onClick={() => onOpen?.(asset.id)}
        aria-label={asset.title}
        className={clsx(
          "w-full text-left flex items-center gap-3 p-2 rounded-md",
          "border border-[var(--border)] bg-[var(--surface)]",
          "shadow-card hover:shadow-card-hover transition-shadow duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-16 h-12 shrink-0 overflow-hidden rounded bg-[var(--surface-sunken)]">
          <AssetViewer asset={asset} mode="thumbnail" className="w-full h-full" />
          {badge && (
            <span
              aria-hidden
              className={clsx(
                "absolute top-0.5 left-0.5 inline-flex items-center justify-center",
                "h-3.5 min-w-3.5 px-0.5 rounded-sm text-[7px] font-bold tracking-wide",
                badge.className,
              )}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <p className="text-xs font-medium text-[var(--ink)] truncate" title={asset.title}>
            {asset.title}
          </p>
          <p className="flex items-center gap-1 text-[10px] text-[var(--ink-muted)]">
            <SourceIcon kind={asset.source_kind} className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">
              {sourceLabel(asset.source_kind)}
              {asset.size_bytes ? ` · ${formatBytes(asset.size_bytes)}` : ""}
            </span>
          </p>
        </div>

        {/* Tags (wide screens) */}
        {tags.length > 0 && (
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {tags.slice(0, 2).map((tag) => (
              <TagChip key={tag} label={tag} size="xs" />
            ))}
          </div>
        )}

        {/* Status + time */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={asset.status} size="xs" />
          <span className="text-[10px] text-[var(--ink-faint)] whitespace-nowrap w-14 text-right">
            {relativeTime(asset.captured_at)}
          </span>
        </div>
      </button>
    </li>
  );
}

// ============================================================
// AssetTimelineView
// ============================================================

export interface AssetTimelineViewProps {
  assets: Asset[];
  onOpen?: (assetId: string) => void;
  className?: string;
}

export function AssetTimelineView({ assets, onOpen, className }: AssetTimelineViewProps) {
  const buckets = React.useMemo(() => buildBuckets(assets), [assets]);

  if (buckets.length === 0) return null;

  return (
    <div className={clsx("p-4 max-w-3xl", className)}>
      {buckets.map((bucket) => (
        <section key={bucket.key} aria-label={bucket.label} className="mb-5 last:mb-0">
          <h3 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2 flex items-center gap-2">
            {bucket.label}
            <span className="text-[10px] font-normal text-[var(--ink-faint)] tabular-nums">
              {bucket.assets.length}
            </span>
          </h3>
          {/* Vertical timeline line */}
          <ul className="relative flex flex-col gap-2 border-l-2 border-[var(--border)] ml-1">
            {bucket.assets.map((asset) => (
              <TimelineRow key={asset.id} asset={asset} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
