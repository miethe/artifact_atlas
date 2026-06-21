"use client";

import * as React from "react";
import { clsx } from "clsx";
import { Kanban } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableAssetCard } from "./DraggableAssetCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Asset } from "@/lib/types";

// ============================================================
// BoardColumn — droppable column in the kanban board
// ============================================================

export interface BoardColumnProps {
  id: string;
  title: string;
  color: string;
  assets: Asset[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail?: (id: string) => void;
}

export function BoardColumn({
  id,
  title,
  color,
  assets,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={clsx(
        "flex flex-col w-72 shrink-0 rounded border",
        "border-[var(--border)] bg-[var(--surface-sunken)]",
        "transition-colors duration-100",
        isOver && "border-blue-300 bg-blue-50/40",
      )}
    >
      {/* 3px top accent bar using column color prop (P5-P1-007) */}
      <div aria-hidden className={clsx("h-[3px] w-full rounded-t shrink-0", color)} />

      {/* Column header */}
      <div
        className={clsx(
          "flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface)]",
        )}
      >
        <span
          aria-hidden
          className={clsx("w-2 h-2 rounded-full shrink-0", color)}
        />
        <span className="text-xs font-semibold text-[var(--ink)] flex-1 truncate">
          {title}
        </span>
        <span className="text-[11px] font-medium text-[var(--ink-muted)] bg-gray-100 rounded-full px-1.5 py-0.5">
          {assets.length}
        </span>
      </div>

      {/* Drop zone + card list */}
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 min-h-[80px] p-2 space-y-2 overflow-y-auto",
          "transition-colors duration-75",
        )}
        aria-label={`${title} column — ${assets.length} assets`}
      >
        <SortableContext
          items={assets.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {assets.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<Kanban className="w-8 h-8" aria-hidden />}
              title="No assets"
              description="Drag assets here to move them."
            />
          ) : (
            assets.map((asset) => (
              <DraggableAssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                onToggleSelect={onToggleSelect}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
