"use client";

/**
 * CreateProjectDialog — modal form for POST /api/projects.
 * Fields: name (required), slug (auto-derived, editable), description,
 * status, tags. On success navigates to the new project's command center.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, Dialog, TagChip } from "@/components/ui";
import { useCreateProject } from "@/lib/hooks/useProjects";
import type { ProjectStatus } from "@/lib/types";
import type { ProjectCreateInput } from "../types";
import { slugify } from "../types";

// ============================================================
// Component
// ============================================================

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

const inputClasses =
  "w-full h-8 px-2.5 text-xs rounded border border-[var(--border)] bg-white text-[var(--ink)] " +
  "placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400";

const labelClasses = "text-[11px] font-medium text-[var(--ink-muted)]";

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const router = useRouter();
  const createProject = useCreateProject();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus>("active");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Reset form whenever the dialog opens
  React.useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setStatus("active");
      setTags([]);
      setTagDraft("");
      setError(null);
      createProject.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const canSubmit = name.trim().length > 0 && effectiveSlug.length > 0;

  function commitTagDraft() {
    const next = tagDraft
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (next.length > 0) setTags((prev) => [...prev, ...next]);
    setTagDraft("");
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit || createProject.isPending) return;
    setError(null);

    // Include any un-committed tag text
    const pendingTags = tagDraft
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));

    const payload: ProjectCreateInput = {
      name: name.trim(),
      slug: effectiveSlug,
      description: description.trim() || null,
      status,
      tags: [...tags, ...pendingTags],
    };

    createProject.mutate(payload, {
      onSuccess: (project) => {
        onClose();
        router.push(`/projects/${project.id}`);
      },
      onError: (err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Failed to create project.",
        );
      },
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New Project"
      description="Projects group assets, BOM state, and context packs."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            loading={createProject.isPending}
            iconLeft={<Plus className="w-3.5 h-3.5" />}
            onClick={() => handleSubmit()}
          >
            Create Project
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="new-project-name" className={labelClasses}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="new-project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Agentic Operating System"
            className={inputClasses}
            autoComplete="off"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1">
          <label htmlFor="new-project-slug" className={labelClasses}>
            Slug
          </label>
          <input
            id="new-project-slug"
            type="text"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value) || e.target.value.toLowerCase());
            }}
            placeholder="agentic-operating-system"
            className={`${inputClasses} font-mono`}
            autoComplete="off"
          />
          <p className="text-[10px] text-[var(--ink-faint)]">
            Lowercase letters, numbers, and dashes. Auto-derived from the name.
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="new-project-description" className={labelClasses}>
            Description
          </label>
          <textarea
            id="new-project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            className="w-full px-2.5 py-2 text-xs rounded border border-[var(--border)] bg-white text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-y"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label htmlFor="new-project-status" className={labelClasses}>
            Status
          </label>
          <select
            id="new-project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className={inputClasses}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label htmlFor="new-project-tags" className={labelClasses}>
            Tags
          </label>
          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap pb-0.5">
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  size="xs"
                  color="blue"
                  onRemove={() =>
                    setTags((prev) => prev.filter((t) => t !== tag))
                  }
                />
              ))}
            </div>
          )}
          <input
            id="new-project-tags"
            type="text"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTagDraft();
              }
            }}
            onBlur={commitTagDraft}
            placeholder="Add a tag and press Enter (comma-separate for several)"
            className={inputClasses}
            autoComplete="off"
          />
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="text-[11px] text-red-600">
            {error}
          </p>
        )}

        {/* Allow Enter-to-submit from text inputs */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
          Submit
        </button>
      </form>
    </Dialog>
  );
}
