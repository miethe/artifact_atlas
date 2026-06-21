"use client";

/**
 * AssetPreviewTabPanel — Preview tab for the AssetTabRegistry.
 * Shows: visual preview (AssetPreview), title, status badges, description.
 * Used in EntityModal for the asset "preview" tab (P2b migration).
 */

import * as React from "react";
import { useAsset } from "@/lib/hooks/useAssets";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { PolicyBadge } from "../PolicyBadge";
import { AssetPreview } from "../AssetPreview";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function AssetPreviewTabPanel({
  entityId,
  projectId: _projectId,
}: TabPanelProps) {
  const { data: asset, isLoading } = useAsset(entityId);

  if (isLoading) return <PanelSkeleton />;

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Asset not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Visual preview */}
      <AssetPreview asset={asset} size="lg" />

      {/* Title + badges */}
      <div className="flex flex-col gap-1.5">
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
        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
          {asset.description}
        </p>
      )}
    </div>
  );
}
