# MCP (Model Context Protocol)

_Claude Code documentation — MCP (Model Context Protocol). Source: https://code.claude.com/docs/en/_


---

## Connect Claude Code to tools via MCP

`https://code.claude.com/docs/en/mcp`

Learn how to connect Claude Code to your tools with the Model Context Protocol.

Claude Code can connect to hundreds of external tools and data sources through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open source standard for AI-tool integrations. MCP servers give Claude Code access to your tools, databases, and APIs.

Connect a server when you find yourself copying data into chat from another tool, like an issue tracker or a monitoring dashboard. Once connected, Claude can read and act on that system directly instead of working from what you paste.

## What you can do with MCP

With MCP servers connected, you can ask Claude Code to:

* **Implement features from issue trackers**: "Add the feature described in JIRA issue ENG-4521 and create a PR on GitHub."
* **Analyze monitoring data**: "Check Sentry and Statsig to check the usage of the feature described in ENG-4521."
* **Query databases**: "Find emails of 10 random users who used feature ENG-4521, based on our PostgreSQL database."
* **Integrate designs**: "Update our standard email template based on the new Figma designs that were posted in Slack"
* **Automate workflows**: "Create Gmail drafts inviting these 10 users to a feedback session about the new feature."
* **React to external events**: An MCP server can also act as a [channel](/docs/en/channels) that pushes messages into your session, so Claude reacts to Telegram messages, Discord chats, or webhook events while you're away.

## Find and build MCP servers

Browse reviewed connectors in the [Anthropic Directory](https://claude.ai/directory). Directory connectors use the same MCP infrastructure as Claude Code, so you can add any remote server listed there with `claude mcp add`.

<Warning>
  Verify you trust each server before connecting it. Servers that fetch external content can expose you to [prompt injection risk](/docs/en/security#protect-against-prompt-injection).
</Warning>

To build your own server, see the [MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server) for protocol fundamentals and the [Claude connector building docs](https://claude.com/docs/connectors/building) for authentication, testing, and Directory submission.

You can also have Claude scaffold a server for you with the official [`mcp-server-dev` plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/mcp-server-dev).

<Steps>
  <Step title="Install the plugin">
    In a Claude Code session, run:

    ```
    /plugin install mcp-server-dev@claude-plugins-official
    ```

    If Claude Code reports that the marketplace is not found, run `/plugin marketplace add anthropics/claude-plugins-official` first, then retry the install. Once installed, run `/reload-plugins` to activate it in the current session.
  </Step>

  <Step title="Run the build skill">
    ```
    /mcp-server-dev:build-mcp-server
    ```

    Claude asks about your use case and scaffolds a remote HTTP or local stdio server.
  </Step>
</Steps>

## Installing MCP servers

MCP servers can be configured in several ways depending on your needs:

### Option 1: Add a remote HTTP server

HTTP servers are the recommended option for connecting to remote MCP servers. This is the most widely supported transport for cloud-based services.

```bash theme={null}
# Basic syntax
claude mcp add --transport http <name> <url>

# Real example: Connect to Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Example with Bearer token
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

When configuring MCP servers via JSON in `.mcp.json`, `~/.claude.json`, or `claude mcp add-json`, the `type` field accepts `streamable-http` as an alias for `http`. The MCP specification uses the name `streamable-http` for this transport, so configurations copied from server documentation work without modification.

### Option 2: Add a remote SSE server

<Warning>
  The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available.
</Warning>

```bash theme={null}
# Basic syntax
claude mcp add --transport sse <name> <url>

# Real example: Connect to Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Example with authentication header
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

### Option 3: Add a local stdio server

Stdio servers run as local processes on your machine. They're ideal for tools that need direct system access or custom scripts.

Claude Code sets `CLAUDE_PROJECT_DIR` in the spawned server's environment to the project root, so your server can resolve project-relative paths without depending on the working directory. This is the same directory hooks receive in their `CLAUDE_PROJECT_DIR` variable. Read it from inside your server process, for example `process.env.CLAUDE_PROJECT_DIR` in Node or `os.environ["CLAUDE_PROJECT_DIR"]` in Python. Your server can also call the MCP `roots/list` request, which returns the directory Claude Code was launched from.

This variable is set in the server's environment, not in Claude Code's own environment, so referencing it via `${VAR}` expansion in a project- or user-scoped `.mcp.json` `command` or `args` requires a default such as `${CLAUDE_PROJECT_DIR:-.}`. Plugin-provided MCP configurations substitute `${CLAUDE_PROJECT_DIR}` directly and don't need the default.

```bash theme={null}
# Basic syntax
claude mcp add [options] <name> -- <command> [args...]

# Real example: Add Airtable server
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

<Note>
  **Important: Option ordering**

  All options (`--transport`, `--env`, `--scope`, `--header`) must come **before** the server name. The `--` (double dash) then separates the server name from the command and arguments that get passed to the MCP server.

  For example:

  * `claude mcp add --transport stdio myserver -- npx server` → runs `npx server`
  * `claude mcp add --transport stdio --env KEY=value myserver -- python server.py --port 8080` → runs `python server.py --port 8080` with `KEY=value` in environment

  This prevents conflicts between Claude's flags and the server's flags.
</Note>

### Option 4: Add a remote WebSocket server

WebSocket servers hold a persistent bidirectional connection, which suits remote MCP servers that push events to Claude unprompted. Use HTTP instead when your server only responds to requests, since HTTP supports OAuth and the `claude mcp add --transport` flag, while WebSocket supports neither.

Configure WebSocket servers in `.mcp.json` or with `claude mcp add-json`:

```bash theme={null}
claude mcp add-json events-server \
  '{"type":"ws","url":"wss://mcp.example.com/socket","headers":{"Authorization":"Bearer YOUR_TOKEN"}}'
```

The `type: "ws"` entry accepts the same `url`, `headers`, `headersHelper`, `timeout`, and `alwaysLoad` fields as `http`. Authentication is header-only, so pass a static token in `headers` or generate one at connect time with [`headersHelper`](#use-dynamic-headers-for-custom-authentication). The `claude mcp add --transport` flag does not accept `ws`.

### Managing your servers

Once configured, you can manage your MCP servers with these commands:

```bash theme={null}
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get github

# Remove a server
claude mcp remove github

# (within Claude Code) Check server status
/mcp
```

Project-scoped servers from `.mcp.json` that are awaiting your approval appear in `claude mcp list` as `⏸ Pending approval`. Run `claude` interactively to review and approve them. `claude mcp get <name>` shows pending servers as `⏸ Pending approval` and rejected servers as `✗ Rejected`.

The `/mcp` panel shows the tool count next to each connected server and flags servers that advertise the tools capability but expose no tools.

If your request needs tools from a server that is still connecting in the background, Claude waits for that server before continuing. With [tool search](#scale-with-mcp-tool-search) enabled, which is the default, the wait happens inside the `ToolSearch` call. In configurations without tool search, such as Vertex AI, a custom `ANTHROPIC_BASE_URL`, or `ENABLE_TOOL_SEARCH=false`, Claude uses the `WaitForMcpServers` tool instead.

The server name `workspace` is reserved for internal use. If your configuration defines a server with that name, Claude Code skips it at load time and shows a warning asking you to rename it.

### Dynamic tool updates

Claude Code supports MCP `list_changed` notifications, allowing MCP servers to dynamically update their available tools, prompts, and resources without requiring you to disconnect and reconnect. When an MCP server sends a `list_changed` notification, Claude Code automatically refreshes the available capabilities from that server.

### Automatic reconnection

If an HTTP or SSE server disconnects mid-session, Claude Code automatically reconnects with exponential backoff: up to five attempts, starting at a one-second delay and doubling each time. The server appears as pending in `/mcp` while reconnection is in progress. After five failed attempts the server is marked as failed and you can retry manually from `/mcp`. Stdio servers are local processes and are not reconnected automatically.

The same backoff applies when an HTTP or SSE server fails its initial connection at startup. As of v2.1.121, Claude Code retries the initial connection up to three times on transient errors such as a 5xx response, a connection refused, or a timeout, then marks the server as failed if it still cannot connect. Authentication and not-found errors are not retried because they require a configuration change to resolve.

### Push messages with channels

An MCP server can also push messages directly into your session so Claude can react to external events like CI results, monitoring alerts, or chat messages. To enable this, your server declares the `claude/channel` capability and you opt it in with the `--channels` flag at startup. See [Channels](/docs/en/channels) to use an officially supported channel, or [Channels reference](/docs/en/channels-reference) to build your own.

<Tip>
  Tips:

  * Use the `--scope` flag to specify where the configuration is stored:
    * `local` (default): Available only to you in the current project (was called `project` in older versions)
    * `project`: Shared with everyone in the project via `.mcp.json` file
    * `user`: Available to you across all projects (was called `global` in older versions)
  * Set environment variables with `--env` flags (for example, `--env KEY=value`)
  * Configure MCP server startup timeout using the MCP\_TIMEOUT environment variable (for example, `MCP_TIMEOUT=10000 claude` sets a 10-second timeout)
  * Set a per-server tool execution timeout by adding a `timeout` field in milliseconds to that server's `.mcp.json` entry, for example `"timeout": 600000` for ten minutes. This overrides the `MCP_TOOL_TIMEOUT` environment variable for that server only
  * Claude Code will display a warning when MCP tool output exceeds 10,000 tokens. To increase this limit, set the `MAX_MCP_OUTPUT_TOKENS` environment variable (for example, `MAX_MCP_OUTPUT_TOKENS=50000`)
  * Use `/mcp` to authenticate with remote servers that require OAuth 2.0 authentication
</Tip>

The per-server `timeout` is a hard wall-clock limit per tool call, and progress notifications from the server do not extend it. Values below 1000 are floored to one second. For HTTP and SSE servers, the per-request fetch first-byte budget has a 60-second minimum regardless of this value, so only the tool-call watchdog honors smaller values.

### Plugin-provided MCP servers

[Plugins](/docs/en/plugins) can bundle MCP servers, automatically providing tools and integrations when the plugin is enabled. Plugin MCP servers work identically to user-configured servers.

**How plugin MCP servers work**:

* Plugins define MCP servers in `.mcp.json` at the plugin root or inline in `plugin.json`
* When a plugin is enabled, its MCP servers start automatically
* Plugin MCP tools appear alongside manually configured MCP tools
* Plugin servers are managed through plugin installation (not `/mcp` commands)

**Example plugin MCP configuration**:

In `.mcp.json` at plugin root:

```json theme={null}
{
  "mcpServers": {
    "database-tools": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "DB_URL": "${DB_URL}"
      }
    }
  }
}
```

Or inline in `plugin.json`:

```json theme={null}
{
  "name": "my-plugin",
  "mcpServers": {
    "plugin-api": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
      "args": ["--port", "8080"]
    }
  }
}
```

**Plugin MCP features**:

* **Automatic lifecycle**: At session startup, servers for enabled plugins connect automatically. If you enable or disable a plugin during a session, run `/reload-plugins` to connect or disconnect its MCP servers
* **Environment variables**: use `${CLAUDE_PLUGIN_ROOT}` for bundled plugin files, `${CLAUDE_PLUGIN_DATA}` for [persistent state](/docs/en/plugins-reference#persistent-data-directory) that survives plugin updates, and `${CLAUDE_PROJECT_DIR}` for the stable project root
* **User environment access**: Access to same environment variables as manually configured servers
* **Multiple transport types**: Support stdio, SSE, HTTP, and WebSocket transports (transport support may vary by server)

**Viewing plugin MCP servers**:

```bash theme={null}
# Within Claude Code, see all MCP servers including plugin ones
/mcp
```

Plugin servers appear in the list with indicators showing they come from plugins.

**Benefits of plugin MCP servers**:

* **Bundled distribution**: Tools and servers packaged together
* **Automatic setup**: No manual MCP configuration needed
* **Team consistency**: Everyone gets the same tools when plugin is installed

See the [plugin components reference](/docs/en/plugins-reference#mcp-servers) for details on bundling MCP servers with plugins.

## MCP installation scopes

MCP servers can be configured at three scopes. The scope you choose controls which projects the server loads in and whether the configuration is shared with your team. Administrators can also deploy servers at the enterprise level via [managed configuration](#managed-mcp-configuration).

| Scope                     | Loads in             | Shared with team         | Stored in                   |
| ------------------------- | -------------------- | ------------------------ | --------------------------- |
| [Local](#local-scope)     | Current project only | No                       | `~/.claude.json`            |
| [Project](#project-scope) | Current project only | Yes, via version control | `.mcp.json` in project root |
| [User](#user-scope)       | All your projects    | No                       | `~/.claude.json`            |

### Local scope

Local scope is the default. A local-scoped server loads only in the project where you added it and stays private to you. Claude Code stores it in `~/.claude.json` under that project's path, so the same server won't appear in your other projects. Use local scope for personal development servers, experimental configurations, or servers with credentials you don't want in version control.

<Note>
  The term "local scope" for MCP servers differs from general local settings. MCP local-scoped servers are stored in `~/.claude.json` (your home directory), while general local settings use `.claude/settings.local.json` (in the project directory). See [Settings](/docs/en/settings#settings-files) for details on settings file locations.
</Note>

```bash theme={null}
# Add a local-scoped server (default)
claude mcp add --transport http stripe https://mcp.stripe.com

