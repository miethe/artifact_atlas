"""DI-Backfill — tests for scripts/backfill_reports.py.

Covers the guarantees the backfill script exists to make:

  - dry run is the DEFAULT and writes **nothing** (registry + content store
    byte-identical afterwards);
  - ``--apply`` without an explicit selection is refused (exit 2) — a bare
    invocation can never ingest;
  - ``--apply --select`` ingests through the one ingest path
    (``ImportService.import_report``), producing a ``delivery_report`` asset
    that is servable (``mime_type=text/html``, ``agent_access=preview_allowed``);
  - re-applying **revises the same asset id** rather than duplicating — which
    is only true because the synthesized envelope carries an ``instance_key``
    for the recurring ``program`` route (``DI-SubjectCollapse``);
  - that ``instance_key`` is a property of the **report**, not of the
    invocation: the same file reached via two different ``--root``/``--pattern``
    spellings derives the *same* key (so a differently-spelled re-run revises
    rather than duplicating), and a report with no derivation anchor at all is
    refused outright instead of ingested under a scan-relative guess;
  - a backfilled report is **project-reachable**: its ``project_id`` is the
    canonical ``proj_*`` id, never a slug and never ``None`` when the subject
    names a known project (every Atlas web route lives under
    ``projects/[projectId]``, so an unattributed report is hosted-but-invisible);
  - ``--apply --select`` naming a candidate that cannot be ingested is a usage
    error (exit 2), never a 0-exit no-op — that refusal covers the **whole** run
    (a mixed selection ingests nothing, deliberately), and it still emits the
    ``--json`` document, because exit 2 with an empty stdout is
    indistinguishable from a crash to a machine consumer;
  - two files that derive the *same* report node (``<dir>/index.html`` and
    ``<dir>.html``) are refused rather than folded onto one ``instance_key`` and
    one selector;
  - one candidate blowing up mid-sweep does not abort the remaining ones;
  - D-018 / files-are-canonical: every source file under the scan root is
    byte-identical (and same-mtime) after an apply — Atlas holds a derived
    pointer plus its own content-store copy, never the original;
  - a rendered HTML with no delivery-report manifest is skipped with an
    explicit, visible reason (never guessed at from its ``html_capsule``
    sidecar);
  - a prose ``report.subject`` is skipped by default with a reason, and
    ingested verbatim only under the explicit ``--allow-prose-subject``.

All fixtures are created locally in ``tmp_path``: nothing here depends on the
sibling ``agentic_meta_dev`` checkout being present, so the suite passes on a
clean clone.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import pytest

from app.repositories.assets import AssetRepository

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "backfill_reports.py"


def _load_script() -> Any:
    """Import scripts/backfill_reports.py by path (it is not a package)."""
    spec = importlib.util.spec_from_file_location("backfill_reports", SCRIPT_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules["backfill_reports"] = module
    spec.loader.exec_module(module)
    return module


backfill = _load_script()


# ---------------------------------------------------------------------------
# Local fixtures — a miniature of the real on-disk report layout
# ---------------------------------------------------------------------------


def _manifest(
    *,
    route: str,
    subject: str,
    title: str,
    tracker: str | None = "node_01KYWGWKHF5BWAQYACK46NC1TC",
    instance_key: str | None = None,
) -> dict[str, Any]:
    """A delivery-report manifest shaped like the real ones on disk.

    Mirrors ``.claude/reports/aos-atlas/<slug>/report.json``: schema_version
    1.0 with a ``report`` block plus ``items[]`` carrying ``handoff.tracker``.
    """
    report: dict[str, Any] = {
        "route": route,
        "title": title,
        "subject": subject,
        "revision": 1,
        "generated_from": {
            "repo": "/local/repo",
            "ref": "main",
            "commit": "abc1234",
        },
        "truth_status": "verified",
        "generated_by": "delivery-report 0.1.1 via build_reports.py",
        "generated_at": "2026-08-02",
    }
    if instance_key is not None:
        report["instance_key"] = instance_key
    items: list[dict[str, Any]] = [
        {"id": "I-1", "kind": "shipped", "title": "Something shipped"},
        {"id": "I-2", "kind": "finding", "title": "Something open"},
    ]
    if tracker is not None:
        items[1]["handoff"] = {"tracker": tracker, "command": None}
    return {"schema_version": "1.0", "report": report, "items": items}


def _write_report_dir(
    root: Path, key: str, manifest: dict[str, Any], *, html: str = "<html>v1</html>"
) -> Path:
    """``<root>/<key>/index.html`` + ``<root>/<key>/report.json``."""
    d = root / key
    d.mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(html, encoding="utf-8")
    (d / "report.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    return d / "index.html"


def _fake_repo(base: Path, name: str = "agentic_meta_dev") -> Path:
    """A directory that reads as a repository root to the backfill.

    ``instance_key`` derivation anchors on the nearest ancestor holding a
    ``.git`` entry — a dependency-free stand-in for ``git rev-parse
    --show-toplevel`` (see ``_REPO_MARKER``). Creating the marker is all a
    fixture needs: nothing here runs git, so no real repo (and no git binary) is
    required, and the suite stays hermetic.
    """
    repo = base / name
    (repo / ".git").mkdir(parents=True, exist_ok=True)
    return repo


@pytest.fixture()
def source_repo(tmp_path: Path) -> Path:
    """The repo that *owns* the fixture reports — the derivation anchor.

    Mirrors reality (``agentic_meta_dev/.claude/reports/aos-atlas/<slug>/``).
    The ``.git`` marker sits here, **above** the scan root, so the byte-identity
    snapshots in the D-018 tests never see it.
    """
    return _fake_repo(tmp_path)


@pytest.fixture()
def reports_root(source_repo: Path) -> Path:
    """A scan root holding the shapes the real backfill must cope with."""
    root = source_repo / ".claude" / "reports" / "aos-atlas"
    root.mkdir(parents=True)

    # (1) route=program, slug subject that IS a seeded Atlas project.
    _write_report_dir(
        root,
        "artifact-atlas",
        _manifest(
            route="program",
            subject="artifact-atlas",
            title="Artifact Atlas — the asset graph & report host",
        ),
    )
    # (2) route=program, slug subject that is not a known Atlas project.
    _write_report_dir(
        root,
        "intenttree",
        _manifest(route="program", subject="intenttree", title="IntentTree — tracker"),
    )
    # (3) route=feature — collapsing route, must carry no instance_key.
    _write_report_dir(
        root,
        "feature-report",
        _manifest(
            route="feature",
            subject="delivery-report-hosting",
            title="PF-1 — feature report",
        ),
    )
    # (4) prose subject (the real portfolio-week-in-review shape).
    _write_report_dir(
        root,
        "portfolio-week",
        _manifest(
            route="program",
            subject="AOS and cross-project portfolio · August 3–8, 2026",
            title="This week, AOS started proving the path.",
        ),
    )
    # (5) an unresolvable tracker — ingest must fail loud, dry run must warn.
    _write_report_dir(
        root,
        "bad-tracker",
        _manifest(
            route="program",
            subject="knitwit",
            title="Knitwit — status",
            tracker="see the sprint board",
        ),
    )
    # (6) bare rendered HTML with only an html_capsule sidecar — no manifest.
    (root / "weekly-aar-review-2026-08-07.html").write_text(
        "<html>weekly aar</html>", encoding="utf-8"
    )
    (root / "weekly-aar-review-2026-08-07.capsule.yaml").write_text(
        "html_capsule:\n  schema_version: 0.1\n  title: Weekly AAR Review\n",
        encoding="utf-8",
    )
    return root


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _snapshot(*roots: Path) -> dict[str, tuple[bytes, int]]:
    """Map every file under *roots* to ``(bytes, mtime_ns)``."""
    out: dict[str, tuple[bytes, int]] = {}
    for root in roots:
        if not root.exists():
            continue
        for path in sorted(root.rglob("*")):
            if path.is_file():
                out[str(path)] = (path.read_bytes(), path.stat().st_mtime_ns)
    return out


def _reports(registry_dir: Path) -> list[Any]:
    return [
        a
        for a in AssetRepository(registry_dir).list()
        if a.artifact_type_id == "delivery_report"
    ]


def _run(argv: list[str]) -> int:
    return backfill.main(argv)


def _plan(reports_root: Path, *extra: str) -> dict[str, Any]:
    """Run a JSON dry run and return the parsed plan."""
    import io
    import contextlib

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = _run([str(reports_root), "--json", *extra])
    assert rc == 0, buf.getvalue()
    return json.loads(buf.getvalue())


def _by_key(plan: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {c["key"]: c for c in plan["candidates"]}


# ---------------------------------------------------------------------------
# Discovery + envelope synthesis
# ---------------------------------------------------------------------------


def test_discovery_finds_every_rendered_html(reports_root: Path) -> None:
    cands = _by_key(_plan(reports_root))
    assert set(cands) == {
        "artifact-atlas",
        "intenttree",
        "feature-report",
        "portfolio-week",
        "bad-tracker",
        "weekly-aar-review-2026-08-07",
    }


def test_envelope_is_synthesized_from_the_manifest(reports_root: Path) -> None:
    """Every envelope field is read out of report.json, none guessed."""
    cand = _by_key(_plan(reports_root, "--collection", "aos-atlas"))["artifact-atlas"]
    env = cand["envelope"]

    assert cand["manifest_path"].endswith("artifact-atlas/report.json")
    assert env["envelope_version"] == "1.0"
    assert env["artifact_type"] == "delivery-report"
    assert env["target"] == "atlas"
    assert env["route"] == "program"
    assert env["subject"] == "artifact-atlas"
    assert env["title"] == "Artifact Atlas — the asset graph & report host"
    assert env["revision"] == 1
    assert env["truth_status"] == "verified"
    assert env["generated_from"] == {
        "repo": "/local/repo",
        "ref": "main",
        "commit": "abc1234",
    }
    assert env["generated_at"] == "2026-08-02"
    assert env["item_count"] == 2
    assert env["tracker_links"] == [
        {
            "item": "I-2",
            "tracker": "node_01KYWGWKHF5BWAQYACK46NC1TC",
            "kind": "finding",
        }
    ]
    # Absolute local paths, matching the upstream emitter.
    assert Path(env["html_path"]).is_absolute()
    assert Path(env["manifest_path"]).is_absolute()


def test_recurring_route_gets_a_derived_instance_key(reports_root: Path) -> None:
    """route=program recurs, so identity needs an instance_key (see the
    revise-not-duplicate test for why this is load-bearing).

    ``--collection aos-atlas`` names an ancestor directory of the report, so
    that directory is the derivation anchor and the key is measured from it.
    """
    cand = _by_key(_plan(reports_root, "--collection", "aos-atlas"))["artifact-atlas"]
    assert cand["instance_key_source"] == "derived_from_collection_dir"
    assert cand["envelope"]["instance_key"] == "aos-atlas/artifact-atlas"
    assert (
        cand["envelope"]["link_identity"]
        == "report:program:artifact-atlas:aos-atlas/artifact-atlas"
    )
    # The derivation inputs are recorded so a key that ever *does* change is
    # diagnosable from the plan instead of surfacing as a mystery duplicate.
    # --root/--pattern are deliberately absent: they are not inputs.
    assert cand["instance_key_derivation"] == {
        "anchor_kind": "collection_dir",
        "anchor_path": str(reports_root),
        "collection": "aos-atlas",
        "relative_path": "artifact-atlas",
    }
    assert cand["envelope"]["instance_key_derivation"] == (
        cand["instance_key_derivation"]
    )


def test_instance_key_falls_back_to_the_owning_repo_root(
    reports_root: Path, source_repo: Path
) -> None:
    """With no --collection the anchor is the repository that owns the file, so
    the key is still a property of the report rather than of the scan."""
    cand = _by_key(_plan(reports_root))["artifact-atlas"]
    assert cand["instance_key_source"] == "derived_from_repo_root"
    assert cand["envelope"]["instance_key"] == (
        "agentic_meta_dev/.claude/reports/aos-atlas/artifact-atlas"
    )
    assert cand["instance_key_derivation"] == {
        "anchor_kind": "repo_root",
        "anchor_path": str(source_repo),
        "collection": "agentic_meta_dev",
        "relative_path": ".claude/reports/aos-atlas/artifact-atlas",
    }


@pytest.mark.parametrize("collection", [None, "aos-atlas"])
def test_instance_key_is_identical_across_two_root_spellings(
    reports_root: Path, source_repo: Path, collection: str | None
) -> None:
    """THE regression guard for the invocation-dependence bug.

    An earlier ``_resolve_instance_key`` composed ``"<root.name>/<path relative
    to root>"``, so the SAME report scanned as ``--root .../aos-atlas`` keyed as
    ``aos-atlas/artifact-atlas`` while ``--root .../reports --pattern
    'aos-atlas/**/index.html'`` keyed it as
    ``reports/aos-atlas/artifact-atlas``. Two keys is two identities, so the
    second run DUPLICATED every asset rather than revising it — silently
    destroying the whole point of the script. Identity is now anchored on the
    report's own path (collection directory, else owning repo root), so neither
    ``--root`` nor ``--pattern`` can move it.
    """
    extra = ["--collection", collection] if collection else []

    deep = _by_key(_plan(reports_root, *extra))["artifact-atlas"]

    # Same file, reached from three shallower roots with matching patterns.
    spellings = [
        (source_repo / ".claude" / "reports", "aos-atlas/**/index.html"),
        (source_repo, ".claude/reports/aos-atlas/**/index.html"),
        (source_repo.parent, "*/.claude/reports/aos-atlas/**/index.html"),
    ]
    for root, pattern in spellings:
        plan = _plan(root, "--pattern", pattern, *extra)
        matches = [
            c
            for c in plan["candidates"]
            if Path(c["html_path"]).parent.name == "artifact-atlas"
        ]
        assert len(matches) == 1, f"{root} + {pattern} did not reach the report"
        other = matches[0]

        # The selection handle IS scan-relative (it is what the operator types);
        # identity must not be.
        assert other["key"] != deep["key"]
        assert other["envelope"]["instance_key"] == deep["envelope"]["instance_key"], (
            f"instance_key changed with the scan spelling ({root} + {pattern}): "
            "a differently-spelled re-run would duplicate instead of revise"
        )
        assert other["envelope"]["link_identity"] == deep["envelope"]["link_identity"]
        assert other["instance_key_derivation"] == deep["instance_key_derivation"]


def test_reapply_via_a_different_root_spelling_still_revises(
    reports_root: Path, source_repo: Path, tmp_registry: Path
) -> None:
    """The end-to-end consequence of the guard above: the second apply lands on
    the SAME asset even though it was spelled completely differently."""
    assert _run([str(reports_root), "--apply", "--select", "artifact-atlas"]) == 0
    (first,) = _reports(tmp_registry)

    (reports_root / "artifact-atlas" / "index.html").write_text(
        "<html>v2 — re-rendered</html>", encoding="utf-8"
    )
    assert (
        _run(
            [
                str(source_repo),
                "--pattern",
                ".claude/reports/aos-atlas/**/index.html",
                "--apply",
                "--select",
                ".claude/reports/aos-atlas/artifact-atlas",
            ]
        )
        == 0
    )

    assets = _reports(tmp_registry)
    assert len(assets) == 1, "a differently-spelled re-run duplicated the report"
    assert assets[0].id == first.id
    assert assets[0].hash_sha256 != first.hash_sha256


def test_underivable_instance_key_is_refused_not_guessed(tmp_path: Path) -> None:
    """No repo ancestor and no matching --collection -> the candidate is skipped
    with a reason, rather than ingested under a scan-root-relative key that a
    differently-spelled re-run would fail to match."""
    root = tmp_path / "loose" / "reports"
    root.mkdir(parents=True)
    _write_report_dir(
        root, "orphan", _manifest(route="program", subject="orphan", title="Orphan")
    )

    assert backfill._find_repo_root(root) is None, (
        "precondition: the tmp scan root must not itself sit inside a repository"
    )

    cand = _by_key(_plan(root))["orphan"]
    assert cand["ingestable"] is False
    assert cand["skip_reason"] == "instance_key_underivable"
    assert cand["envelope"] is None
    detail = cand["skip_detail"] or ""
    assert "--instance-key" in detail
    assert "--collection" in detail

    # …and the documented escapes both work.
    override = _by_key(_plan(root, "--instance-key", "M4"))["orphan"]
    assert override["instance_key_source"] == "cli_override"
    assert override["envelope"]["instance_key"] == "M4"

    named = _by_key(_plan(root, "--collection", "reports"))["orphan"]
    assert named["instance_key_source"] == "derived_from_collection_dir"
    assert named["envelope"]["instance_key"] == "reports/orphan"


def test_manifest_instance_key_wins_over_derivation(tmp_path: Path) -> None:
    """Precedence 1 short-circuits derivation entirely — note this root has no
    repository ancestor at all, so any derivation would have been refused."""
    root = tmp_path / "reports"
    root.mkdir()
    _write_report_dir(
        root,
        "skillmeat",
        _manifest(
            route="program",
            subject="skillmeat",
            title="SkillMeat",
            instance_key="M3",
        ),
    )
    cand = _by_key(_plan(root))["skillmeat"]
    assert cand["instance_key_source"] == "manifest"
    assert cand["envelope"]["instance_key"] == "M3"
    assert cand["instance_key_derivation"] is None


def test_colliding_report_node_layouts_are_refused(
    reports_root: Path, tmp_registry: Path
) -> None:
    """``<dir>/index.html`` and ``<dir>.html`` are ONE report node, two files.

    ``_relative_report_id`` is the identity-bearing derivation — its result is
    composed into ``instance_key`` and *is* the ``--select`` handle — and it maps
    both of those layouts onto ``<dir>``. Unguarded, two genuinely distinct
    reports would share one identity (whichever ran second revises the first,
    silently) and one selector (``--select dup`` could not say which was meant).
    Both members are therefore refused outright; the operator renames one file.
    """
    _write_report_dir(
        reports_root,
        "dup",
        _manifest(
            route="program", subject="dup-dir", title="Dir layout", tracker=None
        ),
        html="<html>dir layout</html>",
    )
    flat = reports_root / "dup.html"
    flat.write_text("<html>flat layout</html>", encoding="utf-8")
    (reports_root / "dup.report.json").write_text(
        json.dumps(
            _manifest(
                route="program", subject="dup-file", title="Flat layout", tracker=None
            )
        ),
        encoding="utf-8",
    )

    # The collision is real, by direct call on the derivation itself.
    index_layout = reports_root / "dup" / "index.html"
    assert backfill._relative_report_id(reports_root, index_layout) == "dup"
    assert backfill._relative_report_id(reports_root, flat) == "dup"

    dup = [c for c in _plan(reports_root)["candidates"] if c["key"] == "dup"]
    assert len(dup) == 2, "one report node, two files — both must be listed"
    assert {Path(c["html_path"]).name for c in dup} == {"index.html", "dup.html"}
    for cand in dup:
        assert cand["skip_reason"] == "ambiguous_report_node"
        assert cand["ingestable"] is False
        assert cand["envelope"] is None, "no envelope, so no colliding identity"
        assert "dup" in (cand["skip_detail"] or "")  # names the shared node

    # …and naming the ambiguous node is a usage error, never a coin flip.
    assert _run([str(reports_root), "--apply", "--select", "dup"]) == 2
    assert _reports(tmp_registry) == []


def test_collapsing_route_carries_no_instance_key(reports_root: Path) -> None:
    """feature/dossier collapse onto one living record per subject by design."""
    cand = _by_key(_plan(reports_root))["feature-report"]
    assert cand["instance_key_source"] == "not_applicable"
    assert cand["envelope"]["instance_key"] is None
    assert cand["envelope"]["link_identity"] == "report:feature:delivery-report-hosting"


# ---------------------------------------------------------------------------
# Skips — visible, reasoned, never guessed
# ---------------------------------------------------------------------------


def test_missing_manifest_is_skipped_with_a_reason(reports_root: Path) -> None:
    cand = _by_key(_plan(reports_root))["weekly-aar-review-2026-08-07"]
    assert cand["ingestable"] is False
    assert cand["skip_reason"] == "no_manifest"
    assert cand["envelope"] is None
    # The reason names the capsule sidecar and why it is not a substitute.
    assert "capsule.yaml" in (cand["skip_detail"] or "")
    assert "html_capsule" in (cand["skip_detail"] or "")


def test_missing_manifest_skip_is_visible_in_text_dry_run(
    reports_root: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert _run([str(reports_root)]) == 0
    out = capsys.readouterr().out
    assert "weekly-aar-review-2026-08-07" in out
    assert "SKIPPED:      no_manifest" in out
    assert "Dry run complete — nothing was written." in out


def test_ambiguous_sibling_manifest_is_not_claimed(tmp_path: Path) -> None:
    """A directory with several unrelated HTML files and one report.json must
    not have every file claim that manifest — wrong provenance is worse than
    none. A single-HTML directory pairs unambiguously and does."""
    root = _fake_repo(tmp_path, "repo") / "reports"
    ambiguous = root / "ambiguous"
    ambiguous.mkdir(parents=True)
    (ambiguous / "report.json").write_text(
        json.dumps(_manifest(route="program", subject="ccdash", title="CCDash")),
        encoding="utf-8",
    )
    (ambiguous / "a.html").write_text("<html>a</html>", encoding="utf-8")
    (ambiguous / "b.html").write_text("<html>b</html>", encoding="utf-8")

    solo = root / "solo"
    solo.mkdir()
    (solo / "report.json").write_text(
        json.dumps(_manifest(route="program", subject="hermes", title="Hermes")),
        encoding="utf-8",
    )
    (solo / "report.html").write_text("<html>solo</html>", encoding="utf-8")

    cands = _by_key(_plan(root))
    assert cands["ambiguous/a"]["skip_reason"] == "no_manifest"
    assert cands["ambiguous/b"]["skip_reason"] == "no_manifest"
    assert cands["solo/report"]["ingestable"] is True
    assert cands["solo/report"]["envelope"]["subject"] == "hermes"


def test_prose_subject_is_skipped_by_default(reports_root: Path) -> None:
    cand = _by_key(_plan(reports_root))["portfolio-week"]
    assert cand["ingestable"] is False
    assert cand["skip_reason"] == "prose_subject"
    assert "--allow-prose-subject" in (cand["skip_detail"] or "")


def test_prose_subject_ingested_verbatim_under_the_opt_in(
    reports_root: Path, tmp_registry: Path
) -> None:
    """The opt-in never slugifies or truncates: subject goes in as written and
    the warning says the AssetLink target id will be that whole string."""
    plan = _by_key(_plan(reports_root, "--allow-prose-subject"))["portfolio-week"]
    assert plan["ingestable"] is True
    assert plan["envelope"]["subject"] == "AOS and cross-project portfolio · August 3–8, 2026"
    assert any("prose" in w for w in plan["warnings"])

    rc = _run(
        [
            str(reports_root),
            "--apply",
            "--allow-prose-subject",
            "--select",
            "portfolio-week",
        ]
    )
    assert rc == 0
    (asset,) = _reports(tmp_registry)
    assert (asset.metadata or {}).get("subject") == (
        "AOS and cross-project portfolio · August 3–8, 2026"
    )


def test_unresolvable_tracker_warns_in_dry_run_and_fails_loud_on_apply(
    reports_root: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    plan = _by_key(_plan(reports_root))["bad-tracker"]
    assert plan["ingestable"] is True  # shape is fine; the tracker is not
    assert any("does not look like" in w for w in plan["warnings"])

    rc = _run([str(reports_root), "--apply", "--select", "bad-tracker"])
    assert rc == 1
    assert "FAILED  bad-tracker" in capsys.readouterr().out
    # Fail-loud means no partial asset.
    assert _reports(tmp_registry) == []


# ---------------------------------------------------------------------------
# Dry run writes nothing; apply needs an explicit selection
# ---------------------------------------------------------------------------


def test_dry_run_is_the_default_and_writes_nothing(
    reports_root: Path, tmp_registry: Path, tmp_path: Path
) -> None:
    content_store = tmp_path / "assets"
    before = _snapshot(tmp_registry, content_store, reports_root)

    assert _run([str(reports_root)]) == 0

    assert _snapshot(tmp_registry, content_store, reports_root) == before
    assert _reports(tmp_registry) == []


def test_apply_without_a_selection_is_refused(
    reports_root: Path, tmp_registry: Path
) -> None:
    assert _run([str(reports_root), "--apply"]) == 2
    assert _reports(tmp_registry) == []


def test_apply_rejects_all_and_select_together(reports_root: Path) -> None:
    assert (
        _run([str(reports_root), "--apply", "--all", "--select", "artifact-atlas"]) == 2
    )


def test_unmatched_selector_is_an_error(reports_root: Path) -> None:
    assert _run([str(reports_root), "--apply", "--select", "nope"]) == 2


@pytest.mark.parametrize(
    ("selector", "reason"),
    [
        ("weekly-aar-review-2026-08-07", "no_manifest"),
        ("portfolio-week", "prose_subject"),
    ],
)
def test_apply_with_a_non_ingestable_selector_is_a_usage_error(
    reports_root: Path,
    tmp_registry: Path,
    capsys: pytest.CaptureFixture[str],
    selector: str,
    reason: str,
) -> None:
    """Naming a report explicitly is a claim that it can be ingested.

    This used to exit **0** having done nothing: mark_selection set
    selected=True on the skipped candidate, apply_candidates filtered it back
    out, and main printed 'Done: 0 ingested/revised, 0 failed.' — an operator who
    asked for exactly one report was told the run succeeded while nothing had
    been ingested, with no exit code distinguishing it from a real ingest.
    """
    rc = _run([str(reports_root), "--apply", "--select", selector])
    assert rc == 2

    captured = capsys.readouterr()
    assert selector in captured.err
    assert reason in captured.err  # names *why* it cannot be ingested
    assert "Done:" not in captured.out  # never reports a successful run
    assert _reports(tmp_registry) == []


def test_non_ingestable_selection_is_only_a_note_in_a_dry_run(
    reports_root: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A dry run exists to explain *why*, so it notes the problem and still
    prints the plan — and never labels the candidate as about to be ingested."""
    rc = _run([str(reports_root), "--select", "weekly-aar-review-2026-08-07"])
    captured = capsys.readouterr()
    assert rc == 0
    assert "NOTE: --select named 'weekly-aar-review-2026-08-07'" in captured.err
    assert "[SKIP (named by --select)] weekly-aar-review-2026-08-07" in captured.out
    assert "[SELECTED] weekly-aar-review-2026-08-07" not in captured.out


