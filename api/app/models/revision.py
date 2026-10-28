"""Immutable content snapshot, independent of mutable asset metadata."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ContentRevision(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    asset_id: str
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    size_bytes: int = Field(ge=0)
    storage_uri: str
    created_at: datetime
    mime_type: str | None = None
    filename: str
    metadata: dict[str, Any] | None = None
