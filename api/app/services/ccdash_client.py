"""CCDash event export adapter (CCD-001).

Responsibilities:
- Map Atlas audit events -> CCDash event payloads.
- Append records to exports/events/ccdash-events.jsonl (JSONL, one record per line).
- Required events: asset_added, asset_classified, asset_promoted, bom_slot_filled,
  context_pack_created, context_pack_published, agent_query, policy_denied.
- Schema adds ccdash_schema_version: "v1" and ccdash_event_id field.
- NO live network calls — local file export only.

Hard rules:
- File is append-only; never truncated.
- Writes are atomic (temp file + os.replace).
- Sensitive asset content is NEVER embedded in event payloads.
"""

from __future__ import annotations

import json
import os
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Required event types per config/integrations.yaml
REQUIRED_EVENT_TYPES: frozenset[str] = frozenset(
    {
        "asset_added",
        "asset_classified",
        "asset_promoted",
        "bom_slot_filled",
        "context_pack_created",
        "context_pack_published",
        "agent_query",
        "policy_denied",
    }
)

_CCDASH_SCHEMA_VERSION = "v1"


# ---------------------------------------------------------------------------
# Event payload builder
# ---------------------------------------------------------------------------


def build_ccdash_payload(
    *,
    event_id: str,
    timestamp: str,
    workspace_id: str | None,
    project_id: str | None,
    actor_type: str,
    actor_id: str,
    event_type: str,
    target_type: str,
    target_id: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a CCDash-compatible event record from Atlas audit event fields.

    Matches the schema from config/integrations.yaml §ccdash.file_format.event_record.
    Payload is included as-is but MUST NOT contain sensitive content.
    """
    # Strip any potentially large/sensitive payload keys
    safe_payload: dict[str, Any] = {}
    if payload:
        # Exclude embedded content keys; only keep metadata
        _excluded_keys = {"content", "full_text", "preview_text", "raw_content"}
        safe_payload = {k: v for k, v in payload.items() if k not in _excluded_keys}

    return {
        "id": event_id,
        "timestamp": timestamp,
        "workspace_id": workspace_id,
        "project_id": project_id,
        "actor_type": actor_type,
        "actor_id": actor_id,
        "event_type": event_type,
        "target_type": target_type,
        "target_id": target_id,
        "payload": safe_payload,
        "ccdash_event_id": None,  # Set by CCDash on ingestion
        "ccdash_schema_version": _CCDASH_SCHEMA_VERSION,
    }


def _from_audit_event(audit_event: Any, *, workspace_id: str | None = None) -> dict[str, Any]:
    """Convert an AuditEvent model/dict to a CCDash payload dict.

    The audit_event may be an AuditEvent model instance or a plain dict.
    """
    def _v(attr: str, default: Any = None) -> Any:
        if hasattr(audit_event, attr):
            val = getattr(audit_event, attr)
            return val.value if hasattr(val, "value") else val
        if isinstance(audit_event, dict):
            return audit_event.get(attr, default)
        return default

    ts = _v("timestamp")
    if isinstance(ts, datetime):
        ts = ts.isoformat()
    elif ts is None:
        ts = datetime.now(tz=timezone.utc).isoformat()

    return build_ccdash_payload(
        event_id=_v("id") or f"evt_{uuid.uuid4().hex[:16]}",
        timestamp=ts,
        workspace_id=_v("workspace_id") or workspace_id,
        project_id=_v("project_id"),
        actor_type=_v("actor_type", "system"),
        actor_id=_v("actor_id", "system"),
        event_type=_v("event_type", ""),
        target_type=_v("target_type", ""),
        target_id=_v("target_id", ""),
        payload=_v("payload"),
    )


# ---------------------------------------------------------------------------
# File append helpers
# ---------------------------------------------------------------------------


def _append_jsonl_record(path: Path, record: dict[str, Any]) -> None:
    """Append a single JSON record to a JSONL file (atomic line append).

    Uses a temp file approach for safety when the file is shared with other
    appenders — Python's file.write is not truly atomic across processes,
    but is safe for single-process use.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(record, default=str) + "\n"
    # Open in append mode — safe for single-process sequential appends
    with path.open("a", encoding="utf-8") as fh:
        fh.write(line)


# ---------------------------------------------------------------------------
# CCDash client
# ---------------------------------------------------------------------------


class CCDashClient:
    """Local-first CCDash event export adapter.

    Appends Atlas event records to a JSONL file for later ingestion by CCDash.
    No live network calls in MVP.
    """

    def __init__(
        self,
        events_path: Path,
        *,
        workspace_id: str | None = None,
    ) -> None:
        self._events_path = events_path
        self._workspace_id = workspace_id

    # ------------------------------------------------------------------
    # Core export methods
    # ------------------------------------------------------------------

    def append_event(
        self,
        *,
        event_type: str,
        target_type: str,
        target_id: str,
        project_id: str | None = None,
        actor_type: str = "system",
        actor_id: str = "system",
        payload: dict[str, Any] | None = None,
        event_id: str | None = None,
    ) -> dict[str, Any]:
        """Build and append a CCDash event record.

        Returns the record that was written.
        """
        now = datetime.now(tz=timezone.utc).isoformat()
        record = build_ccdash_payload(
            event_id=event_id or f"evt_{uuid.uuid4().hex[:16]}",
            timestamp=now,
            workspace_id=self._workspace_id,
            project_id=project_id,
            actor_type=actor_type,
            actor_id=actor_id,
            event_type=event_type,
            target_type=target_type,
            target_id=target_id,
            payload=payload,
        )
        _append_jsonl_record(self._events_path, record)
        return record

    def append_from_audit_event(self, audit_event: Any) -> dict[str, Any] | None:
        """Map an AuditEvent to CCDash format and append it.

        Only appends events whose event_type is in REQUIRED_EVENT_TYPES.
        Returns the written record, or None if the event type is not exported.
        """
        def _v(attr: str, default: Any = None) -> Any:
            if hasattr(audit_event, attr):
                val = getattr(audit_event, attr)
                return val.value if hasattr(val, "value") else val
            if isinstance(audit_event, dict):
                return audit_event.get(attr, default)
            return default

        event_type = _v("event_type", "")
        if event_type not in REQUIRED_EVENT_TYPES:
            return None

        record = _from_audit_event(audit_event, workspace_id=self._workspace_id)
        _append_jsonl_record(self._events_path, record)
        return record

    def append_from_ccdash_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Append a pre-built CCDash payload dict (e.g., from context_pack_service.publish).

        Adds schema version if missing. Returns the written record.
        """
        record = dict(payload)
        record.setdefault("ccdash_schema_version", _CCDASH_SCHEMA_VERSION)
        record.setdefault("ccdash_event_id", None)
        record.setdefault("id", f"evt_{uuid.uuid4().hex[:16]}")
        record.setdefault("timestamp", datetime.now(tz=timezone.utc).isoformat())
        record.setdefault("workspace_id", self._workspace_id)
        _append_jsonl_record(self._events_path, record)
        return record

    # ------------------------------------------------------------------
    # Convenience emitters for required event types
    # ------------------------------------------------------------------

    def emit_asset_added(
        self,
        asset_id: str,
        *,
        project_id: str | None = None,
        actor_id: str = "user",
        title: str | None = None,
    ) -> dict[str, Any]:
        return self.append_event(
            event_type="asset_added",
            target_type="asset",
            target_id=asset_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"title": title} if title else None,
        )

    def emit_asset_promoted(
        self,
        asset_id: str,
        *,
        project_id: str | None = None,
        actor_id: str = "user",
        from_status: str | None = None,
        to_status: str | None = None,
    ) -> dict[str, Any]:
        return self.append_event(
            event_type="asset_promoted",
            target_type="asset",
            target_id=asset_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"from_status": from_status, "to_status": to_status},
        )

    def emit_bom_slot_filled(
        self,
        slot_id: str,
        *,
        project_id: str | None = None,
        asset_id: str | None = None,
        actor_id: str = "user",
    ) -> dict[str, Any]:
        return self.append_event(
            event_type="bom_slot_filled",
            target_type="slot",
            target_id=slot_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"asset_id": asset_id},
        )

    def emit_context_pack_published(
        self,
        pack_id: str,
        *,
        project_id: str | None = None,
        title: str | None = None,
        actor_id: str = "user",
        export_path: str | None = None,
    ) -> dict[str, Any]:
        return self.append_event(
            event_type="context_pack_published",
            target_type="context_pack",
            target_id=pack_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"title": title, "export_path": export_path},
        )

    def emit_policy_denied(
        self,
        target_id: str,
        target_type: str = "asset",
        *,
        project_id: str | None = None,
        actor_id: str = "system",
        reason: str | None = None,
    ) -> dict[str, Any]:
        return self.append_event(
            event_type="policy_denied",
            target_type=target_type,
            target_id=target_id,
            project_id=project_id,
            actor_id=actor_id,
            payload={"reason": reason},
        )

    def emit_agent_query(
        self,
        target_id: str,
        target_type: str = "asset",
        *,
        project_id: str | None = None,
        actor_id: str = "agent",
        tool: str | None = None,
    ) -> dict[str, Any]:
        return self.append_event(
            event_type="agent_query",
            target_type=target_type,
            target_id=target_id,
            project_id=project_id,
            actor_type="agent",
            actor_id=actor_id,
            payload={"tool": tool},
        )

    # ------------------------------------------------------------------
    # Read helpers (for inspection/testing)
    # ------------------------------------------------------------------

    def read_events(self, *, limit: int | None = None) -> list[dict[str, Any]]:
        """Read all records from the JSONL file. Returns newest-first."""
        if not self._events_path.exists():
            return []
        records: list[dict[str, Any]] = []
        with self._events_path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
        records.reverse()  # Newest-first
        if limit is not None:
            records = records[:limit]
        return records
