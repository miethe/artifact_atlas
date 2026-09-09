import { ExternalLink } from "lucide-react";
import { assetHtmlUrl } from "@/lib/api";
import { utcDateBucket, type ProjectReportRow } from "./types";

interface CentralReportsTableProps {
  reports: ProjectReportRow[];
}

function value(input: string | number | null | undefined): string {
  return input === undefined || input === null || input === "" ? "—" : String(input);
}

export function CentralReportsTable({ reports }: CentralReportsTableProps) {
  return (
    <div className="overflow-x-auto bg-[var(--surface)]">
      <table className="w-full min-w-[1080px] text-xs">
        <thead className="border-b border-[var(--border)] bg-gray-50/80 text-left text-[var(--ink-muted)]">
          <tr>
            <th className="px-4 py-2 font-medium">Report</th>
            <th className="px-3 py-2 font-medium">Project</th>
            <th className="px-3 py-2 font-medium">Route</th>
            <th className="px-3 py-2 font-medium">Truth status</th>
            <th className="px-3 py-2 font-medium">Revision</th>
            <th className="px-3 py-2 font-medium">Source commit</th>
            <th className="px-3 py-2 font-medium">Captured</th>
            <th className="px-3 py-2 font-medium">Tracker nodes</th>
            <th className="px-4 py-2 text-right font-medium">Open</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(({ asset, metadata, trackerLinks }) => (
            <tr
              key={asset.id}
              className="border-b border-[var(--border)] transition-colors hover:bg-blue-50/40"
            >
              <td className="max-w-xs px-4 py-2.5 font-medium text-[var(--ink)]">
                {asset.title}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--ink-muted)]">
                {asset.project_id ?? "Unattributed"}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--ink-muted)]">
                {value(metadata.route)}
              </td>
              <td className="px-3 py-2.5">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                  {value(metadata.truth_status)}
                </span>
              </td>
              <td className="px-3 py-2.5 tabular-nums text-[var(--ink-muted)]">
                {value(metadata.revision)}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-[var(--ink-muted)]">
                {metadata.generated_from?.commit?.slice(0, 8) ?? "—"}
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap text-[var(--ink-muted)]">
                {value(utcDateBucket(asset.captured_at).replace("__unknown__", ""))}
              </td>
              <td className="px-3 py-2.5">
                {trackerLinks.length ? (
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
                  <span className="text-[var(--ink-faint)]">No tracker node</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <a
                  href={assetHtmlUrl(asset.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"
                  aria-label={`Open full report: ${asset.title}`}
                >
                  Report <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
