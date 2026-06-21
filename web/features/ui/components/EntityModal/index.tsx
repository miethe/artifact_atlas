"use client";

/**
 * EntityModal — canonical detail surface shell (P2A-002 / P2A-004 / P2A-007).
 *
 * The ONE modal all five AA detail surfaces adopt. Surfaces supply a tab
 * registry + entity identity; this shell owns chrome, tab bar, URL state,
 * code-split panels, "Open full page", focus management, and ARIA.
 *
 * Implementation: wraps `BaseArtifactModal` from `@miethe/ui/primitives`
 * (built on Radix Dialog → focus trap, Escape, role="dialog"/aria-modal,
 * aria-labelledby via DialogTitle are provided by the primitive). Explicit
 * focus-restore + a non-overlay variant live in `useFocusTrap` for the
 * full-page route and the AA Dialog fallback.
 *
 * URL contract (modal-pattern-api.md §2): ?item=<id>&tab=<key>.
 */

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BaseArtifactModal, type Tab } from "@miethe/ui/primitives";
import {
  firstTabKey,
  resolveTabKey,
  type TabRegistry,
} from "./TabRegistry";
import { useEntityModalUrl } from "./useEntityModalUrl";
import { PanelSlot } from "./PanelSlot";

// ============================================================
// Props
// ============================================================

export interface EntityModalProps {
  /** Entity type key (e.g. "asset"); drives the full-page route + icon. */
  entityType: string;
  /** Entity id. Falsy ⇒ MetadataUnavailable placeholder (no crash). */
  entityId?: string;
  /** Project id, for the full-page route + panel props. */
  projectId: string;
  /** Surface-specific tab registry. */
  tabRegistry: TabRegistry;
  /** Called when the modal requests close. */
  onClose: () => void;
  /** Optional title; falls back to a humanized entityType + id. */
  title?: string;
  /** Optional description under the title. */
  description?: string;
  /** Optional artifact-type icon/color resolver, passed to BaseArtifactModal. */
  getTypeConfig?: (
    type: string,
  ) => { icon?: string; color?: string } | undefined;
}

// ============================================================
// Helpers
// ============================================================

function humanizeType(entityType: string): string {
  return entityType
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Full-page route for an entity, preserving the active tab. */
function fullPageHref(
  projectId: string,
  entityType: string,
  entityId: string,
  tab?: string,
): string {
  const base = `/projects/${encodeURIComponent(projectId)}/detail/${encodeURIComponent(
    entityType,
  )}/${encodeURIComponent(entityId)}`;
  return tab ? `${base}?tab=${encodeURIComponent(tab)}` : base;
}

// ============================================================
// MetadataUnavailable placeholder (AC P2A-A resilience)
// ============================================================

function MetadataUnavailable({ title }: { title: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-[var(--ink-muted)]"
      role="status"
    >
      <p className="font-medium text-[var(--ink)]">{title}</p>
      <p>Metadata is unavailable for this item.</p>
    </div>
  );
}

// ============================================================
// EntityModal
// ============================================================

export function EntityModal({
  entityType,
  entityId,
  projectId,
  tabRegistry,
  onClose,
  title,
  description,
  getTypeConfig,
}: EntityModalProps) {
  const { activeTab, setTab } = useEntityModalUrl(tabRegistry);

  const resolvedTitle = title ?? `${humanizeType(entityType)} ${entityId ?? ""}`.trim();

  // Tab bar definitions derived from the registry (order preserved).
  const tabs: Tab[] = React.useMemo(
    () =>
      Object.entries(tabRegistry).map(([value, def]) => ({
        value,
        label: def.label,
        icon: def.icon,
      })),
    [tabRegistry],
  );

  const tabKey = activeTab ?? firstTabKey(tabRegistry);
  const activeDef = tabKey ? tabRegistry[tabKey] : undefined;

  // "Open full page" affordance — preserves the active tab.
  const openFullPage =
    entityId && tabKey
      ? fullPageHref(projectId, entityType, entityId, tabKey)
      : undefined;

  const headerActions = openFullPage ? (
    <Link
      href={openFullPage}
      aria-label="Open full page"
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-[var(--ink-muted)] hover:bg-gray-100 hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <ExternalLink aria-hidden className="h-4 w-4" />
      Open full page
    </Link>
  ) : undefined;

  return (
    <BaseArtifactModal
      artifact={{ name: resolvedTitle, type: entityType, description }}
      open
      onClose={onClose}
      activeTab={tabKey ?? ""}
      onTabChange={setTab}
      tabs={tabs}
      headerActions={headerActions}
      getTypeConfig={getTypeConfig}
    >
      {entityId && activeDef && tabKey ? (
        <PanelSlot
          tabKey={tabKey}
          tab={activeDef}
          panelProps={{ entityType, entityId, projectId }}
        />
      ) : (
        <MetadataUnavailable title={resolvedTitle} />
      )}
    </BaseArtifactModal>
  );
}

// Re-exports for surface consumers + the full-page route.
export {
  createTabRegistry,
  registerEntityRegistry,
  getRegistryForType,
  firstTabKey,
  resolveTabKey,
} from "./TabRegistry";
export type { TabRegistry, TabDefinition, TabPanelProps } from "./TabRegistry";
export { useEntityModalUrl } from "./useEntityModalUrl";
export { useFocusTrap } from "./useFocusTrap";
export { PanelSlot, PanelSkeleton } from "./PanelSlot";
