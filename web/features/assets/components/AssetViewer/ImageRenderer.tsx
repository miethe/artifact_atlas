"use client";

/**
 * ImageRenderer — renders raster images (png/jpg/gif/webp) via next/image,
 * and SVG via <img src={proxiedUrl}> ONLY. Never uses dangerouslySetInnerHTML.
 *
 * Security:
 * - SVG: rendered via <img> tag only — no innerHTML, no inline SVG execution.
 * - Raster: uses next/image with unoptimized=true (no remotePatterns required in MVP).
 * - Error tile + download link on non-200 or load failure.
 */

import * as React from "react";
import NextImage from "next/image";
import { clsx } from "clsx";
import { ErrorTile } from "./ErrorTile";

export interface ImageRendererProps {
  /** Proxied/resolved URL for the image content. */
  src: string;
  /** Accessible alt text. */
  alt: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  /** True when the asset MIME type is image/svg+xml. */
  isSvg?: boolean;
  mode: "thumbnail" | "full";
  className?: string;
}

export function ImageRenderer({
  src,
  alt,
  originalUrl,
  isSvg = false,
  mode,
  className,
}: ImageRendererProps) {
  const [hasError, setHasError] = React.useState(false);

  const containerClass = clsx(
    "relative overflow-hidden rounded border border-[var(--border)] bg-gray-100 flex items-center justify-center",
    mode === "thumbnail" ? "h-24" : "h-64",
    className,
  );

  if (hasError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="Image failed to load"
        className={className}
      />
    );
  }

  // SVG: use <img> ONLY — never dangerouslySetInnerHTML (XSS prevention).
  // Security: SVG execution requires inline rendering; <img> prevents script execution.
  if (isSvg) {
    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Raster: next/image with unoptimized=true
  // unoptimized bypasses the image optimization pipeline, allowing arbitrary URLs
  // without needing remotePatterns in next.config.mjs (MVP constraint).
  return (
    <div className={containerClass}>
      <NextImage
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-contain"
        onError={() => setHasError(true)}
        sizes={mode === "thumbnail" ? "96px" : "512px"}
      />
    </div>
  );
}
