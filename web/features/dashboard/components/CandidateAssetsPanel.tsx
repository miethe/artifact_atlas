"use client";

/**
 * CandidateAssetsPanel — assets in candidate/selected/in_review states.
 * Shows what's in the promotion pipeline awaiting review.
 */

import * as React from "react";
import { Box } from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
import { AssetThumbnail } from "@/features/assets/components/AssetThumbnail";
import { PanelShell } from "./PanelShell";
import type { Asset } from "@/lib/types";

// ============================================================
// Component
// ============================================================

interface CandidateAssetsPanelProps {
  projectId: string;
  assets: Asset[] | undefined;
  isLoading: boolean;
  viewAllHref?: string;
}

export function CandidateAssetsPanel({
  projectId: _projectId,
  assets,
  isLoading,
  viewAllHref,
}: CandidateAssetsPanelProps) {
  const candidates = React.useMemo(
    () =>
      (assets ?? []).filter((a) =>
        ["candidate", "selected", "in_review", "in_progress"].includes(a.status),
      ),
    [assets],
  );

  return (
    <PanelShell
      title="Candidate Assets"
      subtitle={`${candidates.length} in pipeline`}
      icon={<Box className="w-3.5 h-3.5" />}
      ariaLabel="Candidate assets in promotion pipeline"
      viewAllHref={viewAllHref}
    >
      {isLoading && !assets ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          size="sm"
          title="No candidates"
          description="Classify raw assets to begin the promotion pipeline."
          icon={<Box className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {candidates.map((asset) => (
            <li key={asset.id}>
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
                    {asset.source_kind}
                    {asset.artifact_type_id
                      ? ` · ${asset.artifact_type_id.replace("artifact_type_", "")}`
                      : ""}
                  </p>
                </div>
                <StatusBadge status={asset.status} size="xs" showDot />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
