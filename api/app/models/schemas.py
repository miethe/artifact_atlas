"""Backward-compatibility re-export shim.

Any module that previously imported from app.models.schemas continues to work.
New code should import from the specific submodules directly.
"""

# Re-export all vocabulary enums
from app.models.vocabulary import (  # noqa: F401
    ActorType,
    AgentAccess,
    AssignedBy,
    AssignmentStatus,
    AssetLinkRelationship,
    AssetLinkTargetType,
    AssetRelationshipType,
    AssetStatus,
    AuditEventType,
    BomMergeStrategy,
    BomSlotStatus,
    BomStatus,
    ContextPackAudience,
    ContextPackItemType,
    ContextPackPublishDestination,
    ContextPackStatus,
    ContextPackTargetType,
    GeneratedBy,
    IncludeMode,
    IntegrationSyncMode,
    IntegrationSyncStatus,
    ProjectStatus,
    Sensitivity,
    SlotPhase,
    SourceKind,
    TemplateStatus,
    TemplateType,
)

# Re-export entity models
from app.models.asset import (  # noqa: F401
    Asset,
    AssetCreate,
    AssetLink,
    AssetLinkCreate,
    AssetPromoteRequest,
    AssetRelationship,
    AssetUpdate,
)
from app.models.audit import AuditEvent  # noqa: F401
from app.models.bom import (  # noqa: F401
    Bom,
    BomApplyTemplateRequest,
    BomAssignment,
    BomSlot,
    BomUpdate,
    CoverageGroup,
    CoverageSummary,
    SlotAssignRequest,
)
from app.models.context_pack import (  # noqa: F401
    ContextPack,
    ContextPackCreate,
    ContextPackDetail,
    ContextPackFromNodeRequest,
    ContextPackItem,
    ContextPackItemCreate,
    ContextPackPolicy,
    ContextPackPreview,
    ContextPackPublishRequest,
    ContextPackUpdate,
)
from app.models.inbox import (  # noqa: F401
    ApplyClassificationRequest,
    ClassificationItem,
    ClassificationSuggestion,
    InboxImportRequest,
    InboxItem,
)
from app.models.integration import IntegrationStatus  # noqa: F401
from app.models.policy import Policy, PolicyEvaluateRequest  # noqa: F401
from app.models.project import Project, ProjectCreate, ProjectUpdate  # noqa: F401
from app.models.search import SearchFilters, SearchRequest, SearchResult  # noqa: F401
from app.models.shared import (  # noqa: F401
    CursorPage,
    ErrorDetail,
    ErrorEnvelope,
    HealthResponse,
    ValidationErrorDetail,
    ValidationErrorEnvelope,
    ValidationErrorItem,
)
from app.models.template import (  # noqa: F401
    Template,
    TemplateCreate,
    TemplateDetail,
    TemplateDomain,
    TemplatePreview,
    TemplateSlot,
    TemplateUpdate,
)
