"use client";

/**
 * useGlobalShortcuts — app-wide single-key navigation shortcuts (P2-13).
 * Spec §7.4: A / I / B / C / T / L / M / G.
 *
 * Guards: ignored when the event was already handled (`defaultPrevented`);
 * while typing (input/textarea/select/contenteditable, or focus inside an
 * ARIA textbox/combobox/searchbox/menu/listbox/spinbutton widget); while any
 * `aria-modal="true"` dialog is open; when a modifier key (Cmd/Ctrl/Alt/
 * Shift) is held (so Cmd/Ctrl+K, Shift+<key> widget shortcuts, and browser
 * shortcuts are unaffected); and inside any `data-global-shortcuts-disabled`
 * subtree (an explicit opt-out escape hatch for embedded widgets).
 *
 * L and M are dispatched as custom events (`artifact-atlas:link-selected`,
 * `artifact-atlas:move-selected`) — they act on a page-local selection, so
 * the page that owns the selection decides what to do with them.
 */

import * as React from "react";
import { useRouter } from "next/navigation";

export const SHORTCUT_LINK_SELECTED_EVENT = "artifact-atlas:link-selected";
export const SHORTCUT_MOVE_SELECTED_EVENT = "artifact-atlas:move-selected";

/** ARIA widget roles that behave like text-entry/typing surfaces even when
 * the underlying element isn't a native input/textarea/select (MAJOR fix:
 * custom comboboxes, menus, and listboxes built from <div role="..."> were
 * previously unprotected — a single-key shortcut like "a" or "t" would fire
 * while the user was typing into or navigating one of these). */
const TYPING_ARIA_SELECTOR =
  '[role="textbox"],[role="combobox"],[role="searchbox"],[role="menu"],[role="listbox"],[role="spinbutton"]';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable ||
    el.closest(TYPING_ARIA_SELECTOR) !== null
  );
}

function isModalOpen(): boolean {
  return document.querySelector('[aria-modal="true"]') !== null;
}

/** Escape hatch: any ancestor can opt an element/subtree out of the global
 * single-key shortcuts entirely by setting `data-global-shortcuts-disabled`
 * (MAJOR fix — no such escape hatch existed before). */
function isShortcutsDisabled(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.closest("[data-global-shortcuts-disabled]") !== null;
}

export function useGlobalShortcuts(projectId: string) {
  const router = useRouter();

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // MAJOR fix: respect components that already handled this keydown
      // (e.g. a rich-text editor or a custom widget calling
      // preventDefault()) instead of also firing a navigation shortcut.
      if (e.defaultPrevented) return;
      // MAJOR fix: Shift+<key> is a distinct shortcut namespace (e.g.
      // Shift+A for "select all" in some widgets) — don't hijack it.
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      if (isModalOpen()) return;
      if (isShortcutsDisabled(e.target)) return;

      switch (e.key.toLowerCase()) {
        case "a":
          e.preventDefault();
          router.push(`/projects/${projectId}/assets`);
          break;
        case "i":
          e.preventDefault();
          router.push(`/projects/${projectId}/inbox`);
          break;
        case "b":
          e.preventDefault();
          router.push(`/projects/${projectId}/bom`);
          break;
        case "c":
          e.preventDefault();
          router.push(`/projects/${projectId}/context-packs`);
          break;
        case "t":
          e.preventDefault();
          router.push(`/projects/${projectId}/templates`);
          break;
        case "g":
          e.preventDefault();
          router.push(`/projects/${projectId}/coverage`);
          break;
        case "l":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent(SHORTCUT_LINK_SELECTED_EVENT));
          break;
        case "m":
          e.preventDefault();
          document.dispatchEvent(new CustomEvent(SHORTCUT_MOVE_SELECTED_EVENT));
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [projectId, router]);
}
