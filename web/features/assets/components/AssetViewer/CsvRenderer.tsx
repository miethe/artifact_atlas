"use client";

/**
 * CsvRenderer — client-side CSV/TSV parser + TanStack Table renderer.
 *
 * Security:
 * - Parses the raw text response with a hand-rolled RFC 4180-style parser
 *   (no new dependency); every cell value is placed as a plain React text
 *   node (auto-escaped by JSX — never dangerouslySetInnerHTML).
 * - src points at the safe asset-content proxy URL only (fetchRelated:false —
 *   no linked/remote resources are auto-fetched).
 * - Rows are capped at MAX_RENDERED_ROWS with a truncation notice — large
 *   files never fully materialize into the DOM.
 * - The fetch itself is byte-capped via a Range request (MAJOR fix: a plain
 *   `res.text()` previously downloaded the entire file, unbounded, before
 *   any row cap applied) — see BYTE_CAP_BYTES below.
 *
 * Loaded via next/dynamic({ ssr: false }) from AssetViewer/index.tsx (keeps
 * the @tanstack/react-table import out of the initial bundle, matching the
 * ContentRenderer/DocxRenderer lazy-loading pattern).
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { ErrorTile } from "./ErrorTile";

const MAX_RENDERED_ROWS = 1000;
const THUMBNAIL_PREVIEW_ROWS = 5;

/** Byte cap for the CSV/TSV fetch (2 MiB) — the preview proxy supports HTTP
 * Range (WS-3), so we request only a bounded prefix instead of downloading
 * arbitrarily large files client-side. */
const BYTE_CAP_BYTES = 2 * 1024 * 1024;
const RANGE_HEADER = `bytes=0-${BYTE_CAP_BYTES - 1}`;

export interface CsvRendererProps {
  /** URL to fetch the raw CSV/TSV text from. */
  src: string;
  /** True for .tsv / text/tab-separated-values assets; comma-delimited otherwise. */
  isTsv?: boolean;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  mode: "thumbnail" | "full";
  className?: string;
}

/** Row shape fed to TanStack Table: positional column key → cell string. */
type CsvRow = Record<string, string>;

