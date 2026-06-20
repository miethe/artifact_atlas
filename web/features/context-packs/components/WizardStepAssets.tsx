"use client";

/**
 * WizardStep 2 — Choose assets + include mode per item.
 * Assets can be included as metadata / preview / summary / full / link_only
 * subject to policy (sensitive assets are flagged).
 */

import * as React from "react";
import { clsx } from "clsx";
import { Plus, X, Search, ShieldAlert, Info } from "lucide-react";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import type { Asset, IncludeMode } from "@/lib/types";
import type { BuilderDraft, BuilderItem } from "../types";
import { useProjectAssets } from "../hooks";

// ============================================================
// Include mode options (ordered by token cost)
// ============================================================

const INCLUDE_MODES: Array<{
  value: IncludeMode;
  label: string;
  tokens: string;
  description: string;
}> = [
  { value: "link_only", label: "Link only", tokens: "~30", description: "Asset URI reference only" },
  { value: "metadata", label: "Metadata", tokens: "~120", description: "Title, type, status, sensitivity" },
  { value: "preview", label: "Preview", tokens: "~400", description: "Metadata + short excerpt" },
  { value: "summary", label: "Summary", tokens: "~800", description: "Metadata + AI-generated summary" },
  { value: "full", label: "Full", tokens: "~2500", description: "Complete content (policy permitting)" },
];

// ============================================================
// IncludeModeSelect
// ============================================================

interface IncludeModeSelectProps {
  value: IncludeMode;
  onChange: (mode: IncludeMode) => void;
  disabled?: boolean;
  disabledModes?: IncludeMode[];
}

function IncludeModeSelect({
  value,
  onChange,
  disabled,
  disabledModes = [],
}: IncludeModeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IncludeMode)}
      disabled={disabled}
      aria-label="Include mode"
      className={clsx(
        "h-7 rounded border border-[var(--border)] px-2 text-[11px] bg-[var(--surface)]",
        "focus-visible:outline-none focus-visible:border-[var(--border-focus)]",
        "transition-colors duration-100",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {INCLUDE_MODES.map((m) => (
        <option
          key={m.value}
          value={m.value}
          disabled={disabledModes.includes(m.value)}
        >
          {m.label} ({m.tokens} tok)
        </option>
      ))}
    </select>
  );
}

// ============================================================
// AssetRow — selected item
// ============================================================

interface AssetRowProps {
  item: BuilderItem;
  onModeChange: (mode: IncludeMode) => void;
  onRemove: () => void;
}

