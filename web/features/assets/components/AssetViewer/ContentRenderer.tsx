"use client";

/**
 * ContentRenderer — Markdown + code viewer/editor via @miethe/ui ContentPane.
 *
 * Security:
 * - sanitize={true} for all untrusted MD/HTML content passed to ContentPane.
 * - Toolbar/edit mode only when: (a) agent_access permits editing, (b) extension
 *   is in the code-like set, and (c) editable prop is true.
 * - Language validation delegated to ContentPane/lowlight (unknown langs → plain text, no crash).
 *
 * Loaded via next/dynamic({ ssr: false }) from AssetViewer/index.tsx.
 *
 * Syntax highlighting:
 * - highlight.js theme (github.css) imported here for light-mode AA.
 * - warmHighlightCache() called at module scope to pre-load lowlight on first import,
 *   preventing the cold-cache plain-text flash described in @miethe/ui README.
 */

import * as React from "react";
// Syntax highlighting theme — github (light). AA is light-only.
import "highlight.js/styles/github.css";
import { ContentPane, warmHighlightCache } from "@miethe/ui/content-viewer";
import { clsx } from "clsx";
import { ErrorTile } from "./ErrorTile";

// Warm the highlight cache when this module is first imported (before first render).
// No-op if lowlight is not installed.
void warmHighlightCache();

// ---------------------------------------------------------------------------
// Editable extension set (P4A-005)
// ---------------------------------------------------------------------------
const EDITABLE_EXTENSIONS = new Set([
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".txt",
]);

function getExtension(path: string): string {
  const match = path.match(/(\.[^.]+)$/);
  return match ? match[1].toLowerCase() : "";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export type AgentAccessLevel =
  | "none"
  | "metadata_only"
  | "preview_allowed"
  | "read_allowed"
  | "context_pack_allowed";

export interface ContentRendererProps {
  /** URL to fetch the raw content from. */
  src: string;
  /**
   * Logical file path/name — passed to ContentPane so it can detect the
   * file type (e.g. "README.md", "config.ts"). Does not need to be a real path.
   */
  path: string;
  /** Original asset URL for the download link in the error tile. */
  originalUrl?: string | null;
  /**
   * When true AND agent_access permits AND extension is code-like,
   * the edit toolbar is shown.
   */
  editable?: boolean;
  /** Current agent access level (used for edit gating). */
  agentAccess: AgentAccessLevel;
  mode: "thumbnail" | "full";
  className?: string;
}

// ---------------------------------------------------------------------------
// ContentRenderer
// ---------------------------------------------------------------------------
const THUMBNAIL_LINES = 12;

export function ContentRenderer({
  src,
  path,
  originalUrl,
  editable = false,
  agentAccess,
  mode,
  className,
}: ContentRendererProps) {
  const [content, setContent] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(false);

  // Edit lifted state
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState("");

  // Fetch content on mount / when src changes
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setFetchError(false);
    setContent(null);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("[ContentRenderer] fetch error:", err);
        if (!cancelled) {
          setFetchError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Error tile on fetch failure
  if (fetchError) {
    return (
      <ErrorTile
        originalUrl={originalUrl}
        mode={mode}
        message="Content failed to load"
        className={className}
      />
    );
  }

  // ── Thumbnail mode: plain first-N-lines snippet, no toolbar ──────────────
  if (mode === "thumbnail") {
    if (isLoading) {
      return (
        <div
          aria-label="Loading content…"
          aria-busy="true"
          className={clsx(
            "rounded border border-[var(--border)] bg-gray-50 animate-pulse",
            "h-24",
            className,
          )}
        />
      );
    }

    const snippet = content
      ? content.split("\n").slice(0, THUMBNAIL_LINES).join("\n")
      : "";

    return (
      <div
        className={clsx(
          "relative overflow-hidden rounded bg-gray-50 border border-[var(--border)] p-3 h-24",
          className,
        )}
      >
        <pre className="text-[11px] font-mono text-[var(--ink-muted)] leading-relaxed whitespace-pre-wrap overflow-hidden">
          {snippet || " "}
        </pre>
        {/* Fade out bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent"
          aria-hidden
        />
      </div>
    );
  }

  // ── Full mode via ContentPane ─────────────────────────────────────────────

  // P4A-005: Editable gating
  const ext = getExtension(path);
  const editPermitted =
    agentAccess === "read_allowed" || agentAccess === "context_pack_allowed";
  const canEdit = editable && editPermitted && EDITABLE_EXTENSIONS.has(ext);

  return (
    <div
      className={clsx(
        "rounded border border-[var(--border)] overflow-hidden min-h-40",
        className,
      )}
    >
      <ContentPane
        path={path}
        content={content}
        isLoading={isLoading}
        // sanitize=true for all untrusted content in AA (security requirement)
        sanitize={true}
        // codeHighlight=true: lowlight is installed + warmHighlightCache() was called above
        codeHighlight={true}
        // Edit gating (P4A-005): readOnly when not permitted to edit
        readOnly={!canEdit}
        isEditing={isEditing}
        editedContent={editedContent}
        onEditStart={() => {
          setEditedContent(content ?? "");
          setIsEditing(true);
        }}
        onEditChange={(val) => setEditedContent(val)}
        onSave={() => {
          // Write endpoint not in P4a scope — treat as cancel for now
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
        ariaLabel={`Content viewer for ${path}`}
      />
    </div>
  );
}
