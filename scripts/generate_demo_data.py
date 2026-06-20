#!/usr/bin/env python3
"""
REL-001: Demo Fixture Pack Generator
=====================================
Generates a SYNTHETIC, non-sensitive demo registry for screenshots and E2E tests.

Output: a self-contained registry directory (default: fixtures/demo/registry/)
  assets.jsonl       — ~100 synthetic assets (mixed kinds/sensitivities/statuses)
  projects.jsonl     — 3 demo projects
  bom.jsonl          — BOM with slots per project
  templates.jsonl    — 4 artifact templates
  context_packs.jsonl — context packs per project
  events.jsonl       — audit events

NEVER writes to the real registry/ directory.
Set ATLAS_REGISTRY_DIR=fixtures/demo/registry to point the app at these fixtures.

Usage:
    python3 scripts/generate_demo_data.py
    python3 scripts/generate_demo_data.py --out fixtures/demo/registry --assets 100
    python3 scripts/generate_demo_data.py --out /tmp/atlas-demo --assets 50

The app can be run against these fixtures with:
    ATLAS_REGISTRY_DIR=$(pwd)/fixtures/demo/registry  uvicorn app.main:app --reload
"""

import argparse
import json
import random
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

# ── Constants ──────────────────────────────────────────────────────────────────

WORKSPACE_ID = "ws_demo_local"

PROJECTS = [
    {
        "id": "proj_demo_nova",
        "workspace_id": WORKSPACE_ID,
        "name": "Project Nova",
        "slug": "project-nova",
        "status": "active",
        "description": "Next-generation analytics platform with AI-powered insights.",
        "meatywiki_page_ref": "meatywiki/projects/project-nova.md",
        "intent_id": None,
        "root_intenttree_node_id": None,
    },
    {
        "id": "proj_demo_horizon",
        "workspace_id": WORKSPACE_ID,
        "name": "Horizon Design System",
        "slug": "horizon-design-system",
        "status": "active",
        "description": "Shared component library and design tokens for all product surfaces.",
        "meatywiki_page_ref": "meatywiki/projects/horizon.md",
        "intent_id": None,
        "root_intenttree_node_id": None,
    },
    {
        "id": "proj_demo_sentinel",
        "workspace_id": WORKSPACE_ID,
        "name": "Sentinel Security Audit",
        "slug": "sentinel-security-audit",
        "status": "paused",
        "description": "Quarterly security review and remediation tracking.",
        "meatywiki_page_ref": None,
        "intent_id": None,
        "root_intenttree_node_id": None,
    },
]

