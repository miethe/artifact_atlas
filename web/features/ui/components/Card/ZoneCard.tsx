"use client";

/**
 * ZoneCard — zone-composition card base component (P3-001).
 *
 * Structure:
 *   HeaderZone  — full-width thumbnail / hero area (~96px tall)
 *   ContentZone — primary text content (title, description)
 *   StatusZone  — badges, metadata chips
 *   ActionZone  — interactive controls (buttons, menus)
 *
 * Features:
 * - border-l-4 left accent bar (accentColor prop)
 * - Tier-aware body spacing (compact / default / expanded)
 * - Graceful rendering when zones are empty (undefined zone = omit)
 * - isInteractiveTarget guard helper (click-to-open guard)
 * - Uses tailwind-merge so consumer className overrides base classes safely
 */

import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================
// Tier sizing
// ============================================================

export type CardTier = "compact" | "default" | "expanded";

const TIER_BODY_CLASS: Record<CardTier, string> = {
  compact: "gap-1.5 p-2",
  default: "gap-2 p-3",
  expanded: "gap-3 p-4",
};

// ============================================================
// Zone sub-components (named wrappers for semantic DOM clarity)
// ============================================================

export interface ZoneProps {
  children?: React.ReactNode;
  className?: string;
}

/** Full-width top thumbnail area (~96px by default). */
export function HeaderZone({ children, className }: ZoneProps) {
  if (!children) return null;
  return (
    <div
      className={clsx(
        "w-full h-24 flex-shrink-0 overflow-hidden bg-[var(--surface-sunken)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Primary text content: title, description, etc. */
export function ContentZone({ children, className }: ZoneProps) {
  if (!children) return null;
  return (
    <div className={clsx("flex flex-col gap-1 min-w-0", className)}>
      {children}
    </div>
  );
}

/** Status indicators: badges, metadata chips, counts. */
export function StatusZone({ children, className }: ZoneProps) {
  if (!children) return null;
  return (
    <div className={clsx("flex items-center gap-1.5 flex-wrap", className)}>
      {children}
    </div>
  );
}

/** Interaction surface: buttons, menus, quick-actions. */
export function ActionZone({ children, className }: ZoneProps) {
  if (!children) return null;
  return (
    <div className={clsx("flex items-center gap-1", className)}>{children}</div>
  );
}

// ============================================================
// Click-to-open guard
// ============================================================

/**
 * Returns true if the click event target is inside an interactive element.
 *
 * When true, the card root onClick should NOT open the entity modal —
 * the event belongs to the interactive child (button, link, menuitem, etc.).
 *
 * Usage:
 *   const handleCardClick = (e: React.MouseEvent) => {
 *     if (isInteractiveTarget(e)) return;
 *     openModal(entityId);
 *   };
 */
export function isInteractiveTarget(e: React.MouseEvent | MouseEvent): boolean {
  try {
    return !!(e.target as Element).closest(
      "button,a,input,select,textarea,[role=menuitem],[role=option],[role=checkbox]",
    );
  } catch {
    return false;
  }
}

// ============================================================
// ZoneCard
// ============================================================

export interface ZoneCardProps {
  /** Left border accent color class (e.g. "border-l-blue-500"). Always paired with border-l-4. */
  accentColor?: string;
  /** Card sizing tier — affects body padding and gap. */
  tier?: CardTier;
  /** Full-width top thumbnail area (~96px). Pass undefined to omit HeaderZone. */
  header?: React.ReactNode;
  /** Primary content (title, description). */
  content?: React.ReactNode;
  /** Status indicators (badges, chips). */
  status?: React.ReactNode;
  /** Interactive actions (buttons, menus). */
  actions?: React.ReactNode;
  /**
   * Overlay content rendered before the header in DOM order (z-index via absolute positioning).
   * The card root has `position: relative` — overlay children can use `absolute` positioning.
   */
  overlay?: React.ReactNode;
  /** ARIA role for the card root element. Defaults to "article". */
  role?: React.AriaRole;
  tabIndex?: number;
  "aria-label"?: string;
  "aria-selected"?: boolean;
  "aria-labelledby"?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  /**
   * Extra Tailwind classes merged via tailwind-merge.
   * Consumer may override default border/bg/shadow (e.g. SlotCard status borders).
   */
  className?: string;
}

export function ZoneCard({
  accentColor = "border-l-gray-300",
  tier = "default",
  header,
  content,
  status,
  actions,
  overlay,
  role = "article",
  tabIndex,
  "aria-label": ariaLabel,
  "aria-selected": ariaSelected,
  "aria-labelledby": ariaLabelledby,
  onClick,
  onKeyDown,
  className,
}: ZoneCardProps) {
  const bodyClass = TIER_BODY_CLASS[tier];
  const hasBody =
    content !== undefined || status !== undefined || actions !== undefined;

  const rootClass = twMerge(
    // Structural
    "group relative flex flex-col overflow-hidden rounded-lg",
    // Outer border (consumer may override via className)
    "border border-[var(--border)]",
    // Left accent — always present (width fixed; color from accentColor prop)
    "border-l-4",
    accentColor,
    // Surface + selection
    "bg-[var(--surface)] select-none",
    // Interaction
    "cursor-pointer",
    "transition-shadow duration-[100ms]",
    // Focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
    // Consumer overrides — resolved last by tailwind-merge
    className,
  );

  return (
    <article
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-selected={ariaSelected}
      aria-labelledby={ariaLabelledby}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={rootClass}
    >
      {/* Overlay — absolute-positioned over card (e.g. selection checkbox) */}
      {overlay}

      {/* HeaderZone — full-width thumbnail / hero area (~96px) */}
      {header !== undefined && (
        <div className="w-full h-24 flex-shrink-0 overflow-hidden bg-[var(--surface-sunken)]">
          {header}
        </div>
      )}

      {/* Body — Content + Status + Actions */}
      {hasBody && (
        <div className={clsx("flex flex-col flex-1", bodyClass)}>
          {content !== undefined && (
            <div className="flex flex-col gap-1 min-w-0">{content}</div>
          )}
          {status !== undefined && (
            <div className="flex items-center gap-1.5 flex-wrap">{status}</div>
          )}
          {actions !== undefined && (
            <div className="flex items-center gap-1 mt-auto pt-2 border-t border-[var(--border)]">
              {actions}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
