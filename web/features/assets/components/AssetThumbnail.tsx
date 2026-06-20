"use client";

/**
 * AssetThumbnail — compact type icon or image preview for asset cards/rows.
 * Always has alt text or type fallback for accessibility.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  FileText,
  Image,
  FileCode2,
  FileAudio,
  FileVideo,
  Globe,
  Package,
  Map,
  Layers,
  File,
} from "lucide-react";
import type { Asset } from "@/lib/types";

// ============================================================
// MIME → icon mapping
// ============================================================

function getAssetIcon(
  mimeType: string | null | undefined,
  sourceKind: Asset["source_kind"],
): { Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; color: string } {
  if (!mimeType) {
    if (sourceKind === "url") return { Icon: Globe, color: "text-sky-500" };
    return { Icon: File, color: "text-gray-400" };
  }

  if (mimeType.startsWith("image/")) return { Icon: Image, color: "text-purple-500" };
  if (mimeType.startsWith("video/")) return { Icon: FileVideo, color: "text-rose-500" };
  if (mimeType.startsWith("audio/")) return { Icon: FileAudio, color: "text-amber-500" };

  if (mimeType === "text/markdown") return { Icon: FileText, color: "text-blue-500" };
  if (mimeType === "text/plain") return { Icon: FileText, color: "text-gray-500" };
  if (mimeType === "application/json" || mimeType === "text/yaml" || mimeType.includes("xml"))
    return { Icon: FileCode2, color: "text-emerald-500" };
  if (mimeType === "application/pdf") return { Icon: FileText, color: "text-red-500" };
  if (mimeType.includes("zip") || mimeType.includes("tar") || mimeType.includes("archive"))
    return { Icon: Package, color: "text-orange-500" };

  return { Icon: File, color: "text-gray-400" };
}

// ============================================================
// AssetThumbnail
// ============================================================

export interface AssetThumbnailProps {
  asset: Pick<Asset, "title" | "mime_type" | "source_kind" | "thumbnail_uri">;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Override icon with a specific Lucide icon */
  overrideIcon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const sizeConfig = {
  xs: { container: "w-7 h-7", icon: "w-3.5 h-3.5", text: "text-[10px]" },
  sm: { container: "w-9 h-9", icon: "w-4.5 h-4.5", icon2: "w-4 h-4", text: "text-xs" },
  md: { container: "w-12 h-12", icon: "w-5 h-5", text: "text-sm" },
  lg: { container: "w-20 h-20", icon: "w-8 h-8", text: "text-base" },
};

// BOM slot icon
const BOMIcon = Map;
// Context pack icon
const PackIcon = Layers;

export function AssetThumbnail({
  asset,
  size = "sm",
  className,
  overrideIcon,
}: AssetThumbnailProps) {
  const { container, icon } = sizeConfig[size];

  // Image thumbnail if available
  if (asset.thumbnail_uri && asset.mime_type?.startsWith("image/")) {
    return (
      <div
        className={clsx(
          "rounded shrink-0 overflow-hidden bg-gray-100 border border-[var(--border)]",
          container,
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.thumbnail_uri}
          alt={`Thumbnail for ${asset.title}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const { Icon, color } = overrideIcon
    ? { Icon: overrideIcon, color: "text-gray-500" }
    : getAssetIcon(asset.mime_type, asset.source_kind);

  void BOMIcon;
  void PackIcon;

  return (
    <div
      aria-hidden
      className={clsx(
        "rounded shrink-0 flex items-center justify-center",
        "bg-gray-50 border border-[var(--border)]",
        container,
        className,
      )}
    >
      <Icon aria-hidden className={clsx(icon, color)} />
    </div>
  );
}
