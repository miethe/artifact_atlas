"use client";

/**
 * AgentActivityPanel — recent audit events / agent activity feed.
 * Shows the last N events from the audit log.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { SkeletonRow } from "@/components/ui";
import { PanelShell } from "./PanelShell";
import { auditApi } from "@/lib/api";
import { FIXTURE_AUDIT_EVENTS } from "@/lib/fixtures";
import type { AuditEvent, AuditEventType, ActorType } from "@/lib/types";

// ============================================================
// Audit events hook with fixture fallback
// ============================================================

function useAuditEvents(projectId: string, limit = 10) {
  return useQuery({
    queryKey: ["audit", projectId, limit],
    queryFn: async (): Promise<AuditEvent[]> => {
      try {
        const res = await auditApi.list({
          project_id: projectId,
          limit,
        });
        return res.items;
      } catch {
        return FIXTURE_AUDIT_EVENTS;
      }
    },
    enabled: !!projectId,
    staleTime: 20_000,
    placeholderData: FIXTURE_AUDIT_EVENTS,
  });
}

// ============================================================
// Event type label and icon color
// ============================================================

const EVENT_LABELS: Partial<Record<AuditEventType, string>> = {
  asset_added: "Asset added",
  asset_classified: "Asset classified",
  asset_linked: "Asset linked",
  asset_promoted: "Asset promoted",
  bom_template_applied: "BOM template applied",
  bom_slot_filled: "BOM slot filled",
  context_pack_created: "Context pack created",
  context_pack_published: "Context pack published",
  agent_query: "Agent query",
  policy_denied: "Policy denied",
  sync_completed: "Sync completed",
};

const ACTOR_LABELS: Record<ActorType, string> = {
  user: "User",
  agent: "Agent",
  system: "System",
};

function relativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function actorDotColor(type: ActorType): string {
  return {
    user: "bg-blue-400",
    agent: "bg-purple-400",
    system: "bg-gray-400",
  }[type];
}

// ============================================================
// Component
// ============================================================

interface AgentActivityPanelProps {
  projectId: string;
}

export function AgentActivityPanel({ projectId }: AgentActivityPanelProps) {
  const { data: events, isLoading } = useAuditEvents(projectId, 10);

  return (
    <PanelShell
      title="Agent Activity"
      subtitle="Recent audit events"
      icon={<Activity className="w-3.5 h-3.5" />}
      ariaLabel="Recent agent activity"
    >
      {isLoading && !events ? (
        <div className="flex flex-col gap-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <EmptyState
          size="sm"
          title="No activity yet"
          description="Agent and user activity will appear here."
          icon={<Activity className="w-8 h-8" />}
        />
      ) : (
        <ul role="list" className="divide-y divide-[var(--border)]">
          {events.map((evt) => (
            <li key={evt.id}>
              <div className="flex items-start gap-2 px-3 py-2 hover:bg-[var(--surface-sunken)] transition-colors">
                {/* Actor dot */}
                <span
                  aria-hidden
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${actorDotColor(evt.actor_type)}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--ink)] leading-tight truncate">
                    {EVENT_LABELS[evt.event_type] ?? evt.event_type}
                  </p>
                  <p className="text-[10px] text-[var(--ink-faint)] leading-tight mt-px truncate">
                    {ACTOR_LABELS[evt.actor_type]}
                    {evt.actor_id ? ` · ${evt.actor_id}` : ""}
                  </p>
                </div>
                <span className="text-[10px] text-[var(--ink-faint)] shrink-0 tabular-nums">
                  {relativeTime(evt.created_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
