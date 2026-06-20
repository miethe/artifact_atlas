"use client";

/**
 * KeyboardMappingPanel — non-drag alternative for inbox → BOM slot assignment.
 * Accessible keyboard alternative satisfying WCAG 2.1 SC 2.1.1.
 * BOM-UI-005
 */

import * as React from "react";
import { clsx } from "clsx";
import { Keyboard, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { BomSlot, InboxItem } from "@/lib/types";

// ============================================================
// KeyboardMappingPanel props
// ============================================================

interface KeyboardMappingPanelProps {
  items: InboxItem[];
  slots: BomSlot[];
  mappings: Map<string, string>;
  onConfirmMapping: (inboxItemId: string, slotId: string) => Promise<void>;
  onClose: () => void;
}

// ============================================================
// KeyboardMappingPanel
// ============================================================

export function KeyboardMappingPanel({
  items,
  slots,
  mappings,
  onConfirmMapping,
  onClose,
}: KeyboardMappingPanelProps) {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    items.find((i) => !mappings.has(i.id))?.id ?? null,
  );
  const [selectedSlotId, setSelectedSlotId] = React.useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [lastMapped, setLastMapped] = React.useState<string | null>(null);

  const unmappedItems = items.filter((i) => !mappings.has(i.id));
  const availableSlots = slots.filter(
    (s) =>
      s.status !== "not_applicable" &&
      s.status !== "complete",
  );

  const handleMap = async () => {
    if (!selectedItemId || !selectedSlotId) return;
    setIsSubmitting(true);
    try {
      await onConfirmMapping(selectedItemId, selectedSlotId);
      setLastMapped(selectedItemId);
      // Advance to next unmapped item
      const next = unmappedItems.find(
        (i) => i.id !== selectedItemId && !mappings.has(i.id),
      );
      setSelectedItemId(next?.id ?? null);
      setSelectedSlotId(null);
    } catch {
      // error handled by parent mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-labelledby="kbd-mapping-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    >
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
          <Keyboard aria-hidden className="w-4 h-4 text-[var(--ink-muted)]" />
          <h2 id="kbd-mapping-title" className="text-sm font-semibold text-[var(--ink)] flex-1">
            Keyboard Mapping
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard mapping panel"
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 px-1"
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 py-2.5 border-b border-[var(--border)] bg-blue-50 shrink-0">
          <p className="text-xs text-blue-700">
            Select an inbox item, then select a BOM slot, then click{" "}
            <strong>Map</strong>. Use Tab and arrow keys for keyboard navigation.
          </p>
        </div>

        {/* Body */}
        <div className="flex gap-5 p-5 overflow-y-auto flex-1">
          {/* Inbox items */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
              Inbox Items
            </h3>
            <div role="listbox" aria-label="Inbox items" className="flex flex-col gap-1">
              {unmappedItems.length === 0 ? (
                <p className="text-xs text-[var(--ink-faint)] text-center py-4">
                  All inbox items are mapped.
                </p>
              ) : (
                unmappedItems.map((item) => (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={selectedItemId === item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={clsx(
                      "text-left px-3 py-2 rounded border text-xs transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      selectedItemId === item.id
                        ? "border-blue-300 bg-blue-50 font-semibold text-blue-900"
                        : "border-[var(--border)] hover:bg-gray-50 text-[var(--ink)]",
                    )}
                  >
                    <span className="line-clamp-1">{item.title}</span>
                    <span className="text-[10px] text-[var(--ink-faint)] capitalize mt-0.5 block">
                      {item.source_kind} · {new Date(item.captured_at).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center text-[var(--ink-faint)] text-lg select-none shrink-0">
            →
          </div>

          {/* BOM slots */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
              Available Slots
            </h3>
            <div role="listbox" aria-label="BOM slots" className="flex flex-col gap-1">
              {availableSlots.length === 0 ? (
                <p className="text-xs text-[var(--ink-faint)] text-center py-4">
                  No open slots available.
                </p>
              ) : (
                availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    role="option"
                    aria-selected={selectedSlotId === slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={clsx(
                      "text-left px-3 py-2 rounded border text-xs transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      selectedSlotId === slot.id
                        ? "border-blue-300 bg-blue-50 font-semibold text-blue-900"
                        : "border-[var(--border)] hover:bg-gray-50 text-[var(--ink)]",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="line-clamp-1 flex-1">{slot.name}</span>
                      {slot.required && (
                        <span className="text-[10px] text-red-500 shrink-0">
                          required
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--ink-faint)] capitalize mt-0.5 block">
                      {slot.status.replace("_", " ")}
                      {slot.domain ? ` · ${slot.domain}` : ""}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
          {lastMapped && (
            <div className="flex items-center gap-1.5 text-xs text-green-700">
              <Check aria-hidden className="w-3.5 h-3.5" />
              Mapped successfully
            </div>
          )}
          {!lastMapped && (
            <span className="text-xs text-[var(--ink-faint)]">
              Select an item and a slot to map
            </span>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Done
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedItemId || !selectedSlotId || isSubmitting}
              loading={isSubmitting}
              onClick={handleMap}
            >
              Map →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
