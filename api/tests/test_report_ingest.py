"""PF-1 M1 — report-aware ingest returns a servable preview URL.

Covers:
  - ImportService.import_report (service layer): composes import_content,
    sets artifact_type_id=delivery_report / agent_access=preview_allowed /
    mime_type=text/html / generated_by=agent, captures envelope fields into
    metadata, fails loud on a missing HTML file.
  - atlas CLI `report ingest` (CLI-001 composition, no parallel logic).
  - The end-to-end 403->200 regression: an asset created via import_report
    is servable at GET /api/preview/asset/{id}/html without a 403, which is
    the milestone's load-bearing acceptance criterion (the "preview_allowed
    403 trap" named risk — default_agent_access=metadata_only would 403 an
    asset that did not explicitly opt in).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.cli.atlas import main as cli_main
from app.main import app
from app.services.import_index import ImportError as ReportIngestError
from app.services.import_index import ImportService

client = TestClient(app)


def _set_workspace_default_sensitivity(
    monkeypatch: pytest.MonkeyPatch, value: str
) -> None:
    """Point the workspace's default sensitivity at ``value`` for one test.

    The ``tmp_registry`` fixture builds its Settings via ``Settings.__new__``
    and assigns attributes directly, so it never reads the environment —
    setting ``ATLAS_DEFAULT_SENSITIVITY`` would be silently ignored. Patch the
    already-installed settings singleton instead.
    """
    import app.settings as _settings_mod

    monkeypatch.setattr(
        _settings_mod._settings_instance, "default_sensitivity", value, raising=False
    )


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
            {"item": "M1", "tracker": "node_01KYWGWKHF5BWAQYACK46NC1TC", "kind": "task"}
        ],
        "item_count": 4,
    }
    base.update(overrides)
    return base


def _write_html(tmp_path: Path, name: str = "index.html") -> Path:
    p = tmp_path / name
    p.write_text("<html><body>delivery report</body></html>", encoding="utf-8")
    return p


# ---------------------------------------------------------------------------
# Service layer: ImportService.import_report
# ---------------------------------------------------------------------------


class TestReportIngestService:
    def test_report_ingest_sets_delivery_report_fields(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        # PF-4: an explicit project_id is now resolved (slug OR id) and an
        # unknown value fails loud, so this scope must name a real project —
        # the seed registry's ``proj_artifact_atlas``. The former "proj-atlas"
        # was a dangling id that silently made the asset unreachable; see
        # test_report_attribution.py for the reachability coverage.
        result = svc.import_report(html, _envelope(), project_id="proj_artifact_atlas")
        asset = result.asset

        assert result.is_duplicate is False
        assert asset.project_id == "proj_artifact_atlas"
        assert asset.artifact_type_id == "delivery_report"
        assert asset.mime_type == "text/html"
        assert asset.agent_access.value == "preview_allowed"
        assert asset.generated_by is not None
        assert asset.generated_by.value == "agent"
        # Never defaults to public — reports embed commit hashes / internal paths.
        assert asset.sensitivity.value != "public"
        assert asset.sensitivity.value == "personal"

    def test_report_ingest_captures_envelope_metadata(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        meta = result.asset.metadata or {}

        assert meta["route"] == "feature"
        assert meta["subject"] == "delivery-report-hosting"
        assert meta["revision"] == 1
        assert meta["truth_status"] == "not_executed"
        assert meta["tracker_links"] == [
            {"item": "M1", "tracker": "node_01KYWGWKHF5BWAQYACK46NC1TC", "kind": "task"}
        ]

    def test_report_ingest_title_falls_back_to_subject_then_filename(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path, name="report.html")
        svc = ImportService(tmp_registry)

        no_title = svc.import_report(html, _envelope(title=None), on_duplicate="create_new")
        assert no_title.asset.title == "delivery-report-hosting"

        no_title_no_subject = svc.import_report(
            html, _envelope(title=None, subject=None), on_duplicate="create_new"
        )
        assert no_title_no_subject.asset.title == "report"

    def test_report_ingest_sensitivity_override(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope(), sensitivity="work_sensitive")
        assert result.asset.sensitivity.value == "work_sensitive"

    def test_report_ingest_honors_stricter_workspace_sensitivity_default(
        self, tmp_registry: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A stricter workspace default must NOT be silently downgraded.

        Regression: ingest previously hardcoded ``sensitivity or "personal"``,
        which is always truthy and so never consulted the workspace default —
        a ``client_sensitive`` workspace silently got ``personal`` reports.
        """
        _set_workspace_default_sensitivity(monkeypatch, "client_sensitive")
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        assert result.asset.sensitivity.value == "client_sensitive"

    def test_report_ingest_never_public_even_if_workspace_defaults_public(
        self, tmp_registry: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Reports embed commit hashes / internal paths, so `public` is floored.

        Deferring to the workspace default must not open a leak path: a
        workspace defaulting to ``public`` still yields a non-public report.
        """
        _set_workspace_default_sensitivity(monkeypatch, "public")
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        assert result.asset.sensitivity.value == "personal"

    def test_report_ingest_missing_html_fails_loud(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        svc = ImportService(tmp_registry)
        with pytest.raises(ReportIngestError):
            svc.import_report(tmp_path / "does-not-exist.html", _envelope())

    def test_report_ingest_tolerates_sparse_envelope(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """The envelope is read defensively — a minimal/partial envelope
        (e.g. missing optional fields) must not raise."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, {"route": "dossier"})
        assert result.asset.artifact_type_id == "delivery_report"
        assert (result.asset.metadata or {}).get("route") == "dossier"


# ---------------------------------------------------------------------------
# CLI: atlas report ingest
# ---------------------------------------------------------------------------


def run_cli(*args: str) -> int:
    return cli_main(list(args))


class TestReportIngestCli:
    def test_report_ingest_cli_creates_asset(
        self, tmp_registry: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code == 0

        out = capsys.readouterr().out
        assert "ingested" in out
        assert "Agent access: preview_allowed" in out

    def test_report_ingest_cli_prints_origin_qualified_absolute_url(
        self,
        tmp_registry: Path,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """The emitted preview URL must be absolute http(s), not a relative path.

        The downstream intenttree consumer (PF-2, shipped) hard-rejects any
        report url that does not start http(s):// — `itt link report` raises
        BadParameter and its UI gates the anchor on the same regex. A relative
        `/api/preview/...` is therefore both unstorable and non-clickable, which
        would break the one integration this feature exists to enable.
        """
        import app.settings as _settings_mod

        # Deliberately include a trailing slash: normalisation must hold even for
        # a directly-assigned settings value (Settings.__init__ is bypassed here).
        monkeypatch.setattr(
            _settings_mod._settings_instance,
            "public_base_url",
            "http://10.42.10.76:8042/",
            raising=False,
        )
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code == 0

        out = capsys.readouterr().out
        asset_id = next(
            ln.split("Report ingested:", 1)[1].strip()
            for ln in out.splitlines()
            if "Report ingested:" in ln
        )
        url = next(
            ln.split("Preview URL:", 1)[1].strip()
            for ln in out.splitlines()
            if "Preview URL:" in ln
        )

        # The contract PF-2 enforces: absolute http(s), never a relative path.
        assert url.startswith("http://"), f"not origin-qualified: {url!r}"
        assert url == f"http://10.42.10.76:8042/api/preview/asset/{asset_id}/html"
        assert "//api/preview" not in url

    def test_report_ingest_cli_missing_html_exits_nonzero(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli(
            "report", "ingest", str(tmp_path / "missing.html"), "--envelope", str(envelope_path)
        )
        assert code != 0

    def test_report_ingest_cli_missing_envelope_exits_nonzero(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        code = run_cli(
            "report", "ingest", str(html), "--envelope", str(tmp_path / "missing.json")
        )
        assert code != 0

    def test_report_ingest_cli_malformed_envelope_json_exits_nonzero(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text("{not valid json", encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code != 0

    def test_report_ingest_cli_envelope_must_be_object_exits_nonzero(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(["not", "an", "object"]), encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code != 0


# ---------------------------------------------------------------------------
# End-to-end: the 403->200 regression the milestone AC pins
# ---------------------------------------------------------------------------


class TestReportIngestPreviewRoute:
    def test_report_ingest_serves_200_not_403(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """The milestone AC: an envelope-driven ingest yields a
        delivery_report Asset whose GET /api/preview/asset/{id}/html
        returns 200 — not 403 (default_agent_access=metadata_only would
        403 an asset that never opted into preview_allowed)."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        asset_id = result.asset.id

        resp = client.get(f"/api/preview/asset/{asset_id}/html")
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("text/html")
        assert "sandbox" in resp.headers.get("content-security-policy", "")

    def test_report_ingest_via_cli_serves_200(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Same regression, driven through the CLI verb end users/agents run."""
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code == 0

        svc = ImportService(tmp_registry)
        assets = svc._assets.list()
        delivery_reports = [a for a in assets if a.artifact_type_id == "delivery_report"]
        assert len(delivery_reports) == 1

        resp = client.get(f"/api/preview/asset/{delivery_reports[0].id}/html")
        assert resp.status_code == 200, resp.text
