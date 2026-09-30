"use client";

/**
 * DemoDataBanner — visible label for builds that opted into fixture fallbacks
 * (NEXT_PUBLIC_ATLAS_DEMO_DATA=1). Renders nothing in a live build.
 */

import * as React from "react";
import { FlaskConical } from "lucide-react";
import { isDemoDataEnabled } from "@/lib/demoData";

export function DemoDataBanner() {
  if (!isDemoDataEnabled()) return null;
  return (
    <div
      role="status"
      data-testid="demo-data-banner"
      className="flex items-center gap-2 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 border-b border-amber-300"
    >
      <FlaskConical aria-hidden className="w-3.5 h-3.5" />
      DEMO DATA — fixture fallbacks are enabled; values may not reflect the live catalog.
    </div>
  );
}