TEMPLATES = [
    {
        "id": "tmpl_demo_product_v1",
        "workspace_id": WORKSPACE_ID,
        "name": "New Product / App",
        "slug": "new-product-app",
        "template_type": "product",
        "status": "core",
        "version": "1.0.0",
        "description": "Standard BOM for a new digital product or application.",
        "slots": [
            {"name": "Product Requirements Document", "artifact_type_id": "artifact_type_prd", "phase": "discovery", "required": True, "domain": "product"},
            {"name": "User Research Synthesis", "artifact_type_id": "artifact_type_research", "phase": "discovery", "required": True, "domain": "design"},
            {"name": "UX Wireframes", "artifact_type_id": "artifact_type_wireframe", "phase": "design", "required": True, "domain": "design"},
            {"name": "API Contract", "artifact_type_id": "artifact_type_api_spec", "phase": "design", "required": True, "domain": "engineering"},
            {"name": "Architecture Diagram", "artifact_type_id": "artifact_type_architecture", "phase": "design", "required": True, "domain": "engineering"},
            {"name": "Test Plan", "artifact_type_id": "artifact_type_test_plan", "phase": "build", "required": True, "domain": "qa"},
            {"name": "Deployment Runbook", "artifact_type_id": "artifact_type_runbook", "phase": "launch", "required": False, "domain": "operations"},
        ],
    },
    {
        "id": "tmpl_demo_design_system_v1",
        "workspace_id": WORKSPACE_ID,
        "name": "Design System Initiative",
        "slug": "design-system-initiative",
        "template_type": "design_system",
        "status": "recommended",
        "version": "1.0.0",
        "description": "BOM for establishing or extending a shared design system.",
        "slots": [
            {"name": "Design Principles Doc", "artifact_type_id": "artifact_type_principles", "phase": "discovery", "required": True, "domain": "design"},
            {"name": "Component Inventory", "artifact_type_id": "artifact_type_inventory", "phase": "design", "required": True, "domain": "design"},
            {"name": "Token Reference Sheet", "artifact_type_id": "artifact_type_tokens", "phase": "design", "required": True, "domain": "design"},
            {"name": "Storybook / Component Catalog", "artifact_type_id": "artifact_type_catalog", "phase": "build", "required": True, "domain": "engineering"},
        ],
    },
    {
        "id": "tmpl_demo_security_audit_v1",
        "workspace_id": WORKSPACE_ID,
        "name": "Security Audit",
        "slug": "security-audit",
        "template_type": "research",
        "status": "recommended",
        "version": "1.0.0",
        "description": "BOM for a structured security review and remediation cycle.",
        "slots": [
            {"name": "Threat Model", "artifact_type_id": "artifact_type_threat_model", "phase": "discovery", "required": True, "domain": "security"},
            {"name": "Penetration Test Report", "artifact_type_id": "artifact_type_pentest", "phase": "review", "required": True, "domain": "security"},
            {"name": "Remediation Plan", "artifact_type_id": "artifact_type_plan", "phase": "build", "required": True, "domain": "engineering"},
            {"name": "Sign-Off Checklist", "artifact_type_id": "artifact_type_checklist", "phase": "launch", "required": True, "domain": "security"},
        ],
    },
    {
        "id": "tmpl_demo_architecture_v1",
        "workspace_id": WORKSPACE_ID,
        "name": "Architecture Initiative",
        "slug": "architecture-initiative",
        "template_type": "architecture",
        "status": "core",
        "version": "1.0.0",
        "description": "BOM for a major architectural change or platform capability.",
        "slots": [
            {"name": "Architecture Decision Records", "artifact_type_id": "artifact_type_adr", "phase": "design", "required": True, "domain": "engineering"},
            {"name": "Sequence Diagrams", "artifact_type_id": "artifact_type_diagram", "phase": "design", "required": False, "domain": "engineering"},
            {"name": "Data Model", "artifact_type_id": "artifact_type_data_model", "phase": "design", "required": True, "domain": "engineering"},
            {"name": "Rollout Plan", "artifact_type_id": "artifact_type_runbook", "phase": "launch", "required": True, "domain": "operations"},
        ],
    },
]

SOURCE_KINDS = [
    "local", "local", "local",  # weighted heavier
    "chatgpt", "claude", "figma",
    "github", "notion", "url",
    "manual", "drive",
]

SENSITIVITIES = [
    "public", "public",
    "personal", "personal", "personal",
    "work_sensitive", "work_sensitive",
    "client_sensitive",
    "restricted",
]

STATUSES = [
    "inbox", "raw", "raw",
    "candidate", "candidate", "candidate",
    "in_review",
    "selected", "selected",
    "canonical", "canonical", "canonical",
    "archived",
]

AGENT_ACCESS_BY_SENSITIVITY = {
    "public": "read_allowed",
    "personal": "read_allowed",
    "work_sensitive": "preview_allowed",
    "client_sensitive": "metadata_only",
    "restricted": "none",
}

