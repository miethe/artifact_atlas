"""Shared model primitives: pagination wrapper and error envelopes."""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


class CursorPage(BaseModel, Generic[T]):
    """Generic cursor-paginated response wrapper matching CursorPage in openapi.yaml."""

    model_config = ConfigDict(extra="allow")

    items: list[T]
    has_more: bool
    next_cursor: str | None = None
    total: int | None = None


# ---------------------------------------------------------------------------
# Error envelopes
# ---------------------------------------------------------------------------


class ErrorDetail(BaseModel):
    """Inner error object."""

    model_config = ConfigDict(extra="allow")

    code: str
    message: str
    detail: dict[str, Any] | None = None
    request_id: str | None = None


class ErrorEnvelope(BaseModel):
    """Top-level error envelope: {error: {code, message, ...}}."""

    error: ErrorDetail


class ValidationErrorItem(BaseModel):
    """A single field-level validation failure."""

    field: str
    message: str
    value: Any = None


class ValidationErrorDetail(BaseModel):
    """Inner object for a 422 validation error."""

    code: str = "validation_error"
    message: str
    request_id: str | None = None
    validation_errors: list[ValidationErrorItem] = Field(default_factory=list)


class ValidationErrorEnvelope(BaseModel):
    """Top-level validation error envelope."""

    error: ValidationErrorDetail


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    """GET /health response."""

    status: str = "ok"
    version: str | None = None
    storage_backend: str | None = None
