"use client";

/**
 * ProvenancePanel — shows asset provenance: source, generator, capture dates, URIs.
 * Used in the asset detail page and right drawer.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Clock,
  Link2,
  User,
  Bot,
  Database,
  ExternalLink,
} from "lucide-react";
import type { Asset } from "@/lib/types";

// ============================================================
// Helpers
// ============================================================

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function generatorLabel(gen: Asset["generated_by"]): string {
  if (!gen) return "Unknown";
  const MAP: Record<NonNullable<Asset["generated_by"]>, string> = {
    human: "Human",
    chatgpt: "ChatGPT",
    claude: "Claude",
    agent: "Agent",
    figma: "Figma",
    other: "Other",
  };
  return MAP[gen] ?? gen;
}

function sourceKindLabel(kind: Asset["source_kind"]): string {
  const MAP: Record<Asset["source_kind"], string> = {
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
  return MAP[kind] ?? kind;
}

// ============================================================
// ProvenanceRow helper
// ============================================================

function Row({
  icon: Icon,
  label,
  value,
  monospace = false,
  truncate = false,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  monospace?: boolean;
  truncate?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-[var(--ink-muted)] uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              "text-[11px] text-blue-600 hover:underline flex items-center gap-0.5",
              truncate && "truncate",
              monospace && "font-mono",
            )}
          >
            <span className={truncate ? "truncate" : ""}>{value}</span>
            <ExternalLink aria-hidden className="w-2.5 h-2.5 shrink-0" />
          </a>
        ) : (
          <p
            className={clsx(
              "text-[11px] text-[var(--ink)]",
              truncate && "truncate",
              monospace && "font-mono",
            )}
            title={truncate ? value : undefined}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ProvenancePanel
// ============================================================

export interface ProvenancePanelProps {
  asset: Asset;
  className?: string;
  /** Collapsed by default? */
  collapsed?: boolean;
}

export function ProvenancePanel({
  asset,
  className,
  collapsed: initialCollapsed = false,
}: ProvenancePanelProps) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);

  // Determine generator icon
  const GenIcon =
    asset.generated_by === "human"
      ? User
      : asset.generated_by === "chatgpt" || asset.generated_by === "claude" || asset.generated_by === "agent"
      ? Bot
      : Database;

  // URI to display (truncate for non-http)
  const displayUri = asset.uri.length > 60 ? `${asset.uri.slice(0, 57)}...` : asset.uri;
  const isHttpUri = asset.uri.startsWith("http://") || asset.uri.startsWith("https://");

  return (
    <div className={clsx("rounded border border-[var(--border)] bg-white overflow-hidden", className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        aria-label="Toggle provenance panel"
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2.5 text-left",
          "hover:bg-gray-50 transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
        )}
      >
        <Clock aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
        <p className="text-xs font-semibold text-[var(--ink)] flex-1">Provenance</p>
        <span className="text-[10px] text-[var(--ink-muted)]">{collapsed ? "Show" : "Hide"}</span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)] space-y-2.5">
          <Row icon={Database} label="Source" value={sourceKindLabel(asset.source_kind)} />
          <Row
            icon={Link2}
            label="URI"
            value={displayUri}
            monospace
            truncate
            href={isHttpUri ? asset.uri : undefined}
          />
          {asset.original_uri && asset.original_uri !== asset.uri && (
            <Row
              icon={Link2}
              label="Original URI"
              value={asset.original_uri}
              monospace
              truncate
              href={
                asset.original_uri.startsWith("http") ? asset.original_uri : undefined
              }
            />
          )}
          <Row icon={GenIcon} label="Generated by" value={generatorLabel(asset.generated_by)} />
          <Row icon={Clock} label="Captured" value={formatDate(asset.captured_at)} />
          {asset.source_created_at && (
            <Row icon={Clock} label="Source created" value={formatDate(asset.source_created_at)} />
          )}
          {asset.source_updated_at && (
            <Row icon={Clock} label="Source updated" value={formatDate(asset.source_updated_at)} />
          )}
          {asset.last_indexed_at && (
            <Row icon={Clock} label="Last indexed" value={formatDate(asset.last_indexed_at)} />
          )}
          {asset.size_bytes && (
            <Row
              icon={Database}
              label="Size"
              value={
                asset.size_bytes < 1024 * 1024
                  ? `${(asset.size_bytes / 1024).toFixed(0)} KB`
                  : `${(asset.size_bytes / (1024 * 1024)).toFixed(1)} MB`
              }
            />
          )}
          {asset.hash_sha256 && (
            <Row
              icon={Database}
              label="SHA-256"
              value={`${asset.hash_sha256.slice(0, 16)}…`}
              monospace
            />
          )}
        </div>
      )}
    </div>
  );
}
