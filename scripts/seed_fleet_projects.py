#!/usr/bin/env python3
"""PF-4 — Seed Atlas project rows from the AOS fleet app registry.

Atlas ships exactly ONE project row (``proj_artifact_atlas``). Every other AOS
fleet repo has none, so a workspace-scoped "all reports for all projects" lens
cannot resolve — there is nothing to attribute a report to. This script seeds
one Atlas ``Project`` per app declared in the launchpad's machine-readable app
registry (``agentic_meta_dev/docs/05-app-registry.yaml``).

Design invariants
-----------------
* **Dry-run is the DEFAULT.** Nothing is written unless ``--apply`` is passed.
* **Writes go through the service/repository layer** (``ProjectService`` ->
  ``ProjectRepository`` -> atomic JSONL helpers). No hand-appended JSONL text,
  no running server required.
* **Idempotent on slug.** A candidate whose slug already exists in the registry
  is SKIPPED, so re-running ``--apply`` never creates duplicates.
* **Deterministic ids.** ``proj_<slug with hyphens as underscores>`` — this
  reproduces the existing hand-authored ``proj_artifact_atlas`` exactly, so a
  re-seed against a fresh registry lands the same ids the current registry has.
* **Slugs are normalized, never sanitized.** Fleet ids use underscores for some
  repos (``artifact_atlas``, ``signal_to_system``) while Atlas slugs are
  hyphenated. Exactly two transforms are applied — lowercase and ``_`` -> ``-``
  — and nothing is stripped, trimmed, or dropped. Anything that still fails the
  OpenAPI slug contract (``^[a-z0-9-]+$``, shared/openapi.yaml) is SKIPPED AND
  REPORTED rather than silently mangled into a passing slug. That deliberately
  includes stray whitespace: a fleet id of ``" intenttree "`` reports as
  INVALID like any other pattern violation, surfacing the upstream data typo
  instead of quietly repairing it.
* **Uniqueness is computed over TOMBSTONES too — for ids AND for slugs.**
  Soft-deleted rows (``_deleted: true``) keep their JSONL line, their id, *and*
  their slug. Both constraints therefore read with ``include_deleted=True``:

  - ``jsonl.update_record`` / ``tombstone_record`` scan raw lines and act on the
    FIRST id match, so appending a second row reusing a tombstoned id silently
    shadows every later update to the new row.
  - ``ProjectRepository.get_by_slug`` filters deleted rows, so a tombstoned slug
    reads as free and nothing below this script would reject a second row
    carrying it — the file would simply hold that slug twice.

  Slugs are tracked in TWO buckets so the two legitimate outcomes stay distinct:
  a slug with a LIVE row is ordinary idempotency and SKIPs; a slug held only by
  a tombstone is a reported CONFLICT (not a silent SKIP, and not a duplicate).
  See :func:`_existing_slugs_and_ids`.
* **Commit recency is a filter, off by default, that reports two DISTINCT
  exclusions rather than one.** ``--active-since DAYS`` excludes a fleet app
  whose last commit (from its ``path`` field) is older than the window
  (``ACTION_STALE``, measured). A repo whose recency simply could not be
  measured — no ``path``, path missing locally, not a git checkout, or no
  commits touch it — is ``ACTION_UNRESOLVED``, a SEPARATE outcome from STALE.
  "We could not measure this repo" is a different fact from "this repo is
  inactive," and collapsing the two would silently drop repos that are
  actually fine but merely unmeasurable from this machine. Neither trips
  ``--strict`` (that flag's contract stays invalid/conflict only) and neither
  reserves a slug or id — see :func:`measure_commit_recency` and the recency
  gate in :func:`plan_candidates`. Omitting ``--active-since`` disables the
  filter entirely: no git subprocess is ever spawned, and the plan is
  byte-identical to before this filter existed.

Known upstream mismatches (deliberately not papered over)
---------------------------------------------------------
* The fleet registry carries **no IntentTree node id**. The only machine-readable
  fleet tree data that exists (``agentic_meta_dev/.claude/reports/aos-atlas/
  _build/collect.py`` ``TREES``) holds **tree** ids, not **root node** ids, and
  ``Project.root_intenttree_node_id`` wants a node id. Writing a tree id there
  would be a type lie, so the field is left ``null`` unless an explicit
  ``--tree-map`` of ``slug -> root NODE id`` is supplied.
* The fleet ``status`` field is layer maturity (``strong|ok|partial|weak``), not
  a project lifecycle, and the registry's own header warns it is hand-edited and
  misleading. It is therefore NOT mapped onto ``ProjectStatus``; every seeded row
  gets ``active`` and the maturity value is dropped rather than mistranslated.

.. note::

   **``workspace_id`` is now a declared field on ``ProjectCreate``.** It used to
   reach the JSONL row only through ``model_config = ConfigDict(extra="allow")``
   plus ``ProjectRepository.create`` spreading ``data.model_dump()`` into the
   record — load-bearing on an *undeclared* field, which left one silent failure
   mode: if ``ProjectRepository.create`` ever narrowed its ``model_dump()``
   spread to declared fields, every seeded row would land with no
   ``workspace_id``, no error raised, and the workspace-scoped reports lens this
   seed exists to feed would stop resolving.

   That durable fix has landed — ``workspace_id`` is declared on both
   ``ProjectCreate`` and ``ProjectUpdate`` (api/app/models/project.py) and is
   present in the OpenAPI ``ProjectCreate``/``ProjectUpdate`` schemas
   (shared/openapi.yaml), so the field now survives a narrowed ``model_dump()``.
   ``api/tests/test_seed_fleet_projects.py`` still asserts the field lands on
   written rows, so a regression fails a test rather than shipping quietly.

Usage
-----
    # dry run (default) — prints the plan, writes nothing, exits 0
    python3 scripts/seed_fleet_projects.py
    python3 scripts/seed_fleet_projects.py --registry /path/to/05-app-registry.yaml

    # machine-readable plan
    python3 scripts/seed_fleet_projects.py --json

    # scope to recently-active repos (see D-020); excluded entries are reported
    python3 scripts/seed_fleet_projects.py --active-since 14

    # write (orchestrator decision; the real registry needs the explicit flag)
    python3 scripts/seed_fleet_projects.py --apply --allow-real-registry

Registry-dir resolution honours ``ATLAS_REGISTRY_DIR`` via ``app.settings``;
``--registry-dir`` overrides both. The fleet source path may also come from
``ATLAS_FLEET_REGISTRY``.

Seeding a deployed instance
---------------------------
``--active-since`` reads each fleet app's git history through its ``path:``, so
it must run **where the fleet repos are checked out**. The agentic node has no
``~/dev`` tree: running the filter there measures absent paths and reports every
candidate UNRESOLVED, seeding nothing.

So split the two steps — filter here, seed there — and let a pruned registry
carry the verdict between them (D-020 §6):

1. Run ``--active-since <N> --json`` locally and prune the fleet YAML down to the
   ``create``/``skip`` ids, keeping a header that records the source, the window,
   and each exclusion with its measured age. The pruned file is then the audit
   record of what was seeded and why.
2. Copy it to the instance and seed that allowlist with the ordinary,
   *unfiltered* seeder — the pruning already is the filter, so the deployed image
   needs no recency support:

       podman cp pruned.yaml <api-container>:/tmp/fleet.yaml
       podman exec -w /app <api-container> python scripts/seed_fleet_projects.py \
           --registry /tmp/fleet.yaml --registry-dir /data/registry --json

   Dry-run first and check ``workspace_id`` in the plan matches the rows already
   in that instance — a mismatch seeds rows the workspace-scoped lens will not
   group with the existing ones.

Back up ``projects.jsonl`` before ``--apply`` against a live instance. There is
**no hard-delete surface** for a project row (service and repository both only
tombstone), and a tombstoned slug still blocks a later re-seed of that slug, so
narrowing a seeded set afterwards means hand-editing the JSONL rather than
running a command. Widening the window later is cheap and idempotent — already
-present rows report SKIP.

Exit codes
----------
    0  — plan produced (dry-run) or apply succeeded
    1  — fleet registry missing / unparseable, or a write guard refused
    2  — ``--strict`` and at least one candidate was invalid or conflicted
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence

# --------------------------------------------------------------------------
# Import path shim: make api/ importable so the service layer can be reused.
# Must run before the `app.*` imports below.
# --------------------------------------------------------------------------

_SCRIPT_PATH = Path(__file__).resolve()
_REPO_ROOT = _SCRIPT_PATH.parent.parent
_API_DIR = _REPO_ROOT / "api"
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))

from app.models.project import ProjectCreate  # noqa: E402
from app.models.vocabulary import ProjectStatus  # noqa: E402
from app.repositories.projects import ProjectRepository  # noqa: E402
from app.services.projects import ProjectService  # noqa: E402
from app.settings import get_settings  # noqa: E402

try:
    import yaml  # type: ignore[import-untyped]
except ImportError:  # pragma: no cover - pyyaml is a declared api dependency
    yaml = None  # type: ignore[assignment]


# --------------------------------------------------------------------------
# Contract constants
# --------------------------------------------------------------------------

#: shared/openapi.yaml:2486-2488 declares this pattern for Project.slug.
SLUG_PATTERN = r"^[a-z0-9-]+$"
SLUG_RE = re.compile(SLUG_PATTERN)

#: Provenance tag applied to every seeded row so a fleet-wide lens can tell
#: seeded fleet projects apart from hand-authored ones.
FLEET_TAG = "aos-fleet"

#: Relative location of the launchpad's machine-readable app registry.
_FLEET_REGISTRY_RELPATH = Path("agentic_meta_dev") / "docs" / "05-app-registry.yaml"

#: Remediation text for a tombstone-blocked candidate. Deliberately names only
#: operations this codebase actually offers: there is NO hard-delete surface for
#: a project row — ``ProjectService.delete_project`` and
#: ``ProjectRepository.delete`` only tombstone, and ``jsonl.hard_delete_record``
#: has no CLI, API, or service caller. So the operator's real moves are editing
#: the JSONL registry file by hand or changing the identifiers being seeded.
TOMBSTONE_REMEDY = (
    "to seed it anyway, remove that tombstone line from the registry's "
    "projects.jsonl by hand (the API/CLI only soft-delete, so there is no "
    "hard-delete command to run), or give the fleet app a different id"
)

ACTION_CREATE = "create"
ACTION_SKIP = "skip"
ACTION_INVALID = "invalid"
ACTION_CONFLICT = "conflict"
#: Last commit older than the ``--active-since`` window. Measured — the
#: candidate's ``recency_days``/``recency_source`` are populated.
ACTION_STALE = "stale"
#: Recency could not be measured at all (no/blank path, path missing locally,
#: not a git repo, or no commits touch it). Deliberately kept DISTINCT from
#: ACTION_STALE: "we could not measure this repo" is a different fact from
#: "this repo is inactive", and collapsing the two would silently drop repos
#: that are actually fine but merely unmeasurable from this machine.
ACTION_UNRESOLVED = "unresolved"


class SeedError(RuntimeError):
    """Fatal, operator-actionable seeding error."""


# --------------------------------------------------------------------------
# Candidate model
# --------------------------------------------------------------------------


@dataclass
class Candidate:
    """One planned project row derived from a fleet app entry."""

    fleet_id: str
    action: str
    slug: str | None = None
    project_id: str | None = None
    name: str | None = None
    description: str | None = None
    workspace_id: str | None = None
    root_intenttree_node_id: str | None = None
    tags: list[str] = field(default_factory=list)
    reason: str | None = None
    #: One of ``"fresh"``, ``"stale"``, ``"unresolved"`` — set only when the
    #: recency gate actually measured this candidate (``--active-since``
    #: supplied). ``None`` means recency was never evaluated for this row.
    recency_state: str | None = None
    #: Age, in days, of the last commit touching the measured path. ``None``
    #: when unresolved or never measured.
    recency_days: float | None = None
    #: The repository path that was actually measured (a repo toplevel, or a
    #: subdirectory-of-repo's toplevel when the fleet ``path`` is nested inside
    #: a larger checkout). ``None`` when unresolved or never measured.
    recency_source: str | None = None

    @property
    def is_actionable(self) -> bool:
        return self.action == ACTION_CREATE

    @property
    def is_problem(self) -> bool:
        # Deliberately excludes ACTION_STALE / ACTION_UNRESOLVED: --strict's
        # contract is invalid/conflict only. "This repo looks inactive" or "we
        # could not measure this repo" are not data-quality problems with the
        # fleet registry the way an invalid slug or an id collision are.
        return self.action in (ACTION_INVALID, ACTION_CONFLICT)

    def as_dict(self) -> dict[str, Any]:
        return {
            "fleet_id": self.fleet_id,
            "action": self.action,
            "id": self.project_id,
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "workspace_id": self.workspace_id,
            "root_intenttree_node_id": self.root_intenttree_node_id,
            "tags": list(self.tags),
            "reason": self.reason,
            "recency_state": self.recency_state,
            "recency_days": self.recency_days,
            "recency_source": self.recency_source,
        }


# --------------------------------------------------------------------------
# Normalization / derivation
# --------------------------------------------------------------------------


def normalize_slug(fleet_id: str) -> str:
    """Normalize a fleet app id into an Atlas slug candidate.

    Exactly two transforms — lowercase and underscore -> hyphen. Deliberately
    NOT a sanitizer: anything left over that violates :data:`SLUG_PATTERN` is
    reported by the caller instead of being scrubbed into a passing slug.

    Notably there is **no** ``.strip()``: whitespace is not legal in the slug
    pattern, so a fleet id carrying it is reported INVALID like any other
    pattern violation. Trimming it here would silently repair an upstream data
    typo and would make the "never sanitized" invariant false.
    """
    return fleet_id.lower().replace("_", "-")


def is_valid_slug(slug: str) -> bool:
    """True when *slug* satisfies the OpenAPI ``Project.slug`` pattern."""
    return bool(slug) and SLUG_RE.match(slug) is not None


def derive_project_id(slug: str) -> str:
    """Return the deterministic project id for *slug*.

    Underscore form (``artifact-atlas`` -> ``proj_artifact_atlas``) so a
    re-seed reproduces the existing hand-authored id byte-for-byte.
    """
    return "proj_" + slug.replace("-", "_")


# --------------------------------------------------------------------------
# Commit-recency measurement
# --------------------------------------------------------------------------


def _run_git(cwd: Path, args: Sequence[str]) -> tuple[bool, str]:
    """Run ``git <args>`` in *cwd*. Never raises — a git failure is data, not
    a script bug: it is reported upstream as an UNRESOLVED reason, not an
    exception.

    Returns ``(ok, stdout_stripped)``. ``ok`` is ``False`` on a nonzero exit,
    a missing ``git`` binary, or any other :class:`OSError` while spawning it.
    """
    try:
        proc = subprocess.run(
            ["git", *args],
            cwd=str(cwd),
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return False, ""
    if proc.returncode != 0:
        return False, ""
    return True, proc.stdout.strip()


def _measure_commit_recency_uncached(
    resolved: Path, raw_path: str
) -> tuple[float | None, str | None, str | None]:
    """Uncached body of :func:`measure_commit_recency`. See its docstring."""
    if not resolved.exists():
        return None, None, f"path does not exist locally: {raw_path}"

    ok, toplevel_out = _run_git(resolved, ["rev-parse", "--show-toplevel"])
    if not ok or not toplevel_out:
        return None, None, f"not inside a git repository: {raw_path}"

    try:
        toplevel = Path(toplevel_out).resolve()
    except OSError:  # pragma: no cover - unresolvable path
        toplevel = Path(toplevel_out)

    if toplevel == resolved:
        # The fleet path IS the repo root.
        ok, commit_iso = _run_git(resolved, ["log", "-1", "--format=%cI"])
        if not ok or not commit_iso:
            return None, None, f"no commits found in repository: {raw_path}"
        source = str(resolved)
    else:
        # The fleet path is a SUBDIRECTORY of a repo (real case: `hermes`
        # lives inside the agentic_meta_dev checkout). Measure the last commit
        # that actually touches that subtree, not the whole repo's HEAD.
        try:
            relpath = resolved.relative_to(toplevel)
        except ValueError:  # pragma: no cover - rev-parse guarantees an ancestor
            return (
                None,
                None,
                f"could not resolve {raw_path} relative to repo toplevel {toplevel}",
            )
        ok, commit_iso = _run_git(
            toplevel, ["log", "-1", "--format=%cI", "--", str(relpath)]
        )
        if not ok or not commit_iso:
            return None, None, f"no commits touch {relpath} in {toplevel}"
        source = str(toplevel)

    try:
        commit_dt = datetime.fromisoformat(commit_iso)
    except ValueError:
        return None, None, f"could not parse commit timestamp {commit_iso!r} for {raw_path}"

    age_days = (datetime.now(timezone.utc) - commit_dt).total_seconds() / 86400.0
    return age_days, source, None


def measure_commit_recency(
    path_value: Any,
    *,
    cache: dict[str, tuple[float | None, str | None, str | None]],
) -> tuple[float | None, str | None, str | None]:
    """Measure the age (in days) of the most recent commit touching an entry's
    ``path``.

    Returns ``(age_days, source, unresolved_reason)``:

    * Measured successfully: ``(age_days, <repo-or-subdir toplevel measured>,
      None)``.
    * Could not be measured: ``(None, None, <human-readable reason>)``. This
      is reported as :data:`ACTION_UNRESOLVED`, never silently treated as
      stale — a git failure or a missing checkout is not evidence that a repo
      is inactive.

    Resolution order, matching the fleet registry's real shape:

    1. no/blank ``path`` -> unresolved.
    2. ``path`` does not exist on this machine -> unresolved.
    3. ``git -C <path> rev-parse --show-toplevel`` fails -> unresolved (not a
       git checkout).
    4. toplevel == the resolved path -> ``git log -1 --format=%cI`` at the
       root.
    5. toplevel is an ANCESTOR of the resolved path (the fleet entry names a
       subdirectory of a larger repo) -> ``git log -1 --format=%cI --
       <relpath>``; no output -> unresolved (nothing under that subtree has
       ever been committed).

    Memoized per RESOLVED path in *cache* so a repo named by multiple fleet
    entries — or the same entry re-measured across CREATE auditing — is only
    shelled out to once per :func:`plan_candidates` call. Callers own the
    cache's lifetime; passing a fresh dict re-measures everything.
    """
    raw_path = path_value if isinstance(path_value, str) else ""
    if not raw_path.strip():
        return None, None, "fleet entry has no 'path'"

    try:
        resolved = Path(raw_path).expanduser().resolve()
    except OSError:  # pragma: no cover - unresolvable path
        resolved = Path(raw_path).expanduser()

    cache_key = str(resolved)
    if cache_key in cache:
        return cache[cache_key]

    result = _measure_commit_recency_uncached(resolved, raw_path)
    cache[cache_key] = result
    return result


# --------------------------------------------------------------------------
# Fleet source loading
# --------------------------------------------------------------------------


def default_fleet_registry_path(repo_root: Path | None = None) -> Path | None:
    """Best-effort location of the sibling launchpad app registry.

    Honours ``ATLAS_FLEET_REGISTRY``, then walks up from the repo root looking
    for ``<ancestor>/agentic_meta_dev/docs/05-app-registry.yaml`` (so the lookup
    also resolves from inside a git worktree, which is nested deeper than the
    main checkout). Returns ``None`` when nothing is found — the caller then
    tells the operator to pass ``--registry``, rather than hard-depending on a
    sibling checkout existing.
    """
    env_path = os.environ.get("ATLAS_FLEET_REGISTRY")
    if env_path:
        return Path(env_path).expanduser()

    root = (repo_root or _REPO_ROOT).resolve()
    for ancestor in [root, *root.parents][:8]:
        candidate = ancestor / _FLEET_REGISTRY_RELPATH
        if candidate.is_file():
            return candidate
    return None


def load_fleet_apps(path: Path) -> list[dict[str, Any]]:
    """Parse the fleet app registry and return its ``apps`` entries.

    Raises:
        SeedError: file missing, YAML unavailable/unparseable, or the document
            does not carry a list of app mappings under ``apps``.
    """
    if yaml is None:  # pragma: no cover - pyyaml is a declared dependency
        raise SeedError("pyyaml is not installed; cannot parse the fleet registry.")
    if not path.is_file():
        raise SeedError(
            f"Fleet registry not found: {path}\n"
            "Pass --registry <path to 05-app-registry.yaml> "
            "(or set ATLAS_FLEET_REGISTRY)."
        )
    try:
        with path.open("r", encoding="utf-8") as fh:
            doc = yaml.safe_load(fh)
    except yaml.YAMLError as exc:  # type: ignore[union-attr]
        raise SeedError(f"Fleet registry is not valid YAML ({path}): {exc}") from exc

    if not isinstance(doc, dict):
        raise SeedError(f"Fleet registry must be a YAML mapping ({path}).")

    apps = doc.get("apps")
    if not isinstance(apps, list):
        raise SeedError(f"Fleet registry has no 'apps' list ({path}).")

    entries: list[dict[str, Any]] = []
    for idx, entry in enumerate(apps):
        if not isinstance(entry, dict):
            raise SeedError(
                f"Fleet registry apps[{idx}] is {type(entry).__name__}, expected a mapping."
            )
        entries.append(entry)
    return entries


def load_tree_map(path: Path | None) -> dict[str, str]:
    """Load an optional ``slug -> root IntentTree NODE id`` JSON mapping.

    The fleet registry carries no node ids, and the only machine-readable fleet
    tree data available holds TREE ids. This mapping is the sole supported way
    to populate ``root_intenttree_node_id``; absent it, the field stays null.
    """
    if path is None:
        return {}
    if not path.is_file():
        raise SeedError(f"--tree-map file not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SeedError(f"--tree-map is not valid JSON ({path}): {exc}") from exc
    if not isinstance(data, dict):
        raise SeedError(
            f"--tree-map must be a JSON object of slug -> root node id ({path})."
        )

    mapping: dict[str, str] = {}
    for key, value in data.items():
        if not isinstance(value, str) or not value:
            raise SeedError(
                f"--tree-map entry '{key}' must map to a non-empty node id string."
            )
        mapping[normalize_slug(str(key))] = value
    return mapping


# --------------------------------------------------------------------------
# Existing-registry state (tombstone-aware)
# --------------------------------------------------------------------------


def _existing_slugs_and_ids(
    registry_dir: Path,
) -> tuple[set[str], dict[str, str], set[str]]:
    """Return ``(live_slugs, tombstoned_slugs, all_ids)`` for the project registry.

    All three are read over the raw JSONL, because soft-deleted
    (``_deleted: true``) rows keep their line, their id **and** their slug — so
    neither constraint can be evaluated through a deleted-filtered view:

    * **ids include tombstones** (``include_deleted=True``).
      ``jsonl.update_record`` / ``tombstone_record`` scan raw lines and act on
      the FIRST id match, so appending a second row that reuses a tombstoned id
      permanently shadows the new row from every later update.
    * **slugs are split into two buckets, and both are needed.**
      ``ProjectRepository.get_by_slug`` filters deleted rows, so a tombstoned
      slug reads as free and *nothing below this script* would reject a second
      row carrying it — the file would simply hold that slug twice. The split
      keeps the two legitimate outcomes distinct: a slug with a LIVE row is
      ordinary idempotency and SKIPs; a slug held only by a tombstone is a
      reported CONFLICT.

    The id guard is **not** a backstop for the tombstoned-slug case. Deriving an
    id from a slug is injective, but existing rows are under no obligation to
    carry the derived form: a tombstoned row with id ``proj_legacy_id`` holding
    slug ``foo`` leaves ``proj_foo`` free, so a fleet app with id ``foo`` clears
    the id guard and would append a duplicate slug. ``tombstoned_slugs`` maps
    each such slug to the id of the row still holding it, so the CONFLICT can
    name the exact JSONL line the operator has to deal with (see
    :data:`TOMBSTONE_REMEDY`).
    """
    repo = ProjectRepository(registry_dir)
    live = repo.list()
    every = repo.list(include_deleted=True)

    live_slugs = {p.slug for p in live if p.slug}
    all_ids = {p.id for p in every if p.id}
    # Only slugs with NO live row: a slug that was tombstoned and later
    # re-created is live again and must stay an ordinary SKIP, not a CONFLICT.
    tombstoned_slugs = {
        p.slug: p.id
        for p in every
        if p.slug and p.id and p.slug not in live_slugs
    }
    return live_slugs, tombstoned_slugs, all_ids


# --------------------------------------------------------------------------
# Planning
# --------------------------------------------------------------------------


def _describe(entry: dict[str, Any]) -> str | None:
    """Prefer the fleet 'purpose' prose, falling back to 'role'."""
    for key in ("purpose", "role"):
        value = entry.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _tags_for(entry: dict[str, Any]) -> list[str]:
    """Provenance tags: the fleet marker plus the declared architecture layer.

    The fleet ``status`` (layer maturity) is intentionally NOT carried over —
    the registry's own header warns it is hand-edited and misleading.
    """
    tags = [FLEET_TAG]
    layer = entry.get("layer")
    if isinstance(layer, str) and layer.strip():
        # Trimmed HERE, not in normalize_slug: a tag is a free-form label, not a
        # slug under the OpenAPI pattern, so tidying it is presentation rather
        # than the sanitization the slug invariant forbids.
        layer_tag = f"layer:{normalize_slug(layer.strip())}"
        tags.append(layer_tag)
    return tags


def plan_candidates(
    entries: Iterable[dict[str, Any]],
    *,
    existing_slugs: set[str],
    existing_ids: set[str],
    workspace_id: str,
    tombstoned_slugs: dict[str, str] | None = None,
    tree_map: dict[str, str] | None = None,
    active_since: float | None = None,
    include_unresolved_recency: bool = False,
) -> list[Candidate]:
    """Derive one :class:`Candidate` per fleet entry, in registry order.

    *existing_slugs* holds LIVE slugs only (a match is ordinary idempotency ->
    SKIP). *tombstoned_slugs* maps a slug held only by a soft-deleted row to
    that row's id (a match -> CONFLICT, because appending would duplicate the
    slug in the JSONL). *existing_ids* is tombstone-inclusive. See
    :func:`_existing_slugs_and_ids`.

    *active_since* is the commit-recency filter window in days. ``None`` (the
    default) disables the filter entirely — no measurement happens and the
    plan is byte-identical to before this filter existed. When set, every
    candidate that clears the earlier guards is measured via
    :func:`measure_commit_recency` before it is allowed to reserve its slug
    and id: a last commit older than *active_since* days plans as
    :data:`ACTION_STALE`; a candidate whose recency could not be measured at
    all plans as :data:`ACTION_UNRESOLVED` unless *include_unresolved_recency*
    is set, in which case it proceeds to CREATE. *include_unresolved_recency*
    has no effect while *active_since* is ``None``.
    """
    tree_map = tree_map or {}
    tombstoned_slugs = tombstoned_slugs or {}
    planned_slugs: dict[str, str] = {}
    planned_ids: set[str] = set()
    candidates: list[Candidate] = []
    # Per-run memoization for measure_commit_recency: a repo named by several
    # fleet entries (or the same repo re-measured for auditability across
    # CREATEs) is only shelled out to once. Local to this call, not module
    # state, so repeated plan_candidates() calls in one process (e.g. tests)
    # never see stale cached recency from a prior run.
    _recency_cache: dict[str, tuple[float | None, str | None, str | None]] = {}

    for entry in entries:
        raw_id = entry.get("id")
        # Carried through VERBATIM (no .strip()): whitespace in a fleet id is an
        # upstream typo that must surface as INVALID, not be trimmed away. The
        # blank check below only *inspects* a trimmed copy — a whitespace-only
        # id genuinely has no id to report.
        fleet_id = str(raw_id) if raw_id is not None else ""
        if not fleet_id.strip():
            candidates.append(
                Candidate(
                    fleet_id="<missing id>",
                    action=ACTION_INVALID,
                    reason="fleet entry has no 'id' field",
                )
            )
            continue

        slug = normalize_slug(fleet_id)
        if not is_valid_slug(slug):
            candidates.append(
                Candidate(
                    fleet_id=fleet_id,
                    action=ACTION_INVALID,
                    slug=slug,
                    reason=(
                        f"normalized slug {slug!r} violates the OpenAPI slug "
                        f"pattern {SLUG_PATTERN}"
                    ),
                )
            )
            continue

        name = entry.get("name")
        display_name = str(name).strip() if isinstance(name, str) and name.strip() else fleet_id
        project_id = derive_project_id(slug)
        node_id = tree_map.get(slug)

        base = Candidate(
            fleet_id=fleet_id,
            action=ACTION_CREATE,
            slug=slug,
            project_id=project_id,
            name=display_name,
            description=_describe(entry),
            workspace_id=workspace_id,
            root_intenttree_node_id=node_id,
            tags=_tags_for(entry),
        )

        # Duplicate inside the fleet source itself (e.g. `foo_bar` and `foo-bar`).
        if slug in planned_slugs:
            base.action = ACTION_CONFLICT
            base.reason = (
                f"slug collides with fleet entry {planned_slugs[slug]!r} "
                "earlier in this registry"
            )
            candidates.append(base)
            continue

        if slug in existing_slugs:
            base.action = ACTION_SKIP
            base.reason = "slug already present in the Atlas registry"
            candidates.append(base)
            planned_slugs[slug] = fleet_id
            continue

        # A slug held only by a TOMBSTONE. `get_by_slug` filters deleted rows,
        # so this slug reads as free and no layer below would reject a second
        # row carrying it — the file would end up with the same slug twice. The
        # derived-id guard below is NOT a backstop here: existing rows need not
        # carry the derived id form, so a tombstoned row with an unrelated id
        # (say `proj_legacy_id` holding slug `foo`) leaves `proj_foo` free and
        # the candidate would otherwise plan as CREATE.
        if slug in tombstoned_slugs:
            base.action = ACTION_CONFLICT
            base.reason = (
                f"slug {slug!r} is still held by a soft-deleted row (id "
                f"{tombstoned_slugs[slug]!r}); creating it would put the same "
                f"slug in projects.jsonl twice — {TOMBSTONE_REMEDY}"
            )
            candidates.append(base)
            continue

        # The repository layer does not enforce id uniqueness (its docstring
        # says that is the caller's job), so refuse a derived id that is already
        # taken. `existing_ids` is tombstone-aware (see
        # `_existing_slugs_and_ids`), so this also catches a SOFT-DELETED row
        # still holding this id under a different slug.
        if project_id in existing_ids or project_id in planned_ids:
            base.action = ACTION_CONFLICT
            base.reason = (
                f"derived id {project_id!r} is already taken by an existing row "
                "(a row with a different slug, or a soft-deleted row still "
                "occupying the id)"
            )
            candidates.append(base)
            continue

        # Recency gate. Disabled entirely (no measurement, no field
        # population) unless --active-since was passed — that is what keeps
        # the filter-off plan byte-identical to pre-filter behaviour. Placed
        # LAST, immediately before the slug/id reservation below: a STALE or
        # UNRESOLVED candidate must NOT reserve its slug or id, or a later
        # fleet entry that collides with it would be falsely reported as a
        # CONFLICT against a row that was never actually going to be created.
        if active_since is not None:
            age_days, source, unresolved_reason = measure_commit_recency(
                entry.get("path"), cache=_recency_cache
            )
            # Populated on every candidate reaching this point, including
            # eventual CREATEs — auditability of what was measured, not just
            # a record of what got excluded.
            base.recency_days = age_days
            base.recency_source = source

            if unresolved_reason is not None:
                base.recency_state = "unresolved"
                if not include_unresolved_recency:
                    base.action = ACTION_UNRESOLVED
                    base.reason = unresolved_reason
                    candidates.append(base)
                    continue
                # --include-unresolved-recency: fall through to CREATE below.
            else:
                assert age_days is not None  # measured => age_days is set
                if age_days > active_since:
                    base.recency_state = "stale"
                    base.action = ACTION_STALE
                    base.reason = (
                        f"last commit {age_days:.1f} day(s) ago, older than "
                        f"--active-since {active_since} day(s) "
                        f"(measured at {source})"
                    )
                    candidates.append(base)
                    continue
                base.recency_state = "fresh"

        planned_slugs[slug] = fleet_id
        planned_ids.add(project_id)
        candidates.append(base)

    return candidates


# --------------------------------------------------------------------------
# Apply
# --------------------------------------------------------------------------


def apply_candidates(
    candidates: Sequence[Candidate], service: ProjectService
) -> list[str]:
    """Create every actionable candidate through the service layer.

    Returns the list of created project ids, in order.

    .. note::

       ``workspace_id`` below is a **declared field** on ``ProjectCreate`` — see
       the module-level note. It used to persist only via
       ``ConfigDict(extra="allow")`` + ``ProjectRepository.create``'s
       ``model_dump()`` spread, which meant extras no longer reaching the stored
       record would have landed rows with no ``workspace_id`` and no error. Now
       that the field is declared it survives a narrowed ``model_dump()``.
    """
    created: list[str] = []
    for cand in candidates:
        if not cand.is_actionable:
            continue
        payload = ProjectCreate(
            name=cand.name or cand.slug or cand.fleet_id,
            slug=cand.slug or "",
            description=cand.description,
            status=ProjectStatus.active,
            tags=list(cand.tags),
            starred=False,
            root_intenttree_node_id=cand.root_intenttree_node_id,
            # Undeclared extra field — load-bearing, see the warning above.
            workspace_id=cand.workspace_id,
        )
        project = service.create_project(payload, project_id=cand.project_id)
        created.append(project.id)
    return created


# --------------------------------------------------------------------------
# Reporting
# --------------------------------------------------------------------------

_ACTION_LABEL = {
    ACTION_CREATE: "CREATE",
    ACTION_SKIP: "SKIP",
    ACTION_INVALID: "INVALID",
    ACTION_CONFLICT: "CONFLICT",
    ACTION_STALE: "STALE",
    ACTION_UNRESOLVED: "UNRESOLVED",
}


def render_plan(
    candidates: Sequence[Candidate],
    *,
    fleet_registry: Path,
    registry_dir: Path,
    workspace_id: str,
    tree_map_size: int,
    applied: bool,
    created: Sequence[str] | None = None,
    active_since: float | None = None,
    stream: Any = None,
) -> None:
    """Print the human-readable plan (or applied result).

    *active_since* is display-only (the recency gate already ran inside
    :func:`plan_candidates`); it is only printed as a header line when set, so
    the filter-disabled plan's header stays byte-identical to before this
    filter existed.
    """
    out = stream or sys.stdout
    mode = "APPLY" if applied else "DRY RUN (no writes)"

    print(f"Atlas fleet project seed — {mode}", file=out)
    print(f"  fleet registry : {fleet_registry}", file=out)
    print(f"  atlas registry : {registry_dir}", file=out)
    print(f"  workspace_id   : {workspace_id}", file=out)
    print(
        f"  tree map       : {tree_map_size} slug->node entries"
        + ("" if tree_map_size else " (root_intenttree_node_id stays null)"),
        file=out,
    )
    if active_since is not None:
        print(f"  active since   : {active_since} day(s)", file=out)
    print("", file=out)

    id_w = max([8] + [len(c.project_id or "") for c in candidates])
    slug_w = max([4] + [len(c.slug or "") for c in candidates])
    name_w = max([4] + [len(c.name or "") for c in candidates])

    for cand in candidates:
        label = _ACTION_LABEL.get(cand.action, cand.action.upper())
        node = cand.root_intenttree_node_id or "null"
        line = (
            f"  {label:<8} "
            f"id={(cand.project_id or '-'):<{id_w}} "
            f"slug={(cand.slug or '-'):<{slug_w}} "
            f"name={(cand.name or '-'):<{name_w}} "
            f"workspace_id={cand.workspace_id or '-'} "
            f"root_intenttree_node_id={node}"
        )
        if cand.recency_state is not None:
            days = f"{cand.recency_days:.1f}d" if cand.recency_days is not None else "-"
            line += f" recency={cand.recency_state}({days})"
        if cand.reason:
            line += f"  [{cand.reason}]"
        print(line, file=out)

    creates = [c for c in candidates if c.action == ACTION_CREATE]
    skips = [c for c in candidates if c.action == ACTION_SKIP]
    stales = [c for c in candidates if c.action == ACTION_STALE]
    unresolved = [c for c in candidates if c.action == ACTION_UNRESOLVED]
    problems = [c for c in candidates if c.is_problem]

    print("", file=out)
    print(
        f"  summary: {len(candidates)} fleet apps -> "
        f"{len(creates)} create, {len(skips)} skip, "
        f"{len(stales)} stale, {len(unresolved)} unresolved, "
        f"{len(problems)} problem",
        file=out,
    )
    if problems:
        print("  problems (skipped, nothing written for these):", file=out)
        for cand in problems:
            print(f"    - {cand.fleet_id}: {cand.reason}", file=out)
    excluded_by_recency = [c for c in candidates if c.action in (ACTION_STALE, ACTION_UNRESOLVED)]
    if excluded_by_recency:
        print("  excluded by recency (skipped, nothing written for these):", file=out)
        for cand in excluded_by_recency:
            label = _ACTION_LABEL[cand.action]
            print(f"    - [{label}] {cand.fleet_id}: {cand.reason}", file=out)
    if applied:
        print(f"  created: {len(created or [])} project rows", file=out)
    else:
        print("  dry run — nothing written. Re-run with --apply to write.", file=out)


def build_json_payload(
    candidates: Sequence[Candidate],
    *,
    fleet_registry: Path,
    registry_dir: Path,
    workspace_id: str,
    tree_map_size: int,
    applied: bool,
    created: Sequence[str] | None = None,
) -> dict[str, Any]:
    """Machine-readable twin of :func:`render_plan`."""
    return {
        "mode": "apply" if applied else "dry_run",
        "fleet_registry": str(fleet_registry),
        "registry_dir": str(registry_dir),
        "workspace_id": workspace_id,
        "tree_map_entries": tree_map_size,
        "candidates": [c.as_dict() for c in candidates],
        "summary": {
            "total": len(candidates),
            "create": sum(1 for c in candidates if c.action == ACTION_CREATE),
            "skip": sum(1 for c in candidates if c.action == ACTION_SKIP),
            "invalid": sum(1 for c in candidates if c.action == ACTION_INVALID),
            "conflict": sum(1 for c in candidates if c.action == ACTION_CONFLICT),
            "stale": sum(1 for c in candidates if c.action == ACTION_STALE),
            "unresolved": sum(1 for c in candidates if c.action == ACTION_UNRESOLVED),
            "created": list(created or []),
        },
    }


# --------------------------------------------------------------------------
# Write guard
# --------------------------------------------------------------------------


def is_real_repo_registry(registry_dir: Path) -> bool:
    """True when *registry_dir* is this checkout's canonical ``registry/`` dir."""
    try:
        return registry_dir.resolve() == (_REPO_ROOT / "registry").resolve()
    except OSError:  # pragma: no cover - unresolvable path
        return False


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="seed_fleet_projects.py",
        description=(
            "Seed Atlas project rows from the AOS fleet app registry. "
            "Dry run by default."
        ),
    )
    parser.add_argument(
        "--registry",
        type=Path,
        default=None,
        help=(
            "Path to the fleet app registry YAML (05-app-registry.yaml). "
            "Defaults to a discovered sibling agentic_meta_dev checkout, or "
            "ATLAS_FLEET_REGISTRY."
        ),
    )
    parser.add_argument(
        "--registry-dir",
        type=Path,
        default=None,
        help=(
            "Atlas registry directory to read/write. Defaults to the resolved "
            "app settings (which honour ATLAS_REGISTRY_DIR)."
        ),
    )
    parser.add_argument(
        "--tree-map",
        type=Path,
        default=None,
        help=(
            "Optional JSON file mapping slug -> root IntentTree NODE id. "
            "Without it, root_intenttree_node_id is left null (the fleet "
            "registry carries no node ids)."
        ),
    )
    parser.add_argument(
        "--workspace-id",
        default=None,
        help=(
            "Workspace id to stamp on every seeded row. Defaults to the "
            "configured settings.workspace_id."
        ),
    )
    parser.add_argument(
        "--active-since",
        type=float,
        default=None,
        help=(
            "Exclude fleet apps whose last commit (measured from the entry's "
            "'path') is older than this many days. A candidate whose recency "
            "cannot be measured at all (missing/invalid path, not a git repo, "
            "no commits) plans as UNRESOLVED rather than STALE — see "
            "--include-unresolved-recency. Default: no recency filter — "
            "every candidate is planned exactly as before this flag existed."
        ),
    )
    parser.add_argument(
        "--include-unresolved-recency",
        action="store_true",
        help=(
            "When --active-since is set, let a candidate whose recency could "
            "not be measured proceed to CREATE instead of being excluded as "
            "UNRESOLVED. Has no effect unless --active-since is also set."
        ),
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--dry-run",
        dest="apply",
        action="store_false",
        help="Print the plan and write nothing (default).",
    )
    mode.add_argument(
        "--apply",
        dest="apply",
        action="store_true",
        help="Write the planned project rows through the service layer.",
    )
    parser.set_defaults(apply=False)
    parser.add_argument(
        "--allow-real-registry",
        action="store_true",
        help=(
            "Required to --apply against this checkout's canonical registry/ "
            "directory. Guards against an accidental seed of canonical state."
        ),
    )
    parser.add_argument(
        "--json",
        dest="as_json",
        action="store_true",
        help="Emit the plan as JSON instead of the human-readable table.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 2 when any candidate is invalid or conflicts.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    settings = get_settings()

    fleet_path: Path | None = args.registry or default_fleet_registry_path()
    if fleet_path is None:
        print(
            "error: no fleet app registry found. Pass --registry <path to "
            "05-app-registry.yaml> or set ATLAS_FLEET_REGISTRY.",
            file=sys.stderr,
        )
        return 1
    fleet_path = Path(fleet_path).expanduser()

    registry_dir = Path(args.registry_dir) if args.registry_dir else settings.registry_dir
    workspace_id = args.workspace_id or settings.workspace_id

    try:
        entries = load_fleet_apps(fleet_path)
        tree_map = load_tree_map(args.tree_map)
    except SeedError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.apply and is_real_repo_registry(registry_dir) and not args.allow_real_registry:
        print(
            f"refusing to --apply against the canonical registry ({registry_dir}).\n"
            "Re-run with --allow-real-registry once the plan has been reviewed, "
            "or point --registry-dir at a scratch directory.",
            file=sys.stderr,
        )
        return 1

    service = ProjectService(registry_dir)
    # NOT service.list_projects(): that read filters soft-deleted rows, which
    # would leave both the duplicate-id and the duplicate-slug guard blind to
    # tombstones. See `_existing_slugs_and_ids`.
    existing_slugs, tombstoned_slugs, existing_ids = _existing_slugs_and_ids(
        registry_dir
    )

    candidates = plan_candidates(
        entries,
        existing_slugs=existing_slugs,
        existing_ids=existing_ids,
        workspace_id=workspace_id,
        tombstoned_slugs=tombstoned_slugs,
        tree_map=tree_map,
        active_since=args.active_since,
        include_unresolved_recency=args.include_unresolved_recency,
    )

    created: list[str] = []
    if args.apply:
        created = apply_candidates(candidates, service)

    if args.as_json:
        payload = build_json_payload(
            candidates,
            fleet_registry=fleet_path,
            registry_dir=registry_dir,
            workspace_id=workspace_id,
            tree_map_size=len(tree_map),
            applied=args.apply,
            created=created,
        )
        print(json.dumps(payload, indent=2))
    else:
        render_plan(
            candidates,
            fleet_registry=fleet_path,
            registry_dir=registry_dir,
            workspace_id=workspace_id,
            tree_map_size=len(tree_map),
            applied=args.apply,
            created=created,
            active_since=args.active_since,
        )

    if args.strict and any(c.is_problem for c in candidates):
        return 2
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
