"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  ExternalLink,
  FileText,
  GitBranch,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiAbsoluteUrl } from "@/lib/api";
import type { OverviewProject } from "@/lib/types";
import { useOverview } from "./useOverview";

export type AgeBand = "fresh" | "warning" | "stale" | "unknown";

export function ageBand(generatedAt: string, now = Date.now()): AgeBand {
  const timestamp = Date.parse(generatedAt);
  if (!Number.isFinite(timestamp)) return "unknown";
  const hours = Math.max(0, now - timestamp) / 3_600_000;
  if (hours > 24 * 7) return "stale";
  if (hours > 24) return "warning";
  return "fresh";
}

function ageLabel(generatedAt: string, now = Date.now()): string {
  const timestamp = Date.parse(generatedAt);
  if (!Number.isFinite(timestamp)) return "Age unknown";
  const hours = Math.max(0, now - timestamp) / 3_600_000;
  if (hours < 1) return "Updated <1h ago";
  if (hours < 48) return `Updated ${Math.floor(hours)}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}

const BAND_STYLE: Record<AgeBand, string> = {
  fresh: "border-emerald-300 bg-emerald-50 text-emerald-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  stale: "border-red-300 bg-red-50 text-red-800",
  unknown: "border-gray-300 bg-gray-50 text-gray-600",
};

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ProjectStatusCard({ project, now }: { project: OverviewProject; now: number }) {
  const latest = project.latest_report;
  const band = latest ? ageBand(latest.generated_at, now) : "unknown";
  const metrics = Object.entries(project.derived.metrics);

  return (
    <article className="group overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-shadow hover:shadow-md">
      <header className="flex items-start gap-4 border-b border-[var(--border)] bg-gray-50/70 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-faint)]">{project.slug}</p>
          {project.project_href ? (
            <Link href={project.project_href} className="inline-flex items-center gap-1.5 text-lg font-semibold text-[var(--ink)] hover:text-blue-700">
              {project.name}<ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </Link>
          ) : (
            <h2 className="text-lg font-semibold text-[var(--ink)]">{project.name}</h2>
          )}
        </div>
        {latest ? (
          <span className={`rounded border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${BAND_STYLE[band]}`}>
            {band} · {ageLabel(latest.generated_at, now)}
          </span>
        ) : (
          <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${BAND_STYLE.unknown}`}>No status report</span>
        )}
      </header>

      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 p-5">
          <section>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-faint)]">Reviewed narrative</h3>
              {project.authored.as_of && (
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] ${BAND_STYLE[ageBand(project.authored.as_of, now)]}`}>
                  As of {new Date(project.authored.as_of).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </span>
              )}
            </div>
            <p className="text-sm leading-6 text-[var(--ink-muted)]">{project.authored.summary || "No current reviewed summary."}</p>
            {project.authored.provenance && <p className="mt-1 font-mono text-[9px] text-[var(--ink-faint)]">{project.authored.provenance}</p>}
          </section>
          <section className="border-l-2 border-blue-500 pl-3">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700">Recorded next action</h3>
            <p className="text-sm font-medium leading-5 text-[var(--ink)]">{project.authored.next_action || "No current reviewed next action."}</p>
          </section>
          <div className="flex flex-wrap items-center gap-2">
            {project.derived.tree_id ? (
              <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-700">
                <GitBranch className="h-3 w-3" aria-hidden />{project.derived.tree_id}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
                <AlertTriangle className="h-3 w-3" aria-hidden />No tree bound
              </span>
            )}
            {latest && (
              <a href={apiAbsoluteUrl(latest.href)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-800 hover:bg-blue-100" aria-label={`Open latest ${latest.route ?? "status"} report: ${latest.title}`}>
                <FileText className="h-3 w-3" aria-hidden />Latest {latest.route ?? "status"}<ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-slate-950 p-4 text-slate-100 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Activity className="h-3.5 w-3.5" aria-hidden />Derived telemetry
          </div>
          {metrics.length ? (
            <dl className="divide-y divide-slate-800">
              {metrics.map(([key, metric]) => (
                <div key={key} className="grid grid-cols-[1fr_auto] gap-3 py-2">
                  <dt className="text-[11px] text-slate-400">{humanize(key)}</dt>
                  <dd className="font-mono text-xs font-semibold text-white">{metric.value === null ? "—" : String(metric.value)}</dd>
                  <dd className="col-span-2 text-[9px] leading-4 text-slate-500">
                    {metric.measured_by} · {metric.provenance}
                  </dd>
                </div>
              ))}
            </dl>
          ) : <p className="text-xs text-slate-500">No derived metrics.</p>}
        </div>
      </div>
    </article>
  );
}

export function OverviewView() {
  const { data, isLoading, isError } = useOverview();
  const now = Date.now();

  if (isLoading) return <div className="min-h-full animate-pulse bg-gray-50" aria-label="Loading AOS overview…" />;
  if (isError) return <EmptyState icon={<AlertTriangle className="h-10 w-10" />} title="Couldn’t load AOS overview" description="The overview API is unavailable. No fallback data is being shown." />;
  if (!data) return null;

  const snapshotBand = ageBand(data.generated_at, now);

  return (
    <div className="min-h-full bg-[var(--bg)]">
      <div className="border-b border-[var(--border)] bg-slate-950 px-6 py-4 text-slate-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2">
          <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${BAND_STYLE[snapshotBand]}`}>
            {snapshotBand} snapshot · schema {data.schema_version}
          </span>
          <span className="font-mono text-[10px] text-slate-400">Source: {data.source.name} / {data.source.collector_version} / {data.source.snapshot_id}</span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-400"><Clock3 className="h-3 w-3" aria-hidden />{ageLabel(data.generated_at, now)}</span>
        </div>
      </div>
      {data.projects.length ? (
        <div className="mx-auto grid max-w-7xl gap-4 p-5 xl:grid-cols-2">
          {data.projects.map((project) => <ProjectStatusCard key={project.id} project={project} now={now} />)}
        </div>
      ) : (
        <EmptyState title="No projects in this snapshot" description="The overview will populate when projects are registered." />
      )}
    </div>
  );
}
