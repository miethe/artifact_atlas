"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api";
import {
  fixtureProjectsPage,
  FIXTURE_PROJECTS,
} from "../fixtures";
import { liveOrDemo } from "../demoData";
import type { Project, ProjectCreate, ProjectUpdate } from "../types";

// ============================================================
// Query Keys
// ============================================================

export const projectKeys = {
  all: ["projects"] as const,
  list: (params?: Record<string, unknown>) =>
    [...projectKeys.all, "list", params] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

// ============================================================
// useProjects — list all projects
// ============================================================

export function useProjects(params?: {
  status?: string;
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    // No placeholderData: first paint is "loading", never fixture projects.
    queryFn: () =>
      liveOrDemo(() => projectsApi.list(params), fixtureProjectsPage),
    staleTime: 30_000,
  });
}

// ============================================================
// useProject — single project
// ============================================================

export function useProject(projectId: string | null | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: async () => {
      if (!projectId) throw new Error("No projectId");
      return liveOrDemo(
        () => projectsApi.get(projectId),
        () => {
          const fixture = FIXTURE_PROJECTS.find((p) => p.id === projectId);
          if (fixture) return fixture;
          throw new Error(`Project ${projectId} not found in demo fixtures`);
        },
      );
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

// ============================================================
// Mutations
// ============================================================

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectCreate) => projectsApi.create(data),
    onSuccess: (project: Project) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.setQueryData(projectKeys.detail(project.id), project);
    },
  });
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectUpdate) =>
      projectsApi.update(projectId, data),
    onSuccess: (project: Project) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.setQueryData(projectKeys.detail(projectId), project);
    },
  });
}