# Explicitly specify local scope
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
```

The command writes the server into the entry for your current project inside `~/.claude.json`. The example below shows the result when you run it from `/path/to/your/project`:

```json theme={null}
{
  "projects": {
    "/path/to/your/project": {
      "mcpServers": {
        "stripe": {
          "type": "http",
          "url": "https://mcp.stripe.com"
        }
      }
    }
  }
}
```

### Project scope

Project-scoped servers enable team collaboration by storing configurations in a `.mcp.json` file at your project's root directory. This file is designed to be checked into version control, ensuring all team members have access to the same MCP tools and services. When you add a project-scoped server, Claude Code automatically creates or updates this file with the appropriate configuration structure.

```bash theme={null}
# Add a project-scoped server
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

The resulting `.mcp.json` file follows a standardized format:

```json theme={null}
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    }
  }
}
```

For security reasons, Claude Code prompts for approval before using project-scoped servers from `.mcp.json` files. If you need to reset these approval choices, use the `claude mcp reset-project-choices` command.

### User scope

User-scoped servers are stored in `~/.claude.json` and provide cross-project accessibility, making them available across all projects on your machine while remaining private to your user account. This scope works well for personal utility servers, development tools, or services you frequently use across different projects.

```bash theme={null}
# Add a user server
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### Scope hierarchy and precedence

When the same server is defined in more than one place, Claude Code connects to it once, using the definition from the highest-precedence source. The entire server entry from that source is used; fields are not merged across scopes.

1. Local scope
2. Project scope
3. User scope
4. [Plugin-provided servers](/docs/en/plugins)
5. [claude.ai connectors](#use-mcp-servers-from-claude-ai)

The three scopes match duplicates by name. Plugins and connectors match by endpoint, so one that points at the same URL or command as a server above is treated as a duplicate.

### Environment variable expansion in `.mcp.json`

Claude Code supports environment variable expansion in `.mcp.json` files, allowing teams to share configurations while maintaining flexibility for machine-specific paths and sensitive values like API keys.

**Supported syntax:**

* `${VAR}` - Expands to the value of environment variable `VAR`
* `${VAR:-default}` - Expands to `VAR` if set, otherwise uses `default`

**Expansion locations:**
Environment variables can be expanded in:

* `command` - The server executable path
* `args` - Command-line arguments
* `env` - Environment variables passed to the server
* `url` - For HTTP server types
* `headers` - For HTTP server authentication

**Example with variable expansion:**

```json theme={null}
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

