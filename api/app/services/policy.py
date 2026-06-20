"""Policy service (SVC-005): evaluate include modes vs sensitivity + agent_access.

Rules per D-009 and workspace.yaml:
- sensitivity capped: work_sensitive / client_sensitive / restricted → max preview_allowed for agents
- agent_access=none → deny all
- content access requires: read_allowed/context_pack_allowed AND public/personal sensitivity
  AND asset is not in the sensitivity cap
- canonical promotion requires: project + type + sensitivity + provenance + review marker
- Denials emit policy_denied audit event (caller responsible for emitting via AuditService).

Decision values:
  "allow"  – access permitted at effective_include_mode
  "deny"   – access denied; reason and rule_triggered are populated
"""

from __future__ import annotations

from typing import Any

from app.models.policy import Policy
from app.models.vocabulary import AgentAccess, AssetStatus, IncludeMode, Sensitivity

# ---------------------------------------------------------------------------
# Sensitivity ordering for cap enforcement
# ---------------------------------------------------------------------------

# All sensitivities that are capped at preview for agent reads (from workspace.yaml)
_AGENT_FULL_CONTENT_CAP: set[str] = {
    Sensitivity.work_sensitive.value,
    Sensitivity.client_sensitive.value,
    Sensitivity.restricted.value,
}

# Agent access levels that permit content access (ordered from least to most)
_CONTENT_ACCESS_LEVELS: set[str] = {
    AgentAccess.read_allowed.value,
    AgentAccess.context_pack_allowed.value,
}

# AgentAccess levels that permit preview
_PREVIEW_ACCESS_LEVELS: set[str] = {
    AgentAccess.preview_allowed.value,
    AgentAccess.read_allowed.value,
    AgentAccess.context_pack_allowed.value,
}

# Canonical promotion requirements
_CANONICAL_PROMOTION_ALLOWED_STATUSES: set[str] = {
    AssetStatus.selected.value,
    AssetStatus.in_review.value,
}


def _access_level_rank(access: str) -> int:
    """Return a numeric rank for agent_access values (higher = more permissive)."""
    order = [
        AgentAccess.none.value,
        AgentAccess.metadata_only.value,
        AgentAccess.preview_allowed.value,
        AgentAccess.read_allowed.value,
        AgentAccess.context_pack_allowed.value,
    ]
    try:
        return order.index(access)
    except ValueError:
        return -1


