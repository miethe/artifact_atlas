/**
 * features/ui — shared UI feature surfaces (canonical detail shell, etc.).
 */

export { EntityModal } from "./components/EntityModal";
export type { EntityModalProps } from "./components/EntityModal";
export {
  createTabRegistry,
  registerEntityRegistry,
  getRegistryForType,
  firstTabKey,
  resolveTabKey,
} from "./components/EntityModal/TabRegistry";
export type {
  TabRegistry,
  TabDefinition,
  TabPanelProps,
} from "./components/EntityModal/TabRegistry";
export { useEntityModalUrl } from "./components/EntityModal/useEntityModalUrl";
export { useFocusTrap } from "./components/EntityModal/useFocusTrap";
export {
  PanelSlot,
  PanelSkeleton,
} from "./components/EntityModal/PanelSlot";
