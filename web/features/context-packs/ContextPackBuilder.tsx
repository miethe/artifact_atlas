"use client";

/**
 * ContextPackBuilder — CP-UI-001 wizard.
 * Steps: node -> assets -> instructions -> policy -> review
 *
 * Displayed as a right-drawer panel or full-page modal.
 * Coordinates draft state + save/publish mutations.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  FolderOpen,
  Layers,
  ScrollText,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WizardStepNode } from "./components/WizardStepNode";
import { WizardStepAssets } from "./components/WizardStepAssets";
import { WizardStepInstructions } from "./components/WizardStepInstructions";
import { WizardStepPolicy } from "./components/WizardStepPolicy";
import { WizardStepReview } from "./components/WizardStepReview";
import {
  useCreateContextPack,
  useUpdateContextPack,
  usePreviewContextPack,
  useExportContextPack,
  usePublishContextPack,
} from "./hooks";
import type { BuilderDraft, WizardStep } from "./types";

// ============================================================
// Default draft
// ============================================================

function emptyDraft(projectId: string): BuilderDraft {
  return {
    title: "",
    description: "",
    target_type: "project",
    target_id: projectId,
    audience: "agent",
    sensitivity: "personal",
    instructions: "",
    expires_at: null,
    items: [],
    policy: {
      allow_external_data: false,
      allow_code_execution: false,
      network_access: "none",
      agent_access: null,
    },
  };
}

// ============================================================
// Step configuration
// ============================================================

interface StepConfig {
  id: WizardStep;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: "node",
    label: "Select node",
    shortLabel: "Node",
    Icon: FolderOpen,
    description: "Set pack target, title, and audience.",
  },
  {
    id: "assets",
    label: "Choose assets",
    shortLabel: "Assets",
    Icon: Layers,
    description: "Select assets and set include modes.",
  },
  {
    id: "instructions",
    label: "Instructions",
    shortLabel: "Instructions",
    Icon: ScrollText,
    description: "Write agent instructions and set expiry.",
  },
  {
    id: "policy",
    label: "Policy controls",
    shortLabel: "Policy",
    Icon: Shield,
    description: "Configure sensitivity and permission policy.",
  },
  {
    id: "review",
    label: "Review & publish",
    shortLabel: "Review",
    Icon: Eye,
    description: "Review, save draft, preview, and publish.",
  },
];

// ============================================================
// StepIndicator
// ============================================================

interface StepIndicatorProps {
  steps: StepConfig[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

function StepIndicator({ steps, currentIndex, onNavigate }: StepIndicatorProps) {
  return (
    <nav aria-label="Builder steps" className="flex items-center gap-0">
      {steps.map((step, i) => {
        const { Icon } = step;
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isReachable = i <= currentIndex;

        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => isReachable && onNavigate(i)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Step ${i + 1}: ${step.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
              className={clsx(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded",
                "transition-all duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                isReachable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
              )}
            >
              <div
                className={clsx(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  "transition-all duration-150",
                  isCurrent
                    ? "bg-blue-600 text-white ring-2 ring-blue-200"
                    : isCompleted
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-400",
                )}
              >
                {isCompleted ? (
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <Icon aria-hidden className="w-3 h-3" />
                )}
              </div>
              <span
                className={clsx(
                  "text-[10px] font-medium leading-none",
                  isCurrent
                    ? "text-blue-700"
                    : isCompleted
                      ? "text-[var(--ink-muted)]"
                      : "text-[var(--ink-faint)]",
                )}
              >
                {step.shortLabel}
              </span>
            </button>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                aria-hidden
                className={clsx(
                  "flex-1 h-px mx-1 transition-colors duration-150",
                  i < currentIndex ? "bg-blue-200" : "bg-gray-200",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ============================================================
// ContextPackBuilder
// ============================================================

interface ContextPackBuilderProps {
  projectId: string;
  onClose?: () => void;
  onCreated?: (packId: string) => void;
}

export function ContextPackBuilder({
  projectId,
  onClose,
  onCreated,
}: ContextPackBuilderProps) {
  const [stepIndex, setStepIndex] = React.useState(0);
  const [draft, setDraft] = React.useState<BuilderDraft>(() =>
    emptyDraft(projectId),
  );
  const [savedPackId, setSavedPackId] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const createMutation = useCreateContextPack(projectId);
  const updateMutation = useUpdateContextPack(projectId);
  const exportMutation = useExportContextPack();
  const publishMutation = usePublishContextPack(projectId);

  // Preview — only enabled when pack is saved
  const {
    data: preview,
    isLoading: previewLoading,
    isError: previewError,
  } = usePreviewContextPack(
    stepIndex === 4 ? savedPackId : null,
  );

  function patchDraft(patch: Partial<BuilderDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  const currentStep = STEPS[stepIndex];

  // Validation: title required to proceed past step 0
  const canGoNext = stepIndex === 0 ? draft.title.trim().length > 0 : true;

  function goNext() {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
  }

  function goPrev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  // ============================================================
  // Save draft
  // ============================================================

  async function handleSaveDraft() {
    setSaveError(null);
    const payload = {
      name: draft.title,
      description: draft.description || undefined,
      audience: draft.audience,
      target_type: draft.target_type,
      target_id: draft.target_id || undefined,
    };

    try {
      if (savedPackId) {
        await updateMutation.mutateAsync({
          packId: savedPackId,
          data: payload,
        });
      } else {
        const pack = await createMutation.mutateAsync(payload);
        setSavedPackId(pack.id);
        onCreated?.(pack.id);
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save draft.",
      );
    }
  }

  // ============================================================
  // Export YAML
  // ============================================================

  async function handleExport() {
    if (!savedPackId) return;
    try {
      await exportMutation.mutateAsync({ packId: savedPackId });
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Export failed.",
      );
    }
  }

  // ============================================================
  // Publish
  // ============================================================

  async function handlePublish(destination: string) {
    if (!savedPackId) return;
    setSaveError(null);
    try {
      await publishMutation.mutateAsync({
        packId: savedPackId,
        destination,
      });
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Publish failed.",
      );
    }
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[var(--ink)]">
            {savedPackId ? "Edit context pack" : "Create context pack"}
          </span>
          <span className="text-[11px] text-[var(--ink-muted)]">
            {currentStep.description}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close builder"
            className={clsx(
              "shrink-0 p-1.5 rounded",
              "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-gray-100",
              "transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="px-4 py-3 border-b border-[var(--border)] shrink-0 bg-[var(--surface-sunken)]">
        <StepIndicator
          steps={STEPS}
          currentIndex={stepIndex}
          onNavigate={setStepIndex}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {currentStep.id === "node" && (
          <WizardStepNode draft={draft} onChange={patchDraft} />
        )}
        {currentStep.id === "assets" && (
          <WizardStepAssets
            projectId={projectId}
            draft={draft}
            onChange={patchDraft}
          />
        )}
        {currentStep.id === "instructions" && (
          <WizardStepInstructions draft={draft} onChange={patchDraft} />
        )}
        {currentStep.id === "policy" && (
          <WizardStepPolicy draft={draft} onChange={patchDraft} />
        )}
        {currentStep.id === "review" && (
          <WizardStepReview
            draft={draft}
            savedPackId={savedPackId}
            preview={preview}
            previewLoading={previewLoading}
            previewError={previewError}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onExport={handleExport}
            saving={
              createMutation.isPending || updateMutation.isPending
            }
            publishing={publishMutation.isPending}
            exporting={exportMutation.isPending}
          />
        )}
      </div>

      {/* Error banner */}
      {saveError && (
        <div
          role="alert"
          className="px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-center gap-2 shrink-0"
        >
          <span className="flex-1">{saveError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-red-600 focus-visible:outline-none"
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      )}

      {/* Footer navigation */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)] shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={stepIndex === 0}
          iconLeft={<ChevronLeft className="w-3.5 h-3.5" aria-hidden />}
        >
          Back
        </Button>

        <span className="text-[11px] text-[var(--ink-faint)]">
          {stepIndex + 1} of {STEPS.length}
        </span>

        {stepIndex < STEPS.length - 1 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={goNext}
            disabled={!canGoNext}
            aria-disabled={!canGoNext}
            title={
              !canGoNext ? "Pack title is required to continue" : undefined
            }
            iconRight={<ChevronRight className="w-3.5 h-3.5" aria-hidden />}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
