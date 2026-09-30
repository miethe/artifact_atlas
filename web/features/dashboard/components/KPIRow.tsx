"use client";

/**
 * KPIRow — command-center stat cards per the mockup
 * (artifact_atlas_command_center_interface.png):
 *   All Assets · Candidate Assets · Canonical Assets ·
 *   Linked Intent Nodes · Open Tasks
 * No hard-coded counts; values come from useDashboard / useBomGaps.
 * A card whose source failed or is not connected shows "—" with a reason,
 * never a zero or fixture value presented as catalog truth.
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
  /** Dashboard stats query failed — asset cards render "—" / "unavailable". */
  isError?: boolean;
  projectId: string;
  /**
   * Open Tasks — count of missing/partial BOM slots (from useBomGaps).
   * `null` means the BOM source is unavailable (renders "—").
   */
  openTaskCount?: number | null;
}

const UNKNOWN = "—";

export function KPIRow({
  stats,
  isLoading,
  isError = false,
  projectId: _projectId,
  openTaskCount = null,
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

  const statsKnown = !!stats && !(isError && !stats);
  const statsSublabel = (label: string) => (statsKnown ? label : "unavailable");

  const totalAssets = stats?.total_assets;
  const canonicalCount = stats?.canonical_count;

  // Candidate pipeline — matches CandidateAssetsPanel's filter
  const candidateCount = stats
    ? (stats.assets_by_status?.candidate ?? 0) +
      (stats.assets_by_status?.selected ?? 0) +
      (stats.assets_by_status?.in_review ?? 0) +
      (stats.assets_by_status?.in_progress ?? 0)
    : null;

  const intentNodeCount = linkedIntentNodeCount();

  return (
    <div
      role="region"
      aria-label="Key metrics"
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 stable-grid"
    >
      <MetricCard
        label="All Assets"
        value={totalAssets ?? UNKNOWN}
        icon={<FolderOpen className="w-3.5 h-3.5" />}
        accent={statsKnown ? "blue" : "default"}
        sublabel={statsSublabel("tracked")}
      />
      <MetricCard
        label="Candidate Assets"
        value={candidateCount ?? UNKNOWN}
        icon={<Sparkles className="w-3.5 h-3.5" />}
        accent={candidateCount ? "amber" : "default"}
        sublabel={statsSublabel("in pipeline")}
      />
      <MetricCard
        label="Canonical Assets"
        value={canonicalCount ?? UNKNOWN}
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        accent={statsKnown ? "green" : "default"}
        sublabel={statsSublabel("promoted")}
      />
      <MetricCard
        label="Linked Intent Nodes"
        value={intentNodeCount ?? UNKNOWN}
        icon={<Waypoints className="w-3.5 h-3.5" />}
        accent={intentNodeCount === null ? "default" : "purple"}
        sublabel={
          intentNodeCount === null ? "IntentTree not connected" : "IntentTree (demo)"
        }
      />
      <MetricCard
        label="Open Tasks"
        value={openTaskCount ?? UNKNOWN}
        icon={<ListChecks className="w-3.5 h-3.5" />}
        accent={openTaskCount ? "red" : "default"}
        sublabel={openTaskCount === null ? "BOM unavailable" : "BOM gaps"}
      />
    </div>
  );
}
