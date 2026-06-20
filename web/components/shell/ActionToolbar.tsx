"use client";

/**
 * ActionToolbar — horizontal row of contextual action buttons.
 * Renders children in a flex row; separators and groups are inserted by the caller.
 */

import * as React from "react";
import { clsx } from "clsx";

interface ActionToolbarProps {
  children: React.ReactNode;
  className?: string;
  /** When true, renders as a sticky bar at the bottom of the content area */
  sticky?: boolean;
}

export function ActionToolbar({
  children,
  className,
  sticky = false,
}: ActionToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Page actions"
      className={clsx(
        "flex items-center gap-1.5 px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]",
        sticky && "sticky top-0 z-10 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * ActionToolbarSeparator — thin vertical divider between toolbar groups
 */
export function ActionToolbarSeparator({ className }: { className?: string }) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      className={clsx(
        "inline-block w-px h-4 bg-[var(--border)] shrink-0 mx-0.5",
        className,
      )}
    />
  );
}
