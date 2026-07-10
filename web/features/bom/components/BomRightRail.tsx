"use client";

/**
 * BomRightRail — right sidebar for the BOM tab (WS-5, mockup fidelity).
 *
 * Quick Actions (Review Gaps / Open Asset Library / Compare Coverage) ·
 * Template Sources (active templates + expected-type counts) ·
 * Insights bullets · Legend.
 */

import * as React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  Search,
  FolderOpen,
  BarChart3,
  ChevronRight,
  LayoutTemplate,
} from "lucide-react";
import { SlotLegend } from "./SlotLegend";
import type { DomainCoverage } from "../hooks/useBomCoverage";

// ============================================================
// Quick action row
// ============================================================

interface QuickActionRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  href?: string;
}

function QuickActionRow({ icon, title, subtitle, onClick, href }: QuickActionRowProps) {
  const body = (
    <>
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-semibold text-[var(--ink)] truncate">
          {title}
        </span>
        <span className="block text-[10px] text-[var(--ink-muted)] truncate">
          {subtitle}
        </span>
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-[var(--ink-faint)] shrink-0" aria-hidden />
    </>
  );

  const cls = clsx(
    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-[var(--border)]",
    "bg-[var(--surface)] hover:border-blue-300 hover:shadow-sm transition-all duration-[150ms]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
    "text-left",
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

// ============================================================
// Right rail
// ============================================================

export interface TemplateSourceInfo {
  id: string;
  name: string;
  expectedTypes: number | null;
  active: boolean;
}

export interface BomRightRailProps {
  projectId: string;
  gapsOnly: boolean;
  onToggleGaps: () => void;
  templateSources: TemplateSourceInfo[];
  byDomain: DomainCoverage[];
  missingByDomain: Record<string, number>;
}

export function BomRightRail({
  projectId,
  gapsOnly,
  onToggleGaps,
  templateSources,
  byDomain,
  missingByDomain,
}: BomRightRailProps) {
  const insights = React.useMemo(() => {
    const out: Array<{ tone: "red" | "green" | "amber"; text: string }> = [];
    const domains = Object.entries(missingByDomain).filter(([, n]) => n > 0);
    if (domains.length > 0) {
      const [worst, count] = domains.sort((a, b) => b[1] - a[1])[0];
      out.push({
        tone: "red",
        text: `${worst} has the most gaps (${count})`,
      });
    }
    const strong = [...byDomain]
      .filter((d) => d.total > 0)
      .sort((a, b) => b.coverage_pct - a.coverage_pct)[0];
    if (strong && strong.coverage_pct > 0) {
      out.push({
        tone: "green",
        text: `${strong.domain} coverage is strong (${strong.coverage_pct}%)`,
      });
    }
    const needy = [...byDomain]
      .filter((d) => d.total - d.filled > 0 && d.domain !== domains[0]?.[0])
      .sort((a, b) => b.total - b.filled - (a.total - a.filled))[0];
    if (needy) {
      out.push({
        tone: "amber",
        text: `${needy.domain} needs ${needy.total - needy.filled} more artifact${needy.total - needy.filled === 1 ? "" : "s"}`,
      });
    }
    return out;
  }, [byDomain, missingByDomain]);

  return (
    <aside
      aria-label="BOM quick actions and insights"
      className="w-full lg:w-[264px] shrink-0 space-y-4"
    >
      {/* Quick actions */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
        <h3 className="text-[11px] font-semibold text-[var(--ink)] mb-1">
          Quick Actions
        </h3>
        <QuickActionRow
          icon={<Search className="w-3.5 h-3.5" aria-hidden />}
          title="Review Gaps"
          subtitle={
            gapsOnly
              ? "Showing gaps only — click to show all"
              : "See what's missing and prioritize"
          }
          onClick={onToggleGaps}
        />
        <QuickActionRow
          icon={<FolderOpen className="w-3.5 h-3.5" aria-hidden />}
          title="Open Asset Library"
          subtitle="Browse and drag assets to fill gaps"
          href={`/projects/${projectId}/assets`}
        />
        <QuickActionRow
          icon={<BarChart3 className="w-3.5 h-3.5" aria-hidden />}
          title="Compare Coverage"
          subtitle="See coverage by template or domain"
          href={`/projects/${projectId}/coverage`}
        />
      </div>

      {/* Template sources */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <h3 className="text-[11px] font-semibold text-[var(--ink)] mb-2">
          Template Sources
        </h3>
        {templateSources.length === 0 ? (
          <p className="text-[11px] text-[var(--ink-muted)]">
            No templates applied yet.
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {templateSources.map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded bg-[var(--surface-sunken)] text-[var(--ink-muted)] shrink-0">
                  <LayoutTemplate className="w-3 h-3" aria-hidden />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-medium text-[var(--ink)] truncate">
                    {t.name}
                  </span>
                  <span className="block text-[10px] text-[var(--ink-faint)]">
                    {t.expectedTypes != null
                      ? `${t.expectedTypes} expected types`
                      : "expected types unknown"}
                  </span>
                </span>
                {t.active && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                    Active
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <h3 className="text-[11px] font-semibold text-[var(--ink)] mb-2">
            Insights
          </h3>
          <ul className="space-y-1.5" role="list">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-[var(--ink-muted)]">
                <span
                  aria-hidden
                  className={clsx(
                    "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                    ins.tone === "red" && "bg-red-500",
                    ins.tone === "green" && "bg-emerald-500",
                    ins.tone === "amber" && "bg-amber-500",
                  )}
                />
                <span className="capitalize-first">{ins.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <h3 className="text-[11px] font-semibold text-[var(--ink)] mb-2">Legend</h3>
        <SlotLegend />
        <p className="text-[10px] text-[var(--ink-faint)] mt-2">
          Coverage calculated from active templates
        </p>
      </div>
    </aside>
  );
}