def test_mixed_selection_refuses_the_whole_run(
    reports_root: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """INTENDED, pinned so it cannot flip silently: one un-ingestable selector
    refuses the *entire* run.

    ``--select <good>,<un-ingestable>`` does **not** ingest the good one and
    grumble about the other — it ingests nothing and exits 2, even though
    ``--select artifact-atlas`` alone ingests fine (see
    ``test_apply_ingests_selected_candidates_only``). Deliberate: a partial apply
    would make exit 2 mean "some unspecified subset of the reports you named
    landed", answerable only by reading the registry, and the operator's obvious
    next move — fix the bad selector, re-run — would then be a re-ingest of the
    good one. All-or-nothing keeps exit 2 meaning "nothing changed".
    """
    rc = _run(
        [
            str(reports_root),
            "--apply",
            "--select",
            "artifact-atlas,weekly-aar-review-2026-08-07",
        ]
    )
    captured = capsys.readouterr()

    assert rc == 2
    assert _reports(tmp_registry) == [], "the GOOD candidate must not land either"
    assert "weekly-aar-review-2026-08-07" in captured.err
    assert "Nothing was ingested" in captured.err  # says so, does not merely imply
    assert "Done:" not in captured.out


def test_refusal_still_emits_a_json_document(
    reports_root: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """``--json`` is a machine contract, so the refusal path owes a document.

    The refusal used to ``return 2`` *before* the ``--json`` branch, so
    ``--apply --json --select <mixed>`` put the reason on stderr as English prose
    and left stdout empty — a consumer parsing stdout got a zero-byte document
    and no way to tell a refusal from a crash.
    """
    rc = _run(
        [
            str(reports_root),
            "--apply",
            "--json",
            "--select",
            "artifact-atlas,weekly-aar-review-2026-08-07",
        ]
    )
    captured = capsys.readouterr()
    assert rc == 2, "the refusal still exits 2"

    doc = json.loads(captured.out)  # valid JSON, not an empty document
    assert doc["mode"] == "apply"

    refusal = doc["refusal"]
    assert refusal["reason"] == "uningestable_selection"
    assert "Nothing was ingested" in refusal["message"]
    # …naming WHICH selectors were un-ingestable, and WHY.
    blocked = {c["key"]: c for c in refusal["candidates"]}
    assert set(blocked) == {"weekly-aar-review-2026-08-07"}
    entry = blocked["weekly-aar-review-2026-08-07"]
    assert entry["selectors"] == ["weekly-aar-review-2026-08-07"]
    assert entry["skip_reason"] == "no_manifest"
    assert entry["skip_detail"]

    # The full plan is still in the document, so a consumer can see that the
    # good candidate was selected and — per the refusal — not ingested.
    assert _by_key(doc)["artifact-atlas"]["selected"] is True
    assert _reports(tmp_registry) == []

    # ``refusal`` is a stable key, not one that only materializes on failure, so
    # a consumer branches on its value rather than on stdout being empty.
    assert _plan(reports_root)["refusal"] is None


# ---------------------------------------------------------------------------
# Apply
# ---------------------------------------------------------------------------


def test_apply_ingests_selected_candidates_only(
    reports_root: Path, tmp_registry: Path
) -> None:
    rc = _run(
        [str(reports_root), "--apply", "--select", "artifact-atlas,intenttree"]
    )
    assert rc == 0

    assets = _reports(tmp_registry)
    assert {(a.metadata or {}).get("subject") for a in assets} == {
        "artifact-atlas",
        "intenttree",
    }
    for asset in assets:
        # Servability contract from import_report (the 403 trap).
        assert asset.mime_type == "text/html"
        access = asset.agent_access
        assert (access.value if hasattr(access, "value") else access) == "preview_allowed"
        assert asset.storage_uri  # content-store copy exists
        meta = asset.metadata or {}
        assert meta["route"] == "program"
        assert meta["truth_status"] == "verified"
        assert meta["instance_key"]

    # Reachability, not decoration: every Atlas web route lives under
    # projects/[projectId], so a report stored with project_id=None (or with the
    # *slug* instead of the canonical id, which matches no project under the
    # exact-equality filter) is hosted and invisible. Asserted here because
    # without it a regression in the sibling attribution fix would leave every
    # backfilled report unreachable with this whole file still green.
    atlas = next(a for a in assets if (a.metadata or {}).get("subject") == "artifact-atlas")
    assert atlas.project_id == "proj_artifact_atlas", (
        "backfilled report is project-unreachable (or stored the 'artifact-atlas' "
        f"slug instead of the canonical proj_* id): {atlas.project_id!r}"
    )
    assert atlas.project_id.startswith("proj_")


def test_apply_all_ingests_every_ingestable_candidate(
    reports_root: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    # bad-tracker is ingestable-by-shape but fails loud -> overall exit 1,
    # while the well-formed candidates still land.
    rc = _run([str(reports_root), "--apply", "--all"])
    out = capsys.readouterr().out
    assert rc == 1
    assert "FAILED  bad-tracker" in out

    subjects = {(a.metadata or {}).get("subject") for a in _reports(tmp_registry)}
    assert subjects == {"artifact-atlas", "intenttree", "delivery-report-hosting"}
    # prose + no-manifest candidates were never attempted.
    assert not any(s and "portfolio" in s for s in subjects)


def test_one_exploding_candidate_does_not_abort_the_sweep(
    reports_root: Path,
    tmp_registry: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """An unforeseen error on one candidate must not strand the rest.

    The apply loop used to catch only ImportError/OSError, so anything else
    propagated as a traceback: the candidates after it were never attempted and
    the operator got no summary of what had landed — a partially-applied backfill
    with no record. 'artifact-atlas' sorts before 'intenttree', so the second
    asset existing is proof the sweep continued past the failure.
    """
    build_service = backfill._build_import_service

    class _ExplodesOnOne:
        def __init__(self, inner: Any) -> None:
            self._inner = inner

        def import_report(self, html_path: Any, envelope: Any, **kwargs: Any) -> Any:
            if (envelope or {}).get("subject") == "artifact-atlas":
                raise RuntimeError("registry went sideways")
            return self._inner.import_report(html_path, envelope, **kwargs)

    monkeypatch.setattr(
        backfill,
        "_build_import_service",
        lambda registry_dir: _ExplodesOnOne(build_service(registry_dir)),
    )

    rc = _run([str(reports_root), "--apply", "--select", "artifact-atlas,intenttree"])
    out = capsys.readouterr().out

    assert rc == 1
    # Reported per candidate, with the exception type so it stays diagnosable.
    assert "FAILED  artifact-atlas: RuntimeError: registry went sideways" in out
    assert "intenttree ->" in out
    assert "Done: 1 ingested/revised, 1 failed." in out
    assert {(a.metadata or {}).get("subject") for a in _reports(tmp_registry)} == {
        "intenttree"
    }


def test_apply_creates_scope_links_from_the_envelope(
    reports_root: Path, tmp_registry: Path
) -> None:
    """Links come from ImportService, not from this script — assert they exist
    so the composition is proven, not assumed."""
    assert _run([str(reports_root), "--apply", "--select", "artifact-atlas"]) == 0
    (asset,) = _reports(tmp_registry)
    links = AssetRepository(tmp_registry).list_links(asset.id)
    targets = {
        (
            lk.target_type.value if hasattr(lk.target_type, "value") else lk.target_type,
            lk.target_id,
        )
        for lk in links
    }
    # 'artifact-atlas' is a seeded Atlas project, so subject types as project.
    assert ("project", "artifact-atlas") in targets
    assert ("intenttree_node", "node_01KYWGWKHF5BWAQYACK46NC1TC") in targets
    # A link is not attribution: the asset's own project_id is what every
    # projects/[projectId] route filters on, so assert it is the canonical id.
    assert asset.project_id == "proj_artifact_atlas"
    assert asset.project_id.startswith("proj_")


def test_byte_identical_reports_do_not_collapse_onto_one_asset(
    reports_root: Path, tmp_registry: Path
) -> None:
    """A report's identity is (route, subject, instance_key), not its content
    hash. The fixture's 'artifact-atlas' and 'intenttree' pages are
    byte-identical; the default hash-duplicate handling would have returned the
    first asset for the second report, silently filing it under the wrong
    subject. ``on_duplicate=create_new`` is what prevents that."""
    src_a = (reports_root / "artifact-atlas" / "index.html").read_bytes()
    src_b = (reports_root / "intenttree" / "index.html").read_bytes()
    assert src_a == src_b, "fixture precondition: identical bytes"

    assert _run([str(reports_root), "--apply", "--select", "artifact-atlas,intenttree"]) == 0

    assets = _reports(tmp_registry)
    assert len({a.id for a in assets}) == 2
    assert {(a.metadata or {}).get("subject") for a in assets} == {
        "artifact-atlas",
        "intenttree",
    }


def test_apply_does_not_override_sensitivity(
    reports_root: Path, tmp_registry: Path
) -> None:
    """DI-Sensitivity: the backfill inherits the ingest defaults rather than
    inventing a policy. The workspace default here is 'personal'."""
    assert _run([str(reports_root), "--apply", "--select", "intenttree"]) == 0
    (asset,) = _reports(tmp_registry)
    sens = asset.sensitivity
    assert (sens.value if hasattr(sens, "value") else sens) == "personal"


# ---------------------------------------------------------------------------
# Re-apply revises rather than duplicating (identity, DI-SubjectCollapse)
# ---------------------------------------------------------------------------


def test_reapply_revises_the_same_asset_instead_of_duplicating(
    reports_root: Path, tmp_registry: Path
) -> None:
    """Identity is (route, subject, instance_key) — because the synthesized
    envelope supplies a stable instance_key for the recurring 'program' route,
    a second backfill run lands on the SAME asset id with the new bytes."""
    argv = [str(reports_root), "--apply", "--select", "artifact-atlas"]

    assert _run(argv) == 0
    (first,) = _reports(tmp_registry)
    first_hash = first.hash_sha256

    # The canonical report is re-rendered in place (new content, same path).
    (reports_root / "artifact-atlas" / "index.html").write_text(
        "<html>v2 — re-rendered</html>", encoding="utf-8"
    )

    assert _run(argv) == 0
    assets = _reports(tmp_registry)
    assert len(assets) == 1, "re-apply duplicated the report instead of revising it"
    assert assets[0].id == first.id
    assert assets[0].hash_sha256 != first_hash


def test_reapply_of_unchanged_bytes_is_a_noop(
    reports_root: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    argv = [str(reports_root), "--apply", "--select", "artifact-atlas"]
    assert _run(argv) == 0
    capsys.readouterr()

    assert _run(argv) == 0
    assert "UNCHANGED artifact-atlas" in capsys.readouterr().out
    assert len(_reports(tmp_registry)) == 1


def test_reapply_does_not_duplicate_asset_links(
    reports_root: Path, tmp_registry: Path
) -> None:
    argv = [str(reports_root), "--apply", "--select", "artifact-atlas"]
    assert _run(argv) == 0
    (asset,) = _reports(tmp_registry)
    before = len(AssetRepository(tmp_registry).list_links(asset.id))

    (reports_root / "artifact-atlas" / "index.html").write_text(
        "<html>v2</html>", encoding="utf-8"
    )
    assert _run(argv) == 0
    assert len(AssetRepository(tmp_registry).list_links(asset.id)) == before


def test_distinct_reports_do_not_collapse_onto_one_asset(
    reports_root: Path, tmp_registry: Path
) -> None:
    """Two program reports for the SAME subject in different locations are
    different instances and must get different assets (DI-SubjectCollapse)."""
    _write_report_dir(
        reports_root / "wave-2",
        "artifact-atlas",
        _manifest(
            route="program",
            subject="artifact-atlas",
            title="Artifact Atlas — wave 2",
        ),
        html="<html>wave 2</html>",
    )
    assert _run([str(reports_root), "--apply", "--all"]) == 1  # bad-tracker fails
    atlas_assets = [
        a for a in _reports(tmp_registry) if (a.metadata or {}).get("subject") == "artifact-atlas"
    ]
    assert len(atlas_assets) == 2
    assert {(a.metadata or {}).get("instance_key") for a in atlas_assets} == {
        "agentic_meta_dev/.claude/reports/aos-atlas/artifact-atlas",
        "agentic_meta_dev/.claude/reports/aos-atlas/wave-2/artifact-atlas",
    }


# ---------------------------------------------------------------------------
# D-018 — the source files are canonical
# ---------------------------------------------------------------------------


def test_apply_leaves_source_files_byte_identical(
    reports_root: Path, tmp_registry: Path
) -> None:
    """AOS files-are-canonical (D-018): Atlas holds a derived pointer plus its
    own content-store copy. The backfill must never move, delete, rewrite, or
    repoint a canonical report file."""
    before = _snapshot(reports_root)
    assert before, "fixture produced no source files"

    assert _run([str(reports_root), "--apply", "--all"]) == 1  # bad-tracker fails loud

    after = _snapshot(reports_root)
    assert set(after) == set(before), "the backfill added or removed source files"
    for path, (data, mtime) in before.items():
        assert after[path][0] == data, f"source file was rewritten: {path}"
        assert after[path][1] == mtime, f"source file was touched: {path}"

    # …and the ingested asset points at Atlas's own content store, not the
    # canonical path.
    for asset in _reports(tmp_registry):
        assert asset.storage_uri
        assert str(reports_root) not in str(asset.storage_uri)
