"use client";

import { useQuery } from "@tanstack/react-query";
import { integrationsApi } from "@/lib/api";
import { FIXTURE_INTEGRATIONS } from "@/lib/fixtures";
import { liveOrDemo } from "@/lib/demoData";
import type { IntegrationStatus } from "@/lib/types";

// ============================================================
// Query Keys
// ============================================================

export const integrationKeys = {
  all: ["integrations"] as const,
};

// ============================================================
// useIntegrations — live integration status (fixtures only in demo builds)
// ============================================================

export function useIntegrations() {
  return useQuery({
    queryKey: integrationKeys.all,
    queryFn: (): Promise<IntegrationStatus[]> =>
      liveOrDemo(
        async () => (await integrationsApi.list()).integrations,
        () => FIXTURE_INTEGRATIONS,
      ),
    staleTime: 60_000,
  });
}

export function useMeatyWikiIntegration() {
  const query = useIntegrations();
  const meatywiki = query.data?.find((i) => i.id === "meatywiki");
  return {
    ...query,
    integration: meatywiki ?? null,
    isConnected: meatywiki?.status === "connected",
  };
}
