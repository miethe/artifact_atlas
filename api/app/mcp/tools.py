"""MCP tool implementations (MCP-001).

All tool functions are importable and testable without the MCP SDK being present.
Each tool:
  - Enforces policy via PolicyService.
  - Emits an audit event via AuditService.
  - Returns JSON-serialisable dicts.
  - Never exposes full content for restricted/client_sensitive assets unless
    policy allows (effective include mode governs what is returned).
  - Never performs live network calls or autonomous canonical promotion.

The optional 'mcp' SDK import is guarded at the bottom of server.py; this
module itself has zero MCP-SDK imports so it remains importable in tests.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.models.vocabulary import AuditEventType, IncludeMode
from app.services.assets import AssetService
from app.services.audit import AuditService
from app.services.bom_service import BomService
from app.services.context_pack_service import ContextPackService
from app.services.coverage import calculate_coverage
from app.services.policy import PolicyService
from app.services.projects import ProjectService


# ---------------------------------------------------------------------------
# Helper: produce a gateway-layer services dict
# ---------------------------------------------------------------------------


def _build_services(registry_dir: Path, context_packs_dir: Path) -> dict[str, Any]:
    """Build initialised service instances for MCP tool handlers."""
    audit = AuditService(registry_dir)
    policy = PolicyService()
    return {
        "registry_dir": registry_dir,
        "audit": audit,
        "policy": policy,
        "assets": AssetService(registry_dir, audit_service=audit, policy_service=policy),
        "projects": ProjectService(registry_dir),
        "bom": BomService(registry_dir),
        "context_packs": ContextPackService(
            registry_dir, context_packs_dir, policy_service=policy, audit_service=audit
        ),
    }


# ---------------------------------------------------------------------------
# asset.search — metadata-only result summaries
# ---------------------------------------------------------------------------


def tool_asset_search(
    query: str,
    *,
    project_id: str | None = None,
    status: str | None = None,
    sensitivity: str | None = None,
    limit: int = 20,
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Search assets; returns metadata-only summaries (never full content).

    MCP policy: asset.search always returns metadata — include mode is NOT
    configurable for this tool.
    """
    asset_svc: AssetService = svcs["assets"]
    audit: AuditService = svcs["audit"]

    assets = asset_svc.search_assets(
        query=query,
        project_id=project_id,
        status_filter=[status] if status else None,
        sensitivity_filter=[sensitivity] if sensitivity else None,
        limit=limit,
    )

    # Metadata-only: strip any content fields and return safe summaries
    results = []
    for a in assets:
        results.append(
            {
                "id": a.id,
                "title": a.title,
                "status": a.status.value if hasattr(a.status, "value") else str(a.status),
                "sensitivity": a.sensitivity.value if hasattr(a.sensitivity, "value") else str(a.sensitivity),
                "agent_access": a.agent_access.value if hasattr(a.agent_access, "value") else str(a.agent_access),
                "source_kind": a.source_kind.value if hasattr(a.source_kind, "value") else str(a.source_kind),
                "project_id": a.project_id,
                "artifact_type_id": a.artifact_type_id,
                "uri": a.uri,
                "captured_at": a.captured_at.isoformat() if a.captured_at else None,
            }
        )

    audit.emit(
        AuditEventType.agent_query,
        "asset",
        "search",
        project_id=project_id,
        actor_id=actor_id,
        payload={
            "tool": "asset.search",
            "query": query,
            "result_count": len(results),
            "include_mode": "metadata",
        },
    )

    return {"assets": results, "count": len(results), "include_mode": "metadata"}


# ---------------------------------------------------------------------------
# asset.get — metadata/preview/content per include mode + policy
# ---------------------------------------------------------------------------


