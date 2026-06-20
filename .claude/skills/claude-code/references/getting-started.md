# Getting Started

_Claude Code documentation — Getting Started. Source: https://code.claude.com/docs/en/_


---

## Overview

`https://code.claude.com/docs/en/overview`

Claude Code is an agentic coding tool that reads your codebase, edits files, runs commands, and integrates with your development tools. Available in your terminal, IDE, desktop app, and browser.

Claude Code is an AI-powered coding assistant that helps you build features, fix bugs, and automate development tasks. It understands your entire codebase and can work across multiple files and tools to get things done.

## Get started

Choose your environment to get started. Most surfaces require a [Claude subscription](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=overview_pricing) or [Anthropic Console](https://console.anthropic.com/) account. The Terminal CLI and VS Code also support [third-party providers](/docs/en/third-party-integrations).

<Tabs>
  <Tab title="Terminal">
    The full-featured CLI for working with Claude Code directly in your terminal. Edit files, run commands, and manage your entire project from the command line.

    To install Claude Code, use one of the following methods:

    <Tabs>
      <Tab title="Native Install (Recommended)">
        **macOS, Linux, WSL:**

        ```bash theme={null}
        curl -fsSL https://claude.ai/install.sh | bash
        ```

        **Windows PowerShell:**

        ```powershell theme={null}
        irm https://claude.ai/install.ps1 | iex
        ```

        **Windows CMD:**

        ```batch theme={null}
        curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
        ```

        If you see `The token '&&' is not a valid statement separator`, you're in PowerShell, not CMD. If you see `'irm' is not recognized as an internal or external command`, you're in CMD, not PowerShell. Your prompt shows `PS C:\` when you're in PowerShell and `C:\` without the `PS` when you're in CMD.

        [Git for Windows](https://git-scm.com/downloads/win) is recommended on native Windows so Claude Code can use the Bash tool. If Git for Windows is not installed, Claude Code uses PowerShell as the shell tool instead. WSL setups do not need Git for Windows.

        <Info>
          Native installations automatically update in the background to keep you on the latest version.
        </Info>
      </Tab>

      <Tab title="Homebrew">
        ```bash theme={null}
        brew install --cask claude-code
        ```

        Homebrew offers two casks. `claude-code` tracks the stable release channel, which is typically about a week behind and skips releases with major regressions. `claude-code@latest` tracks the latest channel and receives new versions as soon as they ship.

        <Info>
          Homebrew installations do not auto-update. Run `brew upgrade claude-code` or `brew upgrade claude-code@latest`, depending on which cask you installed, to get the latest features and security fixes.
        </Info>
      </Tab>

      <Tab title="WinGet">
        ```powershell theme={null}
        winget install Anthropic.ClaudeCode
        ```

        <Info>
          WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.
        </Info>
      </Tab>
    </Tabs>

    You can also install with [apt, dnf, or apk](/docs/en/setup#install-with-linux-package-managers) on Debian, Fedora, RHEL, and Alpine.

    Then start Claude Code in any project:

    ```bash theme={null}
    cd your-project
    claude
    ```

    You'll be prompted to log in on first use. That's it! [Continue with the Quickstart →](/docs/en/quickstart)

    <Tip>
      See [advanced setup](/docs/en/setup) for installation options, manual updates, or uninstallation instructions. Visit [installation troubleshooting](/docs/en/troubleshoot-install) if you hit issues.
    </Tip>
  </Tab>

  <Tab title="VS Code">
    The VS Code extension provides inline diffs, @-mentions, plan review, and conversation history directly in your editor.

    * [Install for VS Code](vscode:extension/anthropic.claude-code)
    * [Install for Cursor](cursor:extension/anthropic.claude-code)

    Or search for "Claude Code" in the Extensions view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux). After installing, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`), type "Claude Code", and select **Open in New Tab**.

    [Get started with VS Code →](/docs/en/vs-code#get-started)
  </Tab>

  <Tab title="Desktop app">
    A standalone app for running Claude Code outside your IDE or terminal. Review diffs visually, run multiple sessions side by side, schedule recurring tasks, and kick off cloud sessions.

    Download and install:

    * [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code\&utm_medium=docs) (Intel and Apple Silicon)
    * [Windows](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect?utm_source=claude_code\&utm_medium=docs) (x64)
    * [Windows ARM64](https://claude.ai/api/desktop/win32/arm64/setup/latest/redirect?utm_source=claude_code\&utm_medium=docs)

    After installing, launch Claude, sign in, and click the **Code** tab to start coding. A [paid subscription](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=overview_desktop_pricing) is required.

    [Learn more about the desktop app →](/docs/en/desktop-quickstart)
  </Tab>

  <Tab title="Web">
    Run Claude Code in your browser with no local setup. Kick off long-running tasks and check back when they're done, work on repos you don't have locally, or run multiple tasks in parallel. Available on desktop browsers and the Claude iOS app.

    Start coding at [claude.ai/code](https://claude.ai/code).

    [Get started on the web →](/docs/en/web-quickstart)
  </Tab>

  <Tab title="JetBrains">
    A plugin for IntelliJ IDEA, PyCharm, WebStorm, and other JetBrains IDEs with interactive diff viewing and selection context sharing.

    Install the [Claude Code plugin](https://plugins.jetbrains.com/plugin/27310-claude-code-beta-) from the JetBrains Marketplace and restart your IDE.

    [Get started with JetBrains →](/docs/en/jetbrains)
  </Tab>
</Tabs>

## What you can do

Here are some of the ways you can use Claude Code:

<AccordionGroup>
  <Accordion title="Automate the work you keep putting off" icon="wand-magic-sparkles">
    Claude Code handles the tedious tasks that eat up your day: writing tests for untested code, fixing lint errors across a project, resolving merge conflicts, updating dependencies, and writing release notes.

    ```bash theme={null}
    claude "write tests for the auth module, run them, and fix any failures"
    ```
  </Accordion>

  <Accordion title="Build features and fix bugs" icon="hammer">
    Describe what you want in plain language. Claude Code plans the approach, writes the code across multiple files, and verifies it works.

    For bugs, paste an error message or describe the symptom. Claude Code traces the issue through your codebase, identifies the root cause, and implements a fix. See [common workflows](/docs/en/common-workflows) for more examples.
  </Accordion>

  <Accordion title="Create commits and pull requests" icon="code-branch">
    Claude Code works directly with git. It stages changes, writes commit messages, creates branches, and opens pull requests.

    ```bash theme={null}
    claude "commit my changes with a descriptive message"
    ```

    In CI, you can automate code review and issue triage with [GitHub Actions](/docs/en/github-actions) or [GitLab CI/CD](/docs/en/gitlab-ci-cd).
  </Accordion>

  <Accordion title="Connect your tools with MCP" icon="plug">
    The [Model Context Protocol (MCP)](/docs/en/mcp) is an open standard for connecting AI tools to external data sources. With MCP, Claude Code can read your design docs in Google Drive, update tickets in Jira, pull data from Slack, or use your own custom tooling.
  </Accordion>

  <Accordion title="Customize with instructions, skills, and hooks" icon="sliders">
    [`CLAUDE.md`](/docs/en/memory) is a markdown file you add to your project root that Claude Code reads at the start of every session. Use it to set coding standards, architecture decisions, preferred libraries, and review checklists. Claude also builds [auto memory](/docs/en/memory#auto-memory) as it works, saving learnings like build commands and debugging insights across sessions without you writing anything.

    Create [skills](/docs/en/skills) to package repeatable workflows your team can share, like `/review-pr` or `/deploy-staging`.

    [Hooks](/docs/en/hooks) let you run shell commands before or after Claude Code actions, like auto-formatting after every file edit or running lint before a commit.
  </Accordion>

  <Accordion title="Run agent teams and build custom agents" icon="users">
    Spawn [multiple Claude Code agents](/docs/en/sub-agents) that work on different parts of a task simultaneously. A lead agent coordinates the work, assigns subtasks, and merges results.

    To run several full sessions in parallel and watch them from one screen, use [background agents](/docs/en/agent-view). For fully custom workflows, the [Agent SDK](/docs/en/agent-sdk/overview) lets you build your own agents powered by Claude Code's tools and capabilities, with full control over orchestration, tool access, and permissions.
  </Accordion>

  <Accordion title="Pipe, script, and automate with the CLI" icon="terminal">
    Claude Code is composable and follows the Unix philosophy. Pipe logs into it, run it in CI, or chain it with other tools:

    ```bash theme={null}
    # Analyze recent log output
    tail -200 app.log | claude -p "Slack me if you see any anomalies"

    # Automate translations in CI
    claude -p "translate new strings into French and raise a PR for review"

    # Bulk operations across files
    git diff main --name-only | claude -p "review these changed files for security issues"
    ```

    See the [CLI reference](/docs/en/cli-reference) for the full set of commands and flags.
  </Accordion>

  <Accordion title="Schedule recurring tasks" icon="clock">
    Run Claude on a schedule to automate work that repeats: morning PR reviews, overnight CI failure analysis, weekly dependency audits, or syncing docs after PRs merge.

    * [Routines](/docs/en/routines) run on Anthropic-managed infrastructure, so they keep running even when your computer is off. They can also trigger on API calls or GitHub events. Create them from the web, the Desktop app, or by running `/schedule` in the CLI.
    * [Desktop scheduled tasks](/docs/en/desktop-scheduled-tasks) run on your machine, with direct access to your local files and tools
    * [`/loop`](/docs/en/scheduled-tasks) repeats a prompt within a CLI session for quick polling
  </Accordion>

  <Accordion title="Work from anywhere" icon="globe">
    Sessions aren't tied to a single surface. Move work between environments as your context changes:

    * Step away from your desk and keep working from your phone or any browser with [Remote Control](/docs/en/remote-control)
    * Message [Dispatch](/docs/en/desktop#sessions-from-dispatch) a task from your phone and open the Desktop session it creates
    * Kick off a long-running task on the [web](/docs/en/claude-code-on-the-web) or [iOS app](https://apps.apple.com/app/claude-by-anthropic/id6473753684), then pull it into your terminal with `claude --teleport`
    * Hand off a terminal session to the [Desktop app](/docs/en/desktop) with `/desktop` for visual diff review
    * Route tasks from team chat: mention `@Claude` in [Slack](/docs/en/slack) with a bug report and get a pull request back
  </Accordion>
</AccordionGroup>

## Use Claude Code everywhere

Each surface connects to the same underlying Claude Code engine, so your CLAUDE.md files, settings, and MCP servers work across all of them.

Beyond the [Terminal](/docs/en/quickstart), [VS Code](/docs/en/vs-code), [JetBrains](/docs/en/jetbrains), [Desktop](/docs/en/desktop), and [Web](/docs/en/claude-code-on-the-web) environments above, Claude Code integrates with CI/CD, chat, and browser workflows:

| I want to...                                                                    | Best option                                                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Continue a local session from my phone or another device                        | [Remote Control](/docs/en/remote-control)                                                                               |
| Push events from Telegram, Discord, iMessage, or my own webhooks into a session | [Channels](/docs/en/channels)                                                                                           |
| Start a task locally, continue on mobile                                        | [Web](/docs/en/claude-code-on-the-web) or [Claude iOS app](https://apps.apple.com/app/claude-by-anthropic/id6473753684) |
| Run Claude on a recurring schedule                                              | [Routines](/docs/en/routines) or [Desktop scheduled tasks](/docs/en/desktop-scheduled-tasks)                                 |
| Automate PR reviews and issue triage                                            | [GitHub Actions](/docs/en/github-actions) or [GitLab CI/CD](/docs/en/gitlab-ci-cd)                                           |
| Get automatic code review on every PR                                           | [GitHub Code Review](/docs/en/code-review)                                                                              |
| Route bug reports from Slack to pull requests                                   | [Slack](/docs/en/slack)                                                                                                 |
| Debug live web applications                                                     | [Chrome](/docs/en/chrome)                                                                                               |
| Build custom agents for your own workflows                                      | [Agent SDK](/docs/en/agent-sdk/overview)                                                                                |

## Next steps

Once you've installed Claude Code, these guides help you go deeper.

* [Quickstart](/docs/en/quickstart): walk through your first real task, from exploring a codebase to committing a fix
* [Store instructions and memories](/docs/en/memory): give Claude persistent instructions with CLAUDE.md files and auto memory
* [Common workflows](/docs/en/common-workflows) and [best practices](/docs/en/best-practices): patterns for getting the most out of Claude Code
* [Settings](/docs/en/settings): customize Claude Code for your workflow
* [Troubleshooting](/docs/en/troubleshooting): solutions for common issues
* [code.claude.com](https://code.claude.com/): demos, pricing, and product details


---

## Quickstart

`https://code.claude.com/docs/en/quickstart`

Welcome to Claude Code!

This quickstart guide will have you using AI-powered coding assistance in a few minutes. By the end, you'll understand how to use Claude Code for common development tasks.

## Before you begin

Make sure you have:

* A terminal or command prompt open
  * If you've never used the terminal before, check out the [terminal guide](/docs/en/terminal-guide)
* A code project to work with
* A [Claude subscription](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=quickstart_prereq) (Pro, Max, Team, or Enterprise), [Claude Console](https://console.anthropic.com/) account, or access through a [supported cloud provider](/docs/en/third-party-integrations)

<Note>
  This guide covers the terminal CLI. Claude Code is also available on the [web](https://claude.ai/code), as a [desktop app](/docs/en/desktop), in [VS Code](/docs/en/vs-code) and [JetBrains IDEs](/docs/en/jetbrains), in [Slack](/docs/en/slack), and in CI/CD with [GitHub Actions](/docs/en/github-actions) and [GitLab](/docs/en/gitlab-ci-cd). See [all interfaces](/docs/en/overview#use-claude-code-everywhere).
</Note>

## Step 1: Install Claude Code

To install Claude Code, use one of the following methods:

<Tabs>
  <Tab title="Native Install (Recommended)">
    **macOS, Linux, WSL:**

    ```bash theme={null}
    curl -fsSL https://claude.ai/install.sh | bash
    ```

    **Windows PowerShell:**

    ```powershell theme={null}
    irm https://claude.ai/install.ps1 | iex
    ```

    **Windows CMD:**

    ```batch theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
    ```

    If you see `The token '&&' is not a valid statement separator`, you're in PowerShell, not CMD. If you see `'irm' is not recognized as an internal or external command`, you're in CMD, not PowerShell. Your prompt shows `PS C:\` when you're in PowerShell and `C:\` without the `PS` when you're in CMD.

    [Git for Windows](https://git-scm.com/downloads/win) is recommended on native Windows so Claude Code can use the Bash tool. If Git for Windows is not installed, Claude Code uses PowerShell as the shell tool instead. WSL setups do not need Git for Windows.

    <Info>
      Native installations automatically update in the background to keep you on the latest version.
    </Info>
  </Tab>

  <Tab title="Homebrew">
    ```bash theme={null}
    brew install --cask claude-code
    ```

    Homebrew offers two casks. `claude-code` tracks the stable release channel, which is typically about a week behind and skips releases with major regressions. `claude-code@latest` tracks the latest channel and receives new versions as soon as they ship.

    <Info>
      Homebrew installations do not auto-update. Run `brew upgrade claude-code` or `brew upgrade claude-code@latest`, depending on which cask you installed, to get the latest features and security fixes.
    </Info>
  </Tab>

  <Tab title="WinGet">
    ```powershell theme={null}
    winget install Anthropic.ClaudeCode
    ```

    <Info>
      WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.
    </Info>
  </Tab>
</Tabs>

You can also install with [apt, dnf, or apk](/docs/en/setup#install-with-linux-package-managers) on Debian, Fedora, RHEL, and Alpine.

## Step 2: Log in to your account

Claude Code requires an account to use. Start an interactive session with the `claude` command and you'll be prompted to log in on first use:

```bash theme={null}
claude
```

For Claude subscription or Console accounts, follow the prompts to complete authentication in your browser. To switch accounts later or re-authenticate, type `/login` inside the running session:

```text theme={null}
/login
```

You can log in using any of these account types:

* [Claude Pro, Max, Team, or Enterprise](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=quickstart_login) (recommended)
* [Claude Console](https://console.anthropic.com/) (API access with pre-paid credits). On first login, a "Claude Code" workspace is automatically created in the Console for centralized cost tracking.
* [Amazon Bedrock, Google Vertex AI, or Microsoft Foundry](/docs/en/third-party-integrations) (enterprise cloud providers)

Once logged in, your credentials are stored and you won't need to log in again.

## Step 3: Start your first session

Open your terminal in any project directory and start Claude Code:

```bash theme={null}
cd /path/to/your/project
claude
```

You'll see the Claude Code welcome screen with your session information, recent conversations, and latest updates. Type `/help` for available commands or `/resume` to continue a previous conversation.

<Tip>
  After logging in (Step 2), your credentials are stored on your system. Learn more in [Credential Management](/docs/en/authentication#credential-management).
</Tip>

## Step 4: Ask your first question

Let's start with understanding your codebase. Try one of these commands:

```text theme={null}
what does this project do?
```

Claude will analyze your files and provide a summary. You can also ask more specific questions:

```text theme={null}
what technologies does this project use?
```

```text theme={null}
where is the main entry point?
```

```text theme={null}
explain the folder structure
```

You can also ask Claude about its own capabilities:

```text theme={null}
what can Claude Code do?
```

```text theme={null}
how do I create custom skills in Claude Code?
```

```text theme={null}
can Claude Code work with Docker?
```

<Note>
  Claude Code reads your project files as needed. You don't have to manually add context.
</Note>

## Step 5: Make your first code change

Now let's make Claude Code do some actual coding. Try a simple task:

```text theme={null}
add a hello world function to the main file
```

Claude Code will:

1. Find the appropriate file
2. Show you the proposed changes
3. Ask for your approval
4. Make the edit

<Note>
  Claude Code always asks for permission before modifying files. You can approve individual changes or enable "Accept all" mode for a session.
</Note>

## Step 6: Use Git with Claude Code

Claude Code makes Git operations conversational:

```text theme={null}
what files have I changed?
```

```text theme={null}
commit my changes with a descriptive message
```

You can also prompt for more complex Git operations:

```text theme={null}
create a new branch called feature/quickstart
```

```text theme={null}
show me the last 5 commits
```

```text theme={null}
help me resolve merge conflicts
```

## Step 7: Fix a bug or add a feature

Claude is proficient at debugging and feature implementation.

Describe what you want in natural language:

```text theme={null}
add input validation to the user registration form
```

Or fix existing issues:

```text theme={null}
there's a bug where users can submit empty forms - fix it
```

Claude Code will:

* Locate the relevant code
* Understand the context
* Implement a solution
* Run tests if available

## Step 8: Test out other common workflows

There are a number of ways to work with Claude:

**Refactor code**

```text theme={null}
refactor the authentication module to use async/await instead of callbacks
```

**Write tests**

```text theme={null}
write unit tests for the calculator functions
```

**Update documentation**

```text theme={null}
update the README with installation instructions
```

**Code review**

```text theme={null}
review my changes and suggest improvements
```

<Tip>
  Talk to Claude like you would a helpful colleague. Describe what you want to achieve, and it will help you get there.
</Tip>

## Essential commands

Here are the most important commands for daily use:

| Command             | What it does                                           | Example                             |
| ------------------- | ------------------------------------------------------ | ----------------------------------- |
| `claude`            | Start interactive mode                                 | `claude`                            |
| `claude "task"`     | Run a one-time task                                    | `claude "fix the build error"`      |
| `claude -p "query"` | Run one-off query, then exit                           | `claude -p "explain this function"` |
| `claude -c`         | Continue most recent conversation in current directory | `claude -c`                         |
| `claude -r`         | Resume a previous conversation                         | `claude -r`                         |
| `/clear`            | Clear conversation history                             | `/clear`                            |
| `/help`             | Show available commands                                | `/help`                             |
| `exit` or Ctrl+D    | Exit Claude Code                                       | `exit`                              |

See the [CLI reference](/docs/en/cli-reference) for a complete list of commands.

## Pro tips for beginners

For more, see [best practices](/docs/en/best-practices) and [common workflows](/docs/en/common-workflows).

<AccordionGroup>
  <Accordion title="Be specific with your requests">
    Instead of: "fix the bug"

    Try: "fix the login bug where users see a blank screen after entering wrong credentials"
  </Accordion>

  <Accordion title="Use step-by-step instructions">
    Break complex tasks into steps:

    ```text theme={null}
    1. create a new database table for user profiles
    2. create an API endpoint to get and update user profiles
    3. build a webpage that allows users to see and edit their information
    ```
  </Accordion>

  <Accordion title="Let Claude explore first">
    Before making changes, let Claude understand your code:

    ```text theme={null}
    analyze the database schema
    ```

    ```text theme={null}
    build a dashboard showing products that are most frequently returned by our UK customers
    ```
  </Accordion>

  <Accordion title="Save time with shortcuts">
    * Type `/` to see all commands and skills
    * Use Tab for command completion
    * Press ↑ for command history
    * Press `Shift+Tab` to cycle permission modes
  </Accordion>
</AccordionGroup>

## What's next?

Now that you've learned the basics, explore more advanced features:

<CardGroup>
  <Card title="How Claude Code works" icon="microchip" href="/en/how-claude-code-works">
    Understand the agentic loop, built-in tools, and how Claude Code interacts with your project
  </Card>

  <Card title="Best practices" icon="star" href="/en/best-practices">
    Get better results with effective prompting and project setup
  </Card>

  <Card title="Common workflows" icon="graduation-cap" href="/en/common-workflows">
    Step-by-step guides for common tasks
  </Card>

  <Card title="Extend Claude Code" icon="puzzle-piece" href="/en/features-overview">
    Customize with CLAUDE.md, skills, hooks, MCP, and more
  </Card>
</CardGroup>

## Getting help

* **In Claude Code**: Type `/help` or ask "how do I..."
* **Documentation**: You're here! Browse other guides
* **Community**: Join our [Discord](https://www.anthropic.com/discord) for tips and support


---

## How Claude Code works

`https://code.claude.com/docs/en/how-claude-code-works`

Understand the agentic loop, built-in tools, and how Claude Code interacts with your project.

Claude Code is an agentic assistant that runs in your terminal. While it excels at coding, it can help with anything you can do from the command line: writing docs, running builds, searching files, researching topics, and more.

This guide covers the core architecture, built-in capabilities, and [tips for working effectively](#work-effectively-with-claude-code). For step-by-step walkthroughs, see [Common workflows](/docs/en/common-workflows). For extensibility features like skills, MCP, and hooks, see [Extend Claude Code](/docs/en/features-overview).

## The agentic loop

When you give Claude a task, it works through three phases: **gather context**, **take action**, and **verify results**. These phases blend together. Claude uses tools throughout, whether searching files to understand your code, editing to make changes, or running tests to check its work.

<img alt="The agentic loop: Your prompt leads to Claude gathering context, taking action, verifying results, and repeating until task complete. You can interrupt at any point." />

The loop adapts to what you ask. A question about your codebase might only need context gathering. A bug fix cycles through all three phases repeatedly. A refactor might involve extensive verification. Claude decides what each step requires based on what it learned from the previous step, chaining dozens of actions together and course-correcting along the way.

You're part of this loop too. You can interrupt at any point to steer Claude in a different direction, provide additional context, or ask it to try a different approach. Claude works autonomously but stays responsive to your input.

The agentic loop is powered by two components: [models](#models) that reason and [tools](#tools) that act. Claude Code serves as the **agentic harness** around Claude: it provides the tools, context management, and execution environment that turn a language model into a capable coding agent.

### Models

Claude Code uses Claude models to understand your code and reason about tasks. Claude can read code in any language, understand how components connect, and figure out what needs to change to accomplish your goal. For complex tasks, it breaks work into steps, executes them, and adjusts based on what it learns.

[Multiple models](/docs/en/model-config) are available with different tradeoffs. Sonnet handles most coding tasks well. Opus provides stronger reasoning for complex architectural decisions. Switch with `/model` during a session or start with `claude --model <name>`.

When this guide says "Claude chooses" or "Claude decides," it's the model doing the reasoning.

### Tools

Tools are what make Claude Code agentic. Without tools, Claude can only respond with text. With tools, Claude can act: read your code, edit files, run commands, search the web, and interact with external services. Each tool use returns information that feeds back into the loop, informing Claude's next decision.

The built-in tools generally fall into five categories, each representing a different kind of agency.

| Category              | What Claude can do                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File operations**   | Read files, edit code, create new files, rename and reorganize                                                                                                |
| **Search**            | Find files by pattern, search content with regex, explore codebases                                                                                           |
| **Execution**         | Run shell commands, start servers, run tests, use git                                                                                                         |
| **Web**               | Search the web, fetch documentation, look up error messages                                                                                                   |
| **Code intelligence** | See type errors and warnings after edits, jump to definitions, find references (requires [code intelligence plugins](/docs/en/discover-plugins#code-intelligence)) |

These are the primary capabilities. Claude also has tools for spawning subagents, asking you questions, and other orchestration tasks. See [Tools available to Claude](/docs/en/tools-reference) for the complete list.

Claude chooses which tools to use based on your prompt and what it learns along the way. When you say "fix the failing tests," Claude might:

1. Run the test suite to see what's failing
2. Read the error output
3. Search for the relevant source files
4. Read those files to understand the code
5. Edit the files to fix the issue
6. Run the tests again to verify

Each tool use gives Claude new information that informs the next step. This is the agentic loop in action.

**Extending the base capabilities:** The built-in tools are the foundation. You can extend what Claude knows with [skills](/docs/en/skills), connect to external services with [MCP](/docs/en/mcp), automate workflows with [hooks](/docs/en/hooks), and offload tasks to [subagents](/docs/en/sub-agents). These extensions form a layer on top of the core agentic loop. See [Extend Claude Code](/docs/en/features-overview) for guidance on choosing the right extension for your needs.

## What Claude can access

This guide focuses on the terminal. Claude Code also runs in [VS Code](/docs/en/vs-code), [JetBrains IDEs](/docs/en/jetbrains), and other environments.

When you run `claude` in a directory, Claude Code gains access to:

* **Your project.** Files in your directory and subdirectories, plus files elsewhere with your permission.
* **Your terminal.** Any command you could run: build tools, git, package managers, system utilities, scripts. If you can do it from the command line, Claude can too.
* **Your git state.** Current branch, uncommitted changes, and recent commit history.
* **Your [CLAUDE.md](/docs/en/memory).** A markdown file where you store project-specific instructions, conventions, and context that Claude should know every session.
* **[Auto memory](/docs/en/memory#auto-memory).** Learnings Claude saves automatically as you work, like project patterns and your preferences. The first 200 lines or 25KB of MEMORY.md, whichever comes first, load at the start of each session.
* **Extensions you configure.** [MCP servers](/docs/en/mcp) for external services, [skills](/docs/en/skills) for workflows, [subagents](/docs/en/sub-agents) for delegated work, and [Claude in Chrome](/docs/en/chrome) for browser interaction.

Because Claude sees your whole project, it can work across it. When you ask Claude to "fix the authentication bug," it searches for relevant files, reads multiple files to understand context, makes coordinated edits across them, runs tests to verify the fix, and commits the changes if you ask. This is different from inline code assistants that only see the current file.

## Environments and interfaces

The agentic loop, tools, and capabilities described above are the same everywhere you use Claude Code. What changes is where the code executes and how you interact with it.

### Execution environments

Claude Code runs in three environments, each with different tradeoffs for where your code executes.

| Environment        | Where code runs                         | Use case                                                   |
| ------------------ | --------------------------------------- | ---------------------------------------------------------- |
| **Local**          | Your machine                            | Default. Full access to your files, tools, and environment |
| **Cloud**          | Anthropic-managed VMs                   | Offload tasks, work on repos you don't have locally        |
| **Remote Control** | Your machine, controlled from a browser | Use the web UI while keeping everything local              |

### Interfaces

You can access Claude Code through the terminal, the [desktop app](/docs/en/desktop), [IDE extensions](/docs/en/vs-code), [claude.ai/code](https://claude.ai/code), [Remote Control](/docs/en/remote-control), [Slack](/docs/en/slack), and [CI/CD pipelines](/docs/en/github-actions). The interface determines how you see and interact with Claude, but the underlying agentic loop is identical. See [Use Claude Code everywhere](/docs/en/overview#use-claude-code-everywhere) for the full list.

## Work with sessions

Claude Code saves your conversation locally as you work. Each message, tool use, and result is written to a plaintext JSONL file under `~/.claude/projects/`, which enables [rewinding](#undo-changes-with-checkpoints), [resuming, and forking](#resume-or-fork-sessions) sessions. Before Claude makes code changes, it also snapshots the affected files so you can revert if needed. For paths, retention, and how to clear this data, see [application data in `~/.claude`](/docs/en/claude-directory#application-data).

**Sessions are independent.** Each new session starts with a fresh context window, without the conversation history from previous sessions. Claude can persist learnings across sessions using [auto memory](/docs/en/memory#auto-memory), and you can add your own persistent instructions in [CLAUDE.md](/docs/en/memory).

### Work across branches

Each Claude Code conversation is a session tied to your current directory. The `/resume` picker shows sessions from the current worktree by default, with keyboard shortcuts to widen the list to other worktrees or projects. See [Manage sessions](/docs/en/sessions#use-the-session-picker) for the full list of picker shortcuts and how name resolution works.

Claude sees your current branch's files. When you switch branches, Claude sees the new branch's files, but your conversation history stays the same. Claude remembers what you discussed even after switching.

Since sessions are tied to directories, you can run parallel Claude sessions by using [git worktrees](/docs/en/worktrees), which create separate directories for individual branches.

### Resume or fork sessions

Resuming a session with `claude --continue` or `claude --resume` reopens it under the same session ID and appends new messages to the existing conversation. Forking with `--fork-session` or `/branch` copies the history into a new session ID, leaving the original unchanged.

<img alt="Session continuity: resume continues the same session, fork creates a new branch with a new ID." />

For the resume flags, the `/resume` picker, naming, and what happens when the same session is open in two terminals, see [Manage sessions](/docs/en/sessions).

### The context window

Claude's context window holds your conversation history, file contents, command outputs, [CLAUDE.md](/docs/en/memory), [auto memory](/docs/en/memory#auto-memory), loaded skills, and system instructions. As you work, context fills up. Claude compacts automatically, but instructions from early in the conversation can get lost. Put persistent rules in CLAUDE.md, and run `/context` to see what's using space.

For an interactive walkthrough of what loads and when, see [Explore the context window](/docs/en/context-window).

#### When context fills up

Claude Code manages context automatically as you approach the limit. It clears older tool outputs first, then summarizes the conversation if needed. Your requests and key code snippets are preserved; detailed instructions from early in the conversation may be lost. Put persistent rules in CLAUDE.md rather than relying on conversation history.

To control what's preserved during compaction, add a "Compact Instructions" section to CLAUDE.md or run `/compact` with a focus (like `/compact focus on the API changes`).

If a single file or tool output is so large that context refills immediately after each summary, Claude Code stops auto-compacting after a few attempts and shows an error instead of looping. See [Auto-compaction stops with a thrashing error](/docs/en/troubleshooting#auto-compaction-stops-with-a-thrashing-error) for recovery steps.

Run `/context` to see what's using space. MCP tool definitions are deferred by default and loaded on demand via [tool search](/docs/en/mcp#scale-with-mcp-tool-search), so only tool names consume context until Claude uses a specific tool. Run `/mcp` to check per-server costs.

#### Manage context with skills and subagents

Beyond compaction, you can use other features to control what loads into context.

[Skills](/docs/en/skills) load on demand. Claude sees skill descriptions at session start, but the full content only loads when a skill is used. For skills you invoke manually, set `disable-model-invocation: true` to keep descriptions out of context until you need them. For skills you didn't write, use [`skillOverrides`](/docs/en/skills#override-skill-visibility-from-settings) to do the same from settings.

[Subagents](/docs/en/sub-agents) get their own fresh context, completely separate from your main conversation. Their work doesn't bloat your context. When done, they return a summary. This isolation is why subagents help with long sessions.

See [context costs](/docs/en/features-overview#understand-context-costs) for what each feature costs, and [reduce token usage](/docs/en/costs#reduce-token-usage) for tips on managing context.

## Stay safe with checkpoints and permissions

Claude has two safety mechanisms: checkpoints let you undo file changes, and permissions control what Claude can do without asking.

### Undo changes with checkpoints

**Every file edit is reversible.** Before Claude edits any file, it snapshots the current contents. If something goes wrong, press `Esc` twice to rewind to a previous state, or ask Claude to undo.

Checkpoints are local to your session, separate from git. They only cover file changes. Actions that affect remote systems (databases, APIs, deployments) can't be checkpointed, which is why Claude asks before running commands with external side effects.

### Control what Claude can do

Press `Shift+Tab` to cycle through permission modes:

* **Default**: Claude asks before file edits and shell commands
* **Auto-accept edits**: Claude edits files and runs common filesystem commands like `mkdir` and `mv` without asking, still asks for other commands
* **Plan mode**: Claude uses read-only tools only, creating a plan you can approve before execution
* **Auto mode**: Claude evaluates all actions with background safety checks. Currently a research preview

You can also allow specific commands in `.claude/settings.json` so Claude doesn't ask each time. This is useful for trusted commands like `npm test` or `git status`. Settings can be scoped from organization-wide policies down to personal preferences. See [Permissions](/docs/en/permissions) for details.

***

## Work effectively with Claude Code

These tips help you get better results from Claude Code.

### Ask Claude Code for help

Claude Code can teach you how to use it. Ask questions like "how do I set up hooks?" or "what's the best way to structure my CLAUDE.md?" and Claude will explain.

Built-in commands also guide you through setup:

* `/init` walks you through creating a CLAUDE.md for your project
* `/agents` helps you configure custom subagents
* `/doctor` diagnoses common issues with your installation

### It's a conversation

Claude Code is conversational. You don't need perfect prompts. Start with what you want, then refine:

```text theme={null}
Fix the login bug
```

\[Claude investigates, tries something]

```text theme={null}
That's not quite right. The issue is in the session handling.
```

\[Claude adjusts approach]

When the first attempt isn't right, you don't start over. You iterate.

#### Interrupt and steer

You can redirect Claude at any point without waiting for the turn to finish or starting over:

* **Press `Esc`** to stop Claude immediately. The running tool call is canceled and Claude waits for your next instruction.
* **Type a correction and press `Enter`** to send it without stopping the running tool. Claude reads it as soon as the current action completes and adjusts before deciding its next step.

### Be specific upfront

The more precise your initial prompt, the fewer corrections you'll need. Reference specific files, mention constraints, and point to example patterns.

```text theme={null}
The checkout flow is broken for users with expired cards.
Check src/payments/ for the issue, especially token refresh.
Write a failing test first, then fix it.
```

Vague prompts work, but you'll spend more time steering. Specific prompts like the one above often succeed on the first attempt.

### Give Claude something to verify against

Claude performs better when it can check its own work. Include test cases, paste screenshots of expected UI, or define the output you want.

```text theme={null}
Implement validateEmail. Test cases: 'user@example.com' → true,
'invalid' → false, 'user@.com' → false. Run the tests after.
```

For visual work, paste a screenshot of the design and ask Claude to compare its implementation against it.

### Explore before implementing

For complex problems, separate research from coding. Use plan mode (`Shift+Tab` twice) to analyze the codebase first:

```text theme={null}
Read src/auth/ and understand how we handle sessions.
Then create a plan for adding OAuth support.
```

Review the plan, refine it through conversation, then let Claude implement. This two-phase approach produces better results than jumping straight to code.

### Delegate, don't dictate

Think of delegating to a capable colleague. Give context and direction, then trust Claude to figure out the details:

```text theme={null}
The checkout flow is broken for users with expired cards.
The relevant code is in src/payments/. Can you investigate and fix it?
```

You don't need to specify which files to read or what commands to run. Claude figures that out.

## What's next

<CardGroup>
  <Card title="Extend with features" icon="puzzle-piece" href="/en/features-overview">
    Add Skills, MCP connections, and custom commands
  </Card>

  <Card title="Common workflows" icon="graduation-cap" href="/en/common-workflows">
    Step-by-step guides for typical tasks
  </Card>
</CardGroup>


---

## Extend Claude Code

`https://code.claude.com/docs/en/features-overview`

Understand when to use CLAUDE.md, Skills, subagents, hooks, MCP, and plugins.

Claude Code combines a model that reasons about your code with [built-in tools](/docs/en/how-claude-code-works#tools) for file operations, search, execution, and web access. The built-in tools cover most coding tasks. This guide covers the extension layer: features you add to customize what Claude knows, connect it to external services, and automate workflows.

<Note>
  For how the core agentic loop works, see [How Claude Code works](/docs/en/how-claude-code-works).
</Note>

**New to Claude Code?** Start with [CLAUDE.md](/docs/en/memory) for project conventions, then add other extensions [as specific triggers come up](#build-your-setup-over-time).

## Overview

Extensions plug into different parts of the agentic loop:

* **[CLAUDE.md](/docs/en/memory)** adds persistent context Claude sees every session
* **[Skills](/docs/en/skills)** add reusable knowledge and invocable workflows
* **[Code intelligence](/docs/en/tools-reference#lsp-tool-behavior)** connects Claude to a language server for symbol-level navigation and live type errors
* **[MCP](/docs/en/mcp)** connects Claude to external services and tools
* **[Subagents](/docs/en/sub-agents)** run their own loops in isolated context, returning summaries
* **[Agent teams](/docs/en/agent-teams)** coordinate multiple independent sessions with shared tasks and peer-to-peer messaging
* **[Hooks](/docs/en/hooks-guide)** fire on lifecycle events and can run a script, HTTP request, prompt, or subagent
* **[Plugins](/docs/en/plugins)** and **[marketplaces](/docs/en/plugin-marketplaces)** package and distribute these features

[Skills](/docs/en/skills) are the most flexible extension. A skill is a markdown file containing knowledge, workflows, or instructions. You can invoke skills with a command like `/deploy`, or Claude can load them automatically when relevant. Skills can run in your current conversation or in an isolated context via subagents.

## Match features to your goal

Features range from always-on context that Claude sees every session, to on-demand capabilities you or Claude can invoke, to background automation that runs on specific events. The table below shows what's available and when each one makes sense.

| Feature                                                        | What it does                                                  | When to use it                                                                  | Example                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **CLAUDE.md**                                                  | Persistent context loaded every conversation                  | Project conventions, "always do X" rules                                        | "Use pnpm, not npm. Run tests before committing."                               |
| **Skill**                                                      | Instructions, knowledge, and workflows Claude can use         | Reusable content, reference docs, repeatable tasks                              | `/deploy` runs your deployment checklist; API docs skill with endpoint patterns |
| **Subagent**                                                   | Isolated execution context that returns summarized results    | Context isolation, parallel tasks, specialized workers                          | Research task that reads many files but returns only key findings               |
| **[Agent teams](/docs/en/agent-teams)**                             | Coordinate multiple independent Claude Code sessions          | Parallel research, new feature development, debugging with competing hypotheses | Spawn reviewers to check security, performance, and tests simultaneously        |
| **[Code intelligence](/docs/en/tools-reference#lsp-tool-behavior)** | Language-server navigation and diagnostics                    | Typed languages, large codebases where grep is slow or imprecise                | Jump to a symbol's definition instead of reading the whole file                 |
| **MCP**                                                        | Connect to external services                                  | External data or actions                                                        | Query your database, post to Slack, control a browser                           |
| **Hook**                                                       | Script, HTTP request, prompt, or subagent triggered by events | Automation that must run on every matching event                                | Run ESLint after every file edit                                                |

**[Plugins](/docs/en/plugins)** are the packaging layer. A plugin bundles skills, hooks, subagents, and MCP servers into a single installable unit. Plugin skills are namespaced (like `/my-plugin:review`) so multiple plugins can coexist. Use plugins when you want to reuse the same setup across multiple repositories or distribute to others via a **[marketplace](/docs/en/plugin-marketplaces)**.

### Build your setup over time

You don't need to configure everything up front. Each feature has a recognizable trigger, and most teams add them in roughly this order:

| Trigger                                                                          | Add                                                                                            |
| :------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| Claude gets a convention or command wrong twice                                  | Add it to [CLAUDE.md](/docs/en/memory)                                                              |
| You keep typing the same prompt to start a task                                  | Save it as a user-invocable [skill](/docs/en/skills)                                                |
| You paste the same playbook or multi-step procedure into chat for the third time | Capture it as a [skill](/docs/en/skills)                                                            |
| You keep copying data from a browser tab Claude can't see                        | Connect that system as an [MCP server](/docs/en/mcp)                                                |
| Claude reads many files to find where a symbol is defined or used                | Install a [code intelligence plugin](/docs/en/discover-plugins#code-intelligence) for your language |
| A side task floods your conversation with output you won't reference again       | Route it through a [subagent](/docs/en/sub-agents)                                                  |
| You want something to happen every time without asking                           | Write a [hook](/docs/en/hooks-guide)                                                                |
| A second repository needs the same setup                                         | Package it as a [plugin](/docs/en/plugins)                                                          |

The same triggers tell you when to update what you already have. A repeated mistake or a recurring review comment is a CLAUDE.md edit, not a one-off correction in chat. A workflow you keep tweaking by hand is a skill that needs another revision.

### Compare similar features

Some features can seem similar. Here's how to tell them apart.

<Tabs>
  <Tab title="Skill vs Subagent">
    Skills and subagents solve different problems:

    * **Skills** are reusable content you can load into any context
    * **Subagents** are isolated workers that run separately from your main conversation

    | Aspect                                          | Skill                                          | Subagent                                                         |
    | ----------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------- |
    | **What it is**                                  | Reusable instructions, knowledge, or workflows | Isolated worker with its own context                             |
    | **Key benefit**                                 | Share content across contexts                  | Context isolation. Work happens separately, only summary returns |
    | **[Context window](/docs/en/context-window) impact** | Adds to your main window                       | Uses a separate window with its own input and output tokens      |
    | **Best for**                                    | Reference material, invocable workflows        | Tasks that read many files, parallel work, specialized workers   |

    **Skills can be reference or action.** Reference skills provide knowledge Claude uses throughout your session (like your API style guide). Action skills tell Claude to do something specific (like `/deploy` that runs your deployment workflow).

    **Use a subagent** when you need context isolation or when your context window is getting full. The subagent might read dozens of files or run extensive searches, but your main conversation only receives a summary. Since subagent work doesn't consume your main context, this is also useful when you don't need the intermediate work to remain visible. Custom subagents can have their own instructions and can preload skills.

    **They can combine.** A subagent can preload specific skills (`skills:` field). A skill can run in isolated context using `context: fork`. See [Skills](/docs/en/skills) for details.
  </Tab>

  <Tab title="CLAUDE.md vs Skill">
    Both store instructions, but they load differently and serve different purposes.

    | Aspect                    | CLAUDE.md                    | Skill                                   |
    | ------------------------- | ---------------------------- | --------------------------------------- |
    | **Loads**                 | Every session, automatically | On demand                               |
    | **Can include files**     | Yes, with `@path` imports    | Yes, with `@path` imports               |
    | **Can trigger workflows** | No                           | Yes, with `/<name>`                     |
    | **Best for**              | "Always do X" rules          | Reference material, invocable workflows |

    **Put it in CLAUDE.md** if Claude should always know it: coding conventions, build commands, project structure, "never do X" rules.

    **Put it in a skill** if it's reference material Claude needs sometimes (API docs, style guides) or a workflow you trigger with `/<name>` (deploy, review, release).

    **Rule of thumb:** Keep CLAUDE.md under 200 lines. If it's growing, move reference content to skills or split into [`.claude/rules/`](/docs/en/memory#organize-rules-with-claude/rules/) files.
  </Tab>

  <Tab title="CLAUDE.md vs Rules vs Skills">
    All three store instructions, but they load differently:

    | Aspect       | CLAUDE.md                           | `.claude/rules/`                                   | Skill                                    |
    | ------------ | ----------------------------------- | -------------------------------------------------- | ---------------------------------------- |
    | **Loads**    | Every session                       | Every session, or when matching files are opened   | On demand, when invoked or relevant      |
    | **Scope**    | Whole project                       | Can be scoped to file paths                        | Task-specific                            |
    | **Best for** | Core conventions and build commands | Language-specific or directory-specific guidelines | Reference material, repeatable workflows |

    **Use CLAUDE.md** for instructions every session needs: build commands, test conventions, project architecture.

    **Use rules** to keep CLAUDE.md focused. Rules with [`paths` frontmatter](/docs/en/memory#path-specific-rules) only load when Claude works with matching files, saving context.

    **Use skills** for content Claude only needs sometimes, like API documentation or a deployment checklist you trigger with `/<name>`.
  </Tab>

  <Tab title="Subagent vs Agent team">
    Both parallelize work, but they're architecturally different:

    * **Subagents** run inside your session and report results back to your main context
    * **Agent teams** are independent Claude Code sessions that communicate with each other

    | Aspect            | Subagent                                         | Agent team                                          |
    | ----------------- | ------------------------------------------------ | --------------------------------------------------- |
    | **Context**       | Own context window; results return to the caller | Own context window; fully independent               |
    | **Communication** | Reports results back to the main agent only      | Teammates message each other directly               |
    | **Coordination**  | Main agent manages all work                      | Shared task list with self-coordination             |
    | **Best for**      | Focused tasks where only the result matters      | Complex work requiring discussion and collaboration |
    | **Token cost**    | Lower: results summarized back to main context   | Higher: each teammate is a separate Claude instance |

    **Use a subagent** when you need a quick, focused worker: research a question, verify a claim, review a file. The subagent does the work and returns a summary. Your main conversation stays clean.

    **Use an agent team** when teammates need to share findings, challenge each other, and coordinate independently. Agent teams are best for research with competing hypotheses, parallel code review, and new feature development where each teammate owns a separate piece.

    **Transition point:** If you're running parallel subagents but hitting context limits, or if your subagents need to communicate with each other, agent teams are the natural next step.

    <Note>
      Agent teams are experimental and disabled by default. See [agent teams](/docs/en/agent-teams) for setup and current limitations.
    </Note>
  </Tab>

  <Tab title="MCP vs Skill">
    MCP connects Claude to external services. Skills extend what Claude knows, including how to use those services effectively.

    | Aspect         | MCP                                                  | Skill                                                   |
    | -------------- | ---------------------------------------------------- | ------------------------------------------------------- |
    | **What it is** | Protocol for connecting to external services         | Knowledge, workflows, and reference material            |
    | **Provides**   | Tools and data access                                | Knowledge, workflows, reference material                |
    | **Examples**   | Slack integration, database queries, browser control | Code review checklist, deploy workflow, API style guide |

    These solve different problems and work well together:

    **MCP** gives Claude purpose-built tools for an external system, with the connection and authentication handled by the server.

    **Skills** give Claude knowledge about how to use those tools effectively, plus workflows you can trigger with `/<name>`. A skill might include your team's database schema and query patterns, or a `/post-to-slack` workflow with your team's message formatting rules.

    Example: An MCP server connects Claude to your database. A skill teaches Claude your data model, common query patterns, and which tables to use for different tasks.
  </Tab>

  <Tab title="Hook vs Skill">
    A hook fires on a lifecycle event; a skill is loaded into context for Claude to apply.

    | Aspect           | Hook                                                                              | Skill                                                                 |
    | ---------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
    | **Runs**         | A shell command, HTTP request, LLM prompt, or subagent                            | Instructions Claude reads and follows                                 |
    | **Triggered by** | [Lifecycle events](/docs/en/hooks#hook-events) such as `PostToolUse` or `SessionStart` | You typing `/<name>`, or Claude matching the description to your task |
    | **Determinism**  | Always fires on its event; the trigger is guaranteed                              | Claude interprets the instructions; outcome can vary                  |
    | **Context cost** | Zero unless the hook returns output                                               | Description loads each session; full content loads when used          |
    | **Best for**     | Linting after edits, blocking unsafe commands, logging, notifications             | Workflows that need reasoning, reference material, multi-step tasks   |

    **Use a hook** when the action must happen the same way every time and doesn't need Claude to think. For example: format on save, reject `rm -rf /`, post a Slack message when a session ends.

    **Use a skill** when Claude should decide how to apply the steps, or when the content is knowledge rather than a script. For example: a `/release` checklist, your API style guide, a debugging playbook.

    **Put guardrails in hooks.** An instruction like "never edit `.env`" in CLAUDE.md or a skill is a request, not a guarantee. A `PreToolUse` hook that blocks the edit is enforcement. If a rule must hold every time, make it a hook rather than a prompt instruction.

    **Hook output lands in context.** A `PostToolUse` hook that runs your linter feeds results back as text Claude reads; a `/fix-lint` skill tells Claude how to resolve them.
  </Tab>
</Tabs>

### Understand how features layer

Features can be defined at multiple levels: user-wide, per-project, via plugins, or through managed policies. You can also nest CLAUDE.md files in subdirectories or place skills in specific packages of a monorepo. When the same feature exists at multiple levels, here's how they layer:

* **CLAUDE.md files** are additive: all levels contribute content to Claude's context simultaneously. Files from your working directory and above load at launch; subdirectories load as you work in them. When instructions conflict, Claude uses judgment to reconcile them, with more specific instructions typically taking precedence. See [how CLAUDE.md files load](/docs/en/memory#how-claude-md-files-load).
* **Skills and subagents** override by name: when the same name exists at multiple levels, one definition wins based on priority (managed > user > project for skills; managed > CLI flag > project > user > plugin for subagents). Plugin skills are [namespaced](/docs/en/plugins#add-skills-to-your-plugin) to avoid conflicts. See [skill discovery](/docs/en/skills#where-skills-live) and [subagent scope](/docs/en/sub-agents#choose-the-subagent-scope).
* **MCP servers** override by name: local > project > user. See [MCP scope](/docs/en/mcp#scope-hierarchy-and-precedence).
* **Hooks** merge: all registered hooks fire for their matching events regardless of source. See [hooks](/docs/en/hooks).

### Combine features

Each extension solves a different problem: CLAUDE.md handles always-on context, skills handle on-demand knowledge and workflows, MCP handles external connections, subagents handle isolation, and hooks handle automation. Real setups combine them based on your workflow.

For example, you might use CLAUDE.md for project conventions, a skill for your deployment workflow, MCP to connect to your database, and a hook to run linting after every edit. Each feature handles what it's best at.

| Pattern                | How it works                                                                     | Example                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Skill + MCP**        | MCP provides the connection; a skill teaches Claude how to use it well           | MCP connects to your database, a skill documents your schema and query patterns                   |
| **Skill + Subagent**   | A skill spawns subagents for parallel work                                       | `/audit` skill kicks off security, performance, and style subagents that work in isolated context |
| **CLAUDE.md + Skills** | CLAUDE.md holds always-on rules; skills hold reference material loaded on demand | CLAUDE.md says "follow our API conventions," a skill contains the full API style guide            |
| **Hook + MCP**         | A hook triggers external actions through MCP                                     | Post-edit hook sends a Slack notification when Claude modifies critical files                     |

## Understand context costs

Every feature you add consumes some of Claude's context. Too much can fill up your context window, but it can also add noise that makes Claude less effective; skills may not trigger correctly, or Claude may lose track of your conventions. Understanding these trade-offs helps you build an effective setup. For an interactive view of how these features combine in a running session, see [Explore the context window](/docs/en/context-window).

### Context cost by feature

Each feature has a different loading strategy and context cost:

| Feature               | When it loads                  | What loads                                          | Context cost                                 |
| --------------------- | ------------------------------ | --------------------------------------------------- | -------------------------------------------- |
| **CLAUDE.md**         | Session start                  | Full content                                        | Every request                                |
| **Skills**            | Session start + when used      | Descriptions at start, full content when used       | Low (descriptions every request)\*           |
| **MCP servers**       | Session start                  | Tool names; full schemas on demand                  | Low until a tool is used                     |
| **Code intelligence** | After file edits and on demand | Diagnostics after edits; symbol locations on lookup | Low; reduces file reads elsewhere            |
| **Subagents**         | When spawned                   | Fresh context with specified skills                 | Isolated from main session                   |
| **Hooks**             | On trigger                     | Nothing (runs externally)                           | Zero, unless hook returns additional context |

\*By default, skill descriptions load at session start so Claude can decide when to use them. Set `disable-model-invocation: true` in a skill's frontmatter to hide it from Claude entirely until you invoke it manually. This reduces context cost to zero for skills you only trigger yourself. For a skill you didn't write, set [`skillOverrides`](/docs/en/skills#override-skill-visibility-from-settings) in settings to do the same without editing its file.

### Understand how features load

Each feature loads at different points in your session. The tabs below explain when each one loads and what goes into context.

<img alt="Context loading: CLAUDE.md loads at session start and stays in every request. MCP tool names load at start with full schemas deferred until use. Skills load descriptions at start, full content on invocation. Subagents get isolated context. Hooks run externally." />

<Tabs>
  <Tab title="CLAUDE.md">
    **When:** Session start

    **What loads:** Full content of all CLAUDE.md files (managed, user, and project levels).

    **Inheritance:** Claude reads CLAUDE.md files from your working directory up to the root, and discovers nested ones in subdirectories as it accesses those files. See [How CLAUDE.md files load](/docs/en/memory#how-claude-md-files-load) for details.

    <Tip>Keep CLAUDE.md under 200 lines. Move reference material to skills, which load on-demand.</Tip>
  </Tab>

  <Tab title="Skills">
    Skills are extra capabilities in Claude's toolkit. They can be reference material (like an API style guide) or invocable workflows you trigger with `/<name>` (like `/deploy`). Claude Code includes [bundled skills](/docs/en/commands) like `/code-review`, `/batch`, and `/debug` that work out of the box. You can also create your own. Claude uses skills when appropriate, or you can invoke one directly.

    **When:** Depends on the skill's configuration. By default, descriptions load at session start and full content loads when used. For user-only skills (`disable-model-invocation: true`), nothing loads until you invoke them.

    **What loads:** For model-invocable skills, Claude sees names and descriptions in every request. When you invoke a skill with `/<name>` or Claude loads it automatically, the full content loads into your conversation.

    **How Claude chooses skills:** Claude matches your task against skill descriptions to decide which are relevant. If descriptions are vague or overlap, Claude may load the wrong skill or miss one that would help. To tell Claude to use a specific skill, invoke it with `/<name>`. Skills with `disable-model-invocation: true` are invisible to Claude until you invoke them.

    **Context cost:** Low until used. User-only skills have zero cost until invoked.

    **In subagents:** Skills work differently in subagents. Instead of on-demand loading, skills listed in the subagent's `skills` field are fully preloaded into its context at launch. Subagents can still discover and invoke unlisted project, user, and plugin skills through the Skill tool.

    <Tip>Use `disable-model-invocation: true` for skills with side effects. This saves context and ensures only you trigger them.</Tip>
  </Tab>

  <Tab title="MCP servers">
    **When:** Session start.

    **What loads:** Tool names from connected servers. Full JSON schemas stay deferred until Claude needs a specific tool.

    **Context cost:** [Tool search](/docs/en/mcp#scale-with-mcp-tool-search) is on by default, so idle MCP tools consume minimal context.

    <Tip>Run `/mcp` to see connection status and token costs per server. Claude Code [reconnects to remote servers automatically](/docs/en/mcp#automatic-reconnection) if they drop, and you can disconnect servers you're not actively using.</Tip>
  </Tab>

  <Tab title="Code intelligence">
    **When:** After file edits, and on demand when Claude navigates code.

    **What loads:** Type errors and warnings after each file edit. Definition, reference, and type information when Claude looks up a symbol.

    **Context cost:** Low. Symbol lookups often replace broad file reads, so net context use can go down.

    <Tip>The LSP tool is inactive until you install a [code intelligence plugin](/docs/en/discover-plugins#code-intelligence) for your language.</Tip>
  </Tab>

  <Tab title="Subagents">
    **When:** On demand, when you or Claude spawns one for a task.

    **What loads:** Fresh, isolated context containing:

    * The agent's own system prompt, not the full Claude Code system prompt
    * Full content of skills listed in the agent's `skills:` field
    * CLAUDE.md and git status, except the built-in Explore and Plan agents [omit both](/docs/en/sub-agents#what-loads-at-startup)
    * Whatever context the lead agent passes in the prompt

    **Context cost:** Isolated from main session. Subagents don't inherit your conversation history or invoked skills.

    <Tip>Use subagents for work that doesn't need your full conversation context. Their isolation prevents bloating your main session.</Tip>
  </Tab>

  <Tab title="Hooks">
    **When:** On trigger. Hooks fire at specific lifecycle events like tool execution, session boundaries, prompt submission, permission requests, and compaction. See [Hooks](/docs/en/hooks) for the full list.

    **What loads:** Nothing by default. Hooks execute outside the main conversation.

    **Context cost:** Zero, unless the hook returns output that gets added as messages to your conversation.

    <Tip>Hooks are ideal for side effects (linting, logging) that don't need to affect Claude's context.</Tip>
  </Tab>
</Tabs>

## Learn more

Each feature has its own guide with setup instructions, examples, and configuration options.

<CardGroup>
  <Card title="CLAUDE.md" icon="file-lines" href="/en/memory">
    Store project context, conventions, and instructions
  </Card>

  <Card title="Skills" icon="brain" href="/en/skills">
    Give Claude domain expertise and reusable workflows
  </Card>

  <Card title="Subagents" icon="users" href="/en/sub-agents">
    Offload work to isolated context
  </Card>

  <Card title="Agent teams" icon="network" href="/en/agent-teams">
    Coordinate multiple sessions working in parallel
  </Card>

  <Card title="MCP" icon="plug" href="/en/mcp">
    Connect Claude to external services
  </Card>

  <Card title="Hooks" icon="bolt" href="/en/hooks-guide">
    Automate workflows with hooks
  </Card>

  <Card title="Plugins" icon="puzzle-piece" href="/en/plugins">
    Bundle and share feature sets
  </Card>

  <Card title="Marketplaces" icon="store" href="/en/plugin-marketplaces">
    Host and distribute plugin collections
  </Card>
</CardGroup>


---

## Keep Claude working toward a goal

`https://code.claude.com/docs/en/goal`

Set a completion condition with /goal and Claude keeps working across turns until the condition is met.

<Note>
  `/goal` requires Claude Code v2.1.139 or later.
</Note>

The `/goal` command sets a completion condition and Claude keeps working toward it without you prompting each step. After each turn, a small fast model checks whether the condition holds. If not, Claude starts another turn instead of returning control to you. The goal clears automatically once the condition is met.

Use a goal for substantial work with a verifiable end state:

* Migrating a module to a new API until every call site compiles and tests pass
* Implementing a design doc until all acceptance criteria hold
* Splitting a large file into focused modules until each is under a size budget
* Working through a labeled issue backlog until the queue is empty

This page covers how to:

* [Compare autonomous workflow approaches](#compare-to-other-autonomous-workflows): `/loop`, Stop hooks, and auto mode
* [Set a goal](#set-a-goal) and [write an effective condition](#write-an-effective-condition)
* [Check status](#check-status), [clear early](#clear-a-goal), and [run non-interactively](#run-non-interactively)
* See [how evaluation works](#how-evaluation-works) and [requirements](#requirements)

## Compare to other autonomous workflows

Three approaches keep the current session running between prompts. Pick based on what should start the next turn:

| Approach                                                            | Next turn starts when      | Stops when                                      |
| :------------------------------------------------------------------ | :------------------------- | :---------------------------------------------- |
| `/goal`                                                             | The previous turn finishes | A model confirms the condition is met           |
| [`/loop`](/docs/en/scheduled-tasks#run-a-prompt-repeatedly-with-%2Floop) | A time interval elapses    | You stop it, or Claude decides the work is done |
| [Stop hook](/docs/en/hooks-guide#prompt-based-hooks)                     | The previous turn finishes | Your own script or prompt decides               |

`/goal` and a Stop hook both fire after every turn. `/goal` is a session-scoped shortcut: you type a condition and it's active for the current session only. A Stop hook lives in your settings file, applies to every session in its scope, and can run a script for deterministic checks or a prompt for model-evaluated ones.

[Auto mode](/docs/en/auto-mode-config) on its own approves tool calls within a single turn but doesn't start a new one. Claude stops when it judges the work done. `/goal` adds a separate evaluator that checks your condition after every turn, so completion is decided by a fresh model rather than the one doing the work. The two are complementary: auto mode removes per-tool prompts, and `/goal` removes per-turn prompts.

<Tip>
  The approaches above keep the current session running. You can also schedule work that runs independent of any open session, such as nightly tests or morning triage. See [scheduling options](/docs/en/scheduled-tasks#compare-scheduling-options) for cloud routines and desktop scheduled tasks.
</Tip>

## Use `/goal`

One goal can be active per session. The same command sets, checks, and clears it depending on the argument.

### Set a goal

Run `/goal` followed by the condition you want satisfied. If a goal is already active, the new one replaces it.

```text theme={null}
/goal all tests in test/auth pass and the lint step is clean
```

Setting a goal starts a turn immediately, with the condition itself as the directive. You don't need to send a separate prompt. While the goal is active, a `◎ /goal active` indicator shows how long the goal has been running.

After each turn, the evaluator returns a short reason explaining why the condition is or isn't met. The most recent reason appears in the status view and in the transcript so you can see what Claude is working toward next.

<Note>
  A goal keeps running until the condition is met or you run `/goal clear`. Run `/goal` with no argument to see turns and tokens spent so far.
</Note>

### Write an effective condition

The [evaluator](#how-evaluation-works) judges your condition against what Claude has surfaced in the conversation. It doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate. "All tests in `test/auth` pass" works because Claude runs the tests and the result lands in the transcript for the evaluator to read.

A condition that holds up across many turns usually has:

* **One measurable end state**: a test result, a build exit code, a file count, an empty queue
* **A stated check**: how Claude should prove it, such as "`npm test` exits 0" or "`git status` is clean"
* **Constraints that matter**: anything that must not change on the way there, such as "no other test file is modified"

The condition can be up to 4,000 characters.

To bound how long a goal runs, include a turn or time clause in the condition, such as `or stop after 20 turns`. Claude reports progress against that clause each turn and the evaluator judges it from the conversation.

### Check status

Run `/goal` with no arguments to see the current state.

```text theme={null}
/goal
```

If a goal is active, the status shows:

* The condition
* How long it has been running
* How many turns have been evaluated
* The current token spend
* The evaluator's most recent reason

If no goal is active but one was achieved earlier in the session, the status shows the achieved condition along with its duration, turn count, and token spend.

### Clear a goal

Run `/goal clear` to remove an active goal before its condition is met.

```text theme={null}
/goal clear
```

`stop`, `off`, `reset`, `none`, and `cancel` are accepted as aliases for `clear`. Running `/clear` to start a new conversation also removes any active goal.

### Resume with an active goal

A goal that was still active when a session ended is restored when you resume that session with `--resume` or `--continue`. The condition carries over, but the turn count, timer, and token-spend baseline all reset on resume. A goal that was already achieved or cleared is not restored.

### Run non-interactively

`/goal` works in [non-interactive mode](/docs/en/headless), in the [desktop app](/docs/en/desktop), and through [Remote Control](/docs/en/remote-control). Setting a goal with `-p` runs the loop to completion in a single invocation:

```bash theme={null}
claude -p "/goal CHANGELOG.md has an entry for every PR merged this week"
```

Interrupt the process with Ctrl+C to stop a non-interactive goal before the condition is met.

## How evaluation works

`/goal` is a wrapper around a session-scoped [prompt-based Stop hook](/docs/en/hooks#prompt-based-hooks). Each time Claude finishes a turn, the condition and the conversation so far are sent to your configured [small fast model](/docs/en/model-config), which defaults to Haiku. The model returns a yes-or-no decision and a short reason. A "no" tells Claude to keep working and includes the reason as guidance for the next turn. A "yes" clears the goal and records an achieved entry in the transcript.

The evaluator runs on whichever provider your session is configured for. It does not call tools, so it can only judge what Claude has already surfaced in the conversation.

<Note>
  Evaluation tokens are billed on the small fast model configured for your provider and are typically negligible compared to main-turn spend.
</Note>

## Requirements

`/goal` runs only in workspaces where you have accepted the trust dialog, because the evaluator is part of the hooks system. `/goal` is also unavailable when [`disableAllHooks`](/docs/en/hooks#disable-or-remove-hooks) is set at any settings level or when [`allowManagedHooksOnly`](/docs/en/settings#hook-configuration) is set in managed settings. In each case, the command tells you why instead of silently doing nothing.

## See also

* [Run a prompt repeatedly with `/loop`](/docs/en/scheduled-tasks#run-a-prompt-repeatedly-with-%2Floop): re-run on a time interval instead of until a condition holds
* [Prompt-based hooks](/docs/en/hooks-guide#prompt-based-hooks): write your own Stop hook when you need custom evaluation logic
* [Auto mode](/docs/en/auto-mode-config): approve tool calls automatically so each goal turn runs unattended
* [Scheduling comparison](/docs/en/scheduled-tasks#compare-scheduling-options): run work on a schedule independent of any open session


---

## Glossary

`https://code.claude.com/docs/en/glossary`

Definitions for Claude Code terminology. Learn what agentic loop, compaction, CLAUDE.md, hooks, subagents, MCP, and other core concepts mean.

This glossary defines Claude Code terminology. Each entry links to the page where the concept is covered in depth. For model-level concepts like tokens, temperature, and RAG, see the [platform glossary](https://platform.claude.com/docs/en/about-claude/glossary).

## A

### Agent teams

Multiple independent Claude Code sessions coordinated by a team lead, with a shared task list and peer-to-peer messaging. Unlike [subagents](#subagent), which run within a single session and report only to the parent, teammates each have their own context window and you can interact with any of them directly. Agent teams are experimental and must be enabled by setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

Learn more: [Run agent teams](/docs/en/agent-teams)

### Agentic coding

A workflow where the AI can read files, run commands, and make changes autonomously while you watch, redirect, or step away, as opposed to chat-based assistants that only respond with text you must apply yourself. Claude Code is agentic because it has [tools](#tool) that let it act, not just advise.

Learn more: [How Claude Code works](/docs/en/how-claude-code-works)

### Agentic harness

The tools, context management, and execution environment that turn a language model into a capable coding agent. Claude Code is the harness; Claude is the model inside it. The harness supplies file access, shell execution, permission gating, memory loading, and the loop that chains actions together.

Learn more: [How Claude Code works](/docs/en/how-claude-code-works)

### Agentic loop

The cycle Claude works through for every task: gather context, take action, verify results, and repeat until done. Each tool use returns information that informs the next step. You can interrupt the loop at any point to redirect. Most extension points, including [hooks](#hook), [skills](#skill), and [MCP](#mcp-model-context-protocol), plug into specific phases of this loop.

Learn more: [How Claude Code works](/docs/en/how-claude-code-works#the-agentic-loop)

### Auto memory

Notes Claude writes for itself based on your corrections and preferences, stored per git repository under `~/.claude/projects/`. All worktrees of the same repository share one auto memory directory. The first 200 lines or 25 KB of the `MEMORY.md` index loads at the start of every session. Auto memory is the Claude-written counterpart to [CLAUDE.md](#claude-md), which you write.

Learn more: [Auto memory](/docs/en/memory#auto-memory)

### Auto mode

A [permission mode](#permission-mode) where a separate classifier model reviews each action in the background instead of showing you approval prompts. The classifier blocks scope escalation, untrusted infrastructure, and [prompt injection](#prompt-injection). It never sees tool results, so injected instructions cannot influence its decisions. Auto mode is a research preview available to all users on the Anthropic API.

Learn more: [Eliminate prompts with auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode)

## B

### Bare mode

A startup flag, `--bare`, that skips auto-discovery of hooks, skills, plugins, MCP servers, auto memory, and CLAUDE.md. Only flags you pass explicitly take effect. Recommended for CI and scripted calls where you need identical behavior across machines regardless of local configuration.

Learn more: [Start faster with bare mode](/docs/en/headless#start-faster-with-bare-mode)

### Bundled skills

Prompt-based playbooks included with Claude Code, such as `/batch`, `/code-review`, `/debug`, and `/loop`. Unlike built-in commands, which execute fixed logic, bundled skills give Claude a detailed prompt and let it orchestrate the work, so they can spawn agents, read files, and adapt to your codebase.

Learn more: [Bundled skills](/docs/en/skills#bundled-skills)

## C

### Channel

An [MCP server](#mcp-model-context-protocol) that pushes events into your running session so Claude can react to things that happen while you're away from the terminal. Channels can be two-way: Claude reads an inbound event and replies back through the same channel. Telegram, Discord, and iMessage are included in the research preview.

Learn more: [Channels](/docs/en/channels)

### Checkpoint

A restore point created at each prompt you send. Claude Code snapshots files before every edit so a checkpoint can revert them. Press `Esc` twice or run `/rewind` to restore code, conversation, or both to an earlier point, or to summarize part of the conversation from a selected message. Checkpoints are local to the session, separate from git, and don't track changes made through the Bash tool.

Learn more: [Checkpointing](/docs/en/checkpointing)

### `.claude` directory

The directory where Claude Code reads project-scoped configuration: settings, hooks, skills, subagents, rules, and auto memory. A project has `.claude/` at its root; your user-level defaults are at `~/.claude/`.

Learn more: [The `.claude` directory](/docs/en/claude-directory)

### CLAUDE.md

A markdown file of persistent instructions you write for Claude, loaded at the start of every session as a user message after the system prompt. Put project conventions, architecture notes, and "always do X" rules here. CLAUDE.md survives [compaction](#compaction) and is re-read fresh from disk afterward.

You can place CLAUDE.md at project scope in `./CLAUDE.md` or `./.claude/CLAUDE.md`, at user scope in `~/.claude/CLAUDE.md`, or as [managed policy](#managed-settings) for your organization. More specific locations take precedence.

Learn more: [CLAUDE.md files](/docs/en/memory#claude-md-files)

### Command

A reusable instruction you invoke by typing `/name` in the prompt. Built-in commands such as `/clear`, `/model`, and `/compact` control the session. You can define your own commands as files in `.claude/commands/`, or install them from a [plugin](#plugin). [Skills](#skill) are the recommended way to package multi-step commands.

Learn more: [Commands](/docs/en/commands) · [Skills](/docs/en/skills)

### Compaction

Automatic summarization of your conversation when the [context window](#context-window) approaches its limit. Older tool outputs are cleared first, then the conversation is summarized. Project-root CLAUDE.md and auto memory survive compaction and reload from disk; instructions given only in conversation may be lost. Run `/compact` to trigger manually, optionally with a focus like `/compact focus on the API changes`.

Learn more: [What survives compaction](/docs/en/context-window#what-survives-compaction) · [When context fills up](/docs/en/how-claude-code-works#when-context-fills-up)

### Context window

The working memory for a session, holding conversation history, file contents, command outputs, CLAUDE.md, auto memory, loaded skills, and system instructions. As you work, context fills up until [compaction](#compaction) summarizes it. Run `/context` to see what's using space. For the underlying model concept, see the [platform glossary](https://platform.claude.com/docs/en/about-claude/glossary#context-window).

Learn more: [Explore the context window](/docs/en/context-window)

## D

### Dispatch

A phone-initiated task router that spawns a Claude Code session in the Desktop app when you send a coding task from the Claude mobile app. Your prompt routes to the right tool automatically. Available on Pro and Max plans.

Learn more: [Sessions from Dispatch](/docs/en/desktop#sessions-from-dispatch)

## E

### Effort level

A setting that controls how much of the adaptive-reasoning thinking budget Claude uses on each turn. Higher effort means more thinking tokens and deeper reasoning; lower effort is faster and cheaper. Effort is supported on Opus 4.6 and later, and on Sonnet 4.6.

Learn more: [Adjust effort level](/docs/en/model-config#adjust-effort-level)

### Extended thinking

Visible step-by-step reasoning the model performs before responding. You can cap thinking tokens with `MAX_THINKING_TOKENS` or adjust the [effort level](#effort-level). Thinking appears in gray italic text in the terminal.

Learn more: [Use extended thinking](/docs/en/model-config#extended-thinking)

## H

### Hook

A user-defined handler that executes automatically at a specific point in Claude Code's lifecycle, such as before a tool runs, after a file edit, or at session start. Handlers can be a shell command, HTTP endpoint, MCP tool, LLM prompt, or subagent. Hooks are deterministic: they fire at fixed lifecycle points rather than at the model's discretion.

A hook configuration has three levels:

* **Hook event**: the lifecycle point
* **Matcher**: filters which events fire it
* **Hook handler**: what runs

Learn more: [Get started with hooks](/docs/en/hooks-guide) · [Hooks reference](/docs/en/hooks)

## M

### Managed settings

A settings file enforced org-wide by IT or DevOps, placed at an OS-level path outside `~/.claude`. Users cannot override or exclude managed settings. Use this for security policies, compliance requirements, or standardized tooling across a fleet.

Learn more: [Server-managed settings](/docs/en/server-managed-settings)

### MCP (Model Context Protocol)

An open standard for connecting AI tools to external data sources and services. MCP servers give Claude new tools for Slack, Jira, databases, browsers, and hundreds of other integrations. You connect servers via `/mcp` or by adding them to `.mcp.json`. For the protocol itself, see the [platform glossary](https://platform.claude.com/docs/en/about-claude/glossary#mcp-model-context-protocol).

Learn more: [Model Context Protocol](/docs/en/mcp)

### MCP Tool Search

A context-saving mechanism that defers MCP tool schemas until needed. Only tool names load at startup; Claude fetches the full schema on demand when it decides to use a specific tool. This keeps idle MCP servers from consuming much context.

Learn more: [Scale with MCP Tool Search](/docs/en/mcp#scale-with-mcp-tool-search)

## N

### Non-interactive mode

A mode that executes a single prompt and exits without a conversational session, invoked with `-p` or `--print`. Used for CI, scripts, and piping. The [Agent SDK](/docs/en/agent-sdk/overview) is the Python and TypeScript equivalent. Formerly called headless mode.

Learn more: [Run Claude Code programmatically](/docs/en/headless)

## O

### Output style

A configuration that modifies Claude's system prompt to change response behavior, tone, or format. Output styles turn off the software-engineering-specific parts of the default system prompt, unlike [CLAUDE.md](#claude-md) which is delivered as a user message following the system prompt. Built-in styles include Default, Proactive, Explanatory, and Learning.

Learn more: [Output styles](/docs/en/output-styles)

## P

### Permission mode

The baseline approval behavior for the session. Cycle with `Shift+Tab` in the CLI or use the mode selector in VS Code, Desktop, and claude.ai. Available modes are `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, and `bypassPermissions`.

Learn more: [Choose a permission mode](/docs/en/permission-modes)

### Permission rule

A settings entry that allows, asks about, or denies a tool invocation based on the tool name and argument pattern. Rules are evaluated deny→ask→allow, first match wins. Permission rules are fine-grained controls layered on top of the broader [permission mode](#permission-mode).

Learn more: [Configure permissions](/docs/en/permissions)

### Plan mode

A [permission mode](#permission-mode) where Claude researches and proposes changes without editing your source files. It can read, search, and run exploration commands, then presents a plan for approval before touching anything. Enter plan mode with `/plan` or by pressing `Shift+Tab`.

Learn more: [Analyze before you edit with plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode)

### Plugin

A bundle of skills, hooks, subagents, and MCP servers packaged as a single installable unit. Plugin skills are namespaced as `plugin-name:skill-name` so multiple plugins coexist. Distribute plugins across teams via a [marketplace](/docs/en/plugin-marketplaces).

Learn more: [Plugins](/docs/en/plugins)

### Project trust

A dialog accepting a directory before Claude Code loads its configuration. Acceptance is saved per project directory, except your home directory, where trust is held for the current session only and the prompt reappears on each launch. Trust gates auto-installation of marketplace plugins and execution of project-defined hooks. Trusting a directory means its `.claude/settings.json`, `.mcp.json`, and other config files take effect.

Learn more: [The `.claude` directory](/docs/en/claude-directory)

### Prompt injection

Hostile instructions embedded in a file, web page, or tool result that attempt to redirect Claude toward actions you never asked for. Claude Code's defenses include the permission system, command blocklists, and trust verification. [Auto mode](#auto-mode) adds a server-side probe that scans tool results for suspicious content and a classifier that never sees tool results, so injected text cannot influence its approval decisions.

Learn more: [Protect against prompt injection](/docs/en/security#protect-against-prompt-injection)

## R

### Remote Control

A way to continue a local Claude Code session from your phone or browser via claude.ai. Your code stays on your machine; only the UI is remote. Different from Claude Code on the web, which runs in a cloud sandbox.

Learn more: [Remote Control](/docs/en/remote-control)

### Rules

Modular instruction files in `.claude/rules/` that load alongside CLAUDE.md. A rule can be path-scoped with YAML `paths:` frontmatter so it only loads when Claude reads a matching file, keeping context lean until it's relevant.

Learn more: [Organize rules with `.claude/rules/`](/docs/en/memory#organize-rules-with-claude/rules/)

## S

### Sandboxing

OS-level filesystem and network isolation for the Bash tool. Commands run inside a boundary you define upfront, so Claude can work freely within it without per-command approval prompts. Sandboxing is a separate layer from [permission rules](#permission-rule).

Learn more: [Sandboxing](/docs/en/sandboxing)

### Session

A conversation tied to your current directory, with its own independent [context window](#context-window). Sessions can be resumed with `claude -c`, forked with `--fork-session` to preserve history under a new session ID, or run in parallel across terminals. Running `/clear` starts a new session; the previous one stays stored and is available via `/resume`. Each session's transcript is stored under `~/.claude/projects/`.

Learn more: [Work with sessions](/docs/en/how-claude-code-works#work-with-sessions)

### Settings layers

The hierarchy Claude Code reads configuration from, in precedence order from highest to lowest: [managed policy](#managed-settings), command-line arguments, local settings at `.claude/settings.local.json`, project settings at `.claude/settings.json`, then user settings at `~/.claude/settings.json`. Arrays merge across layers; scalars at a higher layer override lower ones.

Learn more: [Settings files](/docs/en/settings#settings-files)

### Skill

A `SKILL.md` file containing instructions, knowledge, or a workflow that Claude adds to its toolkit. Claude loads a skill automatically when relevant, or you invoke it directly with `/skill-name`. Skills follow the Agent Skills open standard; Claude Code extends it with invocation control and subagent execution.

Skills are the recommended successor to custom commands. A file at `.claude/commands/deploy.md` and one at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way; existing command files continue to work.

Learn more: [Extend Claude with skills](/docs/en/skills)

### Subagent

A specialized AI assistant that runs in its own context window with a custom system prompt, specific tool access, and independent permissions. It works on a delegated task and returns a summary to the main conversation. Use subagents to keep large explorations out of your primary context or to run parallel research. Different from [agent teams](#agent-teams), where each agent is a full independent session you can talk to directly.

Built-in subagents include Explore, Plan, and general-purpose.

Learn more: [Create custom subagents](/docs/en/sub-agents)

### Surface

Any place you access Claude Code: the CLI, VS Code, JetBrains, Desktop, or claude.ai. All surfaces share the same engine, so your CLAUDE.md, settings, and skills work the same way across them. Slack and the Chrome extension are integrations that connect to a surface rather than surfaces themselves.

Learn more: [Platforms and integrations](/docs/en/platforms)

## T

### Teleport

A command, `/teleport`, that pulls a cloud Claude Code session into your local terminal. Claude fetches the branch, loads the conversation history, and resumes from the web session's last state. The reverse direction is `--remote`, which sends a local task to run on the web.

Learn more: [From web to terminal](/docs/en/claude-code-on-the-web#from-web-to-terminal)

### Tool

An action Claude can take: read a file, edit code, run a shell command, search the web, spawn a subagent. Tools are what make Claude Code agentic. Without them, Claude can only respond with text. Each tool use returns a result that informs Claude's next decision in the [agentic loop](#agentic-loop).

Learn more: [Tools available to Claude](/docs/en/tools-reference)

### Turn

One complete response from Claude within a [session](#session). A turn begins when you send a message and ends when Claude finishes responding, with any number of [tool](#tool) calls in between. [Stop hooks](#hook) fire at the end of each turn. A session consists of many turns, and the [agentic loop](#agentic-loop) describes what happens inside one.

Learn more: [How Claude Code works](/docs/en/how-claude-code-works#the-agentic-loop)

## V

### Verification loop

How a session knows the work is actually done rather than just plausible. You give Claude a check it can run, such as a test suite, a build, or a screenshot comparison, and Claude iterates until the check passes instead of stopping after one attempt. A verification loop is the prerequisite for [`/goal`](/docs/en/goal), unattended runs, and [dynamic workflows](/docs/en/workflows): without one, the only thing deciding the agent is finished is the agent itself.

Learn more: [Give Claude a way to verify its work](/docs/en/best-practices#give-claude-a-way-to-verify-its-work)

## W

### Worktree isolation

An isolation mode that runs Claude in a separate git worktree under `.claude/worktrees/`, enabled with the `-w` flag or `isolation: worktree` in subagent config. Changes stay on a separate branch in a separate directory, so parallel agents don't overwrite each other's files.

Learn more: [Run parallel sessions with git worktrees](/docs/en/worktrees)

***

## Deprecated and renamed terms

These terms appear in older docs, blog posts, and community content. Use the current name when searching this site.

| Old term        | Now called                                    | Notes                                |
| --------------- | --------------------------------------------- | ------------------------------------ |
| Headless mode   | [Non-interactive mode](#non-interactive-mode) | Same `-p` flag, same behavior        |
| Custom commands | [Skills](#skill)                              | `.claude/commands/` files still work |
| Slash commands  | Commands                                      | "Slash" dropped from product copy    |


---

## Platforms and integrations

`https://code.claude.com/docs/en/platforms`

Choose where to run Claude Code and what to connect it to. Compare the CLI, Desktop, VS Code, JetBrains, web, mobile, and integrations like Chrome, Slack, and CI/CD.

Claude Code runs the same underlying engine everywhere, but each surface is tuned for a different way of working. This page helps you pick the right platform for your workflow and connect the tools you already use.

## Where to run Claude Code

Choose a platform based on how you like to work and where your project lives.

| Platform                          | Best for                                                                                           | What you get                                                                                                                                                                              |
| :-------------------------------- | :------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CLI](/docs/en/quickstart)             | Terminal workflows, scripting, remote servers                                                      | Full feature set, [Agent SDK](/docs/en/headless), [computer use](/docs/en/computer-use) on macOS (Pro and Max), third-party providers                                                               |
| [Desktop](/docs/en/desktop)            | Visual review, parallel sessions, managed setup                                                    | Diff viewer, app preview, [computer use](/docs/en/desktop#let-claude-use-your-computer) and [Dispatch](/docs/en/desktop#sessions-from-dispatch) on Pro and Max                                      |
| [VS Code](/docs/en/vs-code)            | Working inside VS Code without switching to a terminal                                             | Inline diffs, integrated terminal, file context                                                                                                                                           |
| [JetBrains](/docs/en/jetbrains)        | Working inside IntelliJ, PyCharm, WebStorm, or other JetBrains IDEs                                | Diff viewer, selection sharing, terminal session                                                                                                                                          |
| [Web](/docs/en/claude-code-on-the-web) | Long-running tasks that don't need much steering, or work that should continue when you're offline | Anthropic-managed cloud, continues after you disconnect                                                                                                                                   |
| Mobile                            | Starting and monitoring tasks while away from your computer                                        | Cloud sessions from the Claude app for iOS and Android, [Remote Control](/docs/en/remote-control) for local sessions, [Dispatch](/docs/en/desktop#sessions-from-dispatch) to Desktop on Pro and Max |

The CLI is the most complete surface for terminal-native work: scripting and the Agent SDK are CLI-only. Third-party providers also work in [VS Code](/docs/en/vs-code#use-third-party-providers). Enterprise [Desktop](/docs/en/desktop) deployments support Vertex AI and gateway providers; for Bedrock or Foundry, use the CLI or VS Code instead of Desktop. Desktop and the IDE extensions trade some CLI-only features for visual review and tighter editor integration. The web runs in Anthropic's cloud, so tasks keep going after you disconnect. Mobile is a thin client into those same cloud sessions or into a local session via Remote Control, and can send tasks to Desktop with Dispatch.

You can mix surfaces on the same project. Configuration, project memory, and MCP servers are shared across the local surfaces.

## Connect your tools

Integrations let Claude work with services outside your codebase.

| Integration                          | What it does                                       | Use it for                                                       |
| :----------------------------------- | :------------------------------------------------- | :--------------------------------------------------------------- |
| [Chrome](/docs/en/chrome)                 | Controls your browser with your logged-in sessions | Testing web apps, filling forms, automating sites without an API |
| [GitHub Actions](/docs/en/github-actions) | Runs Claude in your CI pipeline                    | Automated PR reviews, issue triage, scheduled maintenance        |
| [GitLab CI/CD](/docs/en/gitlab-ci-cd)     | Same as GitHub Actions for GitLab                  | CI-driven automation on GitLab                                   |
| [Code Review](/docs/en/code-review)       | Reviews every PR automatically                     | Catching bugs before human review                                |
| [Slack](/docs/en/slack)                   | Responds to `@Claude` mentions in your channels    | Turning bug reports into pull requests from team chat            |

For integrations not listed here, [MCP servers](/docs/en/mcp) and [connectors](/docs/en/desktop#connect-external-tools) let you connect almost anything: Linear, Notion, Google Drive, or your own internal APIs.

## Work when you are away from your terminal

Claude Code offers several ways to work when you're not at your terminal. They differ in what triggers the work, where Claude runs, and how much you need to set up.

|                                                | Trigger                                                                                        | Claude runs on                                                                               | Setup                                                                                                                                | Best for                                                      |
| :--------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| [Dispatch](/docs/en/desktop#sessions-from-dispatch) | Message a task from the Claude mobile app                                                      | Your machine (Desktop)                                                                       | [Pair the mobile app with Desktop](https://support.claude.com/en/articles/13947068)                                                  | Delegating work while you're away, minimal setup              |
| [Remote Control](/docs/en/remote-control)           | Drive a running session from [claude.ai/code](https://claude.ai/code) or the Claude mobile app | Your machine (CLI or VS Code)                                                                | Run `claude remote-control`                                                                                                          | Steering in-progress work from another device                 |
| [Channels](/docs/en/channels)                       | Push events from a chat app like Telegram or Discord, or your own server                       | Your machine (CLI)                                                                           | [Install a channel plugin](/docs/en/channels#quickstart) or [build your own](/docs/en/channels-reference)                                      | Reacting to external events like CI failures or chat messages |
| [Slack](/docs/en/slack)                             | Mention `@Claude` in a team channel                                                            | Anthropic cloud                                                                              | [Install the Slack app](/docs/en/slack#setting-up-claude-code-in-slack) with [Claude Code on the web](/docs/en/claude-code-on-the-web) enabled | PRs and reviews from team chat                                |
| [Scheduled tasks](/docs/en/scheduled-tasks)         | Set a schedule                                                                                 | [CLI](/docs/en/scheduled-tasks), [Desktop](/docs/en/desktop-scheduled-tasks), or [cloud](/docs/en/routines) | Pick a frequency                                                                                                                     | Recurring automation like daily reviews                       |

If you're not sure where to start, [install the CLI](/docs/en/quickstart) and run it in a project directory. If you'd rather not use a terminal, [Desktop](/docs/en/desktop-quickstart) gives you the same engine with a graphical interface.

## Related resources

### Platforms

* [CLI quickstart](/docs/en/quickstart): install and run your first command in the terminal
* [Desktop](/docs/en/desktop): visual diff review, parallel sessions, computer use, and Dispatch
* [VS Code](/docs/en/vs-code): the Claude Code extension inside your editor
* [JetBrains](/docs/en/jetbrains): the extension for IntelliJ, PyCharm, and other JetBrains IDEs
* [Claude Code on the web](/docs/en/claude-code-on-the-web): cloud sessions that keep running when you disconnect
* Mobile: the Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) and [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) for starting and monitoring tasks while away from your computer

### Integrations

* [Chrome](/docs/en/chrome): automate browser tasks with your logged-in sessions
* [Computer use](/docs/en/computer-use): let Claude open apps and control your screen on macOS
* [GitHub Actions](/docs/en/github-actions): run Claude in your CI pipeline
* [GitLab CI/CD](/docs/en/gitlab-ci-cd): the same for GitLab
* [Code Review](/docs/en/code-review): automatic review on every pull request
* [Slack](/docs/en/slack): send tasks from team chat, get PRs back

### Remote access

* [Dispatch](/docs/en/desktop#sessions-from-dispatch): message a task from your phone and it can spawn a Desktop session
* [Remote Control](/docs/en/remote-control): drive a running session from your phone or browser
* [Channels](/docs/en/channels): push events from chat apps or your own servers into a session
* [Scheduled tasks](/docs/en/scheduled-tasks): run prompts on a recurring schedule


---

## Advanced setup

`https://code.claude.com/docs/en/setup`

System requirements, platform-specific installation, version management, and uninstallation for Claude Code.

This page covers system requirements, platform-specific installation details, updates, and uninstallation. For a guided walkthrough of your first session, see the [quickstart](/docs/en/quickstart). If you've never used a terminal before, see the [terminal guide](/docs/en/terminal-guide).

## System requirements

Claude Code runs on the following platforms and configurations:

* **Operating system**:
  * macOS 13.0+
  * Windows 10 1809+ or Windows Server 2019+
  * Ubuntu 20.04+
  * Debian 10+
  * Alpine Linux 3.19+
* **Hardware**: 4 GB+ RAM, x64 or ARM64 processor
* **Network**: internet connection required. See [network configuration](/docs/en/network-config#network-access-requirements).
* **Shell**: Bash, Zsh, PowerShell, or CMD.
* **Location**: [Anthropic supported countries](https://www.anthropic.com/supported-countries)

### Additional dependencies

* **ripgrep**: usually included with Claude Code. If search fails, see [search troubleshooting](/docs/en/troubleshooting#search-and-discovery-issues).

## Install Claude Code

<Tip>
  Prefer a graphical interface? The [Desktop app](/docs/en/desktop-quickstart) lets you use Claude Code without the terminal. Download it for [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code\&utm_medium=docs) or [Windows](https://claude.com/download?utm_source=claude_code\&utm_medium=docs).

  New to the terminal? See the [terminal guide](/docs/en/terminal-guide) for step-by-step instructions.
</Tip>

To install Claude Code, use one of the following methods:

<Tabs>
  <Tab title="Native Install (Recommended)">
    **macOS, Linux, WSL:**

    ```bash theme={null}
    curl -fsSL https://claude.ai/install.sh | bash
    ```

    **Windows PowerShell:**

    ```powershell theme={null}
    irm https://claude.ai/install.ps1 | iex
    ```

    **Windows CMD:**

    ```batch theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
    ```

    If you see `The token '&&' is not a valid statement separator`, you're in PowerShell, not CMD. If you see `'irm' is not recognized as an internal or external command`, you're in CMD, not PowerShell. Your prompt shows `PS C:\` when you're in PowerShell and `C:\` without the `PS` when you're in CMD.

    [Git for Windows](https://git-scm.com/downloads/win) is recommended on native Windows so Claude Code can use the Bash tool. If Git for Windows is not installed, Claude Code uses PowerShell as the shell tool instead. WSL setups do not need Git for Windows.

    <Info>
      Native installations automatically update in the background to keep you on the latest version.
    </Info>
  </Tab>

  <Tab title="Homebrew">
    ```bash theme={null}
    brew install --cask claude-code
    ```

    Homebrew offers two casks. `claude-code` tracks the stable release channel, which is typically about a week behind and skips releases with major regressions. `claude-code@latest` tracks the latest channel and receives new versions as soon as they ship.

    <Info>
      Homebrew installations do not auto-update. Run `brew upgrade claude-code` or `brew upgrade claude-code@latest`, depending on which cask you installed, to get the latest features and security fixes.
    </Info>
  </Tab>

  <Tab title="WinGet">
    ```powershell theme={null}
    winget install Anthropic.ClaudeCode
    ```

    <Info>
      WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.
    </Info>
  </Tab>
</Tabs>

You can also install with [apt, dnf, or apk](/docs/en/setup#install-with-linux-package-managers) on Debian, Fedora, RHEL, and Alpine.

After installation completes, open a terminal in the project you want to work in and start Claude Code:

```bash theme={null}
claude
```

If you encounter any issues during installation, see [Troubleshoot installation and login](/docs/en/troubleshoot-install).

### Set up on Windows

You can run Claude Code natively on Windows or inside WSL. Pick based on where your projects are located and which features you need:

| Option         | Requires                                                               | [Sandboxing](/docs/en/sandboxing) | When to use                                     |
| -------------- | ---------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------- |
| Native Windows | None; [Git for Windows](https://git-scm.com/downloads/win) is optional | Not supported                | Windows-native projects and tools               |
| WSL 2          | WSL 2 enabled                                                          | Supported                    | Linux toolchains or sandboxed command execution |
| WSL 1          | WSL 1 enabled                                                          | Not supported                | If WSL 2 is unavailable                         |

**Option 1: Native Windows**

Run the install command from PowerShell or CMD. You do not need to run as Administrator. Installing [Git for Windows](https://git-scm.com/downloads/win) is optional. It enables the [Bash tool](/docs/en/tools-reference#bash-tool-behavior) by providing Git Bash.

Whether you install from PowerShell or CMD only affects which install command you run. Your prompt shows `PS C:\Users\YourName>` in PowerShell and `C:\Users\YourName>` without the `PS` in CMD. If you're new to the terminal, the [terminal guide](/docs/en/terminal-guide#windows) walks through each step.

After installation, launch `claude` from any terminal.

* **Without Git for Windows**, Claude Code runs shell commands via the [PowerShell tool](/docs/en/tools-reference#powershell-tool).
* **With Git for Windows**, Claude Code uses Git Bash for the [Bash tool](/docs/en/tools-reference#bash-tool-behavior). If Claude Code can't find Git Bash, set the path in your [settings.json file](/docs/en/settings):

  ```json theme={null}
  {
    "env": {
      "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
    }
  }
  ```

When Git for Windows is installed, the PowerShell tool is rolling out progressively as an additional option alongside Bash. Set `CLAUDE_CODE_USE_POWERSHELL_TOOL=1` to opt in or `0` to opt out. See [PowerShell tool](/docs/en/tools-reference#powershell-tool) for setup and limitations.

**Option 2: WSL**

Open your WSL distribution and run the Linux installer from the [install instructions](#install-claude-code) above. You install and launch `claude` inside the WSL terminal, not from PowerShell or CMD.

### Alpine Linux and musl-based distributions

The native installer on Alpine and other musl/uClibc-based distributions requires `libgcc`, `libstdc++`, and `ripgrep`. Install these using your distribution's package manager, then set `USE_BUILTIN_RIPGREP=0`.

This example installs the required packages on Alpine:

```bash theme={null}
apk add libgcc libstdc++ ripgrep
```

Then set `USE_BUILTIN_RIPGREP` to `0` in your [`settings.json`](/docs/en/settings#available-settings) file:

```json theme={null}
{
  "env": {
    "USE_BUILTIN_RIPGREP": "0"
  }
}
```

## Verify your installation

After installing, confirm Claude Code is working:

```bash theme={null}
claude --version
```

If this fails with `command not found` or another error, see [Troubleshoot installation and login](/docs/en/troubleshoot-install).

For a more detailed check of your installation and configuration, run [`claude doctor`](/docs/en/troubleshooting#get-more-help):

```bash theme={null}
claude doctor
```

## Authenticate

Claude Code requires a Pro, Max, Team, Enterprise, or Console account. The free Claude.ai plan does not include Claude Code access. You can also use Claude Code with a third-party API provider like [Amazon Bedrock](/docs/en/amazon-bedrock), [Google Vertex AI](/docs/en/google-vertex-ai), or [Microsoft Foundry](/docs/en/microsoft-foundry).

After installing, log in by running `claude` and following the browser prompts. See [Authentication](/docs/en/authentication) for all account types and team setup options.

## Update Claude Code

Native installations automatically update in the background. You can [configure the release channel](#configure-release-channel) to control whether you receive updates immediately or on a delayed stable schedule, or [disable auto-updates](#disable-auto-updates) entirely. Homebrew, WinGet, and [Linux package manager](#install-with-linux-package-managers) installations require manual updates by default.

### Auto-updates

Claude Code checks for updates on startup and periodically while running. Updates download and install in the background, then take effect the next time you start Claude Code.

Run `claude doctor` to see the result of the most recent update attempt.

If an npm global install can't auto-update because the npm global directory isn't writable, Claude Code shows a one-time notice at startup, and `claude doctor` lists the available fixes. See [permission errors during installation](/docs/en/troubleshoot-install#permission-errors-during-installation) for details.

<Note>
  Homebrew, WinGet, apt, dnf, and apk installations do not auto-update by default; see below to opt in for Homebrew and WinGet. To upgrade Homebrew manually, run `brew upgrade claude-code` or `brew upgrade claude-code@latest`, depending on which cask you installed. For WinGet, run `winget upgrade Anthropic.ClaudeCode`. For Linux package managers, see the upgrade commands in [Install with Linux package managers](#install-with-linux-package-managers).

  To have Claude Code run the upgrade command for you on Homebrew or WinGet, set [`CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`](/docs/en/env-vars) to `1`. Claude Code then runs the upgrade in the background when a new version is available and shows a restart prompt on success. The upgrade targets only the Claude Code package and does not affect other software you have installed.

  On WinGet the upgrade may fail while Claude Code is running because Windows locks the executable. In that case Claude Code shows the manual command instead. apt, dnf, and apk continue to require a manual upgrade because those commands need elevated privileges.

  **Known issue:** Claude Code may notify you of updates before the new version is available in these package managers. If an upgrade fails, wait and try again later.

  Homebrew keeps old versions on disk after upgrades. Run `brew cleanup` periodically to reclaim disk space.
</Note>

### Configure release channel

Control which release channel Claude Code follows for auto-updates and `claude update` with the `autoUpdatesChannel` setting:

* `"latest"`, the default: receive new features as soon as they're released
* `"stable"`: use a version that is typically about one week old, skipping releases with major regressions

Configure this via `/config` → **Auto-update channel**, or add it to your [settings.json file](/docs/en/settings):

```json theme={null}
{
  "autoUpdatesChannel": "stable"
}
```

For enterprise deployments, you can enforce a consistent release channel across your organization using [managed settings](/docs/en/permissions#managed-settings).

Homebrew installations choose a channel by cask name instead of this setting: `claude-code` tracks stable and `claude-code@latest` tracks latest.

### Pin a minimum version

The `minimumVersion` setting establishes a floor. Background auto-updates and `claude update` refuse to install any version below this value, so moving to the `"stable"` channel does not downgrade you if you are already on a newer `"latest"` build.

Switching from `"latest"` to `"stable"` via `/config` prompts you to either stay on the current version or allow the downgrade. Choosing to stay sets `minimumVersion` to that version. Switching back to `"latest"` clears it.

Add it to your [settings.json file](/docs/en/settings) to pin a floor explicitly:

```json theme={null}
{
  "autoUpdatesChannel": "stable",
  "minimumVersion": "2.1.100"
}
```

In [managed settings](/docs/en/permissions#managed-settings), this enforces an organization-wide minimum that user and project settings cannot override.

### Disable auto-updates

Set `DISABLE_AUTOUPDATER` to `"1"` in the `env` key of your [`settings.json`](/docs/en/settings#available-settings) file:

```json theme={null}
{
  "env": {
    "DISABLE_AUTOUPDATER": "1"
  }
}
```

`DISABLE_AUTOUPDATER` only stops the background check; `claude update` and `claude install` still work. To block all update paths, including manual updates, set [`DISABLE_UPDATES`](/docs/en/env-vars) instead. Use this when you distribute Claude Code through your own channels and need users to stay on the version you provide.

### Update manually

To apply an update immediately without waiting for the next background check, run:

```bash theme={null}
claude update
```

## Advanced installation options

These options are for version pinning, Linux package managers, npm, and verifying binary integrity.

### Install a specific version

The native installer accepts either a specific version number or a release channel (`latest` or `stable`). The channel you choose at install time becomes your default for auto-updates. See [configure release channel](#configure-release-channel) for more information.

To install the latest version (default):

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash theme={null}
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    irm https://claude.ai/install.ps1 | iex
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
    ```
  </Tab>
</Tabs>

To install the stable version:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash theme={null}
    curl -fsSL https://claude.ai/install.sh | bash -s stable
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    & ([scriptblock]::Create((irm https://claude.ai/install.ps1))) stable
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd stable && del install.cmd
    ```
  </Tab>
</Tabs>

To install a specific version number:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash theme={null}
    curl -fsSL https://claude.ai/install.sh | bash -s 2.1.89
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    & ([scriptblock]::Create((irm https://claude.ai/install.ps1))) 2.1.89
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch theme={null}
    curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd 2.1.89 && del install.cmd
    ```
  </Tab>
</Tabs>

### Install with Linux package managers

Claude Code publishes signed apt, dnf, and apk repositories. Replace `stable` with `latest` for the rolling channel. Package manager installations do not auto-update through Claude Code; updates arrive through your normal system upgrade workflow.

All repositories are signed with the [Claude Code release signing key](#binary-integrity-and-code-signing). Before trusting the key, verify it as described in each tab.

<Tabs>
  <Tab title="apt">
    For Debian and Ubuntu. To use the rolling channel, change both `stable` occurrences in the `deb` line: the URL path and the suite name.

    ```bash theme={null}
    sudo install -d -m 0755 /etc/apt/keyrings
    sudo curl -fsSL https://downloads.claude.ai/keys/claude-code.asc \
      -o /etc/apt/keyrings/claude-code.asc
    echo "deb [signed-by=/etc/apt/keyrings/claude-code.asc] https://downloads.claude.ai/claude-code/apt/stable stable main" \
      | sudo tee /etc/apt/sources.list.d/claude-code.list
    sudo apt update
    sudo apt install claude-code
    ```

    Verify the GPG key fingerprint before trusting it: `gpg --show-keys /etc/apt/keyrings/claude-code.asc` should report `31DD DE24 DDFA B679 F42D 7BD2 BAA9 29FF 1A7E CACE`.

    To upgrade later, run `sudo apt update && sudo apt upgrade claude-code`.
  </Tab>

  <Tab title="dnf">
    For Fedora and RHEL:

    ```bash theme={null}
    sudo tee /etc/yum.repos.d/claude-code.repo <<'EOF'
    [claude-code]
    name=Claude Code
    baseurl=https://downloads.claude.ai/claude-code/rpm/stable
    enabled=1
    gpgcheck=1
    gpgkey=https://downloads.claude.ai/keys/claude-code.asc
    EOF
    sudo dnf install claude-code
    ```

    dnf downloads the key on first install and prompts you to confirm the fingerprint. Verify it matches `31DD DE24 DDFA B679 F42D 7BD2 BAA9 29FF 1A7E CACE` before accepting.

    To upgrade later, run `sudo dnf upgrade claude-code`.
  </Tab>

  <Tab title="apk">
    For Alpine Linux:

    ```sh theme={null}
    wget -O /etc/apk/keys/claude-code.rsa.pub \
      https://downloads.claude.ai/keys/claude-code.rsa.pub
    echo "https://downloads.claude.ai/claude-code/apk/stable" >> /etc/apk/repositories
    apk add claude-code
    ```

    Verify the downloaded key with `sha256sum /etc/apk/keys/claude-code.rsa.pub`, which should report `395759c1f7449ef4cdef305a42e820f3c766d6090d142634ebdb049f113168b6`.

    To upgrade later, run `apk update && apk upgrade claude-code`.
  </Tab>
</Tabs>

### Install with npm

You can also install Claude Code as a global npm package. The package requires [Node.js 18 or later](https://nodejs.org/en/download).

```bash theme={null}
npm install -g @anthropic-ai/claude-code
```

The npm package installs the same native binary as the standalone installer. npm pulls the binary in through a per-platform optional dependency such as `@anthropic-ai/claude-code-darwin-arm64`, and a postinstall step links it into place. The installed `claude` binary does not itself invoke Node.

Supported npm install platforms are `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `linux-x64-musl`, `linux-arm64-musl`, `win32-x64`, and `win32-arm64`. Your package manager must allow optional dependencies. See [troubleshooting](/docs/en/troubleshoot-install#native-binary-not-found-after-npm-install) if the binary is missing after install.

To upgrade an npm installation, run `npm install -g @anthropic-ai/claude-code@latest`. Avoid `npm update -g`, which respects the semver range from the original install and may not move you to the newest release.

<Warning>
  Do NOT use `sudo npm install -g` as this can lead to permission issues and security risks. If you encounter permission errors, see [troubleshooting permission errors](/docs/en/troubleshoot-install#permission-errors-during-installation).
</Warning>

### Binary integrity and code signing

Each release publishes a `manifest.json` containing SHA256 checksums for every platform binary. The manifest is signed with an Anthropic GPG key, so verifying the signature on the manifest transitively verifies every binary it lists.

#### Verify the manifest signature

Steps 1-3 require a POSIX shell with `gpg` and `curl`. On Windows, run them in Git Bash or WSL. Step 4 includes a PowerShell option.

<Steps>
  <Step title="Download and import the public key">
    The release signing key is published at a fixed URL.

    ```bash theme={null}
    curl -fsSL https://downloads.claude.ai/keys/claude-code.asc | gpg --import
    ```

    Display the fingerprint of the imported key.

    ```bash theme={null}
    gpg --fingerprint security@anthropic.com
    ```

    Confirm the output includes this fingerprint:

    ```text theme={null}
    31DD DE24 DDFA B679 F42D  7BD2 BAA9 29FF 1A7E CACE
    ```
  </Step>

  <Step title="Download the manifest and signature">
    Set `VERSION` to the release you want to verify.

    ```bash theme={null}
    REPO=https://downloads.claude.ai/claude-code-releases
    VERSION=2.1.89
    curl -fsSLO "$REPO/$VERSION/manifest.json"
    curl -fsSLO "$REPO/$VERSION/manifest.json.sig"
    ```
  </Step>

  <Step title="Verify the signature">
    Verify the detached signature against the manifest.

    ```bash theme={null}
    gpg --verify manifest.json.sig manifest.json
    ```

    A valid result reports `Good signature from "Anthropic Claude Code Release Signing <security@anthropic.com>"`.

    `gpg` also prints `WARNING: This key is not certified with a trusted signature!` for any freshly imported key. This is expected. The `Good signature` line confirms the cryptographic check passed. The fingerprint comparison in Step 1 confirms the key itself is authentic.
  </Step>

  <Step title="Check the binary against the manifest">
    Compare the SHA256 checksum of your downloaded binary with the value listed under `platforms.<platform>.checksum` in `manifest.json`.

    <Tabs>
      <Tab title="Linux">
        ```bash theme={null}
        sha256sum claude
        ```
      </Tab>

      <Tab title="macOS">
        ```bash theme={null}
        shasum -a 256 claude
        ```
      </Tab>

      <Tab title="Windows PowerShell">
        ```powershell theme={null}
        (Get-FileHash claude.exe -Algorithm SHA256).Hash.ToLower()
        ```
      </Tab>
    </Tabs>
  </Step>
</Steps>

<Note>
  Manifest signatures are available for releases from `2.1.89` onward. Earlier releases publish checksums in `manifest.json` without a detached signature.
</Note>

#### Platform code signatures

In addition to the signed manifest, individual binaries carry platform-native code signatures where supported.

* **macOS**: signed by "Anthropic PBC" and notarized by Apple. Verify with `codesign --verify --verbose ./claude`.
* **Windows**: signed by "Anthropic, PBC". Verify with `Get-AuthenticodeSignature .\claude.exe`.
* **Linux**: binaries are not individually code-signed. If you download directly from the `claude-code-releases` bucket or use the native installer, verify integrity with the manifest signature above. If you install with [apt, dnf, or apk](#install-with-linux-package-managers), your package manager verifies signatures automatically using the repository signing key.

## Uninstall Claude Code

To remove Claude Code, follow the instructions for your installation method. If `claude` still runs afterward, you likely have a second installation or a leftover shell alias from an older installer. See [Check for conflicting installations](/docs/en/troubleshoot-install#check-for-conflicting-installations) to find and remove it.

### Native installation

Remove the Claude Code binary and version files:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash theme={null}
    rm -f ~/.local/bin/claude
    rm -rf ~/.local/share/claude
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    Remove-Item -Path "$env:USERPROFILE\.local\bin\claude.exe" -Force
    Remove-Item -Path "$env:USERPROFILE\.local\share\claude" -Recurse -Force
    ```
  </Tab>
</Tabs>

### Homebrew installation

Remove the Homebrew cask you installed. If you installed the stable cask:

```bash theme={null}
brew uninstall --cask claude-code
```

If you installed the latest cask:

```bash theme={null}
brew uninstall --cask claude-code@latest
```

### WinGet installation

Remove the WinGet package:

```powershell theme={null}
winget uninstall Anthropic.ClaudeCode
```

### apt / dnf / apk

Remove the package and the repository configuration:

<Tabs>
  <Tab title="apt">
    ```bash theme={null}
    sudo apt remove claude-code
    sudo rm /etc/apt/sources.list.d/claude-code.list /etc/apt/keyrings/claude-code.asc
    ```
  </Tab>

  <Tab title="dnf">
    ```bash theme={null}
    sudo dnf remove claude-code
    sudo rm /etc/yum.repos.d/claude-code.repo
    ```
  </Tab>

  <Tab title="apk">
    ```sh theme={null}
    apk del claude-code
    sed -i '\|downloads.claude.ai/claude-code/apk|d' /etc/apk/repositories
    rm /etc/apk/keys/claude-code.rsa.pub
    ```
  </Tab>
</Tabs>

### npm

Remove the global npm package:

```bash theme={null}
npm uninstall -g @anthropic-ai/claude-code
```

### Remove configuration files

<Warning>
  Removing configuration files will delete all your settings, allowed tools, MCP server configurations, and session history.
</Warning>

The VS Code extension, the JetBrains plugin, and the Desktop app also write to `~/.claude/`. If any of them is still installed, the directory is recreated the next time it runs. To remove Claude Code completely, uninstall the [VS Code extension](/docs/en/vs-code#uninstall-the-extension), the JetBrains plugin, and the Desktop app before deleting these files.

To remove Claude Code settings and cached data:

<Tabs>
  <Tab title="macOS, Linux, WSL">
    ```bash theme={null}
    # Remove user settings and state
    rm -rf ~/.claude
    rm ~/.claude.json

    # Remove project-specific settings (run from your project directory)
    rm -rf .claude
    rm -f .mcp.json
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    # Remove user settings and state
    Remove-Item -Path "$env:USERPROFILE\.claude" -Recurse -Force
    Remove-Item -Path "$env:USERPROFILE\.claude.json" -Force

    # Remove project-specific settings (run from your project directory)
    Remove-Item -Path ".claude" -Recurse -Force
    Remove-Item -Path ".mcp.json" -Force
    ```
  </Tab>
</Tabs>


---

## Troubleshoot installation and login

`https://code.claude.com/docs/en/troubleshoot-install`

Fix command not found, PATH, permission, network, and authentication errors when installing or signing in to Claude Code.

If installation fails or you can't sign in, find your error below. For runtime issues after Claude Code is working, see [Troubleshooting](/docs/en/troubleshooting). For configuration problems such as settings not applying or hooks not firing, see [Debug your configuration](/docs/en/debug-your-config).

## Find your error

Match the error message or symptom you're seeing to a fix:

| What you see                                                                                | Solution                                                                                                                |
| :------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| `command not found: claude` or `'claude' is not recognized`                                 | [Fix your PATH](#command-not-found-claude-after-installation)                                                           |
| `syntax error near unexpected token '<'`                                                    | [Install script returns HTML](#install-script-returns-html-instead-of-a-shell-script)                                   |
| `curl: (22) The requested URL returned error: 403`                                          | [Install script returned 403](#install-script-returns-html-instead-of-a-shell-script)                                   |
| `curl: (23)` or `curl: (56) Failure writing output to destination`                          | [Check connectivity or use an alternative installer](#curl-56-failure-writing-output-to-destination)                    |
| `Killed` during install on Linux                                                            | [Add swap space for low-memory servers](#install-killed-on-low-memory-linux-servers)                                    |
| `TLS connect error` or `SSL/TLS secure channel`                                             | [Update CA certificates](#tls-or-ssl-connection-errors)                                                                 |
| `Failed to fetch version` or can't reach download server                                    | [Check network and proxy settings](#check-network-connectivity)                                                         |
| `irm is not recognized` or `&& is not valid`                                                | [Use the right command for your shell](#wrong-install-command-on-windows)                                               |
| `'bash' is not recognized as the name of a cmdlet`                                          | [Use the Windows installer command](#wrong-install-command-on-windows)                                                  |
| `Claude Code on Windows requires either Git for Windows (for bash) or PowerShell`           | [Install a shell](#claude-code-on-windows-requires-either-git-for-windows-for-bash-or-powershell)                       |
| `Claude Code does not support 32-bit Windows`                                               | [Open Windows PowerShell, not the x86 entry](#claude-code-does-not-support-32-bit-windows)                              |
| `The process cannot access the file ... because it is being used by another process`        | [Clear the downloads folder and retry](#the-process-cannot-access-the-file-during-windows-install)                      |
| `Error loading shared library`                                                              | [Wrong binary variant for your system](#linux-musl-or-glibc-binary-mismatch)                                            |
| `Illegal instruction`                                                                       | [Architecture or CPU instruction set mismatch](#illegal-instruction)                                                    |
| `cannot execute binary file: Exec format error` in WSL                                      | [WSL1 native-binary regression](#exec-format-error-on-wsl1)                                                             |
| PowerShell installer completes but `claude` is not found or shows an old version            | [Restart your terminal and verify PATH](#verify-your-path)                                                              |
| `dyld: cannot load`, `dyld: Symbol not found`, or `Abort trap` on macOS                     | [Binary incompatibility](#dyld-cannot-load-on-macos)                                                                    |
| `Invoke-Expression: Missing argument in parameter list`                                     | [Install script returns HTML](#install-script-returns-html-instead-of-a-shell-script)                                   |
| `App unavailable in region`                                                                 | Claude Code is not available in your country. See [supported countries](https://www.anthropic.com/supported-countries). |
| `unable to get local issuer certificate`                                                    | [Configure corporate CA certificates](#tls-or-ssl-connection-errors)                                                    |
| `OAuth error` or `403 Forbidden`                                                            | [Fix authentication](#login-and-authentication)                                                                         |
| `Could not load the default credentials` or `Could not load credentials from any providers` | [Bedrock, Vertex, or Foundry credentials](#bedrock-vertex-or-foundry-credentials-not-loading)                           |
| `ChainedTokenCredential authentication failed` or `CredentialUnavailableError`              | [Bedrock, Vertex, or Foundry credentials](#bedrock-vertex-or-foundry-credentials-not-loading)                           |
| `API Error: 500`, `529 Overloaded`, `429`, or other 4xx and 5xx errors not listed above     | See the [Error reference](/docs/en/errors)                                                                                   |

If your issue isn't listed, work through the diagnostic checks below to narrow down the cause.

<Tip>
  If you'd rather skip the terminal entirely, the [Claude Code Desktop app](/docs/en/desktop-quickstart) lets you install and use Claude Code through a graphical interface. Download it for [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code\&utm_medium=docs) or [Windows](https://claude.com/download?utm_source=claude_code\&utm_medium=docs) and start coding without any command-line setup.
</Tip>

## Run diagnostic checks

### Check network connectivity

The installer downloads from `downloads.claude.ai`. Verify you can reach it:

```bash theme={null}
curl -sI https://downloads.claude.ai/claude-code-releases/latest
```

An `HTTP/2 200` line means you reached the server. If you see no output, `Could not resolve host`, or a connection timeout, your network is blocking the connection. Common causes:

* Corporate firewalls or proxies blocking `downloads.claude.ai`
* Regional network restrictions: try a VPN or alternative network
* TLS/SSL issues: update your system's CA certificates, or check if `HTTPS_PROXY` is configured

If you're behind a corporate proxy, set `HTTPS_PROXY` and `HTTP_PROXY` to your proxy's address before installing. Ask your IT team for the proxy URL if you don't know it, or check your browser's proxy settings.

This example sets both proxy variables, then runs the installer through your proxy:

<Tabs>
  <Tab title="macOS/Linux">
    ```bash theme={null}
    export HTTP_PROXY=http://proxy.example.com:8080
    export HTTPS_PROXY=http://proxy.example.com:8080
    curl -fsSL https://claude.ai/install.sh | bash
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    $env:HTTP_PROXY = 'http://proxy.example.com:8080'
    $env:HTTPS_PROXY = 'http://proxy.example.com:8080'
    irm https://claude.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

### Verify your PATH

If installation succeeded but you get a `command not found` or `not recognized` error when running `claude`, the install directory isn't in your PATH. Your shell searches for programs in directories listed in PATH, and the installer places `claude` at `~/.local/bin/claude` on macOS/Linux or `%USERPROFILE%\.local\bin\claude.exe` on Windows.

Check if the install directory is in your PATH by listing your PATH entries and filtering for `local/bin`:

<Tabs>
  <Tab title="macOS/Linux">
    ```bash theme={null}
    echo $PATH | tr ':' '\n' | grep -Fx "$HOME/.local/bin"
    ```

    If this prints `/Users/you/.local/bin` or `/home/you/.local/bin`, the directory is in your PATH and you can skip to [Check for conflicting installations](#check-for-conflicting-installations). If there's no output, add it to your shell configuration.

    For Zsh, the default on macOS:

    ```bash theme={null}
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    source ~/.zshrc
    ```

    For Bash, the default on most Linux distributions:

    ```bash theme={null}
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    ```

    Alternatively, close and reopen your terminal.

    For other shells such as fish or Nushell, add `~/.local/bin` to your PATH using your shell's own configuration syntax, then restart your terminal.

    Verify the fix worked:

    ```bash theme={null}
    claude --version
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    ```powershell theme={null}
    $env:PATH -split ';' | Select-String '\.local\\bin'
    ```

    If there's no output, add the install directory to your User PATH:

    ```powershell theme={null}
    $currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
    [Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
    ```

    Restart your terminal for the change to take effect.

    Verify the fix worked:

    ```powershell theme={null}
    claude --version
    ```
  </Tab>

  <Tab title="Windows CMD">
    ```batch theme={null}
    echo %PATH% | findstr /i "local\bin"
    ```

    If there's no output, open System Settings, go to Environment Variables, and add `%USERPROFILE%\.local\bin` to your User PATH variable. Restart your terminal.

    Verify the fix worked:

    ```batch theme={null}
    claude --version
    ```
  </Tab>
</Tabs>

### Check for conflicting installations

Multiple Claude Code installations can cause version mismatches or unexpected behavior. Check what's installed:

<Tabs>
  <Tab title="macOS/Linux">
    List all `claude` binaries found in your PATH:

    ```bash theme={null}
    which -a claude
    ```

    If this prints nothing, no `claude` is on your PATH yet. Go back to [Verify your PATH](#verify-your-path).

    Check the three locations a `claude` binary can come from. `~/.local/bin/claude` is the native installer, `~/.claude/local/` is a legacy local npm install created by older versions of Claude Code, and the npm global list shows a `-g` install:

    ```bash theme={null}
    ls -la ~/.local/bin/claude
    ```

    ```bash theme={null}
    ls -la ~/.claude/local/
    ```

    ```bash theme={null}
    npm -g ls @anthropic-ai/claude-code 2>/dev/null
    ```
  </Tab>

  <Tab title="Windows PowerShell">
    List all `claude` binaries found in your PATH:

    ```powershell theme={null}
    where.exe claude
    ```

    Check whether the native installer placed a binary:

    ```powershell theme={null}
    Test-Path "$env:USERPROFILE\.local\bin\claude.exe"
    ```
  </Tab>
</Tabs>

If you find multiple installations, keep only one. The native install at `~/.local/bin/claude` on macOS/Linux or `%USERPROFILE%\.local\bin\claude.exe` on Windows is recommended. Remove the extras:

Uninstall an npm global install:

```bash theme={null}
npm uninstall -g @anthropic-ai/claude-code
```

Remove the legacy local npm install:

```bash theme={null}
rm -rf ~/.claude/local
```

On Windows, use PowerShell:

```powershell theme={null}
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\local"
```

Remove a Homebrew install on macOS. If you installed the `claude-code@latest` cask, substitute that name:

```bash theme={null}
brew uninstall --cask claude-code
```

Remove a WinGet install on Windows:

```powershell theme={null}
winget uninstall Anthropic.ClaudeCode
```

### Check directory permissions

The installer needs write access to `~/.local/bin/` and `~/.claude/` on macOS and Linux. On Windows the install location is under `%USERPROFILE%`, which is writable by your user by default, so this section rarely applies there.

Check whether the directories are writable:

```bash theme={null}
test -w ~/.local/bin && echo "writable" || echo "not writable"
test -w ~/.claude && echo "writable" || echo "not writable"
```

If either directory isn't writable, create the install directory and set your user as the owner:

```bash theme={null}
sudo mkdir -p ~/.local/bin
sudo chown -R $(whoami) ~/.local
```

### Verify the binary works

If `claude --version` prints a version but `claude` crashes or hangs on startup, run these checks to narrow down the cause. If `claude --version` says command not found, go to [Verify your PATH](#verify-your-path) first; the commands below assume `claude` is on your PATH.

Confirm the binary exists and is executable:

```bash theme={null}
ls -la "$(command -v claude)"
```

On Windows, use PowerShell:

```powershell theme={null}
Get-Command claude | Select-Object Source
```

On Linux, check for missing shared libraries. If `ldd` shows missing libraries, you may need to install system packages. On Alpine Linux and other musl-based distributions, see [Alpine Linux setup](/docs/en/setup#alpine-linux-and-musl-based-distributions).

```bash theme={null}
ldd "$(command -v claude)" | grep "not found"
```

Confirm the binary can execute:

```bash theme={null}
claude --version
```

## Common installation issues

These are the most frequently encountered installation problems and their solutions.

### Install script returns HTML instead of a shell script

When running the install command, you may see one of these errors:

```text theme={null}
bash: line 1: syntax error near unexpected token `<'
bash: line 1: `<!DOCTYPE html>'
```

On PowerShell, the same problem appears as:

```text theme={null}
Invoke-Expression: Missing argument in parameter list.
```

Depending on how the request was routed, you may instead see a 403 with no HTML body:

```text theme={null}
curl: (22) The requested URL returned error: 403
```

These all mean the install URL returned an HTML page or an error status instead of the install script. If the HTML page says "App unavailable in region," Claude Code is not available in your country. See [supported countries](https://www.anthropic.com/supported-countries).

A bare 403 with no body often has the same cause, but it can also come from a corporate proxy or firewall blocking the download. If you are in a supported country and still see the 403, work through [Check network connectivity](#check-network-connectivity) before trying the alternative installers below, since those reach the same hosts.

Otherwise, this can happen due to network issues, regional routing, or a temporary service disruption.

**Solutions:**

1. **Use an alternative install method**:

   On macOS, install via Homebrew:

   ```bash theme={null}
   brew install --cask claude-code
   ```

   On Windows, install via WinGet:

   ```powershell theme={null}
   winget install Anthropic.ClaudeCode
   ```

2. **Retry after a few minutes**: the issue is often temporary. Wait and try the original command again.

### `command not found: claude` after installation

The install finished but `claude` doesn't work. The exact error varies by platform:

| Platform    | Error message                                                          |
| :---------- | :--------------------------------------------------------------------- |
| macOS       | `zsh: command not found: claude`                                       |
| Linux       | `bash: claude: command not found`                                      |
| Windows CMD | `'claude' is not recognized as an internal or external command`        |
| PowerShell  | `claude : The term 'claude' is not recognized as the name of a cmdlet` |

This means the install directory isn't in your shell's search path. See [Verify your PATH](#verify-your-path) for the fix on each platform.

### `curl: (56) Failure writing output to destination`

The `curl ... | bash` command downloads the script and pipes it to Bash for execution. This error, and the related `curl: (23) Failure writing output to destination`, means Bash did not receive the complete script. Exit code 56 indicates the download itself was interrupted, and exit code 23 indicates curl could not write what it received to the pipe, usually because Bash exited early.

**Solutions:**

1. **Check network stability**: Claude Code binaries are hosted at `downloads.claude.ai`. Test that you can reach it:
   ```bash theme={null}
   curl -sI https://downloads.claude.ai/claude-code-releases/latest
   ```
   An `HTTP/2 200` line means you reached the server and the original failure was likely intermittent; retry the install command. If you see `Could not resolve host` or a connection timeout, your network is blocking the download.

2. **Try an alternative install method**:

   On macOS:

   ```bash theme={null}
   brew install --cask claude-code
   ```

   On Windows:

   ```powershell theme={null}
   winget install Anthropic.ClaudeCode
   ```

### TLS or SSL connection errors

Errors like `curl: (35) TLS connect error`, `schannel: next InitializeSecurityContext failed`, or PowerShell's `Could not establish trust relationship for the SSL/TLS secure channel` indicate TLS handshake failures.

**Solutions:**

1. **Update your system CA certificates**:

   On Ubuntu/Debian:

   ```bash theme={null}
   sudo apt-get update && sudo apt-get install ca-certificates
   ```

   On macOS, the system curl uses the Keychain trust store; updating macOS itself updates the root certificates.

2. **On Windows, enable TLS 1.2** in PowerShell before running the installer:
   ```powershell theme={null}
   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
   irm https://claude.ai/install.ps1 | iex
   ```

3. **Check for proxy or firewall interference**: corporate proxies that perform TLS inspection can cause these errors, including `unable to get local issuer certificate` and `SELF_SIGNED_CERT_IN_CHAIN`. For the install step, point curl at your corporate CA bundle with `--cacert`:
   ```bash theme={null}
   curl --cacert /path/to/corporate-ca.pem -fsSL https://claude.ai/install.sh | bash
   ```
   For Claude Code itself once installed, set `NODE_EXTRA_CA_CERTS` so API requests trust the same bundle:
   ```bash theme={null}
   export NODE_EXTRA_CA_CERTS=/path/to/corporate-ca.pem
   ```
   Ask your IT team for the certificate file if you don't have it. You can also try on a direct connection to confirm the proxy is the cause.

4. **On Windows, bypass certificate revocation checks** if you see `CRYPT_E_NO_REVOCATION_CHECK (0x80092012)` or `CRYPT_E_REVOCATION_OFFLINE (0x80092013)`. These mean curl reached the server but your network blocks the certificate revocation lookup, which is common behind corporate firewalls. Add `--ssl-revoke-best-effort` to the install command:
   ```batch theme={null}
   curl --ssl-revoke-best-effort -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
   ```
   Alternatively, install with `winget install Anthropic.ClaudeCode`, which avoids curl entirely.

### `Failed to fetch version from downloads.claude.ai`

The installer couldn't reach the download server. This typically means `downloads.claude.ai` is blocked on your network.

**Solutions:**

1. **Test connectivity directly**:
   ```bash theme={null}
   curl -sI https://downloads.claude.ai/claude-code-releases/latest
   ```

2. **If behind a proxy**, set `HTTPS_PROXY` so the installer can route through it. See [proxy configuration](/docs/en/network-config#proxy-configuration) for details.
   ```bash theme={null}
   export HTTPS_PROXY=http://proxy.example.com:8080
   curl -fsSL https://claude.ai/install.sh | bash
   ```

3. **If on a restricted network**, try a different network or VPN, or use an alternative install method:

   On macOS:

   ```bash theme={null}
   brew install --cask claude-code
   ```

   On Windows:

   ```powershell theme={null}
   winget install Anthropic.ClaudeCode
   ```

### Wrong install command on Windows

If you see `'irm' is not recognized`, `The token '&&' is not valid`, or `'bash' is not recognized as the name of a cmdlet`, you copied the install command for a different shell or operating system.

* **`irm` not recognized**: you're in CMD, not PowerShell. You have two options:

  Open PowerShell by searching for "PowerShell" in the Start menu, then run the original install command:

  ```powershell theme={null}
  irm https://claude.ai/install.ps1 | iex
  ```

  Or stay in CMD and use the CMD installer instead:

  ```batch theme={null}
  curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
  ```

* **`&&` not valid**: you're in PowerShell but ran the CMD installer command. Use the PowerShell installer:
  ```powershell theme={null}
  irm https://claude.ai/install.ps1 | iex
  ```

* **`bash` not recognized**: you ran the macOS/Linux installer on Windows. Use the PowerShell installer instead:
  ```powershell theme={null}
  irm https://claude.ai/install.ps1 | iex
  ```

### `The process cannot access the file` during Windows install

If the PowerShell installer fails with `Failed to download binary: The process cannot access the file ... because it is being used by another process`, the installer couldn't write to `%USERPROFILE%\.claude\downloads`. This usually means a previous install attempt is still running, or antivirus software is scanning a partially downloaded binary in that folder.

Close any other PowerShell windows running the installer and wait for antivirus scans to release the file. Then delete the downloads folder and run the installer again:

```powershell theme={null}
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\downloads"
irm https://claude.ai/install.ps1 | iex
```

### Install killed on low-memory Linux servers

If you see `Killed` during installation on a VPS or cloud instance:

```text theme={null}
Setting up Claude Code...
Installing Claude Code native build latest...
bash: line 142: 34803 Killed    "$binary_path" install ${TARGET:+"$TARGET"}
```

The Linux OOM killer terminated the process because the system ran out of memory. Claude Code requires at least 4 GB of available RAM.

**Solutions:**

1. **Add swap space** if your server has limited RAM. Swap uses disk space as overflow memory, letting the install complete even with low physical RAM.

   Create a 2 GB swap file and enable it:

   ```bash theme={null}
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

   Then retry the installation:

   ```bash theme={null}
   curl -fsSL https://claude.ai/install.sh | bash
   ```

2. **Close other processes** to free memory before installing.

3. **Use a larger instance** if possible. Claude Code requires at least 4 GB of RAM.

### Install hangs in Docker

When installing Claude Code in a Docker container, installing as root into `/` can cause hangs.

**Solutions:**

1. **Set a working directory** before running the installer. When run from `/`, the installer scans the entire filesystem, which causes excessive memory usage. Setting `WORKDIR` limits the scan to a small directory:
   ```dockerfile theme={null}
   WORKDIR /tmp
   RUN curl -fsSL https://claude.ai/install.sh | bash
   ```

2. **Increase Docker memory limits** if using Docker Desktop:
   ```bash theme={null}
   docker build --memory=4g .
   ```

### Claude Desktop overrides the `claude` command on Windows

If you installed an older version of Claude Desktop, it may register a `Claude.exe` in the `WindowsApps` directory that takes PATH priority over Claude Code CLI. Running `claude` opens the Desktop app instead of the CLI.

Update Claude Desktop to the latest version to fix this issue.

### Claude Code on Windows requires either Git for Windows (for bash) or PowerShell

Git for Windows is optional. Claude Code uses the [PowerShell tool](/docs/en/tools-reference#powershell-tool) when Git Bash is absent, so this error means neither shell was found.

**If PowerShell is missing from your PATH**, its default location is `C:\Windows\System32\WindowsPowerShell\v1.0\`. Add that directory to your `PATH`, or install [PowerShell 7](https://aka.ms/powershell), which provides `pwsh`.

**To install Git for Windows instead**, download it from [git-scm.com/downloads/win](https://git-scm.com/downloads/win). During setup, select "Add to PATH." Restart your terminal after installing. Installing it enables the Bash tool, useful when working with Bash-based scripts and tooling.

**If Git is already installed** but Claude Code can't find it, set the path in your [settings.json file](/docs/en/settings):

```json theme={null}
{
  "env": {
    "CLAUDE_CODE_GIT_BASH_PATH": "C:\\Program Files\\Git\\bin\\bash.exe"
  }
}
```

If your Git is installed somewhere else, find the path by running `where.exe git` in PowerShell and use the `bin\bash.exe` path from that directory.

### Claude Code does not support 32-bit Windows

Windows includes two PowerShell entries in the Start menu: `Windows PowerShell` and `Windows PowerShell (x86)`. The x86 entry runs as a 32-bit process and triggers this error even on a 64-bit machine. To check which case you're in, run this in the same window that produced the error:

```powershell theme={null}
[Environment]::Is64BitOperatingSystem
```

If this prints `True`, your operating system is fine. Close the window, open `Windows PowerShell` without the x86 suffix, and run the install command again.

If this prints `False`, you are on a 32-bit edition of Windows. Claude Code requires a 64-bit operating system. See the [system requirements](/docs/en/setup#system-requirements).

### Linux musl or glibc binary mismatch

If you see errors about missing shared libraries like `libstdc++.so.6` or `libgcc_s.so.1` after installation, the installer may have downloaded the wrong binary variant for your system.

```text theme={null}
Error loading shared library libstdc++.so.6: No such file or directory
```

This can happen on glibc-based systems that have musl cross-compilation packages installed, causing the installer to misdetect the system as musl.

**Solutions:**

1. **Check which libc your system uses**:
   ```bash theme={null}
   ldd --version 2>&1 | head -1
   ```
   Output mentioning `GNU libc` or `GLIBC` means glibc. Output mentioning `musl` means musl.

2. **If you're on glibc but got the musl binary**, remove the installation and reinstall. You can also manually download the correct binary using the manifest at `https://downloads.claude.ai/claude-code-releases/{VERSION}/manifest.json`. File a [GitHub issue](https://github.com/anthropics/claude-code/issues) with the output of `ldd --version` and `ls /lib/libc.musl*`.

3. **If you're actually on musl**, such as Alpine Linux, install the required packages:
   ```bash theme={null}
   apk add libgcc libstdc++ ripgrep
   ```

### `Illegal instruction`

If running `claude` or the installer prints `Illegal instruction`, the native binary uses CPU instructions your processor doesn't support. There are two distinct causes.

**Architecture mismatch.** The installer downloaded the wrong binary, for example x86 on an ARM server. Check with `uname -m` on macOS or Linux, or `$env:PROCESSOR_ARCHITECTURE` in PowerShell. If the result doesn't match the binary you received, [file a GitHub issue](https://github.com/anthropics/claude-code/issues) with the output.

**Missing AVX instruction set.** If your architecture is correct but you still see `Illegal instruction`, your CPU likely lacks AVX or another instruction the binary requires. This affects roughly pre-2013 Intel and AMD processors, and virtual machines where the hypervisor does not pass AVX through to the guest.

On a VPS or VM, run `grep -m1 -ow avx /proc/cpuinfo`; an empty result means AVX is not available to the guest.

There is no native-binary workaround; track [issue #50384](https://github.com/anthropics/claude-code/issues/50384) for status, and include your CPU model from `grep -m1 "model name" /proc/cpuinfo` on Linux or `sysctl -n machdep.cpu.brand_string` on macOS when reporting.

Alternative install methods download the same native binary and won't resolve either cause.

### `dyld: cannot load` on macOS

If you see `dyld: cannot load`, `dyld: Symbol not found`, or `Abort trap: 6` during installation, the binary is incompatible with your macOS version or hardware.

```text theme={null}
dyld: cannot load 'claude-2.1.42-darwin-x64' (load command 0x80000034 is unknown)
Abort trap: 6
```

A `Symbol not found` error that references `libicucore` also indicates your macOS version is older than the binary supports:

```text theme={null}
dyld: Symbol not found: _ubrk_clone
  Referenced from: claude-darwin-x64 (which was built for Mac OS X 13.0)
  Expected in: /usr/lib/libicucore.A.dylib
```

**Solutions:**

1. **Check your macOS version**: Claude Code requires macOS 13.0 or later. Open the Apple menu and select About This Mac to check your version.

2. **Update macOS** if you're on an older version. The binary uses load commands and system libraries that older macOS versions don't support. Alternative install methods like Homebrew download the same binary and won't resolve this error.

### `Exec format error` on WSL1

If running `claude` in WSL prints `cannot execute binary file: Exec format error`, you're on WSL1 and hitting a known native-binary regression tracked in [issue #38788](https://github.com/anthropics/claude-code/issues/38788). The binary's program headers changed in a way WSL1's loader can't handle.

The cleanest fix is to convert your distribution to WSL2 from PowerShell:

```powershell theme={null}
wsl --set-version <DistroName> 2
```

If you need to stay on WSL1, invoke the binary through the dynamic linker. Add this function to `~/.bashrc` inside WSL, replacing the path if your home directory differs:

```bash theme={null}
claude() {
  /lib64/ld-linux-x86-64.so.2 "$(readlink -f "$HOME/.local/bin/claude")" "$@"
}
```

Then run `source ~/.bashrc` and retry `claude`.

### npm install errors in WSL

These issues apply if you installed Claude Code with `npm install -g` inside WSL. If you used the [native installer](/docs/en/setup), skip this section.

**OS or platform detection issues.** If npm reports a platform mismatch during install, WSL is likely picking up the Windows `npm`. Run `npm config set os linux` first, then install with `npm install -g @anthropic-ai/claude-code --force`. Do not use `sudo`.

**`exec: node: not found` when running `claude`.** Your WSL environment is likely using the Windows installation of Node.js. Confirm with `which npm` and `which node`: paths starting with `/mnt/c/` are Windows binaries, while Linux paths start with `/usr/`. To fix this, install Node via your Linux distribution's package manager or via [`nvm`](https://github.com/nvm-sh/nvm).

**nvm version conflicts.** If you have nvm installed in both WSL and Windows, switching Node versions in WSL may break because WSL imports the Windows PATH by default and the Windows nvm takes priority. The most common cause is that nvm isn't loaded in your shell. Add the nvm loader to `~/.bashrc` or `~/.zshrc`:

```bash theme={null}
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

Or load it in your current session:

```bash theme={null}
source ~/.nvm/nvm.sh
```

If nvm is loaded but Windows paths still take priority, prepend your Linux Node path explicitly:

```bash theme={null}
export PATH="$HOME/.nvm/versions/node/$(node -v)/bin:$PATH"
```

<Warning>
  Avoid disabling Windows PATH importing via `appendWindowsPath = false` as this breaks the ability to call Windows executables from WSL. Similarly, avoid uninstalling Node.js from Windows if you use it for Windows development.
</Warning>

### Permission errors during installation

If the native installer fails with permission errors, the target directory may not be writable. See [Check directory permissions](#check-directory-permissions).

If you previously installed with npm and are hitting npm-specific permission errors, switch to the native installer:

```bash theme={null}
curl -fsSL https://claude.ai/install.sh | bash
```

### Native binary not found after npm install

The `@anthropic-ai/claude-code` npm package pulls in the native binary through a per-platform optional dependency such as `@anthropic-ai/claude-code-darwin-arm64`. If running `claude` after install prints `Could not find native binary package "@anthropic-ai/claude-code-<platform>"`, check the following causes:

* **Optional dependencies are disabled.** Remove `--omit=optional` from your npm install command, `--no-optional` from pnpm, or `--ignore-optional` from yarn, and check that `.npmrc` does not set `optional=false`. Then reinstall. The native binary is delivered only as an optional dependency, so there is no JavaScript fallback if it is skipped.
* **Unsupported platform.** Prebuilt binaries are published for `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `linux-x64-musl`, `linux-arm64-musl`, `win32-x64`, and `win32-arm64`. Claude Code does not ship a binary for other platforms; see the [system requirements](/docs/en/setup#system-requirements).
* **Corporate npm mirror is missing the platform packages.** Ensure your registry mirrors all eight `@anthropic-ai/claude-code-*` platform packages in addition to the meta package.

Installing with `--ignore-scripts` does not trigger this error. The postinstall step that links the binary into place is skipped, so Claude Code falls back to a wrapper that locates and spawns the platform binary on each launch. This works but starts more slowly; reinstall with scripts enabled for direct execution.

## Login and authentication

These sections address login failures, OAuth errors, and token issues.

### Reset your login

When login fails and the cause isn't obvious, a clean re-authentication resolves most cases:

1. Run `/logout` to sign out completely
2. Close Claude Code
3. Restart with `claude` and complete the authentication process again

If the browser doesn't open automatically during login, press `c` to copy the OAuth URL to your clipboard, then paste it into a browser manually. This also works when the URL wraps across lines in a narrow or SSH terminal and can't be clicked directly.

### OAuth error: Invalid code

If you see `OAuth error: Invalid code. Please make sure the full code was copied`, the login code expired or was truncated during copy-paste.

**Solutions:**

* Press Enter to retry and complete the login quickly after the browser opens
* Type `c` to copy the full URL if the browser doesn't open automatically
* If using a remote/SSH session, the browser may open on the wrong machine. Copy the URL displayed in the terminal and open it in your local browser instead.

### 403 Forbidden after login

If you see `API Error: 403 {"error":{"type":"forbidden","message":"Request not allowed"}}` after logging in:

* **Claude Pro/Max users**: verify your subscription is active at [claude.ai/settings](https://claude.ai/settings)
* **Anthropic Console users**: confirm your account has the "Claude Code" or "Developer" role. Admins assign this in the Anthropic Console under Settings → Members.
* **Behind a proxy**: corporate proxies can interfere with API requests. See [network configuration](/docs/en/network-config) for proxy setup.

### This organization has been disabled with an active subscription

If you see `API Error: 400 ... "This organization has been disabled"` despite having an active Claude subscription, an `ANTHROPIC_API_KEY` environment variable is overriding your subscription. This commonly happens when an old API key from a previous employer or project is still set in your shell profile.

When `ANTHROPIC_API_KEY` is present and you have approved it, Claude Code uses that key instead of your subscription's OAuth credentials. In non-interactive mode with the `-p` flag, the key is always used when present. See [authentication precedence](/docs/en/authentication#authentication-precedence) for the full resolution order.

To use your subscription instead, unset the environment variable and remove it from your shell profile:

```bash theme={null}
unset ANTHROPIC_API_KEY
claude
```

Check `~/.zshrc`, `~/.bashrc`, or `~/.profile` for `export ANTHROPIC_API_KEY=...` lines and remove them to make the change permanent. On Windows, check your PowerShell profile at `$PROFILE` and your User environment variables for `ANTHROPIC_API_KEY`. Run `/status` inside Claude Code to confirm which authentication method is active.

### OAuth login fails in WSL2, SSH, or containers

When Claude Code runs in WSL2, on a remote machine over SSH, or inside a container, the browser usually opens on a different host and its redirect can't reach Claude Code's local callback server. After you sign in, the browser shows a login code instead of redirecting back automatically. Paste that code into the terminal at the `Paste code here if prompted` prompt to complete login.

If the browser doesn't open at all from WSL2, set the `BROWSER` environment variable to your Windows browser path:

```bash theme={null}
export BROWSER="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
claude
```

Alternatively, press `c` at the interactive login prompt to copy the OAuth URL, or copy the URL that `claude auth login` prints, and open it in a browser on your local machine.

If pasting the code into the interactive prompt does nothing, your terminal's paste binding likely isn't reaching the input field. Try your terminal's alternate paste shortcut, often right-click or Shift+Insert in Windows Terminal, or use `claude auth login` instead, which reads the pasted code from standard input:

```bash theme={null}
claude auth login
```

This fallback also applies on native Windows or any terminal where pasting into the interactive prompt fails.

### Not logged in or token expired

If Claude Code prompts you to log in again after a session, your OAuth token may have expired.

Run `/login` to re-authenticate. If this happens frequently, check that your system clock is accurate, as token validation depends on correct timestamps.

On macOS, login can also fail when the Keychain is locked or its password is out of sync with your account password, which prevents Claude Code from saving credentials. Run `claude doctor` to check Keychain access. To unlock the Keychain manually, run `security unlock-keychain ~/Library/Keychains/login.keychain-db`. If unlocking doesn't help, open Keychain Access, select the `login` keychain, and choose Edit > Change Password for Keychain "login" to resync it with your account password.

### Bedrock, Vertex, or Foundry credentials not loading

If you configured Claude Code to use a cloud provider and see `Could not load credentials from any providers` on Bedrock, `Could not load the default credentials` on Vertex, or `ChainedTokenCredential authentication failed` on Foundry, your cloud provider CLI is likely not authenticated in the current shell.

For Bedrock, confirm your AWS credentials are valid:

```bash theme={null}
aws sts get-caller-identity
```

For Vertex AI, confirm `ANTHROPIC_VERTEX_PROJECT_ID` and `CLOUD_ML_REGION` are set in your shell, then set application default credentials:

```bash theme={null}
gcloud auth application-default login
```

For Microsoft Foundry, confirm `ANTHROPIC_FOUNDRY_API_KEY` is set, or sign in with the Azure CLI so the default credential chain can find your account:

```bash theme={null}
az login
```

If credentials work in your terminal but not in the VS Code or JetBrains extension, the IDE process likely didn't inherit your shell environment. Set the provider environment variables in the IDE's own settings, or launch the IDE from a terminal where they're already exported.

See [Amazon Bedrock](/docs/en/amazon-bedrock), [Google Vertex AI](/docs/en/google-vertex-ai), or [Microsoft Foundry](/docs/en/microsoft-foundry) for full provider setup.

## Still stuck

If none of the above resolves your issue:

1. Check the [GitHub repository](https://github.com/anthropics/claude-code/issues) for known issues, or open a new one with your operating system, the install command you ran, and the full error output
2. If `claude --version` works but something else is wrong, run `claude doctor` for an automated diagnostic report
3. If you can start a session, use `/feedback` inside Claude Code to report the problem


---

## Get started with Claude Code on the web

`https://code.claude.com/docs/en/web-quickstart`

Run Claude Code in the cloud from your browser or phone. Connect a GitHub repository, submit a task, and review the PR without local setup.

<Note>
  Claude Code on the web is in research preview for Pro, Max, and Team users, and for Enterprise users with premium seats or Chat + Claude Code seats.
</Note>

Claude Code on the web runs on Anthropic-managed cloud infrastructure instead of your machine. Submit tasks from [claude.ai/code](https://claude.ai/code) in your browser or the Claude mobile app.

You'll need a GitHub repository to [get started](#connect-github-and-create-an-environment). Claude clones it into an isolated virtual machine, makes changes, and pushes a branch for you to review. Sessions persist across devices, so a task you start on your laptop is ready to review from your phone later.

Claude Code on the web works well for:

* **Parallel tasks**: run several independent tasks at once, each in its own session and branch, without managing multiple worktrees
* **Repos you don't have locally**: Claude clones the repo fresh every session, so you don't need it checked out
* **Tasks that don't need frequent steering**: submit a well-defined task, do something else, and review the result when Claude is done
* **Code questions and exploration**: understand a codebase or trace how a feature is implemented without a local checkout

For work that needs your local config, tools, or environment, running Claude Code locally or using [Remote Control](/docs/en/remote-control) is a better fit.

## How sessions run

When you submit a task:

1. **Clone and prepare**: your repository is cloned to an Anthropic-managed VM, and your [setup script](/docs/en/claude-code-on-the-web#setup-scripts) runs if configured.
2. **Configure network**: internet access is set based on your environment's [access level](/docs/en/claude-code-on-the-web#access-levels).
3. **Work**: Claude analyzes code, makes changes, runs tests, and checks its work. You can watch and steer throughout, or step away and come back when it's done.
4. **Push the branch**: when Claude reaches a stopping point, it pushes its branch to GitHub. You review the diff, leave inline comments, create a PR, or send another message to keep going.

The session doesn't close when the branch is pushed. PR creation and further edits all happen within the same conversation.

## Compare ways to run Claude Code

Claude Code behaves the same everywhere. What changes is where code executes and whether your local config is available. The Desktop app offers both local and cloud sessions, so its answers below depend on which you choose:

|                                              | On the web                                                                                                      | Remote Control               | Terminal CLI           | Desktop app                 |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------- | :--------------------- | :-------------------------- |
| **Code runs on**                             | Anthropic cloud VM                                                                                              | Your machine                 | Your machine           | Your machine or cloud VM    |
| **You chat from**                            | claude.ai or mobile app                                                                                         | claude.ai or mobile app      | Your terminal          | The Desktop UI              |
| **Uses your local config**                   | No, repo only                                                                                                   | Yes                          | Yes                    | Yes for local, no for cloud |
| **Requires GitHub**                          | Yes, or [bundle a local repo](/docs/en/claude-code-on-the-web#send-local-repositories-without-github) via `--remote` | No                           | No                     | Only for cloud sessions     |
| **Keeps running if you disconnect**          | Yes                                                                                                             | While terminal stays open    | No                     | Depends on session type     |
| **[Permission modes](/docs/en/permission-modes)** | Auto accept edits, Plan                                                                                         | Ask, Auto accept edits, Plan | All modes              | Depends on session type     |
| **Network access**                           | Configurable per environment                                                                                    | Your machine's network       | Your machine's network | Depends on session type     |

See the [terminal quickstart](/docs/en/quickstart), [Desktop app](/docs/en/desktop), or [Remote Control](/docs/en/remote-control) docs to set those up.

## Connect GitHub and create an environment

Setup is a one-time process. If you already use the GitHub CLI, you can [do this from your terminal](#connect-from-your-terminal) instead of the browser.

<Steps>
  <Step title="Visit claude.ai/code">
    Go to [claude.ai/code](https://claude.ai/code) and sign in with your Anthropic account.
  </Step>

  <Step title="Install the Claude GitHub App">
    After signing in, claude.ai/code prompts you to connect GitHub. Follow the prompt to install the Claude GitHub App and grant it access to your repositories. Cloud sessions work with existing GitHub repositories, so to start a new project, [create an empty repository on GitHub](https://github.com/new) first.
  </Step>

  <Step title="Create your environment">
    After connecting GitHub, you'll be prompted to create a cloud environment. The environment controls what network access Claude has during sessions and what runs when a new session is created. See [Installed tools](/docs/en/claude-code-on-the-web#installed-tools) for what's available without any configuration.

    The form has these fields:

    * **Name**: a display label. Useful when you have multiple environments for different projects or access levels.
    * **Network access**: controls what the session can reach on the internet. The default, `Trusted`, allows connections to [common package registries](/docs/en/claude-code-on-the-web#default-allowed-domains) like npm, PyPI, and RubyGems while blocking general internet access.
    * **Environment variables**: optional variables available in every session, in `.env` format. Don't wrap values in quotes, since quotes are stored as part of the value. These are visible to anyone who can edit this environment.
    * **Setup script**: an optional Bash script that runs before Claude Code launches. Use it to install system tools the cloud VM doesn't include, like `apt install -y gh`. The result is [cached](/docs/en/claude-code-on-the-web#environment-caching), so the script doesn't re-run on every session. See [Setup scripts](/docs/en/claude-code-on-the-web#setup-scripts) for examples and debugging tips.

    For a first project, leave the defaults and click **Create environment**. You can [edit it later or create additional environments](/docs/en/claude-code-on-the-web#configure-your-environment) for different projects.
  </Step>
</Steps>

### Connect from your terminal

If you already use the GitHub CLI (`gh`), you can set up Claude Code on the web without opening a browser. This requires the [Claude Code CLI](/docs/en/quickstart). `/web-setup` reads your local `gh` token, links it to your Claude account, and creates a default cloud environment if you don't have one.

<Note>
  Organizations with [Zero Data Retention](/docs/en/zero-data-retention) enabled cannot use `/web-setup` or other cloud session features. If the GitHub CLI isn't installed or authenticated, `/web-setup` opens the browser onboarding flow instead.
</Note>

<Steps>
  <Step title="Authenticate with the GitHub CLI">
    In your shell, authenticate the GitHub CLI if you haven't already:

    ```bash theme={null}
    gh auth login
    ```
  </Step>

  <Step title="Sign in to Claude">
    In the Claude Code CLI, run `/login` to sign in with your claude.ai account. Skip this step if you're already signed in.
  </Step>

  <Step title="Run /web-setup">
    In the Claude Code CLI, run:

    ```text theme={null}
    /web-setup
    ```

    This syncs your `gh` token to your Claude account. If you don't have a cloud environment yet, `/web-setup` creates one with Trusted network access and no setup script. You can [edit the environment or add variables](/docs/en/claude-code-on-the-web#configure-your-environment) afterward. Once `/web-setup` completes, you can start cloud sessions from your terminal with [`--remote`](/docs/en/claude-code-on-the-web#from-terminal-to-web) or set up recurring tasks with [`/schedule`](/docs/en/routines).
  </Step>
</Steps>

## Start a task

With GitHub connected and an environment created, you're ready to submit tasks.

<Steps>
  <Step title="Select a repository and branch">
    From [claude.ai/code](https://claude.ai/code) or the Code tab in the Claude mobile app, click the repository selector below the input box and choose a repository for Claude to work in. Each repository shows a branch selector. Change it to start Claude from a feature branch instead of the default. You can add multiple repositories to work across them in one session.
  </Step>

  <Step title="Choose a permission mode">
    The mode dropdown next to the input defaults to **Auto accept edits**, where Claude makes changes and pushes a branch without stopping for approval. Switch to **Plan mode** if you want Claude to propose an approach and wait for your go-ahead before editing files. Cloud sessions don't offer Ask permissions, Auto mode, or Bypass permissions. See [Permission modes](/docs/en/permission-modes) for the full list.
  </Step>

  <Step title="Describe the task and submit">
    Type a description of what you want and press Enter. Be specific:

    * Name the file or function: "Add a README with setup instructions" or "Fix the failing auth test in `tests/test_auth.py`" is better than "fix tests"
    * Paste error output if you have it
    * Describe the expected behavior, not just the symptom

    Claude clones the repositories, runs your setup script if configured, and starts working. Each task gets its own session and its own branch, so you don't need to wait for one to finish before starting another.
  </Step>
</Steps>

## Pre-fill sessions

You can prefill the prompt, repositories, and environment for a new session by adding query parameters to the [claude.ai/code](https://claude.ai/code) URL. Use this to build integrations such as a button in your issue tracker that opens Claude Code with the issue description as the prompt.

| Parameter      | Description                                                                                                                                                      |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`       | Prompt text to prefill in the input box. The alias `q` is also accepted.                                                                                         |
| `prompt_url`   | URL to fetch the prompt text from, for prompts too long to embed in a query string. The URL must allow cross-origin requests. Ignored when `prompt` is also set. |
| `repositories` | Comma-separated list of `owner/repo` slugs to preselect. The alias `repo` is also accepted.                                                                      |
| `environment`  | Name or ID of the [environment](#connect-github-and-create-an-environment) to preselect.                                                                         |

URL-encode each value. The example below opens the form with a prompt and a repository already selected:

```text theme={null}
https://claude.ai/code?prompt=Fix%20the%20login%20bug&repositories=acme/webapp
```

## Review and iterate

When Claude finishes, review the changes, leave feedback on specific lines, and keep going until the diff looks right.

<Steps>
  <Step title="Open the diff view">
    A diff indicator shows lines added and removed across the session, for example `+42 -18`. Select it to open the diff view, with a file list on the left and changes on the right.
  </Step>

  <Step title="Leave inline comments">
    Select any line in the diff, type your feedback, and press Enter. Comments queue up until you send your next message, then they're bundled with it. Claude sees "at `src/auth.ts:47`, don't catch the error here" alongside your main instruction, so you don't have to describe where the problem is.
  </Step>

  <Step title="Create a pull request">
    When the diff looks right, select **Create PR** at the top of the diff view. You can open it as a full PR, a draft, or jump to GitHub's compose page with a generated title and description.
  </Step>

  <Step title="Keep iterating after the PR">
    The session stays live after the PR is created. Paste CI failure output or reviewer comments into the chat and ask Claude to address them. To have Claude monitor the PR automatically, see [Auto-fix pull requests](/docs/en/claude-code-on-the-web#auto-fix-pull-requests).
  </Step>
</Steps>

## Troubleshoot setup

### No repositories appear after connecting GitHub

A cloud session can use any repository the connected GitHub account can see, regardless of which repositories the Claude GitHub App is installed on. If a repository is missing, verify the connected GitHub account has access to it on GitHub. If you also want [Auto-fix](/docs/en/claude-code-on-the-web#auto-fix-pull-requests) for a repository, install the App on it: on github.com, open **Settings → Applications → Claude → Configure** and verify the repository is listed under **Repository access**. Private repositories need the same authorization as public ones.

### The page only shows a GitHub login button

Cloud sessions require a connected GitHub account. Connect via the browser flow above, or run `/web-setup` from your terminal if you use the GitHub CLI. If you'd rather not connect GitHub at all, see [Remote Control](/docs/en/remote-control) to run Claude Code on your own machine and monitor it from the web.

### "Not available for the selected organization"

Enterprise organizations may need an admin to enable Claude Code on the web. Contact your Anthropic account team.

### `/web-setup` returns "Unknown command"

`/web-setup` runs inside the Claude Code CLI, not your shell. Launch `claude` first, then type `/web-setup` at the prompt.

If you typed it inside Claude Code and still see the error, your CLI is older than v2.1.80 or you're authenticated with an API key or third-party provider instead of a claude.ai subscription. Run `claude update`, then `/login` to sign in with your claude.ai account.

### "Could not create a cloud environment" or "No cloud environment available" when using `--remote` or ultraplan

Remote-session features create a default cloud environment automatically if you don't have one. If you see "Could not create a cloud environment", automatic creation failed. If you see "No cloud environment available", your CLI predates automatic creation. In either case, run `/web-setup` in the Claude Code CLI to create one manually, or visit [claude.ai/code](https://claude.ai/code) and follow the **Create your environment** step above.

### Setup script failed

The setup script exited with a non-zero status, which blocks the session from starting. Common causes:

* A package install failed because the registry isn't in your [network access level](/docs/en/claude-code-on-the-web#access-levels). `Trusted` covers most package managers; `None` blocks them all.
* The script references a file or path that doesn't exist in a fresh clone.
* A command that works locally needs a different invocation on Ubuntu.

To debug, add `set -x` at the top of the script to see which command failed. For non-critical commands, append `|| true` so they don't block session start.

### New sessions hang or time out during setup

If new sessions stall on the setup script step or fail with a generic container error before the script finishes, the script is likely exceeding the roughly five-minute time budget for building the [environment cache](/docs/en/claude-code-on-the-web#environment-caching). Heavy steps such as pulling large Docker images, syncing full dependency trees, or downloading model weights often push the total over the limit, especially when they run one after another.

To fix this, trim the script so it reliably finishes in under five minutes:

* Run independent installs in parallel with `&` and a final `wait` instead of running them serially.
* Move the largest downloads out of the setup script and into a [SessionStart hook](/docs/en/claude-code-on-the-web#setup-scripts-vs-sessionstart-hooks) that launches them in the background, so the session becomes usable while they finish.
* Remove long retry sleeps from the setup script, since a stalled retry loop counts against the budget.

### Session keeps running after closing the tab

This is by design. Closing the tab or navigating away doesn't stop the session. It continues running in the background until Claude finishes the current task, then idles. From the sidebar, you can [archive a session](/docs/en/claude-code-on-the-web#archive-sessions) to hide it from your list, or [delete it](/docs/en/claude-code-on-the-web#delete-sessions) to remove it permanently.

## Next steps

Now that you can submit and review tasks, these pages cover what comes next: starting cloud sessions from your terminal, scheduling recurring work, and giving Claude standing instructions.

* [Use Claude Code on the web](/docs/en/claude-code-on-the-web): the full reference, including teleporting sessions to your terminal, setup scripts, environment variables, and network config
* [Routines](/docs/en/routines): automate work on a schedule, via API call, or in response to GitHub events
* [CLAUDE.md](/docs/en/memory): give Claude persistent instructions and context that load at the start of every session
* Install the Claude mobile app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) or [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) to monitor sessions from your phone. From the Claude Code CLI, `/mobile` shows a QR code.


---

## Get started with the desktop app

`https://code.claude.com/docs/en/desktop-quickstart`

Install Claude Code on desktop and start your first coding session

The desktop app gives you Claude Code with a graphical interface built for running multiple sessions side by side: a sidebar for managing parallel work, a drag-and-drop layout with an integrated terminal and file editor, visual diff review, live app preview, GitHub PR monitoring with auto-merge, and scheduled tasks. No terminal required.

<CardGroup>
  <Card title="Download for macOS" icon="apple" href="https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code&utm_medium=docs">
    Universal build for Intel and Apple Silicon
  </Card>

  <Card title="Download for Windows" icon="windows" href="https://claude.ai/api/desktop/win32/x64/setup/latest/redirect?utm_source=claude_code&utm_medium=docs">
    For x64 processors
  </Card>
</CardGroup>

For Windows ARM64, download the [ARM64 installer](https://claude.ai/api/desktop/win32/arm64/setup/latest/redirect?utm_source=claude_code\&utm_medium=docs). The desktop app is not available on Linux; use the [CLI](/docs/en/quickstart) instead.

<Note>
  Claude Code requires a [Pro, Max, Team, or Enterprise subscription](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=desktop_quickstart_pricing).
</Note>

This page walks through installing the app and starting your first session. If you're already set up, see [Use Claude Code Desktop](/docs/en/desktop) for the full reference.

The desktop app has three tabs:

* **Chat**: General conversation with no file access, similar to claude.ai.
* **Cowork**: An autonomous background agent that works on tasks in a cloud VM with its own environment. It can run independently while you do other work.
* **Code**: An interactive coding assistant with direct access to your local files. You review and approve each change in real time.

Chat and Cowork are covered in the [Claude Desktop support articles](https://support.claude.com/en/collections/16163169-claude-desktop). This page focuses on the **Code** tab.

## Install

<Steps>
  <Step title="Install and sign in">
    Download the installer for your platform from the links above and run it. Launch Claude from your Applications folder on macOS or the Start menu on Windows, then sign in with your Anthropic account.
  </Step>

  <Step title="Open the Code tab">
    Click the **Code** tab at the top center. If clicking Code prompts you to upgrade, you need to [subscribe to a paid plan](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=desktop_quickstart_upgrade) first. If it prompts you to sign in online, complete the sign-in and restart the app. If you see a 403 error, see [authentication troubleshooting](/docs/en/desktop#403-or-authentication-errors-in-the-code-tab).
  </Step>
</Steps>

The desktop app includes Claude Code. You don't need to install Node.js or the CLI separately. To use `claude` from the terminal, install the CLI separately. See [Get started with the CLI](/docs/en/quickstart).

## Start your first session

With the Code tab open, choose a project and give Claude something to do.

<Steps>
  <Step title="Choose an environment and folder">
    Select **Local** to run Claude on your machine using your files directly. Click **Select folder** and choose your project directory.

    <Tip>
      Start with a small project you know well. It's the fastest way to see what Claude Code can do. On Windows, [Git](https://git-scm.com/downloads/win) must be installed for local sessions to work. Most Macs include Git by default.
    </Tip>

    You can also select:

    * **Remote**: Run sessions on Anthropic's cloud infrastructure that continue even if you close the app. Remote sessions use the same infrastructure as [Claude Code on the web](/docs/en/claude-code-on-the-web).
    * **SSH**: Connect to a remote machine over SSH, such as your own servers, cloud VMs, or dev containers. Desktop installs Claude Code on the remote machine automatically the first time you connect.
  </Step>

  <Step title="Choose a model">
    Select a model from the dropdown next to the send button. See [models](/docs/en/model-config#available-models) for a comparison of Opus, Sonnet, and Haiku. You can change the model later from the same dropdown.
  </Step>

  <Step title="Tell Claude what to do">
    Type what you want Claude to do:

    * `Find a TODO comment and fix it`
    * `Add tests for the main function`
    * `Create a CLAUDE.md with instructions for this codebase`

    A [session](/docs/en/desktop#work-in-parallel-with-sessions) is a conversation with Claude about your code. Each session tracks its own context and changes, so you can work on multiple tasks without them interfering with each other.
  </Step>

  <Step title="Review and accept changes">
    By default, the Code tab starts in [Ask permissions mode](/docs/en/desktop#choose-a-permission-mode), where Claude proposes changes and waits for your approval before applying them. You'll see:

    1. A [diff view](/docs/en/desktop#review-changes-with-diff-view) showing exactly what will change in each file
    2. Accept/Reject buttons to approve or decline each change
    3. Real-time updates as Claude works through your request

    If you reject a change, Claude will ask how you'd like to proceed differently. Your files aren't modified until you accept.
  </Step>
</Steps>

## Now what?

You've made your first edit. For the full reference on everything Desktop can do, see [Use Claude Code Desktop](/docs/en/desktop). Here are some things to try next.

**Interrupt and steer.** You can redirect Claude at any point. Click the stop button to interrupt immediately, or type a correction and press **Enter** to send it without stopping the running action. Either way, you don't have to wait for it to finish or start over.

**Give Claude more context.** Type `@filename` in the prompt box to pull a specific file into the conversation, attach images and PDFs using the attachment button, or drag and drop files directly into the prompt. The more context Claude has, the better the results. See [Add files and context](/docs/en/desktop#add-files-and-context-to-prompts).

**Use skills for repeatable tasks.** Type `/` or click **+** → **Slash commands** to browse [built-in commands](/docs/en/commands), [custom skills](/docs/en/skills), and plugin skills. Skills are reusable prompts you can invoke whenever you need them, like code review checklists or deployment steps.

**Review changes before committing.** After Claude edits files, a `+12 -1` indicator appears. Click it to open the [diff view](/docs/en/desktop#review-changes-with-diff-view), review modifications file by file, and comment on specific lines. Claude reads your comments and revises. Click **Review code** to have Claude evaluate the diffs itself and leave inline suggestions.

**Adjust how much control you have.** Your [permission mode](/docs/en/desktop#choose-a-permission-mode) controls the balance. Ask permissions (default) requires approval before every edit. Auto accept edits auto-accepts file edits for faster iteration. Plan mode lets Claude map out an approach without touching any files, which is useful before a large refactor.

**Add plugins for more capabilities.** Click the **+** button next to the prompt box and select **Plugins** to browse and install [plugins](/docs/en/desktop#install-plugins) that add skills, agents, MCP servers, and more.

**Arrange your workspace.** Drag the chat, diff, terminal, file, and preview panes into whatever layout you want. Open the terminal with **Ctrl+\`** to run commands alongside your session, or click a file path to open it in the file pane. See [Arrange your workspace](/docs/en/desktop#arrange-your-workspace).

**Preview your app.** Click the **Preview** dropdown to run your dev server directly in the desktop. Claude can view the running app, test endpoints, inspect logs, and iterate on what it sees. See [Preview your app](/docs/en/desktop#preview-your-app).

**Track your pull request.** After opening a PR, Claude Code monitors CI check results and can automatically fix failures or merge the PR once all checks pass. See [Monitor pull request status](/docs/en/desktop#monitor-pull-request-status).

**Put Claude on a schedule.** Set up [scheduled tasks](/docs/en/desktop-scheduled-tasks) to run Claude automatically on a recurring basis: a daily code review every morning, a weekly dependency audit, or a briefing that pulls from your connected tools.

**Scale up when you're ready.** Open [parallel sessions](/docs/en/desktop#work-in-parallel-with-sessions) from the sidebar to work on multiple tasks at once, each in its own Git worktree, and open the [tasks pane](/docs/en/desktop#watch-background-tasks) to watch the subagents and background commands a session has running. Open a [side chat](/docs/en/desktop#ask-a-side-question-without-derailing-the-session) to ask a question without derailing the main thread. Send [long-running work to the cloud](/docs/en/desktop#run-long-running-tasks-remotely) so it continues even if you close the app, or [continue a session on the web or in your IDE](/docs/en/desktop#continue-in-another-surface) if a task takes longer than expected. [Connect external tools](/docs/en/desktop#extend-claude-code) like GitHub, Slack, and Linear to bring your workflow together.

## Coming from the CLI?

Desktop runs the same engine as the CLI with a graphical interface. You can run both simultaneously on the same project, and they share configuration (CLAUDE.md files, MCP servers, hooks, skills, and settings). For a full comparison of features, flag equivalents, and what's not available in Desktop, see [CLI comparison](/docs/en/desktop#coming-from-the-cli).

## What's next

* [Use Claude Code Desktop](/docs/en/desktop): permission modes, parallel sessions, diff view, connectors, and enterprise configuration
* [Troubleshooting](/docs/en/desktop#troubleshooting): solutions to common errors and setup issues
* [Best practices](/docs/en/best-practices): tips for writing effective prompts and getting the most out of Claude Code
* [Common workflows](/docs/en/common-workflows): tutorials for debugging, refactoring, testing, and more
