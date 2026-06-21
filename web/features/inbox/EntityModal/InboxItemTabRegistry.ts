/**
 * InboxItemTabRegistry — tab registry for the inbox item detail EntityModal (P2B-005).
 *
 * Tabs: Preview · Classify · Links
 * Registered with the global entity-type seam as "inbox-item".
 */

import * as React from "react";
import {
  createTabRegistry,
  registerEntityRegistry,
  type TabRegistry,
} from "@/features/ui/components/EntityModal/TabRegistry";
import { Eye, Tag, Link2 } from "lucide-react";

export const INBOX_ITEM_TAB_REGISTRY: TabRegistry = createTabRegistry({
  preview: {
    label: "Preview",
    icon: Eye,
    Panel: React.lazy(() => import("./InboxItemPreviewTabPanel")),
  },
  classify: {
    label: "Classify",
    icon: Tag,
    Panel: React.lazy(() => import("./InboxItemClassifyTabPanel")),
  },
  links: {
    label: "Links",
    icon: Link2,
    Panel: React.lazy(() => import("./InboxItemLinksTabPanel")),
  },
});

// Register with the global type → registry seam.
registerEntityRegistry("inbox-item", INBOX_ITEM_TAB_REGISTRY);
