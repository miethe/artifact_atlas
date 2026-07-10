"use client";

/**
 * ProvenanceCard — generation provenance per the mockup: Source Conversation
 * (with user-prompt excerpt), Model, Temperature, Generated timestamp, Run ID.
 *
 * Real fields (generated_by, captured_at) come from the asset record;
 * model/temperature/run_id/conversation persist in metadata.provenance.
 */

import * as React from "react";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Asset } from "@/lib/types";
import {
  readDetailMeta,
  useMergeAssetMetadata,
  type ProvenanceMeta,
} from "../../detailApi";
import { DetailCard, detailInputClass, FieldRow, formatDateTime } from "./shared";

const GENERATOR_LABELS: Record<string, string> = {
  human: "Human",
  chatgpt: "ChatGPT",
  claude: "Claude",
  agent: "Agent",
  figma: "Figma",
  other: "Other",
};

interface FormState {
  model: string;
  temperature: string;
  run_id: string;
  source_conversation: string;
  source_conversation_url: string;
  prompt_excerpt: string;
}

export interface ProvenanceCardProps {
  asset: Asset;
  className?: string;
}

export function ProvenanceCard({ asset, className }: ProvenanceCardProps) {
  const meta = readDetailMeta(asset);
  const prov = meta.provenance;
  const { merge, isPending } = useMergeAssetMetadata(asset);

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    model: "",
    temperature: "",
    run_id: "",
    source_conversation: "",
    source_conversation_url: "",
    prompt_excerpt: "",
  });

  function startEdit() {
    setForm({
      model: prov.model ?? "",
      temperature: prov.temperature !== undefined ? String(prov.temperature) : "",
      run_id: prov.run_id ?? "",
      source_conversation: prov.source_conversation ?? "",
      source_conversation_url: prov.source_conversation_url ?? "",
      prompt_excerpt: prov.prompt_excerpt ?? "",
    });
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const provenance: ProvenanceMeta = {};
    if (form.model.trim()) provenance.model = form.model.trim();
    if (form.temperature.trim()) {
      const n = Number(form.temperature);
      provenance.temperature = Number.isNaN(n) ? form.temperature.trim() : n;
    }
    if (form.run_id.trim()) provenance.run_id = form.run_id.trim();
    if (form.source_conversation.trim())
      provenance.source_conversation = form.source_conversation.trim();
    if (form.source_conversation_url.trim())
      provenance.source_conversation_url = form.source_conversation_url.trim();
    if (form.prompt_excerpt.trim())
      provenance.prompt_excerpt = form.prompt_excerpt.trim();
    merge({ provenance }, { onSuccess: () => setEditing(false) });
  }

  const generatorLabel = asset.generated_by
    ? GENERATOR_LABELS[asset.generated_by] ?? asset.generated_by
    : null;
  const hasProvenance =
    !!prov.model ||
    !!prov.run_id ||
    !!prov.source_conversation ||
    prov.temperature !== undefined;

  const fieldDefs: { key: keyof FormState; label: string; placeholder: string }[] = [
    { key: "source_conversation", label: "Source conversation", placeholder: "e.g. ChatGPT — Conversation #3892" },
    { key: "source_conversation_url", label: "Conversation URL", placeholder: "https://…" },
    { key: "model", label: "Model", placeholder: "e.g. GPT-4o" },
    { key: "temperature", label: "Temperature", placeholder: "e.g. 0.2" },
    { key: "run_id", label: "Run ID", placeholder: "e.g. run_7f2b6e8a3c9d" },
  ];

  return (
    <DetailCard
      title="Provenance"
      icon={GitBranch}
      className={className}
      action={
        !editing ? (
          <Button size="xs" variant="ghost" onClick={startEdit}>
            {hasProvenance ? "Edit" : "Add provenance"}
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <form onSubmit={save} className="space-y-2.5">
          {fieldDefs.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label
                htmlFor={`prov-${key}`}
                className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
              >
                {label}
              </label>
              <input
                id={`prov-${key}`}
                type="text"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className={detailInputClass}
              />
            </div>
          ))}
          <div>
            <label
              htmlFor="prov-prompt"
              className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
            >
              User prompt excerpt
            </label>
            <textarea
              id="prov-prompt"
              value={form.prompt_excerpt}
              onChange={(e) => setForm((f) => ({ ...f, prompt_excerpt: e.target.value }))}
              rows={3}
              placeholder="The prompt that generated this asset…"
              className={`${detailInputClass} resize-y`}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" variant="primary" size="sm" loading={isPending}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2.5">
          {/* Source conversation + prompt excerpt */}
          {(prov.source_conversation || prov.prompt_excerpt) && (
            <div>
              {prov.source_conversation && (
                <p className="text-xs text-[var(--ink)] font-medium mb-1.5">
                  {prov.source_conversation_url ? (
                    <a
                      href={prov.source_conversation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {prov.source_conversation}
                    </a>
                  ) : (
                    prov.source_conversation
                  )}
                </p>
              )}
              {prov.prompt_excerpt && (
                <blockquote
                  className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--surface-sunken)] text-[11px] text-[var(--ink-muted)] italic leading-relaxed"
                >
                  <span className="not-italic font-semibold text-[var(--ink)]">
                    User prompt:{" "}
                  </span>
                  “{prov.prompt_excerpt}”
                </blockquote>
              )}
            </div>
          )}

          <div className="divide-y divide-[var(--border)]/60">
            <FieldRow label="Generated by" value={generatorLabel} />
            <FieldRow label="Model" value={prov.model} onAdd={startEdit} />
            <FieldRow
              label="Temperature"
              value={prov.temperature !== undefined ? String(prov.temperature) : null}
              onAdd={startEdit}
            />
            <FieldRow label="Generated" value={formatDateTime(prov.generated_at ?? asset.captured_at)} />
            <FieldRow label="Run ID" value={prov.run_id} onAdd={startEdit} monospace />
          </div>
        </div>
      )}
    </DetailCard>
  );
}
