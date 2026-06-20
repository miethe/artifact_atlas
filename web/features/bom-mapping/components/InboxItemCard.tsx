"use client";

/**
 * InboxItemCard — draggable inbox item card for BOM mapping.
 * BOM-UI-005
 */

import * as React from "react";
import { clsx } from "clsx";
import { useDraggable } from "@dnd-kit/core";
import {
  FileText,
  Image,
  File,
  Link,
  GripVertical,
  CheckCircle2,
} from "lucide-react";
import type { InboxItem } from "@/lib/types";

// ============================================================
// MIME icon helper
// ============================================================

function MimeIcon({ mimeType }: { mimeType: string | null | undefined }) {
  if (!mimeType) return <File className="w-4 h-4 text-gray-400" aria-hidden />;
  if (mimeType.startsWith("image/"))
    return <Image className="w-4 h-4 text-purple-500" aria-hidden />;
  if (mimeType.includes("markdown") || mimeType.includes("text"))
    return <FileText className="w-4 h-4 text-blue-500" aria-hidden />;
  if (mimeType.includes("pdf"))
    return <FileText className="w-4 h-4 text-red-500" aria-hidden />;
  return <Link className="w-4 h-4 text-gray-400" aria-hidden />;
}

// ============================================================
// InboxItemCard props
// ============================================================

export interface InboxItemCardProps {
  item: InboxItem;
  isMapped: boolean;
  isSelected: boolean;
  onSelect: () => void;
  /** Optional — shown when card is used in drag overlay */
  isDragOverlay?: boolean;
}

// ============================================================
// InboxItemCard
// ============================================================

export function InboxItemCard({
  item,
  isMapped,
  isSelected,
  onSelect,
  isDragOverlay = false,
}: InboxItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: { type: "inbox-item", item },
      disabled: isMapped,
    });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
      }
    : {};

  const capturedDate = new Date(item.captured_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-start gap-2 p-2.5 rounded-lg border transition-all duration-100 cursor-pointer select-none",
        "focus-within:ring-2 focus-within:ring-blue-500",
        isDragOverlay && "shadow-lg rotate-1 opacity-90",
        isDragging && "opacity-30",
        isMapped
          ? "border-green-200 bg-green-50"
          : isSelected
            ? "border-blue-300 bg-blue-50"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-blue-200 hover:bg-blue-50/30",
      )}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Drag handle */}
      {!isMapped && (
        <button
          type="button"
          {...listeners}
          {...attributes}
          aria-label={`Drag ${item.title} to a BOM slot`}
          className="shrink-0 mt-0.5 text-[var(--ink-faint)] hover:text-[var(--ink)] cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" aria-hidden />
        </button>
      )}

      {/* MIME icon */}
      <div className="shrink-0 mt-0.5">
        <MimeIcon mimeType={item.mime_type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[var(--ink)] leading-snug line-clamp-2">
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px] text-[var(--ink-faint)] capitalize">
            {item.source_kind}
          </span>
          <span className="text-[10px] text-[var(--ink-faint)]">·</span>
          <span className="text-[10px] text-[var(--ink-faint)]">{capturedDate}</span>
        </div>
      </div>

      {/* Mapped indicator */}
      {isMapped && (
        <CheckCircle2
          className="w-4 h-4 text-green-600 shrink-0"
          aria-label="Mapped to a BOM slot"
        />
      )}
    </div>
  );
}

// ============================================================
// InboxItemCardOverlay — used in DragOverlay (no drag hooks)
// ============================================================

export function InboxItemCardOverlay({ item }: { item: InboxItem }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border border-blue-300 bg-white shadow-lg rotate-1 opacity-95 w-56">
      <GripVertical className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" aria-hidden />
      <MimeIcon mimeType={item.mime_type} />
      <p className="text-xs font-medium text-[var(--ink)] leading-snug line-clamp-2 flex-1">
        {item.title}
      </p>
    </div>
  );
}
