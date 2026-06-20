"""Route tests for BOM endpoints.

Covers:
- GET  /api/projects/{projectId}/bom
- POST /api/projects/{projectId}/bom/apply-template
- PATCH /api/bom/{bomId}
- GET  /api/bom/{bomId}/coverage
- GET  /api/bom/{bomId}/gaps
- POST /api/bom/slots/{slotId}/assign
- POST /api/bom/slots/{slotId}/mark-not-applicable
- POST /api/bom/slots/{slotId}/request-asset
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.bom import BomRepository
from app.settings import get_settings

client = TestClient(app)


def _create_project(name: str) -> str:
    slug = name.lower().replace(" ", "-")
    resp = client.post("/api/projects", json={"name": name, "slug": slug, "status": "active"})
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_bom_with_slot(tmp_registry, project_id: str) -> tuple[str, str]:
    """Create a BOM and a slot for a project, return (bom_id, slot_id)."""
    settings = get_settings()
    bom_repo = BomRepository(settings.registry_dir)
    bom = bom_repo.create(f"bom_test_{project_id[:8]}", project_id, "Test BOM")
    slot = bom_repo.create_slot(
        f"slot_test_{project_id[:8]}",
        bom.id,
        artifact_type_id="spec",
        domain="engineering",
        required=True,
    )
    return bom.id, slot.id


# ---------------------------------------------------------------------------
# GET /api/projects/{projectId}/bom
# ---------------------------------------------------------------------------


def test_get_project_bom_not_found(tmp_registry) -> None:
    pid = _create_project("BOM Not Found")
    resp = client.get(f"/api/projects/{pid}/bom")
    assert resp.status_code == 404


def test_get_project_bom_with_slots(tmp_registry) -> None:
    pid = _create_project("BOM With Slots")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    resp = client.get(f"/api/projects/{pid}/bom")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == bom_id
    assert body["project_id"] == pid
    assert "slots" in body
    slots = body["slots"]
    assert len(slots) >= 1
    assert any(s["id"] == slot_id for s in slots)


# ---------------------------------------------------------------------------
# PATCH /api/bom/{bomId}
# ---------------------------------------------------------------------------


def test_update_bom(tmp_registry) -> None:
    pid = _create_project("UpdateBOM")
    bom_id, _ = _create_bom_with_slot(tmp_registry, pid)

    resp = client.patch(f"/api/bom/{bom_id}", json={"name": "Renamed BOM"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed BOM"


def test_update_bom_not_found(tmp_registry) -> None:
    resp = client.patch("/api/bom/nonexistent_bom", json={"name": "X"})
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/bom/{bomId}/coverage
# ---------------------------------------------------------------------------


def test_get_bom_coverage(tmp_registry) -> None:
    pid = _create_project("BOM Coverage")
    bom_id, _ = _create_bom_with_slot(tmp_registry, pid)

    resp = client.get(f"/api/bom/{bom_id}/coverage")
    assert resp.status_code == 200
    body = resp.json()
    assert "coverage_score" in body
    assert "total_slots" in body
    assert body["total_slots"] >= 1


def test_get_bom_coverage_not_found(tmp_registry) -> None:
    resp = client.get("/api/bom/nonexistent_bom_xyz/coverage")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/bom/{bomId}/gaps
# ---------------------------------------------------------------------------


def test_get_bom_gaps(tmp_registry) -> None:
    pid = _create_project("BOM Gaps")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    resp = client.get(f"/api/bom/{bom_id}/gaps")
    assert resp.status_code == 200
    body = resp.json()
    assert "gaps" in body
    # The slot is in 'missing' status — should appear as a gap
    gap_ids = [g["id"] for g in body["gaps"]]
    assert slot_id in gap_ids


def test_get_bom_gaps_critical_only(tmp_registry) -> None:
    pid = _create_project("BOM Gaps Critical")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    resp = client.get(f"/api/bom/{bom_id}/gaps?critical_only=true")
    assert resp.status_code == 200
    # required=True slot should still appear
    body = resp.json()
    assert slot_id in [g["id"] for g in body["gaps"]]


# ---------------------------------------------------------------------------
# POST /api/bom/slots/{slotId}/assign
# ---------------------------------------------------------------------------


def test_assign_slot(tmp_registry) -> None:
    pid = _create_project("Assign Slot")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    # Create an asset to assign
    asset_resp = client.post(
        f"/api/projects/{pid}/assets",
        json={"title": "Assignable", "source_kind": "local", "uri": "file:///tmp/x.md",
              "status": "candidate", "sensitivity": "personal", "agent_access": "metadata_only"},
    )
    assert asset_resp.status_code == 201
    asset_id = asset_resp.json()["id"]

    resp = client.post(
        f"/api/bom/slots/{slot_id}/assign",
        json={"asset_id": asset_id, "slot_id": slot_id, "assignment_status": "suggested"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["asset_id"] == asset_id
    assert body["slot_id"] == slot_id


def test_assign_slot_not_found(tmp_registry) -> None:
    resp = client.post(
        "/api/bom/slots/nonexistent_slot/assign",
        json={"asset_id": "some_asset", "assignment_status": "suggested"},
    )
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/bom/slots/{slotId}/mark-not-applicable
# ---------------------------------------------------------------------------


def test_mark_slot_not_applicable(tmp_registry) -> None:
    pid = _create_project("NA Slot")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    resp = client.post(
        f"/api/bom/slots/{slot_id}/mark-not-applicable",
        json={"reason": "Not applicable for this project type."},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_applicable"


# ---------------------------------------------------------------------------
# POST /api/bom/slots/{slotId}/request-asset
# ---------------------------------------------------------------------------


def test_request_asset_for_slot(tmp_registry) -> None:
    pid = _create_project("Request Asset")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    resp = client.post(
        f"/api/bom/slots/{slot_id}/request-asset",
        json={"notes": "Need this ASAP."},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["slot_id"] == slot_id
    assert "event_id" in body


# ---------------------------------------------------------------------------
# BOM coverage + gap integration (apply template path not tested separately
# since it requires a valid YAML template — coverage service tested via unit)
# ---------------------------------------------------------------------------


def test_bom_coverage_after_slot_completion(tmp_registry) -> None:
    """Marking a slot complete should raise coverage from 0."""
    pid = _create_project("Coverage After Completion")
    bom_id, slot_id = _create_bom_with_slot(tmp_registry, pid)

    # Mark slot as complete via BOM repo directly
    settings = get_settings()
    bom_repo = BomRepository(settings.registry_dir)
    bom_repo.update_slot(slot_id, {"status": "complete"})

    resp = client.get(f"/api/bom/{bom_id}/coverage")
    assert resp.status_code == 200
    body = resp.json()
    assert body["coverage_score"] == 1.0
