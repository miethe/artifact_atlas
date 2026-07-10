"use client";

/**
 * BomStatCards — five KPI stat cards for the BOM tab (WS-5, mockup fidelity).
 *
 * Total Expected Types (across N domains) · Filled (+% of expected) ·
 * Missing (% of expected) · Coverage % (progress bar) · Active Templates.
 */

import * as React from "react";
import {
  FileStack,
  CheckCircle2,
  AlertCircle,
  Gauge,
  LayoutTemplate,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { CoverageBar } from "./CoverageBar";

export interface BomStatCardsProps {
  totalExpected: number;
  domainCount: number;
  filled: number;
  missing: number;
  coveragePct: number;
  activeTemplates: number;
  templateNames?: string[];
}

function pctOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function BomStatCards({
  totalExpected,
  domainCount,
  filled,
  missing,
  coveragePct,
  activeTemplates,
  templateNames,
}: BomStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard
        label="Total Expected Types"
        value={totalExpected}
        icon={<FileStack className="w-3.5 h-3.5" aria-hidden />}
        sublabel={`Across ${domainCount} domain${domainCount === 1 ? "" : "s"}`}
      />
      <MetricCard
        label="Filled"
        value={filled}
        accent="green"
        icon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden />}
        sublabel={`${pctOf(filled, totalExpected)}% of expected`}
      />
      <MetricCard
        label="Missing"
        value={missing}
        accent={missing > 0 ? "amber" : "green"}
        icon={<AlertCircle className="w-3.5 h-3.5" aria-hidden />}
        sublabel={`${pctOf(missing, totalExpected)}% of expected`}
      />
      <MetricCard
        label="Coverage"
        value={`${coveragePct}%`}
        accent={coveragePct >= 80 ? "green" : coveragePct >= 50 ? "amber" : "red"}
        icon={<Gauge className="w-3.5 h-3.5" aria-hidden />}
        footer={
          <CoverageBar
            pct={coveragePct}
            accent={coveragePct >= 80 ? "green" : "amber"}
            size="xs"
          />
        }
      />
      <MetricCard
        label="Active Templates"
        value={activeTemplates}
        accent="purple"
        icon={<LayoutTemplate className="w-3.5 h-3.5" aria-hidden />}
        sublabel={
          templateNames && templateNames.length > 0
            ? templateNames.slice(0, 2).join(" + ")
            : "No templates applied"
        }
      />
    </div>
  );
}
