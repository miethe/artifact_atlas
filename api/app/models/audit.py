"""AuditEvent model."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import ActorType, AuditEventType


class AuditEvent(BaseModel):
    """A single atlas audit log entry."""

    model_config = ConfigDict(extra="allow")

    id: str
    timestamp: datetime
    workspace_id: str | None = None
    project_id: str | None = None
    actor_type: ActorType
    actor_id: str
    event_type: AuditEventType
    target_type: str  # asset | bom | slot | template | context_pack | node | project
    target_id: str
    payload: dict[str, Any] | None = None
    ccdash_event_id: str | None = None
