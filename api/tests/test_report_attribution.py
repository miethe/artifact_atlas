"""PF-4 — an ingested delivery_report is REACHABLE, not merely stored.

The defect this pins: every Atlas web route lives under
``(projects)/projects/[projectId]``, so a hosted report written with
``project_id=None`` (or, worse, with a *slug* where the canonical
``proj_*`` id belongs) is served by the preview route and reachable from no
page at all. A 200 from ingest proved nothing about that.

So these tests assert **reachability** through the same project-scoped list
endpoint the UI uses — ``GET /api/projects/{projectId}/assets`` with its
exact-equality ``project_id`` filter (``repositories/assets.py`` ``list``) —
rather than inspecting only the returned asset object.

Covered:
  - attribution from the envelope ``subject`` (a project slug)
  - attribution from ``generated_from.repo``'s basename, across the
    underscore/hyphen mismatch (``artifact_atlas`` -> ``artifact-atlas``)
  - an explicit unknown ``--project`` fails loud, with no asset created
  - the canonical ``proj_*`` id is stored, never the slug
  - the resolution ORDER (explicit > envelope subject > repo basename), each
    step proven against a *second* project so the assertion can actually fail
  - ``status=candidate`` (PRD OQ-1) and a populated ``workspace_id``
  - the revise path attributes too (re-ingest repairs an unattributed report)
  - ``DI-ByteCollision``: a byte-identical ingest of a *differently identified*
    report never re-attributes the report already holding those bytes, never
    adds its own scope links to it either, and says out loud that the report
    it was asked to ingest was not stored at all
  - no collateral damage: the shared ``import_content`` / ``import_url``
    paths still default to ``status=inbox``
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

# Seed registry (registry/projects.jsonl, copied by the tmp_registry fixture)
# carries exactly one project: canonical id + slug differ, which is the whole
# point of the bug being fixed.
PROJECT_ID = "proj_artifact_atlas"
PROJECT_SLUG = "artifact-atlas"

# A SECOND project, added per-test by ``_add_project``. Any assertion about
# resolution *order* needs two distinct targets: with only the seed project in
# the registry, "explicit wins over the envelope" and "subject wins over repo
# basename" both resolve to ``proj_artifact_atlas`` either way, so the test
# would pass with the precedence inverted — it could not fail.
OTHER_PROJECT_ID = "proj_fleet_beta"
OTHER_PROJECT_SLUG = "fleet-beta"


def _envelope(**overrides: object) -> dict:
    """A realistic PF-3 writeback envelope.

    ``generated_from.repo`` is an ABSOLUTE path on the *generating* machine
    (verified live shape), and its basename is underscored while the Atlas
    project slug is hyphenated — the mismatch attribution has to bridge.
    """
    base = {
        "envelope_version": "1.0",
        "artifact_type": "delivery-report",
        "target": "atlas",
        "route": "feature",
        "title": "Delivery Report Hosting — Feature Report",
        "subject": "delivery-report-hosting",
        "revision": 1,
        "truth_status": "not_executed",
        "generated_from": {
            "repo": "/Users/miethe/dev/homelab/development/artifact_atlas",
            "ref": "main",
            "commit": "abc123",
        },
        "generated_by": "delivery-report-skill",
        "generated_at": "2026-08-08T00:00:00Z",
        "tracker_links": [],
        "item_count": 4,
    }
    base.update(overrides)
    return base


def _write_html(tmp_path: Path, name: str = "index.html", body: str = "report") -> Path:
    p = tmp_path / name
    p.write_text(f"<html><body>{body}</body></html>", encoding="utf-8")
    return p


def _add_project(
    tmp_registry: Path,
    project_id: str = OTHER_PROJECT_ID,
    slug: str = OTHER_PROJECT_SLUG,
) -> str:
    """Append a second project row to the temp registry's projects.jsonl.

    Written as a raw JSONL line rather than through ``ProjectRepository`` so the
    canonical id is pinned exactly (``create`` takes a caller-generated id, but
    going through it would pull a second service into a fixture that only needs
    one row). Every repository read re-reads the file, so appending mid-test is
    picked up by both ``ImportService`` and the HTTP client.

    Returns the project id, for use in assertions.
    """
    row = {
        "id": project_id,
        "workspace_id": "ws_test",
        "name": slug.replace("-", " ").title(),
        "slug": slug,
        "status": "active",
        "meatywiki_page_ref": None,
        "intent_id": None,
        "root_intenttree_node_id": None,
    }
    with (tmp_registry / "projects.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(row) + "\n")
    return project_id


def _delivery_report_count(svc: ImportService) -> int:
    """The seed registry carries other pre-existing assets, so "nothing was
    created" assertions must be scoped to this artifact type."""
    return sum(1 for a in svc._assets.list() if a.artifact_type_id == "delivery_report")


