// Templates feature — public surface

export { TemplateLibrary } from "./TemplateLibrary";
export type { TemplateLibraryProps } from "./TemplateLibrary";

export { BomBuilder } from "./BomBuilder";
export type { BomBuilderProps } from "./BomBuilder";

// WS-5: route-based three-panel BOM Builder
export { BomBuilderPage } from "./builder/BomBuilderPage";
export type { BomBuilderPageProps } from "./builder/BomBuilderPage";

export { ApplyWizard } from "./components/ApplyWizard";
export type { ApplyWizardProps } from "./components/ApplyWizard";

export { TemplatePreviewPanel } from "./components/TemplatePreviewPanel";
export { TemplateStatusBadge } from "./components/TemplateStatusBadge";
export { TemplateCard } from "./components/TemplateCard";

export {
  useTemplates,
  useTemplate,
  useTemplatePreview,
  useApplyTemplate,
  useSaveBuilderTemplate,
  templateKeys,
} from "./hooks";

export type {
  ArtifactTemplate,
  ArtifactTemplateDomain,
  ArtifactTemplateSlot,
  TemplatePreview,
  ApplyWizardState,
  WizardStep,
  MergeConflict,
  BuilderTemplate,
  BuilderDomain,
  BuilderSlot,
  BuilderSelection,
  TemplateLibraryFilters,
} from "./types";
