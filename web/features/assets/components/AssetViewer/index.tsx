"use client";

/**
 * AssetViewer — dispatcher component.
 *
 * Checks agent_access FIRST — renders AccessRestrictedPlaceholder if access
 * is "none", "metadata_only", or absent (fail-safe = metadata_only).
 *
 * Otherwise dispatches to the appropriate renderer by MIME type / file extension:
 *   - image/*         → ImageRenderer
 *   - application/pdf → PdfRenderer (lazy-loaded, ssr:false)
 *   - text/*, code    → ContentRenderer (lazy-loaded, ssr:false)
 *
 * Error tile with download link is shown on any renderer failure or non-200
 * proxy response.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import type { Asset } from "@/lib/types";
import { assetContentUrl } from "@/lib/api";
import { AccessRestrictedPlaceholder } from "./AccessRestrictedPlaceholder";
import { ImageRenderer } from "./ImageRenderer";
import { ErrorTile } from "./ErrorTile";

// ---------------------------------------------------------------------------
// Lazy-loaded heavy renderers (ssr: false)
// ---------------------------------------------------------------------------
const PdfRenderer = dynamic(
  () => import("./PdfRenderer").then((m) => ({ default: m.PdfRenderer })),
  {
    ssr: false,
    loading: () => <RendererSkeleton />,
  },
);

const ContentRenderer = dynamic(
  () => import("./ContentRenderer").then((m) => ({ default: m.ContentRenderer })),
  {
    ssr: false,
    loading: () => <RendererSkeleton />,
  },
);

// docx-preview manipulates the DOM — must be ssr:false (ADR-4)
const DocxRenderer = dynamic(
  () => import("./DocxRenderer").then((m) => ({ default: m.DocxRenderer })),
  {
    ssr: false,
    loading: () => <RendererSkeleton />,
  },
);

// PPTX: server-side conversion seam — no client-side PPTX lib for React 19 (ADR-4)
// Gated by flag "pptx-server-conversion"; shows download fallback when off.
const PptxRenderer = dynamic(
  () => import("./PptxRenderer").then((m) => ({ default: m.PptxRenderer })),
  {
    ssr: false,
    loading: () => <RendererSkeleton />,
  },
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface AssetViewerProps {
  asset: Asset;
  mode: "thumbnail" | "full";
  /** When true, enables editing for code-like formats (subject to agent_access gate). */
  editable?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Agent access gate constants
// ---------------------------------------------------------------------------
const RESTRICTED_ACCESS = new Set(["none", "metadata_only"]);

// ---------------------------------------------------------------------------
// MIME / extension helpers
// ---------------------------------------------------------------------------
function isRasterImage(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return (
    mime === "image/png" ||
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/gif" ||
    mime === "image/webp"
  );
}

function isSvgMime(mime: string | null | undefined): boolean {
  return mime === "image/svg+xml";
}

function isPdfMime(mime: string | null | undefined): boolean {
  return mime === "application/pdf";
}

function isDocxMime(mime: string | null | undefined): boolean {
  return mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}

function isPptxMime(mime: string | null | undefined): boolean {
  return mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
}

function isImageMime(mime: string | null | undefined): boolean {
  return !!mime && mime.startsWith("image/");
}

/** Extracts the lowercase extension from a URI/path (e.g. ".md", ".pdf"). */
function getExtension(uri: string): string {
  // Strip query string / hash first
  const clean = uri.split("?")[0].split("#")[0];
  const match = clean.match(/(\.[^./\\]+)$/);
  return match ? match[1].toLowerCase() : "";
}

/** Returns the logical file path/name to pass to ContentRenderer for type detection. */
function getFilePath(asset: Asset): string {
  // Prefer original_uri or storage_uri for a real file name, fall back to uri
  const rawUri = asset.original_uri ?? asset.storage_uri ?? asset.uri;
  // Strip protocol + host so ContentPane gets just the path component
  try {
    const url = new URL(rawUri);
    return url.pathname;
  } catch {
    return rawUri;
  }
}

/**
 * Determine the renderer type from MIME + extension.
 * Falls back to "content" for text-like types, "unknown" for unhandled.
 */
type RendererKind = "image" | "svg" | "pdf" | "docx" | "pptx" | "content" | "unknown";

