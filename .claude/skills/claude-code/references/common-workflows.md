# Common Workflows & Best Practices

_Claude Code documentation — Common Workflows & Best Practices. Source: https://code.claude.com/docs/en/_


---

## Common workflows

`https://code.claude.com/docs/en/common-workflows`

Step-by-step guides for exploring codebases, fixing bugs, refactoring, testing, and other everyday tasks with Claude Code.

This page collects short recipes for everyday development. For higher-level guidance on prompting and context management, see [Best practices](/docs/en/best-practices).

This page covers:

* [Prompt recipes](#prompt-recipes) for exploring code, fixing bugs, refactoring, testing, PRs, and documentation
* [Resume previous conversations](#resume-previous-conversations) so a task can span multiple sittings
* [Run parallel sessions with worktrees](#run-parallel-sessions-with-worktrees) so concurrent edits don't collide
* [Plan before editing](#plan-before-editing) to review changes before they touch disk
* [Delegate research to subagents](#delegate-research-to-subagents) to keep your main context clean
* [Pipe Claude into scripts](#pipe-claude-into-scripts) for CI and batch processing

## Prompt recipes

These are prompt patterns for everyday tasks like exploring unfamiliar code, debugging, refactoring, writing tests, and creating PRs. Each works in any Claude Code surface; adapt the wording to your project.

### Understand new codebases

For configuring Claude Code in a monorepo or large codebase, see [Monorepos and large repos](/docs/en/large-codebases).

#### Get a quick codebase overview

Suppose you've just joined a new project and need to understand its structure quickly.

<Steps>
  <Step title="Navigate to the project root directory">
    ```bash theme={null}
    cd /path/to/project 
    ```
  </Step>

  <Step title="Start Claude Code">
    ```bash theme={null}
    claude 
    ```
  </Step>

  <Step title="Ask for a high-level overview">
    ```text theme={null}
    give me an overview of this codebase
    ```
  </Step>

  <Step title="Dive deeper into specific components">
    ```text theme={null}
    explain the main architecture patterns used here
    ```

    ```text theme={null}
    what are the key data models?
    ```

    ```text theme={null}
    how is authentication handled?
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Start with broad questions, then narrow down to specific areas
  * Ask about coding conventions and patterns used in the project
  * Request a glossary of project-specific terms
</Tip>

#### Find relevant code

Suppose you need to locate code related to a specific feature or functionality.

<Steps>
  <Step title="Ask Claude to find relevant files">
    ```text theme={null}
    find the files that handle user authentication
    ```
  </Step>

  <Step title="Get context on how components interact">
    ```text theme={null}
    how do these authentication files work together?
    ```
  </Step>

  <Step title="Understand the execution flow">
    ```text theme={null}
    trace the login process from front-end to database
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Be specific about what you're looking for
  * Use domain language from the project
  * Install a [code intelligence plugin](/docs/en/discover-plugins#code-intelligence) for your language to give Claude precise "go to definition" and "find references" navigation
</Tip>

***

### Fix bugs efficiently

Suppose you've encountered an error message and need to find and fix its source.

<Steps>
  <Step title="Share the error with Claude">
    ```text theme={null}
    I'm seeing an error when I run npm test
    ```
  </Step>

  <Step title="Ask for fix recommendations">
    ```text theme={null}
    suggest a few ways to fix the @ts-ignore in user.ts
    ```
  </Step>

  <Step title="Apply the fix">
    ```text theme={null}
    update user.ts to add the null check you suggested
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Tell Claude the command to reproduce the issue and get a stack trace
  * Mention any steps to reproduce the error
  * Let Claude know if the error is intermittent or consistent
</Tip>

***

### Refactor code

Suppose you need to update old code to use modern patterns and practices.

<Steps>
  <Step title="Identify legacy code for refactoring">
    ```text theme={null}
    find deprecated API usage in our codebase
    ```
  </Step>

  <Step title="Get refactoring recommendations">
    ```text theme={null}
    suggest how to refactor utils.js to use modern JavaScript features
    ```
  </Step>

  <Step title="Apply the changes safely">
    ```text theme={null}
    refactor utils.js to use ES2024 features while maintaining the same behavior
    ```
  </Step>

  <Step title="Verify the refactoring">
    ```text theme={null}
    run tests for the refactored code
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Ask Claude to explain the benefits of the modern approach
  * Request that changes maintain backward compatibility when needed
  * Do refactoring in small, testable increments
</Tip>

***

### Work with tests

Suppose you need to add tests for uncovered code.

<Steps>
  <Step title="Identify untested code">
    ```text theme={null}
    find functions in NotificationsService.swift that are not covered by tests
    ```
  </Step>

  <Step title="Generate test scaffolding">
    ```text theme={null}
    add tests for the notification service
    ```
  </Step>

  <Step title="Add meaningful test cases">
    ```text theme={null}
    add test cases for edge conditions in the notification service
    ```
  </Step>

  <Step title="Run and verify tests">
    ```text theme={null}
    run the new tests and fix any failures
    ```
  </Step>
</Steps>

Claude can generate tests that follow your project's existing patterns and conventions. When asking for tests, be specific about what behavior you want to verify. Claude examines your existing test files to match the style, frameworks, and assertion patterns already in use.

For comprehensive coverage, ask Claude to identify edge cases you might have missed. Claude can analyze your code paths and suggest tests for error conditions, boundary values, and unexpected inputs that are easy to overlook.

***

### Create pull requests

You can create pull requests by asking Claude directly ("create a pr for my changes"), or guide Claude through it step-by-step:

<Steps>
  <Step title="Summarize your changes">
    ```text theme={null}
    summarize the changes I've made to the authentication module
    ```
  </Step>

  <Step title="Generate a pull request">
    ```text theme={null}
    create a pr
    ```
  </Step>

  <Step title="Review and refine">
    ```text theme={null}
    enhance the PR description with more context about the security improvements
    ```
  </Step>
</Steps>

When you create a PR using `gh pr create`, the session is automatically linked to that PR. To return to it later, run `claude --from-pr <number>` or paste the PR URL into the [`/resume` picker](/docs/en/sessions#use-the-session-picker) search.

<Tip>
  Review Claude's generated PR before submitting and ask Claude to highlight potential risks or considerations.
</Tip>

### Handle documentation

Suppose you need to add or update documentation for your code.

<Steps>
  <Step title="Identify undocumented code">
    ```text theme={null}
    find functions without proper JSDoc comments in the auth module
    ```
  </Step>

  <Step title="Generate documentation">
    ```text theme={null}
    add JSDoc comments to the undocumented functions in auth.js
    ```
  </Step>

  <Step title="Review and enhance">
    ```text theme={null}
    improve the generated documentation with more context and examples
    ```
  </Step>

  <Step title="Verify documentation">
    ```text theme={null}
    check if the documentation follows our project standards
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Specify the documentation style you want (JSDoc, docstrings, etc.)
  * Ask for examples in the documentation
  * Request documentation for public APIs, interfaces, and complex logic
</Tip>

***

### Work in notes and non-code folders

Claude Code works in any directory. Run it inside a notes vault, a documentation folder, or any collection of markdown files to search, edit, and reorganize content the same way you would code.

The `.claude/` directory and `CLAUDE.md` sit alongside other tools' config directories without conflict. Claude reads files fresh on each tool call, so it sees edits you make in another application the next time it reads that file.

***

### Work with images

Suppose you need to work with images in your codebase, and you want Claude's help analyzing image content.

<Steps>
  <Step title="Add an image to the conversation">
    You can use any of these methods:

    1. Drag and drop an image into the Claude Code window
    2. Copy an image and paste it into the CLI with ctrl+v (Do not use cmd+v)
    3. Provide an image path to Claude. E.g., "Analyze this image: /path/to/your/image.png"
  </Step>

  <Step title="Ask Claude to analyze the image">
    ```text theme={null}
    What does this image show?
    ```

    ```text theme={null}
    Describe the UI elements in this screenshot
    ```

    ```text theme={null}
    Are there any problematic elements in this diagram?
    ```
  </Step>

  <Step title="Use images for context">
    ```text theme={null}
    Here's a screenshot of the error. What's causing it?
    ```

    ```text theme={null}
    This is our current database schema. How should we modify it for the new feature?
    ```
  </Step>

  <Step title="Get code suggestions from visual content">
    ```text theme={null}
    Generate CSS to match this design mockup
    ```

    ```text theme={null}
    What HTML structure would recreate this component?
    ```
  </Step>
</Steps>

<Tip>
  Tips:

  * Use images when text descriptions would be unclear or cumbersome
  * Include screenshots of errors, UI designs, or diagrams for better context
  * You can work with multiple images in a conversation
  * Image analysis works with diagrams, screenshots, mockups, and more
  * When Claude references images (for example, `[Image #1]`), `Cmd+Click` (Mac) or `Ctrl+Click` (Windows/Linux) the link to open the image in your default viewer
</Tip>

***

### Reference files and directories

Use @ to quickly include files or directories without waiting for Claude to read them.

<Steps>
  <Step title="Reference a single file">
    ```text theme={null}
    Explain the logic in @src/utils/auth.js
    ```

    This includes the full content of the file in the conversation.
  </Step>

  <Step title="Reference a directory">
    ```text theme={null}
    What's the structure of @src/components?
    ```

    This provides a directory listing with file information.
  </Step>

  <Step title="Reference MCP resources">
    ```text theme={null}
    Show me the data from @github:repos/owner/repo/issues
    ```

    This fetches data from connected MCP servers using the format @server:resource. See [MCP resources](/docs/en/mcp#use-mcp-resources) for details.
  </Step>
</Steps>

<Tip>
  Tips:

  * File paths can be relative or absolute
  * @ file references add `CLAUDE.md` in the file's directory and parent directories to context
  * Directory references show file listings, not contents
  * You can reference multiple files in a single message (for example, "@file1.js and @file2.js")
</Tip>

***

### Run Claude on a schedule

Suppose you want Claude to handle a task automatically on a recurring basis, like reviewing open PRs every morning, auditing dependencies weekly, or checking for CI failures overnight.

Pick a scheduling option based on where you want the task to run:

| Option                                                 | Where it runs                     | Best for                                                                                                                                                                                                 |
| :----------------------------------------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Routines](/docs/en/routines)                               | Anthropic-managed infrastructure  | Tasks that should run even when your computer is off. Can also trigger on API calls or GitHub events in addition to a schedule. Configure at [claude.ai/code/routines](https://claude.ai/code/routines). |
| [Desktop scheduled tasks](/docs/en/desktop-scheduled-tasks) | Your machine, via the desktop app | Tasks that need direct access to local files, tools, or uncommitted changes.                                                                                                                             |
| [GitHub Actions](/docs/en/github-actions)                   | Your CI pipeline                  | Tasks tied to repo events like opened PRs, or cron schedules that should live alongside your workflow config.                                                                                            |
| [`/loop`](/docs/en/scheduled-tasks)                         | The current CLI session           | Quick polling while a session is open. Tasks stop when you start a new conversation; `--resume` and `--continue` restore unexpired ones.                                                                 |

<Tip>
  When writing prompts for scheduled tasks, be explicit about what success looks like and what to do with results. The task runs autonomously, so it can't ask clarifying questions. For example: "Review open PRs labeled `needs-review`, leave inline comments on any issues, and post a summary in the `#eng-reviews` Slack channel."
</Tip>

***

### Ask Claude about its capabilities

Claude has built-in access to its documentation and can answer questions about its own features and limitations.

#### Example questions

```text theme={null}
can Claude Code create pull requests?
```

```text theme={null}
how does Claude Code handle permissions?
```

```text theme={null}
what skills are available?
```

```text theme={null}
how do I use MCP with Claude Code?
```

```text theme={null}
how do I configure Claude Code for Amazon Bedrock?
```

```text theme={null}
what are the limitations of Claude Code?
```

<Note>
  Claude provides documentation-based answers to these questions. For hands-on demonstrations, run `/powerup` for interactive lessons with animated demos, or refer to the specific workflow sections above.
</Note>

<Tip>
  Tips:

  * Claude always has access to the latest Claude Code documentation, regardless of the version you're using
  * Ask specific questions to get detailed answers
  * Claude can explain complex features like MCP integration, enterprise configurations, and advanced workflows
</Tip>

***

## Resume previous conversations

When a task spans multiple sittings, pick up where you left off instead of re-explaining context. Claude Code saves every conversation locally.

```bash theme={null}
claude --continue
```

This resumes the most recent session in the current directory; if there isn't one yet, it prints `No conversation found to continue` and exits. Use `claude --resume` to choose from a list, or `/resume` from inside a running session. See [Manage sessions](/docs/en/sessions) for naming, branching, and the full picker reference.

## Run parallel sessions with worktrees

Work on a feature in one terminal while Claude fixes a bug in another, without the edits colliding. Each worktree is a separate checkout on its own branch.

```bash theme={null}
claude --worktree feature-auth
```

Run the same command with a different name in a second terminal to start an isolated parallel session. See [Worktrees](/docs/en/worktrees) for cleanup, `.worktreeinclude`, and non-git VCS support. To monitor parallel sessions from one screen instead of separate terminals, see [background agents](/docs/en/agent-view).

## Plan before editing

For changes you want to review before they touch disk, switch to plan mode. Claude reads files and proposes a plan but makes no edits until you approve.

```bash theme={null}
claude --permission-mode plan
```

You can also press `Shift+Tab` mid-session to toggle into plan mode. See [Plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) for the approval flow and editing the plan in your text editor.

## Delegate research to subagents

Exploring a large codebase fills your context with file reads. Delegate the exploration so only the findings come back.

```text theme={null}
use a subagent to investigate how our auth system handles token refresh
```

The subagent reads files in its own context window and reports a summary. See [Subagents](/docs/en/sub-agents) for defining custom agents with their own tools and prompts.

## Pipe Claude into scripts

Run Claude non-interactively for CI, pre-commit hooks, or batch processing. Stdin and stdout work like any Unix tool.

```bash theme={null}
git log --oneline -20 | claude -p "summarize these recent commits"
```

See [Non-interactive mode](/docs/en/headless) for output formats, permission flags, and fan-out patterns.

## Next steps

<CardGroup>
  <Card title="Best practices" icon="lightbulb" href="/en/best-practices">
    Patterns for getting the most out of Claude Code
  </Card>

  <Card title="Manage sessions" icon="rotate-left" href="/en/sessions">
    Resume, name, and branch conversations
  </Card>

  <Card title="Worktrees" icon="code-branch" href="/en/worktrees">
    Run isolated parallel sessions
  </Card>

  <Card title="Extend Claude Code" icon="puzzle-piece" href="/en/features-overview">
    Add skills, hooks, MCP, subagents, and plugins
  </Card>
</CardGroup>


---

## Orchestrate subagents at scale with dynamic workflows

`https://code.claude.com/docs/en/workflows`

Dynamic workflows orchestrate many subagents from a script Claude writes and you can rerun. Use them for codebase audits, large migrations, and cross-checked research.

<Note>
  Dynamic workflows are in research preview. They require Claude Code v2.1.154 or later and are available on all paid plans, with Anthropic API access, and on Amazon Bedrock, Google Cloud Vertex AI, and Microsoft Foundry. On Pro, turn them on from the Dynamic workflows row in `/config`.
</Note>

A dynamic workflow is a JavaScript script that orchestrates [subagents](/docs/en/sub-agents) at scale. Claude writes the script for the task you describe, and a runtime executes it in the background while your session stays responsive.

Reach for a workflow when a task needs more agents than one conversation can coordinate, or when you want the orchestration codified as a script you can read and rerun. Examples include a codebase-wide bug sweep, a 500-file migration, a research question that needs sources cross-checked against each other, and a hard plan worth drafting from several independent angles before you commit to one.

This page covers how to:

* Decide [when to use a workflow](#when-to-use-a-workflow) instead of subagents or skills
* [Run a bundled workflow](#run-a-bundled-workflow) with `/deep-research`
* [Have Claude write a workflow](#have-claude-write-a-workflow) for your task and save it
* Understand [how a workflow runs](#how-a-workflow-runs) and [manage runs](#manage-runs)

## When to use a workflow

[Subagents](/docs/en/sub-agents), [skills](/docs/en/skills), and workflows can all run a multi-step task. The difference is who holds the plan:

|                                 | Subagents                      | Skills                       | Workflows                            |
| :------------------------------ | :----------------------------- | :--------------------------- | :----------------------------------- |
| What it is                      | A worker Claude spawns         | Instructions Claude follows  | A script the runtime executes        |
| Who decides what runs next      | Claude, turn by turn           | Claude, following the prompt | The script                           |
| Where intermediate results live | Claude's context window        | Claude's context window      | Script variables                     |
| What's repeatable               | The worker definition          | The instructions             | The orchestration itself             |
| Scale                           | A few delegated tasks per turn | Same as subagents            | Dozens to hundreds of agents per run |
| Interruption                    | Restarts the turn              | Restarts the turn            | Resumable in the same session        |

A workflow moves the plan into code. With subagents and skills, Claude is the orchestrator: it decides turn by turn what to spawn next, and every result lands in Claude's context. A workflow script holds the loop, the branching, and the intermediate results itself, so Claude's context holds only the final answer.

Moving the plan into code also lets a workflow apply a repeatable quality pattern, not just run more agents: it can have independent agents adversarially review each other's findings before they're reported, or draft a plan from several angles and weigh them against each other, so you get a more trustworthy result than a single pass.

## Run a bundled workflow

The quickest way to see a workflow in action is to run `/deep-research`, the [built-in workflow](#bundled-workflows) Claude Code includes for investigating a question across many sources. You'll see agents work through a set of phases in the background while your session stays free, and get one report at the end instead of a turn-by-turn transcript.

<Steps>
  <Step title="Run the workflow">
    Run `/deep-research` with a question you want investigated. It fans out web searches across several angles, fetches and cross-checks the sources it finds, and synthesizes a cited report.

    ```text theme={null}
    /deep-research What changed in the Node.js permission model between v20 and v22?
    ```
  </Step>

  <Step title="Allow workflows">
    Claude Code asks whether to allow the workflow. Select **Yes** to continue. The exact prompt depends on your permission mode. See [Approve the plan before it runs](#approve-the-plan-before-it-runs) for the per-mode options.
  </Step>

  <Step title="Watch progress">
    The run starts in the background. Run `/workflows`, use the arrow keys to select the run, and press Enter to open its progress view:

    ```text theme={null}
    /workflows
    ```

    The view shows each phase with its agent count, token total, and elapsed time. Drill into any phase to see its agents and what each one found. See [Watch the run](#watch-the-run) for the full set of controls.

    You can also watch from the task panel below the input box: a one-line progress summary appears there while the run is going. Press the down arrow to focus it, then Enter to expand.
  </Step>

  <Step title="Read the report">
    When the run finishes, the report lands in your session. It cites the sources each claim came from, with claims that didn't survive cross-checking already filtered out.
  </Step>
</Steps>

To run a workflow for your own task, [have Claude write one](#have-claude-write-a-workflow), and once a run does what you wanted you can [save it](#save-the-workflow-for-reuse) as a command of your own.

### Bundled workflows

Claude Code includes `/deep-research` as a built-in workflow:

| Command                     | What it does                                                                                                                                                                                                                                                                                                      |
| :-------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/deep-research <question>` | Fans out web searches on a question across several angles, fetches and cross-checks the sources it finds, votes on each claim, and returns a cited report with claims that didn't survive cross-checking filtered out. Requires the [WebSearch tool](/docs/en/tools-reference#websearch-tool-behavior) to be available |

[Workflows you save](#save-the-workflow-for-reuse) yourself become commands the same way and appear in `/` autocomplete alongside the bundled ones.

### Watch the run

Workflows run in the background, so the session stays responsive while agents work. Run `/workflows` at any time to list running and completed workflows, then select one to open its progress view.

```text theme={null}
/workflows
```

The progress view shows each phase with its agent counts, token totals, and elapsed time. The footer lists the key for each action:

| Key            | Action                                                                                              |
| :------------- | :-------------------------------------------------------------------------------------------------- |
| `↑` / `↓`      | Select a phase or agent                                                                             |
| `Enter` or `→` | Drill into the selected phase, then into an agent to read its prompt, recent tool calls, and result |
| `Esc`          | Back out one level                                                                                  |
| `j` / `k`      | Scroll within the agent detail when it overflows                                                    |
| `p`            | Pause or resume the run                                                                             |
| `x`            | Stop the selected agent, or stop the whole workflow when focus is on the run                        |
| `r`            | Restart the selected running agent                                                                  |
| `s`            | [Save](#save-the-workflow-for-reuse) the run's script as a command                                  |

## Have Claude write a workflow

You can have Claude write a workflow for your task in two ways:

* [Ask for a workflow](#ask-for-a-workflow-in-your-prompt) in your prompt with the word `workflow`, and Claude writes one for the task.
* [Let Claude decide with ultracode](#let-claude-decide-with-ultracode): set `/effort ultracode` and Claude plans a workflow for every substantive task in the session.

You can also run a workflow command that already exists: a [bundled workflow](#bundled-workflows) like `/deep-research`, or one you've [saved](#save-the-workflow-for-reuse).

### Ask for a workflow in your prompt

To run a single task as a workflow without changing the session's effort level, include the word `workflow` anywhere in your prompt.

```text theme={null}
Run a workflow to audit every API endpoint under src/routes/ for missing auth checks
```

Claude Code highlights the word in your input and Claude writes a workflow script for the task instead of working through it turn by turn.

If the run does what you wanted, you can [save it as a command](#save-the-workflow-for-reuse) afterward.

If Claude Code highlights the word when you didn't mean to trigger one, press `alt+w` to ignore it for this prompt, or press backspace while the cursor is right after the highlighted word. To stop the word from triggering at all, turn off Workflow keyword trigger in `/config`.

### Let Claude decide with ultracode

Ultracode is a Claude Code setting that combines `xhigh` [reasoning effort](/docs/en/model-config#adjust-effort-level) with automatic workflow orchestration. With it on, Claude plans a workflow for each substantive task instead of waiting for you to ask.

```text theme={null}
/effort ultracode
```

With ultracode on, Claude decides when a task warrants a workflow. A single request can turn into several workflows in a row: one to understand the code, one to make the change, and one to verify it. This applies to every task in the session, so each request uses more tokens and takes longer than at lower effort levels.

Ultracode lasts for the current session and resets when you start a new one. Drop back with `/effort high` when you return to routine work. It's available on models that support `xhigh` [effort](/docs/en/model-config#adjust-effort-level); on other models the `/effort` menu doesn't offer it.

### Approve the plan before it runs

In the CLI, the per-run prompt shows the planned phases and these options:

* **Yes, run it**: start the run
* **Yes, and don't ask again for `<name>` in `<path>`**: start, and skip this prompt for this workflow in this project from now on
* **View raw script**: read the script before deciding
* **No**: cancel

`Ctrl+G` opens the script in your editor. `Tab` lets you adjust the prompt before the run starts.

Whether you see this prompt depends on your [permission mode](/docs/en/permission-modes):

| Permission mode                            | When you're prompted                                                                                                                                    |
| :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Default, accept edits                      | Every run, unless you've selected **Yes, and don't ask again** for that workflow in this project                                                        |
| Auto                                       | First launch only. Any **Yes** records consent in your user settings, and later launches start without prompting. Skipped entirely when ultracode is on |
| Bypass permissions, `claude -p`, Agent SDK | Never. The run starts immediately                                                                                                                       |

In the Desktop app, an approval card shows the workflow name, the phase list, and a token-usage caution, with **Once**, **Always**, and **Deny** actions. The progress view appears in the Background tasks side pane.

Your permission mode controls only the launch prompt above. The subagents the workflow spawns always run in `acceptEdits` mode and inherit your [tool allowlist](/docs/en/settings#permission-settings), regardless of your session's mode. File edits are auto-approved.

Shell commands, web fetches, and MCP tools that aren't in your allowlist can still prompt you mid-run. To avoid this on a long run, add the commands the agents need to your allowlist before starting.

In `claude -p` and the Agent SDK there is no one to prompt, so tool calls follow your configured permission rules without interactive confirmation.

### Save the workflow for reuse

When Claude writes a workflow for a task you'll repeat, you can save that run's script as a command. A process like a review you run on every branch then runs the same orchestration each time.

Run `/workflows`, select the run you want to keep, and press `s`. In the save dialog, Tab toggles between the two save locations:

* `.claude/workflows/` in your project: shared with everyone who clones the repo
* `~/.claude/workflows/` in your home directory: available in every project, visible only to you

Press Enter to save. The workflow runs as `/<name>` in future sessions from either location.

If a project workflow and a personal workflow share a name, the project one runs.

## How a workflow runs

The workflow runtime executes the script in an isolated environment, separate from your conversation. Intermediate results stay in script variables instead of landing in Claude's context.

The runtime tracks each agent's result as the run progresses, which is what makes a run [resumable](#resume-after-a-pause) within the same session.

### Behavior and limits

The runtime applies the following constraints:

| Constraint                                                           | Why                                                                                                            |
| :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| No mid-run user input                                                | Only agent permission prompts can pause a run. For sign-off between stages, run each stage as its own workflow |
| No direct filesystem or shell access from the workflow itself        | Agents read, write, and run commands. The script coordinates the agents                                        |
| Up to 16 concurrent agents, fewer on machines with limited CPU cores | Bounds local resource use                                                                                      |
| 1,000 agents total per run                                           | Prevents runaway loops                                                                                         |

## Manage runs

Once a run starts, you manage it from the `/workflows` view, or by expanding its progress line in the task panel below the input box.

### Resume after a pause

If you stop a run, you can resume it: agents that already completed return their cached results, and the rest run live. Resume a paused run from `/workflows` by selecting it and pressing `p`, or ask Claude to relaunch the workflow with the same script.

Resume works within the same Claude Code session. If you exit Claude Code while a workflow is running, the next session starts the workflow fresh.

### Cost

A workflow spawns many agents, so a single run can use meaningfully more tokens than working through the same task in conversation. Runs count toward your plan's usage and rate limits like any other session. You can stop a running workflow from `/workflows` at any time without losing completed work.

Every agent in a workflow uses your session's model unless the script routes a stage to a different one. To control the model cost:

* Check `/model` before a large run if you usually switch to a smaller model for routine work
* Ask Claude to use a smaller model for stages that don't need the strongest one when you describe the task

### Turn workflows off

Workflows are available in the CLI, the Desktop app, the IDE extensions, [non-interactive mode](/docs/en/headless) with `claude -p`, and the [Agent SDK](/docs/en/agent-sdk/overview). The same disable settings apply on every surface.

To turn workflows off for yourself:

* Toggle Dynamic workflows off in `/config`. Persists across sessions.
* Set `"disableWorkflows": true` in `~/.claude/settings.json`. Persists across sessions.
* Set `CLAUDE_CODE_DISABLE_WORKFLOWS=1`. Read at startup, so it applies wherever you set it.

To turn workflows off for your whole organization, set `"disableWorkflows": true` in [managed settings](/docs/en/server-managed-settings), or use the toggle on the [Claude Code admin settings](https://claude.ai/admin-settings/claude-code) page.

When workflows are disabled, the bundled workflow commands are unavailable, the `workflow` keyword no longer triggers a run, and `ultracode` is removed from the `/effort` menu.

## Related resources

* [Run agents in parallel](/docs/en/agents): compare subagents, agent view, agent teams, and workflows
* [Create custom subagents](/docs/en/sub-agents): the worker primitive workflows orchestrate
* [Manage costs](/docs/en/costs): how multi-agent runs count toward usage limits


---

## Best practices for Claude Code

`https://code.claude.com/docs/en/best-practices`

Tips and patterns for getting the most out of Claude Code, from configuring your environment to scaling across parallel sessions.

Claude Code is an agentic coding environment. Unlike a chatbot that answers questions and waits, Claude Code can read your files, run commands, make changes, and autonomously work through problems while you watch, redirect, or step away entirely.

This changes how you work. Instead of writing code yourself and asking Claude to review it, you describe what you want and Claude figures out how to build it. Claude explores, plans, and implements.

But this autonomy still comes with a learning curve. Claude works within certain constraints you need to understand.

This guide covers patterns that have proven effective across Anthropic's internal teams and for engineers using Claude Code across various codebases, languages, and environments. For how the agentic loop works under the hood, see [How Claude Code works](/docs/en/how-claude-code-works).

***

Most best practices are based on one constraint: Claude's context window fills up fast, and performance degrades as it fills.

Claude's context window holds your entire conversation, including every message, every file Claude reads, and every command output. However, this can fill up fast. A single debugging session or codebase exploration might generate and consume tens of thousands of tokens.

This matters since LLM performance degrades as context fills. When the context window is getting full, Claude may start "forgetting" earlier instructions or making more mistakes. The context window is the most important resource to manage. To see how a session fills up in practice, [watch an interactive walkthrough](/docs/en/context-window) of what loads at startup and what each file read costs. Track context usage continuously with a [custom status line](/docs/en/statusline), and see [Reduce token usage](/docs/en/costs#reduce-token-usage) for strategies on reducing token usage.

***

## Give Claude a way to verify its work

<Tip>
  Give Claude a check it can run: tests, a build, a screenshot to compare. It's the difference between a session you watch and one you walk away from.
</Tip>

Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal available, and you become the verification loop: every mistake waits for you to notice it. Give Claude something that produces a pass or fail, and the loop closes on its own. Claude does the work, runs the check, reads the result, and iterates until the check passes.

The check is anything that returns a signal Claude can read in the conversation: a test suite, a build exit code, a linter, a script that diffs output against a fixture, or a [browser screenshot](/docs/en/chrome) compared against a design.

| Strategy                              | Before                                                  | After                                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provide verification criteria**     | *"implement a function that validates email addresses"* | *"write a validateEmail function. example test cases: [user@example.com](mailto:user@example.com) is true, invalid is false, [user@.com](mailto:user@.com) is false. run the tests after implementing"* |
| **Verify UI changes visually**        | *"make the dashboard look better"*                      | *"\[paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them"*                                                            |
| **Address root causes, not symptoms** | *"the build is failing"*                                | *"the build fails with this error: \[paste error]. fix it and verify the build succeeds. address the root cause, don't suppress the error"*                                                             |

Once the check exists, decide how hard it gates the stop:

* **In one prompt**: ask Claude to run the check and iterate in the same message, as in the table above.
* **Across a session**: set the check as a [`/goal` condition](/docs/en/goal). A separate evaluator re-checks it after every turn and Claude keeps working until it holds.
* **As a deterministic gate**: a [Stop hook](/docs/en/hooks#stop) runs your check as a script and blocks the turn from ending until it passes. Claude Code overrides the hook and ends the turn after 8 consecutive blocks.
* **By a second opinion**: a [verification subagent](/docs/en/sub-agents) or a [dynamic workflow](/docs/en/workflows) that checks its own findings has a fresh model try to refute the result, so the agent doing the work isn't the one grading it.

Each step trades setup for attention. The prompt version works on any task today. The `/goal` and Stop hook versions are what let an unattended run finish correctly without you.

Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot of the result. Reviewing evidence is faster than re-running the verification yourself, and it works for sessions you weren't watching.

***

## Explore first, then plan, then code

<Tip>
  Separate research and planning from implementation to avoid solving the wrong problem.
</Tip>

Letting Claude jump straight to coding can produce code that solves the wrong problem. Use [plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) to separate exploration from execution.

The recommended workflow has four phases:

<Steps>
  <Step title="Explore">
    Enter plan mode. Claude reads files and answers questions without making changes.

    ```txt claude (plan mode) theme={null}
    read /src/auth and understand how we handle sessions and login.
    also look at how we manage environment variables for secrets.
    ```
  </Step>

  <Step title="Plan">
    Ask Claude to create a detailed implementation plan.

    ```txt claude (plan mode) theme={null}
    I want to add Google OAuth. What files need to change?
    What's the session flow? Create a plan.
    ```

    Press `Ctrl+G` to open the plan in your text editor for direct editing before Claude proceeds.
  </Step>

  <Step title="Implement">
    Switch out of plan mode and let Claude code, verifying against its plan.

    ```txt claude (default mode) theme={null}
    implement the OAuth flow from your plan. write tests for the
    callback handler, run the test suite and fix any failures.
    ```
  </Step>

  <Step title="Commit">
    Ask Claude to commit with a descriptive message and create a PR.

    ```txt claude (default mode) theme={null}
    commit with a descriptive message and open a PR
    ```
  </Step>
</Steps>

<Callout>
  Plan mode is useful, but also adds overhead.

  For tasks where the scope is clear and the fix is small (like fixing a typo, adding a log line, or renaming a variable) ask Claude to do it directly.

  Planning is most useful when you're uncertain about the approach, when the change modifies multiple files, or when you're unfamiliar with the code being modified. If you could describe the diff in one sentence, skip the plan.
</Callout>

***

## Provide specific context in your prompts

<Tip>
  The more precise your instructions, the fewer corrections you'll need.
</Tip>

Claude can infer intent, but it can't read your mind. Reference specific files, mention constraints, and point to example patterns.

| Strategy                                                                                         | Before                                               | After                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope the task.** Specify which file, what scenario, and testing preferences.                  | *"add tests for foo.py"*                             | *"write a test for foo.py covering the edge case where the user is logged out. avoid mocks."*                                                                                                                                                                                                                                                                    |
| **Point to sources.** Direct Claude to the source that can answer a question.                    | *"why does ExecutionFactory have such a weird api?"* | *"look through ExecutionFactory's git history and summarize how its api came to be"*                                                                                                                                                                                                                                                                             |
| **Reference existing patterns.** Point Claude to patterns in your codebase.                      | *"add a calendar widget"*                            | *"look at how existing widgets are implemented on the home page to understand the patterns. HotDogWidget.php is a good example. follow the pattern to implement a new calendar widget that lets the user select a month and paginate forwards/backwards to pick a year. build from scratch without libraries other than the ones already used in the codebase."* |
| **Describe the symptom.** Provide the symptom, the likely location, and what "fixed" looks like. | *"fix the login bug"*                                | *"users report that login fails after session timeout. check the auth flow in src/auth/, especially token refresh. write a failing test that reproduces the issue, then fix it"*                                                                                                                                                                                 |

Vague prompts can be useful when you're exploring and can afford to course-correct. A prompt like `"what would you improve in this file?"` can surface things you wouldn't have thought to ask about.

### Provide rich content

<Tip>
  Use `@` to reference files, paste screenshots/images, or pipe data directly.
</Tip>

You can provide rich data to Claude in several ways:

* **Reference files with `@`** instead of describing where code lives. Claude reads the file before responding.
* **Paste images directly**. Copy/paste or drag and drop images into the prompt.
* **Give URLs** for documentation and API references. Use `/permissions` to allowlist frequently-used domains.
* **Pipe in data** by running `cat error.log | claude` to send file contents directly.
* **Let Claude fetch what it needs**. Tell Claude to pull context itself using Bash commands, MCP tools, or by reading files.

***

## Configure your environment

A few setup steps make Claude Code significantly more effective across all your sessions. For a full overview of extension features and when to use each one, see [Extend Claude Code](/docs/en/features-overview).

### Write an effective CLAUDE.md

<Tip>
  Run `/init` to generate a starter CLAUDE.md file based on your current project structure, then refine over time.
</Tip>

CLAUDE.md is a special file that Claude reads at the start of every conversation. Include Bash commands, code style, and workflow rules. This gives Claude persistent context it can't infer from code alone.

The `/init` command analyzes your codebase to detect build systems, test frameworks, and code patterns, giving you a solid foundation to refine.

There's no required format for CLAUDE.md files, but keep it short and human-readable. For example:

```markdown CLAUDE.md theme={null}
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, and not the whole test suite, for performance
```

CLAUDE.md is loaded every session, so only include things that apply broadly. For domain knowledge or workflows that are only relevant sometimes, use [skills](/docs/en/skills) instead. Claude loads them on demand without bloating every conversation.

Keep it concise. For each line, ask: *"Would removing this cause Claude to make mistakes?"* If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!

| ✅ Include                                            | ❌ Exclude                                          |
| ---------------------------------------------------- | -------------------------------------------------- |
| Bash commands Claude can't guess                     | Anything Claude can figure out by reading code     |
| Code style rules that differ from defaults           | Standard language conventions Claude already knows |
| Testing instructions and preferred test runners      | Detailed API documentation (link to docs instead)  |
| Repository etiquette (branch naming, PR conventions) | Information that changes frequently                |
| Architectural decisions specific to your project     | Long explanations or tutorials                     |
| Developer environment quirks (required env vars)     | File-by-file descriptions of the codebase          |
| Common gotchas or non-obvious behaviors              | Self-evident practices like "write clean code"     |

If Claude keeps doing something you don't want despite having a rule against it, the file is probably too long and the rule is getting lost. If Claude asks you questions that are answered in CLAUDE.md, the phrasing might be ambiguous. Treat CLAUDE.md like code: review it when things go wrong, prune it regularly, and test changes by observing whether Claude's behavior actually shifts.

You can tune instructions by adding emphasis (e.g., "IMPORTANT" or "YOU MUST") to improve adherence. Check CLAUDE.md into git so your team can contribute. The file compounds in value over time.

CLAUDE.md files can import additional files using `@path/to/import` syntax:

```markdown CLAUDE.md theme={null}
See @README.md for project overview and @package.json for available npm commands.

# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

You can place CLAUDE.md files in several locations:

* **Home folder (`~/.claude/CLAUDE.md`)**: applies to all Claude sessions
* **Project root (`./CLAUDE.md`)**: check into git to share with your team
* **Project root (`./CLAUDE.local.md`)**: personal project-specific notes; add this file to your `.gitignore` so it isn't shared with your team
* **Parent directories**: useful for monorepos where both `root/CLAUDE.md` and `root/foo/CLAUDE.md` are pulled in automatically
* **Child directories**: Claude pulls in child CLAUDE.md files on demand when it reads a file in those directories

### Configure permissions

<Tip>
  Use [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) to let a classifier handle approvals, `/permissions` to allowlist specific commands, or `/sandbox` for OS-level isolation. Each reduces interruptions while keeping you in control.
</Tip>

By default, Claude Code requests permission for actions that might modify your system: file writes, Bash commands, MCP tools, etc. This is safe but tedious. After the tenth approval you're not really reviewing anymore, you're just clicking through. There are three ways to reduce these interruptions:

* **Auto mode**: a separate classifier model reviews commands and blocks only what looks risky: scope escalation, unknown infrastructure, or hostile-content-driven actions. Best when you trust the general direction of a task but don't want to click through every step
* **Permission allowlists**: permit specific tools you know are safe, like `npm run lint` or `git commit`
* **Sandboxing**: enable OS-level isolation that restricts filesystem and network access, allowing Claude to work more freely within defined boundaries

Read more about [permission modes](/docs/en/permission-modes), [permission rules](/docs/en/permissions), and [sandboxing](/docs/en/sandboxing).

### Use CLI tools

<Tip>
  Tell Claude Code to use CLI tools like `gh`, `aws`, `gcloud`, and `sentry-cli` when interacting with external services.
</Tip>

CLI tools are the most context-efficient way to interact with external services. If you use GitHub, install the `gh` CLI. Claude knows how to use it for creating issues, opening pull requests, and reading comments. Without `gh`, Claude can still use the GitHub API, but unauthenticated requests often hit rate limits.

Claude is also effective at learning CLI tools it doesn't already know. Try prompts like `Use 'foo-cli-tool --help' to learn about foo tool, then use it to solve A, B, C.`

### Connect MCP servers

<Tip>
  Run `claude mcp add` to connect external tools like Notion, Figma, or your database.
</Tip>

With [MCP servers](/docs/en/mcp), you can ask Claude to implement features from issue trackers, query databases, analyze monitoring data, integrate designs from Figma, and automate workflows.

### Set up hooks

<Tip>
  Use hooks for actions that must happen every time with zero exceptions.
</Tip>

[Hooks](/docs/en/hooks-guide) run scripts automatically at specific points in Claude's workflow. Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens.

Claude can write hooks for you. Try prompts like *"Write a hook that runs eslint after every file edit"* or *"Write a hook that blocks writes to the migrations folder."* Edit `.claude/settings.json` directly to configure hooks by hand, and run `/hooks` to browse what's configured.

### Create skills

<Tip>
  Create `SKILL.md` files in `.claude/skills/` to give Claude domain knowledge and reusable workflows.
</Tip>

[Skills](/docs/en/skills) extend Claude's knowledge with information specific to your project, team, or domain. Claude applies them automatically when relevant, or you can invoke them directly with `/skill-name`.

Create a skill by adding a directory with a `SKILL.md` to `.claude/skills/`:

```markdown .claude/skills/api-conventions/SKILL.md theme={null}
---
name: api-conventions
description: REST API design conventions for our services
---
# API Conventions
- Use kebab-case for URL paths
- Use camelCase for JSON properties
- Always include pagination for list endpoints
- Version APIs in the URL path (/v1/, /v2/)
```

Skills can also define repeatable workflows you invoke directly:

```markdown .claude/skills/fix-issue/SKILL.md theme={null}
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Analyze and fix the GitHub issue: $ARGUMENTS.

1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR
```

Run `/fix-issue 1234` to invoke it. Use `disable-model-invocation: true` for workflows with side effects that you want to trigger manually.

### Create custom subagents

<Tip>
  Define specialized assistants in `.claude/agents/` that Claude can delegate to for isolated tasks.
</Tip>

[Subagents](/docs/en/sub-agents) run in their own context with their own set of allowed tools. They're useful for tasks that read many files or need specialized focus without cluttering your main conversation.

```markdown .claude/agents/security-reviewer.md theme={null}
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---
You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling

Provide specific line references and suggested fixes.
```

Tell Claude to use subagents explicitly: *"Use a subagent to review this code for security issues."*

### Install plugins

<Tip>
  Run `/plugin` to browse the marketplace. Plugins add skills, tools, and integrations without configuration.
</Tip>

[Plugins](/docs/en/plugins) bundle skills, hooks, subagents, and MCP servers into a single installable unit from the community and Anthropic. If you work with a typed language, install a [code intelligence plugin](/docs/en/discover-plugins#code-intelligence) to give Claude precise symbol navigation and automatic error detection after edits.

For guidance on choosing between skills, subagents, hooks, and MCP, see [Extend Claude Code](/docs/en/features-overview#match-features-to-your-goal).

***

## Communicate effectively

The way you communicate with Claude Code significantly impacts the quality of results.

### Ask codebase questions

<Tip>
  Ask Claude questions you'd ask a senior engineer.
</Tip>

When onboarding to a new codebase, use Claude Code for learning and exploration. You can ask Claude the same sorts of questions you would ask another engineer:

* How does logging work?
* How do I make a new API endpoint?
* What does `async move { ... }` do on line 134 of `foo.rs`?
* What edge cases does `CustomerOnboardingFlowImpl` handle?
* Why does this code call `foo()` instead of `bar()` on line 333?

Using Claude Code this way is an effective onboarding workflow, improving ramp-up time and reducing load on other engineers. No special prompting required: ask questions directly.

### Let Claude interview you

<Tip>
  For larger features, have Claude interview you first. Start with a minimal prompt and ask Claude to interview you using the `AskUserQuestion` tool.
</Tip>

Claude asks about things you might not have considered yet, including technical implementation, UI/UX, edge cases, and tradeoffs.

```text theme={null}
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.

Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious questions, dig into the hard parts I might not have considered.

Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```

Once the spec is complete, start a fresh session to execute it. The new session has clean context focused entirely on implementation, and you have a written spec to reference.

The most useful specs are self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step that proves the feature works. Time spent making the spec precise pays off more than time spent watching the implementation.

***

## Manage your session

Conversations are persistent and reversible. Use this to your advantage!

### Course-correct early and often

<Tip>
  Correct Claude as soon as you notice it going off track.
</Tip>

The best results come from tight feedback loops. Though Claude occasionally solves problems perfectly on the first attempt, correcting it quickly generally produces better solutions faster.

* **`Esc`**: stop Claude mid-action with the `Esc` key. Context is preserved, so you can redirect.
* **`Esc + Esc` or `/rewind`**: press `Esc` twice or run `/rewind` to open the rewind menu and restore previous conversation and code state, or summarize from a selected message.
* **`"Undo that"`**: have Claude revert its changes.
* **`/clear`**: reset context between unrelated tasks. Long sessions with irrelevant context can reduce performance.

If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches. Run `/clear` and start fresh with a more specific prompt that incorporates what you learned. A clean session with a better prompt almost always outperforms a long session with accumulated corrections.

### Manage context aggressively

<Tip>
  Run `/clear` between unrelated tasks to reset context.
</Tip>

Claude Code automatically compacts conversation history when you approach context limits, which preserves important code and decisions while freeing space.

During long sessions, Claude's context window can fill with irrelevant conversation, file contents, and commands. This can reduce performance and sometimes distract Claude.

* Use `/clear` frequently between tasks to reset the context window entirely
* When auto compaction triggers, Claude summarizes what matters most, including code patterns, file states, and key decisions
* For more control, run `/compact <instructions>`, like `/compact Focus on the API changes`
* To compact only part of the conversation, use `Esc + Esc` or `/rewind`, select a message checkpoint, and choose **Summarize from here** or **Summarize up to here**. The first condenses messages from that point forward while keeping earlier context intact; the second condenses earlier messages while keeping recent ones in full. See [Restore vs. summarize](/docs/en/checkpointing#restore-vs-summarize).
* Customize compaction behavior in CLAUDE.md with instructions like `"When compacting, always preserve the full list of modified files and any test commands"` to ensure critical context survives summarization
* For quick questions that don't need to stay in context, use [`/btw`](/docs/en/interactive-mode#side-questions-with-%2Fbtw). The answer appears in a dismissible overlay and never enters conversation history, so you can check a detail without growing context.

### Use subagents for investigation

<Tip>
  Delegate research with `"use subagents to investigate X"`. They explore in a separate context, keeping your main conversation clean for implementation.
</Tip>

Since context is your fundamental constraint, subagents are one of the most powerful tools available. When Claude researches a codebase it reads lots of files, all of which consume your context. Subagents run in separate context windows and report back summaries:

```text theme={null}
Use subagents to investigate how our authentication system handles token
refresh, and whether we have any existing OAuth utilities I should reuse.
```

The subagent explores the codebase, reads relevant files, and reports back with findings, all without cluttering your main conversation.

You can also use subagents for verification after Claude implements something:

```text theme={null}
use a subagent to review this code for edge cases
```

### Rewind with checkpoints

<Tip>
  Every prompt you send creates a checkpoint. You can restore conversation, code, or both to any previous checkpoint.
</Tip>

Claude automatically snapshots files before each change so a checkpoint can restore them. Double-tap `Escape` or run `/rewind` to open the rewind menu. You can restore conversation only, restore code only, restore both, or summarize from a selected message. See [Checkpointing](/docs/en/checkpointing) for details.

Instead of carefully planning every move, you can tell Claude to try something risky. If it doesn't work, rewind and try a different approach. Checkpoints persist across sessions, so you can close your terminal and still rewind later.

<Warning>
  Checkpoints only track changes made *by Claude*, not external processes. This isn't a replacement for git.
</Warning>

### Resume conversations

<Tip>
  Name sessions with `/rename` and treat them like branches: each workstream gets its own persistent context.
</Tip>

Claude Code saves conversations locally, so when a task spans multiple sittings you don't have to re-explain the context. Run `claude --continue` to pick up the most recent session, or `claude --resume` to choose from a list. Give sessions descriptive names like `oauth-migration` so you can find them later. See [Manage sessions](/docs/en/sessions) for the full set of resume, branch, and naming controls.

***

## Automate and scale

Once you're effective with one Claude, multiply your output with parallel sessions, non-interactive mode, and fan-out patterns.

Everything so far assumes one human, one Claude, and one conversation. But Claude Code scales horizontally. The techniques in this section show how you can get more done.

### Run non-interactive mode

<Tip>
  Use `claude -p "prompt"` in CI, pre-commit hooks, or scripts. Add `--output-format stream-json --verbose` for streaming JSON output.
</Tip>

With `claude -p "your prompt"`, you can run Claude non-interactively, without a session. [Non-interactive mode](/docs/en/headless) is how you integrate Claude into CI pipelines, pre-commit hooks, or any automated workflow. The output formats let you parse results programmatically: plain text, JSON, or streaming JSON.

```bash theme={null}
# One-off queries
claude -p "Explain what this project does"

# Structured output for scripts
claude -p "List all API endpoints" --output-format json

# Streaming for real-time processing
claude -p "Analyze this log file" --output-format stream-json --verbose
```

### Run multiple Claude sessions

<Tip>
  Run multiple Claude sessions in parallel to speed up development, run isolated experiments, or start complex workflows.
</Tip>

Pick the parallel approach that fits how much coordination you want to do yourself:

* [Worktrees](/docs/en/worktrees): run separate CLI sessions in isolated git checkouts so edits don't collide
* [Desktop app](/docs/en/desktop#work-in-parallel-with-sessions): manage multiple local sessions visually, each in its own worktree
* [Claude Code on the web](/docs/en/claude-code-on-the-web): run sessions on Anthropic-managed cloud infrastructure in isolated VMs
* [Agent teams](/docs/en/agent-teams): automated coordination of multiple sessions with shared tasks, messaging, and a team lead

Beyond parallelizing work, multiple sessions enable quality-focused workflows. A fresh context improves code review since Claude won't be biased toward code it just wrote.

For example, use a Writer/Reviewer pattern:

| Session A (Writer)                                                      | Session B (Reviewer)                                                                                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Implement a rate limiter for our API endpoints`                        |                                                                                                                                                                          |
|                                                                         | `Review the rate limiter implementation in @src/middleware/rateLimiter.ts. Look for edge cases, race conditions, and consistency with our existing middleware patterns.` |
| `Here's the review feedback: [Session B output]. Address these issues.` |                                                                                                                                                                          |

You can do something similar with tests: have one Claude write tests, then another write code to pass them.

### Fan out across files

<Tip>
  Loop through tasks calling `claude -p` for each. Use `--allowedTools` to scope permissions for batch operations.
</Tip>

For large migrations or analyses, you can distribute work across many parallel Claude invocations:

<Steps>
  <Step title="Generate a task list">
    Have Claude list all files that need migrating (e.g., `list all 2,000 Python files that need migrating`)
  </Step>

  <Step title="Write a script to loop through the list">
    ```bash theme={null}
    for file in $(cat files.txt); do
      claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
        --allowedTools "Edit,Bash(git commit *)"
    done
    ```
  </Step>

  <Step title="Test on a few files, then run at scale">
    Refine your prompt based on what goes wrong with the first 2-3 files, then run on the full set. The `--allowedTools` flag restricts what Claude can do, which matters when you're running unattended.
  </Step>
</Steps>

You can also integrate Claude into existing data/processing pipelines:

```bash theme={null}
claude -p "<your prompt>" --output-format json | your_command
```

Use `--verbose` for debugging during development, and turn it off in production.

### Run autonomously with auto mode

For uninterrupted execution with background safety checks, use [auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode). A classifier model reviews commands before they run, blocking scope escalation, unknown infrastructure, and hostile-content-driven actions while letting routine work proceed without prompts.

```bash theme={null}
claude --permission-mode auto -p "fix all lint errors"
```

For non-interactive runs with the `-p` flag, auto mode aborts if the classifier repeatedly blocks actions, since there is no user to fall back to. See [when auto mode falls back](/docs/en/permission-modes#when-auto-mode-falls-back) for thresholds.

### Add an adversarial review step

<Tip>
  Before treating a task as done, have a subagent review the diff in a fresh context and report gaps.
</Tip>

The longer Claude works unattended, the more an independent check matters before you count the work as done. A reviewer running in a fresh [subagent](/docs/en/sub-agents) context sees only the diff and the criteria you give it, not the reasoning that produced the change, so it evaluates the result on its own terms.

For a correctness check, run the bundled [`/code-review` skill](/docs/en/commands), which reviews the current diff for bugs in a fresh subagent and returns findings to the session. To check the diff against your plan instead, write the review prompt yourself. Name the work to check, the plan to check it against, and what counts as a finding:

```text theme={null}
Use a subagent to review the rate limiter diff against PLAN.md. Check that
every requirement is implemented, the listed edge cases have tests, and
nothing outside the task's scope changed. Report gaps, not style preferences.
```

Because the reviewer runs as a subagent, the implementing session receives the gaps directly and can fix them and re-review without you copying findings between windows. For longer autonomous runs, an [agent team](/docs/en/agent-teams) can keep this loop going across many tasks while you spot-check the recorded findings.

<Callout>
  A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering: extra abstraction layers, defensive code, and tests for cases that can't happen. Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional.
</Callout>

***

## Avoid common failure patterns

These are common mistakes. Recognizing them early saves time:

* **The kitchen sink session.** You start with one task, then ask Claude something unrelated, then go back to the first task. Context is full of irrelevant information.
  > **Fix**: `/clear` between unrelated tasks.
* **Correcting over and over.** Claude does something wrong, you correct it, it's still wrong, you correct again. Context is polluted with failed approaches.
  > **Fix**: After two failed corrections, `/clear` and write a better initial prompt incorporating what you learned.
* **The over-specified CLAUDE.md.** If your CLAUDE.md is too long, Claude ignores half of it because important rules get lost in the noise.
  > **Fix**: Ruthlessly prune. If Claude already does something correctly without the instruction, delete it or convert it to a hook.
* **The trust-then-verify gap.** Claude produces a plausible-looking implementation that doesn't handle edge cases.
  > **Fix**: Always provide verification (tests, scripts, screenshots). If you can't verify it, don't ship it.
* **The infinite exploration.** You ask Claude to "investigate" something without scoping it. Claude reads hundreds of files, filling the context.
  > **Fix**: Scope investigations narrowly or use subagents so the exploration doesn't consume your main context.

***

## Develop your intuition

The patterns in this guide aren't set in stone. They're starting points that work well in general, but might not be optimal for every situation.

Sometimes you *should* let context accumulate because you're deep in one complex problem and the history is valuable. Sometimes you should skip planning and let Claude figure it out because the task is exploratory. Sometimes a vague prompt is exactly right because you want to see how Claude interprets the problem before constraining it.

Pay attention to what works. When Claude produces great output, notice what you did: the prompt structure, the context you provided, the mode you were in. When Claude struggles, ask why. Was the context too noisy? The prompt too vague? The task too big for one pass?

Over time, you'll develop intuition that no guide can capture. You'll know when to be specific and when to be open-ended, when to plan and when to explore, when to clear context and when to let it accumulate.

## Related resources

* [How Claude Code works](/docs/en/how-claude-code-works): the agentic loop, tools, and context management
* [Extend Claude Code](/docs/en/features-overview): skills, hooks, MCP, subagents, and plugins
* [Common workflows](/docs/en/common-workflows): step-by-step recipes for debugging, testing, PRs, and more
* [CLAUDE.md](/docs/en/memory): store project conventions and persistent context


---

## Set up Claude Code in a monorepo or large codebase

`https://code.claude.com/docs/en/large-codebases`

Configure Claude Code for monorepos and large single-tree codebases with nested CLAUDE.md files, sparse worktrees, code intelligence, and per-package skills so Claude stays focused on the code you're working in.

A large codebase can be one repository with millions of lines or a monorepo with many packages. Claude Code works at any size, but as the codebase grows, the defaults tuned for smaller projects can fill the context window with instructions and file reads unrelated to the task, costing tokens and degrading Claude's performance.

This guide shows individual developers and engineering teams how to scope Claude to the part of the codebase a task touches. Each section notes whether a setting is personal to your machine or committed to the repository.

## What this guide covers

The [table below](#settings-on-this-page) lists each setting and what it accomplishes. The [file tree after it](#the-example-monorepo) is the example monorepo every code sample on this page refers to.

### Settings on this page

Each setting below is independent. They layer rather than replace each other, so apply whichever fit your repository. [Choose where to start Claude](#choose-where-to-start-claude) determines where your settings files live, so read it first. [Put it together](#put-it-together) shows all of them combined.

| I want to                                                                                           | Use                                                                                        |
| :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| Load only the conventions for the code you touch, instead of one root file covering every subsystem | Per-directory [CLAUDE.md files](#layer-claude-md-files-by-directory)                       |
| Exclude CLAUDE.md files for packages you never work in                                              | [`claudeMdExcludes`](#exclude-irrelevant-claude-md-files)                                  |
| Block Claude from opening build output, generated code, and vendored dependencies                   | [`Read` deny rules](#block-reads-of-generated-and-vendored-code) in `permissions.deny`     |
| Find a symbol's definition or callers through the language server instead of scanning files         | A [code intelligence plugin](#reduce-file-reads-with-code-intelligence)                    |
| Check out only the directories a task needs when Claude creates a worktree                          | [`worktree.sparsePaths`](#check-out-only-the-directories-you-need)                         |
| Read and edit a sibling package or another repository from the same session                         | [`--add-dir`](#grant-access-across-packages-or-repositories) or `additionalDirectories`    |
| Give Claude procedures specific to one area that load only when relevant                            | Per-directory [skills](#add-per-directory-skills)                                          |
| Replace many per-directory CLAUDE.md files with one set of conventions everyone installs            | A [plugin](#centralize-conventions-when-layering-stops-scaling) in an internal marketplace |

<Tip>
  For workflow techniques that keep context small in any repository, such as [running exploration in a subagent](/docs/en/best-practices#use-subagents-for-investigation) so file reads stay out of the main conversation, see [Best practices for Claude Code](/docs/en/best-practices). To roll out a baseline configuration to every developer in your organization, see [Set up Claude Code for your organization](/docs/en/admin-setup).
</Tip>

### The example monorepo

The examples throughout this page refer to a monorepo with three packages. The same patterns work in a large single-tree codebase: where an example uses `packages/api/`, substitute your own subsystem directory such as `src/backend/` or `lib/core/`.

```text theme={null}
monorepo/
  CLAUDE.md                     # root instructions
  packages/
    api/
      CLAUDE.md                 # API-specific instructions
      .claude/skills/
      src/
    web/
      CLAUDE.md                 # frontend-specific instructions
      .claude/skills/
      src/
    shared/
      CLAUDE.md                 # shared library instructions
      src/
```

## Choose where to start Claude

Where you launch `claude` determines which files Claude can read and edit without an additional permission grant, which CLAUDE.md files load into context at startup, and which project settings apply.

| Start from      | File access                             | CLAUDE.md loaded at launch                                           | Use when                                   |
| :-------------- | :-------------------------------------- | :------------------------------------------------------------------- | :----------------------------------------- |
| Repository root | Every file                              | Root only; subdirectory files load on demand when Claude reads there | Tasks span multiple packages or subsystems |
| A subdirectory  | That subtree only, until you grant more | That directory's plus every ancestor's                               | Work is scoped to one package or subsystem |

Project settings in `.claude/settings.json` load only from your starting directory and are not inherited from parent directories the way CLAUDE.md files are: a `.claude/settings.json` at the repository root applies only when you start from the root.

Each section below states whether its settings file belongs at the repository root or in the subdirectory you start from, and whether it is committed or kept local.

## Layer CLAUDE.md files by directory

In a large codebase, a single CLAUDE.md at the repository root tends to either grow to cover every subsystem's conventions, costing context on instructions unrelated to the current task, or stay too generic to be useful. Splitting instructions across per-directory files means Claude loads repository-wide rules plus only the conventions for the code you're working in.

Claude Code loads every [CLAUDE.md](/docs/en/memory) file from your working directory and every parent directory at launch, then loads each subdirectory's file on demand when it reads files there. A root file sets repository-wide rules and each subdirectory adds its own.

A common split is two levels:

* **Root `CLAUDE.md`**: instructions that apply everywhere, such as coding standards, commit conventions, and repository layout
* **Per-subdirectory `CLAUDE.md`**: conventions specific to that area's stack. In a monorepo that's one per package. In a large single tree it's one per subsystem such as `src/db/` or `src/api/`

Commit these files to the repository so teammates inherit them. Each directory's owner typically maintains its file.

The root `CLAUDE.md` orients Claude to the repository structure:

```markdown CLAUDE.md theme={null}
This is a monorepo with three packages under packages/:

- packages/api: Node.js REST API with Express, TypeScript, and PostgreSQL
- packages/web: React frontend with Vite, TypeScript, and TailwindCSS
- packages/shared: shared TypeScript utilities used by both api and web

Run commands from the package directory, not the monorepo root.
Each package has its own tsconfig.json, package.json, and test suite.
```

Each subdirectory's `CLAUDE.md`, here `packages/api/CLAUDE.md`, adds context specific to that area's stack:

```markdown packages/api/CLAUDE.md theme={null}
This package is the REST API server.

- Run tests: `npm test` (uses Vitest)
- Run dev server: `npm run dev` (port 3001)
- Database migrations: `npm run migrate`
- Environment variables: copy `.env.example` to `.env`

API routes are in src/routes/. Each route file exports an Express router.
Database queries use Knex in src/db/. Never write raw SQL strings in route handlers.
```

When you start Claude from `packages/api/`, it loads both `packages/api/CLAUDE.md` and the root `CLAUDE.md`. Claude sees the local instructions alongside the repository-wide rules, with no instructions from `packages/web/` in context. The same holds for any subdirectory in a non-monorepo tree.

A few ways to keep the files current as the codebase and models change:

* **Review in pull requests**: treat CLAUDE.md edits like any other documentation change so conventions track the code
* **Revisit after major model releases**: instructions that worked around an older model's limitation may become overhead once a newer model handles the case on its own. For example, a rule that forces single-file refactors can be deleted once the limitation is gone
* **Add a Stop hook that proposes updates**: a [`Stop` hook](/docs/en/hooks#stop) receives the path to the session transcript when Claude finishes responding, so a script can review the session and propose CLAUDE.md updates while the gap it exposed is fresh

For more on how CLAUDE.md files load and interact, see [Memory and project instructions](/docs/en/memory).

### Choose between per-directory CLAUDE.md and path-scoped rules

Per-directory `CLAUDE.md` files and [path-scoped rules](/docs/en/memory#path-specific-rules) under `.claude/rules/` both let you target instructions to part of the tree. They differ in where the file lives and when it loads.

| Approach                             | File location                            | Loads when                                                                              | Use when                                                                                  |
| :----------------------------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| Per-directory `CLAUDE.md`            | Inside the directory, alongside its code | At launch when started from that directory, or on demand when Claude reads a file there | Directory owners maintain their own conventions; instructions are versioned with the code |
| Path-scoped rule in `.claude/rules/` | Central `.claude/` at the repo root      | When Claude works with a file matching the rule's `paths:` glob                         | You want all conventions in one place, or the same rule applies to many scattered paths   |

For a comparison that also covers skills, see [Compare similar features](/docs/en/features-overview#compare-similar-features).

### Exclude irrelevant CLAUDE.md files

When you start Claude from the repository root, each subdirectory's CLAUDE.md loads as soon as Claude reads a file in that directory. The `claudeMdExcludes` setting skips specific files by path or glob pattern so they never load.

Use this for directories you never work in, such as other teams' packages, legacy code, or vendored subtrees. The exclusion list is static, not a per-task switch. To focus on one package today and another tomorrow, [start Claude from that package's directory](#choose-where-to-start-claude) instead of editing exclusions.

If you only want these exclusions for yourself, put the setting in `.claude/settings.local.json`, which is gitignored and not committed. Patterns use glob syntax matched against absolute file paths, so start relative-style patterns with `**/` to match anywhere in the tree. The example below excludes packages owned by other teams:

```json .claude/settings.local.json theme={null}
{
  "claudeMdExcludes": [
    "**/packages/admin-dashboard/**",
    "**/packages/legacy-*/**"
  ]
}
```

This skips every CLAUDE.md and rules file under those packages. The root CLAUDE.md and the packages you do work in still load normally.

These patterns cover other common cases:

* `"**/packages/*/CLAUDE.md"`: excludes every package's CLAUDE.md while keeping the root
* `"**/packages/web/**"`: excludes everything under the web package, including rules
* `"/home/user/monorepo/legacy/CLAUDE.md"`: excludes one specific file by absolute path

Managed policy CLAUDE.md files cannot be excluded, so organization-wide instructions always apply. You can set `claudeMdExcludes` at any [settings scope](/docs/en/settings#configuration-scopes): user, project, local, or managed. Arrays merge across scopes, so a team can set project-level defaults while individuals add local overrides.

For the full exclusion documentation, see [Exclude specific CLAUDE.md files](/docs/en/memory#exclude-specific-claude-md-files).

## Reduce what Claude reads

Instructions are only part of what ends up in Claude's context. File reads are another cost that grows with the codebase. The settings below block reads of irrelevant paths and replace exhaustive file scans with language-server lookups.

### Block reads of generated and vendored code

Claude's content searches respect `.gitignore` by default, so paths already listed there, such as `node_modules/`, `dist/`, and `build/`, stay out of search results without additional configuration.

For paths that are checked in, such as a vendored SDK or committed generated code, add `Read` deny rules in `permissions.deny` to block Claude from opening those files even when a search lists them.

To apply these exclusions for everyone working in the repository, commit them to `.claude/settings.json`. To keep them personal, use `.claude/settings.local.json` instead. Like other project settings on this page, these files load only from your starting directory. Place them at the repository root if you start Claude there, or in each package's `.claude/` if you start from subdirectories. To enforce the same deny rules in every session regardless of starting directory, set them in [managed settings](/docs/en/settings#settings-files), which user and project settings cannot override.

The example below blocks build artifacts and a vendored SDK:

```json .claude/settings.json theme={null}
{
  "permissions": {
    "deny": [
      "Read(./**/dist/**)",
      "Read(./**/build/**)",
      "Read(./**/*.generated.*)",
      "Read(./vendor/**)"
    ]
  }
}
```

Deny rules cover Claude's built-in file tools and recognized Bash file commands, including `cat`, `head`, `grep`, and `find`, when a denied path is passed as an argument. They do not filter denied paths out of a recursive search's output, and they do not cover arbitrary subprocesses that open files themselves. For the full pattern syntax, see [Read and Edit permission rules](/docs/en/permissions#read-and-edit).

### Reduce file reads with code intelligence

In a large codebase, finding where a symbol is defined or used can cost many file reads and grep calls. [Code intelligence plugins](/docs/en/discover-plugins#code-intelligence) connect Claude to a language server so it can jump to definitions, find references, and surface type errors directly instead of scanning the tree.

The official marketplace has plugins for TypeScript, Python, Go, Rust, and other common languages. The example below installs the TypeScript plugin:

```shell theme={null}
/plugin install typescript-lsp@claude-plugins-official
```

To enable a plugin for everyone in the repository rather than installing it yourself, add it to the [`enabledPlugins` project setting](/docs/en/settings#plugin-settings).

Code intelligence plugins require the language's language server binary on each developer's machine. See [which binary each language requires](/docs/en/discover-plugins#code-intelligence). Installing from the official marketplace requires network access to GitHub, where the marketplace is hosted. On a restricted network, [add the marketplace from an internal Git host or local path](/docs/en/discover-plugins#add-from-other-git-hosts) instead.

This pairs well with `claudeMdExcludes` and the `Read` deny rules above. Those keep irrelevant content out of context, and code intelligence keeps Claude from reading through what remains to locate a definition.

## Scope worktrees and file access

These settings control what's on disk in worktrees and which directories Claude can read and write beyond your starting point.

### Check out only the directories you need

The `--worktree` flag starts a session in a new git worktree so changes stay isolated from your main checkout. By default it checks out the entire repository. In a large repository, the `worktree.sparsePaths` setting uses git sparse-checkout to write only the listed directories plus root-level files to disk, so worktrees start faster and use less space.

If everyone working in this directory needs the same paths, commit the setting to `.claude/settings.json`. To add paths for yourself, use `.claude/settings.local.json`: the lists merge across scopes, so a local file can add paths to the committed list but not remove them. The example below shows the committed file:

```json .claude/settings.json theme={null}
{
  "worktree": {
    "sparsePaths": [
      ".claude",
      "packages/api",
      "packages/shared"
    ]
  }
}
```

When Claude creates a worktree, it checks out only `.claude/`, `packages/api/`, and `packages/shared/` instead of the full tree. Paths in `sparsePaths` are relative to the repository root, regardless of which subdirectory you start Claude from. Any directory paths work here, not only package roots.

This is particularly useful for [subagent worktree isolation](/docs/en/worktrees#isolate-subagents-with-worktrees). Subagents are parallel Claude instances spawned for subtasks, and each one that runs in a worktree gets a lightweight checkout instead of the full tree. All worktrees in a session share the same `sparsePaths`, so if one subagent needs `packages/api/` and another needs `packages/web/`, list both.

List directories in `sparsePaths`, not individual files. Root-level files like `package.json`, `tsconfig.base.json`, and lock files are always checked out alongside the directories you list. Root-level directories are not, so include `.claude` in the list if you want the repository root's `.claude/settings.json`, `.claude/rules/`, or `.claude/skills/` available inside the worktree.

To avoid duplicating large directories like `node_modules` across worktrees, pair `sparsePaths` with `symlinkDirectories` in the same `.claude/settings.json`:

```json .claude/settings.json theme={null}
{
  "worktree": {
    "sparsePaths": [
      ".claude",
      "packages/api",
      "packages/shared"
    ],
    "symlinkDirectories": [
      "node_modules"
    ]
  }
}
```

This creates a symlink from each worktree's `node_modules/` back to the main repository's copy rather than duplicating it on disk.

<Note>
  The `sparsePaths` and `symlinkDirectories` settings are read from your starting directory before the worktree is created. After creation, the session's working directory is the worktree root, not the subdirectory you launched from. Project settings inside the worktree therefore load from the worktree root's `.claude/settings.json`, the checked-out copy of the repository root's file. Put any other settings you need inside worktrees, such as permission rules or hooks, in the repository root's `.claude/settings.json`.
</Note>

For the full worktree settings reference, see [Worktree settings](/docs/en/settings#worktree-settings).

### Grant access across packages or repositories

This section applies when you start Claude from a subdirectory, or when a task spans multiple checkouts. If you start from the repository root in a single large tree, Claude already has access to every file and you can skip this.

When you start Claude from `packages/api/`, it can read and write files within that directory. If a task requires changes across packages, such as updating a shared type that both `api` and `web` import, you need to grant access to the sibling directory. The same mechanism grants access to a separately-checked-out repository.

The `additionalDirectories` setting in `.claude/settings.json` gives Claude access to directories outside the working directory. The example below grants access to two sibling packages:

```json .claude/settings.json theme={null}
{
  "permissions": {
    "additionalDirectories": [
      "../shared",
      "../web"
    ]
  }
}
```

Relative paths resolve against the directory you start Claude from. With this configuration, Claude can read and edit files in `packages/shared/` and `packages/web/` while working from `packages/api/`.

You can also grant access at runtime without editing settings by passing `--add-dir` when you start Claude:

```bash theme={null}
claude --add-dir ../shared
```

However you add a directory, Claude can read and edit files in it. Whether the directory's CLAUDE.md, `.claude/rules/` files, and skills also load depends on how you added it:

| Added with                             | Loads CLAUDE.md and rules                | Loads skills |
| :------------------------------------- | :--------------------------------------- | :----------- |
| `additionalDirectories` setting        | Never                                    | Never        |
| `--add-dir` flag or `/add-dir` command | Only with the environment variable below | Yes          |

To load CLAUDE.md and rules files from a directory added with `--add-dir` or `/add-dir`, set the `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` environment variable:

```bash theme={null}
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared
```

The environment variable has no effect on directories listed in the `additionalDirectories` setting. See [Load from additional directories](/docs/en/memory#load-from-additional-directories) for details.

For sibling directories that everyone in this area needs, commit `additionalDirectories` to `.claude/settings.json`. For a personal selection or one-off access, use `.claude/settings.local.json` or pass `--add-dir` at launch.

## Add per-directory skills

Any subdirectory can define [skills](/docs/en/skills) scoped to its own stack. A skill loads on demand when Claude determines it's relevant, so API-specific tooling doesn't consume context during frontend work.

Skills live under `.claude/skills/` inside the directory. Commit them alongside that area's code so anyone who clones the repository gets them. In a monorepo this can be one set of skills per package. In a large single-tree codebase it's one set per subsystem such as `src/db/.claude/skills/`.

Create a skill directory inside the subdirectory:

```bash theme={null}
mkdir -p packages/api/.claude/skills/api-testing
```

Then write `SKILL.md` inside that directory, here `packages/api/.claude/skills/api-testing/SKILL.md`. This example teaches Claude the API package's testing patterns:

```markdown packages/api/.claude/skills/api-testing/SKILL.md theme={null}
---
name: api-testing
description: Testing patterns for the API package. Use when writing or modifying tests in packages/api/.
---

## Test structure

Tests are in `src/__tests__/` mirroring the `src/` directory structure.
Each route file has a corresponding `.test.ts` file.

## Running tests

- All tests: `npm test`
- Single file: `npm test -- src/__tests__/routes/users.test.ts`
- Watch mode: `npm test -- --watch`

## Test utilities

- `src/__tests__/helpers/db.ts`: provides `setupTestDb()` and `teardownTestDb()` for database tests
- `src/__tests__/helpers/auth.ts`: provides `createTestUser()` and `getAuthToken()` for authenticated endpoints

## Patterns

- Use `supertest` for HTTP assertions, not raw fetch
- Always wrap database tests in a transaction that rolls back
- Mock external services in `src/__tests__/mocks/`
```

A different subdirectory holds different skills the same way: `packages/web/.claude/skills/component-patterns/` describes the frontend's component conventions instead of testing. When Claude works on a file in `packages/api/`, it loads the api-testing skill. When it works in `packages/web/`, it loads component-patterns instead. Neither directory's skills load during the other's tasks.

You can also scope a skill by file pattern instead of by placement. The [`paths` frontmatter field](/docs/en/skills#frontmatter-reference) takes glob patterns, and Claude loads the skill automatically only when it works with matching files. Use this for a skill that lives in the repository root's `.claude/skills/` but applies only to certain files wherever they appear, such as a database-migration skill scoped to `**/migrations/**`.

For more on creating and organizing skills, see [Skills](/docs/en/skills).

### Keep skills discoverable

With skills spread across many directories, the list Claude chooses from can grow large. Claude picks a skill by reading every discovered skill's name and description, and only the chosen skill's full content loads into context. This section covers how to keep that list small and write descriptions that survive shortening.

Which skills are in scope depends on where you start Claude:

* **From a subdirectory such as `packages/api/`**: skills from that directory, every parent up to the repository root, and the user and enterprise levels
* **From the repository root**: skills from every subdirectory Claude touches during the session, which can accumulate into the hundreds
* **After adding a sibling with [`--add-dir`](#grant-access-across-packages-or-repositories)**: that sibling's skills load too. The `additionalDirectories` setting grants file access only and does not load skills

Names always load, but [descriptions are shortened when there are many](/docs/en/skills#skill-descriptions-are-cut-short), which can strip the keywords Claude uses to decide whether a skill applies. Keep descriptions short and lead with words a request would contain, like "writing or modifying tests in `packages/api/`".

For skills that many directories share, such as PR conventions or a deploy checklist, place them in the repository root's `.claude/skills/` so they load from any starting directory. When shared skills need their own version history or must work across repositories, package them as a [plugin](/docs/en/plugins) instead. Plugin skills use a `plugin-name:skill-name` namespace, so they never collide with per-directory skills. A platform team can version and update them in one place.

To find which skills go unused, enable the OpenTelemetry [logs exporter](/docs/en/monitoring-usage) and set `OTEL_LOG_TOOL_DETAILS=1` so skill names are recorded verbatim instead of redacted. The [`skill_activated` event](/docs/en/monitoring-usage#skill-activated-event) records every invocation in its `skill.name` attribute, and `invocation_trigger` records whether a command, Claude, or a nested skill invoked it, which tells you what to consolidate or retire.

## Centralize conventions when layering stops scaling

Per-directory CLAUDE.md files can become hard to govern as the codebase grows. Conventions drift, files go stale, and no one owns the root. Solving that typically falls to the team that maintains the repository's Claude Code setup rather than to each developer working in their own area.

Move conventions and reference content out of always-loaded CLAUDE.md and into mechanisms that load on demand:

* [Skills](/docs/en/skills): reference material Claude loads only when relevant to the task
* [Plugins](/docs/en/plugins): versioned bundles of skills, hooks, and commands that a platform team owns centrally
* [MCP servers](/docs/en/mcp): if your organization already runs a code search or RAG index over the repository, expose it as an MCP tool so Claude queries it instead of reading files directly

See [server-managed or endpoint-managed settings](/docs/en/server-managed-settings#choose-between-server-managed-and-endpoint-managed-settings) for how platform teams can enforce these centrally.

### Recommend the right plugin at session start

Once conventions live in plugins, a teammate starting Claude in an unfamiliar part of the tree has no signal about which plugin that area's owners maintain. A [`SessionStart` hook](/docs/en/hooks#sessionstart) can close that gap, since anything the hook prints to stdout is added to Claude's context before the first prompt.

For example, you can write a script that reads the launch directory from the [hook input](/docs/en/hooks#common-input-fields), looks it up in a path-to-plugin map committed to the repository, and prints the recommendation for Claude to relay in its first reply. See [Automate workflows with hooks](/docs/en/hooks-guide) to write and register the hook.

## Put it together

The combined configuration below uses the monorepo layout. The same files work for any subdirectory in a large single tree. Project settings load only from the directory you start Claude in, so each subdirectory's `.claude/settings.json` must be self-contained rather than layered on a root file.

The example commits `worktree`, `additionalDirectories`, and the `Read` deny rules in `.claude/settings.json` so every developer in `packages/api/` gets the same sibling access, sparse paths, and exclusions. The file below is the committed per-area settings for `packages/api/`:

```json packages/api/.claude/settings.json theme={null}
{
  "worktree": {
    "sparsePaths": [
      ".claude",
      "packages/api",
      "packages/shared"
    ],
    "symlinkDirectories": [
      "node_modules"
    ]
  },
  "permissions": {
    "additionalDirectories": [
      "../shared"
    ],
    "deny": [
      "Read(./**/dist/**)",
      "Read(./**/build/**)"
    ]
  }
}
```

Because this session starts from `packages/api/`, sibling packages' CLAUDE.md files are already out of scope, so `claudeMdExcludes` is not needed here. Add it to the repository root's `.claude/settings.local.json` instead if you also start sessions from the root.

The `additionalDirectories` entry applies when you start Claude from `packages/api/` directly. Inside a worktree created from this session, the working directory is the worktree root, so this settings file does not load. The sibling packages are already reachable inside the worktree without it, but the deny rules need a second copy in the repository root's `.claude/settings.json` so worktree sessions pick them up, as the [worktree settings note](#check-out-only-the-directories-you-need) describes:

```json .claude/settings.json theme={null}
{
  "permissions": {
    "deny": [
      "Read(./**/dist/**)",
      "Read(./**/build/**)"
    ]
  }
}
```

After setup, the repository has this layout:

```text theme={null}
monorepo/
  CLAUDE.md
  .claude/settings.json                           # deny rules for worktree sessions
  packages/
    api/
      CLAUDE.md
      .claude/settings.json                       # worktree, additionalDirectories, deny rules
      .claude/skills/api-testing/SKILL.md
    web/
      CLAUDE.md
      .claude/skills/component-patterns/SKILL.md
    shared/
      CLAUDE.md
```

With this setup, starting Claude from `packages/api/`:

* Loads the root CLAUDE.md and `packages/api/CLAUDE.md`, skips `packages/web/CLAUDE.md`
* Can read and edit files in `packages/api/` and `packages/shared/`
* Skips reads of build output under `dist/` and `build/` in `packages/api/`
* Has the api-testing skill available on demand
* Creates worktrees containing `.claude/`, `packages/api/`, `packages/shared/`, and root-level files, with the deny rules applied across the worktree from the root settings file

## Scope and plan changes that span packages

The configuration above controls what Claude sees. When a single change touches several packages, such as updating a shared type along with every call site that uses it, how you scope and sequence the task also affects the result.

Two techniques help keep a cross-package change consistent:

* **Give Claude the whole change in one session**: handing over the shared edit and its call sites together keeps the decisions behind each edit consistent, rather than re-deriving them per package
* **Save the plan to a file before editing**: [plan first](/docs/en/best-practices#explore-first-then-plan-then-code) and ask Claude to write the plan to a markdown file in the repository. A long cross-package session [compacts its context](/docs/en/context-window#what-survives-compaction) along the way, and the saved plan survives where conversation history may not

## Next steps

Once this configuration is in place, you can refine it:

* Use [hooks](/docs/en/hooks-guide) to run per-directory linters or type-checkers after Claude edits files
* Review [Manage costs effectively](/docs/en/costs) to understand how codebase size affects token usage and how to set spend limits before a wider rollout
* Read [How Claude Code works in large codebases](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start) on the Claude blog for organizational rollout patterns and ownership models that sit above the per-repository configuration on this page


---

## Prompt library

`https://code.claude.com/docs/en/prompt-library`

Copy-paste prompts for Claude Code, tagged by task and role.

This is a library of prompts to copy into Claude Code. Use it to explore ways of working you haven't tried, or when you're not sure where to start.

The prompts are collected from various Anthropic guides, including [Common workflows](/docs/en/common-workflows), [Best practices](/docs/en/best-practices), and [How Anthropic teams use Claude Code](https://claude.com/blog/how-anthropic-teams-use-claude-code). They're starting points rather than scripts. Open **Why this works** under any prompt to see the pattern behind it so you can write your own.

<PromptLibrary />

## What makes these prompts work

The prompts above share a few patterns. Recognizing them helps you adapt any prompt here to your own task.

**Describe the outcome, not the steps.** Say what you want and let Claude find the files. The prompt below works without naming a single file path.

```text theme={null}
add rate limiting to the public API and make sure existing tests still pass
```

**Give it a way to check its own work.** Ask for run, test, compare, or verify in the same prompt so Claude iterates instead of stopping after one attempt.

```text theme={null}
write the migration, run it against the dev database, and confirm the schema matches
```

**Point at a reference.** Name an existing file, test, or pattern to match so the new code is consistent with what you already have.

```text theme={null}
add a settings page that follows the same layout as the profile page
```

**State the measurable target.** When the goal is performance or coverage, give the metric and threshold so completion is unambiguous.

```text theme={null}
get the bundle size under 200KB and show me what you removed
```

**Give it the artifact.** Paste errors, logs, screenshots, and plan output directly in the prompt, or type `@` to reference a file. Claude reads the source instead of your description of it.

```text theme={null}
why is the build failing? @build.log
```

**Say how you want the answer.** Name the format, length, or audience so the explanation fits how you'll use it. To make a format the default for every response, set an [output style](/docs/en/output-styles).

```text theme={null}
explain how the payment retry logic works as an HTML page with a diagram, then open it in my browser
```

For more on each pattern, see [best practices](/docs/en/best-practices).

## Where these come from

These prompts are based on patterns from published Anthropic resources. Each card links to its source:

* [Common workflows](/docs/en/common-workflows): step-by-step guides for the core tasks
* [Best practices](/docs/en/best-practices): prompting patterns and project setup
* [How Anthropic teams use Claude Code](https://claude.com/blog/how-anthropic-teams-use-claude-code): real workflows from engineering, product, design, and data teams, with deep dives on [legal](https://claude.com/blog/how-anthropic-uses-claude-legal), [marketing](https://claude.com/blog/how-anthropic-uses-claude-marketing), and [cybersecurity](https://claude.com/blog/how-anthropic-uses-claude-cybersecurity)
* [Scaling agentic coding guide](https://resources.anthropic.com/hubfs/Scaling%20agentic%20coding%20across%20your%20organization.pdf): the enterprise adoption guide

For video walkthroughs of these patterns, see the free [Claude Code in Action](https://anthropic.skilljar.com/claude-code-in-action) course on Anthropic Academy.

## Related resources

The prompts on this page are starting points. Once one works for your project, the next step is making it repeatable: save it as a [skill](/docs/en/skills) so anyone on your team can run it as a `/command`, and record the conventions Claude learned in [CLAUDE.md](/docs/en/memory) so every session starts with that context instead of Claude relearning it. For larger or riskier changes, [plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) shows you the file list before any edits happen.

If you're introducing Claude Code across a team, see [administration](/docs/en/admin-setup) for managed settings and policy, and [costs and usage](/docs/en/costs) for how this work is billed on your plan.


---

## Code Review

`https://code.claude.com/docs/en/code-review`

Set up automated PR reviews that catch logic errors, security vulnerabilities, and regressions using multi-agent analysis of your full codebase

<Note>
  Code Review is in research preview, available for [Team and Enterprise](https://claude.ai/admin-settings/claude-code) subscriptions. It is not available for organizations with [Zero Data Retention](/docs/en/zero-data-retention) enabled.
</Note>

Code Review analyzes your GitHub pull requests and posts findings as inline comments on the lines of code where it found issues. A fleet of specialized agents examine the code changes in the context of your full codebase, looking for logic errors, security vulnerabilities, broken edge cases, and subtle regressions.

Findings are tagged by severity and don't approve or block your PR, so existing review workflows stay intact. You can tune what Claude flags by adding a `CLAUDE.md` or `REVIEW.md` file to your repository.

To run Claude in your own CI infrastructure instead of this managed service, see [GitHub Actions](/docs/en/github-actions) or [GitLab CI/CD](/docs/en/gitlab-ci-cd). For repositories on a self-hosted GitHub instance, see [GitHub Enterprise Server](/docs/en/github-enterprise-server).

This page covers:

* [How reviews work](#how-reviews-work)
* [Setup](#set-up-code-review)
* [Triggering reviews manually](#manually-trigger-reviews) with `@claude review` and `@claude review once`
* [Customizing reviews](#customize-reviews) with `CLAUDE.md` and `REVIEW.md`
* [Pricing](#pricing)
* [Troubleshooting](#troubleshooting) failed runs and missing comments
* [Reviewing a diff locally](#review-a-diff-locally) with the `/code-review` command

<Note>
  To review a diff locally in your terminal without installing the GitHub App, run the `/code-review` command in any Claude Code session. See [Review a diff locally](#review-a-diff-locally).
</Note>

## How reviews work

Once an admin [enables Code Review](#set-up-code-review) for your organization, reviews trigger when a PR opens, on every push, or when manually requested, depending on the repository's configured behavior. Commenting `@claude review` [starts reviews on a PR](#manually-trigger-reviews) in any mode.

When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure. Each agent looks for a different class of issue, then a verification step checks candidates against actual code behavior to filter out false positives. The results are deduplicated, ranked by severity, and posted as inline comments on the specific lines where issues were found, with a summary in the review body. If no issues are found, Code Review updates the GitHub check run to show that no issues were detected. Claude may also post a short confirmation comment on the PR.

Reviews scale in cost with PR size and complexity, completing in 20 minutes on average. Admins can monitor review activity and spend via the [analytics dashboard](#view-usage).

### Severity levels

Each finding is tagged with a severity level:

| Marker | Severity     | Meaning                                                             |
| :----- | :----------- | :------------------------------------------------------------------ |
| 🔴     | Important    | A bug that should be fixed before merging                           |
| 🟡     | Nit          | A minor issue, worth fixing but not blocking                        |
| 🟣     | Pre-existing | A bug that exists in the codebase but was not introduced by this PR |

Findings include a collapsible extended reasoning section you can expand to understand why Claude flagged the issue and how it verified the problem.

### Rate and reply to findings

Each review comment from Claude arrives with 👍 and 👎 already attached so both buttons appear in the GitHub UI for one-click rating. Click 👍 if the finding was useful or 👎 if it was wrong or noisy. Anthropic collects reaction counts after the PR merges and uses them to tune the reviewer. Reactions do not trigger a re-review or change anything on the PR.

Replying to an inline comment does not prompt Claude to respond or update the PR. To act on a finding, fix the code and push. If the PR is subscribed to push-triggered reviews, the next run resolves the thread when the issue is fixed. To request a fresh review without pushing, comment `@claude review once` as a [top-level PR comment](#manually-trigger-reviews).

### Check run output

Beyond the inline review comments, each review populates the **Claude Code Review** check run that appears alongside your CI checks. Expand its **Details** link to see a summary of every finding in one place, sorted by severity:

| Severity     | File:Line                 | Issue                                                          |
| ------------ | ------------------------- | -------------------------------------------------------------- |
| 🔴 Important | `src/auth/session.ts:142` | Token refresh races with logout, leaving stale sessions active |
| 🟡 Nit       | `src/auth/session.ts:88`  | `parseExpiry` silently returns 0 on malformed input            |

Each finding also appears as an annotation in the **Files changed** tab, marked directly on the relevant diff lines. Important findings render with a red marker, nits with a yellow warning, and pre-existing bugs with a gray notice. Annotations and the severity table are written to the check run independently of inline review comments, so they remain available even if GitHub rejects an inline comment on a line that moved.

The check run always completes with a neutral conclusion so it never blocks merging through branch protection rules. If you want to gate merges on Code Review findings, read the severity breakdown from the check run output in your own CI. The last line of the Details text is a machine-readable comment your workflow can parse with `gh` and jq:

```bash theme={null}
gh api repos/OWNER/REPO/check-runs/CHECK_RUN_ID \
  --jq '.output.text | split("bughunter-severity: ")[1] | split(" -->")[0] | fromjson'
```

This returns a JSON object with counts per severity, for example `{"normal": 2, "nit": 1, "pre_existing": 0}`. The `normal` key holds the count of Important findings; a non-zero value means Claude found at least one bug worth fixing before merge.

### What Code Review checks

By default, Code Review focuses on correctness: bugs that would break production, not formatting preferences or missing test coverage. You can expand what it checks by [adding guidance files](#customize-reviews) to your repository.

## Set up Code Review

An admin enables Code Review once for the organization and selects which repositories to include.

<Steps>
  <Step title="Open Claude Code admin settings">
    Go to [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code) and find the Code Review section. You need admin access to your Claude organization and permission to install GitHub Apps in your GitHub organization.
  </Step>

  <Step title="Start setup">
    Click **Setup**. This begins the GitHub App installation flow.
  </Step>

  <Step title="Install the Claude GitHub App">
    Follow the prompts to install the Claude GitHub App to your GitHub organization. The app requests these repository permissions:

    * **Contents**: read and write
    * **Issues**: read and write
    * **Pull requests**: read and write

    Code Review uses read access to contents and write access to pull requests. The broader permission set also supports [GitHub Actions](/docs/en/github-actions) if you enable that later.
  </Step>

  <Step title="Select repositories">
    Choose which repositories to enable for Code Review. If you don't see a repository, make sure you gave the Claude GitHub App access to it during installation. You can add more repositories later.
  </Step>

  <Step title="Set review triggers per repo">
    After setup completes, the Code Review section shows your repositories in a table. For each repository, use the **Review Behavior** dropdown to choose when reviews run:

    * **Once after PR creation**: review runs once when a PR is opened or marked ready for review
    * **After every push**: review runs on every push to the PR branch, catching new issues as the PR evolves and auto-resolving threads when you fix flagged issues
    * **Manual**: reviews start only when someone [comments `@claude review` or `@claude review once` on a PR](#manually-trigger-reviews); `@claude review` also subscribes the PR to reviews on subsequent pushes

    Reviewing on every push runs the most reviews and costs the most. Manual mode is useful for high-traffic repos where you want to opt specific PRs into review, or to only start reviewing your PRs once they're ready.
  </Step>
</Steps>

The repositories table also shows the average cost per review for each repo based on recent activity. Use the row actions menu to turn Code Review on or off per repository, or to remove a repository entirely.

To verify setup, open a test PR. If you chose an automatic trigger, a check run named **Claude Code Review** appears within a few minutes. If you chose Manual, comment `@claude review` on the PR to start the first review. If no check run appears, confirm the repository is listed in your admin settings and the Claude GitHub App has access to it.

## Manually trigger reviews

Two comment commands start a review on demand. Both work regardless of the repository's configured trigger, so you can use them to opt specific PRs into review in Manual mode or to get an immediate re-review in other modes.

| Command               | What it does                                                                  |
| :-------------------- | :---------------------------------------------------------------------------- |
| `@claude review`      | Starts a review and subscribes the PR to push-triggered reviews going forward |
| `@claude review once` | Starts a single review without subscribing the PR to future pushes            |

Use `@claude review once` when you want feedback on the current state of a PR but don't want every subsequent push to incur a review. This is useful for long-running PRs with frequent pushes, or when you want a one-off second opinion without changing the PR's review behavior.

For either command to trigger a review:

* Post it as a top-level PR comment, not an inline comment on a diff line
* Put the command at the start of the comment, with `once` on the same line if you're using the one-shot form
* You must have owner, member, or collaborator access to the repository
* The PR must be open

Unlike automatic triggers, manual triggers run on draft PRs, since an explicit request signals you want the review now regardless of draft status.

If a review is already running on that PR, the request is queued until the in-progress review completes. You can monitor progress via the check run on the PR.

## Customize reviews

Code Review reads two files from your repository to guide what it flags. They differ in how strongly they influence the review:

* **`CLAUDE.md`**: shared project instructions that Claude Code uses for all tasks, not just reviews. Code Review reads it as project context and flags newly introduced violations as nits.
* **`REVIEW.md`**: review-only instructions, injected directly into every agent in the review pipeline as highest priority. Use it to change what gets flagged, at what severity, and how findings are reported.

### CLAUDE.md

Code Review reads your repository's `CLAUDE.md` files and treats newly introduced violations as [nit-level](#severity-levels) findings. This works bidirectionally: if your PR changes code in a way that makes a `CLAUDE.md` statement outdated, Claude flags that the docs need updating too.

Claude reads `CLAUDE.md` files at every level of your directory hierarchy, so rules in a subdirectory's `CLAUDE.md` apply only to files under that path. See the [memory documentation](/docs/en/memory) for more on how `CLAUDE.md` works.

For review-specific guidance that you don't want applied to general Claude Code sessions, use [`REVIEW.md`](#review-md) instead.

### REVIEW\.md

`REVIEW.md` is a file at your repository root that overrides how Code Review behaves on your repo. Its contents are injected into the system prompt of every agent in the review pipeline as the highest-priority instruction block, taking precedence over the default review guidance.

Because it's pasted verbatim, `REVIEW.md` is plain instructions: [`@` import syntax](/docs/en/memory#import-additional-files) is not expanded, and referenced files are not read into the prompt. Put the rules you want enforced directly in the file.

#### What you can tune

`REVIEW.md` is freeform markdown, so anything you can express as a review instruction is in scope. The patterns below have the most impact in practice.

**Severity**: redefine what 🔴 Important means for your repo. The default calibration targets production code; a docs repo, a config repo, or a prototype might want a much narrower definition. State explicitly which classes of finding are Important and which are Nit at most. You can also escalate in the other direction, for example treating any `CLAUDE.md` violation as Important rather than the default nit.

**Nit volume**: cap how many 🟡 Nit comments a single review posts. Prose and config files can be polished forever. A cap like "report at most five nits, mention the rest as a count in the summary" keeps reviews actionable.

**Skip rules**: list paths, branch patterns, and finding categories where Claude should post no findings. Common candidates are generated code, lockfiles, vendored dependencies, and machine-authored branches, along with anything your CI already enforces like linting or spellcheck. For paths that warrant some review but not full scrutiny, set a higher bar instead of skipping entirely: "in `scripts/`, only report if near-certain and severe."

**Repo-specific checks**: add rules you want flagged on every PR, like "new API routes must have an integration test." Because `REVIEW.md` is injected as highest priority, these land more reliably than the same rules in a long `CLAUDE.md`.

**Verification bar**: require evidence before a class of finding is posted. For example, "behavior claims need a `file:line` citation in the source, not an inference from naming" cuts false positives that would otherwise cost the author a round trip.

**Re-review convergence**: tell Claude how to behave when a PR has already been reviewed. A rule like "after the first review, suppress new nits and post Important findings only" stops a one-line fix from reaching round seven on style alone.

**Summary shape**: ask for the review body to open with a one-line tally such as `2 factual, 4 style`, and to lead with "no factual issues" when that's the case. The author wants to know the shape of the work before the details.

#### Example

This `REVIEW.md` recalibrates severity for a backend service, caps nits, skips generated files, and adds repo-specific checks.

```markdown theme={null}
# Review instructions

## What Important means here

Reserve Important for findings that would break behavior, leak data,
or block a rollback: incorrect logic, unscoped database queries, PII
in logs or error messages, and migrations that aren't backward
compatible. Style, naming, and refactoring suggestions are Nit at
most.

## Cap the nits

Report at most five Nits per review. If you found more, say "plus N
similar items" in the summary instead of posting them inline. If
everything you found is a Nit, lead the summary with "No blocking
issues."

## Do not report

- Anything CI already enforces: lint, formatting, type errors
- Generated files under `src/gen/` and any `*.lock` file
- Test-only code that intentionally violates production rules

## Always check

- New API routes have an integration test
- Log lines don't include email addresses, user IDs, or request bodies
- Database queries are scoped to the caller's tenant
```

#### Keep it focused

Length has a cost: a long `REVIEW.md` dilutes the rules that matter most. Keep it to instructions that change review behavior, and leave general project context in `CLAUDE.md`.

## View usage

Go to [claude.ai/analytics/code-review](https://claude.ai/analytics/code-review) to see Code Review activity across your organization. The dashboard shows:

| Section              | What it shows                                                                            |
| :------------------- | :--------------------------------------------------------------------------------------- |
| PRs reviewed         | Daily count of pull requests reviewed over the selected time range                       |
| Cost weekly          | Weekly spend on Code Review                                                              |
| Feedback             | Count of review comments that were auto-resolved because a developer addressed the issue |
| Repository breakdown | Per-repo counts of PRs reviewed and comments resolved                                    |

The repositories table in admin settings also shows average cost per review for each repo. Dashboard cost figures are estimates for monitoring activity; for invoice-accurate spend, refer to your Anthropic bill.

## Pricing

Code Review is billed based on token usage. Each review averages \$15-25 in cost, scaling with PR size, codebase complexity, and how many issues require verification. Code Review usage is billed separately through [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) and does not count against your plan's included usage.

The review trigger you choose affects total cost:

* **Once after PR creation**: runs once per PR
* **After every push**: runs on each push, multiplying cost by the number of pushes
* **Manual**: no reviews until someone comments `@claude review` on a PR

In any mode, commenting `@claude review` [opts the PR into push-triggered reviews](#manually-trigger-reviews), so additional cost accrues per push after that comment. To run a single review without subscribing to future pushes, comment `@claude review once` instead.

Costs appear on your Anthropic bill regardless of whether your organization uses Amazon Bedrock or Google Vertex AI for other Claude Code features. To set a monthly spend cap for Code Review, go to [claude.ai/admin-settings/usage](https://claude.ai/admin-settings/usage) and configure the limit for the Claude Code Review service.

Monitor spend via the weekly cost chart in [analytics](#view-usage) or the per-repo average cost column in admin settings.

## Troubleshooting

Review runs are best-effort. A failed run never blocks your PR, but it also doesn't retry on its own. This section covers how to recover from a failed run and where to look when the check run reports issues you can't find.

### Retrigger a failed or timed-out review

When the review infrastructure hits an internal error or exceeds its time limit, the check run completes with a title of **Code review encountered an error** or **Code review timed out**. The conclusion is still neutral, so nothing blocks your merge, but no findings are posted.

To run the review again, comment `@claude review once` on the PR. This starts a fresh review without subscribing the PR to future pushes. If the PR is already subscribed to push-triggered reviews, pushing a new commit also starts a new review.

The **Re-run** button in GitHub's Checks tab does not retrigger Code Review. Use the comment command or a new push instead.

### Review didn't run and the PR shows a spend-cap message

When your organization's monthly spend cap is reached, Code Review posts a single comment on the PR explaining that the review was skipped. Reviews resume automatically at the start of the next billing period, or immediately when an admin raises the cap at [claude.ai/admin-settings/usage](https://claude.ai/admin-settings/usage).

### Find issues that aren't showing as inline comments

If the check run title says issues were found but you don't see inline review comments on the diff, look in these other locations where findings are surfaced:

* **Check run Details**: click **Details** next to the Claude Code Review check in the Checks tab. The severity table lists every finding with its file, line, and summary regardless of whether the inline comment was accepted.
* **Files changed annotations**: open the **Files changed** tab on the PR. Findings render as annotations attached directly to the diff lines, separate from review comments.
* **Review body**: if you pushed to the PR while a review was running, some findings may reference lines that no longer exist in the current diff. Those appear under an **Additional findings** heading in the review body text rather than as inline comments.

## Review a diff locally

The [`/code-review` command](/docs/en/commands) reviews a diff in your terminal without installing the GitHub App. Run it in any Claude Code session: it reports correctness bugs and reuse, simplification, and efficiency cleanups in the current diff. Pass `--comment` to post findings as inline PR comments, or `--fix` to apply the findings to your working tree after the review.

Lower [effort levels](/docs/en/model-config#adjust-effort-level) return fewer, higher-confidence findings, while `high` through `max` give broader coverage and may include uncertain findings. Without an effort argument, the review uses the session's current effort. Pass a path or PR reference to review a specific target instead of the current diff.

`/code-review ultra --fix` runs the deeper [ultrareview](/docs/en/ultrareview) in the cloud, then applies its findings to your working tree when they arrive back in your session.

The command was named `/simplify` before v2.1.147, when it applied fixes by default. From v2.1.154, `/simplify` runs a separate cleanup-only review that applies fixes without hunting for bugs. If you scripted `/simplify` for bug-finding, switch to `/code-review --fix`, which is unchanged.

## Related resources

Code Review is designed to work alongside the rest of Claude Code. If you want to run reviews locally before opening a PR, need a self-hosted setup, or want to go deeper on how `CLAUDE.md` shapes Claude's behavior across tools, these pages are good next stops:

* [Commands](/docs/en/commands): run `/code-review` in a local Claude Code session to check a diff before pushing
* [GitHub Actions](/docs/en/github-actions): run Claude in your own GitHub Actions workflows for custom automation beyond code review
* [GitLab CI/CD](/docs/en/gitlab-ci-cd): self-hosted Claude integration for GitLab pipelines
* [Memory](/docs/en/memory): how `CLAUDE.md` files work across Claude Code
* [Analytics](/docs/en/analytics): track Claude Code usage beyond code review


---

## Run parallel sessions with worktrees

`https://code.claude.com/docs/en/worktrees`

Isolate parallel Claude Code sessions in separate git worktrees so changes don't collide. Covers the `--worktree` flag, subagent isolation, `.worktreeinclude`, cleanup, and non-git VCS hooks.

A [git worktree](https://git-scm.com/docs/git-worktree) is a separate working directory with its own files and branch, sharing the same repository history and remote as your main checkout. Running each Claude Code session in its own worktree means edits in one session never touch files in another, so you can have Claude building a feature in one terminal while fixing a bug in a second.

This page covers worktree isolation in the CLI. Everything below assumes a git repository. For other version control systems, see [Non-git version control](#non-git-version-control). The [desktop app](/docs/en/desktop#work-in-parallel-with-sessions) creates a worktree for every new session automatically.

Worktrees are one of several ways to run Claude in parallel. They isolate file edits, while [subagents](/docs/en/sub-agents) and [agent teams](/docs/en/agent-teams) coordinate the work itself. See [Run agents in parallel](/docs/en/agents) to compare the approaches, or skip ahead to [Isolate subagents with worktrees](#isolate-subagents-with-worktrees) to use worktrees and subagents together.

## Start Claude in a worktree

Pass `--worktree` or `-w` to create an isolated worktree and start Claude in it. By default, the worktree is created under `.claude/worktrees/<value>/` at your repository root, on a new branch named `worktree-<value>`:

```bash theme={null}
claude --worktree feature-auth
```

To put worktrees somewhere else, configure a [`WorktreeCreate` hook](#non-git-version-control). Run the command again with a different name in another terminal to start a second isolated session:

```bash theme={null}
claude --worktree bugfix-123
```

If you omit the name, Claude generates one such as `bright-running-fox`:

```bash theme={null}
claude --worktree
```

You can also ask Claude to "work in a worktree" during a session, and it will create one with the [`EnterWorktree`](/docs/en/tools-reference) tool. Once in a worktree, Claude can switch directly to another one under `.claude/worktrees/` by calling `EnterWorktree` with the target path. The previous worktree stays on disk untouched.

Before using `--worktree` in a directory for the first time, accept the workspace trust dialog by running `claude` once in that directory. If trust has not yet been accepted, `--worktree` exits with an error and prompts you to run `claude` in the directory first, including when combined with `-p`.

<Tip>
  Add `.claude/worktrees/` to your `.gitignore` so worktree contents don't appear as untracked files in your main checkout.
</Tip>

### Choose the base branch

Worktrees branch from your repository's default branch, `origin/HEAD`, so they start from a clean tree matching the remote. If no remote is configured or the fetch fails, the worktree falls back to your current local `HEAD`. To always branch from local `HEAD` instead, set `worktree.baseRef` to `"head"` in [settings](/docs/en/settings#worktree-settings). Setting `baseRef` to `"head"` makes new worktrees carry your unpushed commits and feature-branch state, which is useful when isolating subagents that need to operate on in-progress work. The setting accepts only `"fresh"` or `"head"`, not arbitrary git refs:

```json theme={null}
{
  "worktree": {
    "baseRef": "head"
  }
}
```

To branch from a specific pull request, pass the PR number prefixed with `#`, or a full GitHub pull request URL. Claude Code fetches `pull/<number>/head` from `origin` and creates the worktree at `.claude/worktrees/pr-<number>`:

```bash theme={null}
claude --worktree "#1234"
```

For full control over how worktrees are created, configure a [`WorktreeCreate` hook](/docs/en/hooks#worktreecreate), which replaces the default `git worktree` logic entirely.

## Copy gitignored files into worktrees

A worktree is a fresh checkout, so untracked files like `.env` or `.env.local` from your main repository are not present. To copy them automatically when Claude creates a worktree, add a `.worktreeinclude` file to your project root.

The file uses `.gitignore` syntax. Only files that match a pattern and are also gitignored are copied, so tracked files are never duplicated.

This `.worktreeinclude` copies two env files and a secrets config into each new worktree:

```text .worktreeinclude theme={null}
.env
.env.local
config/secrets.json
```

This applies to worktrees created with `--worktree`, [subagent worktrees](#isolate-subagents-with-worktrees), and parallel sessions in the [desktop app](/docs/en/desktop#work-in-parallel-with-sessions).

## Isolate subagents with worktrees

Subagents can run in their own worktrees so parallel edits don't conflict. Ask Claude to "use worktrees for your agents", or set it permanently on a [custom subagent](/docs/en/sub-agents#supported-frontmatter-fields) by adding `isolation: worktree` to the frontmatter. Each subagent gets a temporary worktree that is removed automatically when the subagent finishes without changes.

Subagent worktrees use the same [base branch](#choose-the-base-branch) as `--worktree`, so they branch from your repository's default branch unless `worktree.baseRef` is set to `"head"`.

## Clean up worktrees

When you exit a worktree session, cleanup depends on whether you made changes:

* **No uncommitted changes, no untracked files, and no new commits**: the worktree and its branch are removed automatically. If the session has a [name](/docs/en/sessions#name-your-sessions), Claude prompts instead so you can keep the worktree for later
* **Uncommitted changes, untracked files, or new commits exist**: Claude prompts you to keep or remove the worktree. Keeping preserves the directory and branch so you can return later. Removing deletes the worktree directory and its branch, discarding any uncommitted changes, untracked files, and commits
* **Non-interactive runs**: worktrees created with `--worktree` alongside `-p` are not cleaned up automatically since there is no exit prompt. Remove them with `git worktree remove`

Worktrees that Claude created for subagents and [background sessions](/docs/en/agent-view#how-file-edits-are-isolated) are removed automatically once they are older than your [`cleanupPeriodDays`](/docs/en/settings#available-settings) setting, provided they have no uncommitted changes, no untracked files, and no unpushed commits. Worktrees you create with `--worktree` are never removed by this sweep.

## Manage worktrees manually

For full control over worktree location and branch configuration, create worktrees with Git directly. This is useful when you need to check out a specific existing branch or place the worktree outside the repository.

Create a worktree on a new branch:

```bash theme={null}
git worktree add ../project-feature-a -b feature-a
```

Create a worktree from an existing branch:

```bash theme={null}
git worktree add ../project-bugfix bugfix-123
```

Start Claude in the worktree:

```bash theme={null}
cd ../project-feature-a && claude
```

List your worktrees:

```bash theme={null}
git worktree list
```

Remove one when you're done with it:

```bash theme={null}
git worktree remove ../project-feature-a
```

See the [Git worktree documentation](https://git-scm.com/docs/git-worktree) for the full command reference. Remember to initialize your development environment in each new worktree: install dependencies, set up virtual environments, or run whatever your project's setup requires.

## Non-git version control

Worktree isolation uses git by default. For SVN, Perforce, Mercurial, or other systems, configure [`WorktreeCreate` and `WorktreeRemove` hooks](/docs/en/hooks#worktreecreate) to provide custom creation and cleanup logic. Because the hook replaces the default git behavior, [`.worktreeinclude`](#copy-gitignored-files-into-worktrees) is not processed when you use `--worktree`. Copy any local configuration files inside your hook script instead.

This `WorktreeCreate` hook reads the worktree name from stdin, checks out a fresh SVN working copy, and prints the directory path so Claude Code can use it as the session's working directory:

```json theme={null}
{
  "hooks": {
    "WorktreeCreate": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'NAME=$(jq -r .name); DIR=\"$HOME/.claude/worktrees/$NAME\"; svn checkout https://svn.example.com/repo/trunk \"$DIR\" >&2 && echo \"$DIR\"'"
          }
        ]
      }
    ]
  }
}
```

Pair it with a `WorktreeRemove` hook to clean up when the session ends. See the [hooks reference](/docs/en/hooks#worktreecreate) for the input schema and a removal example.

## See also

Worktrees handle file isolation. The related pages below cover delegating work into those isolated checkouts and switching between the sessions you create:

* [Subagents](/docs/en/sub-agents): delegate work to isolated agents within a session
* [Agent teams](/docs/en/agent-teams): coordinate multiple Claude sessions automatically
* [Manage sessions](/docs/en/sessions): name, resume, and switch between conversations
* [Desktop parallel sessions](/docs/en/desktop#work-in-parallel-with-sessions): worktree-backed sessions in the desktop app


---

## Explore the context window

`https://code.claude.com/docs/en/context-window`

An interactive simulation of how Claude Code's context window fills during a session. See what loads automatically, what each file read costs, and when rules and hooks fire.

Claude Code's context window holds everything Claude knows about your session: your instructions, the files it reads, its own responses, and content that never appears in your terminal. The timeline below walks through what loads and when. See [the written breakdown](#what-the-timeline-shows) for the same content as a list.

<ContextWindow />

## What the timeline shows

The session walks through a realistic flow with representative token counts:

* **Before you type anything**: CLAUDE.md, auto memory, MCP tool names, and skill descriptions all load into context. Your own setup may add more here, like an [output style](/docs/en/output-styles) or text from [`--append-system-prompt`](/docs/en/cli-reference), which both go into the system prompt the same way.
* **As Claude works**: each file read adds to context, [path-scoped rules](/docs/en/memory#path-specific-rules) load automatically alongside matching files, and a [PostToolUse hook](/docs/en/hooks-guide) fires after each edit.
* **The follow-up prompt**: a [subagent](/docs/en/sub-agents) handles the research in its own separate context window, so the large file reads stay out of yours. Only the summary and a small metadata trailer come back.
* **At the end**: `/compact` replaces the conversation with a structured summary. Most startup content reloads automatically; the table below shows what happens to each mechanism.

## What survives compaction

When a long session compacts, Claude Code summarizes the conversation history to fit the context window. What happens to your instructions depends on how they were loaded:

| Mechanism                                 | After compaction                                                                            |
| :---------------------------------------- | :------------------------------------------------------------------------------------------ |
| System prompt and output style            | Unchanged; not part of message history                                                      |
| Project-root CLAUDE.md and unscoped rules | Re-injected from disk                                                                       |
| Auto memory                               | Re-injected from disk                                                                       |
| Rules with `paths:` frontmatter           | Lost until a matching file is read again                                                    |
| Nested CLAUDE.md in subdirectories        | Lost until a file in that subdirectory is read again                                        |
| Invoked skill bodies                      | Re-injected, capped at 5,000 tokens per skill and 25,000 tokens total; oldest dropped first |
| Hooks                                     | Not applicable; hooks run as code, not context                                              |

Path-scoped rules and nested CLAUDE.md files load into message history when their trigger file is read, so compaction summarizes them away with everything else. They reload the next time Claude reads a matching file. If a rule must persist across compaction, drop the `paths:` frontmatter or move it to the project-root CLAUDE.md.

Skill bodies are re-injected after compaction, but large skills are truncated to fit the per-skill cap, and the oldest invoked skills are dropped once the total budget is exceeded. Truncation keeps the start of the file, so put the most important instructions near the top of `SKILL.md`.

## Check your own session

The visualization uses representative numbers. To see your actual context usage at any point, run `/context` for a live breakdown by category with optimization suggestions. Run `/memory` to check which CLAUDE.md and auto memory files loaded at startup.

## Related resources

For deeper coverage of the features shown in the timeline, see these pages:

* [Extend Claude Code](/docs/en/features-overview): when to use CLAUDE.md vs skills vs rules vs hooks vs MCP
* [Store instructions and memories](/docs/en/memory): CLAUDE.md hierarchy and auto memory
* [Subagents](/docs/en/sub-agents): delegate research to a separate context window
* [Best practices](/docs/en/best-practices): managing context as your primary constraint
* [Prompt caching](/docs/en/prompt-caching): which actions invalidate the cached prefix
* [Reduce token usage](/docs/en/costs#reduce-token-usage): strategies for keeping context usage low
