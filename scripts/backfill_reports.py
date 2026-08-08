#!/usr/bin/env python3
"""DI-Backfill — dry-run-first backfill of already-rendered delivery reports.

Atlas holds exactly one ``delivery_report`` asset, so every discovery surface
built on top of that artifact type ships empty. There is, however, a fleet of
reports already rendered on disk — verified locations, both in the *sibling*
``agentic_meta_dev`` checkout and not in this repo:
``agentic_meta_dev/.claude/reports/aos-atlas/<slug>/index.html`` + ``report.json``
(14 ingestable) and ``agentic_meta_dev/docs/project_plans/reports/**`` (rendered
AAR/portfolio capsules — currently **all** skipped, see below). This script
ingests those existing files into Atlas.

Design constraints this script is built around
----------------------------------------------

**One ingest path.** Ingestion goes through
:meth:`app.services.import_index.ImportService.import_report` — the single
existing report ingest path, the same one ``atlas report ingest`` composes. This
script adds *discovery + envelope synthesis* only; it contains no storage,
hashing, linking, or identity logic of its own and must never grow any. It
depends on ``import_report``'s public signature ``(html_path, envelope, *,
project_id, sensitivity, on_duplicate, actor_id)``, never on its internals.

**Dry run is the default.** A bare invocation inspects and prints; it never
writes. Ingesting requires ``--apply`` *and* an explicit selection
(``--all`` or ``--select <keys>``). There is no invocation that silently
ingests everything.

**Files are canonical (D-018).** The source ``agentic_meta_dev/.claude/reports``
/ ``agentic_meta_dev/docs/project_plans/reports`` files are the system of
record. This script
opens them read-only. It never moves, deletes, rewrites, renames, or repoints a
source file — Atlas ends up holding a *derived* pointer (an asset row) plus a
copy in its own content store. Enforced by test
``test_apply_leaves_source_files_byte_identical``.

**Sensitivity is inherited, never invented** (DI-Sensitivity). This script does
not pass a ``sensitivity`` value unless the operator supplies ``--sensitivity``
explicitly. The existing ingest defaults therefore apply verbatim: the
workspace default (``personal`` in this workspace) floored to never-``public``
by ``ImportService._report_sensitivity``, and ``agent_access=preview_allowed``
so the capsule preview route can serve the HTML. These are internal AOS
engineering reports on a single-user LAN; a backfill is not the place to invent
a new access policy in either direction.

Envelope synthesis
------------------

``import_report`` takes an untyped envelope dict (the PF-3 writeback envelope;
verified field table in ``.claude/worknotes/delivery-report-hosting/
implementation-notes.md``). The rendered reports on disk ship the
*delivery-report manifest* (``report.json``) they were rendered from, not an
envelope — so this script synthesizes the envelope from the manifest, mirroring
the upstream emitter ``delivery-report/scripts/delivery_report.py::build_export``
field-for-field. Nothing is guessed: ``route``, ``subject``, ``revision``,
``title``, ``truth_status``, ``generated_from``, ``generated_by``,
``generated_at`` and the ``tracker_links[]`` rows are all read straight out of
the manifest.

The one field the manifests on disk do **not** carry is ``instance_key`` — see
``_resolve_instance_key`` for how it is derived, what the derivation is anchored
to, and what it does *not* promise.

A rendered HTML file with no adjacent manifest (the ``weekly-aar-review-*.html``
capsules, whose sidecar is an ``html_capsule`` YAML, a different schema with no
``route``/``subject``/``truth_status``) is **skipped with an explicit reason**,
visible in dry-run output. Mapping ``html_capsule`` onto a delivery-report
envelope would be inventing a schema translation, which is exactly what the
"do not guess subject or route" rule forbids.

What the backfill leaves behind (verified dry run, 2026-08-08)
--------------------------------------------------------------

``agentic_meta_dev/.claude/reports/aos-atlas`` — 15 candidates, 14 ingestable;
the one skip is ``index`` (``no_manifest``: the fleet landing page, which is not
itself a delivery report).

``agentic_meta_dev/docs/project_plans/reports`` — 9 candidates, **0 ingestable**:

* ``prose_subject`` (2, both genuine delivery reports with a manifest, held back
  only because their ``report.subject`` is prose): ``aos-1.0-readiness-2026-08-08``
  (``route=readiness``) and ``portfolio-week-in-review-2026-08-08``
  (``route=program``).
* ``no_manifest`` (7): ``aos-dark-factory-thesis-2026-08-07/report``,
  ``hermes-agent-status-2026-07-06``, and the five
  ``weekly-aar-review-{2026-07-14,2026-07-17,2026-07-24,2026-07-31,2026-08-07}``
  capsules.

Usage
-----

    # inspect everything (default: dry run, writes nothing, exits 0)
    python3 scripts/backfill_reports.py <root>

    # inspect one collection with an explicit pattern, machine-readable
    python3 scripts/backfill_reports.py <root> --pattern '**/index.html' --json

    # ingest -- requires --apply AND an explicit selection
    python3 scripts/backfill_reports.py <root> --apply --select artifact-atlas,intenttree
    python3 scripts/backfill_reports.py <root> --apply --all

Exit codes: ``0`` success (including a dry run), ``1`` at least one candidate
failed to ingest, ``2`` usage error — bad root, ``--apply`` with no selection,
a selector that matched nothing, or a selector that named a candidate which
cannot be ingested (an explicitly-named report that would be silently dropped
is a usage error, never a 0-exit no-op).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Sequence

# The app package lives under api/. Make it importable when this script is run
# directly from the repo root (tests import it as a module and already have it).
_REPO_ROOT = Path(__file__).resolve().parents[1]
_API_DIR = _REPO_ROOT / "api"
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))


# ---------------------------------------------------------------------------
# Envelope contract constants
#
# Mirrors delivery_report.py::build_export / compute_instance_key /
# compute_link_identity. Duplicated deliberately: that emitter lives in a
# sibling repo which is READ-ONLY reference here and is not importable from a
# clean clone of this one.
# ---------------------------------------------------------------------------

ENVELOPE_VERSION = "1.0"
ENVELOPE_ARTIFACT_TYPE = "delivery-report"
EXPORT_TARGET = "atlas"

#: ``feature``/``dossier`` collapse on (route, subject) by design — one living
#: record per subject — so they carry no ``instance_key``.
COLLAPSING_ROUTES = frozenset({"feature", "dossier"})
#: The recurring routes: one subject legitimately has many instances over time,
#: so identity needs a per-instance discriminator (``DI-SubjectCollapse``).
RECURRING_ROUTES = frozenset({"program", "phase", "readiness"})
ALL_ROUTES = COLLAPSING_ROUTES | RECURRING_ROUTES

DEFAULT_PATTERN = "**/*.html"
MANIFEST_BASENAME = "report.json"

#: A delivery report's identity is ``(route, subject, instance_key)`` — its
#: content hash is **not** its identity. ``import_content``'s default
#: hash-duplicate handling would return an existing asset whenever two reports
#: happen to render byte-identical HTML (an empty/placeholder fleet page, two
#: projects sitting at the same template state), silently collapsing two
#: distinct reports onto one asset with the wrong subject. A backfill ingests
#: many sibling reports in one pass, so that collision is a live risk here in a
#: way it is not for a one-at-a-time ``atlas report ingest``.
#:
#: ``create_new`` only governs the *first-ingest* path: every candidate this
#: script emits carries a full stable identity (route + subject always,
#: instance_key derived for the recurring routes), so a re-run still resolves to
#: the existing asset and revises it in place — idempotence comes from the
#: identity lookup, never from the hash. Overridable via ``--on-duplicate``.
DEFAULT_ON_DUPLICATE = "create_new"

#: Subject must be slug-shaped to be usable as a link target id. A prose
#: subject (spaces, punctuation, em dashes) is not a slug and is skipped rather
#: than mangled into a bogus ``feature:<prose>`` link.
_SLUG_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,99}\Z")

#: Marker whose nearest ancestor identifies the repository that owns a source
#: file. A plain walk-up for this entry (a directory in a normal clone, a *file*
#: in a git worktree or submodule) is a dependency-free equivalent of
#: ``git rev-parse --show-toplevel`` for the only question asked here — "what is
#: the top of the repo this report lives in?" — with no subprocess per candidate,
#: no PATH assumption, and no failure mode when git is absent.
_REPO_MARKER = ".git"

#: ADVISORY only — the authoritative tracker validation lives in
#: ``ImportService`` (it raises and aborts the ingest). This local copy exists
#: solely so a dry run can warn about a tracker that will fail at apply time.
_ADVISORY_TRACKER_RE = re.compile(r"^(?:node|tree)_[A-Za-z0-9]+$")
_ADVISORY_TRACKER_SEP_RE = re.compile(r"\s+[—-]\s+")


# ---------------------------------------------------------------------------
# Candidate model
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class InstanceKeyDerivation:
    """The inputs a *derived* ``instance_key`` was actually computed from.

    Recorded on the candidate and in the emitted envelope so that a key which
    nonetheless differs from a previous run's is diagnosable straight from the
    plan output, instead of surfacing later as a mystery duplicate asset.

    Deliberately does **not** include ``--root`` or ``--pattern``: they are not
    inputs. That is the entire point of anchoring the derivation (see
    :func:`_resolve_instance_key`), and listing them here would re-imply the
    invocation-dependence this design removes.
    """

    anchor_kind: str
    """``"collection_dir"`` or ``"repo_root"`` — which anchor rule applied."""

    anchor_path: str
    """Absolute path of the directory the relative part was measured from."""

    collection: str
    """The prefix actually used (``--collection``, else the anchor's own name)."""

    relative_path: str
    """The report's path relative to the anchor (``""`` when it *is* the anchor)."""

    def to_dict(self) -> dict[str, str]:
        return {
            "anchor_kind": self.anchor_kind,
            "anchor_path": self.anchor_path,
            "collection": self.collection,
            "relative_path": self.relative_path,
        }


@dataclass
class Candidate:
    """One discovered rendered-report HTML file and what we would do with it."""

    key: str
    """Selection handle for ``--select`` — the source path relative to *root*,
    minus the ``/index.html`` tail. For ``.claude/reports/aos-atlas`` these are
    exactly the project slugs (``artifact-atlas``, ``intenttree``, …).

    This is a *UI handle only* and is scan-relative by design: it changes with
    ``--root``, which is fine for something the operator types. It is
    deliberately **not** an input to ``instance_key`` derivation — conflating
    the two is the bug :func:`_resolve_instance_key` documents."""

    html_path: Path
    manifest_path: Path | None = None
    envelope: dict[str, Any] | None = None
    instance_key_source: str | None = None
    instance_key_derivation: dict[str, str] | None = None
    skip_reason: str | None = None
    skip_detail: str | None = None
    warnings: list[str] = field(default_factory=list)
    selected: bool = False

    @property
    def ingestable(self) -> bool:
        return self.skip_reason is None and self.envelope is not None

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "html_path": str(self.html_path),
            "manifest_path": str(self.manifest_path) if self.manifest_path else None,
            "ingestable": self.ingestable,
            "selected": self.selected,
            "skip_reason": self.skip_reason,
            "skip_detail": self.skip_detail,
            "instance_key_source": self.instance_key_source,
            "instance_key_derivation": self.instance_key_derivation,
            "warnings": list(self.warnings),
            "envelope": self.envelope,
        }


