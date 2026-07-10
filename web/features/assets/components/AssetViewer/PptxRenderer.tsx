"use client";

/**
 * PptxRenderer — server-side PPTX→PDF conversion renderer.
 *
 * Security model: PPTX bytes never leave the server. The backend convert
 * endpoint resolves the stored file, validates magic bytes, converts to PDF
 * server-side, and returns a `pdfUrl` the client renders via PdfRenderer.
 *
 * Feature flag "pptx-server-conversion":
 *   OFF → full mode: immediate ErrorTile download fallback, no network call;
 *         thumbnail mode: static Presentation icon, no network call.
 *   ON  → POST /api/preview/convert/pptx {assetId}, render PDF on success,
 *         poll on 202 pending, fall back on any error.
 *
 * Thumbnail mode (UI Wave 3 / WS-1 — supersedes AC P4C-D's icon-only rule):
 *   Attempts the same conversion flow as full mode so asset CARDS show a real
 *   first-page preview. Differences from full mode:
 *   - shorter poll budget (~8 s vs ~30 s) — a card grid should settle fast;
 *   - graceful fallback to the static Presentation icon (never an ErrorTile)
 *     on any error, 403 policy_denied, or timeout;
 *   - conversions are deduped per assetId across all mounted cards: an
 *     in-flight POST is shared, and a "ready" response is memoized so
 *     remounted cards skip the network entirely (the server also caches the
 *     converted PDF per assetId at GET /api/preview/cache/{assetId}).
 *
 * Full mode — flag on:
 *   1. POST /api/preview/convert/pptx { assetId }
 *   2. 200 "ready"   → render <PdfRenderer src={pdfUrl} ... />
 *   3. 202 "pending" → poll same endpoint up to ~30 s then render or fall back
 *   4. Any error (4xx/5xx/network/timeout) → ErrorTile download fallback (AC P4C-A)
 *
 * Invariant: the component NEVER throws to the render tree.
 *
 * Loaded via next/dynamic({ ssr: false }) from AssetViewer/index.tsx.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Presentation } from "lucide-react";
import { isFlagEnabled } from "@/lib/flags";
import { apiAbsoluteUrl, pptxConvertUrl } from "@/lib/api";
import { PdfRenderer } from "./PdfRenderer";
import { ErrorTile } from "./ErrorTile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ConvertReadyResponse {
  status: "ready";
  pdfUrl: string;
  cached: boolean;
  pageCount: number;
}

interface ConvertPendingResponse {
  status: "pending";
}

type ConvertResponse = ConvertReadyResponse | ConvertPendingResponse;

type ViewPhase =
  | { phase: "loading" }
  | { phase: "ready"; pdfUrl: string }
  | { phase: "error" };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PptxRendererProps {
  /** Asset.id — passed to the convert endpoint (no raw bytes sent client-side). */
  assetId: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  mode: "thumbnail" | "full";
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_MS = 30_000;
/**
 * Thumbnail (card) poll budget — much shorter than full mode. A gallery of
 * cards should settle quickly; a card that misses the budget just shows the
 * static icon while the server finishes the conversion in the background
 * (the next mount picks up the cached result instantly).
 */
const THUMBNAIL_MAX_POLL_MS = 8_000;

// ---------------------------------------------------------------------------
// Per-assetId conversion caches (module-scoped, shared across all mounted
// PptxRenderer instances — e.g. every card in the library gallery).
//
// - inFlightConversions: dedupes concurrent POSTs — N cards for the same
//   asset (or overlapping poll ticks) share one network call.
// - readyResponseCache: memoizes a terminal "ready" response so remounted
//   cards (scroll away / back, gallery re-render) never re-POST. Errors are
//   NOT memoized — a remount may retry (e.g. transient network failure).
// ---------------------------------------------------------------------------
const inFlightConversions = new Map<string, Promise<ConvertResponse | null>>();
const readyResponseCache = new Map<string, ConvertReadyResponse>();

/** Test-only: clear the module-level conversion caches between test cases. */
export function __resetPptxConversionCachesForTests(): void {
  inFlightConversions.clear();
  readyResponseCache.clear();
}

// ---------------------------------------------------------------------------
// Convert helper — returns null on any non-200/202 or network error.
// Deduped per assetId: concurrent callers share a single fetch, and a
// "ready" result is memoized permanently for the session.
// ---------------------------------------------------------------------------
function callConvertEndpoint(assetId: string): Promise<ConvertResponse | null> {
  const memoized = readyResponseCache.get(assetId);
  if (memoized) return Promise.resolve(memoized);

  const inFlight = inFlightConversions.get(assetId);
  if (inFlight) return inFlight;

  const request = (async (): Promise<ConvertResponse | null> => {
    try {
      const response = await fetch(pptxConvertUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });

      if (response.status === 200) {
        const data = (await response.json()) as ConvertReadyResponse;
        readyResponseCache.set(assetId, data);
        return data;
      }
      if (response.status === 202) {
        return { status: "pending" };
      }
      // 4xx / 5xx (incl. 403 policy_denied) — signal error to caller
      return null;
    } catch {
      // Network error / JSON parse failure
      return null;
    }
  })();

  inFlightConversions.set(assetId, request);
  void request.finally(() => {
    inFlightConversions.delete(assetId);
  });
  return request;
}

