"use client";

/**
 * SortMenu — dropdown button for sorting the asset list.
 */

import * as React from "react";
import { clsx } from "clsx";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";

export type SortField =
  | "captured_at"
  | "title"
  | "status"
  | "size_bytes"
  | "source_kind";

export type SortDir = "asc" | "desc";

export interface SortOption {
  field: SortField;
  dir: SortDir;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: "captured_at", dir: "desc", label: "Newest first" },
  { field: "captured_at", dir: "asc", label: "Oldest first" },
  { field: "title", dir: "asc", label: "Title A–Z" },
  { field: "title", dir: "desc", label: "Title Z–A" },
  { field: "status", dir: "asc", label: "Status" },
  { field: "size_bytes", dir: "desc", label: "Largest first" },
  { field: "size_bytes", dir: "asc", label: "Smallest first" },
];

export interface SortMenuProps {
  field: SortField;
  dir: SortDir;
  onChange: (field: SortField, dir: SortDir) => void;
  className?: string;
}

export function SortMenu({ field, dir, onChange, className }: SortMenuProps) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const currentOption = SORT_OPTIONS.find((o) => o.field === field && o.dir === dir) ?? SORT_OPTIONS[0];

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (
        e instanceof MouseEvent &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
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

  return (
    <div ref={menuRef} className={clsx("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort by: ${currentOption.label}`}
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium",
          "bg-white border border-[var(--border)] text-[var(--ink)]",
          "hover:bg-gray-50 transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
      >
        <ArrowUpDown aria-hidden className="w-3 h-3 text-[var(--ink-muted)]" />
        {currentOption.label}
        <ChevronDown aria-hidden className="w-3 h-3 text-[var(--ink-muted)]" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Sort options"
          className={clsx(
            "absolute right-0 top-full mt-1 z-20",
            "w-44 bg-white border border-[var(--border)] rounded shadow-modal py-1",
            "animate-fade-in",
          )}
        >
          {SORT_OPTIONS.map((opt) => {
            const active = opt.field === field && opt.dir === dir;
            return (
              <li key={`${opt.field}-${opt.dir}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.field, opt.dir);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className={clsx(
                    "w-full text-left flex items-center justify-between px-3 py-1.5 text-xs",
                    "transition-colors duration-[100ms]",
                    "focus-visible:outline-none focus-visible:bg-blue-50",
                    active
                      ? "text-blue-600 font-medium bg-blue-50"
                      : "text-[var(--ink)] hover:bg-gray-50",
                  )}
                >
                  {opt.label}
                  {active && <Check aria-hidden className="w-3 h-3 text-blue-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
