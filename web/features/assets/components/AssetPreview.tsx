"use client";

/**
 * AssetPreview — renders a preview for an asset based on its MIME type.
 * Falls back to a type icon + metadata view when no preview URI is available.
 * Always has alt text or type fallback for accessibility.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  FileText,
  Image,
  FileVideo,
  FileAudio,
  FileCode2,
  Globe,
  File,
  Lock,
} from "lucide-react";
import type { Asset } from "@/lib/types";

// ============================================================
// Preview helpers
// ============================================================

type PreviewKind = "image" | "text" | "video" | "audio" | "code" | "url" | "generic" | "restricted";

function getPreviewKind(asset: Asset): PreviewKind {
  if (asset.agent_access === "none" || asset.agent_access === "metadata_only") {
    return "restricted";
  }
  const mime = asset.mime_type ?? "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "text/markdown" ||
    mime === "text/plain" ||
    mime.startsWith("text/")
  )
    return "text";
  if (
    mime === "application/json" ||
    mime === "text/yaml" ||
    mime.includes("xml") ||
    mime.includes("script")
  )
    return "code";
  if (asset.source_kind === "url") return "url";
  return "generic";
}

const KIND_ICON: Record<
  PreviewKind,
  { Icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  image: { Icon: Image, color: "text-purple-400", label: "Image" },
  text: { Icon: FileText, color: "text-blue-400", label: "Document" },
  video: { Icon: FileVideo, color: "text-rose-400", label: "Video" },
  audio: { Icon: FileAudio, color: "text-amber-400", label: "Audio" },
  code: { Icon: FileCode2, color: "text-emerald-400", label: "Code / Data" },
  url: { Icon: Globe, color: "text-sky-400", label: "Web Resource" },
  generic: { Icon: File, color: "text-gray-400", label: "File" },
  restricted: { Icon: Lock, color: "text-gray-400", label: "Access Restricted" },
};

// ============================================================
// AssetPreview
// ============================================================

export interface AssetPreviewProps {
  asset: Asset;
  /** Size of the preview area */
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}

export function AssetPreview({ asset, size = "md", className }: AssetPreviewProps) {
  const kind = getPreviewKind(asset);
  const kindInfo = KIND_ICON[kind];
  const { Icon } = kindInfo;

  const containerHeight = {
    sm: "h-24",
    md: "h-40",
    lg: "h-64",
    full: "h-full min-h-48",
  }[size];

  // Image preview
  if (kind === "image" && (asset.thumbnail_uri ?? asset.preview_text_uri)) {
    const src = asset.thumbnail_uri ?? asset.preview_text_uri!;
    return (
      <div
        className={clsx(
          "relative overflow-hidden rounded bg-gray-100 flex items-center justify-center border border-[var(--border)]",
          containerHeight,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Preview of ${asset.title}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // Text/code snippet preview
  if ((kind === "text" || kind === "code") && asset.preview_text_uri) {
    return (
      <div
        className={clsx(
          "relative overflow-hidden rounded bg-gray-50 border border-[var(--border)] p-3",
          containerHeight,
          className,
        )}
      >
        <pre className="text-[11px] font-mono text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap line-clamp-[12] overflow-hidden">
          {/* Content would be loaded via data fetching in a real implementation */}
          [Preview: {asset.title}]
        </pre>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent" aria-hidden />
      </div>
    );
  }

  // Fallback: type icon + metadata
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded",
        "bg-gray-50 border border-dashed border-[var(--border)]",
        containerHeight,
        className,
      )}
    >
      <Icon aria-hidden className={clsx("w-10 h-10", kindInfo.color)} />
      <div className="text-center px-4">
        <p className="text-xs font-medium text-[var(--ink)]">{kindInfo.label}</p>
        <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
          {kind === "restricted"
            ? "Preview restricted by access policy"
            : asset.mime_type ?? asset.source_kind}
        </p>
      </div>
    </div>
  );
}
