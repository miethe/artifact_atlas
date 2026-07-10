"use client";

/**
 * CanonicalArtifactsPanel — assets with status="canonical", per the
 * command-center mockup: thumb + title/filename, Canonical chip, age,
 * owner, with an "N canonical assets / Manage canonical" footer.
 */

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { StatusBadge, EmptyState, SkeletonRow } from "@/components/ui";
import { AssetThumbnail } from "@/features/assets/components/AssetThumbnail";
import { AssetLink } from "@/features/assets/components/AssetLink";
import { PanelShell } from "./PanelShell";
import type { Asset } from "@/lib/types";

// ============================================================
// Helpers
// ============================================================

function sourceLabel(kind: string): string {
  const MAP: Record<string, string> = {
    local: "Local",
    claude: "Claude",
    chatgpt: "ChatGPT",
    figma: "Figma",
    url: "URL",
    manual: "Manual",
    vault: "Vault",
    github: "GitHub",
    notion: "Notion",
  };
  return MAP[kind] ?? kind;
}

function relativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================
// Row + list
// ============================================================

function CanonicalRow({
  asset,
  onOpenAsset,
}: {
  asset: Asset;
  onOpenAsset?: (id: string) => void;
}) {
  const age = relativeTime(asset.source_updated_at ?? asset.captured_at);
  const owner = asset.created_by;

  const body = (
    <>
      <AssetThumbnail asset={asset} size="xs" className="!w-6 !h-6 shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-[var(--ink)] truncate leading-tight">
          {asset.title}
        </span>
        <span className="block text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
          {sourceLabel(asset.source_kind)}
          {asset.artifact_type_id
            ? ` · ${asset.artifact_type_id.replace("artifact_type_", "")}`
            : ""}
          {age ? ` · ${age}` : ""}
          {owner ? ` · ${owner}` : ""}
        </span>
      </span>
      <StatusBadge status={asset.status} size="xs" showDot />
    </>
  );

  const rowClasses =
    "w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors";

  if (onOpenAsset) {
    return (
      <AssetLink
        assetId={asset.id}
        onOpen={onOpenAsset}
        aria-label={`Open ${asset.title}`}
        className={rowClasses}
      >
        {body}
      </AssetLink>
    );
  }
  return <div className={rowClasses}>{body}</div>;
}

function CanonicalList({
  assets,
  onOpenAsset,
}: {
  assets: Asset[];
  onOpenAsset?: (id: string) => void;
}) {
  return (
    <ul role="list" className="divide-y divide-[var(--border)]">
      {assets.map((asset) => (
        <li key={asset.id}>
          <CanonicalRow asset={asset} onOpenAsset={onOpenAsset} />
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Component
// ============================================================

interface CanonicalArtifactsPanelProps {
  projectId: string;
  assets: Asset[] | undefined;
  isLoading: boolean;
  viewAllHref?: string;
  onOpenAsset?: (id: string) => void;
}

export function CanonicalArtifactsPanel({
  projectId: _projectId,
  assets,
  isLoading,
  viewAllHref,
  onOpenAsset,
}: CanonicalArtifactsPanelProps) {
  const canonical = React.useMemo(
    () => (assets ?? []).filter((a) => a.status === "canonical"),
    [assets],
  );

  const preview = canonical.slice(0, 6);

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-[var(--ink-faint)] tabular-nums">
        {canonical.length} canonical asset{canonical.length !== 1 ? "s" : ""}
      </span>
      {viewAllHref && (
        <a
          href={viewAllHref}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 focus-ring rounded"
        >
          Manage canonical →
        </a>
      )}
    </div>
  );

  return (
    <PanelShell
      title="Canonical Artifacts"
      subtitle={`${canonical.length} promoted`}
      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
      ariaLabel="Canonical artifacts"
      viewAllHref={viewAllHref}
      footer={footer}
      expandedContent={
        <CanonicalList assets={canonical} onOpenAsset={onOpenAsset} />
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
          title="No canonical artifacts"
          description="Promote assets to canonical to see them here."
          icon={<CheckCircle2 className="w-8 h-8" />}
        />
      ) : (
        <CanonicalList assets={preview} onOpenAsset={onOpenAsset} />
      )}
    </PanelShell>
  );
}
