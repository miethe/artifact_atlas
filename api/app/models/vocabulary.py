"""Canonical vocabulary enumerations for Artifact Atlas (D-008).

This module is the single authoritative source for all enum values used across
the API, registry, and storage layers. Values match shared/openapi.yaml exactly.
"""

from enum import Enum


# ---------------------------------------------------------------------------
# D-008 primary vocabularies
# ---------------------------------------------------------------------------


class AssetStatus(str, Enum):
    """Canonical asset lifecycle status."""

    inbox = "inbox"
    raw = "raw"
    candidate = "candidate"
    in_review = "in_review"
    in_progress = "in_progress"
    selected = "selected"
    canonical = "canonical"
    archived = "archived"


class BomSlotStatus(str, Enum):
    """Canonical BOM slot fill status."""

    missing = "missing"
    partial = "partial"
    in_progress = "in_progress"
    complete = "complete"
    stale = "stale"
    blocked = "blocked"
    not_applicable = "not_applicable"


class Sensitivity(str, Enum):
    """Canonical sensitivity label.

    Assets with client_sensitive or restricted sensitivity default to
    metadata_only agent access.
    """

    public = "public"
    personal = "personal"
    work_sensitive = "work_sensitive"
    client_sensitive = "client_sensitive"
    restricted = "restricted"


class AgentAccess(str, Enum):
    """Canonical agent access level for an asset."""

    none = "none"
    metadata_only = "metadata_only"
    preview_allowed = "preview_allowed"
    read_allowed = "read_allowed"
    context_pack_allowed = "context_pack_allowed"


class AssignmentStatus(str, Enum):
    """Canonical BOM slot assignment status."""

    suggested = "suggested"
    accepted = "accepted"
    rejected = "rejected"
    canonical = "canonical"


class TemplateStatus(str, Enum):
    """Canonical artifact template lifecycle status."""

    core = "core"
    recommended = "recommended"
    optional = "optional"
    experimental = "experimental"
    deprecated = "deprecated"


# ---------------------------------------------------------------------------
# Supporting enumerations from shared/openapi.yaml
# ---------------------------------------------------------------------------


class ProjectStatus(str, Enum):
    """Canonical project lifecycle status."""

    active = "active"
    paused = "paused"
    archived = "archived"


class TemplateType(str, Enum):
    """Artifact template domain type."""

    product = "product"
    architecture = "architecture"
    gtm = "gtm"
    research = "research"
    design_system = "design_system"
    client_proposal = "client_proposal"
    platform_capability = "platform_capability"
    custom = "custom"


class SourceKind(str, Enum):
    """Where an asset originated."""

    vault = "vault"
    local = "local"
    chatgpt = "chatgpt"
    claude = "claude"
    figma = "figma"
    canva = "canva"
    drive = "drive"
    sharepoint = "sharepoint"
    github = "github"
    notion = "notion"
    url = "url"
    eagle = "eagle"
    tagspaces = "tagspaces"
    immich = "immich"
    nextcloud = "nextcloud"
    manual = "manual"


class GeneratedBy(str, Enum):
    """Who or what generated the asset."""

    human = "human"
    chatgpt = "chatgpt"
    claude = "claude"
    agent = "agent"
    figma = "figma"
    other = "other"


class ActorType(str, Enum):
    """Who performed an action in the audit log."""

    user = "user"
    agent = "agent"
    system = "system"


class AuditEventType(str, Enum):
    """Canonical audit event types."""

    asset_added = "asset_added"
    asset_classified = "asset_classified"
    asset_linked = "asset_linked"
    asset_promoted = "asset_promoted"
    asset_archived = "asset_archived"
    deleted = "deleted"
    bom_template_applied = "bom_template_applied"
    bom_slot_filled = "bom_slot_filled"
    context_pack_created = "context_pack_created"
    context_pack_published = "context_pack_published"
    agent_query = "agent_query"
    policy_denied = "policy_denied"
    sync_completed = "sync_completed"


class IncludeMode(str, Enum):
    """How much of an asset's content to embed in a context pack."""

    full = "full"
    summary = "summary"
    metadata = "metadata"
    preview = "preview"
    link_only = "link_only"


class ContextPackStatus(str, Enum):
    """Context pack lifecycle status."""

    draft = "draft"
    ready = "ready"
    published = "published"
    archived = "archived"


class ContextPackAudience(str, Enum):
    """Intended audience for a context pack."""

    human = "human"
    agent = "agent"
    engineering_agent = "engineering_agent"
    research_agent = "research_agent"
    writing_agent = "writing_agent"
    custom = "custom"


class ContextPackTargetType(str, Enum):
    """What a context pack is scoped to."""

    project = "project"
    intenttree_node = "intenttree_node"
    bom_slot = "bom_slot"
    custom = "custom"


class ContextPackItemType(str, Enum):
    """Type of item in a context pack."""

    asset = "asset"
    meatywiki_page = "meatywiki_page"
    intenttree_node = "intenttree_node"
    bom_slot = "bom_slot"
    skillbom = "skillbom"
    external_url = "external_url"
    note = "note"


class ContextPackPublishDestination(str, Enum):
    """Where to publish a context pack."""

    cli = "cli"
    file = "file"
    agent = "agent"
    control_plane = "control_plane"


class BomMergeStrategy(str, Enum):
    """Strategy for merging a template into an existing BOM."""

    new_section = "new_section"
    merge_existing = "merge_existing"
    phase_only = "phase_only"
    node_subtree = "node_subtree"


class SlotPhase(str, Enum):
    """Which project phase a BOM slot belongs to."""

    discovery = "discovery"
    design = "design"
    build = "build"
    launch = "launch"
    operate = "operate"
    review = "review"
    custom = "custom"


class AssetRelationshipType(str, Enum):
    """Type of relationship between two assets."""

    variant_of = "variant_of"
    derived_from = "derived_from"
    references = "references"
    duplicates = "duplicates"
    supersedes = "supersedes"
    superseded_by = "superseded_by"
    evidence_for = "evidence_for"
    input_to = "input_to"
    output_of = "output_of"


class AssetLinkTargetType(str, Enum):
    """Target entity type for an asset link."""

    project = "project"
    topic = "topic"
    feature = "feature"
    intenttree_node = "intenttree_node"
    meatywiki_page = "meatywiki_page"
    bom_slot = "bom_slot"
    context_pack = "context_pack"
    skillbom = "skillbom"
    execution_event = "execution_event"


class AssetLinkRelationship(str, Enum):
    """Relationship between an asset and its linked target."""

    reference = "reference"
    input = "input"
    output = "output"
    evidence = "evidence"
    candidate = "candidate"
    canonical = "canonical"
    required_context = "required_context"
    satisfies_slot = "satisfies_slot"


class AssignedBy(str, Enum):
    """Who created a BOM slot assignment."""

    user = "user"
    agent = "agent"
    system = "system"


class BomStatus(str, Enum):
    """Top-level BOM lifecycle status."""

    active = "active"
    archived = "archived"


class IntegrationSyncMode(str, Enum):
    """How an integration syncs data."""

    file_export = "file_export"
    api = "api"
    disabled = "disabled"


class IntegrationSyncStatus(str, Enum):
    """Last sync outcome for an integration."""

    success = "success"
    error = "error"
    never = "never"
