"use client";

/**
 * AssetTable — TanStack Table-based table view for the asset library.
 * Keyboard selectable rows. Virtualized with TanStack Virtual for long lists.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconButton } from "@/components/ui/IconButton";
import type { Asset } from "@/lib/types";
import { AssetThumbnail } from "./AssetThumbnail";

// ============================================================
// Helpers
// ============================================================

function formatDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// Column definitions
// ============================================================

/** Extra handlers threaded to column cells via TanStack table `meta`. */
interface AssetTableMeta {
  onOpen?: (assetId: string) => void;
}

const col = createColumnHelper<Asset>();

const columns = [
  col.display({
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all assets"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label={`Select ${row.original.title}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    ),
    size: 36,
    enableSorting: false,
  }),
  col.display({
    id: "thumbnail",
    header: () => null,
    cell: ({ row }) => (
      <AssetThumbnail asset={row.original} size="xs" />
    ),
    size: 36,
    enableSorting: false,
  }),
  col.accessor("title", {
    header: "Title",
    cell: (info) => (
      <span className="font-medium text-[var(--ink)] truncate">{info.getValue()}</span>
    ),
    size: 280,
  }),
  col.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} size="xs" />,
    size: 100,
  }),
  col.accessor("sensitivity", {
    header: "Sensitivity",
    cell: (info) => <SensitivityBadge sensitivity={info.getValue()} size="xs" showIcon={false} />,
    size: 120,
  }),
  col.accessor("source_kind", {
    header: "Source",
    cell: (info) => (
      <span className="text-[11px] text-[var(--ink-muted)] capitalize">{info.getValue()}</span>
    ),
    size: 90,
  }),
  col.accessor("mime_type", {
    header: "Type",
    cell: (info) => (
      <span className="text-[11px] text-[var(--ink-muted)] font-mono truncate">
        {info.getValue() ?? "—"}
      </span>
    ),
    size: 120,
  }),
  col.accessor("size_bytes", {
    header: "Size",
    cell: (info) => (
      <span className="text-[11px] text-[var(--ink-muted)] tabular-nums">
        {formatBytes(info.getValue())}
      </span>
    ),
    size: 72,
  }),
  col.accessor("captured_at", {
    header: "Captured",
    cell: (info) => (
      <span className="text-[11px] text-[var(--ink-muted)] tabular-nums whitespace-nowrap">
        {formatDate(info.getValue())}
      </span>
    ),
    size: 100,
  }),
  col.display({
    id: "actions",
    header: () => null,
    cell: ({ row, table }) => {
      const onOpen = (table.options.meta as AssetTableMeta | undefined)?.onOpen;
      return (
        <div
          className="opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={`Open ${row.original.title}`}
            data-open-id={row.original.id}
            onClick={() => onOpen?.(row.original.id)}
          >
            <ExternalLink aria-hidden className="w-3 h-3" />
          </IconButton>
        </div>
      );
    },
    size: 36,
    enableSorting: false,
  }),
];

// ============================================================
// AssetTable
// ============================================================

export interface AssetTableProps {
  assets: Asset[];
  loading?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onOpen?: (assetId: string) => void;
  className?: string;
}

export function AssetTable({
  assets,
  loading = false,
  selectedIds,
  onSelectionChange,
  onOpen,
  className,
}: AssetTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "captured_at", desc: true },
  ]);

  // Sync external selection → row selection state
  const rowSelection = React.useMemo(() => {
    const sel: Record<string, boolean> = {};
    if (selectedIds) {
      for (const id of selectedIds) {
        const idx = assets.findIndex((a) => a.id === id);
        if (idx >= 0) sel[String(idx)] = true;
      }
    }
    return sel;
  }, [selectedIds, assets]);

  const table = useReactTable({
    data: assets,
    columns,
    state: { sorting, rowSelection },
    meta: { onOpen } satisfies AssetTableMeta,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSel = typeof updater === "function" ? updater(rowSelection) : updater;
      const ids = new Set(
        Object.keys(newSel)
          .filter((k) => newSel[k])
          .map((k) => assets[parseInt(k)]?.id)
          .filter(Boolean) as string[],
      );
      onSelectionChange?.(ids);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Virtualizer
  const parentRef = React.useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  if (loading) {
    return (
      <div className={clsx("flex flex-col", className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)]">
            <Skeleton className="w-3.5 h-3.5" />
            <Skeleton className="w-7 h-7 rounded" />
            <Skeleton className="h-3 flex-1 max-w-xs" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("flex flex-col overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center border-b border-[var(--border)] bg-gray-50 shrink-0">
        {table.getHeaderGroups().map((hg) =>
          hg.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const sorted = header.column.getIsSorted();
            return (
              <div
                key={header.id}
                style={{ width: header.getSize() }}
                className={clsx(
                  "px-3 py-2 text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide",
                  "flex items-center gap-1 shrink-0",
                  canSort && "cursor-pointer select-none hover:text-[var(--ink)]",
                )}
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                role={canSort ? "button" : undefined}
                tabIndex={canSort ? 0 : undefined}
                onKeyDown={
                  canSort
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          header.column.toggleSorting();
                        }
                      }
                    : undefined
                }
                aria-sort={
                  sorted === "asc"
                    ? "ascending"
                    : sorted === "desc"
                    ? "descending"
                    : canSort
                    ? "none"
                    : undefined
                }
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && (
                  <span aria-hidden>
                    {sorted === "asc" ? (
                      <ArrowUp className="w-2.5 h-2.5" />
                    ) : sorted === "desc" ? (
                      <ArrowDown className="w-2.5 h-2.5" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                    )}
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Virtualized body */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto"
        role="grid"
        aria-label="Asset list"
      >
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          className="relative"
        >
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const asset = row.original;
            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                role="row"
                aria-selected={row.getIsSelected()}
                tabIndex={0}
                className={clsx(
                  "group/row flex items-center border-b border-[var(--border)]",
                  "cursor-pointer transition-colors duration-[100ms]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
                  row.getIsSelected() ? "bg-blue-50" : "bg-white hover:bg-gray-50",
                )}
                onClick={() => onOpen?.(asset.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen?.(asset.id);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    role="gridcell"
                    style={{ width: cell.column.getSize() }}
                    className="px-3 py-2 flex items-center shrink-0 overflow-hidden"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
