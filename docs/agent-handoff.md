# Agent Handoff

## What To Read First

1. `AGENTS.md` or `CLAUDE.md`
2. `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`
3. `docs/charter.md`
4. `docs/implementation-plan.md`
5. `.skillmeat/project.yaml`

## Required Posture

- Start with the spec.
- Preserve system boundaries.
- Keep agent access policy-aware.
- Treat registry files as portable local-first artifacts.
- Update docs and OpenAPI when behavior changes.
- Delegate broad research, implementation slices, or review passes when reasonable.

## Useful Commands

```bash
node .agents/skills/skillmeat-cli/scripts/analyze-project.js .
cd api && python3 -m pytest -q
```
