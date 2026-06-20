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
