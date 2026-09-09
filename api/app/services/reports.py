"""Read-only delivery-report query and faceting service."""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from app.models.asset import Asset, AssetLink
from app.models.report import ReportAsset, ReportFacets, ReportFacetValue
from app.models.vocabulary import AssetLinkTargetType
from app.repositories import jsonl as _jl
from app.repositories.assets import AssetRepository

UNATTRIBUTED = "__unattributed__"
UNKNOWN = "__unknown__"
UNLINKED = "__unlinked__"


def _text_metadata(asset: Asset, key: str) -> str | None:
    value = (asset.metadata or {}).get(key)
    return value if isinstance(value, str) and value.strip() else None


def _utc_timestamp(value: datetime | None) -> float:
    if value is None:
        return float("-inf")
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.timestamp()


def _parse_generated_at(asset: Asset) -> float:
    value = _text_metadata(asset, "generated_at")
    if value:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return _utc_timestamp(parsed)
        except ValueError:
            pass
    return _utc_timestamp(asset.captured_at)


def _utc_date_bucket(value: datetime | None) -> str:
    if value is None:
        return UNKNOWN
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).date().isoformat()


def _facet(counter: Counter[str]) -> list[ReportFacetValue]:
    return [
        ReportFacetValue(value=value, count=counter[value])
        for value in sorted(counter)
    ]


class ReportService:
    """Query reports and their actual links with bounded registry scans."""

    def __init__(self, registry_dir: Path) -> None:
        self._assets = AssetRepository(registry_dir)
        self._links_path = registry_dir / "asset_links.jsonl"

    def _links_by_asset(self) -> dict[str, list[AssetLink]]:
        """Load links once so a report page never performs per-row JSONL scans."""
        grouped: dict[str, list[AssetLink]] = defaultdict(list)
        for record in _jl.read_all(self._links_path):
            link = AssetLink.model_validate(record)
            grouped[link.asset_id].append(link)
        for links in grouped.values():
            links.sort(key=lambda link: (link.target_type.value, link.target_id, link.id))
        return grouped

    @staticmethod
    def _tracker_ids(links: Iterable[AssetLink]) -> set[str]:
        return {
            link.target_id
            for link in links
            if link.target_type == AssetLinkTargetType.intenttree_node
        }

    def list_reports(
        self,
        *,
        project_ids: list[str] | None = None,
        routes: list[str] | None = None,
        truth_statuses: list[str] | None = None,
        tracker_node_ids: list[str] | None = None,
        captured_after: datetime | None = None,
        captured_before: datetime | None = None,
        query: str | None = None,
        include_links: bool = True,
    ) -> tuple[list[ReportAsset], ReportFacets]:
        """Return the full filtered set, latest first, and its facet counts.

        Project metadata policy matches ``GET /api/projects/{id}/assets``: this
        is a metadata listing, while HTML/bytes remain protected by preview's
        existing policy gate.
        """
        reports = [
            asset
            for asset in self._assets.list()
            if asset.artifact_type_id == "delivery_report"
        ]
        links_by_asset = self._links_by_asset()

        if routes:
            selected = set(routes)
            reports = [asset for asset in reports if (_text_metadata(asset, "route") or UNKNOWN) in selected]

        if truth_statuses:
            selected = set(truth_statuses)
            reports = [
                asset
                for asset in reports
                if (_text_metadata(asset, "truth_status") or UNKNOWN) in selected
            ]

        if captured_after is not None:
            threshold = _utc_timestamp(captured_after)
            reports = [asset for asset in reports if _utc_timestamp(asset.captured_at) >= threshold]
        if captured_before is not None:
            threshold = _utc_timestamp(captured_before)
            reports = [asset for asset in reports if _utc_timestamp(asset.captured_at) <= threshold]

        if query and query.strip():
            needle = query.strip().casefold()
            reports = [
                asset
                for asset in reports
                if needle in asset.title.casefold()
                or (asset.description is not None and needle in asset.description.casefold())
            ]

        if tracker_node_ids:
            selected = set(tracker_node_ids)
            reports = [
                asset
                for asset in reports
                if (
                    self._tracker_ids(links_by_asset.get(asset.id, [])) & selected
                    or (
                        UNLINKED in selected
                        and not self._tracker_ids(links_by_asset.get(asset.id, []))
                    )
                )
            ]

        # Keep the project facet useful while a project lens is active. It is
        # computed after all other filters but before the project filter, so a
        # consumer can still discover unattributed reports without fetching a
        # second unbounded collection.
        project_counts = Counter(asset.project_id or UNATTRIBUTED for asset in reports)
        if project_ids:
            selected = set(project_ids)
            reports = [
                asset
                for asset in reports
                if (asset.project_id or UNATTRIBUTED) in selected
            ]

        reports.sort(key=lambda asset: (_parse_generated_at(asset), asset.id), reverse=True)

        route_counts: Counter[str] = Counter()
        truth_counts: Counter[str] = Counter()
        date_counts: Counter[str] = Counter()
        tracker_counts: Counter[str] = Counter()
        items: list[ReportAsset] = []

        for asset in reports:
            asset_links = links_by_asset.get(asset.id, [])
            route_counts[_text_metadata(asset, "route") or UNKNOWN] += 1
            truth_counts[_text_metadata(asset, "truth_status") or UNKNOWN] += 1
            date_counts[_utc_date_bucket(asset.captured_at)] += 1
            tracker_ids = self._tracker_ids(asset_links)
            if tracker_ids:
                for tracker_id in tracker_ids:
                    tracker_counts[tracker_id] += 1
            else:
                tracker_counts[UNLINKED] += 1

            items.append(
                ReportAsset(
                    **asset.model_dump(),
                    links=asset_links if include_links else [],
                )
            )

        facets = ReportFacets(
            project=_facet(project_counts),
            route=_facet(route_counts),
            truth_status=_facet(truth_counts),
            date_bucket=_facet(date_counts),
            tracker_node=_facet(tracker_counts),
        )
        return items, facets
