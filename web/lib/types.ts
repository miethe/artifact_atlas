/**
 * TypeScript types matching shared/openapi.yaml schemas used by the UI.
 * Keep in sync with the frozen Phase 0 API contract.
 */

// ============================================================
// Canonical Enumerations
// ============================================================

export type ProjectStatus = "active" | "paused" | "archived";

export type AssetStatus =
  | "inbox"
  | "raw"
  | "candidate"
  | "in_review"
  | "in_progress"
  | "selected"
  | "canonical"
  | "archived";

export type BomSlotStatus =
  | "missing"
  | "partial"
  | "in_progress"
  | "complete"
  | "stale"
  | "blocked"
  | "not_applicable";

export type Sensitivity =
  | "public"
  | "personal"
  | "work_sensitive"
  | "client_sensitive"
  | "restricted";

export type AgentAccess =
  | "none"
  | "metadata_only"
  | "preview_allowed"
  | "read_allowed"
  | "context_pack_allowed";

export type AssignmentStatus = "suggested" | "accepted" | "rejected" | "canonical";

export type TemplateStatus =
  | "core"
  | "recommended"
  | "optional"
  | "experimental"
  | "deprecated";

export type TemplateType =
  | "product"
  | "architecture"
  | "gtm"
  | "research"
  | "design_system"
  | "client_proposal"
  | "platform_capability"
  | "custom";

export type SourceKind =
  | "vault"
  | "local"
  | "chatgpt"
  | "claude"
  | "figma"
  | "canva"
  | "drive"
  | "sharepoint"
  | "github"
  | "notion"
  | "url"
  | "eagle"
  | "tagspaces"
  | "immich"
  | "nextcloud"
  | "manual";

export type GeneratedBy =
  | "human"
  | "chatgpt"
  | "claude"
  | "agent"
  | "figma"
  | "other"
  | null;

export type SlotPhase =
  | "discovery"
  | "design"
  | "build"
  | "launch"
  | "operate"
  | "review"
  | "custom"
  | null;

export type AssetRelationshipType =
  | "variant_of"
  | "derived_from"
  | "references"
  | "duplicates"
  | "supersedes"
  | "superseded_by"
  | "evidence_for"
  | "input_to"
  | "output_of";

export type AssetLinkTargetType =
  | "project"
  | "topic"
  | "feature"
  | "intenttree_node"
  | "meatywiki_page"
  | "bom_slot"
  | "context_pack"
  | "skillbom"
  | "execution_event";

export type AssetLinkRelationship =
  | "reference"
  | "input"
  | "output"
  | "evidence"
  | "candidate"
  | "canonical"
  | "required_context"
  | "satisfies_slot";

export type ContextPackStatus = "draft" | "ready" | "published" | "archived";

export type ContextPackAudience =
  | "human"
  | "agent"
  | "engineering_agent"
  | "research_agent"
  | "writing_agent"
  | "custom";

export type ContextPackTargetType =
  | "project"
  | "intenttree_node"
  | "bom_slot"
  | "custom";

export type ContextPackItemType =
  | "asset"
  | "meatywiki_page"
  | "intenttree_node"
  | "bom_slot"
  | "skillbom"
  | "external_url"
  | "note";

export type IncludeMode = "full" | "summary" | "metadata" | "preview" | "link_only";

export type AuditEventType =
  | "asset_added"
  | "asset_classified"
  | "asset_linked"
  | "asset_promoted"
  | "bom_template_applied"
  | "bom_slot_filled"
  | "context_pack_created"
  | "context_pack_published"
  | "agent_query"
  | "policy_denied"
  | "sync_completed";

export type ActorType = "user" | "agent" | "system";
export type AssignedBy = "user" | "agent" | "system";

export type ContextPackPublishDestination =
  | "cli"
  | "file"
  | "agent"
  | "control_plane";

// ============================================================
// Pagination
// ============================================================

export interface CursorPage<T> {
  items: T[];
  has_more: boolean;
  next_cursor: string | null;
  total: number | null;
}

// ============================================================
// Error Envelope
// ============================================================

export interface ApiError {
  error: {
    code: string;
    message: string;
    detail?: Record<string, unknown> | null;
    request_id?: string | null;
  };
}

// ============================================================
// Projects
// ============================================================

export interface Project {
  id: string;
  workspace_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  status: ProjectStatus;
  meatywiki_page_ref?: string | null;
  intent_id?: string | null;
  root_intenttree_node_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  slug: string;
  description?: string | null;
  status?: ProjectStatus;
  meatywiki_page_ref?: string | null;
  intent_id?: string | null;
  root_intenttree_node_id?: string | null;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  meatywiki_page_ref?: string | null;
  intent_id?: string | null;
  root_intenttree_node_id?: string | null;
}

// ============================================================
// Assets
// ============================================================

