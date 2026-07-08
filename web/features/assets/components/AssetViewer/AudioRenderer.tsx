"use client";

/**
 * AudioRenderer — native <audio controls> playback for audio assets.
 *
 * Security:
 * - No third-party waveform/metadata library — plain native <audio> element only.
 * - src points at the safe asset-content proxy URL only (fetchRelated:false —
 *   no linked/remote resources are auto-fetched by the audio element).
 * - Filename is rendered as a plain text node (React-escaped — never innerHTML).
 * - Unsupported-codec / load failures fall back to ErrorTile with a download link.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Music } from "lucide-react";
import { ErrorTile } from "./ErrorTile";

export interface AudioRendererProps {
  /** Proxied/resolved URL for the audio content. */
  src: string;
  /** Filename/title to display above the player. */
  filename: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  mode: "thumbnail" | "full";
  className?: string;
}

export function AudioRenderer({
  src,
  filename,
  originalUrl,
  mode,
  className,
}: AudioRendererProps) {
  const [hasError, setHasError] = React.useState(false);
  const isThumbnail = mode === "thumbnail";

  if (hasError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="Audio format not supported by your browser"
        className={className}
      />
    );
  }

  const containerClass = clsx(
    "flex flex-col items-center justify-center gap-2 rounded border border-[var(--border)] bg-gray-50",
    isThumbnail ? "h-24 p-2" : "h-auto min-h-40 p-4",
    className,
  );

  // Thumbnail mode: compact icon + filename only — no interactive controls
  // (avoids loading N audio elements at once in a grid/list view).
  if (isThumbnail) {
    return (
      <div className={containerClass}>
        <Music aria-hidden className="w-6 h-6 text-[var(--ink-muted)]" />
        <span className="text-[10px] text-[var(--ink-muted)] truncate max-w-full">
          {filename}
        </span>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Music aria-hidden className="w-8 h-8 text-[var(--ink-muted)]" />
      <p className="text-xs font-medium text-[var(--ink)] truncate max-w-full">{filename}</p>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        controls
        src={src}
        aria-label={`Audio player for ${filename}`}
        className="w-full max-w-sm"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
