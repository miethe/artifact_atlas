/**
 * domainMeta — shared helpers for domain display (icon + label) on the BOM tab.
 */

import * as React from "react";
import {
  Building2,
  Monitor,
  Megaphone,
  FlaskConical,
  Target,
  Wrench,
  Shield,
  Palette,
  Folder,
} from "lucide-react";

/** Map a domain name to a representative icon (keyword matching). */
export function getDomainIcon(
  domain: string,
  className = "w-4 h-4",
): React.ReactNode {
  const d = domain.toLowerCase();
  const props = { className, "aria-hidden": true as const };
  if (d.includes("arch")) return <Building2 {...props} />;
  if (d.includes("frontend") || d.includes("ui") || d.includes("ux"))
    return <Monitor {...props} />;
  if (d.includes("design")) return <Palette {...props} />;
  if (d.includes("market") || d.includes("gtm")) return <Megaphone {...props} />;
  if (d.includes("research") || d.includes("validation"))
    return <FlaskConical {...props} />;
  if (d.includes("strategy") || d.includes("product")) return <Target {...props} />;
  if (d.includes("engineer") || d.includes("implement") || d.includes("build"))
    return <Wrench {...props} />;
  if (d.includes("govern") || d.includes("compliance") || d.includes("security"))
    return <Shield {...props} />;
  return <Folder {...props} />;
}

/** Humanize a slug-style artifact_type_id → "Architecture Diagram". */
export function humanizeTypeId(typeId: string | null | undefined): string {
  if (!typeId) return "Artifact";
  return typeId
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Display name for a slot: prefer explicit name, fall back to type ID. */
export function slotDisplayName(slot: {
  name?: string | null;
  artifact_type_id?: string | null;
}): string {
  return slot.name || humanizeTypeId(slot.artifact_type_id);
}
