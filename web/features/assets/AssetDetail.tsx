"use client";

/**
 * AssetDetail — full detail/review page for a single asset.
 * Sections: large preview, lifecycle status (with confirm gate),
 * provenance, versions (scaffold), related assets (scaffold),
 * AI summary placeholder, policy panel, metadata editing.
 */

import * as React from "react";
import { clsx } from "clsx";
import {
  ArrowLeft,
  Edit2,
  Package,
  Shield,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensitivityBadge } from "@/components/ui/SensitivityBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog } from "@/components/ui/Dialog";
import { TagChip } from "@/components/ui/TagChip";
import { useAsset, usePromoteAsset, useUpdateAsset } from "@/lib/hooks/useAssets";
import type { AssetStatus } from "@/lib/types";
import { AssetPreview } from "./components/AssetPreview";
import { ProvenancePanel } from "./components/ProvenancePanel";
import { PolicyPanel } from "./components/PolicyBadge";
import { MetadataEditForm } from "./components/MetadataEditForm";

// ============================================================
// Lifecycle status transition config
// ============================================================

type TransitionOption = {
  targetStatus: AssetStatus;
  label: string;
  variant: "primary" | "secondary" | "danger" | "outline";
  requiresConfirm?: boolean;
  confirmTitle?: string;
  confirmDesc?: string;
};

function getTransitions(current: AssetStatus): TransitionOption[] {
  const transitions: Partial<Record<AssetStatus, TransitionOption[]>> = {
    inbox: [
      { targetStatus: "raw", label: "Classify as Raw", variant: "secondary" },
      { targetStatus: "candidate", label: "Mark Candidate", variant: "secondary" },
      { targetStatus: "archived", label: "Archive", variant: "danger" },
    ],
    raw: [
      { targetStatus: "candidate", label: "Mark Candidate", variant: "primary" },
      { targetStatus: "archived", label: "Archive", variant: "danger" },
    ],
    candidate: [
      { targetStatus: "in_review", label: "Send for Review", variant: "primary" },
      { targetStatus: "selected", label: "Select", variant: "secondary" },
      { targetStatus: "raw", label: "Revert to Raw", variant: "ghost" as "secondary" },
    ],
    in_review: [
      {
        targetStatus: "selected",
        label: "Approve & Select",
        variant: "primary",
      },
      {
        targetStatus: "canonical",
        label: "Promote to Canonical",
        variant: "primary",
        requiresConfirm: true,
        confirmTitle: "Confirm canonical promotion",
        confirmDesc:
          "Canonical assets are the authoritative version for their artifact type. This action is auditable and affects agent access policy. Review carefully before confirming.",
      },
      { targetStatus: "candidate", label: "Return to Candidate", variant: "secondary" },
    ],
    selected: [
      {
        targetStatus: "canonical",
        label: "Promote to Canonical",
        variant: "primary",
        requiresConfirm: true,
        confirmTitle: "Confirm canonical promotion",
        confirmDesc:
          "Canonical assets are the authoritative version for their artifact type. This action is auditable and affects agent access policy. Review carefully before confirming.",
      },
      { targetStatus: "in_review", label: "Send for Review", variant: "secondary" },
      { targetStatus: "archived", label: "Archive", variant: "danger" },
    ],
    canonical: [
      { targetStatus: "archived", label: "Archive (revoke canonical)", variant: "danger", requiresConfirm: true,
        confirmTitle: "Archive canonical asset?",
        confirmDesc: "Archiving a canonical asset may break references. Ensure a replacement is available." },
    ],
    archived: [
      { targetStatus: "raw", label: "Restore as Raw", variant: "secondary" },
    ],
    in_progress: [
      { targetStatus: "selected", label: "Mark Selected", variant: "primary" },
      { targetStatus: "archived", label: "Archive", variant: "danger" },
    ],
  };
  return transitions[current] ?? [];
}

