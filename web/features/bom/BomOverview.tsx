"use client";

/**
 * BomOverview — Artifact BOM tab (WS-5 mockup fidelity rebuild).
 *
 * Layout per artifact_bom_project_dashboard_interface.png:
 * - Header actions: Apply Template, Add Domain Template, Export, Refresh.
 * - Stat cards: Total Expected Types / Filled / Missing / Coverage % / Active Templates.
 * - Domain tab chips (All Domains + per-domain), Group-by Domain|Phase,
 *   grid/list toggle, expand-to-fullscreen (local FullscreenPane).
 * - Per-domain sections: filled SlotCards + dashed MissingSlotCards
 *   ("Drop asset here" → asset picker → POST /api/bom/slots/{slotId}/assign).
 * - Right rail: Quick Actions, Template Sources, Insights, Legend.
 *
 * Slot detail: EntityModal when flag:ui-tabbed-modal(-bom) is on; legacy
 * inline panel otherwise (unchanged behavior).
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  LayoutTemplate,
  Download,
  RefreshCw,
  Package,
  Maximize2,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";
import { useBom } from "@/lib/hooks/useBom";
import { isFlagEnabled } from "@/lib/flags";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { BomSlot } from "@/lib/types";
import { useTemplates } from "@/features/templates/hooks";
import { SlotCardSkeleton } from "./components/SlotCard";
import { useBomCoverageExtended } from "./hooks/useBomCoverage";
import { EntityModal, useEntityModalUrl } from "@/features/ui/components/EntityModal";
import { SLOT_TAB_REGISTRY } from "./components/EntityModal/SlotTabRegistry";
import { BomStatCards } from "./components/BomStatCards";
import { DomainSection } from "./components/DomainSection";
import { AssetPickerDialog } from "./components/AssetPickerDialog";
import { ApplyTemplateDialog } from "./components/ApplyTemplateDialog";
import { BomRightRail } from "./components/BomRightRail";
import type { TemplateSourceInfo } from "./components/BomRightRail";
import { FullscreenPane } from "./components/FullscreenPane";
import { getDomainIcon, humanizeTypeId, slotDisplayName } from "./components/domainMeta";

// ============================================================
// Constants / helpers
// ============================================================

const ALL_DOMAIN = "__all__";
const GAP_STATUSES = new Set(["missing", "partial", "stale", "blocked"]);
const PHASE_ORDER = ["discovery", "design", "build", "launch", "operate", "review"];

function getDomains(slots: BomSlot[]): string[] {
  const seen = new Set<string>();
  for (const s of slots) seen.add(s.domain ?? "uncategorized");
  return Array.from(seen).sort();
}

// ============================================================
// Domain tab chips (pill style per mockup)
// ============================================================

interface DomainChipsProps {
  domains: string[];
  active: string;
  onChange: (domain: string) => void;
  slotCounts: Record<string, number>;
}

function DomainChips({ domains, active, onChange, slotCounts }: DomainChipsProps) {
  const chipCls = (selected: boolean) =>
    clsx(
      "shrink-0 inline-flex items-center gap-1.5 px-3 h-7 rounded-full border text-xs font-medium",
      "transition-colors duration-[100ms]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      selected
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--border-strong)]",
    );

  return (
    <nav
      aria-label="Domain filter"
      className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === ALL_DOMAIN}
        onClick={() => onChange(ALL_DOMAIN)}
        className={chipCls(active === ALL_DOMAIN)}
      >
        All Domains
        <span className="text-[10px] opacity-70">({slotCounts[ALL_DOMAIN] ?? 0})</span>
      </button>
      {domains.map((d) => (
        <button
          key={d}
          type="button"
          role="tab"
          aria-selected={active === d}
          onClick={() => onChange(d)}
          className={clsx(chipCls(active === d), "capitalize")}
        >
          {getDomainIcon(d, "w-3 h-3")}
          {d}
          <span className="text-[10px] opacity-70">({slotCounts[d] ?? 0})</span>
        </button>
      ))}
    </nav>
  );
}

// ============================================================
// Legacy slot detail panel (flag-off fallback, unchanged)
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
      aria-label={`Slot detail: ${slotDisplayName(slot)}`}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">
            BOM Slot
          </p>
          <h2 className="text-sm font-semibold text-[var(--ink)] leading-tight mt-0.5 truncate">
            {slotDisplayName(slot)}
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
  const slots = React.useMemo(() => bom?.slots ?? [], [bom]);

  const { data: coverage } = useBomCoverageExtended(bom?.id, slots);
  const { data: templates } = useTemplates();

  // Feature flag: use EntityModal (P2b) vs legacy inline panel.
  const useEntityModalFlag =
    isFlagEnabled("ui-tabbed-modal") || isFlagEnabled("ui-tabbed-modal-bom");

  // View state
  const [activeDomain, setActiveDomain] = React.useState<string>(ALL_DOMAIN);
  const [groupBy, setGroupBy] = React.useState<"domain" | "phase">("domain");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [gapsOnly, setGapsOnly] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [pickerSlot, setPickerSlot] = React.useState<BomSlot | null>(null);
  const [applyOpen, setApplyOpen] = React.useState(false);

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
      counts[d] = slots.filter((s) => (s.domain ?? "uncategorized") === d).length;
    }
    return counts;
  }, [slots, domains]);

  const visibleSlots = React.useMemo(() => {
    let out = slots;
    if (activeDomain !== ALL_DOMAIN) {
      out = out.filter((s) => (s.domain ?? "uncategorized") === activeDomain);
    }
    if (gapsOnly) {
      out = out.filter((s) => GAP_STATUSES.has(s.status));
    }
    return out;
  }, [slots, activeDomain, gapsOnly]);

  /** Sections: [title, slots] grouped by domain or phase. */
  const sections = React.useMemo((): Array<[string, BomSlot[]]> => {
    if (groupBy === "phase") {
      const map = new Map<string, BomSlot[]>();
      for (const s of visibleSlots) {
        const p = s.phase ?? "unphased";
        if (!map.has(p)) map.set(p, []);
        map.get(p)!.push(s);
      }
      return Array.from(map.entries()).sort(
        (a, b) =>
          (PHASE_ORDER.indexOf(a[0]) + 100 * Number(PHASE_ORDER.indexOf(a[0]) < 0)) -
          (PHASE_ORDER.indexOf(b[0]) + 100 * Number(PHASE_ORDER.indexOf(b[0]) < 0)),
      );
    }
    const map = new Map<string, BomSlot[]>();
    for (const s of visibleSlots) {
      const d = s.domain ?? "uncategorized";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleSlots, groupBy]);

  // Template sources (right rail): resolve applied template IDs to names + counts.
  const templateSources = React.useMemo((): TemplateSourceInfo[] => {
    const ids = bom?.source_templates ?? [];
    return ids.map((id) => {
      const t = (templates ?? []).find((tt) => tt.id === id);
      const expected = t
        ? t.domains.reduce((acc, d) => acc + d.slots.length, 0)
        : null;
      return {
        id,
        name:
          t?.name ??
          humanizeTypeId(id.replace(/^tmpl_/, "").replace(/_v\d+$/, "")),
        expectedTypes: expected && expected > 0 ? expected : null,
        active: true,
      };
    });
  }, [bom, templates]);

  const missingByDomain = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of slots) {
      if (s.status !== "missing") continue;
      const d = s.domain ?? "uncategorized";
      out[d] = (out[d] ?? 0) + 1;
    }
    return out;
  }, [slots]);

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>
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
              onClick={() => setApplyOpen(true)}
            >
              Apply template
            </Button>
          }
        />
        <ApplyTemplateDialog
          projectId={projectId}
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
        />
      </div>
    );
  }

  const coveragePct = coverage?.coverage_pct ?? 0;
  const filledSlots = coverage?.filled_slots ?? 0;
  const missingSlots = coverage?.missing_slots ?? 0;

  const content = (
    <div className="flex flex-col lg:flex-row items-start gap-5 p-5 min-w-0">
      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">
        {/* Header row: bom name + actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)] truncate">
              {bom.name}
            </p>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Visually track required artifacts and coverage for this project
              based on selected templates.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<LayoutTemplate className="w-3.5 h-3.5" aria-hidden />}
              onClick={() => setApplyOpen(true)}
            >
              Apply Template
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
              onClick={() => setApplyOpen(true)}
            >
              Add Domain Template
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Export BOM as JSON"
              iconLeft={<Download className="w-3.5 h-3.5" aria-hidden />}
              onClick={() => {
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
            />
            <Button
              variant="ghost"
              size="sm"
              iconLeft={
                <RefreshCw
                  className={clsx("w-3.5 h-3.5", isFetching && "animate-spin")}
                  aria-hidden
                />
              }
              aria-label="Refresh BOM data"
              loading={isFetching}
              onClick={() => refetch()}
            />
          </div>
        </div>

        {/* Stat cards */}
        <BomStatCards
          totalExpected={slots.length}
          domainCount={domains.length}
          filled={filledSlots}
          missing={missingSlots}
          coveragePct={coveragePct}
          activeTemplates={templateSources.length}
          templateNames={templateSources.map((t) => t.name)}
        />

        {/* Controls row: domain chips + group-by + view toggle + fullscreen */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <DomainChips
              domains={domains}
              active={activeDomain}
              onChange={setActiveDomain}
              slotCounts={slotCounts}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
              Group by:
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as "domain" | "phase")}
                aria-label="Group slots by"
                className={clsx(
                  "h-7 px-2 text-xs rounded border border-[var(--border)]",
                  "bg-[var(--surface)] text-[var(--ink)]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                )}
              >
                <option value="domain">Domain</option>
                <option value="phase">Phase</option>
              </select>
            </label>
            <SegmentedControl
              value={viewMode}
              onChange={(v) => setViewMode(v)}
              size="xs"
              iconOnly
              label="View mode"
              options={[
                {
                  value: "grid",
                  label: "Grid",
                  ariaLabel: "Grid view",
                  icon: <LayoutGrid className="w-3.5 h-3.5" aria-hidden />,
                },
                {
                  value: "list",
                  label: "List",
                  ariaLabel: "List view",
                  icon: <List className="w-3.5 h-3.5" aria-hidden />,
                },
              ]}
            />
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="Expand to fullscreen"
              className="flex items-center justify-center w-7 h-7 rounded border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Gaps-only banner */}
        {gapsOnly && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Showing gap slots only (missing, partial, stale, blocked).
            </p>
            <button
              type="button"
              onClick={() => setGapsOnly(false)}
              className="text-xs font-medium text-amber-800 dark:text-amber-200 underline"
            >
              Show all
            </button>
          </div>
        )}

        {/* Sections */}
        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center">
            <p className="text-sm text-[var(--ink-muted)]">
              No slots match the current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map(([title, sectionSlots]) => (
              <DomainSection
                key={title}
                title={title}
                slots={sectionSlots}
                viewMode={viewMode}
                onOpenSlot={handleSlotOpen}
                onFillSlot={setPickerSlot}
                isPhaseSection={groupBy === "phase"}
                onViewDetails={
                  groupBy === "domain" && activeDomain === ALL_DOMAIN
                    ? () => setActiveDomain(title)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Right rail */}
      <BomRightRail
        projectId={projectId}
        gapsOnly={gapsOnly}
        onToggleGaps={() => setGapsOnly((v) => !v)}
        templateSources={templateSources}
        byDomain={coverage?.by_domain ?? []}
        missingByDomain={missingByDomain}
      />

      {/*
        Dialogs/overlays are rendered INSIDE the content passed to
        FullscreenPane so that in fullscreen mode they travel with the portal
        and paint within (above) the fixed z-50 overlay's stacking context.
        In normal mode they are fixed-position, so DOM placement is
        irrelevant. Do NOT move these out to siblings of FullscreenPane —
        the fullscreen overlay would paint on top of them and make them
        unreachable (Mode-E integration finding, WS-5).
      */}

      {/* Asset picker for missing slots */}
      <AssetPickerDialog
        projectId={projectId}
        slot={pickerSlot}
        onClose={() => setPickerSlot(null)}
      />

      {/* Apply template */}
      <ApplyTemplateDialog
        projectId={projectId}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
      />

      {/* EntityModal — slot detail (P2b, flag:ui-tabbed-modal ON) */}
      {useEntityModalFlag && modalIsOpen && (
        <EntityModal
          entityType="bom-slot"
          entityId={modalItemId ?? undefined}
          projectId={projectId}
          tabRegistry={SLOT_TAB_REGISTRY}
          onClose={modalClose}
          title={(bom?.slots ?? []).find((s) => s.id === modalItemId)?.name}
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
    </div>
  );

  return (
    <FullscreenPane
      expanded={fullscreen}
      onExit={() => setFullscreen(false)}
      title={`Artifact BOM — ${bom.name}`}
    >
      {content}
    </FullscreenPane>
  );
}
