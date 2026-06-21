"use client";

/**
 * TemplateLibrary — BOM-UI-001
 * Filterable template list + right preview inspector.
 * Left panel: search/filter + template cards.
 * Right panel: TemplatePreviewPanel (legacy) OR EntityModal (P2b flag).
 *
 * P2b: When flag:ui-tabbed-modal (or flag:ui-tabbed-modal-template) is on, the
 * persistent right aside (TemplatePreviewPanel) is replaced by EntityModal
 * triggered by template selection. The template list fills the full width.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Search, X, Plus, Wrench, LayoutTemplate } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { isFlagEnabled } from "@/lib/flags";
import { useTemplates } from "./hooks";
import { TemplateCard } from "./components/TemplateCard";
import { TemplatePreviewPanel } from "./components/TemplatePreviewPanel";
import type { ArtifactTemplate, TemplateLibraryFilters } from "./types";
import type { TemplateStatus, TemplateType } from "@/lib/types";
import { EntityModal, useEntityModalUrl } from "@/features/ui/components/EntityModal";
import { TEMPLATE_TAB_REGISTRY } from "./components/EntityModal/TemplateTabRegistry";

// ============================================================
// Props
// ============================================================

export interface TemplateLibraryProps {
  projectId: string;
  onApplyTemplate?: (template: ArtifactTemplate) => void;
  onOpenBuilder?: () => void;
  className?: string;
}

// ============================================================
// Filter helpers
// ============================================================

const STATUS_OPTIONS: Array<{ value: TemplateStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "core", label: "Core" },
  { value: "recommended", label: "Recommended" },
  { value: "optional", label: "Optional" },
  { value: "experimental", label: "Experimental" },
];

const TYPE_OPTIONS: Array<{ value: TemplateType | "all"; label: string }> = [
  { value: "all", label: "All types" },
  { value: "product", label: "Product" },
  { value: "architecture", label: "Architecture" },
  { value: "research", label: "Research" },
  { value: "gtm", label: "GTM" },
  { value: "design_system", label: "Design System" },
  { value: "platform_capability", label: "Platform" },
  { value: "client_proposal", label: "Client Proposal" },
  { value: "custom", label: "Custom" },
];

function filterTemplates(
  templates: ArtifactTemplate[],
  filters: TemplateLibraryFilters,
): ArtifactTemplate[] {
  return templates.filter((t) => {
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const inName = t.name.toLowerCase().includes(q);
      const inDesc = t.description?.toLowerCase().includes(q) ?? false;
      const inDomain = t.domains.some((d) => d.name.toLowerCase().includes(q));
      const inSlot = t.domains
        .flatMap((d) => d.slots)
        .some((s) => s.artifact_type.toLowerCase().includes(q));
      if (!inName && !inDesc && !inDomain && !inSlot) return false;
    }
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (
      filters.type !== "all" &&
      (t.template_type ?? "custom") !== filters.type
    )
      return false;
    if (
      filters.domainFilter &&
      !t.domains.some((d) =>
        d.name.toLowerCase().includes(filters.domainFilter.toLowerCase()),
      )
    )
      return false;
    return true;
  });
}

// ============================================================
// Component
// ============================================================

export function TemplateLibrary({
  projectId,
  onApplyTemplate,
  onOpenBuilder,
  className,
}: TemplateLibraryProps) {
  const { data: templatesRaw, isLoading } = useTemplates();
  const templates: ArtifactTemplate[] = (templatesRaw ?? []) as ArtifactTemplate[];

  // Feature flag: EntityModal (P2b) vs legacy persistent aside.
  const useEntityModalFlag =
    isFlagEnabled("ui-tabbed-modal") || isFlagEnabled("ui-tabbed-modal-template");

  const [filters, setFilters] = React.useState<TemplateLibraryFilters>({
    q: "",
    status: "all",
    type: "all",
    domainFilter: "",
  });
  // Local selected ID for the legacy aside / Apply button.
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // EntityModal URL state (always called per hook rules).
  const { isOpen: modalIsOpen, itemId: modalItemId, open: modalOpen, close: modalClose } =
    useEntityModalUrl(TEMPLATE_TAB_REGISTRY);

  const filtered = React.useMemo(
    () => filterTemplates(templates, filters),
    [templates, filters],
  );

  const selected = React.useMemo(
    () => filtered.find((t) => t.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  // Auto-select first when filter changes and nothing matches
  React.useEffect(() => {
    if (selectedId && !filtered.find((t) => t.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    } else if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const handleClearFilters = () => {
    setFilters({ q: "", status: "all", type: "all", domainFilter: "" });
  };

  const hasFilters =
    filters.q !== "" ||
    filters.status !== "all" ||
    filters.type !== "all" ||
    filters.domainFilter !== "";

  return (
    <div
      className={clsx(
        "flex flex-col h-full bg-[var(--surface)]",
        className,
      )}
      aria-label="Template library"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-faint)]"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search templates, domains, slot types…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            className={clsx(
              "w-full h-7 pl-8 pr-3 text-xs rounded border border-[var(--border)]",
              "bg-[var(--surface-sunken)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-[var(--border-focus)]",
            )}
            aria-label="Search templates"
          />
          {filters.q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setFilters((f) => ({ ...f, q: "" }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] hover:text-[var(--ink)]"
            >
              <X className="w-3 h-3" aria-hidden />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value as TemplateStatus | "all",
            }))
          }
          aria-label="Filter by status"
          className={clsx(
            "h-7 px-2 text-xs rounded border border-[var(--border)]",
            "bg-[var(--surface-sunken)] text-[var(--ink)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]",
          )}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              type: e.target.value as TemplateType | "all",
            }))
          }
          aria-label="Filter by type"
          className={clsx(
            "h-7 px-2 text-xs rounded border border-[var(--border)]",
            "bg-[var(--surface-sunken)] text-[var(--ink)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]",
          )}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[10px] text-blue-600 hover:text-blue-700 whitespace-nowrap"
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        )}

        <div className="flex-1" />

        {/* Builder button */}
        {onOpenBuilder && (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Wrench className="w-3.5 h-3.5" aria-hidden />}
            onClick={onOpenBuilder}
          >
            Builder
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
          onClick={() => selected && onApplyTemplate?.(selected)}
          disabled={!selected}
        >
          Apply Template
        </Button>
      </div>

      {/* Body: list + preview */}
      <div className="flex flex-1 min-h-0">
        {/* Left: template list */}
        <div
          className={clsx(
            "flex flex-col overflow-hidden",
            useEntityModalFlag
              ? "flex-1"
              : "w-[340px] shrink-0 border-r border-[var(--border)]",
          )}
          role="listbox"
          aria-label="Templates"
          aria-multiselectable={false}
        >
          {/* Count */}
          <div className="px-4 py-2 text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                {filtered.length} template{filtered.length !== 1 ? "s" : ""}
                {hasFilters && " matching filters"}
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={
                  hasFilters
                    ? <Search className="w-8 h-8" aria-hidden />
                    : <LayoutTemplate className="w-8 h-8" aria-hidden />
                }
                title="No templates found"
                description={
                  hasFilters
                    ? "Try clearing filters or broadening your search."
                    : "No templates available."
                }
                className="py-12"
              />
            ) : (
              <div className="p-3 space-y-1.5">
                {filtered.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    selected={t.id === selectedId}
                    onClick={() => {
                      // Keep selectedId for the Apply button; open the modal when
                      // the P2b flag is on, else fall back to the legacy aside.
                      setSelectedId(t.id);
                      if (useEntityModalFlag) modalOpen(t.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: preview inspector (legacy persistent aside — flag OFF) */}
        {!useEntityModalFlag && (
          <TemplatePreviewPanel
            template={selected}
            showApplyButton={!!onApplyTemplate}
            onApply={() => selected && onApplyTemplate?.(selected)}
            className="flex-1"
          />
        )}
      </div>

      {/* EntityModal — template detail (P2b, flag:ui-tabbed-modal ON) */}
      {useEntityModalFlag && modalIsOpen && (
        <EntityModal
          entityType="template"
          entityId={modalItemId ?? undefined}
          projectId={projectId}
          tabRegistry={TEMPLATE_TAB_REGISTRY}
          onClose={modalClose}
          title={filtered.find((t) => t.id === modalItemId)?.name}
        />
      )}
    </div>
  );
}
