"""Router aggregator — import and re-export all sub-routers.

Consumers:
    from app.api import all_routers
    for router in all_routers:
        app.include_router(router)
"""

from app.api import (
    assets,
    audit,
    bom,
    context_packs,
    inbox,
    integrations,
    overview,
    policies,
    preview,
    projects,
    reports,
    search,
    templates,
)

all_routers = [
    projects.router,
    assets.router,
    inbox.router,
    templates.router,
    bom.router,
    context_packs.router,
    overview.router,
    reports.router,
    search.router,
    audit.router,
    policies.router,
    integrations.router,
    preview.router,
]

__all__ = ["all_routers"]
