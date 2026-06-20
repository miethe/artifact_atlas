# Plugins & Output Styles

_Claude Code documentation — Plugins & Output Styles. Source: https://code.claude.com/docs/en/_


---

## Create plugins

`https://code.claude.com/docs/en/plugins`

Create custom plugins to extend Claude Code with skills, agents, hooks, and MCP servers.

Plugins let you extend Claude Code with custom functionality that can be shared across projects and teams. This guide covers creating your own plugins with skills, agents, hooks, and MCP servers.

Looking to install existing plugins? See [Discover and install plugins](/docs/en/discover-plugins). For complete technical specifications, see [Plugins reference](/docs/en/plugins-reference).

## When to use plugins vs standalone configuration

Claude Code supports two ways to add custom skills, agents, and hooks:

| Approach                                                    | Skill names          | Best for                                                                                        |
| :---------------------------------------------------------- | :------------------- | :---------------------------------------------------------------------------------------------- |
| **Standalone** (`.claude/` directory)                       | `/hello`             | Personal workflows, project-specific customizations, quick experiments                          |
| **Plugins** (directories with `.claude-plugin/plugin.json`) | `/plugin-name:hello` | Sharing with teammates, distributing to community, versioned releases, reusable across projects |

**Use standalone configuration when**:

* You're customizing Claude Code for a single project
* The configuration is personal and doesn't need to be shared
* You're experimenting with skills or hooks before packaging them
* You want short skill names like `/hello` or `/deploy`

**Use plugins when**:

* You want to share functionality with your team or community
* You need the same skills/agents across multiple projects
* You want version control and easy updates for your extensions
* You're distributing through a marketplace
* You're okay with namespaced skills like `/my-plugin:hello` (namespacing prevents conflicts between plugins)

<Tip>
  Start with standalone configuration in `.claude/` for quick iteration, then [convert to a plugin](#convert-existing-configurations-to-plugins) when you're ready to share.
</Tip>

## Quickstart

This quickstart walks you through creating a plugin with a custom skill. You'll create a manifest (the configuration file that defines your plugin), add a skill, and test it locally using the `--plugin-dir` flag.

### Prerequisites

* Claude Code [installed and authenticated](/docs/en/quickstart#step-1-install-claude-code)

<Note>
  If you don't see the `/plugin` command, update Claude Code to the latest version. See [Troubleshooting](/docs/en/troubleshooting) for upgrade instructions.
</Note>

### Create your first plugin

<Steps>
  <Step title="Create the plugin directory">
    Every plugin lives in its own directory containing a manifest and your skills, agents, or hooks. Create one now:

    ```bash theme={null}
    mkdir my-first-plugin
    ```
  </Step>

  <Step title="Create the plugin manifest">
    The manifest file at `.claude-plugin/plugin.json` defines your plugin's identity: its name, description, and version. Claude Code uses this metadata to display your plugin in the plugin manager.

    Create the `.claude-plugin` directory inside your plugin folder:

    ```bash theme={null}
    mkdir my-first-plugin/.claude-plugin
    ```

    Then create `my-first-plugin/.claude-plugin/plugin.json` with this content:

    ```json my-first-plugin/.claude-plugin/plugin.json theme={null}
    {
      "name": "my-first-plugin",
      "description": "A greeting plugin to learn the basics",
      "version": "1.0.0",
      "author": {
        "name": "Your Name"
      }
    }
    ```

    | Field         | Purpose                                                                                                                                                                                                                                                        |
    | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `name`        | Unique identifier and skill namespace. Skills are prefixed with this (e.g., `/my-first-plugin:hello`).                                                                                                                                                         |
    | `description` | Shown in the plugin manager when browsing or installing plugins.                                                                                                                                                                                               |
    | `version`     | Optional. If set, users only receive updates when you bump this field. If omitted and your plugin is distributed via git, the commit SHA is used and every commit counts as a new version. See [version management](/docs/en/plugins-reference#version-management). |
    | `author`      | Optional. Helpful for attribution.                                                                                                                                                                                                                             |

    For additional fields like `homepage`, `repository`, and `license`, see the [full manifest schema](/docs/en/plugins-reference#plugin-manifest-schema).
  </Step>

  <Step title="Add a skill">
    Skills live in the `skills/` directory. Each skill is a folder containing a `SKILL.md` file. The folder name becomes the skill name, prefixed with the plugin's namespace (`hello/` in a plugin named `my-first-plugin` creates `/my-first-plugin:hello`).

    Create a skill directory in your plugin folder:

    ```bash theme={null}
    mkdir -p my-first-plugin/skills/hello
    ```

    Then create `my-first-plugin/skills/hello/SKILL.md` with this content:

    ```markdown my-first-plugin/skills/hello/SKILL.md theme={null}
    ---
    description: Greet the user with a friendly message
    disable-model-invocation: true
    ---

    Greet the user warmly and ask how you can help them today.
    ```
  </Step>

  <Step title="Test your plugin">
    Run Claude Code with the `--plugin-dir` flag to load your plugin:

    ```bash theme={null}
    claude --plugin-dir ./my-first-plugin
    ```

    Once Claude Code starts, try your new skill:

    ```shell theme={null}
    /my-first-plugin:hello
    ```

    You'll see Claude respond with a greeting. Run `/help` to see your skill listed under the plugin namespace.

    <Note>
      **Why namespacing?** Plugin skills are always namespaced (like `/my-first-plugin:hello`) to prevent conflicts when multiple plugins have skills with the same name.

      To change the namespace prefix, update the `name` field in `plugin.json`.
    </Note>
  </Step>

  <Step title="Add skill arguments">
    Make your skill dynamic by accepting user input. The `$ARGUMENTS` placeholder captures any text the user provides after the skill name.

    Update your `SKILL.md` file:

    ```markdown my-first-plugin/skills/hello/SKILL.md theme={null}
    ---
    description: Greet the user with a personalized message
    ---

    # Hello Skill

    Greet the user named "$ARGUMENTS" warmly and ask how you can help them today. Make the greeting personal and encouraging.
    ```

    Run `/reload-plugins` to pick up the changes, then try the skill with your name:

    ```shell theme={null}
    /my-first-plugin:hello Alex
    ```

    Claude will greet you by name. For more on passing arguments to skills, see [Skills](/docs/en/skills#pass-arguments-to-skills).
  </Step>
</Steps>

You've successfully created and tested a plugin with these key components:

* **Plugin manifest** (`.claude-plugin/plugin.json`): describes your plugin's metadata
* **Skills directory** (`skills/`): contains your custom skills
* **Skill arguments** (`$ARGUMENTS`): captures user input for dynamic behavior

<Tip>
  The `--plugin-dir` flag is useful for development and testing. When you're ready to share your plugin with others, see [Create and distribute a plugin marketplace](/docs/en/plugin-marketplaces).
</Tip>

## Develop a plugin in your skills directory

Instead of passing `--plugin-dir` on every launch, you can keep a plugin in your skills directory and have Claude Code load it automatically. `claude plugin init` scaffolds one:

```bash theme={null}
claude plugin init my-tool
```

This creates `~/.claude/skills/my-tool/` with a `.claude-plugin/plugin.json` manifest and a starter `SKILL.md`. On the next session it loads as `my-tool@skills-dir` with no marketplace or install step.

For the auto-load rules, personal vs. project scope, the workspace-trust requirement, and how to update or remove one, see [Skills-directory plugins](/docs/en/plugins-reference#skills-directory-plugins).

## Plugin structure overview

You've created a plugin with a skill, but plugins can include much more: custom agents, hooks, MCP servers, LSP servers, and background monitors.

<Warning>
  **Common mistake**: Don't put `commands/`, `agents/`, `skills/`, or `hooks/` inside the `.claude-plugin/` directory. Only `plugin.json` goes inside `.claude-plugin/`. All other directories must be at the plugin root level.
</Warning>

| Directory         | Location    | Purpose                                                                        |
| :---------------- | :---------- | :----------------------------------------------------------------------------- |
| `.claude-plugin/` | Plugin root | Contains `plugin.json` manifest (optional if components use default locations) |
| `skills/`         | Plugin root | Skills as `<name>/SKILL.md` directories                                        |
| `commands/`       | Plugin root | Skills as flat Markdown files. Use `skills/` for new plugins                   |
| `agents/`         | Plugin root | Custom agent definitions                                                       |
| `hooks/`          | Plugin root | Event handlers in `hooks.json`                                                 |
| `.mcp.json`       | Plugin root | MCP server configurations                                                      |
| `.lsp.json`       | Plugin root | LSP server configurations for code intelligence                                |
| `monitors/`       | Plugin root | Background monitor configurations in `monitors.json`                           |
| `bin/`            | Plugin root | Executables added to the Bash tool's `PATH` while the plugin is enabled        |
| `settings.json`   | Plugin root | Default [settings](/docs/en/settings) applied when the plugin is enabled            |

<Note>
  **Next steps**: Ready to add more features? Jump to [Develop more complex plugins](#develop-more-complex-plugins) to add agents, hooks, MCP servers, and LSP servers. For complete technical specifications of all plugin components, see [Plugins reference](/docs/en/plugins-reference).
</Note>

## Develop more complex plugins

Once you're comfortable with basic plugins, you can create more sophisticated extensions.

### Add Skills to your plugin

Plugins can include [Agent Skills](/docs/en/skills) to extend Claude's capabilities. Skills are model-invoked: Claude automatically uses them based on the task context.

Add a `skills/` directory at your plugin root with Skill folders containing `SKILL.md` files:

```text theme={null}
my-plugin/
├── .claude-plugin/
│   └── plugin.json
└── skills/
    └── code-review/
        └── SKILL.md
```

Each `SKILL.md` contains YAML frontmatter and instructions. Include a `description` so Claude knows when to use the skill:

```yaml theme={null}
---
description: Reviews code for best practices and potential issues. Use when reviewing code, checking PRs, or analyzing code quality.
---

When reviewing code, check for:
1. Code organization and structure
2. Error handling
3. Security concerns
4. Test coverage
```

After installing the plugin, run `/reload-plugins` to load the Skills. For complete Skill authoring guidance including progressive disclosure and tool restrictions, see [Agent Skills](/docs/en/skills).

### Add LSP servers to your plugin

<Tip>
  For common languages like TypeScript, Python, and Rust, install the pre-built LSP plugins from the official marketplace. Create custom LSP plugins only when you need support for languages not already covered.
</Tip>

LSP (Language Server Protocol) plugins give Claude real-time code intelligence. If you need to support a language that doesn't have an official LSP plugin, you can create your own by adding an `.lsp.json` file to your plugin:

```json .lsp.json theme={null}
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

Users installing your plugin must have the language server binary installed on their machine.

For complete LSP configuration options, see [LSP servers](/docs/en/plugins-reference#lsp-servers).

### Add background monitors to your plugin

Background monitors let your plugin watch logs, files, or external status in the background and notify Claude as events arrive. Claude Code starts each monitor automatically when the plugin is active, so you don't need to instruct Claude to start the watch.

Add a `monitors/monitors.json` file at the plugin root with an array of monitor entries:

```json monitors/monitors.json theme={null}
[
  {
    "name": "error-log",
    "command": "tail -F ./logs/error.log",
    "description": "Application error log"
  }
]
```

Each stdout line from `command` is delivered to Claude as a notification during the session. For the full schema, including the `when` trigger and variable substitution, see [Monitors](/docs/en/plugins-reference#monitors).

### Ship default settings with your plugin

Plugins can include a `settings.json` file at the plugin root to apply default configuration when the plugin is enabled. Currently, only the `agent` and `subagentStatusLine` keys are supported.

Setting `agent` activates one of the plugin's [custom agents](/docs/en/sub-agents) as the main thread, applying its system prompt, tool restrictions, and model. This lets a plugin change how Claude Code behaves by default when enabled.

```json settings.json theme={null}
{
  "agent": "security-reviewer"
}
```

This example activates the `security-reviewer` agent defined in the plugin's `agents/` directory. Settings from `settings.json` take priority over `settings` declared in `plugin.json`. Unknown keys are silently ignored.

### Organize complex plugins

For plugins with many components, organize your directory structure by functionality. For complete directory layouts and organization patterns, see [Plugin directory structure](/docs/en/plugins-reference#plugin-directory-structure).

### Test your plugins locally

Use the `--plugin-dir` flag to test plugins during development. This loads your plugin directly without requiring installation.

```bash theme={null}
claude --plugin-dir ./my-plugin
```

The flag also accepts a `.zip` archive of the plugin directory, which requires Claude Code v2.1.128 or later.

```bash theme={null}
claude --plugin-dir ./my-plugin.zip
```

When a `--plugin-dir` plugin has the same name as an installed marketplace plugin, the local copy takes precedence for that session. This lets you test changes to a plugin you already have installed without uninstalling it first. The exception is plugins that managed settings force-enable or force-disable: `--plugin-dir` cannot override those.

As you make changes to your plugin, run `/reload-plugins` to pick up the updates without restarting. This reloads plugins, skills, agents, hooks, plugin MCP servers, and plugin LSP servers. Test your plugin components:

* Try your skills with `/plugin-name:skill-name`
* Check that agents appear in `/agents`
* Verify hooks work as expected

<Tip>
  You can load multiple plugins at once by specifying the flag multiple times:

  ```bash theme={null}
  claude --plugin-dir ./plugin-one --plugin-dir ./plugin-two
  ```
</Tip>

To test a plugin that is already packaged as a `.zip` archive and hosted at a URL, such as a CI build artifact, use `--plugin-url` instead. Claude Code fetches the archive at startup and loads it for that session only. If the fetch fails or the archive is invalid, Claude Code reports a plugin load error and starts without it. The same [trust considerations](/docs/en/discover-plugins#security) apply as for any plugin source: only point this flag at archives you control or trust.

To load multiple plugins, repeat the flag for each URL:

```bash theme={null}
claude --plugin-url https://example.com/my-plugin.zip --plugin-url https://example.com/other.zip
```

Or pass space-separated URLs as one quoted argument:

```bash theme={null}
claude --plugin-url "https://example.com/my-plugin.zip https://example.com/other.zip"
```

### Debug plugin issues

If your plugin isn't working as expected:

1. **Check the structure**: Ensure your directories are at the plugin root, not inside `.claude-plugin/`
2. **Test components individually**: Check each skill, agent, and hook separately
3. **Use validation and debugging tools**: See [Debugging and development tools](/docs/en/plugins-reference#debugging-and-development-tools) for CLI commands and troubleshooting techniques

### Share your plugins

When your plugin is ready to share:

1. **Add documentation**: Include a `README.md` with installation and usage instructions
2. **Choose a versioning strategy**: Decide whether to set an explicit `version` or rely on the git commit SHA. See [version management](/docs/en/plugins-reference#version-management)
3. **Create or use a marketplace**: Distribute through [plugin marketplaces](/docs/en/plugin-marketplaces) for installation
4. **Test with others**: Have team members test the plugin before wider distribution

Once your plugin is in a marketplace, others can install it using the instructions in [Discover and install plugins](/docs/en/discover-plugins). To keep a plugin internal to your team, host the marketplace in a [private repository](/docs/en/plugin-marketplaces#private-repositories).

### Submit your plugin to the community marketplace

Anthropic maintains two public marketplaces for Claude Code plugins:

* **`claude-plugins-official`**: a curated set of plugins maintained by Anthropic. Available automatically in every Claude Code installation.
* **`claude-community`**: the public community marketplace where third-party submissions land after review. Users add it with `/plugin marketplace add anthropics/claude-plugins-community` and install from it as `@claude-community`.

To submit your plugin for community-marketplace review, use one of the in-app forms:

* **Claude.ai**: [claude.ai/settings/plugins/submit](https://claude.ai/settings/plugins/submit)
* **Console**: [platform.claude.com/plugins/submit](https://platform.claude.com/plugins/submit)

Run `claude plugin validate` locally before you submit. The review pipeline runs the same check on every submission, along with automated safety screening.

Approved plugins are pinned to a specific commit SHA in the [`anthropics/claude-plugins-community`](https://github.com/anthropics/claude-plugins-community) catalog, and CI bumps the pin automatically as you push new commits to your repository. The public catalog syncs nightly from the review pipeline, so there can be a delay between approval and your plugin appearing in `marketplace.json`. To check whether your plugin is installable yet, search for its name in the [community catalog](https://github.com/anthropics/claude-plugins-community/blob/main/.claude-plugin/marketplace.json).

The official marketplace, `claude-plugins-official`, is curated separately. Anthropic decides which plugins to include at its discretion. There is no application process, and the submission form does not add plugins to the official marketplace.

If Anthropic lists your plugin in the official marketplace, your CLI can prompt Claude Code users to install it. See [Recommend your plugin from your CLI](/docs/en/plugin-hints).

<Note>
  For complete technical specifications, debugging techniques, and distribution strategies, see [Plugins reference](/docs/en/plugins-reference).
</Note>

## Convert existing configurations to plugins

If you already have skills or hooks in your `.claude/` directory, you can convert them into a plugin for easier sharing and distribution.

### Migration steps

<Steps>
  <Step title="Create the plugin structure">
    Create a new plugin directory:

    ```bash theme={null}
    mkdir -p my-plugin/.claude-plugin
    ```

    Create the manifest file at `my-plugin/.claude-plugin/plugin.json`:

    ```json my-plugin/.claude-plugin/plugin.json theme={null}
    {
      "name": "my-plugin",
      "description": "Migrated from standalone configuration",
      "version": "1.0.0"
    }
    ```
  </Step>

  <Step title="Copy your existing files">
    Copy your existing configurations to the plugin directory:

    ```bash theme={null}
    # Copy commands
    cp -r .claude/commands my-plugin/

    # Copy agents (if any)
    cp -r .claude/agents my-plugin/

    # Copy skills (if any)
    cp -r .claude/skills my-plugin/
    ```
  </Step>

  <Step title="Migrate hooks">
    If you have hooks in your settings, create a hooks directory:

    ```bash theme={null}
    mkdir my-plugin/hooks
    ```

    Create `my-plugin/hooks/hooks.json` with your hooks configuration. Copy the `hooks` object from your `.claude/settings.json` or `settings.local.json`, since the format is the same. The command receives hook input as JSON on stdin, so use `jq` to extract the file path:

    ```json my-plugin/hooks/hooks.json theme={null}
    {
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Write|Edit",
            "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npm run lint:fix" }]
          }
        ]
      }
    }
    ```
  </Step>

  <Step title="Test your migrated plugin">
    Load your plugin to verify everything works:

    ```bash theme={null}
    claude --plugin-dir ./my-plugin
    ```

    Test each component: run your commands, check agents appear in `/agents`, and verify hooks trigger correctly.
  </Step>
</Steps>

### What changes when migrating

| Standalone (`.claude/`)       | Plugin                           |
| :---------------------------- | :------------------------------- |
| Only available in one project | Can be shared via marketplaces   |
| Files in `.claude/commands/`  | Files in `plugin-name/commands/` |
| Hooks in `settings.json`      | Hooks in `hooks/hooks.json`      |
| Must manually copy to share   | Install with `/plugin install`   |

<Note>
  After migrating, you can remove the original files from `.claude/` to avoid duplicates. The plugin version will take precedence when loaded.
</Note>

## Next steps

Now that you understand Claude Code's plugin system, here are suggested paths for different goals:

### For plugin users

* [Discover and install plugins](/docs/en/discover-plugins): browse marketplaces and install plugins
* [Configure team marketplaces](/docs/en/discover-plugins#configure-team-marketplaces): set up repository-level plugins for your team

### For plugin developers

* [Create and distribute a marketplace](/docs/en/plugin-marketplaces): package and share your plugins
* [Plugins reference](/docs/en/plugins-reference): complete technical specifications
* Dive deeper into specific plugin components:
  * [Skills](/docs/en/skills): skill development details
  * [Subagents](/docs/en/sub-agents): agent configuration and capabilities
  * [Hooks](/docs/en/hooks): event handling and automation
  * [MCP](/docs/en/mcp): external tool integration


---

## Plugins reference

`https://code.claude.com/docs/en/plugins-reference`

Complete technical reference for Claude Code plugin system, including schemas, CLI commands, and component specifications.

<Tip>
  Looking to install plugins? See [Discover and install plugins](/docs/en/discover-plugins). For creating plugins, see [Plugins](/docs/en/plugins). For distributing plugins, see [Plugin marketplaces](/docs/en/plugin-marketplaces).
</Tip>

This reference provides complete technical specifications for the Claude Code plugin system, including component schemas, CLI commands, and development tools.

A **plugin** is a self-contained directory of components that extends Claude Code with custom functionality. Plugin components include skills, agents, hooks, MCP servers, LSP servers, and monitors.

## Plugin components reference

### Skills

Plugins add skills to Claude Code, creating `/name` shortcuts that you or Claude can invoke.

**Location**: `skills/` or `commands/` directory in plugin root, or a single `SKILL.md` file at the plugin root

**File format**: Skills are directories with `SKILL.md`; commands are simple markdown files

**Skill structure**:

```text theme={null}
skills/
├── pdf-processor/
│   ├── SKILL.md
│   ├── reference.md (optional)
│   └── scripts/ (optional)
└── code-reviewer/
    └── SKILL.md
```

**Integration behavior**:

* Skills and commands are automatically discovered when the plugin is installed
* Claude can invoke them automatically based on task context
* Skills can include supporting files alongside SKILL.md

For complete details, see [Skills](/docs/en/skills).

### Agents

Plugins can provide specialized subagents for specific tasks that Claude can invoke automatically when appropriate.

**Location**: `agents/` directory in plugin root

**File format**: Markdown files describing agent capabilities

**Agent structure**:

```markdown theme={null}
---
name: agent-name
description: What this agent specializes in and when Claude should invoke it
model: sonnet
effort: medium
maxTurns: 20
disallowedTools: Write, Edit
---

Detailed system prompt for the agent describing its role, expertise, and behavior.
```

Plugin agents support `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, and `isolation` frontmatter fields. The only valid `isolation` value is `"worktree"`. For security reasons, `hooks`, `mcpServers`, and `permissionMode` are not supported for plugin-shipped agents.

**Integration points**:

* Agents appear in the `/agents` interface
* Claude can invoke agents automatically based on task context
* Agents can be invoked manually by users
* Plugin agents work alongside built-in Claude agents

For complete details, see [Subagents](/docs/en/sub-agents).

### Hooks

Plugins can provide event handlers that respond to Claude Code events automatically.

**Location**: `hooks/hooks.json` in plugin root, or inline in plugin.json

**Format**: JSON configuration with event matchers and actions

**Hook configuration**:

```json theme={null}
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/format-code.sh"
          }
        ]
      }
    ]
  }
}
```

Plugin hooks respond to the same lifecycle events as [user-defined hooks](/docs/en/hooks):

| Event                 | When it fires                                                                                                                                          |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionStart`        | When a session begins or resumes                                                                                                                       |
| `Setup`               | When you start Claude Code with `--init-only`, or with `--init` or `--maintenance` in `-p` mode. For one-time preparation in CI or scripts             |
| `UserPromptSubmit`    | When you submit a prompt, before Claude processes it                                                                                                   |
| `UserPromptExpansion` | When a user-typed command expands into a prompt, before it reaches Claude. Can block the expansion                                                     |
| `PreToolUse`          | Before a tool call executes. Can block it                                                                                                              |
| `PermissionRequest`   | When a permission dialog appears                                                                                                                       |
| `PermissionDenied`    | When a tool call is denied by the auto mode classifier. Return `{retry: true}` to tell the model it may retry the denied tool call                     |
| `PostToolUse`         | After a tool call succeeds                                                                                                                             |
| `PostToolUseFailure`  | After a tool call fails                                                                                                                                |
| `PostToolBatch`       | After a full batch of parallel tool calls resolves, before the next model call                                                                         |
| `Notification`        | When Claude Code sends a notification                                                                                                                  |
| `MessageDisplay`      | While assistant message text is displayed                                                                                                              |
| `SubagentStart`       | When a subagent is spawned                                                                                                                             |
| `SubagentStop`        | When a subagent finishes                                                                                                                               |
| `TaskCreated`         | When a task is being created via `TaskCreate`                                                                                                          |
| `TaskCompleted`       | When a task is being marked as completed                                                                                                               |
| `Stop`                | When Claude finishes responding                                                                                                                        |
| `StopFailure`         | When the turn ends due to an API error. Output and exit code are ignored                                                                               |
| `TeammateIdle`        | When an [agent team](/docs/en/agent-teams) teammate is about to go idle                                                                                     |
| `InstructionsLoaded`  | When a CLAUDE.md or `.claude/rules/*.md` file is loaded into context. Fires at session start and when files are lazily loaded during a session         |
| `ConfigChange`        | When a configuration file changes during a session                                                                                                     |
| `CwdChanged`          | When the working directory changes, for example when Claude executes a `cd` command. Useful for reactive environment management with tools like direnv |
| `FileChanged`         | When a watched file changes on disk. The `matcher` field specifies which filenames to watch                                                            |
| `WorktreeCreate`      | When a worktree is being created via `--worktree` or `isolation: "worktree"`. Replaces default git behavior                                            |
| `WorktreeRemove`      | When a worktree is being removed, either at session exit or when a subagent finishes                                                                   |
| `PreCompact`          | Before context compaction                                                                                                                              |
| `PostCompact`         | After context compaction completes                                                                                                                     |
| `Elicitation`         | When an MCP server requests user input during a tool call                                                                                              |
| `ElicitationResult`   | After a user responds to an MCP elicitation, before the response is sent back to the server                                                            |
| `SessionEnd`          | When a session terminates                                                                                                                              |

