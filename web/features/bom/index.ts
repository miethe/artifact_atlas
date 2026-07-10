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

// WS-5: BOM tab mockup-fidelity components
export { BomStatCards } from "./components/BomStatCards";
export type { BomStatCardsProps } from "./components/BomStatCards";

export { DomainSection } from "./components/DomainSection";
export type { DomainSectionProps } from "./components/DomainSection";

export { MissingSlotCard } from "./components/MissingSlotCard";
export type { MissingSlotCardProps } from "./components/MissingSlotCard";

export { AssetPickerDialog } from "./components/AssetPickerDialog";
export type { AssetPickerDialogProps } from "./components/AssetPickerDialog";

export { ApplyTemplateDialog } from "./components/ApplyTemplateDialog";
export type { ApplyTemplateDialogProps } from "./components/ApplyTemplateDialog";

export { BomRightRail } from "./components/BomRightRail";
export type { BomRightRailProps, TemplateSourceInfo } from "./components/BomRightRail";

export { FullscreenPane } from "./components/FullscreenPane";
export type { FullscreenPaneProps } from "./components/FullscreenPane";
