"""Route tests for GET /api/search — including its M4 cross-project browse use."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_BASE_ASSET = {
    "source_kind": "local",
    "uri": "file:///tmp/test.md",
    "status": "inbox",
    "sensitivity": "personal",
    "agent_access": "metadata_only",
}


def _create_project(name: str) -> str:
    resp = client.post(
        "/api/projects",
        json={"name": name, "slug": name.lower().replace(" ", "-"), "status": "active"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_asset(project_id: str, **overrides) -> dict:
    payload = {**_BASE_ASSET, "title": "Asset", **overrides}
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_search_requires_no_query(tmp_registry) -> None:
    """``q`` is optional — a blank query is the cross-project browse mode."""
    pid = _create_project("SearchNoQuery")
    _create_asset(pid, title="Anything")
    resp = client.get("/api/search")
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_search_spans_multiple_projects(tmp_registry) -> None:
    """M4 AC2: an unfiltered browse query returns assets from 2+ projects."""
    pid_a = _create_project("SearchProjectA")
    pid_b = _create_project("SearchProjectB")
    _create_asset(pid_a, title="From A")
    _create_asset(pid_b, title="From B")

    # limit=200 covers the seeded fixture registry too — file order otherwise
    # cuts off before these two newly-appended assets at the default limit.
    resp = client.get("/api/search", params={"limit": 200})
    assert resp.status_code == 200
    body = resp.json()
    project_ids = {r["project_id"] for r in body["results"]}
    assert {pid_a, pid_b}.issubset(project_ids)


def test_search_tag_filter(tmp_registry) -> None:
    pid = _create_project("SearchTagFilter")
    tagged = _create_asset(pid, title="Tagged", tags=["needle"])
    _create_asset(pid, title="Untagged")

    resp = client.get("/api/search", params={"tag": "needle"})
    assert resp.status_code == 200
    ids = {r["asset_id"] for r in resp.json()["results"]}
    assert ids == {tagged["id"]}


def test_search_result_includes_tags(tmp_registry) -> None:
    pid = _create_project("SearchTagsField")
    asset = _create_asset(pid, title="Carries Tags", tags=["one", "two"])

    resp = client.get("/api/search", params={"q": "Carries"})
    assert resp.status_code == 200
    hit = next(r for r in resp.json()["results"] if r["asset_id"] == asset["id"])
    assert hit["tags"] == ["one", "two"]
