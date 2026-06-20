"use client";

/**
 * Providers — wraps the React tree with all client-side providers.
 * Currently: React Query (via QueryProvider).
 * Add Zustand store providers, theme providers, etc. here as needed.
 */

import * as React from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
