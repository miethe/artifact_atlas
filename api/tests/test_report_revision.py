"""PF-1 M3 — dossier revisioning convention (executes the plan's OQ-3 decision).

Covers:
  - Re-ingesting the same dossier slug (same envelope ``(route, subject)``)
    updates the blob on a STABLE asset id via ``PUT /content`` composition
    (``ImportService.attach_content``) -- not a new asset per re-ingest.
  - Existing ``AssetLink`` rows survive a revision untouched.
  - A byte-identical re-ingest of the same identity is a true no-op
    (``is_duplicate=True``, no write) -- distinct from a changed-content
    revision (``is_duplicate=False``).
  - A first ingest with no prior matching identity still creates a new
    asset (unaffected by the stable-id lookup).
  - The revised asset keeps serving 200 (not 403) at the preview route.
  - DI-SubjectCollapse (RESOLVED via PF-3 OQ-5's ``instance_key``): two
    *different* instances of the same subject get distinct assets, while
    re-publishing one instance still replaces it in place; a recurring-route
    envelope with no ``instance_key`` creates rather than overwrites.
  - The ``atlas report ingest`` CLI verb surfaces "revised" for this path.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.cli.atlas import main as cli_main
from app.main import app
from app.services.import_index import ImportService

client = TestClient(app)


def _envelope(**overrides: object) -> dict:
    base = {
        "envelope_version": "1.0",
        "artifact_type": "delivery-report",
        "target": "skillmeat",
        "route": "dossier",
        "title": "Delivery Report Hosting — Dossier",
        "subject": "delivery-report-hosting",
        "revision": 1,
        "truth_status": "not_executed",
        "generated_from": {"repo": "artifact_atlas", "ref": "main", "commit": "abc123"},
        "generated_by": "delivery-report-skill",
        "generated_at": "2026-08-01T00:00:00Z",
        "manifest_path": "/home/gen/manifest.json",
        "html_path": "/home/gen/index.html",
        "tracker_links": [
            {"item": "M3", "tracker": "node_01KYWGWKHF5BWAQYACK46NC1TC", "kind": "task"}
        ],
        "item_count": 4,
    }
    base.update(overrides)
    return base


def _write_html(tmp_path: Path, name: str, body: str) -> Path:
    p = tmp_path / name
    p.write_text(f"<html><body>{body}</body></html>", encoding="utf-8")
    return p


def _delivery_report_count(svc: ImportService) -> int:
    return sum(1 for a in svc._assets.list() if a.artifact_type_id == "delivery_report")


def run_cli(*args: str) -> int:
    return cli_main(list(args))


# ---------------------------------------------------------------------------
# Service layer: stable id + blob revision + links intact
# ---------------------------------------------------------------------------


class TestReportRevisionService:
    def test_report_revision_same_identity_updates_stable_asset_id(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Two ingests of the same (route, subject) with DIFFERENT bytes
        resolve to ONE asset id; the blob changes; links stay intact."""
        svc = ImportService(tmp_registry)

        html_v1 = _write_html(tmp_path, "v1.html", "revision one")
        first = svc.import_report(html_v1, _envelope(revision=1))

        html_v2 = _write_html(tmp_path, "v2.html", "revision two, more content")
        second = svc.import_report(html_v2, _envelope(revision=2))

        assert first.asset.id == second.asset.id
        assert _delivery_report_count(svc) == 1  # not a new asset

        assert second.is_duplicate is False
        assert second.duplicate_of == first.asset.id

        assert first.asset.hash_sha256 != second.asset.hash_sha256
        assert (second.asset.metadata or {}).get("revision") == 2

        links_before = {
            (link.target_type.value, link.target_id)
            for link in svc._assets.list_links(first.asset.id)
        }
        links_after = {
            (link.target_type.value, link.target_id)
            for link in svc._assets.list_links(second.asset.id)
        }
        assert links_before == links_after
        assert ("feature", "delivery-report-hosting") in links_after
        assert ("intenttree_node", "node_01KYWGWKHF5BWAQYACK46NC1TC") in links_after

    def test_report_revision_identical_bytes_is_true_noop(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Re-ingesting the SAME bytes under the same identity is a
        no-write no-op, distinct from a content revision."""
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "same.html", "unchanged content")

        first = svc.import_report(html, _envelope())
        second = svc.import_report(html, _envelope())

        assert first.asset.id == second.asset.id
        assert second.is_duplicate is True
        assert second.duplicate_of == first.asset.id
        assert first.asset.hash_sha256 == second.asset.hash_sha256
        assert _delivery_report_count(svc) == 1

    def test_report_revision_preserves_sensitivity_and_access(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A revision does not silently loosen/change the asset's
        sensitivity or agent_access -- both were fixed at first ingest."""
        svc = ImportService(tmp_registry)
        html_v1 = _write_html(tmp_path, "v1.html", "one")
        first = svc.import_report(html_v1, _envelope(), sensitivity="work_sensitive")

        html_v2 = _write_html(tmp_path, "v2.html", "two")
        second = svc.import_report(html_v2, _envelope(revision=2))

        assert second.asset.id == first.asset.id
        assert second.asset.sensitivity.value == "work_sensitive"
        assert second.asset.agent_access.value == "preview_allowed"

    def test_report_revision_no_prior_identity_creates_new_asset(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A first ingest for a never-seen (route, subject) is unaffected by
        the stable-id lookup -- it creates a new asset as before."""
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "first.html", "brand new")

        result = svc.import_report(html, _envelope(subject="never-seen-before"))
        assert result.is_duplicate is False
        assert result.duplicate_of is None
        assert _delivery_report_count(svc) == 1

    def test_report_revision_missing_subject_never_stable_ids(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """subject is nullable upstream; without it there is no stable
        identity to key on, so every ingest creates a new asset (existing
        M1/M2 hash-duplicate behavior on the plain import_content path)."""
        svc = ImportService(tmp_registry)

        html_a = _write_html(tmp_path, "a.html", "no subject a")
        first = svc.import_report(html_a, {"route": "dossier"}, on_duplicate="create_new")
        html_b = _write_html(tmp_path, "b.html", "no subject b")
        second = svc.import_report(html_b, {"route": "dossier"}, on_duplicate="create_new")

        assert first.asset.id != second.asset.id
        assert _delivery_report_count(svc) == 2


# ---------------------------------------------------------------------------
# DI-SubjectCollapse (RESOLVED): per-instance identity for the recurring routes
# ---------------------------------------------------------------------------


class TestRecurringRouteInstanceIdentity:
    """DI-SubjectCollapse, resolved via PF-3 OQ-5's ``instance_key``.

    Identity is ``(route, subject, instance_key)``. Distinct instances of one
    subject must get distinct assets (no silent overwrite); re-publishing the
    SAME instance must still replace in place (OQ-3 idempotence).
    """

    def test_distinct_instances_for_same_subject_get_distinct_assets(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        svc = ImportService(tmp_registry)

        m2_html = _write_html(tmp_path, "m2.html", "milestone 2 report")
        m2 = svc.import_report(
            m2_html,
            _envelope(route="program", subject="artifact-atlas", instance_key="m2"),
        )

        m3_html = _write_html(tmp_path, "m3.html", "milestone 3 report, different content")
        m3 = svc.import_report(
            m3_html,
            _envelope(route="program", subject="artifact-atlas", instance_key="m3"),
        )

        # Two instances -> two assets. m2's blob is NOT overwritten.
        assert m2.asset.id != m3.asset.id
        assert _delivery_report_count(svc) == 2
        assert (m2.asset.metadata or {}).get("instance_key") == "m2"
        assert (m3.asset.metadata or {}).get("instance_key") == "m3"

    def test_republishing_same_instance_replaces_in_place(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """OQ-3 still holds *within* an instance: a re-render of the same
        phase report revises its asset rather than accumulating duplicates."""
        svc = ImportService(tmp_registry)
        env = _envelope(route="phase", subject="artifact-atlas", instance_key="phase-2")

        v1 = svc.import_report(_write_html(tmp_path, "p2v1.html", "phase 2 v1"), env)
        v2 = svc.import_report(
            _write_html(tmp_path, "p2v2.html", "phase 2 v2, corrected"), env
        )

        assert v1.asset.id == v2.asset.id
        assert _delivery_report_count(svc) == 1
        assert v2.is_duplicate is False

    def test_byte_identical_republish_of_same_instance_is_a_noop(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Guards against trading silent overwrite for duplicate spam: an
        unchanged re-run of the phase-close hook must not mint a new asset."""
        svc = ImportService(tmp_registry)
        env = _envelope(route="readiness", subject="artifact-atlas", instance_key="2026-08-03")
        html = _write_html(tmp_path, "ready.html", "go")

        first = svc.import_report(html, env)
        second = svc.import_report(html, env)

        assert first.asset.id == second.asset.id
        assert second.is_duplicate is True
        assert _delivery_report_count(svc) == 1

    def test_recurring_route_without_instance_key_never_overwrites(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Fallback safety: a recurring-route envelope carrying no
        ``instance_key`` (hand-rolled, or pre-OQ-5) has no way to say which
        instance it is, so it must create a new asset rather than silently
        replacing a prior one. PF-3's exporter hard-fails before emitting
        such an envelope for target=atlas; this is the belt-and-braces case.
        """
        svc = ImportService(tmp_registry)

        first = svc.import_report(
            _write_html(tmp_path, "a.html", "phase report A"),
            _envelope(route="phase", subject="artifact-atlas"),
        )
        second = svc.import_report(
            _write_html(tmp_path, "b.html", "phase report B, different"),
            _envelope(route="phase", subject="artifact-atlas"),
        )

        assert first.asset.id != second.asset.id
        assert _delivery_report_count(svc) == 2

    def test_collapsing_routes_still_collapse_without_instance_key(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """feature/dossier keep the OQ-3 one-living-record model: no
        ``instance_key`` needed, re-ingest revises the same asset."""
        svc = ImportService(tmp_registry)

        for route in ("feature", "dossier"):
            env = _envelope(route=route, subject=f"subj-{route}")
            first = svc.import_report(_write_html(tmp_path, f"{route}1.html", "v1"), env)
            second = svc.import_report(
                _write_html(tmp_path, f"{route}2.html", "v2 revised"), env
            )
            assert first.asset.id == second.asset.id, route


# ---------------------------------------------------------------------------
# End-to-end: revised asset still serves 200, not 403
# ---------------------------------------------------------------------------


class TestReportRevisionPreviewRoute:
    def test_revised_report_still_serves_200_not_403(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        svc = ImportService(tmp_registry)
        html_v1 = _write_html(tmp_path, "v1.html", "v1")
        first = svc.import_report(html_v1, _envelope())

        html_v2 = _write_html(tmp_path, "v2.html", "v2, revised")
        second = svc.import_report(html_v2, _envelope(revision=2))
        assert second.asset.id == first.asset.id

        resp = client.get(f"/api/preview/asset/{second.asset.id}/html")
        assert resp.status_code == 200, resp.text
        assert b"v2, revised" in resp.content


# ---------------------------------------------------------------------------
# CLI: atlas report ingest surfaces "revised"
# ---------------------------------------------------------------------------


class TestReportRevisionCli:
    def test_report_ingest_cli_prints_revised_on_stable_id_revision(
        self, tmp_registry: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        html_v1 = _write_html(tmp_path, "v1.html", "one")
        env_v1 = tmp_path / "v1.json"
        env_v1.write_text(json.dumps(_envelope(revision=1)), encoding="utf-8")
        code = run_cli("report", "ingest", str(html_v1), "--envelope", str(env_v1))
        assert code == 0
        capsys.readouterr()  # discard first-ingest output

        html_v2 = _write_html(tmp_path, "v2.html", "two, different bytes")
        env_v2 = tmp_path / "v2.json"
        env_v2.write_text(json.dumps(_envelope(revision=2)), encoding="utf-8")
        code = run_cli("report", "ingest", str(html_v2), "--envelope", str(env_v2))
        assert code == 0

        out = capsys.readouterr().out
        assert "Report revised:" in out
