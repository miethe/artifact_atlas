# AAR: Artifact Atlas T4 Project Initialization

Date: 2026-06-19

Project: Artifact Atlas

## Executive Summary

Artifact Atlas was initialized as a new T4 Agentic OS project using the `/op` skill model, the Operator T4 scaffolder, delegated spec reconnaissance, and the local `skillmeat-cli` skill. The workflow produced a working project skeleton for both Claude and Codex-style agents, a SkillMeat project manifest, local-first registry conventions, seed Artifact BOM templates, a context-pack draft, and starter Next.js/FastAPI/OpenAPI scaffolding.

The main deviation was environmental: `skillmeat` was installed but not on PATH when the Operator scaffold ran. The Operator therefore recorded the starter bundle deployment command instead of materializing the full `skillmeat-instance-starter` bundle. The CLI was later found at `/Users/miethe/.local/bin/skillmeat` and used to initialize project profiles for Claude Code, Codex, Gemini, and Cursor.

## Intent

The user asked to:

- Use `/op` / `op` to initialize the project as a new T4 project.
- Pull in relevant scaffolding, skills, and agent setup.
- Do this for both Claude and Codex agents.
- Use `skillmeat-cli` to scaffold and set up the project.
- Follow `Artifact_Atlas_PRD_UIUX_Implementation_Spec_Package/Artifact_Atlas_PRD_UIUX_Implementation_Spec.md`.
- Write this AAR as a full-workflow case study.

## Route and Tier

The `op` skill defines T4 as a new project scaffold:

- Repo skeleton.
- Project `CLAUDE.md`.
- SkillMeat bundle.
- IntentTree workspace.
- MeatyWiki namespace.
- Seed research/council pass.

The project was treated as route `tasks`, tier `T4`, because the request was explicitly a new project initialization rather than a bounded feature inside an existing repo.

Operator run record:

```text
.operator/runs/op_run_20260619_184310_artifact-atlas-project-a/run.json
```

## Delegation

A subagent was used for read-only spec extraction. It confirmed:

- The spec does not literally mention `T4`, so T4 behavior should come from the Operator model.
- The product is a project asset graph, Artifact BOM, and context-pack builder.
- The likely stack is Next.js/React/TypeScript plus FastAPI/Pydantic.
- Agent access must be scoped through CLI/API/MCP/context packs rather than raw filesystem access.
- MVP work starts with local schemas, registry conventions, web app shell, BOM/templates, and context packs.

That output shaped the scaffold instead of relying on a generic app template.

## `/op` Usage

The installed `op` binary was not on PATH. The Operator source was available at:

```text
/Users/miethe/dev/homelab/development/agentic_meta_dev/src/operator_core
```

The first direct CLI attempt needed `PYTHONPATH`; the next attempt found a missing `PyYAML` dependency in the system Python environment. To avoid creating the scaffold in a nested slug directory, the underlying Operator scaffolder module was invoked with `target_dir=.`:

```bash
PYTHONPATH=/Users/miethe/dev/homelab/development/agentic_meta_dev/src python3 - <<'PY'
from pathlib import Path
from operator_core import scaffolder
result = scaffolder.scaffold(
    "Artifact Atlas project asset graph and Artifact BOM context pack application",
    tier=4,
    home=Path(".operator/runs"),
    target_dir=Path("."),
    deploy_bundle=True,
)
print(scaffolder.render_text(result))
PY
```

The Operator produced:

- T0 Ideas capture marker.
- T1 research seed marker.
- T2 workflow/council marker.
- T3 repo skeleton and planning stubs.
- T4 SkillMeat bundle reference, MeatyWiki namespace, seed research, and seed council docs.

## SkillMeat Usage

The local `skillmeat-cli` skill was used for routing, scaffold workflow guidance, and command reference. Its local project copies already existed under:

```text
.claude/skills/skillmeat-cli
.agents/skills/skillmeat-cli
```

The actual `skillmeat` executable was later found at:

```text
/Users/miethe/.local/bin/skillmeat
```

Read-only help confirmed that the CLI includes `init`, `scaffold`, `bundle`, `memory`, `project`, `mcp`, and related commands. Project initialization was then run:

```bash
/Users/miethe/.local/bin/skillmeat init --all-profiles --project-path . --no-input
```

Result:

```text
Project initialized for profiles: claude_code, codex, gemini, cursor
```

This created profile markers under `.claude/`, `.codex/`, `.gemini/`, and `.cursor/`.

The standard Project Starter preview was attempted:

```bash
/Users/miethe/.local/bin/skillmeat scaffold --standard --project . --dry-run
```

Result:

```text
Could not reach SkillMeat API to fetch Project Starters: [Errno 61] Connection refused
```

The fallback was to record the starter bundle and scaffold intent in `.skillmeat/project.yaml` and `.skillmeat/scaffold-report.md`.

## Created Scaffold

Agent/project setup:

