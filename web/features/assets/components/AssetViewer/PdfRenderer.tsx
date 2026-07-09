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
 * Full mode:
 *   Renders ALL pages stacked in a vertically scrolling container so the user
 *   just wheels through the document. A small floating control in the bottom
 *   right of the pane shows "current / total" with prev/next buttons that
 *   scroll the target page into view. Only a bounded window of pages around
 *   the visible one is mounted as real <Page/> elements — pages scrolled far
 *   away are evicted back to placeholders (sized to their measured height so
 *   the scroll position stays stable), keeping memory bounded on large PDFs.
 *
 * Thumbnail mode:
 *   Renders just the first page at a fixed narrow width.
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
/**
 * Pages kept mounted on each side of the visible page. Pages outside this
 * window are evicted back to placeholders so memory stays bounded regardless
 * of document length.
 */
const RENDER_WINDOW = 3;
/** Approximate slot height for never-rendered pages (US letter at ~800px width). */
const PLACEHOLDER_PAGE_HEIGHT = 1024;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
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

  // ── Thumbnail mode: first page only, fixed narrow width ─────────────────
  if (isThumbnail) {
    return (
      <div
        className={clsx(
          "flex flex-col items-center gap-2 overflow-hidden rounded border border-[var(--border)] bg-gray-50",
          "h-24",
          className,
        )}
      >
        <Document
          file={src}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<PdfLoadingSkeleton isThumbnail />}
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
            pageNumber={1}
            width={80}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto"
          />
        </Document>
      </div>
    );
  }

  // ── Full mode: vertically scrolling multi-page view ─────────────────────
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded border border-[var(--border)] bg-gray-50",
        // Fall back to a bounded height when the caller doesn't supply one,
        // so the scroll container has a viewport to scroll within.
        "h-[70vh]",
        className,
      )}
    >
      <Document
        file={src}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={<PdfLoadingSkeleton isThumbnail={false} />}
        error={
          <ErrorTile
            originalUrl={originalUrl}
            mode={mode}
            message="PDF failed to load"
          />
        }
        className="h-full w-full"
      >
        {numPages !== null && numPages > 0 ? (
          <MultiPagePdfScroll numPages={numPages} />
        ) : (
          <PdfLoadingSkeleton isThumbnail={false} />
        )}
      </Document>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MultiPagePdfScroll — vertical scroll of all pages + floating page indicator
// ---------------------------------------------------------------------------
interface MultiPagePdfScrollProps {
  numPages: number;
}

