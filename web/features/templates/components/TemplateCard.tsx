"use client";

/**
 * TemplateCard — zone-composition card for the template library (P3-005).
 *
 * Zone model:
 *   HeaderZone  — Layers icon on type-colored background (full-width ~96px)
 *   ContentZone — name, description
 *   StatusZone  — TemplateStatusBadge, domain count, required/optional slot counts
 *   ActionZone  — Apply button (optional), custom badge
 *
 * Click-to-open guard: e.target.closest check on card root.
 * Keyboard: Enter/Space activates card; tabIndex=0 on card root.
 * border-l-4 accent derived from template_type.
 * Public props preserved: template, selected, onClick.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Layers, Star, Circle } from "lucide-react";
import { TemplateStatusBadge } from "./TemplateStatusBadge";
import type { ArtifactTemplate } from "../types";
import type { TemplateType } from "@/lib/types";
import { ZoneCard, isInteractiveTarget } from "@/features/ui/components/Card";

// ============================================================
// Per-type styles
// ============================================================

/** Left-accent color class per template type. */
function getTemplateAccent(type: TemplateType | null | undefined): string {
  const MAP: Record<string, string> = {
    product: "border-l-blue-500",
    architecture: "border-l-purple-500",
    research: "border-l-amber-500",
    gtm: "border-l-emerald-500",
    design_system: "border-l-pink-500",
    platform_capability: "border-l-cyan-500",
    client_proposal: "border-l-orange-500",
    custom: "border-l-gray-400",
  };
  return MAP[type ?? "custom"] ?? "border-l-gray-400";
}

/** Header background + icon styles per template type. */
function getTemplateHeaderStyle(type: TemplateType | null | undefined): {
  bg: string;
  border: string;
  iconColor: string;
} {
  const MAP: Record<
    string,
    { bg: string; border: string; iconColor: string }
  > = {
    product: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconColor: "text-blue-600",
    },
    architecture: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      iconColor: "text-purple-600",
    },
    research: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
    },
    gtm: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconColor: "text-emerald-600",
    },
    design_system: {
      bg: "bg-pink-50",
      border: "border-pink-200",
      iconColor: "text-pink-600",
    },
    platform_capability: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      iconColor: "text-cyan-600",
    },
    client_proposal: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      iconColor: "text-orange-600",
    },
    custom: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      iconColor: "text-gray-500",
    },
  };
  return MAP[type ?? "custom"] ?? MAP.custom;
}

// ============================================================
// TemplateCard
// ============================================================

export interface TemplateCardProps {
  template: ArtifactTemplate;
  selected?: boolean;
  onClick?: () => void;
  /** Optional: called when "Apply" action is triggered. Defaults to onClick. */
  onApply?: (template: ArtifactTemplate) => void;
  /** Optional: called when "Preview" action is triggered. */
  onPreview?: (template: ArtifactTemplate) => void;
}

export function TemplateCard({
  template,
  selected,
  onClick,
  onApply,
  onPreview,
}: TemplateCardProps) {
  // Defensive: the list endpoint may return header-only templates (no
  // domains); only the detail endpoint embeds domains/slots. Guard every
  // access so the library grid never crashes on header-shaped data.
  const allSlots = (template.domains ?? []).flatMap((d) => d.slots ?? []);
  const totalSlots = allSlots.length;
  const requiredSlots = allSlots.filter((s) => s.required).length;
  const domainCount = (template.domains ?? []).length;

  const headerStyle = getTemplateHeaderStyle(template.template_type);

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

  // ── HeaderZone: type-colored background with Layers icon ─────
  const header = (
    <div
      className={clsx(
        "w-full h-full flex items-center justify-center",
        headerStyle.bg,
      )}
    >
      <div
        className={clsx(
          "w-14 h-14 rounded-xl border flex items-center justify-center shadow-sm",
          headerStyle.bg,
          headerStyle.border,
        )}
      >
        <Layers
          aria-hidden
          className={clsx("w-7 h-7", headerStyle.iconColor)}
        />
      </div>
    </div>
  );

  // ── ActionZone: Apply / Preview (optional) ───────────────────
  const hasActions = !!(onApply || onPreview || onClick);
  const actions = hasActions ? (
    <div className="flex items-center gap-1.5 w-full">
      {(onApply || onClick) && (
        <button
          type="button"
          aria-label={`Apply template: ${template.name}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onApply) {
              onApply(template);
            } else {
              onClick?.();
            }
          }}
          className={clsx(
            "px-2 py-0.5 rounded text-[11px] font-medium",
            "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200",
            "transition-colors duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "focus-visible:opacity-100 transition-opacity",
          )}
        >
          Apply
        </button>
      )}
      {onPreview && (
        <button
          type="button"
          aria-label={`Preview template: ${template.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onPreview(template);
          }}
          className={clsx(
            "px-2 py-0.5 rounded text-[11px] font-medium",
            "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
            "transition-colors duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "focus-visible:opacity-100 transition-opacity",
          )}
        >
          Preview
        </button>
      )}
      {/* Selection indicator */}
      {selected && (
        <span
          aria-hidden
          className="ml-auto w-2 h-2 rounded-full bg-blue-500 shrink-0"
        />
      )}
    </div>
  ) : undefined;

  return (
    <ZoneCard
      accentColor={getTemplateAccent(template.template_type)}
      tier="default"
      role="option"
      tabIndex={0}
      aria-selected={selected}
      aria-label={template.name}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={clsx(
        selected
          ? "border-blue-400 bg-blue-50 shadow-sm"
          : "hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]",
      )}
      header={header}
      content={
        <>
          <span className="text-sm font-semibold text-[var(--ink)] leading-tight line-clamp-2">
            {template.name}
          </span>
          {template.description && (
            <p className="text-xs text-[var(--ink-muted)] line-clamp-2 leading-relaxed">
              {template.description}
            </p>
          )}
        </>
      }
      status={
        <>
          <TemplateStatusBadge status={template.status} size="xs" />
          {template.is_custom && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
              Custom
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
            <Layers className="w-3 h-3" aria-hidden />
            {domainCount} domains
          </span>
          <span className="flex items-center gap-1 text-[10px] text-blue-600">
            <Star className="w-3 h-3" aria-hidden />
            {requiredSlots} req
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
            <Circle className="w-3 h-3" aria-hidden />
            {totalSlots - requiredSlots} opt
          </span>
        </>
      }
      actions={actions}
    />
  );
}
