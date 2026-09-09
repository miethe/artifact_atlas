"use client";

import { useQuery } from "@tanstack/react-query";
import { overviewApi } from "@/lib/api";

export function useOverview() {
  return useQuery({
    queryKey: ["overview", "workspace"],
    queryFn: () => overviewApi.get(),
    staleTime: 30_000,
  });
}
