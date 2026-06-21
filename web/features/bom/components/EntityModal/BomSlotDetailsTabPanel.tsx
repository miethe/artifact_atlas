"use client";

/**
 * BomSlotDetailsTabPanel — Details tab for the SlotTabRegistry (P2B-002).
 * Shows: slot metadata fields (id, required, phase, domain, artifact type, assignments).
 * Fetches the BOM via useBom and finds the slot by entityId.
 */

import * as React from "react";
import { useBom } from "@/lib/hooks/useBom";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-[var(--ink-muted)] font-medium text-xs">
        {label}
      </dt>
      <dd className="text-xs text-[var(--ink)]">{value}</dd>
    </>
  );
}

export default function BomSlotDetailsTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data: bom, isLoading } = useBom(projectId);
  const slot = (bom?.slots ?? []).find((s) => s.id === entityId);

  if (isLoading) return <PanelSkeleton />;

  if (!slot) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-sm text-[var(--ink-muted)]">
        BOM slot not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
      {/* Meta grid */}
      <div className="px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <MetaRow label="ID" value={<span className="font-mono text-[11px] truncate">{slot.id}</span>} />
          <MetaRow
            label="Required"
            value={
              <span className={slot.required ? "text-red-600 font-medium" : "text-gray-500"}>
                {slot.required ? "Yes" : "No"}
              </span>
            }
          />
          <MetaRow label="Phase" value={<span className="capitalize">{slot.phase ?? "—"}</span>} />
          <MetaRow label="Domain" value={<span className="capitalize">{slot.domain ?? "—"}</span>} />
          <MetaRow label="Assignments" value={slot.assignment_count} />
          {slot.artifact_type_id && (
            <MetaRow
              label="Artifact type"
              value={<span className="font-mono text-[11px]">{slot.artifact_type_id}</span>}
            />
          )}
        </dl>
      </div>

      {/* Description */}
      {slot.description && (
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">
            Description
          </p>
          <p className="text-xs text-[var(--ink)] leading-relaxed">
            {slot.description}
          </p>
        </div>
      )}

      {/* Status */}
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">
          Status
        </p>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700">
          {slot.status}
        </span>
      </div>
    </div>
  );
}
