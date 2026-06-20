"use client";

/**
 * WizardStep 4 — Policy controls (CP-UI-002).
 * Maps to backend ContextPackPolicy + pack-level sensitivity/audience/expiry.
 * Blocks unsafe publish states with clear reason messaging.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  ShieldCheck,
  ShieldX,
  Globe,
  Code,
  Network,
  Users,
  Tag,
  AlertTriangle,
} from "lucide-react";
import type { BuilderDraft, BuilderPolicy } from "../types";
import type { Sensitivity } from "@/lib/types";

// ============================================================
// Sensitivity options
// ============================================================

const SENSITIVITY_OPTIONS: Array<{
  value: Sensitivity;
  label: string;
  description: string;
  safe: boolean;
}> = [
  {
    value: "public",
    label: "Public",
    description: "No restrictions. Any agent or user can access.",
    safe: true,
  },
  {
    value: "personal",
    label: "Personal",
    description: "Personal workspace content. Agent access permitted.",
    safe: true,
  },
  {
    value: "work_sensitive",
    label: "Work Sensitive",
    description: "Internal work content. Careful with external agents.",
    safe: true,
  },
  {
    value: "client_sensitive",
    label: "Client Sensitive",
    description: "Client data. Publish requires explicit review approval.",
    safe: false,
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Highest sensitivity. Publish blocked until approved.",
    safe: false,
  },
];

// ============================================================
// Toggle row
// ============================================================

interface PolicyToggleProps {
  id: string;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  checked: boolean;
  onChange: (checked: boolean) => void;
  dangerous?: boolean;
}

function PolicyToggle({
  id,
  label,
  description,
  Icon,
  checked,
  onChange,
  dangerous,
}: PolicyToggleProps) {
  return (
    <label
      htmlFor={id}
      className={clsx(
        "flex items-start gap-3 rounded border px-3 py-2.5 cursor-pointer",
        "transition-all duration-100",
        checked
          ? dangerous
            ? "border-amber-300 bg-amber-50"
            : "border-[var(--blue-300)] bg-[var(--blue-50)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
      )}
    >
      <div
        className={clsx(
          "shrink-0 w-7 h-7 rounded flex items-center justify-center mt-0.5",
          checked
            ? dangerous
              ? "bg-amber-100"
              : "bg-blue-100"
            : "bg-[var(--surface-sunken)]",
        )}
      >
        <Icon
          aria-hidden
          className={clsx(
            "w-3.5 h-3.5",
            checked
              ? dangerous
                ? "text-amber-700"
                : "text-[var(--blue-600)]"
              : "text-[var(--ink-muted)]",
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--ink)]">{label}</span>
          {dangerous && checked && (
            <AlertTriangle
              aria-label="Elevated permissions enabled"
              className="w-3.5 h-3.5 text-amber-600"
            />
          )}
        </div>
        <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      {/* Toggle switch */}
      <div className="shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          aria-hidden
          className={clsx(
            "w-8 h-4 rounded-full relative transition-colors duration-150",
            checked
              ? dangerous
                ? "bg-amber-500"
                : "bg-blue-600"
              : "bg-gray-200",
          )}
        >
          <div
            className={clsx(
              "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-150",
              checked ? "translate-x-4.5" : "translate-x-0.5",
            )}
          />
        </div>
      </div>
    </label>
  );
}

// ============================================================
// Network access selector
// ============================================================

type NetworkAccess = "none" | "restricted" | "allowed";

const NETWORK_OPTIONS: Array<{
  value: NetworkAccess;
  label: string;
  description: string;
}> = [
  { value: "none", label: "None", description: "No outbound network calls" },
  {
    value: "restricted",
    label: "Restricted",
    description: "Only approved domains",
  },
  { value: "allowed", label: "Allowed", description: "Unrestricted outbound" },
];

// ============================================================
// WizardStepPolicy
// ============================================================

interface WizardStepPolicyProps {
  draft: BuilderDraft;
  onChange: (patch: Partial<BuilderDraft>) => void;
}