- `AGENTS.md` for Codex agents.
- `CLAUDE.md` for Claude Code.
- `.agents/project.yaml`.
- `.claude/project.yaml`.
- `.codex/.skillmeat-project.toml`.
- `.claude/.skillmeat-project.toml`.
- `.skillmeat/project.yaml`.
- `.skillmeat/scaffold-report.md`.

Planning and case-study docs:

- `docs/charter.md`.
- `docs/implementation-plan.md`.
- `docs/mvp-backlog.md`.
- `docs/architecture.md`.
- `docs/agent-handoff.md`.
- `docs/PRD.md`.
- `docs/DECISIONS.md`.
- `docs/meatywiki-namespace.md`.
- `docs/seed-research.md`.
- `docs/seed-council.md`.
- `docs/reports/aar-2026-06-19-t4-scaffold-case-study.md`.

Artifact Atlas local-first surface:

- `config/workspace.yaml`.
- `config/integrations.yaml`.
- `registry/projects.jsonl`.
- `registry/assets.jsonl`.
- `registry/templates.jsonl`.
- `registry/bom.jsonl`.
- `templates/new-product-app.yaml`.
- `templates/architecture-initiative.yaml`.
- `exports/context-packs/artifact-atlas-builder-context-pack.yaml`.

Implementation skeleton:

- `api/` FastAPI scaffold.
- `web/` Next.js scaffold.
- `shared/openapi.yaml`.
- `assets/thumbnails/.gitkeep`.
- `assets/previews/.gitkeep`.

## Validation

Validated:

- Git repository initialized.
- Operator run record created.
- SkillMeat CLI available through absolute path.
- SkillMeat memory command group available.
- SkillMeat project init completed for all profiles.
- Project analyzer ran successfully with bundled Node:

```bash
/Users/miethe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node .agents/skills/skillmeat-cli/scripts/analyze-project.js .
```

Output summary:

```text
deployed: op, skillmeat-cli
recommendations: none
```

- Python scaffold syntax compiled with bundled Python 3.12:

```bash
/Users/miethe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m py_compile api/app/main.py api/app/models/schemas.py api/app/services/coverage.py api/tests/test_health.py
```

- API test passed in a temporary venv:

```bash
rm -rf /tmp/artifact-atlas-api-venv
/Users/miethe/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m venv /tmp/artifact-atlas-api-venv
/tmp/artifact-atlas-api-venv/bin/python -m pip install -q -e ".[dev]"
/tmp/artifact-atlas-api-venv/bin/python -m pytest -q
```

Result:

```text
1 passed, 1 warning
```

Not fully validated:

- Web install/build was not run because `node` is not on default PATH and dependencies are not installed.
- SkillMeat Project Starters were not deployed because the local SkillMeat API was not running.
- The full `skillmeat-instance-starter` bundle was not deployed.

## What Worked

- The `/op` skill gave the correct tier framing and made the expected T4 outputs explicit.
- Delegated spec extraction reduced the risk of generic scaffolding.
- The local `skillmeat-cli` skill provided enough workflow guidance to choose scaffold, deployment, and validation paths.
- The Operator scaffold degraded cleanly when SkillMeat was not on PATH.
- SkillMeat project initialization successfully added profile records for Claude and Codex once the executable path was found.

## What Did Not Work

- `op` was not installed as a shell command in the active PATH.
- The system Python did not have Operator dependencies for the full CLI path.
- `skillmeat` was installed but not discoverable from the default shell PATH.
- The local SkillMeat API was not running, so Project Starters could not be fetched.
- `node` was not on the default PATH; bundled Node was needed for validation.

## Lessons

- T4 project initialization should check absolute tool locations before concluding a CLI is unavailable.
- Operator scaffolding needs a target directory flag on the `op new` CLI. Without it, direct CLI use can create an unintended nested or sibling slug directory.
- A T4 scaffold should record both the ideal bundle deployment and the actual environmental result.
- For agentic projects, root `AGENTS.md` plus `.claude/` and `.codex/` profile markers are both useful: one gives working instructions, the other gives tool-specific registration.
- SkillMeat scaffold workflows should support an offline/local template fallback when the API is unavailable.

## Recommended Next Runbook

1. Put SkillMeat and Operator CLIs on PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
export PYTHONPATH="/Users/miethe/dev/homelab/development/agentic_meta_dev/src:$PYTHONPATH"
```

2. Start or verify the SkillMeat API if Project Starters are needed.

3. Deploy the starter bundle:

```bash
skillmeat bundle deploy skillmeat-instance-starter --project .
```

4. Re-run standard starters:

```bash
skillmeat scaffold --standard --project .
```

5. Install project dependencies and run full validation:

```bash
cd api && python3 -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]" && pytest -q
cd ../web && npm install && npm run typecheck
```

## Case Study Takeaway

This was a successful T4 initialization with controlled fallbacks. The full Agentic OS workflow was exercised: `/op` classified and scaffolded the project, a subagent extracted spec constraints, SkillMeat registered project profiles and supplied scaffold workflow guidance, and the resulting repo now contains both human-readable planning artifacts and implementation-ready app structure. The remaining gaps are environmental rather than conceptual: PATH setup, SkillMeat API availability, and dependency installation.
