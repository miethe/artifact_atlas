"use client";

/**
 * FilterBar — URL-state filters for the asset library (mockup-fidelity pass).
 *
 * Labeled dropdown chips per the asset-library mockup: each chip shows a small
 * caption label over the current value. Chips: Project, Source, Type, Status,
 * Date, Sensitivity, "+ More filters" (Starred, Agent access).
 *
 * Topic / Feature / IntentTree Node chips from the mockup are intentionally
 * omitted — nothing in the backend list endpoint backs them yet (no fake controls).
 *
 * All state synced to URL search params via useAssetFilters hook.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Search, X, ChevronDown, Check, Star, SlidersHorizontal } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import type { AgentAccess, AssetStatus, Sensitivity, SourceKind } from "@/lib/types";

// ============================================================
// Types
// ============================================================

export type DatePreset = "24h" | "7d" | "30d" | "90d" | "year";

export interface ActiveFilters {
  q?: string;
  status?: AssetStatus[];
  sensitivity?: Sensitivity;
  source_kind?: SourceKind[];
  artifact_type_id?: string;
  /** Date-range preset — converted to captured_after for the API. */
  date?: DatePreset;
  /** Only starred assets (metadata.starred). */
  starred?: boolean;
  agent_access?: AgentAccess;
}

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterBarProps {
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
  totalCount?: number;
  className?: string;
  /** Right-side controls (bulk actions, add button) — P2-2 consolidation */
  trailing?: React.ReactNode;
  /** Projects for the Project chip (switches library scope). */
  projectOptions?: FilterOption[];
  currentProjectId?: string;
  onProjectChange?: (projectId: string) => void;
  /** Artifact-type options (derived from loaded data); chip hidden when empty. */
  typeOptions?: FilterOption[];
}

// ============================================================
// Filter options
// ============================================================

const STATUS_OPTIONS: FilterOption<AssetStatus>[] = [
  { value: "inbox", label: "Inbox" },
  { value: "raw", label: "Raw" },
  { value: "candidate", label: "Candidate" },
  { value: "in_review", label: "In Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "selected", label: "Selected" },
  { value: "canonical", label: "Canonical" },
  { value: "archived", label: "Archived" },
];

const SENSITIVITY_OPTIONS: FilterOption<Sensitivity>[] = [
  { value: "public", label: "Public" },
  { value: "personal", label: "Personal" },
  { value: "work_sensitive", label: "Work Sensitive" },
  { value: "client_sensitive", label: "Client Sensitive" },
  { value: "restricted", label: "Restricted" },
];

const SOURCE_KIND_OPTIONS: FilterOption<SourceKind>[] = [
  { value: "local", label: "Local" },
  { value: "vault", label: "Vault" },
  { value: "claude", label: "Claude" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "url", label: "Web URL" },
  { value: "github", label: "GitHub" },
  { value: "figma", label: "Figma" },
  { value: "notion", label: "Notion" },
  { value: "drive", label: "Drive" },
  { value: "sharepoint", label: "SharePoint" },
  { value: "manual", label: "Manual" },
];

export const DATE_PRESET_OPTIONS: FilterOption<DatePreset>[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
];

const AGENT_ACCESS_OPTIONS: FilterOption<AgentAccess>[] = [
  { value: "none", label: "None" },
  { value: "metadata_only", label: "Metadata Only" },
  { value: "preview_allowed", label: "Preview Allowed" },
  { value: "read_allowed", label: "Read Allowed" },
  { value: "context_pack_allowed", label: "Context Pack Allowed" },
];

/** Convert a date preset to an ISO captured_after timestamp. */
export function datePresetToCapturedAfter(preset: DatePreset | undefined): string | undefined {
  if (!preset) return undefined;
  const now = new Date();
  switch (preset) {
    case "24h":
      return new Date(now.getTime() - 24 * 3600_000).toISOString();
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 3600_000).toISOString();
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 3600_000).toISOString();
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 3600_000).toISOString();
    case "year":
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  }
}

// ============================================================
// Dropdown plumbing — outside-click / Escape close
// ============================================================

function useDropdown() {
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

  return { open, setOpen, ref, btnRef };
}

// ============================================================
// Chip trigger — caption label over current value (mockup style)
// ============================================================

interface ChipTriggerProps {
  label: string;
  value: string;
  active?: boolean;
  ariaLabel: string;
  expanded?: boolean;
  onClick: () => void;
  count?: number;
}

