"use client";

/**
 * StructureCanvas — center panel of the BOM Builder (WS-5).
 *
 * Group by Domain: one section per domain, columns per phase
 * (Discovery / Design / Build / Launch).
 * Group by Phase: one section per phase, columns per domain.
 * Cells are dnd-kit drop targets; slot chips are selectable/removable.
 */

import * as React from "react";
import { clsx } from "clsx";
import { useDroppable } from "@dnd-kit/core";
import {
  GripVertical,
  FileText,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  CanvasDomain,
  CanvasSlot,
  CanvasSelection,
} from "./types";
import { CANVAS_PHASES } from "./types";

// ============================================================
// Phase header pill styles (per mockup)
// ============================================================

const PHASE_STYLES: Record<string, string> = {
  discovery: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  design: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  build: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  launch: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  unphased: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

// ============================================================
// Slot chip
// ============================================================

function SlotChip({
  slot,
  selected,
  onSelect,
  onRemove,
}: {
  slot: CanvasSlot;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`Slot: ${slot.label}, ${slot.required ? "Required" : "Optional"}`}
      aria-pressed={selected}
      className={clsx(
        "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer",
        "bg-[var(--surface)] transition-colors duration-[100ms]",
        selected
          ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/60 dark:bg-blue-950/40"
          : "border-[var(--border)] hover:border-[var(--border-strong)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      )}
    >
      <GripVertical className="w-3 h-3 text-[var(--ink-faint)] shrink-0" aria-hidden />
      <FileText className="w-3 h-3 text-[var(--ink-faint)] shrink-0" aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block text-[11px] font-medium text-[var(--ink)] truncate leading-tight">
          {slot.label}
        </span>
        <span
          className={clsx(
            "block text-[9px] leading-tight",
            slot.required ? "text-blue-600" : "text-[var(--ink-faint)]",
          )}
        >
          {slot.required ? "Required" : "Optional"}
        </span>
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove slot: ${slot.label}`}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-red-100 text-[var(--ink-faint)] hover:text-red-600 shrink-0 transition-opacity"
      >
        <X className="w-3 h-3" aria-hidden />
      </button>
    </div>
  );
}

// ============================================================
// Droppable cell
// ============================================================

function DropCell({
  domainKey,
  phase,
  slots,
  selection,
  onSelect,
  onRemove,
}: {
  domainKey: string;
  phase: string;
  slots: CanvasSlot[];
  selection: CanvasSelection;
  onSelect: (slotKey: string) => void;
  onRemove: (slotKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell|${domainKey}|${phase}`,
    data: { domainKey, phase },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex flex-col gap-1.5 rounded-lg p-1.5 min-h-[64px] transition-colors",
        isOver
          ? "bg-blue-50 ring-2 ring-blue-400 ring-inset dark:bg-blue-950/40"
          : "bg-[var(--surface-sunken)]",
      )}
    >
      {slots.map((s) => (
        <SlotChip
          key={s.key}
          slot={s}
          selected={selection?.kind === "slot" && selection.slotKey === s.key}
          onSelect={() => onSelect(s.key)}
          onRemove={() => onRemove(s.key)}
        />
      ))}
      {slots.length === 0 && (
        <p className="flex-1 flex items-center justify-center text-[10px] text-[var(--ink-faint)] border border-dashed border-[var(--border)] rounded-md py-2 px-1 text-center">
          Drop artifact here
        </p>
      )}
    </div>
  );
}

// ============================================================
// StructureCanvas
// ============================================================

export interface StructureCanvasProps {
  domains: CanvasDomain[];
  groupBy: "domain" | "phase";
  selection: CanvasSelection;
  onSelectSlot: (domainKey: string, slotKey: string) => void;
  onSelectDomain: (domainKey: string) => void;
  onRemoveSlot: (domainKey: string, slotKey: string) => void;
  onRemoveDomain: (domainKey: string) => void;
  onRenameDomain: (domainKey: string, name: string) => void;
  onAddDomain: () => void;
  className?: string;
}

