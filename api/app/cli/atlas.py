"""Atlas CLI entrypoint (CLI-001).

Run as:
    python3 -m app.cli.atlas <subcommand> [args]

All subcommands call the service layer — no parallel logic.

Subcommands:
    init                    Initialise workspace config check.
    import <path>           Import a local file asset.
    index <project-slug>    List indexed assets for a project.
    inbox list              List inbox assets.
    asset classify <id>     Set sensitivity/agent_access on an asset.
    asset link <id>         Link an asset to a target.
    report ingest <html>    Ingest a delivery-report HTML + writeback envelope (PF-1 M1).
    bom status <project>    Show BOM coverage summary for a project.
    bom gaps <project>      List BOM gap recommendations.
    bom assign <slot> <asset>  Assign asset to BOM slot.
    pack build              Draft a context pack (--project + optional flags).
    pack export <pack-id>   Export a context pack YAML to disk.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Lazy service bootstrap — resolved once per CLI run
# ---------------------------------------------------------------------------


def _get_services(registry_dir: Path | None = None) -> dict[str, Any]:
    """Return a dict of initialised services using settings or override dir."""
    from app.settings import get_settings
    from app.services.assets import AssetService
    from app.services.audit import AuditService
    from app.services.bom_service import BomService
    from app.services.context_pack_service import ContextPackService
    from app.services.import_index import ImportService
    from app.services.policy import PolicyService
    from app.services.projects import ProjectService

    settings = get_settings()
    reg = registry_dir or settings.registry_dir
    cp_dir = settings.context_packs_dir

    audit = AuditService(reg)
    policy = PolicyService(
        agent_full_content_sensitivity_cap=settings.agent_full_content_sensitivity_cap,
        automated_promotion_allowed=settings.automated_promotion_allowed,
    )

    return {
        "settings": settings,
        "registry_dir": reg,
        "audit": audit,
        "policy": policy,
        "assets": AssetService(reg, audit_service=audit, policy_service=policy),
        "projects": ProjectService(reg),
        "import_svc": ImportService(reg, audit_service=audit),
        "bom": BomService(reg),
        "context_packs": ContextPackService(
            reg, cp_dir, policy_service=policy, audit_service=audit
        ),
    }


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------


def _print_json(obj: Any) -> None:
    print(json.dumps(obj, indent=2, default=str))


def _print_table(rows: list[dict[str, Any]], keys: list[str]) -> None:
    """Print a simple ASCII table for the given keys."""
    if not rows:
        print("(no results)")
        return
    widths = {k: max(len(k), *(len(str(r.get(k, ""))) for r in rows)) for k in keys}
    header = "  ".join(k.ljust(widths[k]) for k in keys)
    sep = "  ".join("-" * widths[k] for k in keys)
    print(header)
    print(sep)
    for row in rows:
        print("  ".join(str(row.get(k, "")).ljust(widths[k]) for k in keys))


# ---------------------------------------------------------------------------
# Subcommand handlers
# ---------------------------------------------------------------------------


def cmd_init(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Verify workspace config and registry directories."""
    settings = svcs["settings"]
    reg = svcs["registry_dir"]
    print(f"Workspace:    {settings.workspace_name} ({settings.workspace_id})")
    print(f"Registry dir: {reg}")
    print(f"Exists:       {reg.exists()}")
    print(f"Context packs dir: {settings.context_packs_dir}")
    print("OK")
    return 0


