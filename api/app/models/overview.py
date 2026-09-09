"""Typed fleet-snapshot persistence and overview response models."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MetricValue = str | int | float | bool | None


class MeasuredMetric(BaseModel):
    """One derived value with its reproducible measurement provenance."""

    model_config = ConfigDict(extra="forbid")
    value: MetricValue
    measured_by: str
    provenance: str


class FleetDerivedProject(BaseModel):
    model_config = ConfigDict(extra="forbid")
    project_id: str
    slug: str
    name: str
    tree_id: str | None = None
    metrics: dict[str, MeasuredMetric] = Field(default_factory=dict)


class FleetAuthoredProject(BaseModel):
    model_config = ConfigDict(extra="forbid")
    summary: str
    next_action: str
    as_of: datetime | None = None
    provenance: str | None = None


class FleetDerived(BaseModel):
    model_config = ConfigDict(extra="forbid")
    projects: dict[str, FleetDerivedProject]


class FleetAuthored(BaseModel):
    model_config = ConfigDict(extra="forbid")
    projects: dict[str, FleetAuthoredProject]


class FleetSnapshot(BaseModel):
    """Collector payload; derived facts and authored prose cannot be intermixed."""

    model_config = ConfigDict(extra="forbid")
    schema_version: Literal[1]
    generated_at: datetime
    collector_version: str
    derived: FleetDerived
    authored: FleetAuthored


class OverviewSource(BaseModel):
    name: Literal["fleet_snapshot"] = "fleet_snapshot"
    collector_version: str
    snapshot_id: str


class LatestReport(BaseModel):
    asset_id: str
    title: str
    route: str
    generated_at: datetime
    href: str


class OverviewDerived(BaseModel):
    tree_id: str | None = None
    metrics: dict[str, MeasuredMetric] = Field(default_factory=dict)


class OverviewProject(BaseModel):
    id: str
    slug: str
    name: str
    project_href: str | None = None
    authored: FleetAuthoredProject
    derived: OverviewDerived
    latest_report: LatestReport | None = None


class OverviewResponse(BaseModel):
    schema_version: Literal[1]
    generated_at: datetime
    source: OverviewSource
    projects: list[OverviewProject]
