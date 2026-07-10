"use client";

/**
 * ArtifactLibraryPanel — left palette of the BOM Builder (WS-5).
 * Searchable, grouped artifact types; items are dnd-kit drag sources and can
 * also be clicked to add to the selected domain/phase (keyboard fallback).
 */

import * as React from "react";
import { clsx } from "clsx";
import { useDraggable } from "@dnd-kit/core";
import { Search, GripVertical, FileText, ChevronDown, ChevronRight } from "lucide-react";
import type { ArtifactTypeGroup, ArtifactTypeEntry } from "./catalog";

export interface PaletteDragData {
  source: "palette";
  typeId: string;
  label: string;
}

function PaletteItem({
  entry,
  onAdd,
}: {
  entry: ArtifactTypeEntry;
  onAdd: (entry: ArtifactTypeEntry) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${entry.id}`,
    data: {
      source: "palette",
      typeId: entry.id,
      label: entry.label,
    } satisfies PaletteDragData,
  });

  return (
    <li>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={0}
        onClick={() => onAdd(entry)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAdd(entry);
          }
        }}
        aria-label={`${entry.label} — drag to canvas or press Enter to add`}
        className={clsx(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-grab select-none",
          "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]",
          "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
          "transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isDragging && "opacity-40",
        )}
      >
        <GripVertical className="w-3 h-3 text-[var(--ink-faint)] shrink-0" aria-hidden />
        <FileText className="w-3 h-3 text-[var(--ink-faint)] shrink-0" aria-hidden />
        <span className="flex-1 text-xs truncate">{entry.label}</span>
      </div>
    </li>
  );
}

export interface ArtifactLibraryPanelProps {
  groups: ArtifactTypeGroup[];
  onAdd: (entry: ArtifactTypeEntry) => void;
  className?: string;
}

export function ArtifactLibraryPanel({
  groups,
  onAdd,
  className,
}: ArtifactLibraryPanelProps) {
  const [q, setQ] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    if (!q.trim()) return groups;
    const needle = q.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        types: g.types.filter(
          (t) =>
            t.label.toLowerCase().includes(needle) ||
            t.id.includes(needle.replace(/\s+/g, "_")),
        ),
      }))
      .filter((g) => g.types.length > 0);
  }, [groups, q]);

  return (
    <aside
      aria-label="Artifact library"
      className={clsx(
        "flex flex-col border-r border-[var(--border)] bg-[var(--surface-sunken)] overflow-hidden",
        className,
      )}
    >
      <div className="px-3 py-2.5 border-b border-[var(--border)] shrink-0">
        <p className="text-xs font-semibold text-[var(--ink)] mb-2 flex items-center gap-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
            1
          </span>
          Artifact Library
        </p>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-faint)]"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artifact types…"
            aria-label="Search artifact types"
            className={clsx(
              "w-full h-7 pl-8 pr-2 text-xs rounded border border-[var(--border)]",
              "bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            )}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 && (
          <p className="text-[11px] text-[var(--ink-muted)] px-1 py-2">
            No artifact types match “{q}”.
          </p>
        )}
        {filtered.map((group) => {
          const isCollapsed = collapsed.has(group.group);
          return (
            <div key={group.group}>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (next.has(group.group)) next.delete(group.group);
                    else next.add(group.group);
                    return next;
                  })
                }
                className="w-full flex items-center gap-1.5 px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
                ) : (
                  <ChevronDown className="w-3 h-3 text-[var(--ink-faint)]" aria-hidden />
                )}
                <span className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                  {group.group}
                </span>
              </button>
              {!isCollapsed && (
                <ul className="space-y-1 mt-1" role="list">
                  {group.types.map((t) => (
                    <PaletteItem key={t.id} entry={t} onAdd={onAdd} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
