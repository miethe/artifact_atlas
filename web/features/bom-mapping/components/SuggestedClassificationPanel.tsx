"use client";

/**
 * SuggestedClassificationPanel — shows AI/heuristic suggestions with confidence.
 * BOM-UI-005
 */

import * as React from "react";
import { clsx } from "clsx";
import { Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SuggestedMatch } from "../hooks/useBomMapping";
import type { InboxItem, BomSlot } from "@/lib/types";

// ============================================================
// Confidence config
// ============================================================

const CONFIDENCE_CONFIG = {
  high: { label: "High", dot: "bg-green-500", text: "text-green-700", bar: "bg-green-500" },
  medium: { label: "Medium", dot: "bg-amber-400", text: "text-amber-700", bar: "bg-amber-400" },
  low: { label: "Low", dot: "bg-gray-400", text: "text-gray-600", bar: "bg-gray-400" },
  conflict: { label: "Conflict", dot: "bg-red-500", text: "text-red-700", bar: "bg-red-500" },
} as const;

const CONFIDENCE_WIDTH = { high: "w-[85%]", medium: "w-[55%]", low: "w-[25%]", conflict: "w-full" } as const;

// ============================================================
// SuggestionRow
// ============================================================

interface SuggestionRowProps {
  suggestion: SuggestedMatch;
  item: InboxItem | undefined;
  slot: BomSlot | undefined;
  onAccept: () => void;
  onReject: () => void;
  accepted: boolean;
  rejected: boolean;
}

function SuggestionRow({
  suggestion,
  item,
  slot,
  onAccept,
  onReject,
  accepted,
  rejected,
}: SuggestionRowProps) {
  const cfg = CONFIDENCE_CONFIG[suggestion.confidence];

  if (!item || !slot) return null;

  return (
    <div
      className={clsx(
        "rounded-lg border p-3 flex flex-col gap-2 transition-all duration-100",
        accepted
          ? "bg-green-50 border-green-200 opacity-70"
          : rejected
            ? "bg-gray-50 border-gray-200 opacity-40"
            : "bg-[var(--surface)] border-[var(--border)]",
      )}
    >
      {/* Confidence row */}
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={clsx("w-2 h-2 rounded-full shrink-0", cfg.dot)}
        />
        <span className={clsx("text-[10px] font-bold uppercase tracking-wide", cfg.text)}>
          {cfg.label} confidence
        </span>
        {/* Mini bar */}
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full", cfg.bar, CONFIDENCE_WIDTH[suggestion.confidence])}
            aria-hidden
          />
        </div>
      </div>

      {/* Match content */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 items-start">
        {/* Item */}
        <div className="rounded bg-gray-50 border border-[var(--border)] px-2 py-1.5">
          <p className="text-[10px] text-[var(--ink-muted)] font-medium uppercase tracking-wide mb-0.5">
            Inbox
          </p>
          <p className="text-xs font-semibold text-[var(--ink)] leading-snug line-clamp-2">
            {item.title}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center mt-4 text-[var(--ink-faint)] text-sm">
          →
        </div>

        {/* Slot */}
        <div className="rounded bg-blue-50 border border-blue-200 px-2 py-1.5">
          <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide mb-0.5">
            BOM Slot
          </p>
          <p className="text-xs font-semibold text-[var(--ink)] leading-snug line-clamp-2">
            {slot.name}
          </p>
        </div>
      </div>

      {/* Reason */}
      <p className="text-[10px] text-[var(--ink-faint)] leading-snug">
        {suggestion.reason}
      </p>

      {/* Actions */}
      {!accepted && !rejected && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="xs"
            iconLeft={<Check aria-hidden className="w-3 h-3" />}
            onClick={onAccept}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<X aria-hidden className="w-3 h-3" />}
            onClick={onReject}
            aria-label="Reject suggestion"
          >
            Reject
          </Button>
        </div>
      )}

      {accepted && (
        <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
          <Check aria-hidden className="w-3.5 h-3.5" />
          Mapping confirmed
        </div>
      )}
    </div>
  );
}

// ============================================================
// SuggestedClassificationPanel
// ============================================================

export interface SuggestedClassificationPanelProps {
  suggestions: SuggestedMatch[];
  items: InboxItem[];
  slots: BomSlot[];
  onAccept: (suggestion: SuggestedMatch) => Promise<void>;
  className?: string;
}

export function SuggestedClassificationPanel({
  suggestions,
  items,
  slots,
  onAccept,
  className,
}: SuggestedClassificationPanelProps) {
  const [accepted, setAccepted] = React.useState<Set<string>>(new Set());
  const [rejected, setRejected] = React.useState<Set<string>>(new Set());

  if (suggestions.length === 0) {
    return (
      <div
        className={clsx(
          "rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] p-4 text-center",
          className,
        )}
      >
        <p className="text-xs text-[var(--ink-faint)]">
          No auto-suggestions available. Use drag or keyboard mapping to assign inbox items.
        </p>
      </div>
    );
  }

  const handleAccept = async (s: SuggestedMatch) => {
    const key = `${s.inboxItemId}:${s.slotId}`;
    await onAccept(s);
    setAccepted((prev) => new Set([...prev, key]));
  };

  const handleReject = (s: SuggestedMatch) => {
    const key = `${s.inboxItemId}:${s.slotId}`;
    setRejected((prev) => new Set([...prev, key]));
  };

  const pending = suggestions.filter((s) => {
    const key = `${s.inboxItemId}:${s.slotId}`;
    return !accepted.has(key) && !rejected.has(key);
  });

  return (
    <div
      className={clsx("flex flex-col gap-3", className)}
      aria-label="Suggested classifications"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="w-4 h-4 text-purple-500 shrink-0" />
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          AI Suggestions
        </h3>
        <span className="ml-auto text-[10px] text-[var(--ink-faint)]">
          {pending.length} pending
        </span>
      </div>

      {/* Suggestion list */}
      {suggestions.map((s) => {
        const key = `${s.inboxItemId}:${s.slotId}`;
        return (
          <SuggestionRow
            key={key}
            suggestion={s}
            item={items.find((i) => i.id === s.inboxItemId)}
            slot={slots.find((sl) => sl.id === s.slotId)}
            onAccept={() => handleAccept(s)}
            onReject={() => handleReject(s)}
            accepted={accepted.has(key)}
            rejected={rejected.has(key)}
          />
        );
      })}

      {/* Accept all */}
      {pending.length > 1 && (
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => pending.forEach((s) => handleAccept(s))}
        >
          Accept all suggestions ({pending.length})
        </Button>
      )}
    </div>
  );
}
