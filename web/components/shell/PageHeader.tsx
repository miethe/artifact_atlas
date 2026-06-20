"use client";

/**
 * PageHeader — title row inside page content area.
 * Renders title, optional subtitle/eyebrow, and action slot.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Breadcrumbs } from "./Breadcrumbs";
import type { Crumb } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  crumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-4 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
    >
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs crumbs={crumbs} className="mb-1" />
        )}
        {eyebrow && (
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-0.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-lg font-semibold text-[var(--ink)] truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[var(--ink-muted)] mt-0.5 line-clamp-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-0.5">{actions}</div>
      )}
    </div>
  );
}
