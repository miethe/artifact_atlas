"use client";

/**
 * ContextPacksPanel — available context packs for this project, per the
 * command-center mockup: icon rows with status chips + asset counts and an
 * "N context packs / Create new pack" footer.
 */

import * as React from "react";
import { Package } from "lucide-react";
import { EmptyState, SkeletonRow } from "@/components/ui";
import { PanelShell } from "./PanelShell";
import type { ContextPack, ContextPackStatus } from "@/lib/types";

// ============================================================
// Status badge colors
// ============================================================

const PACK_STATUS_CLASSES: Record<ContextPackStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  ready: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-400",
};

const PACK_STATUS_LABELS: Record<ContextPackStatus, string> = {
  draft: "Building",
  ready: "Ready",
  published: "Published",
  archived: "Archived",
};

// ============================================================
// Audience label
// ============================================================

function audienceLabel(audience: string): string {
  const MAP: Record<string, string> = {
    agent: "Agent",
    human: "Human",
    engineering_agent: "Eng. Agent",
    research_agent: "Research",
    writing_agent: "Writing",
    custom: "Custom",
  };
  return MAP[audience] ?? audience;
}

// ============================================================
// Row + list
// ============================================================

function PackRow({ pack }: { pack: ContextPack }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
      <span
        aria-hidden
        className="shrink-0 w-6 h-6 rounded bg-purple-50 text-purple-500 flex items-center justify-center"
      >
        <Package className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
          {pack.name}
        </p>
        <p className="text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
          {audienceLabel(pack.audience)} · {pack.item_count} asset
          {pack.item_count !== 1 ? "s" : ""}
        </p>
      </div>
      <span
        role="status"
        aria-label={`Pack status: ${PACK_STATUS_LABELS[pack.status]}`}
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${PACK_STATUS_CLASSES[pack.status]}`}
      >
        {PACK_STATUS_LABELS[pack.status]}
      </span>
    </div>
  );
}

function PackList({ packs }: { packs: ContextPack[] }) {
  return (
    <ul role="list" className="divide-y divide-[var(--border)]">
      {packs.map((pack) => (
        <li key={pack.id}>
          <PackRow pack={pack} />
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Component
// ============================================================

interface ContextPacksPanelProps {
  projectId: string;
  packs: ContextPack[] | undefined;
  isLoading: boolean;
  viewAllHref?: string;
}

export function ContextPacksPanel({
  projectId: _projectId,
  packs,
  isLoading,
  viewAllHref,
}: ContextPacksPanelProps) {
  const nonArchived = React.useMemo(
    () => (packs ?? []).filter((p) => p.status !== "archived"),
    [packs],
  );
  const preview = nonArchived.slice(0, 6);

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-[var(--ink-faint)] tabular-nums">
        {nonArchived.length} context pack{nonArchived.length !== 1 ? "s" : ""}
      </span>
      {viewAllHref && (
        <a
          href={viewAllHref}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 focus-ring rounded"
        >
          Create new pack →
        </a>
      )}
    </div>
  );

  return (
    <PanelShell
      title="Context Packs"
      subtitle={preview.length > 0 ? `${nonArchived.length} available` : undefined}
      icon={<Package className="w-3.5 h-3.5" />}
      ariaLabel="Project context packs"
      viewAllHref={viewAllHref}
      footer={nonArchived.length > 0 ? footer : undefined}
      expandedContent={<PackList packs={nonArchived} />}
    >
      {isLoading && !packs ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : preview.length === 0 ? (
        <EmptyState
          size="sm"
          title="No context packs"
          description="Create a context pack to bundle artifacts for agent handoff."
          icon={<Package className="w-8 h-8" />}
        />
      ) : (
        <PackList packs={preview} />
      )}
    </PanelShell>
  );
}
