"""Policies router.

Routes:
  POST /api/policies/evaluate
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api._deps import get_asset_service, get_policy_service
from app.models.policy import Policy, PolicyEvaluateRequest

router = APIRouter(prefix="/api", tags=["policies"])


@router.post("/policies/evaluate", response_model=Policy)
def evaluate_policy(data: PolicyEvaluateRequest) -> Policy:
    """Evaluate an access policy check and return allow/deny decision."""
    policy_svc = get_policy_service()

    if data.resource_type == "asset":
        # Retrieve actual asset attributes for accurate evaluation
        asset_svc = get_asset_service()
        asset = asset_svc.get_asset(data.resource_id)
        if asset is None:
            return Policy(
                decision="deny",
                resource_type=data.resource_type,
                resource_id=data.resource_id,
                action=data.action,
                rule_triggered="asset_not_found",
                reason=f"Asset '{data.resource_id}' not found.",
                audit_required=True,
                effective_include_mode=None,
            )
        sensitivity = asset.sensitivity.value if hasattr(asset.sensitivity, "value") else str(asset.sensitivity)
        agent_access = asset.agent_access.value if hasattr(asset.agent_access, "value") else str(asset.agent_access)

        return policy_svc.evaluate_asset_access(
            resource_id=data.resource_id,
            sensitivity=sensitivity,
            agent_access=agent_access,
            action=data.action,
            include_mode=data.include_mode,
            actor_type=data.actor_type.value if data.actor_type else None,
            context=data.context,
        )

    # Generic policy evaluation for other resource types
    return policy_svc.evaluate_generic(
        resource_type=data.resource_type,
        resource_id=data.resource_id,
        action=data.action,
        actor_type=data.actor_type.value if data.actor_type else None,
        actor_id=data.actor_id,
        include_mode=data.include_mode,
        context=data.context,
    )
