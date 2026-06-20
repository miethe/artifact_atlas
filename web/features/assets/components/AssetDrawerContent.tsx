"use client";

/**
 * AssetDrawerContent — content rendered inside the shell RightDrawer
 * for quick-inspect of a selected asset.
 * Shows: preview, description, details, tags, node links, sensitivity, quick actions.
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
import { AssetPreview } from "./AssetPreview";
import { PolicyBadge } from "./PolicyBadge";
import { ProvenancePanel } from "./ProvenancePanel";

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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
        {label}
      </p>
      <div className="text-xs text-[var(--ink)]">{children}</div>
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

  const tags = asset.metadata
    ? Object.entries(asset.metadata)
        .filter(([, v]) => typeof v === "string")
        .map(([k]) => k)
        .slice(0, 5)
    : [];

  return (
    <div className="flex flex-col gap-0">
      {/* Preview */}
      <div className="p-3 border-b border-[var(--border)]">
        <AssetPreview asset={asset} size="md" />
      </div>

      {/* Title + status */}
      <div className="p-3 border-b border-[var(--border)] space-y-1.5">
        <h3 className="text-sm font-semibold text-[var(--ink)] leading-snug">
          {asset.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={asset.status} size="xs" />
          <SensitivityBadge sensitivity={asset.sensitivity} size="xs" showIcon={false} />
          <PolicyBadge agentAccess={asset.agent_access} size="xs" />
        </div>
      </div>

      {/* Description */}
      {asset.description && (
        <div className="px-3 py-2.5 border-b border-[var(--border)]">
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            {asset.description}
          </p>
        </div>
      )}

      {/* Details */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] space-y-2">
        <FieldRow label="Source">{asset.source_kind}</FieldRow>
        <FieldRow label="MIME">
          <span className="font-mono text-[11px]">{asset.mime_type ?? "—"}</span>
        </FieldRow>
        {asset.size_bytes && (
          <FieldRow label="Size">
            {asset.size_bytes < 1024 * 1024
              ? `${(asset.size_bytes / 1024).toFixed(0)} KB`
              : `${(asset.size_bytes / (1024 * 1024)).toFixed(1)} MB`}
          </FieldRow>
        )}
        <FieldRow label="Captured">
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(asset.captured_at))}
        </FieldRow>
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

      {/* Provenance (collapsed by default in drawer) */}
      <div className="px-3 py-2.5 border-b border-[var(--border)]">
        <ProvenancePanel asset={asset} collapsed />
      </div>

      {/* Quick actions */}
      <div className="p-3 space-y-2">
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
