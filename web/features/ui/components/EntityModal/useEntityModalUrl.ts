"use client";

/**
 * useEntityModalUrl — URL state for the canonical detail modal (P2A-004).
 *
 * Single source of truth = the URL search params (modal-pattern-api.md §2):
 *   ?item=<id>   present ⇒ open, absent ⇒ closed
 *   ?tab=<key>   active tab (fallback to first registered tab)
 *
 * - open()      → push ?item=<id>&tab=<firstTabKey>   (new history entry)
 * - close()     → push without ?item                  (new history entry)
 * - setTab(key) → replace ?tab=<key>                  (no extra history entry)
 *
 * Browser back/forward Just Works because state derives from useSearchParams.
 * Params unrelated to item/tab are preserved on every mutation.
 */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveTabKey, type TabRegistry } from "./TabRegistry";

export interface UseEntityModalUrlResult {
  /** Current ?item= value, or null when the modal is closed. */
  itemId: string | null;
  /** Whether the modal should render (item param present). */
  isOpen: boolean;
  /** Active tab key resolved against the registry (first tab as fallback). */
  activeTab: string | undefined;
  /** Open the modal for an entity at its first (or given) tab. */
  open: (itemId: string, tab?: string) => void;
  /** Close the modal (removes ?item=). */
  close: () => void;
  /** Switch the active tab (replaces ?tab=, no new history entry). */
  setTab: (tab: string) => void;
}

export function useEntityModalUrl(
  registry: TabRegistry,
): UseEntityModalUrlResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const itemId = searchParams.get("item");
  const isOpen = itemId !== null && itemId !== "";

  const activeTab = useMemo(
    () => resolveTabKey(registry, searchParams.get("tab")),
    [registry, searchParams],
  );

  // Build a URL from the current params, mutating only item/tab.
  const buildUrl = useCallback(
    (mutate: (p: URLSearchParams) => void): string => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [pathname, searchParams],
  );

  const open = useCallback(
    (id: string, tab?: string) => {
      const url = buildUrl((p) => {
        p.set("item", id);
        p.set("tab", resolveTabKey(registry, tab) ?? "");
      });
      router.push(url);
    },
    [buildUrl, registry, router],
  );

  const close = useCallback(() => {
    const url = buildUrl((p) => {
      p.delete("item");
      p.delete("tab");
    });
    router.push(url);
  }, [buildUrl, router]);

  const setTab = useCallback(
    (tab: string) => {
      const url = buildUrl((p) => {
        p.set("tab", resolveTabKey(registry, tab) ?? "");
      });
      router.replace(url);
    },
    [buildUrl, registry, router],
  );

  return { itemId, isOpen, activeTab, open, close, setTab };
}
