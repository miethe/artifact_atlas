"use client";

/**
 * KPIRow — command-center stat cards per the mockup
 * (artifact_atlas_command_center_interface.png):
 *   All Assets · Candidate Assets · Canonical Assets ·
 *   Linked Intent Nodes · Open Tasks
 * No hard-coded counts; values come from useDashboard / useBomGaps /
 * the shared IntentTree fixture module.
 */

import * as React from "react";
import {
  CheckCircle2,
  FolderOpen,
  ListChecks,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { MetricCard, SkeletonCard } from "@/components/ui";
import type { DashboardStats } from "@/lib/types";
import { linkedIntentNodeCount } from "../intentNodes";

// ============================================================
// KPIRow
// ============================================================

interface KPIRowProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  projectId: string;
  /** Open Tasks — count of missing/partial BOM slots (from useBomGaps) */
  openTaskCount?: number;
}

export function KPIRow({
  stats,
  isLoading,
  projectId: _projectId,
  openTaskCount = 0,
}: KPIRowProps) {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const totalAssets = stats?.total_assets ?? 0;
  const canonicalCount = stats?.canonical_count ?? 0;

  // Candidate pipeline — matches CandidateAssetsPanel's filter
  const candidateCount =
    (stats?.assets_by_status?.candidate ?? 0) +
    (stats?.assets_by_status?.selected ?? 0) +
    (stats?.assets_by_status?.in_review ?? 0) +
    (stats?.assets_by_status?.in_progress ?? 0);

  const intentNodeCount = linkedIntentNodeCount();

  return (
    <div
      role="region"
      aria-label="Key metrics"
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 stable-grid"
    >
      <MetricCard
        label="All Assets"
        value={totalAssets}
        icon={<FolderOpen className="w-3.5 h-3.5" />}
        accent="blue"
        sublabel="tracked"
      />
      <MetricCard
        label="Candidate Assets"
        value={candidateCount}
        icon={<Sparkles className="w-3.5 h-3.5" />}
        accent={candidateCount > 0 ? "amber" : "default"}
        sublabel="in pipeline"
      />
      <MetricCard
        label="Canonical Assets"
        value={canonicalCount}
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        accent="green"
        sublabel="promoted"
      />
      <MetricCard
        label="Linked Intent Nodes"
        value={intentNodeCount}
        icon={<Waypoints className="w-3.5 h-3.5" />}
        accent="purple"
        sublabel="IntentTree"
      />
      <MetricCard
        label="Open Tasks"
        value={openTaskCount}
        icon={<ListChecks className="w-3.5 h-3.5" />}
        accent={openTaskCount > 0 ? "red" : "default"}
        sublabel="BOM gaps"
      />
    </div>
  );
}
