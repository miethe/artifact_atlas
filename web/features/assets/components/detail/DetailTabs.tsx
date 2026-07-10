"use client";

/**
 * DetailTabs — Details / Metadata / Tags tab group (middle column, per mockup).
 *
 * Details  — source, type, format, dimensions, size, created by, last modified.
 * Metadata — remaining metadata dict entries + full edit dialog.
 * Tags     — metadata.tags with add/remove persisted via PATCH.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Edit2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TagChip } from "@/components/ui/TagChip";
import type { Asset } from "@/lib/types";
import { readDetailMeta, useMergeAssetMetadata } from "../../detailApi";
import { MetadataEditDialog } from "../MetadataEditForm";
import {
  Avatar,
  DetailCard,
  FieldRow,
  detailInputClass,
  formatBytes,
  formatDateTime,
  NotSet,
} from "./shared";

// ============================================================
// Source label map (mirrors ProvenancePanel labels)
// ============================================================

const SOURCE_LABELS: Record<Asset["source_kind"], string> = {
  vault: "Vault",
  local: "Local file",
  chatgpt: "ChatGPT",
  claude: "Claude",
  figma: "Figma",
  canva: "Canva",
  drive: "Google Drive",
  sharepoint: "SharePoint",
  github: "GitHub",
  notion: "Notion",
  url: "Web URL",
  eagle: "Eagle",
  tagspaces: "TagSpaces",
  immich: "Immich",
  nextcloud: "Nextcloud",
  manual: "Manual entry",
};

/** Convention keys rendered elsewhere in the detail view. */
const STRUCTURED_KEYS = new Set([
  "provenance",
  "annotations",
  "associations",
  "policy",
  "ai_summary",
  "tags",
]);

type TabKey = "details" | "metadata" | "tags";

export interface DetailTabsProps {
  asset: Asset;
  className?: string;
}

export function DetailTabs({ asset, className }: DetailTabsProps) {
  const [tab, setTab] = React.useState<TabKey>("details");
  const [editOpen, setEditOpen] = React.useState(false);
  const meta = readDetailMeta(asset);
  const { merge, isPending } = useMergeAssetMetadata(asset);

  // ----- Tags editing -----
  const [newTag, setNewTag] = React.useState("");

  function addTag(e: React.FormEvent) {
    e.preventDefault();
    const tag = newTag.trim();
    if (!tag || meta.tags.includes(tag)) return;
    merge({ tags: [...meta.tags, tag] }, { onSuccess: () => setNewTag("") });
  }

  function removeTag(tag: string) {
    merge({ tags: meta.tags.filter((t) => t !== tag) });
  }

  // ----- Metadata entries (excluding structured conventions) -----
  const metadataEntries = Object.entries(asset.metadata ?? {}).filter(
    ([k]) => !STRUCTURED_KEYS.has(k),
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "metadata", label: "Metadata" },
    { key: "tags", label: "Tags" },
  ];

  return (
    <DetailCard
      title=""
      className={className}
      bodyClassName="pt-0"
      action={
        tab === "metadata" ? (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setEditOpen(true)}
            iconLeft={<Edit2 aria-hidden className="w-3 h-3" />}
          >
            Edit
          </Button>
        ) : undefined
      }
      titleSuffix={
        <div role="tablist" aria-label="Asset details" className="flex items-center gap-1 -ml-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-[100ms]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                tab === t.key
                  ? "bg-blue-600/10 text-blue-600"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {tab === "details" && (
        <div className="divide-y divide-[var(--border)]/60">
          <FieldRow
            label="Source"
            value={
              <span className="inline-flex items-center gap-1.5">
                {SOURCE_LABELS[asset.source_kind] ?? asset.source_kind}
                {asset.captured_at && (
                  <span className="text-[var(--ink-muted)]">
                    · {formatDateTime(asset.captured_at)}
                  </span>
                )}
              </span>
            }
          />
          <FieldRow
            label="Type"
            value={asset.artifact_type_id?.replace(/[_-]/g, " ") ?? null}
          />
          <FieldRow
            label="Format"
            value={asset.mime_type}
            monospace
          />
          <FieldRow label="Dimensions" value={meta.dimensions} />
          <FieldRow label="Size" value={formatBytes(asset.size_bytes)} />
          <FieldRow
            label="Created by"
            value={
              asset.created_by ? (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={asset.created_by} size="xs" />
                  {asset.created_by}
                </span>
              ) : null
            }
          />
          <FieldRow
            label="Last modified"
            value={formatDateTime(
              asset.source_updated_at ?? asset.last_indexed_at,
            )}
          />
        </div>
      )}

      {tab === "metadata" && (
        <div>
          {metadataEntries.length === 0 ? (
            <div className="py-3 text-center">
              <NotSet label="No custom metadata" />
              <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                Use Edit to update title, description, status, and policy fields.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]/60">
              {metadataEntries.map(([key, value]) => (
                <FieldRow
                  key={key}
                  label={key.replace(/[_-]/g, " ")}
                  value={
                    typeof value === "string" || typeof value === "number"
                      ? String(value)
                      : JSON.stringify(value)
                  }
                  monospace={typeof value !== "string"}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "tags" && (
        <div className="space-y-3">
          {meta.tags.length === 0 ? (
            <NotSet label="No tags yet" />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {meta.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-0.5">
                  <TagChip label={tag} size="sm" />
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    disabled={isPending}
                    className={clsx(
                      "p-0.5 rounded text-[var(--ink-faint)] hover:text-red-600",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    )}
                  >
                    <X aria-hidden className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form onSubmit={addTag} className="flex items-center gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag…"
              aria-label="New tag"
              className={clsx(detailInputClass, "flex-1")}
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={!newTag.trim() || isPending}
              iconLeft={<Plus aria-hidden className="w-3.5 h-3.5" />}
            >
              Add
            </Button>
          </form>
        </div>
      )}

      <MetadataEditDialog
        asset={asset}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </DetailCard>
  );
}
