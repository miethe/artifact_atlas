"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import {
  parseDeliveryReportMetadata,
  type ProjectReportRow,
} from "./types";

export const projectReportKeys = {
  all: ["reports"] as const,
  project: (projectId: string) =>
    [...projectReportKeys.all, "project", projectId] as const,
};

async function loadProjectReports(projectId: string, cursor?: string): Promise<{
  reports: ProjectReportRow[];
  unattributedCount: number | undefined;
  nextCursor: string | undefined;
}> {
  const page = await reportsApi.list({
    project_id: [projectId],
    cursor,
    limit: 200,
    include: ["links"],
  });
  return {
    nextCursor: page.next_cursor ?? undefined,
    unattributedCount: page.facets.project.find(
      (facet) => facet.value === "__unattributed__",
    )?.count,
    reports: page.items.map((asset) => ({
      asset,
      metadata: parseDeliveryReportMetadata(asset.metadata),
      trackerLinks: (asset.links ?? []).filter(
        (link) => link.target_type === "intenttree_node",
      ),
    })),
  };
}

export function useProjectReports(projectId: string) {
  const reportsQuery = useInfiniteQuery({
    queryKey: projectReportKeys.project(projectId),
    queryFn: ({ pageParam }) => loadProjectReports(projectId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15_000,
  });

  const firstPage = reportsQuery.data?.pages[0];

  return {
    reports: reportsQuery.data?.pages.flatMap((page) => page.reports) ?? [],
    isLoading: reportsQuery.isLoading,
    isError: reportsQuery.isError,
    error: reportsQuery.error,
    unattributedCount: firstPage?.unattributedCount,
    isUnattributedProbeLoading: false,
    isUnattributedProbeError: reportsQuery.isError,
    hasNextPage: reportsQuery.hasNextPage,
    isFetchingNextPage: reportsQuery.isFetchingNextPage,
    fetchNextPage: reportsQuery.fetchNextPage,
  };
}
