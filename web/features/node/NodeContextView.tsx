"use client";

/**
 * NodeContextView — IntentTree node context scaffold
 * UI-NODE-001
 * Renders from demo node refs + linked assets (backend optional)
 */

import * as React from "react";
import { clsx } from "clsx";
import { Workflow, FolderOpen, Sparkles } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { NodeMetaHeader } from "./NodeMetaHeader";
import { NodeLinkedEntities } from "./NodeLinkedEntities";
import { NodeAgentActions } from "./NodeAgentActions";
import {
  getDemoNode,
  getDemoLinkedEntities,
  DEMO_NODE_AGENT_ACTIONS,
} from "./NodeDemoFixtures";
import { useAssets } from "@/lib/hooks/useAssets";
import { useAssetModal } from "@/features/assets/hooks/useAssetModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { Asset } from "@/lib/types";

// ============================================================
// Tab types
// ============================================================

type NodeTab = "context" | "assets" | "outputs";

const TAB_OPTIONS: { value: NodeTab; label: string }[] = [
  { value: "context", label: "Context" },
  { value: "assets", label: "Assets" },
  { value: "outputs", label: "Outputs" },
];

// ============================================================
// NodeContextView
// ============================================================

interface NodeContextViewProps {
  nodeId: string;
  projectId: string;
}

export function NodeContextView({ nodeId, projectId }: NodeContextViewProps) {
  const [activeTab, setActiveTab] = React.useState<NodeTab>("context");

  // Asset modal — mounted once per view, URL-driven (?item=)
  const { openAsset, assetModal } = useAssetModal(projectId);

  // Use demo node (extend to real API when available)
  const node = getDemoNode(nodeId);
  const linkedEntities = getDemoLinkedEntities(nodeId);

  // Assets from the project (filter those linked to this node)
  const { data: assetsPage, isLoading: assetsLoading } = useAssets(projectId);
  const linkedAssetIds = new Set(
    linkedEntities.filter((e) => e.kind === "asset").map((e) => e.id),
  );
  const linkedAssets: Asset[] = (assetsPage?.items ?? []).filter((a) =>
    linkedAssetIds.has(a.id),
  );

  if (!node) {
    return (
      <EmptyState
        icon={<Workflow className="h-5 w-5" />}
        title="Node not found"
        description="This IntentTree node does not exist or was not found in fixtures."
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Node identity header */}
      <NodeMetaHeader node={node} />

      {/* Tab bar */}
      <div className="px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={(v) => setActiveTab(v as NodeTab)}
          size="sm"
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "context" && (
          <ContextTab entities={linkedEntities} onOpenAsset={openAsset} />
        )}
        {activeTab === "assets" && (
          <AssetsTab assets={linkedAssets} isLoading={assetsLoading} />
        )}
        {activeTab === "outputs" && (
          <OutputsTab nodeId={nodeId} />
        )}
      </div>

      {/* Asset detail modal — mounted once, URL-driven */}
      {assetModal}
    </div>
  );
}

// ============================================================
// Context tab — linked entities + agent actions side by side
// ============================================================

function ContextTab({
  entities,
  onOpenAsset,
}: {
  entities: ReturnType<typeof getDemoLinkedEntities>;
  onOpenAsset: (assetId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-0 h-full">
      {/* Linked entities */}
      <div className="border-r border-[var(--border)] px-4 py-3 overflow-y-auto">
        <SectionHeading>Linked Entities</SectionHeading>
        <NodeLinkedEntities entities={entities} onOpenAsset={onOpenAsset} />
      </div>

      {/* Agent actions */}
      <div className="px-4 py-3 overflow-y-auto">
        <SectionHeading>Agent Actions</SectionHeading>
        <NodeAgentActions actions={DEMO_NODE_AGENT_ACTIONS} />
      </div>
    </div>
  );
}

// ============================================================
// Assets tab
// ============================================================

function AssetsTab({
  assets,
  isLoading,
}: {
  assets: Asset[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<FolderOpen className="h-5 w-5" />}
        title="No linked assets"
        description="Assets linked to this node via the asset library will appear here."
      />
    );
  }

  return (
    <div className="p-4 space-y-1.5">
      {assets.map((asset) => (
        <AssetRow key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function AssetRow({ asset }: { asset: Asset }) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded border border-[var(--border)]",
        "bg-[var(--surface)] hover:bg-gray-50 transition-colors",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--ink)] truncate">
          {asset.title}
        </p>
        {asset.description && (
          <p className="text-[10px] text-[var(--ink-muted)] truncate mt-0.5">
            {asset.description}
          </p>
        )}
      </div>
      <StatusBadge status={asset.status} size="xs" />
    </div>
  );
}

// ============================================================
// Outputs tab
// ============================================================

function OutputsTab({ nodeId }: { nodeId: string }) {
  return (
    <div className="p-4">
      <EmptyState
        size="sm"
        icon={<Sparkles className="h-5 w-5" />}
        title="No outputs yet"
        description={`Outputs generated by agent actions for node ${nodeId} will appear here.`}
      />
    </div>
  );
}

// ============================================================
// Section heading
// ============================================================

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}
