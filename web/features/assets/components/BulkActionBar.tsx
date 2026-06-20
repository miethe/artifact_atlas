"use client";

/**
 * BulkActionBar — appears when 1+ assets are selected in the library.
 * Provides: count, clear, status change, add to pack, copy links.
 * Status-changing actions require explicit confirmation (canonical gate).
 */

import * as React from "react";
import { clsx } from "clsx";
import { X, Package, Tag, ArrowRightCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Dialog } from "@/components/ui/Dialog";
import type { AssetStatus } from "@/lib/types";

export interface BulkActionBarProps {
  selectedIds: string[];
  onClear: () => void;
  onBulkStatus?: (targetStatus: AssetStatus, ids: string[]) => void;
  onBulkAddToPack?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: AssetStatus; label: string; requiresConfirm?: boolean }[] = [
  { value: "candidate", label: "Mark Candidate" },
  { value: "in_review", label: "Send for Review" },
  { value: "selected", label: "Select" },
  { value: "canonical", label: "Promote Canonical", requiresConfirm: true },
  { value: "archived", label: "Archive" },
];

export function BulkActionBar({
  selectedIds,
  onClear,
  onBulkStatus,
  onBulkAddToPack,
  onBulkDelete,
  className,
}: BulkActionBarProps) {
  const [statusMenuOpen, setStatusMenuOpen] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    targetStatus: AssetStatus;
    label: string;
  } | null>(null);

  const count = selectedIds.length;
  if (count === 0) return null;

  function handleStatusSelect(opt: { value: AssetStatus; label: string; requiresConfirm?: boolean }) {
    setStatusMenuOpen(false);
    if (opt.requiresConfirm) {
      setConfirmDialog({ targetStatus: opt.value, label: opt.label });
    } else {
      onBulkStatus?.(opt.value, selectedIds);
    }
  }

  return (
    <>
      <div
        role="toolbar"
        aria-label={`Bulk actions for ${count} selected asset${count !== 1 ? "s" : ""}`}
        className={clsx(
          "flex items-center gap-2 px-4 py-2",
          "bg-blue-50 border border-blue-200 rounded-[8px]",
          "animate-slide-in-up",
          className,
        )}
      >
        {/* Count + clear */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-blue-700 tabular-nums whitespace-nowrap">
            {count} selected
          </span>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Clear selection"
            onClick={onClear}
          >
            <X aria-hidden className="w-3 h-3" />
          </IconButton>
        </div>

        <div className="w-px h-4 bg-blue-200 shrink-0" aria-hidden />

        {/* Status change */}
        {onBulkStatus && (
          <div className="relative">
            <Button
              size="xs"
              variant="ghost"
              iconLeft={<ArrowRightCircle aria-hidden className="w-3 h-3" />}
              onClick={() => setStatusMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={statusMenuOpen}
            >
              Set status
            </Button>
            {statusMenuOpen && (
              <ul
                role="menu"
                className={clsx(
                  "absolute left-0 bottom-full mb-1 z-20",
                  "w-44 bg-white border border-[var(--border)] rounded shadow-modal py-1",
                  "animate-fade-in",
                )}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <li key={opt.value} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleStatusSelect(opt)}
                      className={clsx(
                        "w-full text-left px-3 py-1.5 text-xs text-[var(--ink)]",
                        "hover:bg-gray-50 transition-colors duration-[100ms]",
                        "focus-visible:outline-none focus-visible:bg-blue-50",
                        opt.requiresConfirm && "text-amber-700 font-medium",
                      )}
                    >
                      {opt.label}
                      {opt.requiresConfirm && (
                        <span className="ml-1 text-[10px] text-amber-500">(confirm)</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Add to context pack */}
        {onBulkAddToPack && (
          <Button
            size="xs"
            variant="ghost"
            iconLeft={<Package aria-hidden className="w-3 h-3" />}
            onClick={() => onBulkAddToPack(selectedIds)}
          >
            Add to pack
          </Button>
        )}

        {/* Tag (placeholder) */}
        <Button
          size="xs"
          variant="ghost"
          iconLeft={<Tag aria-hidden className="w-3 h-3" />}
          disabled
          title="Bulk tagging (coming soon)"
        >
          Tag
        </Button>

        {/* Delete */}
        {onBulkDelete && (
          <Button
            size="xs"
            variant="danger"
            iconLeft={<Trash2 aria-hidden className="w-3 h-3" />}
            className="ml-auto"
            onClick={() => onBulkDelete(selectedIds)}
          >
            Delete
          </Button>
        )}
      </div>

      {/* Canonical promotion confirm dialog */}
      {confirmDialog && (
        <Dialog
          open={!!confirmDialog}
          onClose={() => setConfirmDialog(null)}
          title={`Confirm: ${confirmDialog.label}`}
          description={`You are about to promote ${count} asset${count !== 1 ? "s" : ""} to "${confirmDialog.label}". This action is auditable and may affect agent access. Review carefully before confirming.`}
          size="sm"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onBulkStatus?.(confirmDialog.targetStatus, selectedIds);
                  setConfirmDialog(null);
                }}
              >
                Confirm {confirmDialog.label}
              </Button>
            </>
          }
        >
          <p className="text-xs text-[var(--ink-muted)]">
            Assets: {count} selected
          </p>
        </Dialog>
      )}
    </>
  );
}