# ---------------------------------------------------------------------------
# Discovery + envelope synthesis (pure; touches no service, writes nothing)
# ---------------------------------------------------------------------------


def _slug_like(value: str) -> bool:
    return bool(_SLUG_RE.match(value))


def _relative_report_id(base: Path, html_path: Path) -> str:
    """*html_path*'s report node, as a path relative to *base*.

    The "report node" is the directory for the ``<dir>/index.html`` layout and
    the extension-stripped file otherwise, so both layouts yield one name per
    report rather than one per file. Returns ``""`` when the node *is* *base*.

    **Not injective on its own**, and it is the identity-bearing derivation —
    :func:`_resolve_instance_key` composes its result into ``instance_key`` and
    :func:`candidate_key` into the selection handle. ``<dir>/index.html`` and
    ``<dir>.html`` are two files that both map onto ``<dir>``. That pair is
    detected by :func:`_colliding_report_node` and *refused* in :func:`discover`,
    never silently folded onto one identity; any new caller must pair with that
    guard rather than assume this function distinguishes them.
    """
    rel = html_path.relative_to(base)
    if html_path.stem == "index":
        parent = rel.parent
        return "" if parent == Path(".") else parent.as_posix()
    return rel.with_suffix("").as_posix()


def _colliding_report_node(html_path: Path) -> Path | None:
    """The other file *html_path* shares a report node with, if it exists.

    ``<dir>/index.html`` and ``<dir>.html`` are distinct files that
    :func:`_relative_report_id` maps onto the same node name (``<dir>``) — so as
    ``instance_key`` they are one identity and as :func:`candidate_key` one
    selector. Two genuinely different reports laid out that way would therefore
    have whichever ran second *revise* the first, and ``--select <dir>`` could
    not say which was meant. Refused in :func:`discover`
    (``ambiguous_report_node``) rather than guessed at — the same reasoning as
    :func:`find_manifest`'s ambiguity guard: a wrong identity is worse than
    none. The fix is to rename one of the two files (or give the manifests
    distinct ``report.instance_key`` values *and* non-colliding filenames).

    The probe is on *html_path*'s own path rather than on the discovered
    candidate set, so the verdict is the same however the scan was spelled. A
    set-based check would miss the twin whenever ``--pattern`` excluded it, which
    would make the refusal — and therefore identity — a function of the
    invocation, the exact hazard :func:`_resolve_instance_key` documents.

    Scope, stated rather than implied: the twin probed for is ``<dir>.html``,
    which covers every layout the default ``**/*.html`` pattern can surface. A
    twin under some other extension (reachable only via a custom ``--pattern``)
    would still collide in the derivation and is not caught here.
    """
    if html_path.stem == "index":
        # ``<root>/index.html`` has no ``<dir>`` to twin (parent.name is "").
        if not html_path.parent.name:
            return None
        twin = html_path.parent.parent / f"{html_path.parent.name}.html"
        return twin if twin.is_file() else None
    twin = html_path.with_suffix("") / "index.html"
    return twin if twin.is_file() else None


