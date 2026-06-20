# Configuration & Settings

_Claude Code documentation — Configuration & Settings. Source: https://code.claude.com/docs/en/_


---

## Claude Code settings

`https://code.claude.com/docs/en/settings`

Configure Claude Code with global and project-level settings, and environment variables.

Claude Code offers a variety of settings to configure its behavior to meet your needs. You can configure Claude Code by running the `/config` command when using the interactive REPL, which opens a tabbed Settings interface where you can view status information and modify configuration options.

## Configuration scopes

Claude Code uses a **scope system** to determine where configurations apply and who they're shared with. Understanding scopes helps you decide how to configure Claude Code for personal use, team collaboration, or enterprise deployment.

### Available scopes

| Scope       | Location                                                                           | Who it affects                       | Shared with team?      |
| :---------- | :--------------------------------------------------------------------------------- | :----------------------------------- | :--------------------- |
| **Managed** | Server-managed settings, plist / registry, or system-level `managed-settings.json` | All users on the machine             | Yes (deployed by IT)   |
| **User**    | `~/.claude/` directory                                                             | You, across all projects             | No                     |
| **Project** | `.claude/` in repository                                                           | All collaborators on this repository | Yes (committed to git) |
| **Local**   | `.claude/settings.local.json`                                                      | You, in this repository only         | No (gitignored)        |

### When to use each scope

**Managed scope** is for:

* Security policies that must be enforced organization-wide
* Compliance requirements that can't be overridden
* Standardized configurations deployed by IT/DevOps

**User scope** is best for:

* Personal preferences you want everywhere (themes, editor settings)
* Tools and plugins you use across all projects
* API keys and authentication (stored securely)

**Project scope** is best for:

* Team-shared settings (permissions, hooks, MCP servers)
* Plugins the whole team should have
* Standardizing tooling across collaborators

**Local scope** is best for:

* Personal overrides for a specific project
* Testing configurations before sharing with the team
* Machine-specific settings that won't work for others

### How scopes interact

When the same setting appears in multiple scopes, Claude Code applies them in priority order:

1. **Managed** (highest) - can't be overridden by anything
2. **Command line arguments** - temporary session overrides
3. **Local** - overrides project and user settings
4. **Project** - overrides user settings
5. **User** (lowest) - applies when nothing else specifies the setting

