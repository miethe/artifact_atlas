"use client";

/**
 * CanonicalArtifactsPanel — assets with status="canonical".
 * These are the promoted/approved artifacts for the project.
 */

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
import { AssetThumbnail } from "@/features/assets/components/AssetThumbnail";
import { AssetLink } from "@/features/assets/components/AssetLink";
import { PanelShell } from "./PanelShell";
import type { Asset } from "@/lib/types";

// ============================================================
// Source kind label
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

  return (
    <PanelShell
      title="Canonical Artifacts"
      subtitle={`${canonical.length} promoted`}
      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
      ariaLabel="Canonical artifacts"
      viewAllHref={viewAllHref}
    >
      {isLoading && !assets ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : canonical.length === 0 ? (
        <EmptyState
          size="sm"
          title="No canonical artifacts"
          description="Promote assets to canonical to see them here."
          icon={<CheckCircle2 className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {canonical.map((asset) => (
            <li key={asset.id}>
              {onOpenAsset ? (
                <AssetLink
                  assetId={asset.id}
                  onOpen={onOpenAsset}
                  aria-label={`Open ${asset.title}`}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors"
                >
                  {/* 24×24 asset thumbnail (P5-P1-004) */}
                  <AssetThumbnail
                    asset={asset}
                    size="xs"
                    className="!w-6 !h-6 shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium text-[var(--ink)] truncate leading-tight">
                      {asset.title}
                    </span>
                    <span className="block text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
                      {sourceLabel(asset.source_kind)}
                      {asset.artifact_type_id
                        ? ` · ${asset.artifact_type_id.replace("artifact_type_", "")}`
                        : ""}
                    </span>
                  </span>
                  <StatusBadge status={asset.status} size="xs" showDot />
                </AssetLink>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
                  {/* 24×24 asset thumbnail (P5-P1-004) */}
                  <AssetThumbnail
                    asset={asset}
                    size="xs"
                    className="!w-6 !h-6 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
                      {asset.title}
                    </p>
                    <p className="text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
                      {sourceLabel(asset.source_kind)}
                      {asset.artifact_type_id
                        ? ` · ${asset.artifact_type_id.replace("artifact_type_", "")}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={asset.status} size="xs" showDot />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