def candidate_key(root: Path, html_path: Path) -> str:
    """Selection handle for *html_path*, relative to *root*.

    ``<root>/artifact-atlas/index.html`` -> ``artifact-atlas``
    ``<root>/weekly-aar-review-2026-08-07.html`` -> ``weekly-aar-review-2026-08-07``
    """
    return _relative_report_id(root, html_path) or html_path.stem


def _find_repo_root(start: Path) -> Path | None:
    """Nearest ancestor of *start* (inclusive) holding a :data:`_REPO_MARKER`."""
    for parent in (start, *start.parents):
        if (parent / _REPO_MARKER).exists():
            return parent
    return None


def _find_named_ancestor(start: Path, name: str) -> Path | None:
    """Nearest ancestor of *start* (inclusive) whose directory name is *name*."""
    for parent in (start, *start.parents):
        if parent.name == name:
            return parent
    return None


def find_manifest(html_path: Path) -> Path | None:
    """Locate the delivery-report manifest *html_path* was rendered from.

    Two verified layouts, in precedence order:

    1. ``<stem>.report.json`` beside the HTML — an explicit per-file manifest.
    2. ``report.json`` in the same directory, but **only when the pairing is
       unambiguous**: either the HTML is ``index.html`` (the verified
       ``<dir>/index.html`` + ``<dir>/report.json`` layout ``build_reports.py``
       emits) or it is the only ``.html`` file in that directory.

    The ambiguity guard matters: a flat directory holding several unrelated HTML
    reports plus one ``report.json`` must not have every file claim that single
    manifest as its own. Wrong provenance is worse than no provenance.
    """
    explicit = html_path.with_name(f"{html_path.stem}.{MANIFEST_BASENAME}")
    if explicit.is_file():
        return explicit
    sibling = html_path.with_name(MANIFEST_BASENAME)
    if sibling.is_file():
        if html_path.stem == "index":
            return sibling
        siblings = [p for p in html_path.parent.glob("*.html") if p.is_file()]
        if len(siblings) == 1:
            return sibling
    return None


def _load_manifest(path: Path) -> tuple[dict[str, Any] | None, str | None, str | None]:
    """Read + parse a manifest. Returns ``(data, skip_reason, skip_detail)``."""
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as exc:
        return None, "manifest_unreadable", str(exc)
    try:
        data = json.loads(raw)
    except ValueError as exc:
        return None, "manifest_invalid_json", str(exc)
    if not isinstance(data, dict):
        return None, "manifest_not_object", f"top level is {type(data).__name__}"
    return data, None, None


