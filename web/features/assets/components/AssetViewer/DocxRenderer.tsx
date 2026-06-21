"use client";

/**
 * DocxRenderer — docx-preview 0.3.7 based DOCX viewer.
 *
 * Security:
 * - fetchRelated: false — prevents docx-preview from fetching remote resources
 *   embedded in the DOCX (SSRF mitigation, NFR-S4 / security mandate R6).
 *   NOTE: docx-preview 0.3.7 does not yet ship this option in its typedefs
 *   nor make any fetch calls; it is passed via an intersection-type cast for
 *   forward-compatibility with any future version that adds remote fetching.
 * - Error tile with download link on any proxy or renderAsync failure.
 *
 * Thumbnail mode:
 *   Shows a FileText icon — renderAsync is NOT called (performance / P4B-AC-B).
 *
 * Full mode:
 *   1. Fetches DOCX bytes from the backend proxy (checks response.ok).
 *   2. Calls docx.renderAsync(buffer, container, undefined, opts) with
 *      fetchRelated:false enforced.
 *   3. Catches any error and shows ErrorTile + download link.
 *
 * Loaded via next/dynamic({ ssr: false }) from AssetViewer/index.tsx.
 * Static imports below are safe because this module never runs on the server.
 */

import * as React from "react";
import * as docx from "docx-preview";
import type { Options as DocxOptions } from "docx-preview";
import { clsx } from "clsx";
import { FileText } from "lucide-react";
import { ErrorTile } from "./ErrorTile";

// ---------------------------------------------------------------------------
// Extended options type — DocxOptions does not declare fetchRelated in v0.3.7.
// We use an intersection so TypeScript accepts the field; we cast back to
// Partial<DocxOptions> at the call site (the runtime value still carries it).
// ---------------------------------------------------------------------------
type DocxRenderOptions = Partial<DocxOptions> & { fetchRelated?: boolean };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DocxRendererProps {
  /** URL of the DOCX file to display (proxied or direct). */
  src: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  mode: "thumbnail" | "full";
  className?: string;
}

// ---------------------------------------------------------------------------
// DocxRenderer
// ---------------------------------------------------------------------------
export function DocxRenderer({ src, originalUrl, mode, className }: DocxRendererProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const isThumbnail = mode === "thumbnail";

  // Full-mode: fetch bytes + renderAsync (skipped in thumbnail mode)
  React.useEffect(() => {
    // Guard: thumbnail mode never calls renderAsync (AC P4B-B)
    if (isThumbnail) return;

    let cancelled = false;

    async function render() {
      setIsLoading(true);
      setRenderError(null);

      try {
        // Fetch DOCX bytes via backend proxy; treat non-200 as error (AC P4B-C)
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Proxy returned ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();

        if (cancelled || !containerRef.current) return;

        // SECURITY MANDATE R6: fetchRelated:false prevents SSRF via URLs embedded
        // in the DOCX document. Cast needed because v0.3.7 typedefs omit this field.
        const renderOpts: DocxRenderOptions = {
          breakPages: true,
          ignoreWidth: true,
          fetchRelated: false,
        };

        await docx.renderAsync(
          buffer,
          containerRef.current,
          undefined,
          renderOpts as Partial<DocxOptions>,
        );

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "DOCX render failed";
          console.error("[DocxRenderer] Render error:", message);
          setRenderError(message);
          setIsLoading(false);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [src, isThumbnail]);

  // ── Thumbnail mode: document icon only, no renderAsync (AC P4B-B) ─────────
  if (isThumbnail) {
    return (
      <div
        aria-label="Word document"
        className={clsx(
          "flex items-center justify-center rounded border border-[var(--border)] bg-gray-50",
          "h-24",
          className,
        )}
      >
        <FileText aria-hidden className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  // ── Error state: show tile with download link (AC P4B-C) ──────────────────
  if (renderError !== null) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="DOCX failed to load"
        className={className}
      />
    );
  }

  // ── Full render ───────────────────────────────────────────────────────────
  return (
    <div
      className={clsx(
        "relative overflow-auto rounded border border-[var(--border)] bg-white",
        "min-h-40",
        className,
      )}
    >
      {isLoading && <DocxLoadingSkeleton />}
      <div
        ref={containerRef}
        aria-label="DOCX document"
        className={clsx("w-full", isLoading && "invisible")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function DocxLoadingSkeleton() {
  return (
    <div
      aria-label="Loading document…"
      aria-busy="true"
      className="absolute inset-0 flex items-center justify-center bg-white"
    >
      <div className="flex w-3/4 flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-3 animate-pulse rounded bg-gray-200",
              i === 0 ? "w-3/4" : i % 3 === 0 ? "w-1/2" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}
