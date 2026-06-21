"use client";

/**
 * ErrorTile — shared error tile shown on any renderer failure or non-200 proxy response.
 * Provides a download link to the original asset URL.
 */

import * as React from "react";
import { AlertCircle, Download } from "lucide-react";
import { clsx } from "clsx";

export interface ErrorTileProps {
  /** URL for the download link (original asset URL). */
  originalUrl?: string | null;
  mode?: "thumbnail" | "full";
  /** Optional custom message. */
  message?: string;
  className?: string;
}

export function ErrorTile({
  originalUrl,
  mode = "full",
  message = "Failed to load",
  className,
}: ErrorTileProps) {
  const isThumbnail = mode === "thumbnail";

  return (
    <div
      role="status"
      aria-label={message}
      className={clsx(
        "flex flex-col items-center justify-center gap-2 rounded border border-dashed border-[var(--border)]",
        "bg-gray-50 text-[var(--ink-muted)]",
        isThumbnail ? "h-24 p-2" : "h-40 p-4",
        className,
      )}
    >
      <AlertCircle aria-hidden className={clsx("shrink-0 text-amber-500", isThumbnail ? "w-4 h-4" : "w-6 h-6")} />
      {!isThumbnail && (
        <>
          <p className="text-xs font-medium text-[var(--ink)]">{message}</p>
          {originalUrl && (
            <a
              href={originalUrl}
              download
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline focus:underline outline-none"
            >
              <Download aria-hidden className="w-3 h-3" />
              Download original
            </a>
          )}
        </>
      )}
    </div>
  );
}
