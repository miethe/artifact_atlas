"use client";

/**
 * ContextPacksView — main page client component.
 * Shows pack list with status filter, and opens builder as a right drawer.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Plus, Package, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { RightDrawer } from "@/components/shell/RightDrawer";
import { ContextPackBuilder } from "./ContextPackBuilder";
import { PackCard, PackCardSkeleton } from "./components/PackCard";
import { useContextPacks } from "./hooks";
import type { ContextPack, ContextPackStatus } from "@/lib/types";

// ============================================================
// Status filter tabs
// ============================================================

const STATUS_FILTERS: Array<{
  value: ContextPackStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "ready", label: "Ready" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

// ============================================================
// ContextPacksView
// ============================================================

interface ContextPacksViewProps {
  projectId: string;
}

export function ContextPacksView({ projectId }: ContextPacksViewProps) {
  const [builderOpen, setBuilderOpen] = React.useState(false);
  const [selectedPack, setSelectedPack] = React.useState<ContextPack | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<ContextPackStatus | "all">("all");
  const [query, setQuery] = React.useState("");

  const { data: packs = [], isLoading, refetch, isFetching } = useContextPacks(projectId);

  const filtered = React.useMemo(() => {
    let result = packs;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [packs, statusFilter, query]);

  function handleCreated(packId: string) {
    // Pack created — keep builder open so user can continue editing
    void refetch();
    console.info("Context pack created:", packId);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        {/* Status filter tabs */}
        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex items-center gap-0.5"
        >
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value;
            const count =
              f.value === "all"
                ? packs.length
                : packs.filter((p) => p.status === f.value).length;
            return (
              <button
                key={f.value}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={clsx(
                  "h-7 px-2.5 rounded text-[11px] font-medium",
                  "transition-colors duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
                )}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className={clsx(
                      "ml-1 rounded-full px-1 text-[10px]",
                      active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs ml-2">
          <Search
            aria-hidden
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-faint)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search packs..."
            aria-label="Search context packs"
            className={clsx(
              "w-full h-7 pl-8 pr-3 rounded border border-[var(--border)] text-xs",
              "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-faint)]",
              "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
              "transition-colors duration-100",
            )}
          />
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Refresh packs"
          className={clsx(
            "p-1.5 rounded text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
            "transition-colors duration-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          <RefreshCw
            className={clsx("w-3.5 h-3.5", isFetching && "animate-spin")}
            aria-hidden
          />
        </button>

        <div className="flex-1" />

        {/* New pack CTA */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedPack(null);
            setBuilderOpen(true);
          }}
          iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
          aria-label="Create context pack"
        >
          New pack
        </Button>
      </div>

      {/* Pack grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <PackCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <Package
                aria-hidden
                className="w-10 h-10 text-[var(--ink-faint)]"
              />
            }
            title={
              query || statusFilter !== "all"
                ? "No packs match your filters"
                : "No context packs yet"
            }
            description={
              query || statusFilter !== "all"
                ? "Try adjusting the search or status filter."
                : "Build your first context pack to give agents scoped access to your project's assets and BOM context."
            }
            action={
              statusFilter === "all" && !query ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setBuilderOpen(true)}
                  iconLeft={<Plus className="w-3.5 h-3.5" aria-hidden />}
                >
                  Create first pack
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div
            role="list"
            aria-label="Context packs"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filtered.map((pack) => (
              <div key={pack.id} role="listitem">
                <PackCard
                  pack={pack}
                  selected={selectedPack?.id === pack.id}
                  onClick={() =>
                    setSelectedPack(
                      selectedPack?.id === pack.id ? null : pack,
                    )
                  }
                  onOpen={() => {
                    setSelectedPack(pack);
                    setBuilderOpen(true);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pack count footer */}
      {!isLoading && packs.length > 0 && (
        <div className="px-4 py-1.5 border-t border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--ink-faint)] shrink-0">
          {filtered.length === packs.length
            ? `${packs.length} pack${packs.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${packs.length} packs`}
        </div>
      )}

      {/* Builder drawer */}
      <RightDrawer
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title={selectedPack ? `Edit: ${selectedPack.name}` : "Create context pack"}
        width="lg"
        overlay
      >
        <ContextPackBuilder
          projectId={projectId}
          onClose={() => setBuilderOpen(false)}
          onCreated={handleCreated}
        />
      </RightDrawer>
    </div>
  );
}
