/**
 * Card zone-composition system (P3-001).
 *
 * ZoneCard — base card with HeaderZone / ContentZone / StatusZone / ActionZone.
 * isInteractiveTarget — click-to-open guard utility.
 */

export { ZoneCard } from "./ZoneCard";
export type { ZoneCardProps, CardTier, ZoneProps } from "./ZoneCard";
export {
  HeaderZone,
  ContentZone,
  StatusZone,
  ActionZone,
  isInteractiveTarget,
} from "./ZoneCard";