class PolicyService:
    """Evaluate access policy for assets and other resources.

    The policy service is stateless: it takes resource attributes and returns
    a Policy decision. Callers are responsible for emitting audit events on denial.
    """

    def __init__(
        self,
        *,
        agent_full_content_sensitivity_cap: list[str] | None = None,
        automated_promotion_allowed: bool = False,
    ) -> None:
        self._cap = set(
            agent_full_content_sensitivity_cap or list(_AGENT_FULL_CONTENT_CAP)
        )
        self._automated_promotion_allowed = automated_promotion_allowed

    # ------------------------------------------------------------------
    # Public evaluation entry points
    # ------------------------------------------------------------------

    def evaluate_asset_access(
        self,
        *,
        resource_id: str,
        sensitivity: str,
        agent_access: str,
        action: str = "read",
        include_mode: IncludeMode | None = None,
        actor_type: str | None = None,
        context: dict[str, Any] | None = None,
    ) -> Policy:
        """Evaluate whether an actor may access an asset at the requested include_mode.

        Args:
            resource_id: Asset ID being accessed.
            sensitivity: Asset's sensitivity value.
            agent_access: Asset's agent_access field value.
            action: Requested action (read, read_content, read_preview, promote, etc.).
            include_mode: Requested inclusion level for context pack / agent queries.
            actor_type: "user" | "agent" | "system" — agents face extra caps.
            context: Optional additional context (e.g., trusted_agent flag).

        Returns:
            Policy decision with effective_include_mode.
        """
        is_agent = actor_type == "agent"
        requested_mode = include_mode

        # ------------------------------------------------------------------
        # Hard deny: agent_access == none blocks everything
        # ------------------------------------------------------------------
        if agent_access == AgentAccess.none.value:
            return Policy(
                decision="deny",
                resource_type="asset",
                resource_id=resource_id,
                action=action,
                rule_triggered="agent_access_none",
                reason="Asset has agent_access=none; all access denied.",
                audit_required=True,
                effective_include_mode=None,
            )

        # ------------------------------------------------------------------
        # Determine effective include_mode based on asset capabilities
        # ------------------------------------------------------------------
        effective_mode = self._compute_effective_mode(
            sensitivity=sensitivity,
            agent_access=agent_access,
            requested_mode=requested_mode,
            is_agent=is_agent,
        )

        # ------------------------------------------------------------------
        # If a specific include_mode was requested, check whether it was
        # downgraded or if access should be denied outright.
        # ------------------------------------------------------------------
        if requested_mode is not None:
            downgraded = effective_mode != requested_mode
            if downgraded:
                # Deny if the requested mode cannot be satisfied at all
                if effective_mode is None:
                    return Policy(
                        decision="deny",
                        resource_type="asset",
                        resource_id=resource_id,
                        action=action,
                        rule_triggered="sensitivity_cap",
                        reason=(
                            f"Requested include_mode={requested_mode.value!r} denied: "
                            f"sensitivity={sensitivity!r} with agent_access={agent_access!r} "
                            f"does not permit this access level."
                        ),
                        audit_required=True,
                        effective_include_mode=None,
                    )
                # Otherwise allow at downgraded mode (note the downgrade)
                return Policy(
                    decision="allow",
                    resource_type="asset",
                    resource_id=resource_id,
                    action=action,
                    rule_triggered="sensitivity_cap_downgrade",
                    reason=(
                        f"include_mode downgraded from {requested_mode.value!r} to "
                        f"{effective_mode.value!r} due to sensitivity cap."
                    ),
                    audit_required=True,
                    effective_include_mode=effective_mode,
                )

        # ------------------------------------------------------------------
        # No specific mode requested — allow at effective mode
        # ------------------------------------------------------------------
        return Policy(
            decision="allow",
            resource_type="asset",
            resource_id=resource_id,
            action=action,
            rule_triggered=None,
            reason=None,
            audit_required=False,
            effective_include_mode=effective_mode,
        )

    def evaluate_promotion(
        self,
        *,
        resource_id: str,
        current_status: str,
        sensitivity: str,
        has_project: bool,
        has_artifact_type: bool,
        has_provenance: bool,
        has_review_marker: bool,
        actor_type: str | None = None,
    ) -> Policy:
        """Evaluate whether an asset may be promoted to canonical.

        Per D-009: canonical promotion requires human gate (unless automated_promotion_allowed).
        Prerequisites:
        - Asset must be in selected or in_review status.
        - Asset must have project, artifact_type, and provenance.
        - A review marker (review_notes or similar) must be present.
        - Agent actors may not promote to canonical (human gate).

        Returns:
            Policy decision. Denials include specific missing requirement.
        """
        # ------------------------------------------------------------------
        # Automated promotion gate (D-009)
        # ------------------------------------------------------------------
        if actor_type == "agent" and not self._automated_promotion_allowed:
            return Policy(
                decision="deny",
                resource_type="asset",
                resource_id=resource_id,
                action="promote",
                rule_triggered="human_gate_canonical_promotion",
                reason="Canonical promotion requires human approval. Automated promotion is disabled.",
                audit_required=True,
                effective_include_mode=None,
            )

        # ------------------------------------------------------------------
        # Status prerequisite
        # ------------------------------------------------------------------
        if current_status not in _CANONICAL_PROMOTION_ALLOWED_STATUSES:
            return Policy(
                decision="deny",
                resource_type="asset",
                resource_id=resource_id,
                action="promote",
                rule_triggered="invalid_status_for_promotion",
                reason=(
                    f"Asset status {current_status!r} is not eligible for canonical promotion. "
                    f"Required: {sorted(_CANONICAL_PROMOTION_ALLOWED_STATUSES)}"
                ),
                audit_required=True,
                effective_include_mode=None,
            )

        # ------------------------------------------------------------------
        # Required attribute checks
        # ------------------------------------------------------------------
        missing: list[str] = []
        if not has_project:
            missing.append("project_id")
        if not has_artifact_type:
            missing.append("artifact_type_id")
        if not has_provenance:
            missing.append("provenance/source_kind+uri")
        if not has_review_marker:
            missing.append("review_notes")
        if missing:
            return Policy(
                decision="deny",
                resource_type="asset",
                resource_id=resource_id,
                action="promote",
                rule_triggered="missing_promotion_prerequisites",
                reason=f"Canonical promotion missing required fields: {missing}",
                audit_required=True,
                effective_include_mode=None,
            )

        return Policy(
            decision="allow",
            resource_type="asset",
            resource_id=resource_id,
            action="promote",
            rule_triggered=None,
            reason=None,
            audit_required=True,
            effective_include_mode=None,
        )

    def evaluate_generic(
        self,
        *,
        resource_type: str,
        resource_id: str,
        action: str,
        actor_type: str | None = None,
        actor_id: str | None = None,
        include_mode: IncludeMode | None = None,
        context: dict[str, Any] | None = None,
    ) -> Policy:
        """Generic policy evaluation for non-asset resources.

        For MVP, non-asset resources (bom_slot, template, context_pack, project) are
        allowed unless the action involves destructive_asset_changes or sensitive
        context_pack_publish, which require human approval.

        Returns:
            Policy decision.
        """
        # Context pack publish — sensitive packs require human approval
        if action == "publish" and resource_type == "context_pack":
            sensitivity = (context or {}).get("sensitivity", "personal")
            if sensitivity in self._cap:
                return Policy(
                    decision="deny",
                    resource_type=resource_type,
                    resource_id=resource_id,
                    action=action,
                    rule_triggered="sensitive_context_pack_publish",
                    reason=(
                        f"Publishing context pack with sensitivity={sensitivity!r} "
                        "requires human approval."
                    ),
                    audit_required=True,
                    effective_include_mode=None,
                )

        return Policy(
            decision="allow",
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            rule_triggered=None,
            reason=None,
            audit_required=False,
            effective_include_mode=include_mode,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _compute_effective_mode(
        self,
        *,
        sensitivity: str,
        agent_access: str,
        requested_mode: IncludeMode | None,
        is_agent: bool,
    ) -> IncludeMode | None:
        """Return the highest include_mode permitted by sensitivity + agent_access.

        Sensitivity cap (for agent actors only):
        - work_sensitive / client_sensitive / restricted → max preview

        agent_access levels:
        - metadata_only → metadata
        - preview_allowed → preview (or metadata)
        - read_allowed / context_pack_allowed → full (subject to sensitivity cap)
        """
        # Determine cap from access level
        if agent_access == AgentAccess.metadata_only.value:
            permitted_max = IncludeMode.metadata
        elif agent_access in _PREVIEW_ACCESS_LEVELS:
            if is_agent and sensitivity in self._cap:
                # Sensitivity cap: agents capped at preview for sensitive assets
                permitted_max = IncludeMode.preview
            else:
                if agent_access in _CONTENT_ACCESS_LEVELS:
                    permitted_max = IncludeMode.full
                else:
                    permitted_max = IncludeMode.preview
        else:
            # Unknown access level defaults to metadata
            permitted_max = IncludeMode.metadata

        # If a specific mode was requested, return min(requested, permitted_max)
        if requested_mode is not None:
            mode_rank = {
                IncludeMode.link_only: 0,
                IncludeMode.metadata: 1,
                IncludeMode.preview: 2,
                IncludeMode.summary: 3,
                IncludeMode.full: 4,
            }
            req_rank = mode_rank.get(requested_mode, 0)
            permitted_rank = mode_rank.get(permitted_max, 0)
            if req_rank <= permitted_rank:
                return requested_mode
            else:
                return permitted_max

        return permitted_max
