---
name: claude-code
description: |
  Expert reference for Claude Code itself — features, setup, troubleshooting, and enterprise use.
  Use this skill when answering questions about Claude Code installation, authentication, slash commands,
  agent skills, MCP server configuration, hooks, plugins, subagents/agent teams, sessions, IDE integration
  (VS Code, JetBrains, desktop, Chrome, Slack), CI/CD integration, enterprise deployment (SSO, sandboxing,
  monitoring), extended thinking, prompt caching, checkpointing, cost tracking, or debugging Claude Code
  behaviour. Distinct from the Agent SDK: this skill is about operating and understanding Claude Code as a
  tool, not about building applications on the Claude Agent SDK.
version: 3.0.0
updated: 2026-06-01
source: https://code.claude.com/docs/en/ (rebuilt from official llms-full.txt, 114 pages)
---

# Claude Code Expert

Claude Code is Anthropic's agentic coding tool that lives in the terminal, IDE, desktop app, and browser. It understands a codebase, edits files, runs commands, and ships work faster — combining autonomous planning, execution, and validation with extensibility through skills, plugins, MCP servers, hooks, subagents, and agent teams.

This skill is the operating manual for Claude Code itself. It is **not** about the Claude Agent SDK (building apps on top of Claude Code as a library) — that has its own skill.

## When to Use This Skill

Use when a user needs help with:
- Understanding Claude Code features, capabilities, and how the agent loop works
- Installation, setup, platforms, and authentication
- Slash commands, the CLI reference, interactive mode, and keybindings
- Creating or managing Agent Skills, plugins, and output styles
- Configuring MCP servers for external tool integration
- Setting up hooks (lifecycle automation)
- Subagents, agent teams, agent view, and parallel/dynamic workflows
- Sessions, checkpointing, permissions/permission modes, fast mode, plan/review modes
- Configuration: settings, env vars, model config, memory (CLAUDE.md), statusline
- IDE & app integrations (VS Code, JetBrains, desktop, Chrome, web, Slack, channels)
- Automation: GitHub Actions, GitLab CI/CD, headless mode, routines, scheduled tasks
- Deployment: Bedrock, Vertex AI, Foundry, sandboxing, devcontainers, network/LLM gateway
- Enterprise administration: admin setup, security, monitoring, costs, analytics, managed settings, compliance
- Troubleshooting and error resolution
- Recent changes (What's New / changelog)

**Activation examples:** "How do I use Claude Code?" · "What slash commands are available?" · "How to set up an MCP server?" · "Create a new skill for X" · "Fix Claude Code authentication issues" · "How do agent teams work?" · "Deploy Claude Code in an enterprise environment".

## Core Concepts (at a glance)

- **Subagents** — specialized child agents with isolated context for parallel/focused work (`references/subagents-and-teams.md`).
- **Agent teams / agent view** — orchestrate and monitor many Claude Code sessions at once.
- **Agent Skills** — modular capabilities (`SKILL.md` + resources) Claude loads on demand; custom commands are now skills (`references/skills.md`).
- **Slash commands** — built-in + custom operations invoked with `/` (`references/commands-and-cli.md`).
- **Hooks** — shell commands that fire on lifecycle events (`references/hooks.md`).
- **MCP servers** — Model Context Protocol integrations for external tools (`references/mcp.md`).
- **Plugins** — packaged commands, skills, hooks, and MCP servers (`references/plugins-and-output-styles.md`).
- **Memory** — `CLAUDE.md` project/user instructions (`references/configuration.md`).

## Reference Map (progressive disclosure)

Load a reference file **only when the question calls for it**. Each file is a focused slice of the official docs; grep within a file for specific terms rather than reading it whole.

| Topic | Reference file | Load when the user asks about… |
|-------|----------------|--------------------------------|
| Getting started | `references/getting-started.md` | install, setup, quickstart, platforms, how it works, features overview, glossary |
| Workflows & best practices | `references/common-workflows.md` | common workflows, best practices, large codebases, worktrees, code review, context window, prompt library |
| Subagents & teams | `references/subagents-and-teams.md` | subagents, agents, agent teams, agent view, parallel work |
| Sessions & modes | `references/sessions-and-modes.md` | sessions, checkpointing, interactive/fullscreen, permissions & permission modes, plan/review (ultraplan/ultrareview), fast mode, voice, computer use, remote control, prompt caching |
| Agent Skills | `references/skills.md` | creating/using skills, SKILL.md format, invocation control, bundled skills |
| Plugins & output styles | `references/plugins-and-output-styles.md` | plugins, plugin marketplaces/dependencies/hints, plugins reference, output styles |
| Hooks | `references/hooks.md` | hook types, configuration, the hooks guide |
| MCP | `references/mcp.md` | MCP server setup, managed MCP |
| Slash commands & CLI | `references/commands-and-cli.md` | slash commands, CLI flags, keybindings, tools reference, statusline |
| Configuration | `references/configuration.md` | settings.json, env vars, terminal/model config, memory (CLAUDE.md), `.claude/` directory |
| IDE & apps | `references/ide-and-apps.md` | VS Code, JetBrains, desktop, Chrome, web, Slack, channels, deep links |
| Automation & CI/CD | `references/automation-cicd.md` | GitHub Actions, GitLab CI/CD, headless, routines, scheduled tasks |
| Deployment & infra | `references/deployment-and-infra.md` | Bedrock, Vertex AI, Foundry, AWS, network config, LLM gateway, devcontainer, sandboxing |
| Enterprise & admin | `references/enterprise-admin.md` | admin setup, authentication, security, monitoring, costs, analytics, managed settings, compliance |
| Troubleshooting | `references/troubleshooting.md` | errors, troubleshooting, debugging your config |
| What's New & changelog | `references/whats-new.md` | recent features, weekly updates, release history |

Full titled index of every source page: `llms.txt`.

## Instructions for Claude

When answering a Claude Code question:

1. **Identify the topic** from the question and map it to a reference file using the table above.
2. **Load only the relevant reference(s)** — most questions need exactly one. Use `grep`/search within the file for the specific term (e.g., search `references/hooks.md` for `PreToolUse`) instead of reading the entire file.
3. **Answer from the loaded reference**, quoting exact flags, settings keys, file paths, and commands. Each page block in a reference keeps its canonical `Source:` URL — cite it when helpful.
4. **Combine references** only for genuinely cross-cutting questions (e.g., "secure enterprise setup with sandboxing and managed MCP" → `enterprise-admin.md` + `deployment-and-infra.md` + `mcp.md`).
5. **Prefer current docs over memory.** This skill was rebuilt from the official `llms-full.txt`; treat it as the source of truth and note when behaviour may be version-dependent.

**Documentation links**
- Docs: https://code.claude.com/docs/en/overview
- CLI reference: https://code.claude.com/docs/en/cli-reference
- What's new: https://code.claude.com/docs/en/whats-new
- Support: https://support.claude.com

_Rebuilt with Skill Seekers from the official Claude Code documentation (`llms-full.txt`). Agent SDK pages are intentionally excluded — see the separate Agent SDK skill._
