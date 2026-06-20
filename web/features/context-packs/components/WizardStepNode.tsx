"use client";

/**
 * WizardStep 1 — Select target node / project.
 * Sets draft.target_type, draft.target_id, draft.title, draft.audience.
 */

import * as React from "react";
import { clsx } from "clsx";
import { FolderOpen, GitBranch, Target, Layers } from "lucide-react";
import type { BuilderDraft } from "../types";
import type { ContextPackAudience, ContextPackTargetType } from "@/lib/types";

// ============================================================
// Target type options
// ============================================================

interface TargetOption {
  value: ContextPackTargetType;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const TARGET_OPTIONS: TargetOption[] = [
  {
    value: "project",
    label: "Project",
    description: "Pack scoped to the entire project — assets, BOM, and coverage.",
    Icon: FolderOpen,
  },
  {
    value: "intenttree_node",
    label: "IntentTree Node",
    description: "Pack built from a specific intent node, linked assets, and MeatyWiki refs.",
    Icon: GitBranch,
  },
  {
    value: "bom_slot",
    label: "BOM Slot",
    description: "Pack focused on a single BOM slot and its assigned assets.",
    Icon: Target,
  },
  {
    value: "custom",
    label: "Custom",
    description: "Manually curated set of items from any source type.",
    Icon: Layers,
  },
];

// ============================================================
// Audience options
// ============================================================

const AUDIENCE_OPTIONS: Array<{ value: ContextPackAudience; label: string; hint: string }> = [
  { value: "agent", label: "Agent", hint: "General-purpose agent context" },
  { value: "engineering_agent", label: "Engineering Agent", hint: "Code, architecture, and implementation context" },
  { value: "research_agent", label: "Research Agent", hint: "Research brief, findings, and evidence" },
  { value: "writing_agent", label: "Writing Agent", hint: "Docs, communications, and content context" },
  { value: "human", label: "Human", hint: "Formatted for human review" },
  { value: "custom", label: "Custom", hint: "Audience is defined by instructions" },
];

// ============================================================
// Component
// ============================================================

interface WizardStepNodeProps {
  draft: BuilderDraft;
  onChange: (patch: Partial<BuilderDraft>) => void;
}

export function WizardStepNode({ draft, onChange }: WizardStepNodeProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Pack title */}
      <fieldset className="flex flex-col gap-1.5">
        <label
          htmlFor="cp-title"
          className="text-xs font-medium text-[var(--ink)]"
        >
          Pack title <span aria-hidden className="text-red-500">*</span>
        </label>
        <input
          id="cp-title"
          type="text"
          required
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Builder Agent Context — Phase 4"
          className={clsx(
            "w-full h-8 rounded border border-[var(--border)] px-3 text-sm",
            "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-faint)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
            "transition-colors duration-100",
          )}
        />
      </fieldset>

      {/* Description */}
      <fieldset className="flex flex-col gap-1.5">
        <label
          htmlFor="cp-description"
          className="text-xs font-medium text-[var(--ink)]"
        >
          Description
        </label>
        <textarea
          id="cp-description"
          rows={2}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional — summarize what this pack is for."
          className={clsx(
            "w-full rounded border border-[var(--border)] px-3 py-2 text-sm resize-none",
            "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-faint)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
            "transition-colors duration-100",
          )}
        />
      </fieldset>

      {/* Target type */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--ink)] mb-1">
          Target type
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {TARGET_OPTIONS.map((opt) => {
            const { Icon } = opt;
            const selected = draft.target_type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ target_type: opt.value })}
                className={clsx(
                  "flex flex-col gap-1 rounded-lg border p-3 text-left cursor-pointer",
                  "transition-all duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  selected
                    ? "border-[var(--blue-500)] bg-[var(--blue-50)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    aria-hidden
                    className={clsx(
                      "w-4 h-4",
                      selected ? "text-[var(--blue-600)]" : "text-[var(--ink-muted)]",
                    )}
                  />
                  <span
                    className={clsx(
                      "text-xs font-medium",
                      selected ? "text-[var(--blue-700)]" : "text-[var(--ink)]",
                    )}
                  >
                    {opt.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Node ID / target ID (shown for non-project targets) */}
      {draft.target_type !== "project" && (
        <fieldset className="flex flex-col gap-1.5">
          <label
            htmlFor="cp-target-id"
            className="text-xs font-medium text-[var(--ink)]"
          >
            {draft.target_type === "intenttree_node" && "Node ID"}
            {draft.target_type === "bom_slot" && "BOM Slot ID"}
            {draft.target_type === "custom" && "Target reference (optional)"}
          </label>
          <input
            id="cp-target-id"
            type="text"
            value={draft.target_id}
            onChange={(e) => onChange({ target_id: e.target.value })}
            placeholder={
              draft.target_type === "intenttree_node"
                ? "e.g. node-agentic-os"
                : draft.target_type === "bom_slot"
                  ? "e.g. slot-prd-001"
                  : "Optional reference ID"
            }
            className={clsx(
              "w-full h-8 rounded border border-[var(--border)] px-3 text-sm font-mono",
              "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-faint)]",
              "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
              "transition-colors duration-100",
            )}
          />
          <p className="text-[11px] text-[var(--ink-muted)]">
            Enter a known ID. Live node lookup will be available when IntentTree is connected.
          </p>
        </fieldset>
      )}

      {/* Audience */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--ink)] mb-1">
          Audience
        </legend>
        <div className="flex flex-col gap-1">
          {AUDIENCE_OPTIONS.map((opt) => {
            const selected = draft.audience === opt.value;
            return (
              <label
                key={opt.value}
                className={clsx(
                  "flex items-center gap-3 rounded border px-3 py-2 cursor-pointer",
                  "transition-all duration-100",
                  selected
                    ? "border-[var(--blue-400)] bg-[var(--blue-50)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
                )}
              >
                <input
                  type="radio"
                  name="audience"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange({ audience: opt.value })}
                  className="accent-blue-600 shrink-0"
                />
                <span className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-[var(--ink)]">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {opt.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
