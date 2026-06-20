/**
 * Shared test utilities — RTL + React Query wrapper.
 * Provides a render helper that wraps components in QueryClientProvider.
 */
import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const [qc] = React.useState(() => makeQueryClient());
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function renderWithQuery(ui: React.ReactElement, opts?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: Wrapper, ...opts });
}

export { renderWithQuery, makeQueryClient, Wrapper };
export * from "@testing-library/react";
