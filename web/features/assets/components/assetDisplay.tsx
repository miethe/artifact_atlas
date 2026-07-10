"use client";

/**
 * assetDisplay — feature-local display helpers shared by the asset library
 * views (card, board, timeline, drawer).
 *
 * Centralizes: source labels/icons/accents, file-type badge derivation,
 * byte formatting, relative time, and metadata accessors (tags, starred,
 * comment count).
 */

import * as React from "react";
import {
  Archive,
  Bot,
  Cloud,
  FileText,
  Frame,
  GitBranch,
  Globe,
  HardDrive,
  Image as ImageIcon,
  MessageSquare,
  PenTool,
  Share2,
  Sparkles,
  User,
} from "lucide-react";
import type { Asset } from "@/lib/types";

// ============================================================
// Bytes
// ============================================================

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// Relative time
// ============================================================

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  if (day < 365) return `${Math.floor(day / 30)}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/** Most recent "updated" timestamp available on the asset. */
export function updatedAt(asset: Asset): string | null {
  return (
    asset.source_updated_at ??
    asset.last_indexed_at ??
    null
  );
}

// ============================================================
// Source kind — label / icon / accent
// ============================================================

const SOURCE_LABELS: Record<Asset["source_kind"], string> = {
  vault: "Vault",
  local: "Local",
  chatgpt: "ChatGPT",
  claude: "Claude",
  figma: "Figma",
  canva: "Canva",
  drive: "Drive",
  sharepoint: "SharePoint",
  github: "GitHub",
  notion: "Notion",
  url: "URL",
  eagle: "Eagle",
  tagspaces: "TagSpaces",
  immich: "Immich",
  nextcloud: "Nextcloud",
  manual: "Manual",
};

export function sourceLabel(kind: Asset["source_kind"]): string {
  return SOURCE_LABELS[kind] ?? kind;
}

const SOURCE_ICONS: Record<Asset["source_kind"], React.ComponentType<{ className?: string }>> = {
  vault: Archive,
  local: HardDrive,
  chatgpt: MessageSquare,
  claude: Sparkles,
  figma: Frame,
  canva: PenTool,
  drive: Cloud,
  sharepoint: Share2,
  github: GitBranch,
  notion: FileText,
  url: Globe,
  eagle: ImageIcon,
  tagspaces: FileText,
  immich: ImageIcon,
  nextcloud: Cloud,
  manual: User,
};

export function SourceIcon({
  kind,
  className,
}: {
  kind: Asset["source_kind"];
  className?: string;
}) {
  const Icon = SOURCE_ICONS[kind] ?? Bot;
  return <Icon className={className} aria-hidden />;
}

/** Maps source_kind to a border-l-{color} accent class for the left bar. */
export function sourceKindAccent(kind: Asset["source_kind"]): string {
  const MAP: Record<Asset["source_kind"], string> = {
    vault: "border-l-blue-500",
    local: "border-l-slate-400",
    chatgpt: "border-l-green-500",
    claude: "border-l-orange-500",
    figma: "border-l-purple-500",
    canva: "border-l-pink-500",
    drive: "border-l-yellow-500",
    sharepoint: "border-l-sky-600",
    github: "border-l-gray-600",
    notion: "border-l-gray-500",
    url: "border-l-sky-400",
    eagle: "border-l-amber-500",
    tagspaces: "border-l-teal-500",
    immich: "border-l-blue-400",
    nextcloud: "border-l-blue-600",
    manual: "border-l-slate-300",
  };
  return MAP[kind] ?? "border-l-gray-300";
}

// ============================================================
// File-type badge (thumbnail overlay)
// ============================================================

export interface TypeBadgeInfo {
  /** Short label, e.g. "PDF", "MD", "PNG". */
  label: string;
  /** Tailwind classes for the badge square. */
  className: string;
}

/** Derive a compact file-type badge from mime type / uri extension. */
export function typeBadge(asset: Asset): TypeBadgeInfo | null {
  const mime = asset.mime_type ?? "";
  const ext = (asset.uri ?? "").split("?")[0].split(".").pop()?.toLowerCase() ?? "";

  if (mime === "application/pdf" || ext === "pdf") {
    return { label: "PDF", className: "bg-red-600 text-white" };
  }
  if (asset.source_kind === "figma" || ext === "fig") {
    return { label: "FIG", className: "bg-purple-600 text-white" };
  }
  if (
    mime.includes("presentation") ||
    ext === "pptx" ||
    ext === "ppt" ||
    ext === "key"
  ) {
    return { label: "PPT", className: "bg-orange-600 text-white" };
  }
  if (mime === "text/markdown" || ext === "md" || ext === "mdx") {
    return { label: "MD", className: "bg-gray-800 text-white" };
  }
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return { label: ext ? ext.toUpperCase().slice(0, 4) : "IMG", className: "bg-sky-600 text-white" };
  }
  if (mime.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext)) {
    return { label: ext ? ext.toUpperCase().slice(0, 4) : "VID", className: "bg-violet-600 text-white" };
  }
  if (mime === "text/html" || ext === "html") {
    return { label: "HTML", className: "bg-amber-600 text-white" };
  }
  if (["puml", "drawio", "mermaid", "mmd"].includes(ext)) {
    return { label: ext.toUpperCase().slice(0, 6), className: "bg-teal-600 text-white" };
  }
  if (["json", "yaml", "yml", "toml", "csv"].includes(ext)) {
    return { label: ext.toUpperCase(), className: "bg-slate-600 text-white" };
  }
  if (["ts", "tsx", "js", "jsx", "py", "go", "rs", "sh"].includes(ext)) {
    return { label: ext.toUpperCase(), className: "bg-indigo-600 text-white" };
  }
  if (mime.startsWith("text/") || ext === "txt") {
    return { label: "TXT", className: "bg-gray-500 text-white" };
  }
  if (ext) {
    return { label: ext.toUpperCase().slice(0, 4), className: "bg-gray-600 text-white" };
  }
  return null;
}

/** Human-readable type label for detail rows (e.g. "PDF Document"). */
export function typeLabel(asset: Asset): string {
  const badge = typeBadge(asset);
  if (asset.artifact_type_id) return asset.artifact_type_id;
  if (badge) return badge.label;
  return asset.mime_type ?? "—";
}

// ============================================================
// Metadata accessors
// ============================================================

/** Tag list from metadata.tags (string array) — the canonical tag store. */
export function assetTags(asset: Asset): string[] {
  const raw = asset.metadata?.tags;
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string");
  }
  if (typeof raw === "string" && raw.length) {
    return raw.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [];
}

export function isStarred(asset: Asset): boolean {
  return asset.metadata?.starred === true;
}

/** Comment count if data exists (metadata.comment_count or comments array). */
export function commentCount(asset: Asset): number | null {
  const meta = asset.metadata;
  if (!meta) return null;
  if (typeof meta.comment_count === "number") return meta.comment_count;
  if (Array.isArray(meta.comments)) return meta.comments.length;
  return null;
}