function AssetRow({ item, onModeChange, onRemove }: AssetRowProps) {
  const isSensitive = ["client_sensitive", "restricted"].includes(
    item.sensitivity ?? "",
  );

  return (
    <div
      className={clsx(
        "flex items-center gap-2 rounded border px-3 py-2",
        isSensitive
          ? "border-amber-200 bg-amber-50"
          : "border-[var(--border)] bg-[var(--surface)]",
      )}
    >
      {/* Sensitivity warning */}
      {isSensitive && (
        <ShieldAlert
          aria-label="Sensitive asset — review required before publish"
          className="w-3.5 h-3.5 text-amber-600 shrink-0"
        />
      )}

      {/* Label */}
      <span className="flex-1 text-xs text-[var(--ink)] truncate min-w-0">
        {item.label}
      </span>

      {/* Sensitivity badge */}
      {item.sensitivity && (
        <SensitivityBadge
          sensitivity={item.sensitivity}
          size="xs"
          showIcon={false}
        />
      )}

      {/* Include mode */}
      <IncludeModeSelect
        value={item.include_mode}
        onChange={onModeChange}
        // Block full/summary/preview for client_sensitive/restricted
        disabledModes={
          isSensitive ? ["full", "summary", "preview"] : []
        }
      />

      {/* Remove */}
      <button
        type="button"
        aria-label={`Remove ${item.label}`}
        onClick={onRemove}
        className={clsx(
          "shrink-0 p-1 rounded",
          "text-[var(--ink-faint)] hover:text-red-600 hover:bg-red-50",
          "transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
        )}
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}

// ============================================================
// WizardStepAssets
// ============================================================

interface WizardStepAssetsProps {
  projectId: string;
  draft: BuilderDraft;
  onChange: (patch: Partial<BuilderDraft>) => void;
}

export function WizardStepAssets({
  projectId,
  draft,
  onChange,
}: WizardStepAssetsProps) {
  const { data: assets = [], isLoading } = useProjectAssets(projectId);
  const [query, setQuery] = React.useState("");

  const selectedIds = new Set(draft.items.map((i) => i.item_id));

  const filtered = React.useMemo(() => {
    if (!query.trim()) return assets;
    const q = query.toLowerCase();
    return assets.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.source_kind.toLowerCase().includes(q),
    );
  }, [assets, query]);

  function addAsset(asset: Asset) {
    const item: BuilderItem = {
      key: `asset-${asset.id}`,
      item_type: "asset",
      item_id: asset.id,
      label: asset.title,
      include_mode: "metadata",
      required: false,
      display_order: draft.items.length,
      sensitivity: asset.sensitivity,
      needs_review: ["client_sensitive", "restricted"].includes(asset.sensitivity),
    };
    onChange({ items: [...draft.items, item] });
  }

  function removeItem(key: string) {
    onChange({
      items: draft.items
        .filter((i) => i.key !== key)
        .map((i, idx) => ({ ...i, display_order: idx })),
    });
  }

  function updateItemMode(key: string, mode: IncludeMode) {
    onChange({
      items: draft.items.map((i) =>
        i.key === key ? { ...i, include_mode: mode } : i,
      ),
    });
  }

  const sensitiveCount = draft.items.filter((i) => i.needs_review).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Selected items */}
      <section aria-label="Selected items">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-[var(--ink)]">
            Included items{" "}
            <span className="text-[var(--ink-muted)]">
              ({draft.items.length})
            </span>
          </h3>
          {sensitiveCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
              <ShieldAlert className="w-3 h-3" aria-hidden />
              {sensitiveCount} needs review
            </span>
          )}
        </div>

        {draft.items.length === 0 ? (
          <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] p-4 text-center text-xs text-[var(--ink-muted)]">
            No items added yet. Search and add assets below.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {draft.items.map((item) => (
              <AssetRow
                key={item.key}
                item={item}
                onModeChange={(mode) => updateItemMode(item.key, mode)}
                onRemove={() => removeItem(item.key)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Include-mode legend */}
      <details className="group">
        <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--ink-muted)] list-none select-none">
          <Info className="w-3 h-3" aria-hidden />
          Include mode reference
        </summary>
        <div className="mt-2 rounded border border-[var(--border)] bg-[var(--surface-sunken)] overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="px-3 py-1.5 text-left font-medium text-[var(--ink)]">Mode</th>
                <th className="px-3 py-1.5 text-left font-medium text-[var(--ink)]">Tokens</th>
                <th className="px-3 py-1.5 text-left font-medium text-[var(--ink)]">Content</th>
              </tr>
            </thead>
            <tbody>
              {INCLUDE_MODES.map((m, i) => (
                <tr
                  key={m.value}
                  className={clsx(
                    "border-b border-[var(--border)] last:border-0",
                    i % 2 === 1 && "bg-[var(--surface-sunken)]",
                  )}
                >
                  <td className="px-3 py-1.5 font-mono text-[var(--ink)]">{m.label}</td>
                  <td className="px-3 py-1.5 text-[var(--ink-muted)]">{m.tokens}</td>
                  <td className="px-3 py-1.5 text-[var(--ink-muted)]">{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Asset search */}
      <section aria-label="Add assets">
        <h3 className="text-xs font-medium text-[var(--ink)] mb-2">
          Add assets from project
        </h3>

        {/* Search input */}
        <div className="relative mb-3">
          <Search
            aria-hidden
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-faint)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets by title or status..."
            aria-label="Search assets"
            className={clsx(
              "w-full h-8 pl-8 pr-3 rounded border border-[var(--border)] text-xs",
              "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-faint)]",
              "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
              "transition-colors duration-100",
            )}
          />
        </div>

        {/* Asset list */}
        {isLoading ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 rounded border border-[var(--border)] bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)] text-center py-4">
            {query ? "No assets match your search." : "No assets in project."}
          </p>
        ) : (
          <div
            className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1"
            role="list"
            aria-label="Available assets"
          >
            {filtered.map((asset) => {
              const isSelected = selectedIds.has(asset.id);
              const isSensitive = ["client_sensitive", "restricted"].includes(
                asset.sensitivity,
              );
              return (
                <div
                  key={asset.id}
                  role="listitem"
                  className={clsx(
                    "flex items-center gap-2 rounded border px-3 py-1.5",
                    "transition-colors duration-100",
                    isSelected
                      ? "border-[var(--blue-200)] bg-[var(--blue-50)]"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
                  )}
                >
                  <span className="flex-1 text-xs text-[var(--ink)] truncate min-w-0">
                    {asset.title}
                  </span>

                  <SensitivityBadge
                    sensitivity={asset.sensitivity}
                    size="xs"
                    showIcon={false}
                  />

                  {isSensitive && (
                    <ShieldAlert
                      aria-label="Sensitive"
                      className="w-3 h-3 text-amber-500 shrink-0"
                    />
                  )}

                  <button
                    type="button"
                    disabled={isSelected}
                    aria-label={isSelected ? `${asset.title} already added` : `Add ${asset.title}`}
                    onClick={() => addAsset(asset)}
                    className={clsx(
                      "shrink-0 h-6 w-6 flex items-center justify-center rounded",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      isSelected
                        ? "text-[var(--ink-faint)] cursor-default"
                        : "text-[var(--blue-600)] hover:bg-blue-50",
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
