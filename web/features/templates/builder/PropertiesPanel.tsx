"use client";

/**
 * PropertiesPanel — right panel of the BOM Builder (WS-5).
 *
 * Slot selected: Artifact Type, Required/Optional toggle, Domain, Phase,
 * Accepted File Types chips, Naming Convention, Guidance, plus remove.
 * Nothing selected: template metadata (name, description, type, status).
 */

import * as React from "react";
import { clsx } from "clsx";
import { X, Trash2 } from "lucide-react";
import type { SlotPhase, TemplateStatus, TemplateType } from "@/lib/types";
import type { CanvasDomain, CanvasSlot, CanvasTemplate } from "./types";
import { CANVAS_PHASES } from "./types";

const TEMPLATE_TYPES: Array<{ value: TemplateType; label: string }> = [
  { value: "product", label: "Product" },
  { value: "architecture", label: "Architecture" },
  { value: "research", label: "Research" },
  { value: "gtm", label: "GTM" },
  { value: "design_system", label: "Design System" },
  { value: "platform_capability", label: "Platform Capability" },
  { value: "client_proposal", label: "Client Proposal" },
  { value: "custom", label: "Custom" },
];

const TEMPLATE_STATUSES: Array<{ value: TemplateStatus; label: string }> = [
  { value: "experimental", label: "Draft (experimental)" },
  { value: "optional", label: "Optional" },
  { value: "recommended", label: "Active (recommended)" },
  { value: "core", label: "Core" },
  { value: "deprecated", label: "Deprecated" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = clsx(
  "w-full h-7 px-2 text-xs rounded border border-[var(--border)]",
  "bg-[var(--surface-sunken)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
  "focus:outline-none focus:ring-2 focus:ring-blue-500",
);

// ============================================================
// Accepted file types chip editor
// ============================================================

function FileTypeChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const v = draft.trim().replace(/^\./, "").toLowerCase();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {value.map((ft) => (
          <span
            key={ft}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900"
          >
            {ft}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== ft))}
              aria-label={`Remove file type ${ft}`}
              className="hover:text-red-600"
            >
              <X className="w-2.5 h-2.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="Add type (png, pdf…) and press Enter"
        aria-label="Add accepted file type"
        className={inputCls}
      />
    </div>
  );
}

// ============================================================
// PropertiesPanel
// ============================================================

export interface PropertiesPanelProps {
  template: CanvasTemplate;
  selectedSlot: CanvasSlot | null;
  selectedSlotDomain: CanvasDomain | null;
  onTemplateChange: (patch: Partial<CanvasTemplate>) => void;
  onSlotChange: (patch: Partial<CanvasSlot>) => void;
  onSlotMoveToDomain: (targetDomainKey: string) => void;
  onSlotRemove: () => void;
  className?: string;
}

