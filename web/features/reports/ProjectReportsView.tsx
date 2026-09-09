"use client";

import { AlertTriangle, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAssetModal } from "@/features/assets/hooks/useAssetModal";
import { ReportsTable } from "./ReportsTable";
import { useProjectReports } from "./useProjectReports";

interface ProjectReportsViewProps {
  projectId: string;
}

export function ProjectReportsView({ projectId }: ProjectReportsViewProps) {
  const {
    reports,
    isLoading,
    isError,
    unattributedCount,
    isUnattributedProbeLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProjectReports(projectId);
  const { openAsset, assetModal } = useAssetModal(projectId, {
    title: (id) => reports.find((report) => report.asset.id === id)?.asset.title,
  });

  if (isLoading) {
    return (
      <div
        className="flex-1 animate-pulse bg-gray-50"
        aria-label="Loading project reports…"
      />
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-8">
        <EmptyState
          icon={<AlertTriangle className="h-10 w-10" aria-hidden />}
          title="Couldn’t load reports"
          description="The reports API is unavailable. No fallback data is being shown."
        />
      </div>
    );
  }

  if (reports.length === 0) {
    const unattributedDescription =
      typeof unattributedCount === "number" && unattributedCount > 0
        ? `${unattributedCount} delivery report${unattributedCount === 1 ? "" : "s"} ${unattributedCount === 1 ? "exists" : "exist"} but ${unattributedCount === 1 ? "is" : "are"} not attributed to any project.`
        : undefined;

    return (
      <div className="flex-1 p-8">
        <EmptyState
          icon={<FileText className="h-10 w-10" aria-hidden />}
          title="This project has no reports yet"
          description={
            unattributedDescription ??
            (isUnattributedProbeLoading
              ? "Checking for unattributed reports…"
              : undefined)
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--surface)]">
      <ReportsTable reports={reports} onOpenAsset={openAsset} />
      {hasNextPage && (
        <div className="flex justify-center border-t border-[var(--border)] p-4">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading…" : "Load more reports"}
          </button>
        </div>
      )}
      {assetModal}
    </div>
  );
}
