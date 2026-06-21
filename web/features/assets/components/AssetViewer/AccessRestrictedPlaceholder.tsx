"use client";

/**
 * AccessRestrictedPlaceholder — shown when asset.agent_access is "none",
 * "metadata_only", or absent. No file fetch occurs when this is rendered.
 */

import * as React from "react";
import { Lock } from "lucide-react";
import { clsx } from "clsx";

export interface AccessRestrictedPlaceholderProps {
  className?: string;
  mode?: "thumbnail" | "full";
}

export function AccessRestrictedPlaceholder({
  className,
  mode = "full",
}: AccessRestrictedPlaceholderProps) {
  const isThumbnail = mode === "thumbnail";

  return (
    <div
      role="status"
      aria-label="Content access restricted"
      className={clsx(
        "flex flex-col items-center justify-center gap-2 rounded border border-dashed border-[var(--border)]",
        "bg-gray-50 text-[var(--ink-muted)]",
        isThumbnail ? "h-24 p-2" : "h-40 p-4",
        className,
      )}
    >
      <Lock
        aria-hidden
        className={clsx("shrink-0 text-gray-400", isThumbnail ? "w-5 h-5" : "w-7 h-7")}
      />
      {!isThumbnail && (
        <>
          <p className="text-xs font-medium text-[var(--ink)]">Access Restricted</p>
          <p className="text-[11px] text-center text-[var(--ink-muted)]">
            Preview restricted by access policy
          </p>
        </>
      )}
    </div>
  );
}