MIME_TYPES_BY_SOURCE = {
    "local": ["text/markdown", "text/plain", "application/pdf", "text/yaml"],
    "chatgpt": ["image/png", "image/webp", "text/plain"],
    "claude": ["text/markdown", "text/plain"],
    "figma": ["image/png", "application/figma"],
    "github": ["text/markdown", "application/json"],
    "notion": ["text/html", "text/markdown"],
    "url": ["text/html", "image/png", "image/jpeg"],
    "manual": ["text/plain", "text/markdown"],
    "drive": ["application/pdf", "text/plain"],
}

ARTIFACT_TYPES = [
    "artifact_type_prd",
    "artifact_type_plan",
    "artifact_type_architecture",
    "artifact_type_wireframe",
    "artifact_type_api_spec",
    "artifact_type_mockup",
    "artifact_type_research",
    "artifact_type_test_plan",
    "artifact_type_runbook",
    "artifact_type_reference",
    "artifact_type_diagram",
    "artifact_type_adr",
    "artifact_type_notes",
    "artifact_type_checklist",
    "artifact_type_data_model",
    "artifact_type_tokens",
    "artifact_type_catalog",
    "artifact_type_threat_model",
    "artifact_type_pentest",
    "artifact_type_principles",
    "artifact_type_inventory",
]

# Synthetic asset title templates per artifact type
TITLE_TEMPLATES: dict[str, list[str]] = {
    "artifact_type_prd": [
        "{project} Product Requirements v{v}",
        "{project} Feature Spec: {feature}",
        "{project} PRD — {phase} Phase",
    ],
    "artifact_type_plan": [
        "{project} Implementation Plan — {phase}",
        "{project} Sprint {n} Roadmap",
        "{project} Q{q} Planning Document",
    ],
    "artifact_type_architecture": [
        "{project} System Architecture v{v}",
        "{project} Data Flow Diagram",
        "{project} Service Mesh Overview",
    ],
    "artifact_type_wireframe": [
        "{project} Wireframe: {screen} Screen",
        "{project} Lo-Fi Prototype v{v}",
        "{project} User Flow Sketch",
    ],
    "artifact_type_api_spec": [
        "{project} API Contract v{v}",
        "{project} OpenAPI Spec — {feature}",
        "{project} REST API Reference",
    ],
    "artifact_type_mockup": [
        "{project} UI Mockup: {screen}",
        "{project} Visual Design v{v}",
        "{project} Hi-Fi Screen: {screen}",
    ],
    "artifact_type_research": [
        "{project} User Research Synthesis — {phase}",
        "{project} Competitive Analysis",
        "{project} Interview Findings",
    ],
    "artifact_type_test_plan": [
        "{project} Test Plan v{v}",
        "{project} QA Strategy — {phase}",
        "{project} Acceptance Criteria",
    ],
    "artifact_type_runbook": [
        "{project} Deployment Runbook v{v}",
        "{project} On-Call Playbook",
        "{project} Rollback Procedure",
    ],
    "artifact_type_reference": [
        "Reference: {screen} Pattern",
        "Inspiration: {feature} UI",
        "Benchmark: {project} Competitor",
    ],
    "artifact_type_diagram": [
        "{project} Sequence Diagram: {feature}",
        "{project} Entity Relationship Diagram",
        "{project} State Machine: {screen}",
    ],
    "artifact_type_adr": [
        "{project} ADR-{n}: {feature} Decision",
        "{project} Architecture Decision: {screen}",
        "{project} ADR: Storage Strategy",
    ],
    "artifact_type_notes": [
        "{project} Meeting Notes — {phase}",
        "{project} Standup Summary w{n}",
        "{project} Retrospective Notes",
    ],
    "artifact_type_checklist": [
        "{project} Launch Checklist v{v}",
        "{project} Code Review Checklist",
        "{project} Security Gate Checklist",
    ],
    "artifact_type_data_model": [
        "{project} Data Model v{v}",
        "{project} Schema Reference",
        "{project} Database ERD",
    ],
    "artifact_type_tokens": [
        "{project} Design Tokens v{v}",
        "{project} Color Palette Reference",
        "{project} Typography Scale",
    ],
    "artifact_type_catalog": [
        "{project} Component Catalog v{v}",
        "{project} Storybook Snapshot",
        "{project} UI Library Index",
    ],
    "artifact_type_threat_model": [
        "{project} Threat Model v{v}",
        "{project} Attack Surface Analysis",
        "{project} Risk Assessment",
    ],
    "artifact_type_pentest": [
        "{project} Penetration Test Report",
        "{project} Vulnerability Findings",
        "{project} Security Scan Results",
    ],
    "artifact_type_principles": [
        "{project} Design Principles",
        "{project} Engineering Standards",
        "{project} Product Philosophy",
    ],
    "artifact_type_inventory": [
        "{project} Component Inventory",
        "{project} Asset Catalog",
        "{project} Dependency Map",
    ],
}

