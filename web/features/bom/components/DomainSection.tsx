"use client";

/**
 * DomainSection — per-domain (or per-phase) slot section for the BOM tab
 * (WS-5, mockup fidelity).
 *
 * Header: domain icon, name, filled/total + %, "View details".
 * Body: grid of filled SlotCards + dashed MissingSlotCards, or a compact
 * list view when viewMode="list".
 */

import * as React from "react";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import type { BomSlot } from "@/lib/types";
import { SlotCard } from "./SlotCard";
import { MissingSlotCard } from "./MissingSlotCard";
import { SlotStatusBadge } from "./SlotStatusBadge";
import { getDomainIcon, slotDisplayName } from "./domainMeta";

export interface DomainSectionProps {
  title: string;
  slots: BomSlot[];
  viewMode: "grid" | "list";
  onOpenSlot: (slot: BomSlot) => void;
  onFillSlot: (slot: BomSlot) => void;
  onViewDetails?: () => void;
  /** When true the section header icon uses a generic phase glyph. */
  isPhaseSection?: boolean;
}

export function DomainSection({
  title,
  slots,
  viewMode,
  onOpenSlot,
  onFillSlot,
  onViewDetails,
  isPhaseSection = false,
}: DomainSectionProps) {
  const active = slots.filter((s) => s.status !== "not_applicable");
  const filled = active.filter(
    (s) => s.status === "complete" || s.status === "in_progress",
  ).length;
  const pct = active.length > 0 ? Math.round((filled / active.length) * 100) : 0;

  const missingSlots = slots.filter((s) => s.status === "missing");
  const otherSlots = slots.filter((s) => s.status !== "missing");

  return (
    <section aria-label={`${title} slots`} className="space-y-2.5">
      {/* Section header */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--ink-muted)]">
          {getDomainIcon(isPhaseSection ? "" : title, "w-3.5 h-3.5")}
        </span>
        <h3 className="text-sm font-semibold text-[var(--ink)] capitalize">
          {title}
        </h3>
        <span className="text-[11px] text-[var(--ink-muted)]">
          {filled} / {active.length} filled
          <span className="mx-1.5 text-[var(--ink-faint)]">·</span>
          <span
            className={clsx(
              "font-semibold",
              pct >= 75
                ? "text-emerald-600"
                : pct >= 40
                  ? "text-amber-600"
                  : "text-red-500",
            )}
          >
            {pct}%
          </span>
        </span>
        <span className="flex-1" />
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            View details
            <ArrowRight className="w-3 h-3" aria-hidden />
          </button>
        )}
      </div>

      {/* Slots */}
      {viewMode === "grid" ? (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}
        >
          {otherSlots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onOpen={onOpenSlot} />
          ))}
          {missingSlots.map((slot) => (
            <MissingSlotCard key={slot.id} slot={slot} onFill={onFillSlot} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
          {[...otherSlots, ...missingSlots].map((slot) => {
            const missing = slot.status === "missing";
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => (missing ? onFillSlot(slot) : onOpenSlot(slot))}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  "hover:bg-[var(--surface-sunken)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                )}
                aria-label={
                  missing
                    ? `Missing slot: ${slotDisplayName(slot)}. Click to assign an asset.`
                    : `Open slot: ${slotDisplayName(slot)}`
                }
              >
                <span className="flex-1 min-w-0 text-xs font-medium text-[var(--ink)] truncate">
                  {slotDisplayName(slot)}
                </span>
                {slot.phase && (
                  <span className="hidden sm:inline text-[10px] text-[var(--ink-faint)] capitalize shrink-0">
                    {slot.phase}
                  </span>
                )}
                <span className="text-[10px] text-[var(--ink-faint)] shrink-0">
                  {slot.required ? "Required" : "Optional"}
                </span>
                <SlotStatusBadge status={slot.status} />
              </button>
            );
          })}
          {slots.length === 0 && (
            <p className="px-3 py-3 text-xs text-[var(--ink-muted)]">
              No slots in this section.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
