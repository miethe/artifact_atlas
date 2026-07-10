"use client";

/**
 * RelatedAssetsStrip — thumbnail cards for assets related to this one
 * (variant_of, derived_from, references, …) built from real
 * AssetRelationship data. Empty state when none are recorded.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Layers } from "lucide-react";
import Link from "next/link";
import type { Asset } from "@/lib/types";
import { type AssetRelationship } from "../../detailApi";
import { AssetThumbnail } from "../AssetThumbnail";
import { DetailCard, NotSet } from "./shared";

const REL_LABELS: Record<AssetRelationship["relationship_type"], string> = {
  variant_of: "Variant",
  derived_from: "Derived",
  references: "Reference",
  duplicates: "Duplicate",
  supersedes: "Supersedes",
  superseded_by: "Superseded by",
  evidence_for: "Evidence",
  input_to: "Input",
  output_of: "Output",
};

export interface RelatedAssetsStripProps {
  asset: Asset;
  projectId: string;
  relationships: AssetRelationship[];
  relatedAssets: Asset[];
  isLoading?: boolean;
  className?: string;
}

export function RelatedAssetsStrip({
  asset,
  projectId,
  relationships,
  relatedAssets,
  isLoading,
  className,
}: RelatedAssetsStripProps) {
  const byId = new Map(relatedAssets.map((a) => [a.id, a]));

  const entries = relationships
    .map((rel) => {
      const counterpartId =
        rel.source_asset_id === asset.id ? rel.target_asset_id : rel.source_asset_id;
      const counterpart = byId.get(counterpartId);
      return counterpart ? { rel, counterpart } : null;
    })
    .filter((e): e is { rel: AssetRelationship; counterpart: Asset } => e !== null);

  return (
    <div id="related-assets" className={className}>
      <DetailCard
        title={`Related Assets${entries.length > 0 ? ` (${entries.length})` : ""}`}
        icon={Layers}
      >
        {isLoading ? (
          <p className="text-xs text-[var(--ink-muted)]">Loading related assets…</p>
        ) : entries.length === 0 ? (
          <div className="py-1">
            <NotSet label="No related assets yet" />
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">
              Variants, derivations, and references appear here once asset
              relationships are recorded.
            </p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {entries.map(({ rel, counterpart }) => (
              <Link
                key={rel.id}
                href={`/projects/${counterpart.project_id ?? projectId}/assets/${counterpart.id}`}
                className={clsx(
                  "shrink-0 w-36 rounded-lg border border-[var(--border)] overflow-hidden",
                  "bg-[var(--surface)] hover:border-blue-400 hover:shadow-sm",
                  "transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                )}
                title={counterpart.title}
              >
                <div className="h-20 bg-[var(--surface-sunken)] flex items-center justify-center border-b border-[var(--border)]/60">
                  <AssetThumbnail asset={counterpart} size="lg" />
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-medium text-[var(--ink)] truncate">
                    {counterpart.title}
                  </p>
                  <p className="text-[10px] text-[var(--ink-faint)]">
                    {REL_LABELS[rel.relationship_type] ?? rel.relationship_type}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
}
