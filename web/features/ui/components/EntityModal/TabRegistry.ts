/**
 * TabRegistry — canonical detail-surface tab contract (P2A-003).
 *
 * A registry maps a stable tab key → a lazily-loaded panel. Insertion order
 * is significant: the FIRST registered tab is the fallback when `?tab=` is
 * missing or refers to an unknown key (see modal-pattern-api.md §2).
 *
 * Panels are code-split via React.lazy and rendered behind a Suspense
 * skeleton + error tile inside EntityModal (AC P2A-C).
 */

import * as React from "react";

// ============================================================
// Types
// ============================================================

/** Props every tab panel receives from EntityModal / the full-page route. */
export interface TabPanelProps {
  entityType: string;
  entityId: string;
  projectId: string;
}

export interface TabDefinition {
  /** Human label shown in the tab bar. */
  label: string;
  /** Optional Lucide-style icon component (className-only props). */
  icon?: React.ComponentType<{ className?: string }>;
  /** Code-split panel: React.lazy(() => import("./SomePanel")). */
  Panel: React.LazyExoticComponent<React.ComponentType<TabPanelProps>>;
}

export type TabRegistry = Record<string, TabDefinition>;

// ============================================================
// Helpers
// ============================================================

/**
 * Identity helper that types + validates a registry at the call site.
 * Preserves insertion order (string keys → Object.keys order) so the
 * first-tab fallback is well defined. Throws on an empty registry.
 */
export function createTabRegistry(entries: TabRegistry): TabRegistry {
  if (Object.keys(entries).length === 0) {
    throw new Error("createTabRegistry: registry must define at least one tab");
  }
  return entries;
}

/** Ordered tab keys for a registry (first key = fallback tab). */
export function registryKeys(registry: TabRegistry): string[] {
  return Object.keys(registry);
}

/** First registered tab key, or undefined for an empty registry. */
export function firstTabKey(registry: TabRegistry): string | undefined {
  return registryKeys(registry)[0];
}

/**
 * Resolve the active tab key against a registry, applying the fallback rule:
 * a missing or unknown `requested` key falls back to the first registered tab.
 */
export function resolveTabKey(
  registry: TabRegistry,
  requested: string | null | undefined,
): string | undefined {
  if (requested && requested in registry) return requested;
  return firstTabKey(registry);
}

// ============================================================
// Registry-by-type lookup seam (full-page route, P2A-005)
//
// Surfaces register their per-entityType registry here during P2b migration.
// In P2a this is the seam only; an unknown type resolves to undefined and the
// consumer renders a MetadataUnavailable placeholder (no crash).
// ============================================================

const registriesByType: Record<string, TabRegistry> = {};

/** Register (or replace) the tab registry for an entity type. */
export function registerEntityRegistry(
  entityType: string,
  registry: TabRegistry,
): void {
  registriesByType[entityType] = registry;
}

/** Resolve the registry for an entity type, or undefined if none registered. */
export function getRegistryForType(entityType: string): TabRegistry | undefined {
  return registriesByType[entityType];
}
