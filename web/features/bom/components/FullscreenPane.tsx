"use client";

/**
 * FullscreenPane — feature-local fullscreen wrapper for the BOM tab (WS-5).
 *
 * Renders children inline; when `expanded`, portals the same children into a
 * fixed full-viewport overlay with a header (title + exit button).
 * Escape exits fullscreen. Intentionally local to features/bom to avoid
 * depending on primitives owned by parallel workstreams.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Minimize2 } from "lucide-react";

export interface FullscreenPaneProps {
  expanded: boolean;
  onExit: () => void;
  title: string;
  children: React.ReactNode;
}

export function FullscreenPane({
  expanded,
  onExit,
  title,
  children,
}: FullscreenPaneProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!expanded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded, onExit]);

  if (!expanded) return <>{children}</>;
  if (!mounted) return <>{children}</>;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — fullscreen`}
      className="fixed inset-0 z-50 flex flex-col bg-[var(--surface)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
        <h2 className="text-sm font-semibold text-[var(--ink)] truncate">
          {title}
        </h2>
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit fullscreen"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Minimize2 className="w-3.5 h-3.5" aria-hidden />
          Exit fullscreen
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>,
    document.body,
  );
}
