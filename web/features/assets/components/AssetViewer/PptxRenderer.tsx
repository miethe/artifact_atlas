"use client";

/**
 * PptxRenderer — server-side PPTX→PDF conversion renderer.
 *
 * Security model: PPTX bytes never leave the server. The backend convert
 * endpoint resolves the stored file, validates magic bytes, converts to PDF
 * server-side, and returns a `pdfUrl` the client renders via PdfRenderer.
 *
 * Feature flag "pptx-server-conversion":
 *   OFF (default) → immediate ErrorTile download fallback, no network call.
 *   ON            → POST /api/preview/convert/pptx {assetId}, render PDF on
 *                   success, poll on 202 pending, fall back on any error.
 *
 * Thumbnail mode:
 *   Shows a Presentation icon only — no conversion call (AC P4C-D).
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
const CONVERT_ENDPOINT = "/api/preview/convert/pptx";
const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_MS = 30_000;

// ---------------------------------------------------------------------------
// Convert helper — returns null on any non-200/202 or network error
// ---------------------------------------------------------------------------
async function callConvertEndpoint(assetId: string): Promise<ConvertResponse | null> {
  try {
    const response = await fetch(CONVERT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId }),
    });

    if (response.status === 200) {
      const data = (await response.json()) as ConvertReadyResponse;
      return data;
    }
    if (response.status === 202) {
      return { status: "pending" };
    }
    // 4xx / 5xx — signal error to caller
    return null;
  } catch {
    // Network error / JSON parse failure
    return null;
  }
}

// ---------------------------------------------------------------------------
// PptxRenderer (outer shell — no hooks; early returns are safe here)
// ---------------------------------------------------------------------------
export function PptxRenderer({ assetId, originalUrl, mode, className }: PptxRendererProps) {
  const isThumbnail = mode === "thumbnail";

  // ── Thumbnail: format icon only, no conversion call (AC P4C-D) ────────────
  if (isThumbnail) {
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

  // ── Flag off: download fallback immediately, no network call (AC P4C-A) ───
  if (!isFlagEnabled("pptx-server-conversion")) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="PPTX preview requires server conversion (feature not enabled)"
        className={className}
      />
    );
  }

  // ── Flag on, full mode: delegate to stateful conversion view ──────────────
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

  React.useEffect(() => {
    let cancelled = false;

    async function runConversion() {
      const deadline = Date.now() + MAX_POLL_MS;

      while (true) {
        const result = await callConvertEndpoint(assetId);

        if (cancelled) return;

        if (result === null) {
          // Any 4xx/5xx or network error → download fallback
          setViewState({ phase: "error" });
          return;
        }

        if (result.status === "ready") {
          setViewState({ phase: "ready", pdfUrl: result.pdfUrl });
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
  }, [assetId]);

  // ── Error ─────────────────────────────────────────────────────────────────
  if (viewState.phase === "error") {
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
    return <PptxLoadingSkeleton className={className} />;
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
// Loading skeleton
// ---------------------------------------------------------------------------
function PptxLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="Converting presentation…"
      aria-busy="true"
      role="status"
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded border border-[var(--border)] bg-gray-50",
        "min-h-40",
        className,
      )}
    >
      <Presentation aria-hidden className="h-8 w-8 animate-pulse text-orange-400" />
      <p className="text-xs text-[var(--ink-muted)]">Converting presentation…</p>
    </div>
  );
}