// ---------------------------------------------------------------------------
// Delimited-text parser (RFC 4180-ish: quoted fields, "" escapes, CRLF/LF/CR)
// ---------------------------------------------------------------------------
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  // MINOR fix: tracks whether the *current* field was opened (e.g. a
  // quoted field) even if it ends up empty. Without this, a trailing
  // record consisting solely of an empty quoted field (e.g. `header\n""`
  // with no final delimiter/newline) was indistinguishable from "nothing
  // left to flush" — `field.length > 0 || row.length > 0` are both false
  // for `""`, so the EOF flush below silently dropped the whole record.
  let fieldStarted = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      fieldStarted = true;
      i += 1;
      continue;
    }

    if (char === delimiter) {
      row.push(field);
      field = "";
      fieldStarted = false;
      i += 1;
      continue;
    }

    if (char === "\r") {
      row.push(field);
      field = "";
      fieldStarted = false;
      rows.push(row);
      row = [];
      i += text[i + 1] === "\n" ? 2 : 1;
      continue;
    }

    if (char === "\n") {
      row.push(field);
      field = "";
      fieldStarted = false;
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush a trailing field/row when the text doesn't end with a newline.
  // `fieldStarted` catches the empty-quoted-final-field case described above.
  if (field.length > 0 || row.length > 0 || fieldStarted) {
    row.push(field);
    rows.push(row);
  }

  // Drop a single fully-empty trailing row, but only when the text actually
  // *ends* with a line terminator — that's the only case where a lone empty
  // row is a "trailing newline" artifact rather than real content. This must
  // stay narrower than a blanket "last row is empty" check: the fieldStarted
  // fix above can legitimately produce a final row of `[""]` (a trailing
  // quoted-empty field with no newline after it), and that row must survive.
  const endsWithLineBreak = len > 0 && (text[len - 1] === "\n" || text[len - 1] === "\r");
  if (endsWithLineBreak && rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") {
      rows.pop();
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// CsvRenderer
// ---------------------------------------------------------------------------
export function CsvRenderer({
  src,
  isTsv = false,
  originalUrl,
  mode,
  className,
}: CsvRendererProps) {
  const [content, setContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(false);
  // True when the fetched text was cut off by BYTE_CAP_BYTES (either the
  // server honored our Range request and more data exists beyond it, or it
  // ignored Range and returned the full file, which we then sliced
  // client-side). Distinct from the *row*-count truncation below.
  const [byteCapped, setByteCapped] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFetchError(false);
    setContent(null);
    setByteCapped(false);

    fetch(src, { headers: { Range: RANGE_HEADER } })
      .then(async (res) => {
        // 206 = server honored the Range request; 200 = it ignored Range
        // and sent the whole file (still handled below via a client-side
        // slice). Anything else is a real error.
        if (!res.ok && res.status !== 206) {
          throw new Error(`HTTP ${res.status}`);
        }

        const buffer = await res.arrayBuffer();
        let bytes = new Uint8Array(buffer);

        // Server ignored Range (200 with the full body) — enforce the cap
        // client-side so an unbounded file never fully materializes here.
        let capped = bytes.byteLength > BYTE_CAP_BYTES;
        if (capped) {
          bytes = bytes.subarray(0, BYTE_CAP_BYTES);
        }

        // Server honored Range (206) — figure out from Content-Range
        // whether the slice we got IS the whole file (small file, nothing
        // cut) or a genuine prefix of a larger one.
        if (res.status === 206 && !capped) {
          const contentRange = res.headers.get("content-range");
          const total = contentRange ? Number(contentRange.split("/")[1]) : NaN;
          capped = Number.isFinite(total) ? total > bytes.byteLength : true;
        }

        let text = new TextDecoder("utf-8").decode(bytes);
        if (capped) {
          // The byte cut can land mid-record (or mid multi-byte UTF-8
          // character) — drop the trailing partial line so the parser
          // never sees a truncated final row.
          const lastBreak = Math.max(text.lastIndexOf("\n"), text.lastIndexOf("\r"));
          text = lastBreak >= 0 ? text.slice(0, lastBreak) : "";
        }

        return { text, capped };
      })
      .then(({ text, capped }) => {
        if (!cancelled) {
          setContent(text);
          setByteCapped(capped);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("[CsvRenderer] fetch error:", err);
        if (!cancelled) {
          setFetchError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  const isThumbnail = mode === "thumbnail";
  const delimiter = isTsv ? "\t" : ",";

  // Parsed rows[0] is the header row; the rest are data rows.
  const parsedRows = React.useMemo(
    () => (content ? parseDelimited(content, delimiter) : []),
    [content, delimiter],
  );
  const headerRow = parsedRows[0] ?? [];
  const dataRows = parsedRows.slice(1);

  const visibleRowLimit = isThumbnail ? THUMBNAIL_PREVIEW_ROWS : MAX_RENDERED_ROWS;
  const rowCapped = dataRows.length > visibleRowLimit;
  // Truncation notice must cover both the row cap (large row count) and the
  // byte cap (large file size) — either can hide data from the user.
  const truncated = rowCapped || byteCapped;
  const renderedRows = dataRows.slice(0, visibleRowLimit);

  const columnKeys = React.useMemo(
    () => headerRow.map((_, idx) => `col_${idx}`),
    [headerRow.length],
  );

  const tableData = React.useMemo<CsvRow[]>(
    () =>
      renderedRows.map((r) => {
        const obj: CsvRow = {};
        columnKeys.forEach((key, idx) => {
          obj[key] = r[idx] ?? "";
        });
        return obj;
      }),
    [renderedRows, columnKeys],
  );

  const columnDefs = React.useMemo<ColumnDef<CsvRow, string>[]>(
    () =>
      columnKeys.map((key, idx) => ({
        id: key,
        header: headerRow[idx] && headerRow[idx].length > 0 ? headerRow[idx] : `Column ${idx + 1}`,
        accessorKey: key,
      })),
    [columnKeys, headerRow],
  );

  // Hook is always called unconditionally (rules-of-hooks) — the loading /
  // error / empty states below are pure conditional *rendering*, not
  // conditional hook calls.
  const table = useReactTable({
    data: tableData,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  if (fetchError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="Table failed to load"
        className={className}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        aria-label="Loading table…"
        aria-busy="true"
        className={clsx(
          "rounded border border-[var(--border)] bg-gray-50 animate-pulse",
          isThumbnail ? "h-24" : "h-40",
          className,
        )}
      />
    );
  }

  if (parsedRows.length === 0) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center rounded border border-dashed border-[var(--border)]",
          "bg-gray-50 text-[11px] text-[var(--ink-muted)]",
          isThumbnail ? "h-24" : "h-40",
          className,
        )}
      >
        Empty table
      </div>
    );
  }

  // ── Thumbnail mode: compact text preview, no interactive grid ───────────
  if (isThumbnail) {
    return (
      <div
        className={clsx(
          "overflow-hidden rounded border border-[var(--border)] bg-gray-50 p-2 h-24",
          className,
        )}
      >
        <table className="w-full text-[9px] font-mono text-[var(--ink-muted)]">
          <tbody>
            {[headerRow, ...renderedRows].map((r, i) => (
              <tr key={i} className={i === 0 ? "font-semibold text-[var(--ink)]" : undefined}>
                {r.slice(0, 4).map((cell, j) => (
                  <td key={j} className="truncate max-w-[60px] pr-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Full mode: TanStack Table headless grid ──────────────────────────────
  return (
    <div
      className={clsx(
        "flex flex-col rounded border border-[var(--border)] overflow-hidden min-h-40",
        className,
      )}
    >
      <div className="overflow-auto max-h-96" role="region" aria-label="CSV/TSV table preview">
        <table className="w-full text-[11px] border-collapse">
          <thead className="sticky top-0 bg-gray-50 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={clsx(
                      "px-3 py-2 text-left text-[10px] font-semibold text-[var(--ink-muted)]",
                      "uppercase tracking-wide border-b border-[var(--border)] whitespace-nowrap",
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-1.5 text-[var(--ink)] whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {truncated && (
        <p className="px-3 py-1.5 text-[10px] text-[var(--ink-muted)] bg-gray-50 border-t border-[var(--border)]">
          {rowCapped
            ? `Showing first ${visibleRowLimit.toLocaleString()} of ${dataRows.length.toLocaleString()}${
                byteCapped ? "+" : ""
              } rows.`
            : `Showing a partial preview — file exceeds the ${(BYTE_CAP_BYTES / (1024 * 1024)).toFixed(0)} MB preview limit.`}
          {byteCapped && rowCapped ? " File also exceeds the preview size limit." : null}
        </p>
      )}
    </div>
  );
}
