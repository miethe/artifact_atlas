from fastapi import FastAPI

from app.models.schemas import HealthResponse, Project

app = FastAPI(title="Artifact Atlas API", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/api/projects", response_model=list[Project])
def list_projects() -> list[Project]:
    return [
        Project(
            id="proj_artifact_atlas",
            name="Artifact Atlas",
            slug="artifact-atlas",
            status="active",
        )
    ]
