"use client";

import { ExternalLink } from "lucide-react";
import { AssetLink } from "@/features/assets/components/AssetLink";
import { assetHtmlUrl } from "@/lib/api";
import type { ProjectReportRow } from "./types";

interface ReportsTableProps {
  reports: ProjectReportRow[];
  onOpenAsset: (assetId: string) => void;
}

function display(value: string | number | null | undefined): string {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

function shortCommit(commit: string | null | undefined): string {
  return commit ? commit.slice(0, 8) : "—";
}

export function ReportsTable({ reports, onOpenAsset }: ReportsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[940px] text-xs">
        <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]">
          <tr className="text-left text-[var(--ink-muted)]">
            <th className="px-5 py-2.5 font-medium">Report</th>
            <th className="px-3 py-2.5 font-medium">Route</th>
            <th className="px-3 py-2.5 font-medium">Revision</th>
            <th className="px-3 py-2.5 font-medium">Truth status</th>
            <th className="px-3 py-2.5 font-medium">Source commit</th>
            <th className="px-3 py-2.5 font-medium">Tracker nodes</th>
            <th className="px-5 py-2.5 text-right font-medium">Hosted report</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(({ asset, metadata, trackerLinks }) => {
            const source = metadata.generated_from;
            const sourceTitle = source
              ? [source.repo, source.ref, source.commit].filter(Boolean).join(" · ")
              : undefined;

            return (
              <tr
                key={asset.id}
                className="border-b border-[var(--border)] transition-colors hover:bg-blue-50/40"
              >
                <td className="max-w-sm px-5 py-3">
                  <AssetLink
                    assetId={asset.id}
                    onOpen={onOpenAsset}
                    className="font-medium text-blue-700 hover:underline"
                    aria-label={`Open ${asset.title} preview`}
                  >
                    {asset.title}
                  </AssetLink>
                </td>
                <td className="px-3 py-3 font-mono text-[11px] text-[var(--ink-muted)]">
                  {display(metadata.route)}
                </td>
                <td className="px-3 py-3 tabular-nums text-[var(--ink-muted)]">
                  {display(metadata.revision)}
                </td>
                <td className="px-3 py-3">
                  {metadata.truth_status ? (
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                      {metadata.truth_status}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td
                  className="px-3 py-3 font-mono text-[11px] text-[var(--ink-muted)]"
                  title={sourceTitle}
                >
                  {shortCommit(source?.commit)}
                </td>
                <td className="px-3 py-3">
                  {trackerLinks.length > 0 ? (
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {trackerLinks.map((link) => (
                        <code
                          key={link.id}
                          className="select-all rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)]"
                        >
                          {link.target_id}
                        </code>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[var(--ink-faint)]">No linked tracker nodes</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <a
                    href={assetHtmlUrl(asset.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={`Open full report: ${asset.title}`}
                  >
                    Open full report
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
