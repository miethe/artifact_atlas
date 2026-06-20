"""Context Pack Service (CP-BE-001..004).

Responsibilities:
- Draft create / update / list / get packs (CP-BE-001).
- Generate draft pack from IntentTree node ref + linked assets + BOM slots (CP-BE-002).
- Apply include-mode policy checks, compute token/payload estimate, carry policy
  envelope (allow_external_data, allow_code_execution, network_access, agent_access,
  audience, expiry) (CP-BE-003).
- Render preview and export YAML into exports/context-packs/ per spec §14.3 manifest
  shape; publish emits audit event with CCDash hook payload (CP-BE-004).

Hard rules (local-first, agent-safety):
- Draft-first: packs start as 'draft'; publish is a separate explicit step.
- Publish is blocked for sensitive assets unless the pack sensitivity is not in the cap.
- Include modes (metadata/preview/summary/full/link_only) per policy.
- Export references asset IDs/URIs — never inline restricted content.
- Every publish emits audit + a ccdash_event_payload dict (no live network calls).
- MCP/CLI must reuse this service layer, not bypass it.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml as _yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False

from app.models.context_pack import (
    ContextPack,
    ContextPackCreate,
    ContextPackDetail,
    ContextPackItem,
    ContextPackItemCreate,
    ContextPackPolicy,
    ContextPackPreview,
    ContextPackUpdate,
)
from app.models.vocabulary import (
    AuditEventType,
    ContextPackItemType,
    ContextPackStatus,
    IncludeMode,
    Sensitivity,
)
from app.repositories.context_packs import ContextPackRepository
from app.services.audit import AuditService
from app.services.policy import PolicyService


class ConflictError(Exception):
    """Raised when a state conflict prevents an operation (e.g., publishing archived pack)."""

# ---------------------------------------------------------------------------
# Token estimate constants (rough approximations for MVP)
# ---------------------------------------------------------------------------

_TOKEN_ESTIMATES_BY_MODE: dict[str, int] = {
    IncludeMode.link_only.value: 20,
    IncludeMode.metadata.value: 150,
    IncludeMode.preview.value: 400,
    IncludeMode.summary.value: 600,
    IncludeMode.full.value: 2000,
}

_SENSITIVE_SENSITIVITIES: frozenset[str] = frozenset(
    {
        Sensitivity.work_sensitive.value,
        Sensitivity.client_sensitive.value,
        Sensitivity.restricted.value,
    }
)

# ---------------------------------------------------------------------------
# Missing integration sentinel
# ---------------------------------------------------------------------------

_MISSING_INTEGRATION_NOTE = (
    "[MISSING INTEGRATION] This item ref was added from an external system "
    "(IntentTree / MeatyWiki / SkillBOM) that is not yet connected. "
    "It is included as a reference placeholder only."
)


class ContextPackService:
    """Business logic for context pack creation, policy enforcement, and export.

    This service is the single implementation consumed by the FastAPI routes,
    the atlas CLI, and the MCP tool server. All access-policy checks and
    export logic live here.
    """

    def __init__(
        self,
        registry_dir: Path,
        context_packs_dir: Path,
        *,
        policy_service: PolicyService | None = None,
        audit_service: AuditService | None = None,
    ) -> None:
        self._registry_dir = registry_dir
        self._repo = ContextPackRepository(registry_dir)
        self._context_packs_dir = context_packs_dir
        self._policy = policy_service or PolicyService()
        self._audit = audit_service or AuditService(registry_dir)

    # ------------------------------------------------------------------
    # CP-BE-001: Draft create / update / list / get
    # ------------------------------------------------------------------

    def create(
        self,
        project_id: str,
        data: ContextPackCreate,
        *,
        actor_id: str = "user",
    ) -> ContextPack:
        """Create a new context pack in draft status.

        Always produces a draft regardless of any status field in the request.
        Items are persisted as-is (no policy downgrade at creation — that happens
        at preview/export time, on the per-item basis).
        """
        pack_id = f"pack_{uuid.uuid4().hex[:16]}"
        pack = self._repo.create(pack_id, project_id, data, created_by=actor_id)

        if data.items:
            for idx, item_data in enumerate(data.items):
                item_id = f"item_{uuid.uuid4().hex[:12]}"
                ordered = ContextPackItemCreate(
                    item_type=item_data.item_type,
                    item_id=item_data.item_id,
                    include_mode=item_data.include_mode,
                    display_order=item_data.display_order if item_data.display_order is not None else idx,
                    required=item_data.required,
                )
                self._repo.add_item(item_id, pack_id, ordered)

        self._audit.emit(
            AuditEventType.context_pack_created,
            "context_pack",
            pack_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"title": pack.title, "audience": pack.audience.value},
        )
        return pack

    def update(
        self,
        pack_id: str,
        data: ContextPackUpdate,
        *,
        actor_id: str = "user",
    ) -> ContextPack | None:
        """Partially update pack metadata and optionally replace all items."""
        pack = self._repo.get(pack_id)
        if pack is None:
            return None

        updated = self._repo.update(pack_id, data)
        if updated is None:
            return None

        if data.items is not None:
            self._repo.replace_items(pack_id, data.items)

        return updated

    def list(
        self,
        project_id: str,
        *,
        status: str | None = None,
        audience: str | None = None,
    ) -> list[ContextPack]:
        """List context packs for a project, with optional filters."""
        packs = self._repo.list(project_id=project_id)
        if status is not None:
            packs = [p for p in packs if (p.status.value if hasattr(p.status, "value") else str(p.status)) == status]
        if audience is not None:
            packs = [p for p in packs if (p.audience.value if hasattr(p.audience, "value") else str(p.audience)) == audience]
        return packs

    def get(self, pack_id: str) -> ContextPackDetail | None:
        """Return a single context pack with embedded items."""
        pack = self._repo.get(pack_id)
        if pack is None:
            return None
        items = self._repo.list_items(pack_id)
        return ContextPackDetail(**pack.model_dump(mode="python"), items=items)

    # ------------------------------------------------------------------
    # CP-BE-002: Pack from IntentTree node ref
    # ------------------------------------------------------------------

    def create_from_node(
        self,
        node_id: str,
        project_id: str,
        *,
        title: str | None = None,
        audience: Any | None = None,
        sensitivity: Any | None = None,
        instructions: str | None = None,
        include_assets: bool = True,
        include_bom_slots: bool = True,
        include_meatywiki_pages: bool = True,
        asset_statuses: list[str] | None = None,
        actor_id: str = "user",
    ) -> ContextPack:
        """Generate a draft context pack scoped to an IntentTree node ref.

        - Collects all assets linked to the node via asset_links.
        - Optionally adds BOM slot refs linked to the node.
        - Optionally adds MeatyWiki page refs (stub — integration not live).
        - Uses refs only; marks missing integrations clearly in notes.
        - All items default to include_mode=metadata (safest default).
        """
        from app.models.vocabulary import ContextPackAudience, ContextPackTargetType

        aud = audience or ContextPackAudience.agent
        sens = sensitivity or Sensitivity.personal
        asset_statuses_filter = set(asset_statuses or ["candidate", "selected", "canonical"])

        create_data = ContextPackCreate(
            title=title or f"Context pack for node {node_id}",
            target_type=ContextPackTargetType.intenttree_node,
            target_id=node_id,
            audience=aud,
            sensitivity=sens,
            instructions=instructions,
            items=None,
        )
        pack_id = f"pack_{uuid.uuid4().hex[:16]}"
        pack = self._repo.create(pack_id, project_id, create_data, created_by=actor_id)

        # -- Node ref itself (mark missing integration clearly)
        node_item_id = f"item_{uuid.uuid4().hex[:12]}"
        self._repo.add_item(
            node_item_id,
            pack_id,
            ContextPackItemCreate(
                item_type=ContextPackItemType.intenttree_node,
                item_id=node_id,
                include_mode=IncludeMode.metadata,
                display_order=0,
                required=True,
            ),
        )

        item_count = 1  # node ref

        # -- Assets linked to this node
        if include_assets:
            linked_asset_ids = self._get_assets_linked_to_node(node_id, asset_statuses_filter)
            for idx, asset_id in enumerate(linked_asset_ids):
                item_id = f"item_{uuid.uuid4().hex[:12]}"
                self._repo.add_item(
                    item_id,
                    pack_id,
                    ContextPackItemCreate(
                        item_type=ContextPackItemType.asset,
                        item_id=asset_id,
                        include_mode=IncludeMode.metadata,
                        display_order=item_count + idx,
                        required=False,
                    ),
                )
            item_count += len(linked_asset_ids)

        # -- BOM slot refs linked to this node
        if include_bom_slots:
            slot_ids = self._get_bom_slots_for_node(node_id)
            for idx, slot_id in enumerate(slot_ids):
                item_id = f"item_{uuid.uuid4().hex[:12]}"
                self._repo.add_item(
                    item_id,
                    pack_id,
                    ContextPackItemCreate(
                        item_type=ContextPackItemType.bom_slot,
                        item_id=slot_id,
                        include_mode=IncludeMode.metadata,
                        display_order=item_count + idx,
                        required=False,
                    ),
                )
            item_count += len(slot_ids)

        # -- MeatyWiki page refs (stub — integration not live)
        if include_meatywiki_pages:
            mw_note_id = f"item_{uuid.uuid4().hex[:12]}"
            self._repo.add_item(
                mw_note_id,
                pack_id,
                ContextPackItemCreate(
                    item_type=ContextPackItemType.note,
                    item_id=f"meatywiki_node_{node_id}_missing_integration",
                    include_mode=IncludeMode.metadata,
                    display_order=item_count,
                    required=False,
                ),
            )
            item_count += 1

        self._audit.emit(
            AuditEventType.context_pack_created,
            "context_pack",
            pack_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={
                "from_node": node_id,
                "items_added": item_count,
                "missing_integrations": ["meatywiki"] if include_meatywiki_pages else [],
            },
        )
        return pack

    # ------------------------------------------------------------------
    # CP-BE-003: Policy envelope + estimate
    # ------------------------------------------------------------------

    def apply_policy_and_estimate(
        self,
        pack_id: str,
        *,
        actor_type: str = "agent",
        actor_id: str = "system",
    ) -> dict[str, Any]:
        """Apply include-mode policy to each item and compute token estimate.

        Returns a dict with:
        - items: list of {item_id, item_type, item_id (ref), original_mode,
                           effective_mode, policy_decision, policy_reason}
        - token_estimate: int
        - sensitive_item_count: int
        - policy_envelope: ContextPackPolicy
        - warnings: list[str]
        """
        pack = self._repo.get(pack_id)
        if pack is None:
            return {"error": "not_found"}

        items = self._repo.list_items(pack_id)
        evaluated_items: list[dict[str, Any]] = []
        total_tokens = 0
        sensitive_count = 0
        warnings: list[str] = []

        pack_sensitivity = pack.sensitivity.value if hasattr(pack.sensitivity, "value") else str(pack.sensitivity)
        policy_envelope = pack.policy or ContextPackPolicy()

        for item in items:
            item_type_v = item.item_type.value if hasattr(item.item_type, "value") else str(item.item_type)
            requested_mode = item.include_mode

            # Only asset items have direct policy evaluation against asset metadata.
            # Other item types (node, bom_slot, meatywiki_page, note, url) follow
            # pack-level sensitivity.
            if item_type_v == ContextPackItemType.asset.value:
                asset_info = self._get_asset_policy_info(item.item_id)
                sensitivity = asset_info.get("sensitivity", pack_sensitivity)
                agent_access = asset_info.get("agent_access", "metadata_only")
                is_sensitive = sensitivity in _SENSITIVE_SENSITIVITIES

                pol = self._policy.evaluate_asset_access(
                    resource_id=item.item_id,
                    sensitivity=sensitivity,
                    agent_access=agent_access,
                    action="read",
                    include_mode=requested_mode,
                    actor_type=actor_type,
                )
                effective_mode = pol.effective_include_mode or IncludeMode.metadata
                policy_decision = pol.decision
                policy_reason = pol.reason
                if is_sensitive:
                    sensitive_count += 1
                if pol.decision == "deny":
                    warnings.append(
                        f"Item {item.id} (asset {item.item_id}): access denied — {pol.reason}"
                    )
            else:
                # Non-asset items: honour the requested mode at pack level sensitivity
                is_sensitive = pack_sensitivity in _SENSITIVE_SENSITIVITIES
                if is_sensitive:
                    # Downgrade to metadata for sensitive packs (conservative)
                    effective_mode = IncludeMode.metadata
                    policy_decision = "allow"
                    policy_reason = "Downgraded to metadata for sensitive pack."
                    sensitive_count += 1
                    warnings.append(
                        f"Item {item.id} ({item_type_v}): downgraded to metadata due to pack sensitivity."
                    )
                else:
                    effective_mode = requested_mode
                    policy_decision = "allow"
                    policy_reason = None

            mode_v = effective_mode.value if hasattr(effective_mode, "value") else str(effective_mode)
            token_est = _TOKEN_ESTIMATES_BY_MODE.get(mode_v, 150)
            total_tokens += token_est

            evaluated_items.append(
                {
                    "item_record_id": item.id,
                    "item_type": item_type_v,
                    "item_ref_id": item.item_id,
                    "requested_include_mode": requested_mode.value if hasattr(requested_mode, "value") else str(requested_mode),
                    "effective_include_mode": mode_v,
                    "policy_decision": policy_decision,
                    "policy_reason": policy_reason,
                    "token_estimate": token_est,
                }
            )

        # Pack-level policy check for publish (sensitive packs need approval)
        publish_policy = self._policy.evaluate_generic(
            resource_type="context_pack",
            resource_id=pack_id,
            action="publish",
            context={"sensitivity": pack_sensitivity},
        )
        if publish_policy.decision == "deny":
            warnings.append(
                f"Pack publish requires approval: {publish_policy.reason}"
            )

        return {
            "pack_id": pack_id,
            "items": evaluated_items,
            "token_estimate": total_tokens,
            "sensitive_item_count": sensitive_count,
            "policy_envelope": policy_envelope.model_dump(mode="json"),
            "publish_allowed": publish_policy.decision == "allow",
            "publish_blocked_reason": publish_policy.reason,
            "warnings": warnings,
        }

    # ------------------------------------------------------------------
    # CP-BE-004: Preview + Export
    # ------------------------------------------------------------------

    def preview(self, pack_id: str, *, actor_type: str = "agent") -> ContextPackPreview | None:
        """Render a preview of the context pack.

        Applies policy to each item, computes token estimate, and returns
        a YAML manifest string matching the spec §14.3 shape.
        """
        pack = self._repo.get(pack_id)
        if pack is None:
            return None

        result = self.apply_policy_and_estimate(pack_id, actor_type=actor_type)
        items = self._repo.list_items(pack_id)
        evaluated = result.get("items", [])

        manifest_data = self._build_manifest_dict(pack, items, evaluated)
        manifest_yaml = self._dict_to_yaml(manifest_data)

        return ContextPackPreview(
            pack_id=pack_id,
            token_estimate=result["token_estimate"],
            manifest_yaml=manifest_yaml,
            sensitive_item_count=result["sensitive_item_count"] or None,
            warnings=result["warnings"] or None,
        )

    def export_yaml(
        self,
        pack_id: str,
        *,
        output_path: Path | None = None,
        actor_type: str = "user",
        actor_id: str = "user",
    ) -> Path:
        """Export context pack as YAML into exports/context-packs/.

        Returns the path of the written file.
        The file is always written atomically; existing files are not silently
        overwritten — a new timestamp-suffixed path is used if it exists.
        """
        pack = self._repo.get(pack_id)
        if pack is None:
            raise ValueError(f"Context pack '{pack_id}' not found.")

        result = self.apply_policy_and_estimate(pack_id, actor_type=actor_type)
        items = self._repo.list_items(pack_id)
        evaluated = result.get("items", [])

        manifest_data = self._build_manifest_dict(pack, items, evaluated)

        # Determine output path
        if output_path is None:
            slug = pack.title.lower().replace(" ", "-").replace("/", "-")[:40]
            filename = f"{pack.id}-{slug}.yaml"
            dest = self._context_packs_dir / filename
            # If file already exists, add timestamp suffix (no silent overwrite)
            if dest.exists():
                ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                dest = self._context_packs_dir / f"{pack.id}-{slug}-{ts}.yaml"
        else:
            dest = output_path

        dest.parent.mkdir(parents=True, exist_ok=True)
        yaml_content = self._dict_to_yaml(manifest_data)

        import os
        import tempfile
        fd, tmp = tempfile.mkstemp(prefix=dest.stem + "_", suffix=".tmp", dir=dest.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(yaml_content)
            os.replace(tmp, str(dest))
        except Exception:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

        return dest

    def export_markdown(
        self,
        pack_id: str,
        *,
        output_path: Path | None = None,
        actor_type: str = "user",
        actor_id: str = "user",
    ) -> Path:
        """Export context pack as Markdown into exports/context-packs/.

        Renders a human/agent-facing document with title, project, target,
        sensitivity, policy envelope, instructions, and the item list.
        References asset IDs/URIs only — never inlines restricted content.

        Returns the path of the written .md file.
        The file is always written atomically; existing files are not silently
        overwritten — a new timestamp-suffixed path is used if it exists.
        """
        pack = self._repo.get(pack_id)
        if pack is None:
            raise ValueError(f"Context pack '{pack_id}' not found.")

        result = self.apply_policy_and_estimate(pack_id, actor_type=actor_type)
        items = self._repo.list_items(pack_id)
        evaluated = result.get("items", [])

        md_content = self._build_markdown(pack, items, evaluated)

        # Determine output path
        if output_path is None:
            slug = pack.title.lower().replace(" ", "-").replace("/", "-")[:40]
            filename = f"{pack.id}-{slug}.md"
            dest = self._context_packs_dir / filename
            if dest.exists():
                ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                dest = self._context_packs_dir / f"{pack.id}-{slug}-{ts}.md"
        else:
            dest = output_path

        dest.parent.mkdir(parents=True, exist_ok=True)

        import os
        import tempfile
        fd, tmp = tempfile.mkstemp(prefix=dest.stem + "_", suffix=".tmp", dir=dest.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(md_content)
            os.replace(tmp, str(dest))
        except Exception:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

        return dest

    def publish(
        self,
        pack_id: str,
        *,
        destination: str = "file",
        output_path: str | None = None,
        actor_id: str = "user",
        actor_type: str = "user",
    ) -> tuple[ContextPack, dict[str, Any]]:
        """Publish a context pack.

        Steps:
        1. Check pack exists and is not archived.
        2. Evaluate policy — block if sensitive pack.
        3. Export YAML to exports/context-packs/.
        4. Update pack status to published.
        5. Emit audit event with ccdash_event_payload hook.

        Returns (pack, ccdash_event_payload). The CCDash payload is the
        integration hook — the caller/integrations agent appends it to the
        JSONL event log; we do not make any live network calls here.
        """
        pack = self._repo.get(pack_id)
        if pack is None:
            raise ValueError(f"Context pack '{pack_id}' not found.")

        pack_status = pack.status.value if hasattr(pack.status, "value") else str(pack.status)
        if pack_status == ContextPackStatus.archived.value:
            raise ConflictError("Cannot publish an archived context pack.")

        pack_sensitivity = pack.sensitivity.value if hasattr(pack.sensitivity, "value") else str(pack.sensitivity)
        policy = self._policy.evaluate_generic(
            resource_type="context_pack",
            resource_id=pack_id,
            action="publish",
            context={"sensitivity": pack_sensitivity},
        )
        if policy.decision == "deny":
            # Emit policy denied audit
            self._audit.emit_policy_denied(
                pack_id,
                "context_pack",
                actor_id=actor_id,
                project_id=pack.project_id,
                payload={"reason": policy.reason, "rule": policy.rule_triggered},
            )
            raise PermissionError(policy.reason or "Policy denied.")

        # Export YAML
        export_dest: Path | None = Path(output_path) if output_path else None
        written_path = self.export_yaml(
            pack_id,
            output_path=export_dest,
            actor_type=actor_type,
            actor_id=actor_id,
        )

        # Update status
        updated = self._repo.update_status(pack_id, ContextPackStatus.published.value)
        if updated is None:
            raise RuntimeError(f"Failed to update status for pack '{pack_id}'.")

        # CCDash event payload (hook — no live network)
        ccdash_payload: dict[str, Any] = {
            "event_type": "context_pack_published",
            "pack_id": pack_id,
            "project_id": pack.project_id,
            "title": pack.title,
            "destination": destination,
            "export_path": str(written_path),
            "sensitivity": pack_sensitivity,
            "audience": pack.audience.value if hasattr(pack.audience, "value") else str(pack.audience),
            "actor_id": actor_id,
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        }

        # Emit audit event with ccdash_event_payload embedded in payload
        self._audit.emit(
            AuditEventType.context_pack_published,
            "context_pack",
            pack_id,
            project_id=pack.project_id,
            actor_id=actor_id,
            payload={
                "destination": destination,
                "output_path": str(written_path),
                "ccdash_event_payload": ccdash_payload,
            },
        )

        return updated, ccdash_payload

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_asset_policy_info(self, asset_id: str) -> dict[str, str]:
        """Return sensitivity and agent_access for an asset, or safe defaults."""
        try:
            from app.repositories.assets import AssetRepository
            # Lazy import to avoid circular import at module level.
            # We only need sensitivity + agent_access; no full service instantiation.
            asset_repo = AssetRepository(self._registry_dir)
            asset = asset_repo.get(asset_id)
            if asset is None:
                return {"sensitivity": "personal", "agent_access": "metadata_only"}
            return {
                "sensitivity": asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity),
                "agent_access": asset.agent_access.value if hasattr(asset.agent_access, "value") else str(asset.agent_access),
            }
        except Exception:
            return {"sensitivity": "personal", "agent_access": "metadata_only"}

    def _get_assets_linked_to_node(
        self, node_id: str, status_filter: set[str]
    ) -> list[str]:
        """Return asset IDs linked to an IntentTree node via asset_links."""
        try:
            from app.repositories.assets import AssetRepository
            from app.repositories.jsonl import read_where
            asset_repo = AssetRepository(self._registry_dir)
            link_records = read_where(
                asset_repo._links_path,
                lambda r: r.get("target_type") == "intenttree_node"
                and r.get("target_id") == node_id,
            )
            result: list[str] = []
            for lr in link_records:
                asset_id = lr.get("asset_id")
                if not asset_id:
                    continue
                # Filter by status if requested
                if status_filter:
                    asset = asset_repo.get(asset_id)
                    if asset is None:
                        continue
                    asset_status = asset.status.value if hasattr(asset.status, "value") else str(asset.status)
                    if asset_status not in status_filter:
                        continue
                result.append(asset_id)
            return result
        except Exception:
            return []

    def _get_bom_slots_for_node(self, node_id: str) -> list[str]:
        """Return BOM slot IDs linked to an IntentTree node."""
        try:
            from app.repositories.bom import BomRepository
            from app.repositories.jsonl import read_where
            bom_repo = BomRepository(self._registry_dir)
            slot_records = read_where(
                bom_repo._slots_path,
                lambda r: r.get("linked_intenttree_node_id") == node_id,
            )
            return [r["id"] for r in slot_records if "id" in r]
        except Exception:
            return []

    def _build_manifest_dict(
        self,
        pack: ContextPack,
        items: list[ContextPackItem],
        evaluated: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Build a manifest dict matching spec §14.3 shape."""
        # Build effective mode lookup by item record ID
        effective_modes: dict[str, str] = {
            e["item_record_id"]: e["effective_include_mode"]
            for e in evaluated
        }

        manifest_items: list[dict[str, Any]] = []
        for item in items:
            item_type_v = item.item_type.value if hasattr(item.item_type, "value") else str(item.item_type)
            effective_mode = effective_modes.get(
                item.id,
                item.include_mode.value if hasattr(item.include_mode, "value") else str(item.include_mode),
            )
            manifest_items.append(
                {
                    "type": item_type_v,
                    "id": item.item_id,
                    "include_mode": effective_mode,
                }
            )

        pack_sensitivity = pack.sensitivity.value if hasattr(pack.sensitivity, "value") else str(pack.sensitivity)
        pack_audience = pack.audience.value if hasattr(pack.audience, "value") else str(pack.audience)
        pack_status = pack.status.value if hasattr(pack.status, "value") else str(pack.status)
        pack_target_type = pack.target_type.value if hasattr(pack.target_type, "value") else str(pack.target_type)

        policy_dict: dict[str, Any] = {}
        if pack.policy:
            policy_dict = pack.policy.model_dump(mode="json")
        else:
            policy_dict = {
                "allow_external_data": False,
                "allow_code_execution": False,
                "network_access": "none",
                "agent_access": None,
            }

        manifest: dict[str, Any] = {
            "context_pack_manifest": {
                "id": pack.id,
                "title": pack.title,
                "project_id": pack.project_id,
                "target_type": pack_target_type,
                "target_id": pack.target_id,
                "sensitivity": pack_sensitivity,
                "audience": pack_audience,
                "status": pack_status,
                "created_at": pack.created_at.isoformat() if pack.created_at else None,
                "expires_at": pack.expires_at.isoformat() if pack.expires_at else None,
                "policy": policy_dict,
                "instructions": pack.instructions,
                "items": manifest_items,
            }
        }
        return manifest

    def _dict_to_yaml(self, data: dict[str, Any]) -> str:
        """Serialize a dict to YAML, falling back to JSON-style string if unavailable."""
        if _YAML_AVAILABLE:
            return _yaml.dump(data, allow_unicode=True, sort_keys=False, default_flow_style=False)
        # Fallback: produce a minimal YAML-like text
        import json
        return "# YAML library unavailable; falling back to JSON\n" + json.dumps(data, indent=2, default=str)

    def _build_markdown(
        self,
        pack: ContextPack,
        items: list[ContextPackItem],
        evaluated: list[dict[str, Any]],
    ) -> str:
        """Render a Markdown document for a context pack (human/agent-facing).

        Spec §30 requirement: must include title, project, target, sensitivity,
        policy envelope, instructions, and item list (type + ref/uri + include_mode).
        Must never inline restricted content — only references IDs/URIs.
        """
        manifest = self._build_manifest_dict(pack, items, evaluated)
        m = manifest["context_pack_manifest"]

        lines: list[str] = []

        # Title
        lines.append(f"# {m['title']}")
        lines.append("")

        # Metadata table
        lines.append("## Metadata")
        lines.append("")
        lines.append(f"| Field | Value |")
        lines.append(f"|-------|-------|")
        lines.append(f"| ID | `{m['id']}` |")
        lines.append(f"| Project | `{m['project_id']}` |")
        lines.append(f"| Target | `{m['target_type']}` / `{m['target_id']}` |")
        lines.append(f"| Sensitivity | `{m['sensitivity']}` |")
        lines.append(f"| Audience | `{m['audience']}` |")
        lines.append(f"| Status | `{m['status']}` |")
        if m.get("created_at"):
            lines.append(f"| Created | {m['created_at']} |")
        if m.get("expires_at"):
            lines.append(f"| Expires | {m['expires_at']} |")
        lines.append("")

        # Policy envelope
        lines.append("## Policy Envelope")
        lines.append("")
        policy = m.get("policy") or {}
        lines.append(f"| Policy | Value |")
        lines.append(f"|--------|-------|")
        lines.append(f"| Allow external data | `{policy.get('allow_external_data', False)}` |")
        lines.append(f"| Allow code execution | `{policy.get('allow_code_execution', False)}` |")
        lines.append(f"| Network access | `{policy.get('network_access', 'none')}` |")
        if policy.get("agent_access") is not None:
            lines.append(f"| Agent access | `{policy['agent_access']}` |")
        if policy.get("expiry") is not None:
            lines.append(f"| Expiry | `{policy['expiry']}` |")
        lines.append("")

        # Instructions
        instructions = m.get("instructions")
        if instructions:
            lines.append("## Instructions")
            lines.append("")
            lines.append(instructions)
            lines.append("")

        # Items
        lines.append("## Items")
        lines.append("")
        manifest_items = m.get("items") or []
        if manifest_items:
            lines.append("| # | Type | Reference/URI | Include Mode |")
            lines.append("|---|------|---------------|-------------|")
            for idx, item in enumerate(manifest_items, start=1):
                item_type = item.get("type", "")
                item_id = item.get("id", "")
                include_mode = item.get("include_mode", "")
                # Reference only — never inline content
                lines.append(f"| {idx} | `{item_type}` | `{item_id}` | `{include_mode}` |")
        else:
            lines.append("_(no items)_")
        lines.append("")

        return "\n".join(lines)

    def to_markdown(self, pack_id: str, *, actor_type: str = "user") -> str:
        """Return Markdown string for a context pack without writing to disk.

        Applies policy to each item. Returns the rendered Markdown text.
        Raises ValueError if pack not found.
        """
        pack = self._repo.get(pack_id)
        if pack is None:
            raise ValueError(f"Context pack '{pack_id}' not found.")
        result = self.apply_policy_and_estimate(pack_id, actor_type=actor_type)
        items = self._repo.list_items(pack_id)
        evaluated = result.get("items", [])
        return self._build_markdown(pack, items, evaluated)
