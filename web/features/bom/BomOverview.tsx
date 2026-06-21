"use client";

/**
 * BomOverview — BOM-UI-003 + BOM-UI-004
 *
 * Renders:
 * - KPI row: required coverage %, total slots, missing gaps, stale/blocked counts
 * - Domain tabs: filter slot grid by domain
 * - Slot grid: all UI states (see SlotCard)
 * - Template sources list
 * - Status legend
 * - Quick actions: Apply template, Export BOM
 *
 * P2b: When flag:ui-tabbed-modal (or flag:ui-tabbed-modal-bom) is on, slot detail
 * uses EntityModal (tabbed, URL-driven). The bespoke inline SlotDetailPanel is removed
 * from the flagged path; the legacy fixed-panel is retained for fallback.
 *
 * All slot interactions route through API hooks (useBomSlot).
 * Audit-sensitive actions (unassign, N/A) confirm via Dialog.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  LayoutTemplate,
  Download,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Package,
} from "lucide-react";
import { useBom } from "@/lib/hooks/useBom";
import { isFlagEnabled } from "@/lib/flags";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BomSlot } from "@/lib/types";
import { SlotCard, SlotCardSkeleton } from "./components/SlotCard";
import { SlotLegend } from "./components/SlotLegend";
import { CoverageBar } from "./components/CoverageBar";
import { useBomCoverageExtended } from "./hooks/useBomCoverage";
import { EntityModal, useEntityModalUrl } from "@/features/ui/components/EntityModal";
import { SLOT_TAB_REGISTRY } from "./components/EntityModal/SlotTabRegistry";

// ============================================================
// Domain tab
// ============================================================

const ALL_DOMAIN = "__all__";

function getDomains(slots: BomSlot[]): string[] {
  const seen = new Set<string>();
  for (const s of slots) {
    seen.add(s.domain ?? "uncategorized");
  }
  return Array.from(seen).sort();
}

// ============================================================
// KPI row
// ============================================================

interface KpiRowProps {
  coveragePct: number;
  required: number;
  requiredComplete: number;
  missing: number;
  stale: number;
  blocked: number;
  partial: number;
  total: number;
}

function KpiRow({
  coveragePct,
  required,
  requiredComplete,
  missing,
  stale,
  blocked,
  partial,
  total,
}: KpiRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetricCard
        label="Required coverage"
        value={`${coveragePct}%`}
        accent={
          coveragePct >= 80 ? "green" : coveragePct >= 50 ? "amber" : "red"
        }
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        sublabel={`${requiredComplete}/${required} slots`}
        footer={
          <CoverageBar
            pct={coveragePct}
            accent={coveragePct >= 80 ? "green" : coveragePct >= 50 ? "amber" : "green"}
            size="xs"
          />
        }
      />
      <MetricCard
        label="Total slots"
        value={total}
        icon={<Layers className="w-3.5 h-3.5" />}
        sublabel="across all domains"
      />
      <MetricCard
        label="Missing / gaps"
        value={missing + partial}
        accent={missing + partial > 0 ? "red" : "green"}
        icon={<AlertCircle className="w-3.5 h-3.5" />}
        sublabel={`${missing} missing, ${partial} partial`}
      />
      <MetricCard
        label="Stale / blocked"
        value={stale + blocked}
        accent={stale + blocked > 0 ? "amber" : "green"}
        icon={<Clock className="w-3.5 h-3.5" />}
        sublabel={`${stale} stale, ${blocked} blocked`}
      />
    </div>
  );
}

// ============================================================
// Domain tabs
// ============================================================

interface DomainTabsProps {
  domains: string[];
  active: string;
  onChange: (domain: string) => void;
  slotCounts: Record<string, number>;
}

function DomainTabs({ domains, active, onChange, slotCounts }: DomainTabsProps) {
  return (
    <nav
      aria-label="Domain filter tabs"
      className="flex items-center gap-0.5 border-b border-[var(--border)] overflow-x-auto"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === ALL_DOMAIN}
        onClick={() => onChange(ALL_DOMAIN)}
        className={clsx(
          "shrink-0 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
          active === ALL_DOMAIN
            ? "border-blue-600 text-blue-700"
            : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-gray-300",
        )}
      >
        All
        <span className="ml-1.5 text-[10px] text-[var(--ink-faint)]">
          ({slotCounts[ALL_DOMAIN] ?? 0})
        </span>
      </button>
      {domains.map((d) => (
        <button
          key={d}
          type="button"
          role="tab"
          aria-selected={active === d}
          onClick={() => onChange(d)}
          className={clsx(
            "shrink-0 px-3 py-2 text-xs font-medium border-b-2 -mb-px capitalize transition-colors duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
            active === d
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-gray-300",
          )}
        >
          {d}
          <span className="ml-1.5 text-[10px] text-[var(--ink-faint)]">
            ({slotCounts[d] ?? 0})
          </span>
        </button>
      ))}
    </nav>
  );
}

// ============================================================
// Template sources panel
// ============================================================

interface TemplateSourcesProps {
  templateIds: string[];
}

function TemplateSources({ templateIds }: TemplateSourcesProps) {
  if (templateIds.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-3">
      <h3 className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
        Template sources
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {templateIds.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
          >
            <LayoutTemplate className="w-3 h-3" aria-hidden />
            {id.replace(/^tmpl_/, "").replace(/_v\d+$/, "").replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Quick actions bar
// ============================================================

interface QuickActionsProps {
  onApplyTemplate: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function QuickActions({
  onApplyTemplate,
  onExport,
  onRefresh,
  isRefreshing,
}: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        iconLeft={<LayoutTemplate className="w-3.5 h-3.5" aria-hidden />}
        onClick={onApplyTemplate}
      >
        Apply template
      </Button>
      <Button
        variant="secondary"
        size="sm"
        iconLeft={<Download className="w-3.5 h-3.5" aria-hidden />}
        onClick={onExport}
      >
        Export BOM
      </Button>
      <Button
        variant="ghost"
        size="sm"
        iconLeft={
          <RefreshCw
            className={clsx("w-3.5 h-3.5", isRefreshing && "animate-spin")}
            aria-hidden
          />
        }
        aria-label="Refresh BOM data"
        loading={isRefreshing}
        onClick={onRefresh}
      />
    </div>
  );
}

// ============================================================
// Slot detail drawer (inline panel for now)
// ============================================================

interface SlotDetailPanelProps {
  slot: BomSlot | null;
  onClose: () => void;
}

function SlotDetailPanel({ slot, onClose }: SlotDetailPanelProps) {
  if (!slot) return null;

  return (
    <div
      className={clsx(
        "fixed inset-y-0 right-0 z-40 w-80 bg-white border-l border-[var(--border)] shadow-xl",
        "flex flex-col overflow-hidden",
        "animate-slide-in-right",
      )}
      role="complementary"
      aria-label={`Slot detail: ${slot.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">
            BOM Slot
          </p>
          <h2 className="text-sm font-semibold text-[var(--ink)] leading-tight mt-0.5 truncate">
            {slot.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close slot detail"
          className="shrink-0 rounded p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span aria-hidden className="text-lg leading-none">&times;</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Meta */}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <dt className="text-[var(--ink-muted)] font-medium">ID</dt>
          <dd className="font-mono text-[var(--ink)] truncate">{slot.id}</dd>

          <dt className="text-[var(--ink-muted)] font-medium">Required</dt>
          <dd className={slot.required ? "text-red-600 font-medium" : "text-gray-500"}>
            {slot.required ? "Yes" : "No"}
          </dd>

          <dt className="text-[var(--ink-muted)] font-medium">Phase</dt>
          <dd className="capitalize text-[var(--ink)]">{slot.phase ?? "—"}</dd>

          <dt className="text-[var(--ink-muted)] font-medium">Domain</dt>
          <dd className="text-[var(--ink)]">{slot.domain ?? "—"}</dd>

          <dt className="text-[var(--ink-muted)] font-medium">Assignments</dt>
          <dd className="text-[var(--ink)]">{slot.assignment_count}</dd>

          {slot.artifact_type_id && (
            <>
              <dt className="text-[var(--ink-muted)] font-medium">Artifact type</dt>
              <dd className="font-mono text-[11px] text-[var(--ink)] truncate">
                {slot.artifact_type_id}
              </dd>
            </>
          )}
        </dl>

        {slot.description && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">
              Description
            </p>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              {slot.description}
            </p>
          </div>
        )}

        {/* Coverage guidance */}
        <div className="bg-[var(--surface-sunken)] rounded-lg p-3 border border-[var(--border)]">
          <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
            Coverage rules
          </p>
          <ul className="text-xs text-[var(--ink-muted)] space-y-1 list-disc list-inside">
            <li>missing: required slot, no accepted assignment</li>
            <li>partial: suggested only or min-count unmet</li>
            <li>in_progress: accepted asset in raw/candidate state</li>
            <li>complete: canonical asset + review satisfied</li>
            <li>stale: past staleness threshold or superseded</li>
            <li>blocked: missing dependency or explicit blocker</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BomOverview