SCREENS = ["Dashboard", "Inbox", "Asset Library", "BOM Overview", "Context Packs",
           "Templates", "Settings", "Analytics", "Board", "Profile"]
FEATURES = ["Auth", "Search", "Export", "Import", "Notification", "Reporting",
            "Onboarding", "Billing", "Team Management", "API Gateway"]
PHASES = ["Discovery", "Design", "Build", "Launch", "Operate", "Review"]


# ── Generators ─────────────────────────────────────────────────────────────────

def _rand_date(start: datetime, end: datetime) -> str:
    """Return ISO-8601 UTC timestamp between start and end."""
    delta = end - start
    seconds = random.randint(0, int(delta.total_seconds()))
    return (start + timedelta(seconds=seconds)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _rand_title(artifact_type_id: str, project_name: str, rng: random.Random) -> str:
    templates = TITLE_TEMPLATES.get(artifact_type_id, ["{project} Document"])
    tmpl = rng.choice(templates)
    return tmpl.format(
        project=project_name,
        v=f"{rng.randint(1, 3)}.{rng.randint(0, 9)}",
        n=rng.randint(1, 20),
        q=rng.randint(1, 4),
        screen=rng.choice(SCREENS),
        feature=rng.choice(FEATURES),
        phase=rng.choice(PHASES),
    )


def _rand_uri(source_kind: str, title: str, rng: random.Random) -> str:
    slug = title.lower().replace(" ", "-").replace(":", "").replace("/", "-")[:40]
    if source_kind == "local":
        return f"file:///synthetic/{slug}.md"
    elif source_kind in ("chatgpt", "claude"):
        return f"file:///AI-Outputs/{source_kind.title()}/{slug}.png"
    elif source_kind == "figma":
        return f"https://figma.com/file/DEMO{rng.randint(1000,9999)}/{slug}"
    elif source_kind == "github":
        return f"https://github.com/demo-org/demo-repo/blob/main/{slug}.md"
    elif source_kind == "notion":
        return f"https://notion.so/{rng.randint(100000,999999)}"
    elif source_kind == "url":
        return f"https://example.com/reference/{slug}"
    elif source_kind == "drive":
        return f"https://drive.google.com/file/d/DEMO{rng.randint(10000,99999)}"
    else:
        return f"manual://{slug}"


def generate_assets(
    n: int,
    projects: list[dict],
    seed: int = 42,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    now = datetime(2026, 6, 20, tzinfo=timezone.utc)
    six_months_ago = now - timedelta(days=180)

    assets: list[dict[str, Any]] = []
    for i in range(n):
        project = rng.choice(projects)
        source_kind = rng.choice(SOURCE_KINDS)
        sensitivity = rng.choice(SENSITIVITIES)
        status = rng.choice(STATUSES)
        artifact_type_id = rng.choice(ARTIFACT_TYPES)
        mime_types = MIME_TYPES_BY_SOURCE.get(source_kind, ["text/plain"])
        mime_type = rng.choice(mime_types)
        agent_access = AGENT_ACCESS_BY_SENSITIVITY[sensitivity]
        title = _rand_title(artifact_type_id, project["name"], rng)
        uri = _rand_uri(source_kind, title, rng)
        captured_at = _rand_date(six_months_ago, now)
        size_bytes = rng.randint(1024, 5_000_000) if source_kind != "url" else None

        asset: dict[str, Any] = {
            "id": f"asset_demo_{i:04d}",
            "workspace_id": WORKSPACE_ID,
            "project_id": project["id"],
            "title": title,
            "description": f"Synthetic demo asset: {title}.",
            "artifact_type_id": artifact_type_id,
            "source_kind": source_kind,
            "uri": uri,
            "mime_type": mime_type,
            "status": status,
            "sensitivity": sensitivity,
            "agent_access": agent_access,
            "generated_by": rng.choice(["human", "agent", "agent", "chatgpt", "claude", None]),
            "captured_at": captured_at,
            "metadata": {
                "demo": True,
                "batch": "demo-fixture-v1",
            },
        }
        if size_bytes is not None:
            asset["size_bytes"] = size_bytes

        assets.append(asset)

    return assets


def generate_boms(
    projects: list[dict],
    templates: list[dict],
    seed: int = 42,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    slot_statuses = ["missing", "missing", "partial", "complete", "stale"]
    boms: list[dict[str, Any]] = []

    for proj in projects:
        # Assign 1-2 templates per project
        project_templates = rng.sample(templates, k=rng.randint(1, 2))
        bom_id = f"bom_{proj['id']}"
        all_slots: list[dict[str, Any]] = []
        total_slots = 0
        complete_slots = 0

        for tmpl in project_templates:
            for slot_def in tmpl.get("slots", []):
                slot_status = rng.choice(slot_statuses)
                if slot_status == "complete":
                    complete_slots += 1
                total_slots += 1
                all_slots.append({
                    "id": f"slot_{bom_id}_{total_slots:02d}",
                    "bom_id": bom_id,
                    "name": slot_def["name"],
                    "artifact_type_id": slot_def["artifact_type_id"],
                    "phase": slot_def.get("phase"),
                    "required": slot_def.get("required", True),
                    "status": slot_status,
                    "assignment_count": 1 if slot_status == "complete" else 0,
                    "domain": slot_def.get("domain", "general"),
                })

        coverage_score = round(complete_slots / total_slots, 2) if total_slots > 0 else 0.0
        bom: dict[str, Any] = {
            "id": bom_id,
            "project_id": proj["id"],
            "name": f"{proj['name']} BOM",
            "status": "active",
            "source_templates": [t["id"] for t in project_templates],
            "coverage_score": coverage_score,
            "slots": all_slots,
        }
        boms.append(bom)

    return boms


def generate_context_packs(
    projects: list[dict],
    seed: int = 42,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    now = datetime(2026, 6, 20, tzinfo=timezone.utc)
    pack_statuses = ["draft", "draft", "ready", "published"]
    audiences = ["agent", "agent", "human", "engineering_agent"]

    packs: list[dict[str, Any]] = []
    for proj in projects:
        n_packs = rng.randint(1, 3)
        for j in range(n_packs):
            status = rng.choice(pack_statuses)
            created_at = _rand_date(now - timedelta(days=30), now)
            pack: dict[str, Any] = {
                "id": f"pack_{proj['id']}_v{j + 1}",
                "project_id": proj["id"],
                "name": f"{proj['name']} Context Pack v{j + 1}",
                "description": f"Agent context for {proj['name']} — iteration {j + 1}.",
                "status": status,
                "audience": rng.choice(audiences),
                "target_type": "project",
                "target_id": proj["id"],
                "item_count": rng.randint(2, 8),
                "created_at": created_at,
                "updated_at": created_at,
            }
            packs.append(pack)

    return packs


def generate_events(
    assets: list[dict],
    n: int = 50,
    seed: int = 42,
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    now = datetime(2026, 6, 20, tzinfo=timezone.utc)

    event_types = [
        "asset_added", "asset_classified", "asset_promoted",
        "bom_slot_filled", "context_pack_created", "agent_query",
    ]
    actors = ["demo_user", "demo_agent", "system"]
    actor_types = ["user", "agent", "system"]

    events: list[dict[str, Any]] = []
    for i in range(n):
        asset = rng.choice(assets)
        event_type = rng.choice(event_types)
        actor_idx = rng.randint(0, len(actors) - 1)
        created_at = _rand_date(now - timedelta(days=14), now)

        event: dict[str, Any] = {
            "id": f"evt_demo_{i:04d}",
            "event_type": event_type,
            "actor_type": actor_types[actor_idx],
            "actor_id": actors[actor_idx],
            "project_id": asset["project_id"],
            "target_type": "asset",
            "target_id": asset["id"],
            "detail": {"title": asset["title"]},
            "created_at": created_at,
        }
        events.append(event)

    return events


# ── Writer ─────────────────────────────────────────────────────────────────────

def write_jsonl(path: Path, records: list[dict]) -> None:
    """Write records as newline-delimited JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for rec in records:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"  wrote {len(records):>6} records → {path}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate synthetic demo registry fixtures (REL-001).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--out",
        default="fixtures/demo/registry",
        help="Output directory (default: fixtures/demo/registry). NEVER use registry/.",
    )
    parser.add_argument(
        "--assets",
        type=int,
        default=100,
        help="Number of synthetic assets to generate (default: 100).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42).",
    )
    args = parser.parse_args(argv)

    out = Path(args.out).resolve()

    # Safety guard: refuse to overwrite the real registry/
    repo_root = Path(__file__).parent.parent.resolve()
    real_registry = repo_root / "registry"
    if out == real_registry or out.is_relative_to(real_registry):
        print(
            f"ERROR: refusing to write to real registry at {real_registry}. "
            "Use a different --out path.",
            file=sys.stderr,
        )
        return 1

    print(f"Generating demo fixtures → {out}")
    print(f"  seed={args.seed}  assets={args.assets}")

    projects_clean = [{k: v for k, v in p.items() if k != "description"} for p in PROJECTS]
    # Keep description in projects for display but strip internal slot defs from templates
    templates_clean = [
        {k: v for k, v in t.items() if k != "slots"}
        for t in TEMPLATES
    ]

    assets = generate_assets(args.assets, PROJECTS, seed=args.seed)
    boms = generate_boms(PROJECTS, TEMPLATES, seed=args.seed)
    context_packs = generate_context_packs(PROJECTS, seed=args.seed)
    events = generate_events(assets, n=min(50, args.assets // 2), seed=args.seed)

    # Write registry files
    write_jsonl(out / "projects.jsonl", projects_clean)
    write_jsonl(out / "assets.jsonl", assets)
    write_jsonl(out / "templates.jsonl", templates_clean)
    write_jsonl(out / "bom.jsonl", boms)
    write_jsonl(out / "context_packs.jsonl", context_packs)
    write_jsonl(out / "events.jsonl", events)

    # Validate: parse every written file back
    print("\nValidating output (parse round-trip)…")
    for fname in ["projects.jsonl", "assets.jsonl", "templates.jsonl",
                  "bom.jsonl", "context_packs.jsonl", "events.jsonl"]:
        path = out / fname
        parsed = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
        assert len(parsed) > 0, f"{fname} is empty after write"
        print(f"  OK  {fname}: {len(parsed)} records")

    print(
        f"\nDemo fixtures ready at: {out}\n"
        "To run the backend against these fixtures:\n"
        f"  ATLAS_REGISTRY_DIR={out}  uvicorn app.main:app --reload\n"
        "To use with the web app, start the backend first (fixture fallback is built in)."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
