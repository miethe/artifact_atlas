"use client";

import * as React from "react";
import { clsx } from "clsx";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { AssetStatus } from "@/lib/types";

// ============================================================
// MoveSelectedDialog — keyboard alternative to drag/drop
// Moves selected cards to a target status/column
// ============================================================

export interface MoveTarget {
  id: string;
  label: string;
  description?: string;
  color: string;
}

export interface MoveSelectedDialogProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  targets: MoveTarget[];
  onMove: (targetId: AssetStatus) => Promise<void>;
}

export function MoveSelectedDialog({
  open,
  onClose,
  selectedCount,
  targets,
  onMove,
}: MoveSelectedDialogProps) {
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setSelectedTarget(null);
      setIsLoading(false);
      setIsSuccess(false);
      setIsError(false);
    }
  }, [open]);

  const handleMove = async () => {
    if (!selectedTarget) return;
    setIsLoading(true);
    setIsError(false);
    try {
      await onMove(selectedTarget as AssetStatus);
      setIsSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      setIsError(true);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentIdx = targets.findIndex((t) => t.id === selectedTarget);
      const next = targets[Math.min(currentIdx + 1, targets.length - 1)];
      setSelectedTarget(next?.id ?? null);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIdx = targets.findIndex((t) => t.id === selectedTarget);
      const prev = targets[Math.max(currentIdx - 1, 0)];
      setSelectedTarget(prev?.id ?? null);
    } else if (e.key === "Enter" && selectedTarget) {
      handleMove();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Move ${selectedCount} asset${selectedCount !== 1 ? "s" : ""}`}
      description="Use arrow keys to select a destination, then press Enter or click Move."
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedTarget || isLoading || isSuccess}
            loading={isLoading}
            onClick={handleMove}
            aria-label={`Move ${selectedCount} selected assets to ${selectedTarget ?? "selected column"}`}
          >
            {isSuccess ? "Moved" : "Move"}
          </Button>
        </>
      }
    >
      <div onKeyDown={handleKeyDown} className="space-y-1.5">
        {/* Target list */}
        {targets.map((target) => (
          <button
            key={target.id}
            type="button"
            role="radio"
            aria-checked={selectedTarget === target.id}
            onClick={() => setSelectedTarget(target.id)}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded border text-left",
              "transition-colors duration-75",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              selectedTarget === target.id
                ? "border-blue-400 bg-blue-50 ring-1 ring-blue-400"
                : "border-[var(--border)] hover:bg-gray-50",
            )}
          >
            <span
              aria-hidden
              className={clsx("w-2.5 h-2.5 rounded-full shrink-0", target.color)}
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-[var(--ink)]">
                {target.label}
              </span>
              {target.description && (
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  {target.description}
                </p>
              )}
            </div>
            {selectedTarget === target.id && (
              <CheckCircle2
                aria-hidden
                className="w-4 h-4 text-blue-600 shrink-0"
              />
            )}
          </button>
        ))}

        {/* Error state */}
        {isError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700 mt-2"
          >
            <AlertCircle aria-hidden className="w-3.5 h-3.5 shrink-0" />
            Move failed. The status update was rolled back.
          </div>
        )}
      </div>
    </Dialog>
  );
}