def _resolve_instance_key(
    *,
    route: str,
    manifest_report: dict[str, Any],
    html_path: Path,
    collection: str | None,
    override: str | None,
) -> tuple[str | None, str, InstanceKeyDerivation | None]:
    """Resolve the per-instance discriminator.

    Returns ``(value, source, derivation)``. ``source="underivable"`` (with
    ``value=None``) means the caller must skip the candidate rather than ingest
    it under a guessed identity.

    ``feature``/``dossier`` -> always ``None``: collapse onto one living record
    per subject is the intended model there, and ``import_report`` treats those
    routes as having a stable identity without an ``instance_key``.

    ``program``/``phase``/``readiness`` recur, so ``import_report`` requires a
    non-blank ``instance_key`` before it will revise an existing asset in place;
    without one it takes the create path and every re-run mints a *new* asset.
    A backfill that re-ran would therefore duplicate, which is precisely what
    this script must not do. Precedence:

    1. ``report.instance_key`` from the manifest — upstream authority wins.
    2. ``--instance-key`` — operator override, for a single-candidate run.
    3. Derived from the report's own location, anchored **independently of the
       scan**: ``"<prefix>/<path relative to the anchor>"``.

    Why the derivation is anchored rather than scan-relative
    -------------------------------------------------------

    An earlier version of this function composed
    ``"<root.name>/<path relative to root>"``. That made the key a function of
    the **invocation** rather than of the report: scanning
    ``…/reports/aos-atlas`` produced ``aos-atlas/artifact-atlas``, while
    scanning ``…/reports`` with ``--pattern 'aos-atlas/**/index.html'`` produced
    ``reports/aos-atlas/artifact-atlas`` for the *same file*. Two keys means two
    identities, so the second run duplicated every asset instead of revising it
    — destroying the one guarantee this script exists to make. Neither ``root``
    nor ``pattern`` is an input any more. The anchor is one of:

    * ``collection_dir`` — the nearest ancestor directory named exactly
      ``--collection``. ``--collection aos-atlas`` therefore anchors at the
      ``aos-atlas/`` directory no matter where the scan started.
    * ``repo_root`` — otherwise the nearest ancestor holding a ``.git`` entry:
      the repository that owns the file. The prefix is ``--collection`` when
      given, else that directory's name (e.g. ``agentic_meta_dev``).

    Both are properties of the file's own absolute path, so **every** spelling
    of ``--root``/``--pattern`` that reaches a given report derives the same
    key. When neither anchor exists the key is *refused* — see the
    ``instance_key_underivable`` skip in :func:`discover` — rather than falling
    back to something scan-relative.

    The derivation also avoids the two fallbacks the upstream emitter forbids by
    name: bare ``subject`` (recreates the ``DI-SubjectCollapse`` hazard) and
    ``generated_at``/a timestamp (breaks idempotency — a new asset on every
    re-publish of the same instance).

    What it does NOT promise
    ------------------------

    Stated rather than hidden, because the previous docstring overstated this:

    * It is **not** the value a future upstream ``--target atlas`` export would
      emit (that would carry the real milestone/phase id). The first such export
      of an already-backfilled report creates a second asset rather than
      revising the backfilled one.
    * It is **not** invariant under a *move*: relocating a report inside its
      repo, renaming the repo directory, or switching which anchor rule applies
      (adding/dropping ``--collection``) yields a different key, hence a new
      asset. Two ``--collection`` spellings are still two identities — what is
      fixed is that ``--root``/``--pattern`` no longer are.

    Both are the safe direction of the trade — an extra asset, never a silently
    overwritten one — and both resolve for good once upstream manifests carry
    ``report.instance_key`` (precedence 1). The returned
    :class:`InstanceKeyDerivation` records the inputs on the candidate and in
    the envelope, so a changed key is diagnosable from the plan output instead
    of appearing later as an unexplained duplicate.
    """
    if route in COLLAPSING_ROUTES:
        return None, "not_applicable", None

    from_manifest = manifest_report.get("instance_key")
    if isinstance(from_manifest, (str, int)) and str(from_manifest).strip():
        return str(from_manifest).strip(), "manifest", None
    if override is not None and override.strip():
        return override.strip(), "cli_override", None

    resolved = html_path.resolve()
    anchor: Path | None = None
    anchor_kind = ""
    if collection:
        anchor = _find_named_ancestor(resolved.parent, collection)
        if anchor is not None:
            anchor_kind = "collection_dir"
    if anchor is None:
        anchor = _find_repo_root(resolved.parent)
        if anchor is not None:
            anchor_kind = "repo_root"
    if anchor is None:
        return None, "underivable", None

    prefix = collection or anchor.name
    relative_path = _relative_report_id(anchor, resolved)
    value = "/".join(part for part in (prefix, relative_path) if part)
    if not value:
        return None, "underivable", None

    return (
        value,
        f"derived_from_{anchor_kind}",
        InstanceKeyDerivation(
            anchor_kind=anchor_kind,
            anchor_path=str(anchor),
            collection=prefix,
            relative_path=relative_path,
        ),
    )


def _link_identity(route: str, subject: str, instance_key: str | None) -> str | None:
    """Mirror of ``delivery_report.py::compute_link_identity``.

    A recurring route with no ``instance_key`` yields ``None``, never the
    collapsing ``report:{route}:{subject}`` form.
    """
    base = f"report:{route}:{subject}"
    if route in COLLAPSING_ROUTES:
        return base
    return f"{base}:{instance_key}" if instance_key else None


