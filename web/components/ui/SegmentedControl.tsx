"use client";

import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// SegmentedControl / ViewToggle
// Keyboard navigable (arrow keys), role=radiogroup
// ============================================================

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  /** Aria-label override if icon-only */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  size?: "xs" | "sm" | "md";
  /** icon-only mode — show only icons (requires ariaLabel on each option) */
  iconOnly?: boolean;
  className?: string;
  label?: string;
}

export function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  size = "sm",
  iconOnly = false,
  className,
  label = "View options",
}: SegmentedControlProps<T>) {
  const groupRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const current = options.findIndex((o) => o.value === value);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = options[(current + 1) % options.length];
      if (next && !next.disabled) onChange(next.value);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = options[(current - 1 + options.length) % options.length];
      if (prev && !prev.disabled) onChange(prev.value);
    }
  };

  const heightClass = {
    xs: "h-6",
    sm: "h-7",
    md: "h-8",
  }[size];

  const paddingClass = iconOnly
    ? { xs: "px-1.5", sm: "px-2", md: "px-2.5" }[size]
    : { xs: "px-2", sm: "px-2.5", md: "px-3" }[size];

  const textClass = { xs: "text-[10px]", sm: "text-xs", md: "text-sm" }[size];

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={clsx(
        "inline-flex bg-gray-100 rounded p-0.5 gap-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={iconOnly ? (opt.ariaLabel ?? opt.label) : opt.label}
            disabled={opt.disabled}
            title={iconOnly ? opt.label : undefined}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={clsx(
              "inline-flex items-center gap-1 font-medium rounded-[3px] transition-all duration-[100ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
              "disabled:pointer-events-none disabled:opacity-40",
              heightClass,
              paddingClass,
              textClass,
              selected
                ? "bg-white text-[var(--ink)] shadow-sm"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {opt.icon && (
              <span aria-hidden className="shrink-0">
                {opt.icon}
              </span>
            )}
            {!iconOnly && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// ViewToggle — preset: Gallery | Table | Board
// ============================================================

export type ViewMode = "gallery" | "table" | "board" | "timeline";
