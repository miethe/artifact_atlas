"use client";

/**
 * MetadataEditForm — inline form for editing asset metadata.
 * Persists via useUpdateAsset with optimistic update + rollback.
 * Fields: title, description, status, sensitivity, agent_access.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Dialog } from "@/components/ui/Dialog";
import { useUpdateAsset } from "@/lib/hooks/useAssets";
import type { Asset, AssetStatus, Sensitivity, AgentAccess } from "@/lib/types";

// ============================================================
// Types
// ============================================================

interface FormState {
  title: string;
  description: string;
  status: AssetStatus;
  sensitivity: Sensitivity;
  agent_access: AgentAccess;
}

// ============================================================
// Options
// ============================================================

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "raw", label: "Raw" },
  { value: "candidate", label: "Candidate" },
  { value: "in_review", label: "In Review" },
  { value: "in_progress", label: "In Progress" },
  { value: "selected", label: "Selected" },
  { value: "canonical", label: "Canonical" },
  { value: "archived", label: "Archived" },
];

const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "personal", label: "Personal" },
  { value: "work_sensitive", label: "Work Sensitive" },
  { value: "client_sensitive", label: "Client Sensitive" },
  { value: "restricted", label: "Restricted" },
];

const ACCESS_OPTIONS: { value: AgentAccess; label: string }[] = [
  { value: "none", label: "No Access" },
  { value: "metadata_only", label: "Metadata Only" },
  { value: "preview_allowed", label: "Preview Allowed" },
  { value: "read_allowed", label: "Read Allowed" },
  { value: "context_pack_allowed", label: "Context Pack Allowed" },
];

// ============================================================
// Field components
// ============================================================

interface LabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldLabel({ htmlFor, required, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
    >
      {children}
      {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
    </label>
  );
}

const inputClass = clsx(
  "w-full px-2.5 py-1.5 rounded border border-[var(--border)] text-xs text-[var(--ink)] bg-white",
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400",
  "placeholder:text-[var(--ink-faint)] transition-colors duration-[100ms]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

// ============================================================
// MetadataEditForm
// ============================================================

export interface MetadataEditFormProps {
  asset: Asset;
  /** Render as a compact inline form or a dialog */
  mode?: "inline" | "dialog";
  onClose?: () => void;
  onSuccess?: (updated: Asset) => void;
  className?: string;
}