For example, if your user settings set `spinnerTipsEnabled` to `true` and project settings set it to `false`, the project value applies. Permission rules behave differently because they merge across scopes rather than override. See [Settings precedence](#settings-precedence).

### What uses scopes

Scopes apply to many Claude Code features:

| Feature         | User location             | Project location                   | Local location                 |
| :-------------- | :------------------------ | :--------------------------------- | :----------------------------- |
| **Settings**    | `~/.claude/settings.json` | `.claude/settings.json`            | `.claude/settings.local.json`  |
| **Subagents**   | `~/.claude/agents/`       | `.claude/agents/`                  | None                           |
| **MCP servers** | `~/.claude.json`          | `.mcp.json`                        | `~/.claude.json` (per-project) |
| **Plugins**     | `~/.claude/settings.json` | `.claude/settings.json`            | `.claude/settings.local.json`  |
| **CLAUDE.md**   | `~/.claude/CLAUDE.md`     | `CLAUDE.md` or `.claude/CLAUDE.md` | `CLAUDE.local.md`              |

On Windows, paths shown as `~/.claude` resolve to `%USERPROFILE%\.claude`.

***

## Settings files

The `settings.json` file is the official mechanism for configuring Claude
Code through hierarchical settings:

* **User settings** are defined in `~/.claude/settings.json` and apply to all
  projects.
* **Project settings** are saved in your project directory:
  * `.claude/settings.json` for settings that are checked into source control and shared with your team
  * `.claude/settings.local.json` for settings that are not checked in, useful for personal preferences and experimentation. Claude Code will configure git to ignore `.claude/settings.local.json` when it is created.
* **Managed settings**: For organizations that need centralized control, Claude Code supports multiple delivery mechanisms for managed settings. All use the same JSON format and cannot be overridden by user or project settings:

  * **Server-managed settings**: delivered from Anthropic's servers via the Claude.ai admin console. See [server-managed settings](/docs/en/server-managed-settings).
  * **MDM/OS-level policies**: delivered through native device management on macOS and Windows:
    * macOS: `com.anthropic.claudecode` managed preferences domain. The plist's top-level keys mirror `managed-settings.json`, with nested settings as dictionaries and arrays as plist arrays. Deploy via configuration profiles in Jamf, Iru (Kandji), or similar MDM tools.
    * Windows: `HKLM\SOFTWARE\Policies\ClaudeCode` registry key with a `Settings` value (REG\_SZ or REG\_EXPAND\_SZ) containing JSON (deployed via Group Policy or Intune)
    * Windows (user-level): `HKCU\SOFTWARE\Policies\ClaudeCode` (lowest policy priority, only used when no admin-level source exists)
  * **File-based**: `managed-settings.json` and `managed-mcp.json` deployed to system directories:

    * macOS: `/Library/Application Support/ClaudeCode/`
    * Linux and WSL: `/etc/claude-code/`
    * Windows: `C:\Program Files\ClaudeCode\`

    <Warning>
      The legacy Windows path `C:\ProgramData\ClaudeCode\managed-settings.json` is no longer supported as of v2.1.75. Administrators who deployed settings to that location must migrate files to `C:\Program Files\ClaudeCode\managed-settings.json`.
    </Warning>

    File-based managed settings also support a drop-in directory at `managed-settings.d/` in the same system directory alongside `managed-settings.json`. This lets separate teams deploy independent policy fragments without coordinating edits to a single file.

    Following the systemd convention, `managed-settings.json` is merged first as the base, then all `*.json` files in the drop-in directory are sorted alphabetically and merged on top. Later files override earlier ones for scalar values; arrays are concatenated and de-duplicated; objects are deep-merged. Hidden files starting with `.` are ignored.

    Use numeric prefixes to control merge order, for example `10-telemetry.json` and `20-security.json`.

  See [managed settings](/docs/en/permissions#managed-only-settings) and [Managed MCP configuration](/docs/en/managed-mcp) for details.

  This [repository](https://github.com/anthropics/claude-code/tree/main/examples/mdm) includes starter deployment templates for Jamf, Iru (Kandji), Intune, and Group Policy. Use these as starting points and adjust them to fit your needs.

  <Note>
    Managed deployments can also restrict **plugin marketplace additions** using
    `strictKnownMarketplaces`. For more information, see [Managed marketplace restrictions](/docs/en/plugin-marketplaces#managed-marketplace-restrictions).
  </Note>
* **Other configuration** is stored in `~/.claude.json`. This file contains your OAuth session, [MCP server](/docs/en/mcp) configurations for user and local scopes, per-project state (allowed tools, trust settings), and various caches. Project-scoped MCP servers are stored separately in `.mcp.json`.

<Note>
  Claude Code automatically creates timestamped backups of configuration files and retains the five most recent backups to prevent data loss.
</Note>

```JSON Example settings.json theme={null}
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run test *)",
      "Read(~/.zshrc)"
    ],
    "deny": [
      "Bash(curl *)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp"
  },
  "companyAnnouncements": [
    "Welcome to Acme Corp! Review our code guidelines at docs.acme.com",
    "Reminder: Code reviews required for all PRs",
    "New security policy in effect"
  ]
}
```

The `$schema` line in the example above points to the [official JSON schema](https://json.schemastore.org/claude-code-settings.json) for Claude Code settings. Adding it to your `settings.json` enables autocomplete and inline validation in VS Code, Cursor, and any other editor that supports JSON schema validation.

The published schema is updated periodically and may not include settings added in the most recent CLI releases, so a validation warning on a recently documented field does not necessarily mean your configuration is invalid.

### When edits take effect

Claude Code watches your settings files and reloads them when they change, so edits to most keys apply to the running session without a restart. This includes `permissions`, `hooks`, and credential helpers like `apiKeyHelper`. The reload covers user, project, local, and managed settings, and the [`ConfigChange` hook](/docs/en/hooks#configchange) fires for each detected change.

A few keys are read once at session start and apply on the next restart instead:

* `model`: use [`/model`](/docs/en/model-config#setting-your-model) to switch mid-session
* [`outputStyle`](/docs/en/output-styles): part of the system prompt, which is rebuilt on `/clear` or restart

### Available settings

`settings.json` supports a number of options:

| Key                               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Example                                                                                                                        |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `agent`                           | Run the main thread as a named subagent, and set the default agent for sessions dispatched from `claude agents`. Applies that subagent's system prompt, tool restrictions, and model. See [Invoke subagents explicitly](/docs/en/sub-agents#invoke-subagents-explicitly)                                                                                                                                                                                                                                                                                                                             | `"code-reviewer"`                                                                                                              |
| `allowAllClaudeAiMcps`            | (Managed settings only) Load claude.ai connectors alongside a deployed `managed-mcp.json`, which otherwise takes exclusive control and suppresses them. See [Managed MCP configuration](/docs/en/managed-mcp)                                                                                                                                                                                                                                                                                                                                                                                        | `true`                                                                                                                         |
| `allowedChannelPlugins`           | (Managed settings only) Allowlist of channel plugins that may push messages. Replaces the default Anthropic allowlist when set. Undefined = fall back to the default, empty array = block all channel plugins. Requires `channelsEnabled: true`. See [Restrict which channel plugins can run](/docs/en/channels#restrict-which-channel-plugins-can-run)                                                                                                                                                                                                                                              | `[{ "marketplace": "claude-plugins-official", "plugin": "telegram" }]`                                                         |
| `allowedHttpHookUrls`             | Allowlist of URL patterns that HTTP hooks may target. Supports `*` as a wildcard. When set, hooks with non-matching URLs are blocked. Undefined = no restriction, empty array = block all HTTP hooks. Arrays merge across settings sources. See [Hook configuration](#hook-configuration)                                                                                                                                                                                                                                                                                                       | `["https://hooks.example.com/*"]`                                                                                              |
| `allowedMcpServers`               | When set in managed-settings.json, allowlist of MCP servers users can configure. Undefined = no restrictions, empty array = lockdown. Applies to all scopes. Denylist takes precedence. See [Managed MCP configuration](/docs/en/managed-mcp)                                                                                                                                                                                                                                                                                                                                                        | `[{ "serverName": "github" }]`                                                                                                 |
| `allowManagedHooksOnly`           | (Managed settings only) Only managed hooks, SDK hooks, and hooks from plugins force-enabled in managed settings `enabledPlugins` are loaded. User, project, and all other plugin hooks are blocked. See [Hook configuration](#hook-configuration)                                                                                                                                                                                                                                                                                                                                               | `true`                                                                                                                         |
| `allowManagedMcpServersOnly`      | (Managed settings only) Only `allowedMcpServers` from managed settings are respected. `deniedMcpServers` still merges from all sources. Users can still add MCP servers, but only the admin-defined allowlist applies. See [Managed MCP configuration](/docs/en/managed-mcp)                                                                                                                                                                                                                                                                                                                         | `true`                                                                                                                         |
| `allowManagedPermissionRulesOnly` | (Managed settings only) Prevent user and project settings from defining `allow`, `ask`, or `deny` permission rules. Only rules in managed settings apply. See [Managed-only settings](/docs/en/permissions#managed-only-settings)                                                                                                                                                                                                                                                                                                                                                                    | `true`                                                                                                                         |
| `alwaysThinkingEnabled`           | Enable [extended thinking](/docs/en/model-config#extended-thinking) by default for all sessions. Typically configured via the `/config` command rather than editing directly. To force thinking off regardless of this setting, set [`CLAUDE_CODE_DISABLE_THINKING`](/docs/en/env-vars) in `env`                                                                                                                                                                                                                                                                                                          | `true`                                                                                                                         |
| `apiKeyHelper`                    | Custom script, to be executed in `/bin/sh`, to generate an auth value. This value will be sent as `X-Api-Key` and `Authorization: Bearer` headers for model requests. Set the refresh interval with [`CLAUDE_CODE_API_KEY_HELPER_TTL_MS`](/docs/en/env-vars)                                                                                                                                                                                                                                                                                                                                         | `/bin/generate_temp_api_key.sh`                                                                                                |
| `attribution`                     | Customize attribution for git commits and pull requests. See [Attribution settings](#attribution-settings)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `{"commit": "🤖 Generated with Claude Code", "pr": ""}`                                                                        |
| `autoMemoryDirectory`             | Custom directory for [auto memory](/docs/en/memory#storage-location) storage. Accepts an absolute path or a `~/`-prefixed path. From project or local settings, this is honored only after you accept the workspace trust dialog, since a cloned repository can supply this file                                                                                                                                                                                                                                                                                                                     | `"~/my-memory-dir"`                                                                                                            |
| `autoMemoryEnabled`               | Enable [auto memory](/docs/en/memory#enable-or-disable-auto-memory). When `false`, Claude does not read from or write to the auto memory directory. Default: `true`. You can also toggle this with `/memory` during a session. To disable via environment variable, set [`CLAUDE_CODE_DISABLE_AUTO_MEMORY`](/docs/en/env-vars) in `env`                                                                                                                                                                                                                                                                   | `false`                                                                                                                        |
| `autoMode`                        | Customize what the [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) classifier blocks and allows. Contains `environment`, `allow`, `soft_deny`, and `hard_deny` arrays of prose rules. Include the literal string `"$defaults"` in an array to inherit the built-in rules at that position. See [Configure auto mode](/docs/en/auto-mode-config). Not read from shared project settings                                                                                                                                                                                            | `{"soft_deny": ["$defaults", "Never run terraform apply"]}`                                                                    |
| `autoScrollEnabled`               | In [fullscreen rendering](/docs/en/fullscreen), follow new output to the bottom of the conversation. Default: `true`. Appears in `/config` as **Auto-scroll**. Permission prompts still scroll into view when this is off                                                                                                                                                                                                                                                                                                                                                                            | `false`                                                                                                                        |
| `autoUpdatesChannel`              | Release channel to follow for updates. Use `"stable"` for a version that is typically about one week old and skips versions with major regressions, or `"latest"` (default) for the most recent release. To disable auto-updates entirely, set [`DISABLE_AUTOUPDATER`](/docs/en/setup#disable-auto-updates) in `env`                                                                                                                                                                                                                                                                                 | `"stable"`                                                                                                                     |
| `availableModels`                 | Restrict which models users can select via `/model`, `--model`, or `ANTHROPIC_MODEL`. Does not affect the Default option. See [Restrict model selection](/docs/en/model-config#restrict-model-selection)                                                                                                                                                                                                                                                                                                                                                                                             | `["sonnet", "haiku"]`                                                                                                          |
| `awaySummaryEnabled`              | Show a one-line session recap when you return to the terminal after a few minutes away. Set to `false` or turn off Session recap in `/config` to disable. Same as [`CLAUDE_CODE_ENABLE_AWAY_SUMMARY`](/docs/en/env-vars)                                                                                                                                                                                                                                                                                                                                                                             | `true`                                                                                                                         |
| `awsAuthRefresh`                  | Custom script that modifies the `.aws` directory (see [advanced credential configuration](/docs/en/amazon-bedrock#advanced-credential-configuration))                                                                                                                                                                                                                                                                                                                                                                                                                                                | `aws sso login --profile myprofile`                                                                                            |
| `awsCredentialExport`             | Custom script that outputs JSON with AWS credentials (see [advanced credential configuration](/docs/en/amazon-bedrock#advanced-credential-configuration))                                                                                                                                                                                                                                                                                                                                                                                                                                            | `/bin/generate_aws_grant.sh`                                                                                                   |
| `blockedMarketplaces`             | (Managed settings only) Blocklist of marketplace sources. Enforced on marketplace add and on plugin install, update, refresh, and auto-update, so a marketplace added before the policy was set cannot be used to fetch plugins. Blocked sources are checked before downloading, so they never touch the filesystem. See [Managed marketplace restrictions](/docs/en/plugin-marketplaces#managed-marketplace-restrictions)                                                                                                                                                                           | `[{ "source": "github", "repo": "untrusted/plugins" }]`                                                                        |
| `channelsEnabled`                 | (Managed settings only) Allow [channels](/docs/en/channels) for the organization. On claude.ai Team and Enterprise plans, channels are blocked when this is unset or `false`. For [Anthropic Console](/docs/en/authentication#claude-console-authentication) accounts using API key authentication, channels are allowed by default unless your organization deploys managed settings, in which case this key must be set to `true`                                                                                                                                                                       | `true`                                                                                                                         |
| `claudeMd`                        | (Managed settings only) CLAUDE.md-style instructions injected as organization-managed memory. Only honored when set in managed or policy settings and ignored in user, project, and local settings. See [organization-wide CLAUDE.md](/docs/en/memory#deploy-organization-wide-claude-md)                                                                                                                                                                                                                                                                                                            | `"Always run make lint before committing."`                                                                                    |
| `claudeMdExcludes`                | Glob patterns or absolute paths of `CLAUDE.md` files to skip when loading [memory](/docs/en/memory). Patterns match against absolute file paths. Only applies to user, project, and local memory; managed policy files cannot be excluded                                                                                                                                                                                                                                                                                                                                                            | `["**/vendor/**/CLAUDE.md"]`                                                                                                   |
| `cleanupPeriodDays`               | Session files older than this period are deleted at startup (default: 30 days, minimum 1). Setting to `0` is rejected with a validation error. Also controls the age cutoff for automatic removal of [orphaned subagent worktrees](/docs/en/worktrees#clean-up-worktrees) at startup. To disable transcript writes entirely, set the [`CLAUDE_CODE_SKIP_PROMPT_HISTORY`](/docs/en/env-vars) environment variable, or in non-interactive mode (`-p`) use the `--no-session-persistence` flag or the `persistSession: false` SDK option.                                                                    | `20`                                                                                                                           |
| `companyAnnouncements`            | Announcement to display to users at startup. If multiple announcements are provided, they will be cycled through at random.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `["Welcome to Acme Corp! Review our code guidelines at docs.acme.com"]`                                                        |
| `defaultShell`                    | Default shell for input-box `!` commands. Accepts `"bash"` (default) or `"powershell"`. Setting `"powershell"` routes interactive `!` commands through PowerShell on Windows. Requires `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`. See [PowerShell tool](/docs/en/tools-reference#powershell-tool)                                                                                                                                                                                                                                                                                                          | `"powershell"`                                                                                                                 |
| `deniedMcpServers`                | When set in managed-settings.json, denylist of MCP servers that are explicitly blocked. Applies to all scopes including managed servers. Denylist takes precedence over allowlist. See [Managed MCP configuration](/docs/en/managed-mcp)                                                                                                                                                                                                                                                                                                                                                             | `[{ "serverName": "filesystem" }]`                                                                                             |
| `disableAgentView`                | Set to `true` to turn off [background agents and agent view](/docs/en/agent-view): `claude agents`, `--bg`, `/background`, and the on-demand supervisor. Typically set in [managed settings](/docs/en/permissions#managed-settings). Equivalent to setting `CLAUDE_CODE_DISABLE_AGENT_VIEW` to `1`                                                                                                                                                                                                                                                                                                        | `true`                                                                                                                         |
| `disableAllHooks`                 | Disable all [hooks](/docs/en/hooks) and any custom [status line](/docs/en/statusline)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `true`                                                                                                                         |
| `disableAutoMode`                 | Set to `"disable"` to prevent [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) from being activated. Removes `auto` from the `Shift+Tab` cycle and rejects `--permission-mode auto` at startup. Most useful in [managed settings](/docs/en/permissions#managed-settings) where users cannot override it                                                                                                                                                                                                                                                                            | `"disable"`                                                                                                                    |
| `disableDeepLinkRegistration`     | Set to `"disable"` to prevent Claude Code from registering the `claude-cli://` protocol handler with the operating system on startup. [Deep links](/docs/en/deep-links) let external tools open a Claude Code session with a pre-filled prompt. Useful in environments where protocol handler registration is restricted or managed separately                                                                                                                                                                                                                                                       | `"disable"`                                                                                                                    |
| `disabledMcpjsonServers`          | List of specific MCP servers from `.mcp.json` files to reject                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `["filesystem"]`                                                                                                               |
| `disableRemoteControl`            | Disable [Remote Control](/docs/en/remote-control): blocks `claude remote-control`, the `--remote-control` flag, auto-start, and the in-session toggle. Typically placed in [managed settings](/docs/en/permissions#managed-settings) for per-device MDM enforcement, but works from any scope. Requires Claude Code v2.1.128 or later                                                                                                                                                                                                                                                                     | `true`                                                                                                                         |
| `disableSkillShellExecution`      | Disable inline shell execution for `` !`...` `` and ` ```! ` blocks in [skills](/en/skills) and custom commands from user, project, plugin, or additional-directory sources. Commands are replaced with `[shell command execution disabled by policy]` instead of being run. Bundled and managed skills are not affected. Most useful in [managed settings](/en/permissions#managed-settings) where users cannot override it                                                                                                                                                                    | `true`                                                                                                                         |
| `disableWorkflows`                | Disable [dynamic workflows](/en/workflows#turn-workflows-off) and the bundled workflow commands. Default: `false`. Equivalent to setting `CLAUDE_CODE_DISABLE_WORKFLOWS` to `1`                                                                                                                                                                                                                                                                                                                                                                                                                 | `true`                                                                                                                         |
| `editorMode`                      | Key binding mode for the input prompt: `"normal"` or `"vim"`. Default: `"normal"`. Appears in `/config` as **Editor mode**                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `"vim"`                                                                                                                        |
| `effortLevel`                     | Persist the [effort level](/en/model-config#adjust-effort-level) across sessions. Accepts `"low"`, `"medium"`, `"high"`, or `"xhigh"`. Written automatically when you run `/effort` with one of those values. `--effort` and [`CLAUDE_CODE_EFFORT_LEVEL`](/en/env-vars) override this for one session. See [Adjust effort level](/en/model-config#adjust-effort-level) for supported models                                                                                                                                                                                                     | `"xhigh"`                                                                                                                      |
| `enableAllProjectMcpServers`      | Automatically approve all MCP servers defined in project `.mcp.json` files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `true`                                                                                                                         |
| `enabledMcpjsonServers`           | List of specific MCP servers from `.mcp.json` files to approve                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `["memory", "github"]`                                                                                                         |
| `env`                             | Environment variables applied to every session and to subprocesses Claude Code spawns from it. As of v2.1.143, `NO_COLOR` and `FORCE_COLOR` set here are passed to subprocesses but do not change Claude Code's own interface colors. Set those in your shell before launching `claude` to change interface colors                                                                                                                                                                                                                                                                              | `{"FOO": "bar"}`                                                                                                               |
| `fastModePerSessionOptIn`         | When `true`, fast mode does not persist across sessions. Each session starts with fast mode off, requiring users to enable it with `/fast`. The user's fast mode preference is still saved. See [Require per-session opt-in](/en/fast-mode#require-per-session-opt-in)                                                                                                                                                                                                                                                                                                                          | `true`                                                                                                                         |
| `feedbackSurveyRate`              | Probability (0–1) that the [session quality survey](/en/data-usage#session-quality-surveys) appears when eligible. Set to `0` to suppress entirely, or set [`CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`](/en/env-vars) in `env`. Useful when using Bedrock, Vertex, or Foundry where the default sample rate does not apply                                                                                                                                                                                                                                                                           | `0.05`                                                                                                                         |
| `fileSuggestion`                  | Configure a custom script for `@` file autocomplete. See [File suggestion settings](#file-suggestion-settings)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `{"type": "command", "command": "~/.claude/file-suggestion.sh"}`                                                               |
| `forceLoginMethod`                | Use `claudeai` to restrict login to Claude.ai accounts, `console` to restrict login to Claude Console (API usage billing) accounts. When set in managed settings, sessions authenticated by API key, `apiKeyHelper`, or a third-party provider are blocked at startup, since neither value can be satisfied without first-party OAuth                                                                                                                                                                                                                                                           | `claudeai`                                                                                                                     |
| `forceLoginOrgUUID`               | Require login to belong to a specific organization. Accepts a single UUID string, which also pre-selects that organization during login, or an array of UUIDs where any listed organization is accepted without pre-selection. When set in managed settings, login fails if the authenticated account does not belong to a listed organization, and sessions authenticated by API key, `apiKeyHelper`, or a third-party provider are blocked at startup since organization membership cannot be verified for them. An empty array fails closed and blocks login with a misconfiguration message | `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"` or `["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"]` |
| `forceRemoteSettingsRefresh`      | (Managed settings only) Block CLI startup until remote managed settings are freshly fetched from the server. If the fetch fails, the CLI exits rather than continuing with cached or no settings. When not set, startup continues without waiting for remote settings. See [fail-closed enforcement](/en/server-managed-settings#enforce-fail-closed-startup)                                                                                                                                                                                                                                   | `true`                                                                                                                         |
| `gcpAuthRefresh`                  | Custom script that refreshes GCP Application Default Credentials when they expire or cannot be loaded. See [advanced credential configuration](/en/google-vertex-ai#advanced-credential-configuration)                                                                                                                                                                                                                                                                                                                                                                                          | `gcloud auth application-default login`                                                                                        |
| `hooks`                           | Configure custom commands to run at lifecycle events. See [hooks documentation](/en/hooks) for format                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | See [hooks](/en/hooks)                                                                                                         |
| `httpHookAllowedEnvVars`          | Allowlist of environment variable names HTTP hooks may interpolate into headers. When set, each hook's effective `allowedEnvVars` is the intersection with this list. Undefined = no restriction. Arrays merge across settings sources. See [Hook configuration](#hook-configuration)                                                                                                                                                                                                                                                                                                           | `["MY_TOKEN", "HOOK_SECRET"]`                                                                                                  |
| `includeCoAuthoredBy`             | **Deprecated**: Use `attribution` instead. Whether to include the `co-authored-by Claude` byline in git commits and pull requests (default: `true`)                                                                                                                                                                                                                                                                                                                                                                                                                                             | `false`                                                                                                                        |
| `includeGitInstructions`          | Include built-in commit and PR workflow instructions and the git status snapshot in Claude's system prompt (default: `true`). Set to `false` to remove both, for example when using your own git workflow skills. The `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` environment variable takes precedence over this setting when set                                                                                                                                                                                                                                                                   | `false`                                                                                                                        |
| `language`                        | Configure Claude's preferred response language (e.g., `"japanese"`, `"spanish"`, `"french"`). Claude will respond in this language by default. Also sets the [voice dictation](/en/voice-dictation#change-the-dictation-language) language                                                                                                                                                                                                                                                                                                                                                      | `"japanese"`                                                                                                                   |
| `maxSkillDescriptionChars`        | Per-skill character cap on the combined `description` and `when_to_use` text in the [skill listing](/en/skills#skill-descriptions-are-cut-short) Claude sees each turn (default: `1536`). Text longer than this is truncated. Raise to keep long descriptions intact at the cost of more context per turn; lower to fit more skills under [`skillListingBudgetFraction`](#available-settings). Requires Claude Code v2.1.105 or later                                                                                                                                                           | `2048`                                                                                                                         |
| `minimumVersion`                  | Floor that prevents background auto-updates and `claude update` from installing a version below this one. Switching from the `"latest"` channel to `"stable"` via `/config` prompts you to stay on the current version or allow the downgrade. Choosing to stay sets this value. Also useful in [managed settings](/en/permissions#managed-settings) to pin an organization-wide minimum                                                                                                                                                                                                        | `"2.1.100"`                                                                                                                    |
| `model`                           | Override the default model to use for Claude Code. `--model` and [`ANTHROPIC_MODEL`](/en/model-config#environment-variables) override this for one session                                                                                                                                                                                                                                                                                                                                                                                                                                      | `"claude-sonnet-4-6"`                                                                                                          |
| `modelOverrides`                  | Map Anthropic model IDs to provider-specific model IDs such as Bedrock inference profile ARNs. Each model picker entry uses its mapped value when calling the provider API. See [Override model IDs per version](/en/model-config#override-model-ids-per-version)                                                                                                                                                                                                                                                                                                                               | `{"claude-opus-4-6": "arn:aws:bedrock:..."}`                                                                                   |
| `otelHeadersHelper`               | Script to generate dynamic OpenTelemetry headers. Runs at startup and periodically. Set the refresh interval with [`CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`](/en/env-vars). See [Dynamic headers](/en/monitoring-usage#dynamic-headers)                                                                                                                                                                                                                                                                                                                                                    | `/bin/generate_otel_headers.sh`                                                                                                |
| `outputStyle`                     | Configure an output style to adjust the system prompt. See [output styles documentation](/en/output-styles)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `"Explanatory"`                                                                                                                |
| `parentSettingsBehavior`          | (Managed settings only) Controls whether managed settings supplied programmatically by an embedding host process, such as the Agent SDK or an IDE extension, apply when an admin-deployed managed tier is also present. `"first-wins"`: the parent-supplied settings are dropped and only the admin tier applies. `"merge"`: the parent-supplied settings apply under the admin tier, filtered so they can tighten policy but not loosen it. Has no effect when no admin tier is deployed. Default: `"first-wins"`. Requires Claude Code v2.1.133 or later                                      | `"merge"`                                                                                                                      |
| `permissions`                     | See table below for structure of permissions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                                                                                                                                |
| `plansDirectory`                  | Customize where plan files are stored. Path is relative to project root. Default: `~/.claude/plans`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `"./plans"`                                                                                                                    |
| `pluginSuggestionMarketplaces`    | (Managed settings only) Marketplace names whose plugins can appear as contextual install suggestions, in addition to the official marketplace. Suggestions come from each plugin's `relevance` declaration in its marketplace entry. A name only takes effect when the marketplace is registered on the machine and its registered source is also declared in managed settings, either as the `extraKnownMarketplaces` entry for that name or as an entry of `strictKnownMarketplaces`. A marketplace registered from a different source under an allowlisted name is ignored.                  | `["acme-corp-plugins"]`                                                                                                        |
| `pluginTrustMessage`              | (Managed settings only) Custom message appended to the plugin trust warning shown before installation. Use this to add organization-specific context, for example to confirm that plugins from your internal marketplace are vetted.                                                                                                                                                                                                                                                                                                                                                            | `"All plugins from our marketplace are approved by IT"`                                                                        |
| `policyHelper`                    | Admin-deployed executable that computes managed settings dynamically at startup. Only honored from MDM or a system `managed-settings.json` file. See [Compute managed settings with a policy helper](#compute-managed-settings-with-a-policy-helper). Requires Claude Code v2.1.136 or later                                                                                                                                                                                                                                                                                                    | `{"path": "/usr/local/bin/claude-policy"}`                                                                                     |
| `preferredNotifChannel`           | Method for task-complete and permission-prompt notifications: `"auto"`, `"terminal_bell"`, `"iterm2"`, `"iterm2_with_bell"`, `"kitty"`, `"ghostty"`, or `"notifications_disabled"`. Default: `"auto"`, which sends a desktop notification in iTerm2, Ghostty, and Kitty and does nothing in other terminals. Set `"terminal_bell"` to ring the bell character in any terminal. Appears in `/config` as **Notifications**. See [Get a terminal bell or notification](/en/terminal-config#get-a-terminal-bell-or-notification)                                                                    | `"terminal_bell"`                                                                                                              |
| `prefersReducedMotion`            | Reduce or disable UI animations (spinners, shimmer, flash effects) for accessibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `true`                                                                                                                         |
| `prUrlTemplate`                   | URL template for the PR badge shown in the footer and in tool-result summaries. Substitutes `{host}`, `{owner}`, `{repo}`, `{number}`, and `{url}` from the `gh`-reported PR URL. Use to point PR links at an internal code-review tool instead of `github.com`. Does not affect `#123` autolinks in Claude's prose                                                                                                                                                                                                                                                                             | `"https://reviews.example.com/{owner}/{repo}/pull/{number}"`                                                                   |
| `respectGitignore`                | Control whether the `@` file picker respects `.gitignore` patterns. When `true` (default), files matching `.gitignore` patterns are excluded from suggestions                                                                                                                                                                                                                                                                                                                                                                                                                                   | `false`                                                                                                                        |
| `showClearContextOnPlanAccept`    | Show the "clear context" option on the plan accept screen. Defaults to `false`. Set to `true` to restore the option                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `true`                                                                                                                         |
| `showThinkingSummaries`           | Show [extended thinking](/en/model-config#extended-thinking) summaries in interactive sessions. When unset or `false` (default in interactive mode), thinking blocks are redacted by the API and shown as a collapsed stub. Redaction only changes what you see, not what the model generates: to reduce thinking spend, [lower the budget or disable thinking](/en/model-config#extended-thinking) instead. This setting has no effect in non-interactive mode (`-p`), the Agent SDK, or IDE extensions such as VS Code                                                                        | `true`                                                                                                                         |
| `showTurnDuration`                | Show turn duration messages after responses, e.g. "Cooked for 1m 6s". Default: `true`. Appears in `/config` as **Show turn duration**                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                                                                                                                        |
| `skillListingBudgetFraction`      | Fraction of the model's context window reserved for the [skill listing](/en/skills#skill-descriptions-are-cut-short) Claude sees each turn (default: `0.01` = 1%). When the listing exceeds the budget, descriptions for the least-used skills are collapsed to bare names so Claude can still invoke them but won't see why. Raise to keep more descriptions visible at the cost of more context per turn. `/doctor` shows the current truncation count and which skills are affected. Requires Claude Code v2.1.105 or later                                                                  | `0.02`                                                                                                                         |
| `skillOverrides`                  | Per-skill visibility overrides keyed by skill name. Value is `"on"`, `"name-only"`, `"user-invocable-only"`, or `"off"`. Lets you hide or collapse a skill without editing its SKILL.md. Does not apply to plugin skills, which are managed through `/plugin`. The `/skills` menu writes these to `.claude/settings.local.json`. See [Override skill visibility from settings](/en/skills#override-skill-visibility-from-settings). Requires Claude Code v2.1.129 or later                                                                                                                      | `{"legacy-context": "name-only", "deploy": "off"}`                                                                             |
| `skipWebFetchPreflight`           | Skip the [WebFetch domain safety check](/en/data-usage#webfetch-domain-safety-check) that sends each requested hostname to `api.anthropic.com` before fetching. Set to `true` in environments that block traffic to Anthropic, such as Bedrock, Vertex AI, or Foundry deployments with restrictive egress. When skipped, WebFetch attempts any URL without consulting the blocklist                                                                                                                                                                                                             | `true`                                                                                                                         |
| `spinnerTipsEnabled`              | Show tips in the spinner while Claude is working. Set to `false` to disable tips (default: `true`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `false`                                                                                                                        |
| `spinnerTipsOverride`             | Override spinner tips with custom strings. `tips`: array of tip strings. `excludeDefault`: if `true`, only show custom tips; if `false` or absent, custom tips are merged with built-in tips                                                                                                                                                                                                                                                                                                                                                                                                    | `{ "excludeDefault": true, "tips": ["Use our internal tool X"] }`                                                              |
| `spinnerVerbs`                    | Customize the action verbs shown while a turn is in progress. Set `mode` to `"replace"` to use only your verbs, or `"append"` to add them to the defaults                                                                                                                                                                                                                                                                                                                                                                                                                                       | `{"mode": "append", "verbs": ["Pondering", "Crafting"]}`                                                                       |
| `sshConfigs`                      | SSH connections to show in the [Desktop](/en/desktop#pre-configure-ssh-connections-for-your-team) environment dropdown. Each entry requires `id`, `name`, and `sshHost`; `sshPort`, `sshIdentityFile`, and `startDirectory` are optional. When set in managed settings, connections are read-only for users. Read from managed and user settings only                                                                                                                                                                                                                                           | `[{"id": "dev-vm", "name": "Dev VM", "sshHost": "user@dev.example.com"}]`                                                      |
| `statusLine`                      | Configure a custom status line to display context. See [`statusLine` documentation](/en/statusline)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `{"type": "command", "command": "~/.claude/statusline.sh"}`                                                                    |
| `strictKnownMarketplaces`         | (Managed settings only) Allowlist of plugin marketplace sources. Undefined = no restrictions, empty array = lockdown. Enforced on marketplace add and on plugin install, update, refresh, and auto-update, so a marketplace added before the policy was set cannot be used to fetch plugins. See [Managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions)                                                                                                                                                                                                   | `[{ "source": "github", "repo": "acme-corp/plugins" }]`                                                                        |
| `strictPluginOnlyCustomization`   | (Managed settings only) Block skills, agents, hooks, and MCP servers from user and project sources, so they can only come from plugins or managed settings. `true` locks all four surfaces; an array locks only the named ones. See [`strictPluginOnlyCustomization`](#strictpluginonlycustomization)                                                                                                                                                                                                                                                                                           | `["skills", "hooks"]`                                                                                                          |
| `syntaxHighlightingDisabled`      | Disable syntax highlighting in diffs, code blocks, and file previews                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `true`                                                                                                                         |
| `teammateMode`                    | How [agent team](/en/agent-teams) teammates display: `auto` (picks split panes in tmux or iTerm2, in-process otherwise), `in-process`, or `tmux`. `--teammate-mode` overrides this for one session. See [choose a display mode](/en/agent-teams#choose-a-display-mode)                                                                                                                                                                                                                                                                                                                          | `"in-process"`                                                                                                                 |
| `terminalProgressBarEnabled`      | Show the terminal progress bar in supported terminals: ConEmu, Ghostty 1.2.0+, and iTerm2 3.6.6+. Default: `true`. Appears in `/config` as **Terminal progress bar**                                                                                                                                                                                                                                                                                                                                                                                                                            | `false`                                                                                                                        |
| `tui`                             | Terminal UI renderer. Use `"fullscreen"` for the flicker-free [alt-screen renderer](/en/fullscreen) with virtualized scrollback. Use `"default"` for the classic main-screen renderer. Set via `/tui`. You can also set the [`CLAUDE_CODE_NO_FLICKER`](/en/env-vars) environment variable                                                                                                                                                                                                                                                                                                       | `"fullscreen"`                                                                                                                 |
| `ultracode`                       | Turn on [ultracode](/en/workflows#let-claude-decide-with-ultracode) for the session. Session-only and not read from `settings.json`. Set through `/effort ultracode`, `--settings`, or an Agent SDK control request                                                                                                                                                                                                                                                                                                                                                                             | `true`                                                                                                                         |
| `useAutoModeDuringPlan`           | Whether plan mode uses auto mode semantics when auto mode is available. Default: `true`. Not read from shared project settings. Appears in `/config` as "Use auto mode during plan"                                                                                                                                                                                                                                                                                                                                                                                                             | `false`                                                                                                                        |
| `viewMode`                        | Default transcript view mode on startup: `"default"`, `"verbose"`, or `"focus"`. Overrides the sticky `/focus` selection when set. The `--verbose` flag overrides this for one session                                                                                                                                                                                                                                                                                                                                                                                                          | `"verbose"`                                                                                                                    |
| `voice`                           | [Voice dictation](/en/voice-dictation) settings: `enabled` turns dictation on, `mode` selects `"hold"` or `"tap"`, and `autoSubmit` sends the prompt on key release in hold mode. Written automatically when you run `/voice`. Requires a Claude.ai account                                                                                                                                                                                                                                                                                                                                     | `{ "enabled": true, "mode": "tap" }`                                                                                           |
| `voiceEnabled`                    | Legacy alias for `voice.enabled`. Prefer the `voice` object                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `true`                                                                                                                         |
| `workflowKeywordTriggerEnabled`   | Whether the word `workflow` in a prompt triggers a [dynamic workflow](/en/workflows#ask-for-a-workflow-in-your-prompt). Set to `false` to type the word without triggering one. Ultracode, `/workflows`, and saved workflow commands are unaffected. Default: `true`. Appears in `/config` as **Workflow keyword trigger**                                                                                                                                                                                                                                                                      | `false`                                                                                                                        |
| `wslInheritsWindowsSettings`      | (Windows managed settings only) When `true`, Claude Code on WSL reads managed settings from the Windows policy chain in addition to `/etc/claude-code`, with Windows sources taking priority. Only honored when set in the HKLM registry key or `C:\Program Files\ClaudeCode\managed-settings.json`, both of which require Windows admin to write. For HKCU policy to also apply on WSL, the flag must additionally be set in HKCU itself. Has no effect on native Windows                                                                                                                      | `true`                                                                                                                         |

### Global config settings

These settings are stored in `~/.claude.json` rather than `settings.json`. Adding them to `settings.json` will trigger a schema validation error.

<Note>
  Versions before v2.1.119 also store `autoScrollEnabled`, `editorMode`, `showTurnDuration`, `teammateMode`, and `terminalProgressBarEnabled` here instead of in `settings.json`.
</Note>

| Key                       | Description                                                                                                                                                                                                                                                                                                                           | Example    |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------- |
| `autoConnectIde`          | Automatically connect to a running IDE when Claude Code starts from an external terminal. Default: `false`. Appears in `/config` as **Auto-connect to IDE (external terminal)** when running outside a VS Code or JetBrains terminal. The [`CLAUDE_CODE_AUTO_CONNECT_IDE`](/en/env-vars) environment variable overrides this when set | `true`     |
| `autoInstallIdeExtension` | Automatically install the Claude Code IDE extension when running from a VS Code terminal. Default: `true`. Appears in `/config` as **Auto-install IDE extension** when running inside a VS Code or JetBrains terminal. You can also set the [`CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`](/en/env-vars) environment variable                  | `false`    |
| `externalEditorContext`   | Prepend Claude's previous response as `#`-commented context when you open the external editor with `Ctrl+G`. Default: `false`. Appears in `/config` as **Show last response in external editor**                                                                                                                                      | `true`     |
| `teammateDefaultModel`    | Default model for [agent team](/en/agent-teams) teammates when the spawn prompt doesn't specify one. Set to a model alias such as `"sonnet"`, or `null` to inherit the lead's current `/model` selection. Appears in `/config` as **Default teammate model**                                                                          | `"sonnet"` |

### Worktree settings

Configure how `--worktree` creates and manages git worktrees.

| Key                           | Description                                                                                                                                                                                                                                                                                                                                  | Example                               |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| `worktree.baseRef`            | Which ref new worktrees branch from. `"fresh"` (default) branches from `origin/<default-branch>` for a clean tree matching the remote. `"head"` branches from your current local `HEAD`, so unpushed commits and feature-branch state are present in the worktree. Applies to `--worktree`, the `EnterWorktree` tool, and subagent isolation | `"head"`                              |
| `worktree.symlinkDirectories` | Directories to symlink from the main repository into each worktree to avoid duplicating large directories on disk. No directories are symlinked by default                                                                                                                                                                                   | `["node_modules", ".cache"]`          |
| `worktree.sparsePaths`        | Directories to check out in each worktree via git sparse-checkout. Only the listed directories plus root-level files are written to disk, which is faster in large monorepos                                                                                                                                                                 | `["packages/my-app", "shared/utils"]` |
| `worktree.bgIsolation`        | Isolation mode for [background sessions](/en/agent-view#how-file-edits-are-isolated). `"worktree"` (default) blocks `Edit`/`Write` in the main checkout until `EnterWorktree` is called. `"none"` lets background jobs edit the working copy directly. Requires Claude Code v2.1.143 or later                                                | `"none"`                              |

To copy gitignored files like `.env` into new worktrees, use a [`.worktreeinclude` file](/en/worktrees#copy-gitignored-files-into-worktrees) in your project root instead of a setting.

### Permission settings

| Keys                                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Example                                                                |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| `allow`                             | Array of permission rules to allow tool use. See [Permission rule syntax](#permission-rule-syntax) below for pattern matching details                                                                                                                                                                                                                                                                                                                                                   | `[ "Bash(git diff *)" ]`                                               |
| `ask`                               | Array of permission rules to ask for confirmation upon tool use. See [Permission rule syntax](#permission-rule-syntax) below                                                                                                                                                                                                                                                                                                                                                            | `[ "Bash(git push *)" ]`                                               |
| `deny`                              | Array of permission rules to deny tool use. Use this to exclude sensitive files from Claude Code access. See [Permission rule syntax](#permission-rule-syntax) and [Bash permission limitations](/en/permissions#tool-specific-permission-rules)                                                                                                                                                                                                                                        | `[ "WebFetch", "Bash(curl *)", "Read(./.env)", "Read(./secrets/**)" ]` |
| `additionalDirectories`             | Additional [working directories](/en/permissions#working-directories) for file access. Most `.claude/` configuration is [not discovered](/en/permissions#additional-directories-grant-file-access-not-configuration) from these directories                                                                                                                                                                                                                                             | `[ "../docs/" ]`                                                       |
| `defaultMode`                       | Default [permission mode](/en/permission-modes) when opening Claude Code. Valid values: `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. As of Claude Code v2.1.142, `auto` is ignored when set in project or local settings (`.claude/settings.json`, `.claude/settings.local.json`) so a repository cannot grant itself auto mode. Set it in `~/.claude/settings.json` instead. The `--permission-mode` CLI flag overrides this setting for a single session | `"acceptEdits"`                                                        |
| `disableBypassPermissionsMode`      | Set to `"disable"` to prevent `bypassPermissions` mode from being activated. This disables the `--dangerously-skip-permissions` command-line flag. Typically placed in [managed settings](/en/permissions#managed-settings) to enforce organizational policy, but works from any scope                                                                                                                                                                                                  | `"disable"`                                                            |
| `skipDangerousModePermissionPrompt` | Skip the confirmation prompt shown before entering bypass permissions mode via `--dangerously-skip-permissions` or `defaultMode: "bypassPermissions"`. Ignored when set in project settings (`.claude/settings.json`) to prevent untrusted repositories from auto-bypassing the prompt                                                                                                                                                                                                  | `true`                                                                 |

### Permission rule syntax

Permission rules follow the format `Tool` or `Tool(specifier)`. Rules are evaluated in order: deny rules first, then ask, then allow. The first matching rule wins.

Quick examples:

| Rule                           | Effect                                   |
| :----------------------------- | :--------------------------------------- |
| `Bash`                         | Matches all Bash commands                |
| `Bash(npm run *)`              | Matches commands starting with `npm run` |
| `Read(./.env)`                 | Matches reading the `.env` file          |
| `WebFetch(domain:example.com)` | Matches fetch requests to example.com    |

For the complete rule syntax reference, including wildcard behavior, tool-specific patterns for Read, Edit, WebFetch, MCP, and Agent rules, and security limitations of Bash patterns, see [Permission rule syntax](/en/permissions#permission-rule-syntax).

### Sandbox settings

Configure advanced sandboxing behavior. Sandboxing isolates bash commands from your filesystem and network. See [Sandboxing](/en/sandboxing) for details.

| Keys                                   | Description                                                                                                                                                                                                                                                                                                                                     | Example                           |
| :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| `enabled`                              | Enable bash sandboxing (macOS, Linux, and WSL2). Default: false                                                                                                                                                                                                                                                                                 | `true`                            |
| `failIfUnavailable`                    | Exit with an error at startup if `sandbox.enabled` is true but the sandbox cannot start (missing dependencies or unsupported platform). When false (default), a warning is shown and commands run unsandboxed. Intended for managed settings deployments that require sandboxing as a hard gate                                                 | `true`                            |
| `autoAllowBashIfSandboxed`             | Auto-approve bash commands when sandboxed. Default: true                                                                                                                                                                                                                                                                                        | `true`                            |
| `excludedCommands`                     | Commands that should run outside of the sandbox                                                                                                                                                                                                                                                                                                 | `["docker *"]`                    |
| `allowUnsandboxedCommands`             | Allow commands to run outside the sandbox via the `dangerouslyDisableSandbox` parameter. When set to `false`, the `dangerouslyDisableSandbox` escape hatch is completely disabled and all commands must run sandboxed (or be in `excludedCommands`). Useful for enterprise policies that require strict sandboxing. Default: true               | `false`                           |
| `filesystem.allowWrite`                | Additional paths where sandboxed commands can write. Arrays are merged across all settings scopes: user, project, and managed paths are combined, not replaced. Also merged with paths from `Edit(...)` allow permission rules. See [path prefixes](#sandbox-path-prefixes) below.                                                              | `["/tmp/build", "~/.kube"]`       |
| `filesystem.denyWrite`                 | Paths where sandboxed commands cannot write. Arrays are merged across all settings scopes. Also merged with paths from `Edit(...)` deny permission rules.                                                                                                                                                                                       | `["/etc", "/usr/local/bin"]`      |
| `filesystem.denyRead`                  | Paths where sandboxed commands cannot read. Arrays are merged across all settings scopes. Also merged with paths from `Read(...)` deny permission rules.                                                                                                                                                                                        | `["~/.aws/credentials"]`          |
| `filesystem.allowRead`                 | Paths to re-allow reading within `denyRead` regions. Takes precedence over `denyRead`. Arrays are merged across all settings scopes. Use this to create workspace-only read access patterns.                                                                                                                                                    | `["."]`                           |
| `filesystem.allowManagedReadPathsOnly` | (Managed settings only) Only `filesystem.allowRead` paths from managed settings are respected. `denyRead` still merges from all sources. Default: false                                                                                                                                                                                         | `true`                            |
| `network.allowUnixSockets`             | (macOS only) Unix socket paths accessible in sandbox. Ignored on Linux and WSL2, where the seccomp filter cannot inspect socket paths; use `allowAllUnixSockets` instead.                                                                                                                                                                       | `["~/.ssh/agent-socket"]`         |
| `network.allowAllUnixSockets`          | Allow all Unix socket connections in sandbox. On Linux and WSL2 this is the only way to permit Unix sockets, since it skips the seccomp filter that otherwise blocks `socket(AF_UNIX, ...)` calls. Default: false                                                                                                                               | `true`                            |
| `network.allowLocalBinding`            | Allow binding to localhost ports (macOS only). Default: false                                                                                                                                                                                                                                                                                   | `true`                            |
| `network.allowMachLookup`              | Additional XPC/Mach service names the sandbox may look up (macOS only). Supports a single trailing `*` for prefix matching. Needed for tools that communicate via XPC such as the iOS Simulator or Playwright.                                                                                                                                  | `["com.apple.coresimulator.*"]`   |
| `network.allowedDomains`               | Array of domains to allow for outbound network traffic. Supports wildcards (e.g., `*.example.com`).                                                                                                                                                                                                                                             | `["github.com", "*.npmjs.org"]`   |
| `network.deniedDomains`                | Array of domains to block for outbound network traffic. Supports the same wildcard syntax as `allowedDomains`. Takes precedence over `allowedDomains` when both match. Merged from all settings sources regardless of `allowManagedDomainsOnly`.                                                                                                | `["sensitive.cloud.example.com"]` |
| `network.allowManagedDomainsOnly`      | (Managed settings only) Only `allowedDomains` and `WebFetch(domain:...)` allow rules from managed settings are respected. Domains from user, project, and local settings are ignored. Non-allowed domains are blocked automatically without prompting the user. Denied domains are still respected from all sources. Default: false             | `true`                            |
| `network.httpProxyPort`                | HTTP proxy port used if you wish to bring your own proxy. If not specified, Claude will run its own proxy.                                                                                                                                                                                                                                      | `8080`                            |
| `network.socksProxyPort`               | SOCKS5 proxy port used if you wish to bring your own proxy. If not specified, Claude will run its own proxy.                                                                                                                                                                                                                                    | `8081`                            |
| `enableWeakerNestedSandbox`            | Enable weaker sandbox for unprivileged Docker environments (Linux and WSL2 only). **Reduces security.** Default: false                                                                                                                                                                                                                          | `true`                            |
| `enableWeakerNetworkIsolation`         | (macOS only) Allow access to the system TLS trust service (`com.apple.trustd.agent`) in the sandbox. Required for Go-based tools like `gh`, `gcloud`, and `terraform` to verify TLS certificates when using `httpProxyPort` with a MITM proxy and custom CA. **Reduces security** by opening a potential data exfiltration path. Default: false | `true`                            |
| `bwrapPath`                            | (Managed settings only, Linux/WSL2) Absolute path to the bubblewrap (`bwrap`) binary. Overrides automatic detection via `PATH`. Only honored from [managed settings](/en/settings#settings-precedence), not from user or project settings. Useful when `bwrap` is installed at a non-standard location in managed environments.                 | `/opt/admin/bwrap`                |
| `socatPath`                            | (Managed settings only, Linux/WSL2) Absolute path to the `socat` binary used for the sandbox network proxy. Overrides automatic detection via `PATH`. Only honored from managed settings.                                                                                                                                                       | `/opt/admin/socat`                |

#### Sandbox path prefixes

Paths in `filesystem.allowWrite`, `filesystem.denyWrite`, `filesystem.denyRead`, and `filesystem.allowRead` support these prefixes:

| Prefix            | Meaning                                                                                | Example                                                                   |
| :---------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `/`               | Absolute path from filesystem root                                                     | `/tmp/build` stays `/tmp/build`                                           |
| `~/`              | Relative to home directory                                                             | `~/.kube` becomes `$HOME/.kube`                                           |
| `./` or no prefix | Relative to the project root for project settings, or to `~/.claude` for user settings | `./output` in `.claude/settings.json` resolves to `<project-root>/output` |

The older `//path` prefix for absolute paths still works. If you previously used single-slash `/path` expecting project-relative resolution, switch to `./path`. This syntax differs from [Read and Edit permission rules](/en/permissions#read-and-edit), which use `//path` for absolute and `/path` for project-relative. Sandbox filesystem paths use standard conventions: `/tmp/build` is an absolute path.

**Configuration example:**

```json theme={null}
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker *"],
    "filesystem": {
      "allowWrite": ["/tmp/build", "~/.kube"],
      "denyRead": ["~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org", "registry.yarnpkg.com"],
      "deniedDomains": ["uploads.github.com"],
      "allowUnixSockets": [
        "/var/run/docker.sock"
      ],
      "allowLocalBinding": true
    }
  }
}
```

**Filesystem and network restrictions** can be configured in two ways that are merged together:

* **`sandbox.filesystem` settings** (shown above): Control paths at the OS-level sandbox boundary. These restrictions apply to all subprocess commands (e.g., `kubectl`, `terraform`, `npm`), not just Claude's file tools.
* **Permission rules**: Use `Edit` allow/deny rules to control Claude's file tool access, `Read` deny rules to block reads, and `WebFetch` allow/deny rules to control network domains. Paths from these rules are also merged into the sandbox configuration.

### Attribution settings

Claude Code adds attribution to git commits and pull requests. These are configured separately:

* Commits use [git trailers](https://git-scm.com/docs/git-interpret-trailers) (like `Co-Authored-By`) by default,  which can be customized or disabled
* Pull request descriptions are plain text

| Keys     | Description                                                                                |
| :------- | :----------------------------------------------------------------------------------------- |
| `commit` | Attribution for git commits, including any trailers. Empty string hides commit attribution |
| `pr`     | Attribution for pull request descriptions. Empty string hides pull request attribution     |

**Default commit attribution:**

```text theme={null}
🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Default pull request attribution:**

```text theme={null}
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

**Example:**

```json theme={null}
{
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <ai@example.com>",
    "pr": ""
  }
}
```

<Note>
  The `attribution` setting takes precedence over the deprecated `includeCoAuthoredBy` setting. To hide all attribution, set `commit` and `pr` to empty strings.
</Note>

### File suggestion settings

Configure a custom command for `@` file path autocomplete. The built-in file suggestion uses fast filesystem traversal, but large monorepos may benefit from project-specific indexing such as a pre-built file index or custom tooling.

```json theme={null}
{
  "fileSuggestion": {
    "type": "command",
    "command": "~/.claude/file-suggestion.sh"
  }
}
```

The command runs with the same environment variables as [hooks](/en/hooks), including `CLAUDE_PROJECT_DIR`. It receives JSON via stdin with a `query` field:

```json theme={null}
{"query": "src/comp"}
```

Output newline-separated file paths to stdout (currently limited to 15):

```text theme={null}
src/components/Button.tsx
src/components/Modal.tsx
src/components/Form.tsx
```

**Example:**

```bash theme={null}
#!/bin/bash
query=$(cat | jq -r '.query')
your-repo-file-index --query "$query" | head -20
```

### Hook configuration

These settings control which hooks are allowed to run and what HTTP hooks can access. The `allowManagedHooksOnly` setting can only be configured in [managed settings](#settings-files). The URL and env var allowlists can be set at any settings level and merge across sources.

**Behavior when `allowManagedHooksOnly` is `true`:**

* Managed hooks and SDK hooks are loaded
* Hooks from plugins force-enabled in managed settings `enabledPlugins` are loaded. This lets administrators distribute vetted hooks through an organization marketplace while blocking everything else. Trust is granted by full `plugin@marketplace` ID, so a plugin with the same name from a different marketplace stays blocked
* User hooks, project hooks, and all other plugin hooks are blocked

**Restrict HTTP hook URLs:**

Limit which URLs HTTP hooks can target. Supports `*` as a wildcard for matching. When the array is defined, HTTP hooks targeting non-matching URLs are silently blocked. Hostname matching is case-insensitive and ignores a trailing FQDN dot, matching DNS semantics.

```json theme={null}
{
  "allowedHttpHookUrls": ["https://hooks.example.com/*", "http://localhost:*"]
}
```

**Restrict HTTP hook environment variables:**

Limit which environment variable names HTTP hooks can interpolate into header values. Each hook's effective `allowedEnvVars` is the intersection of its own list and this setting.

```json theme={null}
{
  "httpHookAllowedEnvVars": ["MY_TOKEN", "HOOK_SECRET"]
}
```

### Compute managed settings with a policy helper

The `policyHelper` setting points at an executable that computes managed settings at startup, so admins can derive policy from device posture, identity, or a remote service instead of a static file. Configure it from MDM or a system `managed-settings.json` file. Claude Code ignores `policyHelper` when it appears in any other scope, including user settings, project settings, the HKCU registry hive, and [server-managed settings](/en/server-managed-settings).

The setting accepts these keys:

| Key                 | Type   | Description                                                                                             |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `path`              | string | Absolute path to the helper executable                                                                  |
| `timeoutMs`         | number | How long to wait for the helper before treating the run as failed                                       |
| `refreshIntervalMs` | number | How often to re-run the helper in the background. Set to `0` to disable refresh, or to at least `60000` |

The helper writes a JSON envelope to stdout. Put the settings under a `managedSettings` key rather than at the top level, since a bare settings object parses with `managedSettings` undefined and applies nothing:

```json theme={null}
{
  "managedSettings": {
    "permissions": { "deny": ["Read(//etc/secrets/**)"] }
  },
  "claudeMd": "# Organization context\n...",
  "appendSystemPrompt": "Always cite the internal style guide."
}
```

When the helper emits `managedSettings`, that object replaces the file-based managed settings for the run. When the helper exits non-zero at startup, Claude Code prints the error and refuses to start, so a helper that needs outage resilience should serve from its own cache and exit `0`.

### Settings precedence

Settings apply in order of precedence. From highest to lowest:

1. **Managed settings** ([server-managed](/en/server-managed-settings), [MDM/OS-level policies](#configuration-scopes), or [managed settings](/en/settings#settings-files))
   * Policies deployed by IT through server delivery, MDM configuration profiles, registry policies, or managed settings files
   * Cannot be overridden by any other level, including command line arguments
   * Within the managed tier, precedence is: server-managed > MDM/OS-level policies > file-based (`managed-settings.d/*.json` + `managed-settings.json`) > HKCU registry (Windows only). Only one managed source is used; sources do not merge across tiers. Within the file-based tier, drop-in files and the base file are merged together.
   * Embedding hosts such as Claude Desktop can supply policy via the SDK `managedSettings` option. By default this is ignored when any managed-settings tier is present. Administrators can opt in by setting [`parentSettingsBehavior`](#available-settings) to `"merge"`. The embedder's values are filtered so they can tighten managed policy but not loosen it.

2. **Command line arguments**
   * Temporary overrides for a specific session. JSON passed via `--settings <file-or-json>` merges with file-based settings using the same rules as the other layers: a key set here overrides the same key in local, project, or user settings, and omitting a key leaves the lower-layer value in place

3. **Local project settings** (`.claude/settings.local.json`)
   * Personal project-specific settings

4. **Shared project settings** (`.claude/settings.json`)
   * Team-shared project settings in source control

5. **User settings** (`~/.claude/settings.json`)
   * Personal global settings

This hierarchy ensures that organizational policies are always enforced while still allowing teams and individuals to customize their experience. The same precedence applies whether you run Claude Code from the CLI, the [VS Code extension](/en/vs-code), or a [JetBrains IDE](/en/jetbrains).

For example, if your user settings set `permissions.defaultMode` to `acceptEdits` and a project's shared settings set it to `default`, the project value applies. The example below covers how array-valued settings such as permission rules combine instead.

<Note>
  **Array settings merge across scopes.** When the same array-valued setting (such as `sandbox.filesystem.allowWrite` or `permissions.allow`) appears in multiple scopes, the arrays are **concatenated and deduplicated**, not replaced. This means lower-priority scopes can add entries without overriding those set by higher-priority scopes, and vice versa. For example, if managed settings set `allowWrite` to `["/opt/company-tools"]` and a user adds `["~/.kube"]`, both paths are included in the final configuration.
</Note>

### Verify active settings

Run `/status` inside Claude Code to see which settings sources are active. The Status tab includes a `Setting sources` line that lists each layer Claude Code loaded for the current session, such as `User settings` or `Project local settings`. When [managed settings](/en/managed-settings) are in effect, the entry shows the delivery channel in parentheses, for example `Enterprise managed settings (remote)`, `(plist)`, `(HKLM)`, `(HKCU)`, or `(file)`. A layer appears in the list only when that source is loaded with at least one key, so an empty list means no settings sources were found.

The `Setting sources` line confirms which sources are being read. It does not show which layer supplied each individual key. The Config tab in the same dialog is an editor for a fixed set of toggles such as theme and verbose output, not a view of your `settings.json` contents. If a settings file contains errors, such as invalid JSON or a value that fails validation, `/status` reports the issue so you can fix it.

### Key points about the configuration system

* **Memory files (`CLAUDE.md`)**: Contain instructions and context that Claude loads at startup
* **Settings files (JSON)**: Configure permissions, environment variables, and tool behavior
* **Skills**: Custom prompts that can be invoked with `/skill-name` or loaded by Claude automatically
* **MCP servers**: Extend Claude Code with additional tools and integrations
* **Precedence**: Higher-level configurations (Managed) override lower-level ones (User/Project)
* **Inheritance**: Settings merge across scopes; scalar values from higher-priority scopes override, and arrays concatenate

### System prompt

Claude Code's internal system prompt is not published. To add custom instructions, use `CLAUDE.md` files or the `--append-system-prompt` flag.

### Excluding sensitive files

To prevent Claude Code from accessing files containing sensitive information like API keys, secrets, and environment files, use the `permissions.deny` setting in your `.claude/settings.json` file:

```json theme={null}
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)",
      "Read(./build)"
    ]
  }
}
```

This replaces the deprecated `ignorePatterns` configuration. Files matching these patterns are excluded from file discovery and search results, and read operations on these files are denied.

## Subagent configuration

Claude Code supports custom AI subagents that can be configured at both user and project levels. These subagents are stored as Markdown files with YAML frontmatter:

* **User subagents**: `~/.claude/agents/` - Available across all your projects
* **Project subagents**: `.claude/agents/` - Specific to your project and can be shared with your team

Subagent files define specialized AI assistants with custom prompts and tool permissions. Learn more about creating and using subagents in the [subagents documentation](/en/sub-agents).

## Plugin configuration

Claude Code supports a plugin system that lets you extend functionality with skills, agents, hooks, and MCP servers. Plugins are distributed through marketplaces and can be configured at both user and repository levels.

### Plugin settings

Plugin-related settings in `settings.json`:

```json theme={null}
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true,
    "analyzer@security-plugins": false
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/claude-plugins"
      }
    }
  }
}
```

#### `enabledPlugins`

Controls which plugins are enabled. Format: `"plugin-name@marketplace-name": true/false`. A plugin with no entry at any scope falls back to its [`defaultEnabled`](/en/plugins-reference#default-enablement) value.

**Scopes**:

* **User settings** (`~/.claude/settings.json`): Personal plugin preferences
* **Project settings** (`.claude/settings.json`): Project-specific plugins shared with team
* **Local settings** (`.claude/settings.local.json`): Per-machine overrides (not committed)
* **Managed settings** (`managed-settings.json`): Organization-wide policy overrides that block installation at all scopes and hide the plugin from the marketplace

<Note>
  Project settings take precedence over user settings, so setting a plugin to `false` in `~/.claude/settings.json` does not disable a plugin that the project's `.claude/settings.json` enables. To opt out of a project-enabled plugin on your machine, set it to `false` in `.claude/settings.local.json` instead.

  Plugins force-enabled by managed settings cannot be disabled this way, since managed settings override local settings.
</Note>

**Example**:

```json theme={null}
{
  "enabledPlugins": {
    "code-formatter@team-tools": true,
    "deployment-tools@team-tools": true,
    "experimental-features@personal": false
  }
}
```

#### `extraKnownMarketplaces`

Defines additional marketplaces that should be made available for the repository. Typically used in repository-level settings to ensure team members have access to required plugin sources.

**When a repository includes `extraKnownMarketplaces`**:

1. Team members are prompted to install the marketplace when they trust the folder
2. Team members are then prompted to install plugins from that marketplace
3. Users can skip unwanted marketplaces or plugins (stored in user settings)
4. Installation respects trust boundaries and requires explicit consent

**Example**:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/claude-plugins"
      }
    },
    "security-plugins": {
      "source": {
        "source": "git",
        "url": "https://git.example.com/security/plugins.git"
      }
    }
  }
}
```

**Marketplace source types**:

* `github`: GitHub repository (uses `repo`)
* `git`: Any git URL (uses `url`)
* `directory`: Local filesystem path (uses `path`, for development only)
* `hostPattern`: regex pattern to match marketplace hosts (uses `hostPattern`)
* `settings`: inline marketplace declared directly in settings.json without a separate hosted repository (uses `name` and `plugins`)

For `github` and `git` sources, set `"skipLfs": true` inside the `source` object (alongside `repo` or `url`) to skip Git LFS downloads when Claude Code clones or updates the marketplace repository. LFS pointer files remain as pointers instead of downloading their content. Use this when the repository contains large LFS objects unrelated to plugin content. Requires Claude Code v2.1.153 or later.

Each marketplace entry also accepts an optional `autoUpdate` Boolean. Set `"autoUpdate": true` alongside `source` to make Claude Code refresh that marketplace and update its installed plugins at startup. When omitted, official Anthropic marketplaces default to `true` and all other marketplaces default to `false`. See [Configure auto-updates](/en/discover-plugins#configure-auto-updates).

Use `source: 'settings'` to declare a small set of plugins inline without setting up a hosted marketplace repository. Plugins listed here must reference external sources such as GitHub or npm. You still need to enable each plugin separately in `enabledPlugins`.

```json theme={null}
{
  "extraKnownMarketplaces": {
    "team-tools": {
      "source": {
        "source": "settings",
        "name": "team-tools",
        "plugins": [
          {
            "name": "code-formatter",
            "source": {
              "source": "github",
              "repo": "acme-corp/code-formatter"
            }
          }
        ]
      }
    }
  }
}
```

#### `strictKnownMarketplaces`

**Managed settings only**: Controls which plugin marketplaces users are allowed to add and install plugins from. This setting can only be configured in [managed settings](/en/settings#settings-files) and provides administrators with strict control over marketplace sources.

**Managed settings file locations**:

* **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
* **Linux and WSL**: `/etc/claude-code/managed-settings.json`
* **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`

**Key characteristics**:

* Only available in managed settings (`managed-settings.json`)
* Cannot be overridden by user or project settings (highest precedence)
* Enforced BEFORE network/filesystem operations (blocked sources never execute)
* Uses exact matching for source specifications (including `ref`, `path` for git sources), except `hostPattern` and `pathPattern`, which use regex matching

**Allowlist behavior**:

* `undefined` (default): No restrictions - users can add any marketplace
* Empty array `[]`: Complete lockdown - users cannot add any new marketplaces
* List of sources: Users can only add marketplaces that match exactly

**All supported source types**:

The allowlist supports multiple marketplace source types. Most sources use exact matching, while `hostPattern` and `pathPattern` use regex matching against the marketplace host and filesystem path respectively.

1. **GitHub repositories**:

```json theme={null}
{ "source": "github", "repo": "acme-corp/approved-plugins" }
{ "source": "github", "repo": "acme-corp/security-tools", "ref": "v2.0" }
{ "source": "github", "repo": "acme-corp/plugins", "ref": "main", "path": "marketplace" }
```

Fields: `repo` (required), `ref` (optional: branch/tag/SHA), `path` (optional: subdirectory)

2. **Git repositories**:

```json theme={null}
{ "source": "git", "url": "https://gitlab.example.com/tools/plugins.git" }
{ "source": "git", "url": "https://bitbucket.org/acme-corp/plugins.git", "ref": "production" }
{ "source": "git", "url": "ssh://git@git.example.com/plugins.git", "ref": "v3.1", "path": "approved" }
```

Fields: `url` (required), `ref` (optional: branch/tag/SHA), `path` (optional: subdirectory)

3. **URL-based marketplaces**:

```json theme={null}
{ "source": "url", "url": "https://plugins.example.com/marketplace.json" }
{ "source": "url", "url": "https://cdn.example.com/marketplace.json", "headers": { "Authorization": "Bearer ${TOKEN}" } }
```

Fields: `url` (required), `headers` (optional: HTTP headers for authenticated access)

<Note>
  URL-based marketplaces only download the `marketplace.json` file. They do not download plugin files from the server. Plugins in URL-based marketplaces must use external sources (GitHub, npm, or git URLs) rather than relative paths. For plugins with relative paths, use a Git-based marketplace instead. See [Troubleshooting](/en/plugin-marketplaces#plugins-with-relative-paths-fail-in-url-based-marketplaces) for details.
</Note>

4. **NPM packages**:

```json theme={null}
{ "source": "npm", "package": "@acme-corp/claude-plugins" }
{ "source": "npm", "package": "@acme-corp/approved-marketplace" }
```

Fields: `package` (required, supports scoped packages)

5. **File paths**:

```json theme={null}
{ "source": "file", "path": "/usr/local/share/claude/acme-marketplace.json" }
{ "source": "file", "path": "/opt/acme-corp/plugins/marketplace.json" }
```

Fields: `path` (required: absolute path to marketplace.json file)

6. **Directory paths**:

```json theme={null}
{ "source": "directory", "path": "/usr/local/share/claude/acme-plugins" }
{ "source": "directory", "path": "/opt/acme-corp/approved-marketplaces" }
```

Fields: `path` (required: absolute path to directory containing `.claude-plugin/marketplace.json`)

7. **Host pattern matching**:

```json theme={null}
{ "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
{ "source": "hostPattern", "hostPattern": "^gitlab\\.internal\\.example\\.com$" }
```

Fields: `hostPattern` (required: regex pattern to match against the marketplace host)

Use host pattern matching when you want to allow all marketplaces from a specific host without enumerating each repository individually. This is useful for organizations with internal GitHub Enterprise or GitLab servers where developers create their own marketplaces.

Host extraction by source type:

* `github`: always matches against `github.com`
* `git`: extracts hostname from the URL (supports both HTTPS and SSH formats)
* `url`: extracts hostname from the URL
* `npm`, `file`, `directory`: not supported for host pattern matching

8. **Path pattern matching**:

```json theme={null}
{ "source": "pathPattern", "pathPattern": "^/opt/approved/" }
{ "source": "pathPattern", "pathPattern": ".*" }
```

Fields: `pathPattern` (required: regex pattern matched against the `path` field of `file` and `directory` sources)

Use path pattern matching to allow filesystem-based marketplaces alongside `hostPattern` restrictions for network sources. Set `".*"` to allow all local paths, or a narrower pattern to restrict to specific directories.

**Configuration examples**:

Example: allow specific marketplaces only:

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
    },
    {
      "source": "npm",
      "package": "@acme-corp/compliance-plugins"
    }
  ]
}
```

Example - Disable all marketplace additions:

```json theme={null}
{
  "strictKnownMarketplaces": []
}
```

Example: allow all marketplaces from an internal git server:

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

**Exact matching requirements**:

Marketplace sources must match **exactly** for a user's addition to be allowed. For git-based sources (`github` and `git`), this includes all optional fields:

* The `repo` or `url` must match exactly
* The `ref` field must match exactly (or both be undefined)
* The `path` field must match exactly (or both be undefined)

Examples of sources that **do NOT match**:

```json theme={null}
// These are DIFFERENT sources:
{ "source": "github", "repo": "acme-corp/plugins" }
{ "source": "github", "repo": "acme-corp/plugins", "ref": "main" }

// These are also DIFFERENT:
{ "source": "github", "repo": "acme-corp/plugins", "path": "marketplace" }
{ "source": "github", "repo": "acme-corp/plugins" }
```

**Comparison with `extraKnownMarketplaces`**:

| Aspect                | `strictKnownMarketplaces`            | `extraKnownMarketplaces`             |
| --------------------- | ------------------------------------ | ------------------------------------ |
| **Purpose**           | Organizational policy enforcement    | Team convenience                     |
| **Settings file**     | `managed-settings.json` only         | Any settings file                    |
| **Behavior**          | Blocks non-allowlisted additions     | Auto-installs missing marketplaces   |
| **When enforced**     | Before network/filesystem operations | After user trust prompt              |
| **Can be overridden** | No (highest precedence)              | Yes (by higher precedence settings)  |
| **Source format**     | Direct source object                 | Named marketplace with nested source |
| **Use case**          | Compliance, security restrictions    | Onboarding, standardization          |

**Format difference**:

`strictKnownMarketplaces` uses direct source objects:

```json theme={null}
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/plugins" }
  ]
}
```

`extraKnownMarketplaces` requires named marketplaces:

```json theme={null}
{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": { "source": "github", "repo": "acme-corp/plugins" }
    }
  }
}
```

**Using both together**:

`strictKnownMarketplaces` is a policy gate: it controls what users may add but does not register any marketplaces. To both restrict and pre-register a marketplace for all users, set both in `managed-settings.json`:

```json theme={null}
{
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "acme-corp/plugins" }
  ],
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": { "source": "github", "repo": "acme-corp/plugins" }
    }
  }
}
```

With only `strictKnownMarketplaces` set, users can still add the allowed marketplace manually via `/plugin marketplace add`, but it is not available automatically.

**Important notes**:

* Restrictions are checked BEFORE any network requests or filesystem operations
* When blocked, users see clear error messages indicating the source is blocked by managed policy
* The restriction is enforced on marketplace add and on plugin install, update, refresh, and auto-update. A marketplace added before the policy was set cannot be used to install or update plugins once its source no longer matches the allowlist
* Managed settings have the highest precedence and cannot be overridden

See [Managed marketplace restrictions](/en/plugin-marketplaces#managed-marketplace-restrictions) for user-facing documentation.

#### `strictPluginOnlyCustomization`

**Managed settings only**: blocks skills, agents, hooks, and MCP servers from user and project sources, so they can only come from plugins or managed settings. Combine it with `strictKnownMarketplaces` to control the full customization supply chain: the marketplace allowlist controls which plugins users can install, and this setting blocks everything that doesn't come from a plugin or from managed settings.

<Note>
  `strictPluginOnlyCustomization` requires Claude Code v2.1.82 or later. Earlier versions ignore the key and keep loading user and project customizations, so the lockdown isn't enforced until clients update.
</Note>

The value is either `true` to lock all four surfaces, or an array naming the surfaces to lock:

```json theme={null}
{
  "strictPluginOnlyCustomization": ["skills", "hooks"]
}
```

For each locked surface, Claude Code skips user-level and project-level sources and loads only plugin-provided and managed sources:

| Surface  | Blocked when locked                               | Still loads                                                            |
| :------- | :------------------------------------------------ | :--------------------------------------------------------------------- |
| `skills` | `~/.claude/skills/`, `.claude/skills/`            | Plugin skills, bundled skills, skills in the managed policy directory  |
| `agents` | `~/.claude/agents/`, `.claude/agents/`            | Plugin agents, built-in agents, agents in the managed policy directory |
| `hooks`  | Hooks in user, project, and local `settings.json` | Plugin hooks, hooks in managed settings                                |
| `mcp`    | Servers in `~/.claude.json` and `.mcp.json`       | Plugin MCP servers, [`managed-mcp.json`](/docs/en/managed-mcp) servers      |

Surface names that a Claude Code version doesn't recognize are ignored rather than failing the settings file, so you can add new surface names before all clients have updated.

### Managing plugins

Use the `/plugin` command to manage plugins interactively:

* Browse available plugins from marketplaces
* Install/uninstall plugins
* Enable/disable plugins
* View plugin details (skills, agents, hooks provided)
* Add/remove marketplaces

Learn more about the plugin system in the [plugins documentation](/docs/en/plugins).

## Environment variables

Environment variables let you control Claude Code behavior without editing settings files. Any variable can also be configured in [`settings.json`](#available-settings) under the `env` key to apply it to every session or roll it out to your team.

See the [environment variables reference](/docs/en/env-vars) for the full list.

## Tools available to Claude

Claude Code has access to a set of tools for reading, editing, searching, running commands, and orchestrating subagents. Tool names are the exact strings you use in permission rules and hook matchers.

See the [tools reference](/docs/en/tools-reference) for the full list and Bash tool behavior details.

## See also

* [Permissions](/docs/en/permissions): permission system, rule syntax, tool-specific patterns, and managed policies
* [Authentication](/docs/en/authentication): set up user access to Claude Code
* [Debug your configuration](/docs/en/debug-your-config): diagnose why a setting, hook, or MCP server isn't taking effect
* [Troubleshoot installation and login](/docs/en/troubleshoot-install): installation, authentication, and platform issues


---

## Environment variables

`https://code.claude.com/docs/en/env-vars`

Reference for environment variables that control Claude Code behavior.

Environment variables can control Claude Code behavior such as model selection, authentication, request routing, and feature toggles. Many of the same behaviors can also be configured through a [settings file](/docs/en/settings) field, a [CLI flag](/docs/en/cli-reference), or an in-session command like `/model`.

This page covers how to:

* [Set environment variables](#set-environment-variables) in your shell or in a settings file
* [Check which value applies](#precedence) when a behavior can be set more than one way
* [Look up the variables Claude Code reads](#variables)

## Set environment variables

A variable you set in your shell lasts for that terminal session, while a variable in a settings file applies every time `claude` runs.

### In your shell

Set the variable before launching `claude`:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash theme={null}
    export API_TIMEOUT_MS="1200000"
    claude
    ```

    To set it for every session, add the `export` line to `~/.bashrc`, `~/.zshrc`, or your shell's profile file.
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    $env:API_TIMEOUT_MS = "1200000"
    claude
    ```

    To set it for every session, run `[Environment]::SetEnvironmentVariable("API_TIMEOUT_MS", "1200000", "User")` and open a new terminal.
  </Tab>

  <Tab title="Windows CMD">
    ```batch theme={null}
    set API_TIMEOUT_MS=1200000
    claude
    ```

    To set it for every session, run `setx API_TIMEOUT_MS "1200000"` and open a new terminal.
  </Tab>
</Tabs>

### In settings files

Add variables under the `env` key in a `settings.json` file. Claude Code reads them directly from the file at startup, so they take effect no matter how `claude` was launched.

```json ~/.claude/settings.json theme={null}
{
  "env": {
    "API_TIMEOUT_MS": "1200000",
    "BASH_DEFAULT_TIMEOUT_MS": "300000"
  }
}
```

The file you choose controls who the variables apply to:

| File                          | Applies to                                                   |
| :---------------------------- | :----------------------------------------------------------- |
| `~/.claude/settings.json`     | You, in every project                                        |
| `.claude/settings.json`       | Everyone working in the project, checked into source control |
| `.claude/settings.local.json` | You, in this project only, not checked in                    |
| Managed settings              | Everyone in your organization, deployed by an admin          |

See [Settings files](/docs/en/settings#settings-files) for where each file lives and [Settings precedence](/docs/en/settings#settings-precedence) for how they combine when more than one sets the same variable.

## Precedence

Where the same behavior has both an environment variable and a settings field, the environment variable takes precedence. For example, `ANTHROPIC_MODEL` overrides the `model` setting, and `CLAUDE_CODE_AUTO_CONNECT_IDE` overrides `autoConnectIde`. The settings field applies when the environment variable is not set.

How an environment variable interacts with CLI flags and in-session commands varies per feature: `--model` and `/model` override `ANTHROPIC_MODEL`, while `CLAUDE_CODE_EFFORT_LEVEL` overrides `/effort`. When a variable interacts with another configuration source, its row in the [Variables](#variables) list states the precedence or links to the page that documents it.

Claude Code reads environment variables at startup, so changes take effect the next time you launch `claude`.

## Variables

| Variable                                                | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| :------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`                                     | API key sent as `X-Api-Key` header. When set, this key is used instead of your Claude Pro, Max, Team, or Enterprise subscription even if you are logged in. In non-interactive mode (`-p`), the key is always used when present. In interactive mode, you are prompted to approve the key once before it overrides your subscription. To use your subscription instead, run `unset ANTHROPIC_API_KEY`                                                                                                                                                                                                                                                       |
| `ANTHROPIC_AUTH_TOKEN`                                  | Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ANTHROPIC_AWS_API_KEY`                                 | Workspace API key for [Claude Platform on AWS](/docs/en/claude-platform-on-aws), generated in the AWS Console. Sent as `x-api-key` and takes precedence over AWS SigV4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ANTHROPIC_AWS_BASE_URL`                                | Override the [Claude Platform on AWS](/docs/en/claude-platform-on-aws) endpoint URL. Use for custom regions or when routing through an [LLM gateway](/docs/en/llm-gateway). Defaults to `https://aws-external-anthropic.{AWS_REGION}.api.aws`                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ANTHROPIC_AWS_WORKSPACE_ID`                            | Required for [Claude Platform on AWS](/docs/en/claude-platform-on-aws). Sent on every request as the `anthropic-workspace-id` header                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `ANTHROPIC_BASE_URL`                                    | Override the API endpoint to route requests through a proxy or gateway. When set to a non-first-party host, [MCP tool search](/docs/en/mcp#scale-with-mcp-tool-search) is disabled by default. Set `ENABLE_TOOL_SEARCH=true` if your proxy forwards `tool_reference` blocks                                                                                                                                                                                                                                                                                                                                                                                      |
| `ANTHROPIC_BEDROCK_BASE_URL`                            | Override the Bedrock endpoint URL. Use for custom Bedrock endpoints or when routing through an [LLM gateway](/docs/en/llm-gateway). See [Amazon Bedrock](/docs/en/amazon-bedrock)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`                     | Override the Bedrock Mantle endpoint URL. See [Mantle endpoint](/docs/en/amazon-bedrock#use-the-mantle-endpoint)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_BEDROCK_SERVICE_TIER`                        | Bedrock [service tier](https://docs.aws.amazon.com/bedrock/latest/userguide/service-tiers-inference.html) (`default`, `flex`, or `priority`). Sent as the `X-Amzn-Bedrock-Service-Tier` header. See [Amazon Bedrock](/docs/en/amazon-bedrock#service-tiers)                                                                                                                                                                                                                                                                                                                                                                                                      |
| `ANTHROPIC_BETAS`                                       | Comma-separated list of additional `anthropic-beta` header values to include in API requests. Claude Code already sends the beta headers it needs; use this to opt into an [Anthropic API beta](https://platform.claude.com/docs/en/api/beta-headers) before Claude Code adds native support. Unlike the [`--betas` flag](/docs/en/cli-reference#cli-flags), which requires API key authentication, this variable works with all auth methods including Claude.ai subscription                                                                                                                                                                                   |
| `ANTHROPIC_CUSTOM_HEADERS`                              | Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `ANTHROPIC_CUSTOM_MODEL_OPTION`                         | Model ID to add as a custom entry in the `/model` picker. Use this to make a non-standard or gateway-specific model selectable without replacing built-in aliases. See [Model configuration](/docs/en/model-config#add-a-custom-model-option)                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION`             | Display description for the custom model entry in the `/model` picker. Defaults to `Custom model (<model-id>)` when not set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME`                    | Display name for the custom model entry in the `/model` picker. Defaults to the model ID when not set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ANTHROPIC_CUSTOM_MODEL_OPTION_SUPPORTED_CAPABILITIES`  | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`                         | See [Model configuration](/docs/en/model-config#environment-variables)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION`             | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`                    | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES`  | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`                          | See [Model configuration](/docs/en/model-config#environment-variables)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`              | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`                     | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES`   | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL`                        | See [Model configuration](/docs/en/model-config#environment-variables)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION`            | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`                   | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES` | See [Model configuration](/docs/en/model-config#customize-pinned-model-display-and-capabilities)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_FOUNDRY_API_KEY`                             | API key for Microsoft Foundry authentication (see [Microsoft Foundry](/docs/en/microsoft-foundry))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ANTHROPIC_FOUNDRY_BASE_URL`                            | Full base URL for the Foundry resource (for example, `https://my-resource.services.ai.azure.com/anthropic`). Alternative to `ANTHROPIC_FOUNDRY_RESOURCE` (see [Microsoft Foundry](/docs/en/microsoft-foundry))                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ANTHROPIC_FOUNDRY_RESOURCE`                            | Foundry resource name (for example, `my-resource`). Required if `ANTHROPIC_FOUNDRY_BASE_URL` is not set (see [Microsoft Foundry](/docs/en/microsoft-foundry))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ANTHROPIC_MODEL`                                       | Name of the model setting to use (see [Model Configuration](/docs/en/model-config#environment-variables))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ANTHROPIC_SMALL_FAST_MODEL`                            | \[DEPRECATED] Name of [Haiku-class model for background tasks](/docs/en/costs)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION`                 | Override AWS region for the Haiku-class model when using Bedrock or Bedrock Mantle. On Bedrock, this only takes effect when `ANTHROPIC_DEFAULT_HAIKU_MODEL` or the deprecated `ANTHROPIC_SMALL_FAST_MODEL` is also set, since Bedrock otherwise uses the primary model for background tasks                                                                                                                                                                                                                                                                                                                                                                 |
| `ANTHROPIC_VERTEX_BASE_URL`                             | Override the Vertex AI endpoint URL. Use for custom Vertex endpoints or when routing through an [LLM gateway](/docs/en/llm-gateway). See [Google Vertex AI](/docs/en/google-vertex-ai)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ANTHROPIC_VERTEX_PROJECT_ID`                           | GCP project ID for Vertex AI requests. Overridden by `GCLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT`, or the project in your `GOOGLE_APPLICATION_CREDENTIALS` credential file. See [Google Vertex AI](/docs/en/google-vertex-ai)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `ANTHROPIC_WORKSPACE_ID`                                | Workspace ID for [workload identity federation](https://platform.claude.com/docs/en/manage-claude/workload-identity-federation). Set this when your federation rule is scoped to more than one workspace so the token exchange knows which workspace to target                                                                                                                                                                                                                                                                                                                                                                                              |
| `API_TIMEOUT_MS`                                        | Timeout for API requests in milliseconds (default: 600000, or 10 minutes; maximum: 2147483647). Increase this when requests time out on slow networks or when routing through a proxy. Values above the maximum overflow the underlying timer and cause requests to fail immediately                                                                                                                                                                                                                                                                                                                                                                        |
| `AWS_BEARER_TOKEN_BEDROCK`                              | Bedrock API key for authentication (see [Bedrock API keys](https://aws.amazon.com/blogs/machine-learning/accelerate-ai-development-with-amazon-bedrock-api-keys/))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `BASH_DEFAULT_TIMEOUT_MS`                               | Default timeout for long-running bash commands (default: 120000, or 2 minutes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `BASH_MAX_OUTPUT_LENGTH`                                | Maximum number of characters in bash outputs before the full output is saved to a file and Claude receives the path plus a short preview. See [Bash tool behavior](/docs/en/tools-reference#bash-tool-behavior)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `BASH_MAX_TIMEOUT_MS`                                   | Maximum timeout the model can set for long-running bash commands (default: 600000, or 10 minutes)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `CCR_FORCE_BUNDLE`                                      | Set to `1` to force [`claude --remote`](/docs/en/claude-code-on-the-web#send-local-repositories-without-github) to bundle and upload your local repository even when GitHub access is available                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `CLAUDECODE`                                            | Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, [hook](/docs/en/hooks) commands, [status line](/docs/en/statusline) commands, stdio [MCP server](/docs/en/mcp) subprocesses). Use to detect when a script is running inside a subprocess spawned by Claude Code                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`               | Set to `1` to disable all built-in [subagent](/docs/en/sub-agents) types such as Explore and Plan. Only applies in non-interactive mode (the `-p` flag). Useful for SDK users who want a blank slate                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`                        | Set to `1` to skip the `mcp__<server>__` prefix on tool names from SDK-created MCP servers. Tools use their original names. SDK usage only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`                   | Stall timeout in milliseconds for background subagents. Default `600000` (10 minutes). The timer resets on each streaming progress event; if no progress arrives within the window, the subagent is aborted and the task is marked failed, surfacing any partial result to the parent                                                                                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`                       | Set the percentage of context capacity (1-100) at which auto-compaction triggers. By default, auto-compaction triggers at approximately 95% capacity. Use lower values like `50` to compact earlier. Values above the default threshold have no effect. Applies to both main conversations and subagents. This percentage aligns with the `context_window.used_percentage` field available in [status line](/docs/en/statusline)                                                                                                                                                                                                                                 |
| `CLAUDE_AUTO_BACKGROUND_TASKS`                          | Set to `1` to force-enable automatic backgrounding of long-running agent tasks. When enabled, subagents are moved to the background after running for approximately two minutes                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`              | Return to the original working directory after each Bash or PowerShell command in the main session                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_ACCESSIBILITY`                             | Set to `1` to keep the native terminal cursor visible and disable the inverted-text cursor indicator. Allows screen magnifiers like macOS Zoom to track cursor position                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`          | Set to `1` to load memory files from directories specified with `--add-dir`. Loads `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/*.md`, and `CLAUDE.local.md`. By default, additional directories do not load memory files                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`                   | Set to `1` to repaint the entire screen on every frame in [fullscreen rendering](/docs/en/fullscreen) instead of sending incremental updates. Use this if fullscreen mode shows stale or misplaced text fragments. Claude Code enables this automatically for background sessions and [agent view](/docs/en/agent-view) on Windows                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`                     | Interval in milliseconds at which credentials should be refreshed (when using [`apiKeyHelper`](/docs/en/settings#available-settings))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_ATTRIBUTION_HEADER`                        | Set to `0` to omit the attribution block (client version and prompt fingerprint) from the start of the system prompt. Disabling it improves prompt-cache hit rates when routing through an [LLM gateway](/docs/en/llm-gateway). Anthropic API caching is unaffected                                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW`                       | Set the context capacity in tokens used for auto-compaction calculations. Defaults to the model's context window: 200K for standard models or 1M for [extended context](/docs/en/model-config#extended-context) models. Use a lower value like `500000` on a 1M model to treat the window as 500K for compaction purposes. The value is capped at the model's actual context window. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` is applied as a percentage of this value. Setting this variable decouples the compaction threshold from the status line's `used_percentage`, which always uses the model's full context window                                            |
| `CLAUDE_CODE_AUTO_CONNECT_IDE`                          | Override automatic [IDE connection](/docs/en/vs-code). By default, Claude Code connects automatically when launched inside a supported IDE's integrated terminal. Set to `false` to prevent this. Set to `true` to force a connection attempt when auto-detection fails, such as when tmux obscures the parent terminal. Takes precedence over the [`autoConnectIde`](/docs/en/settings#global-config-settings) global config setting                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_CERT_STORE`                                | Comma-separated list of CA certificate sources for TLS connections. `bundled` is the Mozilla CA set shipped with Claude Code. `system` is the operating system trust store. Default is `bundled,system`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CLAUDE_CODE_CLIENT_CERT`                               | Path to client certificate file for mTLS authentication                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CLAUDE_CODE_CLIENT_KEY`                                | Path to client private key file for mTLS authentication                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`                     | Passphrase for encrypted CLAUDE\_CODE\_CLIENT\_KEY (optional)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_DEBUG_LOGS_DIR`                            | Override the debug log file path. Despite the name, this is a file path, not a directory. Requires debug mode to be enabled separately via `--debug`, `/debug`, or the `DEBUG` environment variable: setting this variable alone does not enable logging. The [`--debug-file`](/docs/en/cli-reference#cli-flags) flag does both at once. Defaults to `~/.claude/debug/<session-id>.txt`                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_DEBUG_LOG_LEVEL`                           | Minimum log level written to the debug log file. Values: `verbose`, `debug` (default), `info`, `warn`, `error`. Set to `verbose` to include high-volume diagnostics like full status line command output, or raise to `error` to reduce noise                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT`                        | Set to `1` to disable [1M context window](/docs/en/model-config#extended-context) support. When set, 1M model variants are unavailable in the model picker. Useful for enterprise environments with compliance requirements                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`                 | Set to `1` to disable [adaptive reasoning](/docs/en/model-config#adjust-effort-level) on Opus 4.6 and Sonnet 4.6 and fall back to the fixed thinking budget controlled by `MAX_THINKING_TOKENS`. Has no effect on Opus 4.7 and later, which always use adaptive reasoning                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_DISABLE_AGENT_VIEW`                        | Set to `1` to turn off [background agents and agent view](/docs/en/agent-view): `claude agents`, `--bg`, `/background`, and the on-demand supervisor. Equivalent to the [`disableAgentView`](/docs/en/settings#available-settings) setting                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN`                  | Set to `1` to disable [fullscreen rendering](/docs/en/fullscreen) and use the classic main-screen renderer. The conversation stays in your terminal's native scrollback so `Cmd+f` and tmux copy mode work as usual. Takes precedence over `CLAUDE_CODE_NO_FLICKER` and the [`tui`](/docs/en/settings#available-settings) setting. You can also switch with `/tui default`                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_DISABLE_ATTACHMENTS`                       | Set to `1` to disable attachment processing. File mentions with `@` syntax are sent as plain text instead of being expanded into file content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY`                       | Set to `1` to disable [auto memory](/docs/en/memory#auto-memory). Set to `0` to force auto memory on even when `--bare` mode or [`autoMemoryEnabled: false`](/docs/en/settings#available-settings) would otherwise disable it. When disabled, Claude does not create or load auto memory files                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`                  | Set to `1` to disable all background task functionality, including the `run_in_background` parameter on Bash and subagent tools, auto-backgrounding, and the Ctrl+B shortcut                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_DISABLE_CLAUDE_MDS`                        | Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto-memory files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_DISABLE_CRON`                              | Set to `1` to disable [scheduled tasks](/docs/en/scheduled-tasks). The `/loop` skill and cron tools become unavailable and any already-scheduled tasks stop firing, including tasks that are already running mid-session                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`                | Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests. Use this when a proxy gateway rejects requests with errors like "Unexpected value(s) for the `anthropic-beta` header" or "Extra inputs are not permitted". Standard fields (`name`, `description`, `input_schema`, `cache_control`) are preserved.                                                                                                                                                                                                                             |
| `CLAUDE_CODE_DISABLE_FAST_MODE`                         | Set to `1` to disable [fast mode](/docs/en/fast-mode)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`                   | Set to `1` to disable the "How is Claude doing?" session quality surveys. Surveys are also disabled when `DISABLE_TELEMETRY`, `DO_NOT_TRACK`, or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set, unless `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL` opts back in. To set a sample rate instead of disabling outright, use the [`feedbackSurveyRate`](/docs/en/settings#available-settings) setting. See [Session quality surveys](/docs/en/data-usage#session-quality-surveys)                                                                                                                                                                                   |
| `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`                | Set to `1` to disable file [checkpointing](/docs/en/checkpointing). The `/rewind` command will not be able to restore code changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`                  | Set to `1` to remove built-in commit and PR workflow instructions and the git status snapshot from Claude's system prompt. Useful when using your own git workflow skills. Takes precedence over the [`includeGitInstructions`](/docs/en/settings#available-settings) setting when set                                                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP`                | Set to `1` to prevent automatic remapping of Opus 4.0 and 4.1 to the current Opus version on the Anthropic API. Use when you intentionally want to pin an older model. The remap does not run on Bedrock, Vertex, or Foundry                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_DISABLE_MOUSE`                             | Set to `1` to disable mouse tracking in [fullscreen rendering](/docs/en/fullscreen). Keyboard scrolling with `PgUp` and `PgDn` still works. Use this to keep your terminal's native copy-on-select behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`              | Equivalent of setting `DISABLE_AUTOUPDATER`, `DISABLE_FEEDBACK_COMMAND`, `DISABLE_ERROR_REPORTING`, and `DISABLE_TELEMETRY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK`             | Set to `1` to disable the non-streaming fallback when a streaming request fails mid-stream. Streaming errors propagate to the retry layer instead. Useful when a proxy or gateway causes the fallback to produce duplicate tool execution                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`  | Set to `1` to skip automatic addition of the official plugin marketplace on first run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_DISABLE_POLICY_SKILLS`                     | Set to `1` to skip loading skills from the system-wide managed skills directory. Useful for container or CI sessions that should not load operator-provisioned skills                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`                    | Set to `1` to disable automatic terminal title updates based on conversation context. In Agent SDK and `claude -p` sessions, this also skips the background Haiku request that generates the session title                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `CLAUDE_CODE_DISABLE_THINKING`                          | Set to `1` to force-disable [extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) regardless of model support or other settings. More direct than `MAX_THINKING_TOKENS=0`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL`                    | Set to `1` to disable virtual scrolling in [fullscreen rendering](/docs/en/fullscreen) and render every message in the transcript. Use this if scrolling in fullscreen mode shows blank regions where messages should appear                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CLAUDE_CODE_DISABLE_WORKFLOWS`                         | Set to `1` to disable [workflows](/docs/en/workflows#turn-workflows-off). Equivalent to the [`disableWorkflows`](/docs/en/settings#available-settings) setting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_EFFORT_LEVEL`                              | Set the effort level for supported models. Values: `low`, `medium`, `high`, `xhigh`, `max`, or `auto` to use the model default. Available levels depend on the model. Takes precedence over `/effort` and the `effortLevel` setting. See [Adjust effort level](/docs/en/model-config#adjust-effort-level)                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`                       | Override [session recap](/docs/en/interactive-mode#session-recap) availability. Set to `0` to force recaps off regardless of the `/config` toggle. Set to `1` to force recaps on when [`awaySummaryEnabled`](/docs/en/settings#available-settings) is `false`. Takes precedence over the setting and `/config` toggle                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_ENABLE_BACKGROUND_PLUGIN_REFRESH`          | Set to `1` to refresh plugin state at turn boundaries in [non-interactive mode](/docs/en/headless) after a background install completes. Off by default because the refresh changes the system prompt mid-session, which invalidates [prompt caching](/docs/en/prompt-caching) for that turn                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL`           | Set to `1` to route the "How is Claude doing?" session quality survey to your own [OpenTelemetry collector](/docs/en/monitoring-usage) when Anthropic-bound nonessential traffic is blocked. Survey ratings are emitted only as OTEL events to your configured collector. No survey data is sent to Anthropic in this mode. Applies when `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_TELEMETRY`, or `DO_NOT_TRACK` is set, and has no effect otherwise. `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY` and the organization product feedback policy take precedence                                                                                              |
| `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING`        | Controls whether tool call inputs stream from the API as Claude generates them. With this off, a large tool input such as a long file write arrives only after Claude finishes generating it, which can look like it's hanging. Enabled by default on the Anthropic API. On Bedrock and Vertex, enabled per model where the deployed container supports it. Set to `0` to opt out. Set to `1` to force on when routing through a proxy via `ANTHROPIC_BASE_URL`, `ANTHROPIC_VERTEX_BASE_URL`, or `ANTHROPIC_BEDROCK_BASE_URL`. Off by default on Foundry and [gateway](/docs/en/llm-gateway) connections                                                         |
| `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`            | Set to `1` to populate the `/model` picker from your gateway's `/v1/models` endpoint when `ANTHROPIC_BASE_URL` points at an Anthropic-compatible gateway such as LiteLLM, Kong, or an internal proxy. Off by default because gateways backed by a shared API key would otherwise show every user every model the key can access. Discovered models are still filtered by the [`availableModels`](/docs/en/settings#available-settings) allowlist                                                                                                                                                                                                                 |
| `CLAUDE_CODE_ENABLE_OPUS_4_7_FAST_MODE`                 | Removed in v2.1.142, when the [fast mode](/docs/en/fast-mode) default moved from Opus 4.6 to Opus 4.7. Set `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE=1` to keep Opus 4.6 instead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`                  | Set to `false` to disable prompt suggestions (the "Prompt suggestions" toggle in `/config`). These are the grayed-out predictions that appear in your prompt input after Claude responds. See [Prompt suggestions](/docs/en/interactive-mode#prompt-suggestions)                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_ENABLE_TASKS`                              | Controls whether sessions use the structured Task tools (`TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`) or the legacy `TodoWrite` tool. As of Claude Code v2.1.142, Task tools are the default in all modes. Set to `0` to revert to `TodoWrite`. See [Task list](/docs/en/interactive-mode#task-list) and [Migrate to Task tools](/docs/en/agent-sdk/todo-tracking#migrate-to-task-tools)                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_ENABLE_TELEMETRY`                          | Set to `1` to enable OpenTelemetry data collection for metrics and logging. Required before configuring OTel exporters. See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`                     | Time in milliseconds to wait after the query loop becomes idle before automatically exiting. Useful for automated workflows and scripts using SDK mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`                  | Set to `1` to enable [agent teams](/docs/en/agent-teams). Agent teams are experimental and disabled by default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_EXTRA_BODY`                                | JSON object to merge into the top level of every API request body. Useful for passing provider-specific parameters that Claude Code does not expose directly                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`               | Override the default token limit for file reads. Useful when you need to read larger files in full                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_FORCE_SYNC_OUTPUT`                         | Set to `1` to force-enable DEC private mode 2026 [synchronized output](https://gist.github.com/christianparpart/d8a62cc1ab659194337d73e399004036) when your terminal supports it but is not auto-detected. Useful for emulators such as Emacs `eat` that implement BSU/ESU but do not reply to the capability probe. Has no effect under tmux                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_FORK_SUBAGENT`                             | Set to `1` to enable [forked subagents](/docs/en/sub-agents#fork-the-current-conversation). A forked subagent inherits the full conversation context from the main session instead of starting fresh. When enabled, `/fork` spawns a forked subagent rather than acting as an alias for [`/branch`](/docs/en/commands), and all subagent spawns run in the background. Works in interactive mode and via the SDK or `claude -p`                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_GIT_BASH_PATH`                             | Windows only: path to the Git Bash executable (`bash.exe`). Use when Git Bash is installed but not in your PATH. See [Windows setup](/docs/en/setup#set-up-on-windows)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_GLOB_HIDDEN`                               | Set to `false` to exclude dotfiles from results when Claude invokes the [Glob tool](/docs/en/tools-reference#glob-tool-behavior). Included by default. Does not affect `@` file autocomplete, `ls`, Grep, or Read                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_GLOB_NO_IGNORE`                            | Set to `false` to make the [Glob tool](/docs/en/tools-reference#glob-tool-behavior) respect `.gitignore` patterns. By default, Glob returns all matching files including gitignored ones. Does not affect `@` file autocomplete, which has its own [`respectGitignore` setting](/docs/en/settings#available-settings)                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`                      | Timeout in seconds for Glob tool file discovery. Defaults to 20 seconds on most platforms and 60 seconds on WSL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `CLAUDE_CODE_HIDE_CWD`                                  | Set to `1` to hide the working directory in the startup logo. Useful for screenshares or recordings where the path exposes your OS username                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_IDE_HOST_OVERRIDE`                         | Override the host address used to connect to the IDE extension. By default Claude Code auto-detects the correct address, including WSL-to-Windows routing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`                     | Skip auto-installation of IDE extensions. Equivalent to setting [`autoInstallIdeExtension`](/docs/en/settings#global-config-settings) to `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_IDE_SKIP_VALID_CHECK`                      | Set to `1` to skip validation of IDE lockfile entries during connection. Use when auto-connect fails to find your IDE despite it running                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_MAX_CONTEXT_TOKENS`                        | Override the context window size Claude Code assumes for the active model. Only takes effect when `DISABLE_COMPACT` is also set. Use this when routing to a model through `ANTHROPIC_BASE_URL` whose context window does not match the built-in size for its name                                                                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS`                         | Set the maximum number of output tokens for most requests. Defaults and caps vary by model; see [max output tokens](https://platform.claude.com/docs/en/about-claude/models/overview#latest-models-comparison). Increasing this value reduces the effective context window available before [auto-compaction](/docs/en/costs#reduce-token-usage) triggers.                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_MAX_RETRIES`                               | Override the number of times to retry failed API requests (default: 10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`                  | Maximum number of read-only tools and subagents that can execute in parallel (default: 10). Higher values increase parallelism but consume more resources                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_MAX_TURNS`                                 | Cap the number of agentic turns when no explicit limit is passed. Equivalent to passing [`--max-turns`](/docs/en/cli-reference#cli-flags), which takes precedence when both are set. A value that is not a positive integer is rejected at startup with an error rather than treated as no cap                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_MCP_ALLOWLIST_ENV`                         | Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_NATIVE_CURSOR`                             | Set to `1` to show the terminal's own cursor at the input caret instead of a drawn block. The cursor respects the terminal's blink, shape, and focus settings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_NEW_INIT`                                  | Set to `1` to make `/init` run an interactive setup flow. The flow asks which files to generate, including CLAUDE.md, skills, and hooks, before exploring the codebase and writing them. Without this variable, `/init` generates a CLAUDE.md automatically without prompting.                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_NO_FLICKER`                                | Set to `1` to enable [fullscreen rendering](/docs/en/fullscreen), a research preview that reduces flicker and keeps memory flat in long conversations. Equivalent to the [`tui`](/docs/en/settings#available-settings) setting; you can also switch with `/tui fullscreen`                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`                       | OAuth refresh token for Claude.ai authentication. When set, `claude auth login` exchanges this token directly instead of opening a browser. Requires `CLAUDE_CODE_OAUTH_SCOPES`. Useful for provisioning authentication in automated environments                                                                                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_OAUTH_SCOPES`                              | Space-separated OAuth scopes the refresh token was issued with, such as `"user:profile user:inference user:sessions:claude_code"`. Required when `CLAUDE_CODE_OAUTH_REFRESH_TOKEN` is set                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_OAUTH_TOKEN`                               | OAuth access token for Claude.ai authentication. Alternative to `/login` for SDK and automated environments. Takes precedence over keychain-stored credentials. Generate one with [`claude setup-token`](/docs/en/authentication#generate-a-long-lived-token)                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE`               | Set to `1` to pin fast mode to Claude Opus 4.6 instead of the [current fast mode default](/docs/en/fast-mode#toggle-fast-mode), which depends on your Claude Code version. With the variable set, `/fast` runs on Opus 4.6. Fast mode for Opus 4.6 is deprecated, and this variable will be removed when it is retired                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS`                     | Timeout in milliseconds for flushing pending OpenTelemetry spans (default: 5000). See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`           | Interval for refreshing dynamic OpenTelemetry headers in milliseconds (default: 1740000 / 29 minutes). See [Dynamic headers](/docs/en/monitoring-usage#dynamic-headers)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS`                  | Timeout in milliseconds for the OpenTelemetry exporter to finish on shutdown (default: 2000). Increase if metrics are dropped at exit. See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`               | Set to `1` to let Claude Code run your package manager's upgrade command in the background when a new version is available. Applies to Homebrew and WinGet installations. Other package managers continue to show the upgrade command without running it. See [Auto updates](/docs/en/setup#auto-updates)                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_PERFORCE_MODE`                             | Set to `1` to enable Perforce-aware write protection. When set, Edit, Write, and NotebookEdit fail with a `p4 edit <file>` hint if the target file lacks the owner-write bit, which Perforce clears on synced files until `p4 edit` opens them. This prevents Claude Code from bypassing Perforce change tracking                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_PLUGIN_CACHE_DIR`                          | Override the plugins root directory. Despite the name, this sets the parent directory, not the cache itself: marketplaces and the plugin cache live in subdirectories under this path. Defaults to `~/.claude/plugins`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`                     | Timeout in milliseconds for git operations when installing or updating plugins (default: 120000). Increase this value for large repositories or slow network connections. See [Git operations time out](/docs/en/plugin-marketplaces#git-operations-time-out)                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`        | Set to `1` to keep the existing marketplace cache when a `git pull` fails instead of wiping and re-cloning. Useful in offline or airgapped environments where re-cloning would fail the same way. See [Marketplace updates fail in offline environments](/docs/en/plugin-marketplaces#marketplace-updates-fail-in-offline-environments)                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`                       | Set to `1` to clone GitHub `owner/repo` shorthand sources over HTTPS instead of SSH. Applies to plugin install and update, and to `/plugin marketplace add` and `update`. Useful in CI runners, containers, or any environment without a configured SSH key for `github.com`                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_PLUGIN_SEED_DIR`                           | Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows. Use this to bundle a pre-populated plugins directory into a container image. Claude Code registers marketplaces from these directories at startup and uses pre-cached plugins without re-cloning. See [Pre-populate plugins for containers](/docs/en/plugin-marketplaces#pre-populate-plugins-for-containers)                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`       | Set to `1` to stop Claude Code from passing `-ExecutionPolicy Bypass` when spawning PowerShell for tool calls, hooks, and status line commands, and respect the machine's effective execution policy instead. By default Claude Code bypasses execution policy at process scope so `.ps1` scripts and module imports work on default-Restricted Windows installs. Process-scope bypass never overrides Group Policy `MachinePolicy` or `UserPolicy` regardless of this setting                                                                                                                                                                              |
| `CLAUDE_CODE_PROPAGATE_TRACEPARENT`                     | Set to `1` to propagate W3C trace context when `ANTHROPIC_BASE_URL` points at a custom proxy. Propagation covers the `traceparent` header on model and HTTP MCP requests and the `TRACEPARENT` environment variable for Bash, PowerShell, and hook subprocesses. By default, propagation is enabled only when connected directly to the Anthropic API. See [Traces (beta)](/docs/en/monitoring-usage#traces-beta)                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`                  | Set by host platforms that embed Claude Code and manage model provider routing on its behalf. When set, provider-selection, endpoint, and authentication variables such as `CLAUDE_CODE_USE_BEDROCK`, `ANTHROPIC_BASE_URL`, and `ANTHROPIC_API_KEY` in settings files are ignored so user settings cannot override the host's routing. The automatic telemetry opt-out for Bedrock, Vertex, and Foundry is also skipped, so telemetry follows the standard `DISABLE_TELEMETRY` opt-out. See [Default behaviors by API provider](/docs/en/data-usage#default-behaviors-by-api-provider)                                                                           |
| `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`                      | Set to `1` to allow the proxy to perform DNS resolution instead of the caller. Opt-in for environments where the proxy should handle hostname resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_REMOTE`                                    | Set automatically to `true` when Claude Code is running as a [cloud session](/docs/en/claude-code-on-the-web). Read this from a hook or setup script to detect whether you are in a cloud environment                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_REMOTE_SESSION_ID`                         | Set automatically in [cloud sessions](/docs/en/claude-code-on-the-web) to the current session's ID. Read this to construct a link back to the session transcript. See [Link artifacts back to the session](/docs/en/claude-code-on-the-web#link-artifacts-back-to-the-session)                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`                   | Set to `1` to automatically resume if the previous session ended mid-turn. Used in SDK mode so the model continues without requiring the SDK to re-send the prompt                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_RESUME_PROMPT`                             | Override the continuation message injected when resuming a session that ended mid-turn. Defaults to `Continue from where you left off.`. Spawn scripts for long-running agents can set this to a more directive boot message. An empty string uses the default                                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_SCRIPT_CAPS`                               | JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set. Keys are substrings matched against the command text; values are integer call limits. For example, `{"deploy.sh": 2}` allows `deploy.sh` to be called at most twice. Matching is substring-based so shell-expansion tricks like `./scripts/deploy.sh $(evil)` still count against the cap. Runtime fan-out via `xargs` or `find -exec` is not detected; this is a defense-in-depth control                                                                                                                                  |
| `CLAUDE_CODE_SCROLL_SPEED`                              | Set the mouse wheel scroll multiplier in [fullscreen rendering](/docs/en/fullscreen#mouse-wheel-scrolling). Accepts values from 1 to 20. Set to `3` to match `vim` if your terminal sends one wheel event per notch without amplification. Ignored in the JetBrains IDE terminal, where Claude Code uses its own scroll handling                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`               | Override the time budget in milliseconds for [SessionEnd](/docs/en/hooks#sessionend) hooks. Applies to session exit, `/clear`, and switching sessions via interactive `/resume`. By default the budget is 1.5 seconds, automatically raised to the highest per-hook `timeout` configured in settings files, up to 60 seconds. Timeouts on plugin-provided hooks do not raise the budget                                                                                                                                                                                                                                                                          |
| `CLAUDE_CODE_SESSION_ID`                                | Set automatically to the current session ID in Bash and PowerShell tool subprocesses, [hook command](/docs/en/hooks) subprocesses, and stdio [MCP server](/docs/en/mcp) subprocesses. For Bash, PowerShell, and hooks this matches the `session_id` field in the hook JSON input and is updated on `/clear`. An MCP server subprocess retains the ID it was spawned with, and may receive the initial startup ID rather than the resumed ID when launched via `--resume` or `--continue`. Use to correlate scripts and external tools with the Claude Code session that launched them                                                                                 |
| `CLAUDE_CODE_SHELL`                                     | Override automatic shell detection. Useful when your login shell differs from your preferred working shell (for example, `bash` vs `zsh`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_SHELL_PREFIX`                              | Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, [hook](/docs/en/hooks) commands, and stdio [MCP server](/docs/en/mcp) startup commands. Useful for logging or auditing. Example: setting `/path/to/logger.sh` runs each command as `/path/to/logger.sh <command>`                                                                                                                                                                                                                                                                                                                                                                       |
| `CLAUDE_CODE_SIMPLE`                                    | Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools. MCP tools from `--mcp-config` are still available. Disables auto-discovery of hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md. OAuth tokens and keychain credentials are not read, so Anthropic authentication must come from `ANTHROPIC_API_KEY` or an `apiKeyHelper` in `--settings`. Equivalent to passing [`--bare`](/docs/en/headless#start-faster-with-bare-mode)                                                                                                                                                                        |
| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`                      | Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model. Set to `0`, `false`, `no`, or `off` to opt out even on models where the experiment or server configuration would otherwise enable it. The full tool set, hooks, MCP servers, and CLAUDE.md discovery remain enabled                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH`                   | Skip client-side authentication for [Claude Platform on AWS](/docs/en/claude-platform-on-aws), for gateways that sign requests themselves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_SKIP_BEDROCK_AUTH`                         | Skip AWS authentication for Bedrock (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`                         | Skip Azure authentication for Microsoft Foundry (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_SKIP_MANTLE_AUTH`                          | Skip AWS authentication for Bedrock Mantle (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY`                       | Set to `1` to skip writing prompt history and session transcripts to disk. Sessions started with this variable set do not appear in `--resume`, `--continue`, or up-arrow history. Useful for ephemeral scripted sessions                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_SKIP_VERTEX_AUTH`                          | Skip Google authentication for Vertex (for example, when using an LLM gateway)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`                       | Maximum number of consecutive times a [Stop](/docs/en/hooks#stop) or [SubagentStop](/docs/en/hooks#subagentstop) hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8). Set to `0` to disable the cap. Raise this if your hook legitimately needs more iterations to resolve                                                                                                                                                                                                                                                                                                                                      |
| `CLAUDE_CODE_SUBAGENT_MODEL`                            | See [Model configuration](/docs/en/model-config)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`                      | Set to `1` to strip Anthropic and cloud provider credentials from subprocess environments (Bash tool, hooks, MCP stdio servers). The parent Claude process keeps these credentials for API calls, but child processes cannot read them, reducing exposure to prompt injection attacks that attempt to exfiltrate secrets via shell expansion. On Linux, this also runs Bash subprocesses in an isolated PID namespace so they cannot read host process environments via `/proc`; as a side effect, `ps`, `pgrep`, and `kill` cannot see or signal host processes. `claude-code-action` sets this automatically when `allowed_non_write_users` is configured |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`                       | Set to `1` in non-interactive mode (the `-p` flag) to wait for plugin installation to complete before the first query. Without this, plugins install in the background and may not be available on the first turn. Combine with `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS` to bound the wait                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`            | Timeout in milliseconds for synchronous plugin installation. When exceeded, Claude Code proceeds without plugins and logs an error. No default: without this variable, synchronous installation waits until complete                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_SYNC_SKILLS`                               | Set to `1` to download your enabled claude.ai skills into `~/.claude/skills/` before the first query and resync every 10 minutes. Applies only in non-interactive mode with the `-p` flag. Set automatically in [Claude Code on the web](/docs/en/claude-code-on-the-web) sessions. Requires claude.ai authentication                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`               | Timeout in milliseconds for the first query to wait on the initial skills sync when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000). When exceeded, the query proceeds and remaining skill downloads continue in the background                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_SYNTAX_HIGHLIGHT`                          | Set to `false` to disable syntax highlighting in diff output. Useful when colors interfere with your terminal setup. To also disable highlighting in code blocks and file previews, use the [`syntaxHighlightingDisabled`](/docs/en/settings) setting                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CLAUDE_CODE_TASK_LIST_ID`                              | Share a task list across sessions. Set the same ID in multiple Claude Code instances to coordinate on a shared task list. See [Task list](/docs/en/interactive-mode#task-list)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CLAUDE_CODE_TEAM_NAME`                                 | Name of the agent team this teammate belongs to. Set automatically on [agent team](/docs/en/agent-teams) members                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `CLAUDE_CODE_TMPDIR`                                    | Override the temp directory used for internal temp files. Claude Code appends `/claude-{uid}/` (Unix) or `/claude/` (Windows) to this path. Default: `/tmp` on macOS, `os.tmpdir()` on Linux/Windows                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_TMUX_TRUECOLOR`                            | Set to `1` to allow 24-bit truecolor output inside tmux. By default, Claude Code clamps to 256 colors when `$TMUX` is set because tmux does not pass through truecolor escape sequences unless configured to. Set this after adding `set -ga terminal-overrides ',*:Tc'` to your `~/.tmux.conf`. See [Terminal configuration](/docs/en/terminal-config) for other tmux settings                                                                                                                                                                                                                                                                                  |
| `CLAUDE_CODE_USE_ANTHROPIC_AWS`                         | Use [Claude Platform on AWS](/docs/en/claude-platform-on-aws)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `CLAUDE_CODE_USE_BEDROCK`                               | Use [Bedrock](/docs/en/amazon-bedrock)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `CLAUDE_CODE_USE_FOUNDRY`                               | Use [Microsoft Foundry](/docs/en/microsoft-foundry)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_CODE_USE_MANTLE`                                | Use the Bedrock [Mantle endpoint](/docs/en/amazon-bedrock#use-the-mantle-endpoint)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `CLAUDE_CODE_USE_NATIVE_FILE_SEARCH`                    | Set to `1` to discover custom commands, subagents, and output styles using Node.js file APIs instead of ripgrep. Set this if the bundled ripgrep binary is unavailable or blocked in your environment. Does not affect the Grep or file search tools                                                                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL`                       | Controls the PowerShell tool. On Windows without Git Bash, the tool is enabled automatically; set to `0` to disable it. On Windows with Git Bash installed, the tool is rolling out progressively: set to `1` to opt in or `0` to opt out. On Linux, macOS, and WSL, set to `1` to enable it, which requires `pwsh` on your `PATH`. When enabled on Windows, Claude can run PowerShell commands natively instead of routing through Git Bash. See [PowerShell tool](/docs/en/tools-reference#powershell-tool)                                                                                                                                                    |
| `CLAUDE_CODE_USE_VERTEX`                                | Use [Vertex](/docs/en/google-vertex-ai)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `CLAUDE_CONFIG_DIR`                                     | Override the configuration directory (default: `~/.claude`). All settings, credentials, session history, and plugins are stored under this path. Useful for running multiple accounts side by side: for example, `alias claude-work='CLAUDE_CONFIG_DIR=~/.claude-work claude'`                                                                                                                                                                                                                                                                                                                                                                              |
| `CLAUDE_EFFORT`                                         | Set automatically in Bash tool subprocesses and hook commands to the active [effort level](/docs/en/model-config#adjust-effort-level) for the turn: `low`, `medium`, `high`, `xhigh`, or `max`. Ultracode is not a distinct level and reports as `xhigh`. Matches the `effort.level` field passed to [hooks](/docs/en/hooks). Only set when the current model supports the effort parameter                                                                                                                                                                                                                                                                           |
| `CLAUDE_ENABLE_BYTE_WATCHDOG`                           | Set to `1` to force-enable the byte-level streaming idle watchdog, or set to `0` to force-disable it. When unset, the watchdog is enabled by default for Anthropic API connections. The byte watchdog aborts a connection when no bytes arrive on the wire for the duration set by `CLAUDE_STREAM_IDLE_TIMEOUT_MS`, with a minimum of 5 minutes, independent of the event-level watchdog                                                                                                                                                                                                                                                                    |
| `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`                   | Set to `1` to enable the byte-level streaming idle watchdog on Amazon Bedrock `vnd.amazon.eventstream` responses. Off by default. Configure the timeout with `CLAUDE_STREAM_IDLE_TIMEOUT_MS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `CLAUDE_ENABLE_STREAM_WATCHDOG`                         | Set to `1` to enable the event-level streaming idle watchdog. Off by default. Applies to all providers, including Bedrock. For Vertex and Foundry, this is the only idle watchdog available. On Bedrock, you can also enable the independent byte-level watchdog with `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`; the two run together when both are set. Configure the timeout with `CLAUDE_STREAM_IDLE_TIMEOUT_MS`                                                                                                                                                                                                                                             |
| `CLAUDE_ENV_FILE`                                       | Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command. Use to persist virtualenv or conda activation across commands. Also populated dynamically by [SessionStart](/docs/en/hooks#persist-environment-variables), [Setup](/docs/en/hooks#setup), [CwdChanged](/docs/en/hooks#cwdchanged), and [FileChanged](/docs/en/hooks#filechanged) hooks                                                                                                                                                                                                                            |
| `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`             | Prefix for auto-generated [Remote Control](/docs/en/remote-control) session names when no explicit name is provided. Defaults to your machine's hostname, producing names like `myhost-graceful-unicorn`. The `--remote-control-session-name-prefix` CLI flag sets the same value for a single invocation                                                                                                                                                                                                                                                                                                                                                        |
| `CLAUDE_STREAM_IDLE_TIMEOUT_MS`                         | Timeout in milliseconds before the streaming idle watchdog closes a stalled connection. Default and minimum `300000` (5 minutes) for both the byte-level and event-level watchdogs; lower values are silently clamped to absorb extended thinking pauses and proxy buffering. For third-party providers, requires `CLAUDE_ENABLE_STREAM_WATCHDOG=1`. On Bedrock, also applies when `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK=1`                                                                                                                                                                                                                                  |
| `DEBUG`                                                 | Set to `1` to enable debug mode, equivalent to launching with [`--debug`](/docs/en/cli-reference#cli-flags). Debug logs are written to `~/.claude/debug/<session-id>.txt`, or to the path set by `CLAUDE_CODE_DEBUG_LOGS_DIR`. Only the truthy values `1`, `true`, `yes`, and `on` enable debug mode, so namespace patterns like `DEBUG=express:*` set for other tools do not trigger it                                                                                                                                                                                                                                                                         |
| `DISABLE_AUTOUPDATER`                                   | Set to `1` to disable automatic background updates. Manual `claude update` still works. Use `DISABLE_UPDATES` to block both                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DISABLE_AUTO_COMPACT`                                  | Set to `1` to disable automatic compaction when approaching the context limit. The manual `/compact` command remains available. Use when you want explicit control over when compaction occurs                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `DISABLE_COMPACT`                                       | Set to `1` to disable all compaction: both automatic compaction and the manual `/compact` command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `DISABLE_COST_WARNINGS`                                 | Set to `1` to disable cost warning messages                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DISABLE_DOCTOR_COMMAND`                                | Set to `1` to hide the `/doctor` command. Useful for managed deployments where users should not run installation diagnostics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `DISABLE_ERROR_REPORTING`                               | Set to `1` to opt out of Sentry error reporting                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `DISABLE_EXTRA_USAGE_COMMAND`                           | Set to `1` to hide the `/usage-credits` command that lets users purchase additional usage beyond rate limits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `DISABLE_FEEDBACK_COMMAND`                              | Set to `1` to disable the `/feedback` command. The older name `DISABLE_BUG_COMMAND` is also accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `DISABLE_GROWTHBOOK`                                    | Set to `1` to disable GrowthBook feature-flag fetching and use code defaults for every flag. Telemetry event logging stays on unless `DISABLE_TELEMETRY` is also set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `DISABLE_INSTALLATION_CHECKS`                           | Set to `1` to disable installation warnings. Use only when manually managing the installation location, as this can mask issues with standard installations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DISABLE_INSTALL_GITHUB_APP_COMMAND`                    | Set to `1` to hide the `/install-github-app` command. Already hidden when using third-party providers (Bedrock, Vertex, or Foundry)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `DISABLE_INTERLEAVED_THINKING`                          | Set to `1` to prevent sending the interleaved-thinking beta header. Useful when your LLM gateway or provider does not support [interleaved thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking#interleaved-thinking)                                                                                                                                                                                                                                                                                                                                                                                                          |
| `DISABLE_LOGIN_COMMAND`                                 | Set to `1` to hide the `/login` command. Useful when authentication is handled externally via API keys or `apiKeyHelper`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DISABLE_LOGOUT_COMMAND`                                | Set to `1` to hide the `/logout` command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DISABLE_PROMPT_CACHING`                                | Set to `1` to disable [prompt caching](/docs/en/prompt-caching#disable-prompt-caching) for all models (takes precedence over per-model settings)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DISABLE_PROMPT_CACHING_HAIKU`                          | Set to `1` to disable prompt caching for Haiku models                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `DISABLE_PROMPT_CACHING_OPUS`                           | Set to `1` to disable prompt caching for Opus models                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `DISABLE_PROMPT_CACHING_SONNET`                         | Set to `1` to disable prompt caching for Sonnet models                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `DISABLE_TELEMETRY`                                     | Set to `1` to opt out of telemetry. Telemetry events do not include user data like code, file paths, or bash commands. Also disables feature-flag fetching with the same effect as `DISABLE_GROWTHBOOK`, so some flagged features may be unavailable                                                                                                                                                                                                                                                                                                                                                                                                        |
| `DISABLE_UPDATES`                                       | Set to `1` to block all updates including manual `claude update` and `claude install`. Stricter than `DISABLE_AUTOUPDATER`. Use when distributing Claude Code through your own channels and users should not self-update                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `DISABLE_UPGRADE_COMMAND`                               | Set to `1` to hide the `/upgrade` command                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `DO_NOT_TRACK`                                          | Set to `1` to opt out of telemetry. Equivalent to setting `DISABLE_TELEMETRY`. Claude Code honors this as the cross-tool convention recognized by many developer CLIs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ENABLE_CLAUDEAI_MCP_SERVERS`                           | Set to `false` to disable [claude.ai MCP servers](/docs/en/mcp#use-mcp-servers-from-claude-ai) in Claude Code. Enabled by default for logged-in users                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `ENABLE_PROMPT_CACHING_1H`                              | Set to `1` to request a 1-hour [prompt cache TTL](/docs/en/prompt-caching#cache-lifetime) instead of the default 5 minutes. Intended for API key, [Bedrock](/docs/en/amazon-bedrock), [Vertex](/docs/en/google-vertex-ai), [Foundry](/docs/en/microsoft-foundry), and [Claude Platform on AWS](/docs/en/claude-platform-on-aws) users. Subscription users within included usage receive 1-hour TTL automatically. 1-hour cache writes are billed at a higher rate                                                                                                                                                                                                                    |
| `ENABLE_PROMPT_CACHING_1H_BEDROCK`                      | Deprecated. Use `ENABLE_PROMPT_CACHING_1H` instead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ENABLE_TOOL_SEARCH`                                    | Controls [MCP tool search](/docs/en/mcp#scale-with-mcp-tool-search). Unset: all MCP tools deferred by default, but loaded upfront on Vertex AI or when `ANTHROPIC_BASE_URL` points to a non-first-party host. Values: `true` (always defer and send the beta header, requests fail on Vertex AI models earlier than Sonnet 4.5 or Opus 4.5, or on proxies that do not support `tool_reference`), `auto` (threshold mode: load upfront if tools fit within 10% of context), `auto:N` (custom threshold, e.g., `auto:5` for 5%), `false` (load all upfront)                                                                                                        |
| `FALLBACK_FOR_ALL_PRIMARY_MODELS`                       | Set to any non-empty value to trigger fallback to [`--fallback-model`](/docs/en/cli-reference#cli-flags) after repeated overload errors on any primary model. By default, only Opus models trigger the fallback                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `FORCE_AUTOUPDATE_PLUGINS`                              | Set to `1` to force plugin auto-updates even when the main auto-updater is disabled via `DISABLE_AUTOUPDATER`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `FORCE_PROMPT_CACHING_5M`                               | Set to `1` to force the 5-minute prompt cache TTL even when 1-hour TTL would otherwise apply. Overrides `ENABLE_PROMPT_CACHING_1H`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `HTTP_PROXY`                                            | Specify HTTP proxy server for network connections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `HTTPS_PROXY`                                           | Specify HTTPS proxy server for network connections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `IS_DEMO`                                               | Set to `1` to enable demo mode: hides your email and organization name from the header and `/status` output, and skips onboarding. Useful when streaming or recording a session                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `MAX_MCP_OUTPUT_TOKENS`                                 | Maximum number of tokens allowed in MCP tool responses. Claude Code displays a warning when output exceeds 10,000 tokens. Tools that declare [`anthropic/maxResultSizeChars`](/docs/en/mcp#raise-the-limit-for-a-specific-tool) use that character limit for text content instead, but image content from those tools is still subject to this variable (default: 25000)                                                                                                                                                                                                                                                                                         |
| `MAX_STRUCTURED_OUTPUT_RETRIES`                         | Number of times to retry when the model's response fails validation against the [`--json-schema`](/docs/en/cli-reference#cli-flags) in non-interactive mode (the `-p` flag). Defaults to 5                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `MAX_THINKING_TOKENS`                                   | Override the [extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking) token budget. The ceiling is the model's [max output tokens](https://platform.claude.com/docs/en/about-claude/models/overview#latest-models-comparison) minus one. Set to `0` to disable thinking entirely. On models with [adaptive reasoning](/docs/en/model-config#adjust-effort-level), the budget is ignored unless adaptive reasoning is disabled via `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`                                                                                                                                                    |
| `MCP_CLIENT_SECRET`                                     | OAuth client secret for MCP servers that require [pre-configured credentials](/docs/en/mcp#use-pre-configured-oauth-credentials). Avoids the interactive prompt when adding a server with `--client-secret`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `MCP_CONNECTION_NONBLOCKING`                            | Controls whether startup waits for MCP servers to connect before the first query. As of Claude Code v2.1.142, MCP startup is non-blocking by default: servers connect in the background and their tools become available as they finish. Set to `0` to restore the blocking 5-second connection wait. Servers configured with [`alwaysLoad: true`](/docs/en/mcp#exempt-a-server-from-deferral) still block startup regardless, since their tools must be present when the first prompt is built                                                                                                                                                                  |
| `MCP_CONNECT_TIMEOUT_MS`                                | How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000). Applies when `MCP_CONNECTION_NONBLOCKING=0` or for servers marked [`alwaysLoad: true`](/docs/en/mcp#exempt-a-server-from-deferral). Servers still pending at the deadline keep connecting in the background but won't appear until the next query. Distinct from `MCP_TIMEOUT`, which bounds an individual server's connect attempt                                                                                                                                                                                            |
| `MCP_OAUTH_CALLBACK_PORT`                               | Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with [pre-configured credentials](/docs/en/mcp#use-pre-configured-oauth-credentials)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`               | Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `MCP_SERVER_CONNECTION_BATCH_SIZE`                      | Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `MCP_TIMEOUT`                                           | Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `MCP_TOOL_TIMEOUT`                                      | Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours). A per-server `timeout` field in `.mcp.json` overrides this for that server. Values below 1000 are floored to one second                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `NO_PROXY`                                              | List of domains and IPs to which requests will be directly issued, bypassing proxy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `OTEL_LOG_RAW_API_BODIES`                               | Emit Anthropic Messages API request and response JSON as `api_request_body` / `api_response_body` log events. Set to `1` for inline bodies truncated at 60 KB, or `file:<dir>` to write untruncated bodies to disk and emit a `body_ref` path instead. Disabled by default; bodies include the entire conversation history. See [Monitoring](/docs/en/monitoring-usage#api-request-body-event)                                                                                                                                                                                                                                                                   |
| `OTEL_LOG_TOOL_CONTENT`                                 | Set to `1` to include tool input and output content in OpenTelemetry span events. Disabled by default to protect sensitive data. See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `OTEL_LOG_TOOL_DETAILS`                                 | Set to `1` to include tool input arguments, MCP server names, raw error strings on tool failures, and other tool details in OpenTelemetry traces and logs. Disabled by default to protect PII. See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `OTEL_LOG_USER_PROMPTS`                                 | Set to `1` to include user prompt text in OpenTelemetry traces and logs. Disabled by default (prompts are redacted). See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `OTEL_METRICS_INCLUDE_ACCOUNT_UUID`                     | Set to `false` to exclude account UUID from metrics attributes (default: included). See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `OTEL_METRICS_INCLUDE_ENTRYPOINT`                       | Set to `true` to include the session entrypoint in metrics attributes (default: excluded). See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `OTEL_METRICS_INCLUDE_SESSION_ID`                       | Set to `false` to exclude session ID from metrics attributes (default: included). See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `OTEL_METRICS_INCLUDE_VERSION`                          | Set to `true` to include Claude Code version in metrics attributes (default: excluded). See [Monitoring](/docs/en/monitoring-usage)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET`                        | Override the character budget for skill metadata shown to the [Skill tool](/docs/en/skills#control-who-invokes-a-skill). The budget scales dynamically at 1% of the context window, with a fallback of 8,000 characters. Legacy name kept for backwards compatibility                                                                                                                                                                                                                                                                                                                                                                                            |
| `TASK_MAX_OUTPUT_LENGTH`                                | Maximum number of characters in [subagent](/docs/en/sub-agents) output before truncation (default: 32000, maximum: 160000). When truncated, the full output is saved to disk and the path is included in the truncated response                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `USE_BUILTIN_RIPGREP`                                   | Set to `0` to use system-installed `rg` instead of `rg` included with Claude Code                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `VERTEX_REGION_CLAUDE_3_5_HAIKU`                        | Override region for Claude 3.5 Haiku when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `VERTEX_REGION_CLAUDE_3_5_SONNET`                       | Override region for Claude 3.5 Sonnet when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `VERTEX_REGION_CLAUDE_3_7_SONNET`                       | Override region for Claude 3.7 Sonnet when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `VERTEX_REGION_CLAUDE_4_0_OPUS`                         | Override region for Claude 4.0 Opus when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `VERTEX_REGION_CLAUDE_4_0_SONNET`                       | Override region for Claude 4.0 Sonnet when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `VERTEX_REGION_CLAUDE_4_1_OPUS`                         | Override region for Claude 4.1 Opus when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `VERTEX_REGION_CLAUDE_4_5_OPUS`                         | Override region for Claude Opus 4.5 when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `VERTEX_REGION_CLAUDE_4_5_SONNET`                       | Override region for Claude Sonnet 4.5 when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `VERTEX_REGION_CLAUDE_4_6_OPUS`                         | Override region for Claude Opus 4.6 when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `VERTEX_REGION_CLAUDE_4_6_SONNET`                       | Override region for Claude Sonnet 4.6 when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `VERTEX_REGION_CLAUDE_4_7_OPUS`                         | Override region for Claude Opus 4.7 when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `VERTEX_REGION_CLAUDE_HAIKU_4_5`                        | Override region for Claude Haiku 4.5 when using Vertex AI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Standard OpenTelemetry exporter variables (`OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, `OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_METRIC_EXPORT_INTERVAL`, `OTEL_RESOURCE_ATTRIBUTES`, and signal-specific variants) are also supported. See [Monitoring](/docs/en/monitoring-usage) for configuration details.

## See also

* [Settings](/docs/en/settings): all `settings.json` configuration, including the `env` key
* [CLI reference](/docs/en/cli-reference): launch-time flags
* [Network configuration](/docs/en/network-config): proxy and TLS setup
* [Monitoring](/docs/en/monitoring-usage): OpenTelemetry configuration


---

## Configure your terminal for Claude Code

`https://code.claude.com/docs/en/terminal-config`

Fix Shift+Enter for newlines, get a terminal bell when Claude finishes, configure tmux, match the color theme, and enable Vim mode in the Claude Code CLI.

Claude Code works in any terminal without configuration. This page is for when something specific is not behaving the way you expect. Find your symptom below. If everything already feels right, you do not need this page.

* [Shift+Enter submits instead of inserting a newline](#enter-multiline-prompts)
* [Option-key shortcuts do nothing on macOS](#enable-option-key-shortcuts-on-macos)
* [No sound or alert when Claude finishes](#get-a-terminal-bell-or-notification)
* [You run Claude Code inside tmux](#configure-tmux)
* [Display flickers or scrollback jumps](#switch-to-fullscreen-rendering)
* [You want Vim keys in the prompt](#edit-prompts-with-vim-keybindings)

This page is about getting your terminal to send the right signals to Claude Code. To change which keys Claude Code itself responds to, see [keybindings](/docs/en/keybindings) instead.

## Enter multiline prompts

Pressing Enter submits your message. To add a line break without submitting, press Ctrl+J, or type `\` and then press Enter. Both work in every terminal with no setup.

In most terminals you can also press Shift+Enter, but support varies by terminal emulator:

| Terminal                                                                | Shift+Enter for newline                     |
| :---------------------------------------------------------------------- | :------------------------------------------ |
| Ghostty, Kitty, iTerm2, WezTerm, Warp, Apple Terminal, Windows Terminal | Works without setup                         |
| VS Code, Cursor, Windsurf, Alacritty, Zed                               | Run `/terminal-setup` once                  |
| gnome-terminal, JetBrains IDEs such as PyCharm and Android Studio       | Not available; use Ctrl+J or `\` then Enter |

For VS Code, Cursor, Windsurf, Alacritty, and Zed, `/terminal-setup` writes Shift+Enter and other keybindings into the terminal's configuration file. Existing bindings are left in place; if you see a message such as `VSCode terminal Shift+Enter key binding already configured`, no change was made. Run `/terminal-setup` directly in the host terminal rather than inside tmux or screen, since it needs to write to the host terminal's configuration.

In VS Code, Cursor, and Windsurf, `/terminal-setup` also updates two editor settings: it sets `terminal.integrated.gpuAcceleration` to `"off"` to prevent garbled text in the integrated terminal, and it sets `terminal.integrated.mouseWheelScrollSensitivity` for smoother scrolling in [fullscreen mode](/docs/en/fullscreen). To undo the GPU acceleration change, set it back to `"auto"` and reload the editor window.

If you are running inside tmux, Shift+Enter also requires the [tmux configuration below](#configure-tmux) even when the outer terminal supports it.

To bind newline to a different key, or to swap behavior so Enter inserts a newline and Shift+Enter submits, map the `chat:newline` and `chat:submit` actions in your [keybindings file](/docs/en/keybindings).

## Enable Option key shortcuts on macOS

Some Claude Code shortcuts use the Option key, such as Option+Enter for a newline or Option+P to switch models. On macOS, most terminals do not send Option as a modifier by default, so these shortcuts do nothing until you enable it. The terminal setting for this is usually labeled "Use Option as Meta Key"; Meta is the historical Unix name for the key now labeled Option or Alt.

<Tabs>
  <Tab title="Apple Terminal">
    Open Settings → Profiles → Keyboard and check "Use Option as Meta Key".

    If you accepted Claude Code's first-run prompt that offered "Option+Enter for newlines and visual bell", this is already done. That prompt runs `/terminal-setup` for you, which enables Option as Meta and switches the audio bell to a visual screen flash in your Apple Terminal profile.
  </Tab>

  <Tab title="iTerm2">
    Open Settings → Profiles → Keys → General and set Left Option key and Right Option key to "Esc+".

    Running `/terminal-setup` in iTerm2 enables "Applications in terminal may access clipboard" under Settings → General → Selection so the `/copy` command can write to your system clipboard. The command detects iTerm2 even when run from inside tmux. Restart iTerm2 for the change to take effect.
  </Tab>

  <Tab title="VS Code">
    Add `"terminal.integrated.macOptionIsMeta": true` to your VS Code settings.
  </Tab>
</Tabs>

For Ghostty, Kitty, and other terminals, look for an Option-as-Alt or Option-as-Meta setting in the terminal's configuration file.

## Get a terminal bell or notification

When Claude finishes a task or pauses for a permission prompt, it fires a notification event. Surfacing this as a terminal bell or desktop notification lets you switch to other work while a long task runs.

By default Claude Code sends a desktop notification only in Ghostty, Kitty, and iTerm2. In other terminals, set [`preferredNotifChannel`](/docs/en/settings#available-settings) to `"terminal_bell"` to ring the terminal bell instead, or configure a [Notification hook](#play-a-sound-with-a-notification-hook) for a custom sound or command.

The desktop notification reaches your local machine over SSH, so a remote session can still alert you. Ghostty and Kitty forward it to your OS notification center without further setup. iTerm2 requires you to enable forwarding:

<Steps>
  <Step title="Open iTerm2 notification settings">
    Go to Settings → Profiles → Terminal.
  </Step>

  <Step title="Enable alerts">
    Check "Notification Center Alerts", then click "Filter Alerts" and enable "Send escape sequence-generated alerts".
  </Step>
</Steps>

If notifications still do not appear, confirm that your terminal application has notification permission in your OS settings, and if you are running inside tmux, [enable passthrough](#configure-tmux).

### Play a sound with a Notification hook

In any terminal you can configure a [Notification hook](/docs/en/hooks-guide#get-notified-when-claude-needs-input) to play a sound or run a custom command when Claude needs your attention. Hooks run alongside the built-in notification rather than replacing it, so terminals that do not receive a desktop notification, such as Warp or the VS Code integrated terminal, can use a hook or set `preferredNotifChannel` to `"terminal_bell"` instead.

The example below plays a system sound on macOS. The linked guide has desktop notification commands for macOS, Linux, and Windows.

```json ~/.claude/settings.json theme={null}
{
  "hooks": {
    "Notification": [
      {
        "hooks": [{ "type": "command", "command": "afplay /System/Library/Sounds/Glass.aiff" }]
      }
    ]
  }
}
```

## Configure tmux

When Claude Code runs inside tmux, two things break by default: Shift+Enter submits instead of inserting a newline, and desktop notifications and the [progress bar](/docs/en/settings#available-settings) never reach the outer terminal. Add these lines to `~/.tmux.conf`, then run `tmux source-file ~/.tmux.conf` to apply them to the running server:

```bash ~/.tmux.conf theme={null}
set -g allow-passthrough on
set -s extended-keys on
set -as terminal-features 'xterm*:extkeys'
```

The `allow-passthrough` line lets notifications and progress updates reach the outer terminal instead of being swallowed by tmux. The `extended-keys` lines let tmux distinguish Shift+Enter from plain Enter so the newline shortcut works.

## Match the color theme

Use the `/theme` command, or the theme picker in `/config`, to choose a Claude Code theme that matches your terminal. Selecting the auto option detects your terminal's light or dark background, so the theme follows OS appearance changes whenever your terminal does. Claude Code does not control the terminal's own color scheme, which is set by the terminal application.

To customize what appears at the bottom of the interface, configure a [custom status line](/docs/en/statusline) that shows the current model, working directory, git branch, or other context.

### Create a custom theme

<Note>
  Custom themes require Claude Code v2.1.118 or later.
</Note>

In addition to the built-in presets, `/theme` lists any custom themes you have defined and any themes contributed by installed [plugins](/docs/en/plugins-reference#themes). Select **New custom theme…** at the end of the list to create one interactively: you name the theme, then pick individual color tokens to override. Press `Ctrl+E` while a custom theme is highlighted to edit it.

Each custom theme is a JSON file in `~/.claude/themes/`. The filename without the `.json` extension is the theme's slug, and selecting the theme stores `custom:<slug>` as your theme preference. The file has three optional fields:

| Field       | Type   | Description                                                                                                                                     |
| :---------- | :----- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`      | string | Display label shown in `/theme`. Defaults to the filename slug                                                                                  |
| `base`      | string | Built-in preset the theme starts from: `dark`, `light`, `dark-daltonized`, `light-daltonized`, `dark-ansi`, or `light-ansi`. Defaults to `dark` |
| `overrides` | object | Map of color token names to color values. Tokens not listed here fall through to the base preset                                                |

Color values accept `#rrggbb`, `#rgb`, `rgb(r,g,b)`, `ansi256(n)`, or `ansi:<name>` where `<name>` is one of the 16 standard ANSI color names such as `red` or `cyanBright`. Unknown tokens and invalid color values are ignored, so a typo cannot break rendering.

The following example defines a theme that keeps the dark preset but recolors the prompt accent, error text, and success text:

```json ~/.claude/themes/dracula.json theme={null}
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

Claude Code watches `~/.claude/themes/` and reloads when a file changes, so edits made in your editor apply to a running session without a restart.

The reference below covers the tokens you can set in `overrides`. The interactive editor in `/theme` shows the same tokens with a live preview, plus a few single-purpose accents such as onboarding screen colors that are omitted here.

<Accordion title="Color token reference">
  The following example combines tokens from several of the groups below: the brand accent, the plan mode border, the diff backgrounds, and the fullscreen message background.

  ```json ~/.claude/themes/midnight.json theme={null}
  {
    "name": "Midnight",
    "base": "dark",
    "overrides": {
      "claude": "#a78bfa",
      "planMode": "#38bdf8",
      "diffAdded": "#14532d",
      "diffRemoved": "#7f1d1d",
      "userMessageBackground": "#1e1b4b"
    }
  }
  ```

  #### Text and accent colors

  Control the primary brand accent and the foreground text shades used throughout the interface.

  | Token         | Controls                                                         |
  | :------------ | :--------------------------------------------------------------- |
  | `claude`      | Primary brand accent, used for the spinner and assistant label   |
  | `text`        | Default foreground text                                          |
  | `inverseText` | Text drawn on top of a colored background, such as status badges |
  | `inactive`    | Secondary text such as hints, timestamps, and disabled items     |
  | `subtle`      | Faint borders and de-emphasized secondary text                   |
  | `suggestion`  | Autocomplete suggestions and selection highlight in pickers      |
  | `permission`  | Dialog borders, including permission prompts and pickers         |
  | `remember`    | Memory and `CLAUDE.md` indicators                                |

  #### Status colors

  Signal success, failure, and warning states across messages and indicators.

  | Token     | Controls                                             |
  | :-------- | :--------------------------------------------------- |
  | `success` | Success messages and passing checks                  |
  | `error`   | Error messages and failures                          |
  | `warning` | Warnings, caution messages, and the auto mode border |
  | `merged`  | Merged pull request status                           |

  #### Input box and mode indicators

  Set the input box border color and the accent shown while a permission mode or indicator is active.

  | Token          | Controls                                           |
  | :------------- | :------------------------------------------------- |
  | `promptBorder` | Input box border in the default permission mode    |
  | `planMode`     | Plan mode accent and border                        |
  | `autoAccept`   | Accept-edits mode accent and border                |
  | `bashBorder`   | Input box border when entering a `!` shell command |
  | `ide`          | IDE connection indicator                           |
  | `fastMode`     | Fast mode indicator                                |

  #### Diff rendering

  Color added and removed code in file edits and reviews.

  | Token               | Controls                                           |
  | :------------------ | :------------------------------------------------- |
  | `diffAdded`         | Background of added lines                          |
  | `diffRemoved`       | Background of removed lines                        |
  | `diffAddedDimmed`   | Background of unchanged context near added lines   |
  | `diffRemovedDimmed` | Background of unchanged context near removed lines |
  | `diffAddedWord`     | Word-level highlight within an added line          |
  | `diffRemovedWord`   | Word-level highlight within a removed line         |

  #### Fullscreen mode

  Apply only in [fullscreen rendering mode](/docs/en/fullscreen), where messages have a background fill.

  | Token                        | Controls                                                           |
  | :--------------------------- | :----------------------------------------------------------------- |
  | `userMessageBackground`      | Background behind your messages in the transcript                  |
  | `userMessageBackgroundHover` | Background behind a message while hovered or expanded              |
  | `messageActionsBackground`   | Background behind the selected message when the action bar is open |
  | `bashMessageBackgroundColor` | Background behind `!` shell command entries in the transcript      |
  | `memoryBackgroundColor`      | Background behind `#` memory entries in the transcript             |
  | `selectionBg`                | Background of text selected with the mouse                         |

  #### Usage meter and speaker labels

  Adjust the bar shown in the `/usage` view and the labels that distinguish your messages from Claude's.

  | Token              | Controls                                          |
  | :----------------- | :------------------------------------------------ |
  | `rate_limit_fill`  | Filled portion of the usage meter                 |
  | `rate_limit_empty` | Unfilled portion of the usage meter               |
  | `briefLabelYou`    | Color of the `You` label on your messages         |
  | `briefLabelClaude` | Color of the `Claude` label on assistant messages |

  #### Shimmer variants and subagent colors

  Several tokens have a paired shimmer variant that supplies the lighter color used in the spinner's animated gradient. Override the shimmer alongside its base token if the animation looks mismatched.

  * `claude` and `claudeShimmer`
  * `warning` and `warningShimmer`
  * `permission` and `permissionShimmer`
  * `promptBorder` and `promptBorderShimmer`
  * `inactive` and `inactiveShimmer`
  * `fastMode` and `fastModeShimmer`

  Each [subagent](/docs/en/sub-agents) and parallel task is shown in one of eight named colors so you can tell them apart in the transcript. The token names follow the pattern `<color>_FOR_SUBAGENTS_ONLY`, where `<color>` is `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, or `cyan`. Override these to change what each named color looks like. For example, a subagent with `color: blue` in its definition is drawn using the `blue_FOR_SUBAGENTS_ONLY` value.

  The [`ultrathink`](/docs/en/model-config#use-ultrathink-for-one-off-deep-reasoning) and [`ultraplan`](/docs/en/ultraplan) keywords in the prompt input are rendered with a seven-color rainbow gradient. The token names follow the pattern `rainbow_<color>` and `rainbow_<color>_shimmer`, where `<color>` is `red`, `orange`, `yellow`, `green`, `blue`, `indigo`, or `violet`.
</Accordion>

## Switch to fullscreen rendering

If the display flickers or the scroll position jumps while Claude is working, switch to [fullscreen rendering mode](/docs/en/fullscreen). It draws to a separate screen the terminal reserves for full-screen apps instead of appending to your normal scrollback, which keeps memory usage flat and adds mouse support for scrolling and selection. In this mode you scroll with the mouse or PageUp inside Claude Code rather than with your terminal's native scrollback; see the [fullscreen page](/docs/en/fullscreen#search-and-review-the-conversation) for how to search and copy.

Run `/tui fullscreen` to switch in the current session with your conversation intact. To make it the default, set the `CLAUDE_CODE_NO_FLICKER` environment variable before starting Claude Code:

<CodeGroup>
  ```bash Bash and Zsh theme={null}
  CLAUDE_CODE_NO_FLICKER=1 claude
  ```

  ```powershell PowerShell theme={null}
  $env:CLAUDE_CODE_NO_FLICKER = "1"; claude
  ```

  ```json ~/.claude/settings.json theme={null}
  {
    "env": {
      "CLAUDE_CODE_NO_FLICKER": "1"
    }
  }
  ```
</CodeGroup>

## Paste large content

When you paste more than 10,000 characters into the prompt, Claude Code collapses the input to a `[Pasted text]` placeholder so the input box stays usable. The full content is still sent to Claude when you submit.

The VS Code integrated terminal can drop characters from very large pastes before they reach Claude Code, so prefer file-based workflows there. For very large inputs such as entire files or long logs, write the content to a file and ask Claude to read it instead of pasting. This keeps the conversation transcript readable and lets Claude reference the file by path in later turns.

## Edit prompts with Vim keybindings

Claude Code includes a Vim-style editing mode for the prompt input. Enable it through `/config` → Editor mode, or by setting [`editorMode`](/docs/en/settings#available-settings) to `"vim"` in `~/.claude/settings.json`. Set Editor mode back to `normal` to turn it off.

Vim mode supports a subset of NORMAL- and VISUAL-mode motions and operators, such as `hjkl` navigation, `v`/`V` selection, and `d`/`c`/`y` with text objects. See the [Vim editor mode reference](/docs/en/interactive-mode#vim-editor-mode) for the full key table. Vim motions are not remappable through the keybindings file.

Pressing Enter still submits your prompt in INSERT mode, unlike standard Vim. Use `o` or `O` in NORMAL mode, or Ctrl+J, to insert a newline instead.

## Related resources

* [Interactive mode](/docs/en/interactive-mode): full keyboard shortcut reference and the Vim key table
* [Keybindings](/docs/en/keybindings): remap any Claude Code shortcut, including Enter and Shift+Enter
* [Fullscreen rendering](/docs/en/fullscreen): details on scrolling, search, and copy in fullscreen mode
* [Hooks guide](/docs/en/hooks-guide): more Notification hook examples for Linux and Windows
* [Troubleshooting](/docs/en/troubleshooting): fixes for issues outside terminal configuration


---

## Model configuration

`https://code.claude.com/docs/en/model-config`

Learn about the Claude Code model configuration, including model aliases like `opusplan`

## Available models

For the `model` setting in Claude Code, you can configure either:

* A **model alias**
* A **model name**
  * Anthropic API: A full **[model name](https://platform.claude.com/docs/en/about-claude/models/overview)**
  * Bedrock: an inference profile ARN
  * Foundry: a deployment name
  * Vertex: a version name

<Note>
  `ANTHROPIC_BASE_URL` changes where requests are sent, not which model answers them. To route Claude through an LLM gateway, see [LLM gateway configuration](/docs/en/llm-gateway).
</Note>

### Model aliases

Model aliases provide a convenient way to select model settings without
remembering exact version numbers:

| Model alias      | Behavior                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`default`**    | Special value that clears any model override and reverts to the recommended model for your account type. Not itself a model alias                                    |
| **`best`**       | Uses the most capable available model, currently equivalent to `opus`                                                                                                |
| **`sonnet`**     | Uses the latest Sonnet model for daily coding tasks                                                                                                                  |
| **`opus`**       | Uses the latest Opus model for complex reasoning tasks                                                                                                               |
| **`haiku`**      | Uses the fast and efficient Haiku model for simple tasks                                                                                                             |
| **`sonnet[1m]`** | Uses Sonnet with a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) for long sessions |
| **`opus[1m]`**   | Uses Opus with a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) for long sessions   |
| **`opusplan`**   | Special mode that uses `opus` during plan mode, then switches to `sonnet` for execution                                                                              |

On the Anthropic API, `opus` resolves to Opus 4.8 and `sonnet` resolves to Sonnet 4.6. On [Claude Platform on AWS](/docs/en/claude-platform-on-aws), `opus` resolves to Opus 4.7 and `sonnet` resolves to Sonnet 4.6. On Bedrock, Vertex, and Foundry, `opus` resolves to Opus 4.6 and `sonnet` resolves to Sonnet 4.5; newer models are available on those providers by selecting the full model name explicitly or setting `ANTHROPIC_DEFAULT_OPUS_MODEL` or `ANTHROPIC_DEFAULT_SONNET_MODEL`.

Aliases point to the recommended version for your provider and update over time. To pin to a specific version, use the full model name (for example, `claude-opus-4-8`) or set the corresponding environment variable like `ANTHROPIC_DEFAULT_OPUS_MODEL`.

<Note>
  Opus 4.8 requires Claude Code v2.1.154 or later. Run `claude update` to upgrade.
</Note>

### Setting your model

You can configure your model in several ways, listed in order of priority:

1. **During session** - Use `/model <alias|name>` to switch immediately, or run `/model` with no argument to open the picker. The picker asks for confirmation when the conversation has prior output, since the next response re-reads the full history without cached context
2. **At startup** - Launch with `claude --model <alias|name>`
3. **Environment variable** - Set `ANTHROPIC_MODEL=<alias|name>`
4. **Settings** - Configure permanently in your settings file using the `model`
   field.

As of v2.1.153, `/model` saves your choice as the default for new sessions by writing the `model` field in your user settings. In the picker:

* `Enter`: switch model and save as your default
* `s`: switch model for this session only

Typing `/model <name>` directly behaves like `Enter`. Project and managed settings still take precedence and reapply on the next launch.

In v2.1.144 through v2.1.152, `/model` applied to the current session only and `d` in the picker saved a default.

The `--model` flag and `ANTHROPIC_MODEL` environment variable apply only to the session you launch with them. To run different models in different terminals at the same time, launch each one with its own `--model` flag rather than switching with `/model`.

Resumed sessions started with `claude --resume`, `--continue`, or the `/resume` picker keep the model they were using when the transcript was saved, regardless of the current `model` setting. If that model has been retired, the session falls through to the normal precedence order. This prevents another session's `/model` choice from changing the model on resume.

When the active model at startup comes from project or managed settings rather than your own selection, the startup header shows which settings file set it. Run `/model` to override; the project or managed setting reapplies on the next launch.

Example usage:

```bash theme={null}
# Start with Opus
claude --model opus

# Switch to Sonnet during session
/model sonnet
```

Example settings file:

```json theme={null}
{
    "permissions": {
        ...
    },
    "model": "opus"
}
```

## Restrict model selection

Enterprise administrators can use `availableModels` in [managed or policy settings](/docs/en/settings#settings-files) to restrict which models users can select.

When `availableModels` is set, users cannot switch to models not in the list via `/model`, `--model` flag, or `ANTHROPIC_MODEL` environment variable.

```json theme={null}
{
  "availableModels": ["sonnet", "haiku"]
}
```

### Default model behavior

The Default option in the model picker is not affected by `availableModels`. It always remains available and represents the system's runtime default [based on the user's subscription tier](#default-model-setting).

Even with `availableModels: []`, users can still use Claude Code with the Default model for their tier.

### Control the model users run on

The `model` setting is an initial selection, not enforcement. It sets which model is active when a session starts, but users can still open `/model` and pick Default, which resolves to the system default for their tier regardless of what `model` is set to.

To fully control the model experience, combine three settings:

* **`availableModels`**: restricts which named models users can switch to
* **`model`**: sets the initial model selection when a session starts
* **`ANTHROPIC_DEFAULT_SONNET_MODEL`** / **`ANTHROPIC_DEFAULT_OPUS_MODEL`** / **`ANTHROPIC_DEFAULT_HAIKU_MODEL`**: control what the Default option and the `sonnet`, `opus`, and `haiku` aliases resolve to

This example starts users on Sonnet 4.5, limits the picker to Sonnet and Haiku, and pins Default to resolve to Sonnet 4.5 rather than the latest release:

```json theme={null}
{
  "model": "claude-sonnet-4-5",
  "availableModels": ["claude-sonnet-4-5", "haiku"],
  "env": {
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-5"
  }
}
```

Without the `env` block, a user who selects Default in the picker would get the latest Sonnet release, bypassing the version pin in `model` and `availableModels`.

### Merge behavior

When `availableModels` is set at multiple levels, such as user settings and project settings, arrays are merged and deduplicated. To enforce a strict allowlist, set `availableModels` in managed or policy settings which take highest priority.

### Mantle model IDs

When the [Bedrock Mantle endpoint](/docs/en/amazon-bedrock#use-the-mantle-endpoint) is enabled, entries in `availableModels` that start with `anthropic.` are added to the `/model` picker as custom options and routed to the Mantle endpoint. This is an exception to the alias-only matching described in [Pin models for third-party deployments](#pin-models-for-third-party-deployments). The setting still restricts the picker to listed entries, so include the standard aliases alongside any Mantle IDs.

## Special model behavior

### `default` model setting

The behavior of `default` depends on your account type:

* **Max, Team Premium, Enterprise pay-as-you-go, and Anthropic API**: defaults to Opus 4.8
* **Claude Platform on AWS**: defaults to Opus 4.7
* **Pro, Team Standard, and Enterprise subscription seats**: defaults to Sonnet 4.6
* **Bedrock, Vertex, and Foundry**: defaults to Sonnet 4.5

Enterprise pay-as-you-go means an Enterprise organization billed by usage rather than by subscription seat.

Claude Code may automatically fall back to Sonnet if you hit a usage threshold with Opus.

### `opusplan` model setting

The `opusplan` model alias provides an automated hybrid approach:

* **In plan mode** - Uses `opus` for complex reasoning and architecture
  decisions
* **In execution mode** - Automatically switches to `sonnet` for code generation
  and implementation

This gives you the best of both worlds: Opus's superior reasoning for planning,
and Sonnet's efficiency for execution.

The plan-mode Opus phase runs with the standard 200K context window. The automatic 1M upgrade described in [Extended context](#extended-context) applies to the `opus` model setting and does not extend to `opusplan`.

### Adjust effort level

[Effort levels](https://platform.claude.com/docs/en/build-with-claude/effort) control adaptive reasoning, which lets the model decide whether and how much to think on each step based on task complexity. Lower effort is faster and cheaper for straightforward tasks, while higher effort provides deeper reasoning for complex problems.

The available effort levels depend on the model. Models not listed here do not support effort:

| Model                   | Levels                                  |
| :---------------------- | :-------------------------------------- |
| Opus 4.8 and Opus 4.7   | `low`, `medium`, `high`, `xhigh`, `max` |
| Opus 4.6 and Sonnet 4.6 | `low`, `medium`, `high`, `max`          |

If you set a level the active model does not support, Claude Code falls back to the highest supported level at or below the one you set. For example, `xhigh` runs as `high` on Opus 4.6.

The default effort is `high` on Opus 4.8, Opus 4.6, and Sonnet 4.6, and `xhigh` on Opus 4.7.

When you first run Opus 4.8 or Opus 4.7, Claude Code applies that model's default effort even if you previously set a different level for another model: `high` on Opus 4.8 and `xhigh` on Opus 4.7. Run `/effort` again to choose a different level after switching.

`low`, `medium`, `high`, and `xhigh` persist across sessions. `max` provides the deepest reasoning with no constraint on token spending and applies to the current session only, except when set through the `CLAUDE_CODE_EFFORT_LEVEL` environment variable.

The `/effort` menu also offers `ultracode`. Ultracode is a Claude Code setting rather than a model effort level: it sends `xhigh` to the model and additionally has Claude orchestrate [dynamic workflows](/docs/en/workflows) for substantive tasks. It applies to the current session only. Set it through `/effort`, or pass `"ultracode": true` via `--settings` or an Agent SDK control request. It is not part of the `effortLevel` setting, the `--effort` flag, or `CLAUDE_CODE_EFFORT_LEVEL`.

#### Choose an effort level

Each level trades token spend against capability. The default suits most coding tasks; adjust when you want a different balance.

| Level       | When to use it                                                                                                                                  |
| :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `low`       | Reserve for short, scoped, latency-sensitive tasks that are not intelligence-sensitive                                                          |
| `medium`    | Reduces token usage for cost-sensitive work that can trade off some intelligence                                                                |
| `high`      | Balances token usage and intelligence. Default on Opus 4.8, Opus 4.6, and Sonnet 4.6                                                            |
| `xhigh`     | Deeper reasoning at higher token spend. Default on Opus 4.7                                                                                     |
| `max`       | Can improve performance on demanding tasks but may show diminishing returns and is prone to overthinking. Test before adopting broadly          |
| `ultracode` | A Claude Code setting that plans a [dynamic workflow](/docs/en/workflows) for each substantive task with `xhigh` per-message reasoning. Session-only |

The effort scale is calibrated per model, so the same level name does not represent the same underlying value across models.

#### Use ultrathink for one-off deep reasoning

Include `ultrathink` anywhere in your prompt to request deeper reasoning on that turn without changing your session effort setting. Claude Code recognizes the keyword and adds an in-context instruction. The effort level sent to the API is unchanged. Other phrases such as "think", "think hard", and "think more" are passed through as ordinary prompt text and are not recognized as keywords.

#### Set the effort level

You can change effort through any of the following:

* **`/effort`**: run `/effort` with no arguments to open an interactive slider, `/effort` followed by a level name to set it directly, or `/effort auto` to reset to the model default
* **In `/model`**: use left/right arrow keys to adjust the effort slider when selecting a model
* **`--effort` flag**: pass a level name to set it for a single session when launching Claude Code
* **Environment variable**: set `CLAUDE_CODE_EFFORT_LEVEL` to a level name or `auto`
* **Settings**: set `effortLevel` to `low`, `medium`, `high`, or `xhigh` in your settings file. `max` and `ultracode` are [session-only](#adjust-effort-level) and are not accepted here
* **Skill and subagent frontmatter**: set `effort` in a [skill](/docs/en/skills#frontmatter-reference) or [subagent](/docs/en/sub-agents#supported-frontmatter-fields) markdown file to override the effort level when that skill or subagent runs

The environment variable takes precedence over all other methods, then your configured level, then the model default. Frontmatter effort applies when that skill or subagent is active, overriding the session level but not the environment variable.

The effort slider appears in `/model` when a supported model is selected. The current effort level is also displayed next to the logo and spinner, for example "with low effort", so you can confirm which setting is active without opening `/model`.

#### Adaptive reasoning and fixed thinking budgets

Adaptive reasoning makes thinking optional on each step, so Claude can respond faster to routine prompts and reserve deeper thinking for steps that benefit from it. If you want Claude to think more or less often than the current level produces, you can say so directly in your prompt or in `CLAUDE.md`; the model responds to that guidance within its effort setting.

Opus 4.7 and later always use adaptive reasoning. The fixed thinking budget mode and `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` do not apply to them.

On Opus 4.6 and Sonnet 4.6, you can set `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1` to revert to the previous fixed thinking budget controlled by `MAX_THINKING_TOKENS`. See [environment variables](/docs/en/env-vars).

### Extended thinking

Extended thinking is the reasoning Claude emits before responding. On models that support [adaptive reasoning](#adjust-effort-level), the effort level is the primary control for how much thinking happens; the settings below turn thinking on or off and control how it displays.

| Control                        | How to set it                                                                                                                                       |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toggle for the current session | Press `Option+T` on macOS or `Alt+T` on Windows and Linux                                                                                           |
| Set the global default         | Run `/config` and toggle thinking mode. Saved as `alwaysThinkingEnabled` in `~/.claude/settings.json`                                               |
| Disable regardless of effort   | Set [`MAX_THINKING_TOKENS=0`](/docs/en/env-vars). Other values apply only with a [fixed thinking budget](#adaptive-reasoning-and-fixed-thinking-budgets) |

Thinking output is collapsed by default. Press `Ctrl+O` to toggle verbose mode and see the reasoning as gray italic text. Interactive sessions on the Anthropic API receive redacted thinking blocks by default, so set `showThinkingSummaries: true` in [settings](/docs/en/settings) if you want the full summaries available when you expand. You are charged for all thinking tokens generated, even when collapsed or redacted.

### Extended context

Opus 4.6 and later, and Sonnet 4.6, support a [1 million token context window](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window) for long sessions with large codebases.

Availability varies by model and plan. On Max, Team, and Enterprise plans, Opus is automatically upgraded to 1M context with no additional configuration. This applies to both Team Standard and Team Premium seats. Sonnet with 1M context is not part of the automatic upgrade and requires [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) on every subscription plan, including Max.

| Plan                      | Opus with 1M context                                                                                        | Sonnet with 1M context                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Max, Team, and Enterprise | Included with subscription                                                                                  | Requires [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) |
| Pro                       | Requires [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) | Requires [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) |
| API and pay-as-you-go     | Full access                                                                                                 | Full access                                                                                                 |

To disable 1M context entirely, set `CLAUDE_CODE_DISABLE_1M_CONTEXT=1`. This removes 1M model variants from the model picker. See [environment variables](/docs/en/env-vars).

The 1M context window uses standard model pricing with no premium for tokens beyond 200K. For plans where extended context is included with your subscription, usage remains covered by your subscription. For plans that access extended context through usage credits, tokens are billed to usage credits.

If your account supports 1M context, the option appears in the model picker (`/model`) in the latest versions of Claude Code. If you don't see it, try restarting your session.

You can also use the `[1m]` suffix with model aliases or full model names:

```bash theme={null}
# Use the opus[1m] or sonnet[1m] alias
/model opus[1m]
/model sonnet[1m]

# Or append [1m] to a full model name
/model claude-opus-4-8[1m]
```

## Checking your current model

You can see which model you're currently using in several ways:

1. In [status line](/docs/en/statusline) (if configured)
2. In `/status`, which also displays your account information.

## Add a custom model option

Use `ANTHROPIC_CUSTOM_MODEL_OPTION` to add a single custom entry to the `/model` picker without replacing the built-in aliases. This is useful for testing model IDs that Claude Code does not list by default. For LLM gateway deployments, Claude Code can populate the picker from the gateway's `/v1/models` endpoint when `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1` is set, so this variable is needed only when discovery is disabled or does not return the model you want. See [LLM gateway model selection](/docs/en/llm-gateway#model-selection).

This example sets all three variables to make a gateway-routed Opus deployment selectable:

```bash theme={null}
export ANTHROPIC_CUSTOM_MODEL_OPTION="my-gateway/claude-opus-4-7"
export ANTHROPIC_CUSTOM_MODEL_OPTION_NAME="Opus via Gateway"
export ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION="Custom deployment routed through the internal LLM gateway"
```

The custom entry appears at the bottom of the `/model` picker. `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME` and `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION` are optional. If omitted, the model ID is used as the name and the description defaults to `Custom model (<model-id>)`.

Claude Code skips validation for the model ID set in `ANTHROPIC_CUSTOM_MODEL_OPTION`, so you can use any string your API endpoint accepts.

## Environment variables

You can use the following environment variables, which must be full **model
names** (or equivalent for your API provider), to control the model names that the aliases map to.

| Environment variable             | Description                                                                                                                                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`   | The model to use for `opus`, or for `opusplan` when Plan Mode is active.                                                                                                                                                                                          |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | The model to use for `sonnet`, or for `opusplan` when Plan Mode is not active.                                                                                                                                                                                    |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL`  | The model to use for `haiku`, or [background functionality](/docs/en/costs#background-token-usage)                                                                                                                                                                     |
| `CLAUDE_CODE_SUBAGENT_MODEL`     | The model to use for all [subagents](/docs/en/sub-agents#choose-a-model) and [agent teams](/docs/en/agent-teams). Overrides the per-invocation `model` parameter and the subagent definition's `model` frontmatter. Set to `inherit` to use normal model resolution instead |

Note: `ANTHROPIC_SMALL_FAST_MODEL` is deprecated in favor of
`ANTHROPIC_DEFAULT_HAIKU_MODEL`.

### Pin models for third-party deployments

When deploying Claude Code through [Bedrock](/docs/en/amazon-bedrock), [Vertex AI](/docs/en/google-vertex-ai), [Foundry](/docs/en/microsoft-foundry), or [Claude Platform on AWS](/docs/en/claude-platform-on-aws), pin model versions before rolling out to users.

Without pinning, Claude Code uses model aliases (`sonnet`, `opus`, `haiku`) that resolve to the latest version. When Anthropic releases a new model that isn't yet enabled in a user's account, Bedrock and Vertex AI users see a notice and fall back to the previous version for that session, while Foundry users see errors because Foundry has no equivalent startup check.

<Warning>
  Set all three model environment variables to specific version IDs as part of your initial setup. Pinning lets you control when your users move to a new model.
</Warning>

Use the following environment variables with version-specific model IDs for your provider:

| Provider  | Example                                                              |
| :-------- | :------------------------------------------------------------------- |
| Bedrock   | `export ANTHROPIC_DEFAULT_OPUS_MODEL='us.anthropic.claude-opus-4-8'` |
| Vertex AI | `export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-8'`              |
| Foundry   | `export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-8'`              |

Apply the same pattern for `ANTHROPIC_DEFAULT_SONNET_MODEL` and `ANTHROPIC_DEFAULT_HAIKU_MODEL`. For current and legacy model IDs across all providers, see [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). To upgrade users to a new model version, update these environment variables and redeploy.

To enable [extended context](#extended-context) for a pinned model, append `[1m]` to the model ID in `ANTHROPIC_DEFAULT_OPUS_MODEL` or `ANTHROPIC_DEFAULT_SONNET_MODEL`:

```bash theme={null}
export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4-8[1m]'
```

The `[1m]` suffix applies the 1M context window to all usage of that alias, including `opusplan`.

* Claude Code strips the suffix before sending the model ID to your provider.
* Only append `[1m]` when the underlying model [supports 1M context](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window).
* The suffix is read per variable, not per model. On Bedrock, Vertex, and Foundry, a model ID without `[1m]` in one variable uses 200K context even if another variable sets the same model with the suffix.

<Note>
  The `settings.availableModels` allowlist still applies when using third-party providers. Filtering matches on the model alias (`opus`, `sonnet`, `haiku`), not the provider-specific model ID.
</Note>

### Customize pinned model display and capabilities

When you pin a model on a third-party provider, the provider-specific ID appears as-is in the `/model` picker and Claude Code may not recognize which features the model supports. You can override the display name and declare capabilities with companion environment variables for each pinned model.

These variables take effect on third-party providers such as Bedrock, Vertex AI, and Foundry. The `_NAME` and `_DESCRIPTION` variables also take effect when `ANTHROPIC_BASE_URL` points to an [LLM gateway](/docs/en/llm-gateway). They have no effect when connecting directly to `api.anthropic.com`.

| Environment variable                                  | Description                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`                   | Display name for the pinned Opus model in the `/model` picker. Defaults to the model ID when not set               |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`            | Display description for the pinned Opus model in the `/model` picker. Defaults to `Custom Opus model` when not set |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES` | Comma-separated list of capabilities the pinned Opus model supports                                                |

The same `_NAME`, `_DESCRIPTION`, and `_SUPPORTED_CAPABILITIES` suffixes are available for `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`, and `ANTHROPIC_CUSTOM_MODEL_OPTION`.

Claude Code enables features like [effort levels](#adjust-effort-level) and [extended thinking](#extended-thinking) by matching the model ID against known patterns. Provider-specific IDs such as Bedrock ARNs or custom deployment names often don't match these patterns, leaving supported features disabled. Set `_SUPPORTED_CAPABILITIES` to tell Claude Code which features the model actually supports:

| Capability value       | Enables                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `effort`               | [Effort levels](#adjust-effort-level) and the `/effort` command                 |
| `xhigh_effort`         | The `xhigh` effort level                                                        |
| `max_effort`           | The `max` effort level                                                          |
| `thinking`             | [Extended thinking](#extended-thinking)                                         |
| `adaptive_thinking`    | Adaptive reasoning that dynamically allocates thinking based on task complexity |
| `interleaved_thinking` | Thinking between tool calls                                                     |

When `_SUPPORTED_CAPABILITIES` is set, listed capabilities are enabled and unlisted capabilities are disabled for the matching pinned model. When the variable is unset, Claude Code falls back to built-in detection based on the model ID.

This example pins Opus to a Bedrock custom model ARN, sets a friendly name, and declares its capabilities:

```bash theme={null}
export ANTHROPIC_DEFAULT_OPUS_MODEL='arn:aws:bedrock:us-east-1:123456789012:custom-model/abc'
export ANTHROPIC_DEFAULT_OPUS_MODEL_NAME='Opus via Bedrock'
export ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION='Opus 4.7 routed through a Bedrock custom endpoint'
export ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES='effort,xhigh_effort,max_effort,thinking,adaptive_thinking,interleaved_thinking'
```

### Override model IDs per version

The family-level environment variables above configure one model ID per family alias. If you need to map several versions within the same family to distinct provider IDs, use the `modelOverrides` setting instead.

`modelOverrides` maps individual Anthropic model IDs to the provider-specific strings that Claude Code sends to your provider's API. When a user selects a mapped model in the `/model` picker, Claude Code uses your configured value instead of the built-in default.

This lets enterprise administrators route each model version to a specific Bedrock inference profile ARN, Vertex AI version name, or Foundry deployment name for governance, cost allocation, or regional routing.

Set `modelOverrides` in your [settings file](/docs/en/settings#settings-files):

```json theme={null}
{
  "modelOverrides": {
    "claude-opus-4-7": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/opus-prod",
    "claude-opus-4-6": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/opus-46-prod",
    "claude-sonnet-4-6": "arn:aws:bedrock:us-east-2:123456789012:application-inference-profile/sonnet-prod"
  }
}
```

Keys must be Anthropic model IDs as listed in the [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview). For dated model IDs, include the date suffix exactly as it appears there. Unknown keys are ignored.

Overrides replace the built-in model IDs that back each entry in the `/model` picker. On Bedrock, overrides take precedence over any inference profiles that Claude Code discovers automatically at startup. Values you supply directly through `ANTHROPIC_MODEL`, `--model`, or the `ANTHROPIC_DEFAULT_*_MODEL` environment variables are passed to the provider as-is and are not transformed by `modelOverrides`.

`modelOverrides` works alongside `availableModels`. The allowlist is evaluated against the Anthropic model ID, not the override value, so an entry like `"opus"` in `availableModels` continues to match even when Opus versions are mapped to ARNs.

### Prompt caching configuration

Claude Code automatically uses [prompt caching](/docs/en/prompt-caching) to optimize performance and reduce costs. You can disable prompt caching globally or for specific model tiers:

| Environment variable            | Description                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `DISABLE_PROMPT_CACHING`        | Set to `1` to disable prompt caching for all models. Takes precedence over the per-model settings |
| `DISABLE_PROMPT_CACHING_HAIKU`  | Set to `1` to disable prompt caching for Haiku models only                                        |
| `DISABLE_PROMPT_CACHING_SONNET` | Set to `1` to disable prompt caching for Sonnet models only                                       |
| `DISABLE_PROMPT_CACHING_OPUS`   | Set to `1` to disable prompt caching for Opus models only                                         |

To change the cache TTL or learn what triggers a cache miss, see [How Claude Code uses prompt caching](/docs/en/prompt-caching).


---

## How Claude remembers your project

`https://code.claude.com/docs/en/memory`

Give Claude persistent instructions with CLAUDE.md files, and let Claude accumulate learnings automatically with auto memory.

Each Claude Code session begins with a fresh context window. Two mechanisms carry knowledge across sessions:

* **CLAUDE.md files**: instructions you write to give Claude persistent context
* **Auto memory**: notes Claude writes itself based on your corrections and preferences

This page covers how to:

* [Write and organize CLAUDE.md files](#claude-md-files)
* [Scope rules to specific file types](#organize-rules-with-claude/rules/) with `.claude/rules/`
* [Configure auto memory](#auto-memory) so Claude takes notes automatically
* [Troubleshoot](#troubleshoot-memory-issues) when instructions aren't being followed

## CLAUDE.md vs auto memory

Claude Code has two complementary memory systems. Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a [PreToolUse hook](/docs/en/hooks-guide) instead. The more specific and concise your instructions, the more consistently Claude follows them.

|                      | CLAUDE.md files                                   | Auto memory                                                      |
| :------------------- | :------------------------------------------------ | :--------------------------------------------------------------- |
| **Who writes it**    | You                                               | Claude                                                           |
| **What it contains** | Instructions and rules                            | Learnings and patterns                                           |
| **Scope**            | Project, user, or org                             | Per repository, shared across worktrees                          |
| **Loaded into**      | Every session                                     | Every session (first 200 lines or 25KB)                          |
| **Use for**          | Coding standards, workflows, project architecture | Build commands, debugging insights, preferences Claude discovers |

Use CLAUDE.md files when you want to guide Claude's behavior. Auto memory lets Claude learn from your corrections without manual effort.

Subagents can also maintain their own auto memory. See [subagent configuration](/docs/en/sub-agents#enable-persistent-memory) for details.

## CLAUDE.md files

CLAUDE.md files are markdown files that give Claude persistent instructions for a project, your personal workflow, or your entire organization. You write these files in plain text; Claude reads them at the start of every session.

### When to add to CLAUDE.md

Treat CLAUDE.md as the place you write down what you'd otherwise re-explain. Add to it when:

* Claude makes the same mistake a second time
* A code review catches something Claude should have known about this codebase
* You type the same correction or clarification into chat that you typed last session
* A new teammate would need the same context to be productive

Keep it to facts Claude should hold in every session: build commands, conventions, project layout, "always do X" rules. If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a [skill](/docs/en/skills) or a [path-scoped rule](#organize-rules-with-claude/rules/) instead. The [extension overview](/docs/en/features-overview#build-your-setup-over-time) covers when to use each mechanism.

### Choose where to put CLAUDE.md files

CLAUDE.md files can live in several locations, each with a different scope. The table below lists them in load order, from broadest scope to most specific, so a project instruction appears in context after a user instruction.

| Scope                    | Location                                                                                                                                                                | Purpose                                                    | Use case examples                                                    | Shared with                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| **Managed policy**       | • macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br />• Linux and WSL: `/etc/claude-code/CLAUDE.md`<br />• Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Organization-wide instructions managed by IT/DevOps        | Company coding standards, security policies, compliance requirements | All users in organization       |
| **User instructions**    | `~/.claude/CLAUDE.md`                                                                                                                                                   | Personal preferences for all projects                      | Code styling preferences, personal tooling shortcuts                 | Just you (all projects)         |
| **Project instructions** | `./CLAUDE.md` or `./.claude/CLAUDE.md`                                                                                                                                  | Team-shared instructions for the project                   | Project architecture, coding standards, common workflows             | Team members via source control |
| **Local instructions**   | `./CLAUDE.local.md`                                                                                                                                                     | Personal project-specific preferences; add to `.gitignore` | Your sandbox URLs, preferred test data                               | Just you (current project)      |

CLAUDE.md and CLAUDE.local.md files in the directory hierarchy above the working directory are loaded in full at launch. Files in subdirectories load on demand when Claude reads files in those directories. See [How CLAUDE.md files load](#how-claude-md-files-load) for the full resolution order.

For large projects, you can break instructions into topic-specific files using [project rules](#organize-rules-with-claude/rules/). Rules let you scope instructions to specific file types or subdirectories.

### Set up a project CLAUDE.md

A project CLAUDE.md can be stored in either `./CLAUDE.md` or `./.claude/CLAUDE.md`. Create this file and add instructions that apply to anyone working on the project: build and test commands, coding standards, architectural decisions, naming conventions, and common workflows. These instructions are shared with your team through version control, so focus on project-level standards rather than personal preferences.

<Tip>
  Run `/init` to generate a starting CLAUDE.md automatically. Claude analyzes your codebase and creates a file with build commands, test instructions, and project conventions it discovers. If a CLAUDE.md already exists, `/init` suggests improvements rather than overwriting it. Refine from there with instructions Claude wouldn't discover on its own.

  Set `CLAUDE_CODE_NEW_INIT=1` to enable an interactive multi-phase flow. `/init` asks which artifacts to set up: CLAUDE.md files, skills, and hooks. It then explores your codebase with a subagent, fills in gaps via follow-up questions, and presents a reviewable proposal before writing any files.
</Tip>

### Write effective instructions

CLAUDE.md files are loaded into the context window at the start of every session, consuming tokens alongside your conversation. The [context window visualization](/docs/en/context-window) shows where CLAUDE.md loads relative to the rest of the startup context. Because they're context rather than enforced configuration, how you write instructions affects how reliably Claude follows them. Specific, concise, well-structured instructions work best.

**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence. If your instructions are growing large, use [path-scoped rules](#path-specific-rules) so instructions load only when Claude works with matching files. You can also split content into [imports](#import-additional-files) for organization, though imported files still load and enter the context window at launch.

**Structure**: use markdown headers and bullets to group related instructions. Claude scans structure the same way readers do: organized sections are easier to follow than dense paragraphs.

**Specificity**: write instructions that are concrete enough to verify. For example:

* "Use 2-space indentation" instead of "Format code properly"
* "Run `npm test` before committing" instead of "Test your changes"
* "API handlers live in `src/api/handlers/`" instead of "Keep files organized"

**Consistency**: if two rules contradict each other, Claude may pick one arbitrarily. Review your CLAUDE.md files, nested CLAUDE.md files in subdirectories, and [`.claude/rules/`](#organize-rules-with-claude/rules/) periodically to remove outdated or conflicting instructions. In monorepos, use [`claudeMdExcludes`](#exclude-specific-claude-md-files) to skip CLAUDE.md files from other teams that aren't relevant to your work.

### Import additional files

CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them.

Both relative and absolute paths are allowed. Relative paths resolve relative to the file containing the import, not the working directory. Imported files can recursively import other files, with a maximum depth of four hops.

To pull in a README, package.json, and a workflow guide, reference them with `@` syntax anywhere in your CLAUDE.md:

```text theme={null}
See @README for project overview and @package.json for available npm commands for this project.

# Additional Instructions
- git workflow @docs/git-instructions.md
```

For private per-project preferences that shouldn't be checked into version control, create a `CLAUDE.local.md` at the project root. It loads alongside `CLAUDE.md` and is treated the same way. Add `CLAUDE.local.md` to your `.gitignore` so it isn't committed; running `/init` and choosing the personal option does this for you.

If you work across multiple git worktrees of the same repository, a gitignored `CLAUDE.local.md` only exists in the worktree where you created it. To share personal instructions across worktrees, import a file from your home directory instead:

```text theme={null}
# Individual Preferences
- @~/.claude/my-project-instructions.md
```

<Warning>
  The first time Claude Code encounters external imports in a project, it shows an approval dialog listing the files. If you decline, the imports stay disabled and the dialog does not appear again.
</Warning>

For a more structured approach to organizing instructions, see [`.claude/rules/`](#organize-rules-with-claude/rules/).

### AGENTS.md

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. If your repository already uses `AGENTS.md` for other coding agents, create a `CLAUDE.md` that imports it so both tools read the same instructions without duplicating them. You can also add Claude-specific instructions below the import. Claude loads the imported file at session start, then appends the rest:

```markdown CLAUDE.md theme={null}
@AGENTS.md

## Claude Code

Use plan mode for changes under `src/billing/`.
```

A symlink also works if you don't need to add Claude-specific content:

```bash theme={null}
ln -s AGENTS.md CLAUDE.md
```

On Windows, creating a symlink requires Administrator privileges or Developer Mode, so use the `@AGENTS.md` import instead.

Running [`/init`](/docs/en/commands) in a repo that already has an `AGENTS.md` reads it and incorporates the relevant parts into the generated `CLAUDE.md`. It also reads other tool configs like `.cursorrules` and `.windsurfrules`.

### How CLAUDE.md files load

Claude Code reads CLAUDE.md files by walking up the directory tree from your current working directory, checking each directory along the way for `CLAUDE.md` and `CLAUDE.local.md` files. This means if you run Claude Code in `foo/bar/`, it loads instructions from `foo/bar/CLAUDE.md`, `foo/CLAUDE.md`, and any `CLAUDE.local.md` files alongside them.

All discovered files are concatenated into context rather than overriding each other. Across the directory tree, content is ordered from the filesystem root down to your working directory. For the `foo/bar/` example, `foo/CLAUDE.md` appears in context before `foo/bar/CLAUDE.md`, so instructions closer to where you launched Claude are read last. Within each directory, `CLAUDE.local.md` is appended after `CLAUDE.md`, so your personal notes are the last thing Claude reads at that level.

Claude also discovers `CLAUDE.md` and `CLAUDE.local.md` files in subdirectories under your current working directory. Instead of loading them at launch, they are included when Claude reads files in those subdirectories.

If you work in a large monorepo where other teams' CLAUDE.md files get picked up, use [`claudeMdExcludes`](#exclude-specific-claude-md-files) to skip them. For the full layout of root and per-directory CLAUDE.md files and rules, see [Monorepos and large repos](/docs/en/large-codebases).

Block-level HTML comments (`<!-- maintainer notes -->`) in CLAUDE.md files are stripped before the content is injected into Claude's context. Use them to leave notes for human maintainers without spending context tokens on them. Comments inside code blocks are preserved. When you open a CLAUDE.md file directly with the Read tool, comments remain visible.

#### Load from additional directories

The `--add-dir` flag gives Claude access to additional directories outside your main working directory. By default, CLAUDE.md files from these directories are not loaded.

To also load memory files from additional directories, set the `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` environment variable:

```bash theme={null}
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

This loads `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/*.md`, and `CLAUDE.local.md` from the additional directory. `CLAUDE.local.md` is skipped if you exclude `local` from [`--setting-sources`](/docs/en/cli-reference).

### Organize rules with `.claude/rules/`

For larger projects, you can organize instructions into multiple files using the `.claude/rules/` directory. This keeps instructions modular and easier for teams to maintain. Rules can also be [scoped to specific file paths](#path-specific-rules), so they only load into context when Claude works with matching files, reducing noise and saving context space.

<Note>
  Rules load into context every session or when matching files are opened. For task-specific instructions that don't need to be in context all the time, use [skills](/docs/en/skills) instead, which only load when you invoke them or when Claude determines they're relevant to your prompt.
</Note>

#### Set up rules

Place markdown files in your project's `.claude/rules/` directory. Each file should cover one topic, with a descriptive filename like `testing.md` or `api-design.md`. All `.md` files are discovered recursively, so you can organize rules into subdirectories like `frontend/` or `backend/`:

```text theme={null}
your-project/
├── .claude/
│   ├── CLAUDE.md           # Main project instructions
│   └── rules/
│       ├── code-style.md   # Code style guidelines
│       ├── testing.md      # Testing conventions
│       └── security.md     # Security requirements
```

Rules without [`paths` frontmatter](#path-specific-rules) are loaded at launch with the same priority as `.claude/CLAUDE.md`.

#### Path-specific rules

Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns.

```markdown theme={null}
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules

- All API endpoints must include input validation
- Use the standard error response format
- Include OpenAPI documentation comments
```

Rules without a `paths` field are loaded unconditionally and apply to all files. Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use.

Use glob patterns in the `paths` field to match files by extension, directory, or any combination:

| Pattern                | Matches                                  |
| ---------------------- | ---------------------------------------- |
| `**/*.ts`              | All TypeScript files in any directory    |
| `src/**/*`             | All files under `src/` directory         |
| `*.md`                 | Markdown files in the project root       |
| `src/components/*.tsx` | React components in a specific directory |

You can specify multiple patterns and use brace expansion to match multiple extensions in one pattern:

```markdown theme={null}
---
paths:
  - "src/**/*.{ts,tsx}"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---
```

#### Share rules across projects with symlinks

The `.claude/rules/` directory supports symlinks, so you can maintain a shared set of rules and link them into multiple projects. Symlinks are resolved and loaded normally, and circular symlinks are detected and handled gracefully.

This example links both a shared directory and an individual file:

```bash theme={null}
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

#### User-level rules

Personal rules in `~/.claude/rules/` apply to every project on your machine. Use them for preferences that aren't project-specific:

```text theme={null}
~/.claude/rules/
├── preferences.md    # Your personal coding preferences
└── workflows.md      # Your preferred workflows
```

User-level rules are loaded before project rules, giving project rules higher priority.

### Manage CLAUDE.md for large teams

For organizations deploying Claude Code across teams, you can centralize instructions and control which CLAUDE.md files are loaded.

#### Deploy organization-wide CLAUDE.md

Organizations can deploy a centrally managed CLAUDE.md that applies to all users on a machine. This file cannot be excluded by individual settings.

<Steps>
  <Step title="Create the file at the managed policy location">
    * macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
    * Linux and WSL: `/etc/claude-code/CLAUDE.md`
    * Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`
  </Step>

  <Step title="Deploy with your configuration management system">
    Use MDM, Group Policy, Ansible, or similar tools to distribute the file across developer machines. See [managed settings](/docs/en/permissions#managed-settings) for other organization-wide configuration options.
  </Step>
</Steps>

The `claudeMd` key lets you put managed CLAUDE.md content directly inside `managed-settings.json` instead of deploying a separate file.

**Scope**: every Claude Code session on the machine, in every repository. For repository-specific guidance, commit a project CLAUDE.md instead.

**Precedence**: same as a managed CLAUDE.md file. Loads before user and project CLAUDE.md.

**Where it's honored**: managed and policy settings only. Setting `claudeMd` in user, project, or local settings has no effect.

The example below adds behavioral instructions directly in a managed settings file:

```json theme={null}
{
  "claudeMd": "Always run `make lint` before committing.\nNever push directly to main."
}
```

A managed CLAUDE.md and [managed settings](/docs/en/settings#settings-files) serve different purposes. Use settings for technical enforcement and CLAUDE.md for behavioral guidance:

| Concern                                        | Configure in                                              |
| :--------------------------------------------- | :-------------------------------------------------------- |
| Block specific tools, commands, or file paths  | Managed settings: `permissions.deny`                      |
| Enforce sandbox isolation                      | Managed settings: `sandbox.enabled`                       |
| Environment variables and API provider routing | Managed settings: `env`                                   |
| Authentication method and organization lock    | Managed settings: `forceLoginMethod`, `forceLoginOrgUUID` |
| Code style and quality guidelines              | Managed CLAUDE.md                                         |
| Data handling and compliance reminders         | Managed CLAUDE.md                                         |
| Behavioral instructions for Claude             | Managed CLAUDE.md                                         |

Settings rules are enforced by the client regardless of what Claude decides to do. CLAUDE.md instructions shape Claude's behavior but are not a hard enforcement layer.

#### Exclude specific CLAUDE.md files

In large monorepos, ancestor CLAUDE.md files may contain instructions that aren't relevant to your work. The `claudeMdExcludes` setting lets you skip specific files by path or glob pattern.

This example excludes a top-level CLAUDE.md and a rules directory from a parent folder. Add it to `.claude/settings.local.json` so the exclusion stays local to your machine:

```json theme={null}
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

Patterns are matched against absolute file paths using glob syntax. You can configure `claudeMdExcludes` at any [settings layer](/docs/en/settings#settings-files): user, project, local, or managed policy. Arrays merge across layers.

Managed policy CLAUDE.md files cannot be excluded. This ensures organization-wide instructions always apply regardless of individual settings.

## Auto memory

Auto memory lets Claude accumulate knowledge across sessions without you writing anything. Claude saves notes for itself as it works: build commands, debugging insights, architecture notes, code style preferences, and workflow habits. Claude doesn't save something every session. It decides what's worth remembering based on whether the information would be useful in a future conversation.

<Note>
  Auto memory requires Claude Code v2.1.59 or later. Check your version with `claude --version`.
</Note>

### Enable or disable auto memory

Auto memory is on by default. To toggle it, open `/memory` in a session and use the auto memory toggle, or set `autoMemoryEnabled` in your project settings:

```json theme={null}
{
  "autoMemoryEnabled": false
}
```

To disable auto memory via environment variable, set `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

### Storage location

Each project gets its own memory directory at `~/.claude/projects/<project>/memory/`. The `<project>` path is derived from the git repository, so all worktrees and subdirectories within the same repo share one auto memory directory. Outside a git repo, the project root is used instead.

To store auto memory in a different location, set `autoMemoryDirectory` in your `settings.json`. It is read from any [settings scope](/docs/en/settings#settings-precedence): user, project, local, policy, or `--settings`.

```json theme={null}
{
  "autoMemoryDirectory": "~/my-custom-memory-dir"
}
```

The value must be an absolute path or start with `~/`. When set in a project's `.claude/settings.json` or `.claude/settings.local.json`, the value is honored only after you accept the workspace trust dialog for that folder, the same gate that governs hooks.

The directory contains a `MEMORY.md` entrypoint and optional topic files:

```text theme={null}
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Detailed notes on debugging patterns
├── api-conventions.md # API design decisions
└── ...                # Any other topic files Claude creates
```

`MEMORY.md` acts as an index of the memory directory. Claude reads and writes files in this directory throughout your session, using `MEMORY.md` to keep track of what's stored where.

Auto memory is machine-local. All worktrees and subdirectories within the same git repository share one auto memory directory. Files are not shared across machines or cloud environments.

### How it works

The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. Content beyond that threshold is not loaded at session start. Claude keeps `MEMORY.md` concise by moving detailed notes into separate topic files.

This limit applies only to `MEMORY.md`. CLAUDE.md files are loaded in full regardless of length, though shorter files produce better adherence.

Topic files like `debugging.md` or `patterns.md` are not loaded at startup. Claude reads them on demand using its standard file tools when it needs the information.

Claude reads and writes memory files during your session. When you see "Writing memory" or "Recalled memory" in the Claude Code interface, Claude is actively updating or reading from `~/.claude/projects/<project>/memory/`.

### Audit and edit your memory

Auto memory files are plain markdown you can edit or delete at any time. Run [`/memory`](#view-and-edit-with-memory) to browse and open memory files from within a session.

## View and edit with `/memory`

The `/memory` command lists all CLAUDE.md, CLAUDE.local.md, and rules files loaded in your current session, lets you toggle auto memory on or off, and provides a link to open the auto memory folder. Select any file to open it in your editor.

When you ask Claude to remember something, like "always use pnpm, not npm" or "remember that the API tests require a local Redis instance," Claude saves it to auto memory. To add instructions to CLAUDE.md instead, ask Claude directly, like "add this to CLAUDE.md," or edit the file yourself via `/memory`.

## Troubleshoot memory issues

These are the most common issues with CLAUDE.md and auto memory, along with steps to debug them.

### Claude isn't following my CLAUDE.md

CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions.

To debug:

* Run `/memory` to verify your CLAUDE.md and CLAUDE.local.md files are being loaded. If a file isn't listed, Claude can't see it.
* Check that the relevant CLAUDE.md is in a location that gets loaded for your session (see [Choose where to put CLAUDE.md files](#choose-where-to-put-claude-md-files)).
* Make instructions more specific. "Use 2-space indentation" works better than "format code nicely."
* Look for conflicting instructions across CLAUDE.md files. If two files give different guidance for the same behavior, Claude may pick one arbitrarily.

If the instruction is something that must run at a specific point, such as before every commit or after each file edit, write it as a [hook](/docs/en/hooks-guide) instead. Hooks execute as shell commands at fixed lifecycle events and apply regardless of what Claude decides to do.

For instructions you want at the system prompt level, use [`--append-system-prompt`](/docs/en/cli-reference#system-prompt-flags). This must be passed every invocation, so it's better suited to scripts and automation than interactive use.

<Tip>
  Use the [`InstructionsLoaded` hook](/docs/en/hooks#instructionsloaded) to log exactly which instruction files are loaded, when they load, and why. This is useful for debugging path-specific rules or lazy-loaded files in subdirectories.
</Tip>

### I don't know what auto memory saved

Run `/memory` and select the auto memory folder to browse what Claude has saved. Everything is plain markdown you can read, edit, or delete.

### My CLAUDE.md is too large

Files over 200 lines consume more context and may reduce adherence. Use [path-scoped rules](#path-specific-rules) to load instructions only when Claude works with matching files, or trim content that isn't needed in every session. Splitting into [`@path` imports](#import-additional-files) helps organization but does not reduce context, since imported files load at launch.

### Instructions seem lost after `/compact`

Project-root CLAUDE.md survives compaction: after `/compact`, Claude re-reads it from disk and re-injects it into the session. Nested CLAUDE.md files in subdirectories are not re-injected automatically; they reload the next time Claude reads a file in that subdirectory.

If an instruction disappeared after compaction, it was either given only in conversation or lives in a nested CLAUDE.md that hasn't reloaded yet. Add conversation-only instructions to CLAUDE.md to make them persist. See [What survives compaction](/docs/en/context-window#what-survives-compaction) for the full breakdown.

See [Write effective instructions](#write-effective-instructions) for guidance on size, structure, and specificity.

## Related resources

* [Debug your configuration](/docs/en/debug-your-config): diagnose why CLAUDE.md or settings aren't taking effect
* [Skills](/docs/en/skills): package repeatable workflows that load on demand
* [Settings](/docs/en/settings): configure Claude Code behavior with settings files
* [Subagent memory](/docs/en/sub-agents#enable-persistent-memory): let subagents maintain their own auto memory


---

## Explore the .claude directory

`https://code.claude.com/docs/en/claude-directory`

Where Claude Code reads CLAUDE.md, settings.json, hooks, skills, commands, subagents, workflows, rules, and auto memory. Explore the .claude directory in your project and ~/.claude in your home directory.

Claude Code reads instructions, settings, skills, subagents, and memory from your project directory and from `~/.claude` in your home directory. Commit project files to git to share them with your team; files in `~/.claude` are personal configuration that applies across all your projects.

On Windows, `~/.claude` resolves to `%USERPROFILE%\.claude`. If you set [`CLAUDE_CONFIG_DIR`](/docs/en/env-vars), every `~/.claude` path on this page lives under that directory instead.

Most users only edit `CLAUDE.md` and `settings.json`. The rest of the directory is optional: add skills, rules, or subagents as you need them.

## Explore the directory

Click files in the tree to see what each one does, when it loads, and an example.

<ClaudeExplorer />

## What's not shown

The explorer covers files you author and edit. A few related files live elsewhere:

| File                    | Location                   | Purpose                                                                                                                                                                                                                                                            |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `managed-settings.json` | System-level, varies by OS | Enterprise-enforced settings that you can't override. See [server-managed settings](/docs/en/server-managed-settings).                                                                                                                                                  |
| `CLAUDE.local.md`       | Project root               | Your private preferences for this project, loaded alongside CLAUDE.md. Create it manually and add it to `.gitignore`.                                                                                                                                              |
| Installed plugins       | `~/.claude/plugins`        | Cloned marketplaces, installed plugin versions, and per-plugin data, managed by `claude plugin` commands. Orphaned versions are deleted 7 days after a plugin update or uninstall. See [plugin caching](/docs/en/plugins-reference#plugin-caching-and-file-resolution). |

`~/.claude` also holds data Claude Code writes as you work: transcripts, prompt history, file snapshots, caches, and logs. See [application data](#application-data) below.

## Choose the right file

Different kinds of customization live in different files. Use this table to find where a change belongs.

| You want to                                        | Edit                                     | Scope             | Reference                                          |
| :------------------------------------------------- | :--------------------------------------- | :---------------- | :------------------------------------------------- |
| Give Claude project context and conventions        | `CLAUDE.md`                              | project or global | [Memory](/docs/en/memory)                               |
| Allow or block specific tool calls                 | `settings.json` `permissions` or `hooks` | project or global | [Permissions](/docs/en/permissions), [Hooks](/docs/en/hooks) |
| Run a script before or after tool calls            | `settings.json` `hooks`                  | project or global | [Hooks](/docs/en/hooks)                                 |
| Set environment variables for the session          | `settings.json` `env`                    | project or global | [Settings](/docs/en/settings#available-settings)        |
| Keep personal overrides out of git                 | `settings.local.json`                    | project only      | [Settings scopes](/docs/en/settings#settings-files)     |
| Add a prompt or capability you invoke with `/name` | `skills/<name>/SKILL.md`                 | project or global | [Skills](/docs/en/skills)                               |
| Define a specialized subagent with its own tools   | `agents/*.md`                            | project or global | [Subagents](/docs/en/sub-agents)                        |
| Orchestrate many subagents from a script           | `workflows/*.js`                         | project or global | [Dynamic workflows](/docs/en/workflows)                 |
| Connect external tools over MCP                    | `.mcp.json`                              | project only      | [MCP](/docs/en/mcp)                                     |
| Change how Claude formats responses                | `output-styles/*.md`                     | project or global | [Output styles](/docs/en/output-styles)                 |

## File reference

This table lists every file the explorer covers. Project-scope files live in your repo under `.claude/` (or at the root for `CLAUDE.md`, `.mcp.json`, and `.worktreeinclude`). Global-scope files live in `~/.claude/` and apply across all projects.

<Note>
  Several things can override what you put in these files:

  * [Managed settings](/docs/en/server-managed-settings) deployed by your organization take precedence over everything
  * CLI flags like `--permission-mode` or `--settings` override `settings.json` for that session
  * Some environment variables take precedence over their equivalent setting, but this varies: check the [environment variables reference](/docs/en/env-vars) for each one

  See [settings precedence](/docs/en/settings#settings-precedence) for the full order.
</Note>

Click a filename to open that node in the explorer above.

| File                                                | Scope              | Commit | What it does                                                                                                  | Reference                                                       |
| --------------------------------------------------- | ------------------ | ------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`CLAUDE.md`](#ce-claude-md)                        | Project and global | ✓      | Instructions loaded every session                                                                             | [Memory](/docs/en/memory)                                            |
| [`rules/*.md`](#ce-rules)                           | Project and global | ✓      | Topic-scoped instructions, optionally path-gated                                                              | [Rules](/docs/en/memory#organize-rules-with-claude/rules/)           |
| [`settings.json`](#ce-settings-json)                | Project and global | ✓      | Permissions, hooks, env vars, model defaults                                                                  | [Settings](/docs/en/settings)                                        |
| [`settings.local.json`](#ce-settings-local-json)    | Project only       |        | Your personal overrides, auto-gitignored                                                                      | [Settings scopes](/docs/en/settings#settings-files)                  |
| [`.mcp.json`](#ce-mcp-json)                         | Project only       | ✓      | Team-shared MCP servers                                                                                       | [MCP scopes](/docs/en/mcp#mcp-installation-scopes)                   |
| [`.worktreeinclude`](#ce-worktreeinclude)           | Project only       | ✓      | Gitignored files to copy into new worktrees                                                                   | [Worktrees](/docs/en/worktrees#copy-gitignored-files-into-worktrees) |
| [`skills/<name>/SKILL.md`](#ce-skills)              | Project and global | ✓      | Reusable prompts invoked with `/name` or auto-invoked                                                         | [Skills](/docs/en/skills)                                            |
| [`commands/*.md`](#ce-commands)                     | Project and global | ✓      | Single-file prompts; same mechanism as skills                                                                 | [Skills](/docs/en/skills)                                            |
| [`output-styles/*.md`](#ce-output-styles)           | Project and global | ✓      | Custom system-prompt sections                                                                                 | [Output styles](/docs/en/output-styles)                              |
| [`agents/*.md`](#ce-agents)                         | Project and global | ✓      | Subagent definitions with their own prompt and tools                                                          | [Subagents](/docs/en/sub-agents)                                     |
| [`workflows/*.js`](#ce-workflows)                   | Project and global | ✓      | Dynamic workflow scripts written by Claude and saved from `/workflows`; each file becomes a `/<name>` command | [Dynamic workflows](/docs/en/workflows)                              |
| [`agent-memory/<name>/`](#ce-agent-memory)          | Project and global | ✓      | Persistent memory for subagents                                                                               | [Persistent memory](/docs/en/sub-agents#enable-persistent-memory)    |
| [`~/.claude.json`](#ce-claude-json)                 | Global only        |        | App state, OAuth, UI toggles, personal MCP servers                                                            | [Global config](/docs/en/settings#global-config-settings)            |
| [`projects/<project>/memory/`](#ce-global-projects) | Global only        |        | Auto memory: Claude's notes to itself across sessions                                                         | [Auto memory](/docs/en/memory#auto-memory)                           |
| [`keybindings.json`](#ce-keybindings)               | Global only        |        | Custom keyboard shortcuts                                                                                     | [Keybindings](/docs/en/keybindings)                                  |
| [`themes/*.json`](#ce-themes)                       | Global only        |        | Custom color themes                                                                                           | [Custom themes](/docs/en/terminal-config#create-a-custom-theme)      |

## Troubleshoot configuration

If a setting, hook, or file isn't taking effect, see [Debug your configuration](/docs/en/debug-your-config) for the inspection commands and a symptom-first lookup table.

## Application data

Beyond the config you author, `~/.claude` holds data Claude Code writes during sessions. These files are plaintext. Anything that passes through a tool lands in a transcript on disk: file contents, command output, pasted text.

### Cleaned up automatically

Files in the paths below are deleted on startup once they're older than [`cleanupPeriodDays`](/docs/en/settings#available-settings). The default is 30 days.

| Path under `~/.claude/`                      | Contents                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `projects/<project>/<session>.jsonl`         | Full conversation transcript: every message, tool call, and tool result                                                   |
| `projects/<project>/<session>/subagents/`    | [Subagent](/docs/en/sub-agents) conversation transcripts, removed with the parent session transcript when it ages out          |
| `projects/<project>/<session>/tool-results/` | Large tool outputs spilled to separate files                                                                              |
| `file-history/<session>/`                    | Pre-edit snapshots of files Claude changed, used for [checkpoint restore](/docs/en/checkpointing)                              |
| `plans/`                                     | Plan files written during [plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode)                        |
| `debug/`                                     | Per-session debug logs, written only when you start with `--debug` or run `/debug`                                        |
| `paste-cache/`, `image-cache/`               | Contents of large pastes and attached images                                                                              |
| `session-env/`                               | Per-session environment metadata                                                                                          |
| `tasks/`                                     | Per-session task lists written by the task tools                                                                          |
| `shell-snapshots/`                           | Captured shell environment used by the Bash tool. Removed on clean exit. The sweep clears any left after a crash.         |
| `backups/`                                   | Timestamped copies of `~/.claude.json` taken before config migrations                                                     |
| `feedback-bundles/`                          | Redacted transcript archives written by `/feedback` on third-party providers, for sending to your Anthropic account team  |
| `todos/`, `statsig/`, `logs/`                | Legacy directories from older versions. No longer written. The sweep removes their contents and then the empty directory. |

### Kept until you delete them

The following paths are not covered by automatic cleanup and persist indefinitely.

| Path under `~/.claude/` | Contents                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `history.jsonl`         | Every prompt you've typed, with timestamp and project path. Used for up-arrow recall.                                                                                           |
| `stats-cache.json`      | Aggregated token and cost counts shown by `/usage`                                                                                                                              |
| `remote-settings.json`  | Cached copy of [server-managed settings](/docs/en/server-managed-settings) for your organization. Only present when your organization has configured them. Refreshed on each launch. |

Other small cache and lock files appear depending on which features you use and are safe to delete.

### Plaintext storage

Transcripts and history are not encrypted at rest. OS file permissions are the only protection. If a tool reads a `.env` file or a command prints a credential, that value is written to `projects/<project>/<session>.jsonl`. To reduce exposure:

* Lower `cleanupPeriodDays` to shorten how long transcripts are kept
* Set the [`CLAUDE_CODE_SKIP_PROMPT_HISTORY`](/docs/en/env-vars) environment variable to skip writing transcripts and prompt history in any mode. In non-interactive mode, you can instead pass `--no-session-persistence` alongside `-p`, or set `persistSession: false` in the Agent SDK.
* Use [permission rules](/docs/en/permissions) to deny reads of credential files

### Clear local data

Run `claude project purge` to delete the state Claude Code holds for one project:

* Transcripts and auto memory under `projects/`
* Per-session `tasks/`, `debug/`, and `file-history/` entries
* Matching prompt lines in `history.jsonl`
* The project's entry in `~/.claude.json`

The command prints the full deletion plan and asks for confirmation before removing anything.

Preview the plan without deleting anything:

```bash theme={null}
claude project purge ~/work/my-repo --dry-run
```

Delete with a single confirmation prompt:

```bash theme={null}
claude project purge ~/work/my-repo
```

Omit the path to pick a project from an interactive list.

Skip the confirmation prompt for use in scripts:

```bash theme={null}
claude project purge ~/work/my-repo --yes
```

Pass `--all` instead of a path to purge state for every project at once, which deletes `history.jsonl` outright rather than filtering it. Pass `-i` to step through the deletion plan one item at a time.

The command leaves `shell-snapshots/` and `backups/` alone because those are not project-scoped, and warns about them in the plan output. It exits with status 1 if no state matches the given path.

You can also delete any of the application-data paths above by hand. New sessions are unaffected. The table below shows what you lose for past sessions.

| Delete                                                                                                                                                                                       | You lose                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `~/.claude/projects/`                                                                                                                                                                        | Resume, continue, and rewind for past sessions               |
| `~/.claude/history.jsonl`                                                                                                                                                                    | Up-arrow prompt recall                                       |
| `~/.claude/file-history/`                                                                                                                                                                    | Checkpoint restore for past sessions                         |
| `~/.claude/stats-cache.json`                                                                                                                                                                 | Historical totals shown by `/usage`                          |
| `~/.claude/remote-settings.json`                                                                                                                                                             | Nothing. Re-fetched on next launch.                          |
| `~/.claude/debug/`, `~/.claude/plans/`, `~/.claude/paste-cache/`, `~/.claude/image-cache/`, `~/.claude/session-env/`, `~/.claude/tasks/`, `~/.claude/shell-snapshots/`, `~/.claude/backups/` | Nothing user-facing                                          |
| `~/.claude/todos/`, `~/.claude/statsig/`, `~/.claude/logs/`                                                                                                                                  | Nothing. Legacy directories not written by current versions. |

Don't delete `~/.claude.json`, `~/.claude/settings.json`, or `~/.claude/plugins/`: those hold your auth, preferences, and installed plugins.

## Related resources

* [Manage Claude's memory](/docs/en/memory): write and organize CLAUDE.md, rules, and auto memory
* [Configure settings](/docs/en/settings): set permissions, hooks, environment variables, and model defaults
* [Create skills](/docs/en/skills): build reusable prompts and workflows
* [Configure subagents](/docs/en/sub-agents): define specialized agents with their own context