// ============================================================
// Section headers
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon aria-hidden className="w-4 h-4 text-[var(--ink-muted)]" />
      <h2 className="text-sm font-semibold text-[var(--ink)] flex-1">{title}</h2>
      {action}
    </div>
  );
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
  const updateMutation = useUpdateAsset(assetId);

  const [confirmTransition, setConfirmTransition] = React.useState<TransitionOption | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="w-full h-64 rounded-lg" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  if (isError || !asset) {
    return (
      <div className="p-8">
        <EmptyState
          title="Asset not found"
          description="This asset may have been removed or you may not have access."
          action={
            <Link href={`/projects/${projectId}/assets`}>
              <Button variant="secondary" size="sm" iconLeft={<ArrowLeft aria-hidden className="w-3.5 h-3.5" />}>
                Back to library
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const transitions = getTransitions(asset.status);

  function handleTransitionClick(t: TransitionOption) {
    if (t.requiresConfirm) {
      setConfirmTransition(t);
    } else {
      promoteMutation.mutate({
        target_status: t.targetStatus,
        review_notes: null,
      });
    }
  }

  function confirmAndPromote() {
    if (!confirmTransition) return;
    promoteMutation.mutate(
      {
        target_status: confirmTransition.targetStatus,
        review_notes: null,
      },
      {
        onSuccess: () => setConfirmTransition(null),
      },
    );
  }

  const tags = asset.metadata
    ? Object.entries(asset.metadata)
        .filter(([, v]) => typeof v === "string")
        .map(([k]) => k)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full overflow-y-auto lg:overflow-hidden">
      {/* Main content column */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 min-w-0">
        {/* Breadcrumb + back */}
        <Link
          href={`/projects/${projectId}/assets`}
          className={clsx(
            "inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]",
            "transition-colors duration-[100ms]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded",
          )}
        >
          <ArrowLeft aria-hidden className="w-3.5 h-3.5" />
          Asset library
        </Link>

        {/* Title + badges */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-[var(--ink)] leading-snug">
            {asset.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={asset.status} size="md" />
            <SensitivityBadge sensitivity={asset.sensitivity} size="sm" />
            <span className="text-xs text-[var(--ink-muted)]">
              {asset.source_kind} · {asset.mime_type ?? "unknown type"}
            </span>
          </div>
        </div>

        {/* Large preview */}
        <section aria-label="Asset preview">
          <AssetPreview asset={asset} size="lg" className="w-full" />
          {asset.uri.startsWith("http") && (
            <a
              href={asset.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
            >
              Open source URL
              <ExternalLink aria-hidden className="w-2.5 h-2.5" />
            </a>
          )}
        </section>

        {/* Description */}
        {asset.description && (
          <section aria-label="Description">
            <SectionHeader icon={Layers} title="Description" />
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              {asset.description}
            </p>
          </section>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <section aria-label="Tags">
            <SectionHeader icon={Layers} title="Tags" />
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <TagChip key={tag} label={tag} size="sm" />
              ))}
            </div>
          </section>
        )}

        {/* Versions — scaffold */}
        <section aria-label="Versions">
          <SectionHeader icon={Clock} title="Versions" />
          <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3">
            <p className="text-xs text-[var(--ink-muted)]">
              Version history will be shown here in a future update.
            </p>
          </div>
        </section>

        {/* Related assets — scaffold */}
        <section aria-label="Related assets">
          <SectionHeader icon={Layers} title="Related assets" />
          <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3">
            <p className="text-xs text-[var(--ink-muted)]">
              Related assets (variants, derived, references) will be shown here.
            </p>
          </div>
        </section>

        {/* AI summary placeholder */}
        <section aria-label="AI summary">
          <SectionHeader
            icon={Sparkles}
            title="AI Summary"
            action={
              <Button size="xs" variant="ghost" disabled title="AI summarization coming soon">
                Generate
              </Button>
            }
          />
          <div className="rounded border border-dashed border-[var(--border)] bg-[var(--surface-sunken)] px-4 py-3 flex items-center gap-2">
            <Sparkles aria-hidden className="w-4 h-4 text-purple-400 shrink-0" />
            <p className="text-xs text-[var(--ink-muted)]">
              AI-generated summaries will appear here. Requires agent access ≥ preview.
            </p>
          </div>
        </section>
      </div>

      {/* Right rail: actions + policy + provenance */}
      <aside
        aria-label="Asset actions and policy"
        className={clsx(
          "lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border)]",
          "overflow-y-auto bg-[var(--surface)]",
        )}
      >
        <div className="p-4 space-y-4">
          {/* Lifecycle actions */}
          <section aria-label="Lifecycle actions">
            <SectionHeader icon={CheckCircle2} title="Lifecycle" />

            {/* Success / error feedback */}
            {promoteMutation.isSuccess && (
              <div
                role="status"
                className="mb-2 flex items-center gap-1.5 px-2.5 py-2 rounded bg-green-50 border border-green-200"
              >
                <CheckCircle2 aria-hidden className="w-3.5 h-3.5 text-green-600" />
                <p className="text-xs text-green-700">Status updated successfully.</p>
              </div>
            )}
            {promoteMutation.isError && (
              <div
                role="alert"
                className="mb-2 flex items-center gap-1.5 px-2.5 py-2 rounded bg-red-50 border border-red-200"
              >
                <AlertCircle aria-hidden className="w-3.5 h-3.5 text-red-600" />
                <p className="text-xs text-red-700">
                  {(promoteMutation.error as Error)?.message ?? "Failed to update status."}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              {transitions.length === 0 && (
                <p className="text-xs text-[var(--ink-muted)]">
                  No lifecycle transitions available for {asset.status} status.
                </p>
              )}
              {transitions.map((t) => (
                <Button
                  key={t.targetStatus}
                  variant={t.variant as "primary" | "secondary" | "danger" | "outline"}
                  size="sm"
                  fullWidth
                  loading={promoteMutation.isPending && confirmTransition?.targetStatus === t.targetStatus}
                  onClick={() => handleTransitionClick(t)}
                >
                  {t.label}
                  {t.requiresConfirm && (
                    <span className="ml-1 text-[10px] opacity-70">(confirm)</span>
                  )}
                </Button>
              ))}
            </div>
          </section>

          {/* Edit metadata */}
          <section aria-label="Edit metadata">
            <SectionHeader
              icon={Edit2}
              title="Metadata"
              action={
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setEditOpen((v) => !v)}
                  aria-expanded={editOpen}
                  iconLeft={<Edit2 aria-hidden className="w-3 h-3" />}
                >
                  {editOpen ? "Cancel" : "Edit"}
                </Button>
              }
            />

            {editOpen ? (
              <MetadataEditForm
                asset={asset}
                mode="inline"
                onClose={() => setEditOpen(false)}
                onSuccess={() => setEditOpen(false)}
              />
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--ink-muted)]">Status</span>
                  <StatusBadge status={asset.status} size="xs" />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--ink-muted)]">Sensitivity</span>
                  <SensitivityBadge sensitivity={asset.sensitivity} size="xs" showIcon={false} />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--ink-muted)]">Agent access</span>
                  <span className="font-mono text-[11px] text-[var(--ink)]">{asset.agent_access}</span>
                </div>
              </div>
            )}
          </section>

          {/* Policy panel */}
          <section aria-label="Policy">
            <SectionHeader icon={Shield} title="Policy" />
            <PolicyPanel
              agentAccess={asset.agent_access}
              canonicalGated={asset.status !== "canonical"}
              onChangeAccess={(access) =>
                updateMutation.mutate({ agent_access: access })
              }
            />
          </section>

          {/* Provenance */}
          <section aria-label="Provenance">
            <ProvenancePanel asset={asset} />
          </section>

          {/* Add to context pack (placeholder) */}
          <section aria-label="Context pack">
            <SectionHeader icon={Package} title="Context Pack" />
            <Button
              size="sm"
              variant="secondary"
              fullWidth
              iconLeft={<Package aria-hidden className="w-3.5 h-3.5" />}
              disabled
              title="Context pack assignment coming soon"
            >
              Add to context pack
            </Button>
          </section>
        </div>
      </aside>

      {/* Canonical/status confirm dialog */}
      {confirmTransition && (
        <Dialog
          open={!!confirmTransition}
          onClose={() => setConfirmTransition(null)}
          title={confirmTransition.confirmTitle ?? `Confirm: ${confirmTransition.label}`}
          description={confirmTransition.confirmDesc}
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmTransition(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={promoteMutation.isPending}
                onClick={confirmAndPromote}
              >
                {confirmTransition.label}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2 px-3 py-2 rounded bg-amber-50 border border-amber-200">
              <AlertCircle aria-hidden className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 space-y-1">
                <p className="font-medium">This action is auditable.</p>
                <p>Asset: <span className="font-semibold">{asset.title}</span></p>
                <p>New status: <span className="font-semibold">{confirmTransition.targetStatus}</span></p>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
