"use client";

/**
 * VideoRenderer — native <video controls> playback for video assets.
 *
 * Security:
 * - No third-party player library — plain native <video> element only.
 * - src points at the safe asset-content proxy URL only (fetchRelated:false —
 *   no linked/remote resources are auto-fetched by the video element).
 * - The preview proxy (api/app/api/preview.py) streams via HTTP Range
 *   requests (206 Partial Content) so large blobs are not buffered whole
 *   before playback can start.
 * - Unsupported-codec / load failures fall back to ErrorTile with a download link.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Video as VideoIcon } from "lucide-react";
import { ErrorTile } from "./ErrorTile";

export interface VideoRendererProps {
  /** Proxied/resolved URL for the video content. */
  src: string;
  /** Filename/title used for accessible labeling. */
  filename: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  mode: "thumbnail" | "full";
  className?: string;
}

export function VideoRenderer({
  src,
  filename,
  originalUrl,
  mode,
  className,
}: VideoRendererProps) {
  const [hasError, setHasError] = React.useState(false);
  const isThumbnail = mode === "thumbnail";

  if (hasError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="Video format not supported by your browser"
        className={className}
      />
    );
  }

  const containerClass = clsx(
    "relative overflow-hidden rounded border border-[var(--border)] bg-gray-900 flex items-center justify-center",
    isThumbnail ? "h-24" : "h-64",
    className,
  );

  // Thumbnail mode: static icon only — no <video> element is mounted, so no
  // metadata/network request fires for every thumbnail in a grid/list view.
  if (isThumbnail) {
    return (
      <div className={containerClass}>
        <VideoIcon aria-hidden className="w-6 h-6 text-gray-300" />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        controls
        src={src}
        preload="metadata"
        aria-label={`Video preview of ${filename}`}
        className="max-h-full max-w-full"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
