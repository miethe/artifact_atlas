"use client";

/**
 * CommandCenterView — full project command center panel composition.
 *
 * Implements UI-HOME-001, UI-HOME-002, UI-HOME-003:
 * - KPI metric row from useDashboard (no hard-coded counts)
 * - Active IntentTree nodes panel
 * - Recent assets panel
 * - Canonical artifacts panel
 * - Candidate assets panel
 * - Missing context (BOM gaps) panel
 * - Context packs panel
 * - Agent activity panel
 * - MeatyWiki sync status bar
 *
 * Dense operational SaaS layout — card radii ≤8px, stable grid tracks.
 * All panels show loading/empty/error/success states.
 */

import * as React from "react";
import { Package, ScanLine, Tag, Clock } from "lucide-react";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useAssets } from "@/lib/hooks/useAssets";
import { useContextPacks } from "@/lib/hooks/useContextPacks";
import { useProject } from "@/lib/hooks/useProjects";
import { useAssetModal } from "@/features/assets/hooks/useAssetModal";
import { useMeatyWikiIntegration } from "./hooks/useIntegrations";
import { KPIRow } from "./components/KPIRow";
import { ActiveNodesPanel } from "./components/ActiveNodesPanel";
import { RecentAssetsPanel } from "./components/RecentAssetsPanel";
import { CanonicalArtifactsPanel } from "./components/CanonicalArtifactsPanel";
import { CandidateAssetsPanel } from "./components/CandidateAssetsPanel";
import { MissingContextPanel } from "./components/MissingContextPanel";
import { ContextPacksPanel } from "./components/ContextPacksPanel";
import { AgentActivityPanel } from "./components/AgentActivityPanel";
import { MeatyWikiSyncBar } from "./components/MeatyWikiSyncBar";

// ============================================================
// CommandCenterView
// ============================================================

interface CommandCenterViewProps {
  projectId: string;
}

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

// ============================================================
// CommandCenterView
// ============================================================

export function CommandCenterView({ projectId }: CommandCenterViewProps) {
  const dashboardQuery = useDashboard(projectId);
  const assetsQuery = useAssets(projectId, { limit: 50 });
  const contextPacksQuery = useContextPacks(projectId, { limit: 20 });
  const meatyWikiQuery = useMeatyWikiIntegration();
  const projectQuery = useProject(projectId);

  // Derive asset list from query
  const assets = assetsQuery.data?.items;

  // Asset detail modal — URL-driven, mounted once per page
  const { openAsset, assetModal } = useAssetModal(projectId, {
    title: (id) => assets?.find((a) => a.id === id)?.title,
  });

  // Asset library href — used for "View all" links
  const assetsHref = `/projects/${projectId}/assets`;
  const contextPacksHref = `/projects/${projectId}/context-packs`;
  const bomHref = `/projects/${projectId}/bom`;

  const project = projectQuery.data;
  const lastSync = meatyWikiQuery.integration?.last_sync_at;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
      {/* === Page Header === */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2 min-w-0">
          {/* Project name + tag chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-[var(--ink)] leading-tight truncate">
              {project?.name ?? "Command Center"}
            </h1>
            {/* Project status tag */}
            {project?.status && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 border border-green-200">
                <Tag className="w-2.5 h-2.5" aria-hidden />
                {project.status}
              </span>
            )}
            {/* Project source tag */}
            {project?.meatywiki_page_ref && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                MeatyWiki
              </span>
            )}
          </div>
          {/* Last-sync indicator */}
          {lastSync && (
            <p className="flex items-center gap-1 text-[11px] text-[var(--ink-faint)]">
              <Clock className="w-3 h-3 shrink-0" aria-hidden />
              Last sync: {relativeTime(lastSync)}
            </p>
          )}
        </div>
        {/* CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--ink-muted)] hover:bg-gray-50 hover:text-[var(--ink)] transition-colors duration-[100ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ScanLine className="w-3.5 h-3.5" aria-hidden />
            Scan Assets
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-[100ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Package className="w-3.5 h-3.5" aria-hidden />
            Build Context Pack
          </button>
        </div>
      </div>

      {/* === MeatyWiki Sync Bar === */}
      <MeatyWikiSyncBar
        integration={meatyWikiQuery.integration}
        isLoading={meatyWikiQuery.isLoading}
      />

      {/* === KPI Metric Row === */}
      <KPIRow
        stats={dashboardQuery.data}
        isLoading={dashboardQuery.isLoading}
        projectId={projectId}
      />

      {/* === Primary Panel Grid ===
           Desktop: 3-column layout
           Tablet: 2-column
           Mobile: 1-column (stacked)
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stable-grid">
        {/* Column 1: Active nodes + Agent activity */}
        <div className="flex flex-col gap-4">
          <ActiveNodesPanel
            projectId={projectId}
            isLoading={dashboardQuery.isLoading}
          />
          <AgentActivityPanel projectId={projectId} />
        </div>

        {/* Column 2: Recent assets + Candidate assets */}
        <div className="flex flex-col gap-4">
          <RecentAssetsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
            onOpenAsset={openAsset}
          />
          <CandidateAssetsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
            onOpenAsset={openAsset}
          />
        </div>

        {/* Column 3: Canonical + Missing context + Context packs */}
        <div className="flex flex-col gap-4">
          <CanonicalArtifactsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
            onOpenAsset={openAsset}
          />
          <MissingContextPanel
            projectId={projectId}
            viewAllHref={bomHref}
          />
          <ContextPacksPanel
            projectId={projectId}
            packs={contextPacksQuery.data?.items}
            isLoading={contextPacksQuery.isLoading}
            viewAllHref={contextPacksHref}
          />
        </div>
      </div>

      {/* Asset detail modal — URL-driven, mounted once per page */}
      {assetModal}
    </div>
  );
}
