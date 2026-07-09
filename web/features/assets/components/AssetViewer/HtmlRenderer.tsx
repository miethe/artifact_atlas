"use client";

/**
 * HtmlRenderer — sandboxed iframe view for text/html assets.
 *
 * Security:
 * - Full mode: sandbox="allow-scripts". allow-same-origin is NEVER set, so a
 *   script inside the frame cannot reach into the app's origin (cookies, local
 *   storage, parent DOM).
 * - Thumbnail mode: sandbox="" (no scripts), pointer-events-none, tabIndex=-1
 *   so the preview reads as a static image and cannot be interacted with.
 * - Iframe onError falls back to the shared ErrorTile with a download link.
 */

import * as React from "react";
import { clsx } from "clsx";
import { ExternalLink } from "lucide-react";
import { ErrorTile } from "./ErrorTile";

export interface HtmlRendererProps {
  /** URL of the sandboxed HTML preview endpoint. */
  src: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  /** Human-readable label, used for the iframe title. */
  title: string;
  mode: "thumbnail" | "full";
  className?: string;
}

export function HtmlRenderer({ src, originalUrl, title, mode, className }: HtmlRendererProps) {
  const [loadError, setLoadError] = React.useState(false);
  const isThumbnail = mode === "thumbnail";

  if (loadError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="HTML preview failed to load"
        className={className}
      />
    );
  }

  if (isThumbnail) {
    return (
      <div
        className={clsx(
          "relative overflow-hidden rounded border border-[var(--border)] bg-white",
          "h-24",
          className,
        )}
      >
        <iframe
          src={src}
          title={`Preview of ${title}`}
          sandbox=""
          tabIndex={-1}
          onError={() => setLoadError(true)}
          className="pointer-events-none h-full w-full origin-top-left"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded border border-[var(--border)] bg-white",
        "h-[70vh]",
        className,
      )}
    >
      <iframe
        src={src}
        title={`HTML preview of ${title}`}
        sandbox="allow-scripts"
        onError={() => setLoadError(true)}
        className="h-full w-full"
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full",
          "border border-[var(--border)] bg-white/95 px-2.5 py-1 text-xs font-medium text-[var(--ink)]",
          "shadow-sm backdrop-blur hover:bg-gray-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
      >
        <ExternalLink aria-hidden className="h-3 w-3" />
        Open in new tab
      </a>
    </div>
  );
}