export function MetadataEditForm({
  asset,
  mode = "inline",
  onClose,
  onSuccess,
  className,
}: MetadataEditFormProps) {
  const titleId = React.useId();
  const descId = React.useId();
  const statusId = React.useId();
  const sensitivityId = React.useId();
  const accessId = React.useId();

  const [form, setForm] = React.useState<FormState>({
    title: asset.title,
    description: asset.description ?? "",
    status: asset.status,
    sensitivity: asset.sensitivity,
    agent_access: asset.agent_access,
  });

  // Confirm dialog for canonical promotion
  const [confirmCanonical, setConfirmCanonical] = React.useState(false);

  const updateMutation = useUpdateAsset(asset.id);

  // Detect if status change is to canonical (requires confirm)
  const isCanonicalPromotion =
    form.status === "canonical" && asset.status !== "canonical";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isCanonicalPromotion && !confirmCanonical) {
      setConfirmCanonical(true);
      return;
    }
    submitUpdate();
  }

  function submitUpdate() {
    updateMutation.mutate(
      {
        title: form.title.trim() || asset.title,
        description: form.description.trim() || null,
        status: form.status,
        sensitivity: form.sensitivity,
        agent_access: form.agent_access,
      },
      {
        onSuccess: (updated) => {
          onSuccess?.(updated);
          onClose?.();
          setConfirmCanonical(false);
        },
      },
    );
  }

  const isDirty =
    form.title !== asset.title ||
    form.description !== (asset.description ?? "") ||
    form.status !== asset.status ||
    form.sensitivity !== asset.sensitivity ||
    form.agent_access !== asset.agent_access;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Title */}
      <div>
        <FieldLabel htmlFor={titleId} required>Title</FieldLabel>
        <input
          id={titleId}
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          maxLength={512}
          className={inputClass}
          aria-required
        />
      </div>

      {/* Description */}
      <div>
        <FieldLabel htmlFor={descId}>Description</FieldLabel>
        <textarea
          id={descId}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className={clsx(inputClass, "resize-y")}
          placeholder="Optional description…"
        />
      </div>

      {/* Status */}
      <div>
        <FieldLabel htmlFor={statusId}>Status</FieldLabel>
        <select
          id={statusId}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AssetStatus }))}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {isCanonicalPromotion && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
            <AlertCircle aria-hidden className="w-3 h-3 shrink-0" />
            Canonical promotion requires confirmation before saving.
          </p>
        )}
      </div>

      {/* Sensitivity */}
      <div>
        <FieldLabel htmlFor={sensitivityId}>Sensitivity</FieldLabel>
        <select
          id={sensitivityId}
          value={form.sensitivity}
          onChange={(e) => setForm((f) => ({ ...f, sensitivity: e.target.value as Sensitivity }))}
          className={inputClass}
        >
          {SENSITIVITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Agent access */}
      <div>
        <FieldLabel htmlFor={accessId}>Agent access</FieldLabel>
        <select
          id={accessId}
          value={form.agent_access}
          onChange={(e) => setForm((f) => ({ ...f, agent_access: e.target.value as AgentAccess }))}
          className={inputClass}
        >
          {ACCESS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {updateMutation.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 px-3 py-2 rounded bg-red-50 border border-red-200"
        >
          <AlertCircle aria-hidden className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-700">
            {(updateMutation.error as Error)?.message ?? "Failed to update. Changes rolled back."}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={updateMutation.isPending}
          disabled={!isDirty || updateMutation.isPending}
          iconLeft={<Check aria-hidden className="w-3.5 h-3.5" />}
        >
          {isCanonicalPromotion ? "Review & save" : "Save changes"}
        </Button>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            iconLeft={<X aria-hidden className="w-3.5 h-3.5" />}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );

  if (mode === "dialog") {
    return (
      <>
        {formContent}
        {/* Canonical confirmation dialog */}
        <Dialog
          open={confirmCanonical}
          onClose={() => setConfirmCanonical(false)}
          title="Confirm canonical promotion"
          description={`Promoting "${asset.title}" to Canonical is auditable and affects agent access policy. Confirm only if you have reviewed the asset.`}
          size="sm"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmCanonical(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={updateMutation.isPending}
                onClick={submitUpdate}
              >
                Confirm Canonical
              </Button>
            </>
          }
        >
          <p className="text-xs text-[var(--ink-muted)]">
            This action will be recorded in the audit log.
          </p>
        </Dialog>
      </>
    );
  }

  return (
    <div className={clsx("p-3", className)}>
      {formContent}
      {/* Canonical confirmation dialog */}
      <Dialog
        open={confirmCanonical}
        onClose={() => setConfirmCanonical(false)}
        title="Confirm canonical promotion"
        description={`Promoting "${asset.title}" to Canonical is auditable and affects agent access policy. Confirm only if you have reviewed the asset.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmCanonical(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={updateMutation.isPending}
              onClick={submitUpdate}
            >
              Confirm Canonical
            </Button>
          </>
        }
      >
        <p className="text-xs text-[var(--ink-muted)]">
          This action will be recorded in the audit log.
        </p>
      </Dialog>
    </div>
  );
}

// ============================================================
// MetadataEditDialog — wraps the form in a Dialog shell
// ============================================================

export interface MetadataEditDialogProps {
  asset: Asset | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updated: Asset) => void;
}

export function MetadataEditDialog({ asset, open, onClose, onSuccess }: MetadataEditDialogProps) {
  if (!asset) return null;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit asset metadata"
      description={asset.title}
      size="md"
    >
      <MetadataEditForm
        asset={asset}
        mode="dialog"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Dialog>
  );
}
