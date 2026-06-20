"use client";

/**
 * WizardStep 5 — Review + Publish.
 * Shows full pack summary, token estimate, YAML preview, and publish gate.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  Package,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { PackStatusBadge } from "./PackStatusBadge";
import type { BuilderDraft } from "../types";
import {
  computePublishGate,
  computeTokenEstimate,
  type ContextPackPreview,
} from "../hooks";

// ============================================================
// TokenMeter
// ============================================================

function TokenMeter({ totalTokens }: { totalTokens: number }) {
  const pct = Math.min(100, (totalTokens / 128_000) * 100);
  const color =
    pct < 50 ? "bg-green-500" : pct < 80 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--ink-muted)]">Estimated token usage</span>
        <span className="font-mono font-medium text-[var(--ink)]">
          {totalTokens.toLocaleString()} / 128,000
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Token estimate: ${Math.round(pct)}% of 128k context window`}
        className="h-1.5 rounded-full bg-gray-100 overflow-hidden"
      >
        <div
          className={clsx("h-full rounded-full transition-all duration-300", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-[var(--ink-muted)]">
        {pct.toFixed(1)}% of 128k context window (estimates only — actual size
        depends on include mode and content)
      </p>
    </div>
  );
}

// ============================================================
// YAMLPreviewPanel
// ============================================================

function YAMLPreviewPanel({
  preview,
  loading,
  error,
}: {
  preview: ContextPackPreview | null | undefined;
  loading: boolean;
  error: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3 text-xs text-[var(--ink-muted)]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        Loading preview from server…
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3 text-xs text-[var(--ink-muted)]">
        Preview not available — save the draft first to generate a server-side
        preview with token estimates.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {preview.warnings && preview.warnings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {preview.warnings.map((w, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] bg-[var(--surface-sunken)]">
          <span className="text-[11px] font-mono text-[var(--ink-muted)]">
            manifest.yaml preview
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-[11px] text-[var(--blue-600)] hover:underline focus-visible:outline-none"
          >
            {expanded ? (
              <span className="flex items-center gap-1">
                <ChevronUp className="w-3 h-3" aria-hidden /> Collapse
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ChevronDown className="w-3 h-3" aria-hidden /> Expand
              </span>
            )}
          </button>
        </div>
        <pre
          className={clsx(
            "text-[11px] font-mono text-[var(--ink)] leading-relaxed px-3 py-2 overflow-auto",
            "bg-[var(--surface)]",
            !expanded && "max-h-32",
            expanded && "max-h-96",
          )}
        >
          {preview.manifest_yaml}
        </pre>
      </div>
    </div>
  );
}

// ============================================================
// WizardStepReview
// ============================================================

interface WizardStepReviewProps {
  draft: BuilderDraft;
  savedPackId: string | null;
  preview?: ContextPackPreview | null;
  previewLoading?: boolean;
  previewError?: boolean;
  onSaveDraft: () => void;
  onPublish: (destination: string) => void;
  onExport: () => void;
  saving: boolean;
  publishing: boolean;
  exporting: boolean;
}

export function WizardStepReview({
  draft,
  savedPackId,
  preview,
  previewLoading = false,
  previewError = false,
  onSaveDraft,
  onPublish,
  onExport,
  saving,
  publishing,
  exporting,
}: WizardStepReviewProps) {
  const gate = computePublishGate(draft);
  const estimate = computeTokenEstimate(draft.items);
  const [destination, setDestination] = React.useState<string>("file");

  const isSensitive = ["client_sensitive", "restricted"].includes(draft.sensitivity);

  return (
    <div className="flex flex-col gap-6">
      {/* Pack summary */}
      <section
        aria-label="Pack summary"
        className="rounded border border-[var(--border)] bg-[var(--surface-sunken)] p-4 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package
              aria-hidden
              className="w-5 h-5 text-[var(--ink-muted)] shrink-0"
            />
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              {draft.title || "(Untitled pack)"}
            </h3>
          </div>
          <PackStatusBadge status="draft" />
        </div>

        {draft.description && (
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
            {draft.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[var(--ink-muted)]">Target</span>
            <div className="font-medium text-[var(--ink)] mt-0.5 capitalize">
              {draft.target_type.replace(/_/g, " ")}
              {draft.target_id && (
                <span className="ml-1 font-mono text-[11px] text-[var(--ink-muted)]">
                  ({draft.target_id})
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[var(--ink-muted)]">Audience</span>
            <div className="font-medium text-[var(--ink)] mt-0.5 capitalize">
              {draft.audience.replace(/_/g, " ")}
            </div>
          </div>
          <div>
            <span className="text-[var(--ink-muted)]">Sensitivity</span>
            <div className="mt-0.5">
              <SensitivityBadge sensitivity={draft.sensitivity} size="xs" />
            </div>
          </div>
          <div>
            <span className="text-[var(--ink-muted)]">Items</span>
            <div className="font-medium text-[var(--ink)] mt-0.5">
              {draft.items.length} included
            </div>
          </div>
          {draft.expires_at && (
            <div className="col-span-2">
              <span className="text-[var(--ink-muted)]">Expires</span>
              <div className="font-medium text-[var(--ink)] mt-0.5">
                {new Date(draft.expires_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Permissions summary */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border)]">
          <span
            className={clsx(
              "text-[11px] px-2 py-0.5 rounded-full font-medium",
              draft.policy.allow_external_data
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500",
            )}
          >
            External data:{" "}
            {draft.policy.allow_external_data ? "allowed" : "blocked"}
          </span>
          <span
            className={clsx(
              "text-[11px] px-2 py-0.5 rounded-full font-medium",
              draft.policy.allow_code_execution
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500",
            )}
          >
            Code exec:{" "}
            {draft.policy.allow_code_execution ? "allowed" : "blocked"}
          </span>
          <span
            className={clsx(
              "text-[11px] px-2 py-0.5 rounded-full font-medium",
              draft.policy.network_access !== "none"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-500",
            )}
          >
            Network: {draft.policy.network_access}
          </span>
        </div>
      </section>

      {/* Token estimate */}
      <section aria-label="Token estimate">
        <h3 className="text-xs font-medium text-[var(--ink)] mb-2">
          Token / payload estimate
        </h3>
        <TokenMeter totalTokens={estimate.totalTokens} />
      </section>

      {/* YAML preview */}
      <section aria-label="YAML preview">
        <h3 className="text-xs font-medium text-[var(--ink)] mb-2">
          Manifest preview
        </h3>
        <YAMLPreviewPanel
          preview={preview}
          loading={previewLoading}
          error={previewError}
        />
      </section>

      {/* Publish gate */}
      <section aria-label="Publish status">
        {gate.canPublish ? (
          <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden />
            <span>Pack is ready to publish. No policy violations detected.</span>
          </div>
        ) : (
          <div
            role="alert"
            className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <div className="flex flex-col gap-1">
              <span className="font-medium">Publish blocked</span>
              <span>{gate.blockReason}</span>
              {gate.sensitiveItems.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-3">
                  {gate.sensitiveItems.map((item) => (
                    <li key={item.key} className="text-[11px]">
                      {item.label}{" "}
                      <span className="font-mono text-red-500">
                        ({item.sensitivity})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Publish destination + actions */}
      <section aria-label="Publish actions" className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <label
            htmlFor="publish-destination"
            className="text-xs font-medium text-[var(--ink)] shrink-0"
          >
            Destination
          </label>
          <select
            id="publish-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className={clsx(
              "flex-1 h-8 rounded border border-[var(--border)] px-2.5 text-xs",
              "bg-[var(--surface)] text-[var(--ink)]",
              "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
            )}
          >
            <option value="file">File — exports/context-packs/*.yaml</option>
            <option value="cli">CLI — stdout handoff</option>
            <option value="agent">Agent — MCP handoff</option>
            <option value="control_plane">Control Plane — routing signal</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Save draft */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onSaveDraft}
            loading={saving}
            iconLeft={<FileText className="w-3.5 h-3.5" aria-hidden />}
          >
            {savedPackId ? "Update draft" : "Save draft"}
          </Button>

          {/* Export YAML */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            loading={exporting}
            disabled={!savedPackId}
            aria-disabled={!savedPackId}
            title={!savedPackId ? "Save draft first" : undefined}
            iconLeft={<Download className="w-3.5 h-3.5" aria-hidden />}
          >
            Export YAML
          </Button>

          {/* Publish */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPublish(destination)}
            loading={publishing}
            disabled={!gate.canPublish || !savedPackId || isSensitive}
            aria-disabled={!gate.canPublish || !savedPackId || isSensitive}
            title={
              !savedPackId
                ? "Save draft first"
                : !gate.canPublish
                  ? gate.blockReason ?? "Publish blocked"
                  : undefined
            }
            iconLeft={
              gate.canPublish ? (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden />
              )
            }
          >
            Publish to {destination}
          </Button>
        </div>

        {!savedPackId && (
          <p className="text-[11px] text-[var(--ink-muted)]">
            Save the draft to enable export and publish actions.
          </p>
        )}
      </section>
    </div>
  );
}