const ChipTrigger = React.forwardRef<HTMLButtonElement, ChipTriggerProps>(
  function ChipTrigger({ label, value, active, ariaLabel, expanded, onClick, count }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-label={ariaLabel}
        onClick={onClick}
        className={clsx(
          "flex flex-col items-start justify-center h-11 px-3 min-w-[104px] rounded-md text-left",
          "border transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          active
            ? "bg-[var(--blue-50)] border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/50"
            : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-sunken)]",
        )}
      >
        <span className="text-[10px] leading-3 font-medium text-[var(--ink-muted)]">
          {label}
        </span>
        <span className="flex items-center gap-1 w-full">
          <span
            className={clsx(
              "text-xs font-medium truncate max-w-[140px]",
              active ? "text-blue-700 dark:text-blue-300" : "text-[var(--ink)]",
            )}
          >
            {value}
          </span>
          {count !== undefined && count > 0 && (
            <span className="bg-blue-600 text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-bold">
              {count}
            </span>
          )}
          <ChevronDown aria-hidden className="w-3 h-3 ml-auto shrink-0 text-[var(--ink-muted)]" />
        </span>
      </button>
    );
  },
);

const MENU_CLASS = clsx(
  "absolute left-0 top-full mt-1 z-20",
  "w-52 max-h-72 overflow-y-auto bg-[var(--surface-overlay)] border border-[var(--border)] rounded shadow-modal py-1",
  "animate-fade-in",
);

// ============================================================
// Multi-select chip
// ============================================================

interface MultiSelectChipProps<T extends string> {
  label: string;
  allLabel: string;
  options: FilterOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}

