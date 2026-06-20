# Artifact Atlas Decisions

- D-001: Initialize as a T4 Agentic OS project with Operator run record `op_run_20260619_184310_artifact-atlas-project-a`.
- D-002: Use a local-first MVP architecture: readable JSONL/YAML registry exports first, database-backed services later.
- D-003: Use Next.js + React + TypeScript for the web app scaffold.
- D-004: Use FastAPI + Pydantic for API and MCP/CLI-adjacent service scaffolding.
- D-005: Keep agent retrieval policy-aware. Sensitive asset content is not broadly accessible by default.
- D-006: Deploy the `skillmeat-instance-starter` scaffold bundle (v1.0.0, source v0.55.1; 237 artifacts / 650 files — 40 skills, 64 commands, 60 agents, 16 specs, 13 context, 10 hooks, 5 rules, 5 templates) into `.claude/` to complete the T4 planning + execution methodology stack that was blocked during the original `op` scaffold. Built deterministically via `skillmeat/scripts/build-starter-bundle.py --tier all` (local API/collection path was unavailable). Project `CLAUDE.md` preserved; the bundle's generic methodology template stashed at `.claude/docs/CLAUDE.starter-template.md`. Bundle provenance under `.claude/bundles/skillmeat-instance-starter/`.
