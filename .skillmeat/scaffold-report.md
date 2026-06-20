# SkillMeat Scaffold Report

Date: 2026-06-19

The project was initialized as a T4 Agentic OS project with the Operator scaffold and the local `skillmeat-cli` skill.

## Applied

- `op` T4 run record under `.operator/runs/`.
- Claude skill copies under `.claude/skills/`.
- Codex/agent skill copies under `.agents/skills/`.
- SkillMeat project profile initialization for `claude_code`, `codex`, `gemini`, and `cursor`.
- SkillMeat starter bundle reference under `.claude/agentic-baseline.bundle.yaml`.
- Full-stack project shape from the SkillMeat `fullstack` template: `api/`, `web/`, and `shared/`.
- Local-first Artifact Atlas registry conventions: `config/`, `registry/`, `templates/`, `assets/`, and `exports/`.

## Resolved (2026-06-20)

The previously-blocked `skillmeat-instance-starter` bundle was deployed. The local SkillMeat
API (`localhost:8080`) and collection-resident bundle were both unavailable, so instead of
`skillmeat bundle deploy`, the bundle was assembled deterministically from its maintained
manifest and merged into `.claude/`:

```bash
python scripts/build-starter-bundle.py --source <skillmeat-repo> \
  --output <stage> --tier all \
  --project-name "Artifact Atlas" --author "Nick Miethe"
# then merged <stage>/.claude/ into project .claude/ (CLAUDE.md and op/skillmeat-cli preserved)
```

Result: 237 artifacts / 650 files (40 skills, 64 commands, 60 agents, 16 specs, 13 context,
10 hooks, 5 rules, 5 templates, 2 config). See `docs/DECISIONS.md` D-006,
`.claude/.skillmeat-deployed.toml`, and provenance under
`.claude/bundles/skillmeat-instance-starter/`.

## Originally Blocked

The `skillmeat` executable was not on PATH for the Operator scaffold, so the published
`skillmeat-instance-starter` bundle could not be materialized during `op` execution. It was
later found at `/Users/miethe/.local/bin/skillmeat` and used for project initialization.

`skillmeat scaffold --standard --project . --dry-run` could not reach the local SkillMeat API,
so enabled Project Starters could not be fetched.

Optional follow-up (when the SkillMeat API is running) to fetch any additional enabled Project
Starters beyond the methodology bundle:

```bash
skillmeat scaffold --standard --project .
```
