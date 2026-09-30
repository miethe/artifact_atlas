"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api";
import { FIXTURE_DASHBOARD } from "../fixtures";
import { liveOrDemo } from "../demoData";

// ============================================================
// Query Keys
// ============================================================

export const dashboardKeys = {
  all: ["dashboard"] as const,
  project: (projectId: string) =>
    [...dashboardKeys.all, projectId] as const,
};

// ============================================================
// useDashboard
// ============================================================

export function useDashboard(projectId: string | null | undefined) {
  return useQuery({
    queryKey: dashboardKeys.project(projectId ?? ""),
    queryFn: async () => {
      if (!projectId) throw new Error("No projectId");
      return liveOrDemo(() => fetchDashboard(projectId), () => FIXTURE_DASHBOARD);
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });
}
