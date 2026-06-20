"use client";

/**
 * ApplyWizard — BOM-UI-002
 * Multi-step wizard: choose -> configure (merge options) -> review -> applying -> done.
 * Requires explicit confirmation before any slot creation.
 * Shows merge-conflict state when overlapping slots exist.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  Layers,
  Settings,
  ClipboardList,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import { TemplateCard } from "./TemplateCard";
import { TemplatePreviewPanel } from "./TemplatePreviewPanel";
import { TemplateStatusBadge } from "./TemplateStatusBadge";
import { useTemplates, useApplyTemplate } from "../hooks";
import type { ApplyTemplateResult } from "../hooks";
import type {
  ArtifactTemplate,
  ApplyWizardState,
  WizardStep,
  MergeConflict,
} from "../types";

// ============================================================
// Props
// ============================================================

export interface ApplyWizardProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: (bomId: string) => void;
  /** Pre-selected template (skip choose step) */
  initialTemplateId?: string | null;
  className?: string;
}

// ============================================================
// Step metadata
// ============================================================

const STEPS: Array<{ id: WizardStep; label: string; icon: React.ReactNode }> = [
  { id: "choose", label: "Choose", icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "configure", label: "Configure", icon: <Settings className="w-3.5 h-3.5" /> },
  { id: "review", label: "Review", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { id: "applying", label: "Apply", icon: <Zap className="w-3.5 h-3.5" /> },
];

function stepIndex(step: WizardStep): number {
  return ["choose", "configure", "review", "applying", "done"].indexOf(step);
}

// ============================================================
// Merge mode descriptions
// ============================================================

const MERGE_MODES: Array<{
  value: ApplyWizardState["mergeMode"];
  label: string;
  description: string;
}> = [
  {
    value: "skip_existing",
    label: "Skip conflicts",
    description:
      "Keep existing slots unchanged. Incoming slots that match existing names are skipped.",
  },
  {
    value: "overwrite_existing",
    label: "Overwrite conflicts",
    description:
      "Replace existing slot metadata with the template slot definition.",
  },
  {
    value: "rename_conflict",
    label: "Rename conflicts",
    description:
      "Add incoming slots with a disambiguation suffix to avoid collision.",
  },
];

// ============================================================
// Component
// ============================================================

export function ApplyWizard({
  projectId,
  onClose,
  onSuccess,
  initialTemplateId,
  className,
}: ApplyWizardProps) {
  const { data: templatesRaw, isLoading: templatesLoading } = useTemplates();
  const templates: ArtifactTemplate[] = (templatesRaw ?? []) as ArtifactTemplate[];
  const applyMutation = useApplyTemplate(projectId);

  const [state, setState] = React.useState<ApplyWizardState>({
    step: initialTemplateId ? "configure" : "choose",
    selectedTemplateId: initialTemplateId ?? null,
    mergeMode: "skip_existing",
    conflicts: [],
    previewedTemplate: null,
    isApplying: false,
    error: null,
  });

  // Sync previewedTemplate when selectedTemplateId changes
  React.useEffect(() => {
    if (state.selectedTemplateId && templates.length > 0) {
      const t = templates.find((tmpl) => tmpl.id === state.selectedTemplateId);
      setState((s) => ({ ...s, previewedTemplate: t ?? null }));
    }
  }, [state.selectedTemplateId, templates]);

  const goTo = (step: WizardStep) => setState((s) => ({ ...s, step, error: null }));

  const handleChoose = (t: ArtifactTemplate) => {
    setState((s) => ({
      ...s,
      selectedTemplateId: t.id,
      previewedTemplate: t,
    }));
  };

  const handleNext = () => {
    if (state.step === "choose" && state.selectedTemplateId) goTo("configure");
    else if (state.step === "configure") goTo("review");
  };

  const handleApply = async () => {
    if (!state.selectedTemplateId) return;
    setState((s) => ({ ...s, step: "applying", isApplying: true, error: null }));
    try {
      const result: ApplyTemplateResult = await applyMutation.mutateAsync({
        template_id: state.selectedTemplateId,
        merge_mode: state.mergeMode,
      });
      setState((s) => ({ ...s, step: "done", isApplying: false }));
      onSuccess?.(result.bom_id ?? "");
    } catch (err) {
      setState((s) => ({
        ...s,
        step: "review",
        isApplying: false,
        error: err instanceof Error ? err.message : "Failed to apply template.",
      }));
    }
  };

  const selectedTemplate = state.previewedTemplate;

  return (
    <div
      className={clsx(
        "flex flex-col h-full bg-[var(--surface)] rounded-lg overflow-hidden",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Apply template wizard"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-sunken)] shrink-0">
        <div>
          <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
            Apply Template Wizard
          </p>
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            Add artifact slots to project
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close wizard"
          className="p-1.5 rounded hover:bg-[var(--border)] transition-colors"
        >
          <X className="w-4 h-4 text-[var(--ink-muted)]" aria-hidden />
        </button>
      </div>

      {/* Step indicator */}
      {state.step !== "done" && (
        <nav aria-label="Wizard steps" className="shrink-0 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
          <ol className="flex items-center gap-1">
            {STEPS.filter((s) => s.id !== "applying").map((s, i) => {
              const sIdx = stepIndex(s.id);
              const curIdx = stepIndex(state.step);
              const done = sIdx < curIdx;
              const current = s.id === state.step || (state.step === "applying" && s.id === "review");
              return (
                <React.Fragment key={s.id}>
                  {i > 0 && (
                    <ChevronRight
                      className="w-3 h-3 text-[var(--ink-faint)] shrink-0"
                      aria-hidden
                    />
                  )}
                  <li
                    aria-current={current ? "step" : undefined}
                    className={clsx(
                      "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                      done
                        ? "text-emerald-600"
                        : current
                          ? "text-blue-600 bg-blue-50"
                          : "text-[var(--ink-faint)]",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    ) : (
                      <span aria-hidden>{s.icon}</span>
                    )}
                    {s.label}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Step: Choose */}
        {state.step === "choose" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="w-[340px] shrink-0 flex flex-col border-r border-[var(--border)] overflow-y-auto">
              <div className="px-4 py-2 text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider border-b border-[var(--border)] bg-[var(--surface-sunken)]">
                {templatesLoading
                  ? "Loading templates…"
                  : `${templates.length} templates available`}
              </div>
              <div className="p-3 space-y-1.5">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    selected={t.id === state.selectedTemplateId}
                    onClick={() => handleChoose(t)}
                  />
                ))}
              </div>
            </div>
            <TemplatePreviewPanel
              template={selectedTemplate}
              showApplyButton={false}
              className="flex-1"
            />
          </div>
        )}

        {/* Step: Configure */}
        {state.step === "configure" && (
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Selected template summary */}
              {selectedTemplate && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]">
                  <Layers className="w-5 h-5 text-[var(--ink-muted)] shrink-0 mt-0.5" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--ink)]">
                        {selectedTemplate.name}
                      </span>
                      <TemplateStatusBadge status={selectedTemplate.status} size="xs" />
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      {selectedTemplate.domains.length} domains ·{" "}
                      {selectedTemplate.domains.flatMap((d) => d.slots).length} slots
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo("choose")}
                    className="text-xs text-blue-600 hover:text-blue-700 shrink-0"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Merge mode */}
              <fieldset>
                <legend className="text-sm font-semibold text-[var(--ink)] mb-3">
                  Conflict handling
                </legend>
                <p className="text-xs text-[var(--ink-muted)] mb-3">
                  How should existing BOM slots be handled when they overlap with
                  slots in this template?
                </p>
                <div className="space-y-2.5">
                  {MERGE_MODES.map((m) => (
                    <label
                      key={m.value}
                      className={clsx(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        state.mergeMode === m.value
                          ? "border-blue-400 bg-blue-50"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
                      )}
                    >
                      <input
                        type="radio"
                        name="mergeMode"
                        value={m.value}
                        checked={state.mergeMode === m.value}
                        onChange={() =>
                          setState((s) => ({ ...s, mergeMode: m.value }))
                        }
                        className="mt-0.5 accent-blue-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-[var(--ink)]">
                          {m.label}
                        </span>
                        <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                          {m.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Simulated conflict preview */}
              <ConflictPreview
                template={selectedTemplate}
                mergeMode={state.mergeMode}
              />
            </div>

            {/* Side preview */}
            <TemplatePreviewPanel
              template={selectedTemplate}
              showApplyButton={false}
              className="w-[260px] shrink-0 border-l border-[var(--border)]"
            />
          </div>
        )}

        {/* Step: Review */}
        {state.step === "review" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-lg mx-auto">
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">
                Review before applying
              </h3>
              <p className="text-xs text-[var(--ink-muted)] mb-5">
                This will create slots in your project BOM. This action cannot be
                automatically undone — slots must be removed individually.
              </p>

              {selectedTemplate && (
                <ReviewSummary
                  template={selectedTemplate}
                  mergeMode={state.mergeMode}
                />
              )}

              {state.error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  <span className="text-xs">{state.error}</span>
                </div>
              )}

              {/* Explicit confirmation notice */}
              <div className="flex items-start gap-2 p-3 mt-4 rounded-lg border border-amber-200 bg-amber-50">
                <AlertTriangle
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  aria-hidden
                />
                <p className="text-xs text-amber-700">
                  Clicking <strong>Apply Template</strong> will create BOM slots.
                  Review the summary above before proceeding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Applying */}
        {state.step === "applying" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Loader2
              className="w-8 h-8 text-blue-500 animate-spin mb-4"
              aria-hidden
            />
            <p className="text-sm font-semibold text-[var(--ink)]">
              Applying template…
            </p>
            <p className="text-xs text-[var(--ink-muted)] mt-1">
              Creating BOM slots from{" "}
              <span className="font-medium">{selectedTemplate?.name}</span>
            </p>
          </div>
        )}

        {/* Step: Done */}
        {state.step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              Template applied successfully
            </p>
            <p className="text-xs text-[var(--ink-muted)] mt-1 mb-6">
              BOM slots have been created for{" "}
              <span className="font-medium">{selectedTemplate?.name}</span>.
            </p>
            <Button variant="primary" size="sm" onClick={onClose}>
              View BOM
            </Button>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {state.step !== "applying" && state.step !== "done" && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={
              state.step === "choose"
                ? onClose
                : state.step === "configure"
                  ? () => goTo("choose")
                  : () => goTo("configure")
            }
          >
            {state.step === "choose" ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-2">
            {state.step === "review" ? (
              <Button
                variant="primary"
                size="sm"
                iconRight={<Zap className="w-3.5 h-3.5" aria-hidden />}
                onClick={handleApply}
                disabled={!state.selectedTemplateId || state.isApplying}
              >
                Apply Template
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                iconRight={<ArrowRight className="w-3.5 h-3.5" aria-hidden />}
                onClick={handleNext}
                disabled={
                  state.step === "choose" && !state.selectedTemplateId
                }
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Conflict preview sub-component
// ============================================================

function ConflictPreview({
  template,
  mergeMode,
}: {
  template: ArtifactTemplate | null;
  mergeMode: ApplyWizardState["mergeMode"];
}) {
  if (!template) return null;

  // Simulate detecting conflicts with existing fixture BOM slots
  const simulatedConflicts: MergeConflict[] = [
    {
      existing_slot_name: "API Specification",
      existing_slot_id: "slot_openapi",
      incoming_artifact_type: "API Specification",
      domain: "Architecture",
    },
  ].filter(() => {
    // Only show if template has matching slot
    return template.domains.some((d) =>
      d.slots.some((s) => s.artifact_type === "API Specification"),
    );
  });

  if (simulatedConflicts.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--ink)] mb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden />
        Potential conflicts ({simulatedConflicts.length})
      </h4>
      <div className="space-y-1.5">
        {simulatedConflicts.map((c) => (
          <div
            key={c.existing_slot_id}
            className="flex items-center gap-3 px-3 py-2 rounded border border-amber-200 bg-amber-50 text-xs"
          >
            <span className="font-medium text-amber-800 min-w-0 truncate">
              {c.existing_slot_name}
            </span>
            <span className="text-amber-600 shrink-0">in {c.domain}</span>
            <span className="ml-auto text-amber-700 shrink-0 font-medium">
              {mergeMode === "skip_existing"
                ? "Will skip"
                : mergeMode === "overwrite_existing"
                  ? "Will overwrite"
                  : "Will rename"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Review summary sub-component
// ============================================================

function ReviewSummary({
  template,
  mergeMode,
}: {
  template: ArtifactTemplate;
  mergeMode: ApplyWizardState["mergeMode"];
}) {
  const totalSlots = template.domains.flatMap((d) => d.slots).length;
  const requiredSlots = template.domains
    .flatMap((d) => d.slots)
    .filter((s) => s.required).length;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--ink)]">
          {template.name}
        </span>
        <TemplateStatusBadge status={template.status} size="xs" />
      </div>

      <div className="divide-y divide-[var(--border)]">
        <ReviewRow label="Domains" value={String(template.domains.length)} />
        <ReviewRow label="Total slots" value={String(totalSlots)} />
        <ReviewRow label="Required" value={String(requiredSlots)} accent="blue" />
        <ReviewRow
          label="Optional"
          value={String(totalSlots - requiredSlots)}
        />
        <ReviewRow
          label="Conflict mode"
          value={
            mergeMode === "skip_existing"
              ? "Skip existing"
              : mergeMode === "overwrite_existing"
                ? "Overwrite existing"
                : "Rename conflicts"
          }
        />
      </div>

      {/* Domain breakdown */}
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--ink-faint)] uppercase tracking-wider mb-2">
          By Domain
        </p>
        <div className="space-y-1">
          {template.domains.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="text-[var(--ink)] flex-1 truncate">{d.name}</span>
              <span className="text-blue-600 shrink-0">
                {d.slots.filter((s) => s.required).length}R
              </span>
              <span className="text-[var(--ink-faint)] shrink-0">
                {d.slots.filter((s) => !s.required).length}O
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue";
}) {
  return (
    <div className="flex items-center px-4 py-2 text-xs">
      <span className="text-[var(--ink-muted)] flex-1">{label}</span>
      <span
        className={clsx(
          "font-medium tabular-nums",
          accent === "blue" ? "text-blue-600" : "text-[var(--ink)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}
