"use client";

/**
 * AssetDrawerContent — content rendered inside the shell RightDrawer
 * for quick-inspect of a selected asset (mockup right-panel fidelity pass).
 *
 * Sections: preview, title + source row, status chip, Description (Show more),
 * Details rows (Source, Type, Size, Uploaded, Updated, Created by), Tags,
 * Sensitivity, Provenance, Quick Actions.
 */

import * as React from "react";
import { clsx } from "clsx";
import { ExternalLink, Copy, Package, Edit2 } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { TagChip } from "@/components/ui/TagChip";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Asset } from "@/lib/types";
import { AssetViewer } from "./AssetViewer";
import { PolicyBadge } from "./PolicyBadge";
import { ProvenancePanel } from "./ProvenancePanel";
import {
  assetTags,
  formatBytes,
  formatDate,
  relativeTime,
  sourceLabel,
  SourceIcon,
  typeLabel,
  updatedAt,
} from "./assetDisplay";

// ============================================================
// AssetDrawerContent
// ============================================================

export interface AssetDrawerContentProps {
  asset: Asset | null | undefined;
  loading?: boolean;
  projectId: string;
  onEdit?: (assetId: string) => void;
  onAddToPack?: (assetId: string) => void;
  onCopyLink?: (assetId: string) => void;
  className?: string;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-[11px] text-[var(--ink-muted)] shrink-0 w-20">{label}</p>
      <div className="text-xs text-[var(--ink)] text-right min-w-0 flex-1">{children}</div>
    </div>
  );
}

const DESCRIPTION_CLAMP = 160;

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const needsClamp = text.length > DESCRIPTION_CLAMP;
  const shown = expanded || !needsClamp ? text : `${text.slice(0, DESCRIPTION_CLAMP).trimEnd()}…`;

  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">
        Description
      </p>
      <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{shown}</p>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

export function AssetDrawerContent({
  asset,
  loading = false,
  projectId,
  onEdit,
  onAddToPack,
  onCopyLink,
}: AssetDrawerContentProps) {
  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <Skeleton className="w-full h-32 rounded" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-4 text-center text-xs text-[var(--ink-muted)]">
        Select an asset to inspect
      </div>
    );
  }

  const tags = assetTags(asset);
  const updated = updatedAt(asset);
  const originalHref =
    asset.original_uri && /^https?:\/\//.test(asset.original_uri)
      ? asset.original_uri
      : /^https?:\/\//.test(asset.uri)
        ? asset.uri
        : null;

  return (
    <div className="flex flex-col gap-0">
      {/* Preview — real content via AssetViewer. Constrained to a compact
          drawer-friendly height so multi-page docs scroll internally. */}
      <div className="p-3 border-b border-[var(--border)]">
        <AssetViewer asset={asset} mode="full" className="max-h-[45vh]" />
      </div>

      {/* Title + source row + status */}
      <div className="p-3 border-b border-[var(--border)] space-y-1.5">
        <h3 className="text-sm font-semibold text-[var(--ink)] leading-snug">
          {asset.title}
        </h3>
        <p className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
          <SourceIcon kind={asset.source_kind} className="w-3 h-3" />
          {sourceLabel(asset.source_kind)}
          <span aria-hidden>·</span>
          {relativeTime(asset.captured_at)}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={asset.status} size="xs" />
          <PolicyBadge agentAccess={asset.agent_access} size="xs" />
        </div>
      </div>

      {/* Description with Show more */}
      {asset.description && (
        <div className="px-3 py-2.5 border-b border-[var(--border)]">
          <Description text={asset.description} />
        </div>
      )}

      {/* Details */}
      <div className="px-3 py-2.5 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          Details
        </p>
        <div className="space-y-1.5">
          <DetailRow label="Source">
            <span className="inline-flex items-center gap-1">
              <SourceIcon kind={asset.source_kind} className="w-3 h-3" />
              {sourceLabel(asset.source_kind)}
            </span>
          </DetailRow>
          <DetailRow label="Type">
            <span className="font-mono text-[11px]" title={asset.mime_type ?? undefined}>
              {typeLabel(asset)}
            </span>
          </DetailRow>
          {asset.size_bytes ? (
            <DetailRow label="Size">{formatBytes(asset.size_bytes)}</DetailRow>
          ) : null}
          <DetailRow label="Uploaded">{formatDate(asset.captured_at)}</DetailRow>
          <DetailRow label="Updated">
            {updated ? formatDate(updated) : "—"}
          </DetailRow>
          <DetailRow label="Created by">
            {asset.created_by ?? (asset.generated_by ? `${asset.generated_by} (generated)` : "—")}
          </DetailRow>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-3 py-2.5 border-b border-[var(--border)]">
          <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
            Tags
          </p>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagChip key={tag} label={tag} size="xs" />
            ))}
          </div>
        </div>
      )}

      {/* Sensitivity */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
          Sensitivity
        </p>
        <SensitivityBadge sensitivity={asset.sensitivity} size="xs" />
      </div>

      {/* Provenance (collapsed by default in drawer) */}
      <div className="px-3 py-2.5 border-b border-[var(--border)]">
        <ProvenancePanel asset={asset} collapsed />
      </div>

      {/* Quick actions */}
      <div className="p-3 space-y-2">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
          Quick Actions
        </p>
        <Link
          href={`/projects/${projectId}/assets/${asset.id}`}
          className={clsx(
            "flex items-center gap-2 w-full h-8 px-3 rounded text-xs font-medium",
            "bg-blue-600 text-white hover:bg-blue-700 transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          <ExternalLink aria-hidden className="w-3.5 h-3.5 shrink-0" />
          Open full detail
        </Link>

        {originalHref && (
          <a
            href={originalHref}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "flex items-center gap-2 w-full h-8 px-3 rounded text-xs font-medium",
              "border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface-sunken)] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
          >
            <SourceIcon kind={asset.source_kind} className="w-3.5 h-3.5 shrink-0" />
            Open in {sourceLabel(asset.source_kind)}
          </a>
        )}

        <div className="flex gap-1.5">
          {onEdit && (
            <Button
              size="xs"
              variant="secondary"
              iconLeft={<Edit2 aria-hidden className="w-3 h-3" />}
              onClick={() => onEdit(asset.id)}
              className="flex-1"
            >
              Edit metadata
            </Button>
          )}
          {onCopyLink && (
            <Button
              size="xs"
              variant="ghost"
              iconLeft={<Copy aria-hidden className="w-3 h-3" />}
              aria-label="Copy asset link"
              onClick={() => onCopyLink(asset.id)}
            >
              Copy
            </Button>
          )}
          {onAddToPack && (
            <Button
              size="xs"
              variant="ghost"
              iconLeft={<Package aria-hidden className="w-3 h-3" />}
              aria-label="Add to context pack"
              onClick={() => onAddToPack(asset.id)}
            >
              Pack
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
