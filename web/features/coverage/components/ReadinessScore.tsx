"use client";

/**
 * ReadinessScore — circular readiness gauge + KPI row for Coverage dashboard.
 * BOM-UI-006
 */

import * as React from "react";
import { clsx } from "clsx";

// ============================================================
// Types
// ============================================================

interface KpiCardProps {
  label: string;
  value: string | number;
  accent?: "blue" | "amber" | "red" | "green" | "default";
  description?: string;
}

export interface ReadinessScoreProps {
  score: number; // 0–100
  totalSlots: number;
  filledSlots: number;
  missingSlots: number;
  optionalPending?: number;
  staleOrBlocked?: number;
  recentlyCompleted?: number;
  className?: string;
}

// ============================================================
// Helpers
// ============================================================

function scoreColor(score: number): string {
  if (score >= 80) return "#16a34a"; // green-600
  if (score >= 50) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "Fair";
  return "At Risk";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

// ============================================================
// CircularGauge — SVG arc gauge
// ============================================================

function CircularGauge({ score }: { score: number }) {
  const radius = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center w-28 h-28">
      <svg
        width="112"
        height="112"
        viewBox="0 0 112 112"
        aria-hidden
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {/* Center text — score% + label (P5-P1-006) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums leading-none"
          style={{ color }}
          aria-label={`${score} percent`}
        >
          {score}<span className="text-sm">%</span>
        </span>
        <span className="text-[10px] font-medium mt-0.5" style={{ color }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// KpiCard
// ============================================================

const ACCENT_MAP: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "text-[var(--ink)]",
  blue: "text-blue-600",
  amber: "text-amber-600",
  red: "text-red-600",
  green: "text-green-600",
};

function KpiCard({ label, value, accent = "default", description }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-[var(--ink-muted)] font-medium leading-none">
        {label}
      </span>
      <span
        className={clsx(
          "text-2xl font-bold tabular-nums leading-none",
          ACCENT_MAP[accent],
        )}
      >
        {value}
      </span>
      {description && (
        <span className="text-[10px] text-[var(--ink-faint)] leading-none mt-0.5">
          {description}
        </span>
      )}
    </div>
  );
}

// ============================================================
// ReadinessScore — composite hero row
// ============================================================

export function ReadinessScore({
  score,
  totalSlots,
  filledSlots,
  missingSlots,
  optionalPending = 0,
  staleOrBlocked = 0,
  recentlyCompleted = 0,
  className,
}: ReadinessScoreProps) {
  const pct = Math.round(score);

  return (
    <div
      className={clsx(
        "flex items-center gap-6 px-5 py-4 rounded-xl border",
        scoreBg(pct),
        className,
      )}
      role="region"
      aria-label={`Project readiness: ${pct}%`}
    >
      {/* Gauge */}
      <div className="shrink-0">
        <CircularGauge score={pct} />
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-current opacity-10" aria-hidden />

      {/* KPIs */}
      <div className="flex items-start gap-8 flex-wrap">
        <KpiCard
          label="Critical Missing"
          value={missingSlots}
          accent={missingSlots > 0 ? "red" : "default"}
          description="Required, no asset"
        />
        <KpiCard
          label="Optional Pending"
          value={optionalPending}
          accent="amber"
          description="Optional gaps"
        />
        <KpiCard
          label="Total / Complete"
          value={`${filledSlots} / ${totalSlots}`}
          accent="blue"
          description="All slots"
        />
        <KpiCard
          label="Stale / Blocked"
          value={staleOrBlocked}
          accent={staleOrBlocked > 0 ? "amber" : "default"}
          description="Count as gaps"
        />
        <KpiCard
          label="Recently Completed"
          value={recentlyCompleted}
          accent="green"
          description="Last 7 days"
        />
      </div>
    </div>
  );
}
