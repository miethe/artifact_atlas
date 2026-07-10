"use client";

/**
 * ProjectCard — a single project on the /projects index.
 * Name, status chip, description, tag chips, asset count, updated time, star.
 */

import * as React from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { FileText, FolderOpen, Star } from "lucide-react";
import { TagChip } from "@/components/ui";
import type { Project, ProjectStatus } from "@/lib/types";
import { projectMeta } from "../types";

// ============================================================
// Helpers
// ============================================================

function relativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const STATUS_CHIP_CLASSES: Record<ProjectStatus, string> = {
  active: "bg-green-100 text-green-700 border border-green-200",
  paused: "bg-amber-100 text-amber-700 border border-amber-200",
  archived: "bg-gray-100 text-gray-500 border border-gray-200",
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

// ============================================================
// Component
// ============================================================

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const meta = projectMeta(project);
  const tags = (meta.tags ?? []).slice(0, 4);
  const overflowTags = (meta.tags?.length ?? 0) - tags.length;

  return (
    <Link
      href={`/projects/${project.id}`}
      aria-label={`Open project ${project.name}`}
      className={clsx(
        "group flex flex-col gap-2 p-4 bg-white border border-[var(--border)] rounded-lg",
        "hover:border-blue-300 hover:shadow-card-hover transition-all duration-[150ms]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      )}
    >
      {/* Header row: icon + name + star + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            aria-hidden
            className="shrink-0 w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
          >
            <FolderOpen className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-[var(--ink)] truncate group-hover:text-blue-700 transition-colors">
            {project.name}
          </span>
          {meta.starred && (
            <Star
              aria-label="Starred project"
              className="w-3.5 h-3.5 shrink-0 text-amber-400 fill-amber-400"
            />
          )}
        </div>
        <span
          className={clsx(
            "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium",
            STATUS_CHIP_CLASSES[project.status],
          )}
        >
          {STATUS_LABELS[project.status]}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-2 min-h-[2rem]">
        {project.description || "No description yet."}
      </p>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {tags.map((tag) => (
            <TagChip key={tag} label={tag} size="xs" color="blue" />
          ))}
          {overflowTags > 0 && (
            <span className="text-[10px] text-[var(--ink-faint)]">
              +{overflowTags}
            </span>
          )}
        </div>
      )}

      {/* Footer: asset count + updated */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1 border-t border-[var(--border)]">
        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-muted)] tabular-nums">
          <FileText aria-hidden className="w-3 h-3" />
          {meta.asset_count != null
            ? `${meta.asset_count} asset${meta.asset_count === 1 ? "" : "s"}`
            : "—"}
        </span>
        <span className="text-[11px] text-[var(--ink-faint)]">
          Updated {relativeTime(project.updated_at)}
        </span>
      </div>
    </Link>
  );
}
