"use client";

/**
 * BuilderDialogs — Duplicate-from-Template, Preview BOM, and Apply-to-Project
 * dialogs for the BOM Builder (WS-5).
 */

import * as React from "react";
import { clsx } from "clsx";
import { LayoutTemplate } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useTemplates } from "../hooks";
import type { CanvasTemplate } from "./types";

// ============================================================
// Duplicate from Template
// ============================================================

export interface DuplicateFromTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onDuplicate: (templateId: string) => void;
  isPending: boolean;
  error?: string | null;
}

export function DuplicateFromTemplateDialog({
  open,
  onClose,
  onDuplicate,
  isPending,
  error,
}: DuplicateFromTemplateDialogProps) {
  const { data: templates, isLoading } = useTemplates();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Duplicate from Template"
      description="Start from an existing template's structure. A new draft copy is created."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedId}
            loading={isPending}
            onClick={() => selectedId && onDuplicate(selectedId)}
          >
            Duplicate
          </Button>
        </>
      }
    >
      <div
        className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1"
        role="listbox"
        aria-label="Templates to duplicate"
      >
        {isLoading ? (
          <p className="text-xs text-[var(--ink-muted)]">Loading templates…</p>
        ) : (
          (templates ?? []).map((t) => {
            const selected = selectedId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setSelectedId(selected ? null : t.id)}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors",
                  selected
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/40"
                    : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                )}
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" aria-hidden />
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-[var(--ink)] truncate">
                    {t.name}
                  </span>
                  <span className="block text-[10px] text-[var(--ink-faint)]">
                    {t.domains.length} domains ·{" "}
                    {t.domains.reduce((acc, d) => acc + d.slots.length, 0)} slots
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      )}
    </Dialog>
  );
}

// ============================================================
// Preview BOM
// ============================================================

export interface PreviewBomDialogProps {
  open: boolean;
  onClose: () => void;
  template: CanvasTemplate;
}

export function PreviewBomDialog({ open, onClose, template }: PreviewBomDialogProps) {
  const totalSlots = template.domains.reduce((acc, d) => acc + d.slots.length, 0);
  const requiredSlots = template.domains.reduce(
    (acc, d) => acc + d.slots.filter((s) => s.required).length,
    0,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Preview BOM"
      description="Structure this template will create when applied to a project."
      size="md"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)]">
          <span>
            <span className="font-semibold text-[var(--ink)]">{template.domains.length}</span>{" "}
            domains
          </span>
          <span>
            <span className="font-semibold text-[var(--ink)]">{totalSlots}</span> slots
          </span>
          <span>
            <span className="font-semibold text-[var(--ink)]">{requiredSlots}</span> required
          </span>
        </div>

        <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
          {template.domains.length === 0 ? (
            <p className="p-3 text-xs text-[var(--ink-muted)]">No sections yet.</p>
          ) : (
            template.domains.map((d) => (
              <div key={d.key} className="p-2.5">
                <p className="text-xs font-semibold text-[var(--ink)] mb-1.5">
                  {d.name}
                  <span className="ml-2 text-[10px] font-normal text-[var(--ink-faint)]">
                    {d.slots.filter((s) => s.required).length} required ·{" "}
                    {d.slots.filter((s) => !s.required).length} optional
                  </span>
                </p>
                <ul className="space-y-0.5" role="list">
                  {d.slots.map((s) => (
                    <li
                      key={s.key}
                      className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)]"
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          s.required ? "bg-blue-500" : "bg-gray-300",
                        )}
                      />
                      <span className="truncate">{s.label}</span>
                      {s.phase && (
                        <span className="text-[9px] uppercase tracking-wide text-[var(--ink-faint)] shrink-0">
                          {s.phase}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ============================================================
// Apply to Project
// ============================================================

export interface ApplyToProjectDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  templateName: string;
  needsSave: boolean;
  onApply: () => void;
  isPending: boolean;
  result: string | null;
  error?: string | null;
}

export function ApplyToProjectDialog({
  open,
  onClose,
  projectId,
  templateName,
  needsSave,
  onApply,
  isPending,
  result,
  error,
}: ApplyToProjectDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Apply to Project"
      description={`Add this template's expected artifact slots to project "${projectId}". Existing slots are kept.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {result ? "Done" : "Cancel"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!!result}
            loading={isPending}
            onClick={onApply}
          >
            {needsSave ? "Save & Apply" : "Apply"}
          </Button>
        </>
      }
    >
      <p className="text-xs text-[var(--ink-muted)]">
        Template: <span className="font-semibold text-[var(--ink)]">{templateName || "Untitled"}</span>
      </p>
      {needsSave && (
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
          Unsaved changes will be saved before applying.
        </p>
      )}
      {result && (
        <p role="status" className="mt-2 text-xs text-emerald-600">
          {result}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </Dialog>
  );
}
