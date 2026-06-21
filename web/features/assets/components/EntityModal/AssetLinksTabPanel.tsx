"use client";

/**
 * AssetLinksTabPanel — Links tab for the AssetTabRegistry.
 * Shows: asset URI, copy-link affordance, and asset link targets.
 */

import * as React from "react";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { useAsset } from "@/lib/hooks/useAssets";
import { Button } from "@/components/ui/Button";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function AssetLinksTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data: asset, isLoading } = useAsset(entityId);
  const [copied, setCopied] = React.useState(false);

  if (isLoading) return <PanelSkeleton />;

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Asset not found.
      </div>
    );
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(
      `${window.location.origin}/projects/${projectId}/assets/${entityId}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Source URI */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
          Source URI
        </p>
        <div className="flex items-start gap-2">
          <a
            href={asset.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-xs text-blue-600 hover:underline flex items-center gap-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <Link2 aria-hidden className="w-3 h-3 shrink-0" />
            <span className="truncate">{asset.uri}</span>
            <ExternalLink aria-hidden className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>

      {/* Page link */}
      <div className="px-4 py-3 flex items-center gap-2">
        <a
          href={`/projects/${projectId}/assets/${entityId}`}
          className="flex-1 flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ExternalLink aria-hidden className="w-3.5 h-3.5 shrink-0" />
          Open asset detail page
        </a>
        <Button
          size="xs"
          variant="ghost"
          iconLeft={<Copy aria-hidden className="w-3 h-3" />}
          onClick={handleCopyLink}
          aria-label="Copy link to this asset"
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </div>

      {/* Storage URI (if different) */}
      {asset.storage_uri && asset.storage_uri !== asset.uri && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
            Storage URI
          </p>
          <span className="font-mono text-[11px] text-[var(--ink-muted)] break-all">
            {asset.storage_uri}
          </span>
        </div>
      )}

      {/* Graph links placeholder */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
          Asset graph
        </p>
        <p className="text-xs text-[var(--ink-faint)]">
          Graph link view available in P5 (Graph Explorer).
        </p>
      </div>
    </div>
  );
}
