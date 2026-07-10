"use client";

/**
 * LifecycleStageStrip — Raw | Candidate | Selected | Canonical stage strip
 * (per the dashboard mockup). The current stage is highlighted; clicking a
 * different stage requests a promotion via the existing promote endpoint.
 * Canonical promotion is confirm-gated by the parent.
 *
 * Statuses outside the four display stages (inbox, in_review, in_progress,
 * archived) map to their nearest stage and surface as a small sub-label.
 */

import * as React from "react";
import { clsx } from "clsx";
import type { AssetStatus } from "@/lib/types";

const STAGES: { key: AssetStatus; label: string }[] = [
  { key: "raw", label: "Raw" },
  { key: "candidate", label: "Candidate" },
  { key: "selected", label: "Selected" },
  { key: "canonical", label: "Canonical" },
];

/** Map any lifecycle status onto the 4-stage display strip (-1 = none). */
function stageIndex(status: AssetStatus): number {
  switch (status) {
    case "inbox":
    case "raw":
      return 0;
    case "candidate":
    case "in_review":
    case "in_progress":
      return 1;
    case "selected":
      return 2;
    case "canonical":
      return 3;
    default:
      return -1; // archived
  }
}

export interface LifecycleStageStripProps {
  status: AssetStatus;
  /** Request a transition to a stage status (parent handles confirm + API). */
  onSelectStage: (target: AssetStatus) => void;
  disabled?: boolean;
  className?: string;
}

export function LifecycleStageStrip({
  status,
  onSelectStage,
  disabled,
  className,
}: LifecycleStageStripProps) {
  const activeIdx = stageIndex(status);
  const isSubStatus = !STAGES.some((s) => s.key === status);

  return (
    <div className={clsx("flex flex-col items-end gap-1", className)}>
      <div
        role="group"
        aria-label="Lifecycle stage"
        className={clsx(
          "inline-flex items-center rounded-lg border border-[var(--border)]",
          "bg-[var(--surface-sunken)] p-0.5",
        )}
      >
        {STAGES.map((stage, i) => {
          const isActive = i === activeIdx;
          return (
            <button
              key={stage.key}
              type="button"
              disabled={disabled || isActive}
              aria-pressed={isActive}
              title={
                isActive
                  ? `Current stage: ${stage.label}`
                  : `Promote to ${stage.label}`
              }
              onClick={() => onSelectStage(stage.key)}
              className={clsx(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors duration-[100ms]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                isActive
                  ? "bg-[var(--surface-raised)] text-blue-600 shadow-sm border border-[var(--border)]"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-60",
              )}
            >
              {stage.label}
            </button>
          );
        })}
      </div>
      {isSubStatus && (
        <p className="text-[10px] text-[var(--ink-muted)]">
          Current status:{" "}
          <span className="font-medium text-[var(--ink)]">
            {status.replace(/_/g, " ")}
          </span>
        </p>
      )}
    </div>
  );
}
