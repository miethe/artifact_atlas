"use client";

import * as React from "react";
import { clsx } from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  FileText,
  Image as ImageIcon,
  File,
  Link2,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Asset } from "@/lib/types";

// ============================================================
// DraggableAssetCard — board card with dnd-kit sortable
// ============================================================

function AssetTypeIcon({ mimeType }: { mimeType?: string | null }) {
  if (!mimeType) return <File aria-hidden className="w-3.5 h-3.5 text-gray-400" />;
  if (mimeType.startsWith("image/"))
    return <ImageIcon aria-hidden className="w-3.5 h-3.5 text-blue-400" />;
  if (mimeType.startsWith("text/") || mimeType.includes("markdown") || mimeType.includes("yaml"))
    return <FileText aria-hidden className="w-3.5 h-3.5 text-gray-500" />;
  if (mimeType.includes("url") || mimeType.includes("html"))
    return <Link2 aria-hidden className="w-3.5 h-3.5 text-purple-500" />;
  return <File aria-hidden className="w-3.5 h-3.5 text-gray-400" />;
}

export interface DraggableAssetCardProps {
  asset: Asset;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  isDragOverlay?: boolean;
}

export function DraggableAssetCard({
  asset,
  selected,
  onToggleSelect,
  onOpenDetail,
  isDragOverlay = false,
}: DraggableAssetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id, disabled: isDragOverlay });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onToggleSelect(asset.id);
    } else {
      onToggleSelect(asset.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleSelect(asset.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="option"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleCardClick}
      className={clsx(
        "relative rounded border bg-[var(--surface)] p-2.5",
        "transition-shadow duration-75",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        // States
        isDragging && "opacity-30 shadow-none",
        isDragOverlay && "shadow-modal rotate-1 border-blue-300 bg-blue-50/50",
        selected && !isDragging && "border-blue-400 ring-1 ring-blue-400 bg-blue-50/30",
        !selected && !isDragging && "border-[var(--border)] hover:shadow-sm hover:border-[var(--border-strong)]",
        "cursor-pointer select-none",
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        aria-label={`Drag ${asset.title}`}
        className={clsx(
          "absolute left-1 top-1/2 -translate-y-1/2",
          "text-[var(--ink-faint)] hover:text-[var(--ink-muted)]",
          "cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded",
          isDragOverlay && "opacity-100",
        )}
        tabIndex={0}
      >
        <GripVertical aria-hidden className="w-3 h-3" />
      </div>

      {/* Content — left-pad to make space for drag handle on hover */}
      <div className="group pl-3 min-w-0">
        {/* Title row */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <AssetTypeIcon mimeType={asset.mime_type} />
          <p className="flex-1 min-w-0 text-xs font-medium text-[var(--ink)] leading-snug line-clamp-2">
            {asset.title}
          </p>
          {onOpenDetail && (
            <Tooltip content="Open detail">
              <button
                type="button"
                aria-label={`Open detail for ${asset.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(asset.id);
                }}
                className={clsx(
                  "shrink-0 rounded p-0.5 text-[var(--ink-faint)]",
                  "hover:text-blue-600 hover:bg-blue-50",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500",
                )}
              >
                <ExternalLink aria-hidden className="w-3 h-3" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={asset.status} size="xs" showDot />
          <SensitivityBadge sensitivity={asset.sensitivity} size="xs" />
          {asset.source_kind && (
            <span className="text-[10px] text-[var(--ink-faint)] bg-gray-100 px-1.5 py-0.5 rounded">
              {asset.source_kind}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
