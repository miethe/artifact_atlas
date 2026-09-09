from __future__ import annotations

import importlib.util
import json
from pathlib import Path


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


ROOT = Path(__file__).resolve().parents[2]
measure = _load("measure_tracker_divergence", ROOT / "scripts/measure_tracker_divergence.py")
collect = _load("collect_fleet_snapshot", ROOT / "scripts/collect_fleet_snapshot.py")


def test_measurement_is_registry_driven_and_provenanced(tmp_path: Path, monkeypatch) -> None:
    registry = tmp_path / "fleet.yaml"
    registry.write_text(
        "schema_version: 1\nsource_ref: source/fleet.yaml\napps:\n  - id: one\n    path: /repo/one\n",
        encoding="utf-8",
    )
    tracker = tmp_path / "tracker.json"
    tracker.write_text(json.dumps({
        "source_ref": "itt tree graph (full, paginated)",
        "projects": {"one": {"tree_id": None, "status": None, "total": None, "open": None}},
    }))
    monkeypatch.setattr(measure, "_git_root", lambda path: path)
    monkeypatch.setattr(measure, "_git_count", lambda path, args: 3)

    first = measure.measure(registry, tracker, generated_at="2026-09-08T18:00:00Z")
    second = measure.measure(registry, tracker, generated_at="2026-09-08T18:00:00Z")
    assert first == second
    row = first["projects"][0]
    assert "/repo/one" not in json.dumps(first)
    assert row["tree_id"] is None
    assert row["nodes_open"]["value"] is None
    assert row["commits_30d_all"]["measured_by"].startswith("git log --all")
    assert row["tree_status"]["value"] is None
    assert row["commits_30d_all"]["provenance"].startswith("source/fleet.yaml")
    assert row["nodes_total"]["provenance"].startswith("itt tree graph")


def test_measurement_rejects_archived_tracker_binding(
    tmp_path: Path, monkeypatch
) -> None:
    registry = tmp_path / "fleet.yaml"
    registry.write_text(
        "schema_version: 1\napps:\n  - id: one\n    path: /repo/one\n",
        encoding="utf-8",
    )
    tracker = tmp_path / "tracker.json"
    tracker.write_text(
        json.dumps(
            {
                "one": {
                    "tree_id": "tree_archived",
                    "status": "archived",
                    "total": 1,
                    "open": 1,
                }
            }
        )
    )
    monkeypatch.setattr(measure, "_git_root", lambda path: path)
    monkeypatch.setattr(measure, "_git_count", lambda path, args: 3)

    try:
        measure.measure(registry, tracker)
    except ValueError as exc:
        assert "archived tracker binding" in str(exc)
    else:
        raise AssertionError("archived tracker binding was accepted")


def test_collector_preserves_layer_boundary_and_rejects_secrets() -> None:
    metric = {"value": 3, "measured_by": "git log", "provenance": "/repo/one"}
    measurement = {
        "generated_at": "2026-09-08T18:00:00Z",
        "projects": [
            {
                "slug": "one",
                "name": "One",
                "project_id": "proj_one",
                "tree_id": None,
                "commits_30d_all": metric,
                "commits_30d_head": metric,
                "nodes_total": {**metric, "value": None},
                "nodes_open": {**metric, "value": None},
                "tree_status": {**metric, "value": "in_progress"},
            }
        ],
    }
    authored = {"projects": {"one": {"summary": "Summary", "next_action": "Next"}}}
    snapshot = collect.build_snapshot(measurement, authored, "test/1")
    assert set(snapshot) == {
        "schema_version", "generated_at", "collector_version", "derived", "authored"
    }
    authored["projects"]["one"]["summary"] = "Bearer abcdefghijklmnopqrstuvwxyz"
    try:
        collect.build_snapshot(measurement, authored, "test/1")
    except ValueError:
        pass
    else:
        raise AssertionError("secret-shaped authored content was accepted")

    for secret in (
        {"github_token": "ghp_abcdefghijklmnopqrstuvwxyz"},
        {"value": "https://operator:supersecret@example.test/status"},
        {"value": "AKIAABCDEFGHIJKLMNOP"},
    ):
        authored["projects"]["one"]["summary"] = json.dumps(secret)
        try:
            collect.build_snapshot(measurement, authored, "test/1")
        except ValueError:
            pass
        else:
            raise AssertionError(f"secret-shaped content was accepted: {secret}")
