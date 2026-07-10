"use client";

/**
 * ExpandablePane — dashboard pane wrapper with a fullscreen expand affordance.
 *
 * Renders the standard dense-panel chrome (header: icon/title/subtitle,
 * actions, optional "View all" link) plus an expand icon button that opens a
 * fullscreen Dialog-style overlay showing the pane's full content
 * (`expandedContent`, falling back to `children`). The overlay is scrollable
 * and focus-trapped (Esc closes, Tab cycles), per WCAG 2.1 AA dialog rules.
 *
 * New primitive (WS-4 / Task C) — intentionally NOT re-exported from
 * components/ui/index.ts during the parallel wave (shared-file rule);
 * import directly from "@/components/ui/ExpandablePane".
 */

import * as React from "react";
import { clsx } from "clsx";
import { Maximize2, X } from "lucide-react";

export interface ExpandablePaneProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Extra header actions rendered before the expand button */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** aria-label override for the panel region */
  ariaLabel?: string;
  /** When set renders a "View all" link in the header */
  viewAllHref?: string;
  viewAllLabel?: string;
  /**
   * Content rendered inside the fullscreen overlay. Should be the FULL
   * (uncapped) list, not the pane's preview slice. Defaults to `children`.
   */
  expandedContent?: React.ReactNode;
  /** Optional footer strip pinned to the bottom of the pane (mockup summary row) */
  footer?: React.ReactNode;
  /** Hide the expand affordance (rarely needed) */
  expandable?: boolean;
}

export function ExpandablePane({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  ariaLabel,
  viewAllHref,
  viewAllLabel = "View all",
  expandedContent,
  footer,
  expandable = true,
}: ExpandablePaneProps) {
  const [expanded, setExpanded] = React.useState(false);
  const expandButtonRef = React.useRef<HTMLButtonElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  const close = React.useCallback(() => {
    setExpanded(false);
    // Restore focus to the trigger for keyboard users
    requestAnimationFrame(() => expandButtonRef.current?.focus());
  }, []);

  // Focus trap + Esc for the fullscreen overlay (mirrors ui/Dialog.tsx)
  React.useEffect(() => {
    if (!expanded) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusable = overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab") {
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [expanded, close]);

  const headerMeta = (
    <div className="flex items-center gap-1.5 min-w-0">
      {icon && (
        <span aria-hidden className="shrink-0 text-[var(--ink-muted)] w-3.5 h-3.5">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h2 className="text-xs font-semibold text-[var(--ink)] truncate">{title}</h2>
        {subtitle && (
          <p className="text-[10px] text-[var(--ink-faint)] truncate leading-none mt-px">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      <section
        aria-label={ariaLabel ?? title}
        className={clsx(
          "flex flex-col bg-white border border-[var(--border)] rounded-lg overflow-hidden",
          className,
        )}
      >
        {/* Pane header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
          {headerMeta}
          <div className="flex items-center gap-1.5 shrink-0">
            {actions}
            {viewAllHref && (
              <a
                href={viewAllHref}
                className={clsx(
                  "inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700",
                  "whitespace-nowrap focus-ring rounded hover:bg-blue-50 transition-colors",
                  // Expand the tap target to >=28px without growing the header row visually.
                  "px-2 py-1.5 -my-1.5",
                )}
              >
                {viewAllLabel} →
              </a>
            )}
            {expandable && (
              <button
                ref={expandButtonRef}
                type="button"
                onClick={() => setExpanded(true)}
                aria-label={`Expand ${title} to fullscreen`}
                aria-haspopup="dialog"
                className={clsx(
                  "rounded p-1 -my-1 text-[var(--ink-faint)] hover:text-[var(--ink)]",
                  "hover:bg-gray-100 transition-colors duration-[100ms]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                )}
              >
                <Maximize2 aria-hidden className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Pane body */}
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>

        {/* Optional footer strip */}
        {footer && (
          <div className="shrink-0 border-t border-[var(--border)] px-3 py-1.5 bg-[var(--surface-sunken)]">
            {footer}
          </div>
        )}
      </section>

      {/* Fullscreen overlay */}
      {expanded && (
        <div role="presentation" className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={close}
          />

          {/* Fullscreen panel */}
          <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={clsx(
              "absolute inset-3 md:inset-6",
              "flex flex-col bg-white border border-[var(--border)] rounded-lg shadow-modal",
              "animate-slide-in-up overflow-hidden",
            )}
          >
            {/* Overlay header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {icon && (
                  <span
                    aria-hidden
                    className="shrink-0 text-[var(--ink-muted)] w-4 h-4"
                  >
                    {icon}
                  </span>
                )}
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="text-sm font-semibold text-[var(--ink)] truncate"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-[11px] text-[var(--ink-faint)] truncate leading-tight">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {viewAllHref && (
                  <a
                    href={viewAllHref}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors focus-ring whitespace-nowrap"
                  >
                    {viewAllLabel} →
                  </a>
                )}
                <button
                  type="button"
                  onClick={close}
                  aria-label={`Close ${title} fullscreen view`}
                  className={clsx(
                    "rounded p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
                    "transition-colors duration-[100ms]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  )}
                >
                  <X aria-hidden className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overlay body — full content, scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {expandedContent ?? children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
