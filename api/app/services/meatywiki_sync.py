"""MeatyWiki sync adapter (INT-001, INT-002).

Responsibilities:
- INT-001: Export asset cards as Markdown + YAML frontmatter to
  exports/meatywiki/assets/*.md (deterministic path; no overwrite without
  explicit confirm flag).
- INT-002: Generate DRAFT decision/writeback notes for template apply,
  canonical promotion, context-pack publish -> exports/meatywiki/decisions/*.md
  (suggestions only — never silent writes).

Hard rules:
- Exports are DRAFTS by default; no live MeatyWiki API calls in MVP.
- NO overwrite of existing files without confirm=True.
- Sensitive asset content is never embedded; only metadata is exported.
- Every export records an audit event.
"""

from __future__ import annotations

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# YAML is a project dependency but guard for test environments
try:
    import yaml as _yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Frontmatter builder
# ---------------------------------------------------------------------------


def _build_frontmatter(fields: dict[str, Any]) -> str:
    """Render YAML frontmatter block."""
    if _YAML_AVAILABLE:
        body = _yaml.dump(fields, allow_unicode=True, sort_keys=False, default_flow_style=False)
    else:
        # Minimal fallback
        lines = []
        for k, v in fields.items():
            if isinstance(v, list):
                lines.append(f"{k}: {v!r}")
            else:
                lines.append(f"{k}: {v!r}" if isinstance(v, str) else f"{k}: {v}")
        body = "\n".join(lines) + "\n"
    return f"---\n{body}---\n"


def _write_atomic(dest: Path, content: str, *, confirm: bool = False) -> tuple[Path, bool]:
    """Write content to dest atomically.

    Returns (dest, wrote) where wrote=False if file existed and confirm=False.
    """
    if dest.exists() and not confirm:
        return dest, False
    dest.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=dest.stem + "_", suffix=".tmp", dir=dest.parent)
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
    return dest, True


# ---------------------------------------------------------------------------
# Asset card builder
# ---------------------------------------------------------------------------


def _asset_card_path(assets_dir: Path, asset_id: str) -> Path:
    """Deterministic path for an asset card."""
    return assets_dir / f"{asset_id}.md"


def _build_asset_card(asset: Any) -> str:
    """Build Markdown + YAML frontmatter for an asset card.

    The 'asset' parameter is an Asset model or a dict with the same fields.
    Sensitive content is never embedded — metadata only.
    """
    def _v(obj: Any, attr: str, default: Any = None) -> Any:
        if hasattr(obj, attr):
            val = getattr(obj, attr)
            return val.value if hasattr(val, "value") else val
        if isinstance(obj, dict):
            return obj.get(attr, default)
        return default

    asset_id = _v(asset, "id", "")
    title = _v(asset, "title", "")
    project_id = _v(asset, "project_id")
    artifact_type_id = _v(asset, "artifact_type_id")
    source_kind = _v(asset, "source_kind", "manual")
    uri = _v(asset, "uri", "")
    status = _v(asset, "status", "")
    sensitivity = _v(asset, "sensitivity", "personal")
    agent_access = _v(asset, "agent_access", "metadata_only")
    description = _v(asset, "description")

    # Collect intenttree node IDs if stored in metadata
    metadata = _v(asset, "metadata") or {}
    intenttree_nodes: list[str] = metadata.get("intenttree_nodes", [])
    bom_slots: list[str] = metadata.get("bom_slots", [])

    frontmatter: dict[str, Any] = {
        "type": "artifact_asset",
        "asset_id": asset_id,
        "project": project_id,
        "title": title,
        "artifact_type": artifact_type_id,
        "source_kind": source_kind,
        "uri": uri,
        "status": status,
        "sensitivity": sensitivity,
        "intenttree_nodes": intenttree_nodes,
        "bom_slots": bom_slots,
        "agent_access": agent_access,
        "exported_at": datetime.now(tz=timezone.utc).isoformat(),
    }

    fm_block = _build_frontmatter(frontmatter)
    body_lines = [f"# {title}"]
    if description:
        body_lines.append("")
        body_lines.append(description)
    body_lines.append("")
    body_lines.append(f"*Asset ID: `{asset_id}`*")
    body_lines.append(f"*Sensitivity: {sensitivity} | Agent access: {agent_access}*")

    return fm_block + "\n".join(body_lines) + "\n"


# ---------------------------------------------------------------------------
# Decision note builder
# ---------------------------------------------------------------------------


def _decision_note_path(decisions_dir: Path, event_type: str, target_id: str, ts: str) -> Path:
    """Deterministic path for a decision note."""
    safe_target = target_id.replace("/", "_")[:40]
    return decisions_dir / f"{event_type}-{safe_target}-{ts}.md"


def _build_decision_note(
    *,
    event_type: str,
    actor: str,
    target_type: str,
    target_id: str,
    summary: str,
    payload: dict[str, Any] | None = None,
) -> str:
    """Build a DRAFT decision/writeback note as Markdown.

    Per spec: H3 section with timestamp, event type, actor, summary.
    """
    now = datetime.now(tz=timezone.utc)
    ts_display = now.strftime("%Y-%m-%d %H:%M UTC")

    frontmatter: dict[str, Any] = {
        "type": "decision_writeback",
        "event_type": event_type,
        "target_type": target_type,
        "target_id": target_id,
        "actor": actor,
        "timestamp": now.isoformat(),
        "draft": True,
    }
    fm_block = _build_frontmatter(frontmatter)

    lines = [
        f"### {event_type.replace('_', ' ').title()} — {ts_display}",
        "",
        f"**Actor:** {actor}  ",
        f"**Target:** {target_type} `{target_id}`  ",
        f"**Event:** `{event_type}`",
        "",
        summary,
    ]
    if payload:
        lines.append("")
        lines.append("**Details:**")
        for k, v in payload.items():
            lines.append(f"- `{k}`: {v}")

    return fm_block + "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# MeatyWiki sync service
