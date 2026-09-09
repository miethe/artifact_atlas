"""Typed response models for the delivery-report collection lens."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.asset import Asset, AssetLink


class ReportAsset(Asset):
    """A delivery-report asset enriched with its persisted scope links."""

    links: list[AssetLink] = Field(default_factory=list)


class ReportFacetValue(BaseModel):
    """One server-computed facet value and its full-set report count."""

    value: str
    count: int


class ReportFacets(BaseModel):
    """Facets computed after filtering and before cursor pagination."""

    project: list[ReportFacetValue] = Field(default_factory=list)
    route: list[ReportFacetValue] = Field(default_factory=list)
    truth_status: list[ReportFacetValue] = Field(default_factory=list)
    date_bucket: list[ReportFacetValue] = Field(default_factory=list)
    tracker_node: list[ReportFacetValue] = Field(default_factory=list)


class ReportPage(BaseModel):
    """Cursor page of reports plus server-authoritative facet counts."""

    items: list[ReportAsset]
    has_more: bool
    next_cursor: str | None = None
    total: int
    facets: ReportFacets