export function WizardStepPolicy({
  draft,
  onChange,
}: WizardStepPolicyProps) {
  function patchPolicy(patch: Partial<BuilderPolicy>) {
    onChange({ policy: { ...draft.policy, ...patch } });
  }

  const isSensitivePack = ["client_sensitive", "restricted"].includes(
    draft.sensitivity,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Pack sensitivity */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--ink)] mb-1">
          Pack sensitivity
        </legend>
        <div className="flex flex-col gap-1.5">
          {SENSITIVITY_OPTIONS.map((opt) => {
            const selected = draft.sensitivity === opt.value;
            return (
              <label
                key={opt.value}
                className={clsx(
                  "flex items-start gap-3 rounded border px-3 py-2 cursor-pointer",
                  "transition-all duration-100",
                  selected
                    ? opt.safe
                      ? "border-[var(--blue-400)] bg-[var(--blue-50)]"
                      : "border-red-300 bg-red-50"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
                )}
              >
                <input
                  type="radio"
                  name="sensitivity"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange({ sensitivity: opt.value })}
                  className="mt-0.5 accent-blue-600 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--ink)]">
                      {opt.label}
                    </span>
                    {!opt.safe && (
                      <span className="text-[10px] text-red-600 bg-red-100 px-1.5 rounded-full">
                        Review required
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    {opt.description}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {isSensitivePack && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            <ShieldX className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <span>
              Publish is blocked for <strong>{draft.sensitivity}</strong>{" "}
              packs until a human review is completed and approved. You can
              save a draft and preview without publishing.
            </span>
          </div>
        )}
      </fieldset>

      {/* Permission toggles */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--ink)] mb-1">
          Agent permissions
        </legend>

        <PolicyToggle
          id="policy-external-data"
          label="Allow external data"
          description="Agent may fetch data from external sources while using this pack."
          Icon={Globe}
          checked={draft.policy.allow_external_data}
          onChange={(v) => patchPolicy({ allow_external_data: v })}
          dangerous
        />

        <PolicyToggle
          id="policy-code-exec"
          label="Allow code execution"
          description="Agent may execute code when processing pack contents."
          Icon={Code}
          checked={draft.policy.allow_code_execution}
          onChange={(v) => patchPolicy({ allow_code_execution: v })}
          dangerous
        />
      </fieldset>

      {/* Network access */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--ink)] mb-1 flex items-center gap-2">
          <Network aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
          Network access
        </legend>
        <div className="flex gap-2">
          {NETWORK_OPTIONS.map((opt) => {
            const selected = draft.policy.network_access === opt.value;
            return (
              <label
                key={opt.value}
                className={clsx(
                  "flex-1 flex flex-col gap-0.5 rounded border px-3 py-2 cursor-pointer text-center",
                  "transition-all duration-100",
                  selected
                    ? opt.value === "allowed"
                      ? "border-amber-300 bg-amber-50"
                      : "border-[var(--blue-300)] bg-[var(--blue-50)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]",
                )}
              >
                <input
                  type="radio"
                  name="network-access"
                  value={opt.value}
                  checked={selected}
                  onChange={() =>
                    patchPolicy({
                      network_access: opt.value as NetworkAccess,
                    })
                  }
                  className="sr-only"
                />
                <span className="text-xs font-medium text-[var(--ink)]">
                  {opt.label}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {opt.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Agent access override */}
      <fieldset className="flex flex-col gap-1.5">
        <label
          htmlFor="policy-agent-access"
          className="text-xs font-medium text-[var(--ink)] flex items-center gap-2"
        >
          <Users aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
          Agent access override
          <span className="text-[var(--ink-muted)] font-normal">(optional)</span>
        </label>
        <select
          id="policy-agent-access"
          value={draft.policy.agent_access ?? ""}
          onChange={(e) =>
            patchPolicy({ agent_access: e.target.value || null })
          }
          className={clsx(
            "w-full h-8 rounded border border-[var(--border)] px-2.5 text-xs",
            "bg-[var(--surface)] text-[var(--ink)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
            "transition-colors duration-100",
          )}
        >
          <option value="">Inherit from asset policy</option>
          <option value="none">None</option>
          <option value="metadata_only">Metadata only</option>
          <option value="preview_allowed">Preview allowed</option>
          <option value="read_allowed">Read allowed</option>
          <option value="context_pack_allowed">Context pack allowed</option>
        </select>
        <p className="text-[11px] text-[var(--ink-muted)]">
          Override the default agent access level for items in this pack. Leave
          empty to use each item&apos;s own policy.
        </p>
      </fieldset>

      {/* Tags (informational) */}
      <fieldset className="flex flex-col gap-1.5">
        <label
          htmlFor="policy-tags"
          className="text-xs font-medium text-[var(--ink)] flex items-center gap-2"
        >
          <Tag aria-hidden className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
          Tags
          <span className="text-[var(--ink-muted)] font-normal">(optional)</span>
        </label>
        <input
          id="policy-tags"
          type="text"
          placeholder="phase-4, engineering, builder (comma-separated)"
          className={clsx(
            "w-full h-8 rounded border border-[var(--border)] px-3 text-xs",
            "bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-faint)]",
            "focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:ring-2 focus-visible:ring-blue-200",
            "transition-colors duration-100",
          )}
        />
        <p className="text-[11px] text-[var(--ink-muted)]">
          Tags are stored in pack metadata and used for filtering. Not enforced by policy.
        </p>
      </fieldset>

      {/* Summary notice */}
      {!isSensitivePack && (
        <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden />
          <span>
            Policy is safe for publish at <strong>{draft.sensitivity}</strong>{" "}
            sensitivity with the current permissions.
          </span>
        </div>
      )}
    </div>
  );
}
