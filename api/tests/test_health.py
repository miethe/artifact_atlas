from fastapi.testclient import TestClient

from app.main import app
from app.settings import get_settings


def test_health() -> None:
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_health_has_version() -> None:
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    # OpenAPI contract requires status + version
    assert "status" in body
    assert "version" in body


def test_readyz_performs_a_bounded_registry_read(tmp_registry) -> None:
    response = TestClient(app).get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_readyz_returns_503_when_registry_file_is_unavailable(tmp_path, tmp_registry) -> None:
    settings = get_settings()
    settings.registry_dir = tmp_path / "missing-registry"

    response = TestClient(app).get("/readyz")

    assert response.status_code == 503
    assert response.json()["detail"] == "Registry is unavailable"


def test_readyz_returns_503_when_registry_entry_is_unreadable(tmp_path, tmp_registry) -> None:
    settings = get_settings()
    settings.registry_dir = tmp_path / "unreadable-registry"
    settings.registry_dir.mkdir()
    (settings.registry_dir / "projects.jsonl").mkdir()

    response = TestClient(app).get("/readyz")

    assert response.status_code == 503
