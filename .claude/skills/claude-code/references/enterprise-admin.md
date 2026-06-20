# Enterprise Administration & Security

_Claude Code documentation — Enterprise Administration & Security. Source: https://code.claude.com/docs/en/_


---

## Set up Claude Code for your organization

`https://code.claude.com/docs/en/admin-setup`

A decision map for administrators deploying Claude Code, covering API providers, managed settings, policy enforcement, usage monitoring, and data handling.

Claude Code enforces organization policy through managed settings that take precedence over local developer configuration. You deliver those settings from the Claude admin console, your mobile device management (MDM) system, or a file on disk. The settings control which tools, commands, servers, and network destinations Claude can reach.

This page walks through the deployment decisions in order. Each row links to the section below and to the reference page for that area.

<Note>
  SSO, SCIM provisioning, and seat assignment are configured at the Claude account level. See the [Claude Enterprise Administrator Guide](https://claude.com/resources/tutorials/claude-enterprise-administrator-guide) and [seat assignment](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) for those steps.
</Note>

| Decision                                                                | What you're choosing                                | Reference                                                                                                                                |
| :---------------------------------------------------------------------- | :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| [Choose your API provider](#choose-your-api-provider)                   | Where Claude Code authenticates and how it's billed | [Authentication](/docs/en/authentication), [Bedrock](/docs/en/amazon-bedrock), [Vertex AI](/docs/en/google-vertex-ai), [Foundry](/docs/en/microsoft-foundry) |
| [Decide how settings reach devices](#decide-how-settings-reach-devices) | How managed policy reaches developer machines       | [Server-managed settings](/docs/en/server-managed-settings), [Settings files](/docs/en/settings#settings-files)                                    |
| [Decide what to enforce](#decide-what-to-enforce)                       | Which tools, commands, and integrations are allowed | [Permissions](/docs/en/permissions), [Sandboxing](/docs/en/sandboxing)                                                                             |
| [Set up usage visibility](#set-up-usage-visibility)                     | How you track spend and adoption                    | [Analytics](/docs/en/analytics), [Monitoring](/docs/en/monitoring-usage), [Costs](/docs/en/costs)                                                       |
| [Review data handling](#review-data-handling)                           | Data retention and compliance posture               | [Data usage](/docs/en/data-usage), [Security](/docs/en/security)                                                                                   |

## Choose your API provider

Claude Code connects to Claude through one of several API providers. Your choice affects billing, authentication, which compliance posture you inherit, and which Claude Code features your developers can use.

| Provider                      | Choose this when                                                                                                                      |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| Claude for Teams / Enterprise | You want Claude Code and claude.ai under one per-seat subscription with no infrastructure to run. This is the default recommendation. |
| Claude Console                | You're API-first or want pay-as-you-go billing                                                                                        |
| Amazon Bedrock                | You want to inherit existing AWS compliance controls and billing                                                                      |
| Google Vertex AI              | You want to inherit existing GCP compliance controls and billing                                                                      |
| Microsoft Foundry             | You want to inherit existing Azure compliance controls and billing                                                                    |

Some Claude Code features require a Claude.ai account. [Claude Code on the web](/docs/en/claude-code-on-the-web), [Routines](/docs/en/routines), [Code Review](/docs/en/code-review), [Remote Control](/docs/en/remote-control), and the [Chrome extension](/docs/en/chrome) are not available through Console API keys or cloud-provider credentials alone. If you deploy through Bedrock, Vertex, or Foundry, plan whether developers also need Claude for Teams or Enterprise seats. Each feature page lists its plan requirements.

For the full provider comparison covering authentication, regions, and feature parity, see the [enterprise deployment overview](/docs/en/third-party-integrations). Each provider's auth setup is in [Authentication](/docs/en/authentication).

Proxy and firewall requirements in [Network configuration](/docs/en/network-config) apply regardless of provider. If you want a single endpoint in front of multiple providers or centralized request logging, see [LLM gateway](/docs/en/llm-gateway).

## Decide how settings reach devices

Managed settings define policy that takes precedence over local developer configuration. Claude Code looks for them in four places and uses the first one it finds on a given device.

| Mechanism               | Delivery                                                                                                                                                                                              | Priority | Platforms      |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- | :------------- |
| Server-managed          | Claude.ai admin console                                                                                                                                                                               | Highest  | All            |
| plist / registry policy | macOS: `com.anthropic.claudecode` plist<br />Windows: `HKLM\SOFTWARE\Policies\ClaudeCode`                                                                                                             | High     | macOS, Windows |
| File-based managed      | macOS: `/Library/Application Support/ClaudeCode/managed-settings.json`<br />Linux and WSL: `/etc/claude-code/managed-settings.json`<br />Windows: `C:\Program Files\ClaudeCode\managed-settings.json` | Medium   | All            |
| Windows user registry   | `HKCU\SOFTWARE\Policies\ClaudeCode`                                                                                                                                                                   | Lowest   | Windows only   |

Server-managed settings reach devices at authentication time and refresh hourly during active sessions, with no endpoint infrastructure. They require a Claude for Teams or Enterprise plan, so deployments on other providers need one of the file-based or OS-level mechanisms instead.

If your organization mixes providers, configure [server-managed settings](/docs/en/server-managed-settings) for Claude.ai users plus a [file-based or plist/registry fallback](/docs/en/settings#settings-files) so other users still receive managed policy.

The plist and HKLM registry locations work with any provider and resist tampering because they require admin privileges to write. The Windows user registry at HKCU is writable without elevation, so treat it as a convenience default rather than an enforcement channel.

By default WSL reads only the Linux file path at `/etc/claude-code`. To extend your Windows registry and `C:\Program Files\ClaudeCode` policy to WSL on the same machine, set [`wslInheritsWindowsSettings: true`](/docs/en/settings#available-settings) in either of those admin-only Windows sources.

Whichever mechanism you choose, managed values take precedence over user and project settings. Array settings such as `permissions.allow` and `permissions.deny` merge entries from all sources, so developers can extend managed lists but not remove from them.

See [Server-managed settings](/docs/en/server-managed-settings) and [Settings files and precedence](/docs/en/settings#settings-files).

## Decide what to enforce

Managed settings can lock down tools, sandbox execution, restrict MCP servers and plugin sources, and control which hooks run. Each row is a control surface with the setting keys that drive it.

| Control                                                                                | What it does                                                                                                                       | Key settings                                                                                                 |
| :------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| [Permission rules](/docs/en/permissions)                                                    | Allow, ask, or deny specific tools and commands                                                                                    | `permissions.allow`, `permissions.deny`                                                                      |
| [Permission lockdown](/docs/en/permissions#managed-only-settings)                           | Only managed permission rules apply; disable `--dangerously-skip-permissions`                                                      | `allowManagedPermissionRulesOnly`, `permissions.disableBypassPermissionsMode`                                |
| [Sandboxing](/docs/en/sandboxing)                                                           | OS-level filesystem and network isolation with domain allowlists                                                                   | `sandbox.enabled`, `sandbox.network.allowedDomains`                                                          |
| [Managed policy CLAUDE.md](/docs/en/memory#deploy-organization-wide-claude-md)              | Org-wide instructions loaded in every session, cannot be excluded                                                                  | File at the managed policy path                                                                              |
| [MCP server control](/docs/en/managed-mcp)                                                  | Restrict which MCP servers users can add or connect to, or deploy a fixed set                                                      | `allowedMcpServers`, `deniedMcpServers`, `allowManagedMcpServersOnly`, or a deployed `managed-mcp.json` file |
| [Plugin marketplace control](/docs/en/plugin-marketplaces#managed-marketplace-restrictions) | Restrict which marketplace sources users can add and install from                                                                  | `strictKnownMarketplaces`, `blockedMarketplaces`                                                             |
| [Customization lockdown](/docs/en/settings#strictpluginonlycustomization)                   | Block skills, agents, hooks, and MCP servers from user and project sources, so they can only come from plugins or managed settings | `strictPluginOnlyCustomization`                                                                              |
| [Hook restrictions](/docs/en/settings#hook-configuration)                                   | Only managed hooks load; restrict HTTP hook URLs                                                                                   | `allowManagedHooksOnly`, `allowedHttpHookUrls`                                                               |
| [Disable agent view](/docs/en/agent-view#how-background-sessions-are-hosted)                | Turn off `claude agents`, `--bg`, `/background`, and the on-demand supervisor                                                      | `disableAgentView`                                                                                           |
| [Version floor](/docs/en/settings)                                                          | Prevent auto-update from installing below an org-wide minimum                                                                      | `minimumVersion`                                                                                             |

Permission rules and sandboxing cover different layers. Denying WebFetch blocks Claude's fetch tool, but if Bash is allowed, `curl` and `wget` can still reach any URL. Sandboxing closes that gap with a network domain allowlist enforced at the OS level.

For the threat model these controls defend against, see [Security](/docs/en/security).

## Set up usage visibility

Choose monitoring based on what you need to report on.

| Capability          | What you get                                         | Availability   | Where to start                           |
| :------------------ | :--------------------------------------------------- | :------------- | :--------------------------------------- |
| Usage monitoring    | OpenTelemetry export of sessions, tools, and tokens  | All providers  | [Monitoring usage](/docs/en/monitoring-usage) |
| Analytics dashboard | Per-user metrics, contribution tracking, leaderboard | Anthropic only | [Analytics](/docs/en/analytics)               |
| Cost tracking       | Spend limits, rate limits, and usage attribution     | Anthropic only | [Costs](/docs/en/costs)                       |

Cloud providers expose spend through AWS Cost Explorer, GCP Billing, or Azure Cost Management. Claude for Teams and Enterprise plans include a usage dashboard at [claude.ai/analytics/claude-code](https://claude.ai/analytics/claude-code).

## Review data handling

On Team, Enterprise, Claude API, and cloud provider plans, Anthropic does not train models on your code or prompts. Your API provider determines retention and compliance posture.

| Topic                     | What to know                                                                    | Where to start                                 |
| :------------------------ | :------------------------------------------------------------------------------ | :--------------------------------------------- |
| Data usage policy         | What Anthropic collects, how long it's retained, what's never used for training | [Data usage](/docs/en/data-usage)                   |
| Zero Data Retention (ZDR) | Nothing stored after the request completes. Available on Claude for Enterprise  | [Zero data retention](/docs/en/zero-data-retention) |
| Security architecture     | Network model, encryption, authentication, audit trail                          | [Security](/docs/en/security)                       |

If you need request-level audit logging or to route traffic by data sensitivity, place an [LLM gateway](/docs/en/llm-gateway) between developers and your provider. For regulatory requirements and certifications, see [Legal and compliance](/docs/en/legal-and-compliance).

## Verify and onboard

After configuring managed settings, have a developer run `/status` inside Claude Code. The output includes a line beginning with `Enterprise managed settings` followed by the source in parentheses, one of `(remote)`, `(plist)`, `(HKLM)`, `(HKCU)`, or `(file)`. See [Verify active settings](/docs/en/settings#verify-active-settings).

Share these resources to help developers get started:

* [Quickstart](/docs/en/quickstart): first-session walkthrough from install to working with a project
* [Common workflows](/docs/en/common-workflows): patterns for everyday tasks like code review, refactoring, and debugging
* [Claude 101](https://anthropic.skilljar.com/claude-101) and [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action): self-paced Anthropic Academy courses

For login issues, point developers to [authentication troubleshooting](/docs/en/troubleshoot-install#login-and-authentication). The most common fixes are:

* Run `/logout` then `/login` to switch accounts
* Run `claude update` if the enterprise auth option is missing
* Restart the terminal after updating

If a developer sees "You haven't been added to your organization yet," their seat doesn't include Claude Code access and needs to be updated in the admin console.

## Next steps

With provider and delivery mechanism chosen, move on to detailed configuration:

* [Server-managed settings](/docs/en/server-managed-settings): deliver managed policy from the Claude admin console
* [Settings reference](/docs/en/settings): every setting key, file location, and precedence rule
* [Monorepos and large repos](/docs/en/large-codebases): per-directory configuration patterns for organizations deploying into a monorepo
* [Amazon Bedrock](/docs/en/amazon-bedrock), [Google Vertex AI](/docs/en/google-vertex-ai), [Microsoft Foundry](/docs/en/microsoft-foundry): provider-specific deployment
* [Claude Enterprise Administrator Guide](https://claude.com/resources/tutorials/claude-enterprise-administrator-guide): SSO, SCIM, seat management, and rollout playbook


---

## Authentication

`https://code.claude.com/docs/en/authentication`

Log in to Claude Code and configure authentication for individuals, teams, and organizations.

Claude Code supports multiple authentication methods depending on your setup. Individual users can log in with a Claude.ai account, while teams can use Claude for Teams or Enterprise, the Claude Console, or a cloud provider like Amazon Bedrock, Google Vertex AI, or Microsoft Foundry.

## Log in to Claude Code

After [installing Claude Code](/docs/en/setup#install-claude-code), run `claude` in your terminal. On first launch, Claude Code opens a browser window for you to log in.

If the browser doesn't open automatically, press `c` to copy the login URL to your clipboard, then paste it into your browser.

If your browser shows a login code instead of redirecting back after you sign in, paste it into the terminal at the `Paste code here if prompted` prompt. This happens when the browser can't reach Claude Code's local callback server, which is common in WSL2, SSH sessions, and containers.

You can authenticate with any of these account types:

* **Claude Pro or Max subscription**: log in with your Claude.ai account. Subscribe at [claude.com/pricing](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=authentication_pro_max).
* **Claude for Teams or Enterprise**: log in with the Claude.ai account your team admin invited you to.
* **Claude Console**: log in with your Console credentials. Your admin must have [invited you](#claude-console-authentication) first.
* **Cloud providers**: if your organization uses [Amazon Bedrock](/docs/en/amazon-bedrock), [Google Vertex AI](/docs/en/google-vertex-ai), or [Microsoft Foundry](/docs/en/microsoft-foundry), set the required environment variables before running `claude`. No browser login is needed.

To log out and re-authenticate, type `/logout` at the Claude Code prompt.

If you're having trouble logging in, see [authentication troubleshooting](/docs/en/troubleshoot-install#login-and-authentication).

## Set up team authentication

For teams and organizations, you can configure Claude Code access in one of these ways:

* [Claude for Teams or Enterprise](#claude-for-teams-or-enterprise), recommended for most teams
* [Claude Console](#claude-console-authentication)
* [Amazon Bedrock](/docs/en/amazon-bedrock)
* [Google Vertex AI](/docs/en/google-vertex-ai)
* [Microsoft Foundry](/docs/en/microsoft-foundry)

### Claude for Teams or Enterprise

[Claude for Teams](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=authentication_teams#team-&-enterprise) and [Claude for Enterprise](https://anthropic.com/contact-sales?utm_source=claude_code\&utm_medium=docs\&utm_content=authentication_enterprise) provide the best experience for organizations using Claude Code. Team members get access to both Claude Code and Claude on the web with centralized billing and team management.

* **Claude for Teams**: self-service plan with collaboration features, admin tools, and billing management. Best for smaller teams.
* **Claude for Enterprise**: adds SSO, domain capture, role-based permissions, compliance API, and managed policy settings for organization-wide Claude Code configurations. Best for larger organizations with security and compliance requirements.

<Steps>
  <Step title="Subscribe">
    Subscribe to [Claude for Teams](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=authentication_teams_step#team-&-enterprise) or contact sales for [Claude for Enterprise](https://anthropic.com/contact-sales?utm_source=claude_code\&utm_medium=docs\&utm_content=authentication_enterprise_step).
  </Step>

  <Step title="Invite team members">
    Invite team members from the admin dashboard.
  </Step>

  <Step title="Install and log in">
    Team members install Claude Code and log in with their Claude.ai accounts.
  </Step>
</Steps>

### Claude Console authentication

For organizations that prefer API-based billing, you can set up access through the Claude Console.

<Steps>
  <Step title="Create or use a Console account">
    Use your existing Claude Console account or create a new one.
  </Step>

  <Step title="Add users">
    You can add users through either method:

    * Bulk invite users from within the Console: Settings -> Members -> Invite
    * [Set up SSO](https://support.claude.com/en/articles/13132885-setting-up-single-sign-on-sso)
  </Step>

  <Step title="Assign roles">
    When inviting users, assign one of:

    * **Claude Code** role: users can only create Claude Code API keys
    * **Developer** role: users can create any kind of API key
  </Step>

  <Step title="Users complete setup">
    Each invited user needs to:

    * Accept the Console invite
    * [Check system requirements](/docs/en/setup#system-requirements)
    * [Install Claude Code](/docs/en/setup#install-claude-code)
    * Log in with Console account credentials
  </Step>
</Steps>

### Cloud provider authentication

For teams using Amazon Bedrock, Google Vertex AI, or Microsoft Foundry:

<Steps>
  <Step title="Follow provider setup">
    Follow the [Bedrock docs](/docs/en/amazon-bedrock), [Vertex docs](/docs/en/google-vertex-ai), or [Microsoft Foundry docs](/docs/en/microsoft-foundry).
  </Step>

  <Step title="Distribute configuration">
    Distribute the environment variables and instructions for generating cloud credentials to your users. Read more about how to [manage configuration here](/docs/en/settings).
  </Step>

  <Step title="Install Claude Code">
    Users can [install Claude Code](/docs/en/setup#install-claude-code).
  </Step>
</Steps>

## Credential management

Claude Code securely manages your authentication credentials:

* **Storage location**:
  * On macOS, credentials are stored in the encrypted macOS Keychain.
  * On Linux, credentials are stored in `~/.claude/.credentials.json` with file mode `0600`.
  * On Windows, credentials are stored in `%USERPROFILE%\.claude\.credentials.json` and inherit the access controls of your user profile directory, which restricts the file to your user account by default.
  * If you've set the `CLAUDE_CONFIG_DIR` environment variable on Linux or Windows, the `.credentials.json` file lives under that directory instead.
  * Claude Code manages `.credentials.json` through `/login` and `/logout`. To route requests through a custom API endpoint, set the [`ANTHROPIC_BASE_URL`](/docs/en/env-vars) environment variable instead.
* **Supported authentication types**: Claude.ai credentials, Claude API credentials, Azure Auth, Bedrock Auth, and Vertex Auth.
* **Custom credential scripts**: the [`apiKeyHelper`](/docs/en/settings#available-settings) setting can be configured to run a shell script that returns an API key.
* **Refresh intervals**: by default, `apiKeyHelper` is called after 5 minutes or on HTTP 401 response. Set `CLAUDE_CODE_API_KEY_HELPER_TTL_MS` environment variable for custom refresh intervals.
* **Slow helper notice**: if `apiKeyHelper` takes longer than 10 seconds to return a key, Claude Code displays a warning notice in the prompt bar showing the elapsed time. If you see this notice regularly, check whether your credential script can be optimized.

`apiKeyHelper`, `ANTHROPIC_API_KEY`, and `ANTHROPIC_AUTH_TOKEN` apply to terminal CLI sessions only. Claude Desktop and remote sessions use OAuth exclusively and do not call `apiKeyHelper` or read API key environment variables.

### Authentication precedence

When multiple credentials are present, Claude Code chooses one in this order:

1. Cloud provider credentials, when `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, or `CLAUDE_CODE_USE_FOUNDRY` is set. See [third-party integrations](/docs/en/third-party-integrations) for setup.
2. `ANTHROPIC_AUTH_TOKEN` environment variable. Sent as the `Authorization: Bearer` header. Use this when routing through an [LLM gateway or proxy](/docs/en/llm-gateway) that authenticates with bearer tokens rather than Anthropic API keys.
3. `ANTHROPIC_API_KEY` environment variable. Sent as the `X-Api-Key` header. Use this for direct Anthropic API access with a key from the [Claude Console](https://platform.claude.com). In interactive mode, you are prompted once to approve or decline the key, and your choice is remembered. To change it later, use the "Use custom API key" toggle in `/config`. In non-interactive mode (`-p`), the key is always used when present.
4. [`apiKeyHelper`](/docs/en/settings#available-settings) script output. Use this for dynamic or rotating credentials, such as short-lived tokens fetched from a vault.
5. `CLAUDE_CODE_OAUTH_TOKEN` environment variable. A long-lived OAuth token generated by [`claude setup-token`](#generate-a-long-lived-token). Use this for CI pipelines and scripts where browser login isn't available.
6. Subscription OAuth credentials from `/login`. This is the default for Claude Pro, Max, Team, and Enterprise users.

If you have an active Claude subscription but also have `ANTHROPIC_API_KEY` set in your environment, the API key takes precedence once approved. This can cause authentication failures if the key belongs to a disabled or expired organization. Run `unset ANTHROPIC_API_KEY` to fall back to your subscription, and check `/status` to confirm which method is active.

[Claude Code on the Web](/docs/en/claude-code-on-the-web) always uses your subscription credentials. `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` in the sandbox environment do not override them.

### Generate a long-lived token

<Note>
  Starting June 15, 2026, Agent SDK and `claude -p` usage on subscription plans will draw from a new monthly Agent SDK credit, separate from your interactive usage limits. See [Use the Claude Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) for details.
</Note>

For CI pipelines, scripts, or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`:

```bash theme={null}
claude setup-token
```

The command walks you through OAuth authorization and prints a token to the terminal. It does not save the token anywhere; copy it and set it as the `CLAUDE_CODE_OAUTH_TOKEN` environment variable wherever you want to authenticate:

```bash theme={null}
export CLAUDE_CODE_OAUTH_TOKEN=your-token
```

This token authenticates with your Claude subscription and requires a Pro, Max, Team, or Enterprise plan. It is scoped to inference only and cannot establish [Remote Control](/docs/en/remote-control) sessions.

[Bare mode](/docs/en/headless#start-faster-with-bare-mode) does not read `CLAUDE_CODE_OAUTH_TOKEN`. If your script passes `--bare`, authenticate with `ANTHROPIC_API_KEY` or an `apiKeyHelper` instead.


---

## Security

`https://code.claude.com/docs/en/security`

Learn about Claude Code's security safeguards and best practices for safe usage.

## How we approach security

### Security foundation

Your code's security is paramount. Claude Code is built with security at its core, developed according to Anthropic's comprehensive security program. Learn more and access resources (SOC 2 Type 2 report, ISO 27001 certificate, etc.) at [Anthropic Trust Center](https://trust.anthropic.com).

### Permission-based architecture

Claude Code uses strict read-only permissions by default. When additional actions are needed (editing files, running tests, executing commands), Claude Code requests explicit permission. Users control whether to approve actions once or allow them automatically.

We designed Claude Code to be transparent and secure. For example, we require approval for bash commands before executing them, giving you direct control. This approach enables users and organizations to configure permissions directly.

For detailed permission configuration, see [Permissions](/docs/en/permissions).

### Built-in protections

To mitigate risks in agentic systems:

* **Sandboxed bash tool**: [Sandbox](/docs/en/sandboxing) bash commands with filesystem and network isolation, reducing permission prompts while maintaining security. Enable with `/sandbox` to define boundaries where Claude Code can work autonomously
* **Write access restriction**: Claude Code can only write to the folder where it was started and its subfolders—it cannot modify files in parent directories without explicit permission. While Claude Code can read files outside the working directory (useful for accessing system libraries and dependencies), write operations are strictly confined to the project scope, creating a clear security boundary
* **Prompt fatigue mitigation**: Support for allowlisting frequently used safe commands per-user, per-codebase, or per-organization
* **Accept Edits mode**: Auto-approves file edits and a fixed set of filesystem Bash commands like `mkdir`, `touch`, `rm`, `mv`, `cp`, and `sed` for paths in the working directory. Other Bash commands and out-of-scope paths still prompt

### User responsibility

Claude Code only has the permissions you grant it. You're responsible for reviewing proposed code and commands for safety before approval.

## Protect against prompt injection

Prompt injection is a technique where an attacker attempts to override or manipulate an AI assistant's instructions by inserting malicious text. Claude Code includes several safeguards against these attacks:

### Core protections

* **Permission system**: Sensitive operations require explicit approval
* **Context-aware analysis**: Detects potentially harmful instructions by analyzing the full request
* **Input sanitization**: Prevents command injection by processing user inputs
* **Command blocklist**: Blocks risky commands that fetch arbitrary content from the web like `curl` and `wget` by default. When explicitly allowed, be aware of [permission pattern limitations](/docs/en/permissions#tool-specific-permission-rules)

### Privacy safeguards

We have implemented several safeguards to protect your data, including:

* Limited retention periods for sensitive information (see the [Privacy Center](https://privacy.anthropic.com/en/articles/10023548-how-long-do-you-store-my-data) to learn more)
* Restricted access to user session data
* User control over data training preferences. Consumer users can change their [privacy settings](https://claude.ai/settings/privacy) at any time.

For full details, please review our [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) (for Team, Enterprise, and API users) or [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (for Free, Pro, and Max users) and [Privacy Policy](https://www.anthropic.com/legal/privacy).

### Additional safeguards

* **Network request approval**: Tools that make network requests require user approval by default
* **Isolated context windows**: Web fetch uses a separate context window to avoid injecting potentially malicious prompts
* **Trust verification**: First-time codebase runs and new MCP servers require trust verification
  * Note: Trust verification is disabled when running non-interactively with the `-p` flag. The exception is [`--worktree`](/docs/en/worktrees), which still requires that trust has been accepted for the directory
  * Note: When you start Claude Code directly in your home directory, trust acceptance is held for the current session only and is not written to disk, so the prompt reappears on each launch. There is no setting to persist it. Start Claude Code from a project subdirectory instead, where trust acceptance is saved per directory
* **Command injection detection**: Suspicious bash commands require manual approval even if previously allowlisted
* **Fail-closed matching**: Unmatched commands default to requiring manual approval
* **Natural language descriptions**: Complex bash commands include explanations for user understanding
* **Secure credential storage**: API keys and tokens are encrypted. See [Credential Management](/docs/en/authentication#credential-management)

<Warning>
  **Windows WebDAV security risk**: When running Claude Code on Windows, we recommend against enabling WebDAV or allowing Claude Code to access paths such as `\\*` that may contain WebDAV subdirectories. [WebDAV has been deprecated by Microsoft](https://learn.microsoft.com/en-us/windows/whats-new/deprecated-features#:~:text=The%20Webclient%20\(WebDAV\)%20service%20is%20deprecated) due to security risks. Enabling WebDAV may allow Claude Code to trigger network requests to remote hosts, bypassing the permission system.
</Warning>

**Best practices for working with untrusted content**:

1. Review suggested commands before approval
2. Avoid piping untrusted content directly to Claude
3. Verify proposed changes to critical files
4. Use virtual machines (VMs) to run scripts and make tool calls, especially when interacting with external web services
5. Report suspicious behavior with `/feedback`

<Warning>
  While these protections significantly reduce risk, no system is completely
  immune to all attacks. Always maintain good security practices when working
  with any AI tool.
</Warning>

## MCP security

Claude Code allows users to configure Model Context Protocol (MCP) servers. The list of allowed MCP servers is configured in your source code, as part of Claude Code settings engineers check into source control.

We encourage either writing your own MCP servers or using MCP servers from providers that you trust. You are able to configure Claude Code permissions for MCP servers. Anthropic reviews connectors against its [listing criteria](https://claude.com/docs/connectors/building/review-criteria) before adding them to the [Anthropic Directory](https://claude.ai/directory), but does not security-audit or manage any MCP server.

## IDE security

See [VS Code security and privacy](/docs/en/vs-code#security-and-privacy) for more information on running Claude Code in an IDE.

## Cloud execution security

When using [Claude Code on the web](/docs/en/claude-code-on-the-web), additional security controls are in place:

* **Isolated virtual machines**: Each cloud session runs in an isolated, Anthropic-managed VM
* **Network access controls**: Network access is limited by default and can be configured to be disabled or allow only specific domains
* **Credential protection**: Authentication is handled through a secure proxy that uses a scoped credential inside the sandbox, which is then translated to your actual GitHub authentication token
* **Branch restrictions**: Git push operations are restricted to the current working branch
* **Audit logging**: All operations in cloud environments are logged for compliance and audit purposes
* **Automatic cleanup**: Cloud environments are automatically terminated after session completion

For more details on cloud execution, see [Claude Code on the web](/docs/en/claude-code-on-the-web).

[Remote Control](/docs/en/remote-control) sessions work differently: the web interface connects to a Claude Code process running on your local machine. All code execution and file access stays local, and the same data that flows during any local Claude Code session travels through the Anthropic API over TLS. No cloud VMs or sandboxing are involved. The connection uses multiple short-lived, narrowly scoped credentials, each limited to a specific purpose and expiring independently, to limit the blast radius of any single compromised credential.

## Security best practices

### Working with sensitive code

* Review all suggested changes before approval
* Use project-specific permission settings for sensitive repositories
* Consider using [dev containers](/docs/en/devcontainer) for additional isolation
* Regularly audit your permission settings with `/permissions`

### Team security

* Use [managed settings](/docs/en/settings#settings-files) to enforce organizational standards
* Share approved permission configurations through version control
* Train team members on security best practices
* Monitor Claude Code usage through [OpenTelemetry metrics](/docs/en/monitoring-usage)
* Audit or block settings changes during sessions with [`ConfigChange` hooks](/docs/en/hooks#configchange)

### Reporting security issues

If you discover a security vulnerability in Claude Code:

1. Do not disclose it publicly
2. Report it through our [HackerOne program](https://hackerone.com/4f1f16ba-10d3-4d09-9ecc-c721aad90f24/embedded_submissions/new)
3. Include detailed reproduction steps
4. Allow time for us to address the issue before public disclosure

## Related resources

* [Security guidance plugin](/docs/en/security-guidance): have Claude review and fix vulnerabilities in its own code changes during the session
* [Sandbox environments](/docs/en/sandbox-environments): compare isolation approaches and choose one for your threat model
* [Sandboxing](/docs/en/sandboxing): filesystem and network isolation for Bash commands
* [Permissions](/docs/en/permissions): configure permissions and access controls
* [Monitoring usage](/docs/en/monitoring-usage): track and audit Claude Code activity
* [Development containers](/docs/en/devcontainer): secure, isolated environments
* [Anthropic Trust Center](https://trust.anthropic.com): security certifications and compliance


---

## Catch security issues as Claude writes code

`https://code.claude.com/docs/en/security-guidance`

Install the security-guidance plugin to have Claude review its own code changes for vulnerabilities and fix them in the same session.

The security guidance plugin makes Claude review its own code changes for common vulnerabilities while it works and fix what it finds in the same session. The plugin catches issues such as injection, unsafe deserialization, and unsafe DOM APIs before the code reaches a pull request, reducing how much security review falls to human reviewers downstream.

Once installed, the plugin runs automatically. There is nothing to invoke and no separate command to remember.

The plugin is the in-session companion to [Code Review](/docs/en/code-review), which runs on pull requests. This plugin reduces what reaches the PR. Code Review catches what does. For how the plugin layers with on-demand review and CI scanning, see [How this fits with other security tools](#how-this-fits-with-other-security-tools).

## Prerequisites

* Claude Code CLI version 2.1.144 or later
* Python 3.8 or later on your `PATH`. The plugin tries `python3`, `python`, and `py -3` in that order
* A git repository for the directory you work in. The end-of-turn and commit reviews diff against git state and skip silently outside a repository. The per-edit pattern check works anywhere

On first run the plugin creates a virtual environment under `~/.claude/security/` and installs the Claude Agent SDK into it, which requires `pip` and network access. If that install fails, the commit review falls back to a single-shot review instead of the agentic one. On Windows the virtual environment step is skipped, so the agentic commit review runs only if `claude-agent-sdk` is already importable and otherwise falls back the same way.

## Install the plugin

In a Claude Code session, install from the [official Anthropic marketplace](/docs/en/discover-plugins#official-anthropic-marketplace):

```text theme={null}
/plugin install security-guidance@claude-plugins-official
```

The install prompts for a scope. Choose user scope to write the plugin to your user settings, so it loads in every new local session you start on this machine. If Claude Code reports that the marketplace is not found, run `/plugin marketplace add anthropics/claude-plugins-official` first, then retry the install.

Then activate it in the current session with `/reload-plugins`, which applies pending plugin changes without a restart:

```text theme={null}
/reload-plugins
```

### Enable in cloud sessions and shared repositories

User-scoped plugins do not carry into [Claude Code on the web](/docs/en/claude-code-on-the-web), because those sessions run on Anthropic infrastructure rather than your machine. To enable the plugin there, or to turn it on for everyone who clones a repository, declare it in the project's checked-in settings:

```json .claude/settings.json theme={null}
{
  "enabledPlugins": {
    "security-guidance@claude-plugins-official": true
  }
}
```

Administrators can enable the plugin organization-wide by setting [`enabledPlugins`](/docs/en/settings#plugin-settings) in [managed settings](/docs/en/admin-setup).

## What the plugin checks

The plugin reviews Claude's work at three points, each at a different depth:

* [On each file edit](#on-each-file-edit): a fast pattern match for risky calls, with no model call
* [At the end of each turn](#at-the-end-of-each-turn): a background model review of everything that turn changed
* [On each commit or push Claude makes](#on-each-commit-or-push-claude-makes): a deeper agentic review that reads surrounding code

You can extend each layer by [adding your own rules](#add-your-own-rules). Built-in checks cannot be removed individually, but you can [disable each layer](#disable-or-uninstall) independently.

### On each file edit

When Claude writes to a file, the plugin scans the new content for known risky patterns. This is a pattern match with no model call, so it adds no usage cost.

Example pattern categories:

* Dynamic code execution: `eval(`, `new Function`, `os.system`, `child_process.exec`
* Unsafe deserialization: `pickle`
* DOM injection: `dangerouslySetInnerHTML`, `.innerHTML =`, `document.write`
* Workflow files: edits under `.github/workflows/`, which can grant repository-level permissions

The check runs after the edit lands and appends the warning to Claude's context for the next step. Each warning fires once per pattern per file per session, so repeat matches in the same file do not flood the conversation.

You can [add your own patterns](#add-custom-per-edit-patterns) to this layer with a `security-patterns.yaml` file.

### At the end of each turn

A turn is one round of Claude responding: you send a message, Claude works and replies, and the turn ends. After each turn, the plugin computes a git diff of everything that changed in the working tree during the turn, including changes from Claude's edit tools, Bash commands, and subagents, and sends it to a separate Claude review focused on security. The review runs in the background, so Claude's reply is not delayed. If the review finds issues, Claude is re-prompted with the findings and addresses them as a follow-up.

This catches issues a string match cannot, such as:

* Authorization bypass
* Insecure direct object references
* Injection
* Server-side request forgery
* Weak cryptography

You see both the finding and Claude's resolution directly in your session. The review covers up to 30 changed files per turn and fires at most three times in a row before yielding back to you.

### On each commit or push Claude makes

When Claude runs `git commit` or `git push` through its Bash tool, the plugin runs a deeper agentic review of the change in the background. This review reads surrounding code, including callers, sanitizers, and related files, to decide whether a finding is real before reporting it. The extra context keeps false positives low on patterns that look dangerous in isolation but are safe in your codebase.

This layer fires only on commits and pushes Claude makes through its Bash tool. Commits you run from your own shell, including the `!` shell escape inside a session, are not reviewed. Commit and push reviews are capped at 20 per rolling hour. If the commit review's findings duplicate what the end-of-turn review already reported, Claude is not re-prompted, so a clean commit produces no visible output from this layer.

### Review independence and limits

The plugin does not ask the same Claude instance that wrote the code to grade itself. The per-edit check is a deterministic string match with no model involved. The end-of-turn and commit reviews run as a separate Claude call with a fresh context and a security-focused prompt: the reviewer starts from the diff, has no investment in the original approach, and is instructed only to find problems.

None of the layers block writes or commits. Findings reach the writing Claude as instructions, Claude addresses them in the conversation, and the review model can miss issues. Treat the plugin as one layer of defense in depth, not a complete security solution. See [How this fits with other security tools](#how-this-fits-with-other-security-tools).

## Add your own rules

The plugin has two extension points: a Markdown guidance file for the model-backed reviews, and a YAML or JSON patterns file for the per-edit string match. Both are additive. You can add checks but cannot disable built-in ones from these files.

### Add guidance for the model-backed reviews

Create `.claude/claude-security-guidance.md` in your project and describe your threat model and review checklist in plain language. The model-backed reviews load it as additional context alongside the built-in vulnerability checklist.

The following example is for a web service with role-gated admin routes and a customer-data logging policy:

```markdown .claude/claude-security-guidance.md theme={null}
# Security guidance for this repo

- Do not log `customer_id` or `account_number` at INFO level or above.
- All routes under `/admin` must call `require_role("admin")` before any database read.
- Use `crypto.timingSafeEqual` for token comparison instead of `===`.
```

These rules are guidance for the reviewer, not deterministic guardrails. The plugin surfaces violations as findings for Claude to fix, but it does not block writes or guarantee every violation is caught. The guidance is additive only: a rule that says to ignore a vulnerability class does not suppress those findings. For hard enforcement, pair the plugin with a [hook that blocks the edit](/docs/en/hooks-guide#block-edits-to-protected-files) or a CI check.

### Add custom per-edit patterns

Create `.claude/security-patterns.yaml` to add regex or substring rules to the [per-edit pattern check](#on-each-file-edit). These run as deterministic string matches alongside the built-in patterns:

```yaml .claude/security-patterns.yaml theme={null}
patterns:
  - rule_name: internal_api_key
    substrings: ["sk_live_", "AKIA"]
    reminder: "Hardcoded API key prefix. Load credentials from the secret manager."
  - rule_name: tenant_unfiltered_query
    regex: "\\.objects\\.all\\(\\)"
    paths: ["**/src/tenants/**"]
    reminder: "Multi-tenant code must filter by org_id."
```

| Field           | Type   | Description                                                                                                                                             |
| :-------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rule_name`     | string | Identifier shown in the warning                                                                                                                         |
| `reminder`      | string | Warning text appended to Claude's context, capped at 1 KB                                                                                               |
| `regex`         | string | Python regex matched against the edited content                                                                                                         |
| `substrings`    | list   | Literal substrings; provide this or `regex`                                                                                                             |
| `paths`         | list   | Optional glob patterns; the rule applies only to matching files. Globs match against the full file path, so prefix project-relative patterns with `**/` |
| `exclude_paths` | list   | Optional glob patterns to skip; same matching as `paths`                                                                                                |

The plugin also reads `.claude/security-patterns.yml` and `.claude/security-patterns.json` with the same schema. JSON works on any Python install. The YAML forms require PyYAML to be importable, which the plugin does not install for you. The plugin loads up to 50 custom rules and skips regexes that look prone to catastrophic backtracking.

### Rule file lookup locations

The plugin looks for `claude-security-guidance.md` and `security-patterns.yaml` in the same locations, independently of how the plugin was enabled:

| Scope         | Path                                        | Notes                                    |
| :------------ | :------------------------------------------ | :--------------------------------------- |
| User          | `~/.claude/claude-security-guidance.md`     | Applies to every project on your machine |
| Project       | `.claude/claude-security-guidance.md`       | Checked in with the repository           |
| Project local | `.claude/claude-security-guidance.local.md` | Gitignored, for personal overrides       |

The plugin loads all locations that exist and concatenates them, with a combined cap of 8 KB for the guidance file. Administrators can distribute organization-wide rules by pushing the user-scope file to `~/.claude/` through device management. The same paths apply to `security-patterns.yaml`.

## Usage cost

The [per-edit pattern check](#on-each-file-edit) makes no model call and adds no cost. The [end-of-turn](#at-the-end-of-each-turn) and [commit](#on-each-commit-or-push-claude-makes) reviews each spend additional model usage that counts toward your [usage](/docs/en/costs) like any other Claude request. The commit review is agentic and may take several model turns per commit, capped at 20 reviews per rolling hour. Expect roughly one review call per turn that changes files and one deeper review per commit, both subject to the caps above.

Both model-backed reviews use Claude Opus 4.7 by default. Set `SECURITY_REVIEW_MODEL` to choose a different model for the end-of-turn review and `SG_AGENTIC_MODEL` for the commit review.

The plugin is available on all plans.

## Disable or uninstall

To turn off individual layers while keeping the rest, set the matching environment variable:

| Variable                        | Effect                                                                     |
| :------------------------------ | :------------------------------------------------------------------------- |
| `ENABLE_PATTERN_RULES=0`        | Disable the [per-edit pattern check](#on-each-file-edit)                   |
| `ENABLE_STOP_REVIEW=0`          | Disable the [end-of-turn diff review](#at-the-end-of-each-turn)            |
| `ENABLE_COMMIT_REVIEW=0`        | Disable the [commit and push review](#on-each-commit-or-push-claude-makes) |
| `ENABLE_CODE_SECURITY_REVIEW=0` | Disable all model-backed reviews at once                                   |
| `SECURITY_GUIDANCE_DISABLE=1`   | Disable the plugin entirely without uninstalling                           |

To pause the plugin in your user scope:

```text theme={null}
/plugin disable security-guidance@claude-plugins-official
```

To remove it from your user scope:

```text theme={null}
/plugin uninstall security-guidance@claude-plugins-official
```

If the plugin was enabled through a project's `.claude/settings.json`, disabling it from `/plugin` writes an override to your `.claude/settings.local.json` rather than editing the checked-in file, so the plugin stays off for you while teammates are unaffected. If it was enabled through [managed settings](/docs/en/admin-setup), only an administrator can disable it.

## How the plugin integrates with Claude Code

The plugin is built entirely on [hooks](/docs/en/hooks), the mechanism for running your own code at specific points in Claude's loop. It registers:

| Hook event                                                       | Purpose                                                                     |
| :--------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| `SessionStart`                                                   | Bootstrap the plugin's Python environment                                   |
| `UserPromptSubmit`                                               | Capture the working-tree baseline that the end-of-turn review diffs against |
| `PostToolUse` on `Edit`, `Write`, and `NotebookEdit`             | Per-edit pattern match                                                      |
| `Stop`                                                           | End-of-turn diff review, run in the background                              |
| `PostToolUse` on `Bash`, filtered to `git commit` and `git push` | Commit and push review, run in the background                               |

If you build your own hooks, the [plugin's source](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance) is a working example of running a separate model call from a hook and feeding the result back to the session.

## How this fits with other security tools

The plugin is one layer in a defense-in-depth approach. It catches issues earliest, while code is still in the editor, but it is not a guarantee and does not replace later checks. A typical stack:

| Stage           | Tool                                                      | What it covers                                                                                   |
| :-------------- | :-------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| In session      | Security guidance plugin                                  | Common vulnerabilities in code Claude writes, fixed in the same session                          |
| On demand       | [`/security-review`](/docs/en/commands#all-commands)           | One-time security pass on the current branch, run when you ask                                   |
| On pull request | [Code Review](/docs/en/code-review), Team and Enterprise plans | Multi-agent correctness and security review with full codebase context                           |
| In CI           | Your existing static analysis and dependency scanners     | Language-specific rules, supply-chain checks, and policy enforcement the plugin does not attempt |

Each later stage catches what earlier ones miss. The plugin's value is reducing the volume that reaches them, not eliminating the need for them.

## Troubleshooting

The plugin writes runtime diagnostics to `~/.claude/security/log.txt`. Check there first if reviews are not appearing.

Common reasons a review layer skips without a message in the conversation:

* The directory is not a git repository: the end-of-turn and commit reviews require git state and skip outside a repository
* The session has no Anthropic authentication: the model-backed reviews skip and only the per-edit pattern check runs
* A `security-patterns.yaml` file is present but PyYAML is not importable: the file is ignored. Use `security-patterns.json` instead

## Related resources

To go deeper on the pieces this page touches:

* [Code Review](/docs/en/code-review): set up the PR-time multi-agent review
* [Automate workflows with hooks](/docs/en/hooks-guide): build your own checks at the same lifecycle points
* [Discover and install plugins](/docs/en/discover-plugins#official-anthropic-marketplace): browse other official plugins


---

## Data usage

`https://code.claude.com/docs/en/data-usage`

Learn about Anthropic's data usage policies for Claude

## Data policies

### Data training policy

**Consumer users (Free, Pro, and Max plans)**:
We give you the choice to allow your data to be used to improve future Claude models. We will train new models using data from Free, Pro, and Max accounts when this setting is on (including when you use Claude Code from these accounts).

**Commercial users**: (Team and Enterprise plans, API, 3rd-party platforms, and Claude Gov) maintain existing policies: Anthropic does not train generative models using code or prompts sent to Claude Code under commercial terms, unless the customer has chosen to provide their data to us for model improvement (for example, the [Developer Partner Program](https://support.claude.com/en/articles/11174108-about-the-development-partner-program)).

### Development Partner Program

If you explicitly opt in to methods to provide us with materials to train on, such as via the [Development Partner Program](https://support.claude.com/en/articles/11174108-about-the-development-partner-program), we may use those materials provided to train our models. An organization admin can expressly opt-in to the Development Partner Program for their organization. Note that this program is available only for Anthropic first-party API, and not for Bedrock or Vertex users.

### Feedback using the `/feedback` command

If you choose to send us feedback about Claude Code using the `/feedback` command, we may use your feedback to improve our products and services. Transcripts shared via `/feedback` are retained for 5 years.

### Session quality surveys

When you see the "How is Claude doing this session?" prompt in Claude Code, responding to this survey, including selecting "Dismiss", records only your rating. We do not collect or store any conversation transcripts, inputs, outputs, or other session data as part of the rating prompt itself. Unlike thumbs up/down feedback or `/feedback` reports, this session quality survey is a simple product satisfaction metric.

After the rating prompt, you may see a separate follow-up asking "Can Anthropic look at your session transcript to help us improve Claude Code?". This is an optional second step distinct from the rating:

* **Yes**: uploads your conversation transcript, any subagent transcripts, and the raw session log file from disk to Anthropic. Known API key and token patterns are redacted before upload. Source code, file contents, and other conversation content are uploaded as-is. Shared transcripts are retained for up to 6 months.
* **No**: declines without sending anything
* **Don't ask again**: declines and stops this follow-up from appearing in future sessions

Nothing is uploaded unless you explicitly select **Yes**. Organizations with [zero data retention](/docs/en/zero-data-retention), or where product feedback is disabled by organization policy, or where `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set, never see this follow-up. Your responses to this survey, including session transcripts submitted after the rating prompt, do not impact your data training preferences and cannot be used to train our AI models.

To disable these surveys, set `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1`. The survey is also disabled when `DISABLE_TELEMETRY`, `DO_NOT_TRACK`, or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set. Organizations that block nonessential traffic but capture survey responses through their own [OpenTelemetry collector](/docs/en/monitoring-usage) can opt the survey back in by setting `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL=1`. The survey then logs ratings to the configured collector only. The transcript-share follow-up and all other Anthropic-bound feedback traffic stay disabled. To control frequency instead of disabling, set [`feedbackSurveyRate`](/docs/en/settings#available-settings) in your settings file to a probability between `0` and `1`.

### Data retention

Anthropic retains Claude Code data based on your account type and preferences.

**Consumer users (Free, Pro, and Max plans)**:

* Users who allow data use for model improvement: 5-year retention period to support model development and safety improvements
* Users who don't allow data use for model improvement: 30-day retention period
* Privacy settings can be changed at any time at [claude.ai/settings/data-privacy-controls](https://claude.ai/settings/data-privacy-controls).

**Commercial users (Team, Enterprise, and API)**:

* Standard: 30-day retention period
* [Zero data retention](/docs/en/zero-data-retention): available for Claude Code on Claude for Enterprise. ZDR is enabled on a per-organization basis; each new organization must have ZDR enabled separately by your account team
* Local caching: Claude Code clients store session transcripts locally in plaintext under `~/.claude/projects/` for 30 days by default to enable session resumption. Adjust the period with `cleanupPeriodDays`. See [application data](/docs/en/claude-directory#application-data) for what's stored and how to clear it.

You can delete individual Claude Code on the web sessions at any time. Deleting a session permanently removes the session's event data. For instructions on how to delete sessions, see [Delete sessions](/docs/en/claude-code-on-the-web#delete-sessions).

Learn more about data retention practices in our [Privacy Center](https://privacy.anthropic.com/).

For full details, please review our [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) (for Team, Enterprise, and API users) or [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (for Free, Pro, and Max users) and [Privacy Policy](https://www.anthropic.com/legal/privacy).

## Data access

For all first party users, you can learn more about what data is logged for [local Claude Code](#local-claude-code-data-flow-and-dependencies) and [remote Claude Code](#cloud-execution-data-flow-and-dependencies). [Remote Control](/docs/en/remote-control) sessions follow the local data flow since all execution happens on your machine. Note for remote Claude Code, Claude accesses the repository where you initiate your Claude Code session. Claude does not access repositories that you have connected but have not started a session in.

## Local Claude Code: Data flow and dependencies

The diagram below shows how Claude Code connects to external services during installation and normal operation. Solid lines indicate required connections, while dashed lines represent optional or user-initiated data flows.

<img alt="Diagram showing Claude Code's external connections: install/update connects to the distribution server, and user requests connect to Anthropic services including Console auth, public-api, and optionally metrics, Sentry, and bug reporting" />

Claude Code runs locally. To interact with the LLM, Claude Code sends data over the network. This data includes all user prompts and model outputs, encrypted in transit via TLS 1.2+. Claude Code is compatible with most popular VPNs and LLM proxies.

Encryption at rest depends on your model provider:

| Provider               | Encryption at rest                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic API          | Infrastructure-level disk encryption (AES-256). Enable [Zero Data Retention](/docs/en/zero-data-retention) for no server-side persistence. |
| Amazon Bedrock         | AES-256 with AWS-managed keys. Customer-managed keys available via AWS KMS.                                                           |
| Google Cloud Vertex AI | Google-managed encryption keys. CMEK available.                                                                                       |
| Microsoft Foundry      | Requests route to Anthropic infrastructure with AES-256 disk encryption.                                                              |

Claude Code is built on Anthropic's APIs. For details on API security controls, including API logging procedures, see the compliance artifacts in the [Anthropic Trust Center](https://trust.anthropic.com).

### Cloud execution: Data flow and dependencies

When using [Claude Code on the web](/docs/en/claude-code-on-the-web), sessions run in Anthropic-managed virtual machines instead of locally. In cloud environments:

* **Code and data storage:** Your repository is cloned to an isolated VM. Code and session data are subject to the retention and usage policies for your account type (see Data retention section above)
* **Credentials:** GitHub authentication is handled through a secure proxy; your GitHub credentials never enter the sandbox
* **Network traffic:** All outbound traffic goes through a security proxy for audit logging and abuse prevention
* **Session data:** Prompts, code changes, and outputs follow the same data policies as local Claude Code usage

For security details about cloud execution, see [Security](/docs/en/security#cloud-execution-security).

## Telemetry services

Claude Code connects from users' machines to Anthropic to log operational metrics such as latency, reliability, and usage patterns. This logging does not include any code or file paths. Data is encrypted in transit and at rest. To opt out of telemetry, set the `DISABLE_TELEMETRY` environment variable.

Claude Code connects from users' machines to Sentry for operational error logging. The data is encrypted in transit using TLS and at rest using 256-bit AES encryption. Read more in the [Sentry security documentation](https://sentry.io/security/). To opt out of error logging, set the `DISABLE_ERROR_REPORTING` environment variable.

When you run the `/feedback` command, a copy of your conversation history including code is sent to Anthropic. Before submitting, you choose how much history to include: the current session only, which is the default, or also other sessions from the same project over the last 24 hours or 7 days. The data is encrypted in transit via TLS. Optionally, a GitHub issue is created in the public repository. To opt out, set the `DISABLE_FEEDBACK_COMMAND` environment variable to `1`.

When you use a third-party provider such as Bedrock or Vertex, or have no Anthropic credentials configured, `/feedback` writes the report to a local archive under `~/.claude/feedback-bundles/` instead of sending it to Anthropic. Known API key and token patterns are redacted before the archive is written. Nothing leaves your machine until you send that file to your Anthropic account representative or attach it to a support request.

## Default behaviors by API provider

By default, error reporting, telemetry, and bug reporting are disabled when using Bedrock, Vertex, Foundry, or Claude Platform on AWS. Session quality surveys and the WebFetch domain safety check are exceptions and run regardless of provider. You can opt out of all non-essential traffic, including surveys, at once by setting `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`. This variable does not affect the WebFetch check, which has its own opt-out. Here are the full default behaviors:

| Service                              | Claude API                                                                             | Vertex API                                                                             | Bedrock API                                                                            | Foundry API                                                                            | Claude Platform on AWS                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Anthropic (Metrics)**              | Default on.<br />`DISABLE_TELEMETRY=1` to disable.                                     | Default off.<br />`CLAUDE_CODE_USE_VERTEX` must be 1.                                  | Default off.<br />`CLAUDE_CODE_USE_BEDROCK` must be 1.                                 | Default off.<br />`CLAUDE_CODE_USE_FOUNDRY` must be 1.                                 | Default off.<br />`CLAUDE_CODE_USE_ANTHROPIC_AWS` must be 1.                           |
| **Sentry (Errors)**                  | Default on.<br />`DISABLE_ERROR_REPORTING=1` to disable.                               | Default off.<br />`CLAUDE_CODE_USE_VERTEX` must be 1.                                  | Default off.<br />`CLAUDE_CODE_USE_BEDROCK` must be 1.                                 | Default off.<br />`CLAUDE_CODE_USE_FOUNDRY` must be 1.                                 | Default off.<br />`CLAUDE_CODE_USE_ANTHROPIC_AWS` must be 1.                           |
| **Claude API (`/feedback` reports)** | Default on.<br />`DISABLE_FEEDBACK_COMMAND=1` to disable.                              | Default off.<br />`CLAUDE_CODE_USE_VERTEX` must be 1.                                  | Default off.<br />`CLAUDE_CODE_USE_BEDROCK` must be 1.                                 | Default off.<br />`CLAUDE_CODE_USE_FOUNDRY` must be 1.                                 | Default off.<br />`CLAUDE_CODE_USE_ANTHROPIC_AWS` must be 1.                           |
| **Session quality surveys**          | Default on.<br />`CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1` to disable.                   | Default on.<br />`CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1` to disable.                   | Default on.<br />`CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1` to disable.                   | Default on.<br />`CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1` to disable.                   | Default on.<br />`CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY=1` to disable.                   |
| **WebFetch domain safety check**     | Default on.<br />`skipWebFetchPreflight: true` in [settings](/docs/en/settings) to disable. | Default on.<br />`skipWebFetchPreflight: true` in [settings](/docs/en/settings) to disable. | Default on.<br />`skipWebFetchPreflight: true` in [settings](/docs/en/settings) to disable. | Default on.<br />`skipWebFetchPreflight: true` in [settings](/docs/en/settings) to disable. | Default on.<br />`skipWebFetchPreflight: true` in [settings](/docs/en/settings) to disable. |

All environment variables can be checked into `settings.json` (see [settings reference](/docs/en/settings)).

As of v2.1.126, when a host platform sets `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`, metrics default to on for Vertex, Bedrock, and Foundry, and follow the standard `DISABLE_TELEMETRY` opt-out. Sentry error reporting and `/feedback` reports remain off by default on those providers.

### WebFetch domain safety check

Before fetching a URL, the WebFetch tool sends the requested hostname to `api.anthropic.com` to check it against a safety blocklist maintained by Anthropic. Only the hostname is sent, not the full URL, path, or page contents. Results are cached per hostname for five minutes.

This check runs regardless of which model provider you use and is not affected by `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`. If your network blocks `api.anthropic.com`, WebFetch requests fail until you either allowlist the domain or set `skipWebFetchPreflight: true` in [settings](/docs/en/settings). Disabling the check means WebFetch attempts to retrieve any URL without consulting the blocklist, so combine it with [`WebFetch` permission rules](/docs/en/permissions#webfetch) if you need to restrict which domains Claude can reach.


---

## Monitoring

`https://code.claude.com/docs/en/monitoring-usage`

Learn how to enable and configure OpenTelemetry for Claude Code.

Track Claude Code usage, costs, and tool activity across your organization by exporting telemetry data through OpenTelemetry (OTel). Claude Code exports metrics as time series data via the standard metrics protocol, events via the logs/events protocol, and optionally distributed traces via the [traces protocol](#traces-beta). Configure your metrics, logs, and traces backends to match your monitoring requirements.

## Quick start

Configure OpenTelemetry using environment variables:

```bash theme={null}
# 1. Enable telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# 2. Choose exporters (both are optional - configure only what you need)
export OTEL_METRICS_EXPORTER=otlp       # Options: otlp, prometheus, console, none
export OTEL_LOGS_EXPORTER=otlp          # Options: otlp, console, none

# 3. Configure OTLP endpoint (for OTLP exporter)
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# 4. Set authentication (if required)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# 5. For debugging: reduce export intervals
export OTEL_METRIC_EXPORT_INTERVAL=10000  # 10 seconds (default: 60000ms)
export OTEL_LOGS_EXPORT_INTERVAL=5000     # 5 seconds (default: 5000ms)

# 6. Run Claude Code
claude
```

<Note>
  The default export intervals are 60 seconds for metrics and 5 seconds for logs. During setup, you may want to use shorter intervals for debugging purposes. Remember to reset these for production use.
</Note>

For full configuration options, see the [OpenTelemetry specification](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/protocol/exporter.md#configuration-options).

## Administrator configuration

Administrators can configure OpenTelemetry settings for all users through the [managed settings file](/docs/en/settings#settings-files). This allows for centralized control of telemetry settings across an organization. See the [settings precedence](/docs/en/settings#settings-precedence) for more information about how settings are applied.

Example managed settings configuration:

```json theme={null}
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.example.com:4317",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer example-token"
  }
}
```

<Note>
  Managed settings can be distributed via MDM (Mobile Device Management) or other device management solutions. Environment variables defined in the managed settings file have high precedence and cannot be overridden by users.
</Note>

Claude Code does not pass `OTEL_*` environment variables to the subprocesses it spawns, including the Bash tool, hooks, MCP servers, and language servers. An OpenTelemetry-instrumented application that you run through the Bash tool does not inherit Claude Code's exporter endpoint or headers, so set those variables directly in the command if that application needs to export its own telemetry.

## Configuration details

### Common configuration variables

| Environment Variable                                | Description                                                                                                                                                                                                                                                                                                                       | Example Values                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_ENABLE_TELEMETRY`                      | Enables telemetry collection (required)                                                                                                                                                                                                                                                                                           | `1`                                                                                                                             |
| `OTEL_METRICS_EXPORTER`                             | Metrics exporter types, comma-separated. Use `none` to disable                                                                                                                                                                                                                                                                    | `console`, `otlp`, `prometheus`, `none`                                                                                         |
| `OTEL_LOGS_EXPORTER`                                | Logs/events exporter types, comma-separated. Use `none` to disable                                                                                                                                                                                                                                                                | `console`, `otlp`, `none`                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                       | Protocol for OTLP exporter, applies to all signals                                                                                                                                                                                                                                                                                | `grpc`, `http/json`, `http/protobuf`                                                                                            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                       | OTLP collector endpoint for all signals                                                                                                                                                                                                                                                                                           | `http://localhost:4317`                                                                                                         |
| `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`               | Protocol for metrics, overrides general setting                                                                                                                                                                                                                                                                                   | `grpc`, `http/json`, `http/protobuf`                                                                                            |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`               | OTLP metrics endpoint, overrides general setting                                                                                                                                                                                                                                                                                  | `http://localhost:4318/v1/metrics`                                                                                              |
| `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`                  | Protocol for logs, overrides general setting                                                                                                                                                                                                                                                                                      | `grpc`, `http/json`, `http/protobuf`                                                                                            |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`                  | OTLP logs endpoint, overrides general setting                                                                                                                                                                                                                                                                                     | `http://localhost:4318/v1/logs`                                                                                                 |
| `OTEL_EXPORTER_OTLP_HEADERS`                        | Authentication headers for OTLP                                                                                                                                                                                                                                                                                                   | `Authorization=Bearer token`                                                                                                    |
| `OTEL_METRIC_EXPORT_INTERVAL`                       | Export interval in milliseconds (default: 60000)                                                                                                                                                                                                                                                                                  | `5000`, `60000`                                                                                                                 |
| `OTEL_LOGS_EXPORT_INTERVAL`                         | Logs export interval in milliseconds (default: 5000)                                                                                                                                                                                                                                                                              | `1000`, `10000`                                                                                                                 |
| `OTEL_LOG_USER_PROMPTS`                             | Enable logging of user prompt content (default: disabled)                                                                                                                                                                                                                                                                         | `1` to enable                                                                                                                   |
| `OTEL_LOG_TOOL_DETAILS`                             | Enable logging of tool parameters and input arguments in tool events and trace span attributes: Bash commands, MCP server and tool names, skill names, and tool input. Also enables custom, plugin, and MCP command names on `user_prompt` events (default: disabled)                                                             | `1` to enable                                                                                                                   |
| `OTEL_LOG_TOOL_CONTENT`                             | Enable logging of tool input and output content in span events (default: disabled). Requires [tracing](#traces-beta). Content is truncated at 60 KB                                                                                                                                                                               | `1` to enable                                                                                                                   |
| `OTEL_LOG_RAW_API_BODIES`                           | Emit the full Anthropic Messages API request and response JSON as `api_request_body` / `api_response_body` log events (default: disabled). Bodies include the entire conversation history. Enabling this implies consent to everything `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, and `OTEL_LOG_TOOL_CONTENT` would reveal | `1` for inline bodies truncated at 60 KB, or `file:<dir>` for untruncated bodies on disk with a `body_ref` pointer in the event |
| `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE` | Metrics temporality preference (default: `delta`). Set to `cumulative` if your backend expects cumulative temporality                                                                                                                                                                                                             | `delta`, `cumulative`                                                                                                           |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`       | Interval for refreshing dynamic headers (default: 1740000ms / 29 minutes)                                                                                                                                                                                                                                                         | `900000`                                                                                                                        |

### mTLS authentication

How you configure client certificates for the OTLP exporter depends on the OTLP protocol in use for that signal, set via `OTEL_EXPORTER_OTLP_PROTOCOL` or the per-signal override. The same configuration applies to metrics, logs, and traces.

| Protocol                     | Client certificate variables                                                                                                                                                                      | Trust the collector's CA with    |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------- |
| `http/protobuf`, `http/json` | `CLAUDE_CODE_CLIENT_CERT`, `CLAUDE_CODE_CLIENT_KEY`, and optionally `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`. See [Network configuration](/docs/en/network-config#mtls-authentication)                      | `NODE_EXTRA_CA_CERTS`            |
| `grpc`                       | `OTEL_EXPORTER_OTLP_CLIENT_KEY` and `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`, or the per-signal variants such as `OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY` to use a different certificate per signal | `OTEL_EXPORTER_OTLP_CERTIFICATE` |

For `grpc`, the OpenTelemetry SDK reads the standard OTLP variables directly, so existing configurations that set the per-signal metrics variables continue to work.

### Metrics cardinality control

The following environment variables control which attributes are included in metrics to manage cardinality:

| Environment Variable                | Description                                                           | Default Value | Example to Disable |
| ----------------------------------- | --------------------------------------------------------------------- | ------------- | ------------------ |
| `OTEL_METRICS_INCLUDE_SESSION_ID`   | Include session.id attribute in metrics                               | `true`        | `false`            |
| `OTEL_METRICS_INCLUDE_VERSION`      | Include app.version attribute in metrics                              | `false`       | `true`             |
| `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` | Include user.account\_uuid and user.account\_id attributes in metrics | `true`        | `false`            |
| `OTEL_METRICS_INCLUDE_ENTRYPOINT`   | Include app.entrypoint attribute in metrics                           | `false`       | `true`             |

These variables help control the cardinality of metrics, which affects storage requirements and query performance in your metrics backend. Lower cardinality generally means better performance and lower storage costs but less granular data for analysis.

### Traces (beta)

Distributed tracing exports spans that link each user prompt to the API requests and tool executions it triggers, so you can view a full request as a single trace in your tracing backend.

Tracing is off by default. To enable it, set both `CLAUDE_CODE_ENABLE_TELEMETRY=1` and `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1`, then set `OTEL_TRACES_EXPORTER` to choose where spans are sent. Traces reuse the [common OTLP configuration](#common-configuration-variables) for endpoint, protocol, headers, and [mTLS](#mtls-authentication).

| Environment Variable                  | Description                                                                       | Example Values                       |
| ------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------ |
| `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA` | Enable span tracing (required). `ENABLE_ENHANCED_TELEMETRY_BETA` is also accepted | `1`                                  |
| `OTEL_TRACES_EXPORTER`                | Traces exporter types, comma-separated. Use `none` to disable                     | `console`, `otlp`, `none`            |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`  | Protocol for traces, overrides `OTEL_EXPORTER_OTLP_PROTOCOL`                      | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`  | OTLP traces endpoint, overrides `OTEL_EXPORTER_OTLP_ENDPOINT`                     | `http://localhost:4318/v1/traces`    |
| `OTEL_TRACES_EXPORT_INTERVAL`         | Span batch export interval in milliseconds (default: 5000)                        | `1000`, `10000`                      |

Spans redact user prompt text, tool input details, and tool content by default. Set `OTEL_LOG_USER_PROMPTS=1`, `OTEL_LOG_TOOL_DETAILS=1`, and `OTEL_LOG_TOOL_CONTENT=1` to include them.

When tracing is active, Bash and PowerShell subprocesses automatically inherit a `TRACEPARENT` environment variable containing the W3C trace context of the active tool execution span. This lets any subprocess that reads `TRACEPARENT` parent its own spans under the same trace, enabling end-to-end distributed tracing through scripts and commands that Claude runs.

When tracing is active and Claude Code is connected directly to the Anthropic API, each model request carries a W3C `traceparent` header set to the `claude_code.llm_request` span's context, and the API's `traceresponse` header is recorded as a span link. Together these connect Claude Code's client-side spans to the server-side trace through any compliant intermediary. Outbound HTTP MCP requests carry `traceparent` the same way. The header is not sent to third-party providers.

By default, the `traceparent` header on model and HTTP MCP requests is sent only when `ANTHROPIC_BASE_URL` is unset or points at the Anthropic API, since some proxies reject unrecognized headers. The subprocess `TRACEPARENT` variable is controlled by the same switch for consistency. If you run Claude Code through a custom `ANTHROPIC_BASE_URL` proxy and want trace context propagated, set `CLAUDE_CODE_PROPAGATE_TRACEPARENT=1`.

In Agent SDK and non-interactive sessions started with `-p`, Claude Code also reads `TRACEPARENT` and `TRACESTATE` from its own environment when starting each interaction span. This lets an embedding process pass its active W3C trace context into the subprocess so Claude Code's spans appear as children of the caller's distributed trace. Interactive sessions ignore inbound `TRACEPARENT` to avoid accidentally inheriting ambient values from CI or container environments.

#### Span hierarchy

Each user prompt starts a `claude_code.interaction` root span. API calls, tool calls, and hook executions are recorded as its children. Tool spans have two child spans of their own: one for the time spent waiting on a permission decision and one for the execution itself. When the Agent tool, or legacy Task tool, spawns a subagent, the subagent's API and tool spans nest under the parent's `claude_code.tool` span.

```text theme={null}
claude_code.interaction
├── claude_code.llm_request
├── claude_code.hook                    (requires detailed beta tracing)
└── claude_code.tool
    ├── claude_code.tool.blocked_on_user
    ├── claude_code.tool.execution
    └── (Agent tool) subagent claude_code.llm_request / claude_code.tool spans
```

In Agent SDK and `claude -p` sessions, `claude_code.interaction` itself becomes a child of the caller's span when `TRACEPARENT` is set in the environment.

#### Span attributes

Every span carries the [standard attributes](#standard-attributes) plus a `span.type` attribute matching its name. The tables below list the additional attributes set on each span. The `llm_request`, `tool.execution`, and `hook` spans set OpenTelemetry status `ERROR` when they record a failure; the other spans always end with status `UNSET`.

**`claude_code.interaction`**

| Attribute                 | Description                                               | Gated by                |
| ------------------------- | --------------------------------------------------------- | ----------------------- |
| `user_prompt`             | Prompt text. Value is `<REDACTED>` unless the gate is set | `OTEL_LOG_USER_PROMPTS` |
| `user_prompt_length`      | Prompt length in characters                               |                         |
| `interaction.sequence`    | 1-based counter of interactions in this session           |                         |
| `interaction.duration_ms` | Wall-clock duration of the turn                           |                         |

**`claude_code.llm_request`**

| Attribute                        | Description                                                                                                           | Gated by |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| `model`                          | Model identifier                                                                                                      |          |
| `gen_ai.system`                  | Always `anthropic`. OpenTelemetry GenAI semantic convention                                                           |          |
| `gen_ai.request.model`           | Same value as `model`. OpenTelemetry GenAI semantic convention                                                        |          |
| `query_source`                   | Subsystem that issued the request, such as `repl_main_thread` or a subagent name                                      |          |
| `agent_id`                       | Identifier of the subagent or teammate that issued the request. Absent on the main session                            |          |
| `parent_agent_id`                | Identifier of the agent that spawned this one. Absent for the main session and for agents spawned directly from it    |          |
| `speed`                          | `fast` or `normal`                                                                                                    |          |
| `llm_request.context`            | `interaction`, `tool`, or `standalone` depending on the parent span                                                   |          |
| `duration_ms`                    | Wall-clock duration including retries                                                                                 |          |
| `ttft_ms`                        | Time to first token in milliseconds                                                                                   |          |
| `input_tokens`                   | Input token count from the API usage block                                                                            |          |
| `output_tokens`                  | Output token count                                                                                                    |          |
| `cache_read_tokens`              | Tokens read from prompt cache                                                                                         |          |
| `cache_creation_tokens`          | Tokens written to prompt cache                                                                                        |          |
| `request_id`                     | Anthropic API request ID from the `request-id` response header                                                        |          |
| `gen_ai.response.id`             | Same value as `request_id`. OpenTelemetry GenAI semantic convention                                                   |          |
| `client_request_id`              | Client-generated `x-client-request-id` of the final attempt                                                           |          |
| `attempt`                        | Total attempts made for this request                                                                                  |          |
| `success`                        | `true` or `false`                                                                                                     |          |
| `status_code`                    | HTTP status code when the request failed                                                                              |          |
| `error`                          | Error message when the request failed                                                                                 |          |
| `response.has_tool_call`         | `true` when the response contained tool-use blocks                                                                    |          |
| `stop_reason`                    | API response `stop_reason`, such as `end_turn`, `tool_use`, `max_tokens`, `stop_sequence`, `pause_turn`, or `refusal` |          |
| `gen_ai.response.finish_reasons` | Same value as `stop_reason`, wrapped in a string array. OpenTelemetry GenAI semantic convention                       |          |

Each retry attempt is also recorded as a `gen_ai.request.attempt` span event with `attempt` and `client_request_id` attributes.

**`claude_code.tool`**

| Attribute         | Description                                                                                                        | Gated by                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| `tool_name`       | Tool name                                                                                                          |                         |
| `duration_ms`     | Wall-clock duration including permission wait and execution                                                        |                         |
| `result_tokens`   | Approximate token size of the tool result                                                                          |                         |
| `agent_id`        | Identifier of the subagent or teammate that ran the tool. Absent on the main session                               |                         |
| `parent_agent_id` | Identifier of the agent that spawned this one. Absent for the main session and for agents spawned directly from it |                         |
| `file_path`       | Target file path for Read, Edit, and Write tools                                                                   | `OTEL_LOG_TOOL_DETAILS` |
| `full_command`    | Command string for the Bash tool                                                                                   | `OTEL_LOG_TOOL_DETAILS` |
| `skill_name`      | Skill name for the Skill tool                                                                                      | `OTEL_LOG_TOOL_DETAILS` |
| `subagent_type`   | Subagent type for the Agent tool or legacy Task tool                                                               | `OTEL_LOG_TOOL_DETAILS` |

When `OTEL_LOG_TOOL_CONTENT=1`, this span also records a `tool.output` span event whose attributes contain the tool's input and output bodies, truncated at 60 KB per attribute.

**`claude_code.tool.blocked_on_user`**

| Attribute     | Description                                                               | Gated by |
| ------------- | ------------------------------------------------------------------------- | -------- |
| `duration_ms` | Time spent waiting for the permission decision                            |          |
| `decision`    | `accept` or `reject`                                                      |          |
| `source`      | Decision source, matching the [Tool decision event](#tool-decision-event) |          |

**`claude_code.tool.execution`**

| Attribute     | Description                                                                                                                                       | Gated by                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `duration_ms` | Time spent running the tool body                                                                                                                  |                         |
| `success`     | `true` or `false`                                                                                                                                 |                         |
| `error`       | Error category string when execution failed, such as `Error:ENOENT` or `ShellError`. Contains the full error message instead when the gate is set | `OTEL_LOG_TOOL_DETAILS` |

**`claude_code.hook`**

This span is emitted only when detailed beta tracing is active, which requires `ENABLE_BETA_TRACING_DETAILED=1` and `BETA_TRACING_ENDPOINT` in addition to the trace exporter configuration above. In interactive CLI sessions, this also requires your organization to be allowlisted for the feature. Agent SDK and non-interactive `-p` sessions are not gated. It is not emitted when only `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA` is set.

| Attribute                | Description                                      | Gated by                |
| ------------------------ | ------------------------------------------------ | ----------------------- |
| `hook_event`             | Hook event type, such as `PreToolUse`            |                         |
| `hook_name`              | Full hook name, such as `PreToolUse:Write`       |                         |
| `num_hooks`              | Number of matching hook commands executed        |                         |
| `hook_definitions`       | JSON-serialized hook configuration               | `OTEL_LOG_TOOL_DETAILS` |
| `duration_ms`            | Wall-clock duration of all matching hooks        |                         |
| `num_success`            | Count of hooks that completed successfully       |                         |
| `num_blocking`           | Count of hooks that returned a blocking decision |                         |
| `num_non_blocking_error` | Count of hooks that failed without blocking      |                         |
| `num_cancelled`          | Count of hooks cancelled before completion       |                         |

<Note>
  Additional content-bearing attributes such as `new_context`, `system_prompt_preview`, `user_system_prompt`, `tool_input`, and `response.model_output` are emitted only when detailed beta tracing is active. They are not part of the stable span schema. `user_system_prompt` additionally requires `OTEL_LOG_USER_PROMPTS=1`. It carries only the system prompt text you provide via the `systemPrompt` SDK option or `--system-prompt` and `--append-system-prompt` flags, truncated at 60 KB, and is emitted once per session rather than per request.
</Note>

### Dynamic headers

For enterprise environments that require dynamic authentication, you can configure a script to generate headers dynamically. Dynamic headers apply only to the `http/protobuf` and `http/json` protocols. The `grpc` exporter uses only the static `OTEL_EXPORTER_OTLP_HEADERS` value.

#### Settings configuration

Add to your `.claude/settings.json`:

```json theme={null}
{
  "otelHeadersHelper": "/bin/generate_opentelemetry_headers.sh"
}
```

The value can be the path to an executable file, including a path that contains spaces, or a shell command line with arguments. On Windows, the value always runs through the shell, so quote a path that contains spaces inside the JSON value.

#### Script requirements

The script must output valid JSON with string key-value pairs representing HTTP headers:

```bash theme={null}
#!/bin/bash
# Example: Multiple headers
echo "{\"Authorization\": \"Bearer $(get-token.sh)\", \"X-API-Key\": \"$(get-api-key.sh)\"}"
```

If the helper fails or prints output that doesn't meet these requirements, Claude Code reports the error in:

* `/doctor` output
* The debug log, when running with [`--debug`](/docs/en/cli-reference#cli-flags) or after running `/debug` in the session
* stderr, in non-interactive sessions started with `-p`

#### Refresh behavior

The headers helper script runs at startup and periodically thereafter to support token refresh. By default, the script runs every 29 minutes. Customize the interval with the `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS` environment variable.

### Multi-team organization support

Organizations with multiple teams or departments can add custom attributes to distinguish between different groups using the `OTEL_RESOURCE_ATTRIBUTES` environment variable:

```bash theme={null}
# Add custom attributes for team identification
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=platform,cost_center=eng-123"
```

These custom attributes will be included in all metrics and events, allowing you to:

* Filter metrics by team or department
* Track costs per cost center
* Create team-specific dashboards
* Set up alerts for specific teams

<Warning>
  **Important formatting requirements for OTEL\_RESOURCE\_ATTRIBUTES:**

  The `OTEL_RESOURCE_ATTRIBUTES` environment variable uses comma-separated key=value pairs with strict formatting requirements:

  * **No spaces allowed**: Values cannot contain spaces. For example, `user.organizationName=My Company` is invalid
  * **Format**: Must be comma-separated key=value pairs: `key1=value1,key2=value2`
  * **Allowed characters**: Only US-ASCII characters excluding control characters, whitespace, double quotes, commas, semicolons, and backslashes
  * **Special characters**: Characters outside the allowed range must be percent-encoded

  **Examples:**

  ```bash theme={null}
  # ❌ Invalid - contains spaces
  export OTEL_RESOURCE_ATTRIBUTES="org.name=John's Organization"

  # ✅ Valid - use underscores or camelCase instead
  export OTEL_RESOURCE_ATTRIBUTES="org.name=Johns_Organization"
  export OTEL_RESOURCE_ATTRIBUTES="org.name=JohnsOrganization"

  # ✅ Valid - percent-encode special characters if needed
  export OTEL_RESOURCE_ATTRIBUTES="org.name=John%27s%20Organization"
  ```

  Note: wrapping values in quotes doesn't escape spaces. For example, `org.name="My Company"` results in the literal value `"My Company"` (with quotes included), not `My Company`.
</Warning>

### Example configurations

Set these environment variables before running `claude`. Each block shows a complete configuration for a different exporter or deployment scenario:

```bash theme={null}
# Console debugging (1-second intervals)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=1000

# OTLP/gRPC
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Prometheus
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=prometheus

# Multiple exporters
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console,otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json

# Different endpoints/backends for metrics and logs
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://metrics.example.com:4318
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://logs.example.com:4317

# Metrics only (no events/logs)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Events/logs only (no metrics)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

## Available metrics and events

### Standard attributes

All metrics and events share these standard attributes:

| Attribute           | Description                                                                                                 | Controlled By                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `session.id`        | Unique session identifier                                                                                   | `OTEL_METRICS_INCLUDE_SESSION_ID` (default: true)   |
| `app.version`       | Current Claude Code version                                                                                 | `OTEL_METRICS_INCLUDE_VERSION` (default: false)     |
| `app.entrypoint`    | How the session was launched, such as `cli`, `sdk-cli`, `sdk-ts`, `sdk-py`, or `claude-vscode`              | `OTEL_METRICS_INCLUDE_ENTRYPOINT` (default: false)  |
| `organization.id`   | Organization UUID (when authenticated)                                                                      | Always included when available                      |
| `user.account_uuid` | Account UUID (when authenticated)                                                                           | `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` (default: true) |
| `user.account_id`   | Account ID in tagged format matching Anthropic admin APIs (when authenticated), such as `user_01BWBeN28...` | `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` (default: true) |
| `user.id`           | Anonymous device/installation identifier, generated per Claude Code installation                            | Always included                                     |
| `user.email`        | User email address (when authenticated via OAuth)                                                           | Always included when available                      |
| `terminal.type`     | Terminal type, such as `iTerm.app`, `vscode`, `cursor`, or `tmux`                                           | Always included when detected                       |

Events additionally include the following attributes. These are never attached to metrics because they would cause unbounded cardinality:

* `prompt.id`: UUID correlating a user prompt with all subsequent events until the next prompt. See [Event correlation attributes](#event-correlation-attributes).
* `workspace.host_paths`: host workspace directories selected in the desktop app, as a string array

### Metrics

Claude Code exports the following metrics:

| Metric Name                           | Description                                     | Unit   |
| ------------------------------------- | ----------------------------------------------- | ------ |
| `claude_code.session.count`           | Count of CLI sessions started                   | count  |
| `claude_code.lines_of_code.count`     | Count of lines of code modified                 | count  |
| `claude_code.pull_request.count`      | Number of pull requests created                 | count  |
| `claude_code.commit.count`            | Number of git commits created                   | count  |
| `claude_code.cost.usage`              | Cost of the Claude Code session                 | USD    |
| `claude_code.token.usage`             | Number of tokens used                           | tokens |
| `claude_code.code_edit_tool.decision` | Count of code editing tool permission decisions | count  |
| `claude_code.active_time.total`       | Total active time in seconds                    | s      |

### Metric details

Each metric includes the standard attributes listed above. Metrics with additional context-specific attributes are noted below.

#### Session counter

Incremented at the start of each session.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `start_type`: How the session was started. One of `"fresh"`, `"resume"`, or `"continue"`

#### Lines of code counter

Incremented when code is added or removed.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `type`: (`"added"`, `"removed"`)

#### Pull request counter

Incremented when Claude Code creates a pull request or merge request through a shell command or an MCP tool.

**Attributes**:

* All [standard attributes](#standard-attributes)

#### Commit counter

Incremented when creating git commits via Claude Code.

**Attributes**:

* All [standard attributes](#standard-attributes)

#### Cost counter

Incremented after each API request.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `model`: Model identifier (for example, "claude-sonnet-4-6")
* `query_source`: Category of the subsystem that issued the request. One of `"main"`, `"subagent"`, or `"auxiliary"`
* `speed`: `"fast"` when the request used fast mode. Absent otherwise
* `effort`: [Effort level](/docs/en/model-config#adjust-effort-level) applied to the request: `"low"`, `"medium"`, `"high"`, `"xhigh"`, or `"max"`. Absent when the model does not support effort.
* `agent.name`: Subagent type that issued the request. Built-in agent names and agents from official-marketplace plugins appear verbatim. Other user-defined agent names are replaced with `"custom"`. Absent when the request was not issued by a named subagent type.
* `skill.name`: Skill active for the request, set by the Skill tool, a `/` command, or inherited by a spawned subagent. Built-in, bundled, user-defined, and official-marketplace plugin skill names appear verbatim. Third-party plugin skill names are replaced with `"third-party"`. Absent when no skill is active.
* `plugin.name`: Owning plugin when the active skill or subagent is provided by a plugin. Official-marketplace plugin names appear verbatim. Third-party plugin names are replaced with `"third-party"`. Absent when neither the skill nor the subagent has an owning plugin.
* `marketplace.name`: Marketplace the owning plugin was installed from. Only emitted for official-marketplace plugins. Absent otherwise.
* `mcp_server.name`: MCP server whose tool ran in the turn that produced this request. Built-in, claude.ai-proxied, and official-registry server names appear verbatim. User-configured server names are replaced with `"custom"`. Absent when no MCP tool ran.
* `mcp_tool.name`: MCP tool that ran in the turn that produced this request, with the same redaction as `mcp_server.name`. Absent when no MCP tool ran.

#### Token counter

Incremented after each API request.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `type`: (`"input"`, `"output"`, `"cacheRead"`, `"cacheCreation"`)
* `model`: Model identifier (for example, "claude-sonnet-4-6")
* `query_source`: Category of the subsystem that issued the request. One of `"main"`, `"subagent"`, or `"auxiliary"`
* `speed`: `"fast"` when the request used fast mode. Absent otherwise
* `effort`: [Effort level](/docs/en/model-config#adjust-effort-level) applied to the request. See [Cost counter](#cost-counter) for details.
* `agent.name`, `skill.name`, `plugin.name`, `marketplace.name`, `mcp_server.name`, `mcp_tool.name`: Skill, plugin, agent, and MCP attribution for the request. See [Cost counter](#cost-counter) for definitions and redaction behavior.

#### Code edit tool decision counter

Incremented when user accepts or rejects Edit, Write, or NotebookEdit tool usage.

**Attributes**:

* All [standard attributes](#standard-attributes)
* `tool_name`: Tool name (`"Edit"`, `"Write"`, `"NotebookEdit"`)
* `decision`: User decision (`"accept"`, `"reject"`)
* `source`: Where the decision came from. One of `"config"`, `"hook"`, `"user_permanent"`, `"user_temporary"`, `"user_abort"`, or `"user_reject"`. See the [Tool decision event](#tool-decision-event) for what each value means.
* `language`: Programming language of the edited file, such as `"TypeScript"`, `"Python"`, `"JavaScript"`, or `"Markdown"`. Returns `"unknown"` for unrecognized file extensions.

#### Active time counter

Tracks actual time spent actively using Claude Code, excluding idle time. This metric is incremented during user interactions (typing, reading responses) and during CLI processing (tool execution, AI response generation).

**Attributes**:

* All [standard attributes](#standard-attributes)
* `type`: `"user"` for keyboard interactions, `"cli"` for tool execution and AI responses

### Events

Claude Code exports the following events via OpenTelemetry logs/events (when `OTEL_LOGS_EXPORTER` is configured):

#### Event correlation attributes

When a user submits a prompt, Claude Code may make multiple API calls and run several tools. The `prompt.id` attribute lets you tie all of those events back to the single prompt that triggered them.

| Attribute   | Description                                                                          |
| ----------- | ------------------------------------------------------------------------------------ |
| `prompt.id` | UUID v4 identifier linking all events produced while processing a single user prompt |

To trace all activity triggered by a single prompt, filter your events by a specific `prompt.id` value. This returns the user\_prompt event, any api\_request events, and any tool\_result events that occurred while processing that prompt.

<Note>
  `prompt.id` is intentionally excluded from metrics because each prompt generates a unique ID, which would create an ever-growing number of time series. Use it for event-level analysis and audit trails only.
</Note>

#### User prompt event

Logged when a user submits a prompt.

**Event Name**: `claude_code.user_prompt`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"user_prompt"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `prompt_length`: Length of the prompt
* `prompt`: Prompt content (redacted by default, enable with `OTEL_LOG_USER_PROMPTS=1`)
* `command_name`: Command name when the prompt invokes one. Built-in and bundled command names such as `compact` or `debug` are emitted as-is; aliases such as `reset` emit as typed rather than the canonical name. Custom, plugin, and MCP command names collapse to `custom` or `mcp` unless `OTEL_LOG_TOOL_DETAILS=1` is set
* `command_source`: Origin of the command when present: `builtin`, `custom`, or `mcp`. Plugin-provided commands report as `custom`

#### Tool result event

Logged when a tool completes execution. Not emitted if the tool call was rejected; see the [Tool decision event](#tool-decision-event) for rejections.

**Event Name**: `claude_code.tool_result`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"tool_result"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `tool_name`: Name of the tool
* `tool_use_id`: Unique identifier for this tool invocation. Matches the `tool_use_id` passed to hooks, allowing correlation between OTel events and hook-captured data.
* `success`: `"true"` or `"false"`
* `duration_ms`: Execution time in milliseconds
* `error_type`: Error category string when the tool failed, such as `"Error:ENOENT"` or `"ShellError"`
* `error` (when `OTEL_LOG_TOOL_DETAILS=1`): Full error message when the tool failed
* `decision_type`: Always `"accept"`, since this event is only emitted after the tool runs (rejected calls don't produce a tool result)
* `decision_source`: Where the permission decision came from. One of `"config"`, `"hook"`, `"user_permanent"`, or `"user_temporary"`. See the [Tool decision event](#tool-decision-event) for what each value means. The reject-only sources `"user_abort"` and `"user_reject"` never appear on this event.
* `tool_input_size_bytes`: Size of the JSON-serialized tool input in bytes
* `tool_result_size_bytes`: Size of the tool result in bytes
* `mcp_server_scope`: MCP server scope identifier (for MCP tools)
* `tool_parameters` (when `OTEL_LOG_TOOL_DETAILS=1`): JSON string containing tool-specific parameters:
  * For Bash tool: includes `bash_command`, `full_command`, `timeout`, `description`, `dangerouslyDisableSandbox`, and `git_commit_id` (the commit SHA, when a `git commit` command succeeds)
  * For WorkspaceBash tool: includes `bash_command`, `full_command`, `timeout`
  * For MCP tools: includes `mcp_server_name`, `mcp_tool_name`
  * For Skill tool: includes `skill_name`
  * For Agent tool or legacy Task tool: includes `subagent_type`
* `tool_input` (when `OTEL_LOG_TOOL_DETAILS=1`): JSON-serialized tool arguments. Individual values over 512 characters are truncated, and the full payload is bounded to \~4 K characters. Applies to all tools including MCP tools.

#### API request event

Logged for each API request to Claude.

**Event Name**: `claude_code.api_request`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_request"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `model`: Model used (for example, "claude-sonnet-4-6")
* `cost_usd`: Estimated cost in USD
* `duration_ms`: Request duration in milliseconds
* `input_tokens`: Number of input tokens
* `output_tokens`: Number of output tokens
* `cache_read_tokens`: Number of tokens read from cache
* `cache_creation_tokens`: Number of tokens used for cache creation
* `request_id`: Anthropic API request ID from the response's `request-id` header, such as `"req_011..."`. Present only when the API returns one.
* `speed`: `"fast"` or `"normal"`, indicating whether fast mode was active
* `query_source`: Subsystem that issued the request, such as `"repl_main_thread"`, `"compact"`, or a subagent name
* `effort`: [Effort level](/docs/en/model-config#adjust-effort-level) applied to the request: `"low"`, `"medium"`, `"high"`, `"xhigh"`, or `"max"`. Absent when the model does not support effort.
* `agent.name`, `skill.name`, `plugin.name`, `marketplace.name`, `mcp_server.name`, `mcp_tool.name`: Skill, plugin, agent, and MCP attribution for the request. See [Cost counter](#cost-counter) for definitions and redaction behavior.

#### API error event

Logged when an API request to Claude fails.

**Event Name**: `claude_code.api_error`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_error"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `model`: Model used (for example, "claude-sonnet-4-6")
* `error`: Error message
* `status_code`: HTTP status code as a number. Absent for non-HTTP errors such as connection failures.
* `duration_ms`: Request duration in milliseconds
* `attempt`: Total number of attempts made, including the initial request (`1` means no retries occurred)
* `request_id`: Anthropic API request ID from the response's `request-id` header, such as `"req_011..."`. Present only when the API returns one.
* `speed`: `"fast"` or `"normal"`, indicating whether fast mode was active
* `query_source`: Subsystem that issued the request, such as `"repl_main_thread"`, `"compact"`, or a subagent name
* `effort`: [Effort level](/docs/en/model-config#adjust-effort-level) applied to the request. Absent when the model does not support effort.
* `agent.name`, `skill.name`, `plugin.name`, `marketplace.name`, `mcp_server.name`, `mcp_tool.name`: Skill, plugin, agent, and MCP attribution for the request. See [Cost counter](#cost-counter) for definitions and redaction behavior.

#### API request body event

Logged for each API request attempt when `OTEL_LOG_RAW_API_BODIES` is set. One event is emitted per attempt, so retries with adjusted parameters each produce their own event.

**Event Name**: `claude_code.api_request_body`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_request_body"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `body`: JSON-serialized Messages API request parameters (system prompt, messages, tools, etc.), truncated at 60 KB. Extended-thinking content in prior assistant turns is redacted. Emitted only in inline mode (`OTEL_LOG_RAW_API_BODIES=1`).
* `body_ref`: Absolute path to a `<dir>/<uuid>.request.json` file containing the untruncated body. Emitted only in file mode (`OTEL_LOG_RAW_API_BODIES=file:<dir>`).
* `body_length`: Untruncated body length. UTF-8 bytes when `OTEL_LOG_RAW_API_BODIES=file:<dir>`, or UTF-16 code units when `=1`
* `body_truncated`: `"true"` when inline truncation occurred. Absent in file mode and when no truncation occurred.
* `model`: Model identifier from the request parameters
* `query_source`: Subsystem that issued the request (for example, `"compact"`)

#### API response body event

Logged for each successful API response when `OTEL_LOG_RAW_API_BODIES` is set.

**Event Name**: `claude_code.api_response_body`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_response_body"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `body`: JSON-serialized Messages API response (id, content blocks, usage, stop reason), truncated at 60 KB. Extended-thinking content is redacted. Emitted only in inline mode (`OTEL_LOG_RAW_API_BODIES=1`).
* `body_ref`: Absolute path to a `<dir>/<request_id>.response.json` file containing the untruncated body. Emitted only in file mode (`OTEL_LOG_RAW_API_BODIES=file:<dir>`).
* `body_length`: Untruncated body length. UTF-8 bytes when `OTEL_LOG_RAW_API_BODIES=file:<dir>`, or UTF-16 code units when `=1`
* `body_truncated`: `"true"` when inline truncation occurred. Absent in file mode and when no truncation occurred.
* `model`: Model identifier
* `query_source`: Subsystem that issued the request
* `request_id`: Anthropic API request ID from the response's `request-id` header, such as `"req_011..."`. Present only when the API returns one.

#### Tool decision event

Logged when a tool permission decision is made (accept/reject).

**Event Name**: `claude_code.tool_decision`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"tool_decision"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `tool_name`: Name of the tool (for example, "Read", "Edit", "Write", "NotebookEdit")
* `tool_use_id`: Unique identifier for this tool invocation. Matches the `tool_use_id` passed to hooks, allowing correlation between OTel events and hook-captured data.
* `decision`: Either `"accept"` or `"reject"`
* `source`: Where the decision came from:
  * `"config"`: Decided automatically without prompting, based on project settings, allow or deny rules in the user's personal settings, enterprise managed policy, `--allowedTools` or `--disallowedTools` flags, the active permission mode, a session-scoped grant from an earlier prompt in the same interactive CLI session, or because the tool is inherently safe. The event does not indicate which of these sources matched.
  * `"hook"`: A `PreToolUse` or `PermissionRequest` hook returned the decision.
  * `"user_permanent"`: Emitted when the user chose "Yes, and don't ask again for ..." at a permission prompt, which saves an allow rule to their personal settings. In the interactive CLI this is emitted only for that choice itself; later calls that match the saved rule emit `"config"` instead. In Agent SDK or non-interactive `-p` sessions, both the initial choice and later rule matches emit `"user_permanent"`. Treated as an accept.
  * `"user_temporary"`: Emitted when the user chose "Yes" at a permission prompt for a one-time approval, or chose one of the "... during this session" options on a file edit or read prompt. In the interactive CLI this is emitted only for the choice itself; later calls allowed by that session-scoped grant emit `"config"` instead. In Agent SDK or non-interactive `-p` sessions, both the choice and later matches emit `"user_temporary"`. Treated as an accept.
  * `"user_abort"`: Emitted when the user dismissed the permission prompt without answering. Treated as a reject.
  * `"user_reject"`: Emitted when the user chose "No" when prompted. In the interactive CLI this is emitted only for that choice itself; calls that match a deny rule in the user's personal settings emit `"config"` instead. In Agent SDK or non-interactive `-p` sessions, calls that match a deny rule in personal settings emit `"user_reject"`. Treated as a reject.
* `tool_parameters` (when `OTEL_LOG_TOOL_DETAILS=1`): JSON string containing tool-specific parameters. Same shape as the [Tool result event](#tool-result-event), minus post-execution fields such as `git_commit_id`. Values may differ from `tool_result` for an accepted call if the permission decision rewrites the tool input via `updatedInput`. Use this attribute to see which command was rejected when `decision` is `"reject"`.
  * For Bash tool: includes `bash_command`, `full_command`, `timeout`, `description`, `dangerouslyDisableSandbox`
  * For WorkspaceBash tool: includes `bash_command`, `full_command`, `timeout`
  * For MCP tools: includes `mcp_server_name`, `mcp_tool_name`
  * For Skill tool: includes `skill_name`
  * For Agent tool or legacy Task tool: includes `subagent_type`

#### Permission mode changed event

Logged when the permission mode changes, for example from `Shift+Tab` cycling, exiting plan mode, or an auto mode gate check.

**Event Name**: `claude_code.permission_mode_changed`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"permission_mode_changed"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `from_mode`: The previous permission mode, for example `"default"`, `"plan"`, `"acceptEdits"`, `"auto"`, or `"bypassPermissions"`
* `to_mode`: The new permission mode
* `trigger`: What caused the change. One of `"shift_tab"`, `"exit_plan_mode"`, `"auto_gate_denied"`, or `"auto_opt_in"`. Absent when the transition originates from the SDK or bridge

#### Auth event

Logged when `/login` or `/logout` completes.

**Event Name**: `claude_code.auth`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"auth"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `action`: `"login"` or `"logout"`
* `success`: `"true"` or `"false"`
* `auth_method`: Authentication method, such as `"oauth"`
* `error_category`: Categorical error kind when the action failed. The raw error message is never included
* `status_code`: HTTP status code as a string when the action failed with an HTTP error

#### MCP server connection event

Logged when an MCP server connects, disconnects, or fails to connect.

**Event Name**: `claude_code.mcp_server_connection`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"mcp_server_connection"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `status`: `"connected"`, `"failed"`, or `"disconnected"`
* `transport_type`: Server transport, such as `"stdio"`, `"sse"`, or `"http"`
* `server_scope`: Scope the server is configured at, such as `"user"`, `"project"`, or `"local"`
* `duration_ms`: Connection attempt duration in milliseconds
* `error_code`: Error code when the connection failed
* `server_name` (when `OTEL_LOG_TOOL_DETAILS=1`): Configured server name
* `error` (when `OTEL_LOG_TOOL_DETAILS=1`): Full error message when the connection failed

#### Internal error event

Logged when Claude Code catches an unexpected internal error. Only the error class name and an errno-style code are recorded. The error message and stack trace are never included. This event is not emitted when running against Bedrock, Vertex, or Foundry, or when `DISABLE_ERROR_REPORTING` is set.

**Event Name**: `claude_code.internal_error`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"internal_error"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `error_name`: Error class name, such as `"TypeError"` or `"SyntaxError"`
* `error_code`: Node.js errno code such as `"ENOENT"` when present on the error

#### Plugin installed event

Logged when a plugin finishes installing, from both the `claude plugin install` CLI command and the interactive `/plugin` UI.

**Event Name**: `claude_code.plugin_installed`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"plugin_installed"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `marketplace.is_official`: `"true"` if the marketplace is an official Anthropic marketplace, `"false"` otherwise
* `install.trigger`: `"cli"` or `"ui"`
* `plugin.name`: Name of the installed plugin. For third-party marketplaces this is included only when `OTEL_LOG_TOOL_DETAILS=1`
* `plugin.version`: Plugin version when declared in the marketplace entry. For third-party marketplaces this is included only when `OTEL_LOG_TOOL_DETAILS=1`
* `marketplace.name`: Marketplace the plugin was installed from. For third-party marketplaces this is included only when `OTEL_LOG_TOOL_DETAILS=1`

#### Plugin loaded event

Logged once per enabled plugin at session start. Use this event to inventory which plugins are active across your fleet, as a complement to `plugin_installed` which records the install action itself.

**Event Name**: `claude_code.plugin_loaded`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"plugin_loaded"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `plugin.name`: name of the plugin. For plugins outside the official marketplace and built-in bundle the value is `"third-party"` unless `OTEL_LOG_TOOL_DETAILS=1`
* `marketplace.name`: marketplace the plugin was installed from, when known. Redacted to `"third-party"` under the same condition as `plugin.name`
* `plugin.version`: version from the plugin manifest. Included only when the name is not redacted and the manifest declares a version
* `plugin.scope`: provenance category for the plugin: `"official"`, `"org"`, `"user-local"`, or `"default-bundle"`
* `enabled_via`: how the plugin came to be enabled: `"default-enable"`, `"org-policy"`, `"seed-mount"`, or `"user-install"`
* `plugin_id_hash`: deterministic hash of the plugin name and marketplace, sent only to your configured exporter. Lets you count how many distinct third-party plugins are loaded across your fleet without recording their names
* `has_hooks`: whether the plugin contributes hooks
* `has_mcp`: whether the plugin contributes MCP servers
* `skill_path_count`: number of skill directories the plugin declares
* `command_path_count`: number of command directories the plugin declares
* `agent_path_count`: number of agent directories the plugin declares

#### Skill activated event

Logged when a skill is invoked, whether Claude calls it through the Skill tool or you run it as a `/` command.

**Event Name**: `claude_code.skill_activated`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"skill_activated"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `skill.name`: Name of the skill. For user-defined and third-party plugin skills the value is the placeholder `"custom_skill"` unless `OTEL_LOG_TOOL_DETAILS=1`
* `invocation_trigger`: How the skill was triggered (`"user-slash"`, `"claude-proactive"`, or `"nested-skill"`)
* `skill.source`: Where the skill was loaded from (for example, `"bundled"`, `"userSettings"`, `"projectSettings"`, `"plugin"`)
* `plugin.name` (when `OTEL_LOG_TOOL_DETAILS=1` or the plugin is from an official marketplace): Name of the owning plugin when the skill is provided by a plugin
* `marketplace.name` (when `OTEL_LOG_TOOL_DETAILS=1` or the plugin is from an official marketplace): Marketplace the owning plugin was installed from, when the skill is provided by a plugin

#### At mention event

Logged when Claude Code resolves an `@`-mention in a prompt. Not every mention emits an event: early-exit paths such as permission denials, oversized files, PDF reference attachments, and directory listing failures return without logging.

**Event Name**: `claude_code.at_mention`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"at_mention"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `mention_type`: Type of mention (`"file"`, `"directory"`, `"agent"`, `"mcp_resource"`)
* `success`: Whether the mention resolved successfully (`"true"` or `"false"`)

#### API retries exhausted event

Logged once when an API request fails after more than one attempt. Emitted alongside the final `api_error` event.

**Event Name**: `claude_code.api_retries_exhausted`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"api_retries_exhausted"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `model`: Model used
* `error`: Final error message
* `status_code`: HTTP status code as a number. Absent for non-HTTP errors.
* `total_attempts`: Total number of attempts made
* `total_retry_duration_ms`: Total wall-clock time across all attempts
* `speed`: `"fast"` or `"normal"`

#### Hook registered event

Logged once per configured hook at session start. Use this event to inventory which hooks are active across your fleet, as a complement to the per-execution `hook_execution_start` and `hook_execution_complete` events.

**Event Name**: `claude_code.hook_registered`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"hook_registered"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `hook_event`: hook event type, such as `"PreToolUse"` or `"PostToolUse"`
* `hook_type`: hook implementation type: `"command"`, `"prompt"`, `"mcp_tool"`, `"http"`, or `"agent"`
* `hook_source`: where the hook is defined: `"userSettings"`, `"projectSettings"`, `"localSettings"`, `"flagSettings"`, `"policySettings"`, or `"pluginHook"`
* `hook_matcher` (when `OTEL_LOG_TOOL_DETAILS=1`): the matcher string from the hook configuration, when one is set
* `plugin.name` (when `hook_source` is `"pluginHook"`): name of the contributing plugin. For plugins outside the official marketplace and built-in bundle the value is `"third-party"` unless `OTEL_LOG_TOOL_DETAILS=1`
* `plugin_id_hash` (when `hook_source` is `"pluginHook"`): deterministic hash of the plugin name and marketplace, sent only to your configured exporter. Lets you count distinct contributing plugins without recording their names

#### Hook execution start event

Logged when one or more hooks begin executing for a hook event.

**Event Name**: `claude_code.hook_execution_start`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"hook_execution_start"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `hook_event`: Hook event type, such as `"PreToolUse"` or `"PostToolUse"`
* `hook_name`: Full hook name including matcher, such as `"PreToolUse:Write"`
* `num_hooks`: Number of matching hook commands
* `managed_only`: `"true"` when only managed-policy hooks are permitted
* `hook_source`: `"policySettings"` or `"merged"`
* `hook_definitions`: JSON-serialized hook configuration. Included only when both detailed beta tracing and `OTEL_LOG_TOOL_DETAILS=1` are enabled

#### Hook execution complete event

Logged when all hooks for a hook event have finished.

**Event Name**: `claude_code.hook_execution_complete`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"hook_execution_complete"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `hook_event`: Hook event type
* `hook_name`: Full hook name including matcher
* `num_hooks`: Number of matching hook commands
* `num_success`: Count that completed successfully
* `num_blocking`: Count that returned a blocking decision
* `num_non_blocking_error`: Count that failed without blocking
* `num_cancelled`: Count cancelled before completion
* `total_duration_ms`: Wall-clock duration of all matching hooks
* `managed_only`: `"true"` when only managed-policy hooks are permitted
* `hook_source`: `"policySettings"` or `"merged"`
* `hook_definitions`: JSON-serialized hook configuration. Included only when both detailed beta tracing and `OTEL_LOG_TOOL_DETAILS=1` are enabled

#### Hook plugin metrics event

Logged when an official-marketplace plugin hook emits per-invocation metrics. Only plugins installed from an official Anthropic marketplace can emit these. Third-party marketplace plugins and user-configured hooks do not emit to this event. Use this event to monitor plugin behavior such as finding rates, costs, and durations from your own observability stack.

**Event Name**: `claude_code.hook_plugin_metrics`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"hook_plugin_metrics"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `plugin_id`: plugin identifier in `<name>@<marketplace>` form
* `hook_event`: hook event type that emitted the metrics
* Up to 20 plugin-emitted metric keys. Names match `^[a-z][a-z0-9_]{0,39}$`. Values are boolean or number.

#### Compaction event

Logged when conversation compaction completes.

**Event Name**: `claude_code.compaction`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"compaction"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `trigger`: `"auto"` or `"manual"`
* `success`: `"true"` or `"false"`
* `duration_ms`: Compaction duration
* `pre_tokens`: Approximate token count before compaction
* `post_tokens`: Approximate token count after compaction
* `error`: Error message when compaction failed
* `precompute_reuse`: Only set when `trigger` is `"manual"`. Auto-compaction can prepare a summary in the background before the context window fills, and this attribute records whether `/compact` reused that prepared summary. `"hit"` means it was reused; `"miss_custom_instructions"`, `"miss_hook"`, and `"miss_not_ready"` give the reason a fresh summary was computed instead. Requires Claude Code v2.1.153 or later

#### Feedback survey event

Logged when a session quality survey is shown or answered. See [Session quality surveys](/docs/en/data-usage#session-quality-surveys) for what the surveys collect and how to control them.

**Event Name**: `claude_code.feedback_survey`

**Attributes**:

* All [standard attributes](#standard-attributes)
* `event.name`: `"feedback_survey"`
* `event.timestamp`: ISO 8601 timestamp
* `event.sequence`: monotonically increasing counter for ordering events within a session
* `event_type`: Survey lifecycle event, for example `"appeared"`, `"responded"`, or `"transcript_prompt_appeared"`
* `appearance_id`: Unique ID linking the events emitted for one survey instance
* `survey_type`: Which survey produced the event. `"session"` is the "How is Claude doing?" rating prompt
* `response`: The user's selection on `responded` events
* `enabled_via_override`: `true` when [`CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL`](/docs/en/env-vars) is set. Emitted as a boolean, not a string. Present on `session` survey events. Filter on this attribute to confirm the override is applied across a fleet

## Interpret metrics and events data

The exported metrics and events support a range of analyses:

### Usage monitoring

| Metric                                                        | Analysis Opportunity                                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `claude_code.token.usage`                                     | Break down by `type` (input/output), user, team, model, `skill.name`, `plugin.name`, or `agent.name` |
| `claude_code.session.count`                                   | Track adoption and engagement over time                                                              |
| `claude_code.lines_of_code.count`                             | Measure productivity by tracking code additions/removals                                             |
| `claude_code.commit.count` & `claude_code.pull_request.count` | Understand impact on development workflows                                                           |

### Cost monitoring

The `claude_code.cost.usage` metric helps with:

* Tracking usage trends across teams or individuals
* Identifying high-usage sessions for optimization
* Attributing spend to specific skills, plugins, or subagent types via the `skill.name`, `plugin.name`, and `agent.name` attributes

<Note>
  Cost metrics are approximations. For official billing data, refer to your API provider (Claude Console, Amazon Bedrock, or Google Cloud Vertex).
</Note>

### Alerting and segmentation

Common alerts to consider:

* Cost spikes
* Unusual token consumption
* High session volume from specific users

All metrics can be segmented by `user.account_uuid`, `user.account_id`, `organization.id`, `session.id`, `model`, and `app.version`.

### Detect retry exhaustion

Claude Code retries failed API requests internally and emits a single `claude_code.api_error` event only after it gives up, so the event itself is the terminal signal for that request. Intermediate retry attempts are not logged as separate events.

The `attempt` attribute on the event records how many attempts were made in total. A value greater than `CLAUDE_CODE_MAX_RETRIES` (default `10`) indicates the request exhausted all retries on a transient error. A lower value indicates a non-retryable error such as a `400` response.

To distinguish a session that recovered from one that stalled, group events by `session.id` and check whether a later `api_request` event exists after the error.

### Event analysis

The event data provides detailed insights into Claude Code interactions:

**Tool Usage Patterns**: analyze tool result events to identify:

* Most frequently used tools
* Tool success rates
* Average tool execution times
* Error patterns by tool type

**Performance Monitoring**: track API request durations and tool execution times to identify performance bottlenecks.

## Audit security events

OpenTelemetry events are the audit data source for Claude Code activity. Every event carries identity attributes that tie tool calls, MCP activity, and permission decisions back to the user who triggered them, and the OTLP logs exporter can deliver these events to any Security Information and Event Management (SIEM) platform with an OTLP receiver or to an OpenTelemetry Collector that forwards to your SIEM.

### Attribute actions to users

The [standard attributes](#standard-attributes) on each event include the authenticated user's identity: `user.email`, `user.account_uuid`, `user.account_id`, and `organization.id` when signed in with a Claude account, plus the installation-scoped `user.id` and the per-session `session.id`.

MCP tool calls, Bash commands, and file edits are therefore attributed to the developer who started the session. Claude Code does not act under a separate service account; the identity recorded on each event is the developer's own Claude account.

When Claude Code authenticates with a direct API key, or against Bedrock, Vertex AI, or Microsoft Foundry, there is no Claude account in the session and only `user.id` and `session.id` are populated. In these deployments, attach user identity yourself with `OTEL_RESOURCE_ATTRIBUTES`, set per user through the [managed settings](#administrator-configuration) file or a launch wrapper:

```bash theme={null}
export OTEL_RESOURCE_ATTRIBUTES="enduser.id=jdoe@example.com,enduser.directory_id=S-1-5-21-..."
```

### Audit MCP activity

To capture MCP server activity with full call detail, enable the logs exporter and set `OTEL_LOG_TOOL_DETAILS=1`. Each MCP operation then produces structured events that carry the server name, tool name, and call arguments alongside the standard identity attributes:

| Event                   | What it records for MCP                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp_server_connection` | Server connect, disconnect, and connection failure with `server_name`, `transport_type`, `server_scope`, and error detail                                                                          |
| `tool_result`           | Each MCP tool call with `tool_name` and `mcp_server_scope`, a `tool_parameters` payload containing `mcp_server_name` and `mcp_tool_name`, and a `tool_input` payload containing the call arguments |
| `tool_decision`         | Whether the call was allowed or denied, whether the decision came from config, a hook, or the user, and a `tool_parameters` payload containing `mcp_server_name` and `mcp_tool_name`               |

Without `OTEL_LOG_TOOL_DETAILS`, these events drop the identifying detail:

* `tool_result`: keeps `tool_name` and `mcp_server_scope`, omits `mcp_server_name`, `mcp_tool_name`, and arguments
* `tool_decision`: keeps `tool_name`, omits `tool_parameters`
* `mcp_server_connection`: omits `server_name` and the error message

### Map security questions to events

When building detection rules, look up the signal you want to monitor and query your backend for the corresponding event and attributes:

| Signal                                    | Event                                                                                 | Key attributes                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Tool call allowed or denied, and by what  | `tool_decision`                                                                       | `decision`, `source`, `tool_name`, `tool_parameters`         |
| Permission mode escalation                | `permission_mode_changed`                                                             | `from_mode`, `to_mode`, `trigger`                            |
| Policy hook blocked an action             | `hook_execution_complete`                                                             | `hook_event`, `num_blocking`                                 |
| Login, logout, and authentication failure | `auth`                                                                                | `action`, `success`, `error_category`                        |
| MCP server connect or failure             | `mcp_server_connection`                                                               | `status`, `server_name`, `error_code`                        |
| Plugin installed and its source           | `plugin_installed`                                                                    | `plugin.name`, `marketplace.name`, `marketplace.is_official` |
| Commands run and files touched            | `tool_result` (executed) or `tool_decision` (rejected) with `OTEL_LOG_TOOL_DETAILS=1` | `tool_parameters`; `tool_input` (`tool_result` only)         |

Claude Code emits the raw event stream only. Anomaly detection, baselining, correlation across sessions, and alerting are the responsibility of your SIEM or observability backend.

### Send events to a SIEM

Point `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` at your SIEM's OTLP receiver, or at an OpenTelemetry Collector that forwards to your SIEM's native ingest API. The following managed-settings example exports events only, with full tool detail enabled for MCP and Bash auditing:

```json theme={null}
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_LOG_TOOL_DETAILS": "1",
    "OTEL_EXPORTER_OTLP_LOGS_PROTOCOL": "http/protobuf",
    "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT": "https://siem.example.com:4318/v1/logs",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer your-siem-token"
  }
}
```

## Backend considerations

Your choice of metrics, logs, and traces backends determines the types of analyses you can perform:

### For metrics

* **Time series databases (for example, Prometheus)**: Rate calculations, aggregated metrics
* **Columnar stores (for example, ClickHouse)**: Complex queries, unique user analysis
* **Full-featured observability platforms (for example, Honeycomb, Datadog)**: Advanced querying, visualization, alerting

### For events/logs

* **Log aggregation systems (for example, Elasticsearch, Loki)**: Full-text search, log analysis
* **Columnar stores (for example, ClickHouse)**: Structured event analysis
* **Full-featured observability platforms (for example, Honeycomb, Datadog)**: Correlation between metrics and events

### For traces

Choose a backend that supports distributed trace storage and span correlation:

* **Distributed tracing systems (for example, Jaeger, Zipkin, Grafana Tempo)**: Span visualization, request waterfalls, latency analysis
* **Full-featured observability platforms (for example, Honeycomb, Datadog)**: Trace search and correlation with metrics and logs

For organizations requiring Daily/Weekly/Monthly Active User (DAU/WAU/MAU) metrics, consider backends that support efficient unique value queries.

## Service information

All metrics and events are exported with the following resource attributes:

* `service.name`: `claude-code`
* `service.version`: Current Claude Code version
* `os.type`: Operating system type (for example, `linux`, `darwin`, `windows`)
* `os.version`: Operating system version string
* `host.arch`: Host architecture (for example, `amd64`, `arm64`)
* `wsl.version`: WSL version number (only present when running on Windows Subsystem for Linux)
* Meter Name: `com.anthropic.claude_code`

## ROI measurement resources

For a comprehensive guide on measuring return on investment for Claude Code, including telemetry setup, cost analysis, productivity metrics, and automated reporting, see the [Claude Code ROI Measurement Guide](https://github.com/anthropics/claude-code-monitoring-guide). This repository provides ready-to-use Docker Compose configurations, Prometheus and OpenTelemetry setups, and templates for generating productivity reports integrated with tools like Linear.

## Security and privacy

* OpenTelemetry export to your backend is opt-in and requires explicit configuration. For Anthropic's separate operational telemetry and how to disable it, see [Data usage](/docs/en/data-usage#telemetry-services)
* Raw file contents and code snippets are not included in metrics or events. Trace spans are a separate data path: see the `OTEL_LOG_TOOL_CONTENT` bullet below
* When authenticated via OAuth, `user.email` is included in telemetry attributes. If this is a concern for your organization, work with your telemetry backend to filter or redact this field
* User prompt content is not collected by default. Only prompt length is recorded. To include prompt content, set `OTEL_LOG_USER_PROMPTS=1`
* Tool input arguments and parameters are not logged by default. To include them, set `OTEL_LOG_TOOL_DETAILS=1`. This data is sent only to the OTEL endpoint you configure, never to Anthropic. Arguments may still contain sensitive values, so configure your telemetry backend to filter or redact these attributes as needed. When enabled:
  * `tool_result` and `tool_decision` events include a `tool_parameters` attribute with Bash commands, MCP server and tool names, and skill names. Fields such as `full_command` are emitted untruncated
  * `tool_result` events additionally include a `tool_input` attribute with file paths, URLs, search patterns, and other arguments. Individual values over 512 characters are truncated and the total is bounded to \~4 K characters
  * `user_prompt` events include the verbatim `command_name` for custom, plugin, and MCP commands
  * Trace spans include the same `tool_input` attribute and input-derived attributes such as `file_path`, with the same truncation as `tool_input`
* Tool input and output content is not logged in trace spans by default. To include it, set `OTEL_LOG_TOOL_CONTENT=1`. When enabled, span events include full tool input and output content truncated at 60 KB per span. This can include raw file contents from Read tool results and Bash command output. Configure your telemetry backend to filter or redact these attributes as needed
* Raw Anthropic Messages API request and response bodies are not logged by default. To include them, set `OTEL_LOG_RAW_API_BODIES`. With `=1`, each API call emits `api_request_body` and `api_response_body` log events whose `body` attribute is the JSON-serialized payload, truncated at 60 KB. With `=file:<dir>`, untruncated bodies are written to `.request.json` and `.response.json` files under that directory and the events carry a `body_ref` path instead of the inline body. Ship the directory with a log collector or sidecar rather than through the telemetry stream. In both modes, bodies contain the full conversation history (system prompt, every prior user and assistant turn, tool results), so enabling this implies consent to everything the other `OTEL_LOG_*` content flags would reveal. Claude's extended-thinking content is always redacted from these bodies regardless of other settings

## Monitor Claude Code on Amazon Bedrock

For detailed Claude Code usage monitoring guidance for Amazon Bedrock, see [Claude Code Monitoring Implementation (Bedrock)](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/blob/main/assets/docs/MONITORING.md).


---

## Manage costs effectively

`https://code.claude.com/docs/en/costs`

Track token usage, set team spend limits, and reduce Claude Code costs with context management, model selection, extended thinking settings, and preprocessing hooks.

Claude Code charges by API token consumption. For subscription plan pricing (Pro, Max, Team, Enterprise), see [claude.com/pricing](https://claude.com/pricing). Per-developer costs vary widely based on model selection, codebase size, and usage patterns such as running multiple instances or automation.

Across enterprise deployments, the average cost is around \$13 per developer per active day and \$150-250 per developer per month, with costs remaining below \$30 per active day for 90% of users. To estimate spend for your own team, start with a small pilot group and use the tracking tools below to establish a baseline before wider rollout.

This page covers how to [track your costs](#track-your-costs), [manage costs for teams](#managing-costs-for-teams), and [reduce token usage](#reduce-token-usage).

## Track your costs

### Using the `/usage` command

<Note>
  The Session block in `/usage` shows API token usage and is intended for API users. Claude Max and Pro subscribers have usage included in their subscription, so the session cost figure isn't relevant for billing purposes. Subscribers see plan usage bars, activity stats, and a usage breakdown on the same screen.
</Note>

The Session block at the top of `/usage` shows detailed token usage statistics for your current session. The dollar figure is an estimate computed locally from token counts and may differ from your actual bill. For authoritative billing, see the Usage page in the [Claude Console](https://platform.claude.com/usage).

```text theme={null}
Total cost:            $0.55
Total duration (API):  6m 19.7s
Total duration (wall): 6h 33m 10.2s
Total code changes:    0 lines added, 0 lines removed
```

On a Pro, Max, Team, or Enterprise plan, `/usage` also shows a breakdown of what counts against your plan limits. It attributes recent usage to skills, subagents, plugins, and individual MCP servers, with each shown as a percentage of the total. Press `d` or `w` to switch between the last 24 hours and the last 7 days. The figures are approximate and computed from local session history on this machine, so usage from other devices or claude.ai is not included.

## Managing costs for teams

When using Claude API, you can [set workspace spend limits](https://platform.claude.com/docs/en/build-with-claude/workspaces#workspace-limits) on the total Claude Code workspace spend. Admins can [view cost and usage reporting](https://platform.claude.com/docs/en/build-with-claude/workspaces#usage-and-cost-tracking) in the Console.

On Pro and Max plans, you can set a monthly spend limit on usage credits with the `/usage-credits` command. If you reach that limit while you still have usage credits available, Claude Code prompts you to raise or remove the limit so you can continue without leaving the CLI. Changing the limit requires billing access on the account.

<Note>
  When you first authenticate Claude Code with your Claude Console account, a workspace called "Claude Code" is automatically created for you. This workspace provides centralized cost tracking and management for all Claude Code usage in your organization. You cannot create API keys for this workspace; it is exclusively for Claude Code authentication and usage.

  For organizations with custom rate limits, Claude Code traffic in this workspace counts toward your organization's overall API rate limits. You can set a [workspace rate limit](https://platform.claude.com/docs/en/api/rate-limits#setting-lower-limits-for-workspaces) on this workspace's Limits page in the Claude Console to cap Claude Code's share and protect other production workloads.
</Note>

On Bedrock, Vertex, and Foundry, Claude Code does not send metrics from your cloud. To get cost metrics, several large enterprises reported using [LiteLLM](/docs/en/llm-gateway#litellm-configuration), which is an open-source tool that helps companies [track spend by key](https://docs.litellm.ai/docs/proxy/virtual_keys#tracking-spend). This project is unaffiliated with Anthropic and has not been audited for security.

### Rate limit recommendations

When setting up Claude Code for teams, consider these Token Per Minute (TPM) and Request Per Minute (RPM) per-user recommendations based on your organization size:

| Team size     | TPM per user | RPM per user |
| ------------- | ------------ | ------------ |
| 1-5 users     | 200k-300k    | 5-7          |
| 5-20 users    | 100k-150k    | 2.5-3.5      |
| 20-50 users   | 50k-75k      | 1.25-1.75    |
| 50-100 users  | 25k-35k      | 0.62-0.87    |
| 100-500 users | 15k-20k      | 0.37-0.47    |
| 500+ users    | 10k-15k      | 0.25-0.35    |

For example, if you have 200 users, you might request 20k TPM for each user, or 4 million total TPM (200\*20,000 = 4 million).

The TPM per user decreases as team size grows because fewer users tend to use Claude Code concurrently in larger organizations. These rate limits apply at the organization level, not per individual user, which means individual users can temporarily consume more than their calculated share when others aren't actively using the service.

<Note>
  If you anticipate scenarios with unusually high concurrent usage (such as live training sessions with large groups), you may need higher TPM allocations per user.
</Note>

### Agent team token costs

[Agent teams](/docs/en/agent-teams) spawn multiple Claude Code instances, each with its own context window. Token usage scales with the number of active teammates and how long each one runs.

To keep agent team costs manageable:

* Use Sonnet for teammates. It balances capability and cost for coordination tasks.
* Keep teams small. Each teammate runs its own context window, so token usage is roughly proportional to team size.
* Keep spawn prompts focused. Teammates load CLAUDE.md, MCP servers, and skills automatically, but everything in the spawn prompt adds to their context from the start.
* Clean up teams when work is done. Active teammates continue consuming tokens even if idle.
* Agent teams are disabled by default. Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your [settings.json](/docs/en/settings) or environment to enable them. See [enable agent teams](/docs/en/agent-teams#enable-agent-teams).

## Reduce token usage

Token costs scale with context size: the more context Claude processes, the more tokens you use. Claude Code automatically optimizes costs through [prompt caching](/docs/en/prompt-caching), which reduces costs for repeated content like system prompts, and auto-compaction, which summarizes conversation history when approaching context limits.

The following strategies help you keep context small and reduce per-message costs.

### Manage context proactively

Use `/usage` to check your current token usage, or [configure your status line](/docs/en/statusline#context-window-usage) to display it continuously.

* **Clear between tasks**: Use `/clear` to start fresh when switching to unrelated work. Stale context wastes tokens on every subsequent message. Use `/rename` before clearing so you can easily find the session later, then `/resume` to return to it.
* **Add custom compaction instructions**: `/compact Focus on code samples and API usage` tells Claude what to preserve during summarization.

You can also customize compaction behavior in your CLAUDE.md:

```markdown theme={null}
# Compact instructions

When you are using compact, please focus on test output and code changes
```

### Choose the right model

Sonnet handles most coding tasks well and costs less than Opus. Reserve Opus for complex architectural decisions or multi-step reasoning. Use `/model` to switch models mid-session, or set a default in `/config`. For simple subagent tasks, specify `model: haiku` in your [subagent configuration](/docs/en/sub-agents#choose-a-model).

### Reduce MCP server overhead

MCP tool definitions are [deferred by default](/docs/en/mcp#scale-with-mcp-tool-search), so only tool names enter context until Claude uses a specific tool. Run `/context` to see what's consuming space.

* **Prefer CLI tools when available**: Tools like `gh`, `aws`, `gcloud`, and `sentry-cli` are still more context-efficient than MCP servers because they don't add any per-tool listing. Claude can run CLI commands directly.
* **Disable unused servers**: Run `/mcp` to see configured servers and disable any you're not actively using.

### Install code intelligence plugins for typed languages

[Code intelligence plugins](/docs/en/discover-plugins#code-intelligence) give Claude precise symbol navigation instead of text-based search, reducing unnecessary file reads when exploring unfamiliar code. A single "go to definition" call replaces what might otherwise be a grep followed by reading multiple candidate files. Installed language servers also report type errors automatically after edits, so Claude catches mistakes without running a compiler.

### Offload processing to hooks and skills

Custom [hooks](/docs/en/hooks) can preprocess data before Claude sees it. Instead of Claude reading a 10,000-line log file to find errors, a hook can grep for `ERROR` and return only matching lines, reducing context from tens of thousands of tokens to hundreds.

A [skill](/docs/en/skills) can give Claude domain knowledge so it doesn't have to explore. For example, a "codebase-overview" skill could describe your project's architecture, key directories, and naming conventions. When Claude invokes the skill, it gets this context immediately instead of spending tokens reading multiple files to understand the structure.

For example, this PreToolUse hook filters test output to show only failures:

<Tabs>
  <Tab title="settings.json">
    Add this to your [settings.json](/docs/en/settings#settings-files) to run the hook before every Bash command:

    ```json theme={null}
    {
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "Bash",
            "hooks": [
              {
                "type": "command",
                "command": "~/.claude/hooks/filter-test-output.sh"
              }
            ]
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="filter-test-output.sh">
    The hook calls this script, which checks if the command is a test runner and modifies it to show only failures:

    ```bash theme={null}
    #!/bin/bash
    input=$(cat)
    cmd=$(echo "$input" | jq -r '.tool_input.command')

    # If running tests, filter to show only failures
    if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
      filtered_cmd="$cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100"
      echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"allow\",\"updatedInput\":{\"command\":\"$filtered_cmd\"}}}"
    else
      echo "{}"
    fi
    ```
  </Tab>
</Tabs>

### Move instructions from CLAUDE.md to skills

Your [CLAUDE.md](/docs/en/memory) file is loaded into context at session start. If it contains detailed instructions for specific workflows (like PR reviews or database migrations), those tokens are present even when you're doing unrelated work. [Skills](/docs/en/skills) load on-demand only when invoked, so moving specialized instructions into skills keeps your base context smaller. Aim to keep CLAUDE.md under 200 lines by including only essentials.

### Adjust extended thinking

Extended thinking is enabled by default because it significantly improves performance on complex planning and reasoning tasks. Thinking tokens are billed as output tokens, and the default budget can be tens of thousands of tokens per request depending on the model. For simpler tasks where deep reasoning isn't needed, you can reduce costs by lowering the [effort level](/docs/en/model-config#adjust-effort-level) with `/effort` or in `/model`, disabling thinking in `/config`, or lowering the budget with `MAX_THINKING_TOKENS=8000`.

### Delegate verbose operations to subagents

Running tests, fetching documentation, or processing log files can consume significant context. Delegate these to [subagents](/docs/en/sub-agents#isolate-high-volume-operations) so the verbose output stays in the subagent's context while only a summary returns to your main conversation.

### Manage agent team costs

Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode, because each teammate maintains its own context window and runs as a separate Claude instance. Keep team tasks small and self-contained to limit per-teammate token usage. See [agent teams](/docs/en/agent-teams) for details.

### Write specific prompts

Vague requests like "improve this codebase" trigger broad scanning. Specific requests like "add input validation to the login function in auth.ts" let Claude work efficiently with minimal file reads.

### Work efficiently on complex tasks

For longer or more complex work, these habits help avoid wasted tokens from going down the wrong path:

* **Use plan mode for complex tasks**: Press Shift+Tab to enter [plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) before implementation. Claude explores the codebase and proposes an approach for your approval, preventing expensive re-work when the initial direction is wrong.
* **Course-correct early**: If Claude starts heading the wrong direction, press Escape to stop immediately. Use `/rewind` or double-tap Escape to restore conversation and code to a previous checkpoint.
* **Give verification targets**: Include test cases, paste screenshots, or define expected output in your prompt. When Claude can verify its own work, it catches issues before you need to request fixes.
* **Test incrementally**: Write one file, test it, then continue. This catches issues early when they're cheap to fix.

## Background token usage

Claude Code uses tokens for some background functionality even when idle:

* **Conversation summarization**: Background jobs that summarize previous conversations for the `claude --resume` feature
* **Command processing**: Some commands like `/usage` may generate requests to check status

These background processes consume a small amount of tokens (typically under \$0.04 per session) even without active interaction.

## Understanding changes in Claude Code behavior

Claude Code regularly receives updates that may change how features work, including cost reporting. Run `claude --version` to check your current version. For specific billing questions, contact Anthropic support through your [Console account](https://platform.claude.com/login).


---

## Track team usage with analytics

`https://code.claude.com/docs/en/analytics`

View Claude Code usage metrics, track adoption, and measure engineering velocity in the analytics dashboard.

Claude Code provides analytics dashboards to help organizations understand developer usage patterns, track contribution metrics, and measure how Claude Code impacts engineering velocity. Access the dashboard for your plan:

| Plan                          | Dashboard URL                                                              | Includes                                                                              | Read more                                            |
| ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Claude for Teams / Enterprise | [claude.ai/analytics/claude-code](https://claude.ai/analytics/claude-code) | Usage metrics, contribution metrics with GitHub integration, leaderboard, data export | [Details](#access-analytics-for-team-and-enterprise) |
| API (Claude Console)          | [platform.claude.com/claude-code](https://platform.claude.com/claude-code) | Usage metrics, spend tracking, team insights                                          | [Details](#access-analytics-for-api-customers)       |

## Access analytics for Team and Enterprise

Navigate to [claude.ai/analytics/claude-code](https://claude.ai/analytics/claude-code). Admins and Owners can view the dashboard.

The Team and Enterprise dashboard includes:

* **Usage metrics**: lines of code accepted, suggestion accept rate, daily active users and sessions
* **Contribution metrics**: PRs and lines of code shipped with Claude Code assistance, with [GitHub integration](#enable-contribution-metrics)
* **Leaderboard**: top contributors ranked by Claude Code usage
* **Data export**: download contribution data as CSV for custom reporting

For per-user token counts and cost estimates, configure [OpenTelemetry export](/docs/en/monitoring-usage).

### Enable contribution metrics

<Note>
  Contribution metrics are in public beta and available on Claude for Teams and Claude for Enterprise plans. These metrics only cover users within your claude.ai organization. Usage through the Claude Console API or third-party integrations is not included.
</Note>

Usage and adoption data is available for all Claude for Teams and Claude for Enterprise accounts. Contribution metrics require additional setup to connect your GitHub organization.

You need the Owner role to configure analytics settings. A GitHub admin must install the GitHub app.

<Warning>
  Contribution metrics are not available for organizations with [Zero Data Retention](/docs/en/zero-data-retention) enabled. The analytics dashboard will show usage metrics only.
</Warning>

<Steps>
  <Step title="Install the GitHub app">
    A GitHub admin installs the Claude GitHub app on your organization's GitHub account at [github.com/apps/claude](https://github.com/apps/claude).
  </Step>

  <Step title="Enable Claude Code analytics">
    A Claude Owner navigates to [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code) and enables the Claude Code analytics feature.
  </Step>

  <Step title="Enable GitHub analytics">
    On the same page, enable the "GitHub analytics" toggle.
  </Step>

  <Step title="Authenticate with GitHub">
    Complete the GitHub authentication flow and select which GitHub organizations to include in the analysis.
  </Step>
</Steps>

Data typically appears within 24 hours after enabling, with daily updates. If no data appears, you may see one of these messages:

* **"GitHub app required"**: install the GitHub app to view contribution metrics
* **"Data processing in progress"**: check back in a few days and confirm the GitHub app is installed if data doesn't appear

Contribution metrics support GitHub Cloud and GitHub Enterprise Server.

### Review summary metrics

<Note>
  These metrics are deliberately conservative and represent an underestimate of Claude Code's actual impact. Only lines and PRs where there is high confidence in Claude Code's involvement are counted.
</Note>

The dashboard displays these summary metrics at the top:

* **PRs with CC**: total count of merged pull requests that contain at least one line of code written with Claude Code
* **Lines of code with CC**: total lines of code across all merged PRs that were written with Claude Code assistance. Only "effective lines" are counted: lines with more than 3 characters after normalization, excluding empty lines and lines with only brackets or trivial punctuation.
* **PRs with Claude Code (%)**: percentage of all merged PRs that contain Claude Code-assisted code
* **Suggestion accept rate**: percentage of times users accept Claude Code's code editing suggestions, including Edit, Write, and NotebookEdit tool usage
* **Lines of code accepted**: total lines of code written by Claude Code that users have accepted in their sessions. This excludes rejected suggestions and does not track subsequent deletions.

### Explore the charts

The dashboard includes several charts to visualize trends over time.

#### Track adoption

The Adoption chart shows daily usage trends:

* **users**: daily active users
* **sessions**: number of active Claude Code sessions per day

#### Measure PRs per user

This chart displays individual developer activity over time:

* **PRs per user**: total number of PRs merged per day divided by daily active users
* **users**: daily active users

Use this to understand how individual productivity changes as Claude Code adoption increases.

#### View pull requests breakdown

The Pull requests chart shows a daily breakdown of merged PRs:

* **PRs with CC**: pull requests containing Claude Code-assisted code
* **PRs without CC**: pull requests without Claude Code-assisted code

Toggle to **Lines of code** view to see the same breakdown by lines of code rather than PR count.

#### Find top contributors

The Leaderboard shows the top 10 users ranked by contribution volume. Toggle between:

* **Pull requests**: shows PRs with Claude Code vs All PRs for each user
* **Lines of code**: shows lines with Claude Code vs All lines for each user

Click **Export all users** to download complete contribution data for all users as a CSV file. The export includes all users, not just the top 10 displayed.

### PR attribution

When contribution metrics are enabled, Claude Code analyzes merged pull requests to determine which code was written with Claude Code assistance. This is done by matching Claude Code session activity against the code in each PR.

#### Tagging criteria

PRs are tagged as "with Claude Code" if they contain at least one line of code written during a Claude Code session. The system uses conservative matching: only code where there is high confidence in Claude Code's involvement is counted as assisted.

#### Attribution process

When a pull request is merged:

1. Added lines are extracted from the PR diff
2. Claude Code sessions that edited matching files within a time window are identified
3. PR lines are matched against Claude Code output using multiple strategies
4. Metrics are calculated for AI-assisted lines and total lines

Before comparison, lines are normalized: whitespace is trimmed, multiple spaces are collapsed, quotes are standardized, and text is converted to lowercase.

Merged pull requests containing Claude Code-assisted lines are labeled as `claude-code-assisted` in GitHub.

#### Time window

Sessions from 21 days before to 2 days after the PR merge date are considered for attribution matching.

#### Excluded files

Certain files are automatically excluded from analysis because they are auto-generated:

* Lock files: package-lock.json, yarn.lock, Cargo.lock, and similar
* Generated code: Protobuf outputs, build artifacts, minified files
* Build directories: dist/, build/, node\_modules/, target/
* Test fixtures: snapshots, cassettes, mock data
* Lines over 1,000 characters, which are likely minified or generated

#### Attribution notes

Keep these additional details in mind when interpreting attribution data:

* Code substantially rewritten by developers, with more than 20% difference, is not attributed to Claude Code
* Sessions outside the 21-day window are not considered
* The algorithm does not consider the PR source or destination branch when performing attribution

### Get the most from analytics

Use contribution metrics to demonstrate ROI, identify adoption patterns, and find team members who can help others get started.

#### Monitor adoption

Track the Adoption chart and user counts to identify:

* Active users who can share best practices
* Overall adoption trends across your organization
* Dips in usage that may indicate friction or issues

#### Measure ROI

Contribution metrics help answer "Is this tool worth the investment?" with data from your own codebase:

* Track changes in PRs per user over time as adoption increases
* Compare PRs and lines of code shipped with vs. without Claude Code
* Use alongside [DORA metrics](https://dora.dev/), sprint velocity, or other engineering KPIs to understand changes from adopting Claude Code

#### Identify power users

The Leaderboard helps you find team members with high Claude Code adoption who can:

* Share prompting techniques and workflows with the team
* Provide feedback on what's working well
* Help onboard new users

#### Access data programmatically

To query this data through GitHub, search for PRs labeled with `claude-code-assisted`.

## Access analytics for API customers

API customers using the Claude Console can access analytics at [platform.claude.com/claude-code](https://platform.claude.com/claude-code). You need the UsageView permission to access the dashboard, which is granted to Developer, Billing, Admin, Owner, and Primary Owner roles.

<Note>
  Contribution metrics with GitHub integration are not currently available for API customers. The Console dashboard shows usage and spend metrics only.
</Note>

The Console dashboard displays:

* **Lines of code accepted**: total lines of code written by Claude Code that users have accepted in their sessions. This excludes rejected suggestions and does not track subsequent deletions.
* **Suggestion accept rate**: percentage of times users accept code editing tool usage, including Edit, Write, and NotebookEdit tools.
* **Activity**: daily active users and sessions shown on a chart.
* **Spend**: daily API costs in dollars alongside user count.

### View team insights

The team insights table shows per-user metrics:

* **Members**: all users who have authenticated to Claude Code. API key users display by key identifier, OAuth users display by email address.
* **Spend this month**: per-user total API costs for the current month.
* **Lines this month**: per-user total of accepted code lines for the current month.

<Note>
  Spend figures in the Console dashboard are estimates for analytics purposes. For actual costs, refer to your billing page.
</Note>

## Related resources

* [Monitoring with OpenTelemetry](/docs/en/monitoring-usage): export real-time metrics and events to your observability stack
* [Manage costs effectively](/docs/en/costs): set spend limits and optimize token usage
* [Permissions](/docs/en/permissions): configure roles and permissions


---

## Configure server-managed settings

`https://code.claude.com/docs/en/server-managed-settings`

Centrally configure Claude Code for your organization through server-delivered settings, without requiring device management infrastructure.

Server-managed settings allow administrators to centrally configure Claude Code through a web-based interface on Claude.ai. Claude Code clients automatically receive these settings when users authenticate with their organization credentials.

This approach is designed for organizations that do not have device management infrastructure in place, or need to manage settings for users on unmanaged devices.

<Note>
  Server-managed settings are available for [Claude for Teams](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=server_settings_teams#team-&-enterprise) and [Claude for Enterprise](https://anthropic.com/contact-sales?utm_source=claude_code\&utm_medium=docs\&utm_content=server_settings_enterprise) customers.
</Note>

## Requirements

To use server-managed settings, you need:

* Claude for Teams or Claude for Enterprise plan
* Claude Code version 2.1.38 or later for Claude for Teams, or version 2.1.30 or later for Claude for Enterprise
* Network access to `api.anthropic.com`

## Choose between server-managed and endpoint-managed settings

Claude Code supports two approaches for centralized configuration. Server-managed settings deliver configuration from Anthropic's servers. [Endpoint-managed settings](/docs/en/settings#settings-files) are deployed directly to devices through native OS policies (macOS managed preferences, Windows registry) or managed settings files.

| Approach                                                     | Best for                                                 | Security model                                                                                            |
| :----------------------------------------------------------- | :------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Server-managed settings**                                  | Organizations without MDM, or users on unmanaged devices | Settings delivered from Anthropic's servers at authentication time                                        |
| **[Endpoint-managed settings](/docs/en/settings#settings-files)** | Organizations with MDM or endpoint management            | Settings deployed to devices via MDM configuration profiles, registry policies, or managed settings files |

If your devices are enrolled in an MDM or endpoint management solution, endpoint-managed settings provide stronger security guarantees because the settings file can be protected from user modification at the OS level.

## Configure server-managed settings

<Steps>
  <Step title="Open the admin console">
    In [Claude.ai](https://claude.ai), navigate to **Admin Settings > Claude Code > Managed settings**.
  </Step>

  <Step title="Define your settings">
    Add your configuration as JSON. All [settings available in `settings.json`](/docs/en/settings#available-settings) are supported except those restricted to OS-level policy delivery; see [Current limitations](#current-limitations) for that short list. This includes [hooks](/docs/en/hooks), [environment variables](/docs/en/env-vars), and [managed-only settings](/docs/en/permissions#managed-only-settings) like `allowManagedPermissionRulesOnly`.

    This example enforces a permission deny list, prevents users from bypassing permissions, and restricts permission rules to those defined in managed settings:

    ```json theme={null}
    {
      "permissions": {
        "deny": [
          "Bash(curl *)",
          "Read(./.env)",
          "Read(./.env.*)",
          "Read(./secrets/**)"
        ],
        "disableBypassPermissionsMode": "disable"
      },
      "allowManagedPermissionRulesOnly": true
    }
    ```

    Hooks use the same format as in `settings.json`.

    This example runs an audit script after every file edit across the organization:

    ```json theme={null}
    {
      "hooks": {
        "PostToolUse": [
          {
            "matcher": "Edit|Write",
            "hooks": [
              { "type": "command", "command": "/usr/local/bin/audit-edit.sh" }
            ]
          }
        ]
      }
    }
    ```

    To configure the [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) classifier so it knows which repos, buckets, and domains your organization trusts:

    ```json theme={null}
    {
      "autoMode": {
        "environment": [
          "Source control: github.example.com/acme-corp and all repos under it",
          "Trusted cloud buckets: s3://acme-build-artifacts, gs://acme-ml-datasets",
          "Trusted internal domains: *.corp.example.com"
        ]
      }
    }
    ```

    Because hooks execute shell commands, users see a [security approval dialog](#security-approval-dialogs) before they're applied. See [Configure auto mode](/docs/en/auto-mode-config) for how the `autoMode` entries affect what the classifier blocks and important warnings about the `environment`, `allow`, `soft_deny`, and `hard_deny` fields.
  </Step>

  <Step title="Save and deploy">
    Save your changes. Claude Code clients receive the updated settings on their next startup or hourly polling cycle.
  </Step>
</Steps>

### Verify settings delivery

To confirm that settings are being applied, ask a user to restart Claude Code. If the configuration includes settings that trigger the [security approval dialog](#security-approval-dialogs), the user sees a prompt describing the managed settings on startup. You can also verify that managed permission rules are active by having a user run `/permissions` to view their effective permission rules.

### Access control

The following roles can manage server-managed settings:

* **Primary Owner**
* **Owner**

Restrict access to trusted personnel, as settings changes apply to all users in the organization.

### Managed-only settings

Most [settings keys](/docs/en/settings#available-settings) work in any scope. A handful of keys are only read from managed settings and have no effect when placed in user or project settings files. See [managed-only settings](/docs/en/permissions#managed-only-settings) for the full list. Any setting not on that list can still be placed in managed settings and takes the highest precedence.

### Current limitations

Server-managed settings have the following limitations:

* Settings apply uniformly to all users in the organization. Per-group configurations are not yet supported.
* A [`managed-mcp.json`](/docs/en/managed-mcp) file cannot be distributed through server-managed settings. Deliver the `allowedMcpServers` and `deniedMcpServers` policy keys there instead.
* Settings restricted to OS-level policy sources, such as `policyHelper` and `wslInheritsWindowsSettings`, are not honored. Deploy them through MDM or a system `managed-settings.json` file instead.

## Settings delivery

### Settings precedence

Server-managed settings and [endpoint-managed settings](/docs/en/settings#settings-files) both occupy the highest tier in the Claude Code [settings hierarchy](/docs/en/settings#settings-precedence). No other settings level can override them, including command line arguments.

Within the managed tier, the first source that delivers a non-empty configuration wins. Server-managed settings are checked first, then endpoint-managed settings. Sources do not merge: if server-managed settings deliver any keys at all, endpoint-managed settings are ignored entirely. If server-managed settings deliver nothing, endpoint-managed settings apply.

If you clear your server-managed configuration in the admin console with the intent of falling back to an endpoint-managed plist or registry policy, be aware that [cached settings](#fetch-and-caching-behavior) persist on client machines until the next successful fetch. Run `/status` to see which managed source is active.

### Fetch and caching behavior

Claude Code fetches settings from Anthropic's servers at startup and polls for updates hourly during active sessions.

**First launch without cached settings:**

* Claude Code fetches settings asynchronously
* If the fetch fails, Claude Code continues without managed settings
* There is a brief window before settings load where restrictions are not yet enforced

**Subsequent launches with cached settings:**

* Cached settings apply immediately at startup
* Claude Code fetches fresh settings in the background
* Cached settings persist through network failures

Claude Code applies settings updates automatically without a restart, except for advanced settings like OpenTelemetry configuration, which require a full restart to take effect.

### Enforce fail-closed startup

By default, if the remote settings fetch fails at startup, the CLI continues without managed settings. For environments where this brief unenforced window is unacceptable, set `forceRemoteSettingsRefresh: true` in your managed settings.

When this setting is active, the CLI blocks at startup until remote settings are freshly fetched. If the fetch fails, the CLI exits rather than proceeding without the policy. This setting self-perpetuates: once delivered from the server, it is also cached locally so that subsequent startups enforce the same behavior even before the first successful fetch of a new session.

To enable this, add the key to your managed settings configuration:

```json theme={null}
{
  "forceRemoteSettingsRefresh": true
}
```

Before enabling this setting, ensure your network policies allow connectivity to `api.anthropic.com`. If that endpoint is unreachable, the CLI exits at startup and users cannot start Claude Code.

As of v2.1.139, the `claude auth` subcommands such as `claude auth login` are exempt from this check, so users can re-authenticate when expired credentials are the reason the settings fetch fails.

### Security approval dialogs

Certain settings that could pose security risks require explicit user approval before being applied:

* **Shell command settings**: settings that execute shell commands
* **Custom environment variables**: variables not in the known safe allowlist
* **Hook configurations**: any hook definition

When these settings are present, users see a security dialog explaining what is being configured. Users must approve to proceed. If a user rejects the settings, Claude Code exits.

<Note>
  In non-interactive mode with the `-p` flag, Claude Code skips security dialogs and applies settings without user approval.
</Note>

## Platform availability

Server-managed settings require a direct connection to `api.anthropic.com` and are not available when using third-party model providers:

* Amazon Bedrock
* Google Vertex AI
* Microsoft Foundry
* Custom API endpoints via `ANTHROPIC_BASE_URL` or [LLM gateways](/docs/en/llm-gateway)

## Audit logging

Audit log events for settings changes are available through the compliance API or audit log export. Contact your Anthropic account team for access.

Audit events include the type of action performed, the account and device that performed the action, and references to the previous and new values.

## Security considerations

Server-managed settings provide centralized policy enforcement, but they operate as a client-side control. On unmanaged devices, users with admin or sudo access can modify the Claude Code binary, filesystem, or network configuration.

| Scenario                                                               | Behavior                                                                                                                                                                                                                                                            |
| :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| User edits the cached settings file                                    | Tampered file applies at startup, but correct settings restore on the next server fetch                                                                                                                                                                             |
| User deletes the cached settings file                                  | First-launch behavior occurs: settings fetch asynchronously with a brief unenforced window                                                                                                                                                                          |
| API is unavailable                                                     | Cached settings apply if available, otherwise managed settings are not enforced until the next successful fetch. With `forceRemoteSettingsRefresh: true`, the CLI exits instead of continuing, except for [`claude auth` subcommands](#enforce-fail-closed-startup) |
| User authenticates with a different organization                       | Settings are not delivered for accounts outside the managed organization                                                                                                                                                                                            |
| User configures a [third-party model provider](#platform-availability) | Server-managed settings are bypassed. This includes setting `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_MANTLE`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY`, or a non-default `ANTHROPIC_BASE_URL`                                                         |

To detect runtime configuration changes, use [`ConfigChange` hooks](/docs/en/hooks#configchange) to log modifications or block unauthorized changes before they take effect.

For stronger enforcement guarantees, use [endpoint-managed settings](/docs/en/settings#settings-files) on devices enrolled in an MDM solution.

## See also

Related pages for managing Claude Code configuration:

* [Settings](/docs/en/settings): complete configuration reference including all available settings
* [Endpoint-managed settings](/docs/en/settings#settings-files): managed settings deployed to devices by IT
* [Authentication](/docs/en/authentication): set up user access to Claude Code
* [Security](/docs/en/security): security safeguards and best practices


---

## Zero data retention

`https://code.claude.com/docs/en/zero-data-retention`

Learn about Zero Data Retention (ZDR) for Claude Code on Claude for Enterprise, including scope, disabled features, and how to request enablement.

Zero Data Retention (ZDR) is available for Claude Code when used through Claude for Enterprise. When ZDR is enabled, prompts and model responses generated during Claude Code sessions are processed in real time and not stored by Anthropic after the response is returned, except where needed to comply with law or combat misuse.

ZDR on Claude for Enterprise gives enterprise customers the ability to use Claude Code with zero data retention and access administrative capabilities:

* Cost controls per user
* [Analytics](/docs/en/analytics) dashboard
* [Server-managed settings](/docs/en/server-managed-settings)
* Audit logs

ZDR for Claude Code on Claude for Enterprise applies only to Anthropic's direct platform. For Claude deployments on Amazon Bedrock, Google Vertex AI, or Microsoft Foundry, refer to those platforms' data retention policies.

## ZDR scope

ZDR covers Claude Code inference on Claude for Enterprise.

<Warning>
  ZDR is enabled on a per-organization basis. Each new organization requires ZDR to be enabled separately by your Anthropic account team. ZDR does not automatically apply to new organizations created under the same account. Contact your account team to enable ZDR for any new organizations.
</Warning>

### What ZDR covers

ZDR covers model inference calls made through Claude Code on Claude for Enterprise. When you use Claude Code in your terminal, the prompts you send and the responses Claude generates are not retained by Anthropic. This applies regardless of which Claude model is used.

### What ZDR does not cover

ZDR does not extend to the following, even for organizations with ZDR enabled. These features follow [standard data retention policies](/docs/en/data-usage#data-retention):

| Feature                  | Details                                                                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat on claude.ai        | Chat conversations through the Claude for Enterprise web interface are not covered by ZDR.                                                                                                                                                                  |
| Cowork                   | Cowork sessions are not covered by ZDR.                                                                                                                                                                                                                     |
| Claude Code Analytics    | Does not store prompts or model responses, but collects productivity metadata such as account emails and usage statistics. Contribution metrics are not available for ZDR organizations; the [analytics dashboard](/docs/en/analytics) shows usage metrics only. |
| User and seat management | Administrative data such as account emails and seat assignments is retained under standard policies.                                                                                                                                                        |
| Third-party integrations | Data processed by third-party tools, MCP servers, or other external integrations is not covered by ZDR. Review those services' data handling practices independently.                                                                                       |

## Features disabled under ZDR

When ZDR is enabled for a Claude Code organization on Claude for Enterprise, certain features that require storing prompts or completions are automatically disabled at the backend level:

| Feature                                                             | Reason                                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Claude Code on the Web](/docs/en/claude-code-on-the-web)                | Requires server-side storage of conversation history.                   |
| [Remote sessions](/docs/en/desktop#remote-sessions) from the Desktop app | Requires persistent session data that includes prompts and completions. |
| Feedback submission (`/feedback`)                                   | Submitting feedback sends conversation data to Anthropic.               |

These features are blocked in the backend regardless of client-side display. If you see a disabled feature in the Claude Code terminal during startup, attempting to use it returns an error indicating the organization's policies do not allow that action.

Future features may also be disabled if they require storing prompts or completions.

## Data retention for policy violations

Even with ZDR enabled, Anthropic may retain data where required by law or to address Usage Policy violations. If a session is flagged for a policy violation, Anthropic may retain the associated inputs and outputs for up to 2 years, consistent with Anthropic's standard ZDR policy.

## Request ZDR

To request ZDR for Claude Code on Claude for Enterprise, [contact sales](https://www.anthropic.com/contact-sales?utm_source=claude_code\&utm_medium=docs\&utm_content=zero_data_retention_request) or your Anthropic account team. Your account team will submit the request internally, and Anthropic will review and enable ZDR on your organization after confirming eligibility. All enablement actions are audit-logged.

If you are currently using ZDR for Claude Code via pay-as-you-go API keys, you can transition to Claude for Enterprise to gain access to administrative features while maintaining ZDR for Claude Code. Contact your account team to coordinate the migration.


---

## Legal and compliance

`https://code.claude.com/docs/en/legal-and-compliance`

Legal agreements, compliance certifications, and security information for Claude Code.

<Note>
  Starting June 15, 2026, Agent SDK and `claude -p` usage on subscription plans will draw from a new monthly Agent SDK credit, separate from your interactive usage limits. See [Use the Claude Agent SDK with your Claude plan](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) for details.
</Note>

## Legal agreements

### License

Your use of Claude Code is subject to:

* [Commercial Terms](https://www.anthropic.com/legal/commercial-terms) - for Team, Enterprise, and Claude API users
* [Consumer Terms of Service](https://www.anthropic.com/legal/consumer-terms) - for Free, Pro, and Max users

### Commercial agreements

Whether you're using the Claude API directly (1P) or accessing it through Amazon Bedrock or Google Vertex (3P), your existing commercial agreement will apply to Claude Code usage, unless we've mutually agreed otherwise.

## Compliance

### Healthcare compliance (BAA)

If a customer has a Business Associate Agreement (BAA) with us, and wants to use Claude Code, the BAA will automatically extend to cover Claude Code if the customer has executed a BAA and has [Zero Data Retention (ZDR)](/docs/en/zero-data-retention) activated. The BAA will be applicable to that customer's API traffic flowing through Claude Code. ZDR is enabled on a per-organization basis, so each organization must have ZDR enabled separately to be covered under the BAA.

## Usage policy

### Acceptable use

Claude Code usage is subject to the [Anthropic Usage Policy](https://www.anthropic.com/legal/aup). Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK.

### Authentication and credential use

Claude Code authenticates with Anthropic's servers using OAuth tokens or API keys. These authentication methods serve different purposes:

* **OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications. More information about how users can authenticate with OAuth tokens can be found in [Logging in to your Claude account](https://support.claude.com/en/articles/13189465-logging-in-to-your-claude-account).
* **Developers** building products or services that interact with Claude's capabilities, including those using the [Agent SDK](/docs/en/agent-sdk/overview), should use API key authentication through [Claude Console](https://platform.claude.com/) or a supported cloud provider. Anthropic does not permit third-party developers to offer Claude.ai login or to route requests through Free, Pro, or Max plan credentials on behalf of their users.

Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice.

For questions about permitted authentication methods for your use case, please [contact sales](https://www.anthropic.com/contact-sales?utm_source=claude_code\&utm_medium=docs\&utm_content=legal_compliance_contact_sales).

## Security and trust

### Trust and safety

You can find more information in the [Anthropic Trust Center](https://trust.anthropic.com) and [Transparency Hub](https://www.anthropic.com/transparency).

### Security vulnerability reporting

Anthropic manages our security program through HackerOne. [Use this form to report vulnerabilities](https://hackerone.com/4f1f16ba-10d3-4d09-9ecc-c721aad90f24/embedded_submissions/new).

***

© Anthropic PBC. All rights reserved. Use is subject to applicable Anthropic Terms of Service.


---

## Champion kit

`https://code.claude.com/docs/en/champion-kit`

A playbook for engineers advocating Claude Code internally: what to share, how to answer questions, and how to grow adoption on your team.

This page is for individual engineers who are already using Claude Code and want to help their team adopt it. It covers what to share, how to answer the questions you will get, a thirty-day playbook, and responses to common concerns.

Adoption of a developer tool rarely happens because of a rollout announcement. It happens because someone on the team begins using the tool well, talks about it openly, and makes it easy for others to follow. The work you do as a champion has a disproportionate effect: every example you share shortens the learning curve for the engineers who come after you, and every question you answer in public turns one person's experience into something the whole team can build on. You are acting as a multiplier for your team, not a help desk, and this guide is structured to keep the role sustainable on those terms.

## The champion role

The role consists of three behaviors that reinforce one another.

| Behavior                 | What it looks like in practice                                                                                                                                                           | Why it matters                                                                                                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Share what you discover  | Post the prompts, screenshots, and small wins from your own work in the places your team already reads, such as an engineering channel, a standup thread, or a pull-request description. | Examples drawn from your own codebase are more persuasive than any external documentation, because colleagues can see exactly how the tool applies to the problems they share with you. |
| Be the person people ask | When a colleague asks how you accomplished something, respond with the actual prompt you used so they can apply it directly to their own task.                                           | A concrete, runnable example removes the gap between curiosity and a first successful use, which is where most adoption efforts stall.                                                  |
| Grow the circle          | Establish a small number of lightweight, recurring habits, such as a dedicated channel or a weekly thread, so that momentum continues even when your attention is elsewhere.             | Adoption that depends on a single person is fragile. Adoption that is carried by shared habits continues to compound on its own.                                                        |

Most of this fits naturally inside the work you are already doing. The difference is a small amount of additional intention about where your discoveries are posted and how your answers travel.

### What this should cost you

Set expectations with yourself and with your lead. The activities below are intended to fit inside a normal working week, and the role should remain a multiplier on your existing work rather than an additional support responsibility.

| Activity                                | Time per week    | Guidance                                                                                                                       |
| --------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Posting wins and prompts                | About 15 minutes | Capture these in the moment with a screenshot and one or two sentences; avoid turning them into formal write-ups.              |
| Answering questions in a shared channel | About 20 minutes | Answer publicly once, then link back to that answer when the question recurs.                                                  |
| Hosting a weekly show-and-tell thread   | About 5 minutes  | You post the opening prompt; the team supplies the content.                                                                    |
| Optional pairing or walkthroughs        | 0 to 30 minutes  | Reserve this for colleagues who are genuinely blocked, and offer the [Quickstart](/docs/en/quickstart) link before scheduling time. |

## Share what you discover

Your own experience is the most persuasive material your colleagues will encounter, because it is specific to the codebase, workflows, and problems you all share. Documentation tells people what is possible; your posts show them what is actually working in your environment.

### What is worth sharing

The most useful posts describe a technique a colleague can reuse tomorrow rather than an outcome that is already complete. Techniques compound as they spread through a team; status updates do not.

Examples of reusable techniques:

* "I learned that @-mentioning a directory works. Pointing it at `@src/components/` and asking which were missing tests surfaced two I had overlooked."
* "Plan mode (`Shift+Tab`) shows exactly which files will be touched before any edit is made, which is why I am comfortable using it on shared code."
* "I configured a Stop hook so I receive a desktop notification when a long task completes. Configuration is in the thread."
* "Running `/init` generates a `CLAUDE.md` from the repository so the assistant stops re-asking about our conventions."

### Where to share it

Post wherever your team already reads. The goal is to place examples in the path of normal work rather than to create a destination.

| Location                                        | Best suited for                                                            | Recommended format                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A `#claude-code` or general engineering channel | Discoveries, prompts, and "today I learned" moments                        | A screenshot accompanied by one or two sentences of context                                 |
| Pull-request descriptions                       | Demonstrating the approach on real code that reviewers are already reading | A single line such as "Claude and I did this refactor; happy to walk through the approach." |
| Standups or weekly written updates              | Normalizing usage with leads and skip-level managers                       | One sentence describing one concrete outcome                                                |
| Team wiki or internal documentation             | Durable patterns, custom skills, and `CLAUDE.md` examples                  | A short page, linked from the channel topic so it remains discoverable                      |

### The format that works

A screenshot accompanied by a single line of context, or a brief before-and-after description, is generally the right level of detail. Keep each post short enough that someone scrolling past still absorbs the point. A long write-up tends to be saved for later and forgotten, whereas a short post with a screenshot tends to be copied and tried.

The example posts below illustrate tone and length; adapt them rather than copying verbatim.

```text theme={null}
Learned today that @-mentioning a directory works. I pointed it at
@src/components/ and asked which components were missing tests, and it
surfaced two I had forgotten about.
```

```text theme={null}
I configured a Stop hook so I receive a desktop notification when a long
task completes. I started a refactor, stepped away, and was notified when
it finished. Configuration is in the thread.
```

```text theme={null}
Plan mode is the reason I am comfortable using this on code that matters.
Press Shift+Tab until you see "plan"; it lays out exactly which files it
intends to touch before changing anything.
```

## Be the person people ask

Once you have shared a few examples, questions will follow. This is where the champion role has the greatest leverage, because a good answer to one person frequently unblocks several others who are watching the same channel.

### Answer with a prompt rather than an explanation

When a colleague asks how you accomplished something, the most useful response is the prompt you actually used. They will learn more from running that prompt against their own problem than from any description you could write, and it gives them something they can act on immediately.

```text theme={null}
Colleague: How did you get it to find that race condition?

Champion: I asked, "The test in @tests/scheduler.test.ts is flaky, figure
out why," and it traced two unjoined promises in the scheduler. Try the
same phrasing on your test.
```

### Point at the feature rather than the documentation

A response such as "Try plan mode, press `Shift+Tab` until you see it" is more useful in the moment than a link to the documentation. If the person needs more depth later they will find it on their own; right now they need the single thing that unblocks them.

### Questions you are likely to hear

| Question                                           | Suggested response                                                                                                                                                                                                           | Follow-up resource                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| "What should I try it on first?"                   | Recommend a real but contained task, ideally a bug or chore the person has been postponing because it is tedious rather than difficult.                                                                                      | [Common workflows](/docs/en/common-workflows)                |
| "How do I trust it with my code?"                  | Introduce plan mode: pressing `Shift+Tab` cycles into it, Claude proposes exactly what it intends to change, and nothing is modified until the user approves.                                                                | [Permissions](/docs/en/permissions)                          |
| "Is the setup worth the effort?"                   | Installation takes roughly two minutes, runs in the terminal, and requires no IDE extension. Running `/init` once is sufficient to begin working.                                                                            | [Quickstart](/docs/en/quickstart)                            |
| "It produced an incorrect result."                 | Encourage them to provide the failure back to Claude. Pasting the error message or failing test is far more effective than rephrasing the original request.                                                                  | [Common workflows](/docs/en/common-workflows)                |
| "It does not understand our codebase conventions." | Suggest running `/init` to generate a `CLAUDE.md` file, then adding the team's conventions, test commands, and any directories that should be avoided.                                                                       | [Memory](/docs/en/memory)                                    |
| "Is this just autocomplete?"                       | Offer a brief demonstration in which Claude explains an unfamiliar file, traces a bug across services, or drafts a migration plan. These tasks require reasoning across the repository rather than completing a single line. | A two-minute live demonstration                         |
| "What about security and data handling?"           | Refer this question to your administrator. Your organization's deployment and data-handling policy is already configured, and champions should not improvise this answer.                                                    | [Security](/docs/en/security) · [Data usage](/docs/en/data-usage) |

## Grow the circle

The objective is not to build a program or to own a rollout. It is to establish a small number of lightweight habits that allow momentum to continue after you have stopped actively driving it. When questions in the channel are being answered by people other than you, the role has done its job.

### Patterns that tend to work

| Pattern                                    | How to run it                                                                                                                                                                                                                                     | Effort required                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| A dedicated channel                        | Create a `#claude-code` channel (or a recurring thread in an existing one), pin the [Quickstart](/docs/en/quickstart) link and one strong example, and answer questions publicly so each answer benefits everyone watching.                            | About five minutes to set up, then ambient |
| A weekly show-and-tell thread              | Each Friday, post "What did Claude help you with this week?" No preparation, slides, or meeting are required; screenshots and short descriptions are sufficient.                                                                                  | About two minutes per week                 |
| Share a custom skill                       | Post your most useful `.claude/skills/<name>/SKILL.md` file, for example a `/ship` skill that runs tests and lint before committing, with a one-line description. Because skills are plain Markdown, colleagues can adopt them immediately.       | About five minutes per skill               |
| Generate a setup guide from your own usage | Run `/team-onboarding` in a project you have spent real time in. Claude scans your recent sessions, commands, and MCP servers, then produces a guide a new teammate can paste as their first message to replay your setup. Pin it in the channel. | About two minutes                          |
| Pair on a first task                       | Offer a single fifteen-minute pairing session to anyone getting started. One successful outcome on their own code is more persuasive than any presentation.                                                                                       | About fifteen minutes per person           |
| Identify the next champion                 | The colleague who asks you the most questions is usually ready to take on this role. Forward them this page and divide the channel responsibilities between you.                                                                                  | Negligible                                 |

### Thirty-day playbook

If a loose plan is helpful, the sequence below reflects what tends to work across most teams. Adjust freely to fit your context.

<Steps>
  <Step title="Week 1: Seed the channel">
    Create the channel, pin the [Quickstart](/docs/en/quickstart), and post two or three of your own examples with the prompts included.

    **Signal that it is working:** a few colleagues react or reply, and at least one question is asked in the channel.
  </Step>

  <Step title="Week 2: Start the rhythm">
    Start the weekly show-and-tell thread, answer every question publicly, and share one custom skill or `CLAUDE.md` snippet.

    **Signal that it is working:** someone other than you posts an example of their own.
  </Step>

  <Step title="Week 3: Pair and consolidate">
    Offer two or three short pairing sessions and consolidate the most common questions and answers into a pinned FAQ message.

    **Signal that it is working:** you see repeat usage, with the same colleagues returning rather than trying once and stopping.
  </Step>

  <Step title="Week 4: Hand off">
    Identify a second champion and share a brief summary of what is working and what is not with your lead or administrator.

    **Signal that it is working:** questions in the channel are being answered by people other than you.
  </Step>
</Steps>

### When someone wants to go deeper

You are the warm introduction rather than the onboarding program. When a colleague moves past "should I try this" into "how do I become effective with it," point them to the [Quickstart](/docs/en/quickstart) and [Common workflows](/docs/en/common-workflows) pages. They contain short sections covering the features that are genuinely useful but difficult to discover on your own.

## Respond to common concerns

Healthy skepticism is expected; engineers should be cautious about tools that touch their code. The most effective response is rarely to argue the general case. Instead, acknowledge the concern, offer a brief reframe, and propose one concrete demonstration on the person's own code. Most concerns are resolved by a single successful experience.

| Concern                                       | Suggested response                                                                                                                                                                                 | Evidence to offer                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| "I am faster without it."                     | That is likely true for code the person writes routinely. Suggest trying it on the work they tend to avoid: legacy files, unfamiliar services, or test scaffolding, where the leverage is highest. | Time one tedious task both ways and compare.              |
| "I do not trust AI to touch production code." | Agree that no change should land unread. Plan mode combined with normal diff review means nothing is applied that the engineer has not inspected, the same standard as any pull request.           | Demonstrate plan mode on a real file.                     |
| "It will make junior engineers weaker."       | Used well, it is an effective explainer. Encourage junior engineers to ask Claude to explain a file and its call sites before asking it to change anything.                                        | Run "Explain @file and where it is called from" together. |
| "I tried it once and it hallucinated."        | This is usually a context problem rather than a model problem. @-mentioning the relevant files, running `/init`, and providing the actual error output typically resolves it.                      | Re-run their original prompt with proper `@`-context.     |
| "We do not have time to learn another tool."  | Claude Code is a terminal command rather than a platform. If it does not return value within the first session, it is reasonable to set it aside.                                                  | A two-minute install followed by one real bug.            |

## Quick-reference sheet

The techniques below are the ones that most reliably move someone from a first trial to daily use. Pin this table in a channel or share it on its own.

| Technique                        | How to apply it                                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provide the right context        | Use `@file` or `@directory/` references, or paste the error or log output directly. Supplying relevant context is more effective than elaborate prompting.       |
| Review the plan before the edit  | Press `Shift+Tab` to enter plan mode. Claude will describe the intended changes for your approval before executing them.                                         |
| Teach it your repository         | Run `/init` to generate a `CLAUDE.md` file, then add your conventions, test commands, and any directories that should not be modified. See [Memory](/docs/en/memory). |
| Reuse a workflow                 | Save a `SKILL.md` file in `.claude/skills/<name>/` to create a `/name` skill that the entire team can use. See [Skills](/docs/en/skills).                             |
| Stay informed during long tasks  | Configure a Stop hook to receive a desktop notification when a long-running task completes. See [Hooks](/docs/en/hooks-guide).                                        |
| Recover from an incorrect result | Rather than rephrasing the request, paste the failing test or stack trace back to Claude and ask it to address that specific failure.                            |
| Keep edits surgical              | Ask for a diff, or specify "only change X." Claude respects scope when scope is stated.                                                                          |

<Tip>
  Claude Code is updated frequently. Verify version-specific details against the [documentation home page](/docs/en/overview) before distributing this material internally.
</Tip>


---

## Communications kit

`https://code.claude.com/docs/en/communications-kit`

Launch announcements, drip-campaign messages, and FAQ responses for rolling Claude Code out to your engineering organization.

This page is for administrators and engineering leads rolling Claude Code out to a team. It provides copy-ready launch announcements, a tips-and-tricks drip campaign, and one-line FAQ responses for the questions you will be asked most.

<Note>
  Treat everything here as draft copy, not finished copy. Rewrite each message in your organization's voice, swap the example tasks for real bugs and modules from your own codebase, and replace the `[bracketed placeholders]` before sending. The announcements that drive adoption are the ones that read like someone at your company wrote them.
</Note>

## Launch communications

One announcement in two formats, plus two optional variants. Pick whichever fits your rollout and rewrite it from there.

### Before you send

Work through this checklist before the announcement goes out. Each item closes a gap that otherwise turns into a launch-day support thread.

| Item                                                                                             | Why it matters                                                                      |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `#claude-code` channel created and linked in the message                                         | Gives questions one place to land                                                   |
| Install command tested on at least one machine in your environment                               | Catches proxy or firewall issues before everyone hits them at once                  |
| Security and data-handling link ready ([Data usage](/docs/en/data-usage) or your internal equivalent) | "Where does my code go?" will be the first reply                                    |
| One concrete first task chosen, a real bug or file in your codebase                              | Generic examples don't convert; "fix the flaky test in `auth_test.go`" does         |
| A named owner for the channel for the first 48 hours                                             | Unanswered launch-day questions kill momentum                                       |
| A C-suite sponsor lined up to send or co-sign the announcement                                   | Exec-sent launches consistently see higher first-week adoption than admin-sent ones |

### The announcement

Use this as your standard org-wide rollout message. It covers what Claude Code is, gives a two-minute install path, hands readers one concrete task to try, and answers "where does my code go?" before anyone has to ask.

<Tabs>
  <Tab title="Email">
    ```text theme={null}
    Subject: Claude Code is live for [Engineering / your team]

    Team,

    As of today you have access to Claude Code, an AI coding agent that runs in
    your terminal, reads your actual codebase, and works through real tasks end
    to end: debugging, refactors, tests, PRs. It is not autocomplete and it is
    not a chat window. It edits files, runs your commands, and asks permission
    before anything risky.

    Get running in two minutes:

        curl -fsSL https://claude.ai/install.sh | bash
        cd <your-repo>
        claude

    Then run /init once. Claude reads your project and writes a CLAUDE.md with
    your build commands and conventions, so you stop re-explaining the basics.

    Then try one of these on the repo you are already in:

      - "The test in [file] is flaky. Figure out why and fix it"
      - "Walk me through how [module] handles [X]"
      - "Look at my working diff and tell me what's risky before I push"

    Where your code goes: Claude Code runs in your terminal and talks directly
    to Anthropic's API, with no third-party servers in the loop. It asks before
    editing files or running commands. Under our Enterprise agreement, Anthropic
    does not use your code or prompts to train its models.
    Details: https://code.claude.com/docs/en/data-usage
             https://code.claude.com/docs/en/security

    Where to go with questions: #claude-code. [Owner name] is watching it
    this week.

    - [Name]

    P.S. Prefer your editor? There is a VS Code extension and a JetBrains
    plugin. Same agent, no terminal required.
    ```
  </Tab>

  <Tab title="Slack or Teams">
    ```markdown theme={null}
    🚀 *Claude Code is live for [team]*

    AI coding agent, runs in your terminal, reads your repo, does real work:
    bugs, refactors, tests, PRs. Asks before it touches anything.

    `curl -fsSL https://claude.ai/install.sh | bash` → `cd your-repo` → `claude`

    *First thing to try* → run `/init`, then: "the test in [file] is flaky,
    figure out why and fix it."

    🔒 Runs in your terminal, talks only to Anthropic's API. Under our
    Enterprise plan your code and prompts are not used to train models.
    Data usage → https://code.claude.com/docs/en/data-usage

    📚 Quickstart · VS Code · Free 1-hr course
       https://code.claude.com/docs/en/quickstart
       https://code.claude.com/docs/en/vs-code
       https://anthropic.skilljar.com/claude-code-in-action

    Questions → this thread. [Owner] is on point.
    ```
  </Tab>
</Tabs>

### Executive sponsor variant

Send this from your sponsoring executive, such as the CTO, CIO, or SVP Engineering, under their name and from their account. Launches that go out under an exec's name consistently see higher open rates and faster first-week activation than the same message from an admin or tooling team. It signals a company priority rather than an optional experiment.

This version is deliberately stripped to one ask: install it and run it on one real task. The exec's job is to make the ask land; the standard announcement and `#claude-code` handle the how.

<Tabs>
  <Tab title="Email">
    ```text theme={null}
    Subject: One thing I'd like every engineer to try this week

    Team,

    We have turned on Claude Code for all of engineering. It is an AI agent
    that works directly in your terminal, on your actual codebase, and the
    early results from teams already using it are strong enough that I want
    everyone on it this week.

    I am asking for ten minutes:

        curl -fsSL https://claude.ai/install.sh | bash
        cd <your-repo>
        claude

    Then hand it one real task: the bug you have been putting off, or "walk me
    through how [module] works."

    That is the whole ask. [Owner name] and team are in #claude-code for
    anything you hit along the way.

    - [Exec Name]
      [Title]
    ```
  </Tab>

  <Tab title="Slack or Teams">
    ```markdown theme={null}
    📣 *From [Exec Name]: one thing to try this week*

    We have turned on *Claude Code* for all of engineering. Early results are
    strong enough that I am asking everyone to give it ten minutes on real
    work this week.

    `curl -fsSL https://claude.ai/install.sh | bash` → `cd your-repo` →
    `claude` → hand it one real task.

    That's it. Questions → #claude-code.
    ```
  </Tab>
</Tabs>

### Pilot group variant

Use for a phased rollout. Send to the pilot cohort only.

```text theme={null}
Subject: You're in the Claude Code pilot

[Name / team],

You are in the first wave of Claude Code at [company]. We picked this group
because you will put it on real problems and tell us the truth about it.

The ask: use it on at least one real task this week, then drop a note in
#claude-code-pilot covering what worked, what was annoying, and what
surprised you. That feedback decides how we roll it out to everyone else.

[Continue with "Get running in two minutes" from the standard announcement]

One extra thing for pilots: on your first multi-file change, press Shift+Tab
until you see "plan". Claude will lay out exactly what it intends to do
before it touches a file. It is the fastest way to calibrate how much to
trust it.
```

### Champion recruitment DM

After launch, DM the two or three people who are most active in `#claude-code`.

```text theme={null}
Hey [name], your #claude-code posts are doing more for adoption than my
announcement did. A couple of people told me your [thread / screenshot]
was why they actually tried it.

Want to make that semi-official? Low lift: mostly keep posting what you
are posting, plus first crack at new features and a direct line to the
Anthropic team. I can share a short playbook if you're in.
```

## Tips and tricks campaign

Ready-to-paste Slack or Teams messages designed to drive feature activation after launch. Each follows the same pattern: a hook, the payoff, a "try it now" prompt, and a docs link. Drip them one or two a week in `#claude-code`, or pick the handful that match your team's gaps. They stand alone with no required order.

Copy the message body from each block directly into Slack or Teams. Replace `[bracketed placeholders]` before sending.

### Get started

**Choosing the right model**

```markdown theme={null}
🎯 *Tip: Match the model to the moment*

Using Opus to fix a typo burns compute. Using Haiku for a 12-file refactor
is asking for a re-do.

Claude Code runs on the same models as the Claude app, and you can switch
mid-session. *Sonnet* is the workhorse default for everyday feature work,
bugs, tests, and reviews. Reach for *Opus* on large refactors, gnarly
debugging, or anything high-stakes. Drop to *Haiku* for quick questions,
formatting, and mechanical edits where speed wins.

*Try it now:* type `/model` and pick Sonnet if you haven't already. It is
the right default for most tasks.

📖 Model configuration → https://code.claude.com/docs/en/model-config
```

| Model  | Best for                                                                                  |
| ------ | ----------------------------------------------------------------------------------------- |
| Opus   | Large-scale refactors, complex debugging, architecture decisions, high-stakes changes     |
| Sonnet | Everyday feature work, bug fixes, tests, documentation, code review. Recommended default. |
| Haiku  | Quick questions, formatting, mechanical edits, rapid iteration                            |

**Quick wins to try first**

```markdown theme={null}
🚀 *Tip: Three things to try in your first 10 minutes*

Installed Claude Code but not sure what to actually ask it? Start with the
stuff that has been bugging you all week.

  - Fix something annoying: "the test in [file] is flaky, figure out why"
  - Get oriented in code you didn't write: "walk me through how [module] works"
  - Sanity-check before you push: "look at my working diff and tell me what
    looks risky"

None of these need setup. Just `cd` into your repo and run `claude`.

*Try it now:* pick the bug you have been avoiding and paste the error
message in.

📖 Quickstart → https://code.claude.com/docs/en/quickstart
```

### Project memory

**`/init` and CLAUDE.md**

```markdown theme={null}
📁 *Tip: Stop re-explaining your repo every session*

Telling Claude "we use pnpm, not npm" for the fifth time? There is a
one-time fix.

Run `/init` once per repo. Claude reads your project structure and writes a
CLAUDE.md file with your build commands, architecture, and conventions.
Every future session in that repo starts from this file automatically. Keep
it under two screens. It is a cheat sheet, not documentation.

*Try it now:* open your main repo, run `claude`, type `/init`. Thirty
seconds, pays off every session after.

📖 CLAUDE.md and project memory → https://code.claude.com/docs/en/memory
```

**@-references**

```markdown theme={null}
📎 *Tip: Stop pasting file contents into the chat*

Copying 200 lines of a component into your prompt so Claude can "see" it?
You don't have to.

Type `@` then a file path. Claude pulls the file directly into context.
Works for whole directories too.

> the styles in @src/components/Button.tsx look off, check against
> @docs/design-system.md

*Try it now:* type `@` then Tab. Autocomplete shows you every file in reach.

📖 Referencing files → https://code.claude.com/docs/en/common-workflows
```

### Control and safety

**Permission modes**

```markdown theme={null}
🛡️ *Tip: One keystroke between "look but don't touch" and "just do it"*

Sometimes you want Claude to ask before every edit. Sometimes you just want
it to ship. You shouldn't have to pick one forever.

*Shift+Tab* cycles through how much leash Claude gets: *default* asks before
risky stuff, *acceptEdits* lets file edits and common filesystem commands
flow through while still checking before other shell commands, and *plan*
proposes changes for your approval before anything is touched. Plan mode is
the trust-builder, so start there for anything touching multiple files.

*Try it now:* on your next refactor, hit Shift+Tab until you see "plan",
then describe the change. You'll get a full proposal before a single file
moves.

📖 Permission modes → https://code.claude.com/docs/en/permissions
```

**Checkpointing and `/rewind`**

```markdown theme={null}
⏪ *Tip: There is an undo button for the whole conversation*

Claude went down the wrong path three turns ago and now you're untangling
it? You don't have to fix forward.

`/rewind` rolls back to an earlier point in the conversation, including the
file changes Claude made along the way. Checkpointing is automatic; you
don't set anything up.

*Try it now:* press *Esc* twice to open the rewind menu, or type `/rewind`.
Pick the point before things went sideways.

📖 Checkpointing → https://code.claude.com/docs/en/checkpointing
```

### Connect your tools

**MCP connectors**

```markdown theme={null}
🔌 *Tip: Let Claude read your issue tracker so you don't have to paste tickets*

Copy-pasting Jira tickets into the terminal feels like a step backward.
It is.

One config file (`.mcp.json` at your project root) wires Claude into GitHub,
Jira, Linear, or whatever tracker you use. Then "what's the top-priority
issue assigned to me?" and "go ahead and fix it" happen in the same
conversation.

*Try it now:* ask Claude "set up an MCP connector for [GitHub/Jira/Linear]
in this repo". It will write the config for you.

📖 MCP connectors → https://code.claude.com/docs/en/mcp
```

### Automate your workflows

**Skills**

```markdown theme={null}
⚡ *Tip: Turn that prompt you keep retyping into a command*

Typed "summarize what I worked on today from git log, format it for standup"
three times this week? That's a slash command waiting to happen.

A SKILL.md file in `.claude/skills/<name>/` becomes a reusable prompt; type
`/name` to run it. Make one the second time you type a multi-step prompt
you've typed before. Easiest path: ask Claude to make it for you.

*Try it now:* type "make me a /standup skill that summarizes what I worked
on today from git log", then run `/standup` tomorrow morning.

📖 Skills → https://code.claude.com/docs/en/skills
```

**Hooks**

```markdown theme={null}
🔔 *Tip: Get pinged when your refactor finishes*

Sitting at your desk watching Claude work through a long task? You've got
better things to do for those eight minutes.

Hooks are shell commands that fire on Claude Code events. A Stop hook that
sends a desktop notification means you can kick off a long refactor, walk
away, and get pinged the moment it's done.

*Try it now:* ask Claude "add a Stop hook that sends a desktop notification
when you finish". It will write the script and wire it up.

📖 Hooks guide → https://code.claude.com/docs/en/hooks-guide
```

### Day-to-day development

**Screenshots and images**

```markdown theme={null}
📸 *Tip: Stop describing the error dialog. Just show it.*

Typing out "there's a red box that says something about a null reference
and it's pointing at line 47-ish"? Screenshot it.

Drag a screenshot straight into the terminal and Claude sees it: error
dialogs, UI mockups, whiteboard photos, Figma exports. *Ctrl+V* pastes from
clipboard (use Ctrl+V on macOS too, not Cmd+V).

*Try it now:* next time something visual breaks, screenshot it and paste it
right into the prompt. Then just type "what's wrong here?"

📖 Working with images → https://code.claude.com/docs/en/common-workflows
```

**Git workflows**

```markdown theme={null}
🌿 *Tip: Hand off the whole git ceremony*

The fix took 5 minutes. The commit message, branch, and PR description
took 15. That ratio is wrong.

Claude handles the full git flow: commits with conventional messages,
branches, PRs with proper summaries. One ask: "fix the off-by-one, commit
with a conventional commit message, and open a PR." Reviewing someone
else's work? Paste the PR URL and ask Claude to walk you through the diff.

*Try it now:* after your next fix, instead of switching to your git client,
just type "commit this with a good message and open a PR".

📖 Creating pull requests → https://code.claude.com/docs/en/common-workflows
```

### Share and scale

**Plugins**

```markdown theme={null}
📦 *Tip: Someone probably already built that skill*

About to spend an hour building a `/deploy` command? Check if it
already exists.

Skills get bundled and shared as plugins. `/plugin` browses what's
available and installs in one step. Five minutes of browsing can save an
hour of building.

*Try it now:* type `/plugin` and scroll through. You'll find at least one
thing you didn't know you wanted.

📖 Plugins → https://code.claude.com/docs/en/plugins
```

### Security and admin

**Security architecture**

```markdown theme={null}
🔐 *Tip: The answer to "is this safe?" for the next time you're asked*

Someone on your team is going to ask "wait, where does my code go?"
Here's the short version you can paste.

Permission-first by design. Every file edit, shell command, and external
call is gated by your approval. The CLI runs in your terminal and talks
directly to Anthropic's API, with no third-party servers, and supports
optional OS-level sandboxing for shell commands. Under our Enterprise plan,
Anthropic does not use your code or prompts to train its models.

*Try it now:* save these two links for the next time the question comes up.
They answer most security-review questions.

📖 https://code.claude.com/docs/en/security
📖 https://code.claude.com/docs/en/data-usage
```

**Best practices**

```markdown theme={null}
✅ *Tip: The 4 habits that separate "tried it once" from "use it daily"*

Most people who bounce off Claude Code skipped one of these. Most people
who stick did all four in week one.

  - Start in plan mode for anything touching multiple files
  - Run /init early; context compounds
  - Review diffs before committing; Claude can be confidently wrong
  - Verify changes that touch critical paths; treat it like a sharp
    junior, not an oracle

*Try it now:* if you've only done one or two of these, pick the one you're
missing and do it on your next task. Post what changed in #claude-code.

📖 Best practices → https://code.claude.com/docs/en/best-practices
```

## Quick reference

### FAQ responses

One-line replies for the questions you will be asked most.

| Question                                 | Response                                                                                                                                                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Does it work in VS Code?"               | Yes. There is a VS Code extension and a JetBrains plugin with the same features, embedded in your editor. [VS Code →](/docs/en/vs-code)                                                                                            |
| "Do I have to configure anything first?" | No. Install, then run `claude` in any repo. Run `/init` once and you're set. [Quickstart →](/docs/en/quickstart)                                                                                                                   |
| "Where does my code go?"                 | The CLI runs in your terminal and sends context to Anthropic's API for inference, with no third-party servers. Under your Enterprise plan, your code and prompts are not used to train models. [Data usage →](/docs/en/data-usage) |
| "Can it see my whole repo?"              | It reads what you give it access to. File reads inside your working directory don't prompt; permission prompts gate edits, shell commands, and anything outside that directory. [Permissions →](/docs/en/permissions)              |
| "How is this different from Copilot?"    | Copilot autocompletes lines. Claude Code is an agent that reads files, runs commands, and makes multi-file edits. [Overview →](/docs/en/overview)                                                                                  |
| "What should I try first?"               | A bug you've been putting off because it's tedious. "The test in \[file] is flaky, figure out why." [Quickstart →](/docs/en/quickstart)                                                                                            |

### Prompt templates

Share these starter prompts with engineers who have installed but aren't sure what to ask. Each one is phrased the way it would be typed into a real session; replace the bracketed pieces with files from your own repo.

| Task                 | Prompt                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| Fix a bug            | "the tests in \[file] are failing, figure out why and fix it"                |
| Understand code      | "walk me through how \[module] works, then tell me where the entry point is" |
| Safe refactor        | "refactor \[module] to \[goal], use plan mode so I can review first"         |
| Write tests          | "write tests for \[file] that cover the edge cases around \[scenario]"       |
| Review before commit | "look at my working diff and tell me what looks risky"                       |
| Open a PR            | "fix \[issue], write a conventional commit, and open a PR with a summary"    |
| Make a skill         | "make me a /ship skill that runs tests and lint before commit"               |
| Debug a stack trace  | "here's the stack trace, find the root cause, don't just paper over it"      |

<Tip>
  Claude Code ships frequently. Verify version-specific details against the [documentation home page](/docs/en/overview) before distributing internally.
</Tip>