function MultiPagePdfScroll({ numPages }: MultiPagePdfScrollProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  // Measured heights of pages that have actually rendered, so evicted pages
  // leave behind a correctly-sized placeholder and the scroll doesn't jump.
  const pageHeightsRef = React.useRef<Map<number, number>>(new Map());
  const [containerWidth, setContainerWidth] = React.useState<number | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Measure the container width so <Page> renders at a reasonable size.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(Math.max(240, w - 24));
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll-driven page tracking: the "current" page is the one spanning the
  // vertical midpoint of the viewport (not an IntersectionObserver with a
  // preload margin, which would count offscreen pages as current). The same
  // pass records measured heights for mounted pages so eviction placeholders
  // keep the document's scroll geometry stable.
  React.useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    let frame = 0;
    const updateVisiblePage = () => {
      frame = 0;
      const rootRect = root.getBoundingClientRect();
      const midY = rootRect.top + rootRect.height / 2;
      let best = 1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < pageRefs.current.length; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.height > 0 && el.childElementCount > 0) {
          // Only trust measurements of real rendered pages (placeholder-only
          // wrappers carry the approximate height already).
          const prev = pageHeightsRef.current.get(i + 1);
          if (prev === undefined || Math.abs(prev - rect.height) > 1) {
            pageHeightsRef.current.set(i + 1, rect.height);
          }
        }
        if (rect.top <= midY && rect.bottom >= midY) {
          best = i + 1;
          bestDistance = 0;
          break;
        }
        const distance = Math.min(
          Math.abs(rect.top - midY),
          Math.abs(rect.bottom - midY),
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i + 1;
        }
        // Pages are in document order; once we've passed the midpoint the
        // distance only grows, so stop scanning.
        if (rect.top > midY) break;
      }
      setCurrentPage(best);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateVisiblePage);
    };

    updateVisiblePage();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [numPages]);

  const scrollToPage = React.useCallback((pageNum: number) => {
    const clamped = Math.max(1, Math.min(numPages, pageNum));
    const el = pageRefs.current[clamped - 1];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [numPages]);

  const setPageRef = React.useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      pageRefs.current[index] = el;
    },
    [],
  );

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        aria-label="PDF document pages"
        className="h-full w-full overflow-y-auto"
      >
        <div className="mx-auto flex flex-col items-center gap-4 py-4">
          {Array.from({ length: numPages }, (_, i) => {
            const pageNum = i + 1;
            // Bounded mount window: pages outside it are evicted back to a
            // placeholder sized to their measured height, so long documents
            // never accumulate every canvas/text layer in memory.
            const shouldRender = Math.abs(pageNum - currentPage) <= RENDER_WINDOW;
            const knownHeight =
              pageHeightsRef.current.get(pageNum) ?? PLACEHOLDER_PAGE_HEIGHT;
            return (
              <div
                key={pageNum}
                data-page={pageNum}
                ref={setPageRef(i)}
                className="shadow-sm"
                style={{
                  minHeight: shouldRender ? undefined : knownHeight,
                  width: containerWidth ?? "100%",
                  maxWidth: "100%",
                }}
              >
                {shouldRender ? (
                  <Page
                    pageNumber={pageNum}
                    width={containerWidth ?? undefined}
                    renderTextLayer
                    renderAnnotationLayer
                    className="mx-auto"
                    loading={<PagePlaceholder height={knownHeight} />}
                  />
                ) : (
                  <PagePlaceholder height={knownHeight} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {numPages > 1 && (
        <FloatingPageNav
          current={currentPage}
          total={numPages}
          onPrev={() => scrollToPage(currentPage - 1)}
          onNext={() => scrollToPage(currentPage + 1)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FloatingPageNav — bottom-right pill with prev/next + "n / m"
// ---------------------------------------------------------------------------
interface FloatingPageNavProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

function FloatingPageNav({ current, total, onPrev, onNext }: FloatingPageNavProps) {
  return (
    <nav
      aria-label="PDF page navigation"
      className={clsx(
        "absolute bottom-3 right-3 flex items-center gap-1",
        "rounded-full border border-[var(--border)] bg-white/95 shadow-md backdrop-blur",
        "px-2 py-1 text-xs text-[var(--ink)]",
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={current <= 1}
        aria-label="Previous page"
        className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft aria-hidden className="h-4 w-4" />
      </button>
      <span aria-live="polite" className="min-w-[3.5rem] text-center tabular-nums">
        {current} / {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={current >= total}
        aria-label="Next page"
        className="rounded-full p-1 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight aria-hidden className="h-4 w-4" />
      </button>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Per-page placeholder (used while a page is out-of-window or still loading)
// ---------------------------------------------------------------------------
function PagePlaceholder({ height = PLACEHOLDER_PAGE_HEIGHT }: { height?: number }) {
  return (
    <div
      aria-hidden
      className="w-full animate-pulse rounded bg-gray-200"
      style={{ height }}
    />
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton (document-level, before numPages is known)
// ---------------------------------------------------------------------------
function PdfLoadingSkeleton({ isThumbnail }: { isThumbnail: boolean }) {
  return (
    <div
      aria-label="Loading PDF…"
      aria-busy="true"
      className={clsx(
        "w-full animate-pulse rounded bg-gray-200",
        isThumbnail ? "h-20" : "h-48",
      )}
    />
  );
}
