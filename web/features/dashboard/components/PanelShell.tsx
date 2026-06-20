"use client";

/**
 * PanelShell — reusable wrapper for dashboard panels.
 * Dense operational SaaS; card radius ≤8px; no decorative blobs.
 */

import * as React from "react";
import { clsx } from "clsx";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** aria-label override for the panel region */
  ariaLabel?: string;
  /** When set renders a "View all" link in the header */
  viewAllHref?: string;
  viewAllLabel?: string;
}

export function PanelShell({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  ariaLabel,
  viewAllHref,
  viewAllLabel = "View all",
}: PanelShellProps) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className={clsx(
        "flex flex-col bg-white border border-[var(--border)] rounded-lg overflow-hidden",
        className,
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <span aria-hidden className="shrink-0 text-[var(--ink-muted)] w-3.5 h-3.5">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-[var(--ink)] truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] text-[var(--ink-faint)] truncate leading-none mt-px">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-[10px] font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap focus-ring rounded"
            >
              {viewAllLabel} →
            </a>
          )}
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {children}
      </div>
    </section>
  );
}
