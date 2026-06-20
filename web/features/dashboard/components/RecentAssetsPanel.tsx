"use client";

/**
 * RecentAssetsPanel — displays most recently captured/updated assets.
 * Data comes from useAssets hook (sorted by captured_at desc).
 */

import * as React from "react";
import { Clock, FileText } from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
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
// MIME type icon fallback label
// ============================================================

function mimeShortLabel(mime: string | null | undefined): string {
  if (!mime) return "FILE";
  if (mime.startsWith("image/")) return "IMG";
  if (mime === "text/markdown") return "MD";
  if (mime === "text/yaml" || mime === "application/yaml") return "YAML";
  if (mime === "application/json") return "JSON";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("text/")) return "TXT";
  return "FILE";
}

// ============================================================
// Component
// ============================================================

interface RecentAssetsPanelProps {
  projectId: string;
  assets: Asset[] | undefined;
  isLoading: boolean;
  viewAllHref?: string;
}

export function RecentAssetsPanel({
  projectId: _projectId,
  assets,
  isLoading,
  viewAllHref,
}: RecentAssetsPanelProps) {
  // Sort by captured_at descending and take top 8
  const sorted = React.useMemo(() => {
    if (!assets) return [];
    return [...assets]
      .sort(
        (a, b) =>
          new Date(b.captured_at).getTime() -
          new Date(a.captured_at).getTime(),
      )
      .slice(0, 8);
  }, [assets]);

  return (
    <PanelShell
      title="Recent Assets"
      subtitle={sorted.length > 0 ? `${sorted.length} shown` : undefined}
      icon={<Clock className="w-3.5 h-3.5" />}
      ariaLabel="Recently captured assets"
      viewAllHref={viewAllHref}
    >
      {isLoading && !assets ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          size="sm"
          title="No assets yet"
          description="Captured assets will appear here."
          icon={<FileText className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {sorted.map((asset) => (
            <li key={asset.id}>
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors focus-within:bg-[var(--surface-sunken)] group"
                tabIndex={0}
                role="listitem"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    // navigation placeholder — no router in this server-rendered shell
                  }
                }}
              >
                {/* Type label */}
                <span
                  aria-hidden
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[9px] font-bold text-[var(--ink-faint)] uppercase"
                >
                  {mimeShortLabel(asset.mime_type)}
                </span>

                {/* Title + source */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
                    {asset.title}
                  </p>
                  <p className="text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
                    {asset.source_kind} · {relativeTime(asset.captured_at)}
                  </p>
                </div>

                {/* Status badge */}
                <StatusBadge status={asset.status} size="xs" showDot />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
