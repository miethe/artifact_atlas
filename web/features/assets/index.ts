// Asset feature — public surface
export { AssetLibrary } from "./AssetLibrary";
export type { AssetLibraryProps } from "./AssetLibrary";

export { AssetDetail } from "./AssetDetail";
export type { AssetDetailProps } from "./AssetDetail";

// Sub-components (re-exported for use in other features)
export { AssetCard, AssetCardSkeleton } from "./components/AssetCard";
export type { AssetCardProps } from "./components/AssetCard";

export { AssetThumbnail } from "./components/AssetThumbnail";
export type { AssetThumbnailProps } from "./components/AssetThumbnail";

export { AssetPreview } from "./components/AssetPreview";
export type { AssetPreviewProps } from "./components/AssetPreview";

export { PolicyBadge, PolicyPanel } from "./components/PolicyBadge";
export type { PolicyBadgeProps, PolicyPanelProps } from "./components/PolicyBadge";

export { ProvenancePanel } from "./components/ProvenancePanel";
export type { ProvenancePanelProps } from "./components/ProvenancePanel";

export { NodeLinkChip, BOMSlotChip } from "./components/NodeLinkChip";
export type { NodeLinkChipProps, BOMSlotChipProps } from "./components/NodeLinkChip";

export { BulkActionBar } from "./components/BulkActionBar";
export type { BulkActionBarProps } from "./components/BulkActionBar";

export { FilterBar } from "./components/FilterBar";
export type { FilterBarProps, ActiveFilters } from "./components/FilterBar";

export { SortMenu } from "./components/SortMenu";
export type { SortMenuProps, SortField, SortDir } from "./components/SortMenu";

export { AssetDrawerContent } from "./components/AssetDrawerContent";
export type { AssetDrawerContentProps } from "./components/AssetDrawerContent";

export { MetadataEditForm, MetadataEditDialog } from "./components/MetadataEditForm";
export type { MetadataEditFormProps, MetadataEditDialogProps } from "./components/MetadataEditForm";

export { useAssetFilters } from "./hooks/useAssetFilters";
export type { UseAssetFiltersResult } from "./hooks/useAssetFilters";
