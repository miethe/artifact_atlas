"use client";

/**
 * NodeLinkChip — compact chip linking an asset to a project entity
 * (topic, feature, intenttree_node, bom_slot, context_pack).
 */

import * as React from "react";
import { clsx } from "clsx";
import { Network, Layers, Map, BookOpen, Tag } from "lucide-react";
import type { AssetLink } from "@/lib/types";

const TARGET_CONFIG: Record<
  AssetLink["target_type"],
  {
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
    bg: string;
    text: string;
  }
> = {
  project: { Icon: Layers, label: "Project", bg: "bg-blue-100", text: "text-blue-700" },
  topic: { Icon: Tag, label: "Topic", bg: "bg-purple-100", text: "text-purple-700" },
  feature: { Icon: Network, label: "Feature", bg: "bg-emerald-100", text: "text-emerald-700" },
  intenttree_node: { Icon: Network, label: "Node", bg: "bg-amber-100", text: "text-amber-700" },
  meatywiki_page: { Icon: BookOpen, label: "Wiki", bg: "bg-sky-100", text: "text-sky-700" },
  bom_slot: { Icon: Map, label: "BOM", bg: "bg-orange-100", text: "text-orange-700" },
  context_pack: { Icon: Layers, label: "Pack", bg: "bg-violet-100", text: "text-violet-700" },
  skillbom: { Icon: Layers, label: "SkillBOM", bg: "bg-teal-100", text: "text-teal-700" },
  execution_event: { Icon: Network, label: "Event", bg: "bg-gray-100", text: "text-gray-600" },
};

export interface NodeLinkChipProps {
  link: AssetLink;
  /** Optional display label override */
  displayLabel?: string;
  size?: "xs" | "sm";
  className?: string;
}

export function NodeLinkChip({ link, displayLabel, size = "xs", className }: NodeLinkChipProps) {
  const config = TARGET_CONFIG[link.target_type] ?? TARGET_CONFIG.project;
  const { Icon } = config;

  return (
    <span
      aria-label={`Linked to ${config.label}: ${displayLabel ?? link.target_id}`}
      className={clsx(
        "inline-flex items-center gap-1 rounded font-medium",
        config.bg,
        config.text,
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      <Icon aria-hidden className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      <span className="truncate max-w-[80px]">{displayLabel ?? config.label}</span>
    </span>
  );
}

// ============================================================
// BOMSlotChip — specialized chip for BOM slot assignments
// ============================================================

export interface BOMSlotChipProps {
  slotName: string;
  slotStatus?: "missing" | "partial" | "in_progress" | "complete" | "stale" | "blocked" | "not_applicable";
  size?: "xs" | "sm";
  className?: string;
}

const SLOT_STATUS_COLORS: Record<
  NonNullable<BOMSlotChipProps["slotStatus"]>,
  { bg: string; text: string; dot: string }
> = {
  complete: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  in_progress: { bg: "bg-sky-100", text: "text-sky-700", dot: "bg-sky-500" },
  partial: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  missing: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  stale: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  blocked: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  not_applicable: { bg: "bg-gray-50", text: "text-gray-400", dot: "bg-gray-300" },
};

export function BOMSlotChip({ slotName, slotStatus, size = "xs", className }: BOMSlotChipProps) {
  const colors = slotStatus ? SLOT_STATUS_COLORS[slotStatus] : SLOT_STATUS_COLORS.missing;

  return (
    <span
      aria-label={`BOM slot: ${slotName}${slotStatus ? ` (${slotStatus})` : ""}`}
      className={clsx(
        "inline-flex items-center gap-1 rounded font-medium",
        colors.bg,
        colors.text,
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "rounded-full shrink-0",
          colors.dot,
          size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2",
        )}
      />
      <Map aria-hidden className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      <span className="truncate max-w-[80px]">{slotName}</span>
    </span>
  );
}
