/**
 * CoverageSlotTabRegistry — tab registry for the coverage slot detail EntityModal (P2B-003).
 *
 * Tabs: Slot Detail · Coverage Rules
 * Registered with the global entity-type seam as "coverage-slot".
 */

import * as React from "react";
import {
  createTabRegistry,
  registerEntityRegistry,
  type TabRegistry,
} from "@/features/ui/components/EntityModal/TabRegistry";
import { LayoutList, BookOpen } from "lucide-react";

export const COVERAGE_SLOT_TAB_REGISTRY: TabRegistry = createTabRegistry({
  "slot-detail": {
    label: "Slot Detail",
    icon: LayoutList,
    Panel: React.lazy(() => import("./CoverageSlotDetailTabPanel")),
  },
  "coverage-rules": {
    label: "Coverage Rules",
    icon: BookOpen,
    Panel: React.lazy(() => import("./CoverageRulesTabPanel")),
  },
});

// Register with the global type → registry seam.
registerEntityRegistry("coverage-slot", COVERAGE_SLOT_TAB_REGISTRY);
