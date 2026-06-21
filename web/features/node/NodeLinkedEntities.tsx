"use client";

import * as React from "react";
import { clsx } from "clsx";
import {
  FileText,
  Package2,
  BookOpen,
  LayoutGrid,
  ExternalLink,
  Link2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { NodeLinkedEntity } from "./NodeDemoFixtures";

// ============================================================
// NodeLinkedEntities — panel showing entities linked to a node
// ============================================================

const KIND_CONFIG: Record<
  NodeLinkedEntity["kind"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  asset: {
    label: "Asset",
    icon: <FileText aria-hidden className="w-3.5 h-3.5" />,
    color: "text-blue-600",
  },
  context_pack: {
    label: "Context Pack",
    icon: <Package2 aria-hidden className="w-3.5 h-3.5" />,
    color: "text-purple-600",
  },
  meatywiki_page: {
    label: "MeatyWiki Page",
    icon: <BookOpen aria-hidden className="w-3.5 h-3.5" />,
    color: "text-amber-600",
  },
  bom_slot: {
    label: "BOM Slot",
    icon: <LayoutGrid aria-hidden className="w-3.5 h-3.5" />,
    color: "text-green-700",
  },
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  canonical: "bg-green-100 text-green-700",
  candidate: "bg-blue-100 text-blue-700",
  in_review: "bg-amber-100 text-amber-700",
  draft: "bg-gray-100 text-gray-600",
  ready: "bg-green-100 text-green-700",
  published: "bg-green-100 text-green-700",
  raw: "bg-purple-100 text-purple-700",
};

interface NodeLinkedEntitiesProps {
  entities: NodeLinkedEntity[];
}

export function NodeLinkedEntities({ entities }: NodeLinkedEntitiesProps) {
  if (entities.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<Link2 className="w-8 h-8" aria-hidden />}
        title="No linked entities"
        description="Link assets, context packs, or BOM slots to this node."
      />
    );
  }

  // Group by kind
  const grouped = entities.reduce<Record<string, NodeLinkedEntity[]>>((acc, e) => {
    const key = e.kind;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="divide-y divide-[var(--border)]">
      {Object.entries(grouped).map(([kind, items]) => {
        const config = KIND_CONFIG[kind as NodeLinkedEntity["kind"]];
        return (
          <div key={kind} className="py-3 px-1">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className={clsx("shrink-0", config.color)}>{config.icon}</span>
              <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                {config.label}s ({items.length})
              </span>
            </div>
            <div className="space-y-0.5">
              {items.map((entity) => (
                <EntityRow key={entity.id} entity={entity} config={config} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// EntityRow
// ============================================================

function EntityRow({
  entity,
  config,
}: {
  entity: NodeLinkedEntity;
  config: (typeof KIND_CONFIG)[NodeLinkedEntity["kind"]];
}) {
  const statusClass =
    entity.status && STATUS_BADGE_COLORS[entity.status]
      ? STATUS_BADGE_COLORS[entity.status]
      : "bg-gray-100 text-gray-600";

  const inner = (
    <div
      className={clsx(
        "flex items-center gap-2 px-2 py-1.5 rounded",
        "hover:bg-gray-50 transition-colors group",
        "focus-within:ring-2 focus-within:ring-blue-500",
      )}
    >
      <span className={clsx("shrink-0", config.color)}>{config.icon}</span>
      <span className="flex-1 min-w-0 text-xs text-[var(--ink)] truncate">
        {entity.label}
      </span>
      {entity.status && (
        <span
          className={clsx(
            "shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium",
            statusClass,
          )}
        >
          {entity.status.replace("_", " ")}
        </span>
      )}
      {entity.href && (
        <ExternalLink
          aria-hidden
          className="w-3 h-3 text-[var(--ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );

  if (entity.href) {
    return (
      <a
        href={entity.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${entity.label}`}
        className="block focus-visible:outline-none"
      >
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}
