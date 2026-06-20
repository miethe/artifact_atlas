"use client";

/**
 * FilterBar — URL-state filters for the asset library.
 * Filters: status, sensitivity, source_kind, q (search), artifact_type_id.
 * All state synced to URL search params via useAssetFilters hook.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import type { AssetStatus, Sensitivity, SourceKind } from "@/lib/types";

// ============================================================
// Types
// ============================================================

export interface ActiveFilters {
  q?: string;
  status?: AssetStatus[];
  sensitivity?: Sensitivity;
  source_kind?: SourceKind[];
  artifact_type_id?: string;
}

export interface FilterBarProps {
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
  totalCount?: number;
  className?: string;
}

// ============================================================
// Filter options
// ============================================================

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "raw", label: "Raw" },
  { value: "candidate", label: "Candidate" },
  { value: "in_review", label: "In Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "selected", label: "Selected" },
  { value: "canonical", label: "Canonical" },
  { value: "archived", label: "Archived" },
];

const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "personal", label: "Personal" },
  { value: "work_sensitive", label: "Work Sensitive" },
  { value: "client_sensitive", label: "Client Sensitive" },
  { value: "restricted", label: "Restricted" },
];

const SOURCE_KIND_OPTIONS: { value: SourceKind; label: string }[] = [
  { value: "local", label: "Local" },
  { value: "claude", label: "Claude" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "url", label: "Web URL" },
  { value: "github", label: "GitHub" },
  { value: "figma", label: "Figma" },
  { value: "notion", label: "Notion" },
  { value: "drive", label: "Drive" },
  { value: "manual", label: "Manual" },
];

// ============================================================
// Multi-select dropdown helper
// ============================================================

interface MultiSelectDropdownProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}

function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: MultiSelectDropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (
        e instanceof MouseEvent &&
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [open]);

  const hasActive = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Filter by ${label}${hasActive ? `: ${selected.length} selected` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "inline-flex items-center gap-1 h-7 px-2.5 rounded text-xs font-medium",
          "border transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          hasActive
            ? "bg-blue-50 border-blue-300 text-blue-700"
            : "bg-white border-[var(--border)] text-[var(--ink)] hover:bg-gray-50",
        )}
      >
        {label}
        {hasActive && (
          <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            {selected.length}
          </span>
        )}
        <ChevronDown aria-hidden className="w-3 h-3 text-[var(--ink-muted)]" />
      </button>

      {open && (
        <div
          className={clsx(
            "absolute left-0 top-full mt-1 z-20",
            "w-48 bg-white border border-[var(--border)] rounded shadow-modal py-1",
            "animate-fade-in",
          )}
        >
          {hasActive && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 font-medium hover:bg-blue-50 border-b border-[var(--border)]"
            >
              Clear {label}
            </button>
          )}
          <ul role="listbox" aria-multiselectable="true" aria-label={`${label} filter options`}>
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <li key={opt.value} role="option" aria-selected={checked}>
                  <button
                    type="button"
                    onClick={() => onToggle(opt.value)}
                    className={clsx(
                      "w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs",
                      "transition-colors duration-[100ms]",
                      "focus-visible:outline-none focus-visible:bg-blue-50",
                      checked ? "text-blue-700 bg-blue-50 font-medium" : "text-[var(--ink)] hover:bg-gray-50",
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                        checked
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 bg-white",
                      )}
                    >
                      {checked && (
                        <svg viewBox="0 0 12 10" className="w-2 h-2 text-white" fill="none">
                          <path
                            d="M1 5l3.5 3.5L11 1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FilterBar
// ============================================================

export function FilterBar({
  filters,
  onChange,
  totalCount,
  className,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = React.useState(filters.q ?? "");
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Debounce search input → update filters
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.q ?? "")) {
        onChange({ ...filters, q: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Sync external q changes
  React.useEffect(() => {
    if ((filters.q ?? "") !== searchInput) {
      setSearchInput(filters.q ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  const hasAnyFilter =
    !!filters.q ||
    (filters.status?.length ?? 0) > 0 ||
    !!filters.sensitivity ||
    (filters.source_kind?.length ?? 0) > 0;

  function toggleStatus(value: AssetStatus) {
    const current = filters.status ?? [];
    const next = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value];
    onChange({ ...filters, status: next.length ? next : undefined });
  }

  function toggleSourceKind(value: SourceKind) {
    const current = filters.source_kind ?? [];
    const next = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value];
    onChange({ ...filters, source_kind: next.length ? next : undefined });
  }

  function clearAll() {
    setSearchInput("");
    onChange({});
  }

  return (
    <div
      role="search"
      aria-label="Asset library filters"
      className={clsx(
        "flex flex-wrap items-center gap-2 px-4 py-2.5",
        "border-b border-[var(--border)] bg-[var(--surface)] shrink-0",
        className,
      )}
    >
      {/* Search input */}
      <div className="relative flex items-center min-w-[200px] max-w-xs">
        <Search
          aria-hidden
          className="absolute left-2.5 w-3.5 h-3.5 text-[var(--ink-muted)] pointer-events-none"
        />
        <input
          ref={searchRef}
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search assets…"
          aria-label="Search assets"
          className={clsx(
            "w-full h-7 pl-8 pr-7 text-xs rounded border border-[var(--border)] bg-white",
            "placeholder:text-[var(--ink-faint)]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400",
            "transition-colors duration-[100ms]",
          )}
        />
        {searchInput && (
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Clear search"
            className="absolute right-1"
            onClick={() => {
              setSearchInput("");
              onChange({ ...filters, q: undefined });
              searchRef.current?.focus();
            }}
          >
            <X aria-hidden className="w-3 h-3" />
          </IconButton>
        )}
      </div>

      {/* Divider */}
      <div aria-hidden className="w-px h-5 bg-[var(--border)] hidden sm:block" />

      {/* Filter dropdowns */}
      <Filter aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)] hidden sm:block shrink-0" />

      <MultiSelectDropdown
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status ?? []}
        onToggle={toggleStatus}
        onClear={() => onChange({ ...filters, status: undefined })}
      />

      <MultiSelectDropdown
        label="Source"
        options={SOURCE_KIND_OPTIONS}
        selected={filters.source_kind ?? []}
        onToggle={toggleSourceKind}
        onClear={() => onChange({ ...filters, source_kind: undefined })}
      />

      {/* Sensitivity single-select */}
      <div className="relative">
        <select
          value={filters.sensitivity ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              sensitivity: (e.target.value as Sensitivity) || undefined,
            })
          }
          aria-label="Filter by sensitivity"
          className={clsx(
            "h-7 px-2.5 pr-7 rounded border text-xs font-medium appearance-none cursor-pointer",
            "transition-colors duration-[100ms]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            filters.sensitivity
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "bg-white border-[var(--border)] text-[var(--ink)] hover:bg-gray-50",
          )}
        >
          <option value="">Sensitivity</option>
          {SENSITIVITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--ink-muted)] pointer-events-none"
        />
      </div>

      {/* Clear all */}
      {hasAnyFilter && (
        <Button
          size="xs"
          variant="ghost"
          iconLeft={<X aria-hidden className="w-3 h-3" />}
          onClick={clearAll}
          className="text-[var(--ink-muted)]"
        >
          Clear filters
        </Button>
      )}

      {/* Result count */}
      {totalCount !== undefined && (
        <span className="ml-auto text-xs text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
          {totalCount.toLocaleString()} asset{totalCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