def cmd_import(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Import a local file asset into the registry."""
    import_svc = svcs["import_svc"]
    path = Path(args.path)
    if not path.exists():
        print(f"ERROR: path does not exist: {path}", file=sys.stderr)
        return 1

    if getattr(args, "store", False):
        with open(path, "rb") as fh:
            result = import_svc.import_content(
                path.name,
                fh,
                project_id=args.project or None,
                actor_id="cli",
            )
    else:
        result = import_svc.import_local_path(
            path,
            project_id=args.project or None,
            actor_id="cli",
        )
    verb = "duplicate of" if result.is_duplicate else "imported"
    print(f"Asset {verb}: {result.asset.id}")
    print(f"  Title:       {result.asset.title}")
    print(f"  Status:      {result.asset.status.value if hasattr(result.asset.status, 'value') else result.asset.status}")
    print(f"  Sensitivity: {result.asset.sensitivity.value if hasattr(result.asset.sensitivity, 'value') else result.asset.sensitivity}")
    if result.is_duplicate and result.duplicate_of:
        print(f"  Duplicate of: {result.duplicate_of}")
    return 0


def cmd_attach(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Attach file content to an existing asset."""
    import_svc = svcs["import_svc"]
    path = Path(args.path)
    if not path.exists():
        print(f"ERROR: path does not exist: {path}", file=sys.stderr)
        return 1

    with open(path, "rb") as fh:
        asset = import_svc.attach_content(
            args.asset_id,
            path.name,
            fh,
            actor_id="cli",
        )

    if asset is None:
        print(f"ERROR: asset not found: {args.asset_id}", file=sys.stderr)
        return 1

    storage_uri = getattr(asset, "storage_uri", None) or "N/A"
    print(f"Content attached to asset: {asset.id}")
    print(f"  Storage URI: {storage_uri}")
    return 0


def cmd_index(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """List indexed assets for a project."""
    asset_svc = svcs["assets"]
    assets = asset_svc.list_assets(project_id=args.project or None)
    rows = [
        {
            "id": a.id,
            "title": a.title[:40] if a.title else "",
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "sensitivity": a.sensitivity.value if hasattr(a.sensitivity, "value") else str(a.sensitivity),
        }
        for a in assets
    ]
    print(f"Assets ({len(rows)}):")
    _print_table(rows, ["id", "title", "status", "sensitivity"])
    return 0


def cmd_inbox_list(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """List inbox assets."""
    asset_svc = svcs["assets"]
    assets = asset_svc.list_assets()
    inbox = [a for a in assets if (a.status.value if hasattr(a.status, "value") else str(a.status)) == "inbox"]
    rows = [
        {
            "id": a.id,
            "title": a.title[:40] if a.title else "",
            "sensitivity": a.sensitivity.value if hasattr(a.sensitivity, "value") else str(a.sensitivity),
        }
        for a in inbox
    ]
    print(f"Inbox assets ({len(rows)}):")
    _print_table(rows, ["id", "title", "sensitivity"])
    return 0


def cmd_asset_classify(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Set sensitivity and/or agent_access on an asset."""
    from app.models.asset import AssetUpdate

    asset_svc = svcs["assets"]
    existing = asset_svc.get_asset(args.id)
    if existing is None:
        print(f"ERROR: asset not found: {args.id}", file=sys.stderr)
        return 1

    update = AssetUpdate(
        sensitivity=args.sensitivity or None,
        agent_access=args.agent_access or None,
    )
    updated = asset_svc.update_asset(args.id, update, actor_id="cli")
    if updated is None:
        print("ERROR: update failed", file=sys.stderr)
        return 1
    print(f"Updated asset {updated.id}")
    print(f"  Sensitivity:  {updated.sensitivity.value if hasattr(updated.sensitivity, 'value') else updated.sensitivity}")
    print(f"  Agent access: {updated.agent_access.value if hasattr(updated.agent_access, 'value') else updated.agent_access}")
    return 0


def cmd_asset_link(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Link an asset to a target (node, bom_slot, etc.)."""
    from app.models.asset import AssetLinkCreate
    from app.models.vocabulary import AssetLinkRelationship

    asset_svc = svcs["assets"]
    existing = asset_svc.get_asset(args.id)
    if existing is None:
        print(f"ERROR: asset not found: {args.id}", file=sys.stderr)
        return 1

    link = AssetLinkCreate(
        asset_id=args.id,
        target_type=args.target_type,
        target_id=args.target_id,
        relationship=args.relationship or AssetLinkRelationship.related.value,
    )
    result = asset_svc.create_link(link, actor_id="cli")
    print(f"Linked asset {args.id} -> {args.target_type}:{args.target_id} ({result.relationship.value if hasattr(result.relationship, 'value') else result.relationship})")
    return 0


def _resolve_project_ref(ref: str, svcs: dict[str, Any]) -> Any | None:
    """Resolve a project **slug or id** to its Project, or None if unknown.

    Mirrors ``_find_project_bom``'s slug-or-id tolerance (below) so every CLI
    verb accepts whichever handle the operator happens to have. Report ingest
    resolves here rather than passing the raw string through: ``--project
    artifact-atlas`` used to be stored verbatim as ``project_id`` while the
    real id is ``proj_artifact_atlas``, leaving the asset matched by no project
    page at all.
    """
    projects = svcs["projects"].list_projects()
    return next((p for p in projects if p.id == ref or p.slug == ref), None)


def cmd_report_ingest(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Ingest a rendered delivery-report HTML file + its writeback envelope.

    PF-1 M1 — composes ``ImportService.import_report`` (which itself composes
    ``import_content``, no new storage code). PF-1 M2 — the same call also
    creates ``AssetLink`` rows to the envelope's ``subject`` and every
    ``tracker_links[]`` target, idempotently. Fails loud (nonzero exit, no
    partial asset) on a missing HTML file, a missing/unparsable envelope, a
    malformed envelope shape, an unknown ``--project``, or a
    ``tracker_links[]`` entry naming a wrong/absent/unresolvable target.

    ``subject`` is checked against Atlas's own project registry (by slug),
    but ``tracker_links[]`` targets are validated for *shape* only (does the
    id look like a node/tree id) — not for *existence* against IntentTree,
    the upstream system of record (Atlas has no IntentTree client). See
    ``implementation-notes.md``.

    PF-4 — ``--project`` accepts a slug or an id and is resolved to the
    canonical ``proj_*`` id before ingest (unknown value → nonzero exit, no
    asset). Omitted, the service infers attribution from the envelope
    (``subject``, then ``generated_from.repo``) so the report lands on a
    reachable project page instead of ``project_id=null``.

    ``DI-ByteCollision`` — one case prints ``Report duplicate of: <id>`` for an
    asset that is a *different* report: a first ingest whose HTML is
    byte-identical to an already-stored report of another identity. Two things
    are true there, and both are stated on stderr rather than left to be
    inferred from the field block:

    1. **Nothing is written to the matched asset** — no attribution patch and
       no scope links, both skipped under one guard in ``import_report`` (an
       earlier version gated only the attribution and so leaked this envelope's
       links onto the other report's asset). So every field printed below,
       ``Project:`` and ``Links:`` included, describes the *matched* asset, not
       this envelope.
    2. **This invocation's own report is not stored at all** — ``import_content``
       returns the pre-existing asset rather than creating one, so the report
       just rendered exists nowhere in Atlas. Silence here would be
       indistinguishable from a successful ingest, hence the explicit
       ``WARNING: report NOT stored`` lines.

    The exit code on that path stays **0**, deliberately: a byte collision is
    not an operator input error, and callers script against the exit status.
    The warning, not the status, is what carries the signal.
    """
    from app.services.import_index import ImportError as ReportIngestError

    html_path = Path(args.html)
    if not html_path.exists():
        print(f"ERROR: report HTML file does not exist: {html_path}", file=sys.stderr)
        return 1

    envelope_path = Path(args.envelope)
    if not envelope_path.exists():
        print(f"ERROR: envelope file does not exist: {envelope_path}", file=sys.stderr)
        return 1

    try:
        raw = envelope_path.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"ERROR: could not read envelope file: {exc}", file=sys.stderr)
        return 1

    try:
        envelope = json.loads(raw)
    except ValueError as exc:
        print(f"ERROR: envelope is not valid JSON: {exc}", file=sys.stderr)
        return 1
    if not isinstance(envelope, dict):
        print("ERROR: envelope JSON must be an object.", file=sys.stderr)
        return 1

    # PF-4: resolve --project (slug OR id) up front so the operator gets a
    # CLI-shaped error, and so only a canonical proj_* id ever reaches the
    # service. The service revalidates independently — HTTP/MCP callers never
    # pass through here.
    project_ref = (args.project or "").strip()
    resolved_project_id: str | None = None
    if project_ref:
        project = _resolve_project_ref(project_ref, svcs)
        if project is None:
            print(f"ERROR: project not found: {project_ref}", file=sys.stderr)
            return 1
        resolved_project_id = project.id

    import_svc = svcs["import_svc"]
    try:
        result = import_svc.import_report(
            html_path,
            envelope,
            project_id=resolved_project_id,
            sensitivity=args.sensitivity or None,
            actor_id="cli",
        )
    except ReportIngestError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    asset = result.asset
    if result.is_duplicate:
        verb = "duplicate of"
    elif result.duplicate_of:
        # M3: same stable asset id, blob revised in place (not a fresh ingest).
        verb = "revised"
    else:
        verb = "ingested"
    meta = asset.metadata or {}
    print(f"Report {verb}: {asset.id}")
    if result.matched_other_report:
        # DI-ByteCollision. Printed here, immediately under the header, so the
        # field block below is read in context: those fields belong to the
        # matched asset. stderr (like every other diagnostic in this file) and
        # exit 0 (see the docstring) -- so this warning is the ONLY thing
        # distinguishing "your report is hosted" from "your report does not
        # exist in Atlas".
        #
        # Flush stdout first: when stdout is a pipe it is block-buffered while
        # stderr is not, so without this the warning overtakes the header line
        # and "the details below" names the wrong lines.
        sys.stdout.flush()
        print(
            "WARNING: report NOT stored. Its HTML is byte-identical to "
            f"already-stored report {asset.id} "
            f"({asset.title!r}, route={meta.get('route')!r}, "
            f"subject={meta.get('subject')!r}, "
            f"instance_key={meta.get('instance_key')!r}) — a DIFFERENT report.",
            file=sys.stderr,
        )
        print(
            "WARNING: no asset was created for this ingest and nothing was "
            f"written to {asset.id} (no attribution, no scope links). The "
            f"report just rendered is not hosted in Atlas; the details below "
            f"describe {asset.id}. Re-ingest once the two reports' HTML "
            f"actually differs — or, if it IS the same report, under the "
            f"identity {asset.id} already carries.",
            file=sys.stderr,
        )
    print(f"  Title:        {asset.title}")
    print(f"  Route:        {meta.get('route')}")
    print(f"  Subject:      {meta.get('subject')}")
    print(f"  Type:         {asset.artifact_type_id}")
    # PF-4: attribution is what makes the report reachable from a project page,
    # so surface it (and its absence) rather than leaving it silent.
    print(f"  Project:      {asset.project_id or '(unattributed)'}")
    print(f"  Workspace:    {asset.workspace_id or '(none)'}")
    print(f"  Status:       {asset.status.value if hasattr(asset.status, 'value') else asset.status}")
    print(f"  Sensitivity:  {asset.sensitivity.value if hasattr(asset.sensitivity, 'value') else asset.sensitivity}")
    print(f"  Agent access: {asset.agent_access.value if hasattr(asset.agent_access, 'value') else asset.agent_access}")
    # Origin-qualified ABSOLUTE url, not a relative path: the intenttree
    # consumer (PF-2, shipped) rejects any report url that does not start
    # http(s):// -- `itt link report` raises BadParameter and its UI gates the
    # anchor on the same regex. Override the origin with ATLAS_PUBLIC_BASE_URL.
    from app.settings import get_settings

    # rstrip here as well as in Settings.__init__: the value can also arrive
    # from a directly-assigned settings object (e.g. test fixtures), which never
    # runs __init__'s normalisation.
    base = (get_settings().public_base_url or "").rstrip("/")
    print(f"  Preview URL:  {base}/api/preview/asset/{asset.id}/html")

    links = svcs["assets"].list_links(asset.id)
    print(f"  Links ({len(links)}):")
    for link in links:
        target_type = link.target_type.value if hasattr(link.target_type, "value") else link.target_type
        print(f"    - {target_type}:{link.target_id}")
    return 0


def _find_project_bom(project_slug: str, svcs: dict[str, Any]) -> Any | None:
    """Look up project by slug, then return its BOM or None."""
    project_svc = svcs["projects"]
    bom_svc = svcs["bom"]

    projects = project_svc.list_projects()
    project = next(
        (p for p in projects if p.slug == project_slug or p.id == project_slug),
        None,
    )
    if project is None:
        return None, None

    bom = bom_svc.get_bom_for_project(project.id)
    return project, bom


def cmd_bom_status(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Show BOM coverage summary for a project."""
    from app.repositories.bom import BomRepository
    from app.services.coverage import calculate_coverage

    project, bom = _find_project_bom(args.project, svcs)
    if project is None:
        print(f"ERROR: project not found: {args.project}", file=sys.stderr)
        return 1
    if bom is None:
        print(f"No BOM found for project {project.id}. Run 'bom apply-template' first.")
        return 0

    bom_repo = BomRepository(svcs["registry_dir"])
    slots = bom_repo.list_slots(bom.id)
    assignments = bom_repo.list_assignments(bom.id)
    summary = calculate_coverage(slots)

    print(f"BOM Coverage: {project.name} ({project.slug})")
    print(f"  BOM ID:          {bom.id}")
    print(f"  Coverage score:  {summary.coverage_score:.1%}")
    print(f"  Total slots:     {summary.total_slots}")
    print(f"  Required slots:  {summary.required_slots or 0}")
    print(f"  Filled slots:    {summary.filled_slots}")
    print(f"  Missing slots:   {summary.missing_slots}")
    print(f"  Partial slots:   {summary.partial_slots or 0}")
    print(f"  Stale slots:     {summary.stale_slots}")
    return 0


def cmd_bom_gaps(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """List BOM gap recommendations for a project (suggestion payloads only)."""
    project, bom = _find_project_bom(args.project, svcs)
    if project is None:
        print(f"ERROR: project not found: {args.project}", file=sys.stderr)
        return 1
    if bom is None:
        print(f"No BOM found for project {project.id}.")
        return 0

    bom_svc = svcs["bom"]
    result = bom_svc.get_gap_recommendations(bom.id)
    recs = result.recommendations
    if not recs:
        print("No gaps found.")
        return 0

    print(f"BOM Gaps ({len(recs)}) — suggestion payloads only; no tasks created:")
    rows = [
        {
            "slot_id": g.slot_id[:20],
            "domain": g.slot_domain or "",
            "reason": g.gap_reason,
            "priority": g.priority,
            "action": (g.action or "")[:50],
        }
        for g in recs
    ]
    _print_table(rows, ["slot_id", "domain", "reason", "priority", "action"])
    return 0


def cmd_bom_assign(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Assign an asset to a BOM slot."""
    from app.models.vocabulary import AssignmentStatus

    bom_svc = svcs["bom"]
    try:
        result = bom_svc.assign_asset(
            args.slot_id,
            args.asset_id,
            assignment_status=AssignmentStatus.accepted,
            confidence=args.confidence or 1.0,
            assigned_by="cli",
        )
        print(f"Assigned asset {args.asset_id} to slot {args.slot_id}")
        print(f"  Assignment ID: {result.assignment.id}")
        print(f"  Status: {result.assignment.status.value if hasattr(result.assignment.status, 'value') else result.assignment.status}")
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


def _pack_export_dispatch(
    cp_svc: Any,
    pack_id: str,
    *,
    out_path: Path | None,
    fmt: str,
    actor_id: str = "cli",
) -> Path:
    """Call the appropriate export method based on format."""
    if fmt == "markdown":
        return cp_svc.export_markdown(pack_id, output_path=out_path, actor_id=actor_id)
    return cp_svc.export_yaml(pack_id, output_path=out_path, actor_id=actor_id)


def cmd_pack_build(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Draft a context pack for a project or node, and optionally export it."""
    from app.models.context_pack import ContextPackCreate
    from app.models.vocabulary import ContextPackAudience, ContextPackTargetType

    cp_svc = svcs["context_packs"]
    fmt = getattr(args, "format", "yaml") or "yaml"

    if args.node:
        # Build from IntentTree node ref
        project_id = args.project or "unknown"
        pack = cp_svc.create_from_node(
            node_id=args.node,
            project_id=project_id,
            title=args.title or None,
            actor_id="cli",
        )
    else:
        # Build from project
        project_svc = svcs["projects"]
        project_slug = args.project or "unknown"
        projects = project_svc.list_projects()
        project = next(
            (p for p in projects if p.slug == project_slug or p.id == project_slug),
            None,
        )
        project_id = project.id if project else project_slug

        create_data = ContextPackCreate(
            title=args.title or f"Context pack for {project_slug}",
            target_type=ContextPackTargetType.project,
            target_id=project_id,
            audience=args.audience or ContextPackAudience.agent,
            sensitivity=args.sensitivity or "personal",
            instructions=args.instructions or None,
        )
        pack = cp_svc.create(project_id, create_data, actor_id="cli")

    print(f"Draft context pack created: {pack.id}")
    print(f"  Title:  {pack.title}")
    print(f"  Status: {pack.status.value if hasattr(pack.status, 'value') else pack.status}")

    if args.out:
        out_path = Path(args.out)
        exported = _pack_export_dispatch(cp_svc, pack.id, out_path=out_path, fmt=fmt)
        print(f"  Exported ({fmt}) to: {exported}")

    return 0


def cmd_pack_export(args: argparse.Namespace, svcs: dict[str, Any]) -> int:
    """Export an existing context pack to disk (YAML or Markdown)."""
    cp_svc = svcs["context_packs"]
    out_path = Path(args.out) if getattr(args, "out", None) else None
    fmt = getattr(args, "format", "yaml") or "yaml"
    try:
        exported = _pack_export_dispatch(cp_svc, args.pack_id, out_path=out_path, fmt=fmt)
        print(f"Exported context pack {args.pack_id} ({fmt}) to: {exported}")
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="atlas",
        description="Artifact Atlas local CLI",
    )
    parser.add_argument(
        "--registry",
        metavar="DIR",
        help="Override registry directory path.",
    )
    sub = parser.add_subparsers(dest="command", metavar="COMMAND")

    # init
    sub.add_parser("init", help="Check workspace config and registry.")

    # import
    p_import = sub.add_parser("import", help="Import a local file asset.")
    p_import.add_argument("path", help="Path to the file to import.")
    p_import.add_argument("--project", help="Project slug or ID to associate.")
    p_import.add_argument(
        "--store",
        action="store_true",
        help="Copy file bytes into the managed content store.",
    )

    # attach
    p_attach = sub.add_parser("attach", help="Attach file content to an existing asset.")
    p_attach.add_argument("asset_id", help="Asset ID to attach content to.")
    p_attach.add_argument("path", help="Path to the file to attach.")

    # index
    p_index = sub.add_parser("index", help="List indexed assets.")
    p_index.add_argument("--project", help="Filter by project slug or ID.")

    # inbox
    p_inbox = sub.add_parser("inbox", help="Inbox management.")
    inbox_sub = p_inbox.add_subparsers(dest="inbox_cmd")
    inbox_sub.add_parser("list", help="List inbox assets.")

    # asset
    p_asset = sub.add_parser("asset", help="Asset management.")
    asset_sub = p_asset.add_subparsers(dest="asset_cmd")

    p_classify = asset_sub.add_parser("classify", help="Classify an asset.")
    p_classify.add_argument("id", help="Asset ID.")
    p_classify.add_argument("--sensitivity", help="Sensitivity label.")
    p_classify.add_argument("--agent-access", dest="agent_access", help="Agent access level.")

    p_link = asset_sub.add_parser("link", help="Link an asset to a target.")
    p_link.add_argument("id", help="Asset ID.")
    p_link.add_argument("--target-type", dest="target_type", required=True, help="Target type (intenttree_node, bom_slot, …).")
    p_link.add_argument("--target-id", dest="target_id", required=True, help="Target ID.")
    p_link.add_argument("--relationship", help="Relationship type (default: related).")

    # report
    p_report = sub.add_parser("report", help="Delivery-report ingest.")
    report_sub = p_report.add_subparsers(dest="report_cmd")

    p_report_ingest = report_sub.add_parser(
        "ingest",
        help=(
            "Ingest a delivery-report HTML file + writeback envelope. "
            "Re-publishing the same report instance revises the SAME asset "
            "id in place (PUT /content; links preserved) rather than "
            "minting a new one -- see 'Report revisioning' below. "
            "Note: subject/tracker_links[] link targets are shape-validated "
            "only (id format), not existence-validated against the "
            "upstream system of record."
        ),
        description=(
            "Ingest a rendered delivery-report HTML file + its writeback "
            "envelope as a delivery_report Asset.\n\n"
            "Report revisioning (PF-1 M3 + PF-3 OQ-5): identity is "
            "(route, subject, instance_key) as emitted by the envelope. "
            "Re-ingesting the same identity updates that asset's blob in "
            "place, its AssetLinks untouched, instead of creating a new "
            "asset per re-ingest.\n\n"
            "For route in {phase, program, readiness} one subject has many "
            "instances over time, so the envelope's instance_key (the "
            "phase/milestone id, or the decision date for readiness) is what "
            "separates them: a phase-2 and a phase-3 report for one project "
            "get DISTINCT assets. An envelope for these routes that carries "
            "no instance_key cannot say which instance it is, so it creates a "
            "new asset rather than risk overwriting a prior one (the PF-3 "
            "exporter hard-fails before emitting such an envelope for "
            "target=atlas). For route in {feature, dossier}, collapse onto "
            "one living record per subject is intended and no instance_key "
            "is needed. 'revision' is a display field and is never part of "
            "identity."
        ),
    )
    p_report_ingest.add_argument("html", help="Path to the rendered report HTML file.")
    p_report_ingest.add_argument(
        "--envelope", required=True, help="Path to the writeback envelope JSON."
    )
    p_report_ingest.add_argument(
        "--project",
        help=(
            "Project slug or ID to associate. Resolved to the canonical "
            "project id; an unknown value is a hard error. Omit to let the "
            "envelope decide (subject slug, then generated_from.repo)."
        ),
    )
    p_report_ingest.add_argument(
        "--sensitivity",
        help="Override the default sensitivity (default: personal, never public).",
    )

    # bom
    p_bom = sub.add_parser("bom", help="BOM management.")
    bom_sub = p_bom.add_subparsers(dest="bom_cmd")

    p_bom_status = bom_sub.add_parser("status", help="Show BOM coverage summary.")
    p_bom_status.add_argument("project", help="Project slug or ID.")

    p_bom_gaps = bom_sub.add_parser("gaps", help="List BOM gap recommendations.")
    p_bom_gaps.add_argument("project", help="Project slug or ID.")

    p_bom_assign = bom_sub.add_parser("assign", help="Assign asset to slot.")
    p_bom_assign.add_argument("slot_id", help="BOM slot ID.")
    p_bom_assign.add_argument("asset_id", help="Asset ID.")
    p_bom_assign.add_argument("--confidence", type=float, default=1.0, help="Confidence score [0.0-1.0].")

    # pack
    p_pack = sub.add_parser("pack", help="Context pack management.")
    pack_sub = p_pack.add_subparsers(dest="pack_cmd")

    p_pack_build = pack_sub.add_parser("build", help="Draft a context pack.")
    p_pack_build.add_argument("--project", help="Project slug or ID.")
    p_pack_build.add_argument("--node", help="IntentTree node ID.")
    p_pack_build.add_argument("--title", help="Pack title.")
    p_pack_build.add_argument("--audience", help="Pack audience (agent, human, …).")
    p_pack_build.add_argument("--sensitivity", help="Pack sensitivity.")
    p_pack_build.add_argument("--instructions", help="Agent instructions.")
    p_pack_build.add_argument("--out", help="Export to this path immediately.")
    p_pack_build.add_argument(
        "--format",
        choices=["yaml", "markdown"],
        default="yaml",
        help="Export format: yaml (default) or markdown.",
    )

    p_pack_export = pack_sub.add_parser("export", help="Export a context pack to YAML or Markdown.")
    p_pack_export.add_argument("pack_id", help="Context pack ID.")
    p_pack_export.add_argument("--out", help="Output path (default: exports/context-packs/).")
    p_pack_export.add_argument(
        "--format",
        choices=["yaml", "markdown"],
        default="yaml",
        help="Export format: yaml (default) or markdown.",
    )

    return parser


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    registry_dir = Path(args.registry) if getattr(args, "registry", None) else None

    try:
        svcs = _get_services(registry_dir)
    except Exception as exc:
        print(f"ERROR: failed to initialise services: {exc}", file=sys.stderr)
        return 1

    cmd = getattr(args, "command", None)

    if cmd == "init":
        return cmd_init(args, svcs)

    elif cmd == "import":
        return cmd_import(args, svcs)

    elif cmd == "attach":
        return cmd_attach(args, svcs)

    elif cmd == "index":
        return cmd_index(args, svcs)

    elif cmd == "inbox":
        inbox_cmd = getattr(args, "inbox_cmd", None)
        if inbox_cmd == "list":
            return cmd_inbox_list(args, svcs)
        parser.parse_args(["inbox", "--help"])
        return 1

    elif cmd == "asset":
        asset_cmd = getattr(args, "asset_cmd", None)
        if asset_cmd == "classify":
            return cmd_asset_classify(args, svcs)
        elif asset_cmd == "link":
            return cmd_asset_link(args, svcs)
        parser.parse_args(["asset", "--help"])
        return 1

    elif cmd == "report":
        report_cmd = getattr(args, "report_cmd", None)
        if report_cmd == "ingest":
            return cmd_report_ingest(args, svcs)
        parser.parse_args(["report", "--help"])
        return 1

    elif cmd == "bom":
        bom_cmd = getattr(args, "bom_cmd", None)
        if bom_cmd == "status":
            return cmd_bom_status(args, svcs)
        elif bom_cmd == "gaps":
            return cmd_bom_gaps(args, svcs)
        elif bom_cmd == "assign":
            return cmd_bom_assign(args, svcs)
        parser.parse_args(["bom", "--help"])
        return 1

    elif cmd == "pack":
        pack_cmd = getattr(args, "pack_cmd", None)
        if pack_cmd == "build":
            return cmd_pack_build(args, svcs)
        elif pack_cmd == "export":
            return cmd_pack_export(args, svcs)
        parser.parse_args(["pack", "--help"])
        return 1

    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
