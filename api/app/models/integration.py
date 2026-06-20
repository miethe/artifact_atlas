"""Integration status models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.vocabulary import IntegrationSyncMode, IntegrationSyncStatus


class IntegrationStatus(BaseModel):
    """Current status record for a configured integration."""

    model_config = ConfigDict(extra="allow")

    id: str
    name: str
    enabled: bool
    sync_mode: IntegrationSyncMode
    last_synced_at: datetime | None = None
    last_sync_status: IntegrationSyncStatus | None = None
    last_sync_error: str | None = None
    export_path: str | None = None
