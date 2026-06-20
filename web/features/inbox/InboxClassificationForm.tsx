"use client";

import * as React from "react";
import { clsx } from "clsx";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TagChip } from "@/components/ui/TagChip";
import type { InboxItem, AssetStatus, Sensitivity, AssetCreate } from "@/lib/types";

// ============================================================
// InboxClassificationForm
// Suggested metadata panel + classification form for a single inbox item
// ============================================================

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "raw", label: "Raw" },
  { value: "candidate", label: "Candidate" },
  { value: "in_review", label: "In Review" },
  { value: "in_progress", label: "In Progress" },
];

const SENSITIVITY_OPTIONS: { value: Sensitivity; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "personal", label: "Personal" },
  { value: "work_sensitive", label: "Work Sensitive" },
  { value: "client_sensitive", label: "Client Sensitive" },
  { value: "restricted", label: "Restricted" },
];

interface ClassifyState {
  title: string;
  status: AssetStatus;
  sensitivity: Sensitivity;
  tags: string[];
  tagInput: string;
}

interface InboxClassificationFormProps {
  item: InboxItem;
  onClassify: (assetData: AssetCreate) => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export function InboxClassificationForm({
  item,
  onClassify,
  isLoading = false,
  isSuccess = false,
  isError = false,
  errorMessage,
}: InboxClassificationFormProps) {
  const [form, setForm] = React.useState<ClassifyState>(() => ({
    title: item.title,
    status: item.status === "inbox" ? "raw" : item.status,
    sensitivity: item.sensitivity,
    tags: [],
    tagInput: "",
  }));

  // Re-init if item changes
  React.useEffect(() => {
    setForm({
      title: item.title,
      status: item.status === "inbox" ? "raw" : item.status,
      sensitivity: item.sensitivity,
      tags: [],
      tagInput: "",
    });
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && form.tagInput.trim()) {
      e.preventDefault();
      const tag = form.tagInput.trim().replace(/,+$/, "");
      if (tag && !form.tags.includes(tag)) {
        setForm((f) => ({ ...f, tags: [...f.tags, tag], tagInput: "" }));
      } else {
        setForm((f) => ({ ...f, tagInput: "" }));
      }
    }
    if (e.key === "Backspace" && !form.tagInput && form.tags.length > 0) {
      setForm((f) => ({ ...f, tags: f.tags.slice(0, -1) }));
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetData: AssetCreate = {
      title: form.title,
      source_kind: item.source_kind,
      uri: item.uri,
      mime_type: item.mime_type ?? undefined,
      status: form.status,
      sensitivity: form.sensitivity,
      agent_access: "read_allowed",
      metadata: form.tags.length > 0 ? { tags: form.tags } : undefined,
    };
    onClassify(assetData);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-sunken)]">
        <h3 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
          Classify Asset
        </h3>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        aria-label="Asset classification form"
      >
        {/* Suggested metadata note */}
        {(item.suggested_artifact_type_id || item.suggested_intenttree_node_id) && (
          <div className="rounded bg-blue-50 border border-blue-100 px-3 py-2">
            <p className="text-[11px] font-medium text-blue-700 mb-1">Suggested metadata</p>
            <div className="flex flex-wrap gap-1">
              {item.suggested_artifact_type_id && (
                <TagChip
                  label={`Type: ${item.suggested_artifact_type_id.replace("artifact_type_", "")}`}
                  size="xs"
                  color="blue"
                />
              )}
              {item.suggested_intenttree_node_id && (
                <TagChip
                  label={`Node: ${item.suggested_intenttree_node_id}`}
                  size="xs"
                  color="default"
                />
              )}
            </div>
          </div>
        )}

        {/* Title */}
        <FormField label="Title" htmlFor="classify-title">
          <input
            id="classify-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className={clsx(
              "w-full rounded border border-[var(--border)] bg-[var(--surface)]",
              "px-2.5 py-1.5 text-sm text-[var(--ink)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              "placeholder:text-[var(--ink-faint)]",
            )}
          />
        </FormField>

        {/* Status */}
        <FormField label="Status" htmlFor="classify-status">
          <select
            id="classify-status"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as AssetStatus }))
            }
            className={clsx(
              "w-full rounded border border-[var(--border)] bg-[var(--surface)]",
              "px-2.5 py-1.5 text-sm text-[var(--ink)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Sensitivity */}
        <FormField label="Sensitivity" htmlFor="classify-sensitivity">
          <select
            id="classify-sensitivity"
            value={form.sensitivity}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sensitivity: e.target.value as Sensitivity,
              }))
            }
            className={clsx(
              "w-full rounded border border-[var(--border)] bg-[var(--surface)]",
              "px-2.5 py-1.5 text-sm text-[var(--ink)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
          >
            {SENSITIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Tags */}
        <FormField label="Tags" htmlFor="classify-tags">
          <div
            className={clsx(
              "flex flex-wrap gap-1 min-h-[2rem] rounded border border-[var(--border)] bg-[var(--surface)]",
              "px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500",
            )}
          >
            {form.tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                size="xs"
                onRemove={() => removeTag(tag)}
              />
            ))}
            <input
              id="classify-tags"
              type="text"
              value={form.tagInput}
              onChange={(e) =>
                setForm((f) => ({ ...f, tagInput: e.target.value }))
              }
              onKeyDown={handleTagInput}
              placeholder={form.tags.length === 0 ? "Add tags (Enter or comma)" : ""}
              className={clsx(
                "flex-1 min-w-[80px] bg-transparent text-xs text-[var(--ink)]",
                "outline-none placeholder:text-[var(--ink-faint)]",
              )}
              aria-label="Add tag"
            />
          </div>
          <p className="text-[10px] text-[var(--ink-faint)] mt-0.5">
            Press Enter or comma to add a tag
          </p>
        </FormField>

        {/* Error / success feedback */}
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700"
          >
            <AlertCircle aria-hidden className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMessage ?? "Classification failed. Try again."}</span>
          </div>
        )}

        {isSuccess && (
          <div
            role="status"
            className="flex items-center gap-2 rounded bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700"
          >
            <CheckCircle2 aria-hidden className="w-3.5 h-3.5 shrink-0" />
            <span>Asset classified and added to library.</span>
          </div>
        )}
      </form>

      {/* Sticky footer CTA */}
      <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)] flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          fullWidth
          loading={isLoading}
          onClick={handleSubmit}
          aria-label="Classify and save asset"
          iconLeft={
            isLoading ? (
              <Loader2 aria-hidden className="w-3.5 h-3.5 animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 aria-hidden className="w-3.5 h-3.5" />
            ) : undefined
          }
        >
          {isSuccess ? "Classified" : isLoading ? "Classifying…" : "Classify Asset"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// FormField wrapper
// ============================================================

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium text-[var(--ink-muted)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