If a required environment variable is not set and has no default value, Claude Code will fail to parse the config.

## Practical examples

### Example: Monitor errors with Sentry

```bash theme={null}
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

Authenticate with your Sentry account:

```text theme={null}
/mcp
```

Then debug production issues:

```text theme={null}
What are the most common errors in the last 24 hours?
```

```text theme={null}
Show me the stack trace for error ID abc123
```

```text theme={null}
Which deployment introduced these new errors?
```

### Example: Connect to GitHub for code reviews

GitHub's remote MCP server authenticates with a GitHub personal access token passed as a header. To get one, open your [GitHub token settings](https://github.com/settings/personal-access-tokens), generate a new fine-grained token with access to the repositories you want Claude to work with, then add the server:

```bash theme={null}
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer YOUR_GITHUB_PAT"
```

Then work with GitHub:

```text theme={null}
Review PR #456 and suggest improvements
```

```text theme={null}
Create a new issue for the bug we just found
```

```text theme={null}
Show me all open PRs assigned to me
```

### Example: Query your PostgreSQL database

```bash theme={null}
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"
```

Then query your database naturally:

```text theme={null}
What's our total revenue this month?
```

```text theme={null}
Show me the schema for the orders table
```

```text theme={null}
Find customers who haven't made a purchase in 90 days
```

## Authenticate with remote MCP servers

Many cloud-based MCP servers require authentication. Claude Code supports OAuth 2.0 for secure connections.

Claude Code marks a remote server as needing authentication when the server responds with `401 Unauthorized` or `403 Forbidden`. Either status code flags the server in `/mcp` so you can complete the OAuth flow. A custom server that returns a `WWW-Authenticate` header pointing to its authorization server gets the same automatic discovery as any other remote server.

If you configured `headers.Authorization` for the server and the server rejects that header, Claude Code reports the connection as failed instead of falling back to OAuth. Check that the token is valid for the MCP endpoint, or remove the header to use the OAuth flow.

<Steps>
  <Step title="Add the server that requires authentication">
    For example:

    ```bash theme={null}
    claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
    ```
  </Step>

  <Step title="Use the /mcp command within Claude Code">
    In Claude code, use the command:

    ```text theme={null}
    /mcp
    ```

    Then follow the steps in your browser to login.
  </Step>
</Steps>

<Tip>
  Tips:

  * Authentication tokens are stored securely and refreshed automatically
  * Use "Clear authentication" in the `/mcp` menu to revoke access
  * If your browser doesn't open automatically, copy the provided URL and open it manually
  * If the browser redirect fails with a connection error after authenticating, paste the full callback URL from your browser's address bar into the URL prompt that appears in Claude Code
  * OAuth authentication works with HTTP servers
</Tip>

### Use a fixed OAuth callback port

Some MCP servers require a specific redirect URI registered in advance. By default, Claude Code picks a random available port for the OAuth callback. Use `--callback-port` to fix the port so it matches a pre-registered redirect URI of the form `http://localhost:PORT/callback`.

You can use `--callback-port` on its own (with dynamic client registration) or together with `--client-id` (with pre-configured credentials).

```bash theme={null}
# Fixed callback port with dynamic client registration
claude mcp add --transport http \
  --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

### Use pre-configured OAuth credentials

Some MCP servers don't support automatic OAuth setup via Dynamic Client Registration. If you see an error like "Incompatible auth server: does not support dynamic client registration," the server requires pre-configured credentials. Claude Code also supports servers that use a Client ID Metadata Document (CIMD) instead of Dynamic Client Registration, and discovers these automatically. If automatic discovery fails, register an OAuth app through the server's developer portal first, then provide the credentials when adding the server.

<Steps>
  <Step title="Register an OAuth app with the server">
    Create an app through the server's developer portal and note your client ID and client secret.

    Many servers also require a redirect URI. If so, choose a port and register a redirect URI in the format `http://localhost:PORT/callback`. Use that same port with `--callback-port` in the next step.
  </Step>

  <Step title="Add the server with your credentials">
    Choose one of the following methods. The port used for `--callback-port` can be any available port. It just needs to match the redirect URI you registered in the previous step.

    <Tabs>
      <Tab title="claude mcp add">
        Use `--client-id` to pass your app's client ID. The `--client-secret` flag prompts for the secret with masked input:

        ```bash theme={null}
        claude mcp add --transport http \
          --client-id your-client-id --client-secret --callback-port 8080 \
          my-server https://mcp.example.com/mcp
        ```
      </Tab>

      <Tab title="claude mcp add-json">
        Include the `oauth` object in the JSON config and pass `--client-secret` as a separate flag:

        ```bash theme={null}
        claude mcp add-json my-server \
          '{"type":"http","url":"https://mcp.example.com/mcp","oauth":{"clientId":"your-client-id","callbackPort":8080}}' \
          --client-secret
        ```
      </Tab>

      <Tab title="claude mcp add-json (callback port only)">
        Use `--callback-port` without a client ID to fix the port while using dynamic client registration:

        ```bash theme={null}
        claude mcp add-json my-server \
          '{"type":"http","url":"https://mcp.example.com/mcp","oauth":{"callbackPort":8080}}'
        ```
      </Tab>

      <Tab title="CI / env var">
        Set the secret via environment variable to skip the interactive prompt:

        ```bash theme={null}
        MCP_CLIENT_SECRET=your-secret claude mcp add --transport http \
          --client-id your-client-id --client-secret --callback-port 8080 \
          my-server https://mcp.example.com/mcp
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Authenticate in Claude Code">
    Run `/mcp` in Claude Code and follow the browser login flow.
  </Step>
</Steps>

<Tip>
  Tips:

  * The client secret is stored securely in your system keychain (macOS) or a credentials file, not in your config
  * If the server uses a public OAuth client with no secret, use only `--client-id` without `--client-secret`
  * `--callback-port` can be used with or without `--client-id`
  * These flags only apply to HTTP and SSE transports. They have no effect on stdio servers
  * Use `claude mcp get <name>` to verify that OAuth credentials are configured for a server
</Tip>

### Override OAuth metadata discovery

Point Claude Code at a specific OAuth authorization server metadata URL to bypass the default discovery chain. Set `authServerMetadataUrl` when the MCP server's standard endpoints error, or when you want to route discovery through an internal proxy. By default, Claude Code first checks RFC 9728 Protected Resource Metadata at `/.well-known/oauth-protected-resource`, then falls back to RFC 8414 authorization server metadata at `/.well-known/oauth-authorization-server`.

Set `authServerMetadataUrl` in the `oauth` object of your server's config in `.mcp.json`:

```json theme={null}
{
  "mcpServers": {
    "my-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "authServerMetadataUrl": "https://auth.example.com/.well-known/openid-configuration"
      }
    }
  }
}
```

The URL must use `https://`. `authServerMetadataUrl` requires Claude Code v2.1.64 or later. The metadata URL's `scopes_supported` overrides the scopes the upstream server advertises.