def _tracker_links(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract ``tracker_links[]`` exactly as ``build_export`` does."""
    out: list[dict[str, Any]] = []
    for item in manifest.get("items") or []:
        if not isinstance(item, dict):
            continue
        handoff = item.get("handoff") or {}
        if isinstance(handoff, dict) and handoff.get("tracker"):
            out.append(
                {
                    "item": item.get("id"),
                    "tracker": handoff["tracker"],
                    "kind": item.get("kind"),
                }
            )
    return out


def _advisory_tracker_warnings(tracker_links: list[dict[str, Any]]) -> list[str]:
    """Flag trackers that ``import_report`` will reject, so a dry run says so.

    Advisory only — ``ImportService`` owns the authoritative check and aborts
    the ingest with no asset created. Surfacing it here turns an apply-time
    hard failure into something visible before the operator commits.
    """
    warnings: list[str] = []
    for entry in tracker_links:
        tracker = entry.get("tracker")
        if not isinstance(tracker, str) or not tracker.strip():
            warnings.append(f"tracker_links[{entry.get('item')!r}] has a blank tracker")
            continue
        head = _ADVISORY_TRACKER_SEP_RE.split(tracker.strip(), maxsplit=1)[0].strip()
        if not _ADVISORY_TRACKER_RE.match(head):
            warnings.append(
                f"tracker_links[{entry.get('item')!r}] tracker {tracker!r} does not "
                "look like 'node_<id>'/'tree_<id>' — ingest will reject it"
            )
    return warnings


def build_envelope(
    *,
    manifest: dict[str, Any],
    manifest_path: Path,
    html_path: Path,
    instance_key: str | None,
    derivation: InstanceKeyDerivation | None = None,
) -> dict[str, Any]:
    """Synthesize the writeback envelope from a delivery-report manifest.

    Field-for-field mirror of ``delivery_report.py::build_export`` (18 keys:
    the 16 verified in ``implementation-notes.md`` plus the ``instance_key`` /
    ``link_identity`` pair added by PF-3 OQ-5). ``manifest_path`` / ``html_path``
    are absolute local paths, matching the emitter — ingest takes the HTML as a
    file argument and does not fetch them.

    Plus exactly one backfill-only, additive field:
    ``instance_key_derivation`` — the inputs a *derived* ``instance_key`` came
    from (``None`` when the key came from the manifest, from ``--instance-key``,
    or does not apply). ``import_report`` builds asset metadata from an explicit
    allowlist of envelope keys, so this one is ignored by the ingest and is
    never stored on the asset; it exists to make the derivation visible in the
    plan / ``--json`` output, where a drift in identity inputs can be spotted
    before it becomes a duplicate asset.
    """
    report = manifest.get("report") or {}
    route = str(report.get("route"))
    subject = report.get("subject") or report.get("project")
    tracker_links = _tracker_links(manifest)
    return {
        "envelope_version": ENVELOPE_VERSION,
        "artifact_type": ENVELOPE_ARTIFACT_TYPE,
        "target": EXPORT_TARGET,
        "route": route,
        "title": report.get("title"),
        "subject": subject,
        "instance_key": instance_key,
        "instance_key_derivation": derivation.to_dict() if derivation else None,
        "link_identity": _link_identity(route, str(subject), instance_key),
        "revision": report.get("revision"),
        "truth_status": report.get("truth_status"),
        "generated_from": report.get("generated_from"),
        "generated_by": report.get("generated_by"),
        "generated_at": report.get("generated_at"),
        "manifest_path": str(manifest_path.resolve()),
        "html_path": str(html_path.resolve()),
        "tracker_links": tracker_links,
        "item_count": len(manifest.get("items") or []),
    }


def discover(
    root: Path,
    *,
    pattern: str = DEFAULT_PATTERN,
    collection: str | None = None,
    instance_key: str | None = None,
    allow_prose_subject: bool = False,
) -> list[Candidate]:
    """Find every rendered-report HTML under *root* and classify it.

    Pure: reads candidate files and their manifests, constructs no service,
    writes nothing.

    *root* and *pattern* select **which** files are considered and nothing else.
    In particular they are not inputs to ``instance_key`` derivation (see
    :func:`_resolve_instance_key`), so two invocations that reach the same file
    by different spellings classify it identically.
    """
    candidates: list[Candidate] = []

    for html_path in sorted(p for p in root.glob(pattern) if p.is_file()):
        cand = Candidate(key=candidate_key(root, html_path), html_path=html_path)
        candidates.append(cand)

        twin = _colliding_report_node(html_path)
        if twin is not None:
            cand.skip_reason = "ambiguous_report_node"
            cand.skip_detail = (
                f"two files share the report node {cand.key!r}: this one and "
                f"{twin}. ``<dir>/index.html`` and ``<dir>.html`` derive one "
                "instance_key and one selector for two distinct reports, so "
                "ingesting either would let it revise the other, and --select "
                f"{cand.key!r} cannot say which was meant. Rename one of the two "
                "files. Refusing rather than picking: a wrong identity is worse "
                "than none."
            )
            continue

        manifest_path = find_manifest(html_path)
        if manifest_path is None:
            cand.skip_reason = "no_manifest"
            sidecar = html_path.with_suffix(".capsule.yaml")
            if sidecar.is_file():
                cand.skip_detail = (
                    f"no delivery-report manifest; {sidecar.name} is an "
                    "html_capsule sidecar (a different schema — no route/"
                    "subject/truth_status), so an envelope cannot be "
                    "synthesized from it without inventing a mapping"
                )
            else:
                cand.skip_detail = (
                    f"expected {html_path.stem}.{MANIFEST_BASENAME} beside it"
                    + (
                        f", or {MANIFEST_BASENAME} in {html_path.parent.name}/"
                        if html_path.stem == "index"
                        else ""
                    )
                )
            continue
        cand.manifest_path = manifest_path

        manifest, reason, detail = _load_manifest(manifest_path)
        if manifest is None:
            cand.skip_reason = reason
            cand.skip_detail = detail
            continue

        report = manifest.get("report")
        if not isinstance(report, dict):
            cand.skip_reason = "manifest_missing_report_block"
            cand.skip_detail = "manifest has no 'report' object"
            continue

        route = report.get("route")
        if not (isinstance(route, str) and route.strip()):
            cand.skip_reason = "no_route"
            cand.skip_detail = "manifest report.route is absent or blank"
            continue
        route = route.strip()
        if route not in ALL_ROUTES:
            cand.skip_reason = "unknown_route"
            cand.skip_detail = (
                f"report.route {route!r} is not one of {sorted(ALL_ROUTES)}"
            )
            continue

        subject = report.get("subject") or report.get("project")
        if not (isinstance(subject, str) and subject.strip()):
            cand.skip_reason = "no_subject"
            cand.skip_detail = "manifest report.subject/report.project is absent or blank"
            continue
        subject = subject.strip()

        if not _slug_like(subject):
            # Prose subject (e.g. "AOS and cross-project portfolio · August
            # 3-8, 2026"). ImportService links subject as a project/feature
            # target id, so a prose value would become a bogus link target.
            # Skip loudly by default; --allow-prose-subject is the deliberate
            # opt-in. Never silently mangled (no slugification, no truncation).
            if not allow_prose_subject:
                cand.skip_reason = "prose_subject"
                cand.skip_detail = (
                    f"report.subject {subject!r} is prose, not a slug — it would "
                    "become the id of a feature/project AssetLink. Re-run with "
                    "--allow-prose-subject to ingest it verbatim, or give the "
                    "manifest a slug subject upstream."
                )
                continue
            cand.warnings.append(
                f"subject {subject!r} is prose, not a slug — ingested verbatim "
                "under --allow-prose-subject; its AssetLink target id will be "
                "this whole string"
            )

        resolved_key, source, derivation = _resolve_instance_key(
            route=route,
            manifest_report=report,
            html_path=html_path,
            collection=collection,
            override=instance_key,
        )
        if source == "underivable":
            cand.skip_reason = "instance_key_underivable"
            cand.skip_detail = (
                f"route {route!r} recurs, so its identity needs a per-instance "
                "instance_key, and none could be derived: the source file has no "
                "repository ancestor (no .git) and no ancestor directory matches "
                "--collection. Supply --instance-key, pass a --collection naming "
                "one of its ancestor directories, or add report.instance_key "
                "upstream. Refusing to fall back to a scan-root-relative path: "
                "that would make identity a function of how this script was "
                "invoked, so a re-run spelled differently would duplicate the "
                "asset instead of revising it."
            )
            continue
        cand.instance_key_source = source
        cand.instance_key_derivation = derivation.to_dict() if derivation else None
        cand.envelope = build_envelope(
            manifest=manifest,
            manifest_path=manifest_path,
            html_path=html_path,
            instance_key=resolved_key,
            derivation=derivation,
        )
        cand.warnings.extend(_advisory_tracker_warnings(cand.envelope["tracker_links"]))

    return candidates


def _selector_names(cand: Candidate) -> set[str]:
    """The names a ``--select`` value may use to name *cand*.

    One definition, shared by :func:`mark_selection` (which matches on it) and
    the ``--json`` refusal block (which reports *which* selectors were
    un-ingestable), so the two can never disagree about what named what.
    """
    subject = (cand.envelope or {}).get("subject")
    return {cand.key} | ({subject} if isinstance(subject, str) else set())


def mark_selection(
    candidates: list[Candidate], *, select: list[str] | None, select_all: bool
) -> list[str]:
    """Flag which candidates a selection targets. Returns unmatched selectors.

    A selector matches a candidate's ``key`` or its envelope ``subject``.
    """
    if select_all:
        for cand in candidates:
            cand.selected = cand.ingestable
        return []

    wanted = set(select or [])
    matched: set[str] = set()
    for cand in candidates:
        hit = _selector_names(cand) & wanted
        if hit:
            matched |= hit
            cand.selected = True
    return sorted(wanted - matched)


def uningestable_selection(candidates: list[Candidate]) -> list[Candidate]:
    """Candidates a selector named that can never be ingested.

    An unmatched selector is already a usage error; a selector that matched a
    *skipped* candidate used to be worse than that — silently benign. It set
    ``selected=True`` on a candidate :func:`apply_candidates` then filtered out,
    so ``--apply --select <skipped-key>`` printed
    ``Done: 0 ingested/revised, 0 failed.`` and exited **0**: an operator who
    named exactly one report was told the run succeeded while nothing had been
    ingested, and nothing in the exit code distinguished that from a real
    ingest. Naming a report explicitly is a claim that it can be ingested, so a
    non-empty result here is a usage error (exit 2) rather than a quiet no-op.

    ``--all`` cannot trip this: it only ever selects ingestable candidates.
    """
    return [c for c in candidates if c.selected and not c.ingestable]


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def print_plan(candidates: list[Candidate], *, apply_mode: bool, stream: Any) -> None:
    """Human-readable plan. In dry-run mode this is the whole output."""
    mode = "APPLY" if apply_mode else "DRY RUN (default) — nothing will be written"
    print(f"=== delivery-report backfill — {mode} ===", file=stream)
    print(
        f"{len(candidates)} candidate(s) discovered; "
        f"{sum(1 for c in candidates if c.ingestable)} ingestable; "
        f"{sum(1 for c in candidates if c.selected)} selected",
        file=stream,
    )
    print(
        "sensitivity/agent_access: NOT overridden — ingest defaults apply "
        "(workspace default, floored to never-public; agent_access="
        "preview_allowed)",
        file=stream,
    )
    print(
        "source files are canonical (D-018): read-only, never moved/rewritten",
        file=stream,
    )

    for cand in candidates:
        print("", file=stream)
        # A non-ingestable candidate is labelled SKIP even when a selector named
        # it: labelling it [SELECTED] directly above its own SKIPPED line (as an
        # earlier version did) implied it was about to be ingested when it never
        # could be. Naming it explicitly is a usage error at apply time — see
        # ``uningestable_selection`` — so the plan must not suggest otherwise.
        if not cand.ingestable:
            flag = "SKIP (named by --select)" if cand.selected else "SKIP"
        else:
            flag = "SELECTED" if cand.selected else "READY"
        print(f"--- [{flag}] {cand.key}", file=stream)
        print(f"    source html:  {cand.html_path}", file=stream)
        print(f"    manifest:     {cand.manifest_path or '(none found)'}", file=stream)
        if not cand.ingestable:
            print(f"    SKIPPED:      {cand.skip_reason}", file=stream)
            if cand.skip_detail:
                print(f"    reason:       {cand.skip_detail}", file=stream)
            continue
        print(f"    instance_key: {cand.instance_key_source}", file=stream)
        if cand.instance_key_derivation:
            print(
                f"    derived from: {cand.instance_key_derivation['anchor_kind']} "
                f"{cand.instance_key_derivation['anchor_path']} "
                f"(+ {cand.instance_key_derivation['relative_path'] or '.'})",
                file=stream,
            )
        for warning in cand.warnings:
            print(f"    WARNING:      {warning}", file=stream)
        print("    envelope it would emit:", file=stream)
        rendered = json.dumps(cand.envelope, indent=2, ensure_ascii=False)
        for line in rendered.splitlines():
            print(f"      {line}", file=stream)


# ---------------------------------------------------------------------------
# Apply
# ---------------------------------------------------------------------------


def _build_import_service(registry_dir: Path | None):
    """Construct the one ingest service. Only ever called under ``--apply``."""
    from app.services.audit import AuditService
    from app.services.import_index import ImportService
    from app.settings import get_settings

    reg = registry_dir or get_settings().registry_dir
    return ImportService(reg, audit_service=AuditService(reg))


def apply_candidates(
    candidates: list[Candidate],
    *,
    registry_dir: Path | None = None,
    project: str | None = None,
    sensitivity: str | None = None,
    on_duplicate: str = DEFAULT_ON_DUPLICATE,
    actor_id: str = "backfill",
    stream: Any = sys.stdout,
) -> tuple[int, int]:
    """Ingest every selected candidate. Returns ``(succeeded, failed)``.

    Each candidate goes through ``ImportService.import_report`` — the one ingest
    path. ``sensitivity`` is forwarded only when the operator set it explicitly
    (``None`` means "use the ingest defaults", per DI-Sensitivity). See
    :data:`DEFAULT_ON_DUPLICATE` for why hash-duplicate handling is
    ``create_new`` here.

    **No single candidate can abort the sweep.** Every exception from
    ``import_report`` is caught per candidate, reported as its own ``FAILED``
    line, and the loop continues; the caller then exits non-zero. A narrower
    catch (this used to be ``ImportError``/``OSError`` only) meant an unforeseen
    error mid-sweep propagated as a traceback: the candidates after it were never
    attempted, and the operator was left with a partially-applied backfill and no
    summary of what had landed. ``Exception`` is the right width — ``BaseException``
    is deliberately not caught, so Ctrl-C and ``SystemExit`` still stop the run
    immediately.
    """
    from app.services.import_index import ImportError as ReportIngestError

    selected = [c for c in candidates if c.selected and c.ingestable]
    if not selected:
        return 0, 0

    import_svc = _build_import_service(registry_dir)
    succeeded = failed = 0

    for cand in selected:
        try:
            result = import_svc.import_report(
                cand.html_path,
                cand.envelope or {},
                project_id=project or None,
                sensitivity=sensitivity or None,
                on_duplicate=on_duplicate,
                actor_id=actor_id,
            )
        except ReportIngestError as exc:
            # The expected, well-typed rejection (bad tracker, unknown project,
            # missing file) — reported without a type prefix because the message
            # already reads as an ingest refusal.
            failed += 1
            print(f"FAILED  {cand.key}: {exc}", file=stream)
            continue
        except Exception as exc:  # noqa: BLE001 - see the docstring: one bad
            # candidate must never abort the sweep. Anything unforeseen (an
            # OSError on the source file, a registry/JSONL fault, a bug) is
            # surfaced per candidate with its type so it is still diagnosable,
            # and the remaining candidates are still attempted.
            failed += 1
            print(f"FAILED  {cand.key}: {type(exc).__name__}: {exc}", file=stream)
            continue

        succeeded += 1
        asset = result.asset
        if result.is_duplicate:
            verb = "unchanged"
        elif result.duplicate_of:
            verb = "revised"
        else:
            verb = "ingested"
        print(f"{verb.upper():9s} {cand.key} -> {asset.id}", file=stream)

    return succeeded, failed


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def _plan_document(
    *,
    mode: str,
    root: Path,
    pattern: str,
    candidates: list[Candidate],
    refusal: dict[str, Any] | None,
) -> dict[str, Any]:
    """The ``--json`` document.

    ``refusal`` is always present — ``None`` when the run was not refused — so a
    machine consumer branches on one stable key rather than on stdout being
    empty. It used to *be* empty: the ``uningestable_selection`` refusal returned
    2 before this document was emitted, so ``--apply --json`` handed a consumer a
    zero-byte stdout and the reason only in human-readable stderr.
    """
    return {
        "mode": mode,
        "root": str(root),
        "pattern": pattern,
        "refusal": refusal,
        "candidates": [c.to_dict() for c in candidates],
    }


def _emit_plan_json(document: dict[str, Any], stream: Any) -> None:
    print(json.dumps(document, indent=2, ensure_ascii=False), file=stream)


def _split_selectors(values: Sequence[str] | None) -> list[str]:
    """``--select a,b --select c`` -> ``["a", "b", "c"]``."""
    out: list[str] = []
    for raw in values or []:
        out.extend(part.strip() for part in raw.split(",") if part.strip())
    return out


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="backfill_reports.py",
        description=(
            "Backfill already-rendered delivery reports into Atlas via "
            "ImportService.import_report. Dry run is the DEFAULT; ingesting "
            "requires --apply plus --all or --select."
        ),
        epilog=(
            "Source files are canonical (D-018) and are only ever read. "
            "Sensitivity is not overridden unless --sensitivity is given."
        ),
    )
    parser.add_argument("root", help="Directory to scan for rendered report HTML.")
    parser.add_argument(
        "--pattern",
        default=DEFAULT_PATTERN,
        help=(
            f"Glob (relative to root) for rendered HTML. Default: {DEFAULT_PATTERN!r} "
            "— scans broadly on purpose so files with no manifest show up as "
            "explicit skips rather than vanishing."
        ),
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--dry-run",
        dest="dry_run",
        action="store_true",
        default=True,
        help="Print the plan and exit without writing (DEFAULT).",
    )
    mode.add_argument(
        "--apply",
        dest="dry_run",
        action="store_false",
        help="Actually ingest. Requires --all or --select.",
    )
    parser.add_argument(
        "--select",
        action="append",
        metavar="KEYS",
        help=(
            "Comma-separated candidate keys (or manifest subjects) to ingest. "
            "Repeatable."
        ),
    )
    parser.add_argument(
        "--all",
        dest="select_all",
        action="store_true",
        help="Ingest every ingestable candidate. Must be explicit.",
    )
    parser.add_argument(
        "--collection",
        help=(
            "Prefix for a derived instance_key, and — when an ancestor directory "
            "of the report is named exactly this — the directory the rest of the "
            "key is measured from (so '--collection aos-atlas' gives "
            "'aos-atlas/<slug>' wherever the scan started). There is deliberately "
            "NO default: the scan root's name is not used, because that would "
            "make report identity depend on how the scan was spelled. Omitted, "
            "the anchor is the containing repository root and the prefix is its "
            "directory name."
        ),
    )
    parser.add_argument(
        "--instance-key",
        dest="instance_key",
        help=(
            "Override the per-instance discriminator for recurring routes "
            "(program/phase/readiness). A manifest's own report.instance_key "
            "still wins. Intended for a single-candidate run."
        ),
    )
    parser.add_argument(
        "--allow-prose-subject",
        dest="allow_prose_subject",
        action="store_true",
        help=(
            "Ingest candidates whose report.subject is prose rather than a "
            "slug. Off by default: such a subject becomes an AssetLink target "
            "id verbatim."
        ),
    )
    parser.add_argument("--project", help="Project slug or id to scope assets to.")
    parser.add_argument(
        "--sensitivity",
        help=(
            "Override the ingest sensitivity default. Omit to inherit the "
            "existing defaults (recommended — see DI-Sensitivity)."
        ),
    )
    parser.add_argument(
        "--on-duplicate",
        dest="on_duplicate",
        choices=["create_new", "return_existing", "link"],
        default=DEFAULT_ON_DUPLICATE,
        help=(
            "Hash-match handling on a first ingest, forwarded to "
            f"import_report. Default: {DEFAULT_ON_DUPLICATE!r} — two distinct "
            "reports that render byte-identical HTML are still two reports "
            "and must not collapse onto one asset. Re-run idempotence comes "
            "from the (route, subject, instance_key) identity lookup, not from "
            "this flag."
        ),
    )
    parser.add_argument(
        "--registry",
        help="Registry directory override (default: the app's configured one).",
    )
    parser.add_argument(
        "--json",
        dest="as_json",
        action="store_true",
        help="Emit the plan as JSON instead of text.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    out = sys.stdout

    root = Path(args.root).expanduser()
    if not root.is_dir():
        print(f"ERROR: root is not a directory: {root}", file=sys.stderr)
        return 2

    selectors = _split_selectors(args.select)
    if not args.dry_run and not (args.select_all or selectors):
        print(
            "ERROR: --apply requires an explicit selection: pass --all or "
            "--select <keys>. Refusing to ingest every discovered report "
            "implicitly.",
            file=sys.stderr,
        )
        return 2
    if args.select_all and selectors:
        print("ERROR: pass either --all or --select, not both.", file=sys.stderr)
        return 2

    candidates = discover(
        root,
        pattern=args.pattern,
        collection=args.collection,
        instance_key=args.instance_key,
        allow_prose_subject=args.allow_prose_subject,
    )

    # In a dry run with no selection, everything ingestable is shown as READY
    # so the operator can see the full plan before choosing.
    unmatched = mark_selection(
        candidates, select=selectors, select_all=args.select_all
    )
    if unmatched:
        print(
            f"ERROR: no candidate matched: {', '.join(unmatched)}",
            file=sys.stderr,
        )
        return 2

    # A selector that named a candidate which cannot be ingested. In apply mode
    # this is a usage error (exit 2) rather than a 0-exit no-op — see
    # ``uningestable_selection``. In a dry run it is informational: the point of
    # a dry run is to show why, so it is noted and the plan still prints.
    blocked = uningestable_selection(candidates)
    if blocked:
        for cand in blocked:
            print(
                f"{'ERROR' if not args.dry_run else 'NOTE'}: --select named "
                f"{cand.key!r}, which cannot be ingested: {cand.skip_reason}"
                + (f" — {cand.skip_detail}" if cand.skip_detail else ""),
                file=sys.stderr,
            )
        if not args.dry_run:
            message = (
                "refusing to ingest — an explicitly selected report that cannot "
                "be ingested is a usage error, not a silent no-op. Drop it from "
                "--select, or address the skip reason above. Nothing was "
                "ingested: the refusal covers the whole run, including any "
                "selected candidate that could have been ingested on its own."
            )
            print(f"ERROR: {message}", file=sys.stderr)
            # --json is a machine contract, so this path owes a document too —
            # exit 2 plus an empty stdout is indistinguishable from a crash.
            # Text mode keeps its existing shape: the reason is on stderr and
            # stdout stays clear of a plan for a run that will not happen.
            if args.as_json:
                _emit_plan_json(
                    _plan_document(
                        mode="apply",
                        root=root,
                        pattern=args.pattern,
                        candidates=candidates,
                        refusal={
                            "reason": "uningestable_selection",
                            "message": message,
                            "candidates": [
                                {
                                    "key": bad.key,
                                    "html_path": str(bad.html_path),
                                    "selectors": sorted(
                                        _selector_names(bad) & set(selectors)
                                    ),
                                    "skip_reason": bad.skip_reason,
                                    "skip_detail": bad.skip_detail,
                                }
                                for bad in blocked
                            ],
                        },
                    ),
                    out,
                )
            return 2

    if args.as_json:
        _emit_plan_json(
            _plan_document(
                mode="dry_run" if args.dry_run else "apply",
                root=root,
                pattern=args.pattern,
                candidates=candidates,
                refusal=None,
            ),
            out,
        )
    else:
        print_plan(candidates, apply_mode=not args.dry_run, stream=out)

    if args.dry_run:
        if not args.as_json:
            print("", file=out)
            print("Dry run complete — nothing was written.", file=out)
        return 0

    print("", file=out)
    succeeded, failed = apply_candidates(
        candidates,
        registry_dir=Path(args.registry).expanduser() if args.registry else None,
        project=args.project,
        sensitivity=args.sensitivity,
        on_duplicate=args.on_duplicate,
        stream=out,
    )
    print(f"Done: {succeeded} ingested/revised, {failed} failed.", file=out)
    return 1 if failed else 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
