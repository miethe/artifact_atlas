"use client";

/**
 * ActiveNodesPanel — active IntentTree nodes for the project, per the
 * command-center mockup: node-code chip + title/subtitle + task count +
 * status chip, with an "IntentTree: N linked nodes / Open in IntentTree"
 * footer. Uses the shared fixture module (IntentTree API not yet
 * implemented in Phase 1).
 */

import * as React from "react";
import { ExternalLink, GitBranch } from "lucide-react";
import { EmptyState, SkeletonRow } from "@/components/ui";
import { PanelShell } from "./PanelShell";
import {
  activeIntentNodes,
  FIXTURE_INTENT_NODES,
  linkedIntentNodeCount,
  type IntentNode,
} from "../intentNodes";

const STATUS_CLASSES: Record<IntentNode["status"], string> = {
  active: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  review: "bg-purple-100 text-purple-700",
  planned: "bg-gray-100 text-gray-600",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<IntentNode["status"], string> = {
  active: "In Progress",
  blocked: "Blocked",
  pending: "Pending",
  review: "Review",
  planned: "Planned",
  completed: "Done",
};

// ============================================================
// Node row / list
// ============================================================

function NodeRow({ node }: { node: IntentNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
      {/* Node code chip */}
      <span className="shrink-0 px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[10px] font-mono font-medium text-[var(--ink-muted)]">
        {node.code}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-[var(--ink)] truncate leading-tight">
          {node.title}
        </span>
        {node.subtitle && (
          <span className="block text-[10px] text-[var(--ink-faint)] truncate leading-tight mt-px">
            {node.subtitle}
          </span>
        )}
      </span>
      <span className="text-[10px] text-[var(--ink-faint)] shrink-0 tabular-nums">
        {node.task_count} task{node.task_count !== 1 ? "s" : ""}
      </span>
      <span
        role="status"
        aria-label={`Status: ${STATUS_LABELS[node.status]}`}
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_CLASSES[node.status]}`}
      >
        {STATUS_LABELS[node.status]}
      </span>
    </div>
  );
}

function NodeList({ nodes }: { nodes: IntentNode[] }) {
  return (
    <ul role="list" className="divide-y divide-[var(--border)]">
      {nodes.map((node) => (
        <li key={node.id}>
          <NodeRow node={node} />
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Component
// ============================================================

interface ActiveNodesPanelProps {
  projectId: string;
  isLoading?: boolean;
  viewAllHref?: string;
}

export function ActiveNodesPanel({
  projectId: _projectId,
  isLoading = false,
  viewAllHref,
}: ActiveNodesPanelProps) {
  const nodes = activeIntentNodes();
  const linkedCount = linkedIntentNodeCount();

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-[var(--ink-faint)]">
        IntentTree: {linkedCount} linked node{linkedCount !== 1 ? "s" : ""}
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600">
        <ExternalLink aria-hidden className="w-2.5 h-2.5" />
        Open in IntentTree
      </span>
    </div>
  );

  return (
    <PanelShell
      title="Active IntentTree Nodes"
      subtitle="IntentTree"
      icon={<GitBranch className="w-3.5 h-3.5" />}
      ariaLabel="Active IntentTree nodes"
      viewAllHref={viewAllHref}
      footer={footer}
      expandedContent={<NodeList nodes={FIXTURE_INTENT_NODES} />}
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
        <NodeList nodes={nodes} />
      )}
    </PanelShell>
  );
}