export function StructureCanvas({
  domains,
  groupBy,
  selection,
  onSelectSlot,
  onSelectDomain,
  onRemoveSlot,
  onRemoveDomain,
  onRenameDomain,
  onAddDomain,
  className,
}: StructureCanvasProps) {
  // Columns: phases (domain grouping) or domains (phase grouping).
  const hasUnphased = domains.some((d) => d.slots.some((s) => !s.phase));
  const phaseCols: string[] = hasUnphased
    ? [...CANVAS_PHASES, "unphased"]
    : [...CANVAS_PHASES];

  if (domains.length === 0) {
    return (
      <div className={clsx("flex flex-col items-center justify-center text-center py-20", className)}>
        <div className="w-12 h-12 rounded-full bg-[var(--surface-sunken)] border border-dashed border-[var(--border-strong)] flex items-center justify-center mb-4">
          <Plus className="w-5 h-5 text-[var(--ink-faint)]" aria-hidden />
        </div>
        <p className="text-sm font-medium text-[var(--ink-muted)]">No sections yet</p>
        <p className="text-xs text-[var(--ink-faint)] mt-1 mb-4">
          Create a section (domain) to start placing artifact types.
        </p>
        <button
          type="button"
          onClick={onAddDomain}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Create Section
        </button>
      </div>
    );
  }

  if (groupBy === "phase") {
    return (
      <div className={clsx("space-y-4", className)}>
        {phaseCols.map((phase) => (
          <section
            key={phase}
            aria-label={`Phase: ${phase}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
              <span
                className={clsx(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                  PHASE_STYLES[phase] ?? PHASE_STYLES.unphased,
                )}
              >
                {phase === "unphased" ? "No phase" : phase}
              </span>
            </div>
            <div
              className="grid gap-2 p-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(domains.length, 1)}, minmax(140px, 1fr))`,
              }}
            >
              {domains.map((d) => (
                <div key={d.key} className="min-w-0">
                  <p className="text-[10px] font-semibold text-[var(--ink-muted)] px-1 pb-1 truncate">
                    {d.name}
                  </p>
                  <DropCell
                    domainKey={d.key}
                    phase={phase}
                    slots={d.slots.filter((s) => (s.phase ?? "unphased") === phase)}
                    selection={selection}
                    onSelect={(slotKey) => onSelectSlot(d.key, slotKey)}
                    onRemove={(slotKey) => onRemoveSlot(d.key, slotKey)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  // Group by domain (mockup default)
  return (
    <div className={clsx("space-y-4", className)}>
      {domains.map((domain) => {
        const required = domain.slots.filter((s) => s.required).length;
        const optional = domain.slots.length - required;
        const domainSelected =
          selection?.kind === "domain" && selection.domainKey === domain.key;

        return (
          <section
            key={domain.key}
            aria-label={`Domain: ${domain.name}`}
            className={clsx(
              "rounded-xl border bg-[var(--surface)] overflow-hidden transition-colors",
              domainSelected ? "border-blue-400" : "border-[var(--border)]",
            )}
          >
            {/* Domain header */}
            <div
              className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] cursor-pointer"
              onClick={() => onSelectDomain(domain.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectDomain(domain.key)}
              aria-label={`Select domain: ${domain.name}`}
            >
              <GripVertical className="w-3.5 h-3.5 text-[var(--ink-faint)] shrink-0" aria-hidden />
              <input
                type="text"
                value={domain.name}
                onChange={(e) => onRenameDomain(domain.key, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Domain name: ${domain.name}`}
                className="text-xs font-semibold text-[var(--ink)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-blue-400 focus:outline-none min-w-0 w-40"
              />
              <span className="flex-1" />
              <span className="text-[10px] text-[var(--ink-muted)] shrink-0">
                Required: <span className="font-semibold">{required}</span>
                <span className="mx-1.5 text-[var(--ink-faint)]">·</span>
                Optional: <span className="font-semibold">{optional}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDomain(domain.key);
                }}
                aria-label={`Remove domain: ${domain.name}`}
                className="p-1 rounded hover:bg-red-100 text-[var(--ink-faint)] hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" aria-hidden />
              </button>
            </div>

            {/* Phase columns */}
            <div
              className="grid gap-2 p-2"
              style={{
                gridTemplateColumns: `repeat(${phaseCols.length}, minmax(130px, 1fr))`,
              }}
            >
              {phaseCols.map((phase) => (
                <div key={phase} className="min-w-0">
                  <p
                    className={clsx(
                      "text-center text-[10px] font-semibold capitalize rounded-md py-1 mb-1.5",
                      PHASE_STYLES[phase] ?? PHASE_STYLES.unphased,
                    )}
                  >
                    {phase === "unphased" ? "No phase" : phase}
                  </p>
                  <DropCell
                    domainKey={domain.key}
                    phase={phase}
                    slots={domain.slots.filter(
                      (s) => (s.phase ?? "unphased") === phase,
                    )}
                    selection={selection}
                    onSelect={(slotKey) => onSelectSlot(domain.key, slotKey)}
                    onRemove={(slotKey) => onRemoveSlot(domain.key, slotKey)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={onAddDomain}
        className={clsx(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--border-strong)]",
          "text-xs text-[var(--ink-faint)] hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
        aria-label="Create section"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden />
        Create Section
      </button>
    </div>
  );
}
