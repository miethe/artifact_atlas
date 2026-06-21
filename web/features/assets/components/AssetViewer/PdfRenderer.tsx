"use client";

/**
 * PdfRenderer — react-pdf 10.4.1 based PDF viewer.
 *
 * IMPORTANT: This is the 'use client' module that contains <Document>.
 * GlobalWorkerOptions.workerSrc is set here at module scope, co-located with
 * the <Document> component per the react-pdf / pdfjs-dist requirements.
 *
 * Security:
 * - PDF JS execution is left at the react-pdf default (disabled).
 * - workerSrc is set explicitly to avoid unpkg/CDN fallback.
 * - Error tile with download link on any load/worker failure.
 *
 * Loaded via next/dynamic({ ssr: false }) from AssetViewer/index.tsx.
 *
 * Worker: pdfjs-dist@5.4.296 — copy of build/pdf.worker.min.mjs served from
 * /public/pdf-worker/pdf.worker.min.mjs.
 */

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ErrorTile } from "./ErrorTile";

// ---------------------------------------------------------------------------
// Worker configuration — MUST be in the same 'use client' module as <Document>
// pdfjs-dist v5 ships .mjs workers; the file is served from /public/pdf-worker/
// ---------------------------------------------------------------------------
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs";

export interface PdfRendererProps {
  /** URL of the PDF file to display (proxied or direct). */
  src: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  mode: "thumbnail" | "full";
  className?: string;
}

export function PdfRenderer({ src, originalUrl, mode, className }: PdfRendererProps) {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [loadError, setLoadError] = React.useState(false);

  const isThumbnail = mode === "thumbnail";

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoadError(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error("[PdfRenderer] Document load error:", error.message);
    setLoadError(true);
  }

  if (loadError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="PDF failed to load"
        className={className}
      />
    );
  }

  const containerClass = clsx(
    "flex flex-col items-center gap-2 overflow-hidden rounded border border-[var(--border)] bg-gray-50",
    isThumbnail ? "h-24" : "h-auto min-h-40",
    className,
  );

  const pageWidth = isThumbnail ? 80 : undefined; // fixed width for thumbnail; auto for full

  return (
    <div className={containerClass}>
      <Document
        file={src}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<PdfLoadingSkeleton isThumbnail={isThumbnail} />}
        error={
          <ErrorTile
            originalUrl={originalUrl}
            mode={mode}
            message="PDF failed to load"
          />
        }
        className="w-full"
      >
        <Page
          pageNumber={currentPage}
          width={pageWidth}
          renderTextLayer={!isThumbnail}
          renderAnnotationLayer={!isThumbnail}
          className="mx-auto"
        />
      </Document>

      {/* Page navigation — full mode only */}
      {!isThumbnail && numPages !== null && numPages > 1 && (
        <nav
          aria-label="PDF page navigation"
          className="flex items-center gap-3 py-2 text-sm text-[var(--ink-muted)]"
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft aria-hidden className="w-4 h-4" />
          </button>

          <span className="tabular-nums">
            {currentPage} / {numPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
            aria-label="Next page"
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight aria-hidden className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function PdfLoadingSkeleton({ isThumbnail }: { isThumbnail: boolean }) {
  return (
    <div
      aria-label="Loading PDF…"
      aria-busy="true"
      className={clsx(
        "w-full animate-pulse bg-gray-200 rounded",
        isThumbnail ? "h-20" : "h-48",
      )}
    />
  );
}
