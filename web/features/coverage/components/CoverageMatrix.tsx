"use client";

/**
 * CoverageMatrix — domain × phase/status grid.
 * Shows slot status tiles grouped by domain, filterable by phase.
 * BOM-UI-006
 */

import * as React from "react";
import { clsx } from "clsx";
import type { BomSlot, BomSlotStatus, SlotPhase } from "@/lib/types";

// ============================================================
// Slot status visual config
// ============================================================

const STATUS_CONFIG: Record<
  BomSlotStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  complete: {
    label: "Complete",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  partial: {
    label: "Partial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  missing: {
    label: "Missing",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  stale: {
    label: "Stale",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-400",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-300",
    dot: "bg-gray-400",
  },
  not_applicable: {
    label: "N/A",
    bg: "bg-gray-50",
    text: "text-gray-400",
    border: "border-gray-200",
    dot: "bg-gray-300",
  },
};

// ============================================================
// Phase display order
// ============================================================

const PHASES: (SlotPhase | "custom" | null)[] = [
  "discovery",
  "design",
  "build",
  "launch",
  "operate",
  "review",
  "custom",
  null,
];

const PHASE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  design: "Design",
  build: "Build",
  launch: "Launch",
  operate: "Operate",
  review: "Review",
  custom: "Custom",
};

// ============================================================
// SlotTile
// ============================================================

interface SlotTileProps {
  slot: BomSlot;
  onClick?: (slot: BomSlot) => void;
}

function SlotTile({ slot, onClick }: SlotTileProps) {
  const cfg = STATUS_CONFIG[slot.status];

  return (
    <button
      type="button"
      onClick={() => onClick?.(slot)}
      title={`${slot.name} — ${cfg.label}${slot.required ? " (required)" : " (optional)"}`}
      aria-label={`${slot.name}: ${cfg.label}${slot.required ? ", required" : ", optional"}`}
      className={clsx(
        "relative flex flex-col gap-0.5 p-2 rounded border text-left w-full",
        "transition-all duration-[100ms]",
        "hover:shadow-sm hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        cfg.bg,
        cfg.border,
      )}
    >
      {/* Required indicator */}
      {slot.required && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400"
          title="Required slot"
        />
      )}
      {/* Dot + status */}
      <div className="flex items-center gap-1">
        <span
          aria-hidden
          className={clsx("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)}
        />
        <span className={clsx("text-[10px] font-semibold uppercase tracking-wide", cfg.text)}>
          {cfg.label}
        </span>
      </div>
      {/* Name */}
      <span className="text-[11px] font-medium text-[var(--ink)] leading-tight line-clamp-2">
        {slot.name}
      </span>
      {/* Assignment count */}
      {slot.assignment_count > 0 && (
        <span className="text-[10px] text-[var(--ink-faint)]">
          {slot.assignment_count} asset{slot.assignment_count !== 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Domain row
// ============================================================

interface DomainRowProps {
  domain: string;
  slots: BomSlot[];
  activePhase: string | null;
  onSlotClick?: (slot: BomSlot) => void;
}

function domainCoverage(slots: BomSlot[]): number {
  const required = slots.filter((s) => s.required && s.status !== "not_applicable");
  if (required.length === 0) return 100;
  const complete = required.filter((s) => s.status === "complete").length;
  return Math.round((complete / required.length) * 100);
}

function DomainRow({ domain, slots, activePhase, onSlotClick }: DomainRowProps) {
  const filtered = activePhase
    ? slots.filter((s) => (s.phase ?? "custom") === activePhase)
    : slots;

  const pct = domainCoverage(slots); // always use full set for score

  return (
    <div className="flex items-start gap-4 py-3 border-b border-[var(--border)] last:border-0">
      {/* Domain label + score */}
      <div className="w-36 shrink-0 flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[var(--ink)] capitalize">{domain}</span>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all",
                pct >= 80
                  ? "bg-green-500"
                  : pct >= 50
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
              style={{ width: `${pct}%` }}
              aria-hidden
            />
          </div>
          <span
            className={clsx(
              "text-[10px] font-bold tabular-nums",
              pct >= 80
                ? "text-green-600"
                : pct >= 50
                  ? "text-amber-600"
                  : "text-red-600",
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Slot tiles */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {filtered.length === 0 ? (
          <span className="text-xs text-[var(--ink-faint)] col-span-full self-center">
            No slots for this phase
          </span>
        ) : (
          filtered.map((slot) => (
            <SlotTile key={slot.id} slot={slot} onClick={onSlotClick} />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// CoverageMatrix
// ============================================================

export interface CoverageMatrixProps {
  slots: BomSlot[];
  onSlotClick?: (slot: BomSlot) => void;
  className?: string;
}

export function CoverageMatrix({ slots, onSlotClick, className }: CoverageMatrixProps) {
  const [activePhase, setActivePhase] = React.useState<string | null>(null);

  // Group slots by domain
  const domainMap = React.useMemo(() => {
    const map = new Map<string, BomSlot[]>();
    for (const slot of slots) {
      const domain = slot.domain ?? "general";
      if (!map.has(domain)) map.set(domain, []);
      map.get(domain)!.push(slot);
    }
    return map;
  }, [slots]);

  // Phases present in the data
  const presentPhases = React.useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) set.add(s.phase ?? "custom");
    return PHASES.filter((p) => set.has(p ?? "custom")).map((p) => p ?? "custom");
  }, [slots]);

  return (
    <div className={clsx("flex flex-col gap-0", className)}>
      {/* Phase filter tabs */}
      <div
        role="tablist"
        aria-label="Filter by phase"
        className="flex items-center gap-1 pb-3 border-b border-[var(--border)] overflow-x-auto"
      >
        <button
          role="tab"
          aria-selected={activePhase === null}
          onClick={() => setActivePhase(null)}
          className={clsx(
            "px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors duration-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            activePhase === null
              ? "bg-blue-600 text-white"
              : "text-[var(--ink-muted)] hover:bg-gray-100",
          )}
        >
          All Phases
        </button>
        {presentPhases.map((phase) => (
          <button
            key={phase}
            role="tab"
            aria-selected={activePhase === phase}
            onClick={() => setActivePhase(phase === activePhase ? null : phase)}
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap capitalize transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              activePhase === phase
                ? "bg-blue-600 text-white"
                : "text-[var(--ink-muted)] hover:bg-gray-100",
            )}
          >
            {PHASE_LABELS[phase] ?? phase}
          </button>
        ))}
      </div>

      {/* Domain rows */}
      <div className="pt-1">
        {domainMap.size === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--ink-faint)]">
            No slots available
          </p>
        ) : (
          Array.from(domainMap.entries()).map(([domain, domainSlots]) => (
            <DomainRow
              key={domain}
              domain={domain}
              slots={domainSlots}
              activePhase={activePhase}
              onSlotClick={onSlotClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
