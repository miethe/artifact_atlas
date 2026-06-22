"use client";

/**
 * TemplatePreviewTabPanel — Preview tab for the TemplateTabRegistry (P2B-004).
 * Shows: template name, status, description, and quick stats bar.
 */

import * as React from "react";
import { Layers, Star, Info } from "lucide-react";
import { useTemplate } from "../../hooks";
import { TemplateStatusBadge } from "../TemplateStatusBadge";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

function StatCell({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "blue" | "gray";
}) {
  return (
    <div className="flex flex-col items-center py-3 px-3 gap-0.5">
      <span
        className={`text-lg font-bold tabular-nums leading-none ${
          accent === "blue"
            ? "text-blue-600"
            : accent === "gray"
              ? "text-[var(--ink-muted)]"
              : "text-[var(--ink)]"
        }`}
      >
        {value}
      </span>
      <span className="flex items-center gap-1 text-[9px] font-medium text-[var(--ink-faint)] uppercase tracking-wide">
        <span aria-hidden>{icon}</span>
        {label}
      </span>
    </div>
  );
}

export default function TemplatePreviewTabPanel({
  entityId,
  projectId: _projectId,
}: TabPanelProps) {
  const { data: template, isLoading } = useTemplate(entityId);

  if (isLoading) return <PanelSkeleton />;

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Template not found.
      </div>
    );
  }

  const domains = template.domains ?? [];
  const allSlots = domains.flatMap((d) => d.slots ?? []);
  const totalSlots = allSlots.length;
  const requiredSlots = allSlots.filter((s) => s.required).length;
  const optionalSlots = totalSlots - requiredSlots;

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-[var(--ink)] leading-snug">
            {template.name}
          </h3>
          <TemplateStatusBadge status={template.status} size="xs" />
        </div>
        {template.description && (
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            {template.description}
          </p>
        )}
        {template.template_type && (
          <p className="text-[11px] text-[var(--ink-faint)] mt-1 capitalize">
            Type: {template.template_type.replace(/_/g, " ")}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
        <StatCell
          label="Domains"
          value={template.domains.length}
          icon={<Layers className="w-3 h-3" />}
        />
        <StatCell
          label="Required"
          value={requiredSlots}
          icon={<Star className="w-3 h-3" />}
          accent="blue"
        />
        <StatCell
          label="Optional"
          value={optionalSlots}
          icon={<Info className="w-3 h-3" />}
          accent="gray"
        />
      </div>
    </div>
  );
}
