# Artifact Atlas Charter

## Mission

Create the human and agent interface for project artifacts: assets, expected deliverables, context packs, provenance, policy, and coverage.

## Product Thesis

A project is a living graph of intents, task nodes, assets, expected artifacts, context packs, evidence, and decisions. Artifact Atlas makes that graph visible and usable without giving agents broad filesystem access.

## MVP Outcome

The MVP proves that a user can:

- Create a project and import assets.
- Browse and classify assets.
- Apply a seed Artifact BOM template.
- Assign assets to BOM slots.
- View coverage and gaps.
- Build a context pack for an IntentTree node or selected assets.
- Export Markdown/YAML registry artifacts.
- Serve read-first MCP tools for asset search and node context.

## Non-Goals

- Do not replace MeatyWiki, IntentTree, Figma, Drive, GitHub, or SkillMeat.
- Do not store every source file blob in the database.
- Do not default to external model calls for local-first mode.
- Do not make canonical promotion implicit.
