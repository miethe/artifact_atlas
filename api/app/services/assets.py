"""Asset service (SVC-002): asset CRUD, metadata edit, search/filter, link creation,
status transitions — emit audit events; enforce policy on content access.

Status transition rules (from workspace.yaml vocabulary):
  inbox → raw → candidate → in_review | in_progress → selected → canonical
  Any status → archived (tombstone preferred, or status=archived)
  canonical / archived are terminal (no further forward transitions)
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

from app.models.asset import (
    Asset,
    AssetCreate,
    AssetLink,
    AssetLinkCreate,
    AssetPromoteRequest,
    AssetRelationship,
    AssetUpdate,
)
from app.models.policy import Policy
from app.models.vocabulary import (
    AgentAccess,
    AssetLinkRelationship,
    AssetRelationshipType,
    AssetStatus,
    AuditEventType,
    IncludeMode,
    Sensitivity,
)
from app.repositories.assets import AssetRepository
from app.services.audit import AuditService
from app.services.policy import PolicyService

# ---------------------------------------------------------------------------
# Status transition adjacency
# ---------------------------------------------------------------------------

_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    AssetStatus.inbox.value: {AssetStatus.raw.value, AssetStatus.archived.value},
    AssetStatus.raw.value: {
        AssetStatus.candidate.value,
        AssetStatus.archived.value,
        AssetStatus.inbox.value,
    },
    AssetStatus.candidate.value: {
        AssetStatus.in_review.value,
        AssetStatus.in_progress.value,
        AssetStatus.archived.value,
        AssetStatus.raw.value,
    },
    AssetStatus.in_review.value: {
        AssetStatus.selected.value,
        AssetStatus.candidate.value,
        AssetStatus.archived.value,
    },
    AssetStatus.in_progress.value: {
        AssetStatus.selected.value,
        AssetStatus.candidate.value,
        AssetStatus.archived.value,
    },
    AssetStatus.selected.value: {
        AssetStatus.canonical.value,
        AssetStatus.in_review.value,
        AssetStatus.archived.value,
    },
    # Terminal states — no further forward transitions
    AssetStatus.canonical.value: {AssetStatus.archived.value},
    AssetStatus.archived.value: set(),
}


class StatusTransitionError(ValueError):
    """Raised when a requested status transition is not permitted."""


class PolicyDeniedError(PermissionError):
    """Raised when policy evaluation denies an action."""

    def __init__(self, policy: Policy) -> None:
        self.policy = policy
        super().__init__(policy.reason or "Policy denied.")


class AssetService:
    """Business logic for asset lifecycle management.

    Coordinates: AssetRepository (persistence), AuditService (events),
    PolicyService (access control).
    """

    def __init__(
        self,
        registry_dir: Path,
        *,
        audit_service: AuditService | None = None,
        policy_service: PolicyService | None = None,
    ) -> None:
        self._assets = AssetRepository(registry_dir)
        self._audit = audit_service or AuditService(registry_dir)
        self._policy = policy_service or PolicyService()

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    def list_assets(
        self,
        *,
        project_id: str | None = None,
        include_deleted: bool = False,
    ) -> list[Asset]:
        """Return assets, optionally filtered by project_id."""
        return self._assets.list(project_id=project_id, include_deleted=include_deleted)

    def get_asset(self, asset_id: str) -> Asset | None:
        """Return a single asset by ID, or None."""
        return self._assets.get(asset_id)

    def create_asset(
        self,
        data: AssetCreate,
        *,
        project_id: str | None = None,
        asset_id: str | None = None,
        actor_id: str = "system",
    ) -> Asset:
        """Create a new asset and emit asset_added audit event.

        Args:
            data: Validated create payload.
            project_id: Optional project scope.
            asset_id: Optional pre-generated ID.
            actor_id: Actor creating the asset (for audit).

        Returns:
            The persisted Asset.
        """
        aid = asset_id or f"asset_{uuid.uuid4().hex[:16]}"
        asset = self._assets.create(aid, data, project_id=project_id)
        self._audit.emit_asset_added(
            asset.id,
            project_id=project_id,
            actor_id=actor_id,
            payload={
                "title": asset.title,
                "source_kind": asset.source_kind.value if hasattr(asset.source_kind, "value") else str(asset.source_kind),
                "status": asset.status.value if hasattr(asset.status, "value") else str(asset.status),
                "sensitivity": asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity),
            },
        )
        return asset

    def update_asset(
        self,
        asset_id: str,
        data: AssetUpdate,
        *,
        actor_id: str = "system",
    ) -> Asset | None:
        """Partially update asset metadata. Returns None if not found.

        Emits asset_classified if sensitivity changes.
        """
        existing = self._assets.get(asset_id)
        if existing is None:
            return None

        updated = self._assets.update(asset_id, data)
        if updated is None:
            return None

        # Emit audit if sensitivity changed
        if data.sensitivity is not None and data.sensitivity != existing.sensitivity:
            self._audit.emit(
                AuditEventType.asset_classified,
                "asset",
                asset_id,
                actor_id=actor_id,
                project_id=existing.project_id,
                payload={
                    "old_sensitivity": existing.sensitivity.value if hasattr(existing.sensitivity, "value") else str(existing.sensitivity),
                    "new_sensitivity": data.sensitivity.value if hasattr(data.sensitivity, "value") else str(data.sensitivity),
                },
            )
        return updated

    def delete_asset(self, asset_id: str, *, actor_id: str = "system") -> bool:
        """Tombstone an asset. Returns True if found and deleted."""
        asset = self._assets.get(asset_id)
        if asset is None:
            return False
        result = self._assets.delete(asset_id)
        if result:
            self._audit.emit(
                AuditEventType.asset_promoted,  # No dedicated archived event; use classified
                "asset",
                asset_id,
                actor_id=actor_id,
                project_id=asset.project_id,
                payload={"action": "archived_tombstone"},
            )
        return result

    # ------------------------------------------------------------------
    # Status transitions
    # ------------------------------------------------------------------

    def transition_status(
        self,
        asset_id: str,
        target_status: AssetStatus,
        *,
        actor_id: str = "system",
        review_notes: str | None = None,
    ) -> Asset:
        """Transition an asset to a new status, enforcing adjacency rules.

        Args:
            asset_id: Asset to transition.
            target_status: Desired new status.
            actor_id: Actor performing the transition.
            review_notes: Optional notes (required for canonical promotion).

        Returns:
            The updated Asset.

        Raises:
            ValueError: If asset not found.
            StatusTransitionError: If the transition is not allowed.
        """
        asset = self._assets.get(asset_id)
        if asset is None:
            raise ValueError(f"Asset not found: {asset_id}")

        current = asset.status.value if hasattr(asset.status, "value") else str(asset.status)
        target = target_status.value

        allowed = _ALLOWED_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise StatusTransitionError(
                f"Transition {current!r} → {target!r} is not permitted. "
                f"Allowed: {sorted(allowed)}"
            )

        # For canonical promotion, check policy
        if target == AssetStatus.canonical.value:
            policy = self._policy.evaluate_promotion(
                resource_id=asset_id,
                current_status=current,
                sensitivity=asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity),
                has_project=bool(asset.project_id),
                has_artifact_type=bool(asset.artifact_type_id),
                has_provenance=bool(asset.uri),
                has_review_marker=bool(review_notes),
                actor_type=None,  # system/human promotion
            )
            if policy.decision == "deny":
                self._audit.emit_policy_denied(
                    asset_id,
                    "asset",
                    actor_id=actor_id,
                    project_id=asset.project_id,
                    payload={
                        "action": "promote_to_canonical",
                        "rule": policy.rule_triggered,
                        "reason": policy.reason,
                    },
                )
                raise PolicyDeniedError(policy)
            self._audit.emit_asset_promoted(
                asset_id,
                project_id=asset.project_id,
                actor_id=actor_id,
                payload={"from_status": current, "to_status": target, "review_notes": review_notes},
            )

        updated = self._assets.update(asset_id, AssetUpdate(status=target_status))
        if updated is None:
            raise ValueError(f"Asset not found during update: {asset_id}")
        return updated

    def promote_asset(
        self,
        asset_id: str,
        request: AssetPromoteRequest,
        *,
        actor_id: str = "system",
    ) -> Asset:
        """Promote an asset using an AssetPromoteRequest.

        Handles supersession if supersedes_asset_id is provided.
        """
        target = request.target_status
        asset = self.transition_status(
            asset_id,
            target,
            actor_id=actor_id,
            review_notes=request.review_notes,
        )
        # If superseding another asset, archive it
        if request.supersedes_asset_id:
            superseded = self._assets.get(request.supersedes_asset_id)
            if superseded is not None:
                self._assets.update(
                    request.supersedes_asset_id,
                    AssetUpdate(status=AssetStatus.archived),
                )
                # Create a supersedes relationship
                rel_id = f"rel_{uuid.uuid4().hex[:12]}"
                self._assets.create_relationship(
                    rel_id,
                    asset_id,
                    request.supersedes_asset_id,
                    AssetRelationshipType.supersedes.value,
                )
        return asset

    # ------------------------------------------------------------------
    # Search / filter
    # ------------------------------------------------------------------

    def search_assets(
        self,
        *,
        project_id: str | None = None,
        query: str | None = None,
        status_filter: list[str] | None = None,
        sensitivity_filter: list[str] | None = None,
        source_kind_filter: list[str] | None = None,
        artifact_type_filter: list[str] | None = None,
        limit: int = 50,
    ) -> list[Asset]:
        """In-memory keyword + filter search over assets.

        Performs case-insensitive substring match on title/description.
        Respects status, sensitivity, source_kind, and artifact_type filters.

        Args:
            project_id: Scope to a project.
            query: Optional keyword to match against title and description.
            status_filter: Whitelist of AssetStatus values.
            sensitivity_filter: Whitelist of Sensitivity values.
            source_kind_filter: Whitelist of SourceKind values.
            artifact_type_filter: Whitelist of artifact_type_id values.
            limit: Maximum results.

        Returns:
            Filtered list of matching assets.
        """
        assets = self._assets.list(project_id=project_id)

        if query:
            q = query.lower()
            assets = [
                a for a in assets
                if q in a.title.lower()
                or (a.description and q in a.description.lower())
            ]

        if status_filter:
            status_set = set(status_filter)
            assets = [
                a for a in assets
                if (a.status.value if hasattr(a.status, "value") else str(a.status)) in status_set
            ]

        if sensitivity_filter:
            sens_set = set(sensitivity_filter)
            assets = [
                a for a in assets
                if (a.sensitivity.value if hasattr(a.sensitivity, "value") else str(a.sensitivity)) in sens_set
            ]

        if source_kind_filter:
            sk_set = set(source_kind_filter)
            assets = [
                a for a in assets
                if (a.source_kind.value if hasattr(a.source_kind, "value") else str(a.source_kind)) in sk_set
            ]

        if artifact_type_filter:
            at_set = set(artifact_type_filter)
            assets = [a for a in assets if a.artifact_type_id in at_set]

        return assets[:limit]

    # ------------------------------------------------------------------
    # Links
    # ------------------------------------------------------------------

    def create_link(
        self,
        asset_id: str,
        data: AssetLinkCreate,
        *,
        actor_id: str = "system",
    ) -> AssetLink:
        """Create an asset link and emit asset_linked audit event."""
        link_id = f"link_{uuid.uuid4().hex[:16]}"
        link = self._assets.create_link(link_id, asset_id, data)
        asset = self._assets.get(asset_id)
        self._audit.emit_asset_linked(
            asset_id,
            project_id=asset.project_id if asset else None,
            actor_id=actor_id,
            payload={
                "link_id": link_id,
                "target_type": data.target_type.value if hasattr(data.target_type, "value") else str(data.target_type),
                "target_id": data.target_id,
                "relationship": data.relationship.value if hasattr(data.relationship, "value") else str(data.relationship),
            },
        )
        return link

    def list_links(self, asset_id: str) -> list[AssetLink]:
        """Return all links for an asset."""
        return self._assets.list_links(asset_id)

    def delete_link(self, link_id: str) -> bool:
        """Tombstone a link. Returns True if found."""
        return self._assets.delete_link(link_id)

    # ------------------------------------------------------------------
    # Relationships
    # ------------------------------------------------------------------

    def list_relationships(
        self, asset_id: str, *, direction: str = "both"
    ) -> list[AssetRelationship]:
        """Return relationships involving an asset."""
        return self._assets.list_relationships(asset_id, direction=direction)

    def create_relationship(
        self,
        source_asset_id: str,
        target_asset_id: str,
        relationship_type: AssetRelationshipType,
        *,
        metadata: dict[str, Any] | None = None,
    ) -> AssetRelationship:
        """Create a typed asset-to-asset relationship."""
        rel_id = f"rel_{uuid.uuid4().hex[:16]}"
        return self._assets.create_relationship(
            rel_id,
            source_asset_id,
            target_asset_id,
            relationship_type.value,
            metadata=metadata,
        )

    # ------------------------------------------------------------------
    # Policy-gated content access
    # ------------------------------------------------------------------

    def check_content_access(
        self,
        asset_id: str,
        *,
        actor_type: str = "agent",
        actor_id: str = "system",
        include_mode: IncludeMode | None = None,
    ) -> Policy:
        """Evaluate and audit content access for an asset.

        Emits policy_denied audit event on denial.

        Args:
            asset_id: Asset being accessed.
            actor_type: "user" | "agent" | "system"
            actor_id: Actor identity.
            include_mode: Requested include mode.

        Returns:
            Policy decision.

        Raises:
            ValueError: If asset not found.
        """
        asset = self._assets.get(asset_id)
        if asset is None:
            raise ValueError(f"Asset not found: {asset_id}")

        sensitivity = asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity)
        agent_access = asset.agent_access.value if hasattr(asset.agent_access, "value") else str(asset.agent_access)

        policy = self._policy.evaluate_asset_access(
            resource_id=asset_id,
            sensitivity=sensitivity,
            agent_access=agent_access,
            action="read_content" if include_mode else "read",
            include_mode=include_mode,
            actor_type=actor_type,
        )

        if policy.decision == "deny":
            self._audit.emit_policy_denied(
                asset_id,
                "asset",
                actor_id=actor_id,
                project_id=asset.project_id,
                payload={
                    "requested_include_mode": include_mode.value if include_mode else None,
                    "sensitivity": sensitivity,
                    "agent_access": agent_access,
                    "rule": policy.rule_triggered,
                },
            )

        return policy
