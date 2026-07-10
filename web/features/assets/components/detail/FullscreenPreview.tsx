"use client";

/**
 * FullscreenPreview — layout wrapper around AssetViewer (mode="full", AS-IS).
 * Adds a fullscreen affordance that re-renders the viewer inside a fixed
 * overlay. Does not touch AssetViewer internals.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Maximize2, X } from "lucide-react";
import type { Asset } from "@/lib/types";
import { AssetViewer } from "../AssetViewer";

export interface FullscreenPreviewProps {
  asset: Asset;
  className?: string;
}

export function FullscreenPreview({ asset, className }: FullscreenPreviewProps) {
  const [fullscreen, setFullscreen] = React.useState(false);

  React.useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  return (
    <>
      <div className={clsx("relative group", className)}>
        <AssetViewer asset={asset} mode="full" className="w-full max-h-[62vh]" />
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="View fullscreen"
          title="View fullscreen"
          className={clsx(
            "absolute top-2 right-2 z-10 p-1.5 rounded-md",
            "bg-[var(--surface-raised)]/90 border border-[var(--border)] shadow-sm",
            "text-[var(--ink-muted)] hover:text-[var(--ink)]",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "transition-opacity duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
        >
          <Maximize2 aria-hidden className="w-4 h-4" />
        </button>
      </div>

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fullscreen preview: ${asset.title}`}
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--surface)]"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] shrink-0">
            <p className="text-sm font-semibold text-[var(--ink)] truncate flex-1">
              {asset.title}
            </p>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Close fullscreen preview"
              className={clsx(
                "p-1.5 rounded-md text-[var(--ink-muted)] hover:text-[var(--ink)]",
                "hover:bg-[var(--surface-sunken)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              )}
            >
              <X aria-hidden className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4">
            <AssetViewer asset={asset} mode="full" className="w-full h-full" />
          </div>
        </div>
      )}
    </>
  );
}