export function PropertiesPanel({
  template,
  selectedSlot,
  selectedSlotDomain,
  onTemplateChange,
  onSlotChange,
  onSlotMoveToDomain,
  onSlotRemove,
  className,
}: PropertiesPanelProps) {
  return (
    <aside
      aria-label="Artifact properties"
      className={clsx(
        "flex flex-col border-l border-[var(--border)] bg-[var(--surface)] overflow-y-auto",
        className,
      )}
    >
      <div className="px-3 py-2.5 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
            3
          </span>
          Artifact Properties
        </p>
        {selectedSlot && (
          <button
            type="button"
            onClick={onSlotRemove}
            aria-label="Remove selected slot"
            className="p-1 rounded hover:bg-red-100 text-[var(--ink-faint)] hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
          </button>
        )}
      </div>

      {selectedSlot ? (
        <div className="p-3 space-y-4">
          <Field label="Artifact Type">
            <input
              type="text"
              value={selectedSlot.label}
              onChange={(e) => onSlotChange({ label: e.target.value })}
              aria-label="Artifact type label"
              className={inputCls}
            />
          </Field>

          <Field label="Required">
            <div
              role="radiogroup"
              aria-label="Required or optional"
              className="grid grid-cols-2 rounded-lg border border-[var(--border)] overflow-hidden"
            >
              {([true, false] as const).map((req) => (
                <button
                  key={String(req)}
                  type="button"
                  role="radio"
                  aria-checked={selectedSlot.required === req}
                  onClick={() => onSlotChange({ required: req })}
                  className={clsx(
                    "h-7 text-xs font-medium transition-colors",
                    selectedSlot.required === req
                      ? "bg-blue-600 text-white"
                      : "bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]",
                  )}
                >
                  {req ? "Required" : "Optional"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Domain">
            <select
              value={selectedSlotDomain?.key ?? ""}
              onChange={(e) => onSlotMoveToDomain(e.target.value)}
              aria-label="Slot domain"
              className={inputCls}
            >
              {template.domains.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Phase">
            <select
              value={selectedSlot.phase ?? ""}
              onChange={(e) =>
                onSlotChange({
                  phase: (e.target.value || null) as SlotPhase | null,
                })
              }
              aria-label="Slot phase"
              className={inputCls}
            >
              <option value="">No phase</option>
              {CANVAS_PHASES.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Accepted File Types">
            <FileTypeChips
              value={selectedSlot.acceptedFileTypes}
              onChange={(next) => onSlotChange({ acceptedFileTypes: next })}
            />
            <p className="text-[10px] text-[var(--ink-faint)] mt-1">
              Max file size:{" "}
              <input
                type="number"
                min={1}
                value={selectedSlot.maxFileSizeMb ?? ""}
                onChange={(e) =>
                  onSlotChange({
                    maxFileSizeMb: e.target.value ? Number(e.target.value) : null,
                  })
                }
                aria-label="Max file size in MB"
                className="w-16 h-5 px-1 text-[10px] rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[var(--ink)]"
              />{" "}
              MB
            </p>
          </Field>

          <Field label="Naming Convention">
            <input
              type="text"
              value={selectedSlot.namingConvention}
              onChange={(e) => onSlotChange({ namingConvention: e.target.value })}
              placeholder="architecture_diagram_{domain}_{date}"
              aria-label="Naming convention pattern"
              className={clsx(inputCls, "font-mono")}
            />
            {selectedSlot.namingConvention && (
              <p className="text-[10px] text-[var(--ink-faint)] mt-1 truncate">
                Example:{" "}
                {selectedSlot.namingConvention
                  .replace("{domain}", "platform")
                  .replace("{phase}", "design")
                  .replace("{date}", "2026-07-10")}
                .png
              </p>
            )}
          </Field>

          <Field label="Guidance / Instructions">
            <textarea
              value={selectedSlot.guidance}
              onChange={(e) => onSlotChange({ guidance: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="Describe what a good artifact for this slot looks like…"
              aria-label="Slot guidance"
              className={clsx(
                "w-full px-2 py-1.5 text-xs rounded border border-[var(--border)] resize-none",
                "bg-[var(--surface-sunken)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
              )}
            />
            <p className="text-right text-[10px] text-[var(--ink-faint)]">
              {selectedSlot.guidance.length} / 1000
            </p>
          </Field>

          <Field label="Status">
            <select
              value={template.status}
              onChange={(e) =>
                onTemplateChange({ status: e.target.value as TemplateStatus })
              }
              aria-label="Template status"
              className={inputCls}
            >
              {TEMPLATE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : (
        <div className="p-3 space-y-4">
          <Field label="Template Name">
            <input
              type="text"
              value={template.name}
              onChange={(e) => onTemplateChange({ name: e.target.value })}
              placeholder="Template name"
              aria-label="Template name"
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={template.description}
              onChange={(e) => onTemplateChange({ description: e.target.value })}
              rows={3}
              placeholder="What is this template for?"
              aria-label="Template description"
              className={clsx(
                "w-full px-2 py-1.5 text-xs rounded border border-[var(--border)] resize-none",
                "bg-[var(--surface-sunken)] text-[var(--ink)] placeholder-[var(--ink-faint)]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
              )}
            />
          </Field>

          <Field label="Type">
            <select
              value={template.templateType}
              onChange={(e) =>
                onTemplateChange({ templateType: e.target.value as TemplateType })
              }
              aria-label="Template type"
              className={inputCls}
            >
              {TEMPLATE_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={template.status}
              onChange={(e) =>
                onTemplateChange({ status: e.target.value as TemplateStatus })
              }
              aria-label="Template status"
              className={inputCls}
            >
              {TEMPLATE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--ink-muted)]">
              Select a slot on the canvas to edit its properties.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
