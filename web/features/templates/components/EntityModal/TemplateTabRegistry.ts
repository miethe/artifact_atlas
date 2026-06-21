/**
 * TemplateTabRegistry — tab registry for the template detail EntityModal (P2B-004).
 *
 * Tabs: Preview · Domains · Apply
 * Registered with the global entity-type seam as "template".
 */

import * as React from "react";
import {
  createTabRegistry,
  registerEntityRegistry,
  type TabRegistry,
} from "@/features/ui/components/EntityModal/TabRegistry";
import { Eye, Layers, Play } from "lucide-react";

export const TEMPLATE_TAB_REGISTRY: TabRegistry = createTabRegistry({
  preview: {
    label: "Preview",
    icon: Eye,
    Panel: React.lazy(() => import("./TemplatePreviewTabPanel")),
  },
  domains: {
    label: "Domains",
    icon: Layers,
    Panel: React.lazy(() => import("./TemplateDomainsTabPanel")),
  },
  apply: {
    label: "Apply",
    icon: Play,
    Panel: React.lazy(() => import("./TemplateApplyTabPanel")),
  },
});

// Register with the global type → registry seam.
registerEntityRegistry("template", TEMPLATE_TAB_REGISTRY);
