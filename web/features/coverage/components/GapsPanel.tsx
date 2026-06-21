"use client";

/**
 * GapsPanel — actionable gap recommendations list.
 * Gap → task creation is EXPLICIT and draft-only (never auto-created).
 * BOM-UI-006
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  AlertTriangle,
  Clock,
  Lock,
  FileQuestion,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { GapRecommendation } from "../hooks/useCoverageData";

// ============================================================
// Priority config
// ============================================================

type Priority = GapRecommendation["priority"];

/**
 * Priority tiers mirror the backend GapRecommendation model ("high" | "medium" | "low").
 * Required-missing slots (isRequiredMissing=true) render with red styling within "high"
 * instead of a separate "critical" tier.
 */
const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bg: string; text: string; icon: React.ElementType }
> = {
  high: {
    label: "High",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: Clock,
  },
  medium: {
    label: "Medium",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: FileQuestion,
  },
  low: {
    label: "Low",
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-600",
    icon: Lock,
  },
};

// ============================================================
// DraftTaskConfirmDialog — shown when user explicitly requests task creation
// ============================================================

interface DraftTaskConfirmDialogProps {
  gap: GapRecommendation;
  onConfirm: () => void;
  onCancel: () => void;
}

function DraftTaskConfirmDialog({
  gap,
  onConfirm,
  onCancel,
}: DraftTaskConfirmDialogProps) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="draft-task-dialog-title"
      aria-describedby="draft-task-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    >
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-xl p-6 max-w-md w-full mx-4">
        <h2
          id="draft-task-dialog-title"
          className="text-base font-semibold text-[var(--ink)] mb-2"
        >
          Create draft task?
        </h2>
        <p
          id="draft-task-dialog-desc"
          className="text-sm text-[var(--ink-muted)] mb-1"
        >
          This will create a{" "}
          <strong className="text-[var(--ink)]">draft-only</strong> task in
          IntentTree for:
        </p>
        <p className="text-sm font-medium text-[var(--ink)] mb-4 bg-gray-50 rounded px-3 py-2 border border-[var(--border)]">
          {gap.slotName}
        </p>
        <p className="text-xs text-[var(--ink-muted)] mb-4">
          Draft tasks are not auto-promoted. You must review and publish in
          IntentTree before they become active.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Create draft task
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GapCard
// ============================================================

interface GapCardProps {
  gap: GapRecommendation;
  onRequestTask: (gap: GapRecommendation) => void;
  onAssignAsset: (gap: GapRecommendation) => void;
}

function GapCard({ gap, onRequestTask, onAssignAsset }: GapCardProps) {
  // Required-missing slots render with red urgency styling while still carrying "high" priority.
  const cfg = gap.isRequiredMissing
    ? { label: "Required / Missing", bg: "bg-red-50 border-red-200", text: "text-red-700", icon: AlertTriangle }
    : PRIORITY_CONFIG[gap.priority];
  const Icon = cfg.icon;
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div
      className={clsx(
        "rounded-lg border p-3 flex flex-col gap-2 transition-all duration-100",
        cfg.bg,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Icon
          aria-hidden
          className={clsx("w-4 h-4 mt-0.5 shrink-0", cfg.text)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={clsx(
                "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded",
                cfg.text,
                "bg-white/60",
              )}
            >
              {cfg.label}
            </span>
            {gap.domain && (
              <span className="text-[10px] text-[var(--ink-faint)] capitalize">
                {gap.domain}
              </span>
            )}
            {gap.phase && (
              <span className="text-[10px] text-[var(--ink-faint)] capitalize">
                · {gap.phase}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-[var(--ink)] mt-0.5 leading-snug">
            {gap.slotName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse recommendation" : "Expand recommendation"}
          className="shrink-0 text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden />
          )}
        </button>
      </div>

      {/* Recommendation text (expandable) */}
      {expanded && (
        <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed pl-6">
          {gap.recommendation}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pl-6">
        <Button
          variant="secondary"
          size="xs"
          iconLeft={<ArrowRight aria-hidden className="w-3 h-3" />}
          onClick={() => onAssignAsset(gap)}
        >
          Assign asset
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onRequestTask(gap)}
          title="Explicitly request a draft-only IntentTree task (not auto-created)"
        >
          Request task (draft)
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// GapsPanel
// ============================================================

export interface GapsPanelProps {
  gaps: GapRecommendation[];
  onAssignAsset?: (gap: GapRecommendation) => void;
  className?: string;
}

export function GapsPanel({ gaps, onAssignAsset, className }: GapsPanelProps) {
  const [taskTarget, setTaskTarget] = React.useState<GapRecommendation | null>(
    null,
  );
  const [confirmedTasks, setConfirmedTasks] = React.useState<Set<string>>(
    new Set(),
  );

  const handleRequestTask = (gap: GapRecommendation) => {
    setTaskTarget(gap);
  };

  const handleConfirmTask = () => {
    if (taskTarget) {
      setConfirmedTasks((prev) => new Set([...prev, taskTarget.slotId]));
      setTaskTarget(null);
      // In a real implementation this would call the IntentTree API with draft status
    }
  };

  const sorted = [...gaps].sort((a, b) => {
    const order: Priority[] = ["high", "medium", "low"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });

  return (
    <>
      <div className={clsx("flex flex-col gap-2", className)}>
        {sorted.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-700">
              No active gaps — all required slots are covered.
            </p>
          </div>
        ) : (
          sorted.map((gap) => (
            <GapCard
              key={gap.slotId}
              gap={gap}
              onRequestTask={handleRequestTask}
              onAssignAsset={(g) => onAssignAsset?.(g)}
            />
          ))
        )}
        {confirmedTasks.size > 0 && (
          <p className="text-[11px] text-[var(--ink-faint)] text-center pt-1">
            {confirmedTasks.size} draft task
            {confirmedTasks.size !== 1 ? "s" : ""} queued for review in IntentTree
          </p>
        )}
      </div>

      {/* Explicit confirmation dialog */}
      {taskTarget && (
        <DraftTaskConfirmDialog
          gap={taskTarget}
          onConfirm={handleConfirmTask}
          onCancel={() => setTaskTarget(null)}
        />
      )}
    </>
  );
}
