"""PF-4 — scripts/seed_fleet_projects.py: fleet -> Atlas project-row seeding.

Covers the load-bearing guarantees:
  - dry run is the DEFAULT, exits 0, and writes nothing;
  - dry-run output names every required field per candidate;
  - --apply creates rows through the service layer (readable back by slug);
  - re-applying is idempotent on slug (no duplicate rows, no duplicate ids);
  - underscore fleet ids normalize to hyphenated slugs (artifact_atlas ->
    artifact-atlas) and reproduce the hand-authored proj_artifact_atlas id;
  - a fleet id that cannot be normalized into ^[a-z0-9-]+$ is SKIPPED and
    REPORTED, never written as an invalid slug — including one carrying stray
    whitespace, which is NOT trimmed ("normalized, never sanitized");
  - the conflict guards see TOMBSTONES on BOTH axes: a soft-deleted row blocks
    a fleet app that would reuse its id *or* its slug, instead of appending a
    duplicate — including when the tombstoned row's id is NOT the derived form
    (id proj_legacy_id holding slug foo), where the id guard cannot help;
  - workspace_id is a declared field on ProjectCreate and survives the create
    round trip (previously an undeclared extra; declared per
    node_01KZRMMDB3YKT7T4FJTVVRMKG0);
  - without --tree-map, root_intenttree_node_id stays null (the fleet registry
    carries no node ids — only tree ids exist upstream, a different type).
  - the commit-recency filter (--active-since):
      * omitted -> the filter is disabled entirely and the plan is exactly
        what it was before the filter existed (no recency fields populated,
        no git subprocess spawned);
      * a fresh repo -> CREATE, with recency_state "fresh" and recency_days /
        recency_source populated (auditability on CREATEs too);
      * a stale repo (last commit older than the window) -> ACTION_STALE,
        excluded, does NOT trip --strict;
      * recency that could not be measured at all -> ACTION_UNRESOLVED, a
        SEPARATE outcome from STALE (never collapsed into it), also does not
        trip --strict;
      * --include-unresolved-recency flips an otherwise-UNRESOLVED candidate
        to CREATE;
      * a fleet path naming a SUBDIRECTORY of a larger repo (the real
        `hermes`-inside-`agentic_meta_dev` case) is measured via `git log --
        <relpath>` at the repo toplevel, not the repo's overall HEAD age;
      * a STALE/UNRESOLVED candidate does not reserve its slug, so a later
        fleet entry that collides with it on slug can still legitimately
        CREATE instead of being reported as a false CONFLICT.

Every test runs against the ``tmp_registry`` fixture (a temp copy of the seed
JSONL) and passes ``--registry-dir`` explicitly. The real ``registry/`` is never
written to.
"""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pytest

from app.models.project import ProjectCreate
from app.repositories.projects import ProjectRepository
from app.services.projects import ProjectService

_REPO_ROOT = Path(__file__).resolve().parents[2]
_SCRIPT_PATH = _REPO_ROOT / "scripts" / "seed_fleet_projects.py"


