"""Artifact Atlas API — FastAPI application entry point.

Registers all routers from app.api and exposes the /health endpoint.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.api import all_routers
from app.models.shared import HealthResponse

app = FastAPI(title="Artifact Atlas API", version="0.2.0")

# Register all sub-routers
for _router in all_routers:
    app.include_router(_router)


@app.get("/health", response_model=HealthResponse, response_model_exclude_none=True, tags=["health"])
def health() -> HealthResponse:
    """Service health check."""
    return HealthResponse(status="ok", version="0.2.0", storage_backend="jsonl")
