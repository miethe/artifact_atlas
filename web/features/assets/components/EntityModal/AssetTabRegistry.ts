/**
 * AssetTabRegistry — tab registry for the asset detail EntityModal (P2B-001).
 *
 * Tabs: Preview · Details · Links · Policy
 * Panels are code-split via React.lazy and rendered by PanelSlot inside EntityModal.
 * Registration with the global entity-type lookup seam is also performed here
 * so the full-page detail route can find the registry by type "asset".
 */

import * as React from "react";
import {
  createTabRegistry,
  registerEntityRegistry,
  type TabRegistry,
} from "@/features/ui/components/EntityModal/TabRegistry";
import { Eye, FileText, Link2, ShieldCheck } from "lucide-react";

export const ASSET_TAB_REGISTRY: TabRegistry = createTabRegistry({
  preview: {
    label: "Preview",
    icon: Eye,
    Panel: React.lazy(() => import("./AssetPreviewTabPanel")),
  },
  details: {
    label: "Details",
    icon: FileText,
    Panel: React.lazy(() => import("./AssetDetailsTabPanel")),
  },
  links: {
    label: "Links",
    icon: Link2,
    Panel: React.lazy(() => import("./AssetLinksTabPanel")),
  },
  policy: {
    label: "Policy",
    icon: ShieldCheck,
    Panel: React.lazy(() => import("./AssetPolicyTabPanel")),
  },
});

// Register with the global type → registry seam (full-page detail route).
registerEntityRegistry("asset", ASSET_TAB_REGISTRY);
