from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: Literal["ok"]


class Project(BaseModel):
    id: str
    name: str
    slug: str
    status: Literal["active", "paused", "archived"]


class Asset(BaseModel):
    id: str
    project_id: str | None = None
    title: str
    source_kind: str
    uri: str
    status: str
    sensitivity: str
    agent_access: str


class BomSlot(BaseModel):
    id: str
    required: bool
    status: Literal["missing", "partial", "in_progress", "complete", "stale", "blocked", "not_applicable"]


class CoverageSummary(BaseModel):
    required_total: int
    required_complete: int
    coverage_score: float
