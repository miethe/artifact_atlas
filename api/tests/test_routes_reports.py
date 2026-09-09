"""Route tests for the cross-project ``GET /api/reports`` lens."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import AssetCreate, AssetLinkCreate
from app.repositories import jsonl as _jl
from app.repositories.assets import AssetRepository

client = TestClient(app)


def _create_report(
    registry: Path,
    report_id: str,
    *,
    project_id: str | None,
    title: str,
    route: str | None,
    truth_status: str | None,
    generated_at: str,
    captured_at: str,
    sensitivity: str = "personal",
    agent_access: str = "preview_allowed",
) -> None:
    metadata = {
        "route": route,
        "truth_status": truth_status,
        "generated_at": generated_at,
        "revision": 1,
        "generated_from": {"commit": f"commit-{report_id}"},
    }
    repo = AssetRepository(registry)
    repo.create(
        report_id,
        AssetCreate(
            title=title,
            artifact_type_id="delivery_report",
            source_kind="local",
            uri=f"file://{report_id}.html",
            mime_type="text/html",
            status="candidate",
            sensitivity=sensitivity,
            agent_access=agent_access,
            metadata=metadata,
        ),
        project_id=project_id,
    )
    _jl.update_record(registry / "assets.jsonl", report_id, {"captured_at": captured_at})


def _link_tracker(registry: Path, report_id: str, tracker_id: str, suffix: str) -> None:
    AssetRepository(registry).create_link(
        f"link_{suffix}",
        report_id,
        AssetLinkCreate(
            target_type="intenttree_node",
            target_id=tracker_id,
            relationship="evidence",
        ),
    )


def _seed_reports(registry: Path) -> None:
    _create_report(
        registry,
        "asset_report_old",
        project_id="proj_alpha",
        title="Backend Report Old",
        route="program",
        truth_status="verified",
        generated_at="2026-01-01T00:00:00Z",
        captured_at="2026-01-01T01:00:00Z",
    )
    _create_report(
        registry,
        "asset_report_new",
        project_id="proj_beta",
        title="Backend Report New",
        route="dossier",
        truth_status="needs_review",
        generated_at="2026-01-03T00:00:00Z",
        captured_at="2026-01-03T01:00:00Z",
    )
    _create_report(
        registry,
        "asset_report_unattributed",
        project_id=None,
        title="Backend Report Unattributed",
        route="program",
        truth_status="verified",
        generated_at="2026-01-02T00:00:00Z",
        captured_at="2026-01-02T01:00:00Z",
    )
    _link_tracker(registry, "asset_report_old", "node_shared", "old")
    _link_tracker(registry, "asset_report_new", "node_shared", "new")

    # Same title prefix, but not a report: the route must never widen into a
    # generic cross-project asset listing.
    AssetRepository(registry).create(
        "asset_not_report",
        AssetCreate(
            title="Backend Report Ordinary Asset",
            source_kind="local",
            uri="file://ordinary.md",
            sensitivity="personal",
        ),
        project_id="proj_alpha",
    )


def _facet_map(body: dict, key: str) -> dict[str, int]:
    return {entry["value"]: entry["count"] for entry in body["facets"][key]}


def test_reports_collection_spans_projects_and_keeps_unattributed(
    tmp_registry: Path,
) -> None:
    _seed_reports(tmp_registry)

    response = client.get("/api/reports", params={"q": "Backend Report", "limit": 20})

    assert response.status_code == 200, response.text
    body = response.json()
    assert [item["id"] for item in body["items"]] == [
        "asset_report_new",
        "asset_report_unattributed",
        "asset_report_old",
    ]
    assert {item["project_id"] for item in body["items"]} == {
        "proj_alpha",
        "proj_beta",
        None,
    }
    assert all(item["artifact_type_id"] == "delivery_report" for item in body["items"])
    assert body["items"][0]["links"][0]["target_id"] == "node_shared"
    assert body["items"][1]["links"] == []


def test_reports_facets_use_full_filtered_set_before_paging(tmp_registry: Path) -> None:
    _seed_reports(tmp_registry)

    response = client.get("/api/reports", params={"q": "Backend Report", "limit": 1})

    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["items"]) == 1
    assert body["total"] == 3
    assert body["has_more"] is True
    assert body["next_cursor"] == "1"
    assert _facet_map(body, "project") == {
        "__unattributed__": 1,
        "proj_alpha": 1,
        "proj_beta": 1,
    }
    assert _facet_map(body, "route") == {"dossier": 1, "program": 2}
    assert _facet_map(body, "truth_status") == {"needs_review": 1, "verified": 2}
    assert _facet_map(body, "date_bucket") == {
        "2026-01-01": 1,
        "2026-01-02": 1,
        "2026-01-03": 1,
    }
    assert _facet_map(body, "tracker_node") == {"__unlinked__": 1, "node_shared": 2}


def test_reports_filters_compose_over_actual_links_and_dates(tmp_registry: Path) -> None:
    _seed_reports(tmp_registry)

    linked = client.get(
        "/api/reports",
        params=[
            ("q", "Backend Report"),
            ("tracker_node_id", "node_shared"),
            ("route", "program"),
            ("route", "dossier"),
            ("captured_after", "2026-01-02T00:00:00Z"),
            ("captured_before", "2026-01-03T23:59:59Z"),
        ],
    )

    assert linked.status_code == 200, linked.text
    assert [item["id"] for item in linked.json()["items"]] == ["asset_report_new"]

    unattributed = client.get(
        "/api/reports",
        params={"q": "Backend Report", "project_id": "__unattributed__"},
    )
    assert unattributed.status_code == 200, unattributed.text
    body = unattributed.json()
    assert [item["id"] for item in body["items"]] == [
        "asset_report_unattributed"
    ]
    assert _facet_map(body, "project") == {
        "__unattributed__": 1,
        "proj_alpha": 1,
        "proj_beta": 1,
    }


def test_reports_date_bucket_and_filter_share_utc_semantics(tmp_registry: Path) -> None:
    _create_report(
        tmp_registry,
        "asset_report_offset",
        project_id="proj_alpha",
        title="Offset timezone report",
        route="program",
        truth_status="verified",
        generated_at="2026-01-02T04:30:00Z",
        captured_at="2026-01-01T23:30:00-05:00",
    )

    response = client.get(
        "/api/reports",
        params={
            "q": "Offset timezone report",
            "captured_after": "2026-01-02T00:00:00Z",
            "captured_before": "2026-01-02T23:59:59.999Z",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert [item["id"] for item in body["items"]] == ["asset_report_offset"]
    assert _facet_map(body, "date_bucket") == {"2026-01-02": 1}


def test_reports_cursor_order_is_stable(tmp_registry: Path) -> None:
    _seed_reports(tmp_registry)

    first = client.get(
        "/api/reports", params={"q": "Backend Report", "limit": 1}
    )
    assert first.status_code == 200, first.text
    first_body = first.json()

    second = client.get(
        "/api/reports",
        params={
            "q": "Backend Report",
            "limit": 1,
            "cursor": first_body["next_cursor"],
        },
    )
    assert second.status_code == 200, second.text
    assert first_body["items"][0]["id"] == "asset_report_new"
    assert second.json()["items"][0]["id"] == "asset_report_unattributed"


def test_reports_metadata_matches_project_asset_listing(tmp_registry: Path) -> None:
    _seed_reports(tmp_registry)
    _create_report(
        tmp_registry,
        "asset_report_sensitive",
        project_id="proj_alpha",
        title="Sensitive client report",
        route="program",
        truth_status="verified",
        generated_at="2025-12-31T00:00:00Z",
        captured_at="2025-12-31T01:00:00Z",
        sensitivity="client_sensitive",
        agent_access="metadata_only",
    )

    project_assets = client.get("/api/projects/proj_alpha/assets")
    reports = client.get(
        "/api/reports", params={"project_id": "proj_alpha", "q": "Backend Report"}
    )

    assert project_assets.status_code == 200, project_assets.text
    assert reports.status_code == 200, reports.text
    expected = next(
        item
        for item in project_assets.json()["items"]
        if item["id"] == "asset_report_old"
    )
    actual = reports.json()["items"][0]
    assert {key: actual[key] for key in expected} == expected
    assert actual["links"][0]["target_id"] == "node_shared"

    sensitive_project_assets = client.get(
        "/api/projects/proj_alpha/assets", params={"q": "Sensitive client report"}
    )
    sensitive_reports = client.get(
        "/api/reports",
        params={"project_id": "proj_alpha", "q": "Sensitive client report"},
    )
    assert sensitive_project_assets.status_code == 200
    assert sensitive_reports.status_code == 200
    expected_sensitive = sensitive_project_assets.json()["items"][0]
    actual_sensitive = sensitive_reports.json()["items"][0]
    assert {key: actual_sensitive[key] for key in expected_sensitive} == expected_sensitive
    assert actual_sensitive["sensitivity"] == "client_sensitive"
    assert actual_sensitive["agent_access"] == "metadata_only"
