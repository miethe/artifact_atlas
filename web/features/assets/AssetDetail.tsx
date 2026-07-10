"use client";

/**
 * AssetDetail — full detail/review page for a single asset, matching the
 * dashboard mockup (artifact_atlas_dashboard_with_system_architecture.png).
 *
 * Layout:
 *   Header  — back link · action row (Open Original / Link to Node /
 *             Add to Context Pack / Compare Variants) · title + lifecycle
 *             chip · meta line · Raw|Candidate|Selected|Canonical stage strip.
 *   Left    — preview (AssetViewer full, with fullscreen wrapper) ·
 *             Provenance · Version History · Related Assets.
 *   Middle  — Details/Metadata/Tags tabs · IntentTree Links · Associations.
 *   Right   — Summary/Comments/Activity rail (AI summary, access policy,
 *             annotations, audit activity).
 *
 * Data: real asset columns wherever they exist; structured conventions in
 * the metadata dict (see detailApi.ts) persisted via PATCH for the rest.
 */

import * as React from "react";
import { clsx } from "clsx";
import { ArrowLeft, AlertCircle, FolderOpen } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { useAsset, usePromoteAsset } from "@/lib/hooks/useAssets";
import type { AssetStatus } from "@/lib/types";
import {
  readDetailMeta,
  useAssetRelationships,
  useRelatedAssets,
} from "./detailApi";
import { ActionRow } from "./components/detail/ActionRow";
import { AssociationsCard } from "./components/detail/AssociationsCard";
import { DetailTabs } from "./components/detail/DetailTabs";
import { FullscreenPreview } from "./components/detail/FullscreenPreview";
import { IntentTreeLinksCard } from "./components/detail/IntentTreeLinksCard";
import { LifecycleStageStrip } from "./components/detail/LifecycleStageStrip";
import { ProvenanceCard } from "./components/detail/ProvenanceCard";
import { RelatedAssetsStrip } from "./components/detail/RelatedAssetsStrip";
import { RightRail } from "./components/detail/RightRail";
import { VersionHistoryCard } from "./components/detail/VersionHistoryCard";
import {
  formatBytes,
  formatDate,
  Snackbar,
  useSnackbar,
} from "./components/detail/shared";

// ============================================================
// Format helpers local to the header meta line
// ============================================================

function formatLabel(mime: string | null | undefined): string | null {
  if (!mime) return null;
  const sub = mime.split("/")[1] ?? mime;
  return sub.split(";")[0].replace(/^vnd\.[^.]*\./, "").toUpperCase().slice(0, 12);
}

// ============================================================
// AssetDetail
// ============================================================

export interface AssetDetailProps {
  assetId: string;
  projectId: string;
}

