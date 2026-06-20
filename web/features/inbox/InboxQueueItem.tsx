"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  FileText,
  Image,
  Link2,
  File,
  CheckSquare,
  Square,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import type { InboxItem } from "@/lib/types";

// ============================================================
// Source kind icon map
// ============================================================

function SourceIcon({ mimeType }: { mimeType?: string | null }) {
  if (!mimeType) return <File aria-hidden className="w-4 h-4 text-gray-400" />;
  if (mimeType.startsWith("image/"))
    return <Image aria-hidden className="w-4 h-4 text-blue-400" />;
  if (mimeType.startsWith("text/") || mimeType.includes("markdown"))
    return <FileText aria-hidden className="w-4 h-4 text-gray-500" />;
  if (mimeType.includes("url") || mimeType.includes("html"))
    return <Link2 aria-hidden className="w-4 h-4 text-purple-500" />;
  return <File aria-hidden className="w-4 h-4 text-gray-400" />;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ============================================================
// InboxQueueItem
// ============================================================

export interface InboxQueueItemProps {
  item: InboxItem;
  selected: boolean;
  multiSelected: boolean;
  onSelect: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
  isDragging?: boolean;
}

export function InboxQueueItem({
  item,
  selected,
  multiSelected,
  onSelect,
  onToggleMultiSelect,
  isDragging = false,
}: InboxQueueItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      onToggleMultiSelect(item.id);
    } else {
      onSelect(item.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        onToggleMultiSelect(item.id);
      } else {
        onSelect(item.id);
      }
    }
  };

  return (
    <div
      role="option"
      aria-selected={selected || multiSelected}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        "group flex items-start gap-2.5 px-3 py-2.5 cursor-pointer",
        "border-b border-[var(--border)] transition-colors duration-75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
        selected && "bg-blue-50 border-l-2 border-l-blue-500",
        !selected && multiSelected && "bg-blue-50/60 border-l-2 border-l-blue-300",
        !selected && !multiSelected && "hover:bg-gray-50",
        isDragging && "opacity-50",
      )}
    >
      {/* Checkbox for multi-select */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMultiSelect(item.id);
        }}
        aria-label={multiSelected ? `Deselect ${item.title}` : `Select ${item.title}`}
        className={clsx(
          "shrink-0 mt-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          multiSelected && "opacity-100",
        )}
      >
        {multiSelected ? (
          <CheckSquare aria-hidden className="w-4 h-4 text-blue-600" />
        ) : (
          <Square aria-hidden className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Source icon */}
      <div className="shrink-0 mt-0.5">
        <SourceIcon mimeType={item.mime_type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--ink)] truncate leading-tight">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <StatusBadge status={item.status} size="xs" showDot />
          <SensitivityBadge sensitivity={item.sensitivity} size="xs" />
          <span className="flex items-center gap-0.5 text-[10px] text-[var(--ink-faint)]">
            <Clock aria-hidden className="w-2.5 h-2.5" />
            {relativeTime(item.captured_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
