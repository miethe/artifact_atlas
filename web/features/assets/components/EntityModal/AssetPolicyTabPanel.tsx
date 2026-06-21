"use client";

/**
 * AssetPolicyTabPanel — Policy tab for the AssetTabRegistry.
 * Shows: agent access policy, sensitivity, and permission details.
 */

import * as React from "react";
import { useAsset } from "@/lib/hooks/useAssets";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { PolicyPanel } from "../PolicyBadge";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function AssetPolicyTabPanel({
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
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Sensitivity */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          Sensitivity
        </p>
        <SensitivityBadge
          sensitivity={asset.sensitivity}
          size="sm"
          showIcon
        />
      </div>

      {/* Agent access policy panel */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          Agent access policy
        </p>
        <PolicyPanel agentAccess={asset.agent_access} />
      </div>
    </div>
  );
}
