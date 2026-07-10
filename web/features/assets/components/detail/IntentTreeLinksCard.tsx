"use client";

/**
 * IntentTreeLinksCard — lists the asset's intenttree_node links
 * (real data via GET /api/assets/{id}/links) with a "Link node" action.
 * Other link target types are summarised in a compact footer row.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Network, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AssetLink } from "@/lib/types";
import { useAssetLinks } from "../../detailApi";
import { NodeLinkChip } from "../NodeLinkChip";
import { DetailCard, NotSet, relativeTime } from "./shared";

export interface IntentTreeLinksCardProps {
  assetId: string;
  /** Opens the Link-to-Node dialog (owned by ActionRow / parent). */
  onLinkNode: () => void;
  className?: string;
}

export function IntentTreeLinksCard({
  assetId,
  onLinkNode,
  className,
}: IntentTreeLinksCardProps) {
  const { data, isLoading } = useAssetLinks(assetId);
  const links = data?.items ?? [];
  const nodeLinks = links.filter((l) => l.target_type === "intenttree_node");
  const otherLinks = links.filter((l) => l.target_type !== "intenttree_node");

  return (
    <DetailCard
      title={`IntentTree Links${nodeLinks.length > 0 ? ` (${nodeLinks.length})` : ""}`}
      icon={Network}
      className={className}
      action={
        <Button
          size="xs"
          variant="ghost"
          onClick={onLinkNode}
          iconLeft={<Plus aria-hidden className="w-3 h-3" />}
        >
          Link node
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-xs text-[var(--ink-muted)]">Loading links…</p>
      ) : nodeLinks.length === 0 ? (
        <div className="py-1">
          <NotSet onAdd={onLinkNode} label="No IntentTree links yet" />
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Link this asset to the IntentTree nodes it supports.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {nodeLinks.map((link: AssetLink) => (
            <li key={link.id} className="flex items-center gap-2 min-w-0">
              <span
                className={clsx(
                  "shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold",
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                )}
              >
                {link.target_id}
              </span>
              <span className="text-xs text-[var(--ink)] truncate flex-1 capitalize">
                {link.relationship.replace(/_/g, " ")}
              </span>
              {link.created_at && (
                <span className="text-[10px] text-[var(--ink-faint)] shrink-0">
                  {relativeTime(link.created_at)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {otherLinks.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[var(--border)]/60">
          <p className="text-[10px] font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
            Other links
          </p>
          <div className="flex flex-wrap gap-1.5">
            {otherLinks.map((link) => (
              <NodeLinkChip key={link.id} link={link} size="xs" />
            ))}
          </div>
        </div>
      )}
    </DetailCard>
  );
}