// ---------------------------------------------------------------------------
// PptxRenderer (outer shell — no hooks; early returns are safe here)
// ---------------------------------------------------------------------------
export function PptxRenderer({ assetId, originalUrl, mode, className }: PptxRendererProps) {
  const isThumbnail = mode === "thumbnail";
  const conversionEnabled = isFlagEnabled("pptx-server-conversion");

  // ── Flag off ──────────────────────────────────────────────────────────────
  if (!conversionEnabled) {
    // Thumbnail: static format icon, no network call.
    if (isThumbnail) {
      return <PptxIconTile className={className} />;
    }
    // Full: download fallback immediately, no network call (AC P4C-A).
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="PPTX preview requires server conversion (feature not enabled)"
        className={className}
      />
    );
  }

  // ── Flag on (both modes): delegate to stateful conversion view ────────────
  return (
    <PptxConversionView
      assetId={assetId}
      originalUrl={originalUrl}
      mode={mode}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// PptxConversionView — stateful inner component (holds hooks)
// ---------------------------------------------------------------------------
function PptxConversionView({
  assetId,
  originalUrl,
  mode,
  className,
}: PptxRendererProps) {
  const [viewState, setViewState] = React.useState<ViewPhase>({ phase: "loading" });
  const isThumbnail = mode === "thumbnail";

  React.useEffect(() => {
    let cancelled = false;
    const maxPollMs = isThumbnail ? THUMBNAIL_MAX_POLL_MS : MAX_POLL_MS;

    async function runConversion() {
      const deadline = Date.now() + maxPollMs;

      while (true) {
        const result = await callConvertEndpoint(assetId);

        if (cancelled) return;

        if (result === null) {
          // Any 4xx/5xx or network error → fallback
          setViewState({ phase: "error" });
          return;
        }

        if (result.status === "ready") {
          // pdfUrl comes back API-relative; resolve it against the API origin
          // (web and API are served from different origins in deployment).
          setViewState({ phase: "ready", pdfUrl: apiAbsoluteUrl(result.pdfUrl) });
          return;
        }

        // status === "pending" — check if there is time left to poll
        const remaining = deadline - Date.now();
        if (remaining <= POLL_INTERVAL_MS) {
          // Timed out waiting for conversion
          setViewState({ phase: "error" });
          return;
        }

        // Wait before next poll
        await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        if (cancelled) return;
      }
    }

    runConversion().catch(() => {
      // Defensive: runConversion should never throw (all paths set state), but
      // guard here to ensure the component never propagates an unhandled rejection.
      if (!cancelled) {
        setViewState({ phase: "error" });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [assetId, isThumbnail]);

  // ── Error ─────────────────────────────────────────────────────────────────
  if (viewState.phase === "error") {
    // Thumbnail (card) fallback: static format icon — an ErrorTile would make
    // every policy-denied / still-converting card read as broken.
    if (isThumbnail) {
      return <PptxIconTile className={className} />;
    }
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="PPTX conversion failed — download below"
        className={className}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (viewState.phase === "loading") {
    return <PptxLoadingSkeleton mode={mode} className={className} />;
  }

  // ── Ready: render via PdfRenderer (reuses react-pdf surface) ─────────────
  return (
    <PdfRenderer
      src={viewState.pdfUrl}
      originalUrl={originalUrl}
      mode={mode}
      className={className}
    />
  );
}

// ---------------------------------------------------------------------------
// Static icon tile — thumbnail fallback (flag off, conversion error/timeout)
// ---------------------------------------------------------------------------
function PptxIconTile({ className }: { className?: string }) {
  return (
    <div
      aria-label="PowerPoint presentation"
      className={clsx(
        "flex items-center justify-center rounded border border-[var(--border)] bg-gray-50",
        "h-24",
        className,
      )}
    >
      <Presentation aria-hidden className="h-8 w-8 text-orange-500" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function PptxLoadingSkeleton({
  mode,
  className,
}: {
  mode: "thumbnail" | "full";
  className?: string;
}) {
  const isThumbnail = mode === "thumbnail";
  return (
    <div
      aria-label="Converting presentation…"
      aria-busy="true"
      role="status"
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded border border-[var(--border)] bg-gray-50",
        isThumbnail ? "h-24 animate-pulse" : "min-h-40",
        className,
      )}
    >
      <Presentation aria-hidden className="h-8 w-8 animate-pulse text-orange-400" />
      {!isThumbnail && (
        <p className="text-xs text-[var(--ink-muted)]">Converting presentation…</p>
      )}
    </div>
  );
}
