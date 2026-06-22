"""Artifact Atlas API — FastAPI application entry point.

Registers all routers from app.api and exposes the /health endpoint.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import all_routers
from app.models.shared import HealthResponse

app = FastAPI(title="Artifact Atlas API", version="0.2.0")

# CORS — the web frontend issues browser-side (cross-origin) fetches to this API via
# NEXT_PUBLIC_API_BASE_URL (e.g. web :3040 → api :8042 on the agentic node). Allowed
# origins come from ATLAS_CORS_ORIGINS (comma-separated); the default covers local
# dev (web :3000 / :3040). Deployments set the served web origin.
_cors_origins = [
    o.strip()
    for o in os.environ.get(
        "ATLAS_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3040",
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all sub-routers
for _router in all_routers:
    app.include_router(_router)


@app.get("/health", response_model=HealthResponse, response_model_exclude_none=True, tags=["health"])
def health() -> HealthResponse:
    """Service health check."""
    return HealthResponse(status="ok", version="0.2.0", storage_backend="jsonl")
