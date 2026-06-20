// BOM feature — public surface
export { BomOverview } from "./BomOverview";
export type { BomOverviewProps } from "./BomOverview";

export { SlotCard, SlotCardSkeleton } from "./components/SlotCard";
export type { SlotCardProps } from "./components/SlotCard";

export { SlotStatusBadge, SLOT_STATUS_CONFIG } from "./components/SlotStatusBadge";
export type { SlotStatusBadgeProps, SlotStatusConfig } from "./components/SlotStatusBadge";

export { CoverageBar } from "./components/CoverageBar";
export type { CoverageBarProps } from "./components/CoverageBar";

export { SlotLegend } from "./components/SlotLegend";
export type { SlotLegendProps } from "./components/SlotLegend";

export { useSlotAssign, useSlotUnassign, useSlotMarkNA, useSlotRequestAsset } from "./hooks/useBomSlot";
export type { RequestAssetPayload } from "./hooks/useBomSlot";

export { useBomCoverageExtended } from "./hooks/useBomCoverage";
export type { ExtendedCoverage, DomainCoverage } from "./hooks/useBomCoverage";
