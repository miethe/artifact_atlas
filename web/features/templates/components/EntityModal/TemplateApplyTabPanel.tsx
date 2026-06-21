"use client";

/**
 * TemplateApplyTabPanel — Apply tab for the TemplateTabRegistry (P2B-004).
 * Shows: slot counts summary and "Apply to Project" CTA.
 * Owns the useApplyTemplate mutation (self-contained, no parent callback needed).
 */

import * as React from "react";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useTemplate, useApplyTemplate } from "../../hooks";
import { Button } from "@/components/ui/Button";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

export default function TemplateApplyTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data: template, isLoading } = useTemplate(entityId);
  const applyMutation = useApplyTemplate(projectId);

  if (isLoading) return <PanelSkeleton />;

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        Template not found.
      </div>
    );
  }

  const totalSlots = template.domains.flatMap((d) => d.slots).length;
  const requiredSlots = template.domains
    .flatMap((d) => d.slots)
    .filter((s) => s.required).length;
  const optionalSlots = totalSlots - requiredSlots;

  function handleApply() {
    applyMutation.mutate({
      template_id: entityId,
      merge_mode: "skip_existing",
    });
  }

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Summary */}
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-2">
          What will be created
        </p>
        <ul className="text-xs text-[var(--ink-muted)] space-y-1">
          <li className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">
              {requiredSlots}
            </span>
            required artifact slots
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold shrink-0">
              {optionalSlots}
            </span>
            optional artifact slots
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold shrink-0">
              {template.domains.length}
            </span>
            domains
          </li>
        </ul>
        <p className="text-[11px] text-[var(--ink-faint)] mt-2">
          Existing slots with matching types will be skipped (skip_existing mode).
        </p>
      </div>

      {/* Status feedback */}
      {applyMutation.isSuccess && (
        <div
          role="status"
          className="px-4 py-3 flex items-center gap-2 text-xs text-green-700 bg-green-50"
        >
          <CheckCircle2 aria-hidden className="w-3.5 h-3.5 shrink-0" />
          Template applied successfully.
        </div>
      )}
      {applyMutation.isError && (
        <div
          role="alert"
          className="px-4 py-3 flex items-center gap-2 text-xs text-red-700 bg-red-50"
        >
          <AlertCircle aria-hidden className="w-3.5 h-3.5 shrink-0" />
          Apply failed. Check the API connection and retry.
        </div>
      )}

      {/* CTA */}
      <div className="px-4 py-3">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          iconLeft={<FileText aria-hidden className="w-3.5 h-3.5" />}
          onClick={handleApply}
          loading={applyMutation.isPending}
          disabled={applyMutation.isSuccess}
        >
          {applyMutation.isSuccess ? "Applied" : "Apply to Project"}
        </Button>
      </div>
    </div>
  );
}
