"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import type { ReportsParams } from "@/lib/types";
import {
  parseDeliveryReportMetadata,
  type ProjectReportRow,
} from "./types";

export type ReportFilters = Pick<
  ReportsParams,
  | "project_id"
  | "route"
  | "truth_status"
  | "tracker_node_id"
  | "captured_after"
  | "captured_before"
>;

async function loadReports(filters: ReportFilters, cursor?: string) {
  const page = await reportsApi.list({
    ...filters,
    cursor,
    limit: 200,
    include: ["links"],
  });
  return {
    page,
    rows: page.items.map((asset) => ({
      asset,
      metadata: parseDeliveryReportMetadata(asset.metadata),
      trackerLinks: (asset.links ?? []).filter(
        (link) => link.target_type === "intenttree_node",
      ),
    })),
  };
}

export function useReports(filters: ReportFilters) {
  const query = useInfiniteQuery({
    queryKey: ["reports", "workspace", filters],
    queryFn: ({ pageParam }) => loadReports(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.page.next_cursor ?? undefined,
    staleTime: 15_000,
  });

  const firstPage = query.data?.pages[0]?.page;
  const reports = query.data?.pages.flatMap((page) => page.rows) ?? [];

  return {
    data: firstPage,
    reports,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
