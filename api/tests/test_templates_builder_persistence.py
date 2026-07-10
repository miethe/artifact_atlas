"""WS-5: BOM Builder template persistence tests.

Covers the additive template canvas fields and embedded-domain persistence:
- POST /api/templates with embedded domains → detail returns domains/slots.
- New TemplateSlot fields (phase, accepted_file_types, naming_convention,
  guidance, max_file_size_mb) round-trip.
- PATCH /api/templates/{id} with domains replaces the structure.
- Duplicate carries the domain structure over.
- Applying a builder-created template generates BOM slots (guidance included).
"""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.repositories.templates import TemplateRepository
from app.services.templates_service import TemplateService

client = TestClient(app)


BUILDER_PAYLOAD = {
    "name": "Custom Platform Launch",
    "slug": "custom-platform-launch",
    "template_type": "custom",
    "description": "Builder-created template",
    "domains": [
        {
            "name": "Architecture",
            "slots": [
                {
                    "artifact_type_id": "architecture_diagram",
                    "phase": "discovery",
                    "required": True,
                    "accepted_file_types": ["png", "jpg", "svg", "pdf"],
                    "max_file_size_mb": 50,
                    "naming_convention": "architecture_diagram_{domain}_{date}",
                    "guidance": "Provide a high-level system architecture diagram.",
                },
                {
                    "artifact_type": "API Specification",
                    "phase": "design",
                    "required": False,
                },
            ],
        },
        {
            "name": "Marketing",
            "slots": [
                {"artifact_type": "Launch Brief", "phase": "launch", "required": True},
            ],
        },
    ],
}


def _create_builder_template() -> dict:
    resp = client.post("/api/templates", json=BUILDER_PAYLOAD)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestBuilderTemplateCreate:
    def test_create_with_domains_returns_detail(self, tmp_registry: Path) -> None:
        created = _create_builder_template()
        template_id = created["id"]

        resp = client.get(f"/api/templates/{template_id}")
        assert resp.status_code == 200, resp.text
        detail = resp.json()

        assert detail["name"] == "Custom Platform Launch"
        domains = detail["domains"]
        assert domains is not None and len(domains) == 2
        assert [d["name"] for d in domains] == ["Architecture", "Marketing"]

        arch_slots = domains[0]["slots"]
        assert len(arch_slots) == 2

        diagram = arch_slots[0]
        assert diagram["artifact_type_id"] == "architecture_diagram"
        assert diagram["phase"] == "discovery"
        assert diagram["required"] is True
        assert diagram["accepted_file_types"] == ["png", "jpg", "svg", "pdf"]
        assert diagram["max_file_size_mb"] == 50
        assert diagram["naming_convention"] == "architecture_diagram_{domain}_{date}"
        assert diagram["guidance"].startswith("Provide a high-level")

        # Human label falls back to slugified artifact_type_id
        api_spec = arch_slots[1]
        assert api_spec["artifact_type_id"] == "api_specification"
        assert api_spec["required"] is False

    def test_created_template_is_draft(self, tmp_registry: Path) -> None:
        created = _create_builder_template()
        assert created["status"] == "experimental"


class TestBuilderTemplateUpdate:
    def test_patch_domains_replaces_structure(self, tmp_registry: Path) -> None:
        created = _create_builder_template()
        template_id = created["id"]

        patch = {
            "domains": [
                {
                    "name": "Research",
                    "slots": [
                        {
                            "artifact_type": "User Research Report",
                            "phase": "discovery",
                            "required": True,
                            "guidance": "Summarize interviews.",
                        }
                    ],
                }
            ]
        }
        resp = client.patch(f"/api/templates/{template_id}", json=patch)
        assert resp.status_code == 200, resp.text

        detail = client.get(f"/api/templates/{template_id}").json()
        domains = detail["domains"]
        assert len(domains) == 1
        assert domains[0]["name"] == "Research"
        assert domains[0]["slots"][0]["artifact_type_id"] == "user_research_report"
        assert domains[0]["slots"][0]["guidance"] == "Summarize interviews."

    def test_patch_without_domains_preserves_structure(self, tmp_registry: Path) -> None:
        created = _create_builder_template()
        template_id = created["id"]

        resp = client.patch(
            f"/api/templates/{template_id}", json={"description": "Renamed desc"}
        )
        assert resp.status_code == 200, resp.text

        detail = client.get(f"/api/templates/{template_id}").json()
        assert detail["description"] == "Renamed desc"
        assert detail["domains"] is not None and len(detail["domains"]) == 2


class TestBuilderTemplateDuplicate:
    def test_duplicate_carries_domains(self, tmp_registry: Path) -> None:
        created = _create_builder_template()
        template_id = created["id"]

        resp = client.post(f"/api/templates/{template_id}/duplicate", json={})
        assert resp.status_code == 201, resp.text
        dup = resp.json()
        assert dup["id"] != template_id
        assert dup["name"].startswith("Copy of")

        detail = client.get(f"/api/templates/{dup['id']}").json()
        domains = detail["domains"]
        assert domains is not None and len(domains) == 2
        assert domains[0]["slots"][0]["artifact_type_id"] == "architecture_diagram"


class TestBuilderTemplatePreviewAndApply:
    def test_preview_counts(self, tmp_registry: Path) -> None:
        created = _create_builder_template()
        resp = client.get(f"/api/templates/{created['id']}/preview")
        assert resp.status_code == 200, resp.text
        preview = resp.json()
        assert preview["total_slots"] == 3
        assert preview["required_slots"] == 2

    def test_apply_builder_template_creates_slots(self, tmp_registry: Path) -> None:
        created = _create_builder_template()

        proj = client.post(
            "/api/projects",
            json={"name": "Builder Apply", "slug": "builder-apply", "status": "active"},
        )
        assert proj.status_code == 201, proj.text
        project_id = proj.json()["id"]

        resp = client.post(
            f"/api/projects/{project_id}/bom/apply-template",
            json={"template_id": created["id"]},
        )
        assert resp.status_code == 200, resp.text
        bom = resp.json()
        slots = bom["slots"]
        assert len(slots) == 3

        by_type = {s["artifact_type_id"]: s for s in slots}
        assert "architecture_diagram" in by_type
        assert by_type["architecture_diagram"]["domain"] == "Architecture"
        assert by_type["architecture_diagram"]["phase"] == "discovery"
        # Guidance passthrough from template slot to BOM slot
        assert by_type["architecture_diagram"].get("guidance", "").startswith(
            "Provide a high-level"
        )


class TestRepositoryEmbeddedDomains:
    def test_generate_bom_slots_from_embedded(self, tmp_registry: Path) -> None:
        repo = TemplateRepository(tmp_registry)
        svc = TemplateService(tmp_registry)

        from app.models.template import TemplateCreate

        data = TemplateCreate.model_validate(BUILDER_PAYLOAD)
        svc.create_draft(data, "tmpl_embedded_test")

        slots = repo.generate_bom_slots("tmpl_embedded_test", "bom_x")
        assert len(slots) == 3
        assert all(s["bom_id"] == "bom_x" for s in slots)
        assert {s["domain"] for s in slots} == {"Architecture", "Marketing"}
