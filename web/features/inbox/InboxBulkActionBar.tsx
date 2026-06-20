"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  CheckSquare,
  X,
  Trash2,
  ArrowRight,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import type { AssetStatus } from "@/lib/types";

// ============================================================
// InboxBulkActionBar
// Shown when one or more inbox items are multi-selected
// ============================================================

const BULK_STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "raw", label: "Mark Raw" },
  { value: "candidate", label: "Mark Candidate" },
  { value: "in_review", label: "Send to Review" },
  { value: "archived", label: "Archive" },
];

export interface InboxBulkActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkStatus: (status: AssetStatus) => void;
  onBulkDelete: () => void;
  isLoading?: boolean;
}

export function InboxBulkActionBar({
  selectedIds,
  onClearSelection,
  onBulkStatus,
  onBulkDelete,
  isLoading = false,
}: InboxBulkActionBarProps) {
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const count = selectedIds.length;

  // Close menu on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    if (showStatusMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showStatusMenu]);

  // Close menu on Escape
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowStatusMenu(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={clsx(
        "flex items-center gap-3 px-4 py-2",
        "border-b border-[var(--border)] bg-blue-50",
        "animate-fade-in",
      )}
    >
      {/* Selection indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <CheckSquare aria-hidden className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          {count} selected
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-1">
        {/* Move to status */}
        <div ref={menuRef} className="relative">
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<ArrowRight aria-hidden className="w-3 h-3" />}
            onClick={() => setShowStatusMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={showStatusMenu}
            loading={isLoading}
          >
            Move to…
          </Button>

          {showStatusMenu && (
            <div
              role="menu"
              aria-label="Move selected items to status"
              className={clsx(
                "absolute top-full left-0 mt-1 z-20",
                "min-w-[160px] rounded border border-[var(--border)] bg-[var(--surface)] shadow-sm",
                "py-1",
              )}
            >
              {BULK_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  role="menuitem"
                  type="button"
                  className={clsx(
                    "w-full text-left px-3 py-1.5 text-xs text-[var(--ink)]",
                    "hover:bg-gray-50 focus-visible:outline-none focus-visible:bg-gray-100",
                  )}
                  onClick={() => {
                    onBulkStatus(opt.value);
                    setShowStatusMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tag */}
        <Button
          variant="secondary"
          size="xs"
          iconLeft={<Tag aria-hidden className="w-3 h-3" />}
          disabled
          aria-label="Tag selected items (coming soon)"
        >
          Tag
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="xs"
          iconLeft={<Trash2 aria-hidden className="w-3 h-3 text-red-500" />}
          onClick={onBulkDelete}
          className="text-red-600 hover:bg-red-50"
          aria-label="Delete selected items"
          disabled={isLoading}
        >
          Delete
        </Button>

        {isLoading && (
          <Loader2 aria-hidden className="w-3.5 h-3.5 text-blue-500 animate-spin ml-1" />
        )}
      </div>

      {/* Clear selection */}
      <IconButton
        aria-label="Clear selection"
        size="xs"
        onClick={onClearSelection}
      >
        <X aria-hidden className="w-3.5 h-3.5" />
      </IconButton>
    </div>
  );
}