def _project_report_ids(project_id: str = PROJECT_ID) -> list[str]:
    """Asset ids reachable from the project's delivery-report listing —
    i.e. what a project page would actually be able to render."""
    resp = client.get(
        f"/api/projects/{project_id}/assets",
        params={"artifact_type_id": "delivery_report", "limit": 200},
    )
    assert resp.status_code == 200, resp.text
    return [item["id"] for item in resp.json()["items"]]


def _link_pairs(tmp_registry: Path, asset_id: str) -> set[tuple[str, str]]:
    """``(target_type, target_id)`` of every AssetLink on *asset_id*, re-read
    from disk (not from a service instance that may hold a stale view)."""
    from app.repositories.assets import AssetRepository

    links = AssetRepository(tmp_registry).list_links(asset_id)
    return {
        (
            link.target_type.value
            if hasattr(link.target_type, "value")
            else str(link.target_type),
            link.target_id,
        )
        for link in links
    }


def _link_event_count(tmp_registry: Path, asset_id: str) -> int:
    """How many ``asset_linked`` audit events name *asset_id*.

    A contaminating link writes an audit row as well as a link row; asserting
    on both means the fix cannot be half-done (e.g. link skipped, event still
    emitted).
    """
    events_file = tmp_registry / "events.jsonl"
    if not events_file.exists():
        return 0
    count = 0
    for line in events_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        if rec.get("event_type") == "asset_linked" and rec.get("target_id") == asset_id:
            count += 1
    return count


def run_cli(*args: str) -> int:
    return cli_main(list(args))


def _report_audit_actions(tmp_registry: Path, asset_id: str) -> list[str]:
    """The ``payload.action`` of every audit event recorded against *asset_id*.

    Reads ``registry/events.jsonl`` directly, the same way
    ``tests/test_audit_integration.py`` does.
    """
    events_file = tmp_registry / "events.jsonl"
    if not events_file.exists():
        return []
    actions: list[str] = []
    for line in events_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        if rec.get("target_id") != asset_id:
            continue
        actions.append((rec.get("payload") or {}).get("action"))
    return actions


# ---------------------------------------------------------------------------
# Reachability: the acceptance criterion
# ---------------------------------------------------------------------------


