"use client";

/**
 * WizardStep 3 — Agent instructions and metadata (expiry).
 */

import * as React from "react";
import { clsx } from "clsx";
import { Calendar } from "lucide-react";
import type { BuilderDraft } from "../types";

// ============================================================
// Instruction templates
// ============================================================

const INSTRUCTION_TEMPLATES: Array<{ label: string; text: string }> = [
  {
    label: "Engineering agent",
    text: "You are an engineering agent working on the Artifact Atlas project. Use the assets and BOM context provided to understand the current state of implementation. Prioritize completing missing slots and maintaining spec compliance.",
  },
  {
    label: "Research agent",
    text: "You are a research agent. Analyze the provided assets to identify patterns, gaps, and opportunities. Summarize key findings and suggest next steps.",
  },
  {
    label: "Writing agent",
    text: "You are a writing agent. Use the provided context to produce clear, accurate documentation or communication artifacts that match the project's tone and audience.",
  },
  {
    label: "Minimal (link-only packs)",
    text: "Fetch linked assets as needed. Prefer metadata-only access unless content is explicitly required for your task.",
  },
];

// ============================================================
// Component
// ============================================================

interface WizardStepInstructionsProps {
  draft: BuilderDraft;
  onChange: (patch: Partial<BuilderDraft>) => void;
}

export function WizardStepInstructions({
  draft,
  onChange,
}: WizardStepInstructionsProps) {
  const [templateOpen, setTemplateOpen] = React.useState(false);

  function applyTemplate(text: string) {
    onChange({ instructions: text });
    setTemplateOpen(false);
  }

  // Format date to local datetime-local input value
  const expiryValue = draft.expires_at
    ? new Date(draft.expires_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Instructions */}
      <fieldset className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="cp-instructions"
            className="text-xs font-medium text-[var(--ink)]"
          >
            Agent instructions
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTemplateOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={templateOpen}
              className={clsx(
                "text-[11px] text-[var(--blue-600)] hover:underline",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
              )}
            >
              Load template
            </button>
            {templateOpen && (
              <div
                role="listbox"
                aria-label="Instruction templates"
                className={clsx(
                  "absolute right-0 top-full mt-1 z-10 w-56",
                  "rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg",
                  "overflow-hidden",
                )}
              >
                {INSTRUCTION_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    role="option"
                    aria-selected={false}
                    type="button"
                    onClick={() => applyTemplate(tpl.text)}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-xs text-[var(--ink)]",
                      "hover:bg-[var(--surface-sunken)] transition-colors duration-100",
                    )}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea
          id="cp-instructions"
          rows={8}
          value={draft.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="Describe how the agent should use this context pack. What task should it perform? What constraints apply?"
          className={clsx(
            "w-full rounded border border-[var(--border)] px-3 py-2 text-sm resize-y",
            "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
            "transition-colors duration-100 leading-relaxed",
            "font-mono text-xs",
          )}
        />
        <p className="text-[11px] text-[var(--ink-muted)]">
          These instructions will be embedded in the pack manifest under{" "}
          <code className="font-mono bg-gray-100 px-1 rounded">instructions:</code>.
          Agents receive this field as their primary operating context.
        </p>
      </fieldset>

      {/* Expiry */}
      <fieldset className="flex flex-col gap-1.5">
        <label
          htmlFor="cp-expiry"
          className="text-xs font-medium text-[var(--ink)]"
        >
          Expiry date
          <span className="ml-1 text-[var(--ink-muted)] font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Calendar
            aria-hidden
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-faint)]"
          />
          <input
            id="cp-expiry"
            type="datetime-local"
            value={expiryValue}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                expires_at: val ? new Date(val).toISOString() : null,
              });
            }}
            className={clsx(
              "w-full h-8 pl-8 pr-3 rounded border border-[var(--border)] text-xs",
              "bg-[var(--surface)] text-[var(--ink)]",
              "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
              "transition-colors duration-100",
            )}
          />
        </div>
        <p className="text-[11px] text-[var(--ink-muted)]">
          Pack access is blocked after this date. Leave blank for no expiry.
        </p>
      </fieldset>
    </div>
  );
}
