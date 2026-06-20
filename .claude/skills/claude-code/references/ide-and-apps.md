# IDE, Desktop & App Integrations

_Claude Code documentation — IDE, Desktop & App Integrations. Source: https://code.claude.com/docs/en/_


---

## Use Claude Code in VS Code

`https://code.claude.com/docs/en/vs-code`

Install and configure the Claude Code extension for VS Code. Get AI coding assistance with inline diffs, @-mentions, plan review, and keyboard shortcuts.

<img alt="VS Code editor with the Claude Code extension panel open on the right side, showing a conversation with Claude" />

The VS Code extension provides a native graphical interface for Claude Code, integrated directly into your IDE. This is the recommended way to use Claude Code in VS Code.

With the extension, you can review and edit Claude's plans before accepting them, auto-accept edits as they're made, @-mention files with specific line ranges from your selection, access conversation history, and open multiple conversations in separate tabs or windows.

## Prerequisites

Before installing, make sure you have:

* VS Code 1.98.0 or higher
* An Anthropic account (you'll sign in when you first open the extension). If you're using a third-party provider like Amazon Bedrock or Google Vertex AI, see [Use third-party providers](#use-third-party-providers) instead.

<Tip>
  The extension includes the CLI (command-line interface), which you can access from VS Code's integrated terminal for advanced features. See [VS Code extension vs. Claude Code CLI](#vs-code-extension-vs-claude-code-cli) for details.
</Tip>

## Install the extension

Click the link for your IDE to install directly:

* [Install for VS Code](vscode:extension/anthropic.claude-code)
* [Install for Cursor](cursor:extension/anthropic.claude-code)

Or in VS Code, press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux) to open the Extensions view, search for "Claude Code", and click **Install**.

The extension also installs in other VS Code forks like Windsurf or Kiro. Search for "Claude Code" in the editor's Extensions view, or install from the [Open VSX registry](https://open-vsx.org/extension/Anthropic/claude-code). If your editor can't install the extension, run `claude` in its integrated terminal instead. The [CLI](/docs/en/quickstart) works in any terminal.

<Note>If the extension doesn't appear after installation, restart VS Code or run "Developer: Reload Window" from the Command Palette.</Note>

## Get started

Once installed, you can start using Claude Code through the VS Code interface:

<Steps>
  <Step title="Open the Claude Code panel">
    Throughout VS Code, the Spark icon indicates Claude Code: <img alt="Spark icon" />

    The quickest way to open Claude is to click the Spark icon in the **Editor Toolbar** (top-right corner of the editor). The icon only appears when you have a file open.

    <img alt="VS Code editor showing the Spark icon in the Editor Toolbar" />

    Other ways to open Claude Code:

    * **Activity Bar**: click the Spark icon in the left sidebar to open the sessions list. Click any session to open it as a full editor tab, or start a new one. This icon is always visible in the Activity Bar.
    * **Command Palette**: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux), type "Claude Code", and select an option like "Open in New Tab"
    * **Status Bar**: click **✱ Claude Code** in the bottom-right corner of the window. This works even when no file is open.

    You can drag the Claude panel to reposition it anywhere in VS Code. See [Customize your workflow](#customize-your-workflow) for details.
  </Step>

  <Step title="Sign in">
    The first time you open the panel, a sign-in screen appears. Click **Sign in** and complete authorization in your browser.

    If you see **Not logged in · Please run /login** later, the extension reopens the sign-in screen automatically. If it doesn't appear, reload the window from the Command Palette with **Developer: Reload Window**.

    If you have `ANTHROPIC_API_KEY` set in your shell but still see the sign-in prompt, VS Code may not have inherited your shell environment. Launch VS Code from a terminal with `code .` so it inherits your environment variables, or sign in with your Claude account instead.

    After you sign in, a **Learn Claude Code** checklist appears. Work through each item by clicking **Show me**, or dismiss it with the X. To reopen it later, uncheck **Hide Onboarding** in VS Code settings under Extensions → Claude Code.
  </Step>

  <Step title="Send a prompt">
    Ask Claude to help with your code or files, whether that's explaining how something works, debugging an issue, or making changes.

    <Tip>Claude automatically sees your selected text. Press `Option+K` (Mac) / `Alt+K` (Windows/Linux) to also insert an @-mention reference (like `@file.ts#5-10`) into your prompt.</Tip>

    Here's an example of asking about a particular line in a file:

    <img alt="VS Code editor with lines 2-3 selected in a Python file, and the Claude Code panel showing a question about those lines with an @-mention reference" />
  </Step>

  <Step title="Review changes">
    When Claude wants to edit a file, it shows a side-by-side comparison of the original and proposed changes, then asks for permission. You can accept, reject, or tell Claude what to do instead. If you edit the proposed content directly in the diff view before accepting, Claude is told that you modified it so it does not assume the file matches its original proposal.

    <img alt="VS Code showing a diff of Claude's proposed changes with a permission prompt asking whether to make the edit" />
  </Step>
</Steps>

For more ideas on what you can do with Claude Code, see [Common workflows](/docs/en/common-workflows).

<Tip>
  Run "Claude Code: Open Walkthrough" from the Command Palette for a guided tour of the basics.
</Tip>

## Use the prompt box

The prompt box supports several features:

* **Permission modes**: click the mode indicator at the bottom of the prompt box to switch modes. In normal mode, Claude asks permission before each action. In Plan mode, Claude describes what it will do and waits for approval before making changes. VS Code automatically opens the plan as a full markdown document where you can add inline comments to give feedback before Claude begins. In auto-accept mode, Claude makes edits without asking. Set the default in VS Code settings under `claudeCode.initialPermissionMode`.
* **Command menu**: click `/` or type `/` to open the command menu. Options include attaching files, switching models, toggling extended thinking, viewing plan usage (`/usage`), and starting a [Remote Control](/docs/en/remote-control) session (`/remote-control`). The Customize section provides access to MCP servers, hooks, memory, permissions, and plugins. Items with a terminal icon open in the integrated terminal.
* **Context indicator**: the prompt box shows how much of Claude's context window you're using. Claude automatically compacts when needed, or you can run `/compact` manually.
* **Extended thinking**: lets Claude spend more time reasoning through complex problems. Toggle it on via the command menu (`/`). Claude's reasoning appears in the conversation as collapsed blocks: click a block to read it, or press `Ctrl+O` to expand or collapse every thinking block in the session. See [Extended thinking](/docs/en/model-config#extended-thinking) for details.
* **Multi-line input**: press `Shift+Enter` to add a new line without sending. This also works in the "Other" free-text input of question dialogs.

### Reference files and folders

Use @-mentions to give Claude context about specific files or folders. When you type `@` followed by a file or folder name, Claude reads that content and can answer questions about it or make changes to it. Claude Code supports fuzzy matching, so you can type partial names to find what you need:

```text theme={null}
> Explain the logic in @auth (fuzzy matches auth.js, AuthService.ts, etc.)
> What's in @src/components/ (include a trailing slash for folders)
```

For large PDFs, you can ask Claude to read specific pages instead of the whole file: a single page, a range like pages 1-10, or an open-ended range like page 3 onward.

When you select text in the editor, Claude can see your highlighted code automatically. The prompt box footer shows how many lines are selected. Press `Option+K` (Mac) / `Alt+K` (Windows/Linux) to insert an @-mention with the file path and line numbers (e.g., `@app.ts#5-10`). Click the selection indicator to toggle whether Claude can see your highlighted text - the eye-slash icon means the selection is hidden from Claude.

You can also hold `Shift` while dragging files into the prompt box to add them as attachments. Click the X on any attachment to remove it from context.

### Resume past conversations

Click the **Session history** button at the top of the Claude Code panel to access your conversation history. You can search by keyword or browse by time (Today, Yesterday, Last 7 days, etc.). Click any conversation to resume it with the full message history. New sessions receive AI-generated titles based on your first message. Hover over a session to reveal rename and remove actions: rename to give it a descriptive title, or remove to delete it from the list. For more on resuming sessions, see [Manage sessions](/docs/en/sessions).

### Resume remote sessions from Claude.ai

If you use [Claude Code on the web](/docs/en/claude-code-on-the-web), you can resume those remote sessions directly in VS Code. This requires signing in with **Claude.ai Subscription**, not Anthropic Console.

<Steps>
  <Step title="Open session history">
    Click the **Session history** button at the top of the Claude Code panel.
  </Step>

  <Step title="Select the Remote tab">
    The dialog shows two tabs: Local and Remote. Click **Remote** to see sessions from claude.ai.
  </Step>

  <Step title="Select a session to resume">
    Browse or search your remote sessions. Click any session to download it and continue the conversation locally.
  </Step>
</Steps>

<Note>
  Only web sessions started with a GitHub repository appear in the Remote tab. Resuming loads the conversation history locally; changes are not synced back to claude.ai.
</Note>

## Customize your workflow

Once you're up and running, you can reposition the Claude panel, run multiple sessions, or switch to terminal mode.

### Choose where Claude lives

You can drag the Claude panel to reposition it anywhere in VS Code. Grab the panel's tab or title bar and drag it to:

* **Secondary sidebar**: the right side of the window. Keeps Claude visible while you code.
* **Primary sidebar**: the left sidebar with icons for Explorer, Search, etc.
* **Editor area**: opens Claude as a tab alongside your files. Useful for side tasks.

<Tip>
  Use the sidebar for your main Claude session and open additional tabs for side tasks. Claude remembers your preferred location. The Activity Bar sessions list icon is separate from the Claude panel: the sessions list is always visible in the Activity Bar, while the Claude panel icon only appears there when the panel is docked to the left sidebar.
</Tip>

### Run multiple conversations

Use **Open in New Tab** or **Open in New Window** from the Command Palette to start additional conversations. Each conversation maintains its own history and context, allowing you to work on different tasks in parallel.

When using tabs, a small colored dot on the spark icon indicates status: blue means a permission request is pending, orange means Claude finished while the tab was hidden.

### Switch to terminal mode

By default, the extension opens a graphical chat panel. If you prefer the CLI-style interface, open the [Use Terminal setting](vscode://settings/claudeCode.useTerminal) and check the box.

You can also open VS Code settings (`Cmd+,` on Mac or `Ctrl+,` on Windows/Linux), go to Extensions → Claude Code, and check **Use Terminal**.

## Manage plugins

The VS Code extension includes a graphical interface for installing and managing [plugins](/docs/en/plugins). Type `/plugins` in the prompt box to open the **Manage plugins** interface.

### Install plugins

The plugin dialog shows two tabs: **Plugins** and **Marketplaces**.

In the Plugins tab:

* **Installed plugins** appear at the top with toggle switches to enable or disable them
* **Available plugins** from your configured marketplaces appear below
* Search to filter plugins by name or description
* Click **Install** on any available plugin

When you install a plugin, choose the installation scope:

* **Install for you**: available in all your projects (user scope)
* **Install for this project**: shared with project collaborators (project scope)
* **Install locally**: only for you, only in this repository (local scope)

### Manage marketplaces

Switch to the **Marketplaces** tab to add or remove plugin sources:

* Enter a GitHub repo, URL, or local path to add a new marketplace
* Click the refresh icon to update a marketplace's plugin list
* Click the trash icon to remove a marketplace

After making changes, a banner prompts you to restart Claude Code to apply the updates.

<Note>
  Plugin management in VS Code uses the same CLI commands under the hood. Plugins and marketplaces you configure in the extension are also available in the CLI, and vice versa.
</Note>

For more about the plugin system, see [Plugins](/docs/en/plugins) and [Plugin marketplaces](/docs/en/plugin-marketplaces).

## Automate browser tasks with Chrome

Connect Claude to your Chrome browser to test web apps, debug with console logs, and automate browser workflows without leaving VS Code. This requires the [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) version 1.0.36 or higher.

Type `@browser` in the prompt box followed by what you want Claude to do:

```text theme={null}
@browser go to localhost:3000 and check the console for errors
```

You can also open the attachment menu to select specific browser tools like opening a new tab or reading page content.

Claude opens new tabs for browser tasks and shares your browser's login state, so it can access any site you're already signed into.

For setup instructions, the full list of capabilities, and troubleshooting, see [Use Claude Code with Chrome](/docs/en/chrome).

## VS Code commands and shortcuts

Open the Command Palette (`Cmd+Shift+P` on Mac or `Ctrl+Shift+P` on Windows/Linux) and type "Claude Code" to see all available VS Code commands for the Claude Code extension.

Some shortcuts depend on which panel is "focused" (receiving keyboard input). When your cursor is in a code file, the editor is focused. When your cursor is in Claude's prompt box, Claude is focused. Use `Cmd+Esc` / `Ctrl+Esc` to toggle between them.

<Note>
  These are VS Code commands for controlling the extension. Not all built-in Claude Code commands are available in the extension. See [VS Code extension vs. Claude Code CLI](#vs-code-extension-vs-claude-code-cli) for details.
</Note>

| Command                    | Shortcut                                                 | Description                                                                                                                                                                                                   |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus Input                | `Cmd+Esc` (Mac) / `Ctrl+Esc` (Windows/Linux)             | Toggle focus between editor and Claude                                                                                                                                                                        |
| Open in Side Bar           | -                                                        | Open Claude in the left sidebar                                                                                                                                                                               |
| Open in Terminal           | -                                                        | Open Claude in terminal mode                                                                                                                                                                                  |
| Open in New Tab            | `Cmd+Shift+Esc` (Mac) / `Ctrl+Shift+Esc` (Windows/Linux) | Open a new conversation as an editor tab                                                                                                                                                                      |
| Open in New Window         | -                                                        | Open a new conversation in a separate window                                                                                                                                                                  |
| New Conversation           | `Cmd+N` (Mac) / `Ctrl+N` (Windows/Linux)                 | Start a new conversation. Requires Claude to be focused and `enableNewConversationShortcut` set to `true`                                                                                                     |
| Reopen Closed Session      | `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Windows/Linux)     | Reopen the most recently closed Claude session tab. Falls through to VS Code's normal reopen-closed-editor when the last closed tab wasn't a Claude session. Disable with `enableReopenClosedSessionShortcut` |
| Insert @-Mention Reference | `Option+K` (Mac) / `Alt+K` (Windows/Linux)               | Insert a reference to the current file and selection (requires editor to be focused)                                                                                                                          |
| Show Logs                  | -                                                        | View extension debug logs                                                                                                                                                                                     |
| Logout                     | -                                                        | Sign out of your Anthropic account                                                                                                                                                                            |

### Launch a VS Code tab from other tools

The extension registers a URI handler at `vscode://anthropic.claude-code/open`. Use it to open a new Claude Code tab from your own tooling: a shell alias, a browser bookmarklet, or any script that can open a URL. If VS Code isn't already running, opening the URL launches it first. If VS Code is already running, the URL opens in whichever window is currently focused.

Invoke the handler with your operating system's URL opener.

<Tabs>
  <Tab title="macOS">
    ```bash theme={null}
    open "vscode://anthropic.claude-code/open"
    ```
  </Tab>

  <Tab title="Linux">
    ```bash theme={null}
    xdg-open "vscode://anthropic.claude-code/open"
    ```
  </Tab>

  <Tab title="Windows">
    In PowerShell:

    ```powershell theme={null}
    Start-Process "vscode://anthropic.claude-code/open"
    ```

    In `cmd.exe`, `start` treats its first quoted argument as a window title, so pass an empty title before the URL:

    ```cmd theme={null}
    start "" "vscode://anthropic.claude-code/open"
    ```
  </Tab>
</Tabs>

The handler accepts two optional query parameters:

| Parameter | Description                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prompt`  | Text to pre-fill in the prompt box. Must be URL-encoded. The prompt is pre-filled but not submitted automatically.                                                                                                                                                                                                                                                             |
| `session` | A session ID to resume instead of starting a new conversation. The session must belong to the workspace currently open in VS Code. If the session isn't found, a fresh conversation starts instead. If the session is already open in a tab, that tab is focused. To capture a session ID programmatically, see [Continue conversations](/docs/en/headless#continue-conversations). |

For example, to open a tab pre-filled with "review my changes":

```text theme={null}
vscode://anthropic.claude-code/open?prompt=review%20my%20changes
```

To launch a terminal session instead of a VS Code tab, use the CLI's `claude-cli://` handler. See [Launch sessions from links](/docs/en/deep-links).

## Configure settings

The extension has two types of settings:

* **Extension settings** in VS Code: control the extension's behavior within VS Code. Open with `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux), then go to Extensions → Claude Code. You can also type `/` and select **General Config** to open settings.
* **Claude Code settings** in `~/.claude/settings.json`: shared between the extension and CLI. Use for allowed commands, environment variables, hooks, and MCP servers. See [Settings](/docs/en/settings) for details.

<Tip>
  Add `"$schema": "https://json.schemastore.org/claude-code-settings.json"` to your `settings.json` to get autocomplete and inline validation for all available settings directly in VS Code.
</Tip>

### Extension settings

| Setting                             | Default   | Description                                                                                                                                                                                                                   |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useTerminal`                       | `false`   | Launch Claude in terminal mode instead of graphical panel                                                                                                                                                                     |
| `initialPermissionMode`             | `default` | Controls approval prompts for new conversations: `default`, `plan`, `acceptEdits`, or `bypassPermissions`. See [permission modes](/docs/en/permission-modes).                                                                      |
| `preferredLocation`                 | `panel`   | Where Claude opens: `sidebar` (right) or `panel` (new tab)                                                                                                                                                                    |
| `autosave`                          | `true`    | Auto-save files before Claude reads or writes them                                                                                                                                                                            |
| `useCtrlEnterToSend`                | `false`   | Use Ctrl/Cmd+Enter instead of Enter to send prompts                                                                                                                                                                           |
| `enableNewConversationShortcut`     | `false`   | Enable Cmd/Ctrl+N to start a new conversation                                                                                                                                                                                 |
| `enableReopenClosedSessionShortcut` | `true`    | Use Cmd/Ctrl+Shift+T to reopen the most recently closed Claude session tab. When the last closed tab wasn't a Claude session, the shortcut runs VS Code's normal reopen-closed-editor command instead.                        |
| `hideOnboarding`                    | `false`   | Hide the onboarding checklist (graduation cap icon)                                                                                                                                                                           |
| `respectGitIgnore`                  | `true`    | Exclude .gitignore patterns from file searches                                                                                                                                                                                |
| `usePythonEnvironment`              | `true`    | Activate the workspace's Python environment when running Claude. Requires the Python extension.                                                                                                                               |
| `environmentVariables`              | `[]`      | Set environment variables for the Claude process. Use Claude Code settings instead for shared config.                                                                                                                         |
| `disableLoginPrompt`                | `false`   | Skip authentication prompts (for third-party provider setups)                                                                                                                                                                 |
| `allowDangerouslySkipPermissions`   | `false`   | Adds Bypass permissions to the mode selector. Use it only in sandboxes with no internet access.                                                                                                                               |
| `claudeProcessWrapper`              | -         | Executable used to launch the Claude process. The bundled binary path is passed as an argument when present. Set this to a separately installed `claude` binary if the extension build doesn't include one for your platform. |

## VS Code extension vs. Claude Code CLI

Claude Code is available as both a VS Code extension (graphical panel) and a CLI (command-line interface in the terminal). Some features are only available in the CLI. If you need a CLI-only feature, run `claude` in VS Code's integrated terminal.

| Feature             | CLI                 | VS Code Extension                                                                    |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| Commands and skills | [All](/docs/en/commands) | Subset (type `/` to see available)                                                   |
| MCP server config   | Yes                 | Partial (add servers via CLI; manage existing servers with `/mcp` in the chat panel) |
| Checkpoints         | Yes                 | Yes                                                                                  |
| `!` bash shortcut   | Yes                 | No                                                                                   |
| Tab completion      | Yes                 | No                                                                                   |

### Rewind with checkpoints

The VS Code extension supports checkpoints, which track Claude's file edits and let you rewind to a previous state. Hover over any message to reveal the rewind button, then choose from three options:

* **Fork conversation from here**: start a new conversation branch from this message while keeping all code changes intact
* **Rewind code to here**: revert file changes back to this point in the conversation while keeping the full conversation history
* **Fork conversation and rewind code**: start a new conversation branch and revert file changes to this point

For full details on how checkpoints work and their limitations, see [Checkpointing](/docs/en/checkpointing).

### Run CLI in VS Code

To use the CLI while staying in VS Code, open the integrated terminal (`` Ctrl+` `` on Windows/Linux or `` Cmd+` `` on Mac) and run `claude`. The CLI automatically integrates with your IDE for features like diff viewing and diagnostic sharing.

If using an external terminal, run `/ide` inside Claude Code to connect it to VS Code.

### Switch between extension and CLI

The extension and CLI share the same conversation history. To continue an extension conversation in the CLI, run `claude --resume` in the terminal. This opens an interactive picker where you can search for and select your conversation.

### Include terminal output in prompts

Reference terminal output in your prompts using `@terminal:name` where `name` is the terminal's title. This lets Claude see command output, error messages, or logs without copy-pasting.

### Monitor background processes

When Claude runs long-running commands, the extension shows progress in the status bar. However, visibility for background tasks is limited compared to the CLI. For better visibility, have Claude output the command so you can run it in VS Code's integrated terminal.

### Connect to external tools with MCP

MCP (Model Context Protocol) servers give Claude access to external tools, databases, and APIs.

To add an MCP server, open the integrated terminal (`` Ctrl+` `` or `` Cmd+` ``) and run `claude mcp add`. The example below adds GitHub's remote MCP server, which authenticates with a [personal access token](https://github.com/settings/personal-access-tokens) passed as a header:

```bash theme={null}
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer YOUR_GITHUB_PAT"
```

Once configured, ask Claude to use the tools (e.g., "Review PR #456").

To manage MCP servers without leaving VS Code, type `/mcp` in the chat panel. The MCP management dialog lets you enable or disable servers, reconnect to a server, and manage OAuth authentication. See the [MCP documentation](/docs/en/mcp) for available servers.

## Work with git

Claude Code integrates with git to help with version control workflows directly in VS Code. Ask Claude to commit changes, create pull requests, or work across branches.

### Create commits and pull requests

Claude can stage changes, write commit messages, and create pull requests based on your work:

```text theme={null}
> commit my changes with a descriptive message
> create a pr for this feature
> summarize the changes I've made to the auth module
```

When creating pull requests, Claude generates descriptions based on the actual code changes and can add context about testing or implementation decisions.

### Use git worktrees for parallel tasks

Use the `--worktree` (`-w`) flag to start Claude in an isolated worktree with its own files and branch:

```bash theme={null}
claude --worktree feature-auth
```

Each worktree maintains independent file state while sharing git history. This prevents Claude instances from interfering with each other when working on different tasks. For more details, see [Run parallel sessions with Git worktrees](/docs/en/worktrees).

## Use third-party providers

By default, Claude Code connects directly to Anthropic's API. If your organization uses Amazon Bedrock, Google Vertex AI, or Microsoft Foundry to access Claude, configure the extension to use your provider instead:

<Steps>
  <Step title="Disable login prompt">
    Open the [Disable Login Prompt setting](vscode://settings/claudeCode.disableLoginPrompt) and check the box.

    You can also open VS Code settings (`Cmd+,` on Mac or `Ctrl+,` on Windows/Linux), search for "Claude Code login", and check **Disable Login Prompt**.
  </Step>

  <Step title="Configure your provider">
    Follow the setup guide for your provider:

    * [Claude Code on Amazon Bedrock](/docs/en/amazon-bedrock)
    * [Claude Code on Google Vertex AI](/docs/en/google-vertex-ai)
    * [Claude Code on Microsoft Foundry](/docs/en/microsoft-foundry)

    These guides cover configuring your provider in `~/.claude/settings.json`, which ensures your settings are shared between the VS Code extension and the CLI.
  </Step>
</Steps>

## Security and privacy

Your code stays private. Claude Code processes your code to provide assistance but does not use it to train models. For details on data handling and how to opt out of logging, see [Data and privacy](/docs/en/data-usage).

With auto-edit permissions enabled, Claude Code can modify VS Code configuration files (like `settings.json` or `tasks.json`) that VS Code may execute automatically. To reduce risk when working with untrusted code:

* Enable [VS Code Restricted Mode](https://code.visualstudio.com/docs/editor/workspace-trust#_restricted-mode) for untrusted workspaces
* Use manual approval mode instead of auto-accept for edits
* Review changes carefully before accepting them

### The built-in IDE MCP server

When the extension is active, it runs a local MCP server that the CLI connects to automatically. This is how the CLI opens diffs in VS Code's native diff viewer, reads your current selection for `@`-mentions, and — when you're working in a Jupyter notebook — asks VS Code to execute cells.

The server is named `ide` and is hidden from `/mcp` because there's nothing to configure. If your organization uses a `PreToolUse` hook to allowlist MCP tools, though, you'll need to know it exists.

**Selection and open-file context.** While connected, the CLI includes your current editor selection and the path of the active file as context on each prompt you send. The transcript shows a `⧉ Selected N lines from <file>` line when this happens. To exclude a sensitive file such as `.env`, add a [`Read` deny rule](/docs/en/permissions#read-and-edit) for its path. A matching deny rule prevents both the selected text and the open-file notice for that file from reaching Claude.

**Transport and authentication.** The server binds to `127.0.0.1` on a random high port and is not reachable from other machines. Each extension activation generates a fresh random auth token that the CLI must present to connect. The token is written to a lock file under `~/.claude/ide/` with `0600` permissions in a `0700` directory, so only the user running VS Code can read it.

**Tools exposed to the model.** The server hosts a dozen tools, but only two are visible to the model. The rest are internal RPC the CLI uses for its own UI — opening diffs, reading selections, saving files — and are filtered out before the tool list reaches Claude.

| Tool name (as seen by hooks) | What it does                                                                                                              | Writes? |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------- |
| `mcp__ide__getDiagnostics`   | Returns language-server diagnostics — the errors and warnings in VS Code's Problems panel. Optionally scoped to one file. | No      |
| `mcp__ide__executeCode`      | Runs Python code in the active Jupyter notebook's kernel. See confirmation flow below.                                    | Yes     |

**Jupyter execution always asks first.** `mcp__ide__executeCode` can't run anything silently. On each call, the code is inserted as a new cell at the end of the active notebook, VS Code scrolls it into view, and a native Quick Pick asks you to **Execute** or **Cancel**. Cancelling — or dismissing the picker with `Esc` — returns an error to Claude and nothing runs. The tool also refuses outright when there's no active notebook, when the Jupyter extension (`ms-toolsai.jupyter`) isn't installed, or when the kernel isn't Python.

<Note>
  The Quick Pick confirmation is separate from `PreToolUse` hooks. An allowlist entry for `mcp__ide__executeCode` lets Claude *propose* running a cell; the Quick Pick inside VS Code is what lets it *actually* run.
</Note>

<a />

## Fix common issues

### Extension won't install

* Ensure you have a compatible version of VS Code (1.98.0 or later)
* Check that VS Code has permission to install extensions
* Try installing directly from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)

### Spark icon not visible

The Spark icon appears in the **Editor Toolbar** (top-right of editor) when you have a file open. If you don't see it:

1. **Open a file**: The icon requires a file to be open. Having just a folder open isn't enough.
2. **Check VS Code version**: Requires 1.98.0 or higher (Help → About)
3. **Restart VS Code**: Run "Developer: Reload Window" from the Command Palette
4. **Disable conflicting extensions**: Temporarily disable other AI extensions (Cline, Continue, etc.)
5. **Check workspace trust**: The extension doesn't work in Restricted Mode

Alternatively, click "✱ Claude Code" in the **Status Bar** (bottom-right corner). This works even without a file open. You can also use the **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`) and type "Claude Code".

### Cmd+Esc does nothing on macOS

On macOS Tahoe and later, the system Game Overlay shortcut is bound to `Cmd+Esc` by default and intercepts the keypress before it reaches VS Code. To free the shortcut:

1. Open System Settings
2. Go to Keyboard, then Keyboard Shortcuts, then Game Controllers
3. Clear the Game Overlay checkbox

Alternatively, rebind the extension to a different key: open the VS Code [Keyboard Shortcuts editor](https://code.visualstudio.com/docs/configure/keybindings) (`Cmd+K Cmd+S`), search for `Claude Code: Focus input`, and assign a new binding.

### Claude Code never responds

If Claude Code isn't responding to your prompts:

1. **Check your internet connection**: Ensure you have a stable internet connection
2. **Start a new conversation**: Try starting a fresh conversation to see if the issue persists
3. **Try the CLI**: Run `claude` from the terminal to see if you get more detailed error messages

If problems persist, [file an issue on GitHub](https://github.com/anthropics/claude-code/issues) with details about the error.

## Uninstall the extension

To uninstall the Claude Code extension:

1. Open the Extensions view (`Cmd+Shift+X` on Mac or `Ctrl+Shift+X` on Windows/Linux)
2. Search for "Claude Code"
3. Click **Uninstall**

To also remove extension data and reset all settings:

```bash theme={null}
rm -rf ~/.vscode/globalStorage/anthropic.claude-code
```

For additional help, see the [troubleshooting guide](/docs/en/troubleshooting).

## Next steps

Now that you have Claude Code set up in VS Code:

* [Explore common workflows](/docs/en/common-workflows) to get the most out of Claude Code
* [Set up MCP servers](/docs/en/mcp) to extend Claude's capabilities with external tools. Add servers using the CLI, then manage them with `/mcp` in the chat panel.
* [Configure Claude Code settings](/docs/en/settings) to customize allowed commands, hooks, and more. These settings are shared between the extension and CLI.


---

## JetBrains IDEs

`https://code.claude.com/docs/en/jetbrains`

Use Claude Code with JetBrains IDEs including IntelliJ, PyCharm, WebStorm, and more

Claude Code integrates with JetBrains IDEs through a dedicated plugin, providing features like interactive diff viewing, selection context sharing, and more.

## Supported IDEs

The Claude Code plugin works with most JetBrains IDEs, including:

* IntelliJ IDEA
* PyCharm
* Android Studio
* WebStorm
* PhpStorm
* GoLand

## Features

* **Quick launch**: use `Cmd+Esc` (Mac) or `Ctrl+Esc` (Windows/Linux) to open Claude Code directly from your editor, or click the Claude Code button in the UI
* **Diff viewing**: code changes can be displayed directly in the IDE diff viewer instead of the terminal
* **Selection context**: the current selection or tab in the IDE is automatically shared with Claude Code. [`Read` deny rules](/docs/en/permissions#read-and-edit) block this sharing for matching files
* **File reference shortcuts**: use `Cmd+Option+K` (Mac) or `Alt+Ctrl+K` (Linux/Windows) to insert file references such as `@src/auth.ts#L1-99`
* **Diagnostic sharing**: diagnostic errors from the IDE, such as lint and syntax errors, are automatically shared with Claude as you work

## Installation

### Marketplace installation

Find and install the [Claude Code plugin](https://plugins.jetbrains.com/plugin/27310-claude-code-beta-) from the JetBrains marketplace and restart your IDE.

If you haven't installed Claude Code yet, see the [quickstart guide](/docs/en/quickstart) for installation instructions.

<Note>
  After installing the plugin, you may need to restart your IDE completely for it to take effect.
</Note>

## Usage

### From your IDE

Run `claude` from your IDE's integrated terminal, and all integration features will be active.

### From external terminals

Use the `/ide` command in any external terminal to connect Claude Code to your JetBrains IDE and activate all features:

```bash theme={null}
claude
```

```text theme={null}
/ide
```

If you want Claude to have access to the same files as your IDE, start Claude Code from the same directory as your IDE project root.

## Configuration

### Claude Code settings

Configure IDE integration through Claude Code's settings:

1. Run `claude`
2. Enter the `/config` command
3. Set the diff tool to `auto` to show diffs in the IDE, or `terminal` to keep them in the terminal

### Plugin settings

Configure the Claude Code plugin by going to **Settings → Tools → Claude Code \[Beta]**:

#### General settings

* **Claude command**: specify a custom command to run Claude, for example `claude`, `/usr/local/bin/claude`, or `npx @anthropic-ai/claude-code`
* **Suppress notification for Claude command not found**: skip notifications about not finding the Claude command
* **Enable using Option+Enter for multi-line prompts**: on macOS only. When enabled, Option+Enter inserts new lines in Claude Code prompts. Disable if the Option key is being captured unexpectedly. Requires a terminal restart.
* **Enable automatic updates**: automatically check for and install plugin updates, applied on restart

<Tip>
  For WSL users: Set `wsl -d Ubuntu -- bash -lic "claude"` as your Claude command (replace `Ubuntu` with your WSL distribution name)
</Tip>

#### ESC key configuration

If the ESC key doesn't interrupt Claude Code operations in JetBrains terminals:

1. Go to **Settings → Tools → Terminal**
2. Either:
   * Uncheck "Move focus to the editor with Escape", or
   * Click "Configure terminal keybindings" and delete the "Switch focus to Editor" shortcut
3. Apply the changes

This allows the ESC key to properly interrupt Claude Code operations.

## Special configurations

### Remote development

<Warning>
  When using JetBrains Remote Development, you must install the plugin in the remote host via **Settings → Plugin (Host)**.
</Warning>

The plugin must be installed on the remote host, not on your local client machine.

### WSL configuration

If you're using Claude Code on WSL2 with a JetBrains IDE and see "No available IDEs detected", the cause is usually WSL2's NAT networking or Windows Firewall blocking the connection between WSL2 and the IDE running on the Windows host. WSL1 uses the host's network directly and isn't affected.

#### Allow WSL2 traffic through Windows Firewall

This is the recommended fix because it keeps your existing WSL2 networking mode.

<Steps>
  <Step title="Find your WSL2 IP address">
    From inside your WSL shell, run:

    ```bash theme={null}
    hostname -I
    ```

    Note the subnet, for example `172.21.123.45` is in `172.21.0.0/16`.
  </Step>

  <Step title="Create a firewall rule">
    Open PowerShell as Administrator and run the following, adjusting the IP range to match your subnet:

    ```powershell theme={null}
    New-NetFirewallRule -DisplayName "Allow WSL2 Internal Traffic" -Direction Inbound -Protocol TCP -Action Allow -RemoteAddress 172.21.0.0/16 -LocalAddress 172.21.0.0/16
    ```
  </Step>

  <Step title="Restart your IDE and Claude Code">
    Close and reopen both so the new rule takes effect.
  </Step>
</Steps>

#### Switch WSL2 to mirrored networking

Mirrored networking requires Windows 11 22H2 or later. If you're on Windows 10, use the firewall rule above instead.

Add this to `.wslconfig` in your Windows user directory:

```ini theme={null}
[wsl2]
networkingMode=mirrored
```

Then restart WSL with `wsl --shutdown` from PowerShell.

## Troubleshooting

### Plugin not working

If the plugin is installed but Claude Code features don't appear in your IDE:

* Ensure you're running Claude Code from the project root directory
* Check that the JetBrains plugin is enabled in the IDE settings
* Completely restart the IDE (you may need to do this multiple times)
* For Remote Development, ensure the plugin is installed in the remote host

### IDE not detected

If running `claude` shows "No available IDEs detected":

* Verify the plugin is installed and enabled
* Restart the IDE completely
* Check that you're running Claude Code from the integrated terminal
* For WSL users, see [WSL configuration](#wsl-configuration) above

### Command not found

If clicking the Claude icon shows "command not found":

1. Verify Claude Code is installed by running `claude --version` in a terminal
2. Configure the Claude command path in plugin settings
3. For WSL users, use the WSL command format mentioned in the configuration section

## Security considerations

When Claude Code runs in a JetBrains IDE with auto-edit permissions enabled, it may be able to modify IDE configuration files that can be automatically executed by your IDE. This may increase the risk of running Claude Code in auto-edit mode and allow bypassing Claude Code's permission prompts for bash execution.

When running in JetBrains IDEs, consider:

* Using manual approval mode for edits
* Taking extra care to ensure Claude is only used with trusted prompts
* Being aware of which files Claude Code has access to modify

For Claude Code installation or login problems outside the IDE, see [Troubleshoot installation and login](/docs/en/troubleshoot-install).


---

## Desktop application

`https://code.claude.com/docs/en/desktop`

Get more out of Claude Code Desktop: parallel sessions with Git isolation, drag-and-drop pane layout, integrated terminal and file editor, side chats, computer use, Dispatch sessions from your phone, visual diff review, app previews, PR monitoring, connectors, and enterprise configuration.

The Claude Desktop app has three tabs: **Chat** for conversations, **Cowork** for [Dispatch and longer agentic work](https://claude.com/product/cowork), and **Code** for software development. This page is the reference for the Code tab.

<CardGroup>
  <Card title="Download for macOS" icon="apple" href="https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code&utm_medium=docs">
    Universal build for Intel and Apple Silicon
  </Card>

  <Card title="Download for Windows" icon="windows" href="https://claude.ai/api/desktop/win32/x64/setup/latest/redirect?utm_source=claude_code&utm_medium=docs">
    For x64 processors
  </Card>
</CardGroup>

For Windows ARM64, download the [ARM64 installer](https://claude.ai/api/desktop/win32/arm64/setup/latest/redirect?utm_source=claude_code\&utm_medium=docs). The desktop app is not available on Linux; use the [CLI](/docs/en/quickstart) instead.

After installing, launch Claude, sign in, and click the **Code** tab. The first time you open it on Windows, you need [Git for Windows](https://git-scm.com/downloads/win) installed; restart the app after installing it. For a walkthrough of your first session, see the [Get started guide](/docs/en/desktop-quickstart).

In the Code tab, each conversation is a **session**: it has its own chat history, project folder, and code changes, independent of any other session. The sidebar lists your sessions and lets you run several in parallel. Within a session you can:

* [Review and comment on diffs](#review-changes-with-diff-view), then [watch the resulting PR through CI](#monitor-pull-request-status)
* [Preview your running app](#preview-your-app) in an embedded browser while Claude verifies its own changes
* [Arrange panes](#arrange-your-workspace) for the chat, diff, preview, terminal, and file editor side by side
* Ask a [side question](#ask-a-side-question-without-derailing-the-session) that uses the session's context without derailing it
* [Connect external tools](#connect-external-tools) like GitHub, Slack, and Linear
* Let Claude [open apps and control your screen](#let-claude-use-your-computer)
* Run on your machine, in the [cloud](#run-long-running-tasks-remotely), or over [SSH](#ssh-sessions)

For [scheduled recurring work](/docs/en/desktop-scheduled-tasks), [keyboard shortcuts](#keyboard-shortcuts), or [sending tasks from your phone](#sessions-from-dispatch), see the linked pages and sections. If you already use the terminal-based CLI, see the [CLI comparison](#coming-from-the-cli) for what carries over.

## Start a session

Before you send your first message, configure four things in the prompt area:

* **Environment**: choose where Claude runs. Select **Local** for your machine, **Remote** for Anthropic-hosted cloud sessions, or an [**SSH connection**](#ssh-sessions) for a remote machine you manage. See [environment configuration](#environment-configuration).
* **Project folder**: select the folder or repository Claude works in. For remote sessions, you can add [multiple repositories](#run-long-running-tasks-remotely).
* **Model**: pick a [model](/docs/en/model-config#available-models) from the dropdown next to the send button. You can change this during the session.
* **Permission mode**: choose how much autonomy Claude has from the [mode selector](#choose-a-permission-mode). You can change this during the session.

Type your task and press **Enter** to start. Each session tracks its own context and changes independently.

## Work with code

Give Claude the right context, control how much it does on its own, and review what it changed.

### Use the prompt box

Type what you want Claude to do and press **Enter** to send. Claude reads your project files, makes changes, and runs commands based on your [permission mode](#choose-a-permission-mode). You can redirect Claude at any point: click the stop button to interrupt immediately, or type a correction and press **Enter** to send it without stopping the running action. Claude reads the correction as soon as the current action completes and adjusts before its next step.

The **+** button next to the prompt box gives you access to file attachments, [skills](#use-skills), [connectors](#connect-external-tools), and [plugins](#install-plugins).

### Add files and context to prompts

The prompt box supports two ways to bring in external context:

* **@mention files**: type `@` followed by a filename to add a file to the conversation context. Claude can then read and reference that file. @mention is not available in remote sessions.
* **Attach files**: attach images, PDFs, and other files to your prompt using the attachment button, or drag and drop files directly into the prompt. This is useful for sharing screenshots of bugs, design mockups, or reference documents.

### Choose a permission mode

Permission modes control how much autonomy Claude has during a session: whether it asks before editing files, running commands, or both. You can switch modes at any time using the mode selector next to the send button. Start with Ask permissions to see exactly what Claude does, then move to Auto accept edits or Plan mode as you get comfortable.

| Mode                   | Settings key        | Behavior                                                                                                                                                                                                                                                                     |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ask permissions**    | `default`           | Claude asks before editing files or running commands. You see a diff and can accept or reject each change. Recommended for new users.                                                                                                                                        |
| **Auto accept edits**  | `acceptEdits`       | Claude auto-accepts file edits and common filesystem commands like `mkdir`, `touch`, and `mv`, but still asks before running other terminal commands. Use this when you trust file changes and want faster iteration.                                                        |
| **Plan mode**          | `plan`              | Claude reads files and runs commands to explore, then proposes a plan without editing your source code. Good for complex tasks where you want to review the approach first.                                                                                                  |
| **Auto**               | `auto`              | Claude executes all actions with background safety checks that verify alignment with your request. Reduces permission prompts while maintaining oversight. Enable in your Settings → Claude Code. See [availability requirements](#auto-mode-availability) below.            |
| **Bypass permissions** | `bypassPermissions` | Claude runs without any permission prompts, equivalent to `--dangerously-skip-permissions` in the CLI. Enable in your Settings → Claude Code under "Allow bypass permissions mode". Only use this in sandboxed containers or VMs. Enterprise admins can disable this option. |

The `dontAsk` permission mode is available only in the [CLI](/docs/en/permission-modes#allow-only-pre-approved-tools-with-dontask-mode).

<span />

Auto mode is a research preview available to all users on the Anthropic API. It is not available on third-party providers. It requires Claude Opus 4.6 or later, or Sonnet 4.6.

<Tip title="Best practice">
  Start complex tasks in Plan mode so Claude maps out an approach before making changes. Once you approve the plan, switch to Auto accept edits or Ask permissions to execute it. See [explore first, then plan, then code](/docs/en/best-practices#explore-first-then-plan-then-code) for more on this workflow.
</Tip>

Remote sessions support Auto accept edits and Plan mode. Ask permissions is not available because remote sessions auto-accept file edits by default, and Bypass permissions is not available because the remote environment is already sandboxed.

Enterprise admins can restrict which permission modes are available. See [enterprise configuration](#enterprise-configuration) for details.

### Preview your app

Claude can start a dev server and open an embedded browser to verify its changes. This works for frontend web apps as well as backend servers: Claude can test API endpoints, view server logs, and iterate on issues it finds. In most cases, Claude starts the server automatically after editing project files. You can also ask Claude to preview at any time. By default, Claude [auto-verifies](#auto-verify-changes) changes after every edit.

The preview pane can also open static HTML files, PDFs, images, and videos from your project. Click an HTML, PDF, image, or video path in the chat to open it in preview.

From the preview pane, you can:

* Interact with your running app directly in the embedded browser
* Watch Claude verify its own changes automatically: it takes screenshots, inspects the DOM, clicks elements, fills forms, and fixes issues it finds
* Start or stop servers from the **Preview** dropdown in the session toolbar
* Persist cookies and local storage across server restarts by selecting **Persist sessions** in the dropdown, so you don't have to re-login during development
* Edit the server configuration or stop all servers at once

Claude creates the initial server configuration based on your project. If your app uses a custom dev command, edit `.claude/launch.json` to match your setup. See [Configure preview servers](#configure-preview-servers) for the full reference.

To clear saved session data, toggle **Persist preview sessions** off in Settings → Claude Code. To disable preview entirely, toggle off **Preview** in Settings → Claude Code.

### Review changes with diff view

After Claude makes changes to your code, the diff view lets you review modifications file by file before creating a pull request.

When Claude changes files, a diff stats indicator appears showing the number of lines added and removed, such as `+12 -1`. Click this indicator to open the diff viewer, which displays a file list on the left and the changes for each file on the right.

To comment on specific lines, click any line in the diff to open a comment box. Type your feedback and press **Enter** to add the comment. After adding comments to multiple lines, submit all comments at once:

* **macOS**: press **Cmd+Enter**
* **Windows**: press **Ctrl+Enter**

Claude reads your comments and makes the requested changes, which appear as a new diff you can review.

### Review your code

In the diff view, click **Review code** in the top-right toolbar to ask Claude to evaluate the changes before you commit. Claude examines the current diffs and leaves comments directly in the diff view. You can respond to any comment or ask Claude to revise.

The review focuses on high-signal issues: compile errors, definite logic errors, security vulnerabilities, and obvious bugs. It does not flag style, formatting, pre-existing issues, or anything a linter would catch.

### Monitor pull request status

After you open a pull request, a CI status bar appears in the session. Claude Code uses the GitHub CLI to poll check results and surface failures.

* **Auto-fix**: when enabled, Claude automatically attempts to fix failing CI checks by reading the failure output and iterating.
* **Auto-merge**: when enabled, Claude merges the PR once all checks pass. The merge method is squash. Auto-merge must be [enabled in your GitHub repository settings](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) for this to work.

Use the **Auto-fix** and **Auto-merge** toggles in the CI status bar to enable either option. Claude Code also sends a desktop notification when CI finishes. To archive the session automatically once the PR merges or closes, turn on [auto-archive](#work-in-parallel-with-sessions) in Settings → Claude Code.

<Note>
  PR monitoring requires the [GitHub CLI (`gh`)](https://cli.github.com/) to be installed and authenticated on your machine. If `gh` is not installed, Desktop prompts you to install it the first time you try to create a PR.
</Note>

## Arrange your workspace

The Code tab is built around panes you can arrange in any layout: chat, diff, preview, terminal, file, plan, tasks, and subagent. Drag a pane by its header to reposition it, or drag a pane edge to resize it. Press **Cmd+\\** on macOS or **Ctrl+\\** on Windows to close the focused pane. Open additional panes from the **Views** menu in the session toolbar.

<Note>
  The pane layout, terminal, file editor, and view modes in this section require Claude Desktop v1.2581.0 or later. Open **Claude → Check for Updates** on macOS or **Help → Check for Updates** on Windows to update.
</Note>

### Run commands in the terminal

The integrated terminal lets you run commands alongside your session without switching to another app. Open it from the **Views** menu or press **Ctrl+\`** on macOS or Windows. The terminal opens in your session's working directory and shares the same environment as Claude, so commands like `npm test` or `git status` see the same files Claude is editing. To open a second terminal tab, click **+** in the terminal pane header or right-click a folder in the chat to choose **Open in terminal**. The terminal is available in local sessions only.

### Open and edit files

Click a file path in the chat or diff viewer to open it in the file pane. HTML, PDF, image, and video paths open in the [preview pane](#preview-your-app) instead. Make spot edits and click **Save** to write them back. If the file changed on disk since you opened it, the pane warns you and lets you override or discard. Click **Discard** to revert your edits, or click the path in the pane header to copy the absolute path.

The file pane is available in local and SSH sessions. For remote sessions, ask Claude to make the change.

### Open files in other apps

Right-click any file path in the chat, diff viewer, or file pane to open a context menu:

* **Attach as context**: add the file to your next prompt
* **Open in**: open the file in an installed editor such as VS Code, Cursor, or Zed
* **Show in Finder** on macOS, **Show in Explorer** on Windows: open the containing folder
* **Copy path**: copy the absolute path to your clipboard

### Switch view modes

View modes control how much detail appears in the chat transcript. Switch modes from the **Transcript view** dropdown next to the send button, or press **Ctrl+O** on macOS or Windows to cycle through them.

| Mode        | What it shows                                                  |
| ----------- | -------------------------------------------------------------- |
| **Normal**  | Tool calls collapsed into summaries, with full text responses  |
| **Verbose** | Every tool call, file read, and intermediate step Claude takes |
| **Summary** | Only Claude's final responses and the changes it made          |

Use Verbose when debugging why Claude took a particular action. Use Summary when you're running multiple sessions and want to scan results quickly.

### Keyboard shortcuts

Press **Cmd+/** on macOS or **Ctrl+/** on Windows to see all shortcuts available in the Code tab. On Windows, use **Ctrl** in place of **Cmd** for the shortcuts below. Session cycling, the terminal toggle, and the view-mode toggle use **Ctrl** on every platform.

| Shortcut                              | Action                       |
| ------------------------------------- | ---------------------------- |
| `Cmd` `/`                             | Show keyboard shortcuts      |
| `Cmd` `N`                             | New session                  |
| `Cmd` `W`                             | Close session                |
| `Ctrl` `Tab` / `Ctrl` `Shift` `Tab`   | Next or previous session     |
| `Cmd` `Shift` `]` / `Cmd` `Shift` `[` | Next or previous session     |
| `Esc`                                 | Stop Claude's response       |
| `Cmd` `Shift` `D`                     | Toggle diff pane             |
| `Cmd` `Shift` `P`                     | Toggle preview pane          |
| `Cmd` `Shift` `S`                     | Select an element in preview |
| `Ctrl` `` ` ``                        | Toggle terminal pane         |
| `Cmd` `\`                             | Close focused pane           |
| `Cmd` `;`                             | Open side chat               |
| `Ctrl` `O`                            | Cycle view modes             |
| `Cmd` `Shift` `M`                     | Open permission mode menu    |
| `Cmd` `Shift` `I`                     | Open model menu              |
| `Cmd` `Shift` `E`                     | Open effort menu             |
| `1`–`9`                               | Select item in an open menu  |

These shortcuts apply only to the Code tab. The terminal-based [interactive mode shortcuts](/docs/en/interactive-mode#keyboard-shortcuts), such as `Shift+Tab` to cycle modes, do not apply in Desktop.

### Check usage

Click the usage ring next to the model picker to see your current context window usage and your plan usage for the period. Context usage is per session; plan usage is shared across all your Claude Code surfaces.

## Let Claude use your computer

Computer use lets Claude open your apps, control your screen, and work directly on your machine the way you would. Ask Claude to test a native app in a mobile simulator, interact with a desktop tool that has no CLI, or automate something that only works through a GUI.

<Note>
  Computer use is a research preview on macOS and Windows that requires a Pro or Max plan. It is not available on Team or Enterprise plans. The Claude Desktop app must be running.
</Note>

Computer use is off by default. [Enable it in Settings](#enable-computer-use) before Claude can control your screen. On macOS, you also need to grant Accessibility and Screen Recording permissions.

<Warning>
  Unlike the [sandboxed Bash tool](/docs/en/sandboxing), computer use runs on your actual desktop with access to whatever you approve. Claude checks each action and flags potential prompt injection from on-screen content, but the trust boundary is different. See the [computer use safety guide](https://support.claude.com/en/articles/14128542) for best practices.
</Warning>

### When computer use applies

Claude has several ways to interact with an app or service, and computer use is the broadest and slowest. It tries the most precise tool first:

* If you have a [connector](#connect-external-tools) for a service, Claude uses the connector.
* If the task is a shell command, Claude uses Bash.
* If the task is browser work and you have [Claude in Chrome](/docs/en/chrome) set up, Claude uses that.
* If none of those apply, Claude uses computer use.

The [per-app access tiers](#app-permissions) reinforce this: browsers are capped at view-only, and terminals and IDEs at click-only, steering Claude toward the dedicated tool even when computer use is active. Screen control is reserved for things nothing else can reach, like native apps, hardware control panels, mobile simulators, or proprietary tools without an API.

### Enable computer use

Computer use is off by default. If you ask Claude to do something that needs it while it's off, Claude tells you it could do the task if you enable computer use in Settings.

<Steps>
  <Step title="Update the desktop app">
    Make sure you have the latest version of Claude Desktop. Download or update at [claude.com/download](https://claude.com/download), then restart the app.
  </Step>

  <Step title="Turn on the toggle">
    In the desktop app, go to **Settings > General** (under **Desktop app**). Find the **Computer use** toggle and turn it on. On Windows, the toggle takes effect immediately and setup is complete. On macOS, continue to the next step.

    If you don't see the toggle, confirm you're on macOS or Windows with a Pro or Max plan, then update and restart the app.
  </Step>

  <Step title="Grant macOS permissions">
    On macOS, grant two system permissions before the toggle takes effect:

    * **Accessibility**: lets Claude click, type, and scroll
    * **Screen Recording**: lets Claude see what's on your screen

    The Settings page shows the current status of each permission. If either is denied, click the badge to open the relevant System Settings pane.
  </Step>
</Steps>

### App permissions

The first time Claude needs to use an app, a prompt appears in your session. Click **Allow for this session** or **Deny**. Approvals last for the current session, or 30 minutes in [Dispatch-spawned sessions](#sessions-from-dispatch).

The prompt also shows what level of control Claude gets for that app. These tiers are fixed by app category and can't be changed:

| Tier         | What Claude can do                                       | Applies to                  |
| :----------- | :------------------------------------------------------- | :-------------------------- |
| View only    | See the app in screenshots                               | Browsers, trading platforms |
| Click only   | Click and scroll, but not type or use keyboard shortcuts | Terminals, IDEs             |
| Full control | Click, type, drag, and use keyboard shortcuts            | Everything else             |

Apps with broad reach, like terminals, Finder or File Explorer, and System Settings or Settings, show an extra warning in the prompt so you know what approving them grants.

You can configure two settings in **Settings > General** (under **Desktop app**):

* **Denied apps**: add apps here to reject them without prompting. Claude may still affect a denied app indirectly through actions in an allowed app, but it can't interact with the denied app directly.
* **Unhide apps when Claude finishes**: while Claude is working, your other windows are hidden so it interacts with only the approved app. When Claude finishes, hidden windows are restored unless you turn this setting off.

## Manage sessions

Each session is an independent conversation with its own context and changes. You can run multiple sessions in parallel, branch off side chats, send work to the cloud, or let Dispatch start sessions for you from your phone.

### Work in parallel with sessions

Click **+ New session** in the sidebar, or press **Cmd+N** on macOS or **Ctrl+N** on Windows, to work on multiple tasks in parallel. Press **Ctrl+Tab** and **Ctrl+Shift+Tab** to cycle through sessions in the sidebar. For Git repositories, each session gets its own isolated copy of your project using [Git worktrees](/docs/en/worktrees), so changes in one session don't affect other sessions until you commit them.

To view two sessions at once, hold **Cmd** on macOS or **Ctrl** on Windows and click a session in the sidebar. The session opens in a second pane alongside the one you already have open. While the split is active, clicking another sidebar session replaces whichever pane has focus. Press **Cmd+\\** on macOS or **Ctrl+\\** on Windows to close the focused pane and return to a single session.

Worktrees are stored in `<project-root>/.claude/worktrees/` by default. You can change this to a custom directory in Settings → Claude Code under "Worktree location". You can also set a branch prefix that gets prepended to every worktree branch name, which is useful for keeping Claude-created branches organized. To remove a worktree when you're done, hover over the session in the sidebar and click the archive icon. To have sessions archive themselves when their pull request merges or closes, turn on **Auto-archive after PR merge or close** in Settings → Claude Code. Auto-archive only applies to local sessions that have finished running.

To include gitignored files like `.env` in new worktrees, create a [`.worktreeinclude` file](/docs/en/worktrees#copy-gitignored-files-into-worktrees) in your project root.

<Note>
  Session isolation requires [Git](https://git-scm.com/downloads). Most Macs include Git by default. Run `git --version` in Terminal to check. On Windows, Git is required for the Code tab to work: [download Git for Windows](https://git-scm.com/downloads/win), install it, and restart the app. If you run into Git errors, ask Claude in the [Cowork tab](https://claude.com/product/cowork) to help troubleshoot your setup.
</Note>

Use the controls at the top of the sidebar to filter sessions by status, project, or environment, and to group sessions by project. To rename a session, click the session title in the toolbar at the top of the active session. To check context usage, see [Check usage](#check-usage). When context fills up, Claude automatically summarizes the conversation and continues working. You can also type `/compact` to trigger summarization earlier and free up context space. See [the context window](/docs/en/how-claude-code-works#the-context-window) for details on how compaction works.

The desktop app sends an OS notification when a Code session finishes a task and you aren't currently viewing that session.

### Ask a side question without derailing the session

A side chat lets you ask Claude a question that uses your session's context but doesn't add anything back to the main conversation. Use it when you want to understand a piece of code, check an assumption, or explore an idea without steering the session off course.

Press **Cmd+;** on macOS or **Ctrl+;** on Windows to open a side chat, or type `/btw` in the prompt box. The side chat can read everything in the main thread up to that point. When you're done, close the side chat and continue the main session where you left off. Side chats are available in local and SSH sessions.

### Watch background tasks

The tasks pane shows the background work running inside the current session: subagents, background shell commands, and [dynamic workflows](/docs/en/workflows). Open it from the **Views** menu or drag it into your layout.

Click any entry to see its output in the subagent pane or stop it. To see what other sessions are doing, use the [sidebar](#work-in-parallel-with-sessions).

### Run long-running tasks remotely

For large refactors, test suites, migrations, or other long-running tasks, select **Remote** instead of **Local** when starting a session. Remote sessions run on Anthropic's cloud infrastructure and continue even if you close the app or shut down your computer. Check back anytime to see progress or steer Claude in a different direction. You can also monitor remote sessions from [claude.ai/code](https://claude.ai/code) or the Claude iOS app.

Remote sessions also support multiple repositories. After selecting a cloud environment, click the **+** button next to the repo pill to add additional repositories to the session. Each repo gets its own branch selector. This is useful for tasks that span multiple codebases, such as updating a shared library and its consumers.

See [Claude Code on the web](/docs/en/claude-code-on-the-web) for more on how remote sessions work.

### Continue in another surface

The **Continue in** menu, accessible from the VS Code icon in the bottom right of the session toolbar, lets you move your session to another surface:

* **Claude Code on the Web**: sends your local session to continue running remotely. Desktop pushes your branch, generates a summary of the conversation, and creates a new remote session with the full context. You can then choose to archive the local session or keep it. This requires a clean working tree, and is not available for SSH sessions.
* **Your IDE**: opens your project in a supported IDE at the current working directory.

### Sessions from Dispatch

[Dispatch](https://support.claude.com/en/articles/13947068) is a persistent conversation with Claude that lives in the [Cowork](https://claude.com/product/cowork#dispatch-and-computer-use) tab. You message Dispatch a task, and it decides how to handle it.

A task can end up as a Code session in two ways: you ask for one directly, such as "open a Claude Code session and fix the login bug", or Dispatch decides the task is development work and spawns one on its own. Tasks that typically route to Code include fixing bugs, updating dependencies, running tests, or opening pull requests. Research, document editing, and spreadsheet work stay in Cowork.

Either way, the Code session appears in the Code tab's sidebar with a **Dispatch** badge. You get a push notification on your phone when it finishes or needs your approval.

If you have [computer use](#let-claude-use-your-computer) enabled, Dispatch-spawned Code sessions can use it too. App approvals in those sessions expire after 30 minutes and re-prompt, rather than lasting the full session like regular Code sessions.

For setup, pairing, and Dispatch settings, see the [Dispatch help article](https://support.claude.com/en/articles/13947068). Dispatch requires a Pro or Max plan and is not available on Team or Enterprise plans.

Dispatch is one of several ways to work with Claude when you're away from your terminal. See [Platforms and integrations](/docs/en/platforms#work-when-you-are-away-from-your-terminal) to compare it with Remote Control, Channels, Slack, and scheduled tasks.

## Extend Claude Code

Connect external services, add reusable workflows, customize Claude's behavior, and configure preview servers. To manage connectors, skills, and plugins in one place, click **Customize** in the sidebar.

### Connect external tools

For local and [SSH](#ssh-sessions) sessions, click the **+** button next to the prompt box and select **Connectors** to add integrations like Google Calendar, Slack, GitHub, Linear, Notion, and more. You can add connectors before or during a session. The **+** button is not available in remote sessions, but [routines](/docs/en/routines) configure connectors at routine creation time.

To manage or disconnect connectors, go to Settings → Connectors in the desktop app, or select **Manage connectors** from the Connectors menu in the prompt box.

Once connected, Claude can read your calendar, send messages, create issues, and interact with your tools directly. You can ask Claude what connectors are configured in your session.

Connectors are [MCP servers](/docs/en/mcp) with a graphical setup flow. Use them for quick integration with supported services. For integrations not listed in Connectors, add MCP servers manually via [settings files](/docs/en/mcp#installing-mcp-servers). You can also [create custom connectors](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp).

### Use skills

[Skills](/docs/en/skills) extend what Claude can do. Claude loads them automatically when relevant, or you can invoke one directly: type `/` in the prompt box or click the **+** button and select **Slash commands** to browse what's available. This includes [built-in commands](/docs/en/commands), your [custom skills](/docs/en/skills#create-your-first-skill), project skills from your codebase, and skills from any [installed plugins](/docs/en/plugins). Select one and it appears highlighted in the input field. Type your task after it and send as usual.

### Install plugins

[Plugins](/docs/en/plugins) are reusable packages that add skills, agents, hooks, MCP servers, and LSP configurations to Claude Code. You can install plugins from the desktop app without using the terminal.

For local and [SSH](#ssh-sessions) sessions, click the **+** button next to the prompt box and select **Plugins** to see your installed plugins and their skills. To add a plugin, select **Add plugin** from the submenu to open the plugin browser, which shows available plugins from your configured [marketplaces](/docs/en/plugin-marketplaces) including the official Anthropic marketplace. Select **Manage plugins** to enable, disable, or uninstall plugins.

Plugins can be scoped to your user account, a specific project, or local-only. If your organization manages plugins centrally, those plugins are available in desktop sessions the same way they are in the CLI. Plugins are not available for remote sessions. For the full plugin reference including creating your own plugins, see [plugins](/docs/en/plugins).

### Configure preview servers

Claude automatically detects your dev server setup and stores the configuration in `.claude/launch.json` at the root of the folder you selected when starting the session. Preview uses this folder as its working directory, so if you selected a parent folder, subfolders with their own dev servers won't be detected automatically. To work with a subfolder's server, either start a session in that folder directly or add a configuration manually.

To customize how your server starts, for example to use `yarn dev` instead of `npm run dev` or to change the port, edit the file manually or click **Edit configuration** in the Preview dropdown to open it in your code editor. The file supports JSON with comments.

```json theme={null}
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "my-app",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3000
    }
  ]
}
```

You can define multiple configurations to run different servers from the same project, such as a frontend and an API. See the [examples](#examples) below.

#### Auto-verify changes

When `autoVerify` is enabled, Claude automatically verifies code changes after editing files. It takes screenshots, checks for errors, and confirms changes work before completing its response.

Auto-verify is on by default. Disable it per-project by adding `"autoVerify": false` to `.claude/launch.json`, or toggle it from the **Preview** dropdown menu.

```json theme={null}
{
  "version": "0.0.1",
  "autoVerify": false,
  "configurations": [...]
}
```

When disabled, preview tools are still available and you can ask Claude to verify at any time. Auto-verify makes it automatic after every edit.

#### Configuration fields

Each entry in the `configurations` array accepts the following fields:

| Field               | Type      | Description                                                                                                                                                                                                                                                              |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`              | string    | A unique identifier for this server                                                                                                                                                                                                                                      |
| `runtimeExecutable` | string    | The command to run, such as `npm`, `yarn`, or `node`                                                                                                                                                                                                                     |
| `runtimeArgs`       | string\[] | Arguments passed to `runtimeExecutable`, such as `["run", "dev"]`                                                                                                                                                                                                        |
| `port`              | number    | The port your server listens on. Defaults to 3000                                                                                                                                                                                                                        |
| `cwd`               | string    | Working directory relative to your project root. Defaults to the project root. Use `${workspaceFolder}` to reference the project root explicitly                                                                                                                         |
| `env`               | object    | Additional environment variables as key-value pairs, such as `{ "NODE_ENV": "development" }`. Don't put secrets here since this file is committed to your repo. To pass secrets to your dev server, set them in the [local environment editor](#local-sessions) instead. |
| `autoPort`          | boolean   | How to handle port conflicts. See below                                                                                                                                                                                                                                  |
| `program`           | string    | A script to run with `node`. See [when to use `program` vs `runtimeExecutable`](#when-to-use-program-vs-runtimeexecutable)                                                                                                                                               |
| `args`              | string\[] | Arguments passed to `program`. Only used when `program` is set                                                                                                                                                                                                           |

##### When to use `program` vs `runtimeExecutable`

Use `runtimeExecutable` with `runtimeArgs` to start a dev server through a package manager. For example, `"runtimeExecutable": "npm"` with `"runtimeArgs": ["run", "dev"]` runs `npm run dev`.

Use `program` when you have a standalone script you want to run with `node` directly. For example, `"program": "server.js"` runs `node server.js`. Pass additional flags with `args`.

#### Port conflicts

The `autoPort` field controls what happens when your preferred port is already in use:

* **`true`**: Claude finds and uses a free port automatically. Suitable for most dev servers.
* **`false`**: Claude fails with an error. Use this when your server must use a specific port, such as for OAuth callbacks or CORS allowlists.
* **Not set (default)**: Claude asks whether the server needs that exact port, then saves your answer.

When Claude picks a different port, it passes the assigned port to your server via the `PORT` environment variable.

#### Examples

These configurations show common setups for different project types:

<Tabs>
  <Tab title="Next.js">
    This configuration runs a Next.js app using Yarn on port 3000:

    ```json theme={null}
    {
      "version": "0.0.1",
      "configurations": [
        {
          "name": "web",
          "runtimeExecutable": "yarn",
          "runtimeArgs": ["dev"],
          "port": 3000
        }
      ]
    }
    ```
  </Tab>

  <Tab title="Multiple servers">
    For a monorepo with a frontend and an API server, define multiple configurations. The frontend uses `autoPort: true` so it picks a free port if 3000 is taken, while the API server requires port 8080 exactly:

    ```json theme={null}
    {
      "version": "0.0.1",
      "configurations": [
        {
          "name": "frontend",
          "runtimeExecutable": "npm",
          "runtimeArgs": ["run", "dev"],
          "cwd": "apps/web",
          "port": 3000,
          "autoPort": true
        },
        {
          "name": "api",
          "runtimeExecutable": "npm",
          "runtimeArgs": ["run", "start"],
          "cwd": "server",
          "port": 8080,
          "env": { "NODE_ENV": "development" },
          "autoPort": false
        }
      ]
    }
    ```
  </Tab>

  <Tab title="Node.js script">
    To run a Node.js script directly instead of using a package manager command, use the `program` field:

    ```json theme={null}
    {
      "version": "0.0.1",
      "configurations": [
        {
          "name": "server",
          "program": "server.js",
          "args": ["--verbose"],
          "port": 4000
        }
      ]
    }
    ```
  </Tab>
</Tabs>

## Environment configuration

The environment you pick when [starting a session](#start-a-session) determines where Claude executes and how you connect:

* **Local**: runs on your machine with direct access to your files
* **Remote**: runs on Anthropic's cloud infrastructure. Sessions continue even if you close the app.
* **SSH**: runs on a remote machine you connect to over SSH, such as your own servers, cloud VMs, or dev containers

### Local sessions

The desktop app does not always inherit your full shell environment. On macOS, when you launch the app from the Dock or Finder, it reads your shell profile, such as `~/.zshrc` or `~/.bashrc`, to extract `PATH` and a fixed set of Claude Code variables, but other variables you export there are not picked up. On Windows, the app inherits user and system environment variables but does not read PowerShell profiles.

To set environment variables for local sessions and dev servers on any platform, open the environment dropdown in the prompt box, hover over **Local**, and click the gear icon to open the local environment editor. Variables you save here are stored encrypted on your machine and apply to every local session and preview server you start. You can also add variables to the `env` key in your `~/.claude/settings.json` file, though these reach Claude sessions only and not dev servers. See [environment variables](/docs/en/env-vars) for the full list of supported variables.

[Extended thinking](/docs/en/model-config#extended-thinking) is enabled by default, which improves performance on complex reasoning tasks but uses additional tokens. To disable thinking entirely, set `MAX_THINKING_TOKENS` to `0` in the local environment editor. On models with [adaptive reasoning](/docs/en/model-config#adjust-effort-level), any other `MAX_THINKING_TOKENS` value is ignored because adaptive reasoning controls thinking depth instead. On Opus 4.6 and Sonnet 4.6, set `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` to `1` to use a fixed thinking budget; Opus 4.7 and later always use adaptive reasoning and have no fixed-budget mode.

### Remote sessions

Remote sessions continue in the background even if you close the app. Usage counts toward your [subscription plan limits](/docs/en/costs) with no separate compute charges.

You can create custom cloud environments with different network access levels and environment variables. Select the environment dropdown when starting a remote session and choose **Add environment**. See [the cloud environment](/docs/en/claude-code-on-the-web#the-cloud-environment) for details on configuring network access and environment variables.

### SSH sessions

SSH sessions let you run Claude Code on a remote machine while using the desktop app as your interface. This is useful for working with codebases that live on cloud VMs, dev containers, or servers with specific hardware or dependencies.

To add an SSH connection, click the environment dropdown before starting a session and select **+ Add SSH connection**. The dialog asks for:

* **Name**: a friendly label for this connection
* **SSH Host**: `user@hostname` or a host defined in `~/.ssh/config`
* **SSH Port**: defaults to 22 if left empty, or uses the port from your SSH config
* **Identity File**: path to your private key, such as `~/.ssh/id_rsa`. Leave empty to use the default key or your SSH config.

Once added, the connection appears in the environment dropdown. Select it to start a session on that machine. Claude runs on the remote machine with access to its files and tools.

The remote machine must run Linux or macOS. Desktop installs Claude Code on the remote machine automatically the first time you connect. Once connected, SSH sessions support permission modes, connectors, plugins, and MCP servers.

#### Pre-configure SSH connections for your team

Administrators can distribute SSH connections to team members by adding `sshConfigs` to a [managed settings](/docs/en/settings#settings-precedence) file. Connections defined this way appear in each user's environment dropdown automatically and are shown as managed, so users can select them but cannot edit or delete them in the app.

The following example pre-configures a single connection that opens in `~/projects` on the remote host:

```json theme={null}
{
  "sshConfigs": [
    {
      "id": "shared-dev-vm",
      "name": "Shared Dev VM",
      "sshHost": "user@dev.example.com",
      "sshPort": 22,
      "sshIdentityFile": "~/.ssh/id_ed25519",
      "startDirectory": "~/projects"
    }
  ]
}
```

Each entry requires `id`, `name`, and `sshHost`. The `sshPort`, `sshIdentityFile`, and `startDirectory` fields are optional. Users can also add `sshConfigs` to their own `~/.claude/settings.json`, which is where connections added through the dialog are stored.

#### Restrict which SSH hosts users can connect to

Administrators can limit Desktop's SSH sessions to an approved set of hosts by adding `sshHostAllowlist` to a [managed settings](/docs/en/settings#settings-precedence) file. When set, users can only connect to hosts whose resolved hostname matches one of the patterns. Set it to an empty array to disable SSH sessions entirely.

The following example allows connections to any host under `devboxes.example.com` and to a single named bastion host:

```json theme={null}
{
  "sshHostAllowlist": ["*.devboxes.example.com", "bastion.example.com"]
}
```

Patterns are case-insensitive. `*` matches any host, and `*.example.com` matches `example.com` and any subdomain. Anything else is an exact match. The check runs against the hostname after `~/.ssh/config` resolution via `ssh -G`, so `Host` aliases and `ProxyCommand`/`ProxyJump` entries are permitted as long as the resolved `HostName` matches.

`sshHostAllowlist` is read from managed settings only; values in user or project settings are ignored. Only the Claude Desktop app honors this setting; the Claude Code CLI and IDE extensions do not read it, and it does not restrict `ssh` commands run through the Bash tool. It governs which hosts the Desktop app connects to, not network egress, so pair it with your organization's network or zero-trust controls if you need a hard boundary.

## Enterprise configuration

Organizations on Team or Enterprise plans can manage desktop app behavior through admin console controls, managed settings files, and device management policies.

### Admin console controls

These settings are configured through the [admin settings console](https://claude.ai/admin-settings/claude-code):

* **Code in the desktop**: control whether users in your organization can access Claude Code in the desktop app
* **Code in the web**: enable or disable [web sessions](/docs/en/claude-code-on-the-web) for your organization
* **Remote Control**: enable or disable [Remote Control](/docs/en/remote-control) for your organization
* **Disable Bypass permissions mode**: prevent users in your organization from enabling bypass permissions mode

### Managed settings

Managed settings override project and user settings and apply when Desktop spawns CLI sessions. You can set these keys in your organization's [managed settings](/docs/en/settings#settings-precedence) file or push them remotely through the admin console.

| Key                                        | Description                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permissions.disableBypassPermissionsMode` | set to `"disable"` to prevent users from enabling Bypass permissions mode.                                                                                                                                                                                                                                              |
| `disableAutoMode`                          | set to `"disable"` to prevent users from enabling [Auto](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) mode. Removes Auto from the mode selector. Also accepted under `permissions`.                                                                                                                           |
| `autoMode`                                 | customize what the auto mode classifier trusts and blocks across your organization. See [Configure auto mode](/docs/en/auto-mode-config).                                                                                                                                                                                    |
| `sshConfigs`                               | pre-configure [SSH connections](#pre-configure-ssh-connections-for-your-team) that appear in the environment dropdown. Users cannot edit or delete managed connections.                                                                                                                                                 |
| `sshHostAllowlist`                         | restrict [SSH sessions](#restrict-which-ssh-hosts-users-can-connect-to) to hosts whose resolved hostname matches one of these patterns. An empty array disables SSH sessions. Read from managed settings only.                                                                                                          |
| `managedMcpServers`                        | push MCP server configurations to all users in a third-party deployment. Each entry specifies a transport of `"http"`, `"sse"`, or `"stdio"`, connection details, and optionally a `toolPolicy` map that restricts which tools in that server users can invoke. Available in third-party (3P) Desktop deployments only. |

A managed settings file deployed to disk on each machine applies to Desktop sessions. Managed settings pushed remotely through the admin console currently reach CLI and IDE sessions only, so for Desktop deployments either distribute the file via MDM or use the [admin console controls](#admin-console-controls) above.

`permissions.disableBypassPermissionsMode` and `disableAutoMode` also work in user and project settings, but placing them in managed settings prevents users from overriding them. `autoMode` is read from user settings, `.claude/settings.local.json`, and managed settings, but not from the checked-in `.claude/settings.json`: a cloned repo cannot inject its own classifier rules. For the complete list of managed-only settings including `allowManagedPermissionRulesOnly` and `allowManagedHooksOnly`, see [managed-only settings](/docs/en/permissions#managed-only-settings).

### Device management policies

IT teams can manage the desktop app through MDM on macOS or group policy on Windows. Available policies include enabling or disabling the Claude Code feature, controlling auto-updates, and setting a custom deployment URL.

* **macOS**: configure via `com.anthropic.Claude` preference domain using tools like Jamf or Kandji
* **Windows**: configure via registry at `SOFTWARE\Policies\Claude`

### Authentication and SSO

Enterprise organizations can require SSO for all users. See [authentication](/docs/en/authentication) for plan-level details and [Setting up SSO](https://support.claude.com/en/articles/13132885-setting-up-single-sign-on-sso) for SAML and OIDC configuration.

### Data handling

Claude Code processes your code locally in local sessions or on Anthropic's cloud infrastructure in remote sessions. Conversations and code context are sent to Anthropic's API for processing. See [data handling](/docs/en/data-usage) for details on data retention, privacy, and compliance.

### Deployment

Desktop can be distributed through enterprise deployment tools:

* **macOS**: distribute via MDM such as Jamf or Kandji using the `.dmg` installer
* **Windows**: deploy via MSIX package or `.exe` installer. See [Deploy Claude Desktop for Windows](https://support.claude.com/en/articles/12622703-deploy-claude-desktop-for-windows) for enterprise deployment options including silent installation

For network configuration such as proxy settings, firewall allowlisting, and LLM gateways, see [network configuration](/docs/en/network-config).

For the full enterprise configuration reference, see the [enterprise configuration guide](https://support.claude.com/en/articles/12622667-enterprise-configuration).

## Coming from the CLI?

If you already use the Claude Code CLI, Desktop runs the same underlying engine with a graphical interface. You can run both simultaneously on the same machine, even on the same project. Each maintains separate session history, but they share configuration and project memory via CLAUDE.md files.

To move a CLI session into Desktop, run `/desktop` in the terminal. Claude saves your session and opens it in the desktop app, then exits the CLI. This command is available on macOS and Windows when you are signed in with a Claude subscription. It is not available with API key authentication or on Bedrock, Vertex, or Foundry.

<Tip>
  When to use Desktop vs CLI: use Desktop when you want to manage parallel sessions in one window, arrange panes side by side, or review changes visually. Use the CLI when you need scripting, automation, or prefer a terminal workflow.
</Tip>

### CLI flag equivalents

This table shows the desktop app equivalent for common CLI flags. Flags not listed have no desktop equivalent because they are designed for scripting or automation.

| CLI                                   | Desktop equivalent                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--model sonnet`                      | Model dropdown next to the send button                                                                                                   |
| `--resume`, `--continue`              | Click a session in the sidebar                                                                                                           |
| `--permission-mode`                   | Mode selector next to the send button                                                                                                    |
| `--dangerously-skip-permissions`      | Bypass permissions mode. Enable in Settings → Claude Code → "Allow bypass permissions mode". Enterprise admins can disable this setting. |
| `--add-dir`                           | Add multiple repos with the **+** button in remote sessions                                                                              |
| `--allowedTools`, `--disallowedTools` | No per-session equivalent. Permission rules in [settings files](/docs/en/settings) still apply.                                               |
| `--verbose`                           | [Verbose view mode](#switch-view-modes) in the Transcript view dropdown                                                                  |
| `--print`, `--output-format`          | Not available. Desktop is interactive only.                                                                                              |
| `ANTHROPIC_MODEL` env var             | Model dropdown next to the send button                                                                                                   |
| `MAX_THINKING_TOKENS` env var         | Set in the local environment editor. See [environment configuration](#environment-configuration).                                        |

### Shared configuration

Desktop and CLI read the same configuration files, so your setup carries over:

* **[CLAUDE.md](/docs/en/memory)** and `CLAUDE.local.md` files in your project are used by both
* **[MCP servers](/docs/en/mcp)** configured in `~/.claude.json` or `.mcp.json` work in both
* **[Hooks](/docs/en/hooks)** and **[skills](/docs/en/skills)** defined in settings apply to both
* **[Settings](/docs/en/settings)** in `~/.claude.json` and `~/.claude/settings.json` are shared. Permission rules, allowed tools, and other settings in `settings.json` apply to Desktop sessions.
* **Models**: Sonnet, Opus, and Haiku are available in both. In Desktop, select the model from the dropdown next to the send button. You can change the model mid-session from the same dropdown.

<Note>
  **MCP servers: desktop chat app vs Claude Code**: MCP servers configured for the Claude Desktop chat app in `claude_desktop_config.json` are separate from Claude Code and will not appear in the Code tab. To use MCP servers in Claude Code, configure them in `~/.claude.json` or your project's `.mcp.json` file. See [MCP configuration](/docs/en/mcp#installing-mcp-servers) for details.
</Note>

### Feature comparison

This table compares core capabilities between the CLI and Desktop. For a full list of CLI flags, see the [CLI reference](/docs/en/cli-reference).

| Feature                                               | CLI                                                       | Desktop                                                                                                                                                                                                               |
| ----------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permission modes                                      | All modes including `dontAsk`                             | Ask permissions, Auto accept edits, Plan mode, Auto, and Bypass permissions via Settings                                                                                                                              |
| `--dangerously-skip-permissions`                      | CLI flag                                                  | Bypass permissions mode. Enable in Settings → Claude Code → "Allow bypass permissions mode"                                                                                                                           |
| [Third-party providers](/docs/en/third-party-integrations) | Bedrock, Vertex, Foundry                                  | Anthropic's API by default. Enterprise deployments can configure Vertex AI and gateway providers. See the [enterprise configuration guide](https://support.claude.com/en/articles/12622667-enterprise-configuration). |
| [MCP servers](/docs/en/mcp)                                | Configure in settings files                               | Connectors UI for local and SSH sessions, or settings files                                                                                                                                                           |
| [Plugins](/docs/en/plugins)                                | `/plugin` command                                         | Plugin manager UI                                                                                                                                                                                                     |
| @mention files                                        | Text-based                                                | With autocomplete; local and SSH sessions only                                                                                                                                                                        |
| File attachments                                      | Not available                                             | Images, PDFs                                                                                                                                                                                                          |
| Session isolation                                     | [`--worktree`](/docs/en/cli-reference) flag                    | Automatic worktrees                                                                                                                                                                                                   |
| Multiple sessions                                     | Separate terminals                                        | Sidebar tabs                                                                                                                                                                                                          |
| Recurring tasks                                       | Cron jobs, CI pipelines                                   | [Scheduled tasks](/docs/en/desktop-scheduled-tasks)                                                                                                                                                                        |
| Computer use                                          | [Enable via `/mcp`](/docs/en/computer-use) on macOS            | [App and screen control](#let-claude-use-your-computer) on macOS and Windows                                                                                                                                          |
| Dispatch integration                                  | Not available                                             | [Dispatch sessions](#sessions-from-dispatch) in the sidebar                                                                                                                                                           |
| Scripting and automation                              | [`--print`](/docs/en/cli-reference), [Agent SDK](/docs/en/headless) | Not available                                                                                                                                                                                                         |

### What's not available in Desktop

The following features are only available in the CLI or VS Code extension:

* **Third-party providers**: Desktop connects to Anthropic's API by default. Enterprise deployments can configure Vertex AI and gateway providers via [managed settings](https://support.claude.com/en/articles/12622667-enterprise-configuration). For Bedrock or Foundry, use the [CLI](/docs/en/quickstart).
* **Linux**: the desktop app is available on macOS and Windows only. On Linux, use the [CLI](/docs/en/quickstart).
* **Inline code suggestions**: Desktop does not provide autocomplete-style suggestions. It works through conversational prompts and explicit code changes.
* **Agent teams**: parallel Claude Code sessions that message each other are available in the [CLI](/docs/en/agent-teams), not in Desktop. For multi-agent work inside one session, use [dynamic workflows](/docs/en/workflows), which run in Desktop.
* **Terminal-dialog commands**: built-in commands that open an interactive panel in the terminal, such as `/permissions`, `/config`, `/agents`, and `/doctor`, are not available in the Code tab and reply with `isn't available in this environment`. Edit [settings files](/docs/en/settings) directly to manage permission rules and configuration, or run the command from the standalone CLI.

## Troubleshooting

The sections below cover issues specific to the desktop app. For runtime API errors that appear in the chat such as `API Error: 500`, `529 Overloaded`, `429`, or `Prompt is too long`, see the [Error reference](/docs/en/errors). Those errors and their fixes are the same across the CLI, desktop, and web.

### Check your version

To see which version of the desktop app you're running:

* **macOS**: click **Claude** in the menu bar, then **About Claude**
* **Windows**: click **Help**, then **About**

Click the version number to copy it to your clipboard.

### 403 or authentication errors in the Code tab

If you see `Error 403: Forbidden` or other authentication failures when using the Code tab:

1. Sign out and back in from the app menu. This is the most common fix.
2. Verify you have an active paid subscription: Pro, Max, Team, or Enterprise.
3. If the CLI works but Desktop does not, quit the desktop app completely, not just close the window, then reopen and sign in again.
4. Check your internet connection and proxy settings.

### Blank or stuck screen on launch

If the app opens but shows a blank or unresponsive screen:

1. Restart the app.
2. Check for pending updates. The app auto-updates on launch.
3. On Windows, check Event Viewer for crash logs under **Windows Logs → Application**.

### "Failed to load session"

If you see `Failed to load session`, the selected folder may no longer exist, a Git repository may require Git LFS that isn't installed, or file permissions may prevent access. Try selecting a different folder or restarting the app.

### Session not finding installed tools

If Claude can't find tools like `npm`, `node`, or other CLI commands, verify the tools work in your regular terminal, check that your shell profile properly sets up PATH, and restart the desktop app to reload environment variables.

### Git and Git LFS errors

On Windows, Git is required for the Code tab to start local sessions. If you see "Git is required," install [Git for Windows](https://git-scm.com/downloads/win) and restart the app.

If you see "Git LFS is required by this repository but is not installed," install Git LFS from [git-lfs.com](https://git-lfs.com/), run `git lfs install`, and restart the app.

### MCP servers not working on Windows

If MCP server toggles don't respond or servers fail to connect on Windows, check that the server is properly configured in your settings, restart the app, verify the server process is running in Task Manager, and review server logs for connection errors.

### App won't quit

* **macOS**: press Cmd+Q. If the app doesn't respond, use Force Quit with Cmd+Option+Esc, select Claude, and click Force Quit.
* **Windows**: use Task Manager with Ctrl+Shift+Esc to end the Claude process.

### Windows-specific issues

* **PATH not updated after install**: open a new terminal window. PATH updates only apply to new terminal sessions.
* **Concurrent installation error**: if you see an error about another installation in progress but there isn't one, try running the installer as Administrator.

### "Branch doesn't exist yet" when opening in CLI

Remote sessions can create branches that don't exist on your local machine. Click the branch name in the session toolbar to copy it, then fetch it locally:

```bash theme={null}
git fetch origin <branch-name>
git checkout <branch-name>
```

### Still stuck?

* Search or file a bug on [GitHub Issues](https://github.com/anthropics/claude-code/issues)
* Visit the [Claude support center](https://support.claude.com/)

When filing a bug, include your desktop app version, your operating system, the exact error message, and relevant logs. On macOS, check Console.app. On Windows, check Event Viewer → Windows Logs → Application.


---

## Use Claude Code with Chrome (beta)

`https://code.claude.com/docs/en/chrome`

Connect Claude Code to your Chrome browser to test web apps, debug with console logs, automate form filling, and extract data from web pages.

Claude Code integrates with the [Claude in Chrome browser extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) to give you browser automation capabilities from the CLI or the [VS Code extension](/docs/en/vs-code#automate-browser-tasks-with-chrome). Build your code, then test and debug in the browser without switching contexts.

Claude opens new tabs for browser tasks and shares your browser's login state, so it can access any site you're already signed into. Browser actions run in a visible Chrome window in real time. When Claude encounters a login page or CAPTCHA, it pauses and asks you to handle it manually.

<Note>
  Chrome integration is in beta and currently works with Google Chrome and Microsoft Edge. It is not yet supported on Brave, Arc, or other Chromium-based browsers. WSL (Windows Subsystem for Linux) is also not supported.
</Note>

## Capabilities

With Chrome connected, you can chain browser actions with coding tasks in a single workflow:

* **Live debugging**: read console errors and DOM state directly, then fix the code that caused them
* **Design verification**: build a UI from a Figma mock, then open it in the browser to verify it matches
* **Web app testing**: test form validation, check for visual regressions, or verify user flows
* **Authenticated web apps**: interact with Google Docs, Gmail, Notion, or any app you're logged into without API connectors
* **Data extraction**: pull structured information from web pages and save it locally
* **Task automation**: automate repetitive browser tasks like data entry, form filling, or multi-site workflows
* **Session recording**: record browser interactions as GIFs to document or share what happened

## Prerequisites

Before using Claude Code with Chrome, you need:

* [Google Chrome](https://www.google.com/chrome/) or [Microsoft Edge](https://www.microsoft.com/edge) browser
* [Claude in Chrome extension](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn) version 1.0.36 or higher, available in the Chrome Web Store for both browsers
* [Claude Code](/docs/en/quickstart#step-1-install-claude-code) version 2.0.73 or higher
* A direct Anthropic plan (Pro, Max, Team, or Enterprise)

<Note>
  Chrome integration is not available through third-party providers like Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry. If you access Claude exclusively through a third-party provider, you need a separate claude.ai account to use this feature.
</Note>

## Get started in the CLI

<Steps>
  <Step title="Launch Claude Code with Chrome">
    Start Claude Code with the `--chrome` flag:

    ```bash theme={null}
    claude --chrome
    ```

    You can also enable Chrome from within an existing session by running `/chrome`.
  </Step>

  <Step title="Ask Claude to use the browser">
    This example navigates to a page, interacts with it, and reports what it finds, all from your terminal or editor:

    ```text theme={null}
    Go to code.claude.com/docs, click on the search box,
    type "hooks", and tell me what results appear
    ```
  </Step>
</Steps>

Run `/chrome` at any time to check the connection status, manage permissions, reconnect the extension, or choose which connected browser to use. If more than one browser is connected when a browser action starts, Claude prompts you to pick one.

For VS Code, see [browser automation in VS Code](/docs/en/vs-code#automate-browser-tasks-with-chrome).

### Enable Chrome by default

To avoid passing `--chrome` each session, run `/chrome` and select "Enabled by default".

In the [VS Code extension](/docs/en/vs-code#automate-browser-tasks-with-chrome), Chrome is available whenever the Chrome extension is installed. No additional flag is needed.

<Note>
  Enabling Chrome by default in the CLI increases context usage since browser tools are always loaded. If you notice increased context consumption, disable this setting and use `--chrome` only when needed.
</Note>

### Manage site permissions

Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension settings to control which sites Claude can browse, click, and type on.

## Example workflows

These examples show common ways to combine browser actions with coding tasks. Run `/mcp` and select `claude-in-chrome` to see the full list of available browser tools.

### Test a local web application

When developing a web app, ask Claude to verify your changes work correctly:

```text theme={null}
I just updated the login form validation. Can you open localhost:3000,
try submitting the form with invalid data, and check if the error
messages appear correctly?
```

Claude navigates to your local server, interacts with the form, and reports what it observes.

### Debug with console logs

Claude can read console output to help diagnose problems. Tell Claude what patterns to look for rather than asking for all console output, since logs can be verbose:

```text theme={null}
Open the dashboard page and check the console for any errors when
the page loads.
```

Claude reads the console messages and can filter for specific patterns or error types.

### Automate form filling

Speed up repetitive data entry tasks:

```text theme={null}
I have a spreadsheet of customer contacts in contacts.csv. For each row,
go to the CRM at crm.example.com, click "Add Contact", and fill in the
name, email, and phone fields.
```

Claude reads your local file, navigates the web interface, and enters the data for each record.

### Draft content in Google Docs

Use Claude to write directly in your documents without API setup:

```text theme={null}
Draft a project update based on the recent commits and add it to my
Google Doc at docs.google.com/document/d/abc123
```

Claude opens the document, clicks into the editor, and types the content. This works with any web app you're logged into: Gmail, Notion, Sheets, and more.

### Extract data from web pages

Pull structured information from websites:

```text theme={null}
Go to the product listings page and extract the name, price, and
availability for each item. Save the results as a CSV file.
```

Claude navigates to the page, reads the content, and compiles the data into a structured format.

### Run multi-site workflows

Coordinate tasks across multiple websites:

```text theme={null}
Check my calendar for meetings tomorrow, then for each meeting with
an external attendee, look up their company website and add a note
about what they do.
```

Claude works across tabs to gather information and complete the workflow.

### Record a demo GIF

Create shareable recordings of browser interactions:

```text theme={null}
Record a GIF showing how to complete the checkout flow, from adding
an item to the cart through to the confirmation page.
```

Claude records the interaction sequence and saves it as a GIF file.

## Troubleshooting

### Extension not detected

If Claude Code shows "Chrome extension not detected":

1. Verify the Chrome extension is installed and enabled in `chrome://extensions`
2. Verify Claude Code is up to date by running `claude --version`
3. Check that Chrome is running
4. Run `/chrome` and select "Reconnect extension" to re-establish the connection
5. If the issue persists, restart both Claude Code and Chrome

The first time you enable Chrome integration, Claude Code installs a native messaging host configuration file. Chrome reads this file on startup, so if the extension isn't detected on your first attempt, restart Chrome to pick up the new configuration.

If the connection still fails, verify the host configuration file exists at:

For Chrome:

* **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Linux**: `~/.config/google-chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Windows**: check `HKCU\Software\Google\Chrome\NativeMessagingHosts\` in the Windows Registry

For Edge:

* **macOS**: `~/Library/Application Support/Microsoft Edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Linux**: `~/.config/microsoft-edge/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json`
* **Windows**: check `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\` in the Windows Registry

### Browser not responding

If Claude's browser commands stop working:

1. Check if a modal dialog (alert, confirm, prompt) is blocking the page. JavaScript dialogs block browser events and prevent Claude from receiving commands. Dismiss the dialog manually, then tell Claude to continue.
2. Ask Claude to create a new tab and try again
3. Restart the Chrome extension by disabling and re-enabling it in `chrome://extensions`

### Connection drops during long sessions

The Chrome extension's service worker can go idle during extended sessions, which breaks the connection. If browser tools stop working after a period of inactivity, run `/chrome` and select "Reconnect extension".

### Windows-specific issues

On Windows, you may encounter:

* **Named pipe conflicts (EADDRINUSE)**: if another process is using the same named pipe, restart Claude Code. Close any other Claude Code sessions that might be using Chrome.
* **Native messaging host errors**: if the native messaging host crashes on startup, try reinstalling Claude Code to regenerate the host configuration.

### Common error messages

These are the most frequently encountered errors and how to resolve them:

| Error                                | Cause                                            | Fix                                                             |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------- |
| "Browser extension is not connected" | Native messaging host cannot reach the extension | Restart Chrome and Claude Code, then run `/chrome` to reconnect |
| "Extension not detected"             | Chrome extension is not installed or is disabled | Install or enable the extension in `chrome://extensions`        |
| "No tab available"                   | Claude tried to act before a tab was ready       | Ask Claude to create a new tab and retry                        |
| "Receiving end does not exist"       | Extension service worker went idle               | Run `/chrome` and select "Reconnect extension"                  |

## See also

* [Computer use](/docs/en/computer-use): control native macOS apps when a task can't be done in a browser
* [Use Claude Code in VS Code](/docs/en/vs-code#automate-browser-tasks-with-chrome): browser automation in the VS Code extension
* [CLI reference](/docs/en/cli-reference): command-line flags including `--chrome`
* [Common workflows](/docs/en/common-workflows): more ways to use Claude Code
* [Data and privacy](/docs/en/data-usage): how Claude Code handles your data
* [Getting started with Claude in Chrome](https://support.claude.com/en/articles/12012173-getting-started-with-claude-in-chrome): full documentation for the Chrome extension, including shortcuts, scheduling, and permissions


---

## Use Claude Code on the web

`https://code.claude.com/docs/en/claude-code-on-the-web`

Configure cloud environments, setup scripts, network access, and Docker in Anthropic's sandbox. Move sessions between web and terminal with `--remote` and `--teleport`.

<Note>
  Claude Code on the web is in research preview for Pro, Max, and Team users, and for Enterprise users with premium seats or Chat + Claude Code seats.
</Note>

Claude Code on the web runs tasks on Anthropic-managed cloud infrastructure at [claude.ai/code](https://claude.ai/code). Sessions persist even if you close your browser, and you can monitor them from the Claude mobile app.

<Tip>
  New to Claude Code on the web? Start with [Get started](/docs/en/web-quickstart) to connect your GitHub account and submit your first task.
</Tip>

This page covers:

* [GitHub authentication options](#github-authentication-options): two ways to connect GitHub
* [The cloud environment](#the-cloud-environment): what config carries over, what tools are installed, and how to configure environments
* [Setup scripts](#setup-scripts) and dependency management
* [Network access](#network-access): levels, proxies, and the default allowlist
* [Move tasks between web and terminal](#move-tasks-between-web-and-terminal) with `--remote` and `--teleport`
* [Work with sessions](#work-with-sessions): reviewing, sharing, archiving, deleting
* [Auto-fix pull requests](#auto-fix-pull-requests): respond automatically to CI failures and review comments
* [Security and isolation](#security-and-isolation): how sessions are isolated
* [Limitations](#limitations): rate limits and platform restrictions

## GitHub authentication options

Cloud sessions need access to your GitHub repositories to clone code and push branches. You can grant access in two ways:

| Method           | How it works                                                                                | Best for                                                                |
| :--------------- | :------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------- |
| **GitHub App**   | Authorize the Claude GitHub App during [web onboarding](/docs/en/web-quickstart).                | Browser onboarding; teams that want [Auto-fix](#auto-fix-pull-requests) |
| **`/web-setup`** | Run `/web-setup` in your terminal to sync your local `gh` CLI token to your Claude account. | Individual developers who already use `gh`                              |

<Note>
  With either method, a cloud session can access any repository the connecting GitHub account can see, not just the repositories the Claude GitHub App is installed on. App installation enables PR webhooks for [Auto-fix](#auto-fix-pull-requests); it is not a session-level access control. To restrict which repositories your team can reach from cloud sessions, restrict access on GitHub itself, for example by limiting team or repository membership for the connected GitHub accounts.
</Note>

Either method works. [`/schedule`](/docs/en/routines) checks for either form of access and prompts you to run `/web-setup` if neither is configured. See [Connect from your terminal](/docs/en/web-quickstart#connect-from-your-terminal) for the `/web-setup` walkthrough.

The GitHub App is required for [Auto-fix](#auto-fix-pull-requests), which uses the App to receive PR webhooks. If you connect with `/web-setup` and later want Auto-fix, install the App on those repositories.

Team and Enterprise admins can disable `/web-setup` with the Quick web setup toggle at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code).

<Note>
  Organizations with [Zero Data Retention](/docs/en/zero-data-retention) enabled cannot use `/web-setup` or other cloud session features.
</Note>

## The cloud environment

Each session runs in a fresh Anthropic-managed VM with your repository cloned. This section covers what's available when a session starts and how to customize it.

### What's available in cloud sessions

Cloud sessions start from a fresh clone of your repository. Anything committed to the repo is available. Anything you've installed or configured only on your own machine is not.

|                                                                       | Available in cloud sessions | Why                                                                                                                                              |
| :-------------------------------------------------------------------- | :-------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| Your repo's `CLAUDE.md`                                               | Yes                         | Part of the clone                                                                                                                                |
| Your repo's `.claude/settings.json` hooks                             | Yes                         | Part of the clone                                                                                                                                |
| Your repo's `.mcp.json` MCP servers                                   | Yes                         | Part of the clone                                                                                                                                |
| Your repo's `.claude/rules/`                                          | Yes                         | Part of the clone                                                                                                                                |
| Your repo's `.claude/skills/`, `.claude/agents/`, `.claude/commands/` | Yes                         | Part of the clone                                                                                                                                |
| Plugins declared in `.claude/settings.json`                           | Yes                         | Installed at session start from the [marketplace](/docs/en/plugin-marketplaces) you declared. Requires network access to reach the marketplace source |
| Your user `~/.claude/CLAUDE.md`                                       | No                          | Lives on your machine, not in the repo                                                                                                           |
| Plugins enabled only in your user settings                            | No                          | User-scoped `enabledPlugins` lives in `~/.claude/settings.json`. Declare them in the repo's `.claude/settings.json` instead                      |
| MCP servers you added with `claude mcp add`                           | No                          | Those write to your local user config, not the repo. Declare the server in [`.mcp.json`](/docs/en/mcp#project-scope) instead                          |
| Static API tokens and credentials                                     | No                          | No dedicated secrets store exists yet. See below                                                                                                 |
| Interactive auth like AWS SSO                                         | No                          | Not supported. SSO requires browser-based login that can't run in a cloud session                                                                |

To make configuration available in cloud sessions, commit it to the repo. A dedicated secrets store is not yet available. Both environment variables and setup scripts are stored in the environment configuration, visible to anyone who can edit that environment. If you need secrets in a cloud session, add them as environment variables with that visibility in mind.

### Installed tools

Cloud sessions come with common language runtimes, build tools, and databases pre-installed. The table below summarizes what's included by category.

| Category      | Included                                                                           |
| :------------ | :--------------------------------------------------------------------------------- |
| **Python**    | Python 3.x with pip, poetry, uv, black, mypy, pytest, ruff                         |
| **Node.js**   | 20, 21, and 22 via nvm, with npm, yarn, pnpm, bun¹, eslint, prettier, chromedriver |
| **Ruby**      | 3.1, 3.2, 3.3 with gem, bundler, rbenv                                             |
| **PHP**       | 8.4 with Composer                                                                  |
| **Java**      | OpenJDK 21 with Maven and Gradle                                                   |
| **Go**        | latest stable with module support                                                  |
| **Rust**      | rustc and cargo                                                                    |
| **C/C++**     | GCC, Clang, cmake, ninja, conan                                                    |
| **Docker**    | docker, dockerd, docker compose                                                    |
| **Databases** | PostgreSQL 16, Redis 7.0                                                           |
| **Utilities** | git, jq, yq, ripgrep, tmux, vim, nano                                              |

¹ Bun is installed but has known [proxy compatibility issues](#install-dependencies-with-a-sessionstart-hook) for package fetching.

For exact versions, ask Claude to run `check-tools` in a cloud session. This command only exists in cloud sessions.

### Work with GitHub issues and pull requests

Cloud sessions include built-in GitHub tools that let Claude read issues, list pull requests, fetch diffs, and post comments without any setup. These tools authenticate through the [GitHub proxy](#github-proxy) using whichever method you configured under [GitHub authentication options](#github-authentication-options), so your token never enters the container.

The `gh` CLI is not pre-installed. If you need a `gh` command the built-in tools don't cover, like `gh release` or `gh workflow run`, install and authenticate it yourself:

<Steps>
  <Step title="Install gh in your setup script">
    Add `apt update && apt install -y gh` to your [setup script](#setup-scripts).
  </Step>

  <Step title="Provide a token">
    Add a `GH_TOKEN` environment variable to your [environment settings](#configure-your-environment) with a GitHub personal access token. `gh` reads `GH_TOKEN` automatically, so no `gh auth login` step is needed.
  </Step>
</Steps>

### Link artifacts back to the session

Each cloud session has a transcript URL on claude.ai, and the session can read its own ID from the `CLAUDE_CODE_REMOTE_SESSION_ID` environment variable. Use this to put a traceable link in PR bodies, commit messages, Slack posts, or generated reports so a reviewer can open the run that produced them.

The variable's value uses a `cse_` prefix, while the transcript URL path takes the same ID with a `session_` prefix. Substitute the prefix when building the link. The following command prints the URL:

```bash theme={null}
echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"
```

### Run tests, start services, and add packages

Claude runs tests as part of working on a task. Ask for it in your prompt, like "fix the failing tests in `tests/`" or "run pytest after each change." Test runners like pytest, jest, and cargo test work out of the box since they're pre-installed.

PostgreSQL and Redis are pre-installed but not running by default. Ask Claude to start each one during the session:

```bash theme={null}
service postgresql start
```

```bash theme={null}
service redis-server start
```

Docker is available for running containerized services. Ask Claude to run `docker compose up` to start your project's services. Network access to pull images follows your environment's [access level](#access-levels), and the [Trusted defaults](#default-allowed-domains) include Docker Hub and other common registries.

If your images are large or slow to pull, add `docker compose pull` or `docker compose build` to your [setup script](#setup-scripts). The pulled images are saved in the [cached environment](#environment-caching), so each new session has them on disk. The cache stores files only, not running processes, so Claude still starts the containers each session.

To add packages that aren't pre-installed, use a [setup script](#setup-scripts). The script's output is [cached](#environment-caching), so packages you install there are available at the start of every session without reinstalling each time. You can also ask Claude to install packages mid-session, but those installs don't carry over to other sessions.

### Resource limits

Cloud sessions run with approximate resource ceilings that may change over time:

* 4 vCPUs
* 16 GB of RAM
* 30 GB of disk

Tasks requiring significantly more memory, such as large build jobs or memory-intensive tests, may fail or be terminated. For workloads beyond these limits, use [Remote Control](/docs/en/remote-control) to run Claude Code on your own hardware.

### Configure your environment

Environments control [network access](#network-access), environment variables, and the [setup script](#setup-scripts) that runs before a session starts. See [Installed tools](#installed-tools) for what's available without any configuration. You can manage environments from the web interface or the terminal:

| Action                         | How                                                                                                                                                                                                                      |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add an environment             | Select the current environment to open the selector, then select **Add environment**. The dialog includes name, network access level, environment variables, and setup script.                                           |
| Edit an environment            | Select the cloud icon showing the current environment's name to open the selector, hover over an environment, and click the settings icon that appears on the right.                                                     |
| Archive an environment         | Open the environment for editing and select **Archive**. Archived environments are hidden from the selector but existing sessions keep running.                                                                          |
| Set the default for `--remote` | Run `/remote-env` in your terminal. If you have a single environment, this command shows your current configuration. `/remote-env` only selects the default; add, edit, and archive environments from the web interface. |

Environment variables use `.env` format with one `KEY=value` pair per line. Don't wrap values in quotes, since quotes are stored as part of the value.

```text theme={null}
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgres://localhost:5432/myapp
```

## Setup scripts

A setup script is a Bash script that runs when a new cloud session starts, before Claude Code launches. Use setup scripts to install dependencies, configure tools, or fetch anything the session needs that isn't pre-installed.

Scripts run as root on Ubuntu 24.04, so `apt install` and most language package managers work.

To add a setup script, open the environment settings dialog and enter your script in the **Setup script** field.

This example installs the `gh` CLI, which isn't pre-installed:

```bash theme={null}
#!/bin/bash
apt update && apt install -y gh
```

If the script exits non-zero, the session fails to start. Append `|| true` to non-critical commands to avoid blocking the session on an intermittent install failure.

Keep the script's total runtime under roughly five minutes so the [environment cache](#environment-caching) can build. Run independent installs in parallel with `&` and `wait`. If a single download won't fit in the five-minute limit, move it to a [SessionStart hook](#setup-scripts-vs-sessionstart-hooks) that launches it in the background.

<Note>
  Setup scripts that install packages need network access to reach registries. The default **Trusted** network access allows connections to [common package registries](#default-allowed-domains) including npm, PyPI, RubyGems, and crates.io. Scripts will fail to install packages if your environment uses **None** network access.
</Note>

### Environment caching

The setup script runs the first time you start a session in an environment. After it completes, Anthropic snapshots the filesystem and reuses that snapshot as the starting point for later sessions. New sessions start with your dependencies, tools, and Docker images already on disk, and the setup script step is skipped. This keeps startup fast even when the script installs large toolchains or pulls container images.

The cache captures files, not running processes. Anything the setup script writes to disk carries over. Services or containers it starts do not, so start those per session by asking Claude or with a [SessionStart hook](#setup-scripts-vs-sessionstart-hooks).

The setup script runs again to rebuild the cache when you change the environment's setup script or allowed network hosts, and when the cache reaches its expiry after roughly seven days. Resuming an existing session never re-runs the setup script.

You don't need to enable caching or manage snapshots yourself.

### Setup scripts vs. SessionStart hooks

Use a setup script to install things the cloud needs but your laptop already has, like a language runtime or CLI tool. Use a [SessionStart hook](/docs/en/hooks#sessionstart) for project setup that should run everywhere, cloud and local, like `npm install`.

Both run at the start of a session, but they belong to different places:

|               | Setup scripts                                                                                | SessionStart hooks                                             |
| ------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Attached to   | The cloud environment                                                                        | Your repository                                                |
| Configured in | Cloud environment UI                                                                         | `.claude/settings.json` in your repo                           |
| Runs          | Before Claude Code launches, when no [cached environment](#environment-caching) is available | After Claude Code launches, on every session including resumed |
| Scope         | Cloud environments only                                                                      | Both local and cloud                                           |

SessionStart hooks can also be defined in your user-level `~/.claude/settings.json` locally, but user-level settings don't carry over to cloud sessions. In the cloud, only hooks committed to the repo run.

### Install dependencies with a SessionStart hook

To install dependencies only in cloud sessions, add a SessionStart hook to your repo's `.claude/settings.json`:

```json theme={null}
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/scripts/install_pkgs.sh"
          }
        ]
      }
    ]
  }
}
```

Create the script at `scripts/install_pkgs.sh` and make it executable with `chmod +x`. The `CLAUDE_CODE_REMOTE` environment variable is set to `true` in cloud sessions, so you can use it to skip local execution:

```bash theme={null}
#!/bin/bash

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

npm install
pip install -r requirements.txt
exit 0
```

SessionStart hooks have some limitations in cloud sessions:

* **No cloud-only scoping**: hooks run in both local and cloud sessions. To skip local execution, check the `CLAUDE_CODE_REMOTE` environment variable as shown above.
* **Requires network access**: install commands need to reach package registries. If your environment uses **None** network access, these hooks fail. The [default allowlist](#default-allowed-domains) under **Trusted** covers npm, PyPI, RubyGems, and crates.io.
* **Proxy compatibility**: all outbound traffic passes through a [security proxy](#security-proxy). Some package managers don't work correctly with this proxy. Bun is a known example.
* **Adds startup latency**: hooks run each time a session starts or resumes, unlike setup scripts which benefit from [environment caching](#environment-caching). Keep install scripts fast by checking whether dependencies are already present before reinstalling.

To persist environment variables for subsequent Bash commands, write to the file at `$CLAUDE_ENV_FILE`. See [SessionStart hooks](/docs/en/hooks#sessionstart) for details.

Replacing the base image with your own Docker image is not yet supported. Use a setup script to install what you need on top of the [provided image](#installed-tools), or run your image as a container alongside Claude with `docker compose`.

## Network access

Network access controls outbound connections from the cloud environment. Each environment specifies one access level, and you can extend it with custom allowed domains. The default is **Trusted**, which allows package registries and other [allowlisted domains](#default-allowed-domains).

To change an environment's network access, [open it for editing](#configure-your-environment) and use the **Network access** selector in the dialog. There is no separate Environments page. The cloud icon appears wherever you start a cloud session or configure a [routine](/docs/en/routines#environments-and-network-access).

<Note>
  MCP connector traffic is routed through Anthropic's servers, so the connectors you enable on a session or routine work without adding their hosts to **Allowed domains**. Connectors are configured per session or per routine; remove any you don't need to limit which tools Claude can reach. This relies on the same Anthropic-bound channel noted under [Security and isolation](#security-and-isolation).
</Note>

### Access levels

Choose an access level when you create or edit an environment:

| Level       | Outbound connections                                                                         |
| :---------- | :------------------------------------------------------------------------------------------- |
| **None**    | No outbound network access                                                                   |
| **Trusted** | [Allowlisted domains](#default-allowed-domains) only: package registries, GitHub, cloud SDKs |
| **Full**    | Any domain                                                                                   |
| **Custom**  | Your own allowlist, optionally including the defaults                                        |

GitHub operations use a [separate proxy](#github-proxy) that is independent of this setting.

### Allow specific domains

To allow domains that aren't in the Trusted list, select **Custom** in the environment's network access settings. An **Allowed domains** field appears. Enter one domain per line:

```text theme={null}
api.example.com
*.internal.example.com
registry.example.com
```

Use `*.` for wildcard subdomain matching. Check **Also include default list of common package managers** to keep the [Trusted domains](#default-allowed-domains) alongside your custom entries, or leave it unchecked to allow only what you list.

### GitHub proxy

For security, all GitHub operations go through a dedicated proxy service that transparently handles all git interactions. Inside the sandbox, the git client authenticates using a custom-built scoped credential. This proxy:

* Manages GitHub authentication securely: the git client uses a scoped credential inside the sandbox, which the proxy verifies and translates to your actual GitHub authentication token
* Restricts git push operations to the current working branch for safety
* Enables cloning, fetching, and PR operations while maintaining security boundaries

### Security proxy

Environments run behind an HTTP/HTTPS network proxy for security and abuse prevention purposes. All outbound internet traffic passes through this proxy, which provides:

* Protection against malicious requests
* Rate limiting and abuse prevention
* Content filtering for enhanced security

### Default allowed domains

When using **Trusted** network access, the following domains are allowed by default. Domains marked with `*` indicate wildcard subdomain matching, so `*.gcr.io` allows any subdomain of `gcr.io`.

<AccordionGroup>
  <Accordion title="Anthropic services">
    * api.anthropic.com
    * statsig.anthropic.com
    * docs.claude.com
    * platform.claude.com
    * code.claude.com
    * claude.ai
  </Accordion>

  <Accordion title="Version control">
    * github.com
    * [www.github.com](http://www.github.com)
    * api.github.com
    * npm.pkg.github.com
    * raw\.githubusercontent.com
    * pkg-npm.githubusercontent.com
    * objects.githubusercontent.com
    * release-assets.githubusercontent.com
    * codeload.github.com
    * avatars.githubusercontent.com
    * camo.githubusercontent.com
    * gist.github.com
    * gitlab.com
    * [www.gitlab.com](http://www.gitlab.com)
    * registry.gitlab.com
    * bitbucket.org
    * [www.bitbucket.org](http://www.bitbucket.org)
    * api.bitbucket.org
  </Accordion>

  <Accordion title="Container registries">
    * registry-1.docker.io
    * auth.docker.io
    * index.docker.io
    * hub.docker.com
    * [www.docker.com](http://www.docker.com)
    * production.cloudflare.docker.com
    * download.docker.com
    * gcr.io
    * \*.gcr.io
    * ghcr.io
    * mcr.microsoft.com
    * \*.data.mcr.microsoft.com
    * public.ecr.aws
  </Accordion>

  <Accordion title="Cloud platforms">
    * cloud.google.com
    * accounts.google.com
    * gcloud.google.com
    * \*.googleapis.com
    * storage.googleapis.com
    * compute.googleapis.com
    * container.googleapis.com
    * azure.com
    * portal.azure.com
    * microsoft.com
    * [www.microsoft.com](http://www.microsoft.com)
    * \*.microsoftonline.com
    * packages.microsoft.com
    * dotnet.microsoft.com
    * dot.net
    * visualstudio.com
    * dev.azure.com
    * \*.amazonaws.com
    * \*.api.aws
    * oracle.com
    * [www.oracle.com](http://www.oracle.com)
    * java.com
    * [www.java.com](http://www.java.com)
    * java.net
    * [www.java.net](http://www.java.net)
    * download.oracle.com
    * yum.oracle.com
  </Accordion>

  <Accordion title="JavaScript and Node package managers">
    * registry.npmjs.org
    * [www.npmjs.com](http://www.npmjs.com)
    * [www.npmjs.org](http://www.npmjs.org)
    * npmjs.com
    * npmjs.org
    * yarnpkg.com
    * registry.yarnpkg.com
  </Accordion>

  <Accordion title="Python package managers">
    * pypi.org
    * [www.pypi.org](http://www.pypi.org)
    * files.pythonhosted.org
    * pythonhosted.org
    * test.pypi.org
    * pypi.python.org
    * pypa.io
    * [www.pypa.io](http://www.pypa.io)
  </Accordion>

  <Accordion title="Ruby package managers">
    * rubygems.org
    * [www.rubygems.org](http://www.rubygems.org)
    * api.rubygems.org
    * index.rubygems.org
    * ruby-lang.org
    * [www.ruby-lang.org](http://www.ruby-lang.org)
    * rubyforge.org
    * [www.rubyforge.org](http://www.rubyforge.org)
    * rubyonrails.org
    * [www.rubyonrails.org](http://www.rubyonrails.org)
    * rvm.io
    * get.rvm.io
  </Accordion>

  <Accordion title="Rust package managers">
    * crates.io
    * [www.crates.io](http://www.crates.io)
    * index.crates.io
    * static.crates.io
    * rustup.rs
    * static.rust-lang.org
    * [www.rust-lang.org](http://www.rust-lang.org)
  </Accordion>

  <Accordion title="Go package managers">
    * proxy.golang.org
    * sum.golang.org
    * index.golang.org
    * golang.org
    * [www.golang.org](http://www.golang.org)
    * goproxy.io
    * pkg.go.dev
  </Accordion>

  <Accordion title="JVM package managers">
    * maven.org
    * repo.maven.org
    * central.maven.org
    * repo1.maven.org
    * repo.maven.apache.org
    * jcenter.bintray.com
    * gradle.org
    * [www.gradle.org](http://www.gradle.org)
    * services.gradle.org
    * plugins.gradle.org
    * kotlinlang.org
    * [www.kotlinlang.org](http://www.kotlinlang.org)
    * spring.io
    * repo.spring.io
  </Accordion>

  <Accordion title="Other package managers">
    * packagist.org (PHP Composer)
    * [www.packagist.org](http://www.packagist.org)
    * repo.packagist.org
    * nuget.org (.NET NuGet)
    * [www.nuget.org](http://www.nuget.org)
    * api.nuget.org
    * pub.dev (Dart/Flutter)
    * api.pub.dev
    * hex.pm (Elixir/Erlang)
    * [www.hex.pm](http://www.hex.pm)
    * cpan.org (Perl CPAN)
    * [www.cpan.org](http://www.cpan.org)
    * metacpan.org
    * [www.metacpan.org](http://www.metacpan.org)
    * api.metacpan.org
    * cocoapods.org (iOS/macOS)
    * [www.cocoapods.org](http://www.cocoapods.org)
    * cdn.cocoapods.org
    * haskell.org
    * [www.haskell.org](http://www.haskell.org)
    * hackage.haskell.org
    * swift.org
    * [www.swift.org](http://www.swift.org)
  </Accordion>

  <Accordion title="Linux distributions">
    * archive.ubuntu.com
    * security.ubuntu.com
    * ubuntu.com
    * [www.ubuntu.com](http://www.ubuntu.com)
    * \*.ubuntu.com
    * ppa.launchpad.net
    * launchpad.net
    * [www.launchpad.net](http://www.launchpad.net)
    * \*.nixos.org
  </Accordion>

  <Accordion title="Development tools and platforms">
    * dl.k8s.io (Kubernetes)
    * pkgs.k8s.io
    * k8s.io
    * [www.k8s.io](http://www.k8s.io)
    * releases.hashicorp.com (HashiCorp)
    * apt.releases.hashicorp.com
    * rpm.releases.hashicorp.com
    * archive.releases.hashicorp.com
    * hashicorp.com
    * [www.hashicorp.com](http://www.hashicorp.com)
    * repo.anaconda.com (Anaconda/Conda)
    * conda.anaconda.org
    * anaconda.org
    * [www.anaconda.com](http://www.anaconda.com)
    * anaconda.com
    * continuum.io
    * apache.org (Apache)
    * [www.apache.org](http://www.apache.org)
    * archive.apache.org
    * downloads.apache.org
    * eclipse.org (Eclipse)
    * [www.eclipse.org](http://www.eclipse.org)
    * download.eclipse.org
    * nodejs.org (Node.js)
    * [www.nodejs.org](http://www.nodejs.org)
    * developer.apple.com
    * developer.android.com
    * pkg.stainless.com
    * binaries.prisma.sh
  </Accordion>

  <Accordion title="Cloud services and monitoring">
    * statsig.com
    * [www.statsig.com](http://www.statsig.com)
    * api.statsig.com
    * sentry.io
    * \*.sentry.io
    * downloads.sentry-cdn.com
    * http-intake.logs.datadoghq.com
    * \*.datadoghq.com
    * \*.datadoghq.eu
    * api.honeycomb.io
  </Accordion>

  <Accordion title="Content delivery and mirrors">
    * sourceforge.net
    * \*.sourceforge.net
    * packagecloud.io
    * \*.packagecloud.io
    * fonts.googleapis.com
    * fonts.gstatic.com
  </Accordion>

  <Accordion title="Schema and configuration">
    * json-schema.org
    * [www.json-schema.org](http://www.json-schema.org)
    * json.schemastore.org
    * [www.schemastore.org](http://www.schemastore.org)
  </Accordion>

  <Accordion title="Model Context Protocol">
    * \*.modelcontextprotocol.io
  </Accordion>
</AccordionGroup>

## Move tasks between web and terminal

These workflows require the [Claude Code CLI](/docs/en/quickstart) signed in to the same claude.ai account. You can start new cloud sessions from your terminal, or pull cloud sessions into your terminal to continue locally. Cloud sessions persist even if you close your laptop, and you can monitor them from anywhere including the Claude mobile app.

<Note>
  From the CLI, session handoff is one-way: you can pull cloud sessions into your terminal with `--teleport`, but you can't push an existing terminal session to the web. The `--remote` flag creates a new cloud session for your current repository. The [Desktop app](/docs/en/desktop#continue-in-another-surface) provides a Continue in menu that can send a local session to the web.
</Note>

### From terminal to web

Start a cloud session from the command line with the `--remote` flag:

```bash theme={null}
claude --remote "Fix the authentication bug in src/auth/login.ts"
```

This creates a new cloud session on claude.ai. The session clones your current directory's GitHub remote at your current branch, so push first if you have local commits, since the VM clones from GitHub rather than your machine. `--remote` works with a single repository at a time. The task runs in the cloud while you continue working locally.

<Note>
  `--remote` creates cloud sessions. `--remote-control` is unrelated: it exposes a local CLI session for monitoring from the web. See [Remote Control](/docs/en/remote-control).
</Note>

Use `/tasks` in the Claude Code CLI to check progress, or open the session on claude.ai or the Claude mobile app to interact directly. From there you can steer Claude, provide feedback, or answer questions just like any other conversation.

#### Tips for cloud tasks

**Plan locally, execute remotely**: for complex tasks, start Claude in plan mode to collaborate on the approach, then send work to the cloud:

```bash theme={null}
claude --permission-mode plan
```

In plan mode, Claude reads files, runs commands to explore, and proposes a plan without editing source code. Once you're satisfied, save the plan to the repo, commit, and push so the cloud VM can clone it. Then start a cloud session for autonomous execution:

```bash theme={null}
claude --remote "Execute the migration plan in docs/migration-plan.md"
```

This pattern gives you control over the strategy while letting Claude execute autonomously in the cloud.

**Plan in the cloud with ultraplan**: to draft and review the plan itself in a web session, use [ultraplan](/docs/en/ultraplan). Claude generates the plan on Claude Code on the web while you keep working, then you comment on sections in your browser and choose to execute remotely or send the plan back to your terminal.

**Run tasks in parallel**: each `--remote` command creates its own cloud session that runs independently. You can start multiple tasks and they'll all run simultaneously in separate sessions:

```bash theme={null}
claude --remote "Fix the flaky test in auth.spec.ts"
claude --remote "Update the API documentation"
claude --remote "Refactor the logger to use structured output"
```

Monitor all sessions with `/tasks` in the Claude Code CLI. When a session completes, you can create a PR from the web interface or [teleport](#from-web-to-terminal) the session to your terminal to continue working.

#### Send local repositories without GitHub

When you run `claude --remote` from a repository that isn't connected to GitHub, Claude Code bundles your local repository and uploads it directly to the cloud session. The bundle includes your full repository history across all branches, plus any uncommitted changes to tracked files.

This fallback activates automatically when GitHub access isn't available. To force it even when GitHub is connected, set `CCR_FORCE_BUNDLE=1`:

```bash theme={null}
CCR_FORCE_BUNDLE=1 claude --remote "Run the test suite and fix any failures"
```

Bundled repositories must meet these limits:

* The directory must be a git repository with at least one commit
* The bundled repository must be under 100 MB. Larger repositories fall back to bundling only the current branch, then to a single squashed snapshot of the working tree, and fail only if the snapshot is still too large
* Untracked files are not included; run `git add` on files you want the cloud session to see
* Sessions created from a bundle can't push back to a remote unless you also have [GitHub authentication](#github-authentication-options) configured

### From web to terminal

Pull a cloud session into your terminal using any of these:

* **Using `--teleport`**: from the command line, run `claude --teleport` for an interactive session picker, or `claude --teleport <session-id>` to resume a specific session directly. If you have uncommitted changes, you'll be prompted to stash them first.
* **Using `/teleport`**: inside an existing CLI session, run `/teleport` (or `/tp`) to open the same session picker without restarting Claude Code.
* **From `/tasks`**: run `/tasks` to see your background sessions, then press `t` to teleport into one
* **From the web interface**: select **Open in CLI** to copy a command you can paste into your terminal

When you teleport a session, Claude verifies you're in the correct repository, fetches and checks out the branch from the cloud session, and loads the full conversation history into your terminal.

`--teleport` is distinct from `--resume`. `--resume` reopens a conversation from this machine's local history and doesn't list cloud sessions; `--teleport` pulls a cloud session and its branch.

#### Teleport requirements

Teleport checks these requirements before resuming a session. If any requirement isn't met, you'll see an error or be prompted to resolve the issue.

| Requirement        | Details                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Clean git state    | Your working directory must have no uncommitted changes. Teleport prompts you to stash changes if needed.                |
| Correct repository | You must run `--teleport` from a checkout of the same repository, not a fork.                                            |
| Branch available   | The branch from the cloud session must have been pushed to the remote. Teleport automatically fetches and checks it out. |
| Same account       | You must be authenticated to the same claude.ai account used in the cloud session.                                       |

#### `--teleport` is unavailable

Teleport requires claude.ai subscription authentication. If you're authenticated via API key, Bedrock, Vertex AI, or Microsoft Foundry, run `/login` to sign in with your claude.ai account instead. If you're already signed in via claude.ai and `--teleport` is still unavailable, your organization may have disabled cloud sessions.

## Work with sessions

Sessions appear in the sidebar at claude.ai/code. From there you can review changes, share with teammates, archive finished work, or delete sessions permanently.

### Manage context

Cloud sessions support [built-in commands](/docs/en/commands) that produce text output. Commands that open an interactive terminal picker, like `/model` or `/config`, are not available.

For context management specifically:

| Command    | Works in cloud sessions | Notes                                                                                                                    |
| :--------- | :---------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `/compact` | Yes                     | Summarizes the conversation to free up context. Accepts optional focus instructions like `/compact keep the test output` |
| `/context` | Yes                     | Shows what's currently in the context window                                                                             |
| `/clear`   | No                      | Start a new session from the sidebar instead                                                                             |

Auto-compaction runs automatically when the context window approaches capacity, the same as in the CLI. To trigger it earlier, set [`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`](/docs/en/env-vars) in your [environment variables](#configure-your-environment). For example, `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70` compacts at 70% capacity instead of the default \~95%. To change the effective window size for compaction calculations, use [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](/docs/en/env-vars).

[Subagents](/docs/en/sub-agents) work the same way they do locally. Claude can spawn them with the Task tool to offload research or parallel work into a separate context window, keeping the main conversation lighter. Subagents defined in your repo's `.claude/agents/` are picked up automatically. [Agent teams](/docs/en/agent-teams) are off by default but can be enabled by adding `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to your [environment variables](#configure-your-environment).

### Review changes

Each session shows a diff indicator with lines added and removed, like `+42 -18`. Select it to open the diff view, leave inline comments on specific lines, and send them to Claude with your next message. See [Review and iterate](/docs/en/web-quickstart#review-and-iterate) for the full walkthrough including PR creation. To have Claude monitor the PR for CI failures and review comments automatically, see [Auto-fix pull requests](#auto-fix-pull-requests).

### Share sessions

To share a session, toggle its visibility according to the account types below. After that, share the session link as-is. Recipients see the latest state when they open the link, but their view doesn't update in real time.

#### Share from an Enterprise or Team account

For Enterprise and Team accounts, the two visibility options are **Private** and **Team**. Team visibility makes the session visible to other members of your claude.ai organization. Repository access verification is enabled by default, based on the GitHub account connected to the recipient's account. Your account's display name is visible to all recipients with access. [Claude in Slack](/docs/en/slack) sessions are automatically shared with Team visibility.

#### Share from a Max or Pro account

For Max and Pro accounts, the two visibility options are **Private** and **Public**. Public visibility makes the session visible to any user logged into claude.ai.

Check your session for sensitive content before sharing. Sessions may contain code and credentials from private GitHub repositories. Repository access verification is not enabled by default.

To require recipients to have repository access, or to hide your name from shared sessions, go to Settings > Claude Code > Sharing settings.

### Archive sessions

You can archive sessions to keep your session list organized. Archived sessions are hidden from the default session list but can be viewed by filtering for archived sessions.

To archive a session, hover over the session in the sidebar and select the archive icon.

### Delete sessions

Deleting a session permanently removes the session and its data. This action cannot be undone. You can delete a session in two ways:

* **From the sidebar**: filter for archived sessions, then hover over the session you want to delete and select the delete icon
* **From the session menu**: open a session, select the dropdown next to the session title, and select **Delete**

You will be asked to confirm before a session is deleted.

## Auto-fix pull requests

Claude can watch a pull request and automatically respond to CI failures and review comments. Claude subscribes to GitHub activity on the PR, and when a check fails or a reviewer leaves a comment, Claude investigates and pushes a fix if one is clear.

<Note>
  Auto-fix requires the Claude GitHub App to be installed on your repository. If you haven't already, install it from the [GitHub App page](https://github.com/apps/claude) or when prompted during [setup](/docs/en/web-quickstart#connect-github-and-create-an-environment).
</Note>

There are a few ways to turn on auto-fix depending on where the PR came from and what device you're using:

* **PRs created in Claude Code on the web**: open the CI status bar and select **Auto-fix**
* **From your terminal**: run [`/autofix-pr`](/docs/en/commands) while on the PR's branch. Claude Code detects the open PR with `gh`, spawns a web session, and turns on auto-fix in one step
* **From the mobile app**: tell Claude to auto-fix the PR, for example "watch this PR and fix any CI failures or review comments"
* **Any existing PR**: paste the PR URL into a session and tell Claude to auto-fix it

Auto-fix is a per-PR toggle. To stop monitoring, open the CI status bar in the web session and clear the **Auto-fix** toggle, or tell Claude to stop watching the PR.

### How Claude responds to PR activity

When auto-fix is active, Claude receives GitHub events for the PR including new review comments and CI check failures. For each event, Claude investigates and decides how to proceed:

* **Clear fixes**: if Claude is confident in a fix and it doesn't conflict with earlier instructions, Claude makes the change, pushes it, and explains what was done in the session
* **Ambiguous requests**: if a reviewer's comment could be interpreted multiple ways or involves something architecturally significant, Claude asks you before acting
* **Duplicate or no-action events**: if an event is a duplicate or requires no change, Claude notes it in the session and moves on

Claude may reply to review comment threads on GitHub as part of resolving them. These replies are posted using your GitHub account, so they appear under your username, but each reply is labeled as coming from Claude Code so reviewers know it was written by the agent and not by you directly.

<Warning>
  If your repository uses comment-triggered automation such as Atlantis, Terraform Cloud, or custom GitHub Actions that run on `issue_comment` events, be aware that Claude can reply on your behalf, which can trigger those workflows. Review your repository's automation before enabling auto-fix, and consider disabling auto-fix for repositories where a PR comment can deploy infrastructure or run privileged operations.
</Warning>

## Security and isolation

Each cloud session is separated from your machine and from other sessions through several layers:

* **Isolated virtual machines**: each session runs in an isolated, Anthropic-managed VM
* **Network access controls**: network access is limited by default, and can be disabled. When running with network access disabled, Claude Code can still communicate with the Anthropic API, which may allow data to exit the VM.
* **Credential protection**: sensitive credentials such as git credentials or signing keys are never inside the sandbox with Claude Code. Authentication is handled through a secure proxy using scoped credentials.
* **Secure analysis**: code is analyzed and modified within isolated VMs before creating PRs

## Troubleshooting

For runtime API errors that appear in the conversation such as `API Error: 500`, `529 Overloaded`, `429`, or `Prompt is too long`, see the [Error reference](/docs/en/errors). Those errors and their fixes are shared with the CLI and Desktop app. The sections below cover issues specific to cloud sessions.

### Session creation failed

If a new session fails to start with `Session creation failed` or stalls at provisioning, Claude Code could not allocate a cloud environment.

* Check [status.claude.com](https://status.claude.com) for cloud session incidents
* Retry after a minute, as capacity is provisioned on demand
* Confirm your repository is reachable. The connecting GitHub account must have access to the repository on GitHub, either through the Claude GitHub App authorization or a `gh` token synced via `/web-setup` — installing the App on the repository is not required. See [GitHub authentication options](#github-authentication-options).

### Remote Control session expired or access denied

`--teleport` connects through the same Remote Control session infrastructure that cloud sessions use, so authentication and session-expiry errors surface with Remote Control wording. You may see `Remote Control session expired` or `Access denied`. The connection token is short-lived and scoped to your account.

* Run `/login` locally to refresh your credentials, then reconnect
* Confirm you are signed in to the same account that owns the session
* If you see `Remote Control may not be available for this organization`, your admin has not enabled remote sessions for your plan

### Environment expired

Cloud sessions stop after a period of inactivity and the underlying environment is reclaimed. From a local terminal, this surfaces as `Could not resume session ... its environment has expired. Creating a fresh session instead.` On the web, the session is marked expired in the session list.

Reopen the session from [claude.ai/code](https://claude.ai/code) to provision a fresh environment with your conversation history restored.

## Limitations

Before relying on cloud sessions for a workflow, account for these constraints:

* **Rate limits**: Claude Code on the web shares rate limits with all other Claude and Claude Code usage within your account. Running multiple tasks in parallel consumes more rate limits proportionately. There is no separate compute charge for the cloud VM.
* **Repository authentication**: you can only move sessions from web to local when you are authenticated to the same account
* **Platform restrictions**: repository cloning and pull request creation require GitHub. Self-hosted [GitHub Enterprise Server](/docs/en/github-enterprise-server) instances are supported for Team and Enterprise plans. GitLab, Bitbucket, and other non-GitHub repositories can be sent to cloud sessions as a [local bundle](#send-local-repositories-without-github), but the session can't push results back to the remote
* **Organization IP allowlist**: cloud sessions call the Anthropic API from Anthropic-managed infrastructure, not your network. If your organization has [IP allowlisting](https://support.claude.com/en/articles/13200993-restrict-access-to-claude-with-ip-allowlisting) enabled, every cloud session fails with an authentication error. The same applies to [Code Review](/docs/en/code-review) and [Routines](/docs/en/routines). Contact [Anthropic support](https://support.claude.com/) to exempt Anthropic-hosted services from your organization's IP allowlist.

## Related resources

* [Ultraplan](/docs/en/ultraplan): draft a plan in a cloud session and review it in your browser
* [Ultrareview](/docs/en/ultrareview): run a deep multi-agent code review in a cloud sandbox
* [Routines](/docs/en/routines): automate work on a schedule, via API call, or in response to GitHub events
* [Hooks configuration](/docs/en/hooks): run scripts at session lifecycle events
* [Settings reference](/docs/en/settings): all configuration options
* [Security](/docs/en/security): isolation guarantees and data handling
* [Data usage](/docs/en/data-usage): what Anthropic retains from cloud sessions


---

## Claude Code in Slack

`https://code.claude.com/docs/en/slack`

Delegate coding tasks directly from your Slack workspace

Claude Code in Slack brings the power of Claude Code directly into your Slack workspace. When you mention `@Claude` with a coding task, Claude automatically detects the intent and creates a Claude Code session on the web, allowing you to delegate development work without leaving your team conversations.

This integration is built on the existing Claude for Slack app but adds intelligent routing to Claude Code on the web for coding-related requests.

## Use cases

* **Bug investigation and fixes**: Ask Claude to investigate and fix bugs as soon as they're reported in Slack channels.
* **Quick code reviews and modifications**: Have Claude implement small features or refactor code based on team feedback.
* **Collaborative debugging**: When team discussions provide crucial context (e.g., error reproductions or user reports), Claude can use that information to inform its debugging approach.
* **Parallel task execution**: Kick off coding tasks in Slack while you continue other work, receiving notifications when complete.

## Prerequisites

Before using Claude Code in Slack, ensure you have the following:

| Requirement            | Details                                                                                           |
| :--------------------- | :------------------------------------------------------------------------------------------------ |
| Claude Plan            | Pro, Max, Team, or Enterprise with Claude Code access (premium seats or Chat + Claude Code seats) |
| Claude Code on the web | Access to [Claude Code on the web](/docs/en/claude-code-on-the-web) must be enabled                    |
| GitHub Account         | Connected to Claude Code on the web with at least one repository authenticated                    |
| Slack Authentication   | Your Slack account linked to your Claude account via the Claude app                               |

## Setting up Claude Code in Slack

<Steps>
  <Step title="Install the Claude App in Slack">
    A workspace administrator must install the Claude app from the Slack App Marketplace. Visit the [Slack App Marketplace](https://slack.com/marketplace/A08SF47R6P4) and click "Add to Slack" to begin the installation process.
  </Step>

  <Step title="Connect your Claude account">
    After the app is installed, authenticate your individual Claude account:

    1. Open the Claude app in Slack by clicking on "Claude" in your Apps section
    2. Navigate to the App Home tab
    3. Click "Connect" to link your Slack account with your Claude account
    4. Complete the authentication flow in your browser
  </Step>

  <Step title="Configure Claude Code on the web">
    Ensure your Claude Code on the web is properly configured:

    * Visit [claude.ai/code](https://claude.ai/code) and sign in with the same account you connected to Slack
    * Connect your GitHub account if not already connected
    * Authenticate at least one repository that you want Claude to work with
  </Step>

  <Step title="Choose your routing mode">
    After connecting your accounts, configure how Claude handles your messages in Slack. Navigate to the Claude App Home in Slack to find the **Routing Mode** setting.

    | Mode            | Behavior                                                                                                                                                                                                                                 |
    | :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | **Code only**   | Claude routes all @mentions to Claude Code sessions. Best for teams using Claude in Slack exclusively for development tasks.                                                                                                             |
    | **Code + Chat** | Claude analyzes each message and intelligently routes between Claude Code (for coding tasks) and Claude Chat (for writing, analysis, and general questions). Best for teams who want a single @Claude entry point for all types of work. |

    <Note>
      In Code + Chat mode, if Claude routes a message to Chat but you wanted a coding session, you can click "Retry as Code" to create a Claude Code session instead. Similarly, if it's routed to Code but you wanted a Chat session, you can choose that option in that thread.
    </Note>
  </Step>

  <Step title="Add Claude to channels">
    Claude is not automatically added to any channels after installation. To use Claude in a channel, invite it by typing `/invite @Claude` in that channel. Claude can only respond to @mentions in channels where it has been added.
  </Step>
</Steps>

## How it works

### Automatic detection

When you mention @Claude in a Slack channel or thread, Claude automatically analyzes your message to determine if it's a coding task. If Claude detects coding intent, it will route your request to Claude Code on the web instead of responding as a regular chat assistant.

You can also explicitly tell Claude to handle a request as a coding task, even if it doesn't automatically detect it.

<Note>
  Claude Code in Slack only works in channels (public or private). It does not work in direct messages (DMs).
</Note>

### Context gathering

**From threads**: When you @mention Claude in a thread, it gathers context from all messages in that thread to understand the full conversation.

**From channels**: When mentioned directly in a channel, Claude looks at recent channel messages for relevant context.

This context helps Claude understand the problem, select the appropriate repository, and inform its approach to the task.

<Warning>
  When @Claude is invoked in Slack, Claude is given access to the conversation context to better understand your request. Claude may follow directions from other messages in the context, so users should make sure to only use Claude in trusted Slack conversations.
</Warning>

### Session flow

1. **Initiation**: You @mention Claude with a coding request
2. **Detection**: Claude analyzes your message and detects coding intent
3. **Session creation**: A new Claude Code session is created on claude.ai/code
4. **Progress updates**: Claude posts status updates to your Slack thread as work progresses
5. **Completion**: When finished, Claude @mentions you with a summary and action buttons
6. **Review**: Click "View Session" to see the full transcript, or "Create PR" to open a pull request

## User interface elements

### App Home

The App Home tab shows your connection status and allows you to connect or disconnect your Claude account from Slack.

### Message actions

* **View Session**: Opens the full Claude Code session in your browser where you can see all work performed, continue the session, or make additional requests.
* **Create PR**: Creates a pull request directly from the session's changes.
* **Retry as Code**: If Claude initially responds as a chat assistant but you wanted a coding session, click this button to retry the request as a Claude Code task.
* **Change Repo**: Allows you to select a different repository if Claude chose incorrectly.

### Repository selection

Claude automatically selects a repository based on context from your Slack conversation. If multiple repositories could apply, Claude may display a dropdown allowing you to choose the correct one.

## Access and permissions

### User-level access

| Access Type          | Requirement                                                     |
| :------------------- | :-------------------------------------------------------------- |
| Claude Code Sessions | Each user runs sessions under their own Claude account          |
| Usage & Rate Limits  | Sessions count against the individual user's plan limits        |
| Repository Access    | Users can only access repositories they've personally connected |
| Session History      | Sessions appear in your Claude Code history on claude.ai/code   |

### Workspace-level access

Slack workspace administrators control whether the Claude app is available in their workspace:

| Control                      | Description                                                                                                       |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| App installation             | Workspace admins decide whether to install the Claude app from the Slack App Marketplace                          |
| Enterprise Grid distribution | For Enterprise Grid organizations, organization admins can control which workspaces have access to the Claude app |
| App removal                  | Removing the app from a workspace immediately revokes access for all users in that workspace                      |

### Channel-based access control

Claude is not automatically added to any channels after installation. Users must explicitly invite Claude to channels where they want to use it:

* **Invite required**: Type `/invite @Claude` in any channel to add Claude to that channel
* **Channel membership controls access**: Claude can only respond to @mentions in channels where it has been added
* **Access gating through channels**: Admins can control who uses Claude Code by managing which channels Claude is invited to and who has access to those channels
* **Private channel support**: Claude works in both public and private channels, giving teams flexibility in controlling visibility

This channel-based model allows teams to restrict Claude Code usage to specific channels, providing an additional layer of access control beyond workspace-level permissions.

## What's accessible where

**In Slack**: You'll see status updates, completion summaries, and action buttons. The full transcript is preserved and always accessible.

**On the web**: The complete Claude Code session with full conversation history, all code changes, file operations, and the ability to continue the session or create pull requests.

For Enterprise and Team accounts, sessions created from Claude in Slack are
automatically visible to the organization. See [Claude Code on the Web sharing](/docs/en/claude-code-on-the-web#share-sessions)
for more details.

## Best practices

### Writing effective requests

* **Be specific**: Include file names, function names, or error messages when relevant.
* **Provide context**: Mention the repository or project if it's not clear from the conversation.
* **Define success**: Explain what "done" looks like—should Claude write tests? Update documentation? Create a PR?
* **Use threads**: Reply in threads when discussing bugs or features so Claude can gather the full context.

### When to use Slack vs. web

**Use Slack when**: Context already exists in a Slack discussion, you want to kick off a task asynchronously, or you're collaborating with teammates who need visibility.

**Use the web directly when**: You need to upload files, want real-time interaction during development, or are working on longer, more complex tasks.

## Troubleshooting

### Sessions not starting

1. Verify your Claude account is connected in the Claude App Home
2. Check that you have Claude Code on the web access enabled
3. Ensure you have at least one GitHub repository connected to Claude Code

### Repository not showing

1. Connect the repository in Claude Code on the web at [claude.ai/code](https://claude.ai/code)
2. Verify your GitHub permissions for that repository
3. Try disconnecting and reconnecting your GitHub account

### Wrong repository selected

1. Click the "Change Repo" button to select a different repository
2. Include the repository name in your request for more accurate selection

### Authentication errors

1. Disconnect and reconnect your Claude account in the App Home
2. Ensure you're signed into the correct Claude account in your browser
3. Check that your Claude plan includes Claude Code access

### Session expiration

1. Sessions remain accessible in your Claude Code history on the web
2. You can continue or reference past sessions from [claude.ai/code](https://claude.ai/code)

## Current limitations

* **GitHub only**: Currently supports repositories on GitHub.
* **One PR at a time**: Each session can create one pull request.
* **Rate limits apply**: Sessions use your individual Claude plan's rate limits.
* **Web access required**: Users must have Claude Code on the web access; those without it will only get standard Claude chat responses.

## Related resources

<CardGroup>
  <Card title="Claude Code on the web" icon="globe" href="/en/claude-code-on-the-web">
    Learn more about Claude Code on the web
  </Card>

  <Card title="Claude for Slack" icon="slack" href="https://claude.com/claude-and-slack">
    General Claude for Slack documentation
  </Card>

  <Card title="Slack App Marketplace" icon="store" href="https://slack.com/marketplace/A08SF47R6P4">
    Install the Claude app from the Slack Marketplace
  </Card>

  <Card title="Claude Help Center" icon="circle-question" href="https://support.claude.com">
    Get additional support
  </Card>
</CardGroup>


---

## Push events into a running session with channels

`https://code.claude.com/docs/en/channels`

Use channels to push messages, alerts, and webhooks into your Claude Code session from an MCP server. Forward CI results, chat messages, and monitoring events so Claude can react while you're away.

<Note>
  Channels are in [research preview](#research-preview) and require Claude Code v2.1.80 or later. They require Anthropic authentication through claude.ai or a Console API key, and are not available on Amazon Bedrock, Google Vertex AI, or Microsoft Foundry. Team and Enterprise organizations must [explicitly enable them](#enterprise-controls).
</Note>

A channel is an MCP server that pushes events into your running Claude Code session, so Claude can react to things that happen while you're not at the terminal. Channels can be two-way: Claude reads the event and replies back through the same channel, like a chat bridge. Events only arrive while the session is open, so for an always-on setup you run Claude in a background process or persistent terminal.

Unlike integrations that spawn a fresh cloud session or wait to be polled, the event arrives in the session you already have open: see [how channels compare](#how-channels-compare).

You install a channel as a plugin and configure it with your own credentials. Telegram, Discord, and iMessage are included in the research preview.

When Claude replies through a channel, you see the inbound message in your terminal but not the reply text. The terminal shows the tool call and a confirmation (like "sent"), and the actual reply appears on the other platform.

This page covers:

* [Supported channels](#supported-channels): Telegram, Discord, and iMessage setup
* [Install and run a channel](#quickstart) with fakechat, a localhost demo
* [Who can push messages](#security): sender allowlists and how you pair
* [Enable channels for your organization](#enterprise-controls) if you manage a Team, Enterprise, or Console org
* [How channels compare](#how-channels-compare) to web sessions, Slack, MCP, and Remote Control

To build your own channel, see the [Channels reference](/docs/en/channels-reference).

## Supported channels

Each supported channel is a plugin that requires [Bun](https://bun.sh). For a hands-on demo of the plugin flow before connecting a real platform, try the [fakechat quickstart](#quickstart).

<Tabs>
  <Tab title="Telegram">
    View the full [Telegram plugin source](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/telegram).

    <Steps>
      <Step title="Create a Telegram bot">
        Open [BotFather](https://t.me/BotFather) in Telegram and send `/newbot`. Give it a display name and a unique username ending in `bot`. Copy the token BotFather returns.
      </Step>

      <Step title="Install the plugin">
        In Claude Code, run:

        ```
        /plugin install telegram@claude-plugins-official
        ```

        If Claude Code reports that the plugin is not found in any marketplace, your marketplace is either missing or outdated. Run `/plugin marketplace update claude-plugins-official` to refresh it, or `/plugin marketplace add anthropics/claude-plugins-official` if you haven't added it before. Then retry the install.

        After installing, run `/reload-plugins` to activate the plugin's configure command.
      </Step>

      <Step title="Configure your token">
        Run the configure command with the token from BotFather:

        ```
        /telegram:configure <token>
        ```

        This saves it to `~/.claude/channels/telegram/.env`. You can also set `TELEGRAM_BOT_TOKEN` in your shell environment before launching Claude Code.
      </Step>

      <Step title="Restart with channels enabled">
        Exit Claude Code and restart with the channel flag. This starts the Telegram plugin, which begins polling for messages from your bot:

        ```bash theme={null}
        claude --channels plugin:telegram@claude-plugins-official
        ```
      </Step>

      <Step title="Pair your account">
        Open Telegram and send any message to your bot. The bot replies with a pairing code.

        <Note>If your bot doesn't respond, make sure Claude Code is running with `--channels` from the previous step. The bot can only reply while the channel is active.</Note>

        Back in Claude Code, run:

        ```
        /telegram:access pair <code>
        ```

        Then lock down access so only your account can send messages:

        ```
        /telegram:access policy allowlist
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Discord">
    View the full [Discord plugin source](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/discord).

    <Steps>
      <Step title="Create a Discord bot">
        Go to the [Discord Developer Portal](https://discord.com/developers/applications), click **New Application**, and name it. In the **Bot** section, create a username, then click **Reset Token** and copy the token.
      </Step>

      <Step title="Enable Message Content Intent">
        In your bot's settings, scroll to **Privileged Gateway Intents** and enable **Message Content Intent**.
      </Step>

      <Step title="Invite the bot to your server">
        Go to **OAuth2 > URL Generator**. Select the `bot` scope and enable these permissions:

        * View Channels
        * Send Messages
        * Send Messages in Threads
        * Read Message History
        * Attach Files
        * Add Reactions

        Open the generated URL to add the bot to your server.
      </Step>

      <Step title="Install the plugin">
        In Claude Code, run:

        ```
        /plugin install discord@claude-plugins-official
        ```

        If Claude Code reports that the plugin is not found in any marketplace, your marketplace is either missing or outdated. Run `/plugin marketplace update claude-plugins-official` to refresh it, or `/plugin marketplace add anthropics/claude-plugins-official` if you haven't added it before. Then retry the install.

        After installing, run `/reload-plugins` to activate the plugin's configure command.
      </Step>

      <Step title="Configure your token">
        Run the configure command with the bot token you copied:

        ```
        /discord:configure <token>
        ```

        This saves it to `~/.claude/channels/discord/.env`. You can also set `DISCORD_BOT_TOKEN` in your shell environment before launching Claude Code.
      </Step>

      <Step title="Restart with channels enabled">
        Exit Claude Code and restart with the channel flag. This connects the Discord plugin so your bot can receive and respond to messages:

        ```bash theme={null}
        claude --channels plugin:discord@claude-plugins-official
        ```
      </Step>

      <Step title="Pair your account">
        DM your bot on Discord. The bot replies with a pairing code.

        <Note>If your bot doesn't respond, make sure Claude Code is running with `--channels` from the previous step. The bot can only reply while the channel is active.</Note>

        Back in Claude Code, run:

        ```
        /discord:access pair <code>
        ```

        Then lock down access so only your account can send messages:

        ```
        /discord:access policy allowlist
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="iMessage">
    View the full [iMessage plugin source](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/imessage).

    The iMessage channel reads your Messages database directly and sends replies through AppleScript. It requires macOS and needs no bot token or external service.

    <Steps>
      <Step title="Grant Full Disk Access">
        The Messages database at `~/Library/Messages/chat.db` is protected by macOS. The first time the server reads it, macOS prompts for access: click **Allow**. The prompt names whichever app launched Bun, such as Terminal, iTerm, or your IDE.

        If the prompt doesn't appear or you clicked Don't Allow, grant access manually under **System Settings > Privacy & Security > Full Disk Access** and add your terminal. Without this, the server exits immediately with `authorization denied`.
      </Step>

      <Step title="Install the plugin">
        In Claude Code, run:

        ```
        /plugin install imessage@claude-plugins-official
        ```

        If Claude Code reports that the plugin is not found in any marketplace, your marketplace is either missing or outdated. Run `/plugin marketplace update claude-plugins-official` to refresh it, or `/plugin marketplace add anthropics/claude-plugins-official` if you haven't added it before. Then retry the install.
      </Step>

      <Step title="Restart with channels enabled">
        Exit Claude Code and restart with the channel flag:

        ```bash theme={null}
        claude --channels plugin:imessage@claude-plugins-official
        ```
      </Step>

      <Step title="Text yourself">
        Open Messages on any device signed into your Apple ID and send a message to yourself. It reaches Claude immediately: self-chat bypasses access control with no setup.

        <Note>The first reply Claude sends triggers a macOS Automation prompt asking if your terminal can control Messages. Click **OK**.</Note>
      </Step>

      <Step title="Allow other senders">
        By default, only your own messages pass through. To let another contact reach Claude, add their handle:

        ```
        /imessage:access allow +15551234567
        ```

        Handles are phone numbers in `+country` format or Apple ID emails like `user@example.com`.
      </Step>
    </Steps>
  </Tab>
</Tabs>

You can also [build your own channel](/docs/en/channels-reference) for systems that don't have a plugin yet.

## Quickstart

Fakechat is an officially supported demo channel that runs a chat UI on localhost, with nothing to authenticate and no external service to configure.

Once you install and enable fakechat, you can type in the browser and the message arrives in your Claude Code session. Claude replies, and the reply shows up back in the browser. After you've tested the fakechat interface, try out [Telegram](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/telegram), [Discord](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/discord), or [iMessage](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/imessage).

To try the fakechat demo, you'll need:

* Claude Code [installed and authenticated](/docs/en/quickstart#step-1-install-claude-code) with a claude.ai account or a Claude Console API key
* [Bun](https://bun.sh) installed. The pre-built channel plugins are Bun scripts. Check with `bun --version`; if that fails, [install Bun](https://bun.sh/docs/installation).
* **Team, Enterprise, or managed Console org**: your admin must [enable channels](#enterprise-controls) in managed settings

<Steps>
  <Step title="Install the fakechat channel plugin">
    Start a Claude Code session and run the install command:

    ```text theme={null}
    /plugin install fakechat@claude-plugins-official
    ```

    If Claude Code reports that the plugin is not found in any marketplace, your marketplace is either missing or outdated. Run `/plugin marketplace update claude-plugins-official` to refresh it, or `/plugin marketplace add anthropics/claude-plugins-official` if you haven't added it before. Then retry the install.
  </Step>

  <Step title="Restart with the channel enabled">
    Exit Claude Code, then restart with `--channels` and pass the fakechat plugin you installed:

    ```bash theme={null}
    claude --channels plugin:fakechat@claude-plugins-official
    ```

    The fakechat server starts automatically.

    <Tip>
      You can pass several plugins to `--channels`, space-separated.
    </Tip>
  </Step>

  <Step title="Push a message in">
    Open the fakechat UI at [http://localhost:8787](http://localhost:8787) and type a message:

    ```text theme={null}
    hey, what's in my working directory?
    ```

    The message arrives in your Claude Code session as a `<channel source="fakechat">` event. Claude reads it, does the work, and calls fakechat's `reply` tool. The answer shows up in the chat UI.
  </Step>
</Steps>

If Claude hits a permission prompt while you're away from the terminal, the session pauses until you respond. Channel servers that declare the [permission relay capability](/docs/en/channels-reference#relay-permission-prompts) can forward these prompts to you so you can approve or deny remotely. For unattended use, [`--dangerously-skip-permissions`](/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) bypasses prompts entirely, but only use it in environments you trust.

When you run channels in non-interactive mode with `-p`, tools that need terminal input, such as multiple-choice questions and plan mode approval, are disabled so the session never stalls waiting for input.

## Security

Every approved channel plugin maintains a sender allowlist: only IDs you've added can push messages, and everyone else is silently dropped.

Telegram and Discord bootstrap the list by pairing:

1. Find your bot in Telegram or Discord and send it any message
2. The bot replies with a pairing code
3. In your Claude Code session, approve the code when prompted
4. Your sender ID is added to the allowlist

iMessage works differently: texting yourself bypasses the gate automatically, and you add other contacts by handle with `/imessage:access allow`.

On top of that, you control which servers are enabled each session with `--channels`, and your organization controls availability with [`channelsEnabled`](#enterprise-controls) on claude.ai Team and Enterprise plans and on Console organizations that deploy managed settings.

Being in `.mcp.json` isn't enough to push messages: a server also has to be named in `--channels`.

The allowlist also gates [permission relay](/docs/en/channels-reference#relay-permission-prompts) if the channel declares it. Anyone who can reply through the channel can approve or deny tool use in your session, so only allowlist senders you trust with that authority.

## Enterprise controls

Admins control availability through two [managed settings](/docs/en/settings) that users cannot override. The default depends on how you authenticate:

* **claude.ai Team and Enterprise**: channels are blocked until an admin enables them.
* **Anthropic Console with API key authentication**: channels are permitted by default. You only need this setting if your organization deploys managed settings.

In all cases, no channel runs until a user opts it in for the session with `--channels`.

| Setting                 | Purpose                                                                                                                                                                                                                                                     | When not configured                                                                                                                                                                    |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channelsEnabled`       | Master switch. Must be `true` for any channel to deliver messages. Set via the [claude.ai Admin console](https://claude.ai/admin-settings/claude-code) toggle or directly in managed settings. Blocks all channels including the development flag when off. | claude.ai Team and Enterprise: channels blocked. Console: channels allowed unless your organization deploys managed settings, in which case channels are blocked until this key is set |
| `allowedChannelPlugins` | Which plugins can register once channels are enabled. Replaces the Anthropic-maintained list when set. Only applies when `channelsEnabled` is `true`.                                                                                                       | Anthropic default list applies                                                                                                                                                         |

Pro and Max users without an organization skip these checks entirely: channels are available and users opt in per session with `--channels`.

### Enable channels for your organization

Admins can enable channels from [**claude.ai → Admin settings → Claude Code → Channels**](https://claude.ai/admin-settings/claude-code), or by setting `channelsEnabled` to `true` in managed settings.

Once enabled, users in your organization can use `--channels` to opt channel servers into individual sessions. If the setting is disabled or unset, the MCP server still connects and its tools work, but channel messages won't arrive. A startup warning tells the user to have an admin enable the setting.

### Restrict which channel plugins can run

By default, any plugin on the Anthropic-maintained allowlist can register as a channel. Admins on Team and Enterprise plans can replace that allowlist with their own by setting `allowedChannelPlugins` in managed settings. Use this to restrict which official plugins are allowed, approve channels from your own internal marketplace, or both. Each entry names a plugin and the marketplace it comes from:

```json theme={null}
{
  "channelsEnabled": true,
  "allowedChannelPlugins": [
    { "marketplace": "claude-plugins-official", "plugin": "telegram" },
    { "marketplace": "claude-plugins-official", "plugin": "discord" },
    { "marketplace": "acme-corp-plugins", "plugin": "internal-alerts" }
  ]
}
```

When `allowedChannelPlugins` is set, it replaces the Anthropic allowlist entirely: only the listed plugins can register. Leave it unset to fall back to the default Anthropic allowlist. An empty array blocks all channel plugins from the allowlist, but `--dangerously-load-development-channels` can still bypass it for local testing. To block channels entirely including the development flag, leave `channelsEnabled` unset instead.

This setting requires `channelsEnabled: true`. If a user passes a plugin to `--channels` that isn't on your list, Claude Code starts normally but the channel doesn't register, and the startup notice explains that the plugin isn't on the organization's approved list.

## Research preview

Channels are a research preview feature. Availability is rolling out gradually, and the `--channels` flag syntax and protocol contract may change based on feedback.

During the preview, `--channels` only accepts plugins from an Anthropic-maintained allowlist, or from your organization's allowlist if an admin has set [`allowedChannelPlugins`](#restrict-which-channel-plugins-can-run). The channel plugins in [claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins) are the default approved set. If you pass something that isn't on the effective allowlist, Claude Code starts normally but the channel doesn't register, and the startup notice tells you why.

To test a channel you're building, use `--dangerously-load-development-channels`. See [Test during the research preview](/docs/en/channels-reference#test-during-the-research-preview) for information about testing custom channels that you build.

Report issues or feedback on the [Claude Code GitHub repository](https://github.com/anthropics/claude-code/issues).

## How channels compare

Several Claude Code features connect to systems outside the terminal, each suited to a different kind of work:

| Feature                                              | What it does                                                          | Good for                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| [Claude Code on the web](/docs/en/claude-code-on-the-web) | Runs tasks in a fresh cloud sandbox, cloned from GitHub               | Delegating self-contained async work you check on later   |
| [Claude in Slack](/docs/en/slack)                         | Spawns a web session from an `@Claude` mention in a channel or thread | Starting tasks directly from team conversation context    |
| Standard [MCP server](/docs/en/mcp)                       | Claude queries it during a task; nothing is pushed to the session     | Giving Claude on-demand access to read or query a system  |
| [Remote Control](/docs/en/remote-control)                 | You drive your local session from claude.ai or the Claude mobile app  | Steering an in-progress session while away from your desk |

Channels fill the gap in that list by pushing events from non-Claude sources into your already-running local session.

* **Chat bridge**: ask Claude something from your phone via Telegram, Discord, or iMessage, and the answer comes back in the same chat while the work runs on your machine against your real files.
* **[Webhook receiver](/docs/en/channels-reference#example-build-a-webhook-receiver)**: a webhook from CI, your error tracker, a deploy pipeline, or other external service arrives where Claude already has your files open and remembers what you were debugging.

## Next steps

Once you have a channel running, explore these related features:

* [Build your own channel](/docs/en/channels-reference) for systems that don't have plugins yet
* [Remote Control](/docs/en/remote-control) to drive a local session from your phone instead of forwarding events into it
* [Scheduled tasks](/docs/en/scheduled-tasks) to poll on a timer instead of reacting to pushed events


---

## Channels reference

`https://code.claude.com/docs/en/channels-reference`

Build an MCP server that pushes webhooks, alerts, and chat messages into a Claude Code session. Reference for the channel contract: capability declaration, notification events, reply tools, sender gating, and permission relay.

<Note>
  Channels are in [research preview](/docs/en/channels#research-preview) and require Claude Code v2.1.80 or later. Team and Enterprise organizations must [explicitly enable them](/docs/en/channels#enterprise-controls).
</Note>

A channel is an MCP server that pushes events into a Claude Code session so Claude can react to things happening outside the terminal.

You can build a one-way or two-way channel. One-way channels forward alerts, webhooks, or monitoring events for Claude to act on. Two-way channels like chat bridges also [expose a reply tool](#expose-a-reply-tool) so Claude can send messages back. A channel with a trusted sender path can also opt in to [relay permission prompts](#relay-permission-prompts) so you can approve or deny tool use remotely.

This page covers:

* [Overview](#overview): how channels work
* [What you need](#what-you-need): requirements and general steps
* [Example: build a webhook receiver](#example-build-a-webhook-receiver): a minimal one-way walkthrough
* [Server options](#server-options): the constructor fields
* [Notification format](#notification-format): the event payload and delivery behavior
* [Expose a reply tool](#expose-a-reply-tool): let Claude send messages back
* [Gate inbound messages](#gate-inbound-messages): sender checks to prevent prompt injection
* [Relay permission prompts](#relay-permission-prompts): forward tool approval prompts to remote channels

To use an existing channel instead of building one, see [Channels](/docs/en/channels). Telegram, Discord, iMessage, and fakechat are included in the research preview.

## Overview

A channel is an [MCP](https://modelcontextprotocol.io) server that runs on the same machine as Claude Code. Claude Code spawns it as a subprocess and communicates over stdio. Your channel server is the bridge between external systems and the Claude Code session:

* **Chat platforms** (Telegram, Discord): your plugin runs locally and polls the platform's API for new messages. When someone DMs your bot, the plugin receives the message and forwards it to Claude. No URL to expose.
* **Webhooks** (CI, monitoring): your server listens on a local HTTP port. External systems POST to that port, and your server pushes the payload to Claude.

<img alt="Architecture diagram showing external systems connecting to your local channel server, which communicates with Claude Code over stdio" />

## What you need

The only hard requirement is the [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) package and a Node.js-compatible runtime. [Bun](https://bun.sh), [Node](https://nodejs.org), and [Deno](https://deno.com) all work. The pre-built plugins in the research preview use Bun, but your channel doesn't have to.

Your server needs to:

1. Declare the `claude/channel` capability so Claude Code registers a notification listener
2. Emit `notifications/claude/channel` events when something happens
3. Connect over [stdio transport](https://modelcontextprotocol.io/docs/concepts/transports#standard-io) (Claude Code spawns your server as a subprocess)

The [Server options](#server-options) and [Notification format](#notification-format) sections cover each of these in detail. See [Example: build a webhook receiver](#example-build-a-webhook-receiver) for a full walkthrough.

During the research preview, custom channels aren't on the [approved allowlist](/docs/en/channels#supported-channels). Use `--dangerously-load-development-channels` to test locally. See [Test during the research preview](#test-during-the-research-preview) for details.

## Example: build a webhook receiver

This walkthrough builds a single-file server that listens for HTTP requests and forwards them into your Claude Code session. By the end, anything that can send an HTTP POST, like a CI pipeline, a monitoring alert, or a `curl` command, can push events to Claude.

This example uses [Bun](https://bun.sh) as the runtime for its built-in HTTP server and TypeScript support. You can use [Node](https://nodejs.org) or [Deno](https://deno.com) instead; the only requirement is the [MCP SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk).

<Steps>
  <Step title="Create the project">
    Create a new directory and install the MCP SDK:

    ```bash theme={null}
    mkdir webhook-channel && cd webhook-channel
    bun add @modelcontextprotocol/sdk
    ```
  </Step>

  <Step title="Write the channel server">
    Create a file called `webhook.ts`. This is your entire channel server: it connects to Claude Code over stdio, and it listens for HTTP POSTs on port 8788. When a request arrives, it pushes the body to Claude as a channel event.

    ```ts title="webhook.ts" theme={null}
    #!/usr/bin/env bun
    import { Server } from '@modelcontextprotocol/sdk/server/index.js'
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

    // Create the MCP server and declare it as a channel
    const mcp = new Server(
      { name: 'webhook', version: '0.0.1' },
      {
        // this key is what makes it a channel — Claude Code registers a listener for it
        capabilities: { experimental: { 'claude/channel': {} } },
        // added to Claude's system prompt so it knows how to handle these events
        instructions: 'Events from the webhook channel arrive as <channel source="webhook" ...>. They are one-way: read them and act, no reply expected.',
      },
    )

    // Connect to Claude Code over stdio (Claude Code spawns this process)
    await mcp.connect(new StdioServerTransport())

    // Start an HTTP server that forwards every POST to Claude
    Bun.serve({
      port: 8788,  // any open port works
      // localhost-only: nothing outside this machine can POST
      hostname: '127.0.0.1',
      async fetch(req) {
        const body = await req.text()
        await mcp.notification({
          method: 'notifications/claude/channel',
          params: {
            content: body,  // becomes the body of the <channel> tag
            // each key becomes a tag attribute, e.g. <channel path="/" method="POST">
            meta: { path: new URL(req.url).pathname, method: req.method },
          },
        })
        return new Response('ok')
      },
    })
    ```

    The file does three things in order:

    * **Server configuration**: creates the MCP server with `claude/channel` in its capabilities, which is what tells Claude Code this is a channel. The [`instructions`](#server-options) string goes into Claude's system prompt: tell Claude what events to expect, whether to reply, and how to route replies if it should.
    * **Stdio connection**: connects to Claude Code over stdin/stdout. This is standard for any [MCP server](https://modelcontextprotocol.io/docs/concepts/transports#standard-io): Claude Code spawns it as a subprocess.
    * **HTTP listener**: starts a local web server on port 8788. Every POST body gets forwarded to Claude as a channel event via `mcp.notification()`. The `content` becomes the event body, and each `meta` entry becomes an attribute on the `<channel>` tag. The listener needs access to the `mcp` instance, so it runs in the same process. You could split it into separate modules for a larger project.
  </Step>

  <Step title="Register your server with Claude Code">
    Add the server to your MCP config so Claude Code knows how to start it. For a project-level `.mcp.json` in the same directory, use a relative path. For user-level config in `~/.claude.json`, use the full absolute path so the server can be found from any project:

    ```json title=".mcp.json" theme={null}
    {
      "mcpServers": {
        "webhook": { "command": "bun", "args": ["./webhook.ts"] }
      }
    }
    ```

    Claude Code reads your MCP config at startup and spawns each server as a subprocess.
  </Step>

  <Step title="Test it">
    During the research preview, custom channels aren't on the allowlist, so start Claude Code with the development flag:

    ```bash theme={null}
    claude --dangerously-load-development-channels server:webhook
    ```

    When Claude Code starts, it reads your MCP config, spawns your `webhook.ts` as a subprocess, and the HTTP listener starts automatically on the port you configured (8788 in this example). You don't need to run the server yourself.

    If you see "blocked by org policy," your organization admin needs to [enable channels](/docs/en/channels#enterprise-controls) first.

    In a separate terminal, simulate a webhook by sending an HTTP POST with a message to your server. This example sends a CI failure alert to port 8788 (or whichever port you configured):

    ```bash theme={null}
    curl -X POST localhost:8788 -d "build failed on main: https://ci.example.com/run/1234"
    ```

    The payload arrives in your Claude Code session as a `<channel>` tag:

    ```text theme={null}
    <channel source="webhook" path="/" method="POST">build failed on main: https://ci.example.com/run/1234</channel>
    ```

    In your Claude Code terminal, you'll see Claude receive the message and start responding: reading files, running commands, or whatever the message calls for. This is a one-way channel, so Claude acts in your session but doesn't send anything back through the webhook. To add replies, see [Expose a reply tool](#expose-a-reply-tool).

    If the event doesn't arrive, the diagnosis depends on what `curl` returned:

    * **`curl` succeeds but nothing reaches Claude**: run `/mcp` in your session to check the server's status. "Failed to connect" usually means a dependency or import error in your server file; check the debug log at `~/.claude/debug/<session-id>.txt` for the stderr trace.
    * **`curl` fails with "connection refused"**: the port is either not bound yet or a stale process from an earlier run is holding it. `lsof -i :<port>` shows what's listening; `kill` the stale process before restarting your session.
  </Step>
</Steps>

The [fakechat server](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/fakechat) extends this pattern with a web UI, file attachments, and a reply tool for two-way chat.

## Test during the research preview

During the research preview, every channel must be on the [approved allowlist](/docs/en/channels#research-preview) to register. The development flag bypasses the allowlist for specific entries after a confirmation prompt. This example shows both entry types:

```bash theme={null}
# Testing a plugin you're developing
claude --dangerously-load-development-channels plugin:yourplugin@yourmarketplace

# Testing a bare .mcp.json server (no plugin wrapper yet)
claude --dangerously-load-development-channels server:webhook
```

The bypass is per-entry. Combining this flag with `--channels` doesn't extend the bypass to the `--channels` entries. During the research preview, the approved allowlist is Anthropic-curated, so your channel stays on the development flag while you build and test.

<Note>
  This flag skips the allowlist only. The `channelsEnabled` organization policy still applies. Don't use it to run channels from untrusted sources.
</Note>

## Server options

A channel sets these options in the [`Server`](https://modelcontextprotocol.io/docs/concepts/servers) constructor. The `instructions` and `capabilities.tools` fields are [standard MCP](https://modelcontextprotocol.io/docs/concepts/servers); `capabilities.experimental['claude/channel']` and `capabilities.experimental['claude/channel/permission']` are the channel-specific additions:

| Field                                                    | Type     | Description                                                                                                                                                                                                                                                             |
| :------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capabilities.experimental['claude/channel']`            | `object` | Required. Always `{}`. Presence registers the notification listener.                                                                                                                                                                                                    |
| `capabilities.experimental['claude/channel/permission']` | `object` | Optional. Always `{}`. Declares that this channel can receive permission relay requests. When declared, Claude Code forwards tool approval prompts to your channel so you can approve or deny them remotely. See [Relay permission prompts](#relay-permission-prompts). |
| `capabilities.tools`                                     | `object` | Two-way only. Always `{}`. Standard MCP tool capability. See [Expose a reply tool](#expose-a-reply-tool).                                                                                                                                                               |
| `instructions`                                           | `string` | Recommended. Added to Claude's system prompt. Tell Claude what events to expect, what the `<channel>` tag attributes mean, whether to reply, and if so which tool to use and which attribute to pass back (like `chat_id`).                                             |

To create a one-way channel, omit `capabilities.tools`. This example shows a two-way setup with the channel capability, tools, and instructions set:

```ts theme={null}
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

const mcp = new Server(
  { name: 'your-channel', version: '0.0.1' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },  // registers the channel listener
      tools: {},  // omit for one-way channels
    },
    // added to Claude's system prompt so it knows how to handle your events
    instructions: 'Messages arrive as <channel source="your-channel" ...>. Reply with the reply tool.',
  },
)
```

To push an event, call `mcp.notification()` with method `notifications/claude/channel`. The params are in the next section.

## Notification format

Your server emits `notifications/claude/channel` with two params:

| Field     | Type                     | Description                                                                                                                                                                                                                                                           |
| :-------- | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content` | `string`                 | The event body. Delivered as the body of the `<channel>` tag.                                                                                                                                                                                                         |
| `meta`    | `Record<string, string>` | Optional. Each entry becomes an attribute on the `<channel>` tag for routing context like chat ID, sender name, or alert severity. Keys must be identifiers: letters, digits, and underscores only. Keys containing hyphens or other characters are silently dropped. |

Your server pushes events by calling `mcp.notification()` on the `Server` instance. This example pushes a CI failure alert with two meta keys:

```ts theme={null}
await mcp.notification({
  method: 'notifications/claude/channel',
  params: {
    content: 'build failed on main: https://ci.example.com/run/1234',
    meta: { severity: 'high', run_id: '1234' },
  },
})
```

The event arrives in Claude's context wrapped in a `<channel>` tag. The `source` attribute is set automatically from your server's configured name:

```text theme={null}
<channel source="your-channel" severity="high" run_id="1234">
build failed on main: https://ci.example.com/run/1234
</channel>
```

Notifications are not acknowledged. The `await` on `mcp.notification()` resolves when the message is written to the transport, not when Claude has processed it. If the session hasn't loaded your server as a channel, or the organization policy blocks it, events are dropped silently with no error returned to your server.

If you need delivery confirmation, track event state in your server and expose a [reply tool](#expose-a-reply-tool) that Claude can call to report status back.

Events queue into the session and are processed in order. If several notifications arrive while Claude is busy, they're delivered together on the next turn and Claude handles them as a group. To process independent event streams concurrently, run separate sessions.

## Expose a reply tool

If your channel is two-way, like a chat bridge rather than an alert forwarder, expose a standard [MCP tool](https://modelcontextprotocol.io/docs/concepts/tools) that Claude can call to send messages back. Nothing about the tool registration is channel-specific. A reply tool has three components:

1. A `tools: {}` entry in your `Server` constructor capabilities so Claude Code discovers the tool
2. Tool handlers that define the tool's schema and implement the send logic
3. An `instructions` string in your `Server` constructor that tells Claude when and how to call the tool

To add these to the [webhook receiver above](#example-build-a-webhook-receiver):

<Steps>
  <Step title="Enable tool discovery">
    In your `Server` constructor in `webhook.ts`, add `tools: {}` to the capabilities so Claude Code knows your server offers tools:

    ```ts theme={null}
    capabilities: {
      experimental: { 'claude/channel': {} },
      tools: {},  // enables tool discovery
    },
    ```
  </Step>

  <Step title="Register the reply tool">
    Add the following to `webhook.ts`. The `import` goes at the top of the file with your other imports; the two handlers go between the `Server` constructor and `mcp.connect()`. This registers a `reply` tool that Claude can call with a `chat_id` and `text`:

    ```ts theme={null}
    // Add this import at the top of webhook.ts
    import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

    // Claude queries this at startup to discover what tools your server offers
    mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{
        name: 'reply',
        description: 'Send a message back over this channel',
        // inputSchema tells Claude what arguments to pass
        inputSchema: {
          type: 'object',
          properties: {
            chat_id: { type: 'string', description: 'The conversation to reply in' },
            text: { type: 'string', description: 'The message to send' },
          },
          required: ['chat_id', 'text'],
        },
      }],
    }))

    // Claude calls this when it wants to invoke a tool
    mcp.setRequestHandler(CallToolRequestSchema, async req => {
      if (req.params.name === 'reply') {
        const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
        // send() is your outbound: POST to your chat platform, or for local
        // testing the SSE broadcast shown in the full example below.
        send(`Reply to ${chat_id}: ${text}`)
        return { content: [{ type: 'text', text: 'sent' }] }
      }
      throw new Error(`unknown tool: ${req.params.name}`)
    })
    ```
  </Step>

  <Step title="Update the instructions">
    Update the `instructions` string in your `Server` constructor so Claude knows to route replies back through the tool. This example tells Claude to pass `chat_id` from the inbound tag:

    ```ts theme={null}
    instructions: 'Messages arrive as <channel source="webhook" chat_id="...">. Reply with the reply tool, passing the chat_id from the tag.'
    ```
  </Step>
</Steps>

Here's the complete `webhook.ts` with two-way support. Outbound replies stream over `GET /events` using [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) (SSE), so `curl -N localhost:8788/events` can watch them live; inbound chat arrives on `POST /`:

```ts title="Full webhook.ts with reply tool" expandable theme={null}
#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

// --- Outbound: write to any curl -N listeners on /events --------------------
// A real bridge would POST to your chat platform instead.
const listeners = new Set<(chunk: string) => void>()
function send(text: string) {
  const chunk = text.split('\n').map(l => `data: ${l}\n`).join('') + '\n'
  for (const emit of listeners) emit(chunk)
}

const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },
      tools: {},
    },
    instructions: 'Messages arrive as <channel source="webhook" chat_id="...">. Reply with the reply tool, passing the chat_id from the tag.',
  },
)

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'reply',
    description: 'Send a message back over this channel',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'The conversation to reply in' },
        text: { type: 'string', description: 'The message to send' },
      },
      required: ['chat_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

await mcp.connect(new StdioServerTransport())

let nextId = 1
Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  idleTimeout: 0,  // don't close idle SSE streams
  async fetch(req) {
    const url = new URL(req.url)

    // GET /events: SSE stream so curl -N can watch Claude's replies live
    if (req.method === 'GET' && url.pathname === '/events') {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(': connected\n\n')  // so curl shows something immediately
          const emit = (chunk: string) => ctrl.enqueue(chunk)
          listeners.add(emit)
          req.signal.addEventListener('abort', () => listeners.delete(emit))
        },
      })
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }

    // POST: forward to Claude as a channel event
    const body = await req.text()
    const chat_id = String(nextId++)
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content: body,
        meta: { chat_id, path: url.pathname, method: req.method },
      },
    })
    return new Response('ok')
  },
})
```

The [fakechat server](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/fakechat) shows a more complete example with file attachments and message editing.

## Gate inbound messages

An ungated channel is a prompt injection vector. Anyone who can reach your endpoint can put text in front of Claude. A channel listening to a chat platform or a public endpoint needs a real sender check before it emits anything.

Check the sender against an allowlist before calling `mcp.notification()`. This example drops any message from a sender not in the set:

```ts theme={null}
const allowed = new Set(loadAllowlist())  // from your access.json or equivalent

// inside your message handler, before emitting:
if (!allowed.has(message.from.id)) {  // sender, not room
  return  // drop silently
}
await mcp.notification({ ... })
```

Gate on the sender's identity, not the chat or room identity: `message.from.id` in the example, not `message.chat.id`. In group chats, these differ, and gating on the room would let anyone in an allowlisted group inject messages into the session.

The [Telegram](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/telegram) and [Discord](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/discord) channels gate on a sender allowlist the same way. They bootstrap the list by pairing: the user DMs the bot, the bot replies with a pairing code, the user approves it in their Claude Code session, and their platform ID is added. See either implementation for the full pairing flow. The [iMessage](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/imessage) channel takes a different approach: it detects the user's own addresses from the Messages database at startup and lets them through automatically, with other senders added by handle.

## Relay permission prompts

<Note>
  Permission relay requires Claude Code v2.1.81 or later. Earlier versions ignore the `claude/channel/permission` capability.
</Note>

When Claude calls a tool that needs approval, the local terminal dialog opens and the session waits. A two-way channel can opt in to receive the same prompt in parallel and relay it to you on another device. Both stay live: you can answer in the terminal or on your phone, and Claude Code applies whichever answer arrives first and closes the other.

Relay covers tool-use approvals like `Bash`, `Write`, and `Edit`. Project trust and MCP server consent dialogs don't relay; those only appear in the local terminal.

### How relay works

When a permission prompt opens, the relay loop has four steps:

1. Claude Code generates a short request ID and notifies your server
2. Your server forwards the prompt and ID to your chat app
3. The remote user replies with a yes or no and that ID
4. Your inbound handler parses the reply into a verdict, and Claude Code applies it only if the ID matches an open request

The local terminal dialog stays open through all of this. If someone at the terminal answers before the remote verdict arrives, that answer is applied instead and the pending remote request is dropped.

<img alt="Sequence diagram: Claude Code sends a permission_request notification to the channel server, the server formats and sends the prompt to the chat app, the human replies with a verdict, and the server parses that reply into a permission notification back to Claude Code" />

### Permission request fields

The outbound notification from Claude Code is `notifications/claude/channel/permission_request`. Like the [channel notification](#notification-format), the transport is standard MCP but the method and schema are Claude Code extensions. The `params` object has four string fields your server formats into the outgoing prompt:

| Field           | Description                                                                                                                                                                                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `request_id`    | Five lowercase letters drawn from `a`-`z` without `l`, so it never reads as a `1` or `I` when typed on a phone. Include it in your outgoing prompt so it can be echoed in the reply. Claude Code only accepts a verdict that carries an ID it issued. The local terminal dialog doesn't display this ID, so your outbound handler is the only way to learn it. |
| `tool_name`     | Name of the tool Claude wants to use, for example `Bash` or `Write`.                                                                                                                                                                                                                                                                                           |
| `description`   | Human-readable summary of what this specific tool call does, the same text the local terminal dialog shows. For a Bash call this is Claude's description of the command, or the command itself if none was given.                                                                                                                                              |
| `input_preview` | The tool's arguments as a JSON string, truncated to 200 characters. For Bash this is the command; for Write it's the file path and a prefix of the content. Omit it from your prompt if you only have room for a one-line message. Your server decides what to show.                                                                                           |

The verdict your server sends back is `notifications/claude/channel/permission` with two fields: `request_id` echoing the ID above, and `behavior` set to `'allow'` or `'deny'`. Allow lets the tool call proceed; deny rejects it, the same as answering No in the local dialog. Neither verdict affects future calls.

### Add relay to a chat bridge

Adding permission relay to a two-way channel takes three components:

1. A `claude/channel/permission: {}` entry under `experimental` capabilities in your `Server` constructor so Claude Code knows to forward prompts
2. A notification handler for `notifications/claude/channel/permission_request` that formats the prompt and sends it out through your platform API
3. A check in your inbound message handler that recognizes `yes <id>` or `no <id>` and emits a `notifications/claude/channel/permission` verdict instead of forwarding the text to Claude

Only declare the capability if your channel [authenticates the sender](#gate-inbound-messages), because anyone who can reply through your channel can approve or deny tool use in your session.

To add these to a two-way chat bridge like the one assembled in [Expose a reply tool](#expose-a-reply-tool):

<Steps>
  <Step title="Declare the permission capability">
    In your `Server` constructor, add `claude/channel/permission: {}` alongside `claude/channel` under `experimental`:

    ```ts theme={null}
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {},  // opt in to permission relay
      },
      tools: {},
    },
    ```
  </Step>

  <Step title="Handle the incoming request">
    Register a notification handler between your `Server` constructor and `mcp.connect()`. Claude Code calls it with the [four request fields](#permission-request-fields) when a permission dialog opens. Your handler formats the prompt for your platform and includes instructions for replying with the ID:

    ```ts theme={null}
    import { z } from 'zod'

    // setNotificationHandler routes by z.literal on the method field,
    // so this schema is both the validator and the dispatch key
    const PermissionRequestSchema = z.object({
      method: z.literal('notifications/claude/channel/permission_request'),
      params: z.object({
        request_id: z.string(),     // five lowercase letters, include verbatim in your prompt
        tool_name: z.string(),      // e.g. "Bash", "Write"
        description: z.string(),    // human-readable summary of this call
        input_preview: z.string(),  // tool args as JSON, truncated to ~200 chars
      }),
    })

    mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
      // send() is your outbound: POST to your chat platform, or for local
      // testing the SSE broadcast shown in the full example below.
      send(
        `Claude wants to run ${params.tool_name}: ${params.description}\n\n` +
        // the ID in the instruction is what your inbound handler parses in Step 3
        `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
      )
    })
    ```
  </Step>

  <Step title="Intercept the verdict in your inbound handler">
    Your inbound handler is the loop or callback that receives messages from your platform: the same place you [gate on sender](#gate-inbound-messages) and emit `notifications/claude/channel` to forward chat to Claude. Add a check before the chat-forwarding call that recognizes the verdict format and emits the permission notification instead.

    The regex matches the ID format Claude Code generates: five letters, never `l`. The `/i` flag tolerates phone autocorrect capitalizing the reply; lowercase the captured ID before sending it back.

    ```ts theme={null}
    // matches "y abcde", "yes abcde", "n abcde", "no abcde"
    // [a-km-z] is the ID alphabet Claude Code uses (lowercase, skips 'l')
    // /i tolerates phone autocorrect; lowercase the capture before sending
    const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i

    async function onInbound(message: PlatformMessage) {
      if (!allowed.has(message.from.id)) return  // gate on sender first

      const m = PERMISSION_REPLY_RE.exec(message.text)
      if (m) {
        // m[1] is the verdict word, m[2] is the request ID
        // emit the verdict notification back to Claude Code instead of chat
        await mcp.notification({
          method: 'notifications/claude/channel/permission',
          params: {
            request_id: m[2].toLowerCase(),  // normalize in case of autocorrect caps
            behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
          },
        })
        return  // handled as verdict, don't also forward as chat
      }

      // didn't match verdict format: fall through to the normal chat path
      await mcp.notification({
        method: 'notifications/claude/channel',
        params: { content: message.text, meta: { chat_id: String(message.chat.id) } },
      })
    }
    ```
  </Step>
</Steps>

Claude Code also keeps the local terminal dialog open, so you can answer in either place, and the first answer to arrive is applied. A remote reply that doesn't exactly match the expected format fails in one of two ways, and in both cases the dialog stays open:

* **Different format**: your inbound handler's regex fails to match, so text like `approve it` or `yes` without an ID falls through as a normal message to Claude.
* **Right format, wrong ID**: your server emits a verdict, but Claude Code finds no open request with that ID and drops it silently.

### Full example

The assembled `webhook.ts` below combines all three extensions from this page: the reply tool, sender gating, and permission relay. If you're starting here, you'll also need the [project setup and `.mcp.json` entry](#example-build-a-webhook-receiver) from the initial walkthrough.

To make both directions testable from curl, the HTTP listener serves two paths:

* **`GET /events`**: holds an SSE stream open and pushes each outbound message as a `data:` line, so `curl -N` can watch Claude's replies and permission prompts arrive live.
* **`POST /`**: the inbound side, the same handler as earlier, now with the verdict-format check inserted before the chat-forward branch.

```ts title="Full webhook.ts with permission relay" expandable theme={null}
#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

// --- Outbound: write to any curl -N listeners on /events --------------------
// A real bridge would POST to your chat platform instead.
const listeners = new Set<(chunk: string) => void>()
function send(text: string) {
  const chunk = text.split('\n').map(l => `data: ${l}\n`).join('') + '\n'
  for (const emit of listeners) emit(chunk)
}

// Sender allowlist. For the local walkthrough we trust the single X-Sender
// header value "dev"; a real bridge would check the platform's user ID.
const allowed = new Set(['dev'])

const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {},  // opt in to permission relay
      },
      tools: {},
    },
    instructions:
      'Messages arrive as <channel source="webhook" chat_id="...">. ' +
      'Reply with the reply tool, passing the chat_id from the tag.',
  },
)

// --- reply tool: Claude calls this to send a message back -------------------
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'reply',
    description: 'Send a message back over this channel',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'The conversation to reply in' },
        text: { type: 'string', description: 'The message to send' },
      },
      required: ['chat_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

// --- permission relay: Claude Code (not Claude) calls this when a dialog opens
const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  send(
    `Claude wants to run ${params.tool_name}: ${params.description}\n\n` +
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  )
})

await mcp.connect(new StdioServerTransport())

// --- HTTP on :8788: GET /events streams outbound, POST routes inbound -------
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i
let nextId = 1

Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  idleTimeout: 0,  // don't close idle SSE streams
  async fetch(req) {
    const url = new URL(req.url)

    // GET /events: SSE stream so curl -N can watch replies and prompts live
    if (req.method === 'GET' && url.pathname === '/events') {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(': connected\n\n')  // so curl shows something immediately
          const emit = (chunk: string) => ctrl.enqueue(chunk)
          listeners.add(emit)
          req.signal.addEventListener('abort', () => listeners.delete(emit))
        },
      })
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }

    // everything else is inbound: gate on sender first
    const body = await req.text()
    const sender = req.headers.get('X-Sender') ?? ''
    if (!allowed.has(sender)) return new Response('forbidden', { status: 403 })

    // check for verdict format before treating as chat
    const m = PERMISSION_REPLY_RE.exec(body)
    if (m) {
      await mcp.notification({
        method: 'notifications/claude/channel/permission',
        params: {
          request_id: m[2].toLowerCase(),
          behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
        },
      })
      return new Response('verdict recorded')
    }

    // normal chat: forward to Claude as a channel event
    const chat_id = String(nextId++)
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: { content: body, meta: { chat_id, path: url.pathname } },
    })
    return new Response('ok')
  },
})
```

Test the verdict path in three terminals. The first is your Claude Code session, started with the [development flag](#test-during-the-research-preview) so it spawns `webhook.ts`:

```bash theme={null}
claude --dangerously-load-development-channels server:webhook
```

In the second, stream the outbound side so you can see Claude's replies and any permission prompts as they fire:

```bash theme={null}
curl -N localhost:8788/events
```

In the third, send a message that will make Claude try to run a command:

```bash theme={null}
curl -d "list the files in this directory" -H "X-Sender: dev" localhost:8788
```

The local permission dialog opens in your Claude Code terminal. A moment later the prompt appears in the `/events` stream, including the five-letter ID. Approve it from the remote side:

```bash theme={null}
curl -d "yes <id>" -H "X-Sender: dev" localhost:8788
```

The local dialog closes and the tool runs. Claude's reply comes back through the `reply` tool and lands in the stream too.

The three channel-specific pieces in this file:

* **Capabilities** in the `Server` constructor: `claude/channel` registers the notification listener, `claude/channel/permission` opts in to permission relay, `tools` lets Claude discover the reply tool.
* **Outbound paths**: the `reply` tool handler is what Claude calls for conversational responses; the `PermissionRequestSchema` notification handler is what Claude Code calls when a permission dialog opens. Both call `send()` to broadcast over `/events`, but they're triggered by different parts of the system.
* **HTTP handler**: `GET /events` holds an SSE stream open so curl can watch outbound live; `POST` is inbound, gated on the `X-Sender` header. A `yes <id>` or `no <id>` body goes to Claude Code as a verdict notification and never reaches Claude; anything else is forwarded to Claude as a channel event.

## Package as a plugin

To make your channel installable and shareable, wrap it in a [plugin](/docs/en/plugins) and publish it to a [marketplace](/docs/en/plugin-marketplaces). Users install it with `/plugin install`, then enable it per session with `--channels plugin:<name>@<marketplace>`.

A channel published to your own marketplace still needs `--dangerously-load-development-channels` to run, since it isn't on the [approved allowlist](/docs/en/channels#supported-channels). The default allowlist is the channel plugins in `claude-plugins-official`, which Anthropic curates at its discretion. The [in-app submission forms](/docs/en/plugins#submit-your-plugin-to-the-community-marketplace) add plugins to the community marketplace, which is not on the channel allowlist.

If you are working with an Anthropic partner contact, reach out to them to coordinate an official-marketplace listing. On Team and Enterprise plans, an admin can instead include your plugin in the organization's own [`allowedChannelPlugins`](/docs/en/channels#restrict-which-channel-plugins-can-run) list, which replaces the default Anthropic allowlist.

## See also

* [Channels](/docs/en/channels) to install and use Telegram, Discord, iMessage, or the fakechat demo, and to enable channels for a Team or Enterprise org
* [Working channel implementations](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins) for complete server code with pairing flows, reply tools, and file attachments
* [MCP](/docs/en/mcp) for the underlying protocol that channel servers implement
* [Plugins](/docs/en/plugins) to package your channel so users can install it with `/plugin install`


---

## Launch sessions from links

`https://code.claude.com/docs/en/deep-links`

Open a Claude Code terminal session from a URL. Embed `claude-cli://` links in runbooks, alerts, and dashboards so a click opens Claude Code in the right repo with the right prompt.

A deep link is a `claude-cli://` URL that opens Claude Code in a new terminal window. The URL can carry a working directory and a prompt to pre-fill.

This lets you share a one-click starting point for a task: anyone with Claude Code installed who clicks the link sees a session open with the prompt already typed. The prompt is populated but not sent until you press Enter.

Because a deep link is a URL, you can put one anywhere a link can go:

* An incident runbook step that opens the affected service's repo with a diagnostic prompt
* A monitoring alert or dashboard that links to an investigation prompt for a specific metric
* A README or wiki page that opens the project with an onboarding prompt
* A CI failure notification that pre-fills the failing job's name

This page covers how to [build a link](#build-a-link), [embed one in a runbook or trigger it from the shell](#examples), and [manage or disable handler registration](#registration-and-supported-platforms) on each platform.

<Note>
  Deep links require Claude Code v2.1.91 or later.
</Note>

## How it works

The `claude-cli://` prefix is a custom URL scheme that Claude Code registers with your operating system, similar to how `mailto:` links open your email client. The link can live on a web page, in a wiki, in a Slack message, or in any app that renders links. When you click one:

1. The browser or app hands the URL to your operating system.
2. The operating system recognizes the `claude-cli://` prefix and starts Claude Code on your machine.
3. A new terminal window opens with Claude Code running in the directory the link specified, and the link's prompt text already in the input box.
4. You read the prompt, edit it if you want, and press Enter to send it.

The link itself can be hosted anywhere, but the session always opens locally on the computer where you clicked. See [Registration and supported platforms](#registration-and-supported-platforms) for which terminal emulator opens on each operating system.

<Note>
  The platform that displays the link must allow custom URL schemes. GitHub-rendered Markdown allows `http` and `https` but strips schemes like `claude-cli://` in READMEs, issues, pull requests, and wikis. Only the link text shows, with no link behind it and the URL hidden. See [Troubleshooting](#the-link-renders-as-plain-text-instead-of-being-clickable) for a workaround.
</Note>

### What a launched session shows

A deep link never executes anything on its own. The link only chooses a directory and fills the prompt box. If you click a link from a page you do not trust, the prompt is still inert: nothing reaches the model until you read what was filled in and press Enter.

When the session opens, a banner above the input shows that an external link launched it and which directory it selected. For prompts over 1,000 characters, the banner tells you to scroll and review the full text before pressing Enter, since long prompts can push instructions off screen. Permission rules, `CLAUDE.md`, and trust prompts for the selected directory apply the same way as for any other session.

## Build a link

Every deep link starts with `claude-cli://open`, which is the only path the handler accepts, followed by optional query parameters. The minimal form opens Claude Code in your home directory with an empty prompt:

```text theme={null}
claude-cli://open
```

Add parameters to control where the session starts and what the prompt box contains:

| Parameter | Description                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`       | Text to pre-fill in the prompt box. [URL-encode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) the value. Use `%0A` for line breaks in multi-line prompts. Maximum 5,000 characters. |
| `cwd`     | Absolute path to use as the working directory. Network and UNC paths are rejected.                                                                                                                                                          |
| `repo`    | A GitHub `owner/name` slug. Claude Code resolves it to a local clone it has seen before and starts there. If you have no matching clone, the session opens in your home directory instead.                                                  |

`cwd` and `repo` are [two ways to set the working directory](#choose-between-cwd-and-repo). If you pass both, `cwd` takes precedence and `repo` is ignored, even if the `cwd` path does not exist.

The following link points at a repository called `acme/payments` with a two-line diagnostic prompt. Replace `acme/payments` with your repository's `owner/name` slug when you build your own:

```text theme={null}
claude-cli://open?repo=acme/payments&q=Investigate%20the%20failed%20deploy%20of%20payments-api.%0ACheck%20recent%20commits%20to%20main%20and%20the%20last%20successful%20build.
```

Clicking it opens a new terminal window, starts Claude Code in your local clone of `acme/payments`, and fills the prompt box with the decoded text:

```text theme={null}
Investigate the failed deploy of payments-api.
Check recent commits to main and the last successful build.
```

You can edit the prompt before pressing Enter to send it. If you have no local clone of the repository, the session opens in your home directory instead. See [Choose between `cwd` and `repo`](#choose-between-cwd-and-repo) for how the local path is selected when you have multiple clones or worktrees.

### Choose between `cwd` and `repo`

Use `cwd` when everyone who clicks the link has the project at the same absolute path, such as a standardized devcontainer or VM image.

Use `repo` when the link is shared and each person clones to a different location. Claude Code resolves the slug to a local path as follows:

* Each time you run `claude` in a Git repository, that directory's filesystem path is recorded against the repository's GitHub `owner/name` slug.
* When a deep link arrives, `repo` opens whichever matching path you used most recently. Multiple clones and worktrees are tracked separately, so it picks the one you worked in last.
* The lookup only finds paths where you have already run Claude Code at least once.
* The link does not change which branch is checked out. The session opens in whatever state that directory is currently in.

The launched session shows which path it picked and when that clone last fetched from the remote, so you can tell if you are looking at stale code.

## Examples

The sections below show two common ways to use a deep link: as a Markdown link in a document and as a command in a script or shell alias.

### Embed a link in a runbook

A deep link in a runbook gives whoever is triaging a one-click way to start investigating in the right repository with a prepared prompt. The platform that renders the runbook must allow custom URL schemes. GitHub-rendered Markdown does not allow `claude-cli://`, so a deep link in a GitHub README, issue, or wiki shows only its label with no clickable link. See [the troubleshooting note](#the-link-renders-as-plain-text-instead-of-being-clickable) for a workaround.

The prompt is part of the URL and must be URL-encoded. To produce the encoded value, pass your prompt text through `encodeURIComponent` in a browser console or any URL encoder.

The example below adds an investigation entry point to an incident runbook for a service called `web-gateway`:

```markdown theme={null}
## High 5xx rate on web-gateway

1. Acknowledge the page in PagerDuty.
2. [Open Claude Code in the gateway repo](claude-cli://open?repo=acme/web-gateway&q=5xx%20rate%20is%20elevated%20on%20web-gateway.%20Check%20recent%20deploys%2C%20error%20logs%20from%20the%20last%2030%20minutes%2C%20and%20open%20incidents%20in%20Linear.)
3. Post initial findings in #incident.
```

To use this in your own runbook, replace `acme/web-gateway` with your service's repository slug. This allows engineers with Claude Code installed and a local clone of that repository to click step 2 and start investigating with the prompt ready to send.

### Open a link from the shell

You can also open a deep link from a shell script, alias, or automation rather than by clicking it. Call your operating system's URL-opening command with the link as the argument.

<Tabs>
  <Tab title="macOS">
    The built-in `open` command passes the URL to the registered `claude-cli://` handler:

    ```bash theme={null}
    open "claude-cli://open?repo=acme/payments&q=review%20open%20PRs"
    ```
  </Tab>

  <Tab title="Linux">
    Most desktop environments provide `xdg-open`, which passes the URL to the registered handler:

    ```bash theme={null}
    xdg-open "claude-cli://open?repo=acme/payments&q=review%20open%20PRs"
    ```
  </Tab>

  <Tab title="Windows">
    In PowerShell, `Start-Process` passes the URL to the registered handler:

    ```powershell theme={null}
    Start-Process "claude-cli://open?repo=acme/payments&q=review%20open%20PRs"
    ```

    In `cmd.exe`, `start` treats its first quoted argument as a window title, so pass an empty title before the URL:

    ```cmd theme={null}
    start "" "claude-cli://open?repo=acme/payments&q=review%20open%20PRs"
    ```
  </Tab>
</Tabs>

## Registration and supported platforms

Claude Code registers the `claude-cli://` handler with your operating system the first time you start an interactive session on macOS, Linux, and Windows. You do not run a separate install command. Registration writes to user-level locations only:

| Platform | Handler location                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| macOS    | `~/Applications/Claude Code URL Handler.app`                                                                       |
| Linux    | `claude-code-url-handler.desktop` under `$XDG_DATA_HOME/applications`, defaulting to `~/.local/share/applications` |
| Windows  | `HKEY_CURRENT_USER\Software\Classes\claude-cli`                                                                    |

The handler launches Claude Code in a detected terminal emulator. On macOS, Claude Code remembers the terminal from your most recent interactive session and reuses it, supporting iTerm2, Ghostty, kitty, Alacritty, WezTerm, and Terminal.app. On Linux it honors the `$TERMINAL` environment variable, then `x-terminal-emulator`, then a list of common emulators. On Windows it prefers Windows Terminal, then PowerShell, then `cmd.exe`.

To prevent registration entirely, set [`disableDeepLinkRegistration`](/docs/en/settings) to `"disable"` in `settings.json`. To enforce this across an organization so users cannot re-enable it, set it in [managed settings](/docs/en/server-managed-settings) instead.

## Open a VS Code tab instead of a terminal

The VS Code extension registers its own handler at `vscode://anthropic.claude-code/open`, which opens a Claude Code editor tab rather than a terminal window. See [Launch a VS Code tab from other tools](/docs/en/vs-code#launch-a-vs-code-tab-from-other-tools) for that URL's parameters.

## Troubleshooting

### Clicking the link does nothing

The handler likely is not registered yet. Start an interactive `claude` session once on that machine, exit, and try the link again. If you are on Linux without a desktop environment, `xdg-open` may have nothing to dispatch to.

### The link renders as plain text instead of being clickable

Some Markdown renderers only allow `http` and `https` links and strip other URL schemes. GitHub does this in READMEs, issues, pull requests, and wikis: `[label](claude-cli://...)` renders as just `label`, with no link and the URL removed. On these platforms, put the deep link in a code block so readers can see the URL and paste it into their browser's address bar.

### The session opens in my home directory instead of the repo

The `repo` parameter only resolves to clones Claude Code has already seen. Run `claude` inside the clone once so its path is recorded, or switch the link to use `cwd` with an absolute path.

### The link opens the wrong terminal

On macOS, start `claude` in your preferred terminal once and the next deep link will use it. On Linux, set the `$TERMINAL` environment variable to your preferred emulator's command name. On Windows, the order is fixed: install Windows Terminal if you want links to open there instead of a PowerShell or `cmd.exe` window.

## Learn more

These pages cover related ways to launch or extend Claude Code sessions:

* [Skills](/docs/en/skills): store a long runbook prompt as a `/skill` in the repo so the deep link's `q` parameter only has to name it
* [Non-interactive mode](/docs/en/headless): run Claude from a script and capture the output without opening a terminal
