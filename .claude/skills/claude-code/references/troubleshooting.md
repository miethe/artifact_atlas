# Troubleshooting & Errors

_Claude Code documentation — Troubleshooting & Errors. Source: https://code.claude.com/docs/en/_


---

## Troubleshooting

`https://code.claude.com/docs/en/troubleshooting`

Fix high CPU or memory usage, hangs, auto-compact thrashing, and search problems in Claude Code, and find the right page for other issues.

This page covers performance, stability, and search problems once Claude Code is running. For other issues, start with the page that matches where you're stuck:

| Symptom                                                                                                 | Go to                                                                                    |
| :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| `command not found`, install fails, PATH issues, `EACCES`, TLS errors                                   | [Troubleshoot installation and login](/docs/en/troubleshoot-install)                          |
| Login loops, OAuth errors, `403 Forbidden`, "organization disabled", Bedrock/Vertex/Foundry credentials | [Troubleshoot installation and login](/docs/en/troubleshoot-install#login-and-authentication) |
| Settings not applying, hooks not firing, MCP servers not loading                                        | [Debug your configuration](/docs/en/debug-your-config)                                        |
| `API Error: 5xx`, `529 Overloaded`, `429`, request validation errors                                    | [Error reference](/docs/en/errors)                                                            |
| `model not found` or `you may not have access to it`                                                    | [Error reference](/docs/en/errors#theres-an-issue-with-the-selected-model)                    |
| VS Code extension not connecting or detecting Claude                                                    | [VS Code integration](/docs/en/vs-code#fix-common-issues)                                     |
| JetBrains plugin or IDE not detected                                                                    | [JetBrains integration](/docs/en/jetbrains#troubleshooting)                                   |
| High CPU or memory, slow responses, hangs, search not finding files                                     | [Performance and stability](#performance-and-stability) below                            |

If you're not sure which applies, run `/doctor` inside Claude Code for an automated check of your installation, settings, MCP servers, and context usage. If `claude` won't start at all, run `claude doctor` from your shell instead.

## Performance and stability

These sections cover issues related to resource usage, responsiveness, and search behavior.

### High CPU or memory usage

Claude Code is designed to work with most development environments, but may consume significant resources when processing large codebases. If you're experiencing performance issues:

1. Use `/compact` regularly to reduce context size
2. Close and restart Claude Code between major tasks
3. Consider adding large build directories to your `.gitignore` file

If memory usage stays high after these steps, run `/heapdump` to write a JavaScript heap snapshot and a memory breakdown to `~/Desktop`. On Linux without a Desktop folder, the files are written to your home directory.

The breakdown shows resident set size, JS heap, array buffers, and unaccounted native memory, which helps identify whether the growth is in JavaScript objects or in native code. To inspect retainers, open the `.heapsnapshot` file in Chrome DevTools under Memory → Load. Attach both files when reporting a memory issue on [GitHub](https://github.com/anthropics/claude-code/issues).

### Auto-compaction stops with a thrashing error

If you see `Autocompact is thrashing: the context refilled to the limit...`, automatic compaction succeeded but a file or tool output immediately refilled the context window several times in a row. Claude Code stops retrying to avoid wasting API calls on a loop that isn't making progress.

To recover:

1. Ask Claude to read the oversized file in smaller chunks, such as a specific line range or function, instead of the whole file
2. Run `/compact` with a focus that drops the large output, for example `/compact keep only the plan and the diff`
3. Move the large-file work to a [subagent](/docs/en/sub-agents) so it runs in a separate context window
4. Run `/clear` if the earlier conversation is no longer needed

### Command hangs or freezes

If Claude Code seems unresponsive:

1. Press Ctrl+C to attempt to cancel the current operation
2. If unresponsive, you may need to close the terminal and restart

Restarting doesn't lose your conversation. Run `claude --resume` in the same directory to pick the session back up.

### Search and discovery issues

If the Search tool, `@file` mentions, custom agents, or custom skills aren't finding files, the bundled `ripgrep` binary may not run on your system. Install your platform's `ripgrep` package and tell Claude Code to use it instead:

<Tabs>
  <Tab title="macOS">
    ```bash theme={null}
    brew install ripgrep
    ```
  </Tab>

  <Tab title="Ubuntu/Debian">
    ```bash theme={null}
    sudo apt install ripgrep
    ```
  </Tab>

  <Tab title="Alpine">
    ```bash theme={null}
    apk add ripgrep
    ```
  </Tab>

  <Tab title="Arch">
    ```bash theme={null}
    pacman -S ripgrep
    ```
  </Tab>

  <Tab title="Windows">
    ```powershell theme={null}
    winget install BurntSushi.ripgrep.MSVC
    ```
  </Tab>
</Tabs>

Then set `USE_BUILTIN_RIPGREP=0` in your [environment](/docs/en/env-vars).

### Slow or incomplete search results on WSL

Disk read performance penalties when [working across file systems on WSL](https://learn.microsoft.com/en-us/windows/wsl/filesystems) may result in fewer-than-expected matches when using Claude Code on WSL. Search still functions, but returns fewer results than on a native filesystem.

<Note>
  `/doctor` will show Search as OK in this case.
</Note>

**Solutions:**

1. **Submit more specific searches**: reduce the number of files searched by specifying directories or file types: "Search for JWT validation logic in the auth-service package" or "Find use of md5 hash in JS files".

2. **Move project to Linux filesystem**: if possible, ensure your project is located on the Linux filesystem (`/home/`) rather than the Windows filesystem (`/mnt/c/`).

3. **Use native Windows instead**: consider running Claude Code natively on Windows instead of through WSL, for better file system performance.

## Get more help

If you're experiencing issues not covered here:

1. Run `/doctor` to check installation health, settings validity, MCP configuration, and context usage in one pass
2. Use the `/feedback` command within Claude Code to report problems directly to Anthropic
3. Check the [GitHub repository](https://github.com/anthropics/claude-code) for known issues
4. Ask Claude directly about its capabilities and features. Claude has built-in access to its documentation.


---

## Error reference

`https://code.claude.com/docs/en/errors`

Look up Claude Code runtime error messages with what each one means and how to fix it.

This page lists runtime errors Claude Code displays and how to recover from each one, plus what to check when responses seem off without an error. For installation errors such as `command not found` or TLS failures during setup, see [Troubleshoot installation and login](/docs/en/troubleshoot-install).

These errors and recovery commands apply across the CLI, the [Desktop app](/docs/en/desktop), and [Claude Code on the web](/docs/en/claude-code-on-the-web), since all three wrap the same Claude Code CLI. For surface-specific issues, see the troubleshooting section on that surface's page.

<Note>
  Claude Code calls the Claude API for model responses, so most runtime errors map to an underlying API error code. This page covers what each error means inside Claude Code and how to recover. For the raw HTTP status code definitions, see the [Claude Platform error reference](https://platform.claude.com/docs/en/api/errors).
</Note>

## Find your error

Match the message you see in your terminal to a section below.

| Message                                                                                       | Section                                                                                                                       |
| :-------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `API Error: 500 Internal server error`                                                        | [Server errors](#api-error-500-internal-server-error)                                                                         |
| `API Error: Repeated 529 Overloaded errors`                                                   | [Server errors](#api-error-repeated-529-overloaded-errors)                                                                    |
| `Request timed out`                                                                           | [Server errors](#request-timed-out), or [Network](#unable-to-connect-to-api) if the message mentions your internet connection |
| `<model> is temporarily unavailable, so auto mode cannot determine the safety of...`          | [Server errors](#auto-mode-cannot-determine-the-safety-of-an-action)                                                          |
| `Auto mode could not evaluate this action and is blocking it for safety`                      | [Server errors](#auto-mode-cannot-determine-the-safety-of-an-action)                                                          |
| `Auto mode classifier transcript exceeded context window`                                     | [Server errors](#auto-mode-cannot-determine-the-safety-of-an-action)                                                          |
| `You've hit your session limit` / `You've hit your weekly limit`                              | [Usage limits](#youve-hit-your-session-limit)                                                                                 |
| `Server is temporarily limiting requests`                                                     | [Usage limits](#server-is-temporarily-limiting-requests)                                                                      |
| `Request rejected (429)`                                                                      | [Usage limits](#request-rejected-429)                                                                                         |
| `Credit balance is too low`                                                                   | [Usage limits](#credit-balance-is-too-low)                                                                                    |
| `Not logged in · Please run /login`                                                           | [Authentication](#not-logged-in)                                                                                              |
| `Invalid API key`                                                                             | [Authentication](#invalid-api-key)                                                                                            |
| `This organization has been disabled`                                                         | [Authentication](#this-organization-has-been-disabled)                                                                        |
| `Your organization has disabled Claude subscription access`                                   | [Authentication](#your-organization-has-disabled-claude-subscription-access)                                                  |
| `Routines are disabled by your organization's policy`                                         | [Authentication](#routines-are-disabled-by-your-organizations-policy)                                                         |
| `OAuth token revoked` / `OAuth token has expired`                                             | [Authentication](#oauth-token-revoked-or-expired)                                                                             |
| `does not meet scope requirement user:profile`                                                | [Authentication](#oauth-scope-requirement)                                                                                    |
| `Unable to connect to API`                                                                    | [Network](#unable-to-connect-to-api)                                                                                          |
| `SSL certificate verification failed`                                                         | [Network](#ssl-certificate-errors)                                                                                            |
| `403` with `x-deny-reason: host_not_allowed` in a cloud or routine session                    | [Network](#host-not-allowed-in-a-cloud-session)                                                                               |
| `Prompt is too long`                                                                          | [Request errors](#prompt-is-too-long)                                                                                         |
| `Error during compaction: Conversation too long`                                              | [Request errors](#error-during-compaction-conversation-too-long)                                                              |
| `Request too large`                                                                           | [Request errors](#request-too-large)                                                                                          |
| `Image was too large`                                                                         | [Request errors](#image-was-too-large)                                                                                        |
| `Unable to resize image`                                                                      | [Request errors](#unable-to-resize-image)                                                                                     |
| `PDF too large` / `PDF is password protected`                                                 | [Request errors](#pdf-errors)                                                                                                 |
| `Extra inputs are not permitted`                                                              | [Request errors](#extra-inputs-are-not-permitted)                                                                             |
| `There's an issue with the selected model`                                                    | [Request errors](#theres-an-issue-with-the-selected-model)                                                                    |
| `Claude Opus is not available with the Claude Pro plan`                                       | [Request errors](#claude-opus-is-not-available-with-the-claude-pro-plan)                                                      |
| `thinking.type.enabled is not supported for this model`                                       | [Request errors](#thinking-type-enabled-is-not-supported-for-this-model)                                                      |
| `max_tokens must be greater than thinking.budget_tokens`                                      | [Request errors](#thinking-budget-exceeds-output-limit)                                                                       |
| `API Error: 400 due to tool use concurrency issues`                                           | [Request errors](#tool-use-or-thinking-block-mismatch)                                                                        |
| `Claude Code is unable to respond to this request, which appears to violate our Usage Policy` | [Request errors](#usage-policy-refusal)                                                                                       |
| Responses seem lower quality than usual                                                       | [Response quality](#responses-seem-lower-quality-than-usual)                                                                  |

## Automatic retries

Claude Code retries transient failures before showing you an error. Server errors, overloaded responses, request timeouts, temporary 429 throttles, and dropped connections are all retried up to 10 times with exponential backoff. While retrying, the spinner shows a `Retrying in Ns · attempt x/y` countdown.

When you see one of the errors on this page, those retries have already been exhausted. You can tune the behavior with two environment variables:

| Variable                                  | Default | Effect                                                                                                               |
| :---------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------- |
| [`CLAUDE_CODE_MAX_RETRIES`](/docs/en/env-vars) | 10      | Number of retry attempts. Lower it to surface failures faster in scripts; raise it to wait through longer incidents. |
| [`API_TIMEOUT_MS`](/docs/en/env-vars)          | 600000  | Per-request timeout in milliseconds. Raise it for slow networks or proxies.                                          |

## Server errors

These errors come from the inference provider rather than your account or request. On the Anthropic API that means Anthropic infrastructure. On Bedrock, Vertex AI, Foundry, or a custom gateway it means that provider's infrastructure.

### API Error: 500 Internal server error

Claude Code shows the status code and the API's error message for any 5xx response. The example below shows a 500 response on the Anthropic API:

```text theme={null}
API Error: 500 Internal server error. This is a server-side issue, usually temporary — try again in a moment. If it persists, check https://status.claude.com.
```

The trailing sentence names where to check service health and varies by provider. Bedrock, Vertex AI, and Foundry configurations name that provider's service status. A custom `ANTHROPIC_BASE_URL` names the gateway host.

This indicates an unexpected failure inside the API. It is not caused by your prompt, settings, or account.

**What to do:**

* Check [status.claude.com](https://status.claude.com), or the provider status page named in the message, for active incidents
* Wait a minute, then send your message again. Your original message is still in the conversation, so for a long prompt you can type `try again` instead of pasting the whole thing.
* If the error persists with no posted incident, run `/feedback` so Anthropic can investigate with your request details. See [Report an error](#report-an-error) if `/feedback` is unavailable in your environment.

### API Error: Repeated 529 Overloaded errors

The API is temporarily at capacity across all users. Claude Code has already retried several times before showing this message:

```text theme={null}
API Error: Repeated 529 Overloaded errors. The API is at capacity — this is usually temporary. Try again in a moment. If it persists, check https://status.claude.com.
```

The trailing sentence varies by provider in the same way as the 500 error above. A 529 is not your usage limit and does not count against your quota.

**What to do:**

* Check [status.claude.com](https://status.claude.com), or the provider status page named in the message, for capacity notices
* Try again in a few minutes
* Run `/model` and switch to a different model to keep working, since capacity is tracked per model. Claude Code prompts you to do this when one model is under particularly high load, for example `Opus is experiencing high load, please use /model to switch to Sonnet`.

### Request timed out

The API did not respond before the connection deadline.

```text theme={null}
Request timed out
```

This can happen during periods of high load or when a very large response is being generated. The default request timeout is 10 minutes.

**What to do:**

* Retry the request
* For long-running tasks, break the work into smaller prompts
* If a slow network or proxy is the cause, raise `API_TIMEOUT_MS` as described in [Automatic retries](#automatic-retries)
* If timeouts are frequent and your network is otherwise healthy, see [Network and connection errors](#network-and-connection-errors) below

### Auto mode cannot determine the safety of an action

The model that [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) uses to classify actions could not produce a decision, so auto mode did not approve the action automatically. The message you see depends on why the classifier failed.

Reads, searches, and edits inside your working directory skip the classifier, so they keep working in all of these cases.

When the classifier model is overloaded:

```text theme={null}
<model> is temporarily unavailable, so auto mode cannot determine the safety of <tool> right now. Wait briefly and then try this action again.
```

**What to do:**

* Retry after a few seconds; Claude sees the same message and usually retries on its own
* If retries keep failing, continue with read-only tasks and come back to the blocked action later
* This is transient and unrelated to [auto mode eligibility](/docs/en/permission-modes#eliminate-prompts-with-auto-mode); you do not need to change settings

When the classifier returned an unparseable response:

```text theme={null}
Auto mode could not evaluate this action and is blocking it for safety — run with --debug for details
```

**What to do:**

* Retry the action; this usually succeeds on the next attempt
* Run `claude --debug` and repeat the action to see the underlying classifier response in the debug log

When the conversation has grown larger than the classifier's context window:

```text theme={null}
Auto mode classifier transcript exceeded context window — falling back to manual approval (try /compact to reduce conversation size)
```

In an interactive session, auto mode falls back to a normal permission prompt for that action so you can approve or deny it manually. In [non-interactive mode](/docs/en/headless) the run aborts because the transcript only grows and retrying cannot succeed.

**What to do:**

* Approve or deny the action in the prompt that appears
* Run `/compact` to reduce the conversation size so subsequent actions fit within the classifier window again

## Usage limits

These errors mean a quota tied to your account or plan has been reached. They are distinct from [server errors](#server-errors), which affect everyone.

### You've hit your session limit

Subscription plans include a rolling usage allowance. When it runs out you see one of these messages:

```text theme={null}
You've hit your session limit · resets 3:45pm
You've hit your weekly limit · resets Mon 12:00am
You've hit your Opus limit · resets 3:45pm
```

Claude Code blocks further requests until the reset time shown in the message.

**What to do:**

* Wait for the reset time shown in the error
* Run `/usage` to see your plan limits and when they reset
* Run `/usage-credits` to buy additional usage on Pro and Max, or to request it from your admin on Team and Enterprise. See [usage credits for paid plans](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) for how this is billed.
* To upgrade your plan for higher base limits, see [claude.com/pricing](https://claude.com/pricing)

To watch your remaining allowance before you hit the limit, add the `rate_limits` fields to a [custom status line](/docs/en/statusline#rate-limit-usage), or in the Desktop app click the [usage ring](/docs/en/desktop#check-usage) next to the model picker.

### Server is temporarily limiting requests

The API applied a short-lived throttle that is unrelated to your plan quota.

```text theme={null}
API Error: Server is temporarily limiting requests (not your usage limit)
```

This is [retried automatically](#automatic-retries) before being shown.

**What to do:**

* Wait briefly and try again
* Check [status.claude.com](https://status.claude.com) if it persists

### Request rejected (429)

You have hit the rate limit configured for your API key, Amazon Bedrock project, or Google Vertex AI project.

```text theme={null}
API Error: Request rejected (429) · this may be a temporary capacity issue. If it persists, check https://status.claude.com.
```

The trailing sentence names where to check service health and varies by provider. Bedrock, Vertex AI, and Foundry configurations name that provider's service status instead of the Anthropic status page. A custom `ANTHROPIC_BASE_URL` names the gateway host.

**What to do:**

* Run `/status` and confirm the active credential is the one you expect. A stray `ANTHROPIC_API_KEY` in your environment can route requests through a low-tier key instead of your subscription.
* Check your provider console for the active limits and request a higher tier if needed
* For Anthropic API keys, see the [rate limits reference](https://platform.claude.com/docs/en/api/rate-limits) for how tiers work and how to set per-workspace caps
* Reduce concurrency: lower [`CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`](/docs/en/env-vars), avoid running many parallel subagents, or switch to a smaller model with `/model` for high-volume scripted runs

### Credit balance is too low

Your Console organization has run out of prepaid credits.

```text theme={null}
Credit balance is too low
```

**What to do:**

* Add credits at [platform.claude.com/settings/billing](https://platform.claude.com/settings/billing), and consider enabling auto-reload there so the balance refills before it hits zero
* Switch to subscription authentication with `/login` if you have a Pro, Max, Team, or Enterprise plan
* Set per-workspace spend caps in the Console to prevent a single project from draining the org balance. See [Manage costs effectively](/docs/en/costs).

## Authentication errors

These errors mean Claude Code cannot prove who you are to the API. Run `/status` at any time to see which credential is currently active.

### Not logged in

No valid credential is available for this session.

```text theme={null}
Not logged in · Please run /login
```

**What to do:**

* Run `/login` to authenticate with your Claude subscription or Console account
* If you expected an environment variable to authenticate you, confirm `ANTHROPIC_API_KEY` is set and exported in the shell where you launched `claude`
* For CI or automation where interactive login is not possible, configure an [`apiKeyHelper`](/docs/en/settings#available-settings) script that fetches a key at startup
* See [Authentication precedence](/docs/en/authentication#authentication-precedence) to understand which credential wins when several are present

If you are prompted to log in repeatedly, see [Not logged in or token expired](/docs/en/troubleshoot-install#not-logged-in-or-token-expired) for system clock and macOS Keychain fixes.

### Invalid API key

The `ANTHROPIC_API_KEY` environment variable or `apiKeyHelper` script returned a key the API rejected.

```text theme={null}
Invalid API key · Fix external API key
```

**What to do:**

* Check for typos and confirm the key has not been revoked in the [Console](https://platform.claude.com/settings/keys)
* Run `env | grep ANTHROPIC` in the same shell. Tools like direnv, dotenv shell plugins, and IDE terminals can load a stale key from a `.env` file in your project without you setting it explicitly.
* Unset `ANTHROPIC_API_KEY` and run `/login` to use subscription auth instead
* If the key comes from an [`apiKeyHelper`](/docs/en/settings#available-settings) script, run the script directly to confirm it prints a valid key on stdout
* Run `/status` to confirm which credential source Claude Code is actually using

### This organization has been disabled

A stale `ANTHROPIC_API_KEY` from a disabled Console organization is overriding your subscription login.

```text theme={null}
Your ANTHROPIC_API_KEY belongs to a disabled organization · Unset the environment variable to use your other credentials
API Error: 400 ... This organization has been disabled.
```

Environment variables take precedence over `/login`, so a key exported in your shell profile or loaded from a `.env` file is used even when you have a working Pro or Max subscription. In non-interactive mode (`-p`), the key is always used when present.

**What to do:**

* Unset `ANTHROPIC_API_KEY` in the current shell and remove it from your shell profile, then relaunch `claude`
* Run `/status` afterward to confirm the active credential is your subscription
* If no environment variable is set and the error persists, the disabled organization is the one tied to your `/login`. Contact support or sign in with a different account.

### Your organization has disabled Claude subscription access

Your Claude organization does not allow signing in to Claude Code with a subscription login. Running `/login` again with the same account returns the same error.

```text theme={null}
Your organization has disabled Claude subscription access for Claude Code · Use an Anthropic API key instead, or ask your admin to enable access
```

This is a server-side organization setting, so it cannot be overridden from local settings, environment variables, or CLI flags. The Agent SDK and `-p` non-interactive mode surface this as the `oauth_org_not_allowed` error code.

**What to do:**

* Ask your admin to enable Claude Code access for your organization
* Authenticate with a Console API key instead of your subscription. See [Claude Console authentication](/docs/en/authentication#claude-console-authentication) for setup.
* If you are the admin and do not see an option to enable access, contact [Anthropic support](https://support.claude.com)

### Routines are disabled by your organization's policy

Your Team or Enterprise admin has turned off routines at the organization level. The error appears when you try to create or run a routine, including from `/schedule` and the [Routines](/docs/en/routines) UI on claude.ai/code.

```text theme={null}
Routines are disabled by your organization's policy.
```

This is a server-side setting, so it cannot be overridden from local settings, environment variables, or CLI flags.

**What to do:**

* Ask your admin to enable the **Routines** toggle at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code)
* For one-off scheduled work that does not require organization-level routines, see [scheduled tasks](/docs/en/scheduled-tasks)

### OAuth token revoked or expired

Your saved login is no longer valid. A revoked token means you signed out everywhere or an admin removed access; an expired token means the automatic refresh failed mid-session.

```text theme={null}
OAuth token revoked · Please run /login
OAuth token has expired · Please run /login
API Error: 401 ... authentication_error
```

**What to do:**

* Run `/login` to sign in again
* If the error returns within the same session after re-authenticating, run `/logout` first to fully clear the stored token, then `/login`
* For repeated prompts to log in across launches, see the system clock and macOS Keychain checks in [Troubleshooting](/docs/en/troubleshoot-install#not-logged-in-or-token-expired)
* For other failures including `403 Forbidden` and OAuth browser issues, see [Login and authentication](/docs/en/troubleshoot-install#login-and-authentication)

### OAuth scope requirement

The stored token predates a permission scope that a newer feature needs. You see this most often from `/usage` and the status line usage indicator:

```text theme={null}
OAuth token does not meet scope requirement: user:profile
```

**What to do:**

* Run `/login` to mint a new token with the current scopes. You do not need to log out first.

## Network and connection errors

These errors mean a network request from Claude Code failed to reach its destination. They usually originate in your local network, proxy, or firewall, or in the cloud environment's network policy.

### Unable to connect to API

The TCP connection to the API failed or never completed.

```text theme={null}
Unable to connect to API. Check your internet connection
Unable to connect to API (ECONNREFUSED)
Unable to connect to API (ECONNRESET)
Unable to connect to API (ETIMEDOUT)
fetch failed
Request timed out. Check your internet connection and proxy settings
```

Common causes include no internet access, a VPN that blocks `api.anthropic.com`, or a required corporate proxy that is not configured.

**What to do:**

* Confirm you can reach the API host from the same shell by running `curl -I https://api.anthropic.com`. On Windows PowerShell use `curl.exe -I https://api.anthropic.com` so the built-in `Invoke-WebRequest` alias is not used.
* If you are behind a corporate proxy, set `HTTPS_PROXY` before launching Claude Code and see [Network configuration](/docs/en/network-config)
* If you route through an LLM gateway or relay, set [`ANTHROPIC_BASE_URL`](/docs/en/env-vars) to its address. See [LLM gateway configuration](/docs/en/llm-gateway) for setup.
* Ensure your firewall allows the hosts listed in [Network access requirements](/docs/en/network-config#network-access-requirements)
* Intermittent failures are [retried automatically](#automatic-retries); persistent failures point to a local network issue

If `curl` succeeds but Claude Code still fails, the cause is usually something between the runtime and the network rather than the network itself:

* On Linux and WSL, check `/etc/resolv.conf` for an unreachable nameserver. WSL in particular can inherit a broken resolver from the host.
* On macOS, a VPN client that was disconnected or uninstalled can leave a tunnel interface or routing rule behind. Check `ifconfig` for stale `utun` interfaces and remove the VPN's network extension in System Settings.
* Docker Desktop and similar container runtimes can intercept outbound traffic. Quit them and retry to rule this out.

### SSL certificate errors

A proxy or security appliance on your network is intercepting TLS traffic with its own certificate, and Claude Code does not trust it.

```text theme={null}
Unable to connect to API: SSL certificate verification failed. Check your proxy or corporate SSL certificates
Unable to connect to API: Self-signed certificate detected
```

**What to do:**

* Export your organization's CA bundle and point Claude Code at it with `NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.pem`
* See [Network configuration](/docs/en/network-config#custom-ca-certificates) for full setup instructions
* Do not set `NODE_TLS_REJECT_UNAUTHORIZED=0`, which disables certificate validation entirely

### Host not allowed in a cloud session

An outbound HTTP request from a cloud session or routine was blocked by the environment's network policy.

```text theme={null}
HTTP 403
x-deny-reason: host_not_allowed
```

You may also see a TLS certificate that doesn't match the destination's real certificate. The cloud environment routes outbound traffic through a proxy that enforces the network policy, so a mismatched certificate means the proxy terminated the connection, not the destination.

This is not a client-side network problem. Cloud sessions and [routines](/docs/en/routines) run inside a sandboxed environment whose outbound traffic is filtered to the environment's allowlist. The **Default** environment uses **Trusted** access, which permits the [default allowlist](/docs/en/claude-code-on-the-web#default-allowed-domains) of package registries, cloud provider APIs, container registries, and common development domains but blocks everything else.

**What to do:**

* Open the routine for editing, or start a cloud session. Select the cloud icon showing your environment's name, such as **Default**, to open the selector. Hover over your environment and click the settings icon.
* In the **Update cloud environment** dialog, change **Network access** from **Trusted** to **Custom**, then add the blocked domain to **Allowed domains**. Enter one domain per line. Check **Also include default list of common package managers** to keep the [default allowlist](/docs/en/claude-code-on-the-web#default-allowed-domains) alongside your custom domains. Select **Full** instead if you want unrestricted access.
* Click **Save changes**. The next run uses the updated allowlist.

See [Network access](/docs/en/claude-code-on-the-web#network-access) for access levels and the default allowlist. Local CLI sessions are not affected by this policy.

## Request errors

These errors mean the API received your request but rejected its content.

### Prompt is too long

The conversation plus attached files exceeds the model's context window.

```text theme={null}
Prompt is too long
```

**What to do:**

* Run `/compact` to summarize earlier turns and free space, or `/clear` to start fresh
* Run `/context` to see a breakdown of what is consuming the window: system prompt, tools, memory files, and messages
* Disable MCP servers you are not using with `/mcp disable <name>` to remove their tool definitions from context
* Trim large `CLAUDE.md` memory files, or move instructions into [path-scoped rules](/docs/en/memory#path-specific-rules) that load only when relevant
* Subagents inherit every MCP tool definition from the parent session, which can fill their context window before the first turn. Disable MCP servers you are not using before spawning subagents.
* Auto-compact is on by default and normally prevents this error. If you have set [`DISABLE_AUTO_COMPACT`](/docs/en/env-vars), re-enable it or run `/compact` manually before the window fills.

See [Explore the context window](/docs/en/context-window) for an interactive view of how context fills up.

### Error during compaction: Conversation too long

`/compact` itself failed because there is not enough free context to hold the summary it produces.

```text theme={null}
Error during compaction: Conversation too long. Press esc twice to go up a few messages and try again.
```

This can happen when the window is already full at the moment auto-compact triggers, or when you run `/compact` after seeing `Prompt is too long`.

**What to do:**

* Press Esc twice to open the message list and step back several turns. This drops the most recent messages from context. Then run `/compact` again.
* If stepping back does not free enough space, run `/clear` to start a fresh session. Your previous conversation is preserved and can be reopened with `/resume`.

### Request too large

The raw request body exceeded the API's byte limit before tokenization, usually because of a large pasted file or attachment.

```text theme={null}
Request too large (max 30 MB). Double press esc to go back and remove or shrink the attached content.
```

This is a size limit on the HTTP request, separate from the [context window limit](#prompt-is-too-long).

**What to do:**

* Press Esc twice and step back past the turn that added the oversized content
* Reference large files by path instead of pasting their contents, so Claude can read them in chunks
* For images, see [Image was too large](#image-was-too-large) below

### Image was too large

A pasted or attached image exceeds the API's size or dimension limits.

```text theme={null}
Image was too large. Double press esc to go back and try again with a smaller image.
API Error: 400 ... image dimensions exceed max allowed size
```

The image stays in conversation history after the error, so every subsequent message fails with the same error until you remove it.

**What to do:**

* Press Esc twice and step back past the turn where the image was added
* Resize the image before pasting. The API accepts images up to 8000 pixels on the longest edge for a single image, or 2000 pixels when many images are in context.
* Take a tighter screenshot of the relevant region instead of the full screen

### Unable to resize image

Claude Code could not downscale an attached image before sending it to the API.

```text theme={null}
Unable to resize image — image processing is unavailable and dimensions could not be read from the file header. Please convert the image to PNG, JPEG, GIF, or WebP.
Unable to resize image — dimensions exceed the 2000x2000px limit and image processing failed. Please resize the image to reduce its pixel dimensions.
Unable to resize image (… raw, … base64). The image exceeds the … API limit and compression failed. Please resize the image manually or use a smaller image.
Unable to resize image — could not verify image dimensions are within the 2000x2000px API limit.
```

Claude Code normally resizes large images automatically. These errors mean the native image processor failed to load or returned an error, so the image could not be resized to fit within API limits.

**What to do:**

* If the message asks you to convert the image, convert it to PNG, JPEG, GIF, or WebP and attach it again. Claude Code can verify dimensions for these formats without the image processor.
* If the message reports a dimension or size limit, resize or recompress the image below that limit before attaching.

### PDF errors

The PDF you attached could not be processed.

```text theme={null}
PDF too large (max 100 pages, 32 MB). Try splitting it or extracting text first.
PDF is password protected. Try removing protection or extracting text first.
The PDF file was not valid. Try converting to a different format first.
```

**What to do:**

* For oversized PDFs, ask Claude to read a page range with the Read tool instead of attaching the whole file, or extract text with a tool like `pdftotext` and reference the output file by path
* For protected or invalid PDFs, remove the password or re-export the file from its source application, then try again

### Extra inputs are not permitted

A proxy or LLM gateway between Claude Code and the API stripped the `anthropic-beta` request header, so the API rejected fields that depend on it.

```text theme={null}
API Error: 400 ... Extra inputs are not permitted ... context_management
API Error: 400 ... Extra inputs are not permitted ... tools.0.custom.input_examples
API Error: 400 ... Unexpected value(s) for the `anthropic-beta` header
```

Claude Code sends beta-only fields such as `context_management`, `effort`, and tool `input_examples` alongside an `anthropic-beta` header that enables them. When a gateway forwards the body but drops the header, the API sees fields it does not recognize.

**What to do:**

* Configure your gateway to forward the `anthropic-beta` header. See [LLM gateway configuration](/docs/en/llm-gateway).
* As a fallback, set [`CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`](/docs/en/env-vars) before launching. This disables features that require the beta header so requests succeed through a gateway that cannot forward it.

### There's an issue with the selected model

The configured model name was not recognized or your account lacks access to it.

```text theme={null}
There's an issue with the selected model (claude-...). It may not exist or you may not have access to it. Run /model to select a different one.
```

**What to do:**

* Run `/model` to pick from models available to your account
* Use an alias such as `sonnet` or `opus` instead of a full versioned ID. Aliases track the latest release so they do not go stale. See [Model configuration](/docs/en/model-config).
* If the wrong model keeps coming back, a stale ID is set somewhere. Check in [priority order](/docs/en/model-config#setting-your-model): the `--model` flag, the `ANTHROPIC_MODEL` environment variable, then the `model` field in `.claude/settings.local.json`, your project's `.claude/settings.json`, and `~/.claude/settings.json`. Remove the stale value and Claude Code falls back to your account default.
* For Vertex AI deployments, see [Vertex AI troubleshooting](/docs/en/google-vertex-ai#troubleshooting).

### Claude Opus is not available with the Claude Pro plan

Your active subscription plan does not include the model you selected.

```text theme={null}
Claude Opus is not available with the Claude Pro plan · Select a different model in /model
```

**What to do:**

* Run `/model` and select a model your plan includes
* If you upgraded your plan recently and still see this, run `/logout` then `/login`. The stored token reflects your plan at the time you signed in, so upgrading on the web does not take effect in an existing session until you re-authenticate.
* See [claude.com/pricing](https://claude.com/pricing) for which models each plan includes

### thinking.type.enabled is not supported for this model

Your Claude Code version is older than the minimum for Opus 4.7 or Opus 4.8. The CLI sent a thinking configuration the model no longer accepts.

```text theme={null}
API Error: 400 ... "thinking.type.enabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior.
```

**What to do:**

* Run `claude update` and restart Claude Code. Opus 4.7 needs v2.1.111 or later. Opus 4.8 needs v2.1.154 or later
* If you cannot upgrade, run `/model` and select Opus 4.6 or Sonnet instead
* If you hit this in the Agent SDK, see [SDK troubleshooting](/docs/en/agent-sdk/quickstart#troubleshooting)

### Thinking budget exceeds output limit

The configured extended thinking budget exceeds the maximum response length, so there is no room left for the actual answer.

```text theme={null}
API Error: 400 ... max_tokens must be greater than thinking.budget_tokens
```

Claude Code adjusts these values automatically on the Anthropic API. You typically see this error on Amazon Bedrock or Google Vertex AI when [`MAX_THINKING_TOKENS`](/docs/en/env-vars) is set higher than the provider's output limit, or when plan mode raises the thinking budget.

**What to do:**

* Lower `MAX_THINKING_TOKENS`, or raise [`CLAUDE_CODE_MAX_OUTPUT_TOKENS`](/docs/en/env-vars) above the thinking budget
* See [Extended thinking](/docs/en/model-config#extended-thinking) for how the budget interacts with output length

### Tool use or thinking block mismatch

The conversation history reached the API in an inconsistent state, usually after a tool call was interrupted or a turn was edited mid-stream.

```text theme={null}
API Error: 400 due to tool use concurrency issues. Run /rewind to recover the conversation.
API Error: 400 ... unexpected `tool_use_id` found in `tool_result` blocks
API Error: 400 ... thinking blocks ... cannot be modified
```

All three variants mean the same thing: the sequence of `tool_use`, `tool_result`, and `thinking` blocks in history no longer matches what the API expects.

**What to do:**

* If you are using Opus 4.7 or Opus 4.8, run `claude update` first. Versions before v2.1.156 can trigger this error during normal tool use, and `/rewind` does not clear it.
* Run `/rewind`, or press Esc twice, to step back to a checkpoint before the corrupted turn and continue from there. See [Checkpointing](/docs/en/checkpointing) for how checkpoints are created and restored.

### Usage Policy refusal

The API declined to respond because content in the conversation triggered a [Usage Policy](https://www.anthropic.com/legal/aup) check. The message includes a Request ID you can quote to support if you believe the refusal is incorrect.

```text theme={null}
API Error: Claude Code is unable to respond to this request, which appears to violate our Usage Policy (https://www.anthropic.com/legal/aup). Please double press esc to edit your last message or start a new session for Claude Code to assist with a different task.
```

The check evaluates the full conversation, not only your latest prompt, so sending a new message in the same session usually re-triggers the same refusal. The same applies after exiting and reopening the session with `--continue` or `--resume`, since the transcript on disk still contains the triggering content.

**What to do:**

* Press Esc twice or run `/rewind` to step back to a checkpoint before the turn that triggered the refusal, then rephrase or take a different approach. See [Checkpointing](/docs/en/checkpointing).
* If you cannot identify which turn caused it, run `/clear` to start a fresh conversation in the same project. Your previous conversation is preserved on disk and remains available in `/resume`.
* In [non-interactive mode](/docs/en/headless) (`-p`), where rewind is unavailable, retry with a rephrased prompt or start a new session without `--continue`.

## Responses seem lower quality than usual

If Claude's answers seem less capable than you expect but no error is shown, the cause is usually conversation state rather than the model itself. Claude Code does not silently change model versions. It can switch to a fallback model in specific cases such as an Opus quota being reached or a Bedrock or Vertex AI region lacking your model; the Model selection check below catches both, and [Model configuration](/docs/en/model-config) explains when fallback applies.

Check these first:

* **Model selection**: run `/model` to confirm you are on the model you expect. A previous `/model` choice or an `ANTHROPIC_MODEL` environment variable may have you on a smaller model than you intended.
* **Effort level**: run `/effort` to check the current reasoning level and raise it for hard debugging or design work. Defaults vary by model, so check before assuming you are below the maximum. See [Adjust effort level](/docs/en/model-config#adjust-effort-level) for per-model defaults and the `ultrathink` shortcut.
* **Context pressure**: run `/context` to see how full the window is. If it is near capacity, run `/compact` at a natural breakpoint or `/clear` to start fresh. See [Explore the context window](/docs/en/context-window) for how auto-compact affects earlier turns.
* **Stale instructions**: large or outdated `CLAUDE.md` files and MCP tool definitions consume context and can steer responses. `/doctor` flags oversized memory files and subagent definitions; `/context` shows MCP tool token usage.

When a response goes wrong, rewinding usually works better than replying with corrections. Press Esc twice or run `/rewind` to step back to before the bad turn, then rephrase the prompt with more specifics. Correcting in-thread keeps the wrong attempt in context, which can anchor later answers to it. See [Checkpointing](/docs/en/checkpointing).

If quality still seems off after checking the above, run `/feedback` and describe what you expected versus what you got. Feedback submitted this way includes the conversation transcript, which is the fastest way for Anthropic to diagnose a real regression. See [Report an error](#report-an-error) if `/feedback` is unavailable in your environment.

## Report an error

This page covers errors from the Claude API. For errors from other Claude Code components, see the relevant guide:

* MCP server failed to connect or authenticate: [MCP](/docs/en/mcp)
* Hook script failed or blocked a tool: [Debug hooks](/docs/en/hooks#debug-hooks)
* Permission denied or filesystem errors during install: [Troubleshoot installation and login](/docs/en/troubleshoot-install)

If an error is not listed here or the suggested fix does not help:

* Run `/feedback` inside Claude Code to send the transcript and a description to Anthropic. The command also offers to open a prefilled GitHub issue. On Bedrock, Vertex AI, Foundry, and other third-party providers, `/feedback` saves a local archive you can send to your Anthropic account representative instead.
* Run `/doctor` to check for local configuration problems
* Check [status.claude.com](https://status.claude.com) for active incidents
* Search [existing issues](https://github.com/anthropics/claude-code/issues) on GitHub


---

## Debug your configuration

`https://code.claude.com/docs/en/debug-your-config`

Diagnose why CLAUDE.md, settings, hooks, MCP servers, or skills aren't taking effect. Use /context, /doctor, /hooks, and /mcp to see what actually loaded.

When Claude ignores an instruction or a feature you configured doesn't appear, the cause is usually that the file didn't load, it loaded from a different location than you expected, or another file overrode it. This guide shows how to inspect what Claude Code actually loaded so you can narrow down which applies.

For installation, authentication, and connectivity problems, see [Troubleshoot installation and login](/docs/en/troubleshoot-install) instead.

## See what loaded into context

The `/context` command shows everything occupying the context window for the current session, broken down by category: system prompt, memory files, skills, MCP tools, and conversation messages. Run it first to confirm whether your `CLAUDE.md`, rules, or skill descriptions are present at all.

For detail on a specific category, follow up with the dedicated command:

| Command          | Shows                                                                                                        |
| :--------------- | :----------------------------------------------------------------------------------------------------------- |
| `/memory`        | Which `CLAUDE.md` and rules files loaded, plus auto-memory entries                                           |
| `/skills`        | Available skills from project, user, and plugin sources                                                      |
| `/agents`        | Configured subagents and their settings                                                                      |
| `/hooks`         | Active hook configurations                                                                                   |
| `/mcp`           | Connected MCP servers and their status                                                                       |
| `/permissions`   | Resolved allow and deny rules currently in effect                                                            |
| `/doctor`        | Configuration diagnostics: invalid keys, schema errors, installation health                                  |
| `/debug [issue]` | Enables debug logging for the session and prompts Claude to diagnose using the log output and settings paths |
| `/status`        | Active settings sources, including whether managed settings are in effect                                    |

If a memory file is missing from `/memory`, check its location against [how CLAUDE.md files load](/docs/en/memory#how-claude-md-files-load). Subdirectory `CLAUDE.md` files load on demand when Claude reads a file in that directory with the Read tool, not at session start.

If `/memory` confirms the file loaded but Claude still isn't following a particular instruction, the issue is likely how the instruction is written rather than whether it loaded. CLAUDE.md works well for the kinds of guidance you'd give a new teammate, such as project conventions, build commands, and where files belong.

Adherence drops when an instruction is vague enough to interpret multiple ways, when two files give conflicting direction, or when the file has grown long enough that individual rules get less attention. [Write effective instructions](/docs/en/memory#write-effective-instructions) covers the specificity, size, and structure patterns that keep adherence high.

<Note>
  CLAUDE.md and permissions solve different problems. CLAUDE.md tells Claude how your project works so it makes good decisions. [Permissions](/docs/en/permissions) and [hooks](/docs/en/hooks) enforce limits regardless of what Claude decides. Use CLAUDE.md for "we do it this way here." Use permissions or hooks for security boundaries and anything that must never happen, where you need a guarantee instead of guidance.
</Note>

## Check resolved settings

Settings merge across managed, user, project, and local scopes. Managed settings always win when present. Among the rest, the closer scope overrides the broader one in the order local, then project, then user. Some settings can also be set by command-line flags or [environment variables](/docs/en/env-vars), which act as another override layer. When a setting doesn't seem to apply, the value you set is usually being overridden by another scope or an environment variable.

Run `/doctor` to validate your configuration files and surface invalid keys or schema errors. When `/doctor` reports issues, press `f` to send the diagnostic report to Claude and have it walk through fixes with you.

Run `/status` to see which settings sources are active, including whether managed settings are in effect. To understand which scope wins for a given key, see [How scopes interact](/docs/en/settings#how-scopes-interact).

## Check MCP servers

Run `/mcp` to see every configured server, its connection status, and whether you have approved it for the current project. A server can be defined correctly but still not provide tools for a few common reasons:

* Project-scoped servers in `.mcp.json` require a one-time approval. If the prompt was dismissed, the server stays disabled until you approve it from `/mcp`.
* A server that fails to start shows as failed in `/mcp`. Relative file paths in `command` or `args` are a frequent cause, since they resolve against the directory you launched Claude Code from rather than the location of `.mcp.json`.
* A server that shows as connected but lists zero tools has started successfully but isn't returning a tool list. Select **Reconnect** from `/mcp`. If the count stays at zero, run `claude --debug mcp` to see the server's stderr output.

For configuration locations and scope rules, see [MCP](/docs/en/mcp).

## Check hooks

Run `/hooks` to list every hook registered for the current session, grouped by event. If a hook you defined doesn't appear, it isn't being read: hooks go under the `"hooks"` key in a settings file, not in a standalone file.

If the hook appears but doesn't fire, the matcher is the usual cause. The `matcher` field is a single string that uses `|` to match multiple tool names, for example `"Edit|Write"`. A misspelled tool name fails silently because the matcher never matches. An array value is a schema error: Claude Code shows a settings error notice, `/doctor` reports the validation failure, and the hook entry is dropped so it won't appear in `/hooks`.

Edits to `settings.json` take effect in the running session after a brief file-stability delay. You don't need to restart. If `/hooks` still shows the old definition a few seconds after saving, run `/hooks` again to refresh the view.

If `/hooks` shows the hook but it still does not fire, the next step is to watch hook evaluation live. Start a session with `claude --debug hooks` and trigger the tool call. The debug log records each event, which matchers were checked, and the hook's exit code and output. See [Debug hooks](/docs/en/hooks#debug-hooks) for the log format and [hooks troubleshooting](/docs/en/hooks-guide#limitations-and-troubleshooting) for common failure patterns.

## Test against a clean configuration

If targeted checks don't isolate the cause, or your configuration is in an unknown state, compare against a session that loads nothing from your usual setup. Point [`CLAUDE_CONFIG_DIR`](/docs/en/env-vars) at an empty directory to bypass everything under `~/.claude`, and launch from a directory that has no `.claude` folder, `.mcp.json`, or `CLAUDE.md` so project configuration is also skipped.

```bash theme={null}
cd /tmp && CLAUDE_CONFIG_DIR=/tmp/claude-clean claude
```

The clean session has no user or project settings, hooks, MCP servers, plugins, or memory.

* Managed settings still apply if your organization deploys them, since they live at a system path outside `~/.claude`
* On Linux and Windows, you'll be prompted to log in again because credentials are stored under the configuration directory
* On macOS, credentials are in the Keychain and carry over to the clean session

If the problem disappears here, the cause is somewhere in your real `~/.claude` or project `.claude` files. Reintroduce them one at a time, by copying files into the temporary directory or by launching from your project, to find which one. If it persists in the clean session, the cause is outside your user and project configuration. Run `/status` to check whether managed settings are in effect, look for [environment variables](/docs/en/env-vars) that affect Claude Code, then see [Troubleshooting](/docs/en/troubleshooting).

## Check common causes

Most configuration surprises trace back to a small set of location and syntax rules. Check these before assuming a bug:

| Symptom                                                              | Cause                                                                                                                      | Fix                                                                                                                                                                                                                                                          |
| :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook never fires                                                     | `matcher` is a JSON array instead of a string                                                                              | Use a single string with `\|` to match multiple tools, for example `"Edit\|Write"`. See [matcher patterns](/docs/en/hooks#matcher-patterns).                                                                                                                      |
| Hook never fires                                                     | `matcher` value is lowercase, for example `"bash"`                                                                         | Matching is case-sensitive. Tool names are capitalized: `Bash`, `Edit`, `Write`, `Read`.                                                                                                                                                                     |
| Hook never fires                                                     | Hooks are defined in a standalone file instead of `settings.json`                                                          | There is no standalone hooks file for project or user config. Define hooks under the `"hooks"` key in `settings.json`. Only [plugins](/docs/en/plugins-reference#hooks) load a separate `hooks/hooks.json`. See [hook configuration](/docs/en/hooks).                  |
| Permissions, hooks, or env set globally are ignored                  | Configuration was added to `~/.claude.json`                                                                                | `~/.claude.json` holds app state and UI toggles. `permissions`, `hooks`, and `env` belong in `~/.claude/settings.json`. These are two different files.                                                                                                       |
| A `settings.json` value seems ignored                                | The same key is set in `settings.local.json`                                                                               | `settings.local.json` overrides `settings.json`, and both override `~/.claude/settings.json`. See [settings precedence](/docs/en/settings#how-scopes-interact).                                                                                                   |
| Skill doesn't appear in `/skills`                                    | Skill file is at `.claude/skills/name.md` instead of in a folder                                                           | Use a folder with `SKILL.md` inside: `.claude/skills/name/SKILL.md`.                                                                                                                                                                                         |
| Skill appears in `/skills` but Claude never invokes it               | Skill has `disable-model-invocation: true` in its frontmatter, or its description doesn't match how you phrase the request | Check the badge in `/skills`: a "user-only" label means Claude won't trigger it on its own. See [skill invocation](/docs/en/skills).                                                                                                                              |
| Subdirectory `CLAUDE.md` instructions seem ignored                   | Subdirectory files load on demand, not at session start                                                                    | They load when Claude reads a file in that directory with the Read tool, not at launch and not when writing or creating files there. See [how CLAUDE.md files load](/docs/en/memory#how-claude-md-files-load).                                                    |
| Subagent ignores `CLAUDE.md` instructions                            | The built-in Explore and Plan agents skip `CLAUDE.md`. Custom subagents load it the same way the main conversation does    | For Explore or Plan, restate the instruction in your delegating prompt. For a custom subagent, put critical instructions in the agent file body, which becomes the agent's system prompt. See [what loads at startup](/docs/en/sub-agents#what-loads-at-startup). |
| Cleanup logic never runs at session end                              | No `SessionEnd` hook configured                                                                                            | Add a `SessionEnd` hook in `settings.json`. See the [hook events list](/docs/en/hooks#hook-events).                                                                                                                                                               |
| MCP servers in `.mcp.json` never load                                | File is under `.claude/` or uses Claude Desktop's config format                                                            | Project MCP config goes at the repository root as `.mcp.json`, not inside `.claude/`. See [MCP configuration](/docs/en/mcp).                                                                                                                                      |
| MCP servers added under `mcpServers` in `settings.json` never appear | `settings.json` does not read an `mcpServers` key                                                                          | Define project servers in `.mcp.json` at the repository root, or run `claude mcp add --scope user` for user-scoped servers. See [MCP configuration](/docs/en/mcp).                                                                                                |
| Project MCP server added but doesn't appear                          | The one-time approval prompt was dismissed                                                                                 | Project-scoped servers require approval. Run `/mcp` to see status and approve.                                                                                                                                                                               |
| MCP server fails to start from some directories                      | `command` or `args` uses a relative file path                                                                              | Use absolute paths for local scripts. Executables on your `PATH` like `npx` or `uvx` work as-is.                                                                                                                                                             |
| MCP server starts without expected environment variables             | Variables are in `settings.json` `env`, which doesn't propagate to MCP child processes                                     | Set per-server `env` inside `.mcp.json` instead.                                                                                                                                                                                                             |
| `Bash(rm *)` deny rule doesn't block `/bin/rm` or `find -delete`     | Prefix rules match the literal command string, not the underlying executable                                               | Add explicit patterns for each variant, or use a [PreToolUse hook](/docs/en/hooks-guide) or the [sandbox](/docs/en/sandboxing) for a hard guarantee.                                                                                                                   |

## Related resources

For full reference on each configuration surface, see the dedicated page:

* **[`.claude` directory reference](/docs/en/claude-directory)**: every config file location and what reads it
* **[Settings](/docs/en/settings)**: precedence order and the full key list
* **[Hooks reference](/docs/en/hooks)**: event names, payloads, and `--debug hooks` output format
* **[MCP](/docs/en/mcp)**: server configuration, approval, and `/mcp` output
* **[Troubleshoot installation and login](/docs/en/troubleshoot-install)**: `command not found`, PATH, and authentication problems
* **[Troubleshooting](/docs/en/troubleshooting)**: performance, hangs, and search issues
