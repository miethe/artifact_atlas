"use client";

/**
 * InboxItemLinksTabPanel — Links tab for InboxItemTabRegistry (P2B-005).
 * Shows: source URI, suggested artifact type / intenttree node, copy link.
 */

import * as React from "react";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { useInboxItems } from "@/lib/hooks/useInbox";
import { Button } from "@/components/ui/Button";
import { TagChip } from "@/components/ui/TagChip";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function InboxItemLinksTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data, isLoading } = useInboxItems(projectId);
  const item = data?.items.find((i) => i.id === entityId);
  const [copied, setCopied] = React.useState(false);

  if (isLoading) return <PanelSkeleton />;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Item not found.
      </div>
    );
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(
      `${window.location.origin}/projects/${projectId}/inbox/${entityId}`,
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
        <a
          href={item.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <Link2 aria-hidden className="w-3 h-3 shrink-0" />
          <span className="truncate">{item.uri}</span>
          <ExternalLink aria-hidden className="w-3 h-3 shrink-0" />
        </a>
      </div>

      {/* Suggestions */}
      {(item.suggested_artifact_type_id || item.suggested_intenttree_node_id) && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
            Suggested links
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.suggested_artifact_type_id && (
              <TagChip
                label={`Type: ${item.suggested_artifact_type_id.replace("artifact_type_", "")}`}
                size="xs"
                color="blue"
              />
            )}
            {item.suggested_intenttree_node_id && (
              <TagChip
                label={`Node: ${item.suggested_intenttree_node_id}`}
                size="xs"
                color="default"
              />
            )}
          </div>
        </div>
      )}

      {/* Copy link */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--ink-muted)]">Share this item</span>
        <Button
          size="xs"
          variant="ghost"
          iconLeft={<Copy aria-hidden className="w-3 h-3" />}
          onClick={handleCopyLink}
          aria-label="Copy link to inbox item"
        >
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}
