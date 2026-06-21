"use client";

/**
 * PackCard — zone-composition card for context packs (P3-004).
 *
 * Zone model:
 *   HeaderZone  — Pack icon on status-colored background (full-width ~96px)
 *   ContentZone — name, description
 *   StatusZone  — PackStatusBadge, audience, item count, updated date
 *   ActionZone  — "Open" chevron (hover-reveal)
 *
 * Click-to-open guard: e.target.closest check prevents modal open on action clicks.
 * Keyboard: Enter/Space activates card; tabIndex=0 on card root.
 * border-l-4 accent derived from pack status.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Package,
  Users,
  Calendar,
  ChevronRight,
  Bot,
  FileText,
} from "lucide-react";
import type { ContextPack, ContextPackAudience, ContextPackStatus } from "@/lib/types";
import { PackStatusBadge } from "./PackStatusBadge";
import { ZoneCard, isInteractiveTarget } from "@/features/ui/components/Card";

// ============================================================
// Audience icon map
// ============================================================

const AUDIENCE_CONFIG: Record<
  ContextPackAudience,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  human: { label: "Human", Icon: Users },
  agent: { label: "Agent", Icon: Bot },
  engineering_agent: { label: "Engineering Agent", Icon: Bot },
  research_agent: { label: "Research Agent", Icon: Bot },
  writing_agent: { label: "Writing Agent", Icon: Bot },
  custom: { label: "Custom", Icon: FileText },
};

// ============================================================
// Per-status styles
// ============================================================

/** Left-accent color class per pack status. */
function getPackAccent(status: ContextPackStatus): string {
  const MAP: Record<ContextPackStatus, string> = {
    draft: "border-l-gray-400",
    ready: "border-l-blue-500",
    published: "border-l-emerald-500",
    archived: "border-l-gray-300",
  };
  return MAP[status] ?? "border-l-gray-400";
}

/** Header background + icon color per pack status. */
function getPackHeaderStyle(status: ContextPackStatus): {
  bg: string;
  iconBg: string;
  iconColor: string;
} {
  const MAP: Record<
    ContextPackStatus,
    { bg: string; iconBg: string; iconColor: string }
  > = {
    draft: {
      bg: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-500",
    },
    ready: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    published: {
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    archived: {
      bg: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-400",
    },
  };
  return MAP[status] ?? MAP.draft;
}

// ============================================================
// Helpers
// ============================================================

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ============================================================
// PackCard
// ============================================================

interface PackCardProps {
  pack: ContextPack;
  selected?: boolean;
  onClick?: () => void;
  onOpen?: () => void;
}

export function PackCard({ pack, selected, onClick, onOpen }: PackCardProps) {
  const audience = AUDIENCE_CONFIG[pack.audience] ?? AUDIENCE_CONFIG.custom;
  const { Icon: AudienceIcon } = audience;
  const headerStyle = getPackHeaderStyle(pack.status);

  // ── P3-006: Click-to-open guard ──────────────────────────────
  const handleCardClick = (e: React.MouseEvent) => {
    if (isInteractiveTarget(e)) return;
    onClick?.();
  };

  // ── P3-007: Keyboard activation ──────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  // ── HeaderZone: pack icon on status-colored background ───────
  const header = (
    <div
      className={clsx(
        "w-full h-full flex items-center justify-center",
        headerStyle.bg,
      )}
    >
      <div
        className={clsx(
          "w-14 h-14 rounded-xl flex items-center justify-center shadow-sm",
          headerStyle.iconBg,
        )}
      >
        <Package
          aria-hidden
          className={clsx("w-7 h-7", headerStyle.iconColor)}
        />
      </div>
    </div>
  );

  // ── ActionZone: Open chevron (hover-reveal) ──────────────────
  const actions = onOpen ? (
    <div className="flex items-center gap-1 w-full">
      <button
        type="button"
        aria-label={`Open ${pack.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className={clsx(
          "ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-xs",
          "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          "transition-opacity duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        )}
      >
        Open
        <ChevronRight className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  ) : undefined;

  return (
    <ZoneCard
      accentColor={getPackAccent(pack.status)}
      tier="default"
      role="button"
      tabIndex={0}
      aria-selected={selected}
      aria-label={pack.name}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        selected
          ? "border-[var(--blue-500)] bg-[var(--blue-50)] shadow-sm"
          : "hover:border-[var(--border-strong)] hover:shadow-sm",
      )}
      header={header}
      content={
        <>
          <span className="text-sm font-medium text-[var(--ink)] truncate leading-tight">
            {pack.name}
          </span>
          {pack.description && (
            <p className="text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
              {pack.description}
            </p>
          )}
        </>
      }
      status={
        <>
          <PackStatusBadge status={pack.status} />
          <span className="flex items-center gap-1 text-[11px] text-[var(--ink-faint)]">
            <AudienceIcon aria-hidden className="w-3 h-3" />
            {audience.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[var(--ink-faint)]">
            <FileText aria-hidden className="w-3 h-3" />
            {pack.item_count} items
          </span>
          <span className="flex items-center gap-1 text-[11px] text-[var(--ink-faint)] ml-auto">
            <Calendar aria-hidden className="w-3 h-3" />
            {formatRelativeDate(pack.updated_at)}
          </span>
        </>
      }
      actions={actions}
    />
  );
}

// ============================================================
// PackCardSkeleton
// ============================================================

export function PackCardSkeleton() {
  return (
    <div className="rounded-lg border border-l-4 border-l-gray-200 border-[var(--border)] bg-[var(--surface)] animate-pulse overflow-hidden">
      {/* Header band skeleton */}
      <div className="w-full h-24 bg-gray-50 flex items-center justify-center">
        <div className="w-14 h-14 rounded-xl bg-gray-100" />
      </div>
      {/* Body skeleton */}
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-gray-100 rounded w-40" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="flex gap-2 mt-1">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}
