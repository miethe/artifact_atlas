"use client";

/**
 * ContextPacksPanel — shows available context packs for this project.
 * Data from useContextPacks hook with fixture fallback.
 */

import * as React from "react";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
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
  draft: "Draft",
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
  const visible = React.useMemo(
    () => (packs ?? []).filter((p) => p.status !== "archived").slice(0, 6),
    [packs],
  );

  return (
    <PanelShell
      title="Context Packs"
      subtitle={visible.length > 0 ? `${visible.length} available` : undefined}
      icon={<Package className="w-3.5 h-3.5" />}
      ariaLabel="Project context packs"
      viewAllHref={viewAllHref}
    >
      {isLoading && !packs ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          size="sm"
          title="No context packs"
          description="Create a context pack to bundle artifacts for agent handoff."
          icon={<Package className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {visible.map((pack) => (
            <li key={pack.id}>
              <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
                <Package
                  aria-hidden
                  className="w-3.5 h-3.5 text-purple-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
                    {pack.name}
                  </p>
                  <p className="text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
                    {audienceLabel(pack.audience)} · {pack.item_count} item
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
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
