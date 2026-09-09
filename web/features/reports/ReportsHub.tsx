"use client";

import * as React from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ReportFacets } from "@/lib/types";
import { CentralReportsTable } from "./CentralReportsTable";
import { utcDateBucket, type ProjectReportRow } from "./types";
import { useReports, type ReportFilters } from "./useReports";

type GroupBy = "project" | "route" | "truth_status" | "date" | "tracker_node";

const GROUP_OPTIONS: Array<{ value: GroupBy; label: string }> = [
  { value: "project", label: "Project" },
  { value: "route", label: "Report route" },
  { value: "truth_status", label: "Truth status" },
  { value: "date", label: "Date" },
  { value: "tracker_node", label: "Tracker node" },
];

const FACET_KEY: Record<GroupBy, keyof ReportFacets> = {
  project: "project",
  route: "route",
  truth_status: "truth_status",
  date: "date_bucket",
  tracker_node: "tracker_node",
};

function labelFor(key: string): string {
  if (key === "__unattributed__") return "Unattributed";
  if (key === "__unlinked__") return "No tracker node";
  if (key === "__unknown__") return "Unknown";
  return key;
}

function rowGroups(row: ProjectReportRow, groupBy: GroupBy): string[] {
  if (groupBy === "project") return [row.asset.project_id ?? "__unattributed__"];
  if (groupBy === "route") return [row.metadata.route ?? "__unknown__"];
  if (groupBy === "truth_status") return [row.metadata.truth_status ?? "__unknown__"];
  if (groupBy === "date") {
    // Date filters and facet counts are defined by captured_at in the API.
    // Group on the same field so a group label can never disagree with its
    // server-authoritative count.
    return [utcDateBucket(row.asset.captured_at)];
  }
  const ids = row.trackerLinks.map((link) => link.target_id);
  return ids.length ? ids : ["__unlinked__"];
}

export function ReportsHub() {
  const [groupBy, setGroupBy] = React.useState<GroupBy>("project");
  const [selected, setSelected] = React.useState<Record<GroupBy, string>>({
    project: "",
    route: "",
    truth_status: "",
    date: "",
    tracker_node: "",
  });
  const filters = React.useMemo<ReportFilters>(() => ({
    project_id: selected.project ? [selected.project] : undefined,
    route: selected.route ? [selected.route] : undefined,
    truth_status: selected.truth_status ? [selected.truth_status] : undefined,
    tracker_node_id: selected.tracker_node ? [selected.tracker_node] : undefined,
    captured_after: selected.date && selected.date !== "__unknown__"
      ? `${selected.date}T00:00:00Z`
      : undefined,
    captured_before: selected.date && selected.date !== "__unknown__"
      ? `${selected.date}T23:59:59.999Z`
      : undefined,
  }), [selected]);
  const {
    data,
    reports,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReports(filters);

  const groups = React.useMemo(() => {
    const grouped = new Map<string, ProjectReportRow[]>();
    for (const report of reports) {
      for (const key of rowGroups(report, groupBy)) {
        grouped.set(key, [...(grouped.get(key) ?? []), report]);
      }
    }
    return [...grouped.entries()].sort(([a], [b]) => {
      if (a === "__unattributed__") return 1;
      if (b === "__unattributed__") return -1;
      return labelFor(a).localeCompare(labelFor(b));
    });
  }, [groupBy, reports]);

  if (isLoading) {
    return <div className="flex-1 animate-pulse bg-gray-50" aria-label="Loading reports…" />;
  }
  if (isError) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-10 w-10" aria-hidden />}
        title="Couldn’t load workspace reports"
        description="The reports API is unavailable. No fallback data is being shown."
      />
    );
  }
  if (!data || data.total === 0) {
    const hasFilters = Object.values(selected).some(Boolean);
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10" aria-hidden />}
        title={hasFilters ? "No reports match these filters" : "No reports in this workspace"}
        description={hasFilters
          ? "Clear or change a filter to see other delivery reports."
          : "Delivery reports will appear here after they are ingested."}
      />
    );
  }

  const facets = data.facets[FACET_KEY[groupBy]];
  const counts = new Map(facets.map((facet) => [facet.value, facet.count]));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink-muted)]">
            Group by
            <select
              aria-label="Group reports by"
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as GroupBy)}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink)]"
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <span className="ml-auto font-mono text-xs text-[var(--ink-muted)]">
            {data.total} total reports
          </span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" aria-label="Report filters">
          {GROUP_OPTIONS.map((option) => {
            const values = data.facets[FACET_KEY[option.value]];
            return (
              <label key={option.value} className="text-[11px] font-medium text-[var(--ink-muted)]">
                {option.label}
                <select
                  aria-label={`Filter by ${option.label.toLowerCase()}`}
                  value={selected[option.value]}
                  onChange={(event) => setSelected((current) => ({
                    ...current,
                    [option.value]: event.target.value,
                  }))}
                  className="mt-1 block w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink)]"
                >
                  <option value="">All</option>
                  {values.map((facet) => (
                    <option
                      key={facet.value}
                      value={facet.value}
                      disabled={option.value === "date" && facet.value === "__unknown__"}
                    >
                      {labelFor(facet.value)} ({facet.count})
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`${groupBy} facets`}>
          {facets.map((facet) => (
            <span key={facet.value} className="rounded border border-[var(--border)] bg-gray-50 px-2 py-1 text-[11px] text-[var(--ink-muted)]">
              {labelFor(facet.value)} <strong className="text-[var(--ink)]">{facet.count}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[var(--bg)] p-4">
        <div className="space-y-4">
          {groups.map(([key, rows]) => (
            <section key={key} className="overflow-hidden rounded border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center border-b border-[var(--border)] bg-gray-50 px-4 py-2">
                <h2 className="font-mono text-xs font-semibold text-[var(--ink)]">{labelFor(key)}</h2>
                <span className="ml-auto text-[11px] text-[var(--ink-muted)]">
                  {counts.has(key)
                    ? `${rows.length} shown of ${counts.get(key)} reports`
                    : `${rows.length} shown`}
                </span>
              </div>
              <CentralReportsTable reports={rows} />
            </section>
          ))}
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-gray-50 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading…" : `Load more reports (${reports.length} of ${data.total})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
