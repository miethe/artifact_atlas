"use client";

/**
 * CoverageView — Coverage & Gaps dashboard.
 * BOM-UI-006 — readiness score, coverage matrix, recommendations, quick actions, legend.
 * Gap → task creation is EXPLICIT and draft-only.
 *
 * P2b: When flag:ui-tabbed-modal (or flag:ui-tabbed-modal-coverage) is on, the
 * inline w-56 sidebar slot-detail panel is replaced by an EntityModal. The sidebar
 * column itself (with CoverageLegend) is retained; only the inline slot detail card
 * is removed from the flagged path.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Download,
  RefreshCw,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { isFlagEnabled } from "@/lib/flags";
import { ReadinessScore } from "./components/ReadinessScore";
import { CoverageMatrix } from "./components/CoverageMatrix";
import { GapsPanel } from "./components/GapsPanel";
import { CoverageLegend } from "./components/CoverageLegend";
import { useCoverageData } from "./hooks/useCoverageData";
import type { BomSlot } from "@/lib/types";
import { EntityModal, useEntityModalUrl } from "@/features/ui/components/EntityModal";
import { COVERAGE_SLOT_TAB_REGISTRY } from "./components/EntityModal/CoverageSlotTabRegistry";

// ============================================================
// View tab
// ============================================================

type ViewTab = "matrix" | "gaps";

// ============================================================
// CoverageView
// ============================================================

interface CoverageViewProps {
  projectId: string;
}

export function CoverageView({ projectId }: CoverageViewProps) {
  const { bom, coverage, gaps, isLoading, isError, refetch } =
    useCoverageData(projectId);

  // Feature flag: EntityModal (P2b) vs legacy inline sidebar slot-detail card.
  const useEntityModalFlag =
    isFlagEnabled("ui-tabbed-modal") || isFlagEnabled("ui-tabbed-modal-coverage");

  const [activeTab, setActiveTab] = React.useState<ViewTab>("matrix");
  const [criticalOnly, setCriticalOnly] = React.useState(false);
  // Legacy state (used when flag is off).
  const [selectedSlot, setSelectedSlot] = React.useState<BomSlot | null>(null);

  // EntityModal URL state (always called per hook rules).
  const { isOpen: modalIsOpen, itemId: modalItemId, open: modalOpen, close: modalClose } =
    useEntityModalUrl(COVERAGE_SLOT_TAB_REGISTRY);

  function handleSlotClick(slot: BomSlot) {
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

  // ---- Computed values ----
  const slots = bom?.slots ?? [];

  // Normalise: API returns 0–100 OR 0–1 depending on backend
  const normPct = React.useMemo(() => {
    const raw = coverage?.coverage_pct ?? (bom?.coverage_score ?? 0);
    return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  }, [coverage, bom]);

  const staleOrBlocked = React.useMemo(
    () => slots.filter((s) => s.status === "stale" || s.status === "blocked").length,
    [slots],
  );

  const filteredGaps = React.useMemo(
    () => (criticalOnly ? gaps.filter((g) => g.priority === "high") : gaps),
    [criticalOnly, gaps],
  );

  // ---- Loading / error ----
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (isError || !bom) {
    return (
      <div className="flex items-center justify-center p-12">
        <EmptyState
          title="Failed to load coverage data"
          description="Could not fetch BOM or coverage from the API."
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 h-full overflow-y-auto">
      {/* Header toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="text-xs text-[var(--ink-muted)]">
          Coverage for{" "}
          <span className="font-semibold text-[var(--ink)]">{bom.name}</span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="xs"
          iconLeft={<RefreshCw aria-hidden className="w-3 h-3" />}
          onClick={refetch}
          aria-label="Refresh coverage data"
        >
          Refresh
        </Button>
        <Button
          variant="secondary"
          size="xs"
          iconLeft={<Download aria-hidden className="w-3 h-3" />}
          aria-label="Export coverage report"
        >
          Export report
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-5 p-5">
        {/* Readiness score row */}
        <ReadinessScore
          score={normPct}
          totalSlots={coverage?.total_slots ?? slots.length}
          filledSlots={coverage?.filled_slots ?? slots.filter((s) => s.status === "complete").length}
          missingSlots={coverage?.missing_slots ?? slots.filter((s) => s.status === "missing" && s.required).length}
          optionalPending={slots.filter((s) => !s.required && s.status === "missing").length}
          staleOrBlocked={staleOrBlocked}
          recentlyCompleted={0}
        />

        {/* Tab bar + gap filter */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-0">
          {(["matrix", "gaps"] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "pb-2 text-sm font-medium border-b-2 transition-colors duration-100 capitalize",
                "focus-visible:outline-none",
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {tab === "matrix" ? "Coverage Matrix" : `Gaps (${gaps.length})`}
            </button>
          ))}
          <div className="flex-1" />
          {activeTab === "gaps" && (
            <button
              type="button"
              onClick={() => setCriticalOnly((v) => !v)}
              className={clsx(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                criticalOnly
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "border-[var(--border)] text-[var(--ink-muted)] hover:bg-gray-50",
              )}
              aria-pressed={criticalOnly}
            >
              <Filter aria-hidden className="w-3 h-3" />
              Critical only
            </button>
          )}
        </div>

        {/* Tab content */}
        <div className="flex gap-5">
          {/* Main panel */}
          <div className="flex-1 min-w-0">
            {activeTab === "matrix" ? (
              <CoverageMatrix
                slots={slots}
                onSlotClick={handleSlotClick}
              />
            ) : (
              <GapsPanel
                gaps={filteredGaps}
                onAssignAsset={(gap) => {
                  // Open slot detail via handleSlotClick (EntityModal or legacy)
                  const slot = slots.find((s) => s.id === gap.slotId);
                  if (slot) handleSlotClick(slot);
                }}
              />
            )}
          </div>

          {/* Sidebar: legend + legacy slot detail card (flag OFF only) */}
          <div className="w-56 shrink-0 flex flex-col gap-3">
            <CoverageLegend />

            {/* Legacy inline slot detail — removed when EntityModal flag is ON (P2b) */}
            {!useEntityModalFlag && selectedSlot && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-[var(--ink)]">
                    Slot Detail
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    aria-label="Close slot detail"
                    className="text-[var(--ink-faint)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs font-medium text-[var(--ink)]">
                  {selectedSlot.name}
                </p>
                <div className="flex flex-col gap-1 text-[10px] text-[var(--ink-muted)]">
                  <span>
                    Status:{" "}
                    <strong className="capitalize">{selectedSlot.status}</strong>
                  </span>
                  <span>
                    Required:{" "}
                    <strong>{selectedSlot.required ? "Yes" : "No"}</strong>
                  </span>
                  {selectedSlot.domain && (
                    <span>
                      Domain:{" "}
                      <strong className="capitalize">{selectedSlot.domain}</strong>
                    </span>
                  )}
                  {selectedSlot.phase && (
                    <span>
                      Phase:{" "}
                      <strong className="capitalize">{selectedSlot.phase}</strong>
                    </span>
                  )}
                  <span>
                    Assignments:{" "}
                    <strong>{selectedSlot.assignment_count}</strong>
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  fullWidth
                  iconRight={<ChevronRight aria-hidden className="w-3 h-3" />}
                >
                  Go to BOM slot
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EntityModal — coverage slot detail (P2b, flag:ui-tabbed-modal ON) */}
      {useEntityModalFlag && modalIsOpen && (
        <EntityModal
          entityType="coverage-slot"
          entityId={modalItemId ?? undefined}
          projectId={projectId}
          tabRegistry={COVERAGE_SLOT_TAB_REGISTRY}
          onClose={modalClose}
          title={
            (bom?.slots ?? []).find((s) => s.id === modalItemId)?.name
          }
        />
      )}
    </div>
  );
}