**Hook types**:

* `command`: execute shell commands or scripts
* `http`: send the event JSON as a POST request to a URL
* `mcp_tool`: call a tool on a configured [MCP server](/docs/en/mcp)
* `prompt`: evaluate a prompt with an LLM (uses `$ARGUMENTS` placeholder for context)
* `agent`: run an agentic verifier with tools for complex verification tasks

### MCP servers

Plugins can bundle Model Context Protocol (MCP) servers to connect Claude Code with external tools and services.

**Location**: `.mcp.json` in plugin root, or inline in plugin.json

**Format**: Standard MCP server configuration

**MCP server configuration**:

```json theme={null}
{
  "mcpServers": {
    "plugin-database": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_PATH": "${CLAUDE_PLUGIN_ROOT}/data"
      }
    },
    "plugin-api-client": {
      "command": "npx",
      "args": ["@company/mcp-server", "--plugin-mode"],
      "cwd": "${CLAUDE_PLUGIN_ROOT}"
    }
  }
}
```

**Integration behavior**:

* Plugin MCP servers start automatically when the plugin is enabled
* Servers appear as standard MCP tools in Claude's toolkit
* Server capabilities integrate seamlessly with Claude's existing tools
* Plugin servers can be configured independently of user MCP servers

### LSP servers

<Tip>
  Looking to use LSP plugins? Install them from the official marketplace: search for "lsp" in the `/plugin` Discover tab. This section documents how to create LSP plugins for languages not covered by the official marketplace.
</Tip>

Plugins can provide [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) (LSP) servers to give Claude real-time code intelligence while working on your codebase.

LSP integration provides:

* **Instant diagnostics**: Claude sees errors and warnings immediately after each edit
* **Code navigation**: go to definition, find references, and hover information
* **Language awareness**: type information and documentation for code symbols

**Location**: `.lsp.json` in plugin root, or inline in `plugin.json`

**Format**: JSON configuration mapping language server names to their configurations

**`.lsp.json` file format**:

```json theme={null}
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  }
}
```

**Inline in `plugin.json`**:

```json theme={null}
{
  "name": "my-plugin",
  "lspServers": {
    "go": {
      "command": "gopls",
      "args": ["serve"],
      "extensionToLanguage": {
        ".go": "go"
      }
    }
  }
}
```

**Required fields:**

| Field                 | Description                                  |
| :-------------------- | :------------------------------------------- |
| `command`             | The LSP binary to execute (must be in PATH)  |
| `extensionToLanguage` | Maps file extensions to language identifiers |

**Optional fields:**

| Field                   | Description                                               |
| :---------------------- | :-------------------------------------------------------- |
| `args`                  | Command-line arguments for the LSP server                 |
| `transport`             | Communication transport: `stdio` (default) or `socket`    |
| `env`                   | Environment variables to set when starting the server     |
| `initializationOptions` | Options passed to the server during initialization        |
| `settings`              | Settings passed via `workspace/didChangeConfiguration`    |
| `workspaceFolder`       | Workspace folder path for the server                      |
| `startupTimeout`        | Max time to wait for server startup (milliseconds)        |
| `shutdownTimeout`       | Max time to wait for graceful shutdown (milliseconds)     |
| `restartOnCrash`        | Whether to automatically restart the server if it crashes |
| `maxRestarts`           | Maximum number of restart attempts before giving up       |

<Warning>
  **You must install the language server binary separately.** LSP plugins configure how Claude Code connects to a language server, but they don't include the server itself. If you see `Executable not found in $PATH` in the `/plugin` Errors tab, install the required binary for your language.
</Warning>

**Available LSP plugins:**

