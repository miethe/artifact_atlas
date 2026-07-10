"use client";

/**
 * RightRail — Summary / Comments / Activity tab strip (per mockup).
 *
 * Summary  — AI-Generated Summary + Agent Access Policy + Annotations cards.
 * Comments — annotation thread view (same metadata.annotations store).
 * Activity — real audit events for this asset (filtered client-side).
 */

import * as React from "react";
import { clsx } from "clsx";
import { Activity as ActivityIcon } from "lucide-react";
import type { Asset, AuditEvent } from "@/lib/types";
import { readDetailMeta, useAssetActivity } from "../../detailApi";
import { AgentAccessPolicyCard } from "./AgentAccessPolicyCard";
import { AiSummaryCard } from "./AiSummaryCard";
import { AnnotationsCard } from "./AnnotationsCard";
import { Avatar, formatDateTime, relativeTime } from "./shared";

type RailTab = "summary" | "comments" | "activity";

const EVENT_LABELS: Partial<Record<AuditEvent["event_type"], string>> = {
  asset_added: "Asset added",
  asset_classified: "Reclassified",
  asset_linked: "Linked",
  asset_promoted: "Status promoted",
  bom_slot_filled: "BOM slot filled",
  context_pack_created: "Added to context pack",
  agent_query: "Agent query",
  policy_denied: "Policy denied",
};

export interface RightRailProps {
  asset: Asset;
  projectId: string;
  notify: (text: string, tone?: "info" | "success" | "error") => void;
  className?: string;
}

export function RightRail({ asset, projectId, notify, className }: RightRailProps) {
  const [tab, setTab] = React.useState<RailTab>("summary");
  const meta = readDetailMeta(asset);
  const activity = useAssetActivity(
    tab === "activity" ? asset.id : null,
    projectId,
  );

  const tabs: { key: RailTab; label: string; count?: number }[] = [
    { key: "summary", label: "Summary" },
    {
      key: "comments",
      label: "Comments",
      count: meta.annotations.length || undefined,
    },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div className={className}>
      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Asset context"
        className="flex items-center gap-1 border-b border-[var(--border)] mb-4"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "px-3 py-2 text-xs font-medium -mb-px border-b-2 transition-colors duration-[100ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t",
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1 px-1 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[9px] text-[var(--ink-muted)]">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-4">
          <AiSummaryCard asset={asset} notify={notify} />
          <AgentAccessPolicyCard asset={asset} />
          <AnnotationsCard asset={asset} />
        </div>
      )}

      {tab === "comments" && (
        <div className="space-y-4">
          <AnnotationsCard asset={asset} />
        </div>
      )}

      {tab === "activity" && (
        <div>
          {activity.isLoading ? (
            <p className="text-xs text-[var(--ink-muted)]">Loading activity…</p>
          ) : (activity.data?.length ?? 0) === 0 ? (
            <div className="text-center py-6">
              <ActivityIcon
                aria-hidden
                className="w-6 h-6 text-[var(--ink-faint)] mx-auto mb-2"
              />
              <p className="text-xs text-[var(--ink-muted)]">
                No audit events recorded for this asset yet.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {activity.data?.map((e) => (
                <li key={e.id} className="flex items-start gap-2">
                  <Avatar name={e.actor_id ?? e.actor_type} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--ink)]">
                      <span className="font-semibold">
                        {EVENT_LABELS[e.event_type] ?? e.event_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {" "}
                        by {e.actor_id ?? e.actor_type}
                      </span>
                    </p>
                    <p
                      className="text-[10px] text-[var(--ink-faint)]"
                      title={formatDateTime(e.created_at) ?? undefined}
                    >
                      {relativeTime(e.created_at) ?? e.created_at}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
