"use client";

/**
 * ActiveNodesPanel — displays active IntentTree nodes for the project.
 * Uses fixture data (IntentTree API not yet implemented in Phase 1).
 */

import * as React from "react";
import { GitBranch } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
import { PanelShell } from "./PanelShell";

// ============================================================
// Fixture — IntentTree nodes (Phase 1 doesn't expose a node list endpoint)
// ============================================================

interface IntentNode {
  id: string;
  title: string;
  status: "active" | "blocked" | "pending" | "completed";
  depth: number;
  asset_count: number;
}

const FIXTURE_NODES: IntentNode[] = [
  {
    id: "node_phase2_ui",
    title: "Phase 2: Web Shell & Asset Workflows",
    status: "active",
    depth: 1,
    asset_count: 4,
  },
  {
    id: "node_stage2a",
    title: "Stage 2A — Project Command Center",
    status: "active",
    depth: 2,
    asset_count: 2,
  },
  {
    id: "node_api_contract",
    title: "API Contract (Phase 0)",
    status: "completed",
    depth: 1,
    asset_count: 1,
  },
];

const STATUS_CLASSES: Record<IntentNode["status"], string> = {
  active: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<IntentNode["status"], string> = {
  active: "Active",
  blocked: "Blocked",
  pending: "Pending",
  completed: "Done",
};

// ============================================================
// Component
// ============================================================

interface ActiveNodesPanelProps {
  projectId: string;
  isLoading?: boolean;
}

export function ActiveNodesPanel({
  projectId: _projectId,
  isLoading = false,
}: ActiveNodesPanelProps) {
  // IntentTree node endpoint not in Phase 1 contract — use fixtures
  const nodes = FIXTURE_NODES.filter((n) => n.status !== "completed");

  return (
    <PanelShell
      title="Active Intent Nodes"
      subtitle="IntentTree"
      icon={<GitBranch className="w-3.5 h-3.5" />}
      ariaLabel="Active IntentTree nodes"
    >
      {isLoading ? (
        <div className="p-2 flex flex-col gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : nodes.length === 0 ? (
        <EmptyState
          size="sm"
          title="No active nodes"
          description="All intent nodes are pending or completed."
          icon={<GitBranch className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {nodes.map((node) => (
            <li key={node.id}>
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors"
                style={{ paddingLeft: `${0.75 + node.depth * 0.5}rem` }}
              >
                <GitBranch
                  aria-hidden
                  className="w-3 h-3 text-[var(--ink-faint)] shrink-0"
                />
                <span className="flex-1 text-xs text-[var(--ink)] truncate">
                  {node.title}
                </span>
                <span className="text-[10px] text-[var(--ink-faint)] shrink-0 tabular-nums">
                  {node.asset_count} asset{node.asset_count !== 1 ? "s" : ""}
                </span>
                <span
                  role="status"
                  aria-label={`Status: ${STATUS_LABELS[node.status]}`}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_CLASSES[node.status]}`}
                >
                  {STATUS_LABELS[node.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
