"use client";

/**
 * ProjectsIndexView — the /  (Projects) landing page.
 * Every project rendered as a card, plus a prominent "New Project" CTA
 * opening the create dialog (WS-4 Task A).
 */

import * as React from "react";
import { FolderOpen, Plus } from "lucide-react";
import { Button, EmptyState, SkeletonCard } from "@/components/ui";
import { useProjects } from "@/lib/hooks/useProjects";
import { ProjectCard } from "./components/ProjectCard";
import { CreateProjectDialog } from "./components/CreateProjectDialog";

export function ProjectsIndexView() {
  const projectsQuery = useProjects({ limit: 200 });
  const [createOpen, setCreateOpen] = React.useState(false);

  const projects = projectsQuery.data?.items;
  const isLoading = projectsQuery.isLoading && !projects;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
      {/* === Page header === */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-lg font-semibold text-[var(--ink)] leading-tight">
            Projects
          </h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Each project owns its asset graph, Artifact BOM, and context packs.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          iconLeft={<Plus className="w-4 h-4" />}
          onClick={() => setCreateOpen(true)}
        >
          New Project
        </Button>
      </div>

      {/* === Project cards === */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start indexing assets."
          icon={<FolderOpen className="w-10 h-10" />}
          action={
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreateOpen(true)}
            >
              New Project
            </Button>
          }
        />
      ) : (
        <div
          role="list"
          aria-label="All projects"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stable-grid"
        >
          {projects.map((project) => (
            <div role="listitem" key={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}

      {/* === Create dialog === */}
      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
