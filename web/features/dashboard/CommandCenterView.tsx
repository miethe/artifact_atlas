"use client";

/**
 * CommandCenterView — full project command center panel composition,
 * aligned to the authoritative mockup
 * (artifact_atlas_command_center_interface.png):
 *
 * - Header: Projects breadcrumb, title + star, description, tag chips,
 *   actions (Add Asset / Create Context Pack / Open in MeatyWiki),
 *   "Last synced Xm ago with MeatyWiki" line (absorbs the old sync bar)
 * - KPI row: All Assets · Candidate Assets · Canonical Assets ·
 *   Linked Intent Nodes · Open Tasks
 * - Panel grid: Active IntentTree Nodes, Recent Assets, Canonical
 *   Artifacts, Candidate Assets, Missing Context / Attention Needed,
 *   Context Packs (+ Agent Activity) — every pane expandable to
 *   fullscreen via ExpandablePane (WS-4 Task C).
 *
 * Dense operational SaaS layout — card radii ≤8px, stable grid tracks.
 * All panels show loading/empty/error/success states.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Package,
  Plus,
  RefreshCw,
  Star,
} from "lucide-react";
import { Button, TagChip } from "@/components/ui";
import { Breadcrumbs } from "@/components/shell/Breadcrumbs";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useAssets } from "@/lib/hooks/useAssets";
import { useContextPacks } from "@/lib/hooks/useContextPacks";
import { useProject, useUpdateProject } from "@/lib/hooks/useProjects";
import { useAssetModal } from "@/features/assets/hooks/useAssetModal";
import { projectMeta, type ProjectUpdateInput } from "@/features/projects/types";
import { useMeatyWikiIntegration } from "./hooks/useIntegrations";
import { useBomGaps } from "./hooks/useBomGaps";
import { KPIRow } from "./components/KPIRow";
import { ActiveNodesPanel } from "./components/ActiveNodesPanel";
import { RecentAssetsPanel } from "./components/RecentAssetsPanel";
import { CanonicalArtifactsPanel } from "./components/CanonicalArtifactsPanel";
import { CandidateAssetsPanel } from "./components/CandidateAssetsPanel";
import { MissingContextPanel } from "./components/MissingContextPanel";
import { ContextPacksPanel } from "./components/ContextPacksPanel";
import { AgentActivityPanel } from "./components/AgentActivityPanel";

// ============================================================
// Helpers
// ============================================================

function relativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "In Progress",
  paused: "Paused",
  archived: "Archived",
};

// ============================================================
// CommandCenterView
// ============================================================

interface CommandCenterViewProps {
  projectId: string;
}

export function CommandCenterView({ projectId }: CommandCenterViewProps) {
  const router = useRouter();
  const dashboardQuery = useDashboard(projectId);
  const assetsQuery = useAssets(projectId, { limit: 50 });
  const contextPacksQuery = useContextPacks(projectId, { limit: 20 });
  const meatyWikiQuery = useMeatyWikiIntegration();
  const projectQuery = useProject(projectId);
  const bomGapsQuery = useBomGaps(projectId);
  const updateProject = useUpdateProject(projectId);

  // Derive asset list from query
  const assets = assetsQuery.data?.items;

  // Asset detail modal — URL-driven, mounted once per page
  const { openAsset, assetModal } = useAssetModal(projectId, {
    title: (id) => assets?.find((a) => a.id === id)?.title,
  });

  // Hrefs — used by CTAs and panel "View all" links
  const assetsHref = `/projects/${projectId}/assets`;
  const contextPacksHref = `/projects/${projectId}/context-packs`;
  const bomHref = `/projects/${projectId}/bom`;
  const intentNodesHref = `/projects/${projectId}/intent-nodes`;

  const project = projectQuery.data;
  const meta = projectMeta(project);
  const integration = meatyWikiQuery.integration;
  const isWikiConnected = integration?.status === "connected";
  const lastSync = integration?.last_sync_at;

  const handleToggleStar = () => {
    if (!project || updateProject.isPending) return;
    const payload: ProjectUpdateInput = { starred: !meta.starred };
    updateProject.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
      {/* === Page Header === */}
      <div className="flex flex-col gap-1.5">
        {/* Breadcrumb */}
        <Breadcrumbs
          crumbs={[
            { label: "Projects", href: "/" },
            { label: project?.name ?? "…" },
          ]}
        />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Title block */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-semibold text-[var(--ink)] leading-tight truncate">
                {project?.name ?? "Command Center"}
              </h1>
              <button
                type="button"
                onClick={handleToggleStar}
                disabled={!project || updateProject.isPending}
                aria-pressed={meta.starred === true}
                aria-label={
                  meta.starred ? "Unstar this project" : "Star this project"
                }
                className="shrink-0 rounded p-1 text-[var(--ink-faint)] hover:text-amber-500 hover:bg-gray-100 transition-colors duration-[100ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
              >
                <Star
                  aria-hidden
                  className={
                    meta.starred
                      ? "w-4 h-4 text-amber-400 fill-amber-400"
                      : "w-4 h-4"
                  }
                />
              </button>
            </div>

            {/* Description */}
            {project?.description && (
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed max-w-xl">
                {project.description}
              </p>
            )}

            {/* Tag + status chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(meta.tags ?? []).map((tag) => (
                <TagChip key={tag} label={tag} size="xs" color="blue" />
              ))}
              {project?.status && (
                <TagChip
                  label={PROJECT_STATUS_LABELS[project.status] ?? project.status}
                  size="xs"
                  color={project.status === "active" ? "green" : "default"}
                />
              )}
              {project?.meatywiki_page_ref && (
                <TagChip label="MeatyWiki" size="xs" color="purple" />
              )}
            </div>
          </div>

          {/* CTAs + sync line */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                iconLeft={<Plus className="w-3.5 h-3.5" />}
                onClick={() => router.push(assetsHref)}
              >
                Add Asset
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconLeft={<Package className="w-3.5 h-3.5" />}
                onClick={() => router.push(contextPacksHref)}
              >
                Create Context Pack
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!isWikiConnected}
                iconLeft={<ExternalLink className="w-3.5 h-3.5" />}
                aria-label={
                  isWikiConnected
                    ? "Open project in MeatyWiki"
                    : "MeatyWiki not connected"
                }
                onClick={() => {
                  // Placeholder — deep link derived from meatywiki_page_ref (Stage 2B)
                }}
              >
                Open in MeatyWiki
              </Button>
            </div>

            {/* Last-synced line — absorbs the old MeatyWikiSyncBar */}
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-faint)]">
              <span
                aria-hidden
                className={`w-1.5 h-1.5 rounded-full ${
                  isWikiConnected
                    ? "bg-green-500"
                    : integration?.status === "error"
                      ? "bg-red-500"
                      : "bg-gray-400"
                }`}
              />
              <span role="status" aria-live="polite">
                {meatyWikiQuery.isLoading
                  ? "Checking MeatyWiki…"
                  : isWikiConnected
                    ? `Last synced ${lastSync ? relativeTime(lastSync) : "never"} with MeatyWiki`
                    : integration?.status === "error"
                      ? `MeatyWiki sync error${integration?.error_message ? `: ${integration.error_message}` : ""}`
                      : "Not synced with MeatyWiki"}
              </span>
              <button
                type="button"
                disabled={!isWikiConnected || meatyWikiQuery.isLoading}
                aria-label={
                  isWikiConnected
                    ? "Sync with MeatyWiki"
                    : "MeatyWiki not connected"
                }
                onClick={() => {
                  // Placeholder — sync mutation wired in Stage 2B
                }}
                className="rounded p-0.5 text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-gray-100 transition-colors duration-[100ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 disabled:pointer-events-none"
              >
                <RefreshCw aria-hidden className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* === KPI Metric Row === */}
      <KPIRow
        stats={dashboardQuery.data}
        isLoading={dashboardQuery.isLoading}
        projectId={projectId}
        openTaskCount={bomGapsQuery.data?.length ?? 0}
      />

      {/* === Primary Panel Grid ===
           Mockup rows:
             1: Active IntentTree Nodes | Recent Assets | Canonical Artifacts
             2: Candidate Assets | Missing Context / Attention | Context Packs
           Desktop: 3-column; Tablet: 2-column; Mobile: stacked.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stable-grid">
        {/* Column 1: Active nodes + Candidate assets */}
        <div className="flex flex-col gap-4">
          <ActiveNodesPanel
            projectId={projectId}
            isLoading={dashboardQuery.isLoading}
            viewAllHref={intentNodesHref}
          />
          <CandidateAssetsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
            onOpenAsset={openAsset}
          />
        </div>

        {/* Column 2: Recent assets + Missing context */}
        <div className="flex flex-col gap-4">
          <RecentAssetsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
            onOpenAsset={openAsset}
          />
          <MissingContextPanel projectId={projectId} viewAllHref={bomHref} />
        </div>

        {/* Column 3: Canonical + Context packs + Agent activity */}
        <div className="flex flex-col gap-4">
          <CanonicalArtifactsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
            onOpenAsset={openAsset}
          />
          <ContextPacksPanel
            projectId={projectId}
            packs={contextPacksQuery.data?.items}
            isLoading={contextPacksQuery.isLoading}
            viewAllHref={contextPacksHref}
          />
          <AgentActivityPanel projectId={projectId} />
        </div>
      </div>

      {/* Asset detail modal — URL-driven, mounted once per page */}
      {assetModal}
    </div>
  );
}
