"use client";

/**
 * InboxItemClassifyTabPanel — Classify tab for InboxItemTabRegistry (P2B-005).
 * Self-contained: fetches the item, owns the classify mutation.
 */

import * as React from "react";
import { Inbox } from "lucide-react";
import { useInboxItems } from "@/lib/hooks/useInbox";
import { useImportAsset } from "@/lib/hooks/useAssets";
import { InboxClassificationForm } from "../InboxClassificationForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PanelSkeleton } from "@/features/ui/components/EntityModal";
import type { TabPanelProps } from "@/features/ui/components/EntityModal";
import type { AssetCreate } from "@/lib/types";

export default function InboxItemClassifyTabPanel({
  entityId,
  projectId,
}: TabPanelProps) {
  const { data, isLoading } = useInboxItems(projectId);
  const item = data?.items.find((i) => i.id === entityId);
  const importAsset = useImportAsset(projectId);

  const [classifyState, setClassifyState] = React.useState({
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: undefined as string | undefined,
  });

  if (isLoading) return <PanelSkeleton />;

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <EmptyState
          size="sm"
          icon={<Inbox className="h-5 w-5" />}
          title="Item not found"
          description="This inbox item may have been moved or deleted."
        />
      </div>
    );
  }

  async function handleClassify(assetData: AssetCreate) {
    setClassifyState({ isLoading: true, isSuccess: false, isError: false, errorMessage: undefined });
    try {
      await importAsset.mutateAsync(assetData);
      setClassifyState({ isLoading: false, isSuccess: true, isError: false, errorMessage: undefined });
    } catch (err) {
      setClassifyState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: err instanceof Error ? err.message : "Classification failed",
      });
    }
  }

  return (
    <InboxClassificationForm
      key={item.id}
      item={item}
      onClassify={handleClassify}
      isLoading={classifyState.isLoading}
      isSuccess={classifyState.isSuccess}
      isError={classifyState.isError}
      errorMessage={classifyState.errorMessage}
    />
  );
}
