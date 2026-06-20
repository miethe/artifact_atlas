/**
 * Context Packs feature-local types.
 * Extends shared web/lib/types.ts with builder-specific state shapes.
 */

import type {
  ContextPackAudience,
  ContextPackItemType,
  ContextPackStatus,
  ContextPackTargetType,
  IncludeMode,
  Sensitivity,
} from "@/lib/types";

// ============================================================
// Builder wizard steps
// ============================================================

export type WizardStep =
  | "node"        // Step 1: Select target node / project
  | "assets"      // Step 2: Choose assets + include modes
  | "instructions" // Step 3: Agent instructions + metadata
  | "policy"      // Step 4: Policy controls + sensitivity
  | "review";     // Step 5: Review + publish

// ============================================================
// Builder item — selected asset or content item
// ============================================================

export interface BuilderItem {
  /** Stable local key for list reconciliation */
  key: string;
  item_type: ContextPackItemType;
  item_id: string;
  /** Human-readable label (asset title, node name, etc.) */
  label: string;
  include_mode: IncludeMode;
  required: boolean;
  /** Estimated tokens for this item at the chosen include_mode */
  token_estimate?: number;
  /** If asset: sensitivity label for policy gating */
  sensitivity?: Sensitivity;
  /** Whether this item's sensitivity requires review before publish */
  needs_review?: boolean;
  display_order: number;
}

// ============================================================
// Builder draft state (drives wizard form)
// ============================================================

export interface BuilderDraft {
  title: string;
  description: string;
  target_type: ContextPackTargetType;
  target_id: string;
  audience: ContextPackAudience;
  sensitivity: Sensitivity;
  instructions: string;
  expires_at: string | null;  // ISO-8601 or null
  items: BuilderItem[];
  policy: BuilderPolicy;
}

// ============================================================
// Policy controls
// ============================================================

export interface BuilderPolicy {
  allow_external_data: boolean;
  allow_code_execution: boolean;
  network_access: "none" | "restricted" | "allowed";
  agent_access: string | null;
}

// ============================================================
// Publish gate — computed from draft + items
// ============================================================

export interface PublishGate {
  canPublish: boolean;
  /** Reason text if publish is blocked */
  blockReason: string | null;
  /** Items that need review before publish */
  sensitiveItems: BuilderItem[];
}

// ============================================================
// Token estimate summary
// ============================================================

export interface TokenEstimate {
  totalTokens: number;
  itemBreakdown: Array<{ label: string; tokens: number }>;
  /** Estimated LLM context window % (approx 128k window) */
  contextWindowPct: number;
}

// ============================================================
// Publish form values
// ============================================================

export interface PublishRequest {
  destination: "cli" | "file" | "agent" | "control_plane";
  output_path?: string;
}