// ============================================================

export interface BomOverviewProps {
  projectId: string;
}

export function BomOverview({ projectId }: BomOverviewProps) {
  const { data: bom, isLoading, error, refetch, isFetching } = useBom(projectId);
  const slots = bom?.slots ?? [];

  const { data: coverage } = useBomCoverageExtended(bom?.id, slots);

  // Feature flag: use EntityModal (P2b) vs legacy inline panel.
  const useEntityModalFlag =
    isFlagEnabled("ui-tabbed-modal") || isFlagEnabled("ui-tabbed-modal-bom");

  const [activeDomain, setActiveDomain] = React.useState<string>(ALL_DOMAIN);
  // Legacy state (used when flag is off).
  const [selectedSlot, setSelectedSlot] = React.useState<BomSlot | null>(null);

  // EntityModal URL state (always called per hook rules).
  const { isOpen: modalIsOpen, itemId: modalItemId, open: modalOpen, close: modalClose } =
    useEntityModalUrl(SLOT_TAB_REGISTRY);

  function handleSlotOpen(slot: BomSlot) {
    if (useEntityModalFlag) {
      if (modalIsOpen && modalItemId === slot.id) {
        modalClose();
      } else {
        modalOpen(slot.id);
      }
    } else {
      setSelectedSlot((prev) => (prev?.id === slot.id ? null : slot));
    }
  }

  // Derived data
  const domains = React.useMemo(() => getDomains(slots), [slots]);

  const slotCounts = React.useMemo(() => {
    const counts: Record<string, number> = { [ALL_DOMAIN]: slots.length };
    for (const d of domains) {
      counts[d] = slots.filter(
        (s) => (s.domain ?? "uncategorized") === d,
      ).length;
    }
    return counts;
  }, [slots, domains]);

  const filteredSlots = React.useMemo(() => {
    if (activeDomain === ALL_DOMAIN) return slots;
    return slots.filter((s) => (s.domain ?? "uncategorized") === activeDomain);
  }, [slots, activeDomain]);

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        {/* KPI skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* Tab skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded" />
          ))}
        </div>
        {/* Grid skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <SlotCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error && !bom) {
    return (
      <div className="flex-1 p-5">
        <EmptyState
          icon={<Package className="w-10 h-10" aria-hidden />}
          title="Failed to load BOM"
          description="Could not retrieve the artifact BOM for this project. Check the API connection."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // ---- Empty BOM state ----
  if (!bom || slots.length === 0) {
    return (
      <div className="flex-1 p-5">
        <EmptyState
          icon={<Package className="w-10 h-10" aria-hidden />}
          title="No BOM slots"
          description="Apply a template to create artifact slots for this project."
          action={
            <Button
              variant="primary"
              size="sm"
              iconLeft={<LayoutTemplate className="w-3.5 h-3.5" aria-hidden />}
            >
              Apply template
            </Button>
          }
        />
      </div>
    );
  }

  const coveragePct = coverage?.coverage_pct ?? 0;
  const requiredSlots = coverage?.required_slots ?? 0;
  const requiredComplete = coverage?.required_complete ?? 0;
  const missingSlots = coverage?.missing_slots ?? 0;
  const staleCount = coverage?.stale_count ?? 0;
  const blockedCount = coverage?.blocked_count ?? 0;
  const partialCount = coverage?.partial_count ?? 0;

  return (
    <>
      <div className="flex flex-col gap-4 p-5 min-w-0">
        {/* Header row: title + quick actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2
              className={clsx(
                "w-4 h-4 shrink-0",
                coveragePct >= 80
                  ? "text-emerald-500"
                  : coveragePct >= 50
                    ? "text-amber-500"
                    : "text-red-400",
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)] truncate">
                {bom.name}
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {slots.length} slots &middot; {bom.status}
              </p>
            </div>
          </div>
          <QuickActions
            onApplyTemplate={() => {
              /* navigate to template wizard */
            }}
            onExport={() => {
              const blob = new Blob([JSON.stringify(bom, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `bom-${projectId}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
        </div>

        {/* KPI row */}
        <KpiRow
          coveragePct={coveragePct}
          required={requiredSlots}
          requiredComplete={requiredComplete}
          missing={missingSlots}
          stale={staleCount}
          blocked={blockedCount}
          partial={partialCount}
          total={slots.length}
        />

        {/* Template sources */}
        {bom.source_templates && bom.source_templates.length > 0 && (
          <TemplateSources templateIds={bom.source_templates} />
        )}

        {/* Domain tabs */}
        {domains.length > 1 && (
          <DomainTabs
            domains={domains}
            active={activeDomain}
            onChange={setActiveDomain}
            slotCounts={slotCounts}
          />
        )}

        {/* Domain coverage sub-scores */}
        {coverage?.by_domain && coverage.by_domain.length > 1 && activeDomain === ALL_DOMAIN && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {coverage.by_domain.map((d) => (
              <button
                key={d.domain}
                type="button"
                onClick={() => setActiveDomain(d.domain)}
                className={clsx(
                  "text-left rounded-lg border border-[var(--border)] bg-white p-2.5",
                  "hover:border-blue-300 hover:shadow-card-hover transition-all duration-[150ms]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                )}
                aria-label={`Filter by ${d.domain} domain — ${d.coverage_pct}% coverage`}
              >
                <p className="text-[11px] font-semibold text-[var(--ink)] capitalize truncate">
                  {d.domain}
                </p>
                <CoverageBar
                  pct={d.coverage_pct}
                  showLabel
                  size="xs"
                  className="mt-1.5"
                />
                <p className="text-[10px] text-[var(--ink-faint)] mt-0.5">
                  {d.filled}/{d.total} filled
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Slot grid */}
        <section aria-label="BOM slot grid">
          {filteredSlots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
              <p className="text-sm text-[var(--ink-muted)]">
                No slots in this domain.
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(160px, 1fr))",
              }}
            >
              {filteredSlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onOpen={handleSlotOpen}
                />
              ))}
            </div>
          )}
        </section>

        {/* Legend */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <SlotLegend />
          <p className="text-[10px] text-[var(--ink-faint)] shrink-0">
            Required score = complete / active required
          </p>
        </div>
      </div>

      {/* EntityModal — slot detail (P2b, flag:ui-tabbed-modal ON) */}
      {useEntityModalFlag && modalIsOpen && (
        <EntityModal
          entityType="bom-slot"
          entityId={modalItemId ?? undefined}
          projectId={projectId}
          tabRegistry={SLOT_TAB_REGISTRY}
          onClose={modalClose}
          title={
            (bom?.slots ?? []).find((s) => s.id === modalItemId)?.name
          }
        />
      )}

      {/* Legacy bespoke SlotDetailPanel (flag OFF fallback) */}
      {!useEntityModalFlag && selectedSlot && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-30 bg-black/10"
            onClick={() => setSelectedSlot(null)}
          />
          <SlotDetailPanel
            slot={selectedSlot}
            onClose={() => setSelectedSlot(null)}
          />
        </>
      )}
    </>
  );
}
