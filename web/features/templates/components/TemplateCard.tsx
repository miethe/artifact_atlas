"use client";

/**
 * TemplateCard — compact row/card for the template library list.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Layers, Star, Circle } from "lucide-react";
import { TemplateStatusBadge } from "./TemplateStatusBadge";
import type { ArtifactTemplate } from "../types";

export interface TemplateCardProps {
  template: ArtifactTemplate;
  selected?: boolean;
  onClick?: () => void;
}

export function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  const totalSlots = template.domains.flatMap((d) => d.slots).length;
  const requiredSlots = template.domains
    .flatMap((d) => d.slots)
    .filter((s) => s.required).length;

  const TYPE_COLOR: Record<string, string> = {
    product: "bg-blue-50 border-blue-200",
    architecture: "bg-purple-50 border-purple-200",
    research: "bg-amber-50 border-amber-200",
    gtm: "bg-emerald-50 border-emerald-200",
    design_system: "bg-pink-50 border-pink-200",
    platform_capability: "bg-cyan-50 border-cyan-200",
    client_proposal: "bg-orange-50 border-orange-200",
    custom: "bg-gray-50 border-gray-200",
  };

  const typeColor =
    TYPE_COLOR[template.template_type ?? "custom"] ?? TYPE_COLOR.custom;

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={clsx(
        "w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]",
        selected
          ? "border-blue-400 bg-blue-50 shadow-sm"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]",
      )}
    >
      {/* Icon block */}
      <span
        aria-hidden
        className={clsx(
          "w-8 h-8 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
          typeColor,
        )}
      >
        <Layers className="w-4 h-4 text-[var(--ink-muted)]" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--ink)] truncate">
            {template.name}
          </span>
          <TemplateStatusBadge status={template.status} size="xs" />
          {template.is_custom && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
              Custom
            </span>
          )}
        </div>

        {template.description && (
          <p className="text-xs text-[var(--ink-muted)] mt-0.5 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
            <Layers className="w-3 h-3" aria-hidden />
            {template.domains.length} domains
          </span>
          <span className="flex items-center gap-1 text-[10px] text-blue-600">
            <Star className="w-3 h-3" aria-hidden />
            {requiredSlots} required
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--ink-faint)]">
            <Circle className="w-3 h-3" aria-hidden />
            {totalSlots - requiredSlots} optional
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <span
          aria-hidden
          className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"
        />
      )}
    </button>
  );
}
