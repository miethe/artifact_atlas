"use client";

/**
 * AssetPickerDialog — pick a project asset to fill a missing BOM slot (WS-5).
 *
 * Lists project assets (searchable) and assigns the chosen asset to the slot
 * via POST /api/bom/slots/{slotId}/assign (useSlotAssign).
 */

import * as React from "react";
import { clsx } from "clsx";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Image as ImageIcon, FileCode2, File } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { assetsApi } from "@/lib/api";
import type { Asset, BomSlot } from "@/lib/types";
import { useSlotAssign } from "../hooks/useBomSlot";
import { slotDisplayName } from "./domainMeta";

function assetIcon(mime: string | null | undefined): React.ReactNode {
  const cls = "w-4 h-4 shrink-0";
  if (!mime) return <File className={cls} aria-hidden />;
  if (mime.startsWith("image/")) return <ImageIcon className={cls} aria-hidden />;
  if (mime.includes("json") || mime.includes("yaml") || mime.includes("html"))
    return <FileCode2 className={cls} aria-hidden />;
  return <FileText className={cls} aria-hidden />;
}

export interface AssetPickerDialogProps {
  projectId: string;
  slot: BomSlot | null;
  onClose: () => void;
}

export function AssetPickerDialog({
  projectId,
  slot,
  onClose,
}: AssetPickerDialogProps) {
  const [q, setQ] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["bom", "asset-picker", projectId],
    queryFn: () => assetsApi.list(projectId, { limit: 200 }),
    enabled: !!slot,
    staleTime: 30_000,
  });

  const assign = useSlotAssign(slot?.id ?? "");

  const assets: Asset[] = React.useMemo(() => {
    const items = data?.items ?? [];
    if (!q.trim()) return items;
    const needle = q.trim().toLowerCase();
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        (a.artifact_type_id ?? "").toLowerCase().includes(needle),
    );
  }, [data, q]);

  React.useEffect(() => {
    // reset transient state whenever the target slot changes
    setQ("");
    setSelectedId(null);
  }, [slot?.id]);

  if (!slot) return null;

  const handleAssign = () => {
    if (!selectedId) return;
    assign.mutate(
      { asset_id: selectedId },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog
      open={!!slot}
      onClose={onClose}
      title={`Fill slot: ${slotDisplayName(slot)}`}
      description="Choose a project asset to assign to this slot."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedId}
            loading={assign.isPending}
            onClick={handleAssign}
          >
            Assign asset
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-faint)]"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assets by title or type…"
            aria-label="Search project assets"
            className={clsx(
              "w-full h-8 pl-8 pr-3 text-xs rounded border border-[var(--border)]",
              "bg-[var(--surface-sunken)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            )}
          />
        </div>

        {/* Asset list */}
        <div
          role="listbox"
          aria-label="Project assets"
          className="max-h-64 overflow-y-auto rounded border border-[var(--border)] divide-y divide-[var(--border)]"
        >
          {isLoading ? (
            <p className="p-4 text-xs text-[var(--ink-muted)]">Loading assets…</p>
          ) : assets.length === 0 ? (
            <p className="p-4 text-xs text-[var(--ink-muted)]">
              No matching assets in this project.
            </p>
          ) : (
            assets.map((a) => {
              const selected = selectedId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedId(selected ? null : a.id)}
                  className={clsx(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                    selected
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : "hover:bg-[var(--surface-sunken)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
                  )}
                >
                  <span
                    className={clsx(
                      "text-[var(--ink-faint)]",
                      selected && "text-blue-600",
                    )}
                  >
                    {assetIcon(a.mime_type)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-medium text-[var(--ink)] truncate">
                      {a.title}
                    </span>
                    <span className="block text-[10px] text-[var(--ink-faint)] truncate">
                      {a.artifact_type_id ?? a.mime_type ?? a.source_kind} ·{" "}
                      {a.status}
                    </span>
                  </span>
                  {selected && (
                    <span className="text-[10px] font-semibold text-blue-600 shrink-0">
                      Selected
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {assign.isError && (
          <p role="alert" className="text-xs text-red-600">
            {assign.error instanceof Error
              ? assign.error.message
              : "Assignment failed. Please try again."}
          </p>
        )}
      </div>
    </Dialog>
  );
}
