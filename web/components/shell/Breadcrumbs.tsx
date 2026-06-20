"use client";

/**
 * Breadcrumbs — rendered server-side from a crumbs array, or auto-derived
 * from the Next.js pathname when no crumbs are supplied.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  crumbs?: Crumb[];
  className?: string;
}

export function Breadcrumbs({ crumbs = [], className }: BreadcrumbsProps) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={clsx("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-xs text-[var(--ink-muted)]" role="list">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="w-3 h-3 text-gray-300 shrink-0"
                  aria-hidden
                />
              )}
              {isLast || !crumb.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={clsx(
                    "truncate max-w-[160px]",
                    isLast
                      ? "text-[var(--ink)] font-medium"
                      : "text-[var(--ink-muted)]",
                  )}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={clsx(
                    "truncate max-w-[160px] hover:text-[var(--ink)] transition-colors",
                    "focus-visible:outline-none focus-visible:underline",
                  )}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