def _load_script_module() -> Any:
    """Import scripts/seed_fleet_projects.py as a module (not on sys.path)."""
    spec = importlib.util.spec_from_file_location(
        "seed_fleet_projects_under_test", _SCRIPT_PATH
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


seed = _load_script_module()


@pytest.fixture(autouse=True)
def _reset_projects_to_atlas_baseline(request: pytest.FixtureRequest) -> None:
    """Trim the copied ``projects.jsonl`` back to the single hand-authored
    ``proj_artifact_atlas`` row these tests were written against.

    ``tmp_registry`` (conftest) copies the real ``registry/*.jsonl`` as seed
    data. Once the fleet seed has been applied to ``registry/projects.jsonl``
    (PF4-2b), that copy carries ~24 real fleet rows whose slugs (e.g.
    ``signal-to-system``, ``research-foundry``) collide with this module's fake
    fleet fixtures — flipping their expected CREATE to SKIP. These tests only
    need the ``artifact-atlas`` row to pre-exist (to exercise the skip guard);
    resetting to that baseline restores their original precondition without
    coupling them to how many real projects the canonical registry now holds.
    """
    if "tmp_registry" not in request.fixturenames:
        return
    reg = request.getfixturevalue("tmp_registry")
    projects = reg / "projects.jsonl"
    if not projects.exists():
        return
    rows = [
        json.loads(line)
        for line in projects.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    keep = [r for r in rows if r.get("slug") == "artifact-atlas"]
    projects.write_text(
        "".join(json.dumps(r) + "\n" for r in keep), encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------


def _fleet_yaml(tmp_path: Path, apps: list[dict[str, Any]]) -> Path:
    """Write a minimal fleet app registry mirroring the real file's shape."""
    lines = ["# test fleet registry", "schema_version: 1", "apps:"]
    for app in apps:
        lines.append(f"  - id: {json.dumps(app['id'])}")
        for key, value in app.items():
            if key == "id":
                continue
            lines.append(f"    {key}: {json.dumps(value)}")
    tmp_path.mkdir(parents=True, exist_ok=True)
    path = tmp_path / "05-app-registry.yaml"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


@pytest.fixture()
def fleet_registry(tmp_path: Path) -> Path:
    """A three-app fleet source: underscore id, hyphen id, and Atlas itself."""
    return _fleet_yaml(
        tmp_path,
        [
            {
                "id": "signal_to_system",
                "name": "Signal to System",
                "path": "/repos/signal_to_system",
                "layer": "L6",
                "role": "AAR -> system pipeline",
                "purpose": "Turns after-action signal into durable system change",
                "status": "partial",
            },
            {
                "id": "research-foundry",
                "name": "Research Foundry",
                "path": "/repos/research-foundry",
                "layer": "L4",
                "role": "Evidence pipeline",
                "purpose": "Claim-traceable research runs and evidence bundles",
                "status": "strong",
            },
            {
                # Already present in the seed registry as proj_artifact_atlas.
                "id": "artifact_atlas",
                "name": "Artifact Atlas",
                "path": "/repos/artifact_atlas",
                "layer": "L5",
                "role": "Asset graph",
                "purpose": "Asset graph, artifact BOM, context-pack builder",
                "status": "ok",
            },
        ],
    )


def _projects_file(registry: Path) -> Path:
    return registry / "projects.jsonl"


def _read_rows(registry: Path) -> list[dict[str, Any]]:
    path = _projects_file(registry)
    if not path.exists():
        return []
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def _run(
    fleet: Path,
    registry: Path,
    *extra: str,
) -> int:
    return seed.main(
        ["--registry", str(fleet), "--registry-dir", str(registry), *extra]
    )


def _git(cwd: Path, *args: str, env: dict[str, str] | None = None) -> None:
    subprocess.run(
        ["git", *args], cwd=str(cwd), check=True, capture_output=True, env=env
    )


def _make_git_repo(root: Path, *, days_ago: float, touch: str = "README.md") -> Path:
    """Create a REAL git repo at *root* with one commit backdated *days_ago*
    days via ``GIT_AUTHOR_DATE``/``GIT_COMMITTER_DATE``.

    *touch* is the file the commit creates, relative to *root* — pass a
    nested path (e.g. ``"sub/dir/file.txt"``) to build the
    subdirectory-of-repo case.
    """
    import os

    root.mkdir(parents=True, exist_ok=True)
    commit_dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    date_str = commit_dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    env = {
        **os.environ,
        "GIT_AUTHOR_DATE": date_str,
        "GIT_COMMITTER_DATE": date_str,
        "GIT_AUTHOR_NAME": "Test",
        "GIT_AUTHOR_EMAIL": "test@example.com",
        "GIT_COMMITTER_NAME": "Test",
        "GIT_COMMITTER_EMAIL": "test@example.com",
    }

    _git(root, "init", "-q", "-b", "main")
    _git(root, "config", "user.email", "test@example.com")
    _git(root, "config", "user.name", "Test")

    target = root / touch
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("seed\n", encoding="utf-8")
    _git(root, "add", ".")
    _git(root, "commit", "-q", "-m", f"seed commit ({days_ago}d ago)", env=env)
    return root


def _commit_in_repo(root: Path, *, days_ago: float, touch: str) -> None:
    """Add a SECOND backdated commit touching *touch* in an existing repo."""
    import os

    commit_dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    date_str = commit_dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    env = {
        **os.environ,
        "GIT_AUTHOR_DATE": date_str,
        "GIT_COMMITTER_DATE": date_str,
        "GIT_AUTHOR_NAME": "Test",
        "GIT_AUTHOR_EMAIL": "test@example.com",
        "GIT_COMMITTER_NAME": "Test",
        "GIT_COMMITTER_EMAIL": "test@example.com",
    }
    target = root / touch
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("changed\n", encoding="utf-8")
    _git(root, "add", ".")
    _git(root, "commit", "-q", "-m", f"follow-up ({days_ago}d ago)", env=env)


# ---------------------------------------------------------------------------
# Pure normalization / derivation contract
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("fleet_id", "expected_slug"),
    [
        ("artifact_atlas", "artifact-atlas"),
        ("signal_to_system", "signal-to-system"),
        ("research-foundry", "research-foundry"),
        ("Boxbrain-2", "boxbrain-2"),
    ],
)
def test_normalize_slug_underscores_and_case(fleet_id: str, expected_slug: str) -> None:
    slug = seed.normalize_slug(fleet_id)
    assert slug == expected_slug
    assert seed.is_valid_slug(slug)


@pytest.mark.parametrize(
    "bad_id",
    [
        "Bad App!",
        "app.with.dots",
        "café-app",
        "has space",
        "",
        "under_score!",
        # Whitespace is NOT trimmed — it is a pattern violation like any other.
        "  intenttree  ",
        "intenttree ",
        "\tintenttree",
    ],
)
def test_unnormalizable_ids_fail_the_openapi_slug_pattern(bad_id: str) -> None:
    assert not seed.is_valid_slug(seed.normalize_slug(bad_id))


def test_normalize_slug_applies_exactly_two_transforms_and_never_strips() -> None:
    """The "normalized, never sanitized" invariant, asserted literally.

    Only lowercase and ``_`` -> ``-`` are applied. Whitespace survives, so a
    whitespace-bearing fleet id fails the slug pattern and gets REPORTED rather
    than silently repaired into a passing slug (which would hide an upstream
    data typo in the fleet registry).
    """
    assert seed.normalize_slug("  Intent_Tree  ") == "  intent-tree  "
    assert not seed.is_valid_slug(seed.normalize_slug("  Intent_Tree  "))

    # Equivalent to composing exactly the two documented transforms, for any
    # input — no third transform hides in there.
    for raw in ["  intenttree  ", "Boxbrain-2", "signal_to_system", "A B_c "]:
        assert seed.normalize_slug(raw) == raw.lower().replace("_", "-")


def test_whitespace_fleet_id_is_reported_invalid_not_normalized(
    tmp_path: Path,
    tmp_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """End-to-end twin of the unit test: whitespace surfaces as INVALID.

    A stray-whitespace id in the fleet registry is an upstream typo. It must be
    reported (and tripped by --strict), never trimmed into a row.
    """
    fleet = _fleet_yaml(
        tmp_path / "whitespace",
        [
            {"id": "  intenttree  ", "name": "IntentTree", "purpose": "padded id"},
            {"id": "good-app", "name": "Good App", "purpose": "fine"},
        ],
    )

    rc = _run(fleet, tmp_registry, "--apply")
    out = capsys.readouterr().out

    assert rc == 0, "a padded id is reported, not fatal"
    assert "INVALID" in out
    assert "^[a-z0-9-]+$" in out

    slugs = {r["slug"] for r in _read_rows(tmp_registry)}
    assert "good-app" in slugs
    # The padded id was NOT silently repaired into a passing slug.
    assert "intenttree" not in slugs
    assert not any(s != s.strip() for s in slugs)

    # ...and it is a --strict-visible problem, like every other pattern violation.
    assert _run(fleet, tmp_registry, "--strict") == 2


def test_blank_fleet_id_still_reports_as_a_missing_id(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """Dropping .strip() must not lose the missing-id branch.

    A whitespace-ONLY id has no id to report, so it keeps the clearer
    "no 'id' field" reason rather than a slug-pattern complaint.
    """
    fleet = _fleet_yaml(tmp_path / "blank", [{"id": "   ", "name": "Blank"}])

    assert _run(fleet, tmp_registry, "--json") == 0
    payload = json.loads(capsys.readouterr().out)

    assert payload["summary"]["invalid"] == 1
    assert payload["candidates"][0]["fleet_id"] == "<missing id>"
    assert "no 'id' field" in payload["candidates"][0]["reason"]


def test_derived_id_matches_the_hand_authored_convention() -> None:
    # The registry's one hand-authored row is proj_artifact_atlas / artifact-atlas.
    assert seed.derive_project_id("artifact-atlas") == "proj_artifact_atlas"
    assert seed.derive_project_id("signal-to-system") == "proj_signal_to_system"


# ---------------------------------------------------------------------------
# Dry run is the default and writes nothing
# ---------------------------------------------------------------------------


def test_dry_run_is_default_and_writes_nothing(
    tmp_registry: Path,
    fleet_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    before = _projects_file(tmp_registry).read_bytes()

    rc = _run(fleet_registry, tmp_registry)

    assert rc == 0
    assert _projects_file(tmp_registry).read_bytes() == before
    out = capsys.readouterr().out
    assert "DRY RUN (no writes)" in out
    assert "nothing written" in out


def test_dry_run_reports_every_required_field_per_candidate(
    tmp_registry: Path,
    fleet_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    rc = _run(fleet_registry, tmp_registry)
    out = capsys.readouterr().out

    assert rc == 0
    # Derived id, slug, name, workspace_id, root node id, and the action verb.
    assert "id=proj_signal_to_system" in out
    assert "slug=signal-to-system" in out
    assert "name=Signal to System" in out
    assert "workspace_id=ws_test" in out
    assert "root_intenttree_node_id=null" in out
    assert "CREATE" in out
    # Atlas itself is already present -> SKIP, not CREATE.
    skip_line = next(ln for ln in out.splitlines() if "artifact-atlas" in ln)
    assert skip_line.strip().startswith("SKIP")


def test_dry_run_json_plan_is_machine_readable(
    tmp_registry: Path,
    fleet_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    rc = _run(fleet_registry, tmp_registry, "--json")
    payload = json.loads(capsys.readouterr().out)

    assert rc == 0
    assert payload["mode"] == "dry_run"
    assert payload["workspace_id"] == "ws_test"
    assert payload["summary"] == {
        "total": 3,
        "create": 2,
        "skip": 1,
        "invalid": 0,
        "conflict": 0,
        "stale": 0,
        "unresolved": 0,
        "created": [],
    }
    by_slug = {c["slug"]: c for c in payload["candidates"]}
    assert by_slug["signal-to-system"]["id"] == "proj_signal_to_system"
    assert by_slug["artifact-atlas"]["action"] == "skip"


# ---------------------------------------------------------------------------
# Apply
# ---------------------------------------------------------------------------


def test_apply_creates_rows_through_the_service_layer(
    tmp_registry: Path, fleet_registry: Path
) -> None:
    rc = _run(fleet_registry, tmp_registry, "--apply")
    assert rc == 0

    repo = ProjectRepository(tmp_registry)
    created = repo.get_by_slug("signal-to-system")
    assert created is not None
    assert created.id == "proj_signal_to_system"
    assert created.name == "Signal to System"
    assert created.workspace_id == "ws_test"
    assert created.status.value == "active"
    assert created.description == "Turns after-action signal into durable system change"
    assert seed.FLEET_TAG in created.tags
    assert "layer:l6" in created.tags
    # Repository stamps timestamps — proof the write went through the layer,
    # not a hand-appended JSONL line.
    assert created.created_at is not None
    assert created.updated_at is not None

    assert repo.get_by_slug("research-foundry") is not None
    # The pre-existing Atlas row is untouched (still the hand-authored id).
    atlas = repo.get_by_slug("artifact-atlas")
    assert atlas is not None and atlas.id == "proj_artifact_atlas"


def test_apply_is_idempotent_on_slug(
    tmp_registry: Path, fleet_registry: Path
) -> None:
    assert _run(fleet_registry, tmp_registry, "--apply") == 0
    after_first = _read_rows(tmp_registry)

    assert _run(fleet_registry, tmp_registry, "--apply") == 0
    after_second = _read_rows(tmp_registry)

    assert after_second == after_first, "re-apply must not create duplicate rows"

    slugs = [r["slug"] for r in after_second]
    ids = [r["id"] for r in after_second]
    assert len(slugs) == len(set(slugs))
    assert len(ids) == len(set(ids))


def test_reapply_reports_everything_as_skip(
    tmp_registry: Path,
    fleet_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert _run(fleet_registry, tmp_registry, "--apply") == 0
    capsys.readouterr()

    assert _run(fleet_registry, tmp_registry, "--json") == 0
    payload = json.loads(capsys.readouterr().out)

    assert payload["summary"]["create"] == 0
    assert payload["summary"]["skip"] == 3


def test_underscore_fleet_id_lands_as_hyphenated_slug(
    tmp_registry: Path, fleet_registry: Path
) -> None:
    assert _run(fleet_registry, tmp_registry, "--apply") == 0

    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    assert "signal_to_system" not in rows
    assert rows["signal-to-system"]["id"] == "proj_signal_to_system"
    for row in rows.values():
        assert seed.is_valid_slug(row["slug"]), row


# ---------------------------------------------------------------------------
# Invalid slugs are skipped AND reported
# ---------------------------------------------------------------------------


def test_invalid_slug_is_skipped_and_reported(
    tmp_path: Path,
    tmp_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    fleet = _fleet_yaml(
        tmp_path / "invalid",
        [
            {"id": "Bad App!", "name": "Bad App", "purpose": "unnormalizable id"},
            {"id": "good-app", "name": "Good App", "purpose": "fine"},
        ],
    )

    rc = _run(fleet, tmp_registry, "--apply")
    out = capsys.readouterr().out

    assert rc == 0, "an unnormalizable id is reported, not fatal"
    assert "INVALID" in out
    assert "Bad App!" in out
    assert "^[a-z0-9-]+$" in out

    slugs = {r["slug"] for r in _read_rows(tmp_registry)}
    assert "good-app" in slugs
    assert not any("Bad App" in s or "!" in s for s in slugs)
    for slug in slugs:
        assert seed.is_valid_slug(slug), slug


def test_strict_exits_two_when_a_candidate_is_invalid(
    tmp_path: Path, tmp_registry: Path
) -> None:
    target = tmp_path / "strict"
    target.mkdir()
    fleet = _fleet_yaml(target, [{"id": "app.with.dots", "name": "Dotted"}])

    assert _run(fleet, tmp_registry, "--strict") == 2
    assert _run(fleet, tmp_registry) == 0


def test_duplicate_fleet_slugs_conflict_instead_of_duplicating(
    tmp_path: Path, tmp_registry: Path
) -> None:
    target = tmp_path / "dupes"
    target.mkdir()
    fleet = _fleet_yaml(
        target,
        [
            {"id": "twin_app", "name": "Twin A"},
            {"id": "twin-app", "name": "Twin B"},
        ],
    )

    assert _run(fleet, tmp_registry, "--apply") == 0
    rows = [r for r in _read_rows(tmp_registry) if r["slug"] == "twin-app"]
    assert len(rows) == 1
    assert rows[0]["name"] == "Twin A"


# ---------------------------------------------------------------------------
# Derived-id conflict guard (must see TOMBSTONES)
# ---------------------------------------------------------------------------


def _seed_then_tombstone(registry: Path, project_id: str, slug: str) -> None:
    """Write a project row through the repo, then soft-delete it.

    Leaves a real ``_deleted: true`` line in projects.jsonl — the row is
    invisible to ``ProjectService.list_projects()`` but its id is still
    physically present in the file.
    """
    repo = ProjectRepository(registry)
    repo.create(project_id, ProjectCreate(name=slug.title(), slug=slug))
    assert repo.delete(project_id) is True


def test_tombstoned_row_conflicts_instead_of_duplicating_its_id(
    tmp_path: Path,
    tmp_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """A soft-deleted proj_foo/foo must block a fleet app that would reuse it.

    Regression pin for the guards being read through
    ``ProjectService.list_projects()`` (``include_deleted=False``), which hides
    tombstones. Under that read the fleet app planned as CREATE and appended a
    SECOND row carrying id ``proj_foo`` *and* slug ``foo``;
    ``jsonl.update_record`` resolves ids by first match, so the new row would
    have been permanently unupdatable.

    Here the tombstone collides on both axes, and the slug guard reports first
    (it names the blocking row and a remediation the codebase actually offers).
    The id guard's own tombstone-awareness is pinned separately by
    :func:`test_tombstoned_derived_id_under_a_different_slug_still_conflicts`.
    """
    _seed_then_tombstone(tmp_registry, "proj_foo", "foo")

    # Precondition: the service-layer read genuinely cannot see the tombstone.
    live = ProjectService(tmp_registry).list_projects()
    assert all(p.id != "proj_foo" for p in live)
    assert all(p.slug != "foo" for p in live)

    fleet = _fleet_yaml(
        tmp_path / "tombstone", [{"id": "foo", "name": "Foo", "purpose": "revived"}]
    )

    rc = _run(fleet, tmp_registry, "--apply")
    out = capsys.readouterr().out

    # The conflict is REPORTED...
    assert rc == 0
    assert "CONFLICT" in out
    assert "proj_foo" in out
    conflict_line = next(ln for ln in out.splitlines() if "CONFLICT" in ln)
    assert "soft-deleted row" in conflict_line

    # ...and NO duplicate row was appended.
    rows = _read_rows(tmp_registry)
    assert [r["id"] for r in rows].count("proj_foo") == 1
    assert [r["slug"] for r in rows].count("foo") == 1
    assert len({r["id"] for r in rows}) == len(rows), "no duplicate ids in the file"
    # The surviving proj_foo line is still the tombstone, untouched.
    foo_row = next(r for r in rows if r["id"] == "proj_foo")
    assert foo_row["_deleted"] is True

    # It is a --strict-visible problem, not a silent skip.
    capsys.readouterr()
    assert _run(fleet, tmp_registry, "--strict") == 2


def test_tombstoned_conflict_is_reported_in_the_json_plan(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """The machine-readable plan carries the conflict too (for orchestrators)."""
    _seed_then_tombstone(tmp_registry, "proj_foo", "foo")
    fleet = _fleet_yaml(tmp_path / "tombstone-json", [{"id": "foo", "name": "Foo"}])

    assert _run(fleet, tmp_registry, "--json") == 0
    payload = json.loads(capsys.readouterr().out)

    assert payload["summary"]["conflict"] == 1
    assert payload["summary"]["create"] == 0
    assert payload["summary"]["created"] == []
    cand = payload["candidates"][0]
    assert cand["action"] == "conflict"
    assert cand["id"] == "proj_foo"
    assert "proj_foo" in cand["reason"]


def test_tombstoned_slug_with_a_non_derived_id_conflicts_instead_of_duplicating(
    tmp_path: Path,
    tmp_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """The case the id guard CANNOT catch: tombstoned slug, unrelated id.

    Existing rows are under no obligation to carry the derived id form. A
    tombstoned row with id ``proj_legacy_id`` holding slug ``foo`` leaves
    ``proj_foo`` free, so the derived-id guard passes; and ``get_by_slug``
    filters deleted rows, so the slug reads free too. Before the slug guard
    became tombstone-aware this planned CREATE, exited 0 reporting ``conflict:
    0``, and left slug ``foo`` in projects.jsonl TWICE.
    """
    repo = ProjectRepository(tmp_registry)
    repo.create("proj_legacy_id", ProjectCreate(name="Foo", slug="foo"))
    assert repo.delete("proj_legacy_id") is True

    # Preconditions that make this distinct from the derived-id tombstone case:
    # the slug reads free, AND the derived id is genuinely unused.
    assert repo.get_by_slug("foo") is None
    assert all(p.id != "proj_foo" for p in repo.list(include_deleted=True))

    fleet = _fleet_yaml(
        tmp_path / "tombstoned-slug",
        [{"id": "foo", "name": "Foo", "purpose": "would duplicate the slug"}],
    )

    rc = _run(fleet, tmp_registry, "--apply")
    out = capsys.readouterr().out

    # Reported as a CONFLICT naming the row that actually blocks it...
    assert rc == 0
    conflict_line = next(ln for ln in out.splitlines() if "CONFLICT" in ln)
    assert "proj_legacy_id" in conflict_line
    assert "soft-deleted row" in conflict_line
    # ...with remediation the codebase actually offers (no hard-delete surface).
    assert "projects.jsonl" in conflict_line

    # ...and NOTHING was written: no duplicate slug, no new row at all.
    rows = _read_rows(tmp_registry)
    assert [r["slug"] for r in rows].count("foo") == 1, "the duplicate-slug hole"
    assert [r["id"] for r in rows].count("proj_foo") == 0
    assert len({r["slug"] for r in rows}) == len(rows), "no duplicate slugs in the file"
    foo_row = next(r for r in rows if r["slug"] == "foo")
    assert foo_row["id"] == "proj_legacy_id"
    assert foo_row["_deleted"] is True

    # The machine-readable plan counts it too (an orchestrator must see it).
    capsys.readouterr()
    assert _run(fleet, tmp_registry, "--json") == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["summary"]["conflict"] == 1
    assert payload["summary"]["create"] == 0
    assert payload["candidates"][0]["action"] == "conflict"

    # ...and it trips --strict rather than exiting clean.
    capsys.readouterr()
    assert _run(fleet, tmp_registry, "--strict") == 2


def test_tombstoned_derived_id_under_a_different_slug_still_conflicts(
    tmp_path: Path, tmp_registry: Path
) -> None:
    """The id guard's tombstone-awareness stays load-bearing on its own.

    Mirror image of the test above: the tombstone holds the DERIVED id
    (``proj_foo``) under an unrelated slug, so the slug guard sees nothing and
    only the tombstone-inclusive id read can refuse the candidate. Without it, a
    second row would take id ``proj_foo`` and be shadowed forever by
    ``jsonl.update_record``'s first-id-match resolution.
    """
    repo = ProjectRepository(tmp_registry)
    repo.create("proj_foo", ProjectCreate(name="Legacy", slug="legacy-name"))
    assert repo.delete("proj_foo") is True

    # The slug guard cannot see this one: slug 'foo' is untouched, live or dead.
    assert all(p.slug != "foo" for p in repo.list(include_deleted=True))

    fleet = _fleet_yaml(tmp_path / "tombstoned-id", [{"id": "foo", "name": "Foo"}])

    assert _run(fleet, tmp_registry, "--apply") == 0

    rows = _read_rows(tmp_registry)
    assert [r["id"] for r in rows].count("proj_foo") == 1
    assert "foo" not in {r["slug"] for r in rows}
    assert next(r for r in rows if r["id"] == "proj_foo")["_deleted"] is True


def test_derived_id_taken_by_a_live_row_with_a_different_slug_conflicts(
    tmp_path: Path, tmp_registry: Path
) -> None:
    """The other path into the same guard: id taken, slug free.

    A hand-authored row can hold ``proj_foo`` under an unrelated slug. The
    derived id is then unavailable even though the slug is, so the candidate
    conflicts rather than appending a duplicate id.
    """
    repo = ProjectRepository(tmp_registry)
    repo.create("proj_foo", ProjectCreate(name="Legacy", slug="legacy-name"))

    fleet = _fleet_yaml(tmp_path / "id-taken", [{"id": "foo", "name": "Foo"}])

    assert _run(fleet, tmp_registry, "--apply") == 0

    rows = _read_rows(tmp_registry)
    assert [r["id"] for r in rows].count("proj_foo") == 1
    assert next(r for r in rows if r["id"] == "proj_foo")["slug"] == "legacy-name"
    assert "foo" not in {r["slug"] for r in rows}


def test_live_slug_still_skips_rather_than_conflicting(
    tmp_registry: Path, fleet_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """Tombstone-awareness must not turn ordinary idempotency into a conflict.

    A LIVE matching row is the normal re-seed case and stays SKIP (exit 0, and
    clean under --strict).
    """
    assert _run(fleet_registry, tmp_registry, "--json") == 0
    payload = json.loads(capsys.readouterr().out)

    by_slug = {c["slug"]: c for c in payload["candidates"]}
    assert by_slug["artifact-atlas"]["action"] == "skip"
    assert payload["summary"]["conflict"] == 0
    assert _run(fleet_registry, tmp_registry, "--strict") == 0


# ---------------------------------------------------------------------------
# root_intenttree_node_id: null unless an explicit node map is supplied
# ---------------------------------------------------------------------------


def test_tree_map_absent_leaves_root_intenttree_node_id_null(
    tmp_registry: Path, fleet_registry: Path
) -> None:
    assert _run(fleet_registry, tmp_registry, "--apply") == 0

    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    assert rows["signal-to-system"]["root_intenttree_node_id"] is None
    assert rows["research-foundry"]["root_intenttree_node_id"] is None


def test_tree_map_present_populates_root_node_id(
    tmp_path: Path, tmp_registry: Path, fleet_registry: Path
) -> None:
    tree_map = tmp_path / "tree-map.json"
    tree_map.write_text(
        json.dumps(
            {
                # Keys are normalized the same way fleet ids are.
                "signal_to_system": "node_01SIGNALROOT",
                "research-foundry": "node_01RFROOT",
            }
        ),
        encoding="utf-8",
    )

    rc = _run(fleet_registry, tmp_registry, "--tree-map", str(tree_map), "--apply")
    assert rc == 0

    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    assert rows["signal-to-system"]["root_intenttree_node_id"] == "node_01SIGNALROOT"
    assert rows["research-foundry"]["root_intenttree_node_id"] == "node_01RFROOT"


def test_missing_tree_map_file_is_a_clean_error(
    tmp_path: Path,
    tmp_registry: Path,
    fleet_registry: Path,
    capsys: pytest.CaptureFixture[str],
) -> None:
    before = _projects_file(tmp_registry).read_bytes()

    rc = _run(
        fleet_registry, tmp_registry, "--tree-map", str(tmp_path / "nope.json"), "--apply"
    )

    assert rc == 1
    assert "--tree-map file not found" in capsys.readouterr().err
    assert _projects_file(tmp_registry).read_bytes() == before


# ---------------------------------------------------------------------------
# Source-file handling and write guard
# ---------------------------------------------------------------------------


def test_missing_fleet_registry_is_a_clean_error(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    rc = _run(tmp_path / "absent.yaml", tmp_registry, "--apply")

    assert rc == 1
    err = capsys.readouterr().err
    assert "Fleet registry not found" in err
    assert "--registry" in err


def test_apply_refuses_the_canonical_registry_without_the_explicit_flag(
    tmp_path: Path,
    tmp_registry: Path,
    fleet_registry: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    """The guard is exercised against a FAKE repo root, never the real registry."""
    fake_root = tmp_path / "fake-repo"
    (fake_root / "registry").mkdir(parents=True)
    monkeypatch.setattr(seed, "_REPO_ROOT", fake_root)

    rc = seed.main(
        [
            "--registry",
            str(fleet_registry),
            "--registry-dir",
            str(fake_root / "registry"),
            "--apply",
        ]
    )

    assert rc == 1
    assert "refusing to --apply" in capsys.readouterr().err
    assert not (fake_root / "registry" / "projects.jsonl").exists()

    # ...and it goes through with the explicit acknowledgement.
    rc = seed.main(
        [
            "--registry",
            str(fleet_registry),
            "--registry-dir",
            str(fake_root / "registry"),
            "--apply",
            "--allow-real-registry",
        ]
    )
    assert rc == 0
    assert (fake_root / "registry" / "projects.jsonl").exists()


def test_workspace_id_defaults_to_settings_and_is_overridable(
    tmp_path: Path, tmp_registry: Path, fleet_registry: Path
) -> None:
    assert _run(fleet_registry, tmp_registry, "--apply") == 0
    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    # tmp_registry's patched settings carry workspace_id == "ws_test".
    assert rows["signal-to-system"]["workspace_id"] == "ws_test"

    # A later seed can stamp a different workspace without editing the script
    # (the ws_artifact_atlas_local -> ws_aos rename is a follow-up).
    other = _fleet_yaml(tmp_path / "ws-override", [{"id": "late_app", "name": "Late"}])
    assert _run(other, tmp_registry, "--workspace-id", "ws_aos", "--apply") == 0

    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    assert rows["late-app"]["workspace_id"] == "ws_aos"
    # Pre-existing rows are untouched by the override.
    assert rows["signal-to-system"]["workspace_id"] == "ws_test"


def test_workspace_id_is_declared_and_survives_the_seed_round_trip(
    tmp_registry: Path, fleet_registry: Path
) -> None:
    """``workspace_id`` is now a declared field, and still lands on every row.

    node_01KZRMMDB3YKT7T4FJTVVRMKG0: ``workspace_id`` used to reach the JSONL row
    only via ``ConfigDict(extra="allow")`` + ``ProjectRepository.create``'s
    ``model_dump()`` spread — an undeclared field that would have vanished
    silently from every seeded row if the repository ever narrowed its spread to
    declared fields. It is now declared on ``ProjectCreate``, so it survives that
    change; this test pins both the declaration and the seed round trip.
    """
    # It is a first-class declared field now, not an extras pass-through.
    assert "workspace_id" in ProjectCreate.model_fields

    assert _run(fleet_registry, tmp_registry, "--apply") == 0

    # It survives the model -> repository -> JSONL round trip...
    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    assert rows["signal-to-system"]["workspace_id"] == "ws_test"
    # ...and reads back through the Project model, which also declares it.
    created = ProjectRepository(tmp_registry).get_by_slug("signal-to-system")
    assert created is not None and created.workspace_id == "ws_test"


def test_fleet_status_is_not_mapped_onto_project_status(
    tmp_registry: Path, fleet_registry: Path
) -> None:
    """Fleet 'status' is layer maturity, not lifecycle — never mistranslated."""
    assert _run(fleet_registry, tmp_registry, "--apply") == 0

    rows = {r["slug"]: r for r in _read_rows(tmp_registry)}
    # research-foundry is status: strong upstream; it must land as `active`.
    assert rows["research-foundry"]["status"] == "active"
    assert rows["signal-to-system"]["status"] == "active"


def test_real_fleet_registry_plans_cleanly_when_present(tmp_registry: Path) -> None:
    """Smoke test against the actual launchpad registry, if it is checked out.

    Dry run only — asserts the real 42-app file yields valid slugs and no
    unexpected fatal, and writes nothing.
    """
    fleet = seed.default_fleet_registry_path()
    if fleet is None or not fleet.is_file():
        pytest.skip("sibling agentic_meta_dev checkout not available")

    before = _projects_file(tmp_registry).read_bytes()
    entries = seed.load_fleet_apps(fleet)
    candidates = seed.plan_candidates(
        entries,
        existing_slugs={"artifact-atlas"},
        existing_ids={"proj_artifact_atlas"},
        workspace_id="ws_test",
    )

    assert len(candidates) == len(entries)
    assert _projects_file(tmp_registry).read_bytes() == before
    for cand in candidates:
        if cand.action in (seed.ACTION_CREATE, seed.ACTION_SKIP):
            assert seed.is_valid_slug(cand.slug or "")
            assert cand.project_id == seed.derive_project_id(cand.slug or "")
            assert cand.root_intenttree_node_id is None
    by_slug = {c.slug: c for c in candidates}
    assert by_slug["artifact-atlas"].action == seed.ACTION_SKIP
    assert by_slug["signal-to-system"].action == seed.ACTION_CREATE


# ---------------------------------------------------------------------------
# Commit-recency filter (--active-since / --include-unresolved-recency)
# ---------------------------------------------------------------------------


def test_active_since_default_disables_the_filter_entirely(
    tmp_registry: Path, fleet_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """Omitting --active-since must reproduce the pre-filter plan exactly.

    No candidate carries recency fields (all null), and the stale/unresolved
    summary counts are always present but zero — the create/skip outcomes are
    untouched by the filter's existence.
    """
    assert _run(fleet_registry, tmp_registry, "--json") == 0
    payload = json.loads(capsys.readouterr().out)

    assert payload["summary"]["stale"] == 0
    assert payload["summary"]["unresolved"] == 0
    assert payload["summary"]["create"] == 2
    assert payload["summary"]["skip"] == 1
    for cand in payload["candidates"]:
        assert cand["recency_state"] is None
        assert cand["recency_days"] is None
        assert cand["recency_source"] is None


def test_active_since_fresh_repo_creates_and_records_recency(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A repo committed to yesterday clears a 7-day window -> CREATE.

    recency_* is populated on the CREATE too (auditability, not just on
    exclusions).
    """
    repo = _make_git_repo(tmp_path / "fresh-repo", days_ago=1)
    fleet = _fleet_yaml(
        tmp_path / "fresh",
        [{"id": "fresh-app", "name": "Fresh App", "path": str(repo)}],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)
    assert rc == 0

    cand = payload["candidates"][0]
    assert cand["action"] == "create"
    assert cand["recency_state"] == "fresh"
    assert cand["recency_days"] is not None and cand["recency_days"] < 2
    assert Path(cand["recency_source"]).resolve() == repo.resolve()

    assert _run(fleet, tmp_registry, "--active-since", "7", "--apply") == 0
    assert ProjectRepository(tmp_registry).get_by_slug("fresh-app") is not None


def test_active_since_stale_repo_is_excluded_and_does_not_trip_strict(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A repo last committed 100 days ago fails a 7-day window -> STALE.

    STALE is excluded (nothing written on --apply) but is NOT a --strict
    problem — that flag's contract stays invalid/conflict only.
    """
    repo = _make_git_repo(tmp_path / "stale-repo", days_ago=100)
    fleet = _fleet_yaml(
        tmp_path / "stale",
        [{"id": "stale-app", "name": "Stale App", "path": str(repo)}],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7")
    out = capsys.readouterr().out
    assert rc == 0
    assert "STALE" in out

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)
    assert rc == 0
    assert payload["summary"]["stale"] == 1
    assert payload["summary"]["create"] == 0
    cand = payload["candidates"][0]
    assert cand["action"] == "stale"
    assert cand["recency_state"] == "stale"
    assert cand["recency_days"] is not None and cand["recency_days"] > 7
    assert cand["reason"] is not None and "older than" in cand["reason"]

    assert _run(fleet, tmp_registry, "--active-since", "7", "--apply") == 0
    assert ProjectRepository(tmp_registry).get_by_slug("stale-app") is None

    # Not a --strict-visible problem.
    assert _run(fleet, tmp_registry, "--active-since", "7", "--strict") == 0


def test_active_since_unresolved_recency_is_excluded_and_distinct_from_stale(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A path that does not exist locally cannot be measured -> UNRESOLVED.

    UNRESOLVED must be a SEPARATE outcome from STALE: "we could not measure
    this repo" is not the same fact as "this repo is inactive," and folding
    the two together would silently drop repos that are actually fine.
    """
    missing_path = tmp_path / "does-not-exist"
    fleet = _fleet_yaml(
        tmp_path / "unresolved",
        [{"id": "ghost-app", "name": "Ghost App", "path": str(missing_path)}],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7")
    out = capsys.readouterr().out
    assert rc == 0
    assert "UNRESOLVED" in out

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)
    assert rc == 0
    assert payload["summary"]["unresolved"] == 1
    assert payload["summary"]["stale"] == 0
    assert payload["summary"]["create"] == 0
    cand = payload["candidates"][0]
    assert cand["action"] == "unresolved"
    assert cand["recency_state"] == "unresolved"
    assert cand["recency_days"] is None
    assert cand["recency_source"] is None
    assert "does not exist locally" in cand["reason"]

    assert _run(fleet, tmp_registry, "--active-since", "7", "--apply") == 0
    assert ProjectRepository(tmp_registry).get_by_slug("ghost-app") is None

    # Not a --strict-visible problem either.
    assert _run(fleet, tmp_registry, "--active-since", "7", "--strict") == 0


def test_active_since_missing_path_field_is_unresolved(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """No 'path' field at all is the same unresolved bucket, distinctly reasoned."""
    fleet = _fleet_yaml(tmp_path / "nopath", [{"id": "no-path-app", "name": "No Path"}])

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)

    assert rc == 0
    cand = payload["candidates"][0]
    assert cand["action"] == "unresolved"
    assert "no 'path'" in cand["reason"]


def test_active_since_path_not_a_git_repo_is_unresolved(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A path that exists but is not a git checkout is unresolved, not stale."""
    plain_dir = tmp_path / "not-a-repo"
    plain_dir.mkdir()
    fleet = _fleet_yaml(
        tmp_path / "notrepo",
        [{"id": "plain-dir", "name": "Plain Dir", "path": str(plain_dir)}],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)

    assert rc == 0
    cand = payload["candidates"][0]
    assert cand["action"] == "unresolved"
    assert "not inside a git repository" in cand["reason"]


def test_include_unresolved_recency_flips_unresolved_to_create(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """--include-unresolved-recency lets an unmeasurable candidate through.

    Also pins that the flag has NO EFFECT unless --active-since is set (the
    recency gate never runs at all in that case).
    """
    missing_path = tmp_path / "still-missing"
    fleet = _fleet_yaml(
        tmp_path / "include-unresolved",
        [{"id": "ghost-app", "name": "Ghost App", "path": str(missing_path)}],
    )

    rc = _run(
        fleet,
        tmp_registry,
        "--active-since",
        "7",
        "--include-unresolved-recency",
        "--apply",
    )
    assert rc == 0
    created = ProjectRepository(tmp_registry).get_by_slug("ghost-app")
    assert created is not None
    capsys.readouterr()  # drain the apply plan before the next --json run

    # Without --active-since, the flag is a no-op: the gate never runs.
    other_fleet = _fleet_yaml(
        tmp_path / "no-active-since",
        [{"id": "ghost-app-2", "name": "Ghost App 2", "path": str(missing_path)}],
    )
    assert (
        _run(other_fleet, tmp_registry, "--include-unresolved-recency", "--json") == 0
    )
    payload = json.loads(capsys.readouterr().out)
    cand = payload["candidates"][0]
    assert cand["action"] == "create"
    assert cand["recency_state"] is None


def test_active_since_measures_subdirectory_commits_not_repo_head(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """The real hermes-inside-agentic_meta_dev case: fleet path is a SUBDIRECTORY.

    The repo root's own last commit is old; a later commit touches only the
    subdirectory. Recency must come from the commit that actually touches
    that subtree (measured at the repo TOPLEVEL with `git log -- <relpath>`),
    not from the repo's unrelated, older HEAD.
    """
    repo_root = _make_git_repo(tmp_path / "monorepo", days_ago=100, touch="root-file.txt")
    _commit_in_repo(repo_root, days_ago=2, touch="apps/hermes/main.py")
    subdir = repo_root / "apps" / "hermes"

    fleet = _fleet_yaml(
        tmp_path / "subdir",
        [{"id": "hermes", "name": "Hermes", "path": str(subdir)}],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)
    assert rc == 0

    cand = payload["candidates"][0]
    assert cand["action"] == "create"
    assert cand["recency_state"] == "fresh"
    assert cand["recency_days"] is not None and cand["recency_days"] < 7
    # Measured at the repo TOPLEVEL, not the subdirectory itself.
    assert Path(cand["recency_source"]).resolve() == repo_root.resolve()


def test_active_since_subdirectory_with_no_commits_is_unresolved(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A subdirectory that exists but that no commit has ever touched."""
    repo_root = _make_git_repo(tmp_path / "monorepo2", days_ago=1, touch="root-file.txt")
    untouched_subdir = repo_root / "apps" / "never-touched"
    untouched_subdir.mkdir(parents=True)

    fleet = _fleet_yaml(
        tmp_path / "subdir-empty",
        [
            {
                "id": "never-touched",
                "name": "Never Touched",
                "path": str(untouched_subdir),
            }
        ],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)

    assert rc == 0
    cand = payload["candidates"][0]
    assert cand["action"] == "unresolved"
    assert "no commits touch" in cand["reason"]


def test_stale_candidate_does_not_reserve_slug_for_a_later_fresh_entry(
    tmp_path: Path, tmp_registry: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    """A STALE (or UNRESOLVED) exclusion must not block a later colliding slug.

    Two fleet entries normalize to the same slug (twin_app / twin-app). The
    FIRST is stale and gets excluded before it would reserve anything; the
    recency gate runs immediately before the slug/id reservation for exactly
    this reason. The SECOND must still plan as an ordinary CREATE — not a
    false CONFLICT against a row that was never going to be written.
    """
    stale_repo = _make_git_repo(tmp_path / "twin-stale", days_ago=100)
    fresh_repo = _make_git_repo(tmp_path / "twin-fresh", days_ago=1)

    fleet = _fleet_yaml(
        tmp_path / "twins",
        [
            {"id": "twin_app", "name": "Twin Stale", "path": str(stale_repo)},
            {"id": "twin-app", "name": "Twin Fresh", "path": str(fresh_repo)},
        ],
    )

    rc = _run(fleet, tmp_registry, "--active-since", "7", "--json")
    payload = json.loads(capsys.readouterr().out)
    assert rc == 0
    assert payload["summary"]["stale"] == 1
    assert payload["summary"]["create"] == 1
    assert payload["summary"]["conflict"] == 0

    by_fleet_id = {c["fleet_id"]: c for c in payload["candidates"]}
    assert by_fleet_id["twin_app"]["action"] == "stale"
    assert by_fleet_id["twin-app"]["action"] == "create"
    assert by_fleet_id["twin-app"]["slug"] == "twin-app"

    assert _run(fleet, tmp_registry, "--active-since", "7", "--apply") == 0
    created = ProjectRepository(tmp_registry).get_by_slug("twin-app")
    assert created is not None
    assert created.name == "Twin Fresh"


def test_active_since_stale_and_unresolved_together_never_trip_strict(
    tmp_path: Path, tmp_registry: Path
) -> None:
    """Combined smoke test: a stale repo AND an unresolvable path, one run."""
    stale_repo = _make_git_repo(tmp_path / "strict-stale", days_ago=50)
    fleet = _fleet_yaml(
        tmp_path / "strict-recency",
        [
            {"id": "stale-one", "name": "Stale One", "path": str(stale_repo)},
            {
                "id": "ghost-two",
                "name": "Ghost Two",
                "path": str(tmp_path / "missing-for-strict"),
            },
        ],
    )

    assert _run(fleet, tmp_registry, "--active-since", "7", "--strict") == 0
