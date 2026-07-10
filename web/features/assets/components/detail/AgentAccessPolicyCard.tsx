"use client";

/**
 * AgentAccessPolicyCard — per the mockup: Classification, Access,
 * Allow in Context Packs, Allow for Training, PII/Sensitive Data, Auto-Redact.
 *
 * Classification/Access are the real sensitivity + agent_access columns
 * (PATCHed directly); the three toggles persist in metadata.policy.
 * "Allow in Context Packs" is derived from agent_access.
 */

import * as React from "react";
import { clsx } from "clsx";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { useUpdateAsset } from "@/lib/hooks/useAssets";
import type { AgentAccess, Asset, Sensitivity } from "@/lib/types";
import {
  readDetailMeta,
  useMergeAssetMetadata,
  type PolicyMeta,
} from "../../detailApi";
import { DetailCard, detailInputClass, FieldRow } from "./shared";

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

const ACCESS_LABELS: Record<AgentAccess, string> = {
  none: "No access",
  metadata_only: "Metadata only",
  preview_allowed: "Preview allowed",
  read_allowed: "Read allowed",
  context_pack_allowed: "Context pack allowed",
};

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={clsx(
        "text-xs font-medium",
        value ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--ink)]",
      )}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

export interface AgentAccessPolicyCardProps {
  asset: Asset;
  className?: string;
}

export function AgentAccessPolicyCard({ asset, className }: AgentAccessPolicyCardProps) {
  const meta = readDetailMeta(asset);
  const update = useUpdateAsset(asset.id);
  const { merge, isPending: metaPending } = useMergeAssetMetadata(asset);

  const [editing, setEditing] = React.useState(false);
  const [sensitivity, setSensitivity] = React.useState<Sensitivity>(asset.sensitivity);
  const [access, setAccess] = React.useState<AgentAccess>(asset.agent_access);
  const [policy, setPolicy] = React.useState<PolicyMeta>({});

  function startEdit() {
    setSensitivity(asset.sensitivity);
    setAccess(asset.agent_access);
    setPolicy({
      allow_training: meta.policy.allow_training ?? false,
      pii: meta.policy.pii ?? false,
      auto_redact: meta.policy.auto_redact ?? false,
    });
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    // Column fields + metadata.policy in one PATCH via the merge helper's
    // sibling mutation. Two sequential PATCHes kept simple: columns first.
    update.mutate(
      { sensitivity, agent_access: access },
      {
        onSuccess: () => {
          merge({ policy }, { onSuccess: () => setEditing(false) });
        },
      },
    );
  }

  const allowInPacks = asset.agent_access === "context_pack_allowed";
  const piiFlag =
    meta.policy.pii ??
    (asset.sensitivity === "client_sensitive" || asset.sensitivity === "restricted");

  const toggles: { key: keyof PolicyMeta; label: string }[] = [
    { key: "allow_training", label: "Allow for Training" },
    { key: "pii", label: "PII / Sensitive Data" },
    { key: "auto_redact", label: "Auto-Redact" },
  ];

  return (
    <DetailCard
      title="Agent Access Policy"
      icon={Shield}
      className={className}
      action={
        !editing ? (
          <Button size="xs" variant="ghost" onClick={startEdit}>
            Edit
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-2.5">
          <div>
            <label
              htmlFor="policy-sensitivity"
              className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
            >
              Classification
            </label>
            <select
              id="policy-sensitivity"
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value as Sensitivity)}
              className={detailInputClass}
            >
              {SENSITIVITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="policy-access"
              className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
            >
              Agent access
            </label>
            <select
              id="policy-access"
              value={access}
              onChange={(e) => setAccess(e.target.value as AgentAccess)}
              className={detailInputClass}
            >
              {ACCESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {toggles.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between gap-2 text-xs text-[var(--ink)] cursor-pointer">
              {label}
              <input
                type="checkbox"
                checked={!!policy[key]}
                onChange={(e) => setPolicy((p) => ({ ...p, [key]: e.target.checked }))}
                className="w-3.5 h-3.5 accent-blue-600"
              />
            </label>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={update.isPending || metaPending}
            >
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="divide-y divide-[var(--border)]/60">
          <FieldRow
            label="Classification"
            value={<SensitivityBadge sensitivity={asset.sensitivity} size="xs" />}
          />
          <FieldRow label="Access" value={ACCESS_LABELS[asset.agent_access]} />
          <FieldRow label="In Context Packs" value={<YesNo value={allowInPacks} />} />
          <FieldRow
            label="Allow Training"
            value={<YesNo value={meta.policy.allow_training ?? false} />}
          />
          <FieldRow label="PII / Sensitive" value={<YesNo value={piiFlag} />} />
          <FieldRow
            label="Auto-Redact"
            value={
              <span className="text-xs font-medium text-[var(--ink)]">
                {meta.policy.auto_redact ? "On" : "Off"}
              </span>
            }
          />
        </div>
      )}
    </DetailCard>
  );
}