def tool_asset_get(
    asset_id: str,
    *,
    include_mode: str = "metadata",
    actor_type: str = "agent",
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Get a single asset.  Content access is governed by include_mode + policy.

    Returns at most what policy allows; may downgrade include_mode or deny.
    """
    asset_svc: AssetService = svcs["assets"]
    policy_svc: PolicyService = svcs["policy"]
    audit: AuditService = svcs["audit"]

    asset = asset_svc.get_asset(asset_id)
    if asset is None:
        return {"error": "not_found", "asset_id": asset_id}

    # Parse requested mode
    try:
        requested = IncludeMode(include_mode)
    except ValueError:
        requested = IncludeMode.metadata

    sensitivity = asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity)
    agent_access = asset.agent_access.value if hasattr(asset.agent_access, "value") else str(asset.agent_access)

    policy = policy_svc.evaluate_asset_access(
        resource_id=asset_id,
        sensitivity=sensitivity,
        agent_access=agent_access,
        action="read",
        include_mode=requested,
        actor_type=actor_type,
    )

    if policy.decision == "deny":
        audit.emit_policy_denied(
            asset_id,
            "asset",
            actor_id=actor_id,
            project_id=asset.project_id,
            payload={"tool": "asset.get", "requested_mode": include_mode, "reason": policy.reason},
        )
        return {
            "error": "access_denied",
            "asset_id": asset_id,
            "rule": policy.rule_triggered,
            "reason": policy.reason,
        }

    effective_mode = (
        policy.effective_include_mode.value
        if policy.effective_include_mode and hasattr(policy.effective_include_mode, "value")
        else (policy.effective_include_mode or include_mode)
    )

    # Build response at effective mode
    result: dict[str, Any] = {
        "id": asset.id,
        "title": asset.title,
        "status": asset.status.value if hasattr(asset.status, "value") else str(asset.status),
        "sensitivity": sensitivity,
        "agent_access": agent_access,
        "source_kind": asset.source_kind.value if hasattr(asset.source_kind, "value") else str(asset.source_kind),
        "project_id": asset.project_id,
        "artifact_type_id": asset.artifact_type_id,
        "uri": asset.uri,
        "captured_at": asset.captured_at.isoformat() if asset.captured_at else None,
        "effective_include_mode": str(effective_mode),
        "policy_downgraded": str(effective_mode) != include_mode,
    }

    if str(effective_mode) in ("preview", "summary", "full"):
        result["description"] = asset.description
        result["metadata"] = asset.metadata

    # For full include mode, add any available content URI (we never inline restricted content)
    if str(effective_mode) == "full":
        result["content_uri"] = asset.uri  # callers fetch; we never inline blobs

    audit.emit(
        AuditEventType.agent_query,
        "asset",
        asset_id,
        project_id=asset.project_id,
        actor_id=actor_id,
        payload={
            "tool": "asset.get",
            "requested_mode": include_mode,
            "effective_mode": str(effective_mode),
            "downgraded": str(effective_mode) != include_mode,
        },
    )

    return result


# ---------------------------------------------------------------------------
# bom.get — project BOM summary
# ---------------------------------------------------------------------------


def tool_bom_get(
    project_id: str,
    *,
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Return a project BOM summary (metadata, no restricted content)."""
    bom_svc: BomService = svcs["bom"]
    audit: AuditService = svcs["audit"]

    bom = bom_svc.get_bom_for_project(project_id)
    if bom is None:
        return {"error": "not_found", "project_id": project_id}

    audit.emit(
        AuditEventType.agent_query,
        "bom",
        bom.id,
        project_id=project_id,
        actor_id=actor_id,
        payload={"tool": "bom.get"},
    )

    return {
        "id": bom.id,
        "project_id": bom.project_id,
        "status": bom.status.value if hasattr(bom.status, "value") else str(bom.status),
        "source_templates": bom.source_templates or [],
        "created_at": bom.created_at.isoformat() if bom.created_at else None,
        "updated_at": bom.updated_at.isoformat() if bom.updated_at else None,
    }


# ---------------------------------------------------------------------------
# bom.coverage — coverage and gaps
# ---------------------------------------------------------------------------


def tool_bom_coverage(
    project_id: str,
    *,
    group_by: str | None = None,
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Return BOM coverage summary and gap recommendations.

    Gaps are returned as suggestion payloads only — no tasks are created.
    """
    from app.repositories.bom import BomRepository

    bom_svc: BomService = svcs["bom"]
    audit: AuditService = svcs["audit"]
    registry_dir: Path = svcs["registry_dir"]

    bom = bom_svc.get_bom_for_project(project_id)
    if bom is None:
        return {"error": "not_found", "project_id": project_id}

    bom_repo = BomRepository(registry_dir)
    slots = bom_repo.list_slots(bom.id)
    summary = calculate_coverage(slots, group_by=group_by)

    gap_response = bom_svc.get_gap_recommendations(bom.id)

    audit.emit(
        AuditEventType.agent_query,
        "bom",
        bom.id,
        project_id=project_id,
        actor_id=actor_id,
        payload={"tool": "bom.coverage", "total_gaps": gap_response.total_gaps},
    )

    return {
        "bom_id": bom.id,
        "project_id": project_id,
        "coverage_score": summary.coverage_score,
        "total_slots": summary.total_slots,
        "required_slots": summary.required_slots,
        "filled_slots": summary.filled_slots,
        "missing_slots": summary.missing_slots,
        "partial_slots": summary.partial_slots,
        "stale_slots": summary.stale_slots,
        "optional_score": summary.optional_score,
        "groups": [g.model_dump(mode="json") for g in (summary.groups or [])],
        "total_gaps": gap_response.total_gaps,
        "critical_gaps": gap_response.critical_gaps,
        "gap_recommendations": [
            {
                "slot_id": rec.slot_id,
                "domain": rec.slot_domain,
                "artifact_type_id": rec.artifact_type_id,
                "gap_reason": rec.gap_reason,
                "priority": rec.priority,
                "action": rec.action,
                "suggestion_only": True,
            }
            for rec in gap_response.recommendations
        ],
    }


# ---------------------------------------------------------------------------
# context_pack.create — DRAFT only
# ---------------------------------------------------------------------------


def tool_context_pack_create(
    title: str,
    project_id: str,
    *,
    target_type: str = "project",
    target_id: str | None = None,
    audience: str = "agent",
    sensitivity: str = "personal",
    instructions: str | None = None,
    node_id: str | None = None,
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Create a DRAFT context pack. Publish is never performed by this tool.

    If node_id is provided, the pack is built from that IntentTree node ref.
    Otherwise, a blank pack is created for the given project.

    MCP policy: write-as-suggestion — always returns a draft, never published.
    """
    from app.models.context_pack import ContextPackCreate
    from app.models.vocabulary import ContextPackAudience, ContextPackTargetType

    cp_svc: ContextPackService = svcs["context_packs"]
    audit: AuditService = svcs["audit"]

    if node_id:
        pack = cp_svc.create_from_node(
            node_id=node_id,
            project_id=project_id,
            title=title,
            actor_id=actor_id,
        )
    else:
        try:
            ttype = ContextPackTargetType(target_type)
        except ValueError:
            ttype = ContextPackTargetType.project

        create_data = ContextPackCreate(
            title=title,
            target_type=ttype,
            target_id=target_id or project_id,
            audience=audience,
            sensitivity=sensitivity,
            instructions=instructions,
        )
        pack = cp_svc.create(project_id, create_data, actor_id=actor_id)

    return {
        "pack_id": pack.id,
        "title": pack.title,
        "project_id": pack.project_id,
        "status": pack.status.value if hasattr(pack.status, "value") else str(pack.status),
        "sensitivity": pack.sensitivity.value if hasattr(pack.sensitivity, "value") else str(pack.sensitivity),
        "audience": pack.audience.value if hasattr(pack.audience, "value") else str(pack.audience),
        "suggestion_only": True,
        "note": "This pack is a DRAFT. Publish requires explicit human action.",
    }


# ---------------------------------------------------------------------------
# intent_node.context — local node context refs and linked assets
# ---------------------------------------------------------------------------


def tool_intent_node_context(
    node_id: str,
    *,
    project_id: str | None = None,
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Return local context refs for an IntentTree node.

    Returns asset links and BOM slot refs. The IntentTree integration is not
    live — this tool returns what is recorded locally in the registry.
    """
    from app.repositories.assets import AssetRepository
    from app.repositories.bom import BomRepository
    from app.repositories.jsonl import read_where

    audit: AuditService = svcs["audit"]
    registry_dir: Path = svcs["registry_dir"]

    asset_repo = AssetRepository(registry_dir)
    bom_repo = BomRepository(registry_dir)

    # Assets linked to this node
    try:
        link_records = read_where(
            asset_repo._links_path,
            lambda r: r.get("target_type") == "intenttree_node"
            and r.get("target_id") == node_id,
        )
        asset_refs = []
        for lr in link_records:
            asset_id = lr.get("asset_id")
            if not asset_id:
                continue
            asset = asset_repo.get(asset_id)
            if asset is None:
                continue
            asset_refs.append(
                {
                    "asset_id": asset_id,
                    "title": asset.title,
                    "status": asset.status.value if hasattr(asset.status, "value") else str(asset.status),
                    "sensitivity": asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity),
                    "relationship": lr.get("relationship", "related"),
                }
            )
    except Exception:
        asset_refs = []

    # BOM slots linked to this node
    try:
        slot_records = read_where(
            bom_repo._slots_path,
            lambda r: r.get("linked_intenttree_node_id") == node_id,
        )
        slot_refs = [
            {
                "slot_id": r.get("id"),
                "bom_id": r.get("bom_id"),
                "artifact_type_id": r.get("artifact_type_id"),
                "domain": r.get("domain"),
                "status": r.get("status"),
            }
            for r in slot_records
        ]
    except Exception:
        slot_refs = []

    audit.emit(
        AuditEventType.agent_query,
        "intenttree_node",
        node_id,
        project_id=project_id,
        actor_id=actor_id,
        payload={
            "tool": "intent_node.context",
            "asset_count": len(asset_refs),
            "slot_count": len(slot_refs),
            "integration_note": "IntentTree integration not live; local refs only.",
        },
    )

    return {
        "node_id": node_id,
        "integration_status": "local_refs_only",
        "note": "IntentTree integration is not live. Refs are from local registry.",
        "linked_assets": asset_refs,
        "linked_bom_slots": slot_refs,
    }


# ---------------------------------------------------------------------------
# project.snapshot — routing-signal snapshot
# ---------------------------------------------------------------------------


def tool_project_snapshot(
    project_id: str,
    *,
    actor_id: str = "agent",
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Return a project routing-signal snapshot.

    Includes BOM coverage, asset counts by status, context pack summary.
    This snapshot is used by agent control-plane routing.
    """
    from app.repositories.bom import BomRepository
    from app.repositories.context_packs import ContextPackRepository
    from app.repositories.assets import AssetRepository

    audit: AuditService = svcs["audit"]
    registry_dir: Path = svcs["registry_dir"]
    project_svc: ProjectService = svcs["projects"]

    project = project_svc.get_project(project_id)
    if project is None:
        # Try by slug
        project = project_svc.get_project_by_slug(project_id)
    if project is None:
        return {"error": "not_found", "project_id": project_id}

    # Dashboard counts (includes BOM coverage)
    counts = project_svc.get_dashboard_counts(project.id)

    # Context pack summary
    cp_repo = ContextPackRepository(registry_dir)
    packs = cp_repo.list(project_id=project.id)
    pack_summary = {
        "total": len(packs),
        "draft": sum(
            1 for p in packs
            if (p.status.value if hasattr(p.status, "value") else str(p.status)) == "draft"
        ),
        "published": sum(
            1 for p in packs
            if (p.status.value if hasattr(p.status, "value") else str(p.status)) == "published"
        ),
    }

    audit.emit(
        AuditEventType.agent_query,
        "project",
        project.id,
        project_id=project.id,
        actor_id=actor_id,
        payload={"tool": "project.snapshot"},
    )

    return {
        "project_id": project.id,
        "project_name": project.name,
        "project_slug": project.slug,
        "status": project.status.value if hasattr(project.status, "value") else str(project.status),
        "asset_counts": counts.as_dict(),
        "context_packs": pack_summary,
        "snapshot_at": datetime.now(tz=timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# atlas.record_event — append event record
# ---------------------------------------------------------------------------


def tool_atlas_record_event(
    event_type: str,
    resource_type: str,
    resource_id: str,
    *,
    project_id: str | None = None,
    actor_id: str = "agent",
    payload: dict[str, Any] | None = None,
    svcs: dict[str, Any],
) -> dict[str, Any]:
    """Append an event record to the audit log.

    Used by agents to signal observations, completions, and other tracking events.
    Never auto-promotes assets or creates IntentTree tasks.
    """
    audit: AuditService = svcs["audit"]

    try:
        evt_type = AuditEventType(event_type)
    except ValueError:
        # Default to agent_query for unknown event types
        evt_type = AuditEventType.agent_query

    audit.emit(
        evt_type,
        resource_type,
        resource_id,
        project_id=project_id,
        actor_id=actor_id,
        payload=payload or {},
    )

    return {
        "recorded": True,
        "event_type": evt_type.value,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "project_id": project_id,
        "actor_id": actor_id,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# content.upload — write-gated content upload
# ---------------------------------------------------------------------------


def tool_content_upload(
    svcs: dict[str, Any],
    *,
    project_id: str | None = None,
    filename: str,
    content_base64: str,
    sensitivity: str | None = None,
    mime_type: str | None = None,
    actor_type: str = "agent",
) -> dict[str, Any]:
    """Upload content bytes into the managed content store.

    Write-gated: agents may NOT upload sensitive content. Uploaded assets land
    as suggestion/draft (agent_access=metadata_only, status=inbox) and are
    never auto-promoted.
    """
    import base64

    from app.services.import_index import ImportService
    from app.settings import get_settings

    audit: AuditService = svcs["audit"]

    # Gate: deny sensitive content uploads from agents
    _SENSITIVE_LEVELS = {"work_sensitive", "client_sensitive", "restricted"}
    if sensitivity and sensitivity in _SENSITIVE_LEVELS:
        audit.emit_policy_denied(
            "content_upload",
            "content",
            actor_id="agent",
            payload={
                "tool": "content.upload",
                "reason": "agents may not upload sensitive content",
                "requested_sensitivity": sensitivity,
            },
        )
        return {
            "decision": "deny",
            "reason": "agents may not upload sensitive content",
            "tool": "content.upload",
        }

    # Decode content
    try:
        raw_bytes = base64.b64decode(content_base64)
    except Exception as exc:
        return {"error": "invalid_base64", "detail": str(exc)}

    # Build or reuse ImportService
    settings = get_settings()
    import_svc = ImportService(settings.registry_dir, audit_service=audit)

    result = import_svc.import_content(
        filename,
        raw_bytes,
        project_id=project_id,
        sensitivity=sensitivity,
        mime_type=mime_type,
        agent_access="metadata_only",
        on_duplicate="return_existing",
        actor_id="agent",
    )

    return {
        "asset_id": result.asset.id,
        "is_duplicate": result.is_duplicate,
        "agent_access": "metadata_only",
        "status": "inbox",
        "suggestion_only": True,
    }


# ---------------------------------------------------------------------------
# Tool registry (for server.py to iterate over)
# ---------------------------------------------------------------------------


TOOL_REGISTRY: dict[str, dict[str, Any]] = {
    "asset.search": {
        "fn": tool_asset_search,
        "description": "Search assets by query; returns metadata-only summaries.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query."},
                "project_id": {"type": "string"},
                "status": {"type": "string"},
                "sensitivity": {"type": "string"},
                "limit": {"type": "integer", "default": 20},
            },
            "required": ["query"],
        },
    },
    "asset.get": {
        "fn": tool_asset_get,
        "description": "Get a single asset; content access governed by include_mode + policy.",
        "input_schema": {
            "type": "object",
            "properties": {
                "asset_id": {"type": "string"},
                "include_mode": {
                    "type": "string",
                    "enum": ["metadata", "preview", "summary", "full", "link_only"],
                    "default": "metadata",
                },
            },
            "required": ["asset_id"],
        },
    },
    "bom.get": {
        "fn": tool_bom_get,
        "description": "Get project BOM summary.",
        "input_schema": {
            "type": "object",
            "properties": {"project_id": {"type": "string"}},
            "required": ["project_id"],
        },
    },
    "bom.coverage": {
        "fn": tool_bom_coverage,
        "description": "Get BOM coverage score and gap recommendations (suggestions only).",
        "input_schema": {
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "group_by": {"type": "string", "enum": ["domain", "phase", "template"]},
            },
            "required": ["project_id"],
        },
    },
    "context_pack.create": {
        "fn": tool_context_pack_create,
        "description": "Create a DRAFT context pack. Publish requires explicit human action.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "project_id": {"type": "string"},
                "target_type": {"type": "string", "default": "project"},
                "target_id": {"type": "string"},
                "audience": {"type": "string", "default": "agent"},
                "sensitivity": {"type": "string", "default": "personal"},
                "instructions": {"type": "string"},
                "node_id": {"type": "string"},
            },
            "required": ["title", "project_id"],
        },
    },
    "intent_node.context": {
        "fn": tool_intent_node_context,
        "description": "Get local context refs for an IntentTree node (local-only; not live).",
        "input_schema": {
            "type": "object",
            "properties": {
                "node_id": {"type": "string"},
                "project_id": {"type": "string"},
            },
            "required": ["node_id"],
        },
    },
    "project.snapshot": {
        "fn": tool_project_snapshot,
        "description": "Get a routing-signal snapshot for a project.",
        "input_schema": {
            "type": "object",
            "properties": {"project_id": {"type": "string"}},
            "required": ["project_id"],
        },
    },
    "atlas.record_event": {
        "fn": tool_atlas_record_event,
        "description": "Append an event record to the Atlas audit log.",
        "input_schema": {
            "type": "object",
            "properties": {
                "event_type": {"type": "string"},
                "resource_type": {"type": "string"},
                "resource_id": {"type": "string"},
                "project_id": {"type": "string"},
                "actor_id": {"type": "string"},
                "payload": {"type": "object"},
            },
            "required": ["event_type", "resource_type", "resource_id"],
        },
    },
    "content.upload": {
        "fn": tool_content_upload,
        "description": "Upload content bytes into the managed content store. Write-gated: agents may not upload sensitive content. Assets land as suggestion/draft.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {"type": "string", "description": "Original filename for display and MIME inference."},
                "content_base64": {"type": "string", "description": "Base64-encoded file content."},
                "project_id": {"type": "string", "description": "Optional project scope."},
                "sensitivity": {"type": "string", "description": "Sensitivity label (agents denied for work_sensitive/client_sensitive/restricted)."},
                "mime_type": {"type": "string", "description": "Explicit MIME type; guessed from filename when absent."},
            },
            "required": ["filename", "content_base64"],
        },
    },
}
