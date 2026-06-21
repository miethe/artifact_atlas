/**
 * SlotTabRegistry — tab registry for the BOM slot detail EntityModal (P2B-002).
 *
 * Tabs: Details · Assignments · Links
 * Registered with the global entity-type seam as "bom-slot".
 */

import * as React from "react";
import {
  createTabRegistry,
  registerEntityRegistry,
  type TabRegistry,
} from "@/features/ui/components/EntityModal/TabRegistry";
import { FileText, Users, Link2 } from "lucide-react";

export const SLOT_TAB_REGISTRY: TabRegistry = createTabRegistry({
  details: {
    label: "Details",
    icon: FileText,
    Panel: React.lazy(() => import("./BomSlotDetailsTabPanel")),
  },
  assignments: {
    label: "Assignments",
    icon: Users,
    Panel: React.lazy(() => import("./BomSlotAssignmentsTabPanel")),
  },
  links: {
    label: "Links",
    icon: Link2,
    Panel: React.lazy(() => import("./BomSlotLinksTabPanel")),
  },
});

// Register with the global type → registry seam.
registerEntityRegistry("bom-slot", SLOT_TAB_REGISTRY);