class TestReportReachability:
    def test_subject_slug_attribution_makes_report_reachable(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """``subject`` matching a project slug attributes the report, with no
        ``--project`` given — and the report shows up on that project's page."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        # route=program sets subject to a PROJECT slug upstream.
        result = svc.import_report(
            html, _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1")
        )

        assert result.asset.project_id == PROJECT_ID
        assert result.asset.id in _project_report_ids()

    def test_repo_basename_attribution_makes_report_reachable(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """With a *non*-matching subject, ``generated_from.repo``'s basename
        still attributes the report across the underscore/hyphen mismatch —
        the cheap fix that needs no cross-repo envelope contract change."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(subject="delivery-report-hosting")  # a FEATURE slug
        assert svc._projects.get_by_slug("delivery-report-hosting") is None

        result = svc.import_report(html, env)

        assert result.asset.project_id == PROJECT_ID
        assert result.asset.id in _project_report_ids()

    def test_reachable_via_cli_ingest(
        self, tmp_registry: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Same reachability through the verb operators/agents actually run."""
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli("report", "ingest", str(html), "--envelope", str(envelope_path))
        assert code == 0

        out = capsys.readouterr().out
        assert f"Project:      {PROJECT_ID}" in out

        asset_id = next(
            ln.split("Report ingested:", 1)[1].strip()
            for ln in out.splitlines()
            if "Report ingested:" in ln
        )
        assert asset_id in _project_report_ids()

    def test_unattributable_report_is_left_unattributed_not_guessed(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Neither subject nor repo names a known project → ``None``.

        A wrongly-attributed report lies to whoever reads that project's page;
        an unattributed one is merely invisible until a backfill sweep or a
        workspace-wide lens picks it up.
        """
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(
            subject="some-unknown-feature",
            generated_from={"repo": "/tmp/not_a_known_repo", "ref": "main"},
        )
        result = svc.import_report(html, env)

        assert result.asset.project_id is None
        assert result.asset.id not in _project_report_ids()


# ---------------------------------------------------------------------------
# Explicit --project: canonical id, or a loud failure
# ---------------------------------------------------------------------------


class TestExplicitProjectResolution:
    def test_explicit_slug_stores_canonical_id_never_the_slug(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """The original bug, pinned: a slug in, the canonical ``proj_*`` out."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope(), project_id=PROJECT_SLUG)

        assert result.asset.project_id == PROJECT_ID
        assert result.asset.project_id != PROJECT_SLUG
        assert result.asset.id in _project_report_ids()

    def test_explicit_canonical_id_is_accepted_as_is(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope(), project_id=PROJECT_ID)
        assert result.asset.project_id == PROJECT_ID

    def test_unknown_explicit_project_fails_loud_with_no_asset_created(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Storing a dangling project_id is worse than refusing the ingest."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)
        before = _delivery_report_count(svc)

        with pytest.raises(ReportIngestError) as exc:
            svc.import_report(html, _envelope(), project_id="proj-atlas")

        assert "proj-atlas" in str(exc.value)
        assert _delivery_report_count(svc) == before

    def test_unknown_explicit_project_cli_exits_nonzero(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")
        svc = ImportService(tmp_registry)
        before = _delivery_report_count(svc)

        code = run_cli(
            "report",
            "ingest",
            str(html),
            "--envelope",
            str(envelope_path),
            "--project",
            "no-such-project",
        )
        assert code != 0
        assert _delivery_report_count(svc) == before

    def test_cli_accepts_slug_and_stores_canonical_id(
        self, tmp_registry: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        html = _write_html(tmp_path)
        envelope_path = tmp_path / "writeback.json"
        envelope_path.write_text(json.dumps(_envelope()), encoding="utf-8")

        code = run_cli(
            "report",
            "ingest",
            str(html),
            "--envelope",
            str(envelope_path),
            "--project",
            PROJECT_SLUG,
        )
        assert code == 0
        assert f"Project:      {PROJECT_ID}" in capsys.readouterr().out


# ---------------------------------------------------------------------------
# Resolution ORDER — each step proven against a second, different project
# ---------------------------------------------------------------------------


class TestAttributionPrecedence:
    """Pins ``_resolve_report_project_id``'s documented order:
    explicit > envelope ``subject`` > ``generated_from.repo`` basename.

    Every test here adds a SECOND project so the two candidate sources point at
    DIFFERENT projects. Without that, both sources resolve to the seed
    registry's single ``proj_artifact_atlas`` and an order assertion holds even
    with the precedence inverted — i.e. the test cannot fail.
    """

    def test_explicit_project_beats_envelope_subject(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Step 1 over step 2. Envelope ``subject`` names the seed project (and
        ``generated_from.repo`` does too); ``--project`` names the other one.
        Inverted precedence would store ``PROJECT_ID``."""
        _add_project(tmp_registry)
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(
            html,
            _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1"),
            project_id=OTHER_PROJECT_SLUG,
        )

        assert result.asset.project_id == OTHER_PROJECT_ID
        assert result.asset.id in _project_report_ids(OTHER_PROJECT_ID)
        assert result.asset.id not in _project_report_ids(PROJECT_ID)

    def test_envelope_subject_beats_generated_from_repo_basename(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Step 2 over step 3, with no ``--project`` at all.

        ``subject`` names the second project; ``generated_from.repo``'s basename
        (``artifact_atlas``) still resolves to the seed project, so falling
        through to step 3 would store ``PROJECT_ID``.
        """
        _add_project(tmp_registry)
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        env = _envelope(route="program", subject=OTHER_PROJECT_SLUG, instance_key="M1")
        # Pre-conditions: step 3 is live and aims at the SEED project (the
        # sibling test below proves this same basename resolves to PROJECT_ID
        # when subject misses), and step 2's target is a real, distinct project.
        assert env["generated_from"]["repo"].endswith("artifact_atlas")
        seed = svc._projects.get_by_slug(PROJECT_SLUG)
        assert seed is not None and seed.id == PROJECT_ID
        other = svc._projects.get_by_slug(OTHER_PROJECT_SLUG)
        assert other is not None and other.id == OTHER_PROJECT_ID

        result = svc.import_report(html, env)

        assert result.asset.project_id == OTHER_PROJECT_ID
        assert result.asset.id in _project_report_ids(OTHER_PROJECT_ID)
        assert result.asset.id not in _project_report_ids(PROJECT_ID)

    def test_repo_basename_is_used_only_when_subject_names_no_project(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Step 3 is reached only on a step-2 miss — the other half of the
        ordering above, so neither test passes by accident."""
        _add_project(tmp_registry)
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        # subject is a FEATURE slug (no project by that name); repo basename
        # resolves to the seed project, NOT the second one.
        env = _envelope(subject="delivery-report-hosting")
        assert svc._projects.get_by_slug("delivery-report-hosting") is None

        result = svc.import_report(html, env)

        assert result.asset.project_id == PROJECT_ID
        assert result.asset.id not in _project_report_ids(OTHER_PROJECT_ID)


# ---------------------------------------------------------------------------
# Status + workspace scope
# ---------------------------------------------------------------------------


class TestReportStatusAndWorkspace:
    def test_ingested_report_status_is_candidate(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """PRD OQ-1: auto-ingest lands at ``candidate``, never ``canonical`` —
        and no longer at the ``import_content`` default of ``inbox``."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        assert result.asset.status.value == "candidate"

    def test_report_is_listed_under_the_candidate_status_filter(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Status is persisted, not just returned — a status-filtered project
        query (what a Reports lens would issue) finds it."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)
        result = svc.import_report(html, _envelope())

        resp = client.get(
            f"/api/projects/{PROJECT_ID}/assets",
            params={
                "artifact_type_id": "delivery_report",
                "status": "candidate",
                "limit": 200,
            },
        )
        assert resp.status_code == 200, resp.text
        assert result.asset.id in [item["id"] for item in resp.json()["items"]]

    def test_workspace_id_is_populated_from_settings(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """``workspace_id`` was never set on any asset; reports now carry it so
        a workspace-scoped lens can span them across projects."""
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)

        result = svc.import_report(html, _envelope())
        assert result.asset.workspace_id == "ws_test"  # tmp_registry fixture value

    def test_workspace_id_is_persisted_not_just_returned(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        html = _write_html(tmp_path)
        svc = ImportService(tmp_registry)
        result = svc.import_report(html, _envelope())

        reread = ImportService(tmp_registry)._assets.get(result.asset.id)
        assert reread is not None
        assert reread.workspace_id == "ws_test"
        assert reread.project_id == PROJECT_ID


# ---------------------------------------------------------------------------
# Revise path: attribution applies there too
# ---------------------------------------------------------------------------


class TestReviseePathAttribution:
    def test_revise_attributes_a_previously_unattributed_report(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Re-publishing an already-hosted report REPAIRS its attribution.

        The revise path previously accepted ``project_id`` and used it for the
        audit event only, never writing it — so a report first ingested while
        unattributable stayed unreachable forever.
        """
        svc = ImportService(tmp_registry)
        unknown_origin = {"repo": "/tmp/not_a_known_repo", "ref": "main"}

        first = svc.import_report(
            _write_html(tmp_path, "v1.html", "v1"),
            _envelope(subject="orphan-feature", generated_from=unknown_origin),
        )
        assert first.asset.project_id is None

        # Same (route, subject) identity -> same asset id; now attributable.
        second = svc.import_report(
            _write_html(tmp_path, "v2.html", "v2"),
            _envelope(subject="orphan-feature", revision=2),
        )

        assert second.asset.id == first.asset.id
        assert second.asset.project_id == PROJECT_ID
        assert second.asset.id in _project_report_ids()

    def test_noop_reingest_still_repairs_attribution(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Identical bytes are a content no-op, but attribution is metadata —
        a re-run with a resolvable origin must still heal the row."""
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "same.html", "identical bytes")

        first = svc.import_report(
            html,
            _envelope(
                subject="orphan-feature",
                generated_from={"repo": "/tmp/not_a_known_repo"},
            ),
        )
        assert first.asset.project_id is None

        second = svc.import_report(html, _envelope(subject="orphan-feature"))

        assert second.asset.id == first.asset.id
        assert second.is_duplicate is True  # bytes unchanged
        assert second.asset.project_id == PROJECT_ID

    def test_attribution_repair_is_visible_in_the_audit_log(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A repair MOVES a report between project pages, so it must not be a
        silent write.

        The no-op re-ingest is the case that would otherwise vanish entirely:
        identical bytes mean ``_revise_report_asset`` returns before emitting
        anything, so without its own event the project_id change leaves no trace
        and no fresh ``last_indexed_at``.
        """
        _add_project(tmp_registry)
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "same.html", "identical bytes")

        first = svc.import_report(
            html,
            _envelope(
                route="program",
                subject="orphan-subject",
                instance_key="M1",
                generated_from={"repo": "/tmp/not_a_known_repo"},
            ),
        )
        assert first.asset.project_id is None
        indexed_before = first.asset.last_indexed_at

        # Same identity -> revise path; explicit --project makes it attributable.
        second = svc.import_report(
            html,
            _envelope(route="program", subject="orphan-subject", instance_key="M1"),
            project_id=OTHER_PROJECT_SLUG,
        )
        assert second.asset.id == first.asset.id
        assert second.is_duplicate is True  # bytes unchanged
        assert second.asset.project_id == OTHER_PROJECT_ID

        actions = _report_audit_actions(tmp_registry, first.asset.id)
        assert "report_attribution_repaired" in actions
        assert second.asset.last_indexed_at != indexed_before

    def test_first_ingest_does_not_emit_a_spurious_repair_event(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """The create path already writes project_id at create time, so a fresh
        ingest must not double-log a "repair" it did not perform."""
        svc = ImportService(tmp_registry)
        result = svc.import_report(_write_html(tmp_path), _envelope())
        assert result.asset.project_id == PROJECT_ID

        actions = _report_audit_actions(tmp_registry, result.asset.id)
        assert "report_attribution_repaired" not in actions

    def test_revise_does_not_demote_a_promoted_report(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A human promotion must survive a re-ingest — status is create-only."""
        from app.models.asset import AssetUpdate

        svc = ImportService(tmp_registry)
        first = svc.import_report(_write_html(tmp_path, "v1.html", "v1"), _envelope())
        svc._assets.update(first.asset.id, AssetUpdate(status="canonical"))

        second = svc.import_report(
            _write_html(tmp_path, "v2.html", "v2"), _envelope(revision=2)
        )

        assert second.asset.id == first.asset.id
        assert second.asset.status.value == "canonical"


# ---------------------------------------------------------------------------
# DI-ByteCollision: shared bytes must not mean shared attribution
# ---------------------------------------------------------------------------


class TestByteIdenticalDifferentReports:
    """Two DIFFERENT reports can render byte-identical HTML.

    On a first ingest, ``import_content``'s content-hash duplicate branch then
    returns the asset that already holds those bytes — a delivery_report with a
    *different* ``(route, subject, instance_key)``. Stamping this envelope's
    attribution onto it would silently move someone else's report to another
    project page, and the ``artifact_type_id == "delivery_report"`` guard cannot
    catch it because both assets are delivery_reports.
    """

    def test_byte_duplicate_does_not_reattribute_the_other_report(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        _add_project(tmp_registry)
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "shared.html", "byte-identical body")

        first = svc.import_report(
            html, _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1")
        )
        assert first.asset.project_id == PROJECT_ID

        # Different identity on every axis that matters (subject AND
        # instance_key), same bytes, and an attribution that resolves elsewhere.
        second = svc.import_report(
            html,
            _envelope(
                route="program", subject=OTHER_PROJECT_SLUG, instance_key="M2"
            ),
        )

        # This IS the hash-duplicate branch: same asset handed back, no write.
        assert second.is_duplicate is True
        assert second.asset.id == first.asset.id

        # ...and the first report's attribution survived it, on disk.
        reread = ImportService(tmp_registry)._assets.get(first.asset.id)
        assert reread is not None
        assert reread.project_id == PROJECT_ID
        assert reread.id in _project_report_ids(PROJECT_ID)
        assert reread.id not in _project_report_ids(OTHER_PROJECT_ID)

    def test_byte_duplicate_does_not_attribute_an_unattributed_other_report(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """The inverse of the repair path: leaving a byte-twin unattributed is
        correct, because attributing it would be attributing the WRONG report.

        Distinguishes the guard from ``_stamp_report_attribution``'s
        "``project_id`` is already correct" early return — here there IS a patch
        to write, and it must still not be written.
        """
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "shared.html", "byte-identical body")

        first = svc.import_report(
            html,
            _envelope(
                route="program",
                subject="orphan-subject",
                instance_key="M1",
                generated_from={"repo": "/tmp/not_a_known_repo", "ref": "main"},
            ),
        )
        assert first.asset.project_id is None

        second = svc.import_report(
            html,
            _envelope(route="program", subject=PROJECT_SLUG, instance_key="M2"),
        )
        assert second.is_duplicate is True
        assert second.asset.id == first.asset.id

        reread = ImportService(tmp_registry)._assets.get(first.asset.id)
        assert reread is not None
        assert reread.project_id is None
        assert reread.id not in _project_report_ids(PROJECT_ID)


    def test_byte_duplicate_does_not_link_its_scope_onto_the_other_report(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """The same defect one field over: LINKS, not just attribution.

        Attribution was gated first and the ``_link_report_targets`` call was
        left running unconditionally, so a colliding ingest of report B left
        report A's ``project_id`` alone but ADDED B's ``("project",
        "fleet-beta")`` evidence link — and an ``asset_linked`` audit event —
        onto A's asset. Report B's scope then showed up on report A wherever
        links are read.

        Asserted as a whole-set comparison rather than "the bad link is
        absent": a set equality also catches a link added under some *other*
        target type, which an absence check would wave through.
        """
        _add_project(tmp_registry)
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "shared.html", "byte-identical body")

        first = svc.import_report(
            html, _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1")
        )
        links_before = _link_pairs(tmp_registry, first.asset.id)
        events_before = _link_event_count(tmp_registry, first.asset.id)
        # Guard the guard: the fixture must actually have produced a link, or a
        # "set unchanged" assertion would hold trivially (empty == empty).
        assert links_before == {("project", PROJECT_SLUG)}
        assert events_before == 1

        second = svc.import_report(
            html,
            _envelope(route="program", subject=OTHER_PROJECT_SLUG, instance_key="M2"),
        )
        assert second.is_duplicate is True
        assert second.asset.id == first.asset.id

        assert _link_pairs(tmp_registry, first.asset.id) == links_before
        assert _link_event_count(tmp_registry, first.asset.id) == events_before

    def test_byte_duplicate_reports_that_nothing_was_stored(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """``is_duplicate`` cannot carry this: the revise path's identical-bytes
        no-op sets it too, and there the asset IS the caller's own report."""
        _add_project(tmp_registry)
        svc = ImportService(tmp_registry)
        html = _write_html(tmp_path, "shared.html", "byte-identical body")

        first = svc.import_report(
            html, _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1")
        )
        assert first.matched_other_report is False

        collided = svc.import_report(
            html,
            _envelope(route="program", subject=OTHER_PROJECT_SLUG, instance_key="M2"),
        )
        assert collided.matched_other_report is True

        # Same bytes, same identity: a true no-op re-ingest of the report that
        # IS stored. Also is_duplicate=True — which is why the flag exists.
        reingest = svc.import_report(
            html, _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1")
        )
        assert reingest.is_duplicate is True
        assert reingest.matched_other_report is False

    def test_cli_warns_that_the_operators_report_was_not_stored(
        self, tmp_registry: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        """Exit 0 with a "Report duplicate of" line reads as success; without a
        warning the operator has no way to learn their report was never hosted.
        """
        _add_project(tmp_registry)
        html = _write_html(tmp_path, "shared.html", "byte-identical body")

        first_env = tmp_path / "first.json"
        first_env.write_text(
            json.dumps(
                _envelope(route="program", subject=PROJECT_SLUG, instance_key="M1")
            ),
            encoding="utf-8",
        )
        assert run_cli("report", "ingest", str(html), "--envelope", str(first_env)) == 0
        first_out = capsys.readouterr()
        assert "WARNING" not in first_out.err
        stored_id = next(
            ln.split("Report ingested:", 1)[1].strip()
            for ln in first_out.out.splitlines()
            if "Report ingested:" in ln
        )

        collide_env = tmp_path / "collide.json"
        collide_env.write_text(
            json.dumps(
                _envelope(
                    route="program", subject=OTHER_PROJECT_SLUG, instance_key="M2"
                )
            ),
            encoding="utf-8",
        )
        code = run_cli("report", "ingest", str(html), "--envelope", str(collide_env))
        captured = capsys.readouterr()

        # Exit code deliberately unchanged (documented in the CLI docstring), so
        # the warning is the whole signal.
        assert code == 0
        assert "WARNING: report NOT stored" in captured.err
        # Names the matched asset, so the operator can go look at what it is.
        assert stored_id in captured.err
        # ...and says the two writes that did NOT happen, matching the service.
        assert "no attribution, no scope links" in captured.err
        assert "not hosted in Atlas" in captured.err


# ---------------------------------------------------------------------------
# No collateral damage to the shared import paths
# ---------------------------------------------------------------------------


class TestSharedImportPathsUnchanged:
    def test_content_upload_still_defaults_to_inbox(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """``import_content`` gained an OPTIONAL status param; its default (and
        therefore the MCP/HTTP content-upload behaviour) is unchanged."""
        svc = ImportService(tmp_registry)
        result = svc.import_content("notes.md", b"# notes")
        assert result.asset.status.value == "inbox"

    def test_content_upload_does_not_get_a_workspace_id(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """workspace_id is stamped for reports only — no other create path
        changed shape (which is why it was not added to ``AssetCreate``)."""
        svc = ImportService(tmp_registry)
        result = svc.import_content("notes2.md", b"# notes 2")
        assert result.asset.workspace_id is None

    def test_url_import_still_defaults_to_inbox(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        svc = ImportService(tmp_registry)
        result = svc.import_url("https://example.com/a", title="A")
        assert result.asset.status.value == "inbox"
