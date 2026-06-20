"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  FileText,
  Image as ImageIcon,
  Link2,
  File,
  ExternalLink,
  Info,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { TagChip } from "@/components/ui/TagChip";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InboxItem } from "@/lib/types";

// ============================================================
// InboxPreviewPane — right pane showing selected item preview
// ============================================================

interface InboxPreviewPaneProps {
  item: InboxItem | null;
}

function MimePreview({ item }: { item: InboxItem }) {
  const mime = item.mime_type ?? "";

  if (item.thumbnail_uri) {
    return (
      <div className="relative w-full aspect-video bg-[var(--surface-sunken)] rounded overflow-hidden border border-[var(--border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail_uri}
          alt={`Preview of ${item.title}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (mime.startsWith("image/")) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-[var(--surface-sunken)] rounded border border-[var(--border)] border-dashed gap-2">
        <ImageIcon aria-hidden className="w-8 h-8 text-gray-300" />
        <span className="text-xs text-[var(--ink-faint)]">Image preview unavailable</span>
      </div>
    );
  }

  if (mime.startsWith("text/") || mime.includes("markdown") || mime.includes("yaml") || mime.includes("json")) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-[var(--surface-sunken)] rounded border border-[var(--border)] border-dashed gap-2">
        <FileText aria-hidden className="w-8 h-8 text-gray-300" />
        <span className="text-xs text-[var(--ink-faint)]">{mime || "Text document"}</span>
      </div>
    );
  }

  if (mime.includes("url") || item.uri.startsWith("http")) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-[var(--surface-sunken)] rounded border border-[var(--border)] border-dashed gap-2">
        <Link2 aria-hidden className="w-8 h-8 text-purple-300" />
        <span className="text-xs text-[var(--ink-faint)] max-w-full px-3 truncate">{item.uri}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-32 bg-[var(--surface-sunken)] rounded border border-[var(--border)] border-dashed gap-2">
      <File aria-hidden className="w-8 h-8 text-gray-300" />
      <span className="text-xs text-[var(--ink-faint)]">{mime || "Unknown file type"}</span>
    </div>
  );
}

export function InboxPreviewPane({ item }: InboxPreviewPaneProps) {
  if (!item) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <EmptyState
          icon={<Info className="w-8 h-8" aria-hidden />}
          title="No item selected"
          description="Select an inbox item to preview its details and classify it."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <h2 className="text-sm font-semibold text-[var(--ink)] leading-snug line-clamp-2">
          {item.title}
        </h2>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StatusBadge status={item.status} size="xs" showDot />
          <SensitivityBadge sensitivity={item.sensitivity} size="xs" />
          {item.source_kind && (
            <TagChip label={item.source_kind} size="xs" color="purple" />
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Visual preview */}
        <MimePreview item={item} />

        {/* Metadata rows */}
        <MetaRow label="URI">
          <a
            href={item.uri}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "text-xs text-blue-600 hover:underline flex items-center gap-1 min-w-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
            )}
          >
            <span className="truncate">{item.uri}</span>
            <ExternalLink aria-hidden className="w-3 h-3 shrink-0" />
          </a>
        </MetaRow>

        <MetaRow label="MIME Type">
          <span className="text-xs text-[var(--ink-muted)] font-mono">
            {item.mime_type ?? "—"}
          </span>
        </MetaRow>

        <MetaRow label="Captured">
          <span className="text-xs text-[var(--ink-muted)]">
            {new Date(item.captured_at).toLocaleString()}
          </span>
        </MetaRow>

        {item.suggested_artifact_type_id && (
          <MetaRow label="Suggested Type">
            <TagChip label={item.suggested_artifact_type_id.replace("artifact_type_", "")} size="xs" color="blue" />
          </MetaRow>
        )}

        {item.suggested_intenttree_node_id && (
          <MetaRow label="Suggested Node">
            <TagChip label={item.suggested_intenttree_node_id} size="xs" color="default" />
          </MetaRow>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MetaRow — label/value pair
// ============================================================

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] font-medium text-[var(--ink-faint)] uppercase tracking-wider w-20 shrink-0 pt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
