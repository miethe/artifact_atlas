"use client";

/**
 * AssetBrowseView — cross-project asset browse (M4 AC2).
 * Backed by GET /api/search with no project_id, filterable by artifact_type,
 * tag, and source_kind. Renders assets from every project in one table with
 * a visible Project column so multi-project results are obvious at a glance.
 */

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TagChip } from "@/components/ui/TagChip";
import { useAssetBrowse } from "@/lib/hooks/useAssets";
import { useProjects } from "@/lib/hooks/useProjects";
import type { AssetBrowseParams } from "@/lib/types";

export function AssetBrowseView() {
  const [q, setQ] = React.useState("");
  const [tag, setTag] = React.useState("");
  const [artifactType, setArtifactType] = React.useState("");
  const [projectId, setProjectId] = React.useState("");

  const params = React.useMemo<AssetBrowseParams>(() => {
    const p: AssetBrowseParams = { limit: 200 };
    if (q.trim()) p.q = q.trim();
    if (tag.trim()) p.tag = [tag.trim()];
    if (artifactType.trim()) p.artifact_type = [artifactType.trim()];
    if (projectId) p.project_id = projectId;
    return p;
  }, [q, tag, artifactType, projectId]);

  const { data, isLoading, isError } = useAssetBrowse(params);
  const { data: projectsData } = useProjects({ limit: 100 });

  const projectsById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projectsData?.items ?? []) map.set(p.id, p.name);
    return map;
  }, [projectsData?.items]);

  const results = data?.results ?? [];
  const distinctProjects = new Set(results.map((r) => r.project_id).filter(Boolean));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title/description…"
          aria-label="Search assets"
          className="w-56 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)]"
        />
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Filter by tag…"
          aria-label="Filter by tag"
          className="w-40 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)]"
        />
        <input
          type="text"
          value={artifactType}
          onChange={(e) => setArtifactType(e.target.value)}
          placeholder="Filter by artifact_type_id…"
          aria-label="Filter by artifact type"
          className="w-56 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)]"
        />
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Filter by project"
          className="px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--bg)]"
        >
          <option value="">All projects</option>
          {(projectsData?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-xs text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
          {isLoading
            ? "Loading…"
            : `${results.length} asset${results.length !== 1 ? "s" : ""} across ${distinctProjects.size} project${distinctProjects.size !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isError && (
          <div className="p-8 text-center">
            <EmptyState
              icon={<Search className="w-10 h-10" aria-hidden />}
              title="Failed to load assets"
              description="The API may be unavailable. Demo data shown below."
            />
          </div>
        )}

        {!isLoading && !isError && results.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<Search className="w-10 h-10" aria-hidden />}
              title="No assets found"
              description="Try adjusting your filters."
            />
          </div>
        )}

        {results.length > 0 && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
              <tr className="text-left text-[var(--ink-muted)]">
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.asset_id}
                  className="border-b border-[var(--border)] hover:bg-gray-50"
                >
                  <td className="px-4 py-2 max-w-xs truncate">
                    {r.project_id ? (
                      <Link
                        href={`/projects/${r.project_id}/assets/${r.asset_id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {r.title}
                      </Link>
                    ) : (
                      r.title
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {r.project_id ? (
                      <Link
                        href={`/projects/${r.project_id}`}
                        className="hover:underline"
                      >
                        {projectsById.get(r.project_id) ?? r.project_id}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} size="xs" />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-[var(--ink-muted)]">
                    {r.artifact_type_id ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.tags.length === 0 ? (
                        <span className="text-[var(--ink-faint)]">—</span>
                      ) : (
                        r.tags.map((t) => <TagChip key={t} label={t} size="xs" />)
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