| Plugin              | Language server            | Install command                                                                            |
| :------------------ | :------------------------- | :----------------------------------------------------------------------------------------- |
| `pyright-lsp`       | Pyright (Python)           | `pip install pyright` or `npm install -g pyright`                                          |
| `typescript-lsp`    | TypeScript Language Server | `npm install -g typescript-language-server typescript`                                     |
| `rust-analyzer-lsp` | rust-analyzer              | [See rust-analyzer installation](https://rust-analyzer.github.io/manual.html#installation) |

Install the language server first, then install the plugin from the marketplace.

### Monitors

Plugins can declare background monitors that Claude Code starts automatically when the plugin is active. Each monitor runs a shell command for the lifetime of the session and delivers every stdout line to Claude as a notification, so Claude can react to log entries, status changes, or polled events without being asked to start the watch itself.

Plugin monitors use the same mechanism as the [Monitor tool](/docs/en/tools-reference#monitor-tool) and share its availability constraints. They run only in interactive CLI sessions, run unsandboxed at the same trust level as [hooks](#hooks), and are skipped on hosts where the Monitor tool is unavailable.

<Note>
  Plugin monitors require Claude Code v2.1.105 or later.
</Note>

**Location**: `monitors/monitors.json` in the plugin root, or inline in `plugin.json`

**Format**: JSON array of monitor entries

The following `monitors/monitors.json` watches a deployment status endpoint and a local error log:

```json theme={null}
[
  {
    "name": "deploy-status",
    "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/poll-deploy.sh ${user_config.api_endpoint}",
    "description": "Deployment status changes"
  },
  {
    "name": "error-log",
    "command": "tail -F ./logs/error.log",
    "description": "Application error log",
    "when": "on-skill-invoke:debug"
  }
]
```

To declare monitors inline, set `experimental.monitors` in `plugin.json` to the same array. To load from a non-default path, set `experimental.monitors` to a relative path string such as `"./config/monitors.json"`. Monitors are an [experimental component](#experimental-components).

**Required fields:**

| Field         | Description                                                                                                           |
| :------------ | :-------------------------------------------------------------------------------------------------------------------- |
| `name`        | Identifier unique within the plugin. Prevents duplicate processes when the plugin reloads or a skill is invoked again |
| `command`     | Shell command run as a persistent background process in the session working directory                                 |
| `description` | Short summary of what is being watched. Shown in the task panel and in notification summaries                         |

**Optional fields:**

| Field  | Description                                                                                                                                                                                                              |
| :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `when` | Controls when the monitor starts. `"always"` starts it at session start and on plugin reload, and is the default. `"on-skill-invoke:<skill-name>"` starts it the first time the named skill in this plugin is dispatched |

The `command` value supports the same [variable substitutions](#environment-variables) as MCP and LSP server configs: `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`, `${CLAUDE_PROJECT_DIR}`, `${user_config.*}`, and any `${ENV_VAR}` from the environment. Prefix the command with `cd "${CLAUDE_PLUGIN_ROOT}" && ` if the script needs to run from the plugin's own directory.

Disabling a plugin mid-session does not stop monitors that are already running. They stop when the session ends.

### Themes

Plugins can ship color themes that appear in `/theme` alongside the built-in presets and the user's local themes. A theme is a JSON file in `themes/` with a `base` preset and a sparse `overrides` map of color tokens. Themes are an [experimental component](#experimental-components).

```json theme={null}
{
  "name": "Dracula",
  "base": "dark",
  "overrides": {
    "claude": "#bd93f9",
    "error": "#ff5555",
    "success": "#50fa7b"
  }
}
```

Selecting a plugin theme persists `custom:<plugin-name>:<slug>` in the user's config. Plugin themes are read-only; pressing `Ctrl+E` on one in `/theme` copies it into `~/.claude/themes/` so the user can edit the copy.

***

## Plugin installation scopes

When you install a plugin, you choose a **scope** that determines where the plugin is available and who else can use it:

| Scope     | Settings file                                   | Use case                                                 |
| :-------- | :---------------------------------------------- | :------------------------------------------------------- |
| `user`    | `~/.claude/settings.json`                       | Personal plugins available across all projects (default) |
| `project` | `.claude/settings.json`                         | Team plugins shared via version control                  |
| `local`   | `.claude/settings.local.json`                   | Project-specific plugins, gitignored                     |
| `managed` | [Managed settings](/docs/en/settings#settings-files) | Managed plugins (read-only, update only)                 |

Plugins use the same scope system as other Claude Code configurations. For installation instructions and scope flags, see [Install plugins](/docs/en/discover-plugins#install-plugins). For a complete explanation of scopes, see [Configuration scopes](/docs/en/settings#configuration-scopes).

***

## Skills-directory plugins

Any folder under a skills directory that contains a `.claude-plugin/plugin.json` manifest is loaded as a plugin named `<name>@skills-dir` on the next session, with no marketplace and no install step. Scaffold one with [`plugin init`](#plugin-init). Unlike a marketplace install, the plugin is discovered in place rather than copied into the plugin cache.

A skills directory tree supports three distinct things:

| What you have                                 | What it is                                                                          |
| :-------------------------------------------- | :---------------------------------------------------------------------------------- |
| `<skills-dir>/foo/SKILL.md` with no manifest  | A plain [skill](/docs/en/skills) named `foo`                                             |
| `<skills-dir>/foo/.claude-plugin/plugin.json` | A plugin `foo@skills-dir`, which can bundle its own skills, agents, hooks, and more |
| `<plugin>/skills/bar/SKILL.md`                | A skill `bar` packaged inside a plugin                                              |

### Choose where the plugin loads from

| Skills directory        | Scope    | Loads                                                                            |
| :---------------------- | :------- | :------------------------------------------------------------------------------- |
| `~/.claude/skills/`     | personal | In every project, since the location is yours alone                              |
| `<cwd>/.claude/skills/` | project  | Only after you accept the workspace [trust dialog](/docs/en/settings) for that folder |

A project-scope plugin is checked into the repository and reaches every collaborator who clones it. Because that content comes from the repository rather than from you, it loads only after the same trust gate that governs `.claude/settings.json`, and components that run code are restricted further:

* MCP servers it declares go through the [same per-server approval](/docs/en/mcp) as a project `.mcp.json`
* LSP servers start only after you trust the workspace
* [Background monitors](#monitors) do not load

Personal-scope plugins have none of these restrictions.

<Warning>
  Project-scope `@skills-dir` plugins load only from the `.claude/skills/` of the directory where you start Claude Code. They do not [walk up to the repository root](/docs/en/skills#automatic-discovery-from-parent-and-nested-directories) the way plain skills and commands do, so launching from a subdirectory misses a plugin that lives at the repo root. Launch from the repository root, or run `/reload-plugins` after changing directories.
</Warning>

### Edit, reload, and disable a skills-directory plugin

Changes you make to a skill's `SKILL.md` take effect immediately in the current session. Changes to the plugin's other components, such as `hooks/`, `.mcp.json`, `agents/`, and `output-styles/`, do not. Run `/reload-plugins` or restart Claude Code to pick those up. See [Live change detection](/docs/en/skills#live-change-detection).

To stop loading a skills-directory plugin, delete its folder or disable it by name. There is no `uninstall` step because nothing was installed from a marketplace.

```bash theme={null}
claude plugin disable my-tool@skills-dir
```

***

## Plugin manifest schema

The `.claude-plugin/plugin.json` file defines your plugin's metadata and configuration. This section documents all supported fields and options.

The manifest is optional. If omitted, Claude Code auto-discovers components in [default locations](#file-locations-reference) and derives the plugin name from the directory name. Use a manifest when you need to provide metadata or custom component paths.

### Complete schema

```json theme={null}
{
  "name": "plugin-name",
  "displayName": "Plugin Name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "skills": "./custom/skills/",
  "commands": ["./custom/commands/special.md"],
  "agents": ["./custom/agents/reviewer.md"],
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json",
  "experimental": {
    "themes": "./themes/",
    "monitors": "./monitors.json"
  },
  "dependencies": [
    "helper-lib",
    { "name": "secrets-vault", "version": "~2.1.0" }
  ]
}
```

### Required fields

If you include a manifest, `name` is the only required field.

| Field  | Type   | Description                               | Example              |
| :----- | :----- | :---------------------------------------- | :------------------- |
| `name` | string | Unique identifier (kebab-case, no spaces) | `"deployment-tools"` |

This name is used for namespacing components. For example, in the UI, the
agent `agent-creator` for the plugin with name `plugin-dev` will appear as
`plugin-dev:agent-creator`.

### Unrecognized fields

Claude Code ignores top-level fields it does not recognize. You can keep
metadata from another ecosystem in `plugin.json` and the plugin still loads.
This makes it practical to maintain one manifest that doubles as a VS Code or
Cursor extension manifest, an npm `package.json`, or an MCPB/DXT bundle
manifest.

`claude plugin validate` reports unrecognized fields as warnings, not errors.
If a field is one or two characters off from a recognized one, the warning
suggests the likely intended name. A plugin with only unrecognized-field
warnings still passes validation and loads at runtime.

Fields with the wrong type still fail. For example, a `keywords` value that is
a string instead of an array is a load error, and `claude plugin validate`
reports it as one.

Pass `--strict` to treat warnings as errors. Use it in CI to catch a misspelled
field name or a field left over from another tool's manifest before publishing,
even though the plugin would load at runtime.

```bash theme={null}
claude plugin validate ./my-plugin --strict
```

### Metadata fields

| Field            | Type    | Description                                                                                                                                                                                                                                                                                                                                      | Example                                                           |
| :--------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| `$schema`        | string  | JSON Schema URL for editor autocomplete and validation. Claude Code ignores this field at load time.                                                                                                                                                                                                                                             | `"https://json.schemastore.org/claude-code-plugin-manifest.json"` |
| `displayName`    | string  | Human-readable name shown in the `/plugin` picker and other UI surfaces. Falls back to `name` when omitted. Unlike `name`, may contain spaces and any casing. Not used for namespacing or lookup. Requires Claude Code v2.1.143 or later.                                                                                                        | `"Deployment Tools"`                                              |
| `version`        | string  | Optional. Semantic version. Setting this pins the plugin to that version string, so users only receive updates when you bump it. If omitted, Claude Code falls back to the git commit SHA, so every commit is treated as a new version. If also set in the marketplace entry, `plugin.json` wins. See [Version management](#version-management). | `"2.1.0"`                                                         |
| `description`    | string  | Brief explanation of plugin purpose                                                                                                                                                                                                                                                                                                              | `"Deployment automation tools"`                                   |
| `author`         | object  | Author information                                                                                                                                                                                                                                                                                                                               | `{"name": "Dev Team", "email": "dev@company.com"}`                |
| `homepage`       | string  | Documentation URL                                                                                                                                                                                                                                                                                                                                | `"https://docs.example.com"`                                      |
| `repository`     | string  | Source code URL                                                                                                                                                                                                                                                                                                                                  | `"https://github.com/user/plugin"`                                |
| `license`        | string  | License identifier                                                                                                                                                                                                                                                                                                                               | `"MIT"`, `"Apache-2.0"`                                           |
| `keywords`       | array   | Discovery tags                                                                                                                                                                                                                                                                                                                                   | `["deployment", "ci-cd"]`                                         |
| `defaultEnabled` | boolean | Whether the plugin starts in an enabled state when the user has not set one. Defaults to `true`. See [Default enablement](#default-enablement). Requires Claude Code v2.1.154 or later.                                                                                                                                                          | `false`                                                           |

### Default enablement

Set `defaultEnabled: false` in `plugin.json` to ship a plugin that installs disabled. The user turns it on with `claude plugin enable <plugin>` or the `/plugin` interface. Use this for plugins that add cost or scope a user should opt into, such as one that connects to an external service. This requires Claude Code v2.1.154 or later. Earlier versions ignore the field and enable the plugin on install.

`defaultEnabled` is the fallback when nothing else has decided the plugin's state. Two things take precedence over it:

* **The user's setting**: an entry for the plugin in `enabledPlugins` at any settings scope. Once written, it persists across plugin updates and reinstalls, so changing `defaultEnabled` in a later release does not flip an existing user.
* **A dependency requirement**: when a plugin is required by another one that is active, Claude Code writes `true` for it at install or enable time. That gives it an explicit setting, so its own default no longer applies. See [Enable or disable a plugin with dependencies](/docs/en/plugin-dependencies#enable-or-disable-a-plugin-with-dependencies).

The same field can appear in a plugin's marketplace entry, where it takes precedence over the value in `plugin.json`. See [Optional plugin fields](/docs/en/plugin-marketplaces#optional-plugin-fields).

### Component path fields

| Field                   | Type                  | Description                                                                                                                                               | Example                                              |
| :---------------------- | :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| `skills`                | string\|array         | Custom skill directories containing `<name>/SKILL.md` (in addition to default `skills/`)                                                                  | `"./custom/skills/"`                                 |
| `commands`              | string\|array         | Custom flat `.md` skill files or directories (replaces default `commands/`)                                                                               | `"./custom/cmd.md"` or `["./cmd1.md"]`               |
| `agents`                | string\|array         | Custom agent files (replaces default `agents/`)                                                                                                           | `"./custom/agents/reviewer.md"`                      |
| `hooks`                 | string\|array\|object | Hook config paths or inline config                                                                                                                        | `"./my-extra-hooks.json"`                            |
| `mcpServers`            | string\|array\|object | MCP config paths or inline config                                                                                                                         | `"./my-extra-mcp-config.json"`                       |
| `outputStyles`          | string\|array         | Custom output style files/directories (replaces default `output-styles/`)                                                                                 | `"./styles/"`                                        |
| `lspServers`            | string\|array\|object | [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) configs for code intelligence (go to definition, find references, etc.) | `"./.lsp.json"`                                      |
| `experimental.themes`   | string\|array         | Color theme files/directories (replaces default `themes/`). See [Themes](#themes)                                                                         | `"./themes/"`                                        |
| `experimental.monitors` | string\|array         | Background [Monitor](/docs/en/tools-reference#monitor-tool) configurations that start automatically when the plugin is active. See [Monitors](#monitors)       | `"./monitors.json"`                                  |
| `userConfig`            | object                | User-configurable values prompted at enable time. See [User configuration](#user-configuration)                                                           | See below                                            |
| `channels`              | array                 | Channel declarations for message injection (Telegram, Slack, Discord style). See [Channels](#channels)                                                    | See below                                            |
| `dependencies`          | array                 | Other plugins this plugin requires, optionally with semver version constraints. See [Constrain plugin dependency versions](/docs/en/plugin-dependencies)       | `[{ "name": "secrets-vault", "version": "~2.1.0" }]` |

### Experimental components

Components under the `experimental` key, `themes` and `monitors`, have a manifest schema that may change between releases while they stabilize. Where you declare them is a separate migration: the top level still works, `claude plugin validate` warns, and a future release will require `experimental.*`.

### User configuration

The `userConfig` field declares values that Claude Code prompts the user for when the plugin is enabled. Use this instead of requiring users to hand-edit `settings.json`.

```json theme={null}
{
  "userConfig": {
    "api_endpoint": {
      "type": "string",
      "title": "API endpoint",
      "description": "Your team's API endpoint"
    },
    "api_token": {
      "type": "string",
      "title": "API token",
      "description": "API authentication token",
      "sensitive": true
    }
  }
}
```

Keys must be valid identifiers. Each option supports these fields:

| Field         | Required | Description                                                                              |
| :------------ | :------- | :--------------------------------------------------------------------------------------- |
| `type`        | Yes      | One of `string`, `number`, `boolean`, `directory`, or `file`                             |
| `title`       | Yes      | Label shown in the configuration dialog                                                  |
| `description` | Yes      | Help text shown beneath the field                                                        |
| `sensitive`   | No       | If `true`, masks input and stores the value in secure storage instead of `settings.json` |
| `required`    | No       | If `true`, validation fails when the field is empty                                      |
| `default`     | No       | Value used when the user provides nothing                                                |
| `multiple`    | No       | For `string` type, allow an array of strings                                             |
| `min` / `max` | No       | Bounds for `number` type                                                                 |

Each value is available for substitution as `${user_config.KEY}` in MCP and LSP server configs, hook commands, and monitor commands. Non-sensitive values can also be substituted in skill and agent content. All values are exported to plugin subprocesses as `CLAUDE_PLUGIN_OPTION_<KEY>` environment variables.

Non-sensitive values are stored in `settings.json` under `pluginConfigs[<plugin-id>].options`. Sensitive values go to the system keychain (or `~/.claude/.credentials.json` where the keychain is unavailable). Keychain storage is shared with OAuth tokens and has an approximately 2 KB total limit, so keep sensitive values small.

### Channels

The `channels` field lets a plugin declare one or more message channels that inject content into the conversation. Each channel binds to an MCP server that the plugin provides.

```json theme={null}
{
  "channels": [
    {
      "server": "telegram",
      "userConfig": {
        "bot_token": {
          "type": "string",
          "title": "Bot token",
          "description": "Telegram bot token",
          "sensitive": true
        },
        "owner_id": {
          "type": "string",
          "title": "Owner ID",
          "description": "Your Telegram user ID"
        }
      }
    }
  ]
}
```

The `server` field is required and must match a key in the plugin's `mcpServers`. The optional per-channel `userConfig` uses the same schema as the top-level field, letting the plugin prompt for bot tokens or owner IDs when the plugin is enabled.

### Path behavior rules

Whether a custom path replaces or extends the plugin's default directory depends on the field:

* **Replaces the default**: `commands`, `agents`, `outputStyles`, `experimental.themes`, `experimental.monitors`. For example, when the manifest specifies `commands`, the default `commands/` directory is not scanned. To keep the default and add more, list it explicitly: `"commands": ["./commands/", "./extras/"]`
* **Adds to the default**: `skills`. The default `skills/` directory is always scanned, and directories listed in `skills` are loaded alongside it
* **Own merge rules**: [hooks](#hooks), [MCP servers](#mcp-servers), and [LSP servers](#lsp-servers). See each section for how multiple sources combine

When a plugin has both a default folder and the matching manifest key, Claude Code v2.1.140 and later flags the ignored folder in `/doctor`, `claude plugin list`, and the `/plugin` detail view. The plugin still loads using the manifest paths. No warning is shown when the manifest key points into the default folder, for example `"commands": ["./commands/deploy.md"]`, because the folder is addressed explicitly in that case.

For all path fields:

* All paths must be relative to the plugin root and start with `./`
* Components from custom paths use the same naming and namespacing rules
* Multiple paths can be specified as arrays
* When a skill path points to a directory that contains a `SKILL.md` directly, for example `"skills": ["./"]` pointing to the plugin root, the frontmatter `name` field in `SKILL.md` determines the skill's invocation name. This gives a stable name regardless of the install directory. If `name` is not set in the frontmatter, the directory basename is used as a fallback.

A plugin that has a `SKILL.md` at its root, no `skills/` subdirectory, and no `skills` manifest field is automatically loaded as a single-skill plugin in Claude Code v2.1.142 and later. You do not need to set `"skills": ["./"]` in `plugin.json` for this layout. The skill's invocation name follows the same rule as above: the frontmatter `name` field, or the directory basename as a fallback.

**Path examples**:

```json theme={null}
{
  "commands": [
    "./specialized/deploy.md",
    "./utilities/batch-process.md"
  ],
  "agents": [
    "./custom-agents/reviewer.md",
    "./custom-agents/tester.md"
  ]
}
```

### Environment variables

Claude Code provides three variables for referencing paths. All are substituted inline anywhere they appear in skill content, agent content, hook commands, monitor commands, and MCP or LSP server configs. All are also exported as environment variables to hook processes and MCP or LSP server subprocesses.

**`${CLAUDE_PLUGIN_ROOT}`**: the absolute path to your plugin's installation directory. Use this to reference scripts, binaries, and config files bundled with the plugin. In hook commands, use [exec form](/docs/en/hooks#exec-form-and-shell-form) with `args` so the path is passed as one argument with no quoting. In shell-form hooks and monitor commands, wrap it in double quotes, as in `"${CLAUDE_PLUGIN_ROOT}"`. This path changes when the plugin updates. The previous version's directory remains on disk for about seven days after an update before cleanup, but treat it as ephemeral and do not write state here.

When a plugin updates mid-session, hook commands, monitors, MCP servers, and LSP servers keep using the previous version's path. Run `/reload-plugins` to switch hooks, MCP servers, and LSP servers to the new path; monitors require a session restart.

**`${CLAUDE_PLUGIN_DATA}`**: a persistent directory for plugin state that survives updates. Use this for installed dependencies such as `node_modules` or Python virtual environments, generated code, caches, and any other files that should persist across plugin versions. The directory is created automatically the first time this variable is referenced.

**`${CLAUDE_PROJECT_DIR}`**: the project root. This is the same directory hooks receive in their `CLAUDE_PROJECT_DIR` variable. Use this to reference project-local scripts or config files. Wrap in quotes to handle paths with spaces, for example `"${CLAUDE_PROJECT_DIR}/scripts/server.sh"`. MCP servers can also call the MCP `roots/list` request, which returns the directory Claude Code was launched from.

```json theme={null}
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/process.sh"
          }
        ]
      }
    ]
  }
}
```

#### Persistent data directory

The `${CLAUDE_PLUGIN_DATA}` directory resolves to `~/.claude/plugins/data/{id}/`, where `{id}` is the plugin identifier with characters outside `a-z`, `A-Z`, `0-9`, `_`, and `-` replaced by `-`. For a plugin installed as `formatter@my-marketplace`, the directory is `~/.claude/plugins/data/formatter-my-marketplace/`.

A common use is installing language dependencies once and reusing them across sessions and plugin updates. Because the data directory outlives any single plugin version, a check for directory existence alone cannot detect when an update changes the plugin's dependency manifest. The recommended pattern compares the bundled manifest against a copy in the data directory and reinstalls when they differ.

This `SessionStart` hook installs `node_modules` on the first run and again whenever a plugin update includes a changed `package.json`:

```json theme={null}
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "diff -q \"${CLAUDE_PLUGIN_ROOT}/package.json\" \"${CLAUDE_PLUGIN_DATA}/package.json\" >/dev/null 2>&1 || (cd \"${CLAUDE_PLUGIN_DATA}\" && cp \"${CLAUDE_PLUGIN_ROOT}/package.json\" . && npm install) || rm -f \"${CLAUDE_PLUGIN_DATA}/package.json\""
          }
        ]
      }
    ]
  }
}
```

The `diff` exits nonzero when the stored copy is missing or differs from the bundled one, covering both first run and dependency-changing updates. If `npm install` fails, the trailing `rm` removes the copied manifest so the next session retries.

Scripts bundled in `${CLAUDE_PLUGIN_ROOT}` can then run against the persisted `node_modules`:

```json theme={null}
{
  "mcpServers": {
    "routines": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/server.js"],
      "env": {
        "NODE_PATH": "${CLAUDE_PLUGIN_DATA}/node_modules"
      }
    }
  }
}
```

The data directory is deleted automatically when you uninstall the plugin from the last scope where it is installed. The `/plugin` interface shows the directory size and prompts before deleting. The CLI deletes by default; pass [`--keep-data`](#plugin-uninstall) to preserve it.

***

## Plugin caching and file resolution

Plugins are specified in one of two ways:

* Through `claude --plugin-dir` or `claude --plugin-url`, for the duration of a session.
* Through a marketplace, installed for future sessions.

For security and verification purposes, Claude Code copies *marketplace* plugins to the user's local **plugin cache** (`~/.claude/plugins/cache`) rather than using them in-place. Understanding this behavior is important when developing plugins that reference external files.

Each installed version is a separate directory in the cache. When you update or uninstall a plugin, the previous version directory is marked as orphaned and removed automatically 7 days later. The grace period lets concurrent Claude Code sessions that already loaded the old version keep running without errors.

Claude's Glob and Grep tools skip orphaned version directories during searches, so file results don't include outdated plugin code.

### Path traversal limitations

Installed plugins cannot reference files outside their directory. Paths that traverse outside the plugin root (such as `../shared-utils`) will not work after installation because those external files are not copied to the cache.

### Share files within a marketplace with symlinks

If your plugin needs to share files with other parts of the same marketplace, you can create symbolic links inside your plugin directory. How a symlink is handled when the plugin is copied into the cache depends on where its target resolves:

* **Within the plugin's own directory:** the symlink is preserved as a relative symlink in the cache, so it keeps resolving to the copied target at runtime.
* **Elsewhere within the same marketplace:** the symlink is dereferenced. The target's content is copied into the cache in its place. This lets a meta-plugin's `skills/` directory link to skills defined by other plugins in the marketplace.
* **Outside the marketplace:** the symlink is skipped for security. This prevents plugins from pulling arbitrary host files such as system paths into the cache.

For plugins installed with `--plugin-dir` or from a local path, only symlinks that resolve within the plugin's own directory are preserved. All others are skipped.

The following command creates a link from inside a marketplace plugin to a shared skill defined by a sibling plugin. On Windows, use `mklink /D` from an elevated Command Prompt or enable Developer Mode:

```bash theme={null}
ln -s ../../shared-plugin/skills/foo ./skills/foo
```

This provides flexibility while maintaining the security benefits of the caching system.

***

## Plugin directory structure

### Standard plugin layout

A complete plugin follows this structure:

```text theme={null}
enterprise-plugin/
├── .claude-plugin/           # Metadata directory (optional)
│   └── plugin.json             # plugin manifest
├── skills/                   # Skills
│   ├── code-reviewer/
│   │   └── SKILL.md
│   └── pdf-processor/
│       ├── SKILL.md
│       └── scripts/
├── commands/                 # Skills as flat .md files
│   ├── status.md
│   └── logs.md
├── agents/                   # Subagent definitions
│   ├── security-reviewer.md
│   ├── performance-tester.md
│   └── compliance-checker.md
├── output-styles/            # Output style definitions
│   └── terse.md
├── themes/                   # Color theme definitions
│   └── dracula.json
├── monitors/                 # Background monitor configurations
│   └── monitors.json
├── hooks/                    # Hook configurations
│   ├── hooks.json           # Main hook config
│   └── security-hooks.json  # Additional hooks
├── bin/                      # Plugin executables added to PATH
│   └── my-tool               # Invokable as bare command in Bash tool
├── settings.json            # Default settings for the plugin
├── .mcp.json                # MCP server definitions
├── .lsp.json                # LSP server configurations
├── scripts/                 # Hook and utility scripts
│   ├── security-scan.sh
│   ├── format-code.py
│   └── deploy.js
├── LICENSE                  # License file
└── CHANGELOG.md             # Version history
```

<Warning>
  The `.claude-plugin/` directory contains the `plugin.json` file. All other directories (commands/, agents/, skills/, output-styles/, themes/, monitors/, hooks/) must be at the plugin root, not inside `.claude-plugin/`.
</Warning>

A `CLAUDE.md` file at the plugin root is not loaded as project context. Plugins contribute context through skills, agents, and hooks rather than CLAUDE.md. To ship instructions that load into Claude's context, put them in a [skill](#skills).

### File locations reference

| Component         | Default Location             | Purpose                                                                                                                                                                                    |
| :---------------- | :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manifest**      | `.claude-plugin/plugin.json` | Plugin metadata and configuration (optional)                                                                                                                                               |
| **Skills**        | `skills/`                    | Skills with `<name>/SKILL.md` structure                                                                                                                                                    |
| **Commands**      | `commands/`                  | Skills as flat Markdown files. Use `skills/` for new plugins                                                                                                                               |
| **Agents**        | `agents/`                    | Subagent Markdown files                                                                                                                                                                    |
| **Output styles** | `output-styles/`             | Output style definitions                                                                                                                                                                   |
| **Themes**        | `themes/`                    | Color theme definitions                                                                                                                                                                    |
| **Hooks**         | `hooks/hooks.json`           | Hook configuration                                                                                                                                                                         |
| **MCP servers**   | `.mcp.json`                  | MCP server definitions                                                                                                                                                                     |
| **LSP servers**   | `.lsp.json`                  | Language server configurations                                                                                                                                                             |
| **Monitors**      | `monitors/monitors.json`     | Background monitor configurations                                                                                                                                                          |
| **Executables**   | `bin/`                       | Executables added to the Bash tool's `PATH`. Files here are invokable as bare commands in any Bash tool call while the plugin is enabled                                                   |
| **Settings**      | `settings.json`              | Default configuration applied when the plugin is enabled. Only the [`agent`](/docs/en/sub-agents) and [`subagentStatusLine`](/docs/en/statusline#subagent-status-lines) keys are currently supported |

***

## CLI commands reference

Claude Code provides CLI commands for non-interactive plugin management, useful for scripting and automation.

### plugin init

Scaffold a new plugin at `~/.claude/skills/<name>/`. On the next Claude Code session it loads automatically as `<name>@skills-dir` and appears in `/plugin` and `claude plugin list` with no install step.

See [Skills-directory plugins](#skills-directory-plugins) for scope and trust requirements.

```bash theme={null}
claude plugin init <name> [options]
```

**Arguments:**

* `<name>`: Plugin name. Becomes the skill namespace and the directory name under `~/.claude/skills/`, so it cannot contain spaces or path separators.

**Options:**

| Option                   | Description                                                                                                         | Default                 |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------ | :---------------------- |
| `--description <text>`   | Manifest description                                                                                                |                         |
| `--author <name>`        | Author name                                                                                                         | `git config user.name`  |
| `--author-email <email>` | Author email                                                                                                        | `git config user.email` |
| `--with <components...>` | Also scaffold component folders. Valid values: `skills`, `agents`, `hooks`, `mcp`, `lsp`, `output-style`, `channel` |                         |
| `-f, --force`            | Overwrite an existing `.claude-plugin/` at the target                                                               |                         |
| `-h, --help`             | Display help for command                                                                                            |                         |

**Aliases:** `new`

Each `--with` value adds a starter file for that component, ready to edit:

| Component      | What it scaffolds                                                                                         |
| :------------- | :-------------------------------------------------------------------------------------------------------- |
| `skills`       | An extra namespaced `<name>:example` skill alongside the default one                                      |
| `agents`       | An `agents/` subagent definition                                                                          |
| `hooks`        | A `hooks/hooks.json` with a sample event handler                                                          |
| `mcp`          | A `.mcp.json` with HTTP and stdio server examples                                                         |
| `lsp`          | A `.lsp.json` language-server example                                                                     |
| `output-style` | An `output-styles/<name>.md` that applies automatically while the plugin is enabled                       |
| `channel`      | An MCP-based [channel](/docs/en/channels): a stdio server (`server.ts`), its `.mcp.json`, and a `package.json` |

The scaffolded plugin uses the `@skills-dir` source rather than a marketplace. Admins can block this source with `strictKnownMarketplaces` or by adding `{"source": "skills-dir"}` to `blockedMarketplaces` in [managed settings](/docs/en/plugin-marketplaces#managed-marketplace-restrictions). When blocked, `plugin init` fails before writing.

**Examples:**

```bash theme={null}
# Scaffold a minimal plugin
claude plugin init my-helper

# Scaffold with skill and hook folders
claude plugin init my-helper --with skills hooks

# Overwrite an existing scaffold
claude plugin init my-helper --force
```

### plugin install

Install a plugin from available marketplaces.

```bash theme={null}
claude plugin install <plugin> [options]
```

**Arguments:**

* `<plugin>`: Plugin name or `plugin-name@marketplace-name` for a specific marketplace

**Options:**

| Option                | Description                                       | Default |
| :-------------------- | :------------------------------------------------ | :------ |
| `-s, --scope <scope>` | Installation scope: `user`, `project`, or `local` | `user`  |
| `-h, --help`          | Display help for command                          |         |

Scope determines which settings file the installed plugin is added to. For example, `--scope project` writes to `enabledPlugins` in .claude/settings.json, making the plugin available to everyone who clones the project repository.

**Examples:**

```bash theme={null}
# Install to user scope (default)
claude plugin install formatter@my-marketplace

# Install to project scope (shared with team)
claude plugin install formatter@my-marketplace --scope project

# Install to local scope (gitignored)
claude plugin install formatter@my-marketplace --scope local
```

### plugin uninstall

Remove an installed plugin.

```bash theme={null}
claude plugin uninstall <plugin> [options]
```

**Arguments:**

* `<plugin>`: Plugin name or `plugin-name@marketplace-name`

**Options:**

| Option                | Description                                                                                              | Default |
| :-------------------- | :------------------------------------------------------------------------------------------------------- | :------ |
| `-s, --scope <scope>` | Uninstall from scope: `user`, `project`, or `local`                                                      | `user`  |
| `--keep-data`         | Preserve the plugin's [persistent data directory](#persistent-data-directory)                            |         |
| `--prune`             | Also remove auto-installed dependencies that no other plugin requires. See [plugin prune](#plugin-prune) |         |
| `-y, --yes`           | Skip the `--prune` confirmation prompt. Required when stdin or stdout is not a TTY                       |         |
| `-h, --help`          | Display help for command                                                                                 |         |

**Aliases:** `remove`, `rm`

By default, uninstalling from the last remaining scope also deletes the plugin's `${CLAUDE_PLUGIN_DATA}` directory. Use `--keep-data` to preserve it, for example when reinstalling after testing a new version.

### plugin prune

Remove auto-installed plugin dependencies that are no longer required by any installed plugin. Dependencies that Claude Code pulled in to satisfy another plugin's [`dependencies`](/docs/en/plugin-dependencies) field are removed; plugins you installed directly are never touched.

```bash theme={null}
claude plugin prune [options]
```

**Options:**

| Option                | Description                                                              | Default |
| :-------------------- | :----------------------------------------------------------------------- | :------ |
| `-s, --scope <scope>` | Prune at scope: `user`, `project`, or `local`                            | `user`  |
| `--dry-run`           | List what would be removed without removing anything                     |         |
| `-y, --yes`           | Skip the confirmation prompt. Required when stdin or stdout is not a TTY |         |
| `-h, --help`          | Display help for command                                                 |         |

**Aliases:** `autoremove`

The command lists orphaned dependencies and asks for confirmation before removing them. To remove a plugin and clean up its dependencies in one step, run `claude plugin uninstall <plugin> --prune`.

<Note>
  `claude plugin prune` requires Claude Code v2.1.121 or later.
</Note>

### plugin enable

Enable a disabled plugin. If the plugin declares [dependencies](/docs/en/plugin-dependencies), Claude Code enables them transitively at the same scope, and the command fails when a dependency is not installed.

```bash theme={null}
claude plugin enable <plugin> [options]
```

**Arguments:**

* `<plugin>`: Plugin name or `plugin-name@marketplace-name`

**Options:**

| Option                | Description                                    | Default |
| :-------------------- | :--------------------------------------------- | :------ |
| `-s, --scope <scope>` | Scope to enable: `user`, `project`, or `local` | `user`  |
| `-h, --help`          | Display help for command                       |         |

### plugin disable

Disable a plugin without uninstalling it. Fails when another enabled plugin [depends on](/docs/en/plugin-dependencies#enable-or-disable-a-plugin-with-dependencies) the target. The error message includes a chained command that disables every dependent first.

```bash theme={null}
claude plugin disable <plugin> [options]
```

**Arguments:**

* `<plugin>`: Plugin name or `plugin-name@marketplace-name`

**Options:**

| Option                | Description                                     | Default |
| :-------------------- | :---------------------------------------------- | :------ |
| `-s, --scope <scope>` | Scope to disable: `user`, `project`, or `local` | `user`  |
| `-h, --help`          | Display help for command                        |         |

### plugin update

Update a plugin to the latest version.

```bash theme={null}
claude plugin update <plugin> [options]
```

**Arguments:**

* `<plugin>`: Plugin name or `plugin-name@marketplace-name`

**Options:**

| Option                | Description                                               | Default |
| :-------------------- | :-------------------------------------------------------- | :------ |
| `-s, --scope <scope>` | Scope to update: `user`, `project`, `local`, or `managed` | `user`  |
| `-h, --help`          | Display help for command                                  |         |

***

### plugin list

List installed plugins with their version, source marketplace, and enable status.

```bash theme={null}
claude plugin list [options]
```

**Options:**

| Option        | Description                                                    | Default |
| :------------ | :------------------------------------------------------------- | :------ |
| `--json`      | Output as JSON                                                 |         |
| `--available` | Include available plugins from marketplaces. Requires `--json` |         |
| `-h, --help`  | Display help for command                                       |         |

### plugin details

Show a plugin's component inventory and projected token cost. The output lists all components the plugin contributes, grouped as Skills, Agents, Hooks, MCP servers, and LSP servers, along with an estimate of how many tokens it adds to each session. The Skills group includes both `skills/` and `commands/` entries.

```bash theme={null}
claude plugin details <name>
```

**Arguments:**

* `<name>`: Plugin name or `plugin-name@marketplace-name`

**Options:**

| Option       | Description              | Default |
| :----------- | :----------------------- | :------ |
| `-h, --help` | Display help for command |         |

The output shows two cost figures for each component:

* **Always-on:** tokens added to every session by the plugin's listing text, such as skill descriptions, agent descriptions, and command names, regardless of whether any component fires.
* **On-invoke:** tokens a component costs when it fires. Shown per component, not as a plugin total, because a typical session invokes only a subset of components.

This example shows what the output looks like for a plugin with two skills:

```
dependency-guard 1.2.0
  Dependency analysis for Claude Code sessions
  Source: dependency-guard@example-marketplace

Component inventory
  Skills (2)  scan-dependencies, review-changes
  Agents (0)
  Hooks (1)  (harness-only — no model context cost)
  MCP servers (0)
  LSP servers (0)

Projected token cost
  Always-on:   ~180 tok   added to every session

Per-component (rounded)
  component            always-on  on-invoke
  scan-dependencies        ~100      ~2400
  review-changes            ~80      ~1800

  On-invoke cost is paid each time a skill or agent fires.
  Token counts are estimates and may differ from actual usage.
```

The always-on total is computed via the `count_tokens` API for your active model. Per-component numbers are proportionally scaled from that total. If the API is unreachable, the command falls back to a character-based estimate.

### plugin tag

Create a release git tag for the plugin in the current directory. Run from inside the plugin's folder. See [Tag plugin releases](/docs/en/plugin-dependencies#tag-plugin-releases-for-version-resolution).

```bash theme={null}
claude plugin tag [options]
```

**Options:**

| Option        | Description                                                                | Default |
| :------------ | :------------------------------------------------------------------------- | :------ |
| `--push`      | Push the tag to the remote after creating it                               |         |
| `--dry-run`   | Print what would be tagged without creating the tag                        |         |
| `-f, --force` | Create the tag even if the working tree is dirty or the tag already exists |         |
| `-h, --help`  | Display help for command                                                   |         |

***

## Debugging and development tools

### Debugging commands

Use `claude --debug` to see plugin loading details:

This shows:

* Which plugins are being loaded
* Any errors in plugin manifests
* Skill, agent, and hook registration
* MCP server initialization

### Common issues

| Issue                               | Cause                           | Solution                                                                                                                                                        |
| :---------------------------------- | :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin not loading                  | Invalid `plugin.json`           | Run `claude plugin validate` or `/plugin validate` to check `plugin.json`, skill/agent/command frontmatter, and `hooks/hooks.json` for syntax and schema errors |
| Skills not appearing                | Wrong directory structure       | Ensure `skills/` or `commands/` is at the plugin root, not inside `.claude-plugin/`                                                                             |
| Hooks not firing                    | Script not executable           | Run `chmod +x script.sh`                                                                                                                                        |
| MCP server fails                    | Missing `${CLAUDE_PLUGIN_ROOT}` | Use variable for all plugin paths                                                                                                                               |
| Path errors                         | Absolute paths used             | All paths must be relative and start with `./`                                                                                                                  |
| LSP `Executable not found in $PATH` | Language server not installed   | Install the binary (e.g., `npm install -g typescript-language-server typescript`)                                                                               |

### Example error messages

**Manifest validation errors**:

* `Invalid JSON syntax: Unexpected token } in JSON at position 142`: check for missing commas, extra commas, or unquoted strings
* `Plugin has an invalid manifest file at .claude-plugin/plugin.json. Validation errors: name: Required`: a required field is missing
* `Plugin has a corrupt manifest file at .claude-plugin/plugin.json. JSON parse error: ...`: JSON syntax error

**Plugin loading errors**:

* `Warning: No commands found in plugin my-plugin custom directory: ./cmds. Expected .md files or SKILL.md in subdirectories.`: command path exists but contains no valid command files
* `Plugin directory not found at path: ./plugins/my-plugin. Check that the marketplace entry has the correct path.`: the `source` path in marketplace.json points to a non-existent directory
* `Plugin my-plugin has conflicting manifests: both plugin.json and marketplace entry specify components.`: remove duplicate component definitions or remove `strict: false` in marketplace entry

### Hook troubleshooting

**Hook script not executing**:

1. Check the script is executable: `chmod +x ./scripts/your-script.sh`
2. Verify the shebang line: First line should be `#!/bin/bash` or `#!/usr/bin/env bash`
3. Check the path uses `${CLAUDE_PLUGIN_ROOT}`: `"command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/your-script.sh"`
4. Test the script manually: `./scripts/your-script.sh`

**Hook not triggering on expected events**:

1. Verify the event name is correct (case-sensitive): `PostToolUse`, not `postToolUse`
2. Check the matcher pattern matches your tools: `"matcher": "Write|Edit"` for file operations
3. Confirm the hook type is valid: `command`, `http`, `mcp_tool`, `prompt`, or `agent`

### MCP server troubleshooting

**Server not starting**:

1. Check the command exists and is executable
2. Verify all paths use `${CLAUDE_PLUGIN_ROOT}` variable
3. Check the MCP server logs: `claude --debug` shows initialization errors
4. Test the server manually outside of Claude Code

**Server tools not appearing**:

1. Ensure the server is properly configured in `.mcp.json` or `plugin.json`
2. Verify the server implements the MCP protocol correctly
3. Check for connection timeouts in debug output

### Directory structure mistakes

**Symptoms**: Plugin loads but components (skills, agents, hooks) are missing.

**Correct structure**: Components must be at the plugin root, not inside `.claude-plugin/`. Only `plugin.json` belongs in `.claude-plugin/`.

```text theme={null}
my-plugin/
├── .claude-plugin/
│   └── plugin.json      ← Only manifest here
├── commands/            ← At root level
├── agents/              ← At root level
└── hooks/               ← At root level
```

If your components are inside `.claude-plugin/`, move them to the plugin root.

**Debug checklist**:

1. Run `claude --debug` and look for "loading plugin" messages
2. Check that each component directory is listed in the debug output
3. Verify file permissions allow reading the plugin files

***

## Distribution and versioning reference

### Version management

Claude Code uses the plugin's version as the cache key that determines whether an update is available. When you run `/plugin update` or auto-update fires, Claude Code computes the current version and skips the update if it matches what's already installed.

The version is resolved from the first of these that is set:

1. The `version` field in the plugin's `plugin.json`
2. The `version` field in the plugin's marketplace entry in `marketplace.json`
3. The git commit SHA of the plugin's source, for `github`, `url`, `git-subdir`, and relative-path sources in a git-hosted marketplace
4. `unknown`, for `npm` sources or local directories not inside a git repository

This gives you two ways to version a plugin:

| Approach               | How                                                              | Update behavior                                                                                                                                                      | Best for                                          |
| :--------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **Explicit version**   | Set `"version": "2.1.0"` in `plugin.json`                        | Users get updates only when you bump this field. Pushing new commits without bumping it has no effect, and `/plugin update` reports "already at the latest version". | Published plugins with stable release cycles      |
| **Commit-SHA version** | Omit `version` from both `plugin.json` and the marketplace entry | Users get updates on every new commit to the plugin's git source                                                                                                     | Internal or team plugins under active development |

<Warning>
  If you set `version` in `plugin.json`, you must bump it every time you want users to receive changes. Pushing new commits alone is not enough, because Claude Code sees the same version string and keeps the cached copy. If you're iterating quickly, leave `version` unset so the git commit SHA is used instead.
</Warning>

If you use explicit versions, follow [semantic versioning](https://semver.org) (`MAJOR.MINOR.PATCH`): bump MAJOR for breaking changes, MINOR for new features, PATCH for bug fixes. Document changes in a `CHANGELOG.md`.

***

## See also

* [Plugins](/docs/en/plugins) - Tutorials and practical usage
* [Plugin marketplaces](/docs/en/plugin-marketplaces) - Creating and managing marketplaces
* [Skills](/docs/en/skills) - Skill development details
* [Subagents](/docs/en/sub-agents) - Agent configuration and capabilities
* [Hooks](/docs/en/hooks) - Event handling and automation
* [MCP](/docs/en/mcp) - External tool integration
* [Settings](/docs/en/settings) - Configuration options for plugins


---

## Constrain plugin dependency versions

`https://code.claude.com/docs/en/plugin-dependencies`

Declare version constraints on plugin dependencies so your plugin keeps working when an upstream plugin ships a breaking change.

A plugin can depend on other plugins by listing them in `plugin.json` or in its marketplace entry. By default, a dependency tracks the latest available version, so an upstream release can change the dependency under your plugin without warning. Version constraints let you hold a dependency at a tested version range until you choose to move.

When you install a plugin that declares dependencies, Claude Code resolves and installs them automatically and lists which dependencies were added at the end of the install output. If a dependency later goes missing, `/reload-plugins` and the background plugin auto-update reinstall it, provided its marketplace is already in your configured marketplaces. Re-running `claude plugin install` on the dependent plugin, or adding a marketplace with `claude plugin marketplace add`, also resolves any outstanding missing dependencies. Dependencies from a marketplace you have not added are left unresolved.

This guide is for plugin authors who declare dependencies in `plugin.json` and for marketplace maintainers who tag releases. To install plugins that have dependencies, see [Discover and install plugins](/docs/en/discover-plugins). For the full manifest schema, see the [Plugins reference](/docs/en/plugins-reference).

<Note>
  Dependency version constraints require Claude Code v2.1.110 or later.
</Note>

## Why constrain dependency versions

Consider an internal marketplace where two teams publish plugins. The platform team maintains `secrets-vault`, an MCP server that wraps a secrets backend. The deploy team maintains `deploy-kit`, which calls `secrets-vault` to fetch credentials during deploys.

`deploy-kit` is tested against `secrets-vault` v2.1.0. Without a version constraint, the next time the platform team tags a release that renames an MCP tool, auto-update moves every engineer's `secrets-vault` to the new version and `deploy-kit` breaks.

With a version constraint, `deploy-kit` declares that it needs `secrets-vault` in the `~2.1.0` range. Engineers with `deploy-kit` installed stay on the highest matching `2.1.x` patch. The deploy team upgrades on their own schedule by publishing a new `deploy-kit` version with a wider constraint.

## Declare a dependency with a version constraint

List dependencies in the `dependencies` array of your plugin's `.claude-plugin/plugin.json`. Each entry is either a plugin name or an object with a version constraint.

The following manifest declares one unversioned dependency and one constrained dependency:

```json .claude-plugin/plugin.json theme={null}
{
  "name": "deploy-kit",
  "version": "3.1.0",
  "dependencies": [
    "audit-logger",
    { "name": "secrets-vault", "version": "~2.1.0" }
  ]
}
```

An entry can be a bare string with only the plugin name, like `"audit-logger"` in the example above, which depends on whatever version that plugin's marketplace provides. For more control, use an object with these fields:

| Field         | Type   | Description                                                                                                                                                                                                                                                             |
| :------------ | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | string | Plugin name. Resolves within the same marketplace as the declaring plugin. Required.                                                                                                                                                                                    |
| `version`     | string | A [semver range](https://github.com/npm/node-semver#ranges) such as `~2.1.0`, `^2.0`, `>=1.4`, or `=2.1.0`. The dependency is fetched at the highest tagged version that satisfies this range.                                                                          |
| `marketplace` | string | A different marketplace to resolve `name` in. Cross-marketplace dependencies are blocked unless the target marketplace is listed in [`allowCrossMarketplaceDependenciesOn`](#depend-on-a-plugin-from-another-marketplace) in the root marketplace's `marketplace.json`. |

The `version` field accepts any expression supported by Node's `semver` package, including caret, tilde, hyphen, and comparator ranges. Pre-release versions such as `2.0.0-beta.1` are excluded unless your range opts in with a pre-release suffix like `^2.0.0-0`.

## Depend on a plugin from another marketplace

By default, Claude Code refuses to auto-install a dependency that lives in a different marketplace than the plugin declaring it. This prevents one marketplace from silently pulling in plugins from a source you have not reviewed.

To allow it, the maintainer of the root marketplace adds the target marketplace name to `allowCrossMarketplaceDependenciesOn` in `marketplace.json`. The root marketplace is the one that hosts the plugin the user is installing; only its allowlist is consulted, so trust does not chain through intermediate marketplaces.

The following `marketplace.json` allows `deploy-kit` to depend on a plugin from `acme-shared`:

```json .claude-plugin/marketplace.json theme={null}
{
  "name": "acme-tools",
  "owner": { "name": "Acme" },
  "allowCrossMarketplaceDependenciesOn": ["acme-shared"],
  "plugins": [
    {
      "name": "deploy-kit",
      "source": "./deploy-kit",
      "dependencies": [
        { "name": "audit-logger", "marketplace": "acme-shared" }
      ]
    }
  ]
}
```

If the field is missing or does not include the target marketplace, install fails with a `cross-marketplace` error naming the field to set. Users can still install the dependency manually first, which satisfies the constraint without changing the allowlist.

## Tag plugin releases for version resolution

Version constraints resolve against git tags on the marketplace repository. For Claude Code to find a dependency's available versions, the upstream plugin's releases must be tagged using a specific naming convention.

Tag each release as `{plugin-name}--v{version}`, where `{version}` matches the `version` field in that commit's `plugin.json`. From the plugin directory, run:

```bash theme={null}
claude plugin tag --push
```

The `claude plugin tag` command derives the tag name from the plugin's manifest and the enclosing marketplace entry. Before creating the tag, it validates the plugin contents, checks that `plugin.json` and the marketplace entry agree on the version, requires a clean working tree under the plugin directory, and refuses if the tag already exists. Add `--dry-run` to see what would be tagged without creating it. Running `git tag secrets-vault--v2.1.0` directly is equivalent if you keep `plugin.json` and the marketplace entry in sync yourself.

The plugin name prefix lets one marketplace repository host multiple plugins with independent version lines. The `--v` separator is parsed as a prefix match on the full plugin name, so plugin names that contain hyphens are handled correctly.

When you install a plugin that declares `{ "name": "secrets-vault", "version": "~2.1.0" }`, Claude Code lists the marketplace's tags, filters to those starting with `secrets-vault--v`, and fetches the highest version satisfying `~2.1.0`. If no matching tag exists, the dependent plugin is disabled with an error listing the available versions.

The resolved tag's semver is recorded separately from `plugin.json`'s `version`, so constraint checks use the tag that was actually fetched even if `plugin.json` at that commit has a stale value. The cache directory name for a tag-resolved install includes a 12-character commit-SHA suffix, so if a maintainer force-moves a tag to a different commit, the next install gets a fresh cache directory instead of reusing stale content.

<Note>
  For `npm` marketplace sources, the constraint does not control which version is fetched, since tag-based resolution applies only to git-backed sources. The constraint is still checked at load time, and the dependent plugin is disabled with `dependency-version-unsatisfied` if the installed version does not satisfy it.
</Note>

## How constraints interact

When several installed plugins constrain the same dependency, Claude Code intersects their ranges and resolves the dependency to the highest version that satisfies all of them. The table below shows how common combinations resolve.

| Plugin A requires | Plugin B requires | Result                                                                                          |
| :---------------- | :---------------- | :---------------------------------------------------------------------------------------------- |
| `^2.0`            | `>=2.1`           | One install at the highest `2.x` tag at or above `2.1.0`. Both plugins load.                    |
| `~2.1`            | `~3.0`            | Install of plugin B fails with `range-conflict`. Plugin A and the dependency stay as they were. |
| `=2.1.0`          | none              | The dependency stays at `2.1.0`. Auto-update skips newer versions while plugin A is installed.  |

Auto-update fetches a constrained dependency at the highest git tag that satisfies every installed plugin's range, rather than at the marketplace's latest version, so the dependency continues to receive updates within its allowed range. If no tag satisfies all ranges, the update is skipped and the skip appears in `/doctor` and the `/plugin` Errors tab, naming the constraining plugin.

When you uninstall the last plugin that constrains a dependency, the dependency is no longer held and resumes tracking its marketplace entry on the next update.

## Enable or disable a plugin with dependencies

Enabling a plugin also enables the plugins it depends on, and disabling a plugin is blocked if another enabled plugin still needs it. Both behaviors require Claude Code v2.1.143 or later. Earlier versions enable or disable only the named plugin and surface a `dependency-unsatisfied` error on the next load.

When you enable a plugin, Claude Code also enables its dependencies at the same scope. If a dependency has its own dependencies, Claude Code enables those too. The success message lists what else was enabled along with the plugin you named. If a dependency can't be enabled, the command refuses and tells you what's blocking and how to fix it:

| Condition                                                                              | Result                                                                                                                 |
| :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| A dependency is not installed                                                          | Enable fails and prints the `claude plugin install` command for each missing dependency.                               |
| A dependency is blocked by your organization's plugin policy                           | Enable fails and names the blocked dependency.                                                                         |
| A dependency is set to `false` at a scope with higher precedence than the target scope | Enable fails. Enable the dependency at that scope, or pass `--scope` to write there.                                   |
| All dependencies are installed and allowed                                             | Enable succeeds and writes `true` for the plugin and each dependency that was not already enabled at the target scope. |

This holds even when a dependency sets [`defaultEnabled: false`](/docs/en/plugins-reference#default-enablement) in its manifest, because Claude Code writes an explicit `true` for it. The same applies at install: a dependency pulled in to satisfy an active plugin installs with `true` regardless of its own default.

When you disable a plugin, Claude Code refuses if another enabled plugin still depends on it. The error names the plugins that depend on it and gives you a chained command that disables them in the right order, ending with the one you asked for.

For example, if `deploy-kit` depends on `secrets-vault`, disabling `secrets-vault` alone fails with output similar to the following:

```text theme={null}
secrets-vault is still required by deploy-kit. Disable that plugin first, or
disable everything together: claude plugin disable deploy-kit@acme-tools && claude plugin disable secrets-vault@acme-tools
```

Copy the chained command from the error to disable the full set in one step.

## Remove orphaned auto-installed dependencies

Auto-installed dependencies stay on disk after the plugins that installed them are uninstalled, in case you reinstall a dependent plugin or want to keep using the dependency directly. To clean them up, run `claude plugin prune` to list the auto-installed dependencies that no longer have any installed plugin requiring them and remove them after a confirmation prompt. This requires Claude Code v2.1.121 or later.

```bash theme={null}
claude plugin prune
```

By default, prune operates at user scope. Use `--scope project` or `--scope local` to target a different scope. Pass `--dry-run` to list what would be removed without changing anything. Pass `-y` to skip the confirmation prompt. When stdin or stdout is not a terminal, prune lists the orphans and exits without removing them unless `-y` is passed.

To prune as part of an uninstall, pass `--prune` to `claude plugin uninstall`. After removing the named plugin, Claude Code scans for and removes any auto-installed dependencies that are now orphaned. Plugins you installed yourself are never pruned, only those installed automatically through another plugin's `dependencies` array.

For example, to uninstall `deploy-kit` and clean up the dependencies it leaves behind:

```bash theme={null}
claude plugin uninstall deploy-kit --prune
```

## Resolve dependency errors

Dependency problems surface in `claude plugin list`, in the `/plugin` interface, and in `/doctor`. The affected plugin is disabled until you resolve the error. The most common errors and their fixes are listed below.

| Error                            | Meaning                                                                                                                                                                                                                           | How to resolve                                                                                                                                                                                                                                                          |
| :------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependency-unsatisfied`         | A declared dependency is not installed, or it is installed but disabled.                                                                                                                                                          | Run the `claude plugin install` command shown in the error message. If the dependency's marketplace is not yet configured, add it with `claude plugin marketplace add` and Claude Code resolves the dependency automatically. If the dependency is disabled, enable it. |
| `range-conflict`                 | The version requirements for a dependency cannot be combined. The error message names the cause: no version satisfies all of the ranges, a range is not valid semver syntax, or the combined ranges are too complex to intersect. | Uninstall or update one of the conflicting plugins, fix any invalid `version` string, simplify long `\|\|` chains, or ask the upstream author to widen its constraint.                                                                                                  |
| `dependency-version-unsatisfied` | The installed dependency's version is outside this plugin's declared range.                                                                                                                                                       | Run `claude plugin install <dependency>@<marketplace>` to re-resolve the dependency against all current constraints.                                                                                                                                                    |
| `no-matching-tag`                | The dependency's repository has no `{name}--v*` tag satisfying the range.                                                                                                                                                         | Check that the upstream has tagged releases using the convention above, or relax your range.                                                                                                                                                                            |

To check for these errors programmatically, run `claude plugin list --json` and read the `errors` field on each plugin.

## See also

* [Create plugins](/docs/en/plugins): build plugins with skills, agents, and hooks
* [Create and distribute a plugin marketplace](/docs/en/plugin-marketplaces): host plugins for your team
* [Plugins reference](/docs/en/plugins-reference#plugin-manifest-schema): the full `plugin.json` schema
* [Version management](/docs/en/plugins-reference#version-management): how a plugin's own version is resolved and used as the cache key


---

## Recommend your plugin from your CLI

`https://code.claude.com/docs/en/plugin-hints`

Emit a one-line marker from your CLI so Claude Code prompts users to install your official plugin.

If you maintain a CLI or SDK and have a plugin in the official Anthropic marketplace, your tool can prompt Claude Code users to install that plugin. Your CLI writes a one-line marker to stderr when it detects it is running inside Claude Code. Claude Code reads the marker, strips it from the output, and shows the user a one-time install prompt.

Claude Code strips the hint line from the command output before sending it to the model, so the marker never appears in the conversation and is not counted toward token usage. The protocol requires no extra commands and does not change what your CLI prints for users outside Claude Code.

This page is for CLI and SDK maintainers. If you are looking to install plugins, see [Discover and install plugins](/docs/en/discover-plugins).

## How it works

Claude Code sets the [`CLAUDECODE`](/docs/en/env-vars) environment variable to `1` for every command it runs through the Bash and PowerShell tools, and for [hook](/docs/en/hooks) commands. When your CLI sees that variable, it writes a self-closing `<claude-code-hint />` tag to stderr. In hook commands the hint tag is stripped and ignored. Only Bash and PowerShell tool output triggers the install prompt.

When Claude Code receives the command output, it:

1. Scans for hint lines and removes them before the output reaches the model
2. Checks that the hint targets a plugin in an official Anthropic marketplace
3. Checks that the plugin is not already installed and has not been prompted before
4. Shows the user an install prompt that names the command that emitted the hint

Claude Code never installs a plugin automatically. The user always confirms.

## Emit the hint

Gate emission on the `CLAUDECODE` environment variable so the marker never appears in a human user's terminal. Then write the tag to stderr on its own line.

The following examples emit a hint for a plugin named `example-cli` in the official marketplace:

<CodeGroup>
  ```javascript Node.js theme={null}
  if (process.env.CLAUDECODE) {
    process.stderr.write(
      '<claude-code-hint v="1" type="plugin" value="example-cli@claude-plugins-official" />\n',
    )
  }
  ```

  ```python Python theme={null}
  import os, sys

  if os.environ.get("CLAUDECODE"):
      print(
          '<claude-code-hint v="1" type="plugin" value="example-cli@claude-plugins-official" />',
          file=sys.stderr,
      )
  ```

  ```go Go theme={null}
  if os.Getenv("CLAUDECODE") != "" {
      fmt.Fprintln(os.Stderr,
          `<claude-code-hint v="1" type="plugin" value="example-cli@claude-plugins-official" />`)
  }
  ```

  ```shell Shell theme={null}
  [ -n "$CLAUDECODE" ] &&
    printf '%s\n' '<claude-code-hint v="1" type="plugin" value="example-cli@claude-plugins-official" />' >&2
  ```
</CodeGroup>

Replace `example-cli` with your plugin's name in the official marketplace.

## Choose where to emit

You control which code paths emit the hint. Claude Code deduplicates by plugin, so emitting on every invocation has no downside. Touchpoints that work well include:

| Placement                 | Why it works                                               |
| :------------------------ | :--------------------------------------------------------- |
| `--help` output           | Claude often runs help when exploring an unfamiliar CLI    |
| Unknown-subcommand errors | Reaches the moment Claude is confused about your interface |
| Login or auth success     | The user is already in a setup mindset                     |
| First-run welcome message | A natural onboarding moment                                |

## What the user sees

When the hint passes all checks, Claude Code shows a prompt like the following:

```text theme={null}
─────────────────────────────────────────────────────────────
  Plugin Recommendation

    The example-cli command suggests installing a plugin.

    Plugin: example-cli
    Marketplace: claude-plugins-official
    Official integration for example-cli deployments

    Would you like to install it?
    ❯ 1. Yes, install example-cli
      2. No
      3. No, and don't show plugin installation hints again

─────────────────────────────────────────────────────────────
```

The prompt names the command that produced the hint so users can spot a mismatch between the tool and the plugin it recommends. If the user does not respond within 30 seconds, the prompt dismisses as **No**.

Prompt frequency is bounded:

* **Once per plugin**: after the prompt is shown, Claude Code records the plugin and never prompts for it again, regardless of the user's answer.
* **Once per session**: across all CLIs on the machine, at most one hint prompt appears per Claude Code session.

Selecting **Yes** installs the plugin to user scope. Selecting **No, and don't show plugin installation hints again** disables all future hint prompts for the user.

## Hint format

The hint is a self-closing tag with three required attributes.

```text theme={null}
<claude-code-hint v="1" type="plugin" value="example-cli@claude-plugins-official" />
```

| Attribute | Required | Description                                       |
| :-------- | :------- | :------------------------------------------------ |
| `v`       | Yes      | Protocol version. `1` is the only supported value |
| `type`    | Yes      | Hint kind. `plugin` is the only supported value   |
| `value`   | Yes      | Plugin identifier in `name@marketplace` form      |

Attribute values may be quoted with double quotes or left unquoted. Unquoted values cannot contain whitespace. Escape sequences are not supported.

## Requirements

Claude Code enforces two conditions before acting on a hint. Hints that fail either check are dropped:

* **Own line**: the tag must occupy its own line. A tag embedded mid-line, for example inside a log statement, is ignored. Leading and trailing whitespace on the line is allowed.
* **Official marketplace**: the `value` must reference a plugin in an Anthropic-controlled marketplace such as `claude-plugins-official`. Hints that point to other marketplaces are silently dropped.

The hint line is always removed from the output before it reaches the model, even when the version or type is unrecognized, so the marker is never counted toward token usage.

The remaining guidance is recommended but not enforced. Claude Code cannot observe whether your CLI follows it:

* **Write to stderr**: stderr keeps the tag out of shell pipelines such as `example-cli deploy | jq`. Claude Code scans both streams, so stdout also works.
* **Gate on `CLAUDECODE`**: only emit when the `CLAUDECODE` environment variable is set. This prevents the marker from appearing to users running your CLI directly.

## Get your plugin into the official marketplace

The hint protocol only takes effect for plugins listed in the official Anthropic marketplace, `claude-plugins-official`. Anthropic curates that marketplace at its discretion, and the in-app submission forms add plugins to the [community marketplace](/docs/en/plugins#submit-your-plugin-to-the-community-marketplace) instead, which the hint protocol does not check. If you are working with an Anthropic partner contact, reach out to them to coordinate an official-marketplace listing.

## See also

* [Create plugins](/docs/en/plugins): build the plugin your CLI recommends
* [Create and distribute a plugin marketplace](/docs/en/plugin-marketplaces): host plugins outside the official marketplace
* [Environment variables](/docs/en/env-vars): full reference for `CLAUDECODE` and related variables


---

## Discover and install prebuilt plugins through marketplaces

`https://code.claude.com/docs/en/discover-plugins`

Find and install plugins from marketplaces to extend Claude Code with new skills, agents, and capabilities.

Plugins extend Claude Code with skills, agents, hooks, and MCP servers. Plugin marketplaces are catalogs that help you discover and install these extensions without building them yourself.

Looking to create and distribute your own marketplace? See [Create and distribute a plugin marketplace](/docs/en/plugin-marketplaces).

## How marketplaces work

A marketplace is a catalog of plugins that someone else has created and shared. Using a marketplace is a two-step process:

<Steps>
  <Step title="Add the marketplace">
    This registers the catalog with Claude Code so you can browse what's available. No plugins are installed yet.
  </Step>

  <Step title="Install individual plugins">
    Browse the catalog and install the plugins you want.
  </Step>
</Steps>

Think of it like adding an app store: adding the store gives you access to browse its collection, but you still choose which apps to download individually.

## Official Anthropic marketplace

The official Anthropic marketplace (`claude-plugins-official`) is automatically available when you start Claude Code. Run `/plugin` and go to the **Discover** tab to browse what's available, or view the catalog at [claude.com/plugins](https://claude.com/plugins).

To install a plugin from the official marketplace, use `/plugin install <name>@claude-plugins-official`. For example, to install the GitHub integration:

```shell theme={null}
/plugin install github@claude-plugins-official
```

If Claude Code reports that the plugin is not found in any marketplace, your marketplace is either missing or outdated. Run `/plugin marketplace update claude-plugins-official` to refresh it, or `/plugin marketplace add anthropics/claude-plugins-official` if you haven't added it before. Then retry the install.

<Note>
  The official marketplace is curated by Anthropic, and inclusion is at Anthropic's discretion. The in-app submission forms add plugins to the [community marketplace](#community-marketplace), not the official one. To distribute plugins independently, [create your own marketplace](/docs/en/plugin-marketplaces) and share it with users.
</Note>

The official marketplace includes several categories of plugins:

### Code intelligence

Code intelligence plugins enable Claude Code's built-in LSP tool, giving Claude the ability to jump to definitions, find references, and see type errors immediately after edits. These plugins configure [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) connections, the same technology that powers VS Code's code intelligence.

These plugins require the language server binary to be installed on your system. If you already have a language server installed, Claude may prompt you to install the corresponding plugin when you open a project.

| Language   | Plugin              | Binary required              |
| :--------- | :------------------ | :--------------------------- |
| C/C++      | `clangd-lsp`        | `clangd`                     |
| C#         | `csharp-lsp`        | `csharp-ls`                  |
| Go         | `gopls-lsp`         | `gopls`                      |
| Java       | `jdtls-lsp`         | `jdtls`                      |
| Kotlin     | `kotlin-lsp`        | `kotlin-language-server`     |
| Lua        | `lua-lsp`           | `lua-language-server`        |
| PHP        | `php-lsp`           | `intelephense`               |
| Python     | `pyright-lsp`       | `pyright-langserver`         |
| Rust       | `rust-analyzer-lsp` | `rust-analyzer`              |
| Swift      | `swift-lsp`         | `sourcekit-lsp`              |
| TypeScript | `typescript-lsp`    | `typescript-language-server` |

You can also [create your own LSP plugin](/docs/en/plugins-reference#lsp-servers) for other languages.

<Note>
  If you see `Executable not found in $PATH` in the `/plugin` Errors tab after installing a plugin, install the required binary from the table above.
</Note>

#### What Claude gains from code intelligence plugins

Once a code intelligence plugin is installed and its language server binary is available, Claude gains two capabilities:

* **Automatic diagnostics**: after every file edit Claude makes, the language server analyzes the changes and reports errors and warnings back automatically. Claude sees type errors, missing imports, and syntax issues without needing to run a compiler or linter. If Claude introduces an error, it notices and fixes the issue in the same turn. This requires no configuration beyond installing the plugin. You can see diagnostics inline by pressing **Ctrl+O** when the "diagnostics found" indicator appears.
* **Code navigation**: Claude can use the language server to jump to definitions, find references, get type info on hover, list symbols, find implementations, and trace call hierarchies. These operations give Claude more precise navigation than grep-based search, though availability may vary by language and environment.

If you run into issues, see [Code intelligence troubleshooting](#code-intelligence-issues).

### External integrations

These plugins bundle pre-configured [MCP servers](/docs/en/mcp) so you can connect Claude to external services without manual setup:

* **Source control**: `github`, `gitlab`
* **Project management**: `atlassian` (Jira/Confluence), `asana`, `linear`, `notion`
* **Design**: `figma`
* **Infrastructure**: `vercel`, `firebase`, `supabase`
* **Communication**: `slack`
* **Monitoring**: `sentry`

### Automatic security review

The `security-guidance` plugin reviews each change Claude makes for common vulnerabilities and instructs Claude to fix what it finds in the same session. See [Catch security issues as Claude writes code](/docs/en/security-guidance) for what it checks and how to add project-specific rules.

### Development workflows

Plugins that add skills and agents for common development tasks:

* **commit-commands**: Git commit workflows including commit, push, and PR creation
* **pr-review-toolkit**: Specialized agents for reviewing pull requests
* **agent-sdk-dev**: Tools for building with the Claude Agent SDK
* **plugin-dev**: Toolkit for creating your own plugins

### Output styles

Customize how Claude responds:

* **explanatory-output-style**: Educational insights about implementation choices
* **learning-output-style**: Interactive learning mode for skill building

## Community marketplace

The community marketplace at [`anthropics/claude-plugins-community`](https://github.com/anthropics/claude-plugins-community) hosts third-party plugins that have passed Anthropic's automated validation and safety screening. Each plugin is pinned to a specific commit SHA in the catalog. Unlike the official marketplace, you add it manually:

```shell theme={null}
/plugin marketplace add anthropics/claude-plugins-community
```

Then install plugins from it using the `claude-community` marketplace name:

```shell theme={null}
/plugin install <plugin-name>@claude-community
```

To submit your own plugin to the community marketplace, see [Submit your plugin to the community marketplace](/docs/en/plugins#submit-your-plugin-to-the-community-marketplace) in the create-plugins guide.

## Try it: add the demo marketplace

Anthropic also maintains a [demo plugins marketplace](https://github.com/anthropics/claude-code/tree/main/plugins) (`claude-code-plugins`) with example plugins that show what's possible with the plugin system. Unlike the official marketplace, you need to add this one manually.

<Steps>
  <Step title="Add the marketplace">
    From within Claude Code, run the `plugin marketplace add` command for the `anthropics/claude-code` marketplace:

    ```shell theme={null}
    /plugin marketplace add anthropics/claude-code
    ```

    This downloads the marketplace catalog and makes its plugins available to you.
  </Step>

  <Step title="Browse available plugins">
    Run `/plugin` to open the plugin manager. This opens a tabbed interface with four tabs you can cycle through using **Tab** (or **Shift+Tab** to go backward):

    * **Discover**: browse available plugins from all your marketplaces
    * **Installed**: view and manage your installed plugins
    * **Marketplaces**: add, remove, or update your added marketplaces
    * **Errors**: view any plugin loading errors

    Go to the **Discover** tab to see plugins from the marketplace you just added. Plugins marked as relevant to your current working directory are pinned at the top with a **suggested for this directory** label.
  </Step>

  <Step title="Install a plugin">
    Select a plugin to view its details. The details pane shows what the plugin contains and what it costs:

    * A **Context cost** estimate so you can see how many tokens the plugin will add to your [context window](/docs/en/features-overview#understand-context-costs) every turn (Claude Code v2.1.143 and later)
    * The plugin's **Last updated** date (v2.1.144 and later)
    * A **Will install** section listing the plugin's commands, agents, skills, hooks, and MCP and LSP servers, so you can review exactly what it adds before installing (v2.1.145 and later)

    Choose an installation scope:

    * **User scope**: install for yourself across all projects
    * **Project scope**: install for all collaborators on this repository
    * **Local scope**: install for yourself in this repository only

    For example, select **commit-commands** (a plugin that adds git workflow skills) and install it to your user scope.

    You can also install directly from the command line:

    ```shell theme={null}
    /plugin install commit-commands@claude-code-plugins
    ```

    See [Configuration scopes](/docs/en/settings#configuration-scopes) to learn more about scopes.
  </Step>

  <Step title="Use your new plugin">
    After installing, run `/reload-plugins` to activate the plugin. Plugin skills are namespaced by the plugin name, so **commit-commands** provides skills like `/commit-commands:commit`.

    Try it out by making a change to a file and running:

    ```shell theme={null}
    /commit-commands:commit
    ```

    This stages your changes, generates a commit message, and creates the commit.

    Each plugin works differently. Check the plugin's details in the **Discover** tab to see the commands and skills it provides, or visit its homepage for usage guidance.
  </Step>
</Steps>

The rest of this guide covers all the ways you can add marketplaces, install plugins, and manage your configuration.

## Add marketplaces

Use the `/plugin marketplace add` command to add marketplaces from different sources.

<Tip>
  **Shortcuts**: You can use `/plugin market` instead of `/plugin marketplace`, and `rm` instead of `remove`.
</Tip>

* **GitHub repositories**: `owner/repo` format (for example, `anthropics/claude-code`)
* **Git URLs**: any git repository URL (GitLab, Bitbucket, self-hosted)
* **Local paths**: directories or direct paths to `marketplace.json` files
* **Remote URLs**: direct URLs to hosted `marketplace.json` files

### Add from GitHub

Add a GitHub repository that contains a `.claude-plugin/marketplace.json` file using the `owner/repo` format—where `owner` is the GitHub username or organization and `repo` is the repository name.

For example, `anthropics/claude-code` refers to the `claude-code` repository owned by `anthropics`:

```shell theme={null}
/plugin marketplace add anthropics/claude-code
```

### Add from other Git hosts

Add any git repository by providing the full URL. This works with any Git host, including GitLab, Bitbucket, and self-hosted servers. Include the `.git` suffix so Claude Code clones the repository rather than treating the URL as a direct link to a hosted `marketplace.json` file.

Using HTTPS:

```shell theme={null}
/plugin marketplace add https://gitlab.com/company/plugins.git
```

Using SSH:

```shell theme={null}
/plugin marketplace add git@gitlab.com:company/plugins.git
```

To add a specific branch or tag, append `#` followed by the ref:

```shell theme={null}
/plugin marketplace add https://gitlab.com/company/plugins.git#v1.0.0
```

### Add from local paths

Add a local directory that contains a `.claude-plugin/marketplace.json` file:

```shell theme={null}
/plugin marketplace add ./my-marketplace
```

You can also add a direct path to a `marketplace.json` file:

```shell theme={null}
/plugin marketplace add ./path/to/marketplace.json
```

### Add from remote URLs

Add a remote `marketplace.json` file via URL:

```shell theme={null}
/plugin marketplace add https://example.com/marketplace.json
```

<Note>
  URL-based marketplaces have some limitations compared to Git-based marketplaces. If you encounter "path not found" errors when installing plugins, see [Troubleshooting](/docs/en/plugin-marketplaces#plugins-with-relative-paths-fail-in-url-based-marketplaces).
</Note>

## Install plugins

Once you've added marketplaces, you can install plugins directly (installs to user scope by default):

```shell theme={null}
/plugin install plugin-name@marketplace-name
```

To choose a different [installation scope](/docs/en/settings#configuration-scopes), use the interactive UI: run `/plugin`, go to the **Discover** tab, and press **Enter** on a plugin. You'll see options for:

* **User scope** (default): install for yourself across all projects
* **Project scope**: install for all collaborators on this repository (adds to `.claude/settings.json`)
* **Local scope**: install for yourself in this repository only (not shared with collaborators)

You may also see plugins with **managed** scope—these are installed by administrators via [managed settings](/docs/en/settings#settings-files) and cannot be modified.

<Warning>
  Make sure you trust a plugin before installing it. Anthropic does not control what MCP servers, files, or other software are included in plugins and cannot verify that they work as intended. Check each plugin's homepage for more information.
</Warning>

## Manage installed plugins

Run `/plugin` and go to the **Installed** tab to view, enable, disable, or uninstall your plugins. The list is grouped by scope and sorted so you see problems first: plugins with load errors or unresolved dependencies appear at the top, followed by your favorites, with disabled plugins folded behind a collapsed header at the bottom.

From the list you can:

* press `f` to favorite or unfavorite the selected plugin
* type to filter by plugin name or description
* press Enter to open a plugin's detail view and enable, disable, or uninstall it

When you install a plugin that declares dependencies, the install output lists which dependencies were auto-installed alongside it.

You can also manage plugins with direct commands.

Disable a plugin without uninstalling:

```shell theme={null}
/plugin disable plugin-name@marketplace-name
```

Re-enable a disabled plugin:

```shell theme={null}
/plugin enable plugin-name@marketplace-name
```

Completely remove a plugin:

```shell theme={null}
/plugin uninstall plugin-name@marketplace-name
```

The `--scope` option lets you target a specific scope with CLI commands:

```shell theme={null}
claude plugin install formatter@your-org --scope project
claude plugin uninstall formatter@your-org --scope project
```

### Apply plugin changes without restarting

When you install, enable, or disable plugins during a session, run `/reload-plugins` to pick up all changes without restarting:

```shell theme={null}
/reload-plugins
```

Claude Code reloads all active plugins and shows counts for plugins, skills, agents, hooks, plugin MCP servers, and plugin LSP servers.

## Manage marketplaces

You can manage marketplaces through the interactive `/plugin` interface or with CLI commands.

### Use the interactive interface

Run `/plugin` and go to the **Marketplaces** tab to:

* View all your added marketplaces with their sources and status
* Add new marketplaces
* Update marketplace listings to fetch the latest plugins
* Remove marketplaces you no longer need

### Use CLI commands

You can also manage marketplaces with direct commands.

List all configured marketplaces:

```shell theme={null}
/plugin marketplace list
```

Refresh plugin listings from a marketplace:

```shell theme={null}
/plugin marketplace update marketplace-name
```

Remove a marketplace:

```shell theme={null}
/plugin marketplace remove marketplace-name
```

<Warning>
  Removing a marketplace will uninstall any plugins you installed from it.
</Warning>

### Configure auto-updates

Claude Code can automatically update marketplaces and their installed plugins at startup. When auto-update is enabled for a marketplace, Claude Code refreshes the marketplace data and updates installed plugins to their latest versions. If any plugins were updated, you'll see a notification prompting you to run `/reload-plugins`.

Toggle auto-update for individual marketplaces through the UI:

1. Run `/plugin` to open the plugin manager
2. Select **Marketplaces**
3. Choose a marketplace from the list
4. Select **Enable auto-update** or **Disable auto-update**

Official Anthropic marketplaces have auto-update enabled by default. Third-party and local development marketplaces have auto-update disabled by default.

Administrators can also set `"autoUpdate": true` on each [`extraKnownMarketplaces`](/docs/en/settings#extraknownmarketplaces) entry in managed settings to enable auto-update for an organization marketplace without requiring each user to toggle it.

To disable all automatic updates entirely for both Claude Code and all plugins, set the `DISABLE_AUTOUPDATER` environment variable. See [Auto updates](/docs/en/setup#auto-updates) for details.

To keep plugin auto-updates enabled while disabling Claude Code auto-updates, set `FORCE_AUTOUPDATE_PLUGINS=1` along with `DISABLE_AUTOUPDATER`:

```bash theme={null}
export DISABLE_AUTOUPDATER=1
export FORCE_AUTOUPDATE_PLUGINS=1
```

This is useful when you want to manage Claude Code updates manually but still receive automatic plugin updates.

## Configure team marketplaces

Team admins can set up automatic marketplace installation for projects by adding marketplace configuration to `.claude/settings.json`. When team members trust the repository folder, Claude Code prompts them to install these marketplaces and plugins.

Add `extraKnownMarketplaces` to your project's `.claude/settings.json`:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "my-team-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  }
}
```

For full configuration options including `extraKnownMarketplaces` and `enabledPlugins`, see [Plugin settings](/docs/en/settings#plugin-settings).

## Security

Plugins and marketplaces are highly trusted components that can execute arbitrary code on your machine with your user privileges. Only install plugins and add marketplaces from sources you trust. Organizations can restrict which marketplaces users are allowed to add using [managed marketplace restrictions](/docs/en/plugin-marketplaces#managed-marketplace-restrictions).

## Troubleshooting

### /plugin command not recognized

If you see "unknown command" or the `/plugin` command doesn't appear:

1. **Check your version**: Run `claude --version` to see what's installed.
2. **Update Claude Code**:
   * **Homebrew**: `brew upgrade claude-code` (or `brew upgrade claude-code@latest` if you installed that cask)
   * **npm**: `npm install -g @anthropic-ai/claude-code@latest`
   * **Native installer**: Re-run the install command from [Setup](/docs/en/setup)
3. **Restart Claude Code**: After updating, restart your terminal and run `claude` again.

### Common issues

* **Marketplace not loading**: Verify the URL is accessible and that `.claude-plugin/marketplace.json` exists at the path
* **Plugin installation failures**: Check that plugin source URLs are accessible and repositories are public (or you have access)
* **Files not found after installation**: Plugins are copied to a cache, so paths referencing files outside the plugin directory won't work
* **Plugin skills not appearing**: Clear the cache with `rm -rf ~/.claude/plugins/cache`, restart Claude Code, and reinstall the plugin.

For detailed troubleshooting with solutions, see [Troubleshooting](/docs/en/plugin-marketplaces#troubleshooting) in the marketplace guide. For debugging tools, see [Debugging and development tools](/docs/en/plugins-reference#debugging-and-development-tools).

### Code intelligence issues

* **Language server not starting**: verify the binary is installed and available in your `$PATH`. Check the `/plugin` Errors tab for details.
* **High memory usage**: language servers like `rust-analyzer` and `pyright` can consume significant memory on large projects. If you experience memory issues, disable the plugin with `/plugin disable <plugin-name>` and rely on Claude's built-in search tools instead.
* **False positive diagnostics in monorepos**: language servers may report unresolved import errors for internal packages if the workspace isn't configured correctly. These don't affect Claude's ability to edit code.

## Next steps

* **Build your own plugins**: See [Plugins](/docs/en/plugins) to create skills, agents, and hooks
* **Create a marketplace**: See [Create a plugin marketplace](/docs/en/plugin-marketplaces) to distribute plugins to your team or community
* **Technical reference**: See [Plugins reference](/docs/en/plugins-reference) for complete specifications


---

## Create and distribute a plugin marketplace

`https://code.claude.com/docs/en/plugin-marketplaces`

Build and host plugin marketplaces to distribute Claude Code extensions across teams and communities.

A **plugin marketplace** is a catalog that lets you distribute plugins to others. Marketplaces provide centralized discovery, version tracking, automatic updates, and support for multiple source types (git repositories, local paths, and more). This guide shows you how to create your own marketplace to share plugins with your team or community.

Looking to install plugins from an existing marketplace? See [Discover and install prebuilt plugins](/docs/en/discover-plugins).

## Overview

Creating and distributing a marketplace involves:

1. **Creating plugins**: build one or more plugins with skills, agents, hooks, MCP servers, or LSP servers. This guide assumes you already have plugins to distribute; see [Create plugins](/docs/en/plugins) for details on how to create them.
2. **Creating a marketplace file**: define a `marketplace.json` that lists your plugins and where to find them (see [Create the marketplace file](#create-the-marketplace-file)).
3. **Host the marketplace**: push to GitHub, GitLab, or another git host (see [Host and distribute marketplaces](#host-and-distribute-marketplaces)).
4. **Share with users**: users add your marketplace with `/plugin marketplace add` and install individual plugins (see [Discover and install plugins](/docs/en/discover-plugins)).

Once your marketplace is live, you can update it by pushing changes to your repository. Users refresh their local copy with `/plugin marketplace update`.

## Walkthrough: create a local marketplace

This example creates a marketplace with one plugin: a `quality-review` skill for code reviews. You'll create the directory structure, add a skill, create the plugin manifest and marketplace catalog, then install and test it.

<Steps>
  <Step title="Create the directory structure">
    ```bash theme={null}
    mkdir -p my-marketplace/.claude-plugin
    mkdir -p my-marketplace/plugins/quality-review-plugin/.claude-plugin
    mkdir -p my-marketplace/plugins/quality-review-plugin/skills/quality-review
    ```
  </Step>

  <Step title="Create the skill">
    Create a `SKILL.md` file that defines what the `quality-review` skill does.

    ```markdown my-marketplace/plugins/quality-review-plugin/skills/quality-review/SKILL.md theme={null}
    ---
    description: Review code for bugs, security, and performance
    disable-model-invocation: true
    ---

    Review the code I've selected or the recent changes for:
    - Potential bugs or edge cases
    - Security concerns
    - Performance issues
    - Readability improvements

    Be concise and actionable.
    ```
  </Step>

  <Step title="Create the plugin manifest">
    Create a `plugin.json` file that describes the plugin. The manifest goes in the `.claude-plugin/` directory.

    ```json my-marketplace/plugins/quality-review-plugin/.claude-plugin/plugin.json theme={null}
    {
      "name": "quality-review-plugin",
      "description": "Adds a quality-review skill for quick code reviews",
      "version": "1.0.0"
    }
    ```

    <Note>
      Setting `version` means users only receive updates when you change this field, so bump it on every release. If you omit `version` and host this marketplace in git, every commit automatically counts as a new version. See [Version resolution](#version-resolution-and-release-channels) to choose the right approach.
    </Note>
  </Step>

  <Step title="Create the marketplace file">
    Create the marketplace catalog that lists your plugin.

    ```json my-marketplace/.claude-plugin/marketplace.json theme={null}
    {
      "name": "my-plugins",
      "owner": {
        "name": "Your Name"
      },
      "plugins": [
        {
          "name": "quality-review-plugin",
          "source": "./plugins/quality-review-plugin",
          "description": "Adds a quality-review skill for quick code reviews"
        }
      ]
    }
    ```
  </Step>

  <Step title="Add and install">
    Add the marketplace and install the plugin.

    ```shell theme={null}
    /plugin marketplace add ./my-marketplace
    /plugin install quality-review-plugin@my-plugins
    ```
  </Step>

  <Step title="Try it out">
    Select some code in your editor and run your new skill. Plugin skills are namespaced with the plugin name.

    ```shell theme={null}
    /quality-review-plugin:quality-review
    ```
  </Step>
</Steps>

To learn more about what plugins can do, including hooks, agents, MCP servers, and LSP servers, see [Plugins](/docs/en/plugins).

<Note>
  **How plugins are installed**: When users install a plugin, Claude Code copies the plugin directory to a cache location. This means plugins can't reference files outside their directory using paths like `../shared-utils`, because those files won't be copied.

  If you need to share files across plugins, use symlinks. See [Plugin caching and file resolution](/docs/en/plugins-reference#plugin-caching-and-file-resolution) for details.
</Note>

## Create the marketplace file

Create `.claude-plugin/marketplace.json` in your repository root. This file defines your marketplace's name, owner information, and a list of plugins with their sources.

Each plugin entry needs at minimum a `name` and `source` (where to fetch it from). See the [full schema](#marketplace-schema) below for all available fields.

```json theme={null}
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0",
      "author": {
        "name": "DevTools Team"
      }
    },
    {
      "name": "deployment-tools",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation tools"
    }
  ]
}
```

## Marketplace schema

### Required fields

| Field     | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                           | Example        |
| :-------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| `name`    | string | Marketplace identifier (kebab-case, no spaces). This is public-facing: users see it when installing plugins (for example, `/plugin install my-tool@your-marketplace`). Each user can register only one marketplace per name: adding a second marketplace with the same name replaces the first. To publish multiple plugins under one marketplace name, list them all in a [single `marketplace.json`](#create-the-marketplace-file). | `"acme-tools"` |
| `owner`   | object | Marketplace maintainer information ([see fields below](#owner-fields))                                                                                                                                                                                                                                                                                                                                                                |                |
| `plugins` | array  | List of available plugins                                                                                                                                                                                                                                                                                                                                                                                                             | See below      |

<Note>
  **Reserved names**: The following marketplace names are reserved for official Anthropic use and cannot be used by third-party marketplaces: `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, `agent-skills`, `anthropic-agent-skills`, `knowledge-work-plugins`, `life-sciences`, `claude-for-legal`, `claude-for-financial-services`, `financial-services-plugins`. Names that impersonate official marketplaces, such as `official-claude-plugins` or `anthropic-tools-v2`, are also blocked.
</Note>

### Owner fields

| Field   | Type   | Required | Description                      |
| :------ | :----- | :------- | :------------------------------- |
| `name`  | string | Yes      | Name of the maintainer or team   |
| `email` | string | No       | Contact email for the maintainer |

### Optional fields

| Field                                 | Type   | Description                                                                                                                                                                                                                                                        |
| :------------------------------------ | :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema`                             | string | JSON Schema URL for editor autocomplete and validation. Claude Code ignores this field at load time.                                                                                                                                                               |
| `description`                         | string | Brief marketplace description                                                                                                                                                                                                                                      |
| `version`                             | string | Marketplace manifest version                                                                                                                                                                                                                                       |
| `metadata.pluginRoot`                 | string | Base directory prepended to relative plugin source paths (for example, `"./plugins"` lets you write `"source": "formatter"` instead of `"source": "./plugins/formatter"`)                                                                                          |
| `allowCrossMarketplaceDependenciesOn` | array  | Other marketplaces that plugins in this marketplace may depend on. Dependencies from a marketplace not listed here are blocked at install. See [Depend on a plugin from another marketplace](/docs/en/plugin-dependencies#depend-on-a-plugin-from-another-marketplace). |

`description` and `version` are also accepted under `metadata` for backward compatibility.

## Plugin entries

Each plugin entry in the `plugins` array describes a plugin and where to find it. You can include any field from the [plugin manifest schema](/docs/en/plugins-reference#plugin-manifest-schema) (like `description`, `version`, `author`, `commands`, `hooks`, etc.), plus these marketplace-specific fields: `source`, `category`, `tags`, and `strict`.

### Required fields

| Field    | Type           | Description                                                                                                                                            |
| :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`   | string         | Plugin identifier (kebab-case, no spaces). This is public-facing: users see it when installing (for example, `/plugin install my-plugin@marketplace`). |
| `source` | string\|object | Where to fetch the plugin from (see [Plugin sources](#plugin-sources) below)                                                                           |

### Optional plugin fields

**Standard metadata fields:**

| Field            | Type    | Description                                                                                                                                                                                                                                                                                                        |
| :--------------- | :------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `displayName`    | string  | Human-readable name shown in UI surfaces. Falls back to `name` when omitted. May contain spaces and any casing. Not used for namespacing or lookup. Requires Claude Code v2.1.143 or later.                                                                                                                        |
| `description`    | string  | Brief plugin description                                                                                                                                                                                                                                                                                           |
| `version`        | string  | Plugin version. If set (here or in `plugin.json`), the plugin is pinned to this string and users only receive updates when it changes. Omit to fall back to the git commit SHA. See [Version resolution](#version-resolution-and-release-channels).                                                                |
| `author`         | object  | Plugin author information (`name` required, `email` optional)                                                                                                                                                                                                                                                      |
| `homepage`       | string  | Plugin homepage or documentation URL                                                                                                                                                                                                                                                                               |
| `repository`     | string  | Source code repository URL                                                                                                                                                                                                                                                                                         |
| `license`        | string  | SPDX license identifier (for example, MIT, Apache-2.0)                                                                                                                                                                                                                                                             |
| `keywords`       | array   | Tags for plugin discovery and categorization                                                                                                                                                                                                                                                                       |
| `category`       | string  | Plugin category for organization                                                                                                                                                                                                                                                                                   |
| `tags`           | array   | Tags for searchability                                                                                                                                                                                                                                                                                             |
| `strict`         | boolean | Controls whether `plugin.json` is the authority for component definitions (default: true). See [Strict mode](#strict-mode) below.                                                                                                                                                                                  |
| `defaultEnabled` | boolean | Whether the plugin is enabled after install (default: true). Set to `false` to install the plugin disabled until the user opts in. Takes precedence over the same field in the plugin's `plugin.json`. See [Default enablement](/docs/en/plugins-reference#default-enablement). Requires Claude Code v2.1.154 or later. |

**Component configuration fields:**

| Field        | Type           | Description                                                    |
| :----------- | :------------- | :------------------------------------------------------------- |
| `skills`     | string\|array  | Custom paths to skill directories containing `<name>/SKILL.md` |
| `commands`   | string\|array  | Custom paths to flat `.md` skill files or directories          |
| `agents`     | string\|array  | Custom paths to agent files                                    |
| `hooks`      | string\|object | Custom hooks configuration or path to hooks file               |
| `mcpServers` | string\|object | MCP server configurations or path to MCP config                |
| `lspServers` | string\|object | LSP server configurations or path to LSP config                |

## Plugin sources

Plugin sources tell Claude Code where to fetch each individual plugin listed in your marketplace. These are set in the `source` field of each plugin entry in `marketplace.json`.

Once a plugin is cloned or copied into the local machine, it is copied into the local versioned plugin cache at `~/.claude/plugins/cache`.

| Source        | Type                            | Fields                             | Notes                                                                                                                                             |
| ------------- | ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relative path | `string` (e.g. `"./my-plugin"`) | none                               | Local directory within the marketplace repo. Must start with `./`. Resolved relative to the marketplace root, not the `.claude-plugin/` directory |
| `github`      | object                          | `repo`, `ref?`, `sha?`             |                                                                                                                                                   |
| `url`         | object                          | `url`, `ref?`, `sha?`              | Git URL source                                                                                                                                    |
| `git-subdir`  | object                          | `url`, `path`, `ref?`, `sha?`      | Subdirectory within a git repo. Clones sparsely to minimize bandwidth for monorepos                                                               |
| `npm`         | object                          | `package`, `version?`, `registry?` | Installed via `npm install`                                                                                                                       |

<Note>
  **Marketplace sources vs plugin sources**: These are different concepts that control different things.

  * **Marketplace source** — where to fetch the `marketplace.json` catalog itself. Set when users run `/plugin marketplace add` or in `extraKnownMarketplaces` settings. Supports `ref` (branch/tag) but not `sha`.
  * **Plugin source** — where to fetch an individual plugin listed in the marketplace. Set in the `source` field of each plugin entry inside `marketplace.json`. Supports both `ref` (branch/tag) and `sha` (exact commit).

  For example, a marketplace hosted at `acme-corp/plugin-catalog` (marketplace source) can list a plugin fetched from `acme-corp/code-formatter` (plugin source). The marketplace source and plugin source point to different repositories and are pinned independently.
</Note>

### Relative paths

For plugins in the same repository, use a path starting with `./`:

```json theme={null}
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin"
}
```

Paths resolve relative to the marketplace root, which is the directory containing `.claude-plugin/`. In the example above, `./plugins/my-plugin` points to `<repo>/plugins/my-plugin`, even though `marketplace.json` lives at `<repo>/.claude-plugin/marketplace.json`. Do not use `../` to reference paths outside the marketplace root.

<Note>
  Relative paths only work when users add your marketplace via Git (GitHub, GitLab, or git URL). If users add your marketplace via a direct URL to the `marketplace.json` file, relative paths will not resolve correctly. For URL-based distribution, use GitHub, npm, or git URL sources instead. See [Troubleshooting](#plugins-with-relative-paths-fail-in-url-based-marketplaces) for details.
</Note>

### GitHub repositories

```json theme={null}
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo"
  }
}
```

You can pin to a specific branch, tag, or commit:

```json theme={null}
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

| Field  | Type   | Description                                                           |
| :----- | :----- | :-------------------------------------------------------------------- |
| `repo` | string | Required. GitHub repository in `owner/repo` format                    |
| `ref`  | string | Optional. Git branch or tag (defaults to repository default branch)   |
| `sha`  | string | Optional. Full 40-character git commit SHA to pin to an exact version |

### Git repositories

```json theme={null}
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git"
  }
}
```

You can pin to a specific branch, tag, or commit:

```json theme={null}
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git",
    "ref": "main",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

| Field | Type   | Description                                                                                                                                              |
| :---- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url` | string | Required. Full git repository URL (`https://` or `git@`). The `.git` suffix is optional, so Azure DevOps and AWS CodeCommit URLs without the suffix work |
| `ref` | string | Optional. Git branch or tag (defaults to repository default branch)                                                                                      |
| `sha` | string | Optional. Full 40-character git commit SHA to pin to an exact version                                                                                    |

### Git subdirectories

Use `git-subdir` to point to a plugin that lives inside a subdirectory of a git repository. Claude Code uses a sparse, partial clone to fetch only the subdirectory, minimizing bandwidth for large monorepos.

```json theme={null}
{
  "name": "my-plugin",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/acme-corp/monorepo.git",
    "path": "tools/claude-plugin"
  }
}
```

You can pin to a specific branch, tag, or commit:

```json theme={null}
{
  "name": "my-plugin",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/acme-corp/monorepo.git",
    "path": "tools/claude-plugin",
    "ref": "v2.0.0",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

The `url` field also accepts a GitHub shorthand (`owner/repo`) or SSH URLs (`git@github.com:owner/repo.git`).

| Field  | Type   | Description                                                                                              |
| :----- | :----- | :------------------------------------------------------------------------------------------------------- |
| `url`  | string | Required. Git repository URL, GitHub `owner/repo` shorthand, or SSH URL                                  |
| `path` | string | Required. Subdirectory path within the repo containing the plugin (for example, `"tools/claude-plugin"`) |
| `ref`  | string | Optional. Git branch or tag (defaults to repository default branch)                                      |
| `sha`  | string | Optional. Full 40-character git commit SHA to pin to an exact version                                    |

### npm packages

Plugins distributed as npm packages are installed using `npm install`. This works with any package on the public npm registry or a private registry your team hosts.

```json theme={null}
{
  "name": "my-npm-plugin",
  "source": {
    "source": "npm",
    "package": "@acme/claude-plugin"
  }
}
```

To pin to a specific version, add the `version` field:

```json theme={null}
{
  "name": "my-npm-plugin",
  "source": {
    "source": "npm",
    "package": "@acme/claude-plugin",
    "version": "2.1.0"
  }
}
```

To install from a private or internal registry, add the `registry` field:

```json theme={null}
{
  "name": "my-npm-plugin",
  "source": {
    "source": "npm",
    "package": "@acme/claude-plugin",
    "version": "^2.0.0",
    "registry": "https://npm.example.com"
  }
}
```

| Field      | Type   | Description                                                                                  |
| :--------- | :----- | :------------------------------------------------------------------------------------------- |
| `package`  | string | Required. Package name or scoped package (for example, `@org/plugin`)                        |
| `version`  | string | Optional. Version or version range (for example, `2.1.0`, `^2.0.0`, `~1.5.0`)                |
| `registry` | string | Optional. Custom npm registry URL. Defaults to the system npm registry (typically npmjs.org) |

### Advanced plugin entries

This example shows a plugin entry using many of the optional fields, including custom paths for commands, agents, hooks, and MCP servers:

```json theme={null}
{
  "name": "enterprise-tools",
  "source": {
    "source": "github",
    "repo": "company/enterprise-plugin"
  },
  "description": "Enterprise workflow automation tools",
  "version": "2.1.0",
  "author": {
    "name": "Enterprise Team",
    "email": "enterprise@example.com"
  },
  "homepage": "https://docs.example.com/plugins/enterprise-tools",
  "repository": "https://github.com/company/enterprise-plugin",
  "license": "MIT",
  "keywords": ["enterprise", "workflow", "automation"],
  "category": "productivity",
  "commands": [
    "./commands/core/",
    "./commands/enterprise/",
    "./commands/experimental/preview.md"
  ],
  "agents": ["./agents/security-reviewer.md", "./agents/compliance-checker.md"],
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"
          }
        ]
      }
    ]
  },
  "mcpServers": {
    "enterprise-db": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"]
    }
  },
  "strict": false
}
```

Key things to notice:

* **`commands` and `agents`**: You can specify multiple directories or individual files. Paths are relative to the plugin root.
* **`${CLAUDE_PLUGIN_ROOT}`**: use this variable in hooks and MCP server configs to reference files within the plugin's installation directory. This is necessary because plugins are copied to a cache location when installed. For dependencies or state that should survive plugin updates, use [`${CLAUDE_PLUGIN_DATA}`](/docs/en/plugins-reference#persistent-data-directory) instead.
* **`strict: false`**: Since this is set to false, the plugin doesn't need its own `plugin.json`. The marketplace entry defines everything. See [Strict mode](#strict-mode) below.

### Strict mode

The `strict` field controls whether `plugin.json` is the authority for component definitions (skills, agents, hooks, MCP servers, output styles).

| Value            | Behavior                                                                                                                                                         |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default) | `plugin.json` is the authority. The marketplace entry can supplement it with additional components, and both sources are merged.                                 |
| `false`          | The marketplace entry is the entire definition. If the plugin also has a `plugin.json` that declares components, that's a conflict and the plugin fails to load. |

**When to use each mode:**

* **`strict: true`**: the plugin has its own `plugin.json` and manages its own components. The marketplace entry can add extra skills or hooks on top. This is the default and works for most plugins.
* **`strict: false`**: the marketplace operator wants full control. The plugin repo provides raw files, and the marketplace entry defines which of those files are exposed as skills, agents, hooks, etc. Useful when the marketplace restructures or curates a plugin's components differently than the plugin author intended.

## Host and distribute marketplaces

### Host on GitHub (recommended)

GitHub provides the easiest distribution method:

1. **Create a repository**: Set up a new repository for your marketplace
2. **Add marketplace file**: Create `.claude-plugin/marketplace.json` with your plugin definitions
3. **Share with teams**: Users add your marketplace with `/plugin marketplace add owner/repo`

**Benefits**: Built-in version control, issue tracking, and team collaboration features.

### Host on other git services

Any git hosting service works, such as GitLab, Bitbucket, and self-hosted servers. Users add with the full repository URL:

```shell theme={null}
/plugin marketplace add https://gitlab.com/company/plugins.git
```

### Private repositories

Claude Code supports installing plugins from private repositories. For manual installation and updates, Claude Code uses your existing git credential helpers, so HTTPS access via `gh auth login`, macOS Keychain, or `git-credential-store` works the same as in your terminal. SSH access works as long as the host is already in your `known_hosts` file and the key is loaded in `ssh-agent`, since Claude Code suppresses interactive SSH prompts for the host fingerprint and key passphrase.

Background auto-updates run at startup without credential helpers, since interactive prompts would block Claude Code from starting. To enable auto-updates for private marketplaces, set the appropriate authentication token in your environment:

| Provider  | Environment variables        | Notes                                     |
| :-------- | :--------------------------- | :---------------------------------------- |
| GitHub    | `GITHUB_TOKEN` or `GH_TOKEN` | Personal access token or GitHub App token |
| GitLab    | `GITLAB_TOKEN` or `GL_TOKEN` | Personal access token or project token    |
| Bitbucket | `BITBUCKET_TOKEN`            | App password or repository access token   |

Set the token in your shell configuration (for example, `.bashrc`, `.zshrc`) or pass it when running Claude Code:

```bash theme={null}
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

<Note>
  For CI/CD environments, configure the token as a secret environment variable. GitHub Actions automatically provides `GITHUB_TOKEN` for repositories in the same organization.
</Note>

### Test locally before distribution

Test your marketplace locally before sharing:

```shell theme={null}
/plugin marketplace add ./my-local-marketplace
/plugin install test-plugin@my-local-marketplace
```

For the full range of add commands (GitHub, Git URLs, local paths, remote URLs), see [Add marketplaces](/docs/en/discover-plugins#add-marketplaces).

### Require marketplaces for your team

You can configure your repository so team members are automatically prompted to install your marketplace when they trust the project folder. Add your marketplace to `.claude/settings.json`:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  }
}
```

You can also specify which plugins should be enabled by default:

```json theme={null}
{
  "enabledPlugins": {
    "code-formatter@company-tools": true,
    "deployment-tools@company-tools": true
  }
}
```

For full configuration options, see [Plugin settings](/docs/en/settings#plugin-settings).

<Note>
  If you use a local `directory` or `file` source with a relative path, the path resolves against your repository's main checkout. When you run Claude Code from a git worktree, the path still points at the main checkout, so all worktrees share the same marketplace location. Marketplace state is stored once per user in `~/.claude/plugins/known_marketplaces.json`, not per project.
</Note>

### Pre-populate plugins for containers

For container images and CI environments, you can pre-populate a plugins directory at build time so Claude Code starts with marketplaces and plugins already available, without cloning anything at runtime. Set the `CLAUDE_CODE_PLUGIN_SEED_DIR` environment variable to point at this directory.

To layer multiple seed directories, separate paths with `:` on Unix or `;` on Windows. Claude Code searches each directory in order, and the first seed that contains a given marketplace or plugin cache wins.

The seed directory mirrors the structure of `~/.claude/plugins`:

```
$CLAUDE_CODE_PLUGIN_SEED_DIR/
  known_marketplaces.json
  marketplaces/<name>/...
  cache/<marketplace>/<plugin>/<version>/...
```

To build a seed directory, run Claude Code once during image build, install the plugins you need, then copy the resulting `~/.claude/plugins` directory into your image and point `CLAUDE_CODE_PLUGIN_SEED_DIR` at it.

To skip the copy step, set `CLAUDE_CODE_PLUGIN_CACHE_DIR` to your target seed path during the build so plugins install directly there:

```bash theme={null}
CLAUDE_CODE_PLUGIN_CACHE_DIR=/opt/claude-seed claude plugin marketplace add your-org/plugins
CLAUDE_CODE_PLUGIN_CACHE_DIR=/opt/claude-seed claude plugin install my-tool@your-plugins
```

Then set `CLAUDE_CODE_PLUGIN_SEED_DIR=/opt/claude-seed` in your container's runtime environment so Claude Code reads from the seed on startup.

At startup, Claude Code registers marketplaces found in the seed's `known_marketplaces.json` into the primary configuration, and uses plugin caches found under `cache/` in place without re-cloning. This works in both interactive mode and non-interactive mode with the `-p` flag.

Behavior details:

* **Read-only**: the seed directory is never written to. Auto-updates are disabled for seed marketplaces since git pull would fail on a read-only filesystem.
* **Seed entries take precedence**: marketplaces declared in the seed overwrite any matching entries in the user's configuration on each startup. To opt out of a seed plugin, use `/plugin disable` rather than removing the marketplace.
* **Path resolution**: Claude Code locates marketplace content by probing `$CLAUDE_CODE_PLUGIN_SEED_DIR/marketplaces/<name>/` at runtime, not by trusting paths stored inside the seed's JSON. This means the seed works correctly even when mounted at a different path than where it was built.
* **Mutation is blocked**: running `/plugin marketplace remove` or `/plugin marketplace update` against a seed-managed marketplace fails with guidance to ask your administrator to update the seed image.
* **Composes with settings**: if `extraKnownMarketplaces` or `enabledPlugins` declare a marketplace that already exists in the seed, Claude Code uses the seed copy instead of cloning.

### Managed marketplace restrictions

For organizations requiring strict control over plugin sources, administrators can restrict which plugin marketplaces users are allowed to add using the [`strictKnownMarketplaces`](/docs/en/settings#strictknownmarketplaces) setting in managed settings.

When `strictKnownMarketplaces` is configured in managed settings, the restriction behavior depends on the value:

| Value               | Behavior                                                         |
| ------------------- | ---------------------------------------------------------------- |
| Undefined (default) | No restrictions. Users can add any marketplace                   |
| Empty array `[]`    | Complete lockdown. Users cannot add any new marketplaces         |
| List of sources     | Users can only add marketplaces that match the allowlist exactly |

#### Common configurations

Disable all marketplace additions:

```json theme={null}
{
  "strictKnownMarketplaces": []
}
```

Allow specific marketplaces only:

```json theme={null}
{
  "strictKnownMarketplaces": [
    {
      "source": "github",
      "repo": "acme-corp/approved-plugins"
    },
    {
      "source": "github",
      "repo": "acme-corp/security-tools",
      "ref": "v2.0"
    },
    {
      "source": "url",
      "url": "https://plugins.example.com/marketplace.json"
    }
  ]
}
```

Allow all marketplaces from an internal git server using regex pattern matching on the host. This is the recommended approach for [GitHub Enterprise Server](/docs/en/github-enterprise-server#plugin-marketplaces-on-ghes) or self-hosted GitLab instances:

```json theme={null}
{
  "strictKnownMarketplaces": [
    {
      "source": "hostPattern",
      "hostPattern": "^github\\.example\\.com$"
    }
  ]
}
```

Allow filesystem-based marketplaces from a specific directory using regex pattern matching on the path:

```json theme={null}
{
  "strictKnownMarketplaces": [
    {
      "source": "pathPattern",
      "pathPattern": "^/opt/approved/"
    }
  ]
}
```

Use `".*"` as the `pathPattern` to allow any filesystem path while still controlling network sources with `hostPattern`.

<Note>
  `strictKnownMarketplaces` restricts what users can add, but does not register marketplaces on its own. To make allowed marketplaces available automatically without users running `/plugin marketplace add`, pair it with [`extraKnownMarketplaces`](/docs/en/settings#extraknownmarketplaces) in the same `managed-settings.json`. See [Using both together](/docs/en/settings#strictknownmarketplaces).
</Note>

#### How restrictions work

Restrictions are checked before any network or filesystem operation. The check runs on marketplace add and on plugin install, update, refresh, and auto-update. If a marketplace was added before the policy was configured and its source no longer matches the allowlist, Claude Code refuses to install or update plugins from it. The same enforcement applies to `blockedMarketplaces`.

The allowlist uses exact matching for most source types. For a marketplace to be allowed, all specified fields must match exactly:

* For GitHub sources: `repo` is required, and `ref` or `path` must also match if specified in the allowlist
* For URL sources: the full URL must match exactly
* For `hostPattern` sources: the marketplace host is matched against the regex pattern
* For `pathPattern` sources: the marketplace's filesystem path is matched against the regex pattern

Exact matching does not normalize URLs: a trailing slash, `.git` suffix, or `ssh://` versus `https://` form are treated as different values. If your organization's marketplace can be cloned by more than one URL form, prefer a `hostPattern` entry over a literal URL so all forms match.

Because `strictKnownMarketplaces` is set in [managed settings](/docs/en/settings#settings-files), individual users and project configurations cannot override these restrictions.

For complete configuration details including all supported source types and comparison with `extraKnownMarketplaces`, see the [strictKnownMarketplaces reference](/docs/en/settings#strictknownmarketplaces).

### Version resolution and release channels

Plugin versions determine cache paths and update detection: if the resolved version matches what a user already has, `/plugin update` and auto-update skip the plugin.

Claude Code resolves a plugin's version from the first of these that is set:

1. `version` in the plugin's `plugin.json`
2. `version` in the plugin's marketplace entry
3. The git commit SHA of the plugin's source

For the git-based source types `github`, `url`, `git-subdir`, and relative paths inside a git-hosted marketplace, you can omit `version` entirely and every new commit is treated as a new version. This is the simplest setup for internal or actively-developed plugins.

<Warning>
  Setting `version` pins the plugin. If `plugin.json` declares `"version": "1.0.0"`, pushing new commits without changing that string does nothing for existing users, because Claude Code sees the same version and keeps the cached copy. Bump the field on every release, or omit it to use the commit SHA.

  Avoid setting `version` in both `plugin.json` and the marketplace entry. The `plugin.json` value always wins silently, so a stale manifest version can mask a version you set in `marketplace.json`.
</Warning>

#### Set up release channels

To support "stable" and "latest" release channels for your plugins, you can set up two marketplaces that point to different refs or SHAs of the same repo. You can then assign the two marketplaces to different user groups through [managed settings](/docs/en/settings#settings-files).

<Warning>
  Each channel must resolve to a different version. If you use explicit versions, `plugin.json` must declare a different `version` at each pinned ref. If you omit `version`, the distinct commit SHAs already distinguish the channels. If two refs resolve to the same version string, Claude Code treats them as identical and skips the update.
</Warning>

##### Example

```json theme={null}
{
  "name": "stable-tools",
  "plugins": [
    {
      "name": "code-formatter",
      "source": {
        "source": "github",
        "repo": "acme-corp/code-formatter",
        "ref": "stable"
      }
    }
  ]
}
```

```json theme={null}
{
  "name": "latest-tools",
  "plugins": [
    {
      "name": "code-formatter",
      "source": {
        "source": "github",
        "repo": "acme-corp/code-formatter",
        "ref": "latest"
      }
    }
  ]
}
```

##### Assign channels to user groups

Assign each marketplace to the appropriate user group through managed settings. For example, the stable group receives:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "stable-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/stable-tools"
      }
    }
  }
}
```

The early-access group receives `latest-tools` instead:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "latest-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/latest-tools"
      }
    }
  }
}
```

#### Pin dependency versions

A plugin can constrain its dependencies to a semver range so that updates to a dependency do not break the dependent plugin. See [Constrain plugin dependency versions](/docs/en/plugin-dependencies) for the `{plugin-name}--v{version}` git-tag convention, range syntax, and how multiple constraints on the same dependency are combined.

## Validation and testing

Test your marketplace before sharing.

Validate your marketplace JSON syntax:

```bash theme={null}
claude plugin validate .
```

Or from within Claude Code:

```shell theme={null}
/plugin validate .
```

Add the marketplace for testing:

```shell theme={null}
/plugin marketplace add ./path/to/marketplace
```

Install a test plugin to verify everything works:

```shell theme={null}
/plugin install test-plugin@marketplace-name
```

For complete plugin testing workflows, see [Test your plugins locally](/docs/en/plugins#test-your-plugins-locally). For technical troubleshooting, see [Plugins reference](/docs/en/plugins-reference).

## Manage marketplaces from the CLI

Claude Code provides non-interactive `claude plugin marketplace` subcommands for scripting and automation. These are equivalent to the `/plugin marketplace` commands available inside an interactive session.

### Plugin marketplace add

Add a marketplace from a GitHub repository, git URL, remote URL, or local path.

```bash theme={null}
claude plugin marketplace add <source> [options]
```

**Arguments:**

* `<source>`: GitHub `owner/repo` shorthand, git URL, remote URL to a `marketplace.json` file, or local directory path. To pin to a branch or tag, append `@ref` to the GitHub shorthand or `#ref` to a git URL

**Options:**

| Option                | Description                                                                                                                                         | Default |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| `--scope <scope>`     | Where to declare the marketplace: `user`, `project`, or `local`. See [Plugin installation scopes](/docs/en/plugins-reference#plugin-installation-scopes) | `user`  |
| `--sparse <paths...>` | Limit checkout to specific directories via git sparse-checkout. Useful for monorepos                                                                |         |

Add a marketplace from GitHub using `owner/repo` shorthand:

```bash theme={null}
claude plugin marketplace add acme-corp/claude-plugins
```

Pin to a specific branch or tag with `@ref`:

```bash theme={null}
claude plugin marketplace add acme-corp/claude-plugins@v2.0
```

Add from a git URL on a non-GitHub host:

```bash theme={null}
claude plugin marketplace add https://gitlab.example.com/team/plugins.git
```

Add from a remote URL that serves the `marketplace.json` file directly:

```bash theme={null}
claude plugin marketplace add https://example.com/marketplace.json
```

Add from a local directory for testing:

```bash theme={null}
claude plugin marketplace add ./my-marketplace
```

Declare the marketplace at project scope so it is shared with your team via `.claude/settings.json`:

```bash theme={null}
claude plugin marketplace add acme-corp/claude-plugins --scope project
```

For a monorepo, limit the checkout to the directories that contain plugin content:

```bash theme={null}
claude plugin marketplace add acme-corp/monorepo --sparse .claude-plugin plugins
```

### Plugin marketplace list

List all configured marketplaces.

```bash theme={null}
claude plugin marketplace list [options]
```

**Options:**

| Option   | Description    |
| :------- | :------------- |
| `--json` | Output as JSON |

With `--json`, each entry includes `name`, `source`, and source-specific fields: `repo` for GitHub sources, `url` for git and URL sources, and `path` for local sources. GitHub and git sources also include a `ref` field when the marketplace was added with a pinned branch or tag.

### Plugin marketplace remove

Remove a configured marketplace. The alias `rm` is also accepted.

```bash theme={null}
claude plugin marketplace remove <name> [options]
```

**Arguments:**

* `<name>`: marketplace name to remove, as shown by `claude plugin marketplace list`. This is the `name` from `marketplace.json`, not the source you passed to `add`

**Options:**

| Option            | Description                                                                                                                                                                                                                                                                                                                                                                                                        | Default      |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| `--scope <scope>` | Restrict removal to a single settings scope: `user`, `project`, or `local`. See [Plugin installation scopes](/docs/en/plugins-reference#plugin-installation-scopes). When omitted, the declaration is removed from every editable scope. When given, only that scope's declaration is removed; the shared state, cache, and installed plugin data are preserved when the marketplace is still declared in another scope | (all scopes) |

<Warning>
  Removing a marketplace from its last remaining scope also uninstalls any plugins you installed from it. To refresh a marketplace without losing installed plugins, use `claude plugin marketplace update` instead.
</Warning>

### Plugin marketplace update

Refresh marketplaces from their sources to retrieve new plugins and version changes.

```bash theme={null}
claude plugin marketplace update [name]
```

**Arguments:**

* `[name]`: marketplace name to update, as shown by `claude plugin marketplace list`. Updates all marketplaces if omitted

Both `remove` and `update` fail when run against a seed-managed marketplace, which is read-only. When updating all marketplaces, seed-managed entries are skipped and other marketplaces still update. To change seed-provided plugins, ask your administrator to update the seed image. See [Pre-populate plugins for containers](#pre-populate-plugins-for-containers).

## Troubleshooting

### Marketplace not loading

**Symptoms**: Can't add marketplace or see plugins from it

**Solutions**:

* Verify the marketplace URL is accessible
* Check that `.claude-plugin/marketplace.json` exists at the specified path
* Ensure JSON syntax is valid using `claude plugin validate` or `/plugin validate`. To check skill, agent, and command frontmatter, run the command against each plugin directory
* For private repositories, confirm you have access permissions

### Marketplace validation errors

Run `claude plugin validate .` or `/plugin validate .` from your marketplace directory to check for issues. When pointed at a marketplace directory, the validator checks `marketplace.json` only: schema, duplicate plugin names, source path traversal, and version mismatches against each referenced `plugin.json`.

To validate an individual plugin's `plugin.json` and its skill, agent, command, and hook files, run the command against the plugin directory itself, for example `claude plugin validate ./plugins/my-plugin`. Common errors:

| Error                                             | Cause                                           | Solution                                                                                                                                    |
| :------------------------------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `File not found: .claude-plugin/marketplace.json` | Missing manifest                                | Create `.claude-plugin/marketplace.json` with required fields                                                                               |
| `Invalid JSON syntax: Unexpected token...`        | JSON syntax error in marketplace.json           | Check for missing commas, extra commas, or unquoted strings                                                                                 |
| `Duplicate plugin name "x" found in marketplace`  | Two plugins share the same name                 | Give each plugin a unique `name` value                                                                                                      |
| `plugins[0].source: Path contains ".."`           | Source path contains `..`                       | Use paths relative to the marketplace root without `..`. See [Relative paths](#relative-paths)                                              |
| `YAML frontmatter failed to parse: ...`           | Invalid YAML in a skill, agent, or command file | Fix the YAML syntax in the frontmatter block. At runtime this file loads with no metadata. Reported only when validating a plugin directory |
| `Invalid JSON syntax: ...` (hooks.json)           | Malformed `hooks/hooks.json`                    | Fix JSON syntax. A malformed `hooks/hooks.json` prevents the entire plugin from loading. Reported only when validating a plugin directory   |

**Warnings** (non-blocking):

* `Marketplace has no plugins defined`: add at least one plugin to the `plugins` array
* `No marketplace description provided`: add a top-level `description` to help users understand your marketplace
* `Plugin name "x" is not kebab-case`: the plugin name contains uppercase letters, spaces, or special characters. Rename to lowercase letters, digits, and hyphens only (for example, `my-plugin`). Claude Code accepts other forms, but the Claude.ai marketplace sync rejects them.

### Plugin installation failures

**Symptoms**: Marketplace appears but plugin installation fails

**Solutions**:

* Verify plugin source URLs are accessible
* Check that plugin directories contain required files
* For GitHub sources, ensure repositories are public or you have access
* Test plugin sources manually by cloning/downloading

### Private repository authentication fails

**Symptoms**: Authentication errors when installing plugins from private repositories

**Solutions**:

For manual installation and updates:

* Verify you're authenticated with your git provider (for example, run `gh auth status` for GitHub)
* Check that your credential helper is configured correctly: `git config --global credential.helper`
* Try cloning the repository manually to verify your credentials work

For background auto-updates:

* Set the appropriate token in your environment: `echo $GITHUB_TOKEN`
* Check that the token has the required permissions (read access to the repository)
* For GitHub, ensure the token has the `repo` scope for private repositories
* For GitLab, ensure the token has at least `read_repository` scope
* Verify the token hasn't expired

### Marketplace updates fail in offline environments

**Symptoms**: Marketplace `git pull` fails and Claude Code wipes the existing cache, causing plugins to become unavailable.

**Cause**: By default, when a `git pull` fails, Claude Code removes the stale clone and attempts to re-clone. In offline or airgapped environments, re-cloning fails the same way, leaving the marketplace directory empty.

**Solution**: Set `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1` to keep the existing cache when the pull fails instead of wiping it:

```bash theme={null}
export CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1
```

With this variable set, Claude Code retains the stale marketplace clone on `git pull` failure and continues using the last-known-good state. For fully offline deployments where the repository will never be reachable, use [`CLAUDE_CODE_PLUGIN_SEED_DIR`](#pre-populate-plugins-for-containers) to pre-populate the plugins directory at build time instead.

### Git operations time out

**Symptoms**: Plugin installation or marketplace updates fail with a timeout error like "Git clone timed out after 120s" or "Git pull timed out after 120s".

**Cause**: Claude Code uses a 120-second timeout for all git operations, including cloning plugin repositories and pulling marketplace updates. Large repositories or slow network connections may exceed this limit.

**Solution**: Increase the timeout using the `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` environment variable. The value is in milliseconds:

```bash theme={null}
export CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=300000  # 5 minutes
```

### Plugins with relative paths fail in URL-based marketplaces

**Symptoms**: Added a marketplace via URL (such as `https://example.com/marketplace.json`), but plugins with relative path sources like `"./plugins/my-plugin"` fail to install with "path not found" errors.

**Cause**: URL-based marketplaces only download the `marketplace.json` file itself. They do not download plugin files from the server. Relative paths in the marketplace entry reference files on the remote server that were not downloaded.

**Solutions**:

* **Use external sources**: Change plugin entries to use GitHub, npm, or git URL sources instead of relative paths:
  ```json theme={null}
  { "name": "my-plugin", "source": { "source": "github", "repo": "owner/repo" } }
  ```
* **Use a Git-based marketplace**: Host your marketplace in a Git repository and add it with the git URL. Git-based marketplaces clone the entire repository, making relative paths work correctly.

### Files not found after installation

**Symptoms**: Plugin installs but references to files fail, especially files outside the plugin directory

**Cause**: Plugins are copied to a cache directory rather than used in-place. Paths that reference files outside the plugin's directory (such as `../shared-utils`) won't work because those files aren't copied.

**Solutions**: See [Plugin caching and file resolution](/docs/en/plugins-reference#plugin-caching-and-file-resolution) for workarounds including symlinks and directory restructuring.

For additional debugging tools and common issues, see [Debugging and development tools](/docs/en/plugins-reference#debugging-and-development-tools).

## See also

* [Discover and install prebuilt plugins](/docs/en/discover-plugins) - Installing plugins from existing marketplaces
* [Plugins](/docs/en/plugins) - Creating your own plugins
* [Plugins reference](/docs/en/plugins-reference) - Complete technical specifications and schemas
* [Plugin settings](/docs/en/settings#plugin-settings) - Plugin configuration options
* [strictKnownMarketplaces reference](/docs/en/settings#strictknownmarketplaces) - Managed marketplace restrictions


---

## Output styles

`https://code.claude.com/docs/en/output-styles`

Adapt Claude Code for uses beyond software engineering

Output styles change how Claude responds, not what Claude knows. They modify the system prompt to set role, tone, and output format. Use one when you keep re-prompting for the same voice or format every turn, or when you want Claude to act as something other than a software engineer.

A custom output style adds your instructions to the system prompt and lets you choose whether to keep Claude Code's built-in software engineering instructions. Keep them when you're changing how Claude communicates but still coding, like always answering with a diagram. Leave them out when Claude isn't doing software engineering at all, like a writing assistant or data analyst.

For instructions about your project, conventions, or codebase, use [CLAUDE.md](/docs/en/memory) instead.

## Built-in output styles

Claude Code's **Default** output style is the existing system prompt, designed to help you complete software engineering tasks efficiently.

There are three additional built-in output styles:

* **Proactive**: Claude executes immediately, makes reasonable assumptions instead of pausing for routine decisions, and prefers action over planning. This is stronger autonomous-execution guidance than [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) applies, and it works without changing your permission mode, so you still see permission prompts before tools run.

* **Explanatory**: Provides educational "Insights" in between helping you complete software engineering tasks. Helps you understand implementation choices and codebase patterns.

* **Learning**: Collaborative, learn-by-doing mode where Claude will not only share "Insights" while coding, but also ask you to contribute small, strategic pieces of code yourself. Claude Code will add `TODO(human)` markers in your code for you to implement.

## Change your output style

Run `/config` and select **Output style** to pick a style from a menu. Your selection is saved to `.claude/settings.local.json` at the [local project level](/docs/en/settings).

<Note>The standalone `/output-style` command was deprecated in v2.1.73 and removed in v2.1.91. Use `/config` or edit the `outputStyle` setting directly.</Note>

To set a style without the menu, edit the `outputStyle` field directly in a settings file:

```json theme={null}
{
  "outputStyle": "Explanatory"
}
```

Output style is part of the system prompt, which Claude Code reads once at session start. Changes take effect after `/clear` or a new session. See [How Claude Code uses prompt caching](/docs/en/prompt-caching#changing-output-style) for what an output style change does to the cache.

## Create a custom output style

A custom output style is a Markdown file: frontmatter for metadata, then the instructions to add to the system prompt.

<Steps>
  <Step title="Create a Markdown file">
    Save it at one of three levels. The file name becomes the style name unless you set `name` in the frontmatter.

    * User: `~/.claude/output-styles`
    * Project: `.claude/output-styles`
    * Managed policy: `.claude/output-styles` inside the [managed settings directory](/docs/en/settings#settings-files)
  </Step>

  <Step title="Add frontmatter and instructions">
    Decide whether to keep Claude Code's software engineering instructions. Set `keep-coding-instructions: true` if you're changing how Claude communicates but still want it coding the same way. Leave it out if Claude won't be doing software engineering.

    This example leads every explanation with a diagram while keeping Claude's coding behavior:

    ```markdown theme={null}
    ---
    name: Diagrams first
    description: Lead every explanation with a diagram
    keep-coding-instructions: true
    ---

    When explaining code, architecture, or data flow, start with a Mermaid diagram showing the structure, then explain in prose.

    ## Diagram conventions

    Use `flowchart TD` for control flow and `sequenceDiagram` for request paths. Keep diagrams under 15 nodes.
    ```
  </Step>

  <Step title="Switch to your style">
    Run `/config` and select your style under **Output style**. It takes effect after `/clear` or the next time you start a session.
  </Step>
</Steps>

[Plugins](/docs/en/plugins-reference) can also ship output styles in an `output-styles/` directory.

### Frontmatter

Output style files support these frontmatter fields:

| Frontmatter                | Purpose                                                                                                                                                                                                                                                  | Default                 |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------- |
| `name`                     | Name of the output style, if not the file name                                                                                                                                                                                                           | Inherits from file name |
| `description`              | Description of the output style, shown in the `/config` picker                                                                                                                                                                                           | None                    |
| `keep-coding-instructions` | Keep Claude Code's built-in software engineering instructions                                                                                                                                                                                            | `false`                 |
| `force-for-plugin`         | Plugin output styles only: apply this style automatically whenever the plugin is enabled, without requiring users to select it. Overrides the user's `outputStyle` setting. If multiple enabled plugins set this, Claude Code uses the first one loaded. | `false`                 |

## How output styles work

Output styles directly modify Claude Code's system prompt.

* All output styles have their own custom instructions added to the end of the system prompt.
* All output styles trigger reminders for Claude to adhere to the output style instructions during the conversation.
* Custom output styles leave out Claude Code's built-in software engineering instructions, such as how to scope changes, write comments, and verify work, unless `keep-coding-instructions` is set to `true`.

Token usage depends on the style. Adding instructions to the system prompt increases input tokens, though prompt caching reduces this cost after the first request in a session. The built-in Explanatory and Learning styles produce longer responses than Default by design, which increases output tokens. For custom styles, output token usage depends on what your instructions tell Claude to produce.

## Comparisons to related features

Several features customize how Claude Code behaves. Output styles modify the system prompt directly and apply to every response. The others add instructions without changing the default system prompt, or scope them to a specific task.

| Feature                  | How it works                                                 | Use it when                                                             |
| :----------------------- | :----------------------------------------------------------- | :---------------------------------------------------------------------- |
| Output styles            | Modifies the system prompt                                   | You want a different role, tone, or default response format every turn  |
| [CLAUDE.md](/docs/en/memory)  | Adds a user message after the system prompt                  | Claude should always know your project conventions and codebase context |
| `--append-system-prompt` | Appends to the system prompt without removing anything       | You want a one-off addition for a single invocation                     |
| [Agents](/docs/en/sub-agents) | Runs a subagent with its own system prompt, model, and tools | You want a separately scoped helper for a focused task                  |
| [Skills](/docs/en/skills)     | Loads task-specific instructions when invoked or relevant    | You have a reusable workflow                                            |

## Related resources

* [Settings](/docs/en/settings): where the `outputStyle` field lives and how settings precedence works
* [Permission modes](/docs/en/permission-modes): how the Proactive style compares to auto mode
* [Plugins](/docs/en/plugins): package and distribute output styles alongside skills, hooks, and agents
* [Debug your configuration](/docs/en/debug-your-config): diagnose why an output style isn't taking effect
