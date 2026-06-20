"""Policy evaluation models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import ActorType, IncludeMode


class PolicyEvaluateRequest(BaseModel):
    """Request body for POST /api/policies/evaluate."""

    model_config = ConfigDict(extra="allow")

    resource_type: str  # asset | context_pack | bom_slot | template | project
    resource_id: str
    action: str  # read | read_content | read_preview | write | delete | publish | assign | promote
    actor_type: ActorType | None = None
    actor_id: str | None = None
    include_mode: IncludeMode | None = None
    context: dict[str, Any] | None = None


class Policy(BaseModel):
    """Policy evaluation result."""

    model_config = ConfigDict(extra="allow")

    decision: str  # allow | deny
    resource_type: str
    resource_id: str
    action: str
    rule_triggered: str | None = None
    reason: str | None = None
    audit_required: bool = True
    effective_include_mode: IncludeMode | None = None
