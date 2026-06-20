"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  Search,
  FileText,
  Bot,
  Download,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { NodeAgentAction } from "./NodeDemoFixtures";

// ============================================================
// NodeAgentActions — panel with runnable agent operations
// ============================================================

const ICON_MAP: Record<NodeAgentAction["icon_hint"], React.ReactNode> = {
  search: <Search aria-hidden className="w-3.5 h-3.5" />,
  document: <FileText aria-hidden className="w-3.5 h-3.5" />,
  agent: <Bot aria-hidden className="w-3.5 h-3.5" />,
  export: <Download aria-hidden className="w-3.5 h-3.5" />,
};

interface NodeAgentActionsProps {
  actions: NodeAgentAction[];
}

export function NodeAgentActions({ actions }: NodeAgentActionsProps) {
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(new Set());

  const handleRun = async (action: NodeAgentAction) => {
    if (action.disabled || runningId) return;
    setRunningId(action.id);

    // Simulate async agent task (1.2s demo)
    await new Promise((r) => setTimeout(r, 1200));

    setRunningId(null);
    setCompletedIds((prev) => new Set([...prev, action.id]));

    // Clear completion state after 3s
    setTimeout(() => {
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }, 3000);
  };

  return (
    <div className="space-y-2">
      {actions.map((action) => {
        const isRunning = runningId === action.id;
        const isDone = completedIds.has(action.id);

        return (
          <Tooltip key={action.id} content={action.description} side="left">
            <div
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded border",
                "transition-colors duration-75",
                action.disabled
                  ? "border-[var(--border)] bg-[var(--surface-sunken)] opacity-50 cursor-not-allowed"
                  : isDone
                  ? "border-green-200 bg-green-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-gray-50",
              )}
            >
              {/* Icon */}
              <div
                className={clsx(
                  "shrink-0 w-7 h-7 rounded flex items-center justify-center",
                  action.disabled
                    ? "bg-gray-100 text-gray-400"
                    : isDone
                    ? "bg-green-100 text-green-700"
                    : "bg-purple-50 text-purple-600",
                )}
                aria-hidden
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
                ) : isDone ? (
                  <PlayCircle className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  ICON_MAP[action.icon_hint]
                )}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--ink)] leading-tight truncate">
                  {action.label}
                </p>
                {isDone && (
                  <p className="text-[10px] text-green-700 mt-0.5">Completed</p>
                )}
              </div>

              {/* Run button */}
              <Button
                variant={isDone ? "ghost" : "secondary"}
                size="xs"
                disabled={action.disabled || isRunning || !!runningId}
                loading={isRunning}
                onClick={() => handleRun(action)}
                aria-label={`Run: ${action.label}`}
              >
                {isDone ? "Done" : isRunning ? "Running…" : "Run"}
              </Button>
            </div>
          </Tooltip>
        );
      })}

      {runningId && (
        <p
          role="status"
          aria-live="polite"
          className="text-[10px] text-[var(--ink-faint)] text-center mt-1"
        >
          Agent action in progress…
        </p>
      )}
    </div>
  );
}
