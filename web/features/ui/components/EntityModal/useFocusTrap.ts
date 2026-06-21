"use client";

/**
 * useFocusTrap — focus management for modal surfaces (P2A-006).
 *
 * Reuses the focus-trap pattern from components/ui/Dialog.tsx and adds
 * focus-restore-to-trigger: on open we record the element that had focus and
 * restore it on close, so keyboard users return to where they were.
 *
 * Responsibilities:
 * - On open: move focus into the container (first focusable, else container).
 * - While open: Tab / Shift+Tab cycle within the container; Escape closes.
 * - On close: restore focus to the element that was focused when opened.
 *
 * The container itself must be focusable as a fallback (tabIndex={-1}) so the
 * trap has somewhere to land when there are no focusable children (e.g. the
 * MetadataUnavailable placeholder).
 */

import * as React from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UseFocusTrapOptions {
  /** Whether the trap is active (modal open). */
  active: boolean;
  /** Called when Escape is pressed. */
  onEscape: () => void;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  active,
  onEscape,
}: UseFocusTrapOptions): React.RefObject<T | null> {
  const containerRef = React.useRef<T>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // Keep the latest onEscape without re-running the trap effect on each render.
  const onEscapeRef = React.useRef(onEscape);
  React.useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  React.useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Record the trigger so we can restore focus on close.
    triggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Move focus into the dialog (first focusable, else the container itself).
    const initial = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (initial[0] ?? container).focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      // Re-query each Tab so dynamically loaded panel content is included.
      const focusable = container
        ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];
      if (focusable.length === 0) {
        e.preventDefault();
        container?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (e.shiftKey) {
        if (activeEl === first || activeEl === container) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger element on close/unmount.
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      }
      triggerRef.current = null;
    };
  }, [active]);

  return containerRef;
}