export function AssetDetail({ assetId, projectId }: AssetDetailProps) {
  const { data: asset, isLoading, isError } = useAsset(assetId);
  const promoteMutation = usePromoteAsset(assetId);
  const { message, notify, clear } = useSnackbar();

  // Relationships fetched once here; shared by Version History, Related
  // Assets, and the Compare Variants action.
  const relationshipsQuery = useAssetRelationships(assetId);
  const relationships = React.useMemo(
    () => relationshipsQuery.data?.items ?? [],
    [relationshipsQuery.data],
  );
  const relatedQuery = useRelatedAssets(assetId, relationships);
  const relatedAssets = relatedQuery.data ?? [];

  const [confirmStage, setConfirmStage] = React.useState<AssetStatus | null>(null);
  const [linkOpen, setLinkOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-8 w-32 rounded" />
          <Skeleton className="h-8 w-40 rounded" />
        </div>
        <Skeleton className="h-7 w-96" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <Skeleton className="xl:col-span-5 h-72 rounded-lg" />
          <Skeleton className="xl:col-span-4 h-72 rounded-lg" />
          <Skeleton className="xl:col-span-3 h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<FolderOpen className="w-10 h-10" aria-hidden />}
          title="Asset not found"
          description="This asset may have been removed or you may not have access."
          action={
            <Link href={`/projects/${projectId}/assets`}>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<ArrowLeft aria-hidden className="w-3.5 h-3.5" />}
              >
                Back to library
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const meta = readDetailMeta(asset);
  const variantCount = relationships.filter(
    (r) => r.relationship_type === "variant_of",
  ).length;

  // ----- Lifecycle stage strip → promote -----
  function requestStage(target: AssetStatus) {
    if (target === "canonical") {
      setConfirmStage(target);
      return;
    }
    promote(target);
  }

  function promote(target: AssetStatus) {
    promoteMutation.mutate(
      { target_status: target, review_notes: null },
      {
        onSuccess: () => {
          setConfirmStage(null);
          notify(`Status updated to ${target.replace(/_/g, " ")}.`, "success");
        },
        onError: (err) => {
          setConfirmStage(null);
          notify(
            (err as Error).message ?? "Status transition failed.",
            "error",
          );
        },
      },
    );
  }

  const metaLine = [
    formatLabel(asset.mime_type),
    asset.captured_at ? `Created ${formatDate(asset.captured_at)}` : null,
    formatBytes(asset.size_bytes),
    meta.dimensions,
  ].filter(Boolean);

  return (
    <div className="h-full overflow-y-auto">
      {/* ===================== Header ===================== */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Link
            href={`/projects/${projectId}/assets`}
            className={clsx(
              "inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
            )}
          >
            <ArrowLeft aria-hidden className="w-3.5 h-3.5" />
            Back to assets
          </Link>

          <ActionRow
            asset={asset}
            projectId={projectId}
            variantCount={variantCount}
            notify={notify}
            linkOpen={linkOpen}
            setLinkOpen={setLinkOpen}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-[var(--ink)] leading-snug truncate">
                {asset.title}
              </h1>
              <StatusBadge status={asset.status} size="md" />
              <SensitivityBadge sensitivity={asset.sensitivity} size="sm" />
            </div>
            {asset.description && (
              <p className="mt-1 text-sm text-[var(--ink-muted)] max-w-2xl">
                {asset.description}
              </p>
            )}
            {metaLine.length > 0 && (
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {metaLine.join(" · ")}
              </p>
            )}
          </div>

          <LifecycleStageStrip
            status={asset.status}
            onSelectStage={requestStage}
            disabled={promoteMutation.isPending}
          />
        </div>
      </div>

      {/* ===================== Body grid ===================== */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-5 items-start">
        {/* ---- Left: preview + provenance + versions + related ---- */}
        <div className="lg:col-span-2 xl:col-span-5 space-y-5 min-w-0">
          <section aria-label="Asset preview">
            <FullscreenPreview asset={asset} />
          </section>
          <ProvenanceCard asset={asset} />
          <VersionHistoryCard
            asset={asset}
            projectId={projectId}
            relationships={relationships}
            relatedAssets={relatedAssets}
          />
          <RelatedAssetsStrip
            asset={asset}
            projectId={projectId}
            relationships={relationships}
            relatedAssets={relatedAssets}
            isLoading={relationshipsQuery.isLoading || relatedQuery.isLoading}
          />
        </div>

        {/* ---- Middle: details tabs + links + associations ---- */}
        <div className="xl:col-span-4 space-y-5 min-w-0">
          <DetailTabs asset={asset} />
          <IntentTreeLinksCard
            assetId={asset.id}
            onLinkNode={() => setLinkOpen(true)}
          />
          <AssociationsCard asset={asset} projectId={projectId} />
        </div>

        {/* ---- Right rail ---- */}
        <RightRail
          asset={asset}
          projectId={projectId}
          notify={notify}
          className="xl:col-span-3 min-w-0"
        />
      </div>

      {/* ===================== Canonical confirm ===================== */}
      <Dialog
        open={confirmStage !== null}
        onClose={() => setConfirmStage(null)}
        title="Confirm canonical promotion"
        description="Canonical assets are the authoritative version for their artifact type. This action is auditable and affects agent access policy."
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmStage(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={promoteMutation.isPending}
              onClick={() => confirmStage && promote(confirmStage)}
            >
              Promote to Canonical
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-2 px-3 py-2 rounded bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30">
          <AlertCircle
            aria-hidden
            className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
          />
          <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <p className="font-medium">This action is auditable.</p>
            <p>
              Asset: <span className="font-semibold">{asset.title}</span>
            </p>
            <p>
              New status: <span className="font-semibold">canonical</span>
            </p>
          </div>
        </div>
      </Dialog>

      <Snackbar message={message} onDone={clear} />
    </div>
  );
}
