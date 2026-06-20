"""IntentTree node ref adapter (INT-003, INT-004).

Responsibilities:
- INT-003: Local adapter interface for node lookup/display and node-context
  payloads. Works from manual node fixture/ref; replaceable by live API later.
- INT-004: Build explicit DRAFT task suggestion payloads from BOM gaps.
  NEVER auto-creates tasks — returns payload for user approval only.

Design:
- NodeRef is the local record structure (mirrors config/integrations.yaml schema).
- IntentTreeSync loads nodes from a YAML/JSON export file (export_path config).
- If no export file is configured, returns empty/None — no crash.
- Gap->Task payloads are pure data (DraftTaskSuggestion from bom model).
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import yaml as _yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# NodeRef — local representation of an IntentTree node
# ---------------------------------------------------------------------------


class NodeRef:
    """Local representation of an IntentTree node (from export file or fixture)."""

    __slots__ = (
        "node_id",
        "title",
        "parent_id",
        "status",
        "expected_artifacts",
        "required_context",
        "bom_slots",
        "metadata",
    )

    def __init__(
        self,
        node_id: str,
        title: str,
        *,
        parent_id: str | None = None,
        status: str = "active",
        expected_artifacts: list[str] | None = None,
        required_context: list[str] | None = None,
        bom_slots: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.node_id = node_id
        self.title = title
        self.parent_id = parent_id
        self.status = status
        self.expected_artifacts = expected_artifacts or []
        self.required_context = required_context or []
        self.bom_slots = bom_slots or []
        self.metadata = metadata or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "node_id": self.node_id,
            "title": self.title,
            "parent_id": self.parent_id,
            "status": self.status,
            "expected_artifacts": self.expected_artifacts,
            "required_context": self.required_context,
            "bom_slots": self.bom_slots,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "NodeRef":
        return cls(
            node_id=data.get("node_id", ""),
            title=data.get("title", ""),
            parent_id=data.get("parent_id"),
            status=data.get("status", "active"),
            expected_artifacts=data.get("expected_artifacts", []),
            required_context=data.get("required_context", []),
            bom_slots=data.get("bom_slots", []),
            metadata=data.get("metadata", {}),
        )


# ---------------------------------------------------------------------------
# GapTaskPayload — Draft task suggestion payload (INT-004)
# ---------------------------------------------------------------------------


class GapTaskPayload:
    """DRAFT IntentTree task suggestion from a BOM gap.

    This is NEVER auto-created. The user must explicitly approve before any
    task creation occurs in an external system.
    """

    __slots__ = (
        "suggestion_only",
        "title",
        "description",
        "slot_id",
        "slot_domain",
        "artifact_type_id",
        "priority",
        "node_id",
        "project_id",
        "generated_at",
    )

    def __init__(
        self,
        *,
        title: str,
        description: str,
        slot_id: str,
        slot_domain: str,
        artifact_type_id: str,
        priority: str = "medium",
        node_id: str | None = None,
        project_id: str | None = None,
    ) -> None:
        self.suggestion_only = True  # Always True
        self.title = title
        self.description = description
        self.slot_id = slot_id
        self.slot_domain = slot_domain
        self.artifact_type_id = artifact_type_id
        self.priority = priority
        self.node_id = node_id
        self.project_id = project_id
        self.generated_at = datetime.now(tz=timezone.utc).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "suggestion_only": self.suggestion_only,
            "title": self.title,
            "description": self.description,
            "slot_id": self.slot_id,
            "slot_domain": self.slot_domain,
            "artifact_type_id": self.artifact_type_id,
            "priority": self.priority,
            "node_id": self.node_id,
            "project_id": self.project_id,
            "generated_at": self.generated_at,
        }


# ---------------------------------------------------------------------------
# IntentTree sync adapter
# ---------------------------------------------------------------------------


def _load_nodes_from_file(export_path: Path) -> list[NodeRef]:
    """Load node refs from a YAML/JSON export file.

    Returns empty list if file not found or unreadable.
    """
    if not export_path.exists():
        return []
    try:
        with export_path.open("r", encoding="utf-8") as fh:
            content = fh.read()
        data: Any = None
        if export_path.suffix in (".yaml", ".yml") and _YAML_AVAILABLE:
            data = _yaml.safe_load(content)
        else:
            import json
            data = json.loads(content)
        if not isinstance(data, list):
            return []
        return [NodeRef.from_dict(item) for item in data if isinstance(item, dict)]
    except Exception:
        return []


class IntentTreeSync:
    """Local adapter for IntentTree node refs and task suggestion payloads.

    MVP behaviour:
    - Reads nodes from an export file (YAML/JSON) if configured.
    - If no file is configured, works from in-memory fixtures loaded via
      load_fixtures().
    - Never makes live API calls.
    - build_gap_task_payload() returns a GapTaskPayload (DRAFT only).
    """

    def __init__(
        self,
        *,
        export_path: Path | None = None,
        link_export_path: Path | None = None,
    ) -> None:
        self._export_path = export_path
        self._link_export_path = link_export_path
        self._fixtures: dict[str, NodeRef] = {}
        self._nodes_cache: list[NodeRef] | None = None

    # ------------------------------------------------------------------
    # Node management
    # ------------------------------------------------------------------

    def load_fixtures(self, nodes: list[NodeRef | dict[str, Any]]) -> None:
        """Load in-memory node fixtures (for testing or manual refs).

        Can be called before any lookup — replaces any previously loaded fixtures.
        """
        self._fixtures = {}
        for n in nodes:
            ref = NodeRef.from_dict(n) if isinstance(n, dict) else n
            self._fixtures[ref.node_id] = ref
        self._nodes_cache = None  # Invalidate cache

    def _all_nodes(self) -> list[NodeRef]:
        """Return merged node list: fixtures + export file nodes (file wins on conflict)."""
        if self._nodes_cache is not None:
            return self._nodes_cache

        nodes: dict[str, NodeRef] = dict(self._fixtures)
        if self._export_path:
            for ref in _load_nodes_from_file(self._export_path):
                nodes[ref.node_id] = ref
        self._nodes_cache = list(nodes.values())
        return self._nodes_cache

    def get_node(self, node_id: str) -> NodeRef | None:
        """Look up a node by ID. Returns None if not found."""
        for node in self._all_nodes():
            if node.node_id == node_id:
                return node
        return None

    def list_nodes(self) -> list[NodeRef]:
        """Return all available node refs."""
        return self._all_nodes()

    def node_context_payload(
        self,
        node_id: str,
        *,
        asset_ids: list[str] | None = None,
        bom_slot_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        """Build a node context payload for agent/MCP consumption.

        Returns metadata-only refs — no full content is embedded.
        If the node is not found, returns a stub with missing_integration marker.
        """
        node = self.get_node(node_id)
        if node is None:
            return {
                "node_id": node_id,
                "found": False,
                "missing_integration": True,
                "note": (
                    "[MISSING INTEGRATION] Node not found in local export. "
                    "Configure intenttree.mvp_read.export_path in config/integrations.yaml."
                ),
                "linked_assets": asset_ids or [],
                "bom_slots": bom_slot_ids or [],
            }
        return {
            "node_id": node.node_id,
            "title": node.title,
            "status": node.status,
            "parent_id": node.parent_id,
            "found": True,
            "expected_artifacts": node.expected_artifacts,
            "required_context": node.required_context,
            "bom_slots": node.bom_slots + (bom_slot_ids or []),
            "linked_assets": asset_ids or [],
        }

    # ------------------------------------------------------------------
    # INT-004: Gap->Task suggestion payloads
    # ------------------------------------------------------------------

    def build_gap_task_payloads(
        self,
        gaps: list[Any],
        *,
        project_id: str | None = None,
    ) -> list[GapTaskPayload]:
        """Build DRAFT task suggestion payloads from BOM gap records.

        Args:
            gaps: List of gap objects/dicts with slot_id, slot_domain,
                  artifact_type_id, priority fields (or GapRecommendation models).
            project_id: Project context for the task suggestions.

        Returns:
            List of GapTaskPayload objects — NEVER auto-created, user must approve.
        """
        payloads: list[GapTaskPayload] = []
        for gap in gaps:
            def _gv(attr: str, default: Any = "") -> Any:
                if hasattr(gap, attr):
                    val = getattr(gap, attr)
                    return val.value if hasattr(val, "value") else val
                if isinstance(gap, dict):
                    return gap.get(attr, default)
                return default

            slot_id = _gv("slot_id", "")
            slot_domain = _gv("slot_domain", _gv("domain", "unknown"))
            artifact_type_id = _gv("artifact_type_id", "")
            priority = _gv("priority", "medium")
            node_id = _gv("node_id") or _gv("linked_intenttree_node_id")

            title = f"Fill BOM gap: {artifact_type_id} in {slot_domain}"
            description = (
                f"BOM slot `{slot_id}` in domain `{slot_domain}` requires "
                f"an artifact of type `{artifact_type_id}`. Priority: {priority}. "
                "This is a DRAFT suggestion — user must approve before creating a task."
            )

            payloads.append(
                GapTaskPayload(
                    title=title,
                    description=description,
                    slot_id=slot_id,
                    slot_domain=slot_domain,
                    artifact_type_id=artifact_type_id,
                    priority=priority,
                    node_id=node_id if node_id else None,
                    project_id=project_id,
                )
            )
        return payloads

    def export_link_manifest(
        self,
        asset_node_links: list[dict[str, Any]],
        *,
        confirm: bool = False,
    ) -> dict[str, Any]:
        """Export an asset-to-node link manifest YAML.

        Per config/integrations.yaml format:
        - asset_id, node_id, relationship, confidence, assigned_at

        Args:
            asset_node_links: List of link dicts.
            confirm: If True, overwrite existing manifest.

        Returns:
            dict with path (str), written (bool).
        """
        if self._link_export_path is None:
            return {"path": None, "written": False, "error": "link_export_path not configured"}

        dest = self._link_export_path / "atlas-node-links.yaml"
        if dest.exists() and not confirm:
            return {"path": str(dest), "written": False, "skipped": True}

        dest.parent.mkdir(parents=True, exist_ok=True)
        now = datetime.now(tz=timezone.utc).isoformat()
        content_data = {
            "generated_at": now,
            "links": asset_node_links,
        }

        if _YAML_AVAILABLE:
            content = _yaml.dump(content_data, allow_unicode=True, sort_keys=False)
        else:
            import json
            content = json.dumps(content_data, indent=2, default=str)

        import os
        import tempfile
        fd, tmp = tempfile.mkstemp(prefix="atlas-node-links_", suffix=".tmp", dir=dest.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(content)
            os.replace(tmp, str(dest))
        except Exception:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

        return {"path": str(dest), "written": True}
