# Slash Commands & CLI Reference

_Claude Code documentation — Slash Commands & CLI Reference. Source: https://code.claude.com/docs/en/_


---

## Commands

`https://code.claude.com/docs/en/commands`

Complete reference for commands available in Claude Code, including built-in commands and bundled skills.

Commands control Claude Code from inside a session. They provide a quick way to switch models, manage permissions, clear context, run a workflow, and more.

Type `/` to see every command available to you, or type `/` followed by letters to filter.

A command is only recognized at the start of your message. Text that follows the command name is passed to it as arguments.

## Commands across a typical workflow

Most commands are useful at a specific point in a session, from setting up a project to shipping a change.

**First session in a repo.** Run `/init` to generate a starter `CLAUDE.md`, then `/memory` to refine it. Use `/mcp` and `/agents` to set up any servers or subagents the project needs, and `/permissions` to set the approval rules you want.

**During a task.** `/plan` switches into plan mode before a large change. `/model` and `/effort` adjust how much reasoning you're spending. When the conversation gets long, `/context` shows where the window is going and `/compact` summarizes it down; use `/btw` for a quick aside that shouldn't bloat history.

**Running work in parallel.** `/agents` opens the manager for the [subagents](/docs/en/sub-agents) Claude can delegate side tasks to, and `/tasks` lists what's running in the background of the current session. `/background` detaches the whole session to keep running as a [background agent](/docs/en/agent-view) and frees your terminal. For a large change that spans the codebase, `/batch` decomposes it into independent units and runs each in its own [worktree](/docs/en/worktrees). See [Run agents in parallel](/docs/en/agents) for how these approaches relate.

**Before you ship.** `/diff` shows what changed, `/code-review` checks the diff for correctness bugs and cleanups and can apply the findings with `--fix`, and `/review` or `/security-review` give a deeper read-only pass. `/code-review ultra` runs a multi-agent review in the cloud.

**Between sessions.** `/clear` starts fresh on a new task while keeping project memory. `/resume` and `/branch` let you return to or fork an earlier conversation. `/teleport` pulls a web session into this terminal, and `/remote-control` lets you continue this local session from another device.

**When something is wrong.** `/rewind` rolls code and conversation back to a checkpoint, or summarizes part of the conversation. `/doctor` and `/debug` diagnose install and runtime issues, and `/feedback` reports a bug with session context attached.

## All commands

The table below lists all the commands included in Claude Code. Most are built-in commands whose behavior is coded into the CLI. Two kinds of entries are marked:

* **[Skill](/docs/en/skills#bundled-skills)**: a bundled skill. It works like skills you write yourself: a prompt handed to Claude, which Claude can also invoke automatically when relevant.
* **[Workflow](/docs/en/workflows#bundled-workflows)**: a bundled [dynamic workflow](/docs/en/workflows) that fans work out across many subagents and runs in the background.

To add your own commands, see [skills](/docs/en/skills).

In the table below, `<arg>` indicates a required argument and `[arg]` indicates an optional one.

<Note>
  Not every command appears for every user. Availability depends on your platform, plan, and environment. For example, `/desktop` only shows on macOS and Windows when signed in with a Claude subscription, and `/upgrade` only shows on Pro and Max plans.
</Note>

| Command                                                                            | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/add-dir <path>`                                                                  | Add a working directory for file access during the current session. Most `.claude/` configuration is [not discovered](/docs/en/permissions#additional-directories-grant-file-access-not-configuration) from the added directory. You can later resume the session from the added directory with `--continue` or `--resume`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/agents`                                                                          | Manage [agent](/docs/en/sub-agents) configurations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/autofix-pr [prompt]`                                                             | Spawn a [Claude Code on the web](/docs/en/claude-code-on-the-web#auto-fix-pull-requests) session that watches the current branch's PR and pushes fixes when CI fails or reviewers leave comments. Detects the open PR from your checked-out branch with `gh pr view`; to watch a different PR, check out its branch first. By default the remote session is told to fix every CI failure and review comment; pass a prompt to give it different instructions, for example `/autofix-pr only fix lint and type errors`. Requires the `gh` CLI and access to [Claude Code on the web](/docs/en/claude-code-on-the-web#who-can-use-claude-code-on-the-web)                                                                                          |
| `/background [prompt]`                                                             | Detach the current session to run as a [background agent](/docs/en/agent-view) and free this terminal. Pass a prompt to send one more instruction before detaching. Monitor the session with `claude agents`. Alias: `/bg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/batch <instruction>`                                                             | **[Skill](/docs/en/skills#bundled-skills).** Orchestrate large-scale changes across a codebase in parallel. Researches the codebase, decomposes the work into 5 to 30 independent units, and presents a plan. Once approved, spawns one [background subagent](/docs/en/sub-agents#run-subagents-in-foreground-or-background) per unit in an isolated [git worktree](/docs/en/worktrees). Each subagent implements its unit, runs tests, and opens a pull request. Requires a git repository. Example: `/batch migrate src/ from Solid to React`                                                                                                                                                                                                       |
| `/branch [name]`                                                                   | Create a branch of the current conversation at this point. Switches you into the branch and preserves the original, which you can return to with `/resume`. Alias: `/fork`. When [`CLAUDE_CODE_FORK_SUBAGENT`](/docs/en/env-vars) is set, `/fork` instead spawns a [forked subagent](/docs/en/sub-agents#fork-the-current-conversation) and is no longer an alias for this command                                                                                                                                                                                                                                                                                                                                                               |
| `/btw <question>`                                                                  | Ask a quick [side question](/docs/en/interactive-mode#side-questions-with-%2Fbtw) without adding to the conversation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/chrome`                                                                          | Configure [Claude in Chrome](/docs/en/chrome) settings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/claude-api [migrate\|managed-agents-onboard]`                                    | **[Skill](/docs/en/skills#bundled-skills).** Load Claude API reference material for your project's language (Python, TypeScript, Java, Go, Ruby, C#, PHP, or cURL) and Managed Agents reference. Covers tool use, streaming, batches, structured outputs, and common pitfalls. Also activates automatically when your code imports `anthropic` or `@anthropic-ai/sdk`. Run `/claude-api migrate` to upgrade existing Claude API code to a newer model: Claude asks which files to scan and which model to target, then updates model IDs, thinking configuration, and other parameters that changed between versions. Run `/claude-api managed-agents-onboard` for an interactive walkthrough that creates a new Managed Agent from scratch |
| `/clear [name]`                                                                    | Start a new conversation with empty context. The previous conversation stays available in `/resume`. Pass a name to label the previous conversation in the `/resume` picker. To free up context while continuing the same conversation, use `/compact` instead. Aliases: `/reset`, `/new`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/code-review [low\|medium\|high\|xhigh\|max\|ultra] [--fix] [--comment] [target]` | **[Skill](/docs/en/skills#bundled-skills).** Review the current diff for correctness bugs and for reuse, simplification, and efficiency cleanups. Pass `--fix` to apply findings to your working tree, `--comment` to post them as inline GitHub PR comments, or `ultra` to run a deep [cloud review](/docs/en/ultrareview). From v2.1.154, `/simplify` runs a separate cleanup-only review that applies fixes without hunting for bugs. See [Review a diff locally](/docs/en/code-review#review-a-diff-locally) for effort levels and targeting                                                                                                                                                                                                      |
| `/color [color\|default]`                                                          | Set the prompt bar color for the current session. Available colors: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`. Use `default` to reset, or run with no argument to pick a random color. When [Remote Control](/docs/en/remote-control) is connected, the color syncs to claude.ai/code                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/compact [instructions]`                                                          | Free up context by summarizing the conversation so far. Optionally pass focus instructions for the summary. See [how compaction handles rules, skills, and memory files](/docs/en/context-window#what-survives-compaction)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/config`                                                                          | Open the [Settings](/docs/en/settings) interface to adjust theme, model, [output style](/docs/en/output-styles), and other preferences. Alias: `/settings`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/context [all]`                                                                   | Visualize current context usage as a colored grid. Shows optimization suggestions for context-heavy tools, memory bloat, and capacity warnings. In [fullscreen mode](/docs/en/fullscreen) the per-item breakdown is collapsed to keep the grid visible. Pass `all` to expand it                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `/copy [N]`                                                                        | Copy the last assistant response to clipboard. Pass a number `N` to copy the Nth-latest response: `/copy 2` copies the second-to-last. When code blocks are present, shows an interactive picker to select individual blocks or the full response. Press `w` in the picker to write the selection to a file instead of the clipboard, which is useful over SSH                                                                                                                                                                                                                                                                                                                                                                         |
| `/cost`                                                                            | Alias for `/usage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/debug [description]`                                                             | **[Skill](/docs/en/skills#bundled-skills).** Enable debug logging for the current session and troubleshoot issues by reading the session debug log. Debug logging is off by default unless you started with `claude --debug`, so running `/debug` mid-session starts capturing logs from that point forward. Optionally describe the issue to focus the analysis                                                                                                                                                                                                                                                                                                                                                                            |
| `/deep-research <question>`                                                        | **[Workflow](/docs/en/workflows#bundled-workflows).** Fan out web searches on a question, fetch and cross-check sources, and synthesize a cited report                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/desktop`                                                                         | Continue the current session in the Claude Code Desktop app. Requires macOS or Windows and a Claude subscription. Alias: `/app`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/diff`                                                                            | Open an interactive diff viewer showing uncommitted changes and per-turn diffs. Use left/right arrows to switch between the current git diff and individual Claude turns, and up/down to browse files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/doctor`                                                                          | Diagnose and verify your Claude Code installation and settings. Results show with status icons. Press `f` to have Claude fix any reported issues                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/effort [level\|auto]`                                                            | Set the model [effort level](/docs/en/model-config#adjust-effort-level). Accepts `low`, `medium`, `high`, `xhigh`, `max`, or `ultracode`; available levels depend on the model, and `max` and `ultracode` are session-only. `ultracode` is a Claude Code setting that combines `xhigh` reasoning with automatic [workflow](/docs/en/workflows#let-claude-decide-with-ultracode) orchestration. `auto` resets to the model default. Without an argument, opens an interactive slider; use left and right arrows to pick a level and `Enter` to apply. Takes effect immediately without waiting for the current response to finish                                                                                                                 |
| `/exit`                                                                            | Exit the CLI. In an attached [background session](/docs/en/agent-view#attach-to-a-session), this detaches and the session keeps running. Alias: `/quit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/export [filename]`                                                               | Export the current conversation as plain text. With a filename, writes directly to that file. Without, opens a dialog to copy to clipboard or save to a file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/fast [on\|off]`                                                                  | Toggle [fast mode](/docs/en/fast-mode) on or off                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/feedback [report]`                                                               | Submit feedback, report a bug, or share your conversation. Aliases: `/bug`, `/share`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/fewer-permission-prompts`                                                        | **[Skill](/docs/en/skills#bundled-skills).** Scan your transcripts for common read-only Bash and MCP tool calls, then add a prioritized allowlist to project `.claude/settings.json` to reduce permission prompts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/focus`                                                                           | Toggle the focus view, which shows only your last prompt, a one-line tool-call summary with edit diffstats, and the final response. The selection persists across sessions; set [`viewMode`](/docs/en/settings#available-settings) in settings to override it. Only available in [fullscreen rendering](/docs/en/fullscreen)                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/goal [condition\|clear]`                                                         | Set a [goal](/docs/en/goal): Claude keeps working across turns until the condition is met. With no argument, shows the current or most recently achieved goal. `clear`, `stop`, `off`, `reset`, `none`, or `cancel` removes an active goal early                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/heapdump`                                                                        | Write a JavaScript heap snapshot and a memory breakdown to `~/Desktop`, or your home directory on Linux without a Desktop folder, for diagnosing high memory usage. See [troubleshooting](/docs/en/troubleshooting#high-cpu-or-memory-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/help`                                                                            | Show help and available commands                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/hooks`                                                                           | View [hook](/docs/en/hooks) configurations for tool events                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/ide`                                                                             | Manage IDE integrations and show status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/init`                                                                            | Initialize project with a `CLAUDE.md` guide. Set `CLAUDE_CODE_NEW_INIT=1` for an interactive flow that also walks through skills, hooks, and personal memory files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/insights`                                                                        | Generate a report analyzing your Claude Code sessions, including project areas, interaction patterns, and friction points                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/install-github-app`                                                              | Set up the [Claude GitHub Actions](/docs/en/github-actions) app for a repository. Walks you through selecting a repo and configuring the integration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/install-slack-app`                                                               | Install the Claude Slack app. Opens a browser to complete the OAuth flow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `/keybindings`                                                                     | Open or create your keybindings configuration file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/login`                                                                           | Sign in to your Anthropic account                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/logout`                                                                          | Sign out from your Anthropic account                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/loop [interval] [prompt]`                                                        | **[Skill](/docs/en/skills#bundled-skills).** Run a prompt repeatedly while the session stays open. Omit the interval and Claude self-paces between iterations. Omit the prompt and, [where available](/docs/en/scheduled-tasks#run-the-built-in-maintenance-prompt), Claude runs an autonomous maintenance check or the prompt in `.claude/loop.md`. Example: `/loop 5m check if the deploy finished`. See [Run prompts on a schedule](/docs/en/scheduled-tasks). Alias: `/proactive`                                                                                                                                                                                                                                                                 |
| `/mcp`                                                                             | Manage MCP server connections and OAuth authentication                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `/memory`                                                                          | Edit `CLAUDE.md` memory files, enable or disable [auto-memory](/docs/en/memory#auto-memory), and view auto-memory entries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/mobile`                                                                          | Show QR code to download the Claude mobile app. Aliases: `/ios`, `/android`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/model [model]`                                                                   | Switch the AI model and save it as your default for new sessions. For models that support it, use left/right arrows to [adjust effort level](/docs/en/model-config#adjust-effort-level). With no argument, opens a picker; press `s` on a row to switch for the current session only. The picker asks for confirmation when the conversation has prior output, since the next response re-reads the full history without cached context. Once confirmed, the change applies without waiting for the current response to finish                                                                                                                                                                                                              |
| `/passes`                                                                          | Share a free week of Claude Code with friends. Only visible if your account is eligible                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/permissions`                                                                     | Manage allow, ask, and deny rules for tool permissions. Opens an interactive dialog where you can view rules by scope, add or remove rules, manage working directories, and review [recent auto mode denials](/docs/en/auto-mode-config#review-denials). Alias: `/allowed-tools`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/plan [description]`                                                              | Enter plan mode directly from the prompt. Pass an optional description to enter plan mode and immediately start with that task, for example `/plan fix the auth bug`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/plugin`                                                                          | Manage Claude Code [plugins](/docs/en/plugins)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/powerup`                                                                         | Discover Claude Code features through quick interactive lessons with animated demos                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/pr-comments [PR]`                                                                | Removed in v2.1.91. Ask Claude directly to view pull request comments instead. On earlier versions, fetches and displays comments from a GitHub pull request; automatically detects the PR for the current branch, or pass a PR URL or number. Requires the `gh` CLI                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/privacy-settings`                                                                | View and update your privacy settings. Only available for Pro and Max plan subscribers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `/radio`                                                                           | Open Claude FM lo-fi radio in your browser. Prints the stream URL when no browser is available. Not available on Bedrock, Vertex, or Foundry                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/recap`                                                                           | Generate a one-line summary of the current session on demand. See [Session recap](/docs/en/interactive-mode#session-recap) for the automatic recap that appears after you've been away                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/release-notes`                                                                   | View the changelog in an interactive version picker. Select a specific version to see its release notes, or choose to show all versions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/reload-plugins`                                                                  | Reload all active [plugins](/docs/en/plugins) to apply pending changes without restarting. Reports counts for each reloaded component and flags any load errors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `/reload-skills`                                                                   | Re-scan [skill](/docs/en/skills) and command directories so skills added or changed on disk during the session become available without restarting. Reports how many skills are available and how many were added or removed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/remote-control`                                                                  | Make this session available for [remote control](/docs/en/remote-control) from claude.ai. Alias: `/rc`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/remote-env`                                                                      | Configure the default remote environment for [web sessions started with `--remote`](/docs/en/claude-code-on-the-web#configure-your-environment)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `/rename [name]`                                                                   | Rename the current session and show the name on the prompt bar. Without a name, auto-generates one from conversation history                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/resume [session]`                                                                | Resume a conversation by ID or name, or open the session picker. As of v2.1.144, [background sessions](/docs/en/agent-view) appear in the picker marked with `bg`. Alias: `/continue`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/review [PR]`                                                                     | Review a pull request locally in your current session. For a deeper cloud-based review, see [`/code-review ultra`](/docs/en/ultrareview)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/rewind`                                                                          | Rewind the conversation and/or code to a previous point, or summarize from a selected message. See [checkpointing](/docs/en/checkpointing). Aliases: `/checkpoint`, `/undo`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `/run`                                                                             | **[Skill](/docs/en/skills#bundled-skills).** Launch and drive your project's app to see a change working in the running app, not just in tests. See [Run and verify your app](/docs/en/skills#run-and-verify-your-app). Requires Claude Code v2.1.145 or later                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/run-skill-generator`                                                             | **[Skill](/docs/en/skills#bundled-skills).** Teach `/run` and `/verify` how to build, launch, and drive your project's app from a clean environment by writing a per-project [skill](/docs/en/skills#run-and-verify-your-app). Requires Claude Code v2.1.145 or later                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/sandbox`                                                                         | Toggle [sandbox mode](/docs/en/sandboxing). Available on supported platforms only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/schedule [description]`                                                          | Create, update, list, or run [routines](/docs/en/routines), which execute on Anthropic-managed cloud infrastructure. Claude walks you through the setup conversationally. Alias: `/routines`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/scroll-speed`                                                                    | Adjust mouse wheel [scroll speed](/docs/en/fullscreen#mouse-wheel-scrolling) interactively, with a ruler you can scroll while the dialog is open to preview the change. Available in [fullscreen rendering](/docs/en/fullscreen) only and not in the JetBrains IDE terminal                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/security-review`                                                                 | Analyze pending changes on the current branch for security vulnerabilities. Reviews the git diff and identifies risks like injection, auth issues, and data exposure                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `/setup-bedrock`                                                                   | Configure [Amazon Bedrock](/docs/en/amazon-bedrock) authentication, region, and model pins through an interactive wizard. Only visible when `CLAUDE_CODE_USE_BEDROCK=1` is set. First-time Bedrock users can also access this wizard from the login screen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/setup-vertex`                                                                    | Configure [Google Vertex AI](/docs/en/google-vertex-ai) authentication, project, region, and model pins through an interactive wizard. Only visible when `CLAUDE_CODE_USE_VERTEX=1` is set. First-time Vertex AI users can also access this wizard from the login screen                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/simplify [target]`                                                               | **[Skill](/docs/en/skills#bundled-skills).** Review the changed code for cleanup opportunities and apply the fixes. Four review [agents](/docs/en/sub-agents) run in parallel, covering reuse of existing helpers, simplification, efficiency, and whether the change sits at the right level of abstraction. From v2.1.154, the review does not look for correctness bugs. Use `/code-review` to find bugs. On earlier versions `/simplify` is equivalent to `/code-review --fix`. Pass a path or PR reference to review a specific target                                                                                                                                                                                                      |
| `/skills`                                                                          | List available [skills](/docs/en/skills). Press `t` to sort by token count. Press `Space` to [hide a skill from Claude or the `/` menu](/docs/en/skills#override-skill-visibility-from-settings), then `Enter` to save                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/stats`                                                                           | Alias for `/usage`. Opens on the Stats tab                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `/status`                                                                          | Open the Settings interface (Status tab) showing version, model, account, and connectivity. Works while Claude is responding, without waiting for the current response to finish                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/statusline`                                                                      | Configure Claude Code's [status line](/docs/en/statusline). Describe what you want, or run without arguments to auto-configure from your shell prompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/stickers`                                                                        | Order Claude Code stickers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `/stop`                                                                            | Stop the current [background session](/docs/en/agent-view). Only available while attached to a background session; the transcript and any worktree are kept. To detach without stopping, use `/exit` or press `←`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/tasks`                                                                           | List and manage background tasks. Also available as `/bashes`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/team-onboarding`                                                                 | Generate a team onboarding guide from your Claude Code usage history. Claude analyzes your sessions, commands, and MCP server usage from the past 30 days and produces a markdown guide a teammate can paste as a first message to get set up quickly. For claude.ai subscribers on Pro, Max, Team, and Enterprise plans, also returns a share link teammates can open directly in Claude Code                                                                                                                                                                                                                                                                                                                                         |
| `/teleport`                                                                        | Pull a [Claude Code on the web](/docs/en/claude-code-on-the-web#from-web-to-terminal) session into this terminal: opens a picker, then fetches the branch and conversation. Also available as `/tp`. Requires a claude.ai subscription                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `/terminal-setup`                                                                  | Configure terminal keybindings for Shift+Enter and other shortcuts. Only visible in terminals that need it, like VS Code, Cursor, Windsurf, Alacritty, or Zed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/theme`                                                                           | Change the color theme. Includes an `auto` option that matches your terminal's light or dark background, light and dark variants, colorblind-accessible (daltonized) themes, ANSI themes that use your terminal's color palette, and any [custom themes](/docs/en/terminal-config#create-a-custom-theme) from `~/.claude/themes/` or plugins. Select **New custom theme…** to create one                                                                                                                                                                                                                                                                                                                                                    |
| `/tui [default\|fullscreen]`                                                       | Set the terminal UI renderer and relaunch into it with your conversation intact. `fullscreen` enables the [flicker-free alt-screen renderer](/docs/en/fullscreen). With no argument, prints the active renderer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `/ultraplan <prompt>`                                                              | Draft a plan in an [ultraplan](/docs/en/ultraplan) session, review it in your browser, then execute remotely or send it back to your terminal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `/ultrareview [PR]`                                                                | Run a deep, multi-agent code review in a cloud sandbox with [ultrareview](/docs/en/ultrareview). The preferred invocation is now `/code-review ultra`, and `/ultrareview` remains as an alias. Includes 3 free runs on Pro and Max, then requires [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans)                                                                                                                                                                                                                                                                                                                                                                                        |
| `/upgrade`                                                                         | Open the upgrade page to switch to a higher plan tier                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/usage`                                                                           | Show session cost, plan usage limits, and activity stats. On a Pro, Max, Team, or Enterprise plan, includes a breakdown of usage by skill, subagent, plugin, and MCP server. See the [cost tracking guide](/docs/en/costs#using-the-%2Fusage-command) for details. `/cost` and `/stats` are aliases                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/usage-credits`                                                                   | Configure usage credits to keep working when you hit a limit. Previously `/extra-usage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `/verify`                                                                          | **[Skill](/docs/en/skills#bundled-skills).** Confirm a code change does what it should by building your project's app, running it, and observing the result, rather than relying on tests or type checks. See [Run and verify your app](/docs/en/skills#run-and-verify-your-app). Requires Claude Code v2.1.145 or later                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/vim`                                                                             | Removed in v2.1.92. To toggle between Vim and Normal editing modes, use `/config` → Editor mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/voice [hold\|tap\|off]`                                                          | Toggle [voice dictation](/docs/en/voice-dictation), or enable it in a specific mode. Requires a Claude.ai account                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `/web-setup`                                                                       | Connect your GitHub account to [Claude Code on the web](/docs/en/web-quickstart#connect-from-your-terminal) using your local `gh` CLI credentials. `/schedule` prompts for this automatically if GitHub isn't connected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/workflows`                                                                       | Open the [workflow](/docs/en/workflows#watch-the-run) progress view to watch, pause, resume, or save running and completed workflows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## MCP prompts

MCP servers can expose prompts that appear as commands. These use the format `/mcp__<server>__<prompt>` and are dynamically discovered from connected servers. See [MCP prompts](/docs/en/mcp#use-mcp-prompts-as-commands) for details.

## See also

* [Skills](/docs/en/skills): create your own commands
* [Interactive mode](/docs/en/interactive-mode): keyboard shortcuts, Vim mode, and command history
* [CLI reference](/docs/en/cli-reference): launch-time flags


---

## CLI reference

`https://code.claude.com/docs/en/cli-reference`

Complete reference for Claude Code command-line interface, including commands and flags.

## CLI commands

You can start sessions, pipe content, resume conversations, and manage updates with these commands:

| Command                         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Example                                                     |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| `claude`                        | Start interactive session                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `claude`                                                    |
| `claude "query"`                | Start interactive session with initial prompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `claude "explain this project"`                             |
| `claude -p "query"`             | Query via SDK, then exit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `claude -p "explain this function"`                         |
| `cat file \| claude -p "query"` | Process piped content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `cat logs.txt \| claude -p "explain"`                       |
| `claude -c`                     | Continue most recent conversation in current directory                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `claude -c`                                                 |
| `claude -c -p "query"`          | Continue via SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `claude -c -p "Check for type errors"`                      |
| `claude -r "<session>" "query"` | Resume session by ID or name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `claude -r "auth-refactor" "Finish this PR"`                |
| `claude update`                 | Update to latest version                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `claude update`                                             |
| `claude install [version]`      | Install or reinstall the native binary. Accepts a version like `2.1.118`, or `stable` or `latest`. See [Install a specific version](/docs/en/setup#install-a-specific-version)                                                                                                                                                                                                                                                                                                                                                                                 | `claude install stable`                                     |
| `claude auth login`             | Sign in to your Anthropic account. Use `--email` to pre-fill your email address, `--sso` to force SSO authentication, and `--console` to sign in with Anthropic Console for API usage billing instead of a Claude subscription                                                                                                                                                                                                                                                                                                                            | `claude auth login --console`                               |
| `claude auth logout`            | Log out from your Anthropic account                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `claude auth logout`                                        |
| `claude auth status`            | Show authentication status as JSON. Use `--text` for human-readable output. Exits with code 0 if logged in, 1 if not                                                                                                                                                                                                                                                                                                                                                                                                                                      | `claude auth status`                                        |
| `claude agents`                 | Open [agent view](/docs/en/agent-view) to monitor and dispatch parallel background sessions. Use `--cwd <path>` to show only sessions started under that directory, or `--json` to print live sessions as a JSON array for scripting. Pass `--permission-mode`, `--model`, `--effort`, or `--agent` to set [defaults for dispatched sessions](/docs/en/agent-view#permission-mode-model-and-effort). Accepts `--settings`, `--add-dir`, `--plugin-dir`, and `--mcp-config` like the top-level `claude` command. Opening agent view requires an interactive terminal | `claude agents --json`                                      |
| `claude attach <id>`            | Attach to a [background session](/docs/en/agent-view#manage-sessions-from-the-shell) in this terminal                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `claude attach 7c5dcf5d`                                    |
| `claude auto-mode defaults`     | Print the built-in [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) classifier rules as JSON. Use `claude auto-mode config` to see your effective config with settings applied                                                                                                                                                                                                                                                                                                                                                          | `claude auto-mode defaults > rules.json`                    |
| `claude daemon status`          | Print the background-session [supervisor's](/docs/en/agent-view#the-supervisor-process) state, version, socket directory, and worker count for diagnostics. Exits 1 if the supervisor isn't running                                                                                                                                                                                                                                                                                                                                                            | `claude daemon status`                                      |
| `claude logs <id>`              | Print recent output from a [background session](/docs/en/agent-view#manage-sessions-from-the-shell)                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `claude logs 7c5dcf5d`                                      |
| `claude mcp`                    | Configure Model Context Protocol (MCP) servers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | See the [Claude Code MCP documentation](/docs/en/mcp).           |
| `claude plugin`                 | Manage Claude Code [plugins](/docs/en/plugins). Alias: `claude plugins`. See [plugin reference](/docs/en/plugins-reference#cli-commands-reference) for subcommands                                                                                                                                                                                                                                                                                                                                                                                                  | `claude plugin install code-review@claude-plugins-official` |
| `claude project purge [path]`   | Delete all local Claude Code state for a project: transcripts, task lists, debug logs, file-edit history, prompt history lines, and the project's entry in `~/.claude.json`. Omit `[path]` to pick from an interactive list. Flags: `--dry-run` to preview, `-y`/`--yes` to skip confirmation, `-i`/`--interactive` to confirm each item, `--all` for every project. See [Clear local data](/docs/en/claude-directory#clear-local-data)                                                                                                                        | `claude project purge ~/work/repo --dry-run`                |
| `claude remote-control`         | Start a [Remote Control](/docs/en/remote-control) server to control Claude Code from Claude.ai or the Claude app. Runs in server mode (no local interactive session). See [Server mode flags](/docs/en/remote-control#start-a-remote-control-session)                                                                                                                                                                                                                                                                                                               | `claude remote-control --name "My Project"`                 |
| `claude respawn <id>`           | Restart a [background session](/docs/en/agent-view#manage-sessions-from-the-shell), running or stopped, with its conversation intact. Use `--all` to restart every running session, e.g. to pick up an updated Claude Code binary                                                                                                                                                                                                                                                                                                                              | `claude respawn 7c5dcf5d`                                   |
| `claude rm <id>`                | Remove a [background session](/docs/en/agent-view#manage-sessions-from-the-shell) from the list. The conversation transcript stays on your local machine, available through `claude --resume`                                                                                                                                                                                                                                                                                                                                                                  | `claude rm 7c5dcf5d`                                        |
| `claude setup-token`            | Generate a long-lived OAuth token for CI and scripts. Prints the token to the terminal without saving it. Requires a Claude subscription. See [Generate a long-lived token](/docs/en/authentication#generate-a-long-lived-token)                                                                                                                                                                                                                                                                                                                               | `claude setup-token`                                        |
| `claude stop <id>`              | Stop a [background session](/docs/en/agent-view#manage-sessions-from-the-shell). Also accepts `claude kill`                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `claude stop 7c5dcf5d`                                      |
| `claude ultrareview [target]`   | Run [ultrareview](/docs/en/ultrareview#run-ultrareview-non-interactively) non-interactively. Prints findings to stdout and exits 0 on success or 1 on failure. Use `--json` for the raw payload and `--timeout <minutes>` to override the 30-minute default                                                                                                                                                                                                                                                                                                    | `claude ultrareview 1234 --json`                            |

If you mistype a subcommand, Claude Code suggests the closest match and exits without starting a session. For example, `claude udpate` prints `Did you mean claude update?`.

## CLI flags

Customize Claude Code's behavior with these command-line flags. `claude --help` does not list every flag, so a flag's absence from `--help` does not mean it is unavailable.

| Flag                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                      | Example                                                                                             |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| `--add-dir`                                     | Add additional working directories for Claude to read and edit files. Grants file access; most `.claude/` configuration is [not discovered](/docs/en/permissions#additional-directories-grant-file-access-not-configuration) from these directories. Validates each path exists as a directory. To persist these directories across sessions, set [`permissions.additionalDirectories`](/docs/en/settings#permission-settings) in settings | `claude --add-dir ../apps ../lib`                                                                   |
| `--agent`                                       | Specify an agent for the current session (overrides the `agent` setting)                                                                                                                                                                                                                                                                                                                                                         | `claude --agent my-custom-agent`                                                                    |
| `--agents`                                      | Define custom subagents dynamically via JSON. Uses the same field names as subagent [frontmatter](/docs/en/sub-agents#supported-frontmatter-fields), plus a `prompt` field for the agent's instructions                                                                                                                                                                                                                               | `claude --agents '{"reviewer":{"description":"Reviews code","prompt":"You are a code reviewer"}}'`  |
| `--allow-dangerously-skip-permissions`          | Add `bypassPermissions` to the `Shift+Tab` mode cycle without starting in it. Lets you begin in a different mode like `plan` and switch to `bypassPermissions` later. See [permission modes](/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode)                                                                                                                                                                   | `claude --permission-mode plan --allow-dangerously-skip-permissions`                                |
| `--allowedTools`                                | Tools that execute without prompting for permission. See [permission rule syntax](/docs/en/settings#permission-rule-syntax) for pattern matching. To restrict which tools are available, use `--tools` instead                                                                                                                                                                                                                        | `"Bash(git log *)" "Bash(git diff *)" "Read"`                                                       |
| `--append-system-prompt`                        | Append custom text to the end of the default system prompt                                                                                                                                                                                                                                                                                                                                                                       | `claude --append-system-prompt "Always use TypeScript"`                                             |
| `--append-system-prompt-file`                   | Load additional system prompt text from a file and append to the default prompt                                                                                                                                                                                                                                                                                                                                                  | `claude --append-system-prompt-file ./extra-rules.txt`                                              |
| `--bare`                                        | Minimal mode: skip auto-discovery of hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md so scripted calls start faster. Claude has access to Bash, file read, and file edit tools. Sets [`CLAUDE_CODE_SIMPLE`](/docs/en/env-vars). See [bare mode](/docs/en/headless#start-faster-with-bare-mode)                                                                                                                             | `claude --bare -p "query"`                                                                          |
| `--betas`                                       | Beta headers to include in API requests (API key users only)                                                                                                                                                                                                                                                                                                                                                                     | `claude --betas interleaved-thinking`                                                               |
| `--bg`                                          | Start the session as a [background agent](/docs/en/agent-view) and return immediately. Prints the session ID and management commands. Combine with `--exec` to run a shell command as a background job instead of a Claude session, or with `--agent` to run a specific subagent                                                                                                                                                      | `claude --bg "investigate the flaky test"`                                                          |
| `--channels`                                    | (Research preview) MCP servers whose [channel](/docs/en/channels) notifications Claude should listen for in this session. Space-separated list of `plugin:<name>@<marketplace>` entries. Requires Claude.ai authentication                                                                                                                                                                                                            | `claude --channels plugin:my-notifier@my-marketplace`                                               |
| `--chrome`                                      | Enable [Chrome browser integration](/docs/en/chrome) for web automation and testing                                                                                                                                                                                                                                                                                                                                                   | `claude --chrome`                                                                                   |
| `--continue`, `-c`                              | Load the most recent conversation in the current directory. Includes sessions that added this directory with `/add-dir`                                                                                                                                                                                                                                                                                                          | `claude --continue`                                                                                 |
| `--dangerously-load-development-channels`       | Enable [channels](/docs/en/channels-reference#test-during-the-research-preview) that are not on the approved allowlist, for local development. Accepts `plugin:<name>@<marketplace>` and `server:<name>` entries. Prompts for confirmation                                                                                                                                                                                            | `claude --dangerously-load-development-channels server:webhook`                                     |
| `--dangerously-skip-permissions`                | Skip permission prompts. Equivalent to `--permission-mode bypassPermissions`. See [permission modes](/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) for what this does and does not skip                                                                                                                                                                                                                      | `claude --dangerously-skip-permissions`                                                             |
| `--debug`                                       | Enable debug mode with optional category filtering (for example, `"api,hooks"` or `"!statsig,!file"`)                                                                                                                                                                                                                                                                                                                            | `claude --debug "api,mcp"`                                                                          |
| `--debug-file <path>`                           | Write debug logs to a specific file path. Implicitly enables debug mode. Takes precedence over `CLAUDE_CODE_DEBUG_LOGS_DIR`                                                                                                                                                                                                                                                                                                      | `claude --debug-file /tmp/claude-debug.log`                                                         |
| `--disable-slash-commands`                      | Disable all skills and commands for this session                                                                                                                                                                                                                                                                                                                                                                                 | `claude --disable-slash-commands`                                                                   |
| `--disallowedTools`                             | Deny rules. A bare tool name removes that tool from the model's context. A scoped rule such as `Bash(rm *)` leaves the tool available and denies only matching calls                                                                                                                                                                                                                                                             | `"Bash(git log *)" "Bash(git diff *)" "Edit"`                                                       |
| `--effort`                                      | Set the [effort level](/docs/en/model-config#adjust-effort-level) for the current session. Options: `low`, `medium`, `high`, `xhigh`, `max`; available levels depend on the model. Overrides the [`effortLevel`](/docs/en/settings#available-settings) setting for this session and does not persist                                                                                                                                       | `claude --effort high`                                                                              |
| `--enable-auto-mode`                            | Removed in v2.1.111. Auto mode is now in the `Shift+Tab` cycle by default; use `--permission-mode auto` to start in it                                                                                                                                                                                                                                                                                                           | `claude --permission-mode auto`                                                                     |
| `--exclude-dynamic-system-prompt-sections`      | Move per-machine sections from the system prompt (working directory, environment info, memory paths, git-repo flag) into the first user message. Improves prompt-cache reuse across different users and machines running the same task. Only applies with the default system prompt; ignored when `--system-prompt` or `--system-prompt-file` is set. Use with `-p` for scripted, multi-user workloads                           | `claude -p --exclude-dynamic-system-prompt-sections "query"`                                        |
| `--exec`                                        | Run a shell command as a PTY-backed background job instead of starting a Claude session. Use with `--bg` to launch from the shell                                                                                                                                                                                                                                                                                                | `claude --bg --exec 'pytest -x'`                                                                    |
| `--fallback-model`                              | Enable automatic fallback to a specified model when the default model is overloaded or not available, for example a retired model. Takes effect in print mode (`-p`) and in [background sessions](/docs/en/agent-view), which run non-interactively; ignored in an interactive session                                                                                                                                                | `claude -p --fallback-model sonnet "query"`                                                         |
| `--fork-session`                                | When resuming, create a new session ID instead of reusing the original (use with `--resume` or `--continue`)                                                                                                                                                                                                                                                                                                                     | `claude --resume abc123 --fork-session`                                                             |
| `--from-pr`                                     | Resume sessions linked to a specific pull request. Accepts a PR number, a GitHub or GitHub Enterprise PR URL, a GitLab merge request URL, or a Bitbucket pull request URL. Sessions are linked automatically when Claude creates the pull request                                                                                                                                                                                | `claude --from-pr 123`                                                                              |
| `--ide`                                         | Automatically connect to IDE on startup if exactly one valid IDE is available                                                                                                                                                                                                                                                                                                                                                    | `claude --ide`                                                                                      |
| `--init`                                        | Run [Setup hooks](/docs/en/hooks#setup) with the `init` matcher before the session (print mode only)                                                                                                                                                                                                                                                                                                                                  | `claude -p --init "query"`                                                                          |
| `--init-only`                                   | Run [Setup](/docs/en/hooks#setup) and `SessionStart` hooks, then exit without starting a conversation                                                                                                                                                                                                                                                                                                                                 | `claude --init-only`                                                                                |
| `--include-hook-events`                         | Include all hook lifecycle events in the output stream. Requires `--output-format stream-json`                                                                                                                                                                                                                                                                                                                                   | `claude -p --output-format stream-json --verbose --include-hook-events "query"`                     |
| `--include-partial-messages`                    | Include partial streaming events in output. Requires `--print` and `--output-format stream-json`                                                                                                                                                                                                                                                                                                                                 | `claude -p --output-format stream-json --verbose --include-partial-messages "query"`                |
| `--input-format`                                | Specify input format for print mode (options: `text`, `stream-json`)                                                                                                                                                                                                                                                                                                                                                             | `claude -p --output-format json --input-format stream-json`                                         |
| `--json-schema`                                 | Get validated JSON output matching a JSON Schema after agent completes its workflow (print mode only, see [structured outputs](/docs/en/agent-sdk/structured-outputs))                                                                                                                                                                                                                                                                | `claude -p --json-schema '{"type":"object","properties":{...}}' "query"`                            |
| `--maintenance`                                 | Run [Setup hooks](/docs/en/hooks#setup) with the `maintenance` matcher before the session (print mode only)                                                                                                                                                                                                                                                                                                                           | `claude -p --maintenance "query"`                                                                   |
| `--max-budget-usd`                              | Maximum dollar amount to spend on API calls before stopping (print mode only)                                                                                                                                                                                                                                                                                                                                                    | `claude -p --max-budget-usd 5.00 "query"`                                                           |
| `--max-turns`                                   | Limit the number of agentic turns (print mode only). Exits with an error when the limit is reached. No limit by default                                                                                                                                                                                                                                                                                                          | `claude -p --max-turns 3 "query"`                                                                   |
| `--mcp-config`                                  | Load MCP servers from JSON files or strings (space-separated)                                                                                                                                                                                                                                                                                                                                                                    | `claude --mcp-config ./mcp.json`                                                                    |
| `--model`                                       | Sets the model for the current session with an alias for the latest model (`sonnet` or `opus`) or a model's full name. Overrides the [`model`](/docs/en/settings#available-settings) setting and [`ANTHROPIC_MODEL`](/docs/en/model-config#environment-variables)                                                                                                                                                                          | `claude --model claude-sonnet-4-6`                                                                  |
| `--name`, `-n`                                  | Set a display name for the session, shown in `/resume` and the terminal title. You can resume a named session with `claude --resume <name>`. <br /><br />[`/rename`](/docs/en/commands) changes the name mid-session and also shows it on the prompt bar                                                                                                                                                                              | `claude -n "my-feature-work"`                                                                       |
| `--no-chrome`                                   | Disable [Chrome browser integration](/docs/en/chrome) for this session                                                                                                                                                                                                                                                                                                                                                                | `claude --no-chrome`                                                                                |
| `--no-session-persistence`                      | Disable session persistence so sessions are not saved to disk and cannot be resumed. Print mode only. The [`CLAUDE_CODE_SKIP_PROMPT_HISTORY`](/docs/en/env-vars) environment variable does the same in any mode                                                                                                                                                                                                                       | `claude -p --no-session-persistence "query"`                                                        |
| `--output-format`                               | Specify output format for print mode (options: `text`, `json`, `stream-json`)                                                                                                                                                                                                                                                                                                                                                    | `claude -p "query" --output-format json`                                                            |
| `--permission-mode`                             | Begin in a specified [permission mode](/docs/en/permission-modes). Accepts `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, or `bypassPermissions`. Overrides `defaultMode` from settings files                                                                                                                                                                                                                                   | `claude --permission-mode plan`                                                                     |
| `--permission-prompt-tool`                      | Specify an MCP tool to handle permission prompts in non-interactive mode                                                                                                                                                                                                                                                                                                                                                         | `claude -p --permission-prompt-tool mcp_auth_tool "query"`                                          |
| `--plugin-dir`                                  | Load a plugin from a directory or `.zip` archive for this session only. Each flag takes one path. Repeat the flag for multiple plugins: `--plugin-dir A --plugin-dir B.zip`                                                                                                                                                                                                                                                      | `claude --plugin-dir ./my-plugin`                                                                   |
| `--plugin-url`                                  | Fetch a plugin `.zip` archive from a URL for this session only. Repeat the flag for multiple plugins, or pass space-separated URLs in a single quoted value                                                                                                                                                                                                                                                                      | `claude --plugin-url https://example.com/plugin.zip`                                                |
| `--print`, `-p`                                 | Print response without interactive mode (see [Agent SDK documentation](/docs/en/agent-sdk/overview) for programmatic usage details)                                                                                                                                                                                                                                                                                                   | `claude -p "query"`                                                                                 |
| `--prompt-suggestions`                          | Emit a `prompt_suggestion` message after each turn with a predicted next user prompt. Requires `--print`, `--output-format stream-json`, and `--verbose`. See [Prompt suggestions](/docs/en/interactive-mode#prompt-suggestions)                                                                                                                                                                                                      | `claude -p --prompt-suggestions --output-format stream-json --verbose "query"`                      |
| `--remote`                                      | Create a new [web session](/docs/en/claude-code-on-the-web) on claude.ai with the provided task description                                                                                                                                                                                                                                                                                                                           | `claude --remote "Fix the login bug"`                                                               |
| `--remote-control`, `--rc`                      | Start an interactive session with [Remote Control](/docs/en/remote-control#start-a-remote-control-session) enabled so you can also control it from claude.ai or the Claude app. Optionally pass a name for the session                                                                                                                                                                                                                | `claude --remote-control "My Project"`                                                              |
| `--remote-control-session-name-prefix <prefix>` | Prefix for auto-generated [Remote Control](/docs/en/remote-control) session names when no explicit name is set. Defaults to your machine's hostname, producing names like `myhost-graceful-unicorn`. Set `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX` for the same effect                                                                                                                                                              | `claude remote-control --remote-control-session-name-prefix dev-box`                                |
| `--replay-user-messages`                        | Re-emit user messages from stdin back on stdout for acknowledgment. Requires `--input-format stream-json` and `--output-format stream-json`                                                                                                                                                                                                                                                                                      | `claude -p --input-format stream-json --output-format stream-json --verbose --replay-user-messages` |
| `--resume`, `-r`                                | Resume a specific session by ID or name, or show an interactive picker to choose a session. Includes sessions that added this directory with `/add-dir`. As of v2.1.144, [background sessions](/docs/en/agent-view) appear in the picker marked with `bg`                                                                                                                                                                             | `claude --resume auth-refactor`                                                                     |
| `--session-id`                                  | Use a specific session ID for the conversation (must be a valid UUID)                                                                                                                                                                                                                                                                                                                                                            | `claude --session-id "550e8400-e29b-41d4-a716-446655440000"`                                        |
| `--setting-sources`                             | Comma-separated list of setting sources to load (`user`, `project`, `local`)                                                                                                                                                                                                                                                                                                                                                     | `claude --setting-sources user,project`                                                             |
| `--settings`                                    | Path to a settings JSON file or an inline JSON string. Values you set here override the same keys in your `settings.json` files for this session. Keys you omit keep their file-based values. See [settings precedence](/docs/en/settings#settings-precedence)                                                                                                                                                                        | `claude --settings ./settings.json`                                                                 |
| `--strict-mcp-config`                           | Only use MCP servers from `--mcp-config`, ignoring all other MCP configurations                                                                                                                                                                                                                                                                                                                                                  | `claude --strict-mcp-config --mcp-config ./mcp.json`                                                |
| `--system-prompt`                               | Replace the entire system prompt with custom text                                                                                                                                                                                                                                                                                                                                                                                | `claude --system-prompt "You are a Python expert"`                                                  |
| `--system-prompt-file`                          | Load system prompt from a file, replacing the default prompt                                                                                                                                                                                                                                                                                                                                                                     | `claude --system-prompt-file ./custom-prompt.txt`                                                   |
| `--teleport`                                    | Resume a [web session](/docs/en/claude-code-on-the-web) in your local terminal                                                                                                                                                                                                                                                                                                                                                        | `claude --teleport`                                                                                 |
| `--teammate-mode`                               | Set how [agent team](/docs/en/agent-teams) teammates display: `auto` (default), `in-process`, or `tmux`. Overrides the [`teammateMode`](/docs/en/settings#available-settings) setting for this session. See [Choose a display mode](/docs/en/agent-teams#choose-a-display-mode)                                                                                                                                                                 | `claude --teammate-mode in-process`                                                                 |
| `--tmux`                                        | Create a tmux session for the worktree. Requires `--worktree`. Uses iTerm2 native panes when available; pass `--tmux=classic` for traditional tmux                                                                                                                                                                                                                                                                               | `claude -w feature-auth --tmux`                                                                     |
| `--tools`                                       | Restrict which built-in tools Claude can use. Use `""` to disable all, `"default"` for all, or tool names like `"Bash,Edit,Read"`                                                                                                                                                                                                                                                                                                | `claude --tools "Bash,Edit,Read"`                                                                   |
| `--verbose`                                     | Enable verbose logging, shows full turn-by-turn output. Overrides the [`viewMode`](/docs/en/settings#available-settings) setting for this session                                                                                                                                                                                                                                                                                     | `claude --verbose`                                                                                  |
| `--version`, `-v`                               | Output the version number                                                                                                                                                                                                                                                                                                                                                                                                        | `claude -v`                                                                                         |
| `--worktree`, `-w`                              | Start Claude in an isolated [git worktree](/docs/en/worktrees) at `<repo>/.claude/worktrees/<name>`. If no name is given, one is auto-generated. Pass `#<number>` or a GitHub pull request URL to fetch that PR from `origin` and branch the worktree from it                                                                                                                                                                         | `claude -w feature-auth`                                                                            |

### System prompt flags

Claude Code provides four flags for customizing the system prompt. All four work in both interactive and non-interactive modes.

| Flag                          | Behavior                                    | Example                                                 |
| :---------------------------- | :------------------------------------------ | :------------------------------------------------------ |
| `--system-prompt`             | Replaces the entire default prompt          | `claude --system-prompt "You are a Python expert"`      |
| `--system-prompt-file`        | Replaces with file contents                 | `claude --system-prompt-file ./prompts/review.txt`      |
| `--append-system-prompt`      | Appends to the default prompt               | `claude --append-system-prompt "Always use TypeScript"` |
| `--append-system-prompt-file` | Appends file contents to the default prompt | `claude --append-system-prompt-file ./style-rules.txt`  |

`--system-prompt` and `--system-prompt-file` are mutually exclusive. The append flags can be combined with either replacement flag.

Choose based on whether Claude Code's default identity still fits your task. Use an append flag when Claude should remain a coding assistant that also follows your extra rules: per-invocation instructions, output formatting, or domain context for a `-p` script. Appending preserves the default tool guidance, safety instructions, and coding conventions, so you only supply what differs. Use a replacement flag when the surface, identity, or permission model differs from Claude Code's, like a non-coding agent in a pipeline that no human watches. Replacing drops all of the default prompt, including tool guidance and safety instructions, so you take responsibility for whatever your task still needs.

These flags apply only to the current invocation. For persistent personas you can switch between and share across a project, use [output styles](/docs/en/output-styles). For project conventions Claude should always follow, use [CLAUDE.md](/docs/en/memory). The [Agent SDK guide on system prompts](/docs/en/agent-sdk/modifying-system-prompts#decide-on-a-starting-point) covers the same decision in more depth.

## See also

* [Chrome extension](/docs/en/chrome) - Browser automation and web testing
* [Interactive mode](/docs/en/interactive-mode) - Shortcuts, input modes, and interactive features
* [Quickstart guide](/docs/en/quickstart) - Getting started with Claude Code
* [Common workflows](/docs/en/common-workflows) - Advanced workflows and patterns
* [Settings](/docs/en/settings) - Configuration options
* [Agent SDK documentation](/docs/en/agent-sdk/overview) - Programmatic usage and integrations


---

## Customize keyboard shortcuts

`https://code.claude.com/docs/en/keybindings`

Customize keyboard shortcuts in Claude Code with a keybindings configuration file.

<Note>
  Customizable keyboard shortcuts require Claude Code v2.1.18 or later. Check your version with `claude --version`.
</Note>

Claude Code supports customizable keyboard shortcuts. Run `/keybindings` to create or open your configuration file at `~/.claude/keybindings.json`.

## Configuration file

The keybindings configuration file is an object with a `bindings` array. Each block specifies a context and a map of keystrokes to actions.

<Note>Changes to the keybindings file are automatically detected and applied without restarting Claude Code.</Note>

| Field      | Description                                        |
| :--------- | :------------------------------------------------- |
| `$schema`  | Optional JSON Schema URL for editor autocompletion |
| `$docs`    | Optional documentation URL                         |
| `bindings` | Array of binding blocks by context                 |

This example binds `Ctrl+E` to open an external editor in the chat context, and unbinds `Ctrl+U`:

```json theme={null}
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "$docs": "https://code.claude.com/docs/en/keybindings",
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "ctrl+e": "chat:externalEditor",
        "ctrl+u": null
      }
    }
  ]
}
```

## Contexts

Each binding block specifies a **context** where the bindings apply:

| Context           | Description                                                  |
| :---------------- | :----------------------------------------------------------- |
| `Global`          | Applies everywhere in the app                                |
| `Chat`            | Main chat input area                                         |
| `Autocomplete`    | Autocomplete menu is open                                    |
| `Settings`        | Settings menu                                                |
| `Confirmation`    | Permission and confirmation dialogs                          |
| `Tabs`            | Tab navigation components                                    |
| `Help`            | Help menu is visible                                         |
| `Transcript`      | Transcript viewer                                            |
| `HistorySearch`   | History search mode (Ctrl+R)                                 |
| `Task`            | Background task is running                                   |
| `ThemePicker`     | Theme picker dialog                                          |
| `Attachments`     | Image attachment navigation in select dialogs                |
| `Footer`          | Footer indicator navigation (tasks, teams, diff)             |
| `MessageSelector` | Rewind and summarize dialog message selection                |
| `DiffDialog`      | Diff viewer navigation                                       |
| `ModelPicker`     | Model picker effort level                                    |
| `Select`          | Generic select/list components                               |
| `Plugin`          | Plugin dialog (browse, discover, manage)                     |
| `Scroll`          | Conversation scrolling and text selection in fullscreen mode |
| `Doctor`          | `/doctor` diagnostics screen                                 |

## Available actions

Actions follow a `namespace:action` format, such as `chat:submit` to send a message or `app:toggleTodos` to show the task list. Each context has specific actions available.

### App actions

Actions available in the `Global` context:

| Action                 | Default   | Description                 |
| :--------------------- | :-------- | :-------------------------- |
| `app:interrupt`        | Ctrl+C    | Cancel current operation    |
| `app:exit`             | Ctrl+D    | Exit Claude Code            |
| `app:redraw`           | (unbound) | Force terminal redraw       |
| `app:toggleTodos`      | Ctrl+T    | Toggle task list visibility |
| `app:toggleTranscript` | Ctrl+O    | Toggle verbose transcript   |

### History actions

Actions for navigating command history:

| Action             | Default | Description           |
| :----------------- | :------ | :-------------------- |
| `history:search`   | Ctrl+R  | Open history search   |
| `history:previous` | Up      | Previous history item |
| `history:next`     | Down    | Next history item     |

### Chat actions

Actions available in the `Chat` context:

| Action                | Default                           | Description                                                                                                                                                    |
| :-------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chat:cancel`         | Escape                            | Cancel current input                                                                                                                                           |
| `chat:clearInput`     | Ctrl+L                            | Force a full screen redraw, preserving input. In [fullscreen rendering](/docs/en/fullscreen#clear-the-conversation), press twice within two seconds to run `/clear` |
| `chat:clearScreen`    | Cmd+K                             | In [fullscreen rendering](/docs/en/fullscreen#clear-the-conversation), press twice within two seconds to run `/clear`                                               |
| `chat:killAgents`     | Ctrl+X Ctrl+K                     | Kill all running [background subagents](/docs/en/sub-agents#run-subagents-in-foreground-or-background) in this session                                              |
| `chat:cycleMode`      | Shift+Tab\*                       | Cycle permission modes                                                                                                                                         |
| `chat:modelPicker`    | Meta+P                            | Open model picker                                                                                                                                              |
| `chat:fastMode`       | Meta+O                            | Toggle fast mode                                                                                                                                               |
| `chat:thinkingToggle` | Meta+T                            | Toggle extended thinking                                                                                                                                       |
| `chat:submit`         | Enter                             | Submit message                                                                                                                                                 |
| `chat:newline`        | Ctrl+J                            | Insert a newline without submitting                                                                                                                            |
| `chat:undo`           | Ctrl+\_, Ctrl+Shift+-             | Undo last action                                                                                                                                               |
| `chat:externalEditor` | Ctrl+G, Ctrl+X Ctrl+E             | Open in external editor                                                                                                                                        |
| `chat:stash`          | Ctrl+S                            | Stash current prompt                                                                                                                                           |
| `chat:imagePaste`     | Ctrl+V (Alt+V on Windows and WSL) | Paste image from clipboard. On WSL, both shortcuts are bound by default                                                                                        |

\*On Windows without VT mode (Node \<24.2.0/\<22.17.0, Bun \<1.2.23), defaults to Meta+M.

### Autocomplete actions

Actions available in the `Autocomplete` context:

| Action                  | Default | Description         |
| :---------------------- | :------ | :------------------ |
| `autocomplete:accept`   | Tab     | Accept suggestion   |
| `autocomplete:dismiss`  | Escape  | Dismiss menu        |
| `autocomplete:previous` | Up      | Previous suggestion |
| `autocomplete:next`     | Down    | Next suggestion     |

### Confirmation actions

Actions available in the `Confirmation` context:

| Action                      | Default   | Description                   |
| :-------------------------- | :-------- | :---------------------------- |
| `confirm:yes`               | Y, Enter  | Confirm action                |
| `confirm:no`                | N, Escape | Decline action                |
| `confirm:previous`          | Up        | Previous option               |
| `confirm:next`              | Down      | Next option                   |
| `confirm:nextField`         | Tab       | Next field                    |
| `confirm:previousField`     | (unbound) | Previous field                |
| `confirm:toggle`            | Space     | Toggle selection              |
| `confirm:cycleMode`         | Shift+Tab | Cycle permission modes        |
| `confirm:toggleExplanation` | Ctrl+E    | Toggle permission explanation |

### Permission actions

Actions available in the `Confirmation` context for permission dialogs:

| Action                   | Default   | Description                                                                                                         |
| :----------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------ |
| `permission:toggleDebug` | (unbound) | Toggle permission debug info. The previous default of Ctrl+D was removed in v2.1.146 because it shadowed `app:exit` |

### Transcript actions

Actions available in the `Transcript` context:

| Action                     | Default           | Description             |
| :------------------------- | :---------------- | :---------------------- |
| `transcript:toggleShowAll` | Ctrl+E            | Toggle show all content |
| `transcript:exit`          | q, Ctrl+C, Escape | Exit transcript view    |

### History search actions

Actions available in the `HistorySearch` context:

| Action                     | Default     | Description                               |
| :------------------------- | :---------- | :---------------------------------------- |
| `historySearch:next`       | Ctrl+R      | Next match                                |
| `historySearch:accept`     | Escape, Tab | Accept selection                          |
| `historySearch:cancel`     | Ctrl+C      | Cancel search                             |
| `historySearch:execute`    | Enter       | Execute selected command                  |
| `historySearch:cycleScope` | Ctrl+S      | Cycle scope: session, project, everywhere |

### Task actions

Actions available in the `Task` context:

| Action            | Default | Description             |
| :---------------- | :------ | :---------------------- |
| `task:background` | Ctrl+B  | Background current task |

### Theme actions

Actions available in the `ThemePicker` context:

| Action                           | Default | Description                |
| :------------------------------- | :------ | :------------------------- |
| `theme:toggleSyntaxHighlighting` | Ctrl+T  | Toggle syntax highlighting |

### Help actions

Actions available in the `Help` context:

| Action         | Default | Description     |
| :------------- | :------ | :-------------- |
| `help:dismiss` | Escape  | Close help menu |

### Tabs actions

Actions available in the `Tabs` context:

| Action          | Default         | Description  |
| :-------------- | :-------------- | :----------- |
| `tabs:next`     | Tab, Right      | Next tab     |
| `tabs:previous` | Shift+Tab, Left | Previous tab |

### Attachments actions

Actions available in the `Attachments` context:

| Action                 | Default           | Description                |
| :--------------------- | :---------------- | :------------------------- |
| `attachments:next`     | Right             | Next attachment            |
| `attachments:previous` | Left              | Previous attachment        |
| `attachments:remove`   | Backspace, Delete | Remove selected attachment |
| `attachments:exit`     | Down, Escape      | Exit attachment navigation |

### Footer actions

Actions available in the `Footer` context:

| Action                  | Default | Description                              |
| :---------------------- | :------ | :--------------------------------------- |
| `footer:next`           | Right   | Next footer item                         |
| `footer:previous`       | Left    | Previous footer item                     |
| `footer:up`             | Up      | Navigate up in footer (deselects at top) |
| `footer:down`           | Down    | Navigate down in footer                  |
| `footer:openSelected`   | Enter   | Open selected footer item                |
| `footer:clearSelection` | Escape  | Clear footer selection                   |

### Message selector actions

Actions available in the `MessageSelector` context:

| Action                   | Default                                   | Description       |
| :----------------------- | :---------------------------------------- | :---------------- |
| `messageSelector:up`     | Up, K, Ctrl+P                             | Move up in list   |
| `messageSelector:down`   | Down, J, Ctrl+N                           | Move down in list |
| `messageSelector:top`    | Ctrl+Up, Shift+Up, Meta+Up, Shift+K       | Jump to top       |
| `messageSelector:bottom` | Ctrl+Down, Shift+Down, Meta+Down, Shift+J | Jump to bottom    |
| `messageSelector:select` | Enter                                     | Select message    |

### Diff actions

Actions available in the `DiffDialog` context:

| Action                | Default            | Description                                                           |
| :-------------------- | :----------------- | :-------------------------------------------------------------------- |
| `diff:dismiss`        | Escape             | Close diff viewer                                                     |
| `diff:previousSource` | Left               | Previous diff source                                                  |
| `diff:nextSource`     | Right              | Next diff source                                                      |
| `diff:previousFile`   | Up, K              | Previous file in the file list; scroll up one line in the detail view |
| `diff:nextFile`       | Down, J            | Next file in the file list; scroll down one line in the detail view   |
| `diff:viewDetails`    | Enter              | View diff details                                                     |
| `diff:back`           | (context-specific) | Go back in diff viewer                                                |

The diff detail view also binds pager-style keys to the standard [scroll actions](#scroll-actions). These bindings are part of the `DiffDialog` context and apply only in the detail view; the `Scroll` context defaults listed under [Scroll actions](#scroll-actions) are unchanged.

| Action                | Default        | Description                 |
| :-------------------- | :------------- | :-------------------------- |
| `scroll:pageUp`       | PageUp         | Scroll up half a viewport   |
| `scroll:pageDown`     | PageDown       | Scroll down half a viewport |
| `scroll:fullPageUp`   | Shift+Space, B | Scroll up a full viewport   |
| `scroll:fullPageDown` | Space          | Scroll down a full viewport |
| `scroll:top`          | G, Home        | Jump to the top             |
| `scroll:bottom`       | Shift+G, End   | Jump to the bottom          |

### Model picker actions

Actions available in the `ModelPicker` context:

| Action                        | Default | Description                                  |
| :---------------------------- | :------ | :------------------------------------------- |
| `modelPicker:decreaseEffort`  | Left    | Decrease effort level                        |
| `modelPicker:increaseEffort`  | Right   | Increase effort level                        |
| `modelPicker:thisSessionOnly` | s       | Apply highlighted model to this session only |

### Select actions

Actions available in the `Select` context:

| Action            | Default         | Description      |
| :---------------- | :-------------- | :--------------- |
| `select:next`     | Down, J, Ctrl+N | Next option      |
| `select:previous` | Up, K, Ctrl+P   | Previous option  |
| `select:accept`   | Enter           | Accept selection |
| `select:cancel`   | Escape          | Cancel selection |

### Plugin actions

Actions available in the `Plugin` context:

| Action            | Default | Description                                                                |
| :---------------- | :------ | :------------------------------------------------------------------------- |
| `plugin:toggle`   | Space   | Toggle plugin selection                                                    |
| `plugin:install`  | I       | Install selected plugins                                                   |
| `plugin:favorite` | F       | Favorite the selected plugin so it sorts near the top of the Installed tab |

### Settings actions

Actions available in the `Settings` context:

| Action            | Default | Description                                                                 |
| :---------------- | :------ | :-------------------------------------------------------------------------- |
| `settings:search` | /       | Enter search mode                                                           |
| `settings:retry`  | R       | Retry loading usage data (on error)                                         |
| `settings:close`  | Enter   | Save changes and close the config panel. Escape discards changes and closes |

### Doctor actions

Actions available in the `Doctor` context:

| Action       | Default | Description                                                                                         |
| :----------- | :------ | :-------------------------------------------------------------------------------------------------- |
| `doctor:fix` | F       | Send the diagnostics report to Claude to fix the reported issues. Only active when issues are found |

### Voice actions

Actions available in the `Chat` context when [voice dictation](/docs/en/voice-dictation) is enabled:

| Action             | Default | Description                                              |
| :----------------- | :------ | :------------------------------------------------------- |
| `voice:pushToTalk` | Space   | Dictate a prompt. Hold or tap depending on `/voice` mode |

### Scroll actions

Actions available in the `Scroll` context when [fullscreen rendering](/docs/en/fullscreen) is enabled:

| Action                      | Default              | Description                                                                                               |
| :-------------------------- | :------------------- | :-------------------------------------------------------------------------------------------------------- |
| `scroll:lineUp`             | (unbound)            | Scroll up one line. Mouse wheel scrolling triggers this action                                            |
| `scroll:lineDown`           | (unbound)            | Scroll down one line. Mouse wheel scrolling triggers this action                                          |
| `scroll:pageUp`             | PageUp               | Scroll up half the viewport height                                                                        |
| `scroll:pageDown`           | PageDown             | Scroll down half the viewport height                                                                      |
| `scroll:top`                | Ctrl+Home            | Jump to the start of the conversation                                                                     |
| `scroll:bottom`             | Ctrl+End             | Jump to the latest message and re-enable auto-follow                                                      |
| `scroll:halfPageUp`         | (unbound)            | Scroll up half the viewport height. Same behavior as `scroll:pageUp`, provided for vi-style rebinds       |
| `scroll:halfPageDown`       | (unbound)            | Scroll down half the viewport height. Same behavior as `scroll:pageDown`, provided for vi-style rebinds   |
| `scroll:fullPageUp`         | (unbound)            | Scroll up the full viewport height                                                                        |
| `scroll:fullPageDown`       | (unbound)            | Scroll down the full viewport height                                                                      |
| `selection:copy`            | Ctrl+Shift+C / Cmd+C | Copy the selected text to the clipboard                                                                   |
| `selection:clear`           | (unbound)            | Clear the active text selection                                                                           |
| `selection:extendLeft`      | Shift+Left           | Extend the active selection one column left                                                               |
| `selection:extendRight`     | Shift+Right          | Extend the active selection one column right                                                              |
| `selection:extendUp`        | Shift+Up             | Extend the active selection one row up. Scrolls the viewport when the selection reaches the top edge      |
| `selection:extendDown`      | Shift+Down           | Extend the active selection one row down. Scrolls the viewport when the selection reaches the bottom edge |
| `selection:extendLineStart` | Shift+Home           | Extend the active selection to the start of the line                                                      |
| `selection:extendLineEnd`   | Shift+End            | Extend the active selection to the end of the line                                                        |

## Keystroke syntax

### Modifiers

Use modifier keys with the `+` separator:

* `ctrl` or `control` - Control key
* `shift` - Shift key
* `alt`, `opt`, `option`, or `meta` - Alt key on Windows and Linux, Option key on macOS
* `cmd`, `command`, `super`, or `win` - Command key on macOS, Windows key on Windows, Super key on Linux

The `cmd` group is only detected in terminals that report the Super modifier, such as those supporting the Kitty keyboard protocol or xterm's `modifyOtherKeys` mode. Most terminals do not send it, so use `ctrl` or `meta` for bindings you want to work everywhere.

For example:

```text theme={null}
ctrl+k          Ctrl + K
shift+tab       Shift + Tab
meta+p          Option + P on macOS, Alt + P elsewhere
ctrl+shift+c    Multiple modifiers
```

### Uppercase letters

A standalone uppercase letter implies Shift. For example, `K` is equivalent to `shift+k`. This is useful for vim-style bindings where uppercase and lowercase keys have different meanings.

Uppercase letters with modifiers (e.g., `ctrl+K`) are treated as stylistic and do **not** imply Shift: `ctrl+K` is the same as `ctrl+k`.

### Chords

Chords are sequences of keystrokes separated by spaces:

```text theme={null}
ctrl+k ctrl+s   Press Ctrl+K, release, then Ctrl+S
```

### Special keys

* `escape` or `esc` - Escape key
* `enter` or `return` - Enter key
* `tab` - Tab key
* `space` - Space bar
* `up`, `down`, `left`, `right` - Arrow keys
* `backspace`, `delete` - Delete keys

## Unbind default shortcuts

Set an action to `null` to unbind a default shortcut:

```json theme={null}
{
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "ctrl+s": null
      }
    }
  ]
}
```

This also works for chord bindings. Unbinding every chord that shares a prefix frees that prefix for use as a single-key binding:

```json theme={null}
{
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "ctrl+x ctrl+k": null,
        "ctrl+x ctrl+e": null,
        "ctrl+x": "chat:newline"
      }
    }
  ]
}
```

If you unbind some but not all chords on a prefix, pressing the prefix still enters chord-wait mode for the remaining bindings.

## Reserved shortcuts

These shortcuts cannot be rebound:

| Shortcut  | Reason                                         |
| :-------- | :--------------------------------------------- |
| Ctrl+C    | Hardcoded interrupt/cancel                     |
| Ctrl+D    | Hardcoded exit                                 |
| Ctrl+M    | Identical to Enter in terminals (both send CR) |
| Caps Lock | Not delivered to terminal applications         |

## Terminal conflicts

Some shortcuts may conflict with terminal multiplexers:

| Shortcut | Conflict                          |
| :------- | :-------------------------------- |
| Ctrl+B   | tmux prefix (press twice to send) |
| Ctrl+A   | GNU screen prefix                 |
| Ctrl+Z   | Unix process suspend (SIGTSTP)    |

## Vim mode interaction

When vim mode is enabled via `/config` → Editor mode, keybindings and vim mode operate independently:

* **Vim mode** handles input at the text input level (cursor movement, modes, motions)
* **Keybindings** handle actions at the component level (toggle todos, submit, etc.)
* The Escape key in vim mode switches INSERT to NORMAL mode; it does not trigger `chat:cancel`
* Most Ctrl+key shortcuts pass through vim mode to the keybinding system
* In vim NORMAL mode, `?` shows the help menu (vim behavior)
* In vim NORMAL mode, `/` opens history search, the same as Ctrl+R in standard mode

## Validation

Claude Code validates your keybindings and shows warnings for:

* Parse errors (invalid JSON or structure)
* Invalid context names
* Reserved shortcut conflicts
* Terminal multiplexer conflicts
* Duplicate bindings in the same context

Run `/doctor` to see any keybinding warnings.


---

## Tools reference

`https://code.claude.com/docs/en/tools-reference`

Complete reference for the tools Claude Code can use, including permission requirements and per-tool behavior.

Claude Code has access to a set of built-in tools that help it understand and modify your codebase. The tool names are the exact strings you use in [permission rules](/docs/en/permissions#tool-specific-permission-rules), [subagent tool lists](/docs/en/sub-agents), and [hook matchers](/docs/en/hooks). To disable a tool entirely, add its name to the `deny` array in your [permission settings](/docs/en/permissions#tool-specific-permission-rules).

To add custom tools, connect an [MCP server](/docs/en/mcp). To extend Claude with reusable prompt-based workflows, write a [skill](/docs/en/skills), which runs through the existing `Skill` tool rather than adding a new tool entry.

| Tool                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Permission Required |
| :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ |
| `Agent`                | Spawns a [subagent](/docs/en/sub-agents) with its own context window to handle a task. See [Agent tool behavior](#agent-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                         | No                  |
| `AskUserQuestion`      | Asks multiple-choice questions to gather requirements or clarify ambiguity                                                                                                                                                                                                                                                                                                                                                                                                                                | No                  |
| `Bash`                 | Executes shell commands in your environment. See [Bash tool behavior](#bash-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                | Yes                 |
| `CronCreate`           | Schedules a recurring or one-shot prompt within the current session. Tasks are session-scoped and restored on `--resume` or `--continue` if unexpired. See [scheduled tasks](/docs/en/scheduled-tasks)                                                                                                                                                                                                                                                                                                         | No                  |
| `CronDelete`           | Cancels a scheduled task by ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | No                  |
| `CronList`             | Lists all scheduled tasks in the session                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | No                  |
| `Edit`                 | Makes targeted edits to specific files. See [Edit tool behavior](#edit-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                     | Yes                 |
| `EnterPlanMode`        | Switches to plan mode to design an approach before coding                                                                                                                                                                                                                                                                                                                                                                                                                                                 | No                  |
| `EnterWorktree`        | Creates an isolated [git worktree](/docs/en/worktrees) and switches into it. Pass a `path` to switch into an existing worktree of the current repository instead of creating a new one. From within a worktree session, or from a subagent with a pinned working directory such as [`isolation: worktree`](/docs/en/sub-agents#supported-frontmatter-fields), only the `path` form is available and the target must be under `.claude/worktrees/`                                                                   | No                  |
| `ExitPlanMode`         | Presents a plan for approval and exits plan mode                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Yes                 |
| `ExitWorktree`         | Exits a worktree session and returns to the original directory. Not available to subagents that already run in their own working directory, such as with [`isolation: worktree`](/docs/en/sub-agents#supported-frontmatter-fields)                                                                                                                                                                                                                                                                             | No                  |
| `Glob`                 | Finds files based on pattern matching. See [Glob tool behavior](#glob-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                      | No                  |
| `Grep`                 | Searches for patterns in file contents. See [Grep tool behavior](#grep-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                     | No                  |
| `ListMcpResourcesTool` | Lists resources exposed by connected [MCP servers](/docs/en/mcp)                                                                                                                                                                                                                                                                                                                                                                                                                                               | No                  |
| `LSP`                  | Code intelligence via language servers: jump to definitions, find references, report type errors and warnings. See [LSP tool behavior](#lsp-tool-behavior)                                                                                                                                                                                                                                                                                                                                                | No                  |
| `Monitor`              | Runs a command in the background and feeds each output line back to Claude, so it can react to log entries, file changes, or polled status mid-conversation. See [Monitor tool](#monitor-tool)                                                                                                                                                                                                                                                                                                            | Yes                 |
| `NotebookEdit`         | Modifies Jupyter notebook cells. See [NotebookEdit tool behavior](#notebookedit-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                            | Yes                 |
| `PowerShell`           | Executes PowerShell commands natively. See [PowerShell tool](#powershell-tool) for availability                                                                                                                                                                                                                                                                                                                                                                                                           | Yes                 |
| `PushNotification`     | Sends a desktop notification, and a phone push when [Remote Control](/docs/en/remote-control) is connected, so a long-running task or [scheduled task](/docs/en/scheduled-tasks) can reach you when you step away. Push delivery runs through Anthropic-hosted infrastructure, which is not accessible from Amazon Bedrock, Google Vertex AI, or Microsoft Foundry                                                                                                                                                  | No                  |
| `Read`                 | Reads the contents of files. See [Read tool behavior](#read-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                                | No                  |
| `ReadMcpResourceTool`  | Reads a specific MCP resource by URI                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | No                  |
| `RemoteTrigger`        | Creates, updates, runs, and lists [Routines](/docs/en/routines) on claude.ai. Backs the `/schedule` command. Routines live on claude.ai and require a Pro, Max, Team, or Enterprise plan, so this tool is not accessible from Amazon Bedrock, Google Vertex AI, or Microsoft Foundry                                                                                                                                                                                                                           | No                  |
| `ScheduleWakeup`       | Reschedules the next iteration of a [self-paced `/loop`](/docs/en/scheduled-tasks#let-claude-choose-the-interval). Claude calls this at the end of each iteration to pick when the next one runs, between one minute and one hour out; you don't call it directly. The pending wakeup appears in `session_crons` in [Stop hook input](/docs/en/hooks#stop-input). Not available on Amazon Bedrock, Google Vertex AI, or Microsoft Foundry, where a `/loop` prompt with no interval runs on a fixed schedule instead | No                  |
| `SendMessage`          | Sends a message to an [agent team](/docs/en/agent-teams) teammate, or [resumes a subagent](/docs/en/sub-agents#resume-subagents) by its agent ID. Stopped subagents auto-resume in the background. Only available when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set                                                                                                                                                                                                                                              | No                  |
| `ShareOnboardingGuide` | Uploads `ONBOARDING.md` and returns a share link teammates can open in Claude Code. Called from `/team-onboarding` after the guide is written. Available to claude.ai subscribers on Pro, Max, Team, and Enterprise plans                                                                                                                                                                                                                                                                                 | Yes                 |
| `Skill`                | Executes a [skill](/docs/en/skills#control-who-invokes-a-skill) within the main conversation                                                                                                                                                                                                                                                                                                                                                                                                                   | Yes                 |
| `TaskCreate`           | Creates a new task in the task list                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No                  |
| `TaskGet`              | Retrieves full details for a specific task                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No                  |
| `TaskList`             | Lists all tasks with their current status                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | No                  |
| `TaskOutput`           | (Deprecated) Retrieves output from a background task. Prefer `Read` on the task's output file path                                                                                                                                                                                                                                                                                                                                                                                                        | No                  |
| `TaskStop`             | Kills a running background task by ID                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | No                  |
| `TaskUpdate`           | Updates task status, dependencies, details, or deletes tasks                                                                                                                                                                                                                                                                                                                                                                                                                                              | No                  |
| `TeamCreate`           | Creates an [agent team](/docs/en/agent-teams) with multiple teammates. Only available when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set                                                                                                                                                                                                                                                                                                                                                                     | No                  |
| `TeamDelete`           | Disbands an agent team and cleans up teammate processes. Only available when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set                                                                                                                                                                                                                                                                                                                                                                              | No                  |
| `TodoWrite`            | Manages the session task checklist. Disabled by default as of v2.1.142 in favor of `TaskCreate`, `TaskGet`, `TaskList`, and `TaskUpdate`. Set `CLAUDE_CODE_ENABLE_TASKS=0` to re-enable                                                                                                                                                                                                                                                                                                                   | No                  |
| `ToolSearch`           | Searches for and loads deferred tools when [tool search](/docs/en/mcp#scale-with-mcp-tool-search) is enabled                                                                                                                                                                                                                                                                                                                                                                                                   | No                  |
| `WaitForMcpServers`    | Waits for one or more [MCP servers](/docs/en/mcp) that are still connecting in the background, so a request can use their tools without restarting the session. Claude calls it when a needed server is not connected yet. Only appears when [tool search](/docs/en/mcp#scale-with-mcp-tool-search) is disabled, since `ToolSearch` handles the wait when it's enabled                                                                                                                                              | No                  |
| `WebFetch`             | Fetches content from a specified URL. See [WebFetch tool behavior](#webfetch-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                               | Yes                 |
| `WebSearch`            | Performs web searches. See [WebSearch tool behavior](#websearch-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                            | Yes                 |
| `Workflow`             | Runs a [dynamic workflow](/docs/en/workflows): a script that orchestrates many subagents in the background and returns one consolidated result                                                                                                                                                                                                                                                                                                                                                                 | Yes                 |
| `Write`                | Creates or overwrites files. See [Write tool behavior](#write-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                              | Yes                 |

## Configure tools with permission rules and hooks

For the most part, Claude decides when to use these tools and you do not need to name them yourself when interacting with Claude. You reference tool names directly when defining permissions and other configuration:

* in [`permissions.allow` and `permissions.deny`](/docs/en/settings#available-settings) in settings, and the `/permissions` interface
* in the `--allowedTools` and `--disallowedTools` [CLI flags](/docs/en/cli-reference)
* in the Agent SDK's [`allowedTools` and `disallowedTools`](/docs/en/agent-sdk/permissions#allow-and-deny-rules) options
* in a [subagent's `tools` or `disallowedTools`](/docs/en/sub-agents#supported-frontmatter-fields) frontmatter
* in a [skill's `allowed-tools`](/docs/en/skills#frontmatter-reference) frontmatter
* in a hook's [`if` condition](/docs/en/hooks-guide#filter-by-tool-name-and-arguments-with-the-if-field)

All of these accept the same rule format, `ToolName(specifier)`. The specifier depends on the tool, and several tools share a format:

| Rule format                    | Applies to                | Details                                                          |
| :----------------------------- | :------------------------ | :--------------------------------------------------------------- |
| `Bash(npm run *)`              | Bash, Monitor             | [Command pattern matching](/docs/en/permissions#bash)                 |
| `PowerShell(Get-ChildItem *)`  | PowerShell                | [Command pattern matching](/docs/en/permissions#powershell)           |
| `Read(~/secrets/**)`           | Read, Grep, Glob, LSP     | [Path pattern matching](/docs/en/permissions#read-and-edit)           |
| `Edit(/src/**)`                | Edit, Write, NotebookEdit | [Path pattern matching](/docs/en/permissions#read-and-edit)           |
| `Skill(deploy *)`              | Skill                     | [Skill name matching](/docs/en/skills#restrict-claude’s-skill-access) |
| `Agent(Explore)`               | Agent                     | [Subagent type matching](/docs/en/permissions#agent-subagents)        |
| `WebFetch(domain:example.com)` | WebFetch                  | [Domain matching](/docs/en/permissions#webfetch)                      |
| `WebSearch`                    | WebSearch                 | No specifier; allow or deny the tool as a whole                  |

Tools not listed here, such as `ExitPlanMode` or `ShareOnboardingGuide`, accept only the bare tool name with no specifier.

An `Edit(...)` allow rule also grants read access to the same path, so you do not need a matching `Read(...)` rule.

Hook `matcher` fields use bare tool names, not the parenthesized rule format. See [matcher patterns](/docs/en/hooks#matcher-patterns) for the matching rules. For the field names each tool passes to `tool_input` in hooks, see the [PreToolUse input reference](/docs/en/hooks#pretooluse-input).

## Agent tool behavior

The Agent tool spawns a subagent in a separate context window. The subagent works through its task autonomously, then returns a single text result to the parent conversation. The parent does not see the subagent's intermediate tool calls or outputs, only that final result. To cap how many turns a subagent runs, set `maxTurns` in the [subagent definition](/docs/en/sub-agents#supported-frontmatter-fields).

The same Agent tool also launches [forked subagents](/docs/en/sub-agents#fork-the-current-conversation) when fork mode is enabled. A fork inherits the full parent conversation instead of starting fresh, always runs in the background, and still surfaces permission prompts in your terminal. The rest of this section describes named subagents.

Which tools a named subagent can use depends on the `tools` and `disallowedTools` fields in the [subagent definition](/docs/en/sub-agents):

* **Neither field set**: the subagent inherits every tool available to the parent.
* **`tools` only**: the subagent gets only the listed tools.
* **`disallowedTools` only**: the subagent gets every parent tool except the listed ones.
* **Both set**: `disallowedTools` takes precedence. A tool listed in both is removed.

Launching the subagent does not itself prompt for permission. The subagent's own tool calls are checked against your permission rules as it runs:

* **Foreground subagents** show the same permission prompts you would see in the main conversation, at the moment each tool call happens.
* **Background subagents** do not show prompts. They run with the permissions already granted in the session and auto-deny any tool call that would otherwise prompt. After a denial, the subagent keeps going without that tool.

To limit what a subagent can reach in the first place, narrow its `tools` field, leave Bash off the list, or set deny rules in your settings, as described in [Control subagent capabilities](/docs/en/sub-agents#control-subagent-capabilities). For more on choosing between foreground and background, see [Run subagents in foreground or background](/docs/en/sub-agents#run-subagents-in-foreground-or-background).

## Bash tool behavior

The Bash tool runs each command in a separate process with the following persistence behavior:

* When Claude runs `cd` in the main session, the new working directory carries over to later Bash commands as long as it stays inside the project directory or an [additional working directory](/docs/en/permissions#working-directories) you added with `--add-dir`, `/add-dir`, or `additionalDirectories` in settings. Subagent sessions never carry over working directory changes.
  * If `cd` lands outside those directories, Claude Code resets to the project directory and appends `Shell cwd was reset to <dir>` to the tool result.
  * To disable this carry-over so every Bash command starts in the project directory, set `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1`.
* Environment variables do not persist. An `export` in one command will not be available in the next.
* Aliases and shell functions defined in your shell startup file are available. At session start, Claude Code sources `~/.zshrc`, `~/.bashrc`, or `~/.profile` depending on your shell, captures the resulting aliases, functions, and shell options, and applies them to every Bash command.

Activate your virtualenv or conda environment before launching Claude Code. To make environment variables persist across Bash commands, set [`CLAUDE_ENV_FILE`](/docs/en/env-vars) to a shell script before launching Claude Code, or use a [SessionStart hook](/docs/en/hooks#persist-environment-variables) to populate it dynamically.

Two limits bound each command:

* **Timeout**: two minutes by default. Claude can request up to 10 minutes per command with the `timeout` parameter. Override the default and ceiling with [`BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS`](/docs/en/env-vars).
* **Output length**: 30,000 characters by default. When a command produces more than that, Claude Code saves the full output to a file in the session directory and gives Claude the file path plus a short preview from the start. Claude reads or searches that file when it needs the rest. Raise the limit with [`BASH_MAX_OUTPUT_LENGTH`](/docs/en/env-vars), up to a hard ceiling of 150,000 characters.

For long-running processes such as dev servers or watch builds, Claude can set `run_in_background: true` to start the command as a background task and continue working while it runs. List and stop background tasks with `/tasks`.

## Edit tool behavior

The Edit tool performs exact string replacement. It takes an `old_string` and a `new_string` and replaces the first with the second. It does not use regex or fuzzy matching.

Three checks must pass for an edit to apply:

* **Read-before-edit**: Claude must have read the file in the current conversation, and the file must not have changed on disk since that read. This check runs first, before any string matching.
* **Match**: `old_string` must appear in the file exactly as written. A single character of whitespace or indentation difference is enough to miss.
* **Uniqueness**: `old_string` must appear exactly once. When it appears more than once, Claude either supplies a longer string with enough surrounding context to pin down one occurrence, or sets `replace_all: true` to replace them all.

Viewing a file with Bash also satisfies the read-before-edit requirement when the command is `cat`, `head`, `tail`, or `sed -n 'X,Yp'` on a single file with no pipes, redirects, or other flags. Piped output and other Bash commands do not count, and Claude must use Read before editing in those cases.

This affects edit eligibility only, not permissions. [Read and Edit deny rules](/docs/en/permissions#tool-specific-permission-rules) also apply to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, and `sed`, but not to arbitrary subprocesses that read or write files indirectly, like a Python or Node script that opens files itself. For OS-level enforcement that covers every process, [enable the sandbox](/docs/en/sandboxing).

## Glob tool behavior

The Glob tool finds files by name pattern. It supports standard glob syntax including `**` for recursive directory matching:

* `**/*.js` matches all `.js` files at any depth
* `src/**/*.ts` matches all `.ts` files under `src/`
* `*.{json,yaml}` matches `.json` and `.yaml` files in the current directory

Results are sorted by modification time and capped at 100 files. If the cap is hit, Claude sees a truncation flag in the result and can narrow the pattern.

Glob does not respect `.gitignore` by default, so it finds gitignored files alongside tracked ones. This differs from [Grep](#grep-tool-behavior), which skips gitignored files. To make Glob respect `.gitignore`, set `CLAUDE_CODE_GLOB_NO_IGNORE=false` before launching Claude Code.

## Grep tool behavior

The Grep tool searches file contents for patterns. Where [Glob](#glob-tool-behavior) finds files by name, Grep finds lines inside them.

Grep is built on [ripgrep](https://github.com/BurntSushi/ripgrep) and uses ripgrep's regex syntax, not POSIX grep. Patterns that include regex metacharacters need escaping. For example, finding `interface{}` in Go code takes the pattern `interface\{\}`.

Three output modes control what comes back:

* `files_with_matches`: file paths only, no line content. This is the default.
* `content`: matching lines with file and line number.
* `count`: match count per file.

Claude can scope results by file with the `glob` parameter, such as `**/*.tsx`, or by language with the `type` parameter, such as `py` or `rust`. By default, patterns match within a single line. Claude can set `multiline: true` to match across line boundaries.

Grep respects `.gitignore`, so gitignored files are skipped. To search a gitignored file, Claude passes its path directly.

## LSP tool behavior

The LSP tool gives Claude code intelligence from a running language server. After each file edit, it automatically reports type errors and warnings so Claude can fix issues without a separate build step. Claude can also call it directly to navigate code:

* Jump to a symbol's definition
* Find all references to a symbol
* Get type information at a position
* List symbols in a file or workspace
* Find implementations of an interface
* Trace call hierarchies

The tool is inactive until you install a [code intelligence plugin](/docs/en/discover-plugins#code-intelligence) for your language. The plugin bundles the language server configuration, and you install the server binary separately.

## Monitor tool

<Note>
  The Monitor tool requires Claude Code v2.1.98 or later.
</Note>

The Monitor tool lets Claude watch something in the background and react when it changes, without pausing the conversation. Ask Claude to:

* Tail a log file and flag errors as they appear
* Poll a PR or CI job and report when its status changes
* Watch a directory for file changes
* Track output from any long-running script you point it at

Claude writes a small script for the watch, runs it in the background, and receives each output line as it arrives. You keep working in the same session and Claude interjects when an event lands. Stop a monitor by asking Claude to cancel it or by ending the session.

Monitor uses the same [permission rules as Bash](/docs/en/permissions#tool-specific-permission-rules), so `allow` and `deny` patterns you have set for Bash apply here too. It is not available on Amazon Bedrock, Google Vertex AI, or Microsoft Foundry. It is also not available when `DISABLE_TELEMETRY` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set.

Plugins can declare monitors that start automatically when the plugin is active, instead of asking Claude to start them. See [plugin monitors](/docs/en/plugins-reference#monitors).

## NotebookEdit tool behavior

NotebookEdit modifies a Jupyter notebook one cell at a time, targeting cells by their `cell_id`. It does not perform string replacement across the notebook the way [Edit](#edit-tool-behavior) does on plain files.

Three edit modes control what happens to the target cell:

* `replace`: overwrite the cell's source. This is the default.
* `insert`: add a new cell after the target. With no `cell_id`, the new cell goes at the start of the notebook. Requires `cell_type` set to `code` or `markdown`.
* `delete`: remove the target cell.

Permission rules use the `Edit(...)` path format. A rule like `Edit(notebooks/**)` covers NotebookEdit calls on files in that directory.

## PowerShell tool

The PowerShell tool lets Claude run PowerShell commands natively. On Windows, this means commands run in PowerShell instead of routing through Git Bash. On Windows without Git Bash, the tool is enabled automatically. On Windows with Git Bash installed, the tool is rolling out progressively. On Linux, macOS, and WSL, the tool is opt-in.

### Enable the PowerShell tool

Set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` in your environment or in `settings.json`:

```json theme={null}
{
  "env": {
    "CLAUDE_CODE_USE_POWERSHELL_TOOL": "1"
  }
}
```

On Windows, set the variable to `0` to opt out of the rollout. On Linux, macOS, and WSL, the tool requires PowerShell 7 or later: install `pwsh` and ensure it is on your `PATH`.

On Windows, Claude Code auto-detects `pwsh.exe` for PowerShell 7+ with a fallback to `powershell.exe` for PowerShell 5.1. When the tool is enabled, Claude treats PowerShell as the primary shell. The Bash tool remains available for POSIX scripts when Git Bash is installed.

Claude Code spawns PowerShell with `-ExecutionPolicy Bypass` at process scope only, so `.ps1` scripts and module imports work on default Windows installs without changing the machine's policy. Process-scope bypass does not override Group Policy `MachinePolicy` or `UserPolicy`, so enterprise lockdowns still apply. To respect the machine's effective execution policy instead, set `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY=1`.

### Shell selection in settings, hooks, and skills

Three additional settings control where PowerShell is used:

* `"defaultShell": "powershell"` in [`settings.json`](/docs/en/settings#available-settings): routes interactive `!` commands through PowerShell. Requires the PowerShell tool to be enabled.
* `"shell": "powershell"` on individual [command hooks](/docs/en/hooks#command-hook-fields): runs that hook in PowerShell. Hooks spawn PowerShell directly, so this works regardless of `CLAUDE_CODE_USE_POWERSHELL_TOOL`.
* `shell: powershell` in [skill frontmatter](/docs/en/skills#frontmatter-reference): runs `` !`command` `` blocks in PowerShell. Requires the PowerShell tool to be enabled.

The same main-session working-directory reset behavior described under the Bash tool section applies to PowerShell commands, including the `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR` environment variable.

### Preview limitations

The PowerShell tool has the following known limitations during the preview:

* PowerShell profiles are not loaded
* On Windows, sandboxing is not supported

## Read tool behavior

The Read tool takes a file path and returns the contents with line numbers. Claude is instructed to always pass absolute paths.

By default, Read returns the file from the start. When a whole-file read exceeds the token limit, Read returns the first page with a `PARTIAL view` notice that tells Claude how much of the file it received and how to read more with `offset` and `limit`. A read that passes an explicit `offset` or `limit` and still exceeds the token limit returns an error.

Read handles several file types beyond plain text:

* **Images**: PNG, JPG, and other image formats are returned as visual content that Claude can see, not as raw bytes. Claude Code resizes and recompresses large images to fit the model's image size limits before sending them, so Claude may see a downscaled version of a large screenshot. If Claude misses fine pixel-level detail in a large image, ask it to crop the region of interest first, for example with ImageMagick via Bash.
* **PDFs**: Claude reads short `.pdf` files whole. For PDFs longer than 10 pages, it reads in ranges with a `pages` parameter, such as `"1-5"`, up to 20 pages at a time.
* **Jupyter notebooks**: `.ipynb` files return all cells with their outputs, including code, markdown, and visualizations.

Read only reads files, not directories. Claude uses `ls` via the Bash tool to list directory contents.

## WebFetch tool behavior

WebFetch takes a URL and a prompt describing what to extract. It fetches the page, converts the response to Markdown when the server returns HTML, and runs the prompt against the content using a small, fast model. For most fetches, Claude receives that model's answer, not the raw page. The conversion step is not configurable.

This makes WebFetch lossy by design. The extraction prompt determines what reaches Claude, so a result that says a page does not mention something may only mean the prompt did not ask about it. Ask Claude to fetch again with a more specific prompt, or use `curl` via Bash for the unprocessed page.

A few behaviors shape the response Claude receives:

* HTTP URLs are automatically upgraded to HTTPS.
* Large pages are truncated to a fixed character limit before processing.
* Responses are cached for 15 minutes, so repeated fetches of the same URL return quickly.
* When a URL redirects to a different host, WebFetch returns a text result that names the original URL and the redirect target instead of following it. Claude then fetches the new URL with a second WebFetch call.

In the default and `acceptEdits` permission modes, WebFetch prompts the first time it reaches a new domain. To allow a domain in advance without a prompt, add a permission rule like `WebFetch(domain:example.com)`. The `auto` and `bypassPermissions` [permission modes](/docs/en/permissions#permission-modes) skip the prompt entirely.

WebFetch sets a `User-Agent` header beginning with `Claude-User`, and an `Accept` header that prefers Markdown over HTML so servers that support content negotiation can return Markdown directly. [Sandbox](/docs/en/sandboxing) network rules are configured separately, so a domain you want a sandboxed process to reach still needs an explicit sandbox permission rule.

## WebSearch tool behavior

WebSearch runs a query against Anthropic's [web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) backend and returns result titles and URLs. It does not fetch the result pages. To read a page Claude finds in search results, it follows up with [WebFetch](#webfetch-tool-behavior).

The tool may issue up to eight backend searches per call, refining the search internally before returning results. Claude can scope results with `allowed_domains` to include only certain hosts, or `blocked_domains` to exclude them. The two lists cannot be combined in a single call.

The search backend is not configurable. To search with a different provider, add an [MCP server](/docs/en/mcp) that exposes a search tool.

WebSearch permission rules take no specifier. A bare `WebSearch` entry in `allow` or `deny` is the only form.

<Note>
  WebSearch is available on the Claude API and Microsoft Foundry. On Google Cloud Vertex AI it works with Claude 4 models, including Opus, Sonnet, and Haiku. Amazon Bedrock does not expose the server-side web search tool.
</Note>

## Write tool behavior

The Write tool creates a new file or overwrites an existing one with the full content provided. It does not append or merge.

If the target path already exists, Claude must have read that file at least once in the current conversation before overwriting it. A Write to an unread existing file fails with an error. This constraint does not apply to new files.

Viewing the file with Bash also satisfies this requirement under the same rules described in [Edit tool behavior](#edit-tool-behavior).

For partial changes to an existing file, Claude uses Edit instead of Write.

## Check which tools are available

Your exact tool set depends on your provider, platform, and settings. To check what's loaded in a running session, ask Claude directly:

```text theme={null}
What tools do you have access to?
```

Claude gives a conversational summary. For exact MCP tool names, run `/mcp`.

## See also

* [MCP servers](/docs/en/mcp): add custom tools by connecting external servers
* [Permissions](/docs/en/permissions): permission system, rule syntax, and tool-specific patterns
* [Subagents](/docs/en/sub-agents): configure tool access for subagents
* [Hooks](/docs/en/hooks-guide): run custom commands before or after tool execution


---

## Customize your status line

`https://code.claude.com/docs/en/statusline`

Configure a custom status bar to monitor context window usage, costs, and git status in Claude Code

The status line is a customizable bar at the bottom of Claude Code that runs any shell script you configure. It receives JSON session data on stdin and displays whatever your script prints, giving you a persistent, at-a-glance view of context usage, costs, git status, or anything else you want to track.

Status lines are useful when you:

* Want to monitor context window usage as you work
* Need to track session costs
* Work across multiple sessions and need to distinguish them
* Want git branch and status always visible

Here's an example of a [multi-line status line](#display-multiple-lines) that displays git info on the first line and a color-coded context bar on the second.

<Frame>
  <img alt="A multi-line status line showing model name, directory, git branch on the first line, and a context usage progress bar with cost and duration on the second line" />
</Frame>

This page walks through [setting up a basic status line](#set-up-a-status-line), explains [how the data flows](#how-status-lines-work) from Claude Code to your script, lists [all the fields you can display](#available-data), and provides [ready-to-use examples](#examples) for common patterns like git status, cost tracking, and progress bars.

## Set up a status line

Use the [`/statusline` command](#use-the-%2Fstatusline-command) to have Claude Code generate a script for you, or [manually create a script](#manually-configure-a-status-line) and add it to your settings.

### Use the /statusline command

The `/statusline` command accepts natural language instructions describing what you want displayed. Claude Code generates a script file in `~/.claude/` and updates your settings automatically:

```text theme={null}
/statusline show model name and context percentage with a progress bar
```

### Manually configure a status line

Add a `statusLine` field to your user settings (`~/.claude/settings.json`, where `~` is your home directory) or [project settings](/docs/en/settings#settings-files). Set `type` to `"command"` and point `command` to a script path or an inline shell command. For a full walkthrough of creating a script, see [Build a status line step by step](#build-a-status-line-step-by-step).

```json theme={null}
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 2
  }
}
```

The `command` field runs in a shell, so you can also use inline commands instead of a script file. This example uses `jq` to parse the JSON input and display the model name and context percentage:

```json theme={null}
{
  "statusLine": {
    "type": "command",
    "command": "jq -r '\"[\\(.model.display_name)] \\(.context_window.used_percentage // 0)% context\"'"
  }
}
```

The optional `padding` field adds extra horizontal spacing (in characters) to the status line content. Defaults to `0`. This padding is in addition to the interface's built-in spacing, so it controls relative indentation rather than absolute distance from the terminal edge.

The optional `refreshInterval` field re-runs your command every N seconds in addition to the [event-driven updates](#how-status-lines-work). The minimum is `1`. Set this when your status line shows time-based data such as a clock, or when background subagents change git state while the main session is idle. Leave it unset to run only on events.

The optional `hideVimModeIndicator` field suppresses the built-in `-- INSERT --` text below the prompt. Set this to `true` when your script renders [`vim.mode`](#available-data) itself, so the mode is not shown twice.

### Disable the status line

Run `/statusline` and ask it to remove or clear your status line (e.g., `/statusline delete`, `/statusline clear`, `/statusline remove it`). You can also manually delete the `statusLine` field from your settings.json.

## Build a status line step by step

This walkthrough shows what's happening under the hood by manually creating a status line that displays the current model, working directory, and context window usage percentage.

<Note>Running [`/statusline`](#use-the-%2Fstatusline-command) with a description of what you want configures all of this for you automatically.</Note>

These examples use Bash scripts, which work on macOS and Linux. On Windows, see [Windows configuration](#windows-configuration) for PowerShell and Git Bash examples.

<Frame>
  <img alt="A status line showing model name, directory, and context percentage" />
</Frame>

<Steps>
  <Step title="Create a script that reads JSON and prints output">
    Claude Code sends JSON data to your script via stdin. This script uses [`jq`](https://jqlang.github.io/jq/), a command-line JSON parser you may need to install, to extract the model name, directory, and context percentage, then prints a formatted line.

    Save this to `~/.claude/statusline.sh` (where `~` is your home directory, such as `/Users/username` on macOS or `/home/username` on Linux):

    ```bash theme={null}
    #!/bin/bash
    # Read JSON data that Claude Code sends to stdin
    input=$(cat)

    # Extract fields using jq
    MODEL=$(echo "$input" | jq -r '.model.display_name')
    DIR=$(echo "$input" | jq -r '.workspace.current_dir')
    # The "// 0" provides a fallback if the field is null
    PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)

    # Output the status line - ${DIR##*/} extracts just the folder name
    echo "[$MODEL] 📁 ${DIR##*/} | ${PCT}% context"
    ```
  </Step>

  <Step title="Make it executable">
    Mark the script as executable so your shell can run it:

    ```bash theme={null}
    chmod +x ~/.claude/statusline.sh
    ```
  </Step>

  <Step title="Add to settings">
    Tell Claude Code to run your script as the status line. Add this configuration to `~/.claude/settings.json`, which sets `type` to `"command"` (meaning "run this shell command") and points `command` to your script:

    ```json theme={null}
    {
      "statusLine": {
        "type": "command",
        "command": "~/.claude/statusline.sh"
      }
    }
    ```

    Your status line appears at the bottom of the interface. Settings reload automatically, but changes won't appear until your next interaction with Claude Code.
  </Step>
</Steps>

## How status lines work

Claude Code runs your script and pipes [JSON session data](#available-data) to it via stdin. Your script reads the JSON, extracts what it needs, and prints text to stdout. Claude Code displays whatever your script prints.

**When it updates**

Your script runs after each new assistant message, after `/compact` finishes, when the permission mode changes, or when vim mode toggles. Updates are debounced at 300ms, meaning rapid changes batch together and your script runs once things settle. If a new update triggers while your script is still running, the in-flight execution is cancelled. If you edit your script, the changes won't appear until your next interaction with Claude Code triggers an update.

These triggers can go quiet when the main session is idle, for example while a coordinator waits on background subagents. To keep time-based or externally-sourced segments current during idle periods, set [`refreshInterval`](#manually-configure-a-status-line) to also re-run the command on a fixed timer.

**What your script can output**

* **Multiple lines**: each `echo` or `print` statement displays as a separate row. See the [multi-line example](#display-multiple-lines).
* **Colors**: use [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors) like `\033[32m` for green (terminal must support them). See the [git status example](#git-status-with-colors).
* **Links**: use [OSC 8 escape sequences](https://en.wikipedia.org/wiki/ANSI_escape_code#OSC) to make text clickable (Cmd+click on macOS, Ctrl+click on Windows/Linux). Requires a terminal that supports hyperlinks like iTerm2, Kitty, or WezTerm. See the [clickable links example](#clickable-links).

**Sizing output to the terminal**

Claude Code captures your script's output instead of connecting it directly to the terminal, so `tput cols` and language-level width detection cannot read the terminal size from inside the script. Read the `COLUMNS` and `LINES` environment variables instead. Claude Code sets these to the current terminal dimensions before running your script. Requires Claude Code v2.1.153 or later.

<Note>The status line runs locally and does not consume API tokens. It temporarily hides during certain UI interactions, including autocomplete suggestions, the help menu, and permission prompts.</Note>

## Available data

Claude Code sends the following JSON fields to your script via stdin:

| Field                                                                            | Description                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `model.id`, `model.display_name`                                                 | Current model identifier and display name                                                                                                                                                                                                                                      |
| `cwd`, `workspace.current_dir`                                                   | Current working directory. Both fields contain the same value; `workspace.current_dir` is preferred for consistency with `workspace.project_dir`.                                                                                                                              |
| `workspace.project_dir`                                                          | Directory where Claude Code was launched, which may differ from `cwd` if the working directory changes during a session                                                                                                                                                        |
| `workspace.added_dirs`                                                           | Additional directories added via `/add-dir` or `--add-dir`. Empty array if none have been added                                                                                                                                                                                |
| `workspace.git_worktree`                                                         | Git worktree name when the current directory is inside a linked worktree created with `git worktree add`. Absent in the main working tree. Populated for any git worktree, unlike `worktree.*` which applies only to `--worktree` sessions                                     |
| `workspace.repo.host`, `workspace.repo.owner`, `workspace.repo.name`             | Repository identity parsed from the `origin` remote, for example `"github.com"`, `"anthropics"`, `"claude-code"`. Absent outside a git repository or when no `origin` remote is configured                                                                                     |
| `cost.total_cost_usd`                                                            | Estimated session cost in USD, computed client-side. May differ from your actual bill                                                                                                                                                                                          |
| `cost.total_duration_ms`                                                         | Total wall-clock time since the session started, in milliseconds                                                                                                                                                                                                               |
| `cost.total_api_duration_ms`                                                     | Total time spent waiting for API responses in milliseconds                                                                                                                                                                                                                     |
| `cost.total_lines_added`, `cost.total_lines_removed`                             | Lines of code changed                                                                                                                                                                                                                                                          |
| `context_window.total_input_tokens`, `context_window.total_output_tokens`        | Token counts currently in the context window, from the most recent API response. Input includes cache reads and writes. Before v2.1.132 these were cumulative session totals                                                                                                   |
| `context_window.context_window_size`                                             | Maximum context window size in tokens. 200000 by default, or 1000000 for models with extended context.                                                                                                                                                                         |
| `context_window.used_percentage`                                                 | Pre-calculated percentage of context window used                                                                                                                                                                                                                               |
| `context_window.remaining_percentage`                                            | Pre-calculated percentage of context window remaining                                                                                                                                                                                                                          |
| `context_window.current_usage`                                                   | Token counts from the last API call, described in [context window fields](#context-window-fields)                                                                                                                                                                              |
| `exceeds_200k_tokens`                                                            | Whether the total token count (input, cache, and output tokens combined) from the most recent API response exceeds 200k. This is a fixed threshold regardless of actual context window size.                                                                                   |
| `effort.level`                                                                   | Current reasoning effort (`low`, `medium`, `high`, `xhigh`, or `max`). Reflects the live session value, including mid-session `/effort` changes. Ultracode is not a distinct level and reports as `xhigh`. Absent when the current model does not support the effort parameter |
| `thinking.enabled`                                                               | Whether extended thinking is enabled for the session                                                                                                                                                                                                                           |
| `rate_limits.five_hour.used_percentage`, `rate_limits.seven_day.used_percentage` | Percentage of the 5-hour or 7-day rate limit consumed, from 0 to 100                                                                                                                                                                                                           |
| `rate_limits.five_hour.resets_at`, `rate_limits.seven_day.resets_at`             | Unix epoch seconds when the 5-hour or 7-day rate limit window resets                                                                                                                                                                                                           |
| `session_id`                                                                     | Unique session identifier                                                                                                                                                                                                                                                      |
| `session_name`                                                                   | Custom session name set with the `--name` flag or `/rename`. Absent if no custom name has been set                                                                                                                                                                             |
| `transcript_path`                                                                | Path to conversation transcript file                                                                                                                                                                                                                                           |
| `version`                                                                        | Claude Code version                                                                                                                                                                                                                                                            |
| `output_style.name`                                                              | Name of the current output style                                                                                                                                                                                                                                               |
| `vim.mode`                                                                       | Current vim mode (`NORMAL`, `INSERT`, `VISUAL`, or `VISUAL LINE`) when [vim mode](/docs/en/interactive-mode#vim-editor-mode) is enabled                                                                                                                                             |
| `agent.name`                                                                     | Agent name when running with the `--agent` flag or agent settings configured                                                                                                                                                                                                   |
| `pr.number`, `pr.url`                                                            | Open pull request for the current branch. Mirrors the PR badge in the bottom status bar. Absent until a PR is found, when not in a git repository, or once the PR merges or closes                                                                                             |
| `pr.review_state`                                                                | Review status of the open PR: `approved`, `pending`, `changes_requested`, or `draft`. May be independently absent even when `pr` is present                                                                                                                                    |
| `worktree.name`                                                                  | Name of the active worktree. Present only during `--worktree` sessions                                                                                                                                                                                                         |
| `worktree.path`                                                                  | Absolute path to the worktree directory                                                                                                                                                                                                                                        |
| `worktree.branch`                                                                | Git branch name for the worktree (for example, `"worktree-my-feature"`). Absent for hook-based worktrees                                                                                                                                                                       |
| `worktree.original_cwd`                                                          | The directory Claude was in before entering the worktree                                                                                                                                                                                                                       |
| `worktree.original_branch`                                                       | Git branch checked out before entering the worktree. Absent for hook-based worktrees                                                                                                                                                                                           |

<Accordion title="Full JSON schema">
  Your status line command receives this JSON structure via stdin:

  ```json theme={null}
  {
    "cwd": "/current/working/directory",
    "session_id": "abc123...",
    "session_name": "my-session",
    "transcript_path": "/path/to/transcript.jsonl",
    "model": {
      "id": "claude-opus-4-8",
      "display_name": "Opus"
    },
    "workspace": {
      "current_dir": "/current/working/directory",
      "project_dir": "/original/project/directory",
      "added_dirs": [],
      "git_worktree": "feature-xyz",
      "repo": {
        "host": "github.com",
        "owner": "anthropics",
        "name": "claude-code"
      }
    },
    "version": "2.1.90",
    "output_style": {
      "name": "default"
    },
    "cost": {
      "total_cost_usd": 0.01234,
      "total_duration_ms": 45000,
      "total_api_duration_ms": 2300,
      "total_lines_added": 156,
      "total_lines_removed": 23
    },
    "context_window": {
      "total_input_tokens": 15500,
      "total_output_tokens": 1200,
      "context_window_size": 200000,
      "used_percentage": 8,
      "remaining_percentage": 92,
      "current_usage": {
        "input_tokens": 8500,
        "output_tokens": 1200,
        "cache_creation_input_tokens": 5000,
        "cache_read_input_tokens": 2000
      }
    },
    "exceeds_200k_tokens": false,
    "effort": {
      "level": "high"
    },
    "thinking": {
      "enabled": true
    },
    "rate_limits": {
      "five_hour": {
        "used_percentage": 23.5,
        "resets_at": 1738425600
      },
      "seven_day": {
        "used_percentage": 41.2,
        "resets_at": 1738857600
      }
    },
    "vim": {
      "mode": "NORMAL"
    },
    "agent": {
      "name": "security-reviewer"
    },
    "pr": {
      "number": 1234,
      "url": "https://github.com/anthropics/claude-code/pull/1234",
      "review_state": "pending"
    },
    "worktree": {
      "name": "my-feature",
      "path": "/path/to/.claude/worktrees/my-feature",
      "branch": "worktree-my-feature",
      "original_cwd": "/path/to/project",
      "original_branch": "main"
    }
  }
  ```

  **Fields that may be absent** (not present in JSON):

  * `session_name`: appears only when a custom name has been set with `--name` or `/rename`
  * `workspace.git_worktree`: appears only when the current directory is inside a linked git worktree
  * `workspace.repo`: appears only inside a git repository with an `origin` remote configured
  * `effort`: appears only when the current model supports the reasoning effort parameter
  * `vim`: appears only when vim mode is enabled
  * `agent`: appears only when running with the `--agent` flag or agent settings configured
  * `pr`: appears only while an open PR is found for the current branch, and is removed once the PR merges or closes. `pr.review_state` may be independently absent
  * `worktree`: appears only during `--worktree` sessions. When present, `branch` and `original_branch` may also be absent for hook-based worktrees
  * `rate_limits`: appears only for Claude.ai subscribers (Pro/Max) after the first API response in the session. Each window (`five_hour`, `seven_day`) may be independently absent. Use `jq -r '.rate_limits.five_hour.used_percentage // empty'` to handle absence gracefully.

  **Fields that may be `null`**:

  * `context_window.current_usage`: `null` before the first API call in a session, and again after `/compact` until the next API call repopulates it
  * `context_window.used_percentage`, `context_window.remaining_percentage`: may be `null` early in the session

  Handle missing fields with conditional access and null values with fallback defaults in your scripts.
</Accordion>

### Context window fields

The `context_window` object describes the live context window from the most recent API response. As of v2.1.132, `total_input_tokens` and `total_output_tokens` reflect current context usage, not cumulative session totals.

* **Combined totals** (`total_input_tokens`, `total_output_tokens`): tokens currently in the context window. `total_input_tokens` is the sum of `input_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`; `total_output_tokens` is the output tokens from the most recent response. Both are `0` before the first API response.
* **Per-component usage** (`current_usage`): the same token counts broken out by category. Use this when you need cache hits separate from fresh input.

The `current_usage` object contains:

* `input_tokens`: input tokens in current context
* `output_tokens`: output tokens generated
* `cache_creation_input_tokens`: tokens written to cache
* `cache_read_input_tokens`: tokens read from cache

For what the cache fields mean and how they're billed, see [check cache performance](/docs/en/prompt-caching#check-cache-performance).

The `used_percentage` field is calculated from input tokens only: `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`. It does not include `output_tokens`.

If you calculate context percentage manually from `current_usage`, use the same input-only formula to match `used_percentage`.

The `current_usage` object is `null` before the first API call in a session, and again immediately after `/compact` until the next API call repopulates it.

## Examples

These examples show common status line patterns. To use any example:

1. Save the script to a file like `~/.claude/statusline.sh` (or `.py`/`.js`)
2. Make it executable: `chmod +x ~/.claude/statusline.sh`
3. Add the path to your [settings](#manually-configure-a-status-line)

The Bash examples use [`jq`](https://jqlang.github.io/jq/) to parse JSON. Python and Node.js have built-in JSON parsing.

### Context window usage

Display the current model and context window usage with a visual progress bar. Each script reads JSON from stdin, extracts the `used_percentage` field, and builds a 10-character bar where filled blocks (▓) represent usage:

<Frame>
  <img alt="A status line showing model name and a progress bar with percentage" />
</Frame>

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  # Read all of stdin into a variable
  input=$(cat)

  # Extract fields with jq, "// 0" provides fallback for null
  MODEL=$(echo "$input" | jq -r '.model.display_name')
  PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)

  # Build progress bar: printf -v creates a run of spaces, then
  # ${var// /▓} replaces each space with a block character
  BAR_WIDTH=10
  FILLED=$((PCT * BAR_WIDTH / 100))
  EMPTY=$((BAR_WIDTH - FILLED))
  BAR=""
  [ "$FILLED" -gt 0 ] && printf -v FILL "%${FILLED}s" && BAR="${FILL// /▓}"
  [ "$EMPTY" -gt 0 ] && printf -v PAD "%${EMPTY}s" && BAR="${BAR}${PAD// /░}"

  echo "[$MODEL] $BAR $PCT%"
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys

  # json.load reads and parses stdin in one step
  data = json.load(sys.stdin)
  model = data['model']['display_name']
  # "or 0" handles null values
  pct = int(data.get('context_window', {}).get('used_percentage', 0) or 0)

  # String multiplication builds the bar
  filled = pct * 10 // 100
  bar = '▓' * filled + '░' * (10 - filled)

  print(f"[{model}] {bar} {pct}%")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  // Node.js reads stdin asynchronously with events
  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;
      // Optional chaining (?.) safely handles null fields
      const pct = Math.floor(data.context_window?.used_percentage || 0);

      // String.repeat() builds the bar
      const filled = Math.floor(pct * 10 / 100);
      const bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);

      console.log(`[${model}] ${bar} ${pct}%`);
  });
  ```
</CodeGroup>

### Git status with colors

Show git branch with color-coded indicators for staged and modified files. This script uses [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors) for terminal colors: `\033[32m` is green, `\033[33m` is yellow, and `\033[0m` resets to default.

<Frame>
  <img alt="A status line showing model, directory, git branch, and colored indicators for staged and modified files" />
</Frame>

Each script checks if the current directory is a git repository, counts staged and modified files, and displays color-coded indicators:

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  input=$(cat)

  MODEL=$(echo "$input" | jq -r '.model.display_name')
  DIR=$(echo "$input" | jq -r '.workspace.current_dir')

  GREEN='\033[32m'
  YELLOW='\033[33m'
  RESET='\033[0m'

  if git rev-parse --git-dir > /dev/null 2>&1; then
      BRANCH=$(git branch --show-current 2>/dev/null)
      STAGED=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
      MODIFIED=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')

      GIT_STATUS=""
      [ "$STAGED" -gt 0 ] && GIT_STATUS="${GREEN}+${STAGED}${RESET}"
      [ "$MODIFIED" -gt 0 ] && GIT_STATUS="${GIT_STATUS}${YELLOW}~${MODIFIED}${RESET}"

      echo -e "[$MODEL] 📁 ${DIR##*/} | 🌿 $BRANCH $GIT_STATUS"
  else
      echo "[$MODEL] 📁 ${DIR##*/}"
  fi
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys, subprocess, os

  data = json.load(sys.stdin)
  model = data['model']['display_name']
  directory = os.path.basename(data['workspace']['current_dir'])

  GREEN, YELLOW, RESET = '\033[32m', '\033[33m', '\033[0m'

  try:
      subprocess.check_output(['git', 'rev-parse', '--git-dir'], stderr=subprocess.DEVNULL)
      branch = subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip()
      staged_output = subprocess.check_output(['git', 'diff', '--cached', '--numstat'], text=True).strip()
      modified_output = subprocess.check_output(['git', 'diff', '--numstat'], text=True).strip()
      staged = len(staged_output.split('\n')) if staged_output else 0
      modified = len(modified_output.split('\n')) if modified_output else 0

      git_status = f"{GREEN}+{staged}{RESET}" if staged else ""
      git_status += f"{YELLOW}~{modified}{RESET}" if modified else ""

      print(f"[{model}] 📁 {directory} | 🌿 {branch} {git_status}")
  except:
      print(f"[{model}] 📁 {directory}")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  const { execSync } = require('child_process');
  const path = require('path');

  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;
      const dir = path.basename(data.workspace.current_dir);

      const GREEN = '\x1b[32m', YELLOW = '\x1b[33m', RESET = '\x1b[0m';

      try {
          execSync('git rev-parse --git-dir', { stdio: 'ignore' });
          const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
          const staged = execSync('git diff --cached --numstat', { encoding: 'utf8' }).trim().split('\n').filter(Boolean).length;
          const modified = execSync('git diff --numstat', { encoding: 'utf8' }).trim().split('\n').filter(Boolean).length;

          let gitStatus = staged ? `${GREEN}+${staged}${RESET}` : '';
          gitStatus += modified ? `${YELLOW}~${modified}${RESET}` : '';

          console.log(`[${model}] 📁 ${dir} | 🌿 ${branch} ${gitStatus}`);
      } catch {
          console.log(`[${model}] 📁 ${dir}`);
      }
  });
  ```
</CodeGroup>

### Cost and duration tracking

Track your session's API costs and elapsed time. The `cost.total_cost_usd` field accumulates the estimated cost of all API calls in the current session. The `cost.total_duration_ms` field measures total elapsed time since the session started, while `cost.total_api_duration_ms` tracks only the time spent waiting for API responses.

Each script formats cost as currency and converts milliseconds to minutes and seconds:

<Frame>
  <img alt="A status line showing model name, session cost, and duration" />
</Frame>

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  input=$(cat)

  MODEL=$(echo "$input" | jq -r '.model.display_name')
  COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
  DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')

  COST_FMT=$(printf '$%.2f' "$COST")
  DURATION_SEC=$((DURATION_MS / 1000))
  MINS=$((DURATION_SEC / 60))
  SECS=$((DURATION_SEC % 60))

  echo "[$MODEL] 💰 $COST_FMT | ⏱️ ${MINS}m ${SECS}s"
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys

  data = json.load(sys.stdin)
  model = data['model']['display_name']
  cost = data.get('cost', {}).get('total_cost_usd', 0) or 0
  duration_ms = data.get('cost', {}).get('total_duration_ms', 0) or 0

  duration_sec = duration_ms // 1000
  mins, secs = duration_sec // 60, duration_sec % 60

  print(f"[{model}] 💰 ${cost:.2f} | ⏱️ {mins}m {secs}s")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;
      const cost = data.cost?.total_cost_usd || 0;
      const durationMs = data.cost?.total_duration_ms || 0;

      const durationSec = Math.floor(durationMs / 1000);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;

      console.log(`[${model}] 💰 $${cost.toFixed(2)} | ⏱️ ${mins}m ${secs}s`);
  });
  ```
</CodeGroup>

### Display multiple lines

Your script can output multiple lines to create a richer display. Each `echo` statement produces a separate row in the status area.

<Frame>
  <img alt="A multi-line status line showing model name, directory, git branch on the first line, and a context usage progress bar with cost and duration on the second line" />
</Frame>

This example combines several techniques: threshold-based colors (green under 70%, yellow 70-89%, red 90%+), a progress bar, and git branch info. Each `print` or `echo` statement creates a separate row:

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  input=$(cat)

  MODEL=$(echo "$input" | jq -r '.model.display_name')
  DIR=$(echo "$input" | jq -r '.workspace.current_dir')
  COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
  PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
  DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')

  CYAN='\033[36m'; GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; RESET='\033[0m'

  # Pick bar color based on context usage
  if [ "$PCT" -ge 90 ]; then BAR_COLOR="$RED"
  elif [ "$PCT" -ge 70 ]; then BAR_COLOR="$YELLOW"
  else BAR_COLOR="$GREEN"; fi

  FILLED=$((PCT / 10)); EMPTY=$((10 - FILLED))
  printf -v FILL "%${FILLED}s"; printf -v PAD "%${EMPTY}s"
  BAR="${FILL// /█}${PAD// /░}"

  MINS=$((DURATION_MS / 60000)); SECS=$(((DURATION_MS % 60000) / 1000))

  BRANCH=""
  git rev-parse --git-dir > /dev/null 2>&1 && BRANCH=" | 🌿 $(git branch --show-current 2>/dev/null)"

  echo -e "${CYAN}[$MODEL]${RESET} 📁 ${DIR##*/}$BRANCH"
  COST_FMT=$(printf '$%.2f' "$COST")
  echo -e "${BAR_COLOR}${BAR}${RESET} ${PCT}% | ${YELLOW}${COST_FMT}${RESET} | ⏱️ ${MINS}m ${SECS}s"
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys, subprocess, os

  data = json.load(sys.stdin)
  model = data['model']['display_name']
  directory = os.path.basename(data['workspace']['current_dir'])
  cost = data.get('cost', {}).get('total_cost_usd', 0) or 0
  pct = int(data.get('context_window', {}).get('used_percentage', 0) or 0)
  duration_ms = data.get('cost', {}).get('total_duration_ms', 0) or 0

  CYAN, GREEN, YELLOW, RED, RESET = '\033[36m', '\033[32m', '\033[33m', '\033[31m', '\033[0m'

  bar_color = RED if pct >= 90 else YELLOW if pct >= 70 else GREEN
  filled = pct // 10
  bar = '█' * filled + '░' * (10 - filled)

  mins, secs = duration_ms // 60000, (duration_ms % 60000) // 1000

  try:
      branch = subprocess.check_output(['git', 'branch', '--show-current'], text=True, stderr=subprocess.DEVNULL).strip()
      branch = f" | 🌿 {branch}" if branch else ""
  except:
      branch = ""

  print(f"{CYAN}[{model}]{RESET} 📁 {directory}{branch}")
  print(f"{bar_color}{bar}{RESET} {pct}% | {YELLOW}${cost:.2f}{RESET} | ⏱️ {mins}m {secs}s")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  const { execSync } = require('child_process');
  const path = require('path');

  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;
      const dir = path.basename(data.workspace.current_dir);
      const cost = data.cost?.total_cost_usd || 0;
      const pct = Math.floor(data.context_window?.used_percentage || 0);
      const durationMs = data.cost?.total_duration_ms || 0;

      const CYAN = '\x1b[36m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', RED = '\x1b[31m', RESET = '\x1b[0m';

      const barColor = pct >= 90 ? RED : pct >= 70 ? YELLOW : GREEN;
      const filled = Math.floor(pct / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);

      let branch = '';
      try {
          branch = execSync('git branch --show-current', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
          branch = branch ? ` | 🌿 ${branch}` : '';
      } catch {}

      console.log(`${CYAN}[${model}]${RESET} 📁 ${dir}${branch}`);
      console.log(`${barColor}${bar}${RESET} ${pct}% | ${YELLOW}$${cost.toFixed(2)}${RESET} | ⏱️ ${mins}m ${secs}s`);
  });
  ```
</CodeGroup>

### Clickable links

This example creates a clickable link to your GitHub repository. It reads the git remote URL, converts SSH format to HTTPS with `sed`, and wraps the repo name in OSC 8 escape codes. Hold Cmd (macOS) or Ctrl (Windows/Linux) and click to open the link in your browser.

<Frame>
  <img alt="A status line showing a clickable link to a GitHub repository" />
</Frame>

Each script gets the git remote URL, converts SSH format to HTTPS, and wraps the repo name in OSC 8 escape codes. The Bash version uses `printf '%b'` which interprets backslash escapes more reliably than `echo -e` across different shells:

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  input=$(cat)

  MODEL=$(echo "$input" | jq -r '.model.display_name')

  # Convert git SSH URL to HTTPS
  REMOTE=$(git remote get-url origin 2>/dev/null | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')

  if [ -n "$REMOTE" ]; then
      REPO_NAME=$(basename "$REMOTE")
      # OSC 8 format: \e]8;;URL\a then TEXT then \e]8;;\a
      # printf %b interprets escape sequences reliably across shells
      printf '%b' "[$MODEL] 🔗 \e]8;;${REMOTE}\a${REPO_NAME}\e]8;;\a\n"
  else
      echo "[$MODEL]"
  fi
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys, subprocess, re, os

  data = json.load(sys.stdin)
  model = data['model']['display_name']

  # Get git remote URL
  try:
      remote = subprocess.check_output(
          ['git', 'remote', 'get-url', 'origin'],
          stderr=subprocess.DEVNULL, text=True
      ).strip()
      # Convert SSH to HTTPS format
      remote = re.sub(r'^git@github\.com:', 'https://github.com/', remote)
      remote = re.sub(r'\.git$', '', remote)
      repo_name = os.path.basename(remote)
      # OSC 8 escape sequences
      link = f"\033]8;;{remote}\a{repo_name}\033]8;;\a"
      print(f"[{model}] 🔗 {link}")
  except:
      print(f"[{model}]")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  const { execSync } = require('child_process');
  const path = require('path');

  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;

      try {
          let remote = execSync('git remote get-url origin', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
          // Convert SSH to HTTPS format
          remote = remote.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
          const repoName = path.basename(remote);
          // OSC 8 escape sequences
          const link = `\x1b]8;;${remote}\x07${repoName}\x1b]8;;\x07`;
          console.log(`[${model}] 🔗 ${link}`);
      } catch {
          console.log(`[${model}]`);
      }
  });
  ```
</CodeGroup>

### Rate limit usage

Display Claude.ai subscription rate limit usage in the status line. The `rate_limits` object contains `five_hour` (5-hour rolling window) and `seven_day` (weekly) windows. Each window provides `used_percentage` (0-100) and `resets_at` (Unix epoch seconds when the window resets).

This field is only present for Claude.ai subscribers (Pro/Max) after the first API response. Each script handles the absent field gracefully:

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  input=$(cat)

  MODEL=$(echo "$input" | jq -r '.model.display_name')
  # "// empty" produces no output when rate_limits is absent
  FIVE_H=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
  WEEK=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

  LIMITS=""
  [ -n "$FIVE_H" ] && LIMITS="5h: $(printf '%.0f' "$FIVE_H")%"
  [ -n "$WEEK" ] && LIMITS="${LIMITS:+$LIMITS }7d: $(printf '%.0f' "$WEEK")%"

  [ -n "$LIMITS" ] && echo "[$MODEL] | $LIMITS" || echo "[$MODEL]"
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys

  data = json.load(sys.stdin)
  model = data['model']['display_name']

  parts = []
  rate = data.get('rate_limits', {})
  five_h = rate.get('five_hour', {}).get('used_percentage')
  week = rate.get('seven_day', {}).get('used_percentage')

  if five_h is not None:
      parts.append(f"5h: {five_h:.0f}%")
  if week is not None:
      parts.append(f"7d: {week:.0f}%")

  if parts:
      print(f"[{model}] | {' '.join(parts)}")
  else:
      print(f"[{model}]")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;

      const parts = [];
      const fiveH = data.rate_limits?.five_hour?.used_percentage;
      const week = data.rate_limits?.seven_day?.used_percentage;

      if (fiveH != null) parts.push(`5h: ${Math.round(fiveH)}%`);
      if (week != null) parts.push(`7d: ${Math.round(week)}%`);

      console.log(parts.length ? `[${model}] | ${parts.join(' ')}` : `[${model}]`);
  });
  ```
</CodeGroup>

### Cache expensive operations

Your status line script runs frequently during active sessions. Commands like `git status` or `git diff` can be slow, especially in large repositories. This example caches git information to a temp file and only refreshes it every 5 seconds.

The cache filename needs to be stable across status line invocations within a session, but unique across sessions so concurrent sessions in different repositories don't read each other's cached git state. Process-based identifiers like `$$`, `os.getpid()`, or `process.pid` change on every invocation and defeat the cache. Use the `session_id` from the JSON input instead: it's stable for the lifetime of a session and unique per session.

Each script checks if the cache file is missing or older than 5 seconds before running git commands:

<CodeGroup>
  ```bash Bash theme={null}
  #!/bin/bash
  input=$(cat)

  MODEL=$(echo "$input" | jq -r '.model.display_name')
  DIR=$(echo "$input" | jq -r '.workspace.current_dir')
  SESSION_ID=$(echo "$input" | jq -r '.session_id')

  CACHE_FILE="/tmp/statusline-git-cache-$SESSION_ID"
  CACHE_MAX_AGE=5  # seconds

  cache_is_stale() {
      [ ! -f "$CACHE_FILE" ] || \
      # stat -f %m is macOS, stat -c %Y is Linux
      [ $(($(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0))) -gt $CACHE_MAX_AGE ]
  }

  if cache_is_stale; then
      if git rev-parse --git-dir > /dev/null 2>&1; then
          BRANCH=$(git branch --show-current 2>/dev/null)
          STAGED=$(git diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
          MODIFIED=$(git diff --numstat 2>/dev/null | wc -l | tr -d ' ')
          echo "$BRANCH|$STAGED|$MODIFIED" > "$CACHE_FILE"
      else
          echo "||" > "$CACHE_FILE"
      fi
  fi

  IFS='|' read -r BRANCH STAGED MODIFIED < "$CACHE_FILE"

  if [ -n "$BRANCH" ]; then
      echo "[$MODEL] 📁 ${DIR##*/} | 🌿 $BRANCH +$STAGED ~$MODIFIED"
  else
      echo "[$MODEL] 📁 ${DIR##*/}"
  fi
  ```

  ```python Python theme={null}
  #!/usr/bin/env python3
  import json, sys, subprocess, os, time

  data = json.load(sys.stdin)
  model = data['model']['display_name']
  directory = os.path.basename(data['workspace']['current_dir'])
  session_id = data['session_id']

  CACHE_FILE = f"/tmp/statusline-git-cache-{session_id}"
  CACHE_MAX_AGE = 5  # seconds

  def cache_is_stale():
      if not os.path.exists(CACHE_FILE):
          return True
      return time.time() - os.path.getmtime(CACHE_FILE) > CACHE_MAX_AGE

  if cache_is_stale():
      try:
          subprocess.check_output(['git', 'rev-parse', '--git-dir'], stderr=subprocess.DEVNULL)
          branch = subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip()
          staged = subprocess.check_output(['git', 'diff', '--cached', '--numstat'], text=True).strip()
          modified = subprocess.check_output(['git', 'diff', '--numstat'], text=True).strip()
          staged_count = len(staged.split('\n')) if staged else 0
          modified_count = len(modified.split('\n')) if modified else 0
          with open(CACHE_FILE, 'w') as f:
              f.write(f"{branch}|{staged_count}|{modified_count}")
      except:
          with open(CACHE_FILE, 'w') as f:
              f.write("||")

  with open(CACHE_FILE) as f:
      branch, staged, modified = f.read().strip().split('|')

  if branch:
      print(f"[{model}] 📁 {directory} | 🌿 {branch} +{staged} ~{modified}")
  else:
      print(f"[{model}] 📁 {directory}")
  ```

  ```javascript Node.js theme={null}
  #!/usr/bin/env node
  const { execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
      const data = JSON.parse(input);
      const model = data.model.display_name;
      const dir = path.basename(data.workspace.current_dir);
      const sessionId = data.session_id;

      const CACHE_FILE = `/tmp/statusline-git-cache-${sessionId}`;
      const CACHE_MAX_AGE = 5; // seconds

      const cacheIsStale = () => {
          if (!fs.existsSync(CACHE_FILE)) return true;
          return (Date.now() / 1000) - fs.statSync(CACHE_FILE).mtimeMs / 1000 > CACHE_MAX_AGE;
      };

      if (cacheIsStale()) {
          try {
              execSync('git rev-parse --git-dir', { stdio: 'ignore' });
              const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
              const staged = execSync('git diff --cached --numstat', { encoding: 'utf8' }).trim().split('\n').filter(Boolean).length;
              const modified = execSync('git diff --numstat', { encoding: 'utf8' }).trim().split('\n').filter(Boolean).length;
              fs.writeFileSync(CACHE_FILE, `${branch}|${staged}|${modified}`);
          } catch {
              fs.writeFileSync(CACHE_FILE, '||');
          }
      }

      const [branch, staged, modified] = fs.readFileSync(CACHE_FILE, 'utf8').trim().split('|');

      if (branch) {
          console.log(`[${model}] 📁 ${dir} | 🌿 ${branch} +${staged} ~${modified}`);
      } else {
          console.log(`[${model}] 📁 ${dir}`);
      }
  });
  ```
</CodeGroup>

### Windows configuration

On Windows, Claude Code runs status line commands through Git Bash when Git Bash is installed, or through PowerShell when Git Bash is absent.

Git Bash treats unquoted backslashes as escape characters, so a Windows-style path such as `C:\Users\username\script.mjs` reaches the script runner with its separators removed and the command fails without a visible error. Write file paths in the `command` string with forward slashes, as shown in the examples below. The `~` shorthand also works and expands to your Windows home directory.

To run a PowerShell script as your status line, invoke it via `powershell`. This works whether Claude Code routes the command through Git Bash or PowerShell:

<CodeGroup>
  ```json settings.json theme={null}
  {
    "statusLine": {
      "type": "command",
      "command": "powershell -NoProfile -File C:/Users/username/.claude/statusline.ps1"
    }
  }
  ```

  ```powershell statusline.ps1 theme={null}
  $input_json = $input | Out-String | ConvertFrom-Json
  $cwd = $input_json.cwd
  $model = $input_json.model.display_name
  $used = $input_json.context_window.used_percentage
  $dirname = Split-Path $cwd -Leaf

  if ($used) {
      Write-Host "$dirname [$model] ctx: $used%"
  } else {
      Write-Host "$dirname [$model]"
  }
  ```
</CodeGroup>

Or, when Git Bash is installed, run a Bash script directly:

<CodeGroup>
  ```json settings.json theme={null}
  {
    "statusLine": {
      "type": "command",
      "command": "~/.claude/statusline.sh"
    }
  }
  ```

  ```bash statusline.sh theme={null}
  #!/usr/bin/env bash
  input=$(cat)
  cwd=$(echo "$input" | grep -o '"cwd":"[^"]*"' | cut -d'"' -f4)
  model=$(echo "$input" | grep -o '"display_name":"[^"]*"' | cut -d'"' -f4)
  dirname="${cwd##*[/\\]}"
  echo "$dirname [$model]"
  ```
</CodeGroup>

## Subagent status lines

The `subagentStatusLine` setting renders a custom row body for each [subagent](/docs/en/sub-agents) shown in the agent panel below the prompt. Use it to replace the default `name · description · token count` row with your own formatting.

```json theme={null}
{
  "subagentStatusLine": {
    "type": "command",
    "command": "~/.claude/subagent-statusline.sh"
  }
}
```

The command runs once per refresh tick with all visible subagent rows passed as a single JSON object on stdin. The input includes the [base hook fields](/docs/en/hooks#common-input-fields) plus `columns` (the usable row width) and a `tasks` array, where each task has `id`, `name`, `type`, `status`, `description`, `label`, `startTime`, `tokenCount`, `tokenSamples`, and `cwd`.

Write one JSON line to stdout per row you want to override, in the form `{"id": "<task id>", "content": "<row body>"}`. The `content` string is rendered as-is, including ANSI colors and OSC 8 hyperlinks. Omit a task's `id` to keep the default rendering for that row; emit an empty `content` string to hide it.

The same trust and `disableAllHooks` gates that apply to `statusLine` apply here. Plugins can ship a default `subagentStatusLine` in their [`settings.json`](/docs/en/plugins-reference#standard-plugin-layout).

## Tips

* **Test with mock input**: `echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"/home/user/project"},"context_window":{"used_percentage":25},"session_id":"test-session-abc"}' | ./statusline.sh`
* **Keep output short**: the status bar has limited width, so long output may get truncated or wrap awkwardly
* **Cache slow operations**: your script runs frequently during active sessions, so commands like `git status` can cause lag. See the [caching example](#cache-expensive-operations) for how to handle this.

Community projects like [ccstatusline](https://github.com/sirmalloc/ccstatusline) and [starship-claude](https://github.com/martinemde/starship-claude) provide pre-built configurations with themes and additional features.

## Troubleshooting

**Status line not appearing**

* Verify your script is executable: `chmod +x ~/.claude/statusline.sh`
* Check that your script outputs to stdout, not stderr
* Run your script manually to verify it produces output
* On Windows with Git Bash installed, backslashes in the `command` path are likely being consumed as escape characters before the script runs. Use forward slashes in the path. See [Windows configuration](#windows-configuration).
* If `disableAllHooks` is set to `true` in your settings, the status line is also disabled. Remove this setting or set it to `false` to re-enable.
* Run `claude --debug` to log the exit code and stderr from the first status line invocation in a session
* Ask Claude to read your settings file and execute the `statusLine` command directly to surface errors

**Status line shows `--` or empty values**

* Fields may be `null` before the first API response completes
* Handle null values in your script with fallbacks such as `// 0` in jq
* Restart Claude Code if values remain empty after multiple messages

**Context percentage shows unexpected values**

* Use `used_percentage` for the simplest accurate context state
* Context percentage may differ from `/context` output due to when each is calculated

**OSC 8 links not clickable**

* Verify your terminal supports OSC 8 hyperlinks (iTerm2, Kitty, WezTerm)

* Terminal.app does not support clickable links

* If link text appears but isn't clickable, Claude Code may not have detected hyperlink support in your terminal. This commonly affects Windows Terminal and other emulators not in the auto-detection list. Set the `FORCE_HYPERLINK` environment variable to override detection before launching Claude Code:

  ```bash theme={null}
  FORCE_HYPERLINK=1 claude
  ```

  In PowerShell, set the variable in the current session first:

  ```powershell theme={null}
  $env:FORCE_HYPERLINK = "1"; claude
  ```

* SSH and tmux sessions may strip OSC sequences depending on configuration

* If escape sequences appear as literal text like `\e]8;;`, use `printf '%b'` instead of `echo -e` for more reliable escape handling

**Display glitches with escape sequences**

* Complex escape sequences (ANSI colors, OSC 8 links) can occasionally cause garbled output if they overlap with other UI updates
* If you see corrupted text, try simplifying your script to plain text output
* Multi-line status lines with escape codes are more prone to rendering issues than single-line plain text

**Workspace trust required**

* The status line command only runs if you've accepted the workspace trust dialog for the current directory. Because `statusLine` executes a shell command, it requires the same trust acceptance as hooks and other shell-executing settings.
* If trust isn't accepted, you'll see the notification `statusline skipped · restart to fix` instead of your status line output. Restart Claude Code and accept the trust prompt to enable it.

**Script errors or hangs**

* Scripts that exit with non-zero codes or produce no output cause the status line to go blank
* Slow scripts block the status line from updating until they complete. Keep scripts fast to avoid stale output.
* If a new update triggers while a slow script is running, the in-flight script is cancelled
* Test your script independently with mock input before configuring it

**Notifications share the status line row**

* System notifications like MCP server errors and auto-updates display on the right side of the same row as your status line. Transient notifications such as the context-low warning also cycle through this area.
* Enabling verbose mode adds a token counter to this area
* On narrow terminals, these notifications may truncate your status line output
