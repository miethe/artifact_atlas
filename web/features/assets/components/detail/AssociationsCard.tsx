"use client";

/**
 * AssociationsCard — Project / Topic / Feature / Epic rows (per mockup).
 * Project comes from the real project record; topic/feature/epic persist in
 * metadata.associations via PATCH. Edit toggles inline inputs.
 */

import * as React from "react";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useProject } from "@/lib/hooks/useProjects";
import type { Asset } from "@/lib/types";
import {
  readDetailMeta,
  useMergeAssetMetadata,
  type AssociationsMeta,
} from "../../detailApi";
import { DetailCard, detailInputClass, FieldRow } from "./shared";

const EDITABLE_FIELDS: { key: keyof AssociationsMeta; label: string }[] = [
  { key: "topic", label: "Topic" },
  { key: "feature", label: "Feature" },
  { key: "epic", label: "Epic" },
];

export interface AssociationsCardProps {
  asset: Asset;
  projectId: string;
  className?: string;
}

export function AssociationsCard({ asset, projectId, className }: AssociationsCardProps) {
  const { data: project } = useProject(projectId);
  const meta = readDetailMeta(asset);
  const { merge, isPending } = useMergeAssetMetadata(asset);

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<AssociationsMeta>({});

  function startEdit() {
    setForm({
      topic: meta.associations.topic ?? "",
      feature: meta.associations.feature ?? "",
      epic: meta.associations.epic ?? "",
    });
    setEditing(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const associations: AssociationsMeta = {};
    for (const { key } of EDITABLE_FIELDS) {
      const v = (form[key] ?? "").trim();
      if (v) associations[key] = v;
    }
    merge({ associations }, { onSuccess: () => setEditing(false) });
  }

  return (
    <DetailCard
      title="Associations"
      icon={FolderOpen}
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
          {EDITABLE_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label
                htmlFor={`assoc-${key}`}
                className="block text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1"
              >
                {label}
              </label>
              <input
                id={`assoc-${key}`}
                type="text"
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={`e.g. ${key === "topic" ? "System Architecture" : key === "feature" ? "Context Orchestration" : "Scalable Agent Platform"}`}
                className={detailInputClass}
              />
            </div>
          ))}
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
        <div className="divide-y divide-[var(--border)]/60">
          <FieldRow
            label="Project"
            value={
              project ? (
                <Link
                  href={`/projects/${projectId}`}
                  className="text-blue-600 hover:underline"
                >
                  {project.name}
                </Link>
              ) : (
                projectId
              )
            }
          />
          <FieldRow label="Topic" value={meta.associations.topic} onAdd={startEdit} />
          <FieldRow label="Feature" value={meta.associations.feature} onAdd={startEdit} />
          <FieldRow label="Epic" value={meta.associations.epic} onAdd={startEdit} />
        </div>
      )}
    </DetailCard>
  );
}
