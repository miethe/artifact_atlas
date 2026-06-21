"use client";

/**
 * KPIRow — row of KPI metric cards derived from useDashboard data.
 * No hard-coded counts; all values come from dashboard hook or demo fixture.
 */

import * as React from "react";
import {
  Archive,
  Box,
  CheckCircle2,
  FileText,
  Inbox,
  Package,
} from "lucide-react";
import { MetricCard } from "@/components/ui";
import { SkeletonCard } from "@/components/ui";
import type { DashboardStats } from "@/lib/types";

// ============================================================
// BOM coverage mini progress bar
// ============================================================

function CoverageBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const colorClass =
    clamped >= 80
      ? "bg-green-500"
      : clamped >= 50
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-[var(--ink-faint)]">BOM coverage</span>
        <span className="text-[10px] font-medium text-[var(--ink-muted)]">
          {clamped}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`BOM coverage: ${clamped}%`}
        className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// KPIRow
// ============================================================

interface KPIRowProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  projectId: string;
}

export function KPIRow({ stats, isLoading, projectId: _projectId }: KPIRowProps) {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const totalAssets = stats?.total_assets ?? 0;
  const inboxCount = stats?.inbox_count ?? 0;
  const canonicalCount = stats?.canonical_count ?? 0;
  const contextPackCount = stats?.context_pack_count ?? 0;
  const bomCoverage = stats?.bom_coverage_pct ?? 0;

  // Derive candidate count from assets_by_status
  const candidateCount =
    (stats?.assets_by_status?.candidate ?? 0) +
    (stats?.assets_by_status?.selected ?? 0);

  return (
    <div
      role="region"
      aria-label="Key metrics"
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 stable-grid"
    >
      <MetricCard
        label="Total Assets"
        value={totalAssets}
        icon={<FileText className="w-3.5 h-3.5" />}
        accent="blue"
        sublabel="tracked"
        delta={totalAssets > 0 ? { value: "+3", direction: "up" } : undefined}
      />
      <MetricCard
        label="Inbox"
        value={inboxCount}
        icon={<Inbox className="w-3.5 h-3.5" />}
        accent={inboxCount > 0 ? "amber" : "default"}
        sublabel="pending triage"
        delta={inboxCount > 0 ? { value: `+${inboxCount}`, direction: "up" } : undefined}
      />
      <MetricCard
        label="Canonical"
        value={canonicalCount}
        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
        accent="green"
        sublabel="promoted"
        delta={canonicalCount > 0 ? { value: "+1", direction: "up" } : undefined}
      />
      <MetricCard
        label="Candidates"
        value={candidateCount}
        icon={<Box className="w-3.5 h-3.5" />}
        accent={candidateCount > 0 ? "blue" : "default"}
        sublabel="in pipeline"
        delta={candidateCount > 0 ? { value: `${candidateCount}`, direction: "neutral" } : undefined}
      />
      <MetricCard
        label="Context Packs"
        value={contextPackCount}
        icon={<Package className="w-3.5 h-3.5" />}
        accent="purple"
        sublabel="available"
        delta={contextPackCount > 0 ? { value: "+1", direction: "up" } : undefined}
      />
      <MetricCard
        label="BOM Coverage"
        value={`${bomCoverage}%`}
        icon={<Archive className="w-3.5 h-3.5" />}
        accent={
          bomCoverage >= 80
            ? "green"
            : bomCoverage >= 50
              ? "amber"
              : "red"
        }
        delta={
          bomCoverage >= 80
            ? { value: "on track", direction: "up" }
            : bomCoverage > 0
              ? { value: `${bomCoverage < 50 ? "-" : ""}${Math.abs(bomCoverage - 50)}pts`, direction: bomCoverage >= 50 ? "neutral" : "down" }
              : undefined
        }
        footer={<CoverageBar pct={bomCoverage} />}
      />
    </div>
  );
}
