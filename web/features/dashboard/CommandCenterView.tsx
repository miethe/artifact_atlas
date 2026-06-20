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
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useAssets } from "@/lib/hooks/useAssets";
import { useContextPacks } from "@/lib/hooks/useContextPacks";
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

export function CommandCenterView({ projectId }: CommandCenterViewProps) {
  const dashboardQuery = useDashboard(projectId);
  const assetsQuery = useAssets(projectId, { limit: 50 });
  const contextPacksQuery = useContextPacks(projectId, { limit: 20 });
  const meatyWikiQuery = useMeatyWikiIntegration();

  // Derive asset list from query
  const assets = assetsQuery.data?.items;

  // Asset library href — used for "View all" links
  const assetsHref = `/projects/${projectId}/assets`;
  const contextPacksHref = `/projects/${projectId}/context-packs`;
  const bomHref = `/projects/${projectId}/bom`;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
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
          />
          <CandidateAssetsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
          />
        </div>

        {/* Column 3: Canonical + Missing context + Context packs */}
        <div className="flex flex-col gap-4">
          <CanonicalArtifactsPanel
            projectId={projectId}
            assets={assets}
            isLoading={assetsQuery.isLoading}
            viewAllHref={assetsHref}
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
    </div>
  );
}