function resolveRenderer(asset: Asset): RendererKind {
  const mime = asset.mime_type;
  const ext = getExtension(asset.uri);

  // PDF
  if (isPdfMime(mime) || ext === ".pdf") return "pdf";

  // DOCX (OpenXML Word document)
  if (isDocxMime(mime) || ext === ".docx") return "docx";

  // PPTX (OpenXML Presentation — no in-browser renderer; server-side conversion seam)
  if (isPptxMime(mime) || ext === ".pptx") return "pptx";

  // SVG (handled separately to enforce <img>-only rendering)
  if (isSvgMime(mime) || ext === ".svg") return "svg";

  // Raster image
  if (isRasterImage(mime) || [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext))
    return "image";

  // Any other image/* → generic image
  if (isImageMime(mime)) return "image";

  // Text / code
  const TEXT_MIME_PREFIXES = ["text/"];
  const TEXT_MIME_EXACT = [
    "application/json",
    "application/yaml",
    "application/x-yaml",
    "application/toml",
    "application/xml",
    "application/javascript",
    "application/typescript",
  ];
  const CONTENT_EXTENSIONS = new Set([
    ".md", ".txt", ".ts", ".tsx", ".js", ".jsx", ".py",
    ".json", ".yml", ".yaml", ".toml", ".xml", ".css",
    ".scss", ".sass", ".html", ".htm", ".sh", ".bash",
    ".zsh", ".fish", ".rb", ".go", ".rs", ".java", ".c",
    ".cpp", ".h", ".hpp", ".cs", ".php", ".swift", ".kt",
    ".sql", ".graphql", ".gql", ".env", ".ini", ".cfg",
  ]);

  if (
    (mime && TEXT_MIME_PREFIXES.some((p) => mime.startsWith(p))) ||
    (mime && TEXT_MIME_EXACT.includes(mime)) ||
    CONTENT_EXTENSIONS.has(ext)
  ) {
    return "content";
  }

  return "unknown";
}

/** Returns the best URL for content display. */
function getContentUrl(asset: Asset): string {
  return assetContentUrl(asset.id);
}

/** Returns the original URL used for download links in error tiles. */
function getOriginalUrl(asset: Asset): string {
  return asset.original_uri ?? asset.uri;
}

// ---------------------------------------------------------------------------
// AssetViewer
// ---------------------------------------------------------------------------
export function AssetViewer({ asset, mode, editable = false, className }: AssetViewerProps) {
  // ── Step 1: agent_access gate ────────────────────────────────────────────
  // Absent field → fail-safe = "metadata_only" (restricted)
  const access = asset.agent_access ?? "metadata_only";
  if (RESTRICTED_ACCESS.has(access)) {
    return <AccessRestrictedPlaceholder mode={mode} className={className} />;
  }

  // ── Step 2: resolve renderer ─────────────────────────────────────────────
  const rendererKind = resolveRenderer(asset);
  const contentUrl = getContentUrl(asset);
  const originalUrl = getOriginalUrl(asset);

  // ── Step 3: dispatch to renderer ─────────────────────────────────────────
  switch (rendererKind) {
    case "svg":
      return (
        <ImageRenderer
          src={contentUrl}
          alt={`Preview of ${asset.title}`}
          originalUrl={originalUrl}
          isSvg={true}
          mode={mode}
          className={className}
        />
      );

    case "image":
      return (
        <ImageRenderer
          src={contentUrl}
          alt={`Preview of ${asset.title}`}
          originalUrl={originalUrl}
          isSvg={false}
          mode={mode}
          className={className}
        />
      );

    case "pdf":
      return (
        <PdfRenderer
          src={contentUrl}
          originalUrl={originalUrl}
          mode={mode}
          className={className}
        />
      );

    case "docx":
      return (
        <DocxRenderer
          src={contentUrl}
          originalUrl={originalUrl}
          mode={mode}
          className={className}
        />
      );

    case "pptx":
      // PptxRenderer uses asset.id (not src) to call the server-side convert endpoint.
      // It internally gates on flag "pptx-server-conversion" and falls back to ErrorTile
      // when the flag is off or on any conversion error.
      return (
        <PptxRenderer
          assetId={asset.id}
          originalUrl={originalUrl}
          mode={mode}
          className={className}
        />
      );

    case "content":
      return (
        <ContentRenderer
          src={contentUrl}
          path={getFilePath(asset)}
          originalUrl={originalUrl}
          editable={editable}
          agentAccess={access}
          mode={mode}
          className={className}
        />
      );

    case "unknown":
    default:
      // Unsupported format — show error tile with download link
      return (
        <ErrorTile
          originalUrl={originalUrl}
          mode={mode}
          message={`No preview available for ${asset.mime_type ?? "this format"}`}
          className={className}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton (used by dynamic() loading fallback)
// ---------------------------------------------------------------------------
function RendererSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-label="Loading…"
      aria-busy="true"
      className={clsx(
        "w-full animate-pulse rounded border border-[var(--border)] bg-gray-100",
        "h-40",
        className,
      )}
    />
  );
}
