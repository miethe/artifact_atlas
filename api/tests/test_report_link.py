"""PF-1 M2 — scope linking from the envelope.

Covers:
  - ImportService.import_report creates AssetLink rows to the envelope's
    ``subject`` (target_type=feature) AND every ``tracker_links[]`` target,
    resolved from the free-form ``tracker`` string (target_type=
    intenttree_node) — multi-attach on write (plan OQ-4).
  - Idempotent re-link: a second ingest of the same report adds zero
    duplicate links.
  - Fail loud: a ``tracker_links[]`` entry naming a wrong/absent/
    unresolvable target raises (service) / exits nonzero (CLI), and no
    asset is created — never a silent skip or a guessed target.
  - The ``atlas report ingest`` CLI verb surfaces the same behavior.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.cli.atlas import main as cli_main
from app.services.import_index import ImportError as ReportIngestError
from app.services.import_index import ImportService


def _envelope(**overrides: object) -> dict:
    base = {
        "envelope_version": "1.0",
        "artifact_type": "delivery-report",
        "target": "skillmeat",
        "route": "feature",
        "title": "Delivery Report Hosting — Feature Report",
        "subject": "delivery-report-hosting",
        "revision": 1,
        "truth_status": "not_executed",
        "generated_from": {"repo": "artifact_atlas", "ref": "main", "commit": "abc123"},
        "generated_by": "delivery-report-skill",
        "generated_at": "2026-08-01T00:00:00Z",
        "manifest_path": "/home/gen/manifest.json",
        "html_path": "/home/gen/index.html",
        "tracker_links": [
            {"item": "M2", "tracker": "node_01KYWGWKHF5BWAQYACK46NC1TC", "kind": "task"}
        ],
        "item_count": 4,
    }
    base.update(overrides)
    return base


def _write_html(tmp_path: Path, name: str = "index.html") -> Path:
    p = tmp_path / name
    p.write_text("<html><body>delivery report</body></html>", encoding="utf-8")
    return p


def run_cli(*args: str) -> int:
    return cli_main(list(args))


def _delivery_report_count(svc: ImportService) -> int:
    """Count delivery_report assets — the seed registry carries other,
    pre-existing assets, so "no partial asset" assertions must be scoped
    to this artifact type rather than an empty registry."""
    return sum(1 for a in svc._assets.list() if a.artifact_type_id == "delivery_report")


# ---------------------------------------------------------------------------
# Service layer: link creation + idempotency
# ---------------------------------------------------------------------------


class TestReportLinkService:
    def test_report_link_creates_subject_and_tracker_links(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        links = svc._assets.list_links(result.asset.id)
        pairs = {(link.target_type.value, link.target_id) for link in links}

        assert ("feature", "delivery-report-hosting") in pairs
        assert ("intenttree_node", "node_01KYWGWKHF5BWAQYACK46NC1TC") in pairs
        assert all(link.relationship.value == "evidence" for link in links)

    def test_report_link_program_route_subject_resolves_to_project(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """route=program/phase/readiness set ``subject`` to a PROJECT slug
        upstream (``report.subject or report.project``), not a feature slug.
        When that slug matches an Atlas project (seed registry carries
        ``artifact-atlas``), the link must be typed ``project``, not the
        hard-coded ``feature`` (reviewer HIGH finding)."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(route="program", subject="artifact-atlas")
        result = svc.import_report(html, env, on_duplicate="create_new")
        links = svc._assets.list_links(result.asset.id)
        pairs = {(link.target_type.value, link.target_id) for link in links}

        assert ("project", "artifact-atlas") in pairs
        assert ("feature", "artifact-atlas") not in pairs

    def test_report_link_tolerates_title_suffix_and_tree_prefix(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Tolerate the documented 'node_<id> — <title>' convention and a
        bare tree_<id> (both real, verified shapes — see
        implementation-notes.md)."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(
            tracker_links=[
                {"item": "M2", "tracker": "node_ABC123 — Some Task Title", "kind": "task"},
                {"item": "M3", "tracker": "tree_01KVTH95ETM8YRYCV2ENHVR124", "kind": "task"},
            ]
        )
        result = svc.import_report(html, env, on_duplicate="create_new")
        links = svc._assets.list_links(result.asset.id)
        pairs = {(link.target_type.value, link.target_id) for link in links}

        assert ("intenttree_node", "node_ABC123") in pairs
        assert ("intenttree_node", "tree_01KVTH95ETM8YRYCV2ENHVR124") in pairs

    def test_report_link_no_subject_no_tracker_links_creates_zero_links(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """subject/tracker_links are both nullable upstream — absence is not
        an error, just nothing to link."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, {"route": "dossier"})
        assert svc._assets.list_links(result.asset.id) == []

    def test_report_link_second_ingest_adds_zero_duplicate_links(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        first = svc.import_report(html, _envelope())
        second = svc.import_report(html, _envelope())

        assert first.asset.id == second.asset.id
        assert second.is_duplicate is True

        links = svc._assets.list_links(first.asset.id)
        pairs = [(link.target_type.value, link.target_id) for link in links]
        assert len(pairs) == len(set(pairs)) == 2  # subject + 1 tracker link, no dupes

    def test_report_link_reingest_of_same_asset_id_adds_zero_duplicates(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Even when the caller forces linking against an asset that already
        carries the same links (idempotency guard exercised directly), no
        duplicates are created."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        before = svc._assets.list_links(result.asset.id)

        svc._link_report_targets(
            result.asset,
            svc._resolve_report_link_targets(_envelope()),
            actor_id="cli",
        )
        after = svc._assets.list_links(result.asset.id)
        assert len(after) == len(before)


# ---------------------------------------------------------------------------
# Service layer: fail-loud on unresolvable / malformed targets
# ---------------------------------------------------------------------------


class TestReportLinkFailsLoud:
    def test_report_link_unresolvable_tracker_fails_loud_no_asset_created(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(
            tracker_links=[{"item": "M2", "tracker": "not-a-recognized-id", "kind": "task"}]
        )
        with pytest.raises(ReportIngestError):
            svc.import_report(html, env)

        # No partial/orphaned asset was created by the failed ingest.
        assert _delivery_report_count(svc) == 0

    def test_report_link_blank_tracker_fails_loud(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(tracker_links=[{"item": "M2", "tracker": "   ", "kind": "task"}])
        with pytest.raises(ReportIngestError):
            svc.import_report(html, env)
        assert _delivery_report_count(svc) == 0

    def test_report_link_missing_tracker_key_fails_loud(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(tracker_links=[{"item": "M2", "kind": "task"}])
        with pytest.raises(ReportIngestError):
            svc.import_report(html, env)
        assert _delivery_report_count(svc) == 0

    def test_report_link_non_object_tracker_entry_fails_loud(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(tracker_links=["node_01KYWGWKHF5BWAQYACK46NC1TC"])
        with pytest.raises(ReportIngestError):
            svc.import_report(html, env)
        assert _delivery_report_count(svc) == 0


# ---------------------------------------------------------------------------
# CLI: atlas report ingest
# ---------------------------------------------------------------------------


class TestReportLinkCli:
    def test_report_ingest_cli_report_link_prints_links(
        self, tmp_registry: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code == 0

        out = capsys.readouterr().out
        assert "Links (2):" in out
        assert "feature:delivery-report-hosting" in out
        assert "intenttree_node:node_01KYWGWKHF5BWAQYACK46NC1TC" in out

    def test_report_ingest_cli_report_link_fails_loud_exits_nonzero(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(
            json.dumps(
                _envelope(
                    tracker_links=[
                        {"item": "M2", "tracker": "totally-unresolvable", "kind": "task"}
                    ]
                )
            ),
            encoding="utf-8",
        )

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code != 0

        # Fail loud with no partial asset — CLI-level regression of the
        # service-level guarantee.
        svc = ImportService(tmp_registry)
        assert _delivery_report_count(svc) == 0
