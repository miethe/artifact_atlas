"""Route tests for /api/assets and /api/projects/{projectId}/assets endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

_BASE_ASSET = {
    "title": "Test Asset",
    "source_kind": "local",
    "uri": "file:///tmp/test.md",
    "status": "inbox",
    "sensitivity": "personal",
    "agent_access": "metadata_only",
}


def _create_project(name: str = "Test Project") -> str:
    resp = client.post(
        "/api/projects",
        json={"name": name, "slug": name.lower().replace(" ", "-"), "status": "active"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_asset(project_id: str, **overrides) -> dict:
    payload = {**_BASE_ASSET, **overrides}
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# List assets
# ---------------------------------------------------------------------------


def test_list_project_assets_empty(tmp_registry) -> None:
    pid = _create_project("ListEmpty")
    resp = client.get(f"/api/projects/{pid}/assets")
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body
    assert body["items"] == []


def test_list_project_assets_returns_items(tmp_registry) -> None:
    pid = _create_project("ListFull")
    _create_asset(pid, title="Asset A")
    _create_asset(pid, title="Asset B")
    resp = client.get(f"/api/projects/{pid}/assets")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 2


def test_list_assets_status_filter(tmp_registry) -> None:
    pid = _create_project("StatusFilter")
    _create_asset(pid, title="Inbox Asset", status="inbox")
    _create_asset(pid, title="Raw Asset", status="raw")
    resp = client.get(f"/api/projects/{pid}/assets?status=inbox")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(i["status"] == "inbox" for i in items)


def test_list_assets_keyword_search(tmp_registry) -> None:
    pid = _create_project("Search Project")
    _create_asset(pid, title="Unique keyword gamma")
    _create_asset(pid, title="Something else entirely")
    resp = client.get(f"/api/projects/{pid}/assets?q=gamma")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert "gamma" in items[0]["title"].lower()


def test_list_assets_captured_date_range(tmp_registry) -> None:
    """captured_after / captured_before filter on captured_at (WS-3 additive)."""
    pid = _create_project("DateRangeFilter")
    asset = _create_asset(pid, title="Dated Asset")
    assert asset["captured_at"] is not None

    # A window that includes now → asset returned
    resp = client.get(
        f"/api/projects/{pid}/assets",
        params={"captured_after": "2000-01-01T00:00:00Z"},
    )
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1

    # captured_after in the future → excluded
    resp = client.get(
        f"/api/projects/{pid}/assets",
        params={"captured_after": "2100-01-01T00:00:00Z"},
    )
    assert resp.status_code == 200
    assert resp.json()["items"] == []

    # captured_before in the past → excluded
    resp = client.get(
        f"/api/projects/{pid}/assets",
        params={"captured_before": "2000-01-01T00:00:00Z"},
    )
    assert resp.status_code == 200
    assert resp.json()["items"] == []

    # Naive datetime (no timezone) must not 500
    resp = client.get(
        f"/api/projects/{pid}/assets",
        params={"captured_after": "2000-01-01T00:00:00"},
    )
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


def test_list_assets_starred_filter(tmp_registry) -> None:
    """starred filters on metadata.starred (WS-3 additive)."""
    pid = _create_project("StarredFilter")
    _create_asset(pid, title="Starred one", metadata={"starred": True})
    _create_asset(pid, title="Plain one")
    _create_asset(pid, title="Unstarred explicit", metadata={"starred": False})

    resp = client.get(f"/api/projects/{pid}/assets", params={"starred": "true"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert [i["title"] for i in items] == ["Starred one"]

    resp = client.get(f"/api/projects/{pid}/assets", params={"starred": "false"})
    assert resp.status_code == 200
    titles = {i["title"] for i in resp.json()["items"]}
    assert titles == {"Plain one", "Unstarred explicit"}

    # No starred param → all three
    resp = client.get(f"/api/projects/{pid}/assets")
    assert len(resp.json()["items"]) == 3


# ---------------------------------------------------------------------------
# Create / get / update / delete
# ---------------------------------------------------------------------------


def test_create_asset(tmp_registry) -> None:
    pid = _create_project("CreateTest")
    asset = _create_asset(pid, title="New Asset")
    assert asset["title"] == "New Asset"
    assert asset["status"] == "inbox"
    assert "id" in asset


def test_get_asset(tmp_registry) -> None:
    pid = _create_project("GetTest")
    asset = _create_asset(pid)
    resp = client.get(f"/api/assets/{asset['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == asset["id"]


def test_get_asset_not_found(tmp_registry) -> None:
    resp = client.get("/api/assets/nonexistent_asset_xyz")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_update_asset(tmp_registry) -> None:
    pid = _create_project("UpdateTest")
    asset = _create_asset(pid, title="Original Title")
    aid = asset["id"]

    resp = client.patch(f"/api/assets/{aid}", json={"title": "Updated Title"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated Title"


def test_delete_asset(tmp_registry) -> None:
    pid = _create_project("DeleteTest")
    asset = _create_asset(pid)
    aid = asset["id"]

    resp = client.delete(f"/api/assets/{aid}")
    assert resp.status_code == 204

    # Asset is tombstoned — subsequent get should return 404
    resp2 = client.get(f"/api/assets/{aid}")
    assert resp2.status_code == 404


def test_delete_canonical_requires_confirm(tmp_registry) -> None:
    """Deleting a canonical asset without confirm_canonical returns 409."""
    pid = _create_project("CanonicalDeleteTest")
    asset = _create_asset(
        pid,
        title="Canon Asset",
        status="selected",
        uri="file:///tmp/canon.md",
        artifact_type_id="spec",
        sensitivity="personal",
    )
    aid = asset["id"]
    # Manually promote to canonical by patching status directly
    client.patch(f"/api/assets/{aid}", json={"status": "canonical"})

    # Try to delete without confirm
    resp = client.delete(f"/api/assets/{aid}")
    assert resp.status_code == 409


def test_delete_canonical_with_confirm(tmp_registry) -> None:
    pid = _create_project("CanonicalDeleteConfirm")
    asset = _create_asset(pid, title="Canon Asset 2")
    aid = asset["id"]
    client.patch(f"/api/assets/{aid}", json={"status": "canonical"})

    resp = client.delete(f"/api/assets/{aid}?confirm_canonical=true")
    assert resp.status_code == 204


# ---------------------------------------------------------------------------
# Links
# ---------------------------------------------------------------------------


def test_link_asset(tmp_registry) -> None:
    pid = _create_project("LinkTest")
    asset = _create_asset(pid)
    aid = asset["id"]

    resp = client.post(
        f"/api/assets/{aid}/link",
        json={
            "target_type": "intenttree_node",
            "target_id": "node_abc",
            "relationship": "reference",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["asset_id"] == aid
    assert body["target_id"] == "node_abc"


def test_link_asset_not_found(tmp_registry) -> None:
    resp = client.post(
        "/api/assets/nonexistent/link",
        json={"target_type": "intenttree_node", "target_id": "n1", "relationship": "reference"},
    )
    assert resp.status_code == 404


def test_list_asset_links(tmp_registry) -> None:
    """GET /assets/{id}/links returns a cursor page of created links."""
    pid = _create_project("ListLinksTest")
    asset = _create_asset(pid)
    aid = asset["id"]

    # Empty before any links exist
    resp = client.get(f"/api/assets/{aid}/links")
    assert resp.status_code == 200
    assert resp.json()["items"] == []

    client.post(
        f"/api/assets/{aid}/link",
        json={
            "target_type": "intenttree_node",
            "target_id": "node_xyz",
            "relationship": "reference",
        },
    )
    client.post(
        f"/api/assets/{aid}/link",
        json={"target_type": "topic", "target_id": "topic_1", "relationship": "evidence"},
    )

    resp = client.get(f"/api/assets/{aid}/links")
    assert resp.status_code == 200
    body = resp.json()
    assert body["has_more"] is False
    assert len(body["items"]) == 2
    target_ids = {item["target_id"] for item in body["items"]}
    assert target_ids == {"node_xyz", "topic_1"}


def test_list_asset_links_not_found(tmp_registry) -> None:
    resp = client.get("/api/assets/nonexistent/links")
    assert resp.status_code == 404


def test_list_asset_relationships(tmp_registry) -> None:
    """GET /assets/{id}/relationships returns relationships in both directions."""
    pid = _create_project("ListRelsTest")
    a1 = _create_asset(pid, title="v1")["id"]
    a2 = _create_asset(pid, title="v2")["id"]

    # Empty before any relationships exist
    resp = client.get(f"/api/assets/{a1}/relationships")
    assert resp.status_code == 200
    assert resp.json()["items"] == []

    # Create a relationship via the service layer (no POST route yet)
    from app.api._deps import get_asset_service
    from app.models.vocabulary import AssetRelationshipType

    get_asset_service().create_relationship(a2, a1, AssetRelationshipType.supersedes)

    for aid, direction in ((a1, "target"), (a2, "source"), (a1, "both")):
        resp = client.get(
            f"/api/assets/{aid}/relationships", params={"direction": direction}
        )
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 1
        assert items[0]["relationship_type"] == "supersedes"
        assert items[0]["source_asset_id"] == a2
        assert items[0]["target_asset_id"] == a1

    # Direction filter excludes the wrong side
    resp = client.get(f"/api/assets/{a1}/relationships", params={"direction": "source"})
    assert resp.json()["items"] == []


def test_list_asset_relationships_not_found(tmp_registry) -> None:
    resp = client.get("/api/assets/nonexistent/relationships")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Promote
# ---------------------------------------------------------------------------


def test_promote_asset_transition_error(tmp_registry) -> None:
    """Attempting an invalid status transition returns 409."""
    pid = _create_project("PromoteError")
    asset = _create_asset(pid, status="inbox")
    aid = asset["id"]

    # Inbox -> canonical is not a valid transition
    resp = client.post(
        f"/api/assets/{aid}/promote",
        json={"target_status": "canonical"},
    )
    assert resp.status_code == 409


def test_promote_asset_valid_transition(tmp_registry) -> None:
    """Inbox -> raw is a valid transition."""
    pid = _create_project("PromoteValid")
    asset = _create_asset(pid, status="inbox")
    aid = asset["id"]

    resp = client.post(
        f"/api/assets/{aid}/promote",
        json={"target_status": "raw"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "raw"


# ---------------------------------------------------------------------------
# Summarize
# ---------------------------------------------------------------------------


def test_summarize_asset(tmp_registry) -> None:
    """Summarize endpoint returns queued status with honest stub note (no fake task_id)."""
    pid = _create_project("SummarizeTest")
    asset = _create_asset(pid)
    aid = asset["id"]

    resp = client.post(f"/api/assets/{aid}/summarize")
    assert resp.status_code == 202
    body = resp.json()
    assert body["asset_id"] == aid
    assert body["status"] == "queued"
    # Honest stub: no fake task_id implying a running worker
    assert "task_id" not in body
    assert "note" in body


# ---------------------------------------------------------------------------
# Cursor pagination
# ---------------------------------------------------------------------------


def test_asset_list_cursor_pagination(tmp_registry) -> None:
    pid = _create_project("PaginationTest")
    for i in range(5):
        _create_asset(pid, title=f"Asset {i}")

    resp = client.get(f"/api/projects/{pid}/assets?limit=2")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["items"]) == 2
    assert body["has_more"] is True
    assert body["next_cursor"] is not None

    # Fetch next page
    cursor = body["next_cursor"]
    resp2 = client.get(f"/api/projects/{pid}/assets?limit=2&cursor={cursor}")
    assert resp2.status_code == 200
    items2 = resp2.json()["items"]
    assert len(items2) == 2
