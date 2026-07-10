/**
 * Feature-local project types (WS-4).
 *
 * The backend Project model gained additive fields (`tags`, `starred`,
 * `asset_count`) — see api/app/models/project.py + shared/openapi.yaml.
 * During the parallel wave we avoid editing the shared web/lib/types.ts,
 * so the extensions live here as intersection types.
 */

import type { Project, ProjectCreate, ProjectUpdate } from "@/lib/types";

export interface ProjectMetaFields {
  /** Free-form organizational tag labels */
  tags?: string[];
  /** Whether the project is starred/favorited */
  starred?: boolean;
  /** Live asset count — enriched on list responses only */
  asset_count?: number | null;
}

export type ProjectWithMeta = Project & ProjectMetaFields;

export type ProjectCreateInput = ProjectCreate & {
  tags?: string[];
  starred?: boolean;
};

export type ProjectUpdateInput = ProjectUpdate & {
  tags?: string[];
  starred?: boolean;
};

/** Read the additive meta fields off any Project without unsafe casts at call sites. */
export function projectMeta(project: Project | null | undefined): ProjectMetaFields {
  if (!project) return {};
  const p = project as ProjectWithMeta;
  return {
    tags: Array.isArray(p.tags) ? p.tags : [],
    starred: p.starred === true,
    asset_count: typeof p.asset_count === "number" ? p.asset_count : null,
  };
}

/** Derive a URL-safe slug from a project name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
