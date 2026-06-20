"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  GitBranch,
  Target,
  Milestone,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { TagChip } from "@/components/ui/TagChip";
import type { IntentNode } from "./NodeDemoFixtures";

// ============================================================
// NodeMetaHeader — node identity, status, type, dates
// ============================================================

const NODE_TYPE_CONFIG: Record<
  IntentNode["node_type"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  intent: {
    label: "Intent",
    icon: <Target aria-hidden className="w-3.5 h-3.5" />,
    color: "text-blue-600 bg-blue-50",
  },
  task: {
    label: "Task",
    icon: <GitBranch aria-hidden className="w-3.5 h-3.5" />,
    color: "text-green-700 bg-green-50",
  },
  milestone: {
    label: "Milestone",
    icon: <Milestone aria-hidden className="w-3.5 h-3.5" />,
    color: "text-purple-700 bg-purple-50",
  },
  decision: {
    label: "Decision",
    icon: <HelpCircle aria-hidden className="w-3.5 h-3.5" />,
    color: "text-amber-700 bg-amber-50",
  },
};

const STATUS_CONFIG: Record<
  IntentNode["status"],
  { label: string; dot: string; text: string; bg: string }
> = {
  active: { label: "Active", dot: "bg-green-500", text: "text-green-700", bg: "bg-green-100" },
  blocked: { label: "Blocked", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-100" },
  complete: { label: "Complete", dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100" },
  draft: { label: "Draft", dot: "bg-blue-400", text: "text-blue-700", bg: "bg-blue-100" },
};

interface NodeMetaHeaderProps {
  node: IntentNode;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function NodeMetaHeader({ node }: NodeMetaHeaderProps) {
  const typeConfig = NODE_TYPE_CONFIG[node.node_type];
  const statusConfig = STATUS_CONFIG[node.status];
  const metaEntries = node.metadata ? Object.entries(node.metadata) : [];

  return (
    <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
      {/* Type + status row */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={clsx(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium",
            typeConfig.color,
          )}
        >
          {typeConfig.icon}
          {typeConfig.label}
        </span>

        <span
          role="status"
          aria-label={`Status: ${statusConfig.label}`}
          className={clsx(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
            statusConfig.bg,
            statusConfig.text,
          )}
        >
          <span
            aria-hidden
            className={clsx("w-1.5 h-1.5 rounded-full", statusConfig.dot)}
          />
          {statusConfig.label}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-base font-semibold text-[var(--ink)] leading-snug mb-1">
        {node.title}
      </h1>

      {/* Description */}
      {node.description && (
        <p className="text-sm text-[var(--ink-muted)] leading-relaxed mb-3 line-clamp-3">
          {node.description}
        </p>
      )}

      {/* Date row */}
      <div className="flex items-center gap-4 text-[11px] text-[var(--ink-faint)] mb-2">
        <span className="flex items-center gap-1">
          <Calendar aria-hidden className="w-3 h-3" />
          Created {formatDate(node.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <Calendar aria-hidden className="w-3 h-3" />
          Updated {formatDate(node.updated_at)}
        </span>
      </div>

      {/* Metadata tags */}
      {metaEntries.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {metaEntries.map(([k, v]) => (
            <TagChip
              key={k}
              label={`${k}: ${String(v)}`}
              size="xs"
              color="default"
            />
          ))}
        </div>
      )}
    </div>
  );
}