### Restrict OAuth scopes

Set `oauth.scopes` to pin the scopes Claude Code requests during the authorization flow. This is the supported way to restrict an MCP server to a security-team-approved subset when the upstream authorization server advertises more scopes than you want to grant. The value is a single space-separated string, matching the `scope` parameter format in RFC 6749 §3.3.

```json theme={null}
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://mcp.slack.com/mcp",
      "oauth": {
        "scopes": "channels:read chat:write search:read"
      }
    }
  }
}
```

`oauth.scopes` takes precedence over both `authServerMetadataUrl` and the scopes the server discovers at `/.well-known`. Leave it unset to let the MCP server determine the requested scope set.

If the authorization server advertises `offline_access` in `scopes_supported`, Claude Code appends it to the pinned scopes so the access token can be refreshed without a new browser sign-in.

If the server later returns a 403 `insufficient_scope` for a tool call, Claude Code re-authenticates with the same pinned scopes. Widen `oauth.scopes` when a tool you need requires a scope outside the pin.

### Use dynamic headers for custom authentication

If your MCP server uses an authentication scheme other than OAuth (such as Kerberos, short-lived tokens, or an internal SSO), use `headersHelper` to generate request headers at connection time. Claude Code runs the command and merges its output into the connection headers.

```json theme={null}
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "/opt/bin/get-mcp-auth-headers.sh"
    }
  }
}
```

The command can also be inline:

```json theme={null}
{
  "mcpServers": {
    "internal-api": {
      "type": "http",
      "url": "https://mcp.internal.example.com",
      "headersHelper": "echo '{\"Authorization\": \"Bearer '\"$(get-token)\"'\"}'"
    }
  }
}
```

**Requirements:**

* The command must write a JSON object of string key-value pairs to stdout
* The command runs in a shell with a 10-second timeout
* Dynamic headers override any static `headers` with the same name

The helper runs fresh on each connection (at session start and on reconnect). There is no caching, so your script is responsible for any token reuse.

Claude Code sets these environment variables when executing the helper:

| Variable                      | Value                      |
| :---------------------------- | :------------------------- |
| `CLAUDE_CODE_MCP_SERVER_NAME` | the name of the MCP server |
| `CLAUDE_CODE_MCP_SERVER_URL`  | the URL of the MCP server  |

Use these to write a single helper script that serves multiple MCP servers.

<Note>
  `headersHelper` executes arbitrary shell commands. When defined at project or local scope, it only runs after you accept the workspace trust dialog.
</Note>

## Add MCP servers from JSON configuration

If you have a JSON configuration for an MCP server, you can add it directly:

<Steps>
  <Step title="Add an MCP server from JSON">
    ```bash theme={null}
    # Basic syntax
    claude mcp add-json <name> '<json>'

    # Example: Adding an HTTP server with JSON configuration
    claude mcp add-json weather-api '{"type":"http","url":"https://api.weather.com/mcp","headers":{"Authorization":"Bearer token"}}'

    # Example: Adding a stdio server with JSON configuration
    claude mcp add-json local-weather '{"type":"stdio","command":"/path/to/weather-cli","args":["--api-key","abc123"],"env":{"CACHE_DIR":"/tmp"}}'

    # Example: Adding an HTTP server with pre-configured OAuth credentials
    claude mcp add-json my-server '{"type":"http","url":"https://mcp.example.com/mcp","oauth":{"clientId":"your-client-id","callbackPort":8080}}' --client-secret
    ```
  </Step>

  <Step title="Verify the server was added">
    ```bash theme={null}
    claude mcp get weather-api
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Make sure the JSON is properly escaped in your shell
  * The JSON must conform to the MCP server configuration schema
  * You can use `--scope user` to add the server to your user configuration instead of the project-specific one
</Tip>

## Import MCP servers from Claude Desktop

If you've already configured MCP servers in Claude Desktop, you can import them:

<Steps>
  <Step title="Import servers from Claude Desktop">
    ```bash theme={null}
    # Basic syntax 
    claude mcp add-from-claude-desktop 
    ```
  </Step>

  <Step title="Select which servers to import">
    After running the command, you'll see an interactive dialog that allows you to select which servers you want to import.
  </Step>

  <Step title="Verify the servers were imported">
    ```bash theme={null}
    claude mcp list 
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * This feature only works on macOS and Windows Subsystem for Linux (WSL)
  * It reads the Claude Desktop configuration file from its standard location on those platforms
  * Use the `--scope user` flag to add servers to your user configuration
  * Imported servers will have the same names as in Claude Desktop
  * If servers with the same names already exist, they will get a numerical suffix (for example, `server_1`)
</Tip>

## Use MCP servers from Claude.ai

If you've logged into Claude Code with a [Claude.ai](https://claude.ai) account, MCP servers you've added in Claude.ai are automatically available in Claude Code:

