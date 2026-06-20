"use client";

/**
 * BomMappingView — Inbox → BOM Mapping full-page view.
 * BOM-UI-005
 * Drag/drop (@dnd-kit) + keyboard alternative (KeyboardMappingPanel).
 * Confidence states: high / medium / low / conflict.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Keyboard,
  RefreshCw,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { InboxItemCard, InboxItemCardOverlay } from "./components/InboxItemCard";
import { BomSlotDropTarget } from "./components/BomSlotDropTarget";
import { SuggestedClassificationPanel } from "./components/SuggestedClassificationPanel";
import { KeyboardMappingPanel } from "./components/KeyboardMappingPanel";
import { useBomMapping, type SuggestedMatch } from "./hooks/useBomMapping";
import type { InboxItem } from "@/lib/types";

// ============================================================
// BomMappingView
// ============================================================

interface BomMappingViewProps {
  projectId: string;
}

export function BomMappingView({ projectId }: BomMappingViewProps) {
  const {
    items,
    slots,
    suggestions,
    mappings,
    confirmMapping,
    removeMapping,
    acceptSuggestion,
    isLoading,
    isError,
    refetch,
  } = useBomMapping(projectId);

  const [activeItem, setActiveItem] = React.useState<InboxItem | null>(null);
  const [selectedInboxId, setSelectedInboxId] = React.useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(true);

  // ---- dnd-kit sensors ----
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ---- Drag handlers ----
  const handleDragStart = ({ active }: DragStartEvent) => {
    const item = items.find((i) => i.id === active.id);
    setActiveItem(item ?? null);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveItem(null);
    if (!over) return;

    const inboxItemId = active.id as string;
    const slotId = over.id as string;

    // Verify drop target is a slot
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    if (slot.status === "not_applicable" || slot.status === "complete") return;

    try {
      await confirmMapping(inboxItemId, slotId);
    } catch {
      // error surfaced by mutation
    }
  };

  // ---- Computed ----
  const mappedCount = mappings.size;
  const totalItems = items.length;

  // For each slot, find the suggestion with highest confidence
  function slotSuggestion(slotId: string): SuggestedMatch | null {
    const ORDER = ["high", "medium", "low", "conflict"] as const;
    return (
      suggestions
        .filter((s) => s.slotId === slotId)
        .sort((a, b) => ORDER.indexOf(a.confidence) - ORDER.indexOf(b.confidence))[0] ?? null
    );
  }

  // ---- Loading / error ----
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center p-12">
        <EmptyState
          title="Failed to load mapping view"
          description="Could not fetch inbox or BOM data."
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            <span className="font-semibold text-[var(--ink)]">{totalItems}</span> inbox items
            <span className="text-[var(--ink-faint)]">·</span>
            <span className="font-semibold text-green-600">{mappedCount}</span> mapped
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<Sparkles aria-hidden className="w-3 h-3" />}
            onClick={() => setShowSuggestions((v) => !v)}
            aria-pressed={showSuggestions}
          >
            {showSuggestions ? "Hide" : "Show"} suggestions
          </Button>
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<Keyboard aria-hidden className="w-3 h-3" />}
            onClick={() => setShowKeyboard(true)}
            aria-label="Open keyboard mapping panel (accessibility alternative to drag and drop)"
          >
            Keyboard mapping
          </Button>
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<RefreshCw aria-hidden className="w-3 h-3" />}
            onClick={refetch}
            aria-label="Refresh data"
          />
        </div>

        {/* Main 3-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: Inbox list */}
          <div className="w-64 shrink-0 border-r border-[var(--border)] flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
              <h2 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
                Inbox Items
              </h2>
            </div>
            <div
              className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
              role="listbox"
              aria-label="Inbox items — drag to BOM slots or use keyboard mapping"
            >
              {items.length === 0 ? (
                <p className="text-xs text-[var(--ink-faint)] text-center py-6">
                  No inbox items
                </p>
              ) : (
                items.map((item) => (
                  <InboxItemCard
                    key={item.id}
                    item={item}
                    isMapped={mappings.has(item.id)}
                    isSelected={selectedInboxId === item.id}
                    onSelect={() =>
                      setSelectedInboxId((id) =>
                        id === item.id ? null : item.id,
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* CENTER: BOM Slot grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0 flex items-center gap-2">
              <LayoutGrid aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
              <h2 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
                BOM Slots
              </h2>
              <span className="ml-auto text-[10px] text-[var(--ink-faint)]">
                Drop inbox items here · or use keyboard mapping
              </span>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start"
              role="group"
              aria-label="BOM slot drop targets"
            >
              {slots.length === 0 ? (
                <div className="col-span-full flex items-center justify-center py-12">
                  <EmptyState
                    title="No BOM slots"
                    description="Apply a template to create slots for this project."
                  />
                </div>
              ) : (
                slots.map((slot) => {
                  const mappedItemId = Array.from(mappings.entries()).find(
                    ([, sid]) => sid === slot.id,
                  )?.[0];
                  const mappedItem =
                    mappedItemId
                      ? items.find((i) => i.id === mappedItemId) ?? null
                      : null;

                  const suggestion = slotSuggestion(slot.id);

                  return (
                    <BomSlotDropTarget
                      key={slot.id}
                      slot={slot}
                      mappedItem={mappedItem}
                      suggestedConfidence={
                        !mappedItem && suggestion
                          ? suggestion.confidence
                          : null
                      }
                      onRemoveMapping={() => {
                        const itemId = Array.from(mappings.entries()).find(
                          ([, sid]) => sid === slot.id,
                        )?.[0];
                        if (itemId) removeMapping(itemId);
                      }}
                      onAcceptSuggestion={() => {
                        if (suggestion)
                          acceptSuggestion(suggestion).catch(() => undefined);
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Suggestions panel */}
          {showSuggestions && (
            <div
              className={clsx(
                "w-72 shrink-0 border-l border-[var(--border)] flex flex-col overflow-hidden transition-all duration-200",
              )}
            >
              <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
                <h2 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
                  Suggested Classification
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <SuggestedClassificationPanel
                  suggestions={suggestions}
                  items={items}
                  slots={slots}
                  onAccept={acceptSuggestion}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeItem ? <InboxItemCardOverlay item={activeItem} /> : null}
      </DragOverlay>

      {/* Keyboard mapping panel */}
      {showKeyboard && (
        <KeyboardMappingPanel
          items={items}
          slots={slots}
          mappings={mappings}
          onConfirmMapping={confirmMapping}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </DndContext>
  );
}
