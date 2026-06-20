"use client";

import { useQuery } from "@tanstack/react-query";
import { integrationsApi } from "@/lib/api";
import { FIXTURE_INTEGRATIONS } from "@/lib/fixtures";
import type { IntegrationStatus } from "@/lib/types";

// ============================================================
// Query Keys
// ============================================================

export const integrationKeys = {
  all: ["integrations"] as const,
};

// ============================================================
// useIntegrations — live integration status with fixture fallback
// ============================================================

export function useIntegrations() {
  return useQuery({
    queryKey: integrationKeys.all,
    queryFn: async (): Promise<IntegrationStatus[]> => {
      try {
        const res = await integrationsApi.list();
        return res.integrations;
      } catch {
        return FIXTURE_INTEGRATIONS;
      }
    },
    staleTime: 60_000,
    placeholderData: FIXTURE_INTEGRATIONS,
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
