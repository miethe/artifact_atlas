"""Route tests for GET /api/search — including its M4 cross-project browse use."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.repositories.bom import BomRepository
from app.settings import get_settings

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


def test_search_unknown_node_or_slot_returns_no_hits(tmp_registry) -> None:
    pid = _create_project("Unknown Search Constraints")
    _create_asset(pid, title="Otherwise matching")

    for key, value in (
        ("intenttree_node_id", "node_that_does_not_exist"),
        ("bom_slot_id", "slot_that_does_not_exist"),
    ):
        body = client.get("/api/search", params={key: value}).json()
        assert body["results"] == []
        assert body["total"] == 0


def test_search_node_and_slot_constraints_intersect_other_filters(tmp_registry) -> None:
    pid = _create_project("Linked Search Project")
    other_pid = _create_project("Other Linked Search Project")
    matching = _create_asset(pid, title="Linked candidate", status="candidate")
    wrong_status = _create_asset(pid, title="Linked inbox", status="inbox")
    other_project = _create_asset(other_pid, title="Linked other project", status="candidate")
    unrelated = _create_asset(pid, title="Unlinked candidate", status="candidate")

    repo = BomRepository(get_settings().registry_dir)
    bom = repo.create("bom_search_constraint", pid, "Search constraints")
    slot = repo.create_slot(
        "slot_search_constraint", bom.id, "spec", "engineering",
        linked_intenttree_node_id="node_search_constraint",
    )
    for aid in (matching["id"], wrong_status["id"], other_project["id"]):
        resp = client.post(
            f"/api/bom/slots/{slot.id}/assign",
            json={"asset_id": aid, "slot_id": slot.id, "assignment_status": "accepted"},
        )
        assert resp.status_code == 201, resp.text

    # Both relations constrain results, and regular filters still intersect them.
    for constraint in (
        {"intenttree_node_id": "node_search_constraint"},
        {"bom_slot_id": slot.id},
    ):
        body = client.get(
            "/api/search",
            params={**constraint, "project_id": pid, "status": "candidate", "limit": 1},
        ).json()
        assert [row["asset_id"] for row in body["results"]] == [matching["id"]]
        assert body["total"] == 1

    assert unrelated["id"] not in {
        row["asset_id"]
        for row in client.get(
            "/api/search", params={"bom_slot_id": slot.id, "limit": 200}
        ).json()["results"]
    }


# ---------------------------------------------------------------------------
# Estate-coherence M0 / T2 — ``total`` is the population, not the page
# ---------------------------------------------------------------------------


def _seed_population(name: str, n: int, tag: str) -> str:
    pid = _create_project(name)
    for i in range(n):
        _create_asset(pid, title=f"Population {i}", tags=[tag])
    return pid


def test_search_total_counts_population_before_cap(tmp_registry) -> None:
    """Page fixed at 2 rows; the total tracks the filtered population."""
    _seed_population("TotalBeforeCap", 5, "pop-five")
    resp = client.get("/api/search", params={"tag": "pop-five", "limit": 2})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["results"]) == 2
    assert body["total"] == 5

    # Grow the population, keep the page size fixed — only the total moves.
    pid = _create_project("TotalBeforeCapMore")
    _create_asset(pid, title="Population extra", tags=["pop-five"])
    body = client.get("/api/search", params={"tag": "pop-five", "limit": 2}).json()
    assert len(body["results"]) == 2
    assert body["total"] == 6


def test_search_total_equals_page_when_population_fits(tmp_registry) -> None:
    """Allow side: under the cap, total == page length (no inflation)."""
    _seed_population("TotalFits", 3, "pop-three")
    body = client.get("/api/search", params={"tag": "pop-three", "limit": 50}).json()
    assert len(body["results"]) == 3
    assert body["total"] == 3


def test_search_empty_filter_reports_zero_total(tmp_registry) -> None:
    """An empty filtered result is empty (0), not a whole-catalog count."""
    body = client.get("/api/search", params={"tag": "no-such-tag-anywhere"}).json()
    assert body["results"] == []
    assert body["total"] == 0


def test_semantic_search_total_semantics_match_get(tmp_registry) -> None:
    """POST /api/search/semantic uses the same before-cap total as GET."""
    pid = _seed_population("SemanticTotal", 4, "pop-sem")
    sem = client.post(
        "/api/search/semantic",
        json={"query": "Population", "project_id": pid, "limit": 1},
    )
    assert sem.status_code == 200
    sem_body = sem.json()
    get_body = client.get(
        "/api/search", params={"q": "Population", "project_id": pid, "limit": 1}
    ).json()
    assert len(sem_body["results"]) == 1
    assert sem_body["total"] == 4
    assert get_body["total"] == sem_body["total"]


def test_semantic_search_applies_tag_filter(tmp_registry) -> None:
    """POST /api/search/semantic honors filters.tags like GET honors tag."""
    pid = _create_project("SemanticTagFilter")
    tagged = _create_asset(pid, title="Sem Tagged", tags=["sem-needle"])
    _create_asset(pid, title="Sem Untagged")
    _create_asset(pid, title="Sem Other", tags=["sem-hay"])

    resp = client.post(
        "/api/search/semantic",
        json={"query": "", "filters": {"tags": ["sem-needle"]}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert {r["asset_id"] for r in body["results"]} == {tagged["id"]}
    assert body["total"] == 1

    get_body = client.get("/api/search", params={"tag": "sem-needle"}).json()
    assert {r["asset_id"] for r in get_body["results"]} == {
        r["asset_id"] for r in body["results"]
    }
    assert get_body["total"] == body["total"]


def test_semantic_search_unknown_tag_is_empty(tmp_registry) -> None:
    """Deny side: a tag no asset carries yields zero, not the whole catalog."""
    pid = _create_project("SemanticTagEmpty")
    _create_asset(pid, title="Sem Any", tags=["x"])
    body = client.post(
        "/api/search/semantic",
        json={"query": "", "filters": {"tags": ["no-such-sem-tag"]}},
    ).json()
    assert body["results"] == []
    assert body["total"] == 0


def test_search_result_includes_tags(tmp_registry) -> None:
    pid = _create_project("SearchTagsField")
    asset = _create_asset(pid, title="Carries Tags", tags=["one", "two"])

    resp = client.get("/api/search", params={"q": "Carries"})
    assert resp.status_code == 200
    hit = next(r for r in resp.json()["results"] if r["asset_id"] == asset["id"])
    assert hit["tags"] == ["one", "two"]
