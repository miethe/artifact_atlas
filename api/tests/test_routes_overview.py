from __future__ import annotations

import json
import subprocess
import urllib.request
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import AssetCreate
from app.repositories import jsonl as _jl
from app.repositories.assets import AssetRepository

client = TestClient(app)


def _snapshot(generated_at: str = "2026-09-08T18:00:00Z") -> dict:
    metric = {
        "value": 25,
        "measured_by": "git log --all --since=30 days ago --format=%H",
        "provenance": "/fleet/knitwit",
    }
    return {
        "schema_version": 1,
        "generated_at": generated_at,
        "collector_version": "atlas-fleet/1",
        "derived": {
            "projects": {
                "knitwit": {
                    "project_id": "proj_knitwit",
                    "slug": "knitwit",
                    "name": "KnitWit",
                    "tree_id": "tree_knitwit",
                    "metrics": {"commits_30d_all": metric},
                }
            }
        },
        "authored": {
            "projects": {
                "knitwit": {
                    "summary": "Knitting workflow",
                    "next_action": "Ship the next slice",
                }
            }
        },
    }


def test_snapshot_supersedes_only_when_newer(tmp_registry: Path) -> None:
    newer = _snapshot("2026-09-08T18:00:00Z")
    older = _snapshot("2026-09-07T18:00:00Z")
    assert client.put("/api/overview/snapshot", json=newer).status_code == 200
    response = client.put("/api/overview/snapshot", json=older)
    assert response.status_code == 200
    assert response.json()["generated_at"] == "2026-09-08T18:00:00Z"


def test_overview_uses_persisted_snapshot_and_latest_report(
    tmp_registry: Path, monkeypatch
) -> None:
    assert client.put("/api/overview/snapshot", json=_snapshot()).status_code == 200
    repo = AssetRepository(tmp_registry)
    for asset_id, route, generated_at in (
        ("asset_program", "program", "2026-09-07"),
        ("asset_dossier", "dossier", "2026-09-09T00:00:00Z"),
    ):
        repo.create(
            asset_id,
            AssetCreate(
                title=asset_id,
                source_kind="local",
                uri=f"file://{asset_id}.html",
                artifact_type_id="delivery_report",
                sensitivity="personal",
                agent_access="preview_allowed",
                metadata={
                    "route": route,
                    "generated_at": generated_at,
                    "subject": "knitwit",
                },
            ),
            # The newest dossier deliberately remains unattributed. The
            # overview may still join its explicit report subject to the
            # snapshot slug without mutating canonical attribution.
            project_id=None if asset_id == "asset_dossier" else "proj_knitwit",
        )

    monkeypatch.setattr(subprocess, "run", lambda *a, **k: (_ for _ in ()).throw(AssertionError("git called")))
    monkeypatch.setattr(urllib.request, "urlopen", lambda *a, **k: (_ for _ in ()).throw(AssertionError("network called")))
    response = client.get("/api/overview")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["schema_version"] == 1
    assert body["source"]["name"] == "fleet_snapshot"
    assert body["projects"][0]["derived"]["tree_id"] == "tree_knitwit"
    assert body["projects"][0]["project_href"] == "/projects/proj_knitwit"
    assert body["projects"][0]["latest_report"]["asset_id"] == "asset_dossier"
    assert body["projects"][0]["latest_report"]["href"].endswith("/asset_dossier/html")


def test_snapshot_rejects_secrets_and_mismatched_layers(tmp_registry: Path) -> None:
    for secret_value in (
        "token=super-secret-value",
        json.dumps({"github_token": "ghp_abcdefghijklmnopqrstuvwxyz"}),
        "https://operator:supersecret@example.test/status",
        "AKIAABCDEFGHIJKLMNOP",
    ):
        secret = _snapshot()
        secret["authored"]["projects"]["knitwit"]["summary"] = secret_value
        assert client.put("/api/overview/snapshot", json=secret).status_code == 422

    mismatch = _snapshot()
    mismatch["authored"]["projects"] = {}
    assert client.put("/api/overview/snapshot", json=mismatch).status_code == 422


def test_overview_missing_snapshot_is_explicit_404(tmp_registry: Path) -> None:
    assert client.get("/api/overview").status_code == 404