# ---------------------------------------------------------------------------


class MeatyWikiSync:
    """Local-first adapter for MeatyWiki export.

    Writes DRAFT asset cards and decision notes to the configured export dirs.
    No live API calls in MVP.
    """

    def __init__(
        self,
        exports_root: Path,
        *,
        audit_service: Any | None = None,
    ) -> None:
        # Derive sub-dirs from exports root, matching config/integrations.yaml
        self._assets_dir = exports_root / "assets"
        self._decisions_dir = exports_root / "decisions"
        self._audit = audit_service

    # ------------------------------------------------------------------
    # INT-001: Asset card export
    # ------------------------------------------------------------------

    def export_asset_card(
        self,
        asset: Any,
        *,
        confirm: bool = False,
        actor_id: str = "user",
    ) -> dict[str, Any]:
        """Export an asset record as a Markdown asset card.

        Args:
            asset: Asset model or dict with asset fields.
            confirm: If True, overwrite existing file. Default False.
            actor_id: Actor performing the export (for audit).

        Returns:
            dict with keys: path (str), written (bool), skipped (bool).
        """
        def _v(obj: Any, attr: str, default: Any = None) -> Any:
            if hasattr(obj, attr):
                val = getattr(obj, attr)
                return val.value if hasattr(val, "value") else val
            if isinstance(obj, dict):
                return obj.get(attr, default)
            return default

        asset_id = _v(asset, "id", "unknown")
        dest = _asset_card_path(self._assets_dir, asset_id)
        content = _build_asset_card(asset)
        written_path, wrote = _write_atomic(dest, content, confirm=confirm)

        if self._audit is not None and wrote:
            try:
                from app.models.vocabulary import AuditEventType
                self._audit.emit(
                    AuditEventType.sync_completed,
                    "asset",
                    asset_id,
                    actor_id=actor_id,
                    payload={
                        "integration": "meatywiki",
                        "export_type": "asset_card",
                        "path": str(written_path),
                    },
                )
            except Exception:
                pass

        return {
            "path": str(written_path),
            "written": wrote,
            "skipped": not wrote,
        }

    def export_asset_cards_batch(
        self,
        assets: list[Any],
        *,
        confirm: bool = False,
        actor_id: str = "user",
    ) -> list[dict[str, Any]]:
        """Export multiple asset cards. Returns list of result dicts."""
        return [
            self.export_asset_card(a, confirm=confirm, actor_id=actor_id)
            for a in assets
        ]

    # ------------------------------------------------------------------
    # INT-002: Decision note export
    # ------------------------------------------------------------------

    def export_decision_note(
        self,
        *,
        event_type: str,
        actor: str,
        target_type: str,
        target_id: str,
        summary: str,
        payload: dict[str, Any] | None = None,
        confirm: bool = False,
    ) -> dict[str, Any]:
        """Generate and export a DRAFT decision writeback note.

        Always exports as a DRAFT — never silently overwrites.

        Args:
            event_type: The triggering event (e.g., 'template_apply',
                        'canonical_promotion', 'context_pack_publish').
            actor: Actor performing the action.
            target_type: Type of the target entity.
            target_id: ID of the target entity.
            summary: Human-readable summary sentence.
            payload: Optional structured detail fields.
            confirm: If True, overwrite existing file. Default False.

        Returns:
            dict with keys: path (str), written (bool), skipped (bool), draft (bool).
        """
        ts = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        dest = _decision_note_path(self._decisions_dir, event_type, target_id, ts)
        content = _build_decision_note(
            event_type=event_type,
            actor=actor,
            target_type=target_type,
            target_id=target_id,
            summary=summary,
            payload=payload,
        )
        written_path, wrote = _write_atomic(dest, content, confirm=confirm)

        return {
            "path": str(written_path),
            "written": wrote,
            "skipped": not wrote,
            "draft": True,
        }

    def export_template_apply_note(
        self,
        *,
        template_id: str,
        project_id: str,
        actor: str = "user",
        slots_added: int = 0,
    ) -> dict[str, Any]:
        """Convenience wrapper for template apply decision note."""
        return self.export_decision_note(
            event_type="template_apply",
            actor=actor,
            target_type="template",
            target_id=template_id,
            summary=(
                f"Template `{template_id}` applied to project `{project_id}`. "
                f"{slots_added} slot(s) added to the BOM."
            ),
            payload={"project_id": project_id, "slots_added": slots_added},
        )

    def export_canonical_promotion_note(
        self,
        *,
        asset_id: str,
        project_id: str | None,
        actor: str = "user",
    ) -> dict[str, Any]:
        """Convenience wrapper for canonical promotion decision note."""
        return self.export_decision_note(
            event_type="canonical_promotion",
            actor=actor,
            target_type="asset",
            target_id=asset_id,
            summary=(
                f"Asset `{asset_id}` promoted to canonical status in project "
                f"`{project_id or 'unknown'}`. Human review required before this "
                "writeback is accepted."
            ),
            payload={"project_id": project_id, "requires_review": True},
        )

    def export_context_pack_publish_note(
        self,
        *,
        pack_id: str,
        project_id: str | None,
        title: str = "",
        actor: str = "user",
    ) -> dict[str, Any]:
        """Convenience wrapper for context-pack publish decision note."""
        return self.export_decision_note(
            event_type="context_pack_publish",
            actor=actor,
            target_type="context_pack",
            target_id=pack_id,
            summary=(
                f"Context pack `{pack_id}` ({title!r}) published for project "
                f"`{project_id or 'unknown'}`."
            ),
            payload={"project_id": project_id, "title": title},
        )
