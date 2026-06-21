"use client";

/**
 * FullPageDetail — client renderer for the generic full-page detail route
 * (P2A-005). Renders the SAME tab registry as EntityModal but in a full-page
 * layout (no overlay, no focus trap). Active tab is driven by ?tab= with the
 * first-registered-tab fallback. Uses useFocusTrap-free keyboard semantics;
 * the page is a normal document region, not a dialog.
 */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabNavigation, Tabs, TabsContent, type Tab } from "@miethe/ui/primitives";
import {
  firstTabKey,
  getRegistryForType,
  resolveTabKey,
} from "@/features/ui";
import { PanelSlot } from "@/features/ui";

export interface FullPageDetailProps {
  projectId: string;
  entityType: string;
  entityId: string;
}

function MetadataUnavailable({ message }: { message: string }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center text-sm text-[var(--ink-muted)]"
      role="status"
    >
      <p className="font-medium text-[var(--ink)]">Detail unavailable</p>
      <p>{message}</p>
    </div>
  );
}

export function FullPageDetail({
  projectId,
  entityType,
  entityId,
}: FullPageDetailProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const registry = getRegistryForType(entityType);

  const activeTab = React.useMemo(
    () => (registry ? resolveTabKey(registry, searchParams.get("tab")) : undefined),
    [registry, searchParams],
  );

  const setTab = React.useCallback(
    (tab: string) => {
      if (!registry) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", resolveTabKey(registry, tab) ?? "");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, registry, router, searchParams],
  );

  if (!registry) {
    return (
      <MetadataUnavailable
        message={`No detail view is registered for type "${entityType}".`}
      />
    );
  }

  const tabKey = activeTab ?? firstTabKey(registry);
  const activeDef = tabKey ? registry[tabKey] : undefined;

  const tabs: Tab[] = Object.entries(registry).map(([value, def]) => ({
    value,
    label: def.label,
    icon: def.icon,
  }));

  return (
    <Tabs
      value={tabKey ?? ""}
      onValueChange={setTab}
      className="flex h-full min-h-0 flex-1 flex-col px-6 py-4"
    >
      <TabNavigation tabs={tabs} />
      <TabsContent
        value={tabKey ?? ""}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-4"
      >
        {activeDef && tabKey && entityId ? (
          <PanelSlot
            tabKey={tabKey}
            tab={activeDef}
            panelProps={{ entityType, entityId, projectId }}
          />
        ) : (
          <MetadataUnavailable message="This item has no metadata to display." />
        )}
      </TabsContent>
    </Tabs>
  );
}