function MultiSelectChip<T extends string>({
  label,
  allLabel,
  options,
  selected,
  onToggle,
  onClear,
}: MultiSelectChipProps<T>) {
  const { open, setOpen, ref, btnRef } = useDropdown();
  const hasActive = selected.length > 0;
  const value =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <ChipTrigger
        ref={btnRef}
        label={label}
        value={value}
        active={hasActive}
        expanded={open}
        count={selected.length > 1 ? selected.length : undefined}
        ariaLabel={`Filter by ${label}${hasActive ? `: ${selected.length} selected` : ""}`}
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <div className={MENU_CLASS}>
          {hasActive && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:bg-[var(--surface-sunken)] border-b border-[var(--border)]"
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
                      "focus-visible:outline-none focus-visible:bg-[var(--blue-50)]",
                      checked
                        ? "text-blue-700 dark:text-blue-300 bg-[var(--blue-50)] dark:bg-blue-500/10 font-medium"
                        : "text-[var(--ink)] hover:bg-[var(--surface-sunken)]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                        checked
                          ? "bg-blue-600 border-blue-600"
                          : "border-[var(--border-strong)] bg-[var(--surface)]",
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
// Single-select chip
// ============================================================

interface SingleSelectChipProps<T extends string> {
  label: string;
  allLabel: string;
  options: FilterOption<T>[];
  selected?: T;
  onSelect: (value: T | undefined) => void;
  /** When true, hides the "All …" clear option (e.g. Project scope). */
  required?: boolean;
}

function SingleSelectChip<T extends string>({
  label,
  allLabel,
  options,
  selected,
  onSelect,
  required = false,
}: SingleSelectChipProps<T>) {
  const { open, setOpen, ref, btnRef } = useDropdown();
  const hasActive = selected !== undefined;
  const value = hasActive
    ? options.find((o) => o.value === selected)?.label ?? String(selected)
    : allLabel;

  function choose(v: T | undefined) {
    onSelect(v);
    setOpen(false);
    btnRef.current?.focus();
  }

  return (
    <div ref={ref} className="relative">
      <ChipTrigger
        ref={btnRef}
        label={label}
        value={value}
        active={hasActive && !required}
        expanded={open}
        ariaLabel={`Filter by ${label}${hasActive ? `: ${value}` : ""}`}
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <ul role="listbox" aria-label={`${label} filter options`} className={MENU_CLASS}>
          {!required && (
            <li role="option" aria-selected={!hasActive}>
              <button
                type="button"
                onClick={() => choose(undefined)}
                className={clsx(
                  "w-full text-left flex items-center justify-between px-3 py-1.5 text-xs",
                  !hasActive
                    ? "text-blue-700 dark:text-blue-300 bg-[var(--blue-50)] dark:bg-blue-500/10 font-medium"
                    : "text-[var(--ink)] hover:bg-[var(--surface-sunken)]",
                )}
              >
                {allLabel}
                {!hasActive && <Check aria-hidden className="w-3 h-3" />}
              </button>
            </li>
          )}
          {options.map((opt) => {
            const active = opt.value === selected;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(opt.value)}
                  className={clsx(
                    "w-full text-left flex items-center justify-between px-3 py-1.5 text-xs",
                    "transition-colors duration-[100ms]",
                    "focus-visible:outline-none focus-visible:bg-[var(--blue-50)]",
                    active
                      ? "text-blue-700 dark:text-blue-300 bg-[var(--blue-50)] dark:bg-blue-500/10 font-medium"
                      : "text-[var(--ink)] hover:bg-[var(--surface-sunken)]",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <Check aria-hidden className="w-3 h-3 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
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
  trailing,
  projectOptions,
  currentProjectId,
  onProjectChange,
  typeOptions,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = React.useState(filters.q ?? "");
  const [moreOpen, setMoreOpen] = React.useState(
    filters.starred !== undefined || filters.agent_access !== undefined,
  );
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
    (filters.source_kind?.length ?? 0) > 0 ||
    !!filters.artifact_type_id ||
    !!filters.date ||
    filters.starred !== undefined ||
    !!filters.agent_access;

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

  const showMoreChips = moreOpen;

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
      <div className="relative flex items-center min-w-[180px] max-w-xs">
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
            "w-full h-11 pl-8 pr-7 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)]",
            "placeholder:text-[var(--ink-faint)] text-[var(--ink)]",
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

      {/* Project scope chip */}
      {projectOptions && projectOptions.length > 0 && onProjectChange && (
        <SingleSelectChip
          label="Project"
          allLabel="All Projects"
          options={projectOptions}
          selected={currentProjectId}
          onSelect={(v) => v && onProjectChange(v)}
          required
        />
      )}

      <MultiSelectChip
        label="Source"
        allLabel="All Sources"
        options={SOURCE_KIND_OPTIONS}
        selected={filters.source_kind ?? []}
        onToggle={toggleSourceKind}
        onClear={() => onChange({ ...filters, source_kind: undefined })}
      />

      {/* Type chip — only when artifact types exist in the data (no fake controls) */}
      {typeOptions && typeOptions.length > 0 && (
        <SingleSelectChip
          label="Type"
          allLabel="All Types"
          options={typeOptions}
          selected={filters.artifact_type_id}
          onSelect={(v) => onChange({ ...filters, artifact_type_id: v })}
        />
      )}

      <MultiSelectChip
        label="Status"
        allLabel="All Statuses"
        options={STATUS_OPTIONS}
        selected={filters.status ?? []}
        onToggle={toggleStatus}
        onClear={() => onChange({ ...filters, status: undefined })}
      />

      <SingleSelectChip
        label="Date"
        allLabel="Any time"
        options={DATE_PRESET_OPTIONS}
        selected={filters.date}
        onSelect={(v) => onChange({ ...filters, date: v })}
      />

      {/* Sensitivity — native select styled as a labeled chip (keeps combobox semantics) */}
      <div
        className={clsx(
          "relative flex flex-col items-start justify-center h-11 px-3 min-w-[104px] rounded-md border",
          "transition-colors duration-[100ms]",
          filters.sensitivity
            ? "bg-[var(--blue-50)] border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/50"
            : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-sunken)]",
        )}
      >
        <span className="text-[10px] leading-3 font-medium text-[var(--ink-muted)] pointer-events-none">
          Sensitivity
        </span>
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
            "w-full pr-5 bg-transparent text-xs font-medium appearance-none cursor-pointer",
            "focus:outline-none",
            filters.sensitivity
              ? "text-blue-700 dark:text-blue-300"
              : "text-[var(--ink)]",
          )}
        >
          <option value="">All Sensitivity</option>
          {SENSITIVITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="absolute right-2.5 bottom-2 w-3 h-3 text-[var(--ink-muted)] pointer-events-none"
        />
      </div>

      {/* More filters — reveals Starred + Agent access (both backend-supported) */}
      {showMoreChips && (
        <>
          <button
            type="button"
            aria-pressed={filters.starred === true}
            aria-label="Filter by starred"
            onClick={() =>
              onChange({
                ...filters,
                starred: filters.starred === true ? undefined : true,
              })
            }
            className={clsx(
              "flex flex-col items-start justify-center h-11 px-3 rounded-md text-left border",
              "transition-colors duration-[100ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              filters.starred
                ? "bg-[var(--blue-50)] border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/50"
                : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-sunken)]",
            )}
          >
            <span className="text-[10px] leading-3 font-medium text-[var(--ink-muted)]">
              Starred
            </span>
            <span className="flex items-center gap-1 text-xs font-medium">
              <Star
                aria-hidden
                className={clsx(
                  "w-3 h-3",
                  filters.starred
                    ? "text-amber-500 fill-amber-500"
                    : "text-[var(--ink-muted)]",
                )}
              />
              <span className={filters.starred ? "text-blue-700 dark:text-blue-300" : "text-[var(--ink)]"}>
                {filters.starred ? "Starred only" : "Any"}
              </span>
            </span>
          </button>

          <SingleSelectChip
            label="Agent Access"
            allLabel="Any access"
            options={AGENT_ACCESS_OPTIONS}
            selected={filters.agent_access}
            onSelect={(v) => onChange({ ...filters, agent_access: v })}
          />
        </>
      )}

      <Button
        size="xs"
        variant="ghost"
        iconLeft={<SlidersHorizontal aria-hidden className="w-3 h-3" />}
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={showMoreChips}
        className="text-blue-600 dark:text-blue-400"
      >
        {showMoreChips ? "Fewer filters" : "More filters"}
      </Button>

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

      {/* Right-side cluster: bulk actions / add (P2-2 consolidation) + result count */}
      <div className="ml-auto flex items-center gap-2">
        {trailing}
        {totalCount !== undefined && (
          <span className="text-xs text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
            {totalCount.toLocaleString()} asset{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