<Steps>
  <Step title="Configure MCP servers in Claude.ai">
    Add servers at [claude.ai/customize/connectors](https://claude.ai/customize/connectors). On Team and Enterprise plans, only admins can add servers.
  </Step>

  <Step title="Authenticate the MCP server">
    Complete any required authentication steps in Claude.ai.
  </Step>

  <Step title="View and manage servers in Claude Code">
    In Claude Code, use the command:

    ```text theme={null}
    /mcp
    ```

    Claude.ai servers appear in the list with indicators showing they come from Claude.ai.
  </Step>
</Steps>

Claude.ai connectors are fetched only when your active [authentication method](/docs/en/authentication#authentication-precedence) is your Claude.ai subscription. They are not loaded when `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `apiKeyHelper`, or a third-party provider such as Bedrock or Vertex is active, even if you previously ran `/login`. If `/mcp` does not list a connector you added, run `/status` to confirm which authentication method is active, unset that environment variable or remove the `apiKeyHelper` setting, then run `/login` to select your Claude.ai account.

A server you've added in Claude Code takes [precedence](#scope-hierarchy-and-precedence) over a claude.ai connector that points at the same URL. When this happens, `/mcp` lists the connector as hidden and shows how to remove the duplicate if you'd rather use the connector.

To disable claude.ai MCP servers in Claude Code, set the `ENABLE_CLAUDEAI_MCP_SERVERS` environment variable to `false`:

```bash theme={null}
ENABLE_CLAUDEAI_MCP_SERVERS=false claude
```

## Use Claude Code as an MCP server

You can use Claude Code itself as an MCP server that other applications can connect to:

```bash theme={null}
# Start Claude as a stdio MCP server
claude mcp serve
```

You can use this in Claude Desktop by adding this configuration to claude\_desktop\_config.json:

```json theme={null}
{
  "mcpServers": {
    "claude-code": {
      "type": "stdio",
      "command": "claude",
      "args": ["mcp", "serve"],
      "env": {}
    }
  }
}
```

<Warning>
  **Configuring the executable path**: The `command` field must reference the Claude Code executable. If the `claude` command is not in your system's PATH, you'll need to specify the full path to the executable.

  To find the full path:

  ```bash theme={null}
  which claude
  ```

  Then use the full path in your configuration:

  ```json theme={null}
  {
    "mcpServers": {
      "claude-code": {
        "type": "stdio",
        "command": "/full/path/to/claude",
        "args": ["mcp", "serve"],
        "env": {}
      }
    }
  }
  ```

  Without the correct executable path, you'll encounter errors like `spawn claude ENOENT`.
</Warning>

<Tip>
  Tips:

  * The server provides access to Claude's tools like View, Edit, LS, etc.
  * In Claude Desktop, try asking Claude to read files in a directory, make edits, and more.
  * Note that this MCP server is only exposing Claude Code's tools to your MCP client, so your own client is responsible for implementing user confirmation for individual tool calls.
</Tip>

## MCP output limits and warnings

When MCP tools produce large outputs, Claude Code helps manage the token usage to prevent overwhelming your conversation context:

* **Output warning threshold**: Claude Code displays a warning when any MCP tool output exceeds 10,000 tokens
* **Configurable limit**: you can adjust the maximum allowed MCP output tokens using the `MAX_MCP_OUTPUT_TOKENS` environment variable
* **Default limit**: the default maximum is 25,000 tokens
* **Scope**: the environment variable applies to tools that don't declare their own limit. Tools that set [`anthropic/maxResultSizeChars`](#raise-the-limit-for-a-specific-tool) use that value instead for text content, regardless of what `MAX_MCP_OUTPUT_TOKENS` is set to. Tools that return image data are still subject to `MAX_MCP_OUTPUT_TOKENS`

To increase the limit for tools that produce large outputs:

```bash theme={null}
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

This is particularly useful when working with MCP servers that:

* Query large datasets or databases
* Generate detailed reports or documentation
* Process extensive log files or debugging information

### Raise the limit for a specific tool

If you're building an MCP server, you can allow individual tools to return results larger than the default persist-to-disk threshold by setting `_meta["anthropic/maxResultSizeChars"]` in the tool's `tools/list` response entry. Claude Code raises that tool's threshold to the annotated value, up to a hard ceiling of 500,000 characters.

This is useful for tools that return inherently large but necessary outputs, such as database schemas or full file trees. Without the annotation, results that exceed the default threshold are persisted to disk and replaced with a file reference in the conversation.

```json theme={null}
{
  "name": "get_schema",
  "description": "Returns the full database schema",
  "_meta": {
    "anthropic/maxResultSizeChars": 200000
  }
}
```

The annotation applies independently of `MAX_MCP_OUTPUT_TOKENS` for text content, so users don't need to raise the environment variable for tools that declare it. Tools that return image data are still subject to the token limit.

<Warning>
  If you frequently encounter output warnings with specific MCP servers you don't control, consider increasing the `MAX_MCP_OUTPUT_TOKENS` limit. You can also ask the server author to add the `anthropic/maxResultSizeChars` annotation or to paginate their responses. The annotation has no effect on tools that return image content; for those, raising `MAX_MCP_OUTPUT_TOKENS` is the only option.
</Warning>

## Respond to MCP elicitation requests

MCP servers can request structured input from you mid-task using elicitation. When a server needs information it can't get on its own, Claude Code displays an interactive dialog and passes your response back to the server. No configuration is required on your side: elicitation dialogs appear automatically when a server requests them.

Servers can request input in two ways:

* **Form mode**: Claude Code shows a dialog with form fields defined by the server (for example, a username and password prompt). Fill in the fields and submit.
* **URL mode**: Claude Code opens a browser URL for authentication or approval. Complete the flow in the browser, then confirm in the CLI.

To auto-respond to elicitation requests without showing a dialog, use the [`Elicitation` hook](/docs/en/hooks#elicitation).

If you're building an MCP server that uses elicitation, see the [MCP elicitation specification](https://modelcontextprotocol.io/docs/learn/client-concepts#elicitation) for protocol details and schema examples.

## Use MCP resources

MCP servers can expose resources that you can reference using @ mentions, similar to how you reference files.

### Reference MCP resources

<Steps>
  <Step title="List available resources">
    Type `@` in your prompt to see available resources from all connected MCP servers. Resources appear alongside files in the autocomplete menu.
  </Step>

  <Step title="Reference a specific resource">
    Use the format `@server:protocol://resource/path` to reference a resource:

    ```text theme={null}
    Can you analyze @github:issue://123 and suggest a fix?
    ```

    ```text theme={null}
    Please review the API documentation at @docs:file://api/authentication
    ```
  </Step>

  <Step title="Multiple resource references">
    You can reference multiple resources in a single prompt:

    ```text theme={null}
    Compare @postgres:schema://users with @docs:file://database/user-model
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Resources are automatically fetched and included as attachments when referenced
  * Resource paths are fuzzy-searchable in the @ mention autocomplete
  * Claude Code automatically provides tools to list and read MCP resources when servers support them
  * Resources can contain any type of content that the MCP server provides (text, JSON, structured data, etc.)
</Tip>

## Scale with MCP Tool Search

Tool search keeps MCP context usage low by deferring tool definitions until Claude needs them. Only tool names load at session start, so adding more MCP servers has minimal impact on your context window.

### How it works

Tool search is enabled by default. MCP tools are deferred rather than loaded into context upfront, and Claude uses a search tool to discover relevant ones when a task needs them. Only the tools Claude actually uses enter context. From your perspective, MCP tools work exactly as before.

If you prefer threshold-based loading, set `ENABLE_TOOL_SEARCH=auto` to load schemas upfront when they fit within 10% of the context window and defer only the overflow. See [Configure tool search](#configure-tool-search) for all options.

### For MCP server authors

If you're building an MCP server, the server instructions field becomes more useful with Tool Search enabled. Server instructions help Claude understand when to search for your tools, similar to how [skills](/docs/en/skills) work.

Add clear, descriptive server instructions that explain:

* What category of tasks your tools handle
* When Claude should search for your tools
* Key capabilities your server provides

Claude Code truncates tool descriptions and server instructions at 2KB each. Keep them concise to avoid truncation, and put critical details near the start.

### Configure tool search

Tool search is enabled by default: MCP tools are deferred and discovered on demand. Claude Code disables it by default on Vertex AI. It is also disabled when `ANTHROPIC_BASE_URL` points to a non-first-party host, since most proxies do not forward `tool_reference` blocks. Set `ENABLE_TOOL_SEARCH` explicitly to override either fallback.

Tool search requires a model that supports `tool_reference` blocks: Sonnet 4 and later, or Opus 4 and later. Haiku models do not support it. On Vertex AI, tool search is supported for Claude Sonnet 4.5 and later and Claude Opus 4.5 and later.

Control tool search behavior with the `ENABLE_TOOL_SEARCH` environment variable:

| Value    | Behavior                                                                                                                                                                                                                          |
| :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (unset)  | All MCP tools deferred and loaded on demand. Falls back to loading upfront on Vertex AI or when `ANTHROPIC_BASE_URL` is a non-first-party host                                                                                    |
| `true`   | All MCP tools deferred. Claude Code sends the beta header even on Vertex AI and through proxies. Requests fail on Vertex AI models earlier than Sonnet 4.5 or Opus 4.5, or on proxies that do not support `tool_reference` blocks |
| `auto`   | Threshold mode: tools load upfront if they fit within 10% of the context window, deferred otherwise                                                                                                                               |
| `auto:N` | Threshold mode with a custom percentage, where `N` is 0-100. For example, `auto:5` for 5%                                                                                                                                         |
| `false`  | All MCP tools loaded upfront, no deferral                                                                                                                                                                                         |

```bash theme={null}
# Use a custom 5% threshold
ENABLE_TOOL_SEARCH=auto:5 claude

# Disable tool search entirely
ENABLE_TOOL_SEARCH=false claude
```

Or set the value in your [settings.json `env` field](/docs/en/settings#available-settings).

You can also disable the `ToolSearch` tool specifically:

```json theme={null}
{
  "permissions": {
    "deny": ["ToolSearch"]
  }
}
```

### Exempt a server from deferral

If a server's tools should always be visible to Claude without a search step, set `alwaysLoad` to `true` in that server's configuration. Every tool from that server then loads into context at session start regardless of the `ENABLE_TOOL_SEARCH` setting. Use this for a small number of tools that Claude needs on every turn, since each upfront tool consumes context that would otherwise be available for your conversation.

The following `.mcp.json` entry exempts one HTTP server while leaving other servers deferred:

```json theme={null}
{
  "mcpServers": {
    "core-tools": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "alwaysLoad": true
    }
  }
}
```

The `alwaysLoad` field is available on all server types and requires Claude Code v2.1.121 or later. An MCP server can also mark individual tools as always-loaded by including `"anthropic/alwaysLoad": true` in the tool's `_meta` object, which has the same effect for that tool only.

Setting `alwaysLoad: true` also blocks startup until the server connects, capped at the standard 5-second connect timeout. This applies even though MCP startup is otherwise [non-blocking by default](/docs/en/env-vars), since the tools must be present when the first prompt is built. Other servers continue to connect in the background.

## Use MCP prompts as commands

MCP servers can expose prompts that become available as commands in Claude Code.

### Execute MCP prompts

<Steps>
  <Step title="Discover available prompts">
    Type `/` to see all available commands, including those from MCP servers. MCP prompts appear with the format `/mcp__servername__promptname`.
  </Step>

  <Step title="Execute a prompt without arguments">
    ```text theme={null}
    /mcp__github__list_prs
    ```
  </Step>

  <Step title="Execute a prompt with arguments">
    Many prompts accept arguments. Pass them space-separated after the command:

    ```text theme={null}
    /mcp__github__pr_review 456
    ```

    ```text theme={null}
    /mcp__jira__create_issue "Bug in login flow" high
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * MCP prompts are dynamically discovered from connected servers
  * Arguments are parsed based on the prompt's defined parameters
  * Prompt results are injected directly into the conversation
  * Server and prompt names are normalized (spaces become underscores)
</Tip>

## Managed MCP configuration

For organizations that need centralized control over which MCP servers users can connect to, see [Managed MCP configuration](/docs/en/managed-mcp). It covers deploying a fixed server set with `managed-mcp.json`, restricting servers with `allowedMcpServers` and `deniedMcpServers`, and what users see when a server is blocked.


---

## Control MCP server access for your organization

`https://code.claude.com/docs/en/managed-mcp`

Restrict which MCP servers users can add or connect to with managed configuration files, allowlists, and denylists.

By default, anyone running Claude Code can connect any [MCP server](/docs/en/mcp) they choose. Anthropic reviews connectors against its [listing criteria](https://claude.com/docs/connectors/building/review-criteria) before adding them to the [Anthropic Directory](https://claude.ai/directory), but doesn't security-audit or manage any MCP server. As an administrator, you can restrict which servers run in your organization, from deploying a fixed approved set to disabling MCP entirely.

This page covers how to:

* [Choose a pattern](#choose-a-pattern) that matches how much control you need
* [Deploy a fixed server set with `managed-mcp.json`](#exclusive-control-with-managed-mcp-json), including how to [disable MCP entirely](#disable-mcp-entirely)
* [Control servers with allowlists and denylists](#policy-based-control-with-allowlists-and-denylists)
* [Tell users what to expect](#how-restrictions-appear-to-users) when a restriction blocks a server
* [Monitor which servers your organization actually uses](#monitor-mcp-usage)

<Note>
  The [Security](/docs/en/security) page covers the MCP threat model and how to evaluate a server before approving it. [Decide what to enforce](/docs/en/admin-setup#decide-what-to-enforce) covers MCP restrictions alongside the other administrative controls.
</Note>

## Choose a pattern

Claude Code supports a range of restriction levels. Each pattern uses one or both of the mechanisms covered below: `managed-mcp.json` for deploying a fixed set, and `allowedMcpServers`/`deniedMcpServers` for filtering what users configure.

| Pattern                 | What it does                                                                               | Configure                                                                                            |
| :---------------------- | :----------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Disable MCP**         | No servers load anywhere                                                                   | `managed-mcp.json` with an empty server map                                                          |
| **Fixed deployment**    | Every user gets the same servers and can't add others                                      | `managed-mcp.json` with the servers you want                                                         |
| **Approved catalog**    | Publish a list of approved servers; users add the ones they want, anything else is blocked | `allowedMcpServers` + `allowManagedMcpServersOnly: true`                                             |
| **Plugin servers only** | Servers can only come from plugins; users can't add their own                              | [`strictPluginOnlyCustomization`](/docs/en/settings#strictpluginonlycustomization) with `mcp` in the list |
| **Soft allowlist**      | Enforce an allowlist that users can broaden in their own settings                          | `allowedMcpServers` without `allowManagedMcpServersOnly`                                             |
| **Denylist only**       | Block known-bad servers, allow everything else                                             | `deniedMcpServers`                                                                                   |
| **No restrictions**     | Users add anything                                                                         | Don't deploy any managed MCP configuration                                                           |

<Note>
  Claude Code doesn't have a built-in MCP server registry that users can browse and install from. For the approved-catalog pattern, share the approved list and its `claude mcp add` commands somewhere your users will find them, such as an internal wiki, or distribute the servers as plugins through a [managed plugin marketplace](/docs/en/plugin-marketplaces#managed-marketplace-restrictions) so users can browse and install them from `/plugin`.
</Note>

## Exclusive control with managed-mcp.json

If you deploy a `managed-mcp.json` file, Claude Code loads only the servers that file defines. Users cannot add, modify, or use any other MCP servers, including plugin-provided servers. The file also suppresses claude.ai connectors unless you [allow them alongside the managed set](#allow-claude-ai-connectors-alongside-the-managed-set).

Two other settings can further filter the managed set:

* `allowedMcpServers` and `deniedMcpServers` apply to managed servers too, so a managed server that doesn't pass them won't load.
* A user's own `deniedMcpServers` merges in from their settings, so users can block a managed server for themselves.

See [How a server is evaluated](#how-a-server-is-evaluated) for the full order of checks.

`managed-mcp.json` is a standalone file, so it cannot be delivered through [server-managed settings](/docs/en/server-managed-settings). Any process that can write to a system path with administrator privileges can deploy it. At scale, that's usually through device management tooling, such as Jamf or a configuration profile on macOS, Group Policy or Intune on Windows, or your fleet management of choice on Linux. Claude Code looks for the file at one of these paths:

| Platform      | Path                                                       |
| :------------ | :--------------------------------------------------------- |
| macOS         | `/Library/Application Support/ClaudeCode/managed-mcp.json` |
| Linux and WSL | `/etc/claude-code/managed-mcp.json`                        |
| Windows       | `C:\Program Files\ClaudeCode\managed-mcp.json`             |

The file uses the same format as a project [`.mcp.json`](/docs/en/mcp#project-scope) file:

```json theme={null}
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    },
    "company-internal": {
      "type": "stdio",
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp-config.json"],
      "env": {
        "COMPANY_API_URL": "https://internal.example.com"
      }
    }
  }
}
```

### Authenticate with per-user credentials

Any user on the machine can read this file, so don't store API keys or other credentials in `env` blocks. Pass per-user credentials with one of these instead:

* [`${VAR}` expansion](/docs/en/mcp#environment-variable-expansion-in-mcp-json) to read secrets from each user's environment.
* [OAuth or per-user headers](/docs/en/mcp#authenticate-with-remote-mcp-servers) so each user authenticates as themselves.
* [`headersHelper`](/docs/en/mcp#use-dynamic-headers-for-custom-authentication) to generate credentials at connection time.

### Validate the configuration

To confirm the file is in effect, run two checks on a managed machine:

1. `claude mcp list` shows only the servers in `managed-mcp.json`. If a user's own servers still appear, the file isn't being read; check the path and permissions.
2. `claude mcp add --transport http test https://example.com/mcp` fails with `Cannot add MCP server: enterprise MCP configuration is active and has exclusive control over MCP servers`. The URL doesn't need to be a real server, since the policy check rejects the command before anything is contacted.

### Disable MCP entirely

Deploy a `managed-mcp.json` containing an empty server map to block every MCP server:

```json theme={null}
{
  "mcpServers": {}
}
```

Users see no MCP servers in `/mcp`, and `claude mcp add` fails with the enterprise-policy error above. Servers users had previously configured stop loading the next time they start a session, with no warning that policy is the reason.

### Allow claude.ai connectors alongside the managed set

Deploying `managed-mcp.json` suppresses [claude.ai connectors](/docs/en/mcp#use-mcp-servers-from-claude-ai) by default, including connectors an administrator configured for the organization in the claude.ai admin console. To load those connectors alongside the servers in `managed-mcp.json`, set `"allowAllClaudeAiMcps": true` in a [managed settings source](/docs/en/admin-setup#decide-how-settings-reach-devices). Requires Claude Code v2.1.149 or later.

With the setting enabled, Claude Code loads the same claude.ai connectors it would load if `managed-mcp.json` were not deployed. [Allowlists and denylists](#policy-based-control-with-allowlists-and-denylists) still apply to those connectors, so you can block specific ones with `deniedMcpServers`. The setting affects only claude.ai connectors; plugin-provided servers stay suppressed.

Claude Code reads this setting only from admin-controlled policy tiers: server-managed settings, an MDM-deployed plist or HKLM registry key, or a system `managed-settings.json` file. Placing it in user or project settings has no effect, so users cannot re-enable connectors that exclusive control suppressed.

## Policy-based control with allowlists and denylists

Allowlists and denylists filter which configured servers are allowed to load. They aren't a registry: a server still has to be added by a user, a plugin, or `managed-mcp.json` before the allowlist or denylist applies to it. To deploy servers to users, use [`managed-mcp.json`](#exclusive-control-with-managed-mcp-json).

To make the allowlist authoritative, set `allowedMcpServers` and `allowManagedMcpServersOnly: true` together in a [managed settings source](/docs/en/admin-setup#decide-how-settings-reach-devices), such as server-managed settings or a deployed `managed-settings.json` file. [Restrict the allowlist to managed settings only](#restrict-the-allowlist-to-managed-settings-only) shows the configuration. Without `allowManagedMcpServersOnly`, allowlists from every settings source merge, including a user's own `~/.claude/settings.json`, so a user can broaden what your allowlist permits. Denylists merge from every source regardless.

<Note>
  `allowManagedMcpServersOnly` is separate from `allowManagedPermissionRulesOnly`, which locks down [permission rules](/docs/en/permissions#managed-settings) only. Setting that flag does not enforce the MCP allowlist.
</Note>

### Match servers by URL, command, or name

`allowedMcpServers` and `deniedMcpServers` are lists of entries. Each entry is an object with a single key that identifies servers by their URL, their command, or their name:

| Key             | Matches                                                               | Use for                                |
| :-------------- | :-------------------------------------------------------------------- | :------------------------------------- |
| `serverUrl`     | A remote server URL, exact or with `*` wildcards                      | HTTP and SSE servers                   |
| `serverCommand` | The exact command and arguments that start a stdio server             | Stdio servers                          |
| `serverName`    | The user-assigned label. Exact match only; wildcards are not expanded | Either type, but see the Warning below |

Leaving `allowedMcpServers` unset is different from setting it to an empty array:

| Setting             | Unset (default)     | Empty array `[]`   | Populated                     |
| :------------------ | :------------------ | :----------------- | :---------------------------- |
| `allowedMcpServers` | All servers allowed | No servers allowed | Only matching servers allowed |
| `deniedMcpServers`  | No servers blocked  | No servers blocked | Matching servers blocked      |

<Warning>
  An allowlist that uses only `serverName` entries is not a security control. The name is the label a user assigns when running `claude mcp add` or editing a config file, not the underlying server, so a user can call any server `github`. To enforce which servers actually run, add `serverCommand` or `serverUrl` entries.
</Warning>

### How a server is evaluated

Before loading a server, including one from `managed-mcp.json`, Claude Code runs three checks in order:

1. **Merge the lists.** Allowlist and denylist entries from every settings source combine into one allowlist and one denylist. When `allowManagedMcpServersOnly` is `true`, only the managed allowlist is kept; the denylist always merges from every source.
2. **Check the denylist.** A server that matches any denylist entry, by URL, command, or name, is blocked. Nothing overrides a denylist match.
3. **Check the allowlist.** If `allowedMcpServers` isn't set anywhere, every server that passed the denylist loads. If it is set, what the server must match depends on its type, shown in the table below.

| Server type          | Allowed when it matches                                                                                          |
| :------------------- | :--------------------------------------------------------------------------------------------------------------- |
| Remote (HTTP or SSE) | A `serverUrl` entry. A `serverName` match counts only when the allowlist contains no `serverUrl` entries         |
| Stdio                | A `serverCommand` entry. A `serverName` match counts only when the allowlist contains no `serverCommand` entries |

Two matching rules apply inside those checks:

* **Commands match exactly.** Every argument, in order. `["npx", "-y", "server"]` does not match `["npx", "server"]` or `["npx", "-y", "server", "--flag"]`.
* **URLs support `*` wildcards** anywhere in the pattern, including the scheme. Hostname matching is case-insensitive and ignores a trailing FQDN dot, so `https://Mcp.Example.com/*` matches `https://mcp.example.com/api`. Paths stay case-sensitive.

| Pattern                     | Allows                                                                 |
| :-------------------------- | :--------------------------------------------------------------------- |
| `https://mcp.example.com/*` | All paths on a specific domain                                         |
| `https://mcp.example.com`   | Also all paths on that domain. A pattern with no path matches any path |
| `https://*.example.com/*`   | Any subdomain of `example.com`                                         |
| `http://localhost:*/*`      | Any port on localhost                                                  |
| `*://mcp.example.com/*`     | Any scheme to a specific domain                                        |

### Example configuration

The configuration below sets up a hard allowlist with a denylist. The highlighted lines change how the rest of the list is evaluated, and the callouts after the block explain each one:

```json {3,5,11} theme={null}
{
  "allowedMcpServers": [
    { "serverUrl": "https://api.githubcopilot.com/*" },
    { "serverUrl": "https://mcp.sentry.dev/*" },
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem", "."] },
    { "serverCommand": ["python", "/usr/local/bin/approved-server.py"] },
    { "serverUrl": "https://mcp.example.com/*" },
    { "serverUrl": "https://*.internal.example.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "dangerous-server" },
    { "serverCommand": ["npx", "-y", "unapproved-package"] },
    { "serverUrl": "https://*.untrusted.example.com/*" }
  ]
}
```

* **Line 3**: the first `serverUrl` entry. Once one exists, every remote server must match a URL pattern, so a user can't get an unlisted remote server through by giving it an allowed name.
* **Line 5**: the first `serverCommand` entry. Same effect for stdio servers, so every local server must match a listed command exactly.
* **Line 11**: a `serverName` entry in the denylist. Denylist entries always apply, so any server named `dangerous-server` is blocked regardless of its URL or command.

A `serverName` entry in this allowlist would never match anything, since both transport types already have stricter entries.

The accordions below walk through how a server is evaluated against other allowlist and denylist combinations.

<Accordion title="URL-only allowlist">
  ```json theme={null}
  {
    "allowedMcpServers": [
      { "serverUrl": "https://mcp.example.com/*" },
      { "serverUrl": "https://*.internal.example.com/*" }
    ]
  }
  ```

  | Server                                                | Result                                       |
  | :---------------------------------------------------- | :------------------------------------------- |
  | HTTP server at `https://mcp.example.com/api`          | Allowed: matches URL pattern                 |
  | HTTP server at `https://api.internal.example.com/mcp` | Allowed: matches wildcard subdomain          |
  | HTTP server at `https://external.example.com/mcp`     | Blocked: doesn't match any URL pattern       |
  | Stdio server with any command                         | Blocked: no name or command entries to match |
</Accordion>

<Accordion title="Command-only allowlist">
  ```json theme={null}
  {
    "allowedMcpServers": [
      { "serverCommand": ["npx", "-y", "approved-package"] }
    ]
  }
  ```

  | Server                                                | Result                            |
  | :---------------------------------------------------- | :-------------------------------- |
  | Stdio server with `["npx", "-y", "approved-package"]` | Allowed: matches command          |
  | Stdio server with `["node", "server.js"]`             | Blocked: doesn't match command    |
  | HTTP server named `my-api`                            | Blocked: no name entries to match |
</Accordion>

<Accordion title="Mixed name and command allowlist">
  ```json theme={null}
  {
    "allowedMcpServers": [
      { "serverName": "github" },
      { "serverCommand": ["npx", "-y", "approved-package"] }
    ]
  }
  ```

  | Server                                                                   | Result                                                                |
  | :----------------------------------------------------------------------- | :-------------------------------------------------------------------- |
  | Stdio server named `local-tool` with `["npx", "-y", "approved-package"]` | Allowed: matches command                                              |
  | Stdio server named `local-tool` with `["node", "server.js"]`             | Blocked: command entries exist but doesn't match                      |
  | Stdio server named `github` with `["node", "server.js"]`                 | Blocked: stdio servers must match commands when command entries exist |
  | HTTP server named `github`                                               | Allowed: matches name                                                 |
  | HTTP server named `other-api`                                            | Blocked: name doesn't match                                           |
</Accordion>

<Accordion title="Name-only allowlist">
  ```json theme={null}
  {
    "allowedMcpServers": [
      { "serverName": "github" },
      { "serverName": "internal-tool" }
    ]
  }
  ```

  | Server                                              | Result                           |
  | :-------------------------------------------------- | :------------------------------- |
  | Stdio server named `github` with any command        | Allowed: no command restrictions |
  | Stdio server named `internal-tool` with any command | Allowed: no command restrictions |
  | HTTP server named `github`                          | Allowed: matches name            |
  | Any server named `other`                            | Blocked: name doesn't match      |
</Accordion>

<Accordion title="Allowlist with denylist override">
  ```json theme={null}
  {
    "allowedMcpServers": [
      { "serverUrl": "https://*.example.com/*" }
    ],
    "deniedMcpServers": [
      { "serverUrl": "https://staging.example.com/*" }
    ]
  }
  ```

  | Server                                           | Result                                                    |
  | :----------------------------------------------- | :-------------------------------------------------------- |
  | HTTP server at `https://mcp.example.com/api`     | Allowed: matches allowlist URL pattern, no denylist match |
  | HTTP server at `https://staging.example.com/api` | Blocked: matches both, but the denylist takes precedence  |
  | HTTP server at `https://other.com/mcp`           | Blocked: doesn't match the allowlist                      |
</Accordion>

### Restrict the allowlist to managed settings only

To make the managed allowlist the only one that applies, set `allowManagedMcpServersOnly` in the managed settings file:

```json theme={null}
{
  "allowManagedMcpServersOnly": true,
  "allowedMcpServers": [
    { "serverUrl": "https://api.githubcopilot.com/*" },
    { "serverUrl": "https://*.internal.example.com/*" }
  ]
}
```

When `allowManagedMcpServersOnly` is `true`, allowlists from user, project, and local settings are ignored. The denylist still merges from all sources, so users can always block servers for themselves.

## How restrictions appear to users

When a restriction blocks a server, the user either sees an error from `claude mcp add` or the server silently stops loading. Use this table to recognize those reports and to tell users what to expect before you roll out a change:

| Restriction                                                          | What the user sees                                                                                         |
| :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `managed-mcp.json` is present and the user runs `claude mcp add`     | `Cannot add MCP server: enterprise MCP configuration is active and has exclusive control over MCP servers` |
| The server is on a denylist and the user runs `claude mcp add`       | `Cannot add MCP server "<name>": server is explicitly blocked by enterprise policy`                        |
| The server isn't on the allowlist and the user runs `claude mcp add` | `Cannot add MCP server "<name>": not allowed by enterprise policy`                                         |
| A previously configured server is now blocked by policy              | The server silently disappears from `/mcp` and `claude mcp list` with no warning                           |

In the last case, the user gets no signal that policy is the reason their server disappeared, so tell affected users which servers are blocked when you roll out a new restriction.

## Monitor MCP usage

When [OpenTelemetry export](/docs/en/monitoring-usage) is configured, Claude Code can record which MCP servers and tools users invoke. Set `OTEL_LOG_TOOL_DETAILS=1` to include MCP server and tool names in tool events, then aggregate them in your collector to see which servers your users actually connect to. See [Monitoring](/docs/en/monitoring-usage) to set up the exporter and for the full event schema.

## Configuration summary

Every file and setting this page covers, what it controls, and how to deliver it:

| Surface                      | What it controls                                                                    | Where it lives                                                                                                               | How to deliver                                                                                                                                                              |
| :--------------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `managed-mcp.json`           | Fixed server set, exclusive control                                                 | System path: `/Library/Application Support/ClaudeCode/`, `/etc/claude-code/`, or `C:\Program Files\ClaudeCode\`              | MDM, GPO, fleet management, or any process with administrator privileges. Cannot be set through server-managed settings                                                     |
| `allowedMcpServers`          | Allowlist of permitted servers                                                      | Any [settings file](/docs/en/settings#settings-files); entries from every source merge unless `allowManagedMcpServersOnly` is set | For enforcement, a [managed settings source](/docs/en/admin-setup#decide-how-settings-reach-devices): server-managed settings, `managed-settings.json`, MDM profile, or registry |
| `deniedMcpServers`           | Denylist of blocked servers                                                         | Any settings file; entries from every source merge                                                                           | Same as `allowedMcpServers`                                                                                                                                                 |
| `allowManagedMcpServersOnly` | Locks the allowlist to managed sources only                                         | Managed settings sources only; the setting has no effect elsewhere                                                           | Same as `allowedMcpServers`                                                                                                                                                 |
| `allowAllClaudeAiMcps`       | Loads claude.ai connectors alongside `managed-mcp.json` instead of suppressing them | Managed settings sources only; the setting has no effect elsewhere                                                           | Same as `allowedMcpServers`                                                                                                                                                 |

## Related resources

* [Decide what to enforce](/docs/en/admin-setup#decide-what-to-enforce): MCP restrictions alongside permission rules, sandboxing, and the other admin controls
* [Connect Claude Code to tools via MCP](/docs/en/mcp): the full MCP reference, including transports, scopes, and authentication
* [Settings](/docs/en/settings): the settings hierarchy and how managed settings take precedence
* [Server-managed settings](/docs/en/server-managed-settings): deliver `allowedMcpServers` and `deniedMcpServers` from the Claude.ai admin console
* [Security](/docs/en/security): the threat model these controls defend against
* [Claude Enterprise Administrator Guide](https://claude.com/resources/tutorials/claude-enterprise-administrator-guide): SSO, SCIM, seat management, and rollout playbook