export interface Asset {
  id: string;
  workspace_id?: string | null;
  project_id?: string | null;
  title: string;
  description?: string | null;
  artifact_type_id?: string | null;
  source_id?: string | null;
  source_kind: SourceKind;
  uri: string;
  original_uri?: string | null;
  storage_uri?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  hash_sha256?: string | null;
  thumbnail_uri?: string | null;
  preview_text_uri?: string | null;
  status: AssetStatus;
  sensitivity: Sensitivity;
  agent_access: AgentAccess;
  created_by?: string | null;
  generated_by?: GeneratedBy;
  captured_at: string;
  source_created_at?: string | null;
  source_updated_at?: string | null;
  last_indexed_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AssetCreate {
  title: string;
  description?: string | null;
  artifact_type_id?: string | null;
  source_kind: SourceKind;
  uri: string;
  original_uri?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  status?: AssetStatus;
  sensitivity: Sensitivity;
  agent_access?: AgentAccess;
  generated_by?: GeneratedBy;
  metadata?: Record<string, unknown> | null;
}

export interface AssetUpdate {
  title?: string;
  description?: string | null;
  artifact_type_id?: string | null;
  status?: AssetStatus;
  sensitivity?: Sensitivity;
  agent_access?: AgentAccess;
  metadata?: Record<string, unknown> | null;
}

export interface AssetPromoteRequest {
  target_status: AssetStatus;
  review_notes?: string | null;
  supersedes_asset_id?: string | null;
}

export interface AssetLink {
  id: string;
  asset_id: string;
  target_type: AssetLinkTargetType;
  target_id: string;
  relationship: AssetLinkRelationship;
  created_at: string;
}

export interface AssetLinkCreate {
  target_type: AssetLinkTargetType;
  target_id: string;
  relationship: AssetLinkRelationship;
}

// Asset filter params (for useAssets/useAssetSearch)
export interface AssetFilters {
  status?: AssetStatus[];
  sensitivity?: Sensitivity;
  source_kind?: SourceKind[];
  agent_access?: AgentAccess;
  artifact_type_id?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}

// ============================================================
// Inbox
// ============================================================

export interface InboxItem {
  id: string;
  title: string;
  source_kind: SourceKind;
  uri: string;
  status: AssetStatus;
  sensitivity: Sensitivity;
  agent_access: AgentAccess;
  mime_type?: string | null;
  thumbnail_uri?: string | null;
  captured_at: string;
  suggested_artifact_type_id?: string | null;
  suggested_intenttree_node_id?: string | null;
}

export interface InboxImportRequest {
  source_kind: SourceKind;
  uris?: string[];
  sensitivity?: Sensitivity;
  agent_access?: AgentAccess;
  metadata?: Record<string, unknown> | null;
}

// ============================================================
// BOM
// ============================================================

export interface BomSlot {
  id: string;
  bom_id: string;
  name: string;
  description?: string | null;
  artifact_type_id?: string | null;
  phase?: SlotPhase;
  required: boolean;
  status: BomSlotStatus;
  assignment_count: number;
  /** Assignments with status === "accepted" (aligns with backend BomSlot schema). */
  accepted_assignment_count?: number | null;
  domain?: string | null;
}

export interface Bom {
  id: string;
  project_id: string;
  name: string;
  status: string;
  source_templates?: string[] | null;
  coverage_score: number;
  slots?: BomSlot[];
}

export interface BomAssignment {
  id: string;
  slot_id: string;
  asset_id: string;
  status: AssignmentStatus;
  assigned_by: AssignedBy;
  assigned_at: string;
  notes?: string | null;
}

export interface SlotAssignRequest {
  asset_id: string;
  notes?: string | null;
}

// ============================================================
// Coverage
// ============================================================

export interface CoverageSummary {
  bom_id: string;
  total_slots: number;
  filled_slots: number;
  missing_slots: number;
  coverage_pct: number;
  by_domain?: Array<{
    domain: string;
    total: number;
    filled: number;
    coverage_pct: number;
  }>;
}

// ============================================================
// Context Packs
// ============================================================

export interface ContextPack {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  status: ContextPackStatus;
  audience: ContextPackAudience;
  target_type: ContextPackTargetType;
  target_id?: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ContextPackCreate {
  name: string;
  description?: string | null;
  audience?: ContextPackAudience;
  target_type?: ContextPackTargetType;
  target_id?: string | null;
}

// ============================================================
// Dashboard (project aggregate view — derived from API responses)
// ============================================================

export interface DashboardStats {
  total_assets: number;
  assets_by_status: Partial<Record<AssetStatus, number>>;
  bom_coverage_pct: number;
  inbox_count: number;
  canonical_count: number;
  context_pack_count: number;
  recent_activity?: AuditEvent[];
}

// ============================================================
// Audit
// ============================================================

export interface AuditEvent {
  id: string;
  event_type: AuditEventType;
  actor_type: ActorType;
  actor_id?: string | null;
  project_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  detail?: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// Integrations
// ============================================================

export interface IntegrationStatus {
  id: string;
  name: string;
  enabled: boolean;
  last_sync_at?: string | null;
  status: "connected" | "disconnected" | "error" | "syncing";
  error_message?: string | null;
}

// ============================================================
// Search
// ============================================================

export interface SearchRequest {
  q: string;
  project_id?: string;
  kinds?: string[];
  limit?: number;
}

export interface SearchResult {
  asset_id: string;
  title: string;
  snippet?: string | null;
  score: number;
  status: AssetStatus;
  source_kind: SourceKind;
}
