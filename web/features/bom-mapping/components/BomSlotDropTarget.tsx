"use client";

/**
 * BomSlotDropTarget — droppable BOM slot tile in the mapping grid.
 * Accepts inbox item drops; shows status, current assignment, confidence.
 * BOM-UI-005
 */

import * as React from "react";
import { clsx } from "clsx";
import { useDroppable } from "@dnd-kit/core";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Ban,
  X,
} from "lucide-react";
import type { BomSlot, BomSlotStatus, InboxItem } from "@/lib/types";
import type { ConfidenceLevel } from "../hooks/useBomMapping";

// ============================================================
// Slot status icons
// ============================================================

const STATUS_ICONS: Record<BomSlotStatus, React.ElementType> = {
  complete: CheckCircle2,
  in_progress: Clock,
  partial: AlertCircle,
  missing: Circle,
  stale: Clock,
  blocked: Ban,
  not_applicable: Ban,
};

const STATUS_COLORS: Record<BomSlotStatus, string> = {
  complete: "text-green-600",
  in_progress: "text-sky-600",
  partial: "text-amber-600",
  missing: "text-gray-400",
  stale: "text-orange-500",
  blocked: "text-gray-400",
  not_applicable: "text-gray-300",
};

// ============================================================
// Confidence badge config
// ============================================================

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; bg: string; text: string }
> = {
  high: { label: "High match", bg: "bg-green-100", text: "text-green-700" },
  medium: { label: "Medium match", bg: "bg-amber-100", text: "text-amber-700" },
  low: { label: "Low match", bg: "bg-gray-100", text: "text-gray-600" },
  conflict: { label: "Conflict", bg: "bg-red-100", text: "text-red-700" },
};

// ============================================================
// BomSlotDropTarget props
// ============================================================

export interface BomSlotDropTargetProps {
  slot: BomSlot;
  mappedItem: InboxItem | null;
  suggestedConfidence: ConfidenceLevel | null;
  onRemoveMapping: () => void;
  onAcceptSuggestion: () => void;
}

// ============================================================
// BomSlotDropTarget
// ============================================================

export function BomSlotDropTarget({
  slot,
  mappedItem,
  suggestedConfidence,
  onRemoveMapping,
  onAcceptSuggestion,
}: BomSlotDropTargetProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: "bom-slot", slot },
    disabled: slot.status === "not_applicable" || slot.status === "complete",
  });

  const StatusIcon = STATUS_ICONS[slot.status];
  const confCfg = suggestedConfidence
    ? CONFIDENCE_CONFIG[suggestedConfidence]
    : null;

  const isAcceptable =
    slot.status !== "not_applicable" && slot.status !== "complete";

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all duration-100",
        // Base
        slot.status === "not_applicable"
          ? "bg-gray-50 border-gray-200 opacity-60"
          : slot.status === "complete"
            ? "bg-green-50 border-green-200"
            : mappedItem
              ? "bg-blue-50 border-blue-300"
              : "bg-[var(--surface)] border-[var(--border)]",
        // Drop over highlight
        isOver && isAcceptable && "ring-2 ring-blue-400 bg-blue-50 scale-[1.01]",
        isOver && !isAcceptable && "ring-2 ring-red-300 bg-red-50",
      )}
      aria-label={`BOM slot: ${slot.name}, status: ${slot.status}${mappedItem ? `, mapped to ${mappedItem.title}` : ""}`}
    >
      {/* Required pip */}
      {slot.required && (
        <span
          aria-label="Required slot"
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-400"
        />
      )}

      {/* Slot header */}
      <div className="flex items-center gap-1.5">
        <StatusIcon
          aria-hidden
          className={clsx("w-3.5 h-3.5 shrink-0", STATUS_COLORS[slot.status])}
        />
        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-muted)]">
          {slot.status.replace("_", " ")}
        </span>
      </div>

      {/* Slot name */}
      <p className="text-xs font-semibold text-[var(--ink)] leading-snug line-clamp-2">
        {slot.name}
      </p>

      {/* Domain / phase */}
      <div className="flex items-center gap-1 flex-wrap">
        {slot.domain && (
          <span className="text-[10px] text-[var(--ink-faint)] capitalize bg-gray-100 px-1.5 py-0.5 rounded">
            {slot.domain}
          </span>
        )}
        {slot.phase && (
          <span className="text-[10px] text-[var(--ink-faint)] capitalize bg-gray-100 px-1.5 py-0.5 rounded">
            {slot.phase}
          </span>
        )}
      </div>

      {/* Mapped item */}
      {mappedItem ? (
        <div className="flex items-center gap-1.5 mt-0.5 rounded bg-blue-100 border border-blue-200 px-2 py-1">
          <span className="text-[10px] font-medium text-blue-700 flex-1 truncate">
            {mappedItem.title}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveMapping();
            }}
            aria-label={`Remove mapping of ${mappedItem.title}`}
            className="shrink-0 text-blue-400 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
          >
            <X className="w-3 h-3" aria-hidden />
          </button>
        </div>
      ) : (
        /* Drop zone placeholder */
        isAcceptable && (
          <div
            className={clsx(
              "rounded border border-dashed px-2 py-1.5 text-center transition-colors duration-100",
              isOver
                ? "border-blue-400 bg-blue-100/50"
                : "border-gray-200",
            )}
            aria-hidden
          >
            <p className="text-[10px] text-[var(--ink-faint)]">
              {isOver ? "Drop here" : "Drop or select below"}
            </p>
          </div>
        )
      )}

      {/* Confidence badge */}
      {!mappedItem && confCfg && (
        <div className="mt-0.5">
          <div
            className={clsx(
              "flex items-center justify-between gap-1 rounded px-2 py-1 border",
              confCfg.bg,
              "border-transparent",
            )}
          >
            <span className={clsx("text-[10px] font-semibold", confCfg.text)}>
              {confCfg.label}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAcceptSuggestion();
              }}
              className={clsx(
                "text-[10px] font-semibold underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded",
                confCfg.text,
              )}
              aria-label="Accept suggested mapping for this slot"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
