"use client";

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
import type { ContextPack, ContextPackAudience } from "@/lib/types";
import { PackStatusBadge } from "./PackStatusBadge";

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
// PackCard
// ============================================================

interface PackCardProps {
  pack: ContextPack;
  selected?: boolean;
  onClick?: () => void;
  onOpen?: () => void;
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function PackCard({ pack, selected, onClick, onOpen }: PackCardProps) {
  const audience = AUDIENCE_CONFIG[pack.audience] ?? AUDIENCE_CONFIG.custom;
  const { Icon: AudienceIcon } = audience;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-selected={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={clsx(
        "group relative flex flex-col gap-2 rounded-lg border p-4 cursor-pointer",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-500)]",
        selected
          ? "border-[var(--blue-500)] bg-[var(--blue-50)] shadow-sm"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:shadow-sm",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={clsx(
              "shrink-0 w-7 h-7 rounded flex items-center justify-center",
              selected ? "bg-[var(--blue-100)]" : "bg-[var(--surface-sunken)]",
            )}
          >
            <Package
              aria-hidden
              className={clsx(
                "w-4 h-4",
                selected ? "text-[var(--blue-600)]" : "text-[var(--ink-muted)]",
              )}
            />
          </div>
          <span className="text-sm font-medium text-[var(--ink)] truncate">
            {pack.name}
          </span>
        </div>
        <PackStatusBadge status={pack.status} />
      </div>

      {/* Description */}
      {pack.description && (
        <p className="text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
          {pack.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-[var(--ink-faint)]">
        <span className="flex items-center gap-1">
          <AudienceIcon aria-hidden className="w-3 h-3" />
          {audience.label}
        </span>
        <span className="flex items-center gap-1">
          <FileText aria-hidden className="w-3 h-3" />
          {pack.item_count} items
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Calendar aria-hidden className="w-3 h-3" />
          {formatRelativeDate(pack.updated_at)}
        </span>
      </div>

      {/* Open arrow */}
      {onOpen && (
        <button
          type="button"
          aria-label={`Open ${pack.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={clsx(
            "absolute right-2 top-2 p-1 rounded opacity-0 group-hover:opacity-100",
            "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
            "transition-opacity duration-100",
            "focus-visible:opacity-100",
          )}
        >
          <ChevronRight className="w-3.5 h-3.5" aria-hidden />
        </button>
      )}
    </article>
  );
}

// ============================================================
// PackCardSkeleton
// ============================================================

export function PackCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-gray-100" />
        <div className="h-4 bg-gray-100 rounded w-40" />
        <div className="ml-auto h-4 bg-gray-100 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-24" />
    </div>
  );
}
