"use client";

/**
 * AssetDetailsTabPanel — Details tab for the AssetTabRegistry.
 * Shows: source, MIME, size, captured date, tags, provenance.
 * Owns the MetadataEditDialog for in-modal editing.
 */

import * as React from "react";
import { Edit2 } from "lucide-react";
import { useAsset } from "@/lib/hooks/useAssets";
import { TagChip } from "@/components/ui/TagChip";
import { Button } from "@/components/ui/Button";
import { ProvenancePanel } from "../ProvenancePanel";
import { MetadataEditDialog } from "../MetadataEditForm";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
        {label}
      </p>
      <div className="text-xs text-[var(--ink)]">{children}</div>
    </div>
  );
}

export default function AssetDetailsTabPanel({
  entityId,
  projectId: _projectId,
}: TabPanelProps) {
  const { data: asset, isLoading } = useAsset(entityId);
  const [editOpen, setEditOpen] = React.useState(false);

  if (isLoading) return <PanelSkeleton />;

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Asset not found.
      </div>
    );
  }

  const tags = asset.metadata
    ? Object.entries(asset.metadata)
        .filter(([, v]) => typeof v === "string")
        .map(([k]) => k)
        .slice(0, 8)
    : [];

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Details fields */}
      <div className="px-4 py-3 space-y-3">
        <FieldRow label="Source">{asset.source_kind}</FieldRow>
        <FieldRow label="MIME">
          <span className="font-mono text-[11px]">{asset.mime_type ?? "—"}</span>
        </FieldRow>
        {asset.size_bytes != null && (
          <FieldRow label="Size">
            {asset.size_bytes < 1024 * 1024
              ? `${(asset.size_bytes / 1024).toFixed(0)} KB`
              : `${(asset.size_bytes / (1024 * 1024)).toFixed(1)} MB`}
          </FieldRow>
        )}
        <FieldRow label="Captured">
          {new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(new Date(asset.captured_at))}
        </FieldRow>
        {asset.artifact_type_id && (
          <FieldRow label="Artifact type">
            <span className="font-mono text-[11px]">{asset.artifact_type_id}</span>
          </FieldRow>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1.5">
            Tags
          </p>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagChip key={tag} label={tag} size="xs" />
            ))}
          </div>
        </div>
      )}

      {/* Provenance */}
      <div className="px-4 py-3">
        <ProvenancePanel asset={asset} collapsed />
      </div>

      {/* Edit action */}
      <div className="px-4 py-3">
        <Button
          size="xs"
          variant="secondary"
          iconLeft={<Edit2 aria-hidden className="w-3 h-3" />}
          onClick={() => setEditOpen(true)}
        >
          Edit metadata
        </Button>
      </div>

      {/* In-panel MetadataEditDialog (self-contained) */}
      <MetadataEditDialog
        asset={asset}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
