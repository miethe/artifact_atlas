# Sessions, Modes & Interactive Features

_Claude Code documentation — Sessions, Modes & Interactive Features. Source: https://code.claude.com/docs/en/_


---

## Manage sessions

`https://code.claude.com/docs/en/sessions`

Name, resume, branch, and switch between Claude Code conversations. Covers `--continue`, `--resume`, `--from-pr`, the `/resume` picker, session naming, and where transcripts are stored.

A session is a saved conversation tied to a project directory. Claude Code stores it locally as you work, so you can resume where you left off, branch to try a different approach, or switch between tasks.

The [desktop app](/docs/en/desktop#work-in-parallel-with-sessions), [Claude Code on the web](/docs/en/claude-code-on-the-web), and the [VS Code extension](/docs/en/vs-code#resume-past-conversations) each maintain their own session history. This page covers the CLI:

* [Resume](#resume-a-session) a previous conversation by flag, name, or PR
* [Name](#name-your-sessions) sessions so you can find them later
* [Browse](#use-the-session-picker) sessions with the `/resume` picker
* [Branch](#branch-a-session) a conversation to try a different approach
* [Export](#export-and-locate-session-data) transcripts and find them on disk

## Resume a session

Sessions are saved continuously to [local transcript files](#export-and-locate-session-data) as you work, so you can return to one after exiting or running `/clear`. Use these entry points:

| Command                     | What it does                                                       |
| :-------------------------- | :----------------------------------------------------------------- |
| `claude --continue`         | Resumes the most recent session in the current directory           |
| `claude --resume`           | Opens the [session picker](#use-the-session-picker)                |
| `claude --resume <name>`    | Resumes the named session directly                                 |
| `claude --from-pr <number>` | Resumes the session linked to that pull request                    |
| `/resume`                   | Switches to a different conversation from inside an active session |

Sessions created with [`claude -p`](/docs/en/headless) or the [Agent SDK](/docs/en/agent-sdk/overview) do not appear in the session picker, but you can still resume one by passing its session ID to `claude --resume <session-id>`.

### Where the session picker looks

Sessions are stored per project directory. By default the session picker shows interactive sessions from the current worktree, plus sessions started elsewhere that added the current directory with `/add-dir`. Use `Ctrl+W` to widen to all worktrees of the repository or `Ctrl+A` to widen to every project on this machine.

Selecting a session from another worktree of the same repository resumes it in place. Selecting a session from an unrelated project copies a `cd` and resume command to your clipboard instead.

Resuming by name resolves across the current repository and its worktrees. Both forms look for an exact match and resume it directly even if it lives in a different worktree:

| Command                  | Exact match      | Ambiguous name                                                              |
| :----------------------- | :--------------- | :-------------------------------------------------------------------------- |
| `claude --resume <name>` | Resumes directly | Opens the session picker with the name pre-filled as a search term          |
| `/resume <name>`         | Resumes directly | Reports an error; run `/resume` with no argument to open the session picker |

## Name your sessions

Give sessions descriptive names so they're findable in the session picker and resumable by name. This matters most when you're working on several tasks in parallel.

| When                    | How to set the name                                                                                                                                                |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At startup              | `claude -n auth-refactor`                                                                                                                                          |
| During a session        | `/rename auth-refactor`. The name also appears on the prompt bar                                                                                                   |
| From the session picker | Highlight a session and press `Ctrl+R`                                                                                                                             |
| On plan accept          | Accepting a plan in [plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) names the session from the plan content unless you've already set one |

Once a session is named, return to it with `claude --resume <name>` or `/resume <name>`. See [Resume a session](#resume-a-session) for how name resolution behaves across worktrees.

## Use the session picker

Run `/resume` inside a session, or `claude --resume` with no arguments, to open the interactive session picker. Use these keyboard shortcuts to navigate, search, and widen the list:

| Shortcut                                          | Action                                                                                                                                                       |
| :------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `↑` / `↓`                                         | Navigate between sessions                                                                                                                                    |
| `→` / `←`                                         | Expand or collapse grouped sessions                                                                                                                          |
| `Enter`                                           | Resume the highlighted session                                                                                                                               |
| `Space`                                           | Preview the session content. `Ctrl+V` also works on terminals that don't capture it as paste                                                                 |
| `Ctrl+R`                                          | Rename the highlighted session                                                                                                                               |
| `/` or any printable character other than `Space` | Enter search mode and filter sessions. Paste a GitHub, GitHub Enterprise, GitLab, or Bitbucket pull or merge request URL to find the session that created it |
| `Ctrl+A`                                          | Show sessions from all projects on this machine. Press again to return to the current repository                                                             |
| `Ctrl+W`                                          | Show sessions from all worktrees of the current repository. Press again to return to the current worktree. Only shown in multi-worktree repositories         |
| `Ctrl+B`                                          | Filter to sessions from the current git branch. Press again to show all branches                                                                             |
| `Esc`                                             | Exit the session picker or search mode                                                                                                                       |

Each row shows the session name if set, otherwise the conversation summary or first prompt, along with time since last activity, message count, and git branch. Project path appears after you widen to all projects with `Ctrl+A`.

Forked sessions created with `/branch`, `/rewind`, or `--fork-session` are grouped under their root session. Press `→` to expand a group.

## Branch a session

Branching creates a copy of the conversation so far and switches you into it, leaving the original intact. Use it to try a different approach without losing the path you were on.

From inside a session, run `/branch` with an optional name:

```text theme={null}
/branch try-streaming-approach
```

From the command line, combine `--continue` or `--resume` with `--fork-session`:

```bash theme={null}
claude --continue --fork-session
```

The original session is unchanged and remains available in the session picker. The `/branch` confirmation prints two session IDs: the new branch you are now in and the original. To return to the original, pass its ID to `/resume`, use the session picker, or run `/resume <original-name>`. Permissions you approved with "allow for this session" do not carry over to the new branch. If you resume the same session in two terminals without forking, messages from both interleave into one transcript.

For checkpoint-based rewind within a single session, see [Checkpointing](/docs/en/checkpointing).

## Manage context within a session

These commands control what's in the context window without leaving the session:

* **`/clear`**: start fresh with an empty context. The previous conversation is saved and resumable
* **`/compact [instructions]`**: replace history with a summary, optionally focused on what you specify
* **`/context`**: show what is currently consuming context

For how compaction interacts with CLAUDE.md, skills, and rules, see the [context window guide](/docs/en/context-window). For strategies on when to clear versus compact, see [Best practices](/docs/en/best-practices#manage-your-session).

## Export and locate session data

Run `/export` to copy the current conversation to your clipboard or save it as a plain-text file, with messages and tool outputs rendered as readable text. Pass a filename to write directly to that file.

Transcripts are stored as JSONL at `~/.claude/projects/<project>/<session-id>.jsonl`, where `<project>` is derived from your working directory path. Each line is a JSON object for a message, tool use, or metadata entry. To store sessions somewhere other than `~/.claude`, set [`CLAUDE_CONFIG_DIR`](/docs/en/env-vars). These local files are removed after 30 days by default; change this with [`cleanupPeriodDays`](/docs/en/settings#available-settings).

To suppress transcript writes entirely, set [`CLAUDE_CODE_SKIP_PROMPT_HISTORY`](/docs/en/env-vars), or in non-interactive mode use `--no-session-persistence`.

## See also

These pages cover related session and parallelism mechanics:

* [Worktrees](/docs/en/worktrees): run isolated parallel sessions on separate branches
* [Checkpointing](/docs/en/checkpointing): rewind code and conversation to an earlier point
* [Context window](/docs/en/context-window): what fills context and what survives compaction
* [Non-interactive mode](/docs/en/headless): session behavior under `claude -p`


---

## Checkpointing

`https://code.claude.com/docs/en/checkpointing`

Track, rewind, and summarize Claude's edits and conversation to manage session state.

Claude Code automatically tracks Claude's file edits as you work, allowing you to quickly undo changes and rewind to previous states if anything gets off track.

## How checkpoints work

As you work with Claude, checkpointing automatically captures the state of your code before each edit. This safety net lets you pursue ambitious, wide-scale tasks knowing you can always return to a prior code state.

### Automatic tracking

Claude Code tracks all changes made by its file editing tools:

* Every user prompt creates a new checkpoint
* Checkpoints persist across sessions, so you can access them in resumed conversations
* Automatically cleaned up along with sessions after 30 days (configurable)

### Rewind and summarize

Run `/rewind`, or press `Esc` twice when the prompt input is empty, to open the rewind menu.

<Note>
  If the prompt input contains text, double `Esc` clears it instead of opening the menu. The cleared text is saved to your input history, so press `Up` to recall it after you finish in the rewind menu.
</Note>

The rewind menu lists each prompt you sent during the session. Select the point you want to act on, then choose an action:

* **Restore code and conversation**: revert both code and conversation to that point
* **Restore conversation**: rewind to that message while keeping current code
* **Restore code**: revert file changes while keeping the conversation
* **Summarize from here**: compress the conversation from this point forward into a summary, freeing context window space
* **Summarize up to here**: compress the conversation before this point into a summary, keeping later messages intact
* **Never mind**: return to the message list without making changes

After restoring the conversation or choosing Summarize from here, the original prompt from the selected message is restored into the input field so you can re-send or edit it.

Choosing Summarize up to here leaves you at the end of the conversation with the input empty.

#### Restore vs. summarize

The restore options revert state: they undo code changes, conversation history, or both. The summarize options compress part of the conversation into an AI-generated summary without changing files on disk:

* **Summarize from here**: messages before the selected message stay intact. The selected message and everything after it are replaced with a summary. Use this to discard a side discussion while keeping early context in full detail.
* **Summarize up to here**: messages before the selected message are replaced with a summary. The selected message and everything after it stay intact, and you remain at the end of the conversation. Use this to compress early setup discussion while keeping recent work in full detail.

In both cases the original messages are preserved in the session transcript, so Claude can reference the details if needed. You can type optional instructions to guide what the summary focuses on. This is similar to `/compact`, but targeted: instead of summarizing the entire conversation, you choose which side of the selected message to compress.

<Note>
  Summarize keeps you in the same session and compresses context. If you want to branch off and try a different approach while preserving the original session intact, use [fork](/docs/en/sessions#branch-a-session) instead (`claude --continue --fork-session`).
</Note>

## Common use cases

Checkpoints are particularly useful when:

* **Exploring alternatives**: try different implementation approaches without losing your starting point
* **Recovering from mistakes**: quickly undo changes that introduced bugs or broke functionality
* **Iterating on features**: experiment with variations knowing you can revert to working states
* **Freeing context space**: summarize a verbose debugging session from the midpoint forward, keeping your initial instructions intact

## Limitations

### Bash command changes not tracked

Checkpointing does not track files modified by bash commands. For example, if Claude Code runs:

```bash theme={null}
rm file.txt
mv old.txt new.txt
cp source.txt dest.txt
```

These file modifications cannot be undone through rewind. Only direct file edits made through Claude's file editing tools are tracked.

### External changes not tracked

Checkpointing only tracks files that have been edited within the current session. Manual changes you make to files outside of Claude Code and edits from other concurrent sessions are normally not captured, unless they happen to modify the same files as the current session.

### Not a replacement for version control

Checkpoints are designed for quick, session-level recovery. For permanent version history and collaboration:

* Continue using version control (ex. Git) for commits, branches, and long-term history
* Checkpoints complement but don't replace proper version control
* Think of checkpoints as "local undo" and Git as "permanent history"

## See also

* [Interactive mode](/docs/en/interactive-mode) - Keyboard shortcuts and session controls
* [Commands](/docs/en/commands) - Accessing checkpoints using `/rewind`
* [CLI reference](/docs/en/cli-reference) - Command-line options


---

## Interactive mode

`https://code.claude.com/docs/en/interactive-mode`

Complete reference for keyboard shortcuts, input modes, and interactive features in Claude Code sessions.

## Keyboard shortcuts

<Note>
  Keyboard shortcuts may vary by platform and terminal. In [fullscreen rendering](/docs/en/fullscreen), press `?` in the transcript viewer to see available shortcuts there.

  **macOS users**: Option/Alt key shortcuts (`Alt+B`, `Alt+F`, `Alt+Y`, `Alt+M`, `Alt+P`) require configuring Option as Meta in your terminal:

  * **iTerm2**: Settings → Profiles → Keys → General → set Left/Right Option key to "Esc+"
  * **Apple Terminal**: Settings → Profiles → Keyboard → check "Use Option as Meta Key"
  * **VS Code**: set `"terminal.integrated.macOptionIsMeta": true` in VS Code settings

  See [Terminal configuration](/docs/en/terminal-config) for details.
</Note>

### General controls

| Shortcut                                                  | Description                                                                                                                                                | Context                                                                                                                                                                                                                                                                                                |
| :-------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ctrl+C`                                                  | Interrupt, or clear input                                                                                                                                  | Interrupts a running operation. If nothing is running, the first press clears the prompt input and a second press exits Claude Code                                                                                                                                                                    |
| `Ctrl+X Ctrl+K`                                           | Kill all running [background subagents](/docs/en/sub-agents#run-subagents-in-foreground-or-background) in this session. Press twice within 3 seconds to confirm | Subagent control                                                                                                                                                                                                                                                                                       |
| `Ctrl+D`                                                  | Exit Claude Code session                                                                                                                                   | EOF signal                                                                                                                                                                                                                                                                                             |
| `Ctrl+G` or `Ctrl+X Ctrl+E`                               | Open in default text editor                                                                                                                                | Edit your prompt or custom response in your default text editor. `Ctrl+X Ctrl+E` is the readline-native binding. Turn on Show last response in external editor in `/config` to prepend Claude's previous reply as `#`-commented context above your prompt; the comment block is stripped when you save |
| `Ctrl+L`                                                  | Redraw screen                                                                                                                                              | Forces a full terminal redraw. Input and conversation history are kept. Use this to recover if the display becomes garbled or partially blank                                                                                                                                                          |
| `Ctrl+O`                                                  | Toggle transcript viewer                                                                                                                                   | Shows detailed tool usage and execution. Also expands MCP calls, which collapse to a single line like "Called slack 3 times" by default                                                                                                                                                                |
| `Ctrl+R`                                                  | Reverse search command history                                                                                                                             | Search through previous commands interactively                                                                                                                                                                                                                                                         |
| `Ctrl+V` or `Cmd+V` (iTerm2) or `Alt+V` (Windows and WSL) | Paste image from clipboard                                                                                                                                 | Inserts an `[Image #N]` chip at the cursor so you can reference it positionally in your prompt. On WSL, both `Ctrl+V` and `Alt+V` are bound; use `Alt+V` if your terminal intercepts `Ctrl+V`                                                                                                          |
| `Ctrl+B`                                                  | Background running tasks                                                                                                                                   | Backgrounds bash commands and agents. Tmux users press twice                                                                                                                                                                                                                                           |
| `Ctrl+T`                                                  | Toggle task list                                                                                                                                           | Show or hide the [task list](#task-list) in the terminal status area                                                                                                                                                                                                                                   |
| `Left/Right arrows`                                       | Cycle through dialog tabs                                                                                                                                  | Navigate between tabs in permission dialogs and menus                                                                                                                                                                                                                                                  |
| `Up/Down arrows` or `Ctrl+P`/`Ctrl+N`                     | Move cursor or navigate command history                                                                                                                    | In multiline input, first moves the cursor within the prompt. Once the cursor is already on the top or bottom edge, pressing again navigates command history                                                                                                                                           |
| `Esc`                                                     | Interrupt Claude                                                                                                                                           | Stop the current response or tool call mid-turn so you can redirect. Claude keeps the work done so far                                                                                                                                                                                                 |
| `Esc` + `Esc`                                             | Clear input draft, or rewind                                                                                                                               | When the prompt input contains text, double `Esc` clears it and saves the draft to history so `Up` recalls it. When the input is empty, double `Esc` opens the [rewind menu](/docs/en/checkpointing) to restore or summarize code and conversation from a previous point                                    |
| `Shift+Tab` or `Alt+M` (some configurations)              | Cycle permission modes                                                                                                                                     | Cycle through `default`, `acceptEdits`, `plan`, and any modes you have enabled, such as `auto` or `bypassPermissions`. See [permission modes](/docs/en/permission-modes).                                                                                                                                   |
| `Option+P` (macOS) or `Alt+P` (Windows/Linux)             | Switch model                                                                                                                                               | Switch models without clearing your prompt                                                                                                                                                                                                                                                             |
| `Option+T` (macOS) or `Alt+T` (Windows/Linux)             | Toggle extended thinking                                                                                                                                   | Enable or disable extended thinking mode. As of v2.1.132 this shortcut works on macOS without configuring Option as Meta                                                                                                                                                                               |
| `Option+O` (macOS) or `Alt+O` (Windows/Linux)             | Toggle fast mode                                                                                                                                           | Enable or disable [fast mode](/docs/en/fast-mode)                                                                                                                                                                                                                                                           |

### Text editing

| Shortcut                 | Description                          | Context                                                                                                                                                                               |
| :----------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Ctrl+A`                 | Move cursor to start of current line | In multiline input, moves to the start of the current logical line                                                                                                                    |
| `Ctrl+E`                 | Move cursor to end of current line   | In multiline input, moves to the end of the current logical line                                                                                                                      |
| `Ctrl+K`                 | Delete to end of line                | Stores deleted text for pasting                                                                                                                                                       |
| `Ctrl+U`                 | Delete from cursor to line start     | Stores deleted text for pasting. Repeat to clear across lines in multiline input. On macOS, terminal emulators including iTerm2 and Terminal.app map `Cmd+Backspace` to this shortcut |
| `Ctrl+W`                 | Delete previous word                 | Stores deleted text for pasting. On Windows, `Ctrl+Backspace` also deletes the previous word                                                                                          |
| `Ctrl+Y`                 | Paste deleted text                   | Paste text deleted with `Ctrl+K`, `Ctrl+U`, or `Ctrl+W`                                                                                                                               |
| `Alt+Y` (after `Ctrl+Y`) | Cycle paste history                  | After pasting, cycle through previously deleted text. Requires [Option as Meta](#keyboard-shortcuts) on macOS                                                                         |
| `Alt+B`                  | Move cursor back one word            | Word navigation. Requires [Option as Meta](#keyboard-shortcuts) on macOS                                                                                                              |
| `Alt+F`                  | Move cursor forward one word         | Word navigation. Requires [Option as Meta](#keyboard-shortcuts) on macOS                                                                                                              |

### Theme and display

| Shortcut | Description                                | Context                                                                                                      |
| :------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `Ctrl+T` | Toggle syntax highlighting for code blocks | Only works inside the `/theme` picker menu. Controls whether code in Claude's responses uses syntax coloring |

### Multiline input

| Method           | Shortcut       | Context                                                                                            |
| :--------------- | :------------- | :------------------------------------------------------------------------------------------------- |
| Quick escape     | `\` + `Enter`  | Works in all terminals                                                                             |
| Option key       | `Option+Enter` | After enabling [Option as Meta](/docs/en/terminal-config#enable-option-key-shortcuts-on-macos) on macOS |
| Shift+Enter      | `Shift+Enter`  | Native in iTerm2, WezTerm, Ghostty, Kitty, Warp, Apple Terminal, Windows Terminal                  |
| Control sequence | `Ctrl+J`       | Works in any terminal without configuration                                                        |
| Paste mode       | Paste directly | For code blocks, logs                                                                              |

<Tip>
  Shift+Enter works without configuration in iTerm2, WezTerm, Ghostty, Kitty, Warp, Apple Terminal, and Windows Terminal. For VS Code, Cursor, Windsurf, Alacritty, and Zed, run `/terminal-setup` to install the binding.
</Tip>

### Quick commands

| Shortcut     | Description       | Notes                                                         |
| :----------- | :---------------- | :------------------------------------------------------------ |
| `/` at start | Command or skill  | See [commands](#commands) and [skills](/docs/en/skills)            |
| `!` at start | Shell mode        | Run commands directly and add execution output to the session |
| `@`          | File path mention | Trigger file path autocomplete                                |

### Transcript viewer

When the transcript viewer is open (toggled with `Ctrl+O`), these shortcuts are available. In [fullscreen rendering](/docs/en/fullscreen), press `?` to show the full shortcut reference panel inside the viewer. `Ctrl+E` can be rebound via [`transcript:toggleShowAll`](/docs/en/keybindings).

| Shortcut             | Description                                                                                                                                                                                                           |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?`                  | Toggle the keyboard shortcut help panel. Requires [fullscreen rendering](/docs/en/fullscreen)                                                                                                                              |
| `{` / `}`            | Jump to the previous or next user prompt, like vim paragraph motion. Requires [fullscreen rendering](/docs/en/fullscreen)                                                                                                  |
| `Ctrl+E`             | Toggle show all content                                                                                                                                                                                               |
| `[`                  | Write the full conversation to your terminal's native scrollback so `Cmd+F`, tmux copy mode, and other native tools can search it. Requires [fullscreen rendering](/docs/en/fullscreen#search-and-review-the-conversation) |
| `v`                  | Write the conversation to a temporary file and open it in `$VISUAL` or `$EDITOR`. Requires [fullscreen rendering](/docs/en/fullscreen)                                                                                     |
| `q`, `Ctrl+C`, `Esc` | Exit transcript view. All three can be rebound via [`transcript:exit`](/docs/en/keybindings)                                                                                                                               |

### Voice input

| Shortcut            | Description     | Notes                                                                                                                                                                            |
| :------------------ | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hold or tap `Space` | Voice dictation | Requires [voice dictation](/docs/en/voice-dictation) to be enabled. Hold to record, or run `/voice tap` for tap-to-toggle. [Rebindable](/docs/en/voice-dictation#rebind-the-dictation-key) |

## Commands

Type `/` in Claude Code to see all available commands, or type `/` followed by any letters to filter. The `/` menu shows everything you can invoke: built-in commands, bundled and user-authored [skills](/docs/en/skills), and commands contributed by [plugins](/docs/en/plugins) and [MCP servers](/docs/en/mcp#use-mcp-prompts-as-commands). Not all built-in commands are visible to every user since some depend on your platform or plan.

See the [commands reference](/docs/en/commands) for the full list of commands included in Claude Code.

## Vim editor mode

Enable vim-style editing via `/config` → Editor mode.

### Mode switching

| Command | Action                                | From mode      |
| :------ | :------------------------------------ | :------------- |
| `Esc`   | Enter NORMAL mode                     | INSERT, VISUAL |
| `i`     | Insert before cursor                  | NORMAL         |
| `I`     | Insert at beginning of line           | NORMAL         |
| `a`     | Insert after cursor                   | NORMAL         |
| `A`     | Insert at end of line                 | NORMAL         |
| `o`     | Open line below                       | NORMAL         |
| `O`     | Open line above                       | NORMAL         |
| `v`     | Start character-wise visual selection | NORMAL         |
| `V`     | Start line-wise visual selection      | NORMAL         |

### Navigation (NORMAL mode)

| Command         | Action                                              |
| :-------------- | :-------------------------------------------------- |
| `h`/`j`/`k`/`l` | Move left/down/up/right                             |
| `Space`         | Move right                                          |
| `w`             | Next word                                           |
| `e`             | End of word                                         |
| `b`             | Previous word                                       |
| `0`             | Beginning of line                                   |
| `$`             | End of line                                         |
| `^`             | First non-blank character                           |
| `gg`            | Beginning of input                                  |
| `G`             | End of input                                        |
| `f{char}`       | Jump to next occurrence of character                |
| `F{char}`       | Jump to previous occurrence of character            |
| `t{char}`       | Jump to just before next occurrence of character    |
| `T{char}`       | Jump to just after previous occurrence of character |
| `;`             | Repeat last f/F/t/T motion                          |
| `,`             | Repeat last f/F/t/T motion in reverse               |
| `/`             | Open reverse history search, same as `Ctrl+R`       |

<Note>
  In vim normal mode, if the cursor is at the beginning or end of input and cannot move further, `j`/`k` and the arrow keys navigate command history instead.
</Note>

### Editing (NORMAL mode)

| Command        | Action                  |
| :------------- | :---------------------- |
| `x`            | Delete character        |
| `dd`           | Delete line             |
| `D`            | Delete to end of line   |
| `dw`/`de`/`db` | Delete word/to end/back |
| `cc`           | Change line             |
| `C`            | Change to end of line   |
| `cw`/`ce`/`cb` | Change word/to end/back |
| `yy`/`Y`       | Yank (copy) line        |
| `yw`/`ye`/`yb` | Yank word/to end/back   |
| `p`            | Paste after cursor      |
| `P`            | Paste before cursor     |
| `>>`           | Indent line             |
| `<<`           | Dedent line             |
| `J`            | Join lines              |
| `u`            | Undo                    |
| `.`            | Repeat last change      |

### Text objects (NORMAL mode)

Text objects work with operators like `d`, `c`, and `y`:

| Command   | Action                                   |
| :-------- | :--------------------------------------- |
| `iw`/`aw` | Inner/around word                        |
| `iW`/`aW` | Inner/around WORD (whitespace-delimited) |
| `i"`/`a"` | Inner/around double quotes               |
| `i'`/`a'` | Inner/around single quotes               |
| `i(`/`a(` | Inner/around parentheses                 |
| `i[`/`a[` | Inner/around brackets                    |
| `i{`/`a{` | Inner/around braces                      |

### Visual mode

Press `v` for character-wise selection or `V` for line-wise selection. Motions extend the selection, and operators act on it directly.

| Command          | Action                                               |
| :--------------- | :--------------------------------------------------- |
| `d`/`x`          | Delete selection                                     |
| `y`              | Yank selection                                       |
| `c`/`s`          | Change selection                                     |
| `p`              | Replace selection with register contents             |
| `r{char}`        | Replace every selected character with `{char}`       |
| `~`/`u`/`U`      | Toggle, lowercase, or uppercase selection            |
| `>`/`<`          | Indent or dedent selected lines                      |
| `J`              | Join selected lines                                  |
| `o`              | Swap cursor and anchor                               |
| `iw`/`aw`/`i"`/… | Select a text object                                 |
| `v`/`V`          | Toggle between character-wise and line-wise, or exit |

Block-wise visual mode with `Ctrl+V` is not supported.

## Command history

Claude Code maintains command history for the current session:

* Input history is stored per working directory
* Input history resets when you run `/clear` to start a new session. The previous session's conversation is preserved and can be resumed.
* Submitting the same prompt twice in a row records one history entry, so pressing Up steps to the previous distinct prompt
* Use Up/Down arrows to navigate (see keyboard shortcuts above)
* **Note**: history expansion (`!`) is disabled by default

### Reverse search with Ctrl+R

Press `Ctrl+R` to interactively search through your command history:

1. **Start search**: press `Ctrl+R` to activate reverse history search
2. **Type query**: enter text to search for in previous commands. The search term is highlighted in matching results
3. **Navigate matches**: press `Ctrl+R` again to cycle through older matches
4. **Change scope**: search defaults to prompts from all projects. Press `Ctrl+S` to cycle the scope through this session, this project, and all projects
5. **Accept match**:
   * Press `Tab` or `Esc` to accept the current match and continue editing
   * Press `Enter` to accept and execute the command immediately
6. **Cancel search**:
   * Press `Ctrl+C` to cancel and restore your original input
   * Press `Backspace` on empty search to cancel

The search displays matching commands with the search term highlighted, so you can find and reuse previous inputs.

## Background bash commands

Claude Code supports running bash commands in the background, allowing you to continue working while long-running processes execute.

### How backgrounding works

When Claude Code runs a command in the background, it runs the command asynchronously and immediately returns a background task ID. Claude Code can respond to new prompts while the command continues executing in the background.

To run commands in the background, you can either:

* Prompt Claude Code to run a command in the background
* Press Ctrl+B to move a regular Bash tool invocation to the background. (Tmux users must press Ctrl+B twice due to tmux's prefix key.)

**Key features:**

* Output is written to a file and Claude can retrieve it using the Read tool
* Background tasks have unique IDs for tracking and output retrieval
* Background tasks are automatically cleaned up when Claude Code exits
* Background tasks are automatically terminated if output exceeds 5GB, with a note in stderr explaining why

To disable all background task functionality, set the `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` environment variable to `1`. See [Environment variables](/docs/en/env-vars) for details.

**Common backgrounded commands:**

* Build tools (webpack, vite, make)
* Package managers (npm, yarn, pnpm)
* Test runners (jest, pytest)
* Development servers
* Long-running processes (docker, terraform)

### Shell mode with `!` prefix

Run shell commands directly without going through Claude by prefixing your input with `!`:

```bash theme={null}
! npm test
! git status
! ls -la
```

Shell mode:

* Adds the command and its output to the conversation context
* Shows real-time progress and output
* Supports the same `Ctrl+B` backgrounding for long-running commands
* Does not require Claude to interpret or approve the command
* Supports history-based autocomplete: type a partial command and press **Tab** to complete from previous `!` commands in the current project
* Exit with `Escape`, `Backspace`, or `Ctrl+U` on an empty prompt
* Pasting text that starts with `!` into an empty prompt enters shell mode automatically, matching typed `!` behavior

This is useful for quick shell operations while maintaining conversation context.

## Prompt suggestions

When you first open a session, a grayed-out example command appears in the prompt input to help you get started. Claude Code picks this from your project's git history, so it reflects files you've been working on recently.

After Claude responds, suggestions continue to appear based on your conversation history, such as a follow-up step from a multi-part request or a natural continuation of your workflow.

* Press **Tab** or **Right arrow** to place the suggestion in the prompt input, then **Enter** to submit
* Start typing to dismiss it

The suggestion runs as a background request that reuses the parent conversation's prompt cache, so the additional cost is minimal. Claude Code skips suggestion generation when the cache is cold to avoid unnecessary cost.

Suggestions are automatically skipped after the first turn of a conversation and in plan mode. In print mode they are off by default. Pass [`--prompt-suggestions`](/docs/en/cli-reference#cli-flags) with `--output-format stream-json --verbose` to emit a `prompt_suggestion` message after each turn instead.

To disable prompt suggestions entirely, set the environment variable or toggle the setting in `/config`:

```bash theme={null}
export CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false
```

## Side questions with /btw

Use `/btw` to ask a quick question about your current work without adding to the conversation history. This is useful when you want a fast answer but don't want to clutter the main context or derail Claude from a long-running task.

```
/btw what was the name of that config file again?
```

Side questions have full visibility into the current conversation, so you can ask about code Claude has already read, decisions it made earlier, or anything else from the session. The question and answer are ephemeral: they appear in a dismissible overlay and never enter the conversation history.

* **Available while Claude is working**: you can run `/btw` even while Claude is processing a response. The side question runs independently and does not interrupt the main turn.
* **No tool access**: side questions answer only from what is already in context. Claude cannot read files, run commands, or search when answering a side question.
* **Single response**: there are no follow-up turns in the overlay. To continue the thread, fork it into its own session with `f`.
* **Low cost**: the side question reuses the parent conversation's prompt cache, so the additional cost is minimal.

Once the answer appears, the overlay accepts these keys. Earlier side questions from the same session appear as a dimmed list above the current answer; they stay out of the conversation history but remain visible in the overlay until you clear them.

| Key                        | Action                                                                                                                                                                                                                                                                    |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Space`, `Enter`, `Escape` | Dismiss the answer and return to the prompt                                                                                                                                                                                                                               |
| `Up` / `Down`              | Scroll the answer                                                                                                                                                                                                                                                         |
| `f`                        | Fork into a new session. The fork inherits the parent conversation plus this question and answer as real transcript turns, so you can continue with full tool access. The original session is preserved under [`/resume`](/docs/en/commands). Available in local sessions only |
| `x`                        | Clear the list of earlier `/btw` exchanges shown above the current answer                                                                                                                                                                                                 |

`/btw` is the inverse of a [subagent](/docs/en/sub-agents): it sees your full conversation but has no tools, while a subagent has full tools but starts with an empty context. Use `/btw` to ask about what Claude already knows from this session; use a subagent to go find out something new.

## Task list

When working on complex, multi-step work, Claude creates a task list to track progress. Tasks appear in the status area of your terminal with indicators showing what's pending, in progress, or complete.

* Press `Ctrl+T` to toggle the task list view. The display shows up to 5 tasks at a time
* To see all tasks or clear them, ask Claude directly: "show me all tasks" or "clear all tasks"
* Tasks persist across context compactions, helping Claude stay organized on larger projects
* To share a task list across sessions, set `CLAUDE_CODE_TASK_LIST_ID` to use a named directory in `~/.claude/tasks/`: `CLAUDE_CODE_TASK_LIST_ID=my-project claude`

## Session recap

When you return to the terminal after stepping away, Claude Code shows a one-line recap of what happened in the session so far. The recap generates in the background once at least three minutes have passed since the last completed turn and the terminal is unfocused, so it's ready when you switch back. Recaps only appear once the session has at least three turns, and never twice in a row.

Run `/recap` to generate a summary on demand. To turn automatic recaps off, open `/config` and disable **Session recap**.

Session recap is on by default for every plan and provider. The recap is always skipped in non-interactive mode.

## PR review status

When working on a branch with an open pull request, Claude Code displays a clickable PR link in the footer (for example, "PR #446"). The link has a colored underline indicating the review state:

* Green: approved
* Yellow: pending review
* Red: changes requested
* Gray: draft

The badge disappears once the pull request merges or closes. `Cmd+click` (Mac) or `Ctrl+click` (Windows/Linux) the link to open the pull request in your browser. The status refreshes every 60 seconds, and immediately after a `gh pr` or `git push` command runs in the session.

<Note>
  PR status requires the `gh` CLI to be installed and authenticated (`gh auth login`).
</Note>

## See also

* [Skills](/docs/en/skills) - Custom prompts and workflows
* [Checkpointing](/docs/en/checkpointing) - Rewind Claude's edits and restore previous states
* [CLI reference](/docs/en/cli-reference) - Command-line flags and options
* [Settings](/docs/en/settings) - Configuration options
* [Memory management](/docs/en/memory) - Managing CLAUDE.md files


---

## Fullscreen rendering

`https://code.claude.com/docs/en/fullscreen`

Enable a smoother, flicker-free rendering mode with mouse support and stable memory usage in long conversations.

<Note>
  Fullscreen rendering is an opt-in [research preview](#research-preview) and requires Claude Code v2.1.89 or later. Run `/tui fullscreen` to switch in your current conversation, or set `CLAUDE_CODE_NO_FLICKER=1` on versions before v2.1.110. Behavior may change based on feedback.
</Note>

Fullscreen rendering is an alternative rendering path for the Claude Code CLI that eliminates flicker, keeps memory usage flat in long conversations, and adds mouse support. It draws the interface on the terminal's alternate screen buffer, like `vim` or `htop`, and only renders messages that are currently visible. This reduces the amount of data sent to your terminal on each update.

The difference is most noticeable in terminal emulators where rendering throughput is the bottleneck, such as the VS Code integrated terminal, tmux, and iTerm2. If your terminal scroll position jumps to the top while Claude is working, or the screen flashes as tool output streams in, this mode addresses those.

<Note>
  The term fullscreen describes how Claude Code takes over the terminal's drawing surface, the way `vim` does. It has nothing to do with maximizing your terminal window, and works at any window size.
</Note>

## Enable fullscreen rendering

Run `/tui fullscreen` inside any Claude Code conversation. The CLI saves the [`tui` setting](/docs/en/settings#available-settings) and relaunches into fullscreen with your conversation intact, so you can switch mid-session without losing context. Run `/tui` with no argument to print which renderer is active.

You can also set the `CLAUDE_CODE_NO_FLICKER` environment variable before starting Claude Code:

```bash theme={null}
CLAUDE_CODE_NO_FLICKER=1 claude
```

The `tui` setting and the environment variable are equivalent. The `/tui` command clears `CLAUDE_CODE_NO_FLICKER` from the relaunched process so the setting it writes takes effect.

## What changes

Fullscreen rendering changes how the CLI draws to your terminal. The input box stays fixed at the bottom of the screen instead of moving as output streams in. If the input stays put while Claude is working, fullscreen rendering is active. Only visible messages are kept in the render tree, so memory stays constant regardless of conversation length.

Because the conversation lives in the alternate screen buffer instead of your terminal's scrollback, a few things work differently:

| Before                                              | Now                                                                            | Details                                                                   |
| :-------------------------------------------------- | :----------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `Cmd+f` or tmux search to find text                 | `Ctrl+o` for transcript mode, then `/` to search or `[` to write to scrollback | [Search and review the conversation](#search-and-review-the-conversation) |
| Terminal's native click-and-drag to select and copy | In-app selection, copies automatically on mouse release                        | [Use the mouse](#use-the-mouse)                                           |
| `Cmd`-click to open a URL                           | Click the URL                                                                  | [Use the mouse](#use-the-mouse)                                           |

If mouse capture interferes with your workflow, you can [turn it off](#keep-native-text-selection) while keeping the flicker-free rendering.

## Use the mouse

Fullscreen rendering captures mouse events and handles them inside Claude Code:

* **Click in the prompt input** to position your cursor anywhere in the text you're typing.
* **Click a suggestion in the `/` command or `@` file list** to accept it. Hovering highlights the row under your cursor.
* **Click a collapsed tool result** to expand it and see the full output. Click again to collapse. The tool call and its result expand together. Only messages that have more to show are clickable.
* **Click a URL or file path** to open it. File paths in tool output, like the ones printed after an Edit or Write, open in your default application. Plain `http://` and `https://` URLs open in your browser. In most terminals this replaces native `Cmd`-click or `Ctrl`-click, which mouse capture intercepts. In the VS Code integrated terminal and similar xterm.js-based terminals, keep using `Cmd`-click. Claude Code defers to the terminal's own link handler there to avoid opening links twice.
* **Click and drag** to select text anywhere in the conversation. Double-click selects a word, matching iTerm2's word boundaries so a file path selects as one unit. Triple-click selects the line.
* **Scroll with the mouse wheel** to move through the conversation.

Selected text copies to your clipboard automatically on mouse release. To turn this off, toggle Copy on select in `/config`. With it off, press `Ctrl+Shift+c` to copy manually. On terminals that support the kitty keyboard protocol, such as kitty, WezTerm, Ghostty, and iTerm2, `Cmd+c` also works. If you have a selection active, `Ctrl+c` copies instead of cancelling.

With a selection active, hold `Shift` and press the arrow keys to extend it from the keyboard. `Shift+↑` and `Shift+↓` scroll the viewport when the selection reaches the top or bottom edge. `Shift+Home` and `Shift+End` extend to the start or end of the current line.

## Scroll the conversation

Fullscreen rendering handles scrolling inside the app. Use these shortcuts to navigate:

| Shortcut        | Action                                               |
| :-------------- | :--------------------------------------------------- |
| `PgUp` / `PgDn` | Scroll up or down by half a screen                   |
| `Ctrl+Home`     | Jump to the start of the conversation                |
| `Ctrl+End`      | Jump to the latest message and re-enable auto-follow |
| Mouse wheel     | Scroll a few lines at a time                         |

On keyboards without dedicated `PgUp`, `PgDn`, `Home`, or `End` keys, like MacBook keyboards, hold `Fn` with the arrow keys: `Fn+↑` sends `PgUp`, `Fn+↓` sends `PgDn`, `Fn+←` sends `Home`, and `Fn+→` sends `End`. That makes `Ctrl+Fn+→` the jump-to-bottom shortcut. If that feels awkward, scroll to the bottom with the mouse wheel to resume following, or rebind `scroll:bottom` to something reachable.

These actions are rebindable. See [Scroll actions](/docs/en/keybindings#scroll-actions) for the full list of action names, including half-page and full-page variants that have no default binding.

### Auto-follow

Scrolling up pauses auto-follow so new output does not pull you back to the bottom. Press `Ctrl+End` or scroll to the bottom to resume following.

To turn auto-follow off entirely so the view stays where you leave it, open `/config` and set Auto-scroll to off. With auto-scroll disabled, the view never jumps to the bottom on its own. Permission prompts and other dialogs that need a response still scroll into view regardless of this setting.

### Mouse wheel scrolling

Mouse wheel scrolling requires your terminal to forward mouse events to Claude Code. Most terminals do this whenever an application requests it. iTerm2 makes it a per-profile setting: if the wheel does nothing but `PgUp` and `PgDn` work, open Settings → Profiles → Terminal and turn on Enable mouse reporting. The same setting is also required for click-to-expand and text selection to work.

If mouse wheel scrolling feels slow, your terminal may be sending one scroll event per physical notch with no multiplier. Some terminals, like Ghostty and iTerm2 with faster scrolling enabled, already amplify wheel events. Others, including the VS Code integrated terminal, send exactly one event per notch. Claude Code cannot detect which.

Set `CLAUDE_CODE_SCROLL_SPEED` to multiply the base scroll distance:

```bash theme={null}
export CLAUDE_CODE_SCROLL_SPEED=3
```

A value of `3` matches the default in `vim` and similar applications. The setting accepts values from 1 to 20.

To adjust scroll speed interactively, run `/scroll-speed`. The dialog shows a ruler you can scroll while it is open so you can feel the change immediately. Press `←` and `→` to adjust, `r` to reset to the auto-detected default, and `Enter` to save. The command writes the same value the `CLAUDE_CODE_SCROLL_SPEED` environment variable sets, persisted to `~/.claude/settings.json`. The command is not available in the JetBrains IDE terminal.

### Scroll in the JetBrains IDE terminal

In the JetBrains IDE terminal, Claude Code applies its own scroll handling and ignores `CLAUDE_CODE_SCROLL_SPEED`. The terminal sends scroll events at a much higher rate than other emulators, so a multiplier tuned elsewhere overshoots here.

In 2025.2, the terminal also has scroll-wheel bugs that produce spurious arrow keys and wrong-direction events. Claude Code detects these at runtime and mitigates them automatically, so trackpad and mouse wheel scrolling work without configuration. For the best scroll experience, upgrade to 2025.3 or later. Claude Code shows a hint the first time you scroll if it detects the bug.

## Search and review the conversation

`Ctrl+o` toggles between the normal prompt and transcript mode. For a quieter view that shows only your last prompt, a one-line summary of tool calls with edit diffstats, and the final response, run `/focus`. The setting persists across sessions. Run `/focus` again to turn it off.

Transcript mode gains `less`-style navigation and search:

| Key                                  | Action                                                                                                 |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------- |
| `/`                                  | Open search. Type to find matches, `Enter` to accept, `Esc` to cancel and restore your scroll position |
| `n` / `N`                            | Jump to next or previous match. Works after you've closed the search bar                               |
| `j` / `k` or `↑` / `↓`               | Scroll one line                                                                                        |
| `g` / `G` or `Home` / `End`          | Jump to top or bottom                                                                                  |
| `Ctrl+u` / `Ctrl+d`                  | Scroll half a page                                                                                     |
| `Ctrl+b` / `Ctrl+f` or `Space` / `b` | Scroll a full page                                                                                     |
| `Ctrl+o`, `Esc`, or `q`              | Exit transcript mode and return to the prompt                                                          |

Your terminal's `Cmd+f` and tmux search don't see the conversation because it lives in the alternate screen buffer, not the native scrollback. To hand the content back to your terminal, press `Ctrl+o` to enter transcript mode first, then:

* **`[`**: writes the full conversation into your terminal's native scrollback buffer, with all tool output expanded. The conversation is now ordinary text in your terminal, so `Cmd+f`, tmux copy mode, and any other native tool can search or select it. Long sessions may pause for a moment while this happens. This lasts until you exit transcript mode with `Esc` or `q`, which returns you to fullscreen rendering. The next `Ctrl+o` starts fresh.
* **`v`**: writes the conversation to a temporary file and opens it in `$VISUAL` or `$EDITOR`.

Press `Esc` or `q` to return to the prompt.

## Clear the conversation

Press `Ctrl+L` twice within two seconds to run `/clear` and start a new conversation. The first press redraws the screen and shows a hint; the second press clears the conversation. On macOS, double-pressing `Cmd+K` also runs `/clear`.

## Use with tmux

Fullscreen rendering works inside tmux, with three caveats.

Mouse wheel scrolling requires tmux's mouse mode. If your `~/.tmux.conf` does not already enable it, add this line and reload your config:

```bash theme={null}
set -g mouse on
```

Without mouse mode, wheel events go to tmux instead of Claude Code. Keyboard scrolling with `PgUp` and `PgDn` works either way. Claude Code prints a one-time hint at startup if it detects tmux with mouse mode off.

Fullscreen rendering is incompatible with iTerm2's tmux integration mode, which is the mode you enter with `tmux -CC`. In integration mode, iTerm2 renders each tmux pane as a native split rather than letting tmux draw to the terminal. The alternate screen buffer and mouse tracking do not work correctly there: the mouse wheel does nothing, and double-click can corrupt the terminal state. Don't enable fullscreen rendering in `tmux -CC` sessions. Regular tmux inside iTerm2, without `-CC`, works fine.

tmux does not support synchronized output, so you may see more flicker during redraws than when running Claude Code directly in your terminal. If the flicker is noticeable, especially over SSH, run Claude Code in its own terminal tab outside tmux.

## Keep native text selection

Mouse capture is the most common friction point, especially over SSH or inside tmux. When Claude Code captures mouse events, your terminal's native copy-on-select stops working. The selection you make with click-and-drag exists inside Claude Code, not in your terminal's selection buffer, so tmux copy mode, Kitty hints, and similar tools don't see it.

Claude Code tries to write the selection to your clipboard, but the path it uses depends on your setup. Inside tmux it writes to the tmux paste buffer. Over SSH it falls back to OSC 52 escape sequences, which some terminals block by default. iTerm2 blocks them until you turn on Settings → General → Selection → Applications in terminal may access clipboard. Running [`/terminal-setup`](/docs/en/terminal-config) in iTerm2 enables this for you. Claude Code prints a toast after each copy telling you which path it used.

For a one-off native selection, hold your terminal's bypass modifier while you click and drag: `Option` in iTerm2, or `Shift` in most Linux and Windows terminals. The modifier tells your terminal to handle the selection itself instead of forwarding mouse events to Claude Code, so `Cmd+C` and your terminal's other copy shortcuts work on it.

If you rely on native selection all the time, set `CLAUDE_CODE_DISABLE_MOUSE=1` to opt out of mouse capture while keeping the flicker-free rendering and flat memory:

```bash theme={null}
CLAUDE_CODE_NO_FLICKER=1 CLAUDE_CODE_DISABLE_MOUSE=1 claude
```

With mouse capture disabled, keyboard scrolling with `PgUp`, `PgDn`, `Ctrl+Home`, and `Ctrl+End` still works, and your terminal handles selection natively. You lose click-to-position-cursor, click-to-expand tool output, URL clicking, and wheel scrolling inside Claude Code.

## Research preview

Fullscreen rendering is a research preview feature. It has been tested on common terminal emulators, but you may encounter rendering issues on less common terminals or unusual configurations.

If you encounter a problem, run `/feedback` inside Claude Code to report it, or open an issue on the [claude-code GitHub repo](https://github.com/anthropics/claude-code/issues). Include your terminal emulator name and version.

To turn fullscreen rendering off, run `/tui default`, or unset `CLAUDE_CODE_NO_FLICKER` if you enabled it that way. To force the classic renderer regardless of the saved `tui` setting, set `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1`. The classic renderer keeps the conversation in your terminal's native scrollback so `Cmd+f` and tmux copy mode work as usual.


---

## Choose a permission mode

`https://code.claude.com/docs/en/permission-modes`

Control whether Claude asks before editing files or running commands. Cycle modes with Shift+Tab in the CLI or use the mode selector in VS Code, Desktop, and claude.ai.

When Claude wants to edit a file, run a shell command, or make a network request, it pauses and asks you to approve the action. Permission modes control how often that pause happens. The mode you pick shapes the flow of a session: default mode has you review each action as it comes, while looser modes let Claude work in longer uninterrupted stretches and report back when done. Pick more oversight for sensitive work, or fewer interruptions when you trust the direction.

## Available modes

Each mode makes a different tradeoff between convenience and oversight. The table below shows what Claude can do without a permission prompt in each mode.

| Mode                                                                | What runs without asking                                                               | Best for                                |
| :------------------------------------------------------------------ | :------------------------------------------------------------------------------------- | :-------------------------------------- |
| `default`                                                           | Reads only                                                                             | Getting started, sensitive work         |
| [`acceptEdits`](#auto-approve-file-edits-with-acceptedits-mode)     | Reads, file edits, and common filesystem commands (`mkdir`, `touch`, `mv`, `cp`, etc.) | Iterating on code you're reviewing      |
| [`plan`](#analyze-before-you-edit-with-plan-mode)                   | Reads only                                                                             | Exploring a codebase before changing it |
| [`auto`](#eliminate-prompts-with-auto-mode)                         | Everything, with background safety checks                                              | Long tasks, reducing prompt fatigue     |
| [`dontAsk`](#allow-only-pre-approved-tools-with-dontask-mode)       | Only pre-approved tools                                                                | Locked-down CI and scripts              |
| [`bypassPermissions`](#skip-all-checks-with-bypasspermissions-mode) | Everything                                                                             | Isolated containers and VMs only        |

In every mode except `bypassPermissions`, writes to [protected paths](#protected-paths) are never auto-approved, guarding repository state and Claude's own configuration against accidental corruption.

Modes set the baseline. Layer [permission rules](/docs/en/permissions#manage-permissions) on top to pre-approve or block specific tools in any mode except `bypassPermissions`, which skips the permission layer entirely.

## Switch permission modes

You can switch modes mid-session, at startup, or as a persistent default. The mode is set through these controls, not by asking Claude in chat. Select your interface below to see how to change it.

<Tabs>
  <Tab title="CLI">
    **During a session**: press `Shift+Tab` to cycle `default` → `acceptEdits` → `plan`. The current mode appears in the status bar. Not every mode is in the default cycle:

    * `auto`: appears when your account meets the [auto mode requirements](#eliminate-prompts-with-auto-mode); cycling to auto shows an opt-in prompt until you accept it, or select **No, don't ask again** to remove auto from the cycle
    * `bypassPermissions`: appears after you start with `--permission-mode bypassPermissions`, `--dangerously-skip-permissions`, or `--allow-dangerously-skip-permissions`; the `--allow-` variant adds the mode to the cycle without activating it
    * `dontAsk`: never appears in the cycle; set it with `--permission-mode dontAsk`

    Enabled optional modes slot in after `plan`, with `bypassPermissions` first and `auto` last. If you have both enabled, you will cycle through `bypassPermissions` on the way to `auto`.

    **At startup**: pass the mode as a flag.

    ```bash theme={null}
    claude --permission-mode plan
    ```

    **As a default**: set `defaultMode` in [settings](/docs/en/settings#settings-files).

    ```json theme={null}
    {
      "permissions": {
        "defaultMode": "acceptEdits"
      }
    }
    ```

    The same `--permission-mode` flag works with `-p` for [non-interactive runs](/docs/en/headless).
  </Tab>

  <Tab title="VS Code">
    **During a session**: click the mode indicator at the bottom of the prompt box.

    **As a default**: set `claudeCode.initialPermissionMode` in VS Code settings, or use the Claude Code extension settings panel.

    The mode indicator shows these labels, mapped to the mode each one applies:

    | UI label           | Mode                |
    | :----------------- | :------------------ |
    | Ask before edits   | `default`           |
    | Edit automatically | `acceptEdits`       |
    | Plan mode          | `plan`              |
    | Auto mode          | `auto`              |
    | Bypass permissions | `bypassPermissions` |

    Auto mode appears in the mode indicator when your account meets every requirement listed in the [auto mode section](#eliminate-prompts-with-auto-mode). The `claudeCode.initialPermissionMode` setting does not accept `auto`. To start in auto mode by default, set `defaultMode` in your [user settings](/docs/en/settings#settings-files) instead. Claude Code ignores `defaultMode: "auto"` in project and local settings.

    Bypass permissions requires the **Allow dangerously skip permissions** toggle in the extension settings before it appears in the mode indicator.

    See the [VS Code guide](/docs/en/vs-code) for extension-specific details.
  </Tab>

  <Tab title="JetBrains">
    The JetBrains plugin runs Claude Code in the IDE terminal, so switching modes works the same as in the CLI: press `Shift+Tab` to cycle, or pass `--permission-mode` when launching.
  </Tab>

  <Tab title="Desktop">
    Use the mode selector next to the send button. Auto and Bypass permissions appear only after you enable them in Desktop settings. See the [Desktop guide](/docs/en/desktop#choose-a-permission-mode).
  </Tab>

  <Tab title="Web and mobile">
    Use the mode dropdown next to the prompt box on [claude.ai/code](https://claude.ai/code) or in the mobile app. Permission prompts appear in claude.ai for approval. Which modes appear depends on where the session runs:

    * **Cloud sessions** on [Claude Code on the web](/docs/en/claude-code-on-the-web): Auto accept edits and Plan mode. Ask permissions, Auto, and Bypass permissions are not available.
    * **[Remote Control](/docs/en/remote-control) sessions** on your local machine: Ask permissions, Auto accept edits, and Plan mode. Auto and Bypass permissions are not available.

    For Remote Control, you can also set the starting mode when launching the host:

    ```bash theme={null}
    claude remote-control --permission-mode acceptEdits
    ```
  </Tab>
</Tabs>

## Auto-approve file edits with acceptEdits mode

`acceptEdits` mode lets Claude create and edit files in your working directory without prompting. The status bar shows `⏵⏵ accept edits on` while this mode is active.

In addition to file edits, `acceptEdits` mode auto-approves common filesystem Bash commands: `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, and `sed`. These commands are also auto-approved when prefixed with safe environment variables such as `LANG=C` or `NO_COLOR=1`, or process wrappers such as `timeout`, `nice`, or `nohup`. Like file edits, auto-approval applies only to paths inside your working directory or `additionalDirectories`. Paths outside that scope, writes to [protected paths](#protected-paths), and all other Bash commands still prompt.

When the [PowerShell tool](/docs/en/tools-reference#powershell-tool) is enabled, `acceptEdits` mode also auto-approves `Set-Content`, `Add-Content`, `Clear-Content`, and `Remove-Item` on in-scope paths, along with their common aliases. The same scope and protected-path rules apply.

Use `acceptEdits` when you want to review changes in your editor or via `git diff` after the fact rather than approving each edit inline. Press `Shift+Tab` once from default mode to enter it, or start with it directly:

```bash theme={null}
claude --permission-mode acceptEdits
```

## Analyze before you edit with plan mode

Plan mode tells Claude to research and propose changes without making them. Claude reads files, runs shell commands to explore, and writes a plan, but does not edit your source. Permission prompts still apply the same as default mode.

Enter plan mode by pressing `Shift+Tab` or prefixing a single prompt with `/plan`. You can also start in plan mode from the CLI:

```bash theme={null}
claude --permission-mode plan
```

Press `Shift+Tab` again to leave plan mode without approving a plan.

### Review and approve a plan

When the plan is ready, Claude presents it and asks how to proceed. From that prompt you can:

* Approve and start in auto mode
* Approve and accept edits
* Approve and review each edit manually
* Keep planning with feedback
* Refine with [Ultraplan](/docs/en/ultraplan) for browser-based review

Approving a plan exits plan mode and switches the session to the permission mode each approve option describes, so Claude starts editing. To plan again, cycle back to plan mode with `Shift+Tab`, or prefix your next prompt with `/plan`.

Press `Ctrl+G` to open the proposed plan in your default text editor and edit it directly before Claude proceeds. When [`showClearContextOnPlanAccept`](/docs/en/settings#available-settings) is enabled, each approve option also offers to clear the planning context first.

Accepting a plan also names the session from the plan content automatically, unless you've already set a name with `--name` or `/rename`.

### Set plan mode as the default

To make plan mode the default for a project, set `defaultMode` in `.claude/settings.json`:

```json theme={null}
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

## Eliminate prompts with auto mode

<Note>
  Auto mode requires Claude Code v2.1.83 or later.
</Note>

Auto mode lets Claude execute without permission prompts. A separate classifier model reviews actions before they run, blocking anything that escalates beyond your request, targets unrecognized infrastructure, or appears driven by hostile content Claude read.

Auto mode also nudges Claude to keep working without stopping for clarifying questions, though Claude still asks when your prompt or a skill explicitly relies on it. For stronger autonomous behavior while keeping permission prompts, set the [Proactive output style](/docs/en/output-styles) instead.

<Warning>
  Auto mode is a research preview. It reduces prompts but does not guarantee safety. Use it for tasks where you trust the general direction, not as a replacement for review on sensitive operations.
</Warning>

Auto mode is available only when your account meets all of these requirements:

* **Plan**: All plans.
* **Admin**: on Team and Enterprise, an admin must enable it in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code) before users can turn it on. Admins can also lock it off by setting `permissions.disableAutoMode` to `"disable"` in [managed settings](/docs/en/permissions#managed-settings).
* **Model**: Claude Opus 4.6 or later, or Sonnet 4.6. Older models, including Sonnet 4.5, Opus 4.5, Haiku, and claude-3 models, are not supported.
* **Provider**: Anthropic API only. Not available on Bedrock, Vertex, or Foundry.

If Claude Code reports auto mode as unavailable, one of these requirements is unmet; this is not a transient outage. A separate message that names a model and says auto mode "cannot determine the safety" of an action is a transient classifier outage; see the [error reference](/docs/en/errors#auto-mode-cannot-determine-the-safety-of-an-action).

If you set `defaultMode: "auto"` in [settings](/docs/en/settings#available-settings) and the session starts in `default` mode with no error, the setting is likely in `.claude/settings.json` or `.claude/settings.local.json`. Claude Code ignores `auto` from those files so a repository cannot grant itself auto mode. Move it to `~/.claude/settings.json`.

### What the classifier blocks by default

The classifier trusts your working directory and your repo's configured remotes. Everything else is treated as external until you [configure trusted infrastructure](/docs/en/auto-mode-config).

**Blocked by default**:

* Downloading and executing code, like `curl | bash`
* Sending sensitive data to external endpoints
* Production deploys and migrations
* Mass deletion on cloud storage
* Granting IAM or repo permissions
* Modifying shared infrastructure
* Irreversibly destroying files that existed before the session
* Force push, or pushing directly to `main`

**Allowed by default**:

* Local file operations in your working directory
* Installing dependencies declared in your lock files or manifests
* Reading `.env` and sending credentials to their matching API
* Read-only HTTP requests
* Pushing to the branch you started on or one Claude created

Sandbox network access requests are routed through the classifier rather than allowed by default. Run `claude auto-mode defaults` to see the full rule lists. If routine actions get blocked, an administrator can add trusted repos, buckets, and services via the `autoMode.environment` setting: see [Configure auto mode](/docs/en/auto-mode-config).

### Boundaries you state in conversation

The classifier treats boundaries you state in the conversation as a block signal. If you tell Claude "don't push" or "wait until I review before deploying", the classifier blocks matching actions even when the default rules would allow them. A boundary stays in force until you lift it in a later message. Claude's own judgment that a condition was met does not lift it.

Boundaries are not stored as rules. The classifier re-reads them from the transcript on each check, so a boundary can be lost if [context compaction](/docs/en/costs#reduce-token-usage) removes the message that stated it. For a hard guarantee, add a [deny rule](/docs/en/permissions#permission-rule-syntax) instead.

### When auto mode falls back

Each denied action shows a notification and appears in `/permissions` under the Recently denied tab, where you can press `r` to retry it with a manual approval.

If the classifier blocks an action 3 times in a row or 20 times total, auto mode pauses and Claude Code resumes prompting. Approving the prompted action resumes auto mode. These thresholds are not configurable. Any allowed action resets the consecutive counter, while the total counter persists for the session and resets only when its own limit triggers a fallback.

In [non-interactive mode](/docs/en/headless) with the `-p` flag, repeated blocks abort the session since there is no user to prompt.

Repeated blocks usually mean the classifier is missing context about your infrastructure. Use `/feedback` to report false positives, or have an administrator [configure trusted infrastructure](/docs/en/auto-mode-config).

<AccordionGroup>
  <Accordion title="How the classifier evaluates actions">
    Each action goes through a fixed decision order. The first matching step wins:

    1. Actions matching your [allow or deny rules](/docs/en/permissions#manage-permissions) resolve immediately
    2. Read-only actions and file edits in your working directory are auto-approved, except writes to [protected paths](#protected-paths)
    3. Everything else goes to the classifier
    4. If the classifier blocks, Claude receives the reason and tries an alternative

    On entering auto mode, broad allow rules that grant arbitrary code execution are dropped:

    * Blanket `Bash(*)` or `PowerShell(*)`
    * Wildcarded interpreters like `Bash(python*)`
    * Package-manager run commands
    * `Agent` allow rules

    Narrow rules like `Bash(npm test)` carry over. Dropped rules are restored when you leave auto mode.

    The classifier sees user messages, tool calls, and your CLAUDE.md content. Tool results are stripped, so hostile content in a file or web page cannot manipulate it directly. A separate server-side probe scans incoming tool results and flags suspicious content before Claude reads it. For more on how these layers work together, see the [auto mode announcement](https://claude.com/blog/auto-mode) and the [engineering deep dive](https://www.anthropic.com/engineering/claude-code-auto-mode).
  </Accordion>

  <Accordion title="How auto mode handles subagents">
    The classifier checks [subagent](/docs/en/sub-agents) work at three points:

    1. Before a subagent starts, the delegated task description is evaluated, so a dangerous-looking task is blocked at spawn time.
    2. While the subagent runs, each of its actions goes through the classifier with the same rules as the parent session, and any `permissionMode` in the subagent's frontmatter is ignored.
    3. When the subagent finishes, the classifier reviews its full action history; if that return check flags a concern, a security warning is prepended to the subagent's results.
  </Accordion>

  <Accordion title="Cost and latency">
    The classifier runs on a server-configured model that is independent of your `/model` selection, so switching models does not change classifier availability. Classifier calls count toward your token usage. Each check sends a portion of the transcript plus the pending action, adding a round-trip before execution. Reads and working-directory edits outside protected paths skip the classifier, so the overhead comes mainly from shell commands and network operations.
  </Accordion>
</AccordionGroup>

## Allow only pre-approved tools with dontAsk mode

`dontAsk` mode auto-denies every tool call that would otherwise prompt. Only actions matching your `permissions.allow` rules and [read-only Bash commands](/docs/en/permissions#read-only-commands) can execute; explicit `ask` rules are denied rather than prompting. This makes the mode fully non-interactive for CI pipelines or restricted environments where you pre-define exactly what Claude may do.

Set it at startup with the flag:

```bash theme={null}
claude --permission-mode dontAsk
```

## Skip all checks with bypassPermissions mode

`bypassPermissions` mode disables permission prompts and safety checks so tool calls execute immediately. As of v2.1.126 this includes writes to [protected paths](#protected-paths), which earlier versions still prompted for. Removals targeting the filesystem root or home directory, such as `rm -rf /` and `rm -rf ~`, still prompt as a circuit breaker against model error. Only use this mode in isolated environments like containers, VMs, or dev containers without internet access, where Claude Code cannot damage your host system.

You cannot enter `bypassPermissions` from a session that was started without one of the enabling flags; restart with one to enable it:

```bash theme={null}
claude --permission-mode bypassPermissions
```

The `--dangerously-skip-permissions` flag is equivalent.

On Linux and macOS, Claude Code refuses to start in this mode when running as root or under `sudo`:

```text theme={null}
--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons
```

The check is skipped automatically inside a recognized sandbox. To run autonomously in a container, use the [dev container](/docs/en/devcontainer) configuration, which runs Claude Code as a non-root user.

<Warning>
  `bypassPermissions` offers no protection against prompt injection or unintended actions. For background safety checks without prompts, use [auto mode](#eliminate-prompts-with-auto-mode) instead. Administrators can block this mode by setting `permissions.disableBypassPermissionsMode` to `"disable"` in [managed settings](/docs/en/permissions#managed-settings).
</Warning>

## Protected paths

Writes to a small set of paths are never auto-approved, in every mode except `bypassPermissions`. This prevents accidental corruption of repository state and Claude's own configuration. In `default`, `acceptEdits`, and `plan` these writes prompt; in `auto` they route to the classifier; in `dontAsk` they are denied; in `bypassPermissions` they are allowed.

Protected directories:

* `.git`
* `.vscode`
* `.idea`
* `.husky`
* `.cargo`
* `.claude`, except for `.claude/commands`, `.claude/agents`, `.claude/skills`, and `.claude/worktrees` where Claude routinely creates content

Protected files:

* `.gitconfig`, `.gitmodules`
* `.bashrc`, `.bash_profile`, `.zshrc`, `.zprofile`, `.profile`
* `.ripgreprc`
* `.mcp.json`, `.claude.json`

## See also

* [Permissions](/docs/en/permissions): allow, ask, and deny rules; managed policies
* [Configure auto mode](/docs/en/auto-mode-config): tell the classifier which infrastructure your organization trusts
* [Hooks](/docs/en/hooks): custom permission logic via `PreToolUse` and `PermissionRequest` hooks
* [Ultraplan](/docs/en/ultraplan): run plan mode in a Claude Code on the web session with browser-based review
* [Security](/docs/en/security): safeguards and best practices
* [Sandboxing](/docs/en/sandboxing): filesystem and network isolation for Bash commands
* [Non-interactive mode](/docs/en/headless): run Claude Code with the `-p` flag


---

## Configure permissions

`https://code.claude.com/docs/en/permissions`

Control what Claude Code can access and do with fine-grained permission rules, modes, and managed policies.

Claude Code supports fine-grained permissions so that you can specify exactly what the agent is allowed to do and what it cannot. Permission settings can be checked into version control and distributed to all developers in your organization, as well as customized by individual developers.

## Permission system

Claude Code uses a tiered permission system to balance power and safety:

| Tool type         | Example          | Approval required | "Yes, don't ask again" behavior               |
| :---------------- | :--------------- | :---------------- | :-------------------------------------------- |
| Read-only         | File reads, Grep | No                | N/A                                           |
| Bash commands     | Shell execution  | Yes               | Permanently per project directory and command |
| File modification | Edit/write files | Yes               | Until session end                             |

## Manage permissions

You can view and manage Claude Code's tool permissions with `/permissions`. This UI lists all permission rules and the settings.json file they are sourced from.

* **Allow** rules let Claude Code use the specified tool without manual approval.
* **Ask** rules prompt for confirmation whenever Claude Code tries to use the specified tool.
* **Deny** rules prevent Claude Code from using the specified tool.

Rules are evaluated in order: **deny -> ask -> allow**. The first matching rule wins, so deny rules always take precedence.

Deny rules behave differently depending on whether they name a tool or scope a pattern within one. A bare tool name like `Bash` removes the tool from Claude's context entirely, so Claude never sees it. A scoped rule like `Bash(rm *)` leaves the tool available and blocks matching calls when Claude attempts them.

<Note>
  Permission rules are enforced by Claude Code, not by the model. Instructions in your prompt or `CLAUDE.md` shape what Claude tries to do, but they don't change what Claude Code allows. To grant or revoke access, use `/permissions`, the rules described here, a [permission mode](/docs/en/permission-modes), or a [PreToolUse hook](#extend-permissions-with-hooks).
</Note>

## Permission modes

Claude Code supports several permission modes that control how tools are approved. See [Permission modes](/docs/en/permission-modes) for when to use each one. Set the `defaultMode` in your [settings files](/docs/en/settings#settings-files):

| Mode                | Description                                                                                                                                                        |
| :------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`           | Standard behavior: prompts for permission on first use of each tool                                                                                                |
| `acceptEdits`       | Automatically accepts file edits and common filesystem commands (`mkdir`, `touch`, `mv`, `cp`, etc.) for paths in the working directory or `additionalDirectories` |
| `plan`              | Plan Mode: Claude reads files and runs read-only shell commands to explore but does not edit your source files                                                     |
| `auto`              | Auto-approves tool calls with background safety checks that verify actions align with your request. Currently a research preview                                   |
| `dontAsk`           | Auto-denies tools unless pre-approved via `/permissions` or `permissions.allow` rules                                                                              |
| `bypassPermissions` | Skips all permission prompts. Root and home directory removals such as `rm -rf /` still prompt as a circuit breaker                                                |

<Warning>
  `bypassPermissions` mode skips all permission prompts, including writes to `.git`, `.claude`, `.vscode`, `.idea`, `.husky`, and `.cargo`. Removals targeting the filesystem root or home directory, such as `rm -rf /` and `rm -rf ~`, still prompt as a circuit breaker against model error. Only use this mode in isolated environments like containers or VMs where Claude Code cannot cause damage. Administrators can prevent this mode by setting `permissions.disableBypassPermissionsMode` to `"disable"` in [managed settings](#managed-settings).
</Warning>

To prevent `bypassPermissions` or `auto` mode from being used, set `permissions.disableBypassPermissionsMode` or `permissions.disableAutoMode` to `"disable"` in any [settings file](/docs/en/settings#settings-files). These are most useful in [managed settings](#managed-settings) where they cannot be overridden.

## Permission rule syntax

Permission rules follow the format `Tool` or `Tool(specifier)`.

### Match all uses of a tool

To match all uses of a tool, use just the tool name without parentheses:

| Rule       | Effect                         |
| :--------- | :----------------------------- |
| `Bash`     | Matches all Bash commands      |
| `WebFetch` | Matches all web fetch requests |
| `Read`     | Matches all file reads         |

`Bash(*)` is equivalent to `Bash` and matches all Bash commands. As a deny rule, both forms remove the tool from Claude's context.

### Use specifiers for fine-grained control

Add a specifier in parentheses to match specific tool uses:

| Rule                           | Effect                                                   |
| :----------------------------- | :------------------------------------------------------- |
| `Bash(npm run build)`          | Matches the exact command `npm run build`                |
| `Read(./.env)`                 | Matches reading the `.env` file in the current directory |
| `WebFetch(domain:example.com)` | Matches fetch requests to example.com                    |

### Wildcard patterns

Bash rules support glob patterns with `*`. Wildcards can appear at any position in the command. This configuration allows npm and git commit commands while blocking git push:

```json theme={null}
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Bash(git * main)",
      "Bash(* --version)",
      "Bash(* --help *)"
    ],
    "deny": [
      "Bash(git push *)"
    ]
  }
}
```

The space before `*` matters: `Bash(ls *)` matches `ls -la` but not `lsof`, while `Bash(ls*)` matches both. The `:*` suffix is an equivalent way to write a trailing wildcard, so `Bash(ls:*)` matches the same commands as `Bash(ls *)`.

The permission dialog writes the space-separated form when you select "Yes, don't ask again" for a command prefix. The `:*` form is only recognized at the end of a pattern. In a pattern like `Bash(git:* push)`, the colon is treated as a literal character and won't match git commands.

## Tool-specific permission rules

### Bash

Bash permission rules support wildcard matching with `*`. Wildcards can appear at any position in the command, including at the beginning, middle, or end:

* `Bash(npm run build)` matches the exact Bash command `npm run build`
* `Bash(npm run test *)` matches Bash commands starting with `npm run test`
* `Bash(npm *)` matches any command starting with `npm `
* `Bash(* install)` matches any command ending with ` install`
* `Bash(git * main)` matches commands like `git checkout main` and `git log --oneline main`

A single `*` matches any sequence of characters including spaces, so one wildcard can span multiple arguments. `Bash(git *)` matches `git log --oneline --all`, and `Bash(git * main)` matches `git push origin main` as well as `git merge main`.

When `*` appears at the end with a space before it (like `Bash(ls *)`), it enforces a word boundary, requiring the prefix to be followed by a space or end-of-string. For example, `Bash(ls *)` matches `ls -la` but not `lsof`. In contrast, `Bash(ls*)` without a space matches both `ls -la` and `lsof` because there's no word boundary constraint.

#### Compound commands

<Tip>
  Claude Code is aware of shell operators, so a rule like `Bash(safe-cmd *)` won't give it permission to run the command `safe-cmd && other-cmd`. The recognized command separators are `&&`, `||`, `;`, `|`, `|&`, `&`, and newlines. A rule must match each subcommand independently.
</Tip>

When you approve a compound command with "Yes, don't ask again", Claude Code saves a separate rule for each subcommand that requires approval, rather than a single rule for the full compound string. For example, approving `git status && npm test` saves a rule for `npm test`, so future `npm test` invocations are recognized regardless of what precedes the `&&`. Subcommands like `cd` into a subdirectory generate their own Read rule for that path. Up to 5 rules may be saved for a single compound command.

#### Process wrappers

Before matching Bash rules, Claude Code strips a fixed set of process wrappers so a rule like `Bash(npm test *)` also matches `timeout 30 npm test`. The recognized wrappers are `timeout`, `time`, `nice`, `nohup`, and `stdbuf`.

Bare `xargs` is also stripped, so `Bash(grep *)` matches `xargs grep pattern`. Stripping applies only when `xargs` has no flags: an invocation like `xargs -n1 grep pattern` is matched as an `xargs` command, so rules written for the inner command do not cover it.

This wrapper list is built in and is not configurable. Development environment runners such as `direnv exec`, `devbox run`, `mise exec`, `npx`, and `docker exec` are not in the list. Because these tools execute their arguments as a command, a rule like `Bash(devbox run *)` matches whatever comes after `run`, including `devbox run rm -rf .`. To approve work inside an environment runner, write a specific rule that includes both the runner and the inner command, such as `Bash(devbox run npm test)`. Add one rule per inner command you want to allow.

Exec wrappers such as `watch`, `setsid`, `ionice`, and `flock` always prompt and cannot be auto-approved by a prefix rule like `Bash(watch *)`. The same applies to `find` with `-exec` or `-delete`: a `Bash(find *)` rule does not cover these forms. To approve a specific invocation, write an exact-match rule for the full command string.

#### Read-only commands

Claude Code recognizes a built-in set of Bash commands as read-only and runs them without a permission prompt in every mode. These include `ls`, `cat`, `echo`, `pwd`, `head`, `tail`, `grep`, `find`, `wc`, `which`, `diff`, `stat`, `du`, `cd`, and read-only forms of `git`. The set is not configurable; to require a prompt for one of these commands, add an `ask` or `deny` rule for it.

Unquoted glob patterns are permitted for commands whose every flag is read-only, so `ls *.ts` and `wc -l src/*.py` run without a prompt. Commands with write-capable or exec-capable flags, such as `find`, `sort`, `sed`, and `git`, still prompt when an unquoted glob is present because the glob could expand to a flag like `-delete`.

A `cd` into a path inside your working directory or an [additional directory](#working-directories) is also read-only. A compound command like `cd packages/api && ls` runs without a prompt when each part qualifies on its own. Combining `cd` with `git` in one compound command always prompts, regardless of the target directory.

<Warning>
  Bash permission patterns that try to constrain command arguments are fragile. For example, `Bash(curl http://github.com/ *)` intends to restrict curl to GitHub URLs, but won't match variations like:

  * Options before URL: `curl -X GET http://github.com/...`
  * Different protocol: `curl https://github.com/...`
  * Redirects: `curl -L http://bit.ly/xyz` (redirects to github)
  * Variables: `URL=http://github.com && curl $URL`
  * Extra spaces: `curl  http://github.com`

  For more reliable URL filtering, consider:

  * **Restrict Bash network tools**: use deny rules to block `curl`, `wget`, and similar commands, then use the WebFetch tool with `WebFetch(domain:github.com)` permission for allowed domains
  * **Use PreToolUse hooks**: implement a hook that validates URLs in Bash commands and blocks disallowed domains
  * **Add CLAUDE.md guidance**: describe your allowed curl patterns in `CLAUDE.md`. This shapes what Claude tries but doesn't enforce a boundary, so pair it with one of the options above

  Note that using WebFetch alone does not prevent network access. If Bash is allowed, Claude can still use `curl`, `wget`, or other tools to reach any URL.
</Warning>

### PowerShell

PowerShell permission rules use the same shape as Bash rules. Wildcards with `*` match at any position, the `:*` suffix is equivalent to a trailing ` *`, and a bare `PowerShell` or `PowerShell(*)` matches every command. This configuration allows `Get-ChildItem` and `git commit` commands while blocking `Remove-Item`:

```json theme={null}
{
  "permissions": {
    "allow": [
      "PowerShell(Get-ChildItem *)",
      "PowerShell(git commit *)"
    ],
    "deny": [
      "PowerShell(Remove-Item *)"
    ]
  }
}
```

Common aliases are canonicalized before matching. A rule written for the cmdlet name also matches its aliases, so `PowerShell(Get-ChildItem *)` matches `gci`, `ls`, and `dir` as well. Matching is case-insensitive.

Claude Code parses the PowerShell AST and checks each command in a compound command independently. Pipeline operators `|`, statement separators `;`, and on PowerShell 7+ the chain operators `&&` and `||` split a compound command into subcommands. A rule must match every subcommand for the compound command to be allowed.

### Read and Edit

`Edit` rules apply to all built-in tools that edit files. Claude makes a best-effort attempt to apply `Read` rules to all built-in tools that read files like Grep and Glob, to `@file` mentions in your prompts, and to the selection and open-file context that a connected [IDE](/docs/en/vs-code#the-built-in-ide-mcp-server) shares with Claude.

<Warning>
  Read and Edit deny rules apply to Claude's built-in file tools and to file commands Claude Code recognizes in Bash, such as `cat`, `head`, `tail`, and `sed`. They do not apply to arbitrary subprocesses that read or write files indirectly, like a Python or Node script that opens files itself. For OS-level enforcement that blocks all processes from accessing a path, [enable the sandbox](/docs/en/sandboxing).
</Warning>

Read and Edit rules both follow the [gitignore](https://git-scm.com/docs/gitignore) specification with four distinct pattern types:

| Pattern            | Meaning                                | Example                          | Matches                        |
| ------------------ | -------------------------------------- | -------------------------------- | ------------------------------ |
| `//path`           | **Absolute** path from filesystem root | `Read(//Users/alice/secrets/**)` | `/Users/alice/secrets/**`      |
| `~/path`           | Path from **home** directory           | `Read(~/Documents/*.pdf)`        | `/Users/alice/Documents/*.pdf` |
| `/path`            | Path **relative to project root**      | `Edit(/src/**/*.ts)`             | `<project root>/src/**/*.ts`   |
| `path` or `./path` | Path **relative to current directory** | `Read(*.env)`                    | `<cwd>/*.env`                  |

<Warning>
  A pattern like `/Users/alice/file` is NOT an absolute path. It's relative to the project root. Use `//Users/alice/file` for absolute paths.
</Warning>

On Windows, paths are normalized to POSIX form before matching. `C:\Users\alice` becomes `/c/Users/alice`, so use `//c/**/.env` to match `.env` files anywhere on that drive. To match across all drives, use `//**/.env`.

Examples:

* `Edit(/docs/**)`: edits in `<project>/docs/` (NOT `/docs/` and NOT `<project>/.claude/docs/`)
* `Read(~/.zshrc)`: reads your home directory's `.zshrc`
* `Edit(//tmp/scratch.txt)`: edits the absolute path `/tmp/scratch.txt`
* `Read(src/**)`: reads from `<current-directory>/src/`

A rule only matches files under its anchor, so the anchor determines how far a deny rule reaches. Bare filenames follow gitignore semantics and match at any depth, so `Read(.env)` and `Read(**/.env)` are equivalent:

| Deny rule                       | Blocks                                       | Does not block                                       |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `Read(.env)` or `Read(**/.env)` | any `.env` at or under the current directory | `.env` in a parent directory or another project      |
| `Read(//**/.env)`               | any `.env` anywhere on the filesystem        | nothing; the rule is anchored at the filesystem root |

<Note>
  In gitignore patterns, `*` matches files in a single directory while `**` matches recursively across directories. To allow all file access, use just the tool name without parentheses: `Read`, `Edit`, or `Write`.
</Note>

When Claude accesses a symlink, permission rules check two paths: the symlink itself and the file it resolves to. Allow and deny rules treat that pair differently: allow rules fall back to prompting you, while deny rules block outright.

* **Allow rules**: apply only when both the symlink path and its target match. A symlink inside an allowed directory that points outside it still prompts you.
* **Deny rules**: apply when either the symlink path or its target matches. A symlink that points to a denied file is itself denied.

For example, with `Read(./project/**)` allowed and `Read(~/.ssh/**)` denied, a symlink at `./project/key` pointing to `~/.ssh/id_rsa` is blocked: the target fails the allow rule and matches the deny rule.

### WebFetch

* `WebFetch(domain:example.com)` matches fetch requests to example.com

### MCP

* `mcp__puppeteer` matches any tool provided by the `puppeteer` server (name configured in Claude Code)
* `mcp__puppeteer__*` wildcard syntax that also matches all tools from the `puppeteer` server
* `mcp__puppeteer__puppeteer_navigate` matches the `puppeteer_navigate` tool provided by the `puppeteer` server

### Agent (subagents)

Use `Agent(AgentName)` rules to control which [subagents](/docs/en/sub-agents) Claude can use:

* `Agent(Explore)` matches the Explore subagent
* `Agent(Plan)` matches the Plan subagent
* `Agent(my-custom-agent)` matches a custom subagent named `my-custom-agent`

Add these rules to the `deny` array in your settings or use the `--disallowedTools` CLI flag to disable specific agents. To disable the Explore agent:

```json theme={null}
{
  "permissions": {
    "deny": ["Agent(Explore)"]
  }
}
```

## Extend permissions with hooks

[Claude Code hooks](/docs/en/hooks-guide) provide a way to register custom shell commands to perform permission evaluation at runtime. When Claude Code makes a tool call, PreToolUse hooks run before the permission prompt. The hook output can deny the tool call, force a prompt, or skip the prompt to let the call proceed.

Hook decisions do not bypass permission rules. Deny and ask rules are evaluated regardless of what a PreToolUse hook returns, so a matching deny rule blocks the call and a matching ask rule still prompts even when the hook returned `"allow"` or `"ask"`. This preserves the deny-first precedence described in [Manage permissions](#manage-permissions), including deny rules set in managed settings.

A blocking hook also takes precedence over allow rules. A hook that exits with code 2 stops the tool call before permission rules are evaluated, so the block applies even when an allow rule would otherwise let the call proceed. To run all Bash commands without prompts except for a few you want blocked, add `"Bash"` to your allow list and register a PreToolUse hook that rejects those specific commands. See [Block edits to protected files](/docs/en/hooks-guide#block-edits-to-protected-files) for a hook script you can adapt.

## Working directories

By default, Claude has access to files in the directory where it was launched. You can extend this access:

* **During startup**: use `--add-dir <path>` CLI argument
* **During session**: use `/add-dir` command
* **Persistent configuration**: add to `additionalDirectories` in [settings files](/docs/en/settings#settings-files)

Files in additional directories follow the same permission rules as the original working directory: they become readable without prompts, and file editing permissions follow the current permission mode.

### Additional directories grant file access, not configuration

Adding a directory extends where Claude can read and edit files. It does not make that directory a full configuration root: most `.claude/` configuration is not discovered from additional directories, though a few types are loaded as exceptions.

These exceptions apply only to directories added with the `--add-dir` flag or the `/add-dir` command. Directories listed in `permissions.additionalDirectories` in a settings file grant file access only and do not load any of the configuration below.

The following configuration types are loaded from `--add-dir` directories:

| Configuration                                                          | Loaded from `--add-dir`                                                                                                                                            |
| :--------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Skills](/docs/en/skills) in `.claude/skills/`                              | Yes, with live reload                                                                                                                                              |
| Plugin settings in `.claude/settings.json`                             | `enabledPlugins` and `extraKnownMarketplaces` only                                                                                                                 |
| [CLAUDE.md](/docs/en/memory) files, `.claude/rules/`, and `CLAUDE.local.md` | Only when `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` is set. `CLAUDE.local.md` additionally requires the `local` setting source, which is enabled by default |

Subagents, commands, and output styles are discovered from the current working directory and its parents, your user directory at `~/.claude/`, and managed settings. Hooks and other `settings.json` keys load from the current working directory's `.claude/` folder with no parent-directory fallback, alongside your user `~/.claude/settings.json` and managed settings. To share that configuration across projects, use one of these approaches:

* **User-level configuration**: place files in `~/.claude/agents/`, `~/.claude/output-styles/`, or `~/.claude/settings.json` to make them available in every project
* **Plugins**: package and distribute configuration as a [plugin](/docs/en/plugins) that teams can install
* **Launch from the config directory**: run Claude Code from the directory containing the `.claude/` configuration you want

## How permissions interact with sandboxing

Permissions and [sandboxing](/docs/en/sandboxing) are complementary security layers:

* **Permissions** control which tools Claude Code can use and which files or domains it can access. They apply to all tools (Bash, Read, Edit, WebFetch, MCP, and others).
* **Sandboxing** provides OS-level enforcement that restricts the Bash tool's filesystem and network access. It applies only to Bash commands and their child processes.

Use both for defense-in-depth:

* Permission deny rules block Claude from even attempting to access restricted resources
* Sandbox restrictions prevent Bash commands from reaching resources outside defined boundaries, even if a prompt injection bypasses Claude's decision-making
* Filesystem restrictions in the sandbox combine the [`sandbox.filesystem`](/docs/en/sandboxing) settings with Read and Edit deny rules; both are merged into the final sandbox boundary
* Network restrictions combine WebFetch permission rules with the sandbox's `allowedDomains` and `deniedDomains` lists

When sandboxing is enabled with `autoAllowBashIfSandboxed: true`, which is the default, sandboxed Bash commands run without prompting even if your permissions include `ask: Bash(*)`. The sandbox boundary substitutes for the per-command prompt. Explicit deny rules still apply, and `rm` or `rmdir` commands that target `/`, your home directory, or other critical system paths still trigger a prompt. See [sandbox modes](/docs/en/sandboxing#sandbox-modes) to change this behavior.

## Managed settings

For organizations that need centralized control over Claude Code configuration, administrators can deploy managed settings that cannot be overridden by user or project settings. These policy settings follow the same format as regular settings files and can be delivered through MDM/OS-level policies, managed settings files, or [server-managed settings](/docs/en/server-managed-settings). See [settings files](/docs/en/settings#settings-files) for delivery mechanisms and file locations.

### Managed-only settings

The following settings are only read from managed settings. Placing them in user or project settings files has no effect.

| Setting                                        | Description                                                                                                                                                                                                                                                                                                             |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allowAllClaudeAiMcps`                         | When `true`, claude.ai connectors load alongside a deployed `managed-mcp.json` instead of being suppressed by its exclusive control. See [Managed MCP configuration](/docs/en/managed-mcp)                                                                                                                                   |
| `allowedChannelPlugins`                        | Allowlist of channel plugins that may push messages. Replaces the default Anthropic allowlist when set. Requires `channelsEnabled: true`. See [Restrict which channel plugins can run](/docs/en/channels#restrict-which-channel-plugins-can-run)                                                                             |
| `allowManagedHooksOnly`                        | When `true`, only managed hooks, SDK hooks, and hooks from plugins force-enabled in managed settings `enabledPlugins` are loaded. User, project, and all other plugin hooks are blocked                                                                                                                                 |
| `allowManagedMcpServersOnly`                   | When `true`, only `allowedMcpServers` from managed settings are respected. `deniedMcpServers` still merges from all sources. See [Managed MCP configuration](/docs/en/managed-mcp)                                                                                                                                           |
| `allowManagedPermissionRulesOnly`              | When `true`, prevents user and project settings from defining `allow`, `ask`, or `deny` permission rules. Only rules in managed settings apply. Does not affect the MCP server allowlist; for that, set `allowManagedMcpServersOnly`                                                                                    |
| `blockedMarketplaces`                          | Blocklist of marketplace sources. Blocked sources are checked before downloading, so they never touch the filesystem. See [managed marketplace restrictions](/docs/en/plugin-marketplaces#managed-marketplace-restrictions)                                                                                                  |
| `channelsEnabled`                              | Allow [channels](/docs/en/channels) for the organization. See [enterprise controls](/docs/en/channels#enterprise-controls) for the default on each plan                                                                                                                                                                           |
| `forceRemoteSettingsRefresh`                   | When `true`, blocks CLI startup until remote managed settings are freshly fetched and exits if the fetch fails. See [fail-closed enforcement](/docs/en/server-managed-settings#enforce-fail-closed-startup)                                                                                                                  |
| `pluginTrustMessage`                           | Custom message appended to the plugin trust warning shown before installation                                                                                                                                                                                                                                           |
| `sandbox.filesystem.allowManagedReadPathsOnly` | When `true`, only `filesystem.allowRead` paths from managed settings are respected. `denyRead` still merges from all sources                                                                                                                                                                                            |
| `sandbox.network.allowManagedDomainsOnly`      | When `true`, only `allowedDomains` and `WebFetch(domain:...)` allow rules from managed settings are respected. Non-allowed domains are blocked automatically without prompting the user. Denied domains still merge from all sources                                                                                    |
| `strictKnownMarketplaces`                      | Controls which plugin marketplace sources users can add and install plugins from. See [managed marketplace restrictions](/docs/en/plugin-marketplaces#managed-marketplace-restrictions)                                                                                                                                      |
| `strictPluginOnlyCustomization`                | Block skills, agents, hooks, and MCP servers from user and project sources, so they can only come from plugins or managed settings. `true` locks all four surfaces; an array such as `["skills", "hooks"]` locks only the named ones. See [`strictPluginOnlyCustomization`](/docs/en/settings#strictpluginonlycustomization) |
| `wslInheritsWindowsSettings`                   | When `true` in the Windows HKLM registry key or `C:\Program Files\ClaudeCode\managed-settings.json`, WSL reads managed settings from the Windows policy chain in addition to `/etc/claude-code`. See [Settings files](/docs/en/settings#settings-files)                                                                      |

`disableBypassPermissionsMode` is typically placed in managed settings to enforce organizational policy, but it works from any scope. A user can set it in their own settings to lock themselves out of bypass mode.

<Note>
  On Team and Enterprise plans, an admin enables or disables [Remote Control](/docs/en/remote-control) and [web sessions](/docs/en/claude-code-on-the-web) organization-wide in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code). Remote Control can additionally be disabled per device with the [`disableRemoteControl`](/docs/en/settings#available-settings) managed setting. Web sessions have no per-device managed settings key.
</Note>

## Settings precedence

Permission rules follow the same [settings precedence](/docs/en/settings#settings-precedence) as all other Claude Code settings:

1. **Managed settings**: cannot be overridden by any other level, including command line arguments
2. **Command line arguments**: temporary session overrides
3. **Local project settings** (`.claude/settings.local.json`)
4. **Shared project settings** (`.claude/settings.json`)
5. **User settings** (`~/.claude/settings.json`)

If a tool is denied at any level, no other level can allow it. For example, a managed settings deny cannot be overridden by `--allowedTools`, and `--disallowedTools` can add restrictions beyond what managed settings define.

Embedding hosts can supply additional managed policy via the SDK `managedSettings` option when [`parentSettingsBehavior`](/docs/en/settings#settings-precedence) is set to `"merge"`; embedder values can tighten policy but not loosen it.

For example, if user settings allow a permission and project settings deny it, the deny rule blocks it. The reverse is also true: a user-level deny blocks a project-level allow, because deny rules from any scope are evaluated before allow rules.

## Example configurations

This [repository](https://github.com/anthropics/claude-code/tree/main/examples/settings) includes starter settings configurations for common deployment scenarios. Use these as starting points and adjust them to fit your needs.

## See also

* [Settings](/docs/en/settings): complete configuration reference including the permission settings table
* [Configure auto mode](/docs/en/auto-mode-config): tell the auto mode classifier which infrastructure your organization trusts
* [Sandboxing](/docs/en/sandboxing): OS-level filesystem and network isolation for Bash commands
* [Authentication](/docs/en/authentication): set up user access to Claude Code
* [Security](/docs/en/security): security safeguards and best practices
* [Hooks](/docs/en/hooks-guide): automate workflows and extend permission evaluation


---

## Configure auto mode

`https://code.claude.com/docs/en/auto-mode-config`

Tell the auto mode classifier which repos, buckets, and domains your organization trusts. Set environment context, override the default block and allow rules, and inspect your effective config with the auto-mode CLI subcommands.

[Auto mode](/docs/en/permission-modes#eliminate-prompts-with-auto-mode) lets Claude Code run without permission prompts by routing each tool call through a classifier that blocks anything irreversible, destructive, or aimed outside your environment. Use the `autoMode` settings block to tell that classifier which repos, buckets, and domains your organization trusts, so it stops blocking routine internal operations.

<Note>
  Auto mode is available to all users on the Anthropic API. It is not available on Bedrock, Vertex, or Foundry. If Claude Code reports auto mode as unavailable for your account, check the [full requirements](/docs/en/permission-modes#eliminate-prompts-with-auto-mode), which also cover the supported models and admin enablement on Team and Enterprise plans.
</Note>

Out of the box, the classifier trusts only the working directory and the current repo's configured remotes. Actions like pushing to your company's source-control org or writing to a team cloud bucket are blocked until you add them to `autoMode.environment`.

For how to enable auto mode and what it blocks by default, see [Permission modes](/docs/en/permission-modes#eliminate-prompts-with-auto-mode). This page is the configuration reference.

This page covers how to:

* [Choose where to set rules](#where-the-classifier-reads-configuration) across CLAUDE.md, user settings, and managed settings
* [Define trusted infrastructure](#define-trusted-infrastructure) with `autoMode.environment`
* [Override the block and allow rules](#override-the-block-and-allow-rules) when the defaults don't fit your pipeline
* [Inspect your effective config](#inspect-the-defaults-and-your-effective-config) with the `claude auto-mode` subcommands
* [Review denials](#review-denials) so you know what to add next

## Where the classifier reads configuration

The classifier reads the same [CLAUDE.md](/docs/en/memory) content Claude itself loads, so an instruction like "never force push" in your project's CLAUDE.md steers both Claude and the classifier at the same time. Start there for project conventions and behavioral rules.

For rules that apply across projects, such as trusted infrastructure or organization-wide deny rules, use the `autoMode` settings block. The classifier reads `autoMode` from the following scopes:

| Scope                          | File                                            | Use for                                              |
| :----------------------------- | :---------------------------------------------- | :--------------------------------------------------- |
| One developer                  | `~/.claude/settings.json`                       | Personal trusted infrastructure                      |
| One project, one developer     | `.claude/settings.local.json`                   | Per-project trusted buckets or services, gitignored  |
| Organization-wide              | [Managed settings](/docs/en/server-managed-settings) | Trusted infrastructure distributed to all developers |
| `--settings` flag or Agent SDK | Inline JSON                                     | Per-invocation overrides for automation              |

The classifier does not read `autoMode` from shared project settings in `.claude/settings.json`, so a checked-in repo cannot inject its own allow rules.

Entries from each scope are combined. A developer can extend `environment`, `allow`, `soft_deny`, and `hard_deny` with personal entries but cannot remove entries that managed settings provide. Because allow rules act as exceptions to soft block rules inside the classifier, a developer-added `allow` entry can override an organization `soft_deny` entry: the combination is additive, not a hard policy boundary.

<Note>
  The classifier is a second gate that runs after the [permissions system](/docs/en/permissions). For actions that must never run regardless of user intent or classifier configuration, use `permissions.deny` in managed settings, which blocks the action before the classifier is consulted and cannot be overridden.
</Note>

## Define trusted infrastructure

For most organizations, `autoMode.environment` is the only field you need to set. It tells the classifier which repos, buckets, and domains are trusted: the classifier uses it to decide what "external" means, so any destination not listed is a potential exfiltration target.

The default environment list trusts the working repo and its configured remotes. To add your own entries alongside that default, include the literal string `"$defaults"` in the array. The default entries are spliced in at that position, so your custom entries can go before or after them.

```json theme={null}
{
  "autoMode": {
    "environment": [
      "$defaults",
      "Source control: github.example.com/acme-corp and all repos under it",
      "Trusted cloud buckets: s3://acme-build-artifacts, gs://acme-ml-datasets",
      "Trusted internal domains: *.corp.example.com, api.internal.example.com",
      "Key internal services: Jenkins at ci.example.com, Artifactory at artifacts.example.com"
    ]
  }
}
```

Entries are prose, not regex or tool patterns. The classifier reads them as natural-language rules. Write them the way you would describe your infrastructure to a new engineer. A thorough environment section covers:

* **Organization**: your company name and what Claude Code is primarily used for, like software development, infrastructure automation, or data engineering
* **Source control**: every GitHub, GitLab, or Bitbucket org your developers push to
* **Cloud providers and trusted buckets**: bucket names or prefixes that Claude should be able to read from and write to
* **Trusted internal domains**: hostnames for APIs, dashboards, and services inside your network, like `*.internal.example.com`
* **Key internal services**: CI, artifact registries, internal package indexes, incident tooling
* **Additional context**: regulated-industry constraints, multi-tenant infrastructure, or compliance requirements that affect what the classifier should treat as risky

A useful starting template: fill in the bracketed fields and remove any lines that don't apply.

```json theme={null}
{
  "autoMode": {
    "environment": [
      "$defaults",
      "Organization: {COMPANY_NAME}. Primary use: {PRIMARY_USE_CASE, e.g. software development, infrastructure automation}",
      "Source control: {SOURCE_CONTROL, e.g. GitHub org github.example.com/acme-corp}",
      "Cloud provider(s): {CLOUD_PROVIDERS, e.g. AWS, GCP, Azure}",
      "Trusted cloud buckets: {TRUSTED_BUCKETS, e.g. s3://acme-builds, gs://acme-datasets}",
      "Trusted internal domains: {TRUSTED_DOMAINS, e.g. *.internal.example.com, api.example.com}",
      "Key internal services: {SERVICES, e.g. Jenkins at ci.example.com, Artifactory at artifacts.example.com}",
      "Additional context: {EXTRA, e.g. regulated industry, multi-tenant infrastructure, compliance requirements}"
    ]
  }
}
```

The more specific context you give, the better the classifier can distinguish routine internal operations from exfiltration attempts.

You don't need to fill everything in at once. A reasonable rollout: start with the defaults and add your source control org and key internal services, which resolves the most common false positives like pushing to your own repos. Add trusted domains and cloud buckets next. Fill the rest as blocks come up.

## Override the block and allow rules

Three additional fields let you replace the classifier's built-in rule lists: `autoMode.hard_deny` for unconditional security boundaries, `autoMode.soft_deny` for destructive actions that user intent can clear, and `autoMode.allow` for exceptions. Each is an array of prose descriptions, read as natural-language rules. For tool-pattern-based hard blocks that run before the classifier, use [`permissions.deny`](/docs/en/permissions).

Inside the classifier, precedence works in four tiers:

* `hard_deny` rules block unconditionally. User intent and `allow` exceptions do not apply.
* `soft_deny` rules block next. User intent and `allow` exceptions can override these.
* `allow` rules then override matching `soft_deny` rules as exceptions.
* Explicit user intent overrides the remaining soft blocks: if the user's message directly and specifically describes the exact action Claude is about to take, the classifier allows it even when a `soft_deny` rule matches.

General requests don't count as explicit intent. Asking Claude to "clean up the repo" does not authorize force-pushing, but asking Claude to "force-push this branch" does.

To loosen, add to `allow` when the classifier repeatedly flags a routine pattern the default exceptions don't cover. To tighten, add to `soft_deny` for destructive risks specific to your environment that the defaults miss, or to `hard_deny` for security boundaries that must never be crossed. To keep the built-in rules while adding your own, include the literal string `"$defaults"` in the array. The default rules are spliced in at that position, so your custom rules can go before or after them, and you continue to inherit updates as the built-in list changes across releases.

```json theme={null}
{
  "autoMode": {
    "environment": [
      "$defaults",
      "Source control: github.example.com/acme-corp and all repos under it"
    ],
    "allow": [
      "$defaults",
      "Deploying to the staging namespace is allowed: staging is isolated from production and resets nightly",
      "Writing to s3://acme-scratch/ is allowed: ephemeral bucket with a 7-day lifecycle policy"
    ],
    "soft_deny": [
      "$defaults",
      "Never run database migrations outside the migrations CLI, even against dev databases",
      "Never modify files under infra/terraform/prod/: production infrastructure changes go through the review workflow"
    ],
    "hard_deny": [
      "$defaults",
      "Never send repository contents to third-party code-review APIs"
    ]
  }
}
```

<Danger>
  Setting any of `environment`, `allow`, `soft_deny`, or `hard_deny` without `"$defaults"` replaces the entire default list for that section. A `soft_deny` array without `"$defaults"` discards every built-in soft block rule, including force push, `curl | bash`, and production deploys. A `hard_deny` array without `"$defaults"` discards the built-in data exfiltration and auto-mode bypass rules.
</Danger>

Each section is evaluated independently, so setting `environment` alone leaves the default `allow`, `soft_deny`, and `hard_deny` lists intact. Only omit `"$defaults"` when you intend to take full ownership of the list. To do that safely, run `claude auto-mode defaults` to print the built-in rules, copy them into your settings file, then review each rule against your own pipeline and risk tolerance.

## Inspect the defaults and your effective config

Three CLI subcommands help you inspect and validate your configuration.

Print the built-in `environment`, `allow`, `soft_deny`, and `hard_deny` rules as JSON:

```bash theme={null}
claude auto-mode defaults
```

Print what the classifier actually uses as JSON, with your settings applied where set and defaults otherwise:

```bash theme={null}
claude auto-mode config
```

Get AI feedback on your custom `allow`, `soft_deny`, and `hard_deny` rules:

```bash theme={null}
claude auto-mode critique
```

Run `claude auto-mode config` after saving your settings to confirm the effective rules are what you expect, with `"$defaults"` expanded in place. If you've written custom rules, `claude auto-mode critique` reviews them and flags entries that are ambiguous, redundant, or likely to cause false positives. If you need to remove or rewrite a built-in rule rather than add alongside it, save the output of `claude auto-mode defaults` to a file, edit the lists, and paste the result into your settings file in place of `"$defaults"`.

## Review denials

When auto mode denies a tool call, the denial is recorded in `/permissions` under the Recently denied tab. Press `r` on a denied action to mark it for retry: when you exit the dialog, Claude Code sends a message telling the model it may retry that tool call and resumes the conversation.

Repeated denials for the same destination usually mean the classifier is missing context. Add that destination to `autoMode.environment`, then run `claude auto-mode config` to confirm it took effect.

To react to denials programmatically, use the [`PermissionDenied` hook](/docs/en/hooks#permissiondenied).

## See also

* [Permission modes](/docs/en/permission-modes#eliminate-prompts-with-auto-mode): what auto mode is, what it blocks by default, and how to enable it
* [Managed settings](/docs/en/server-managed-settings): deploy `autoMode` configuration across your organization
* [Permissions](/docs/en/permissions): allow, ask, and deny rules that apply before the classifier runs
* [Settings](/docs/en/settings): the full settings reference, including the `autoMode` key


---

## Plan in the cloud with ultraplan

`https://code.claude.com/docs/en/ultraplan`

Start a plan from your CLI, draft it on Claude Code on the web, then execute it remotely or back in your terminal

<Note>
  Ultraplan is in research preview and requires Claude Code v2.1.91 or later. Behavior and capabilities may change based on feedback.
</Note>

Ultraplan hands a planning task from your local CLI to a [Claude Code on the web](/docs/en/claude-code-on-the-web) session running in [plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode). Claude drafts the plan in the cloud while you keep working in your terminal. When the plan is ready, you open it in your browser to comment on specific sections, ask for revisions, and choose where to execute it.

This is useful when you want a richer review surface than the terminal offers:

* **Targeted feedback**: comment on individual sections of the plan instead of replying to the whole thing
* **Hands-off drafting**: the plan is generated remotely, so your terminal stays free for other work
* **Flexible execution**: approve the plan to run on the web and open a pull request, or send it back to your terminal

Ultraplan requires a [Claude Code on the web](/docs/en/claude-code-on-the-web) account and a GitHub repository. Because it runs on Anthropic's cloud infrastructure, it is not available when using Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry. The cloud session runs in your account's default [cloud environment](/docs/en/claude-code-on-the-web#the-cloud-environment). If you don't have a cloud environment yet, ultraplan creates one automatically when it first launches.

## Launch ultraplan from the CLI

From your local CLI session, you can launch ultraplan in three ways:

* **Command**: run `/ultraplan` followed by your prompt
* **Keyword**: include the word `ultraplan` anywhere in a normal prompt
* **From a local plan**: when Claude finishes a local plan and shows the approval dialog, choose **No, refine with Ultraplan on Claude Code on the web** to send the draft to the cloud for further iteration

For example, to plan a service migration with the command:

```
/ultraplan migrate the auth service from sessions to JWTs
```

The command and keyword paths open a confirmation dialog before launching. The local plan path skips this dialog because that selection already serves as confirmation. If [Remote Control](/docs/en/remote-control) is active, it disconnects when ultraplan starts because both features occupy the claude.ai/code interface and only one can be connected at a time.

After the cloud session launches, your CLI's prompt input shows a status indicator while the remote session works:

| Status                         | Meaning                                                            |
| :----------------------------- | :----------------------------------------------------------------- |
| `◇ ultraplan`                  | Claude is researching your codebase and drafting the plan          |
| `◇ ultraplan needs your input` | Claude has a clarifying question; open the session link to respond |
| `◆ ultraplan ready`            | The plan is ready to review in your browser                        |

Run `/tasks` and select the ultraplan entry to open a detail view with the session link, agent activity, and a **Stop ultraplan** action. Stopping archives the cloud session and clears the indicator; nothing is saved to your terminal.

## Review and revise the plan in your browser

When the status changes to `◆ ultraplan ready`, open the session link to view the plan on claude.ai. The plan appears in a dedicated review view:

* **Inline comments**: highlight any passage and leave a comment for Claude to address
* **Emoji reactions**: react to a section to signal approval or concern without writing a full comment
* **Outline sidebar**: jump between sections of the plan

When you ask Claude to address your comments, it revises the plan and presents an updated draft. You can iterate as many times as needed before choosing where to execute.

## Choose where to execute

When the plan looks right, you choose from the browser whether Claude implements it in the same cloud session or sends it back to your waiting terminal.

### Execute on the web

Select **Approve Claude's plan and start coding** in your browser to have Claude implement it in the same Claude Code on the web session. Your terminal shows a confirmation, the status indicator clears, and the work continues in the cloud. When the implementation finishes, [review the diff](/docs/en/claude-code-on-the-web#review-changes) and create a pull request from the web interface.

### Send the plan back to your terminal

Select **Approve plan and teleport back to terminal** in your browser to implement the plan locally with full access to your environment. This option appears when the session was launched from your CLI and the terminal is still polling. The web session is archived so it doesn't continue working in parallel.

Your terminal shows the plan in a dialog titled **Ultraplan approved** with three options:

* **Implement here**: inject the plan into your current conversation and continue from where you left off
* **Start new session**: clear the current conversation and begin fresh with only the plan as context
* **Cancel**: save the plan to a file without executing it; Claude prints the file path so you can return to it later

If you start a new session, Claude prints a `claude --resume` command at the top so you can return to your previous conversation later.

## Related resources

* [Claude Code on the web](/docs/en/claude-code-on-the-web): the cloud infrastructure ultraplan runs on
* [Plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode): how planning works in a local session
* [Find bugs with ultrareview](/docs/en/ultrareview): the code review counterpart to ultraplan for catching issues before merge
* [Remote Control](/docs/en/remote-control): use the claude.ai/code interface with a session running on your own machine


---

## Find bugs with ultrareview

`https://code.claude.com/docs/en/ultrareview`

Run a deep, multi-agent code review in the cloud with /code-review ultra to find and verify bugs before you merge.

<Note>
  Ultrareview is a research preview feature available in Claude Code v2.1.86 and later. The feature, pricing, and availability may change based on feedback. The command is now invoked as `/code-review ultra`, and `/ultrareview` remains as an alias.
</Note>

Ultrareview is a deep code review that runs on Claude Code on the web infrastructure. When you run `/code-review ultra`, Claude Code launches a fleet of reviewer agents in a remote sandbox to find bugs in your branch or pull request.

Compared to a local `/review`, ultrareview offers:

* **Higher signal**: every reported finding is independently reproduced and verified, so the results focus on real bugs rather than style suggestions
* **Broader coverage**: many reviewer agents explore the change in parallel, which surfaces issues that a single-pass review can miss
* **No local resource use**: the review runs entirely in a remote sandbox, so your terminal stays free for other work while it runs

Ultrareview requires authentication with a Claude.ai account because it runs on Claude Code on the web infrastructure. If you are signed in with an API key only, run `/login` and authenticate with Claude.ai first. Ultrareview is not available when using Claude Code with Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry, and it is not available to organizations that have enabled Zero Data Retention.

## Run ultrareview from the CLI

Start a review from any git repository in the Claude Code CLI.

```text theme={null}
/code-review ultra
```

Without arguments, ultrareview reviews the diff between your current branch and the default branch, including any uncommitted and staged changes in your working tree. Claude Code bundles the repository state and uploads it to a remote sandbox for the review.

To review a GitHub pull request instead, pass the PR number.

```text theme={null}
/code-review ultra 1234
```

In PR mode, the remote sandbox clones the pull request directly from the host rather than bundling your local working tree. PR mode works with repositories on `github.com` and on [GitHub Enterprise Server](/docs/en/github-enterprise-server) instances that an admin has connected to Claude Code.

<Tip>
  If your repository is too large to bundle, Claude Code prompts you to use PR mode instead. Push your branch and open a draft PR, then run `/code-review ultra <PR-number>`.
</Tip>

Before launching, Claude Code shows a confirmation dialog with the review scope (including the file and line count when reviewing a branch), your remaining free runs, and the estimated cost. After you confirm, the review continues in the background and you can keep using your session. The command runs only when you invoke it with `/code-review ultra`; Claude does not start an ultrareview on its own.

## Pricing and free runs

Ultrareview is a premium feature that bills against usage credits rather than your plan's included usage.

| Plan                | Included free runs | After free runs                                                                                              |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Pro                 | 3 free runs        | billed as [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) |
| Max                 | 3 free runs        | billed as [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) |
| Team and Enterprise | none               | billed as [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans) |

Pro and Max subscribers receive three free ultrareview runs to try the feature. These three runs are a one-time allotment per account and do not refresh. After you use all three, or after the free run period ends, each review is billed to usage credits and typically costs \$5 to \$20 depending on the size of the change. A run counts once the remote session starts, so a review that you stop early or that fails to complete still uses a free run. For a paid review, usage credits are billed only for the portion that ran.

Because ultrareview always bills as usage credits outside the free runs, your account or organization must have usage credits turned on before you can launch a paid review. If usage credits are not turned on, Claude Code blocks the launch and links you to the billing settings where you can turn them on. You can also run `/usage-credits` to check or change your current setting.

## Track a running review

A review typically takes 5 to 10 minutes. The review runs as a background task, so you can keep working in your session, start other commands, or close the terminal entirely.

Use `/tasks` to see running and completed reviews, open the detail view for a review, or stop a review that is in progress. Stopping a review archives the cloud session, and partial findings are not returned. When the review finishes, the verified findings appear as a notification in your session. Each finding includes the file location and an explanation of the issue so you can ask Claude to fix it directly.

## Run ultrareview non-interactively

Use the `claude ultrareview` subcommand to start an ultrareview from CI or a script without an interactive session. The subcommand launches the same review as `/code-review ultra`, blocks until the remote review finishes, prints the findings to stdout, and exits with code 0 on success or 1 on failure.

```bash theme={null}
claude ultrareview
claude ultrareview 1234
claude ultrareview origin/main
```

Without arguments, the subcommand reviews the diff between your current branch and the default branch. Pass a PR number to review a pull request, or pass a base branch to review the diff against that branch instead. Invoking the subcommand counts as consent for the billing and terms prompt that the interactive command shows.

Progress messages and the live session URL go to stderr so stdout stays parseable. Use these flags to control the output and timeout:

| Flag                  | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `--json`              | Print the raw `bugs.json` payload instead of the formatted findings |
| `--timeout <minutes>` | Maximum minutes to wait for the review to finish. Defaults to 30    |

Running `claude ultrareview` requires the same authentication and usage credit configuration as `/code-review ultra`. The subcommand exits with code 0 when the review completes with or without findings, code 1 when the review fails to launch, the remote session errors, or the timeout elapses, and code 130 when interrupted with Ctrl-C. The remote review keeps running if you interrupt the subcommand; follow the session URL printed to stderr to watch it in the browser.

For automatic reviews on GitHub pull requests, [Code Review](/docs/en/code-review) integrates with your repository directly and posts findings as inline PR comments without a CLI step.

## How ultrareview compares to /review

Both commands review code, but they target different stages of your workflow.

|          | `/review`                      | `/code-review ultra`                                            |
| -------- | ------------------------------ | --------------------------------------------------------------- |
| Runs     | locally in your session        | remotely in a cloud sandbox                                     |
| Depth    | single-pass review             | multi-agent fleet with independent verification                 |
| Duration | seconds to a few minutes       | roughly 5 to 10 minutes                                         |
| Cost     | counts toward normal usage     | free runs, then roughly \$5 to \$20 per review as usage credits |
| Best for | quick feedback while iterating | pre-merge confidence on substantial changes                     |

Use `/review` for fast feedback as you work. Use `/code-review ultra` before merging a substantial change when you want a deeper pass that catches issues a single review might miss.

## Related resources

* [Claude Code on the web](/docs/en/claude-code-on-the-web): learn how remote sessions and cloud sandboxes work
* [Plan complex changes with ultraplan](/docs/en/ultraplan): the planning counterpart to ultrareview for upfront design work
* [Manage costs effectively](/docs/en/costs): track usage and set spending limits


---

## Speed up responses with fast mode

`https://code.claude.com/docs/en/fast-mode`

Get faster Opus responses in Claude Code by toggling fast mode.

<Note>
  Fast mode is in [research preview](#research-preview). The feature, pricing, and availability may change based on feedback.
</Note>

Fast mode is a high-speed configuration for Claude Opus, making the model up to 2.5x faster at a higher cost per token. Toggle it on with `/fast` when you need speed for interactive work like rapid iteration or live debugging, and toggle it off when cost matters more than latency.

Fast mode is not a different model. It uses Claude Opus with a different API configuration that prioritizes speed over cost efficiency. You get identical quality and capabilities with faster responses. Fast mode is supported on Opus 4.8, Opus 4.7, and Opus 4.6. It is not available on Sonnet, Haiku, or other models.

<Warning>
  Fast mode for Opus 4.6 is deprecated and will be removed approximately 30 days after the Opus 4.8 launch. After removal, fast mode on Opus 4.6 falls back to standard speed at standard pricing. Migrate to Opus 4.8 or Opus 4.7 to keep the speedup.
</Warning>

<Note>
  Fast mode requires Claude Code v2.1.36 or later. Check your version with `claude --version`.
</Note>

What to know:

* Use `/fast` to toggle on fast mode in the Claude Code CLI. Fast mode is not supported in the VS Code extension.
* Fast mode pricing is \$10/\$50 MTok on Opus 4.8 and \$30/\$150 MTok on Opus 4.7 and Opus 4.6.
* Available to all Claude Code users on subscription plans (Pro/Max/Team/Enterprise) and Claude Console.
* For Claude Code users on subscription plans (Pro/Max/Team/Enterprise), fast mode is available via usage credits only and not included in the subscription rate limits.

This page covers how to [toggle fast mode](#toggle-fast-mode), its [cost tradeoff](#understand-the-cost-tradeoff), [when to use it](#decide-when-to-use-fast-mode), [requirements](#requirements), [per-session opt-in](#require-per-session-opt-in), and [rate limit behavior](#handle-rate-limits).

## Toggle fast mode

Toggle fast mode in either of these ways:

* Type `/fast` and press Tab to toggle on or off
* Set `"fastMode": true` in your [user settings file](/docs/en/settings)

By default, fast mode persists across sessions. Administrators can configure fast mode to reset each session. See [require per-session opt-in](#require-per-session-opt-in) for details.

For the best cost efficiency, enable fast mode at the start of a session rather than switching mid-conversation. See [understand the cost tradeoff](#understand-the-cost-tradeoff) for details.

When you enable fast mode:

* If you're on a different model, Claude Code automatically switches to Opus
* You'll see a confirmation message: "Fast mode ON"
* A small `↯` icon appears next to the prompt while fast mode is active
* Run `/fast` again at any time to check whether fast mode is on or off

When you disable fast mode with `/fast` again, you remain on Opus. The model does not revert to your previous model. To switch to a different model, use `/model`.

Opus 4.8 is the fast mode default in Claude Code v2.1.154 and later. On v2.1.142 through v2.1.153, fast mode defaults to Opus 4.7. To pin fast mode to Opus 4.6 instead, set `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE=1`; this override will be removed when fast mode for Opus 4.6 is retired.

## Understand the cost tradeoff

Fast mode has higher per-token pricing than standard Opus, with the multiplier varying by model:

| Model                 | Input (MTok) | Output (MTok) |
| --------------------- | ------------ | ------------- |
| Opus 4.8              | \$10         | \$50          |
| Opus 4.7 and Opus 4.6 | \$30         | \$150         |

Fast mode pricing is flat across the full 1M token context window. For the standard Opus rate to compare against, see the [Claude pricing reference](https://platform.claude.com/docs/en/about-claude/pricing).

When you switch into fast mode mid-conversation, you pay the full fast mode uncached input token price for the entire conversation context. This costs more than if you had enabled fast mode from the start.

## Decide when to use fast mode

Fast mode is best for interactive work where response latency matters more than cost:

* Rapid iteration on code changes
* Live debugging sessions
* Time-sensitive work with tight deadlines

Standard mode is better for:

* Long autonomous tasks where speed matters less
* Batch processing or CI/CD pipelines
* Cost-sensitive workloads

### Fast mode vs effort level

Fast mode and effort level both affect response speed, but differently:

| Setting                | Effect                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Fast mode**          | Same model quality, lower latency, higher cost                                   |
| **Lower effort level** | Less thinking time, faster responses, potentially lower quality on complex tasks |

You can combine both: use fast mode with a lower [effort level](/docs/en/model-config#adjust-effort-level) for maximum speed on straightforward tasks.

## Requirements

Fast mode requires all of the following:

* **Anthropic API or subscription only**: fast mode is available through the Anthropic Console API and for Claude subscription plans using usage credits. It is not available on Amazon Bedrock, Google Vertex AI, Microsoft Azure Foundry, or Claude Platform on AWS.
* **Usage credits turned on**: your account must have usage credits turned on, which allows billing beyond your plan's included usage. For individual accounts, turn this on in your [Console billing settings](https://platform.claude.com/settings/organization/billing). For Team and Enterprise, an admin must turn on usage credits for the organization.

<Note>
  Fast mode usage draws directly from usage credits, even if you have remaining usage on your plan. This means fast mode tokens do not count against your plan's included usage and are charged at the fast mode rate from the first token.
</Note>

* **Admin enablement for Team and Enterprise**: fast mode is disabled by default for Team and Enterprise organizations. An admin must explicitly [enable fast mode](#enable-fast-mode-for-your-organization) before users can access it.

<Note>
  If your admin has not enabled fast mode for your organization, the `/fast` command will show "Fast mode has been disabled by your organization."
</Note>

### Enable fast mode for your organization

Admins can enable fast mode in:

* **Console** (API customers): [Claude Code preferences](https://platform.claude.com/claude-code/preferences)
* **Claude AI** (Team and Enterprise): [Admin Settings > Claude Code](https://claude.ai/admin-settings/claude-code)

Another option to disable fast mode entirely is to set `CLAUDE_CODE_DISABLE_FAST_MODE=1`. See [Environment variables](/docs/en/env-vars).

### Require per-session opt-in

By default, fast mode persists across sessions: if a user enables fast mode, it stays on in future sessions. Administrators on [Team](https://claude.com/pricing?utm_source=claude_code\&utm_medium=docs\&utm_content=fast_mode_teams#team-&-enterprise) or [Enterprise](https://anthropic.com/contact-sales?utm_source=claude_code\&utm_medium=docs\&utm_content=fast_mode_enterprise) plans can prevent this by setting `fastModePerSessionOptIn` to `true` in [managed settings](/docs/en/settings#settings-files) or [server-managed settings](/docs/en/server-managed-settings). This causes each session to start with fast mode off, requiring users to explicitly enable it with `/fast`.

```json theme={null}
{
  "fastModePerSessionOptIn": true
}
```

This is useful for controlling costs in organizations where users run multiple concurrent sessions. Users can still enable fast mode with `/fast` when they need speed, but it resets at the start of each new session. The user's fast mode preference is still saved, so removing this setting restores the default persistent behavior.

## Handle rate limits

Fast mode has separate rate limits from standard Opus. Fast mode on Opus 4.8, Opus 4.7, and Opus 4.6 shares the same rate limit pool: usage on any of them draws from the same limits. When you hit the fast mode rate limit or run out of usage credits:

1. Fast mode automatically falls back to standard speed
2. The `↯` icon turns gray to indicate cooldown
3. You continue working at standard speed and pricing
4. When the cooldown expires, fast mode automatically re-enables

To disable fast mode manually instead of waiting for cooldown, run `/fast` again.

## Research preview

Fast mode is a research preview feature. This means:

* The feature may change based on feedback
* Availability and pricing are subject to change
* The underlying API configuration may evolve

Report issues or feedback through your usual Anthropic support channels.

## See also

* [Model configuration](/docs/en/model-config): switch models and adjust effort levels
* [Manage costs effectively](/docs/en/costs): track token usage and reduce costs
* [Status line configuration](/docs/en/statusline): display model and context information


---

## Voice dictation

`https://code.claude.com/docs/en/voice-dictation`

Speak your prompts in the Claude Code CLI with hold-to-record or tap-to-record voice dictation.

Speak your prompts instead of typing them in the Claude Code CLI. Your speech is transcribed live into the prompt input, so you can mix voice and typing in the same message. Enable dictation with `/voice`, then either hold a key while you speak or tap once to start and again to send.

<Note>
  Voice dictation requires Claude Code v2.1.69 or later. Tap mode requires v2.1.116 or later. Check your version with `claude --version`.
</Note>

## Requirements

Voice dictation streams your recorded audio to Anthropic's servers for transcription. Audio is not processed locally. The speech-to-text service is only available when you authenticate with a Claude.ai account, and is not available when Claude Code is configured to use an Anthropic API key directly, Amazon Bedrock, Google Vertex AI, or Microsoft Foundry. Voice dictation is also not available when your organization has HIPAA compliance enabled. Transcription does not consume Claude messages or tokens and does not count toward the limits shown in `/usage`. See [data usage](/docs/en/data-usage) for how Anthropic handles your data.

Voice dictation also needs local microphone access, so it does not work in remote environments such as [Claude Code on the web](/docs/en/claude-code-on-the-web) or SSH sessions. In WSL, voice dictation requires WSLg for audio access. WSLg is included with WSL2 when installed from the Microsoft Store on Windows 10 or 11. If WSLg is not available, for example on WSL1, run Claude Code in native Windows instead.

Audio recording uses a built-in native module on macOS, Linux, and Windows. On Linux, if the native module cannot load, Claude Code falls back to `arecord` from ALSA utils or `rec` from SoX. If neither is available, `/voice` prints an install command for your package manager.

The Claude Code [VS Code extension](/docs/en/vs-code) also supports voice dictation with the same Claude.ai account requirement. It is not available in VS Code Remote sessions, including SSH, Dev Containers, and Codespaces, because the microphone is on your local machine and the extension runs on the remote host.

## Enable voice dictation

Run `/voice` to enable dictation. The first time you enable it, Claude Code runs a microphone check. On macOS, this triggers the system microphone permission prompt for your terminal if it has never been granted.

```
/voice
Voice mode enabled (hold). Hold Space to record. Dictation language: en (/config to change).
```

`/voice` accepts an optional mode argument:

| Command       | Effect                                        |
| :------------ | :-------------------------------------------- |
| `/voice`      | Toggle on or off, keep the current mode       |
| `/voice hold` | Enable in [hold mode](#hold-to-record)        |
| `/voice tap`  | Enable in [tap mode](#tap-to-record-and-send) |
| `/voice off`  | Disable                                       |

Voice dictation persists across sessions. Set it directly in your [user settings file](/docs/en/settings) instead of running `/voice`:

```json theme={null}
{
  "voice": {
    "enabled": true,
    "mode": "tap"
  }
}
```

While voice dictation is enabled, the input footer shows a `hold Space to speak` hint when the prompt is empty. The hint reflects your current `voice:pushToTalk` binding and updates if you [rebind the dictation key](#rebind-the-dictation-key). The hint text is the same in both modes, and it does not appear if you have a [custom status line](/docs/en/statusline) configured.

Transcription is tuned for coding vocabulary in both modes. Common development terms like `regex`, `OAuth`, `JSON`, and `localhost` are recognized correctly, and your current project name and git branch name are added as recognition hints automatically.

## Hold to record

Hold mode is push-to-talk: recording runs while you hold the key and stops when you release it. This is the default mode.

Hold `Space` to start recording. Claude Code detects a held key by watching for rapid key-repeat events from your terminal, so there is a brief warmup before recording begins. The footer shows `keep holding…` during warmup, then switches to a live waveform once recording is active.

The first couple of key-repeat characters type into the input during warmup and are removed automatically when recording activates. A single `Space` tap still types a space, since hold detection only triggers on rapid repeat.

<Tip>
  To skip the warmup, switch to [tap mode](#tap-to-record-and-send) with `/voice tap`, or [rebind to a modifier combination](#rebind-the-dictation-key) like `meta+k`. Modifier combos start recording on the first keypress.
</Tip>

Your speech appears in the prompt as you speak, dimmed until the transcript is finalized. Release `Space` to stop recording and finalize the text. The transcript is inserted at your cursor position and the cursor stays at the end of the inserted text, so you can mix typing and dictation in any order. Hold `Space` again to append another recording, or move the cursor first to insert speech elsewhere in the prompt:

```
> refactor the auth middleware to ▮
  # hold Space, speak "use the new token validation helper"
> refactor the auth middleware to use the new token validation helper▮
```

By default, releasing the key inserts the transcript and waits for you to press `Enter`. Set `"autoSubmit": true` in the `voice` settings object to send the prompt automatically when you release the key, as long as the transcript is at least three words long.

## Tap to record and send

Tap mode toggles recording with a single keypress: tap once to start, speak, then tap again to send the prompt. There is no warmup, and you do not need to keep the key held.

Enable tap mode with `/voice tap`. With the prompt input empty, tap `Space` to start recording. The footer shows a live waveform while recording. Tap `Space` again to stop. Claude Code inserts the transcript and submits the prompt automatically when the transcript is at least three words long. Shorter transcripts are inserted but not submitted, so an accidental tap does not send a stray word.

The first tap only starts recording when the prompt input is empty, so you can still type spaces normally while composing a message. The second tap stops recording regardless of input contents. Recording also stops automatically after 15 seconds of silence or two minutes total.

## Change the dictation language

Voice dictation uses the same [`language` setting](/docs/en/settings) that controls Claude's response language. If that setting is empty, dictation defaults to English. In the VS Code extension, if `language` is empty, dictation uses VS Code's `accessibility.voice.speechLanguage` setting before defaulting to English.

<Accordion title="Supported dictation languages">
  | Language   | Code |
  | :--------- | :--- |
  | Czech      | `cs` |
  | Danish     | `da` |
  | Dutch      | `nl` |
  | English    | `en` |
  | French     | `fr` |
  | German     | `de` |
  | Greek      | `el` |
  | Hindi      | `hi` |
  | Indonesian | `id` |
  | Italian    | `it` |
  | Japanese   | `ja` |
  | Korean     | `ko` |
  | Norwegian  | `no` |
  | Polish     | `pl` |
  | Portuguese | `pt` |
  | Russian    | `ru` |
  | Spanish    | `es` |
  | Swedish    | `sv` |
  | Turkish    | `tr` |
  | Ukrainian  | `uk` |
</Accordion>

Set the language in `/config` or directly in settings. You can use either the [BCP 47 language code](https://en.wikipedia.org/wiki/IETF_language_tag) or the language name:

```json theme={null}
{
  "language": "japanese"
}
```

If your `language` setting is not in the supported list, `/voice` warns you on enable and falls back to English for dictation. Claude's text responses are not affected by this fallback.

## Rebind the dictation key

The dictation key is bound to `voice:pushToTalk` in the `Chat` context and defaults to `Space`. The same binding controls both hold and tap modes. Rebind it in [`~/.claude/keybindings.json`](/docs/en/keybindings):

```json theme={null}
{
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "meta+k": "voice:pushToTalk",
        "space": null
      }
    }
  ]
}
```

The `voice:pushToTalk` action uses one key at a time. When you bind a custom key, it replaces the default `Space` binding rather than adding a second trigger, so the `"space": null` line in this example is for clarity and can be omitted without changing behavior.

In hold mode, avoid binding a bare letter key like `v` since hold detection relies on key-repeat and the letter types into the prompt during warmup. Use `Space`, or use a modifier combination like `meta+k` to start recording on the first keypress with no warmup. Tap mode has no warmup, so most keys work.

Some keys are not delivered to terminal applications and cannot be bound at all. For example, `Caps Lock` shows an error if you try to bind it. See [customize keyboard shortcuts](/docs/en/keybindings) for the full keybinding syntax and the list of reserved shortcuts.

## Troubleshooting

Common issues when voice dictation does not activate or record:

* **`Voice mode requires a Claude.ai account`**: you are authenticated with an API key or a third-party provider. Run `/login` to sign in with a Claude.ai account.
* **`Microphone access is denied`**: grant microphone permission to your terminal in system settings. On macOS, go to System Settings → Privacy & Security → Microphone and enable your terminal app, then run `/voice` again. On Windows, go to Settings → Privacy & security → Microphone and turn on microphone access for desktop apps, then run `/voice` again. If your terminal isn't listed in the macOS settings, see [Terminal not listed in macOS Microphone settings](#terminal-not-listed-in-macos-microphone-settings).
* **`No audio recording tool found` on Linux**: the native audio module could not load and no fallback is installed. Install SoX with the command shown in the error message, for example `sudo apt-get install sox`.
* **`Voice mode could not find a working audio recorder in WSL`**: WSLg routes audio through PulseAudio rather than an ALSA device, so SoX needs its PulseAudio backend installed explicitly. Run `sudo apt install sox libsox-fmt-pulse`. Installing `sox` alone pulls in the ALSA backend, which cannot record on WSL because there is no `/dev/snd` device.
* **`Voice input is failing repeatedly and has been paused`**: voice dictation hit several start-up failures in a row and stopped attempting new sessions until one succeeds. This usually means the microphone or audio stack on this host can't capture audio, for example a headless server, a remote shell with no audio passthrough, or a denied microphone permission. Confirm a working input device, fix the underlying cause from the entries above, then trigger voice again.
* **Nothing happens when holding `Space` in hold mode**: watch the prompt input while you hold. If spaces keep accumulating, voice dictation is likely off; run `/voice hold` to enable it. If only one or two spaces appear and then nothing, voice dictation is on but hold detection is not triggering. Hold detection requires your terminal to send key-repeat events, so it cannot detect a held key if key-repeat is disabled at the OS level. Switch to tap mode with `/voice tap` to avoid the key-repeat requirement.
* **Tapping `Space` types a space instead of recording in tap mode**: the first tap only starts recording when the prompt input is empty. Clear the input first, or check that you are in tap mode by running `/voice tap`.
* **`No audio detected from microphone`**: recording started but captured silence. Confirm the correct input device is set as the system default and that its input level is not muted or near zero. On Windows, open Settings → System → Sound → Input and select your microphone. On macOS, open System Settings → Sound → Input.
* **`No speech detected`**: audio reached the transcription service but no words were recognized. Speak closer to the microphone, reduce background noise, and confirm your [dictation language](#change-the-dictation-language) matches the language you are speaking.
* **Transcription is garbled or in the wrong language**: dictation defaults to English. If you are dictating in another language, set it in `/config` first. See [Change the dictation language](#change-the-dictation-language).

### Terminal not listed in macOS Microphone settings

If your terminal app does not appear under System Settings → Privacy & Security → Microphone, there is no toggle you can enable. Reset the permission state for your terminal so the next `/voice` run triggers a fresh macOS permission prompt.

<Steps>
  <Step title="Reset the microphone permission for your terminal">
    Run `tccutil reset Microphone <bundle-id>`, replacing `<bundle-id>` with your terminal's identifier: `com.apple.Terminal` for the built-in Terminal, or `com.googlecode.iterm2` for iTerm2. For other terminals, look up the identifier with `osascript -e 'id of app "AppName"'`.

    <Warning>
      You can run `tccutil reset Microphone` without a bundle ID, but it revokes microphone access from every app on your Mac, including apps like Zoom or Slack. Each app will need to re-request access on next use, so don't run it during an active call.
    </Warning>
  </Step>

  <Step title="Quit and relaunch your terminal">
    macOS won't re-prompt a process that is already running. Quit the terminal app with Cmd+Q, not just close its windows, then open it again.
  </Step>

  <Step title="Trigger a fresh prompt">
    Start Claude Code and run `/voice`. macOS prompts for microphone access; allow it.
  </Step>
</Steps>

## See also

* [Customize keyboard shortcuts](/docs/en/keybindings): rebind `voice:pushToTalk` and other CLI keyboard actions
* [Configure settings](/docs/en/settings): full reference for `voice`, `language`, and other settings keys
* [Interactive mode](/docs/en/interactive-mode): keyboard shortcuts, input modes, and session controls
* [Commands](/docs/en/commands): reference for `/voice`, `/config`, and all other commands


---

## Let Claude use your computer from the CLI

`https://code.claude.com/docs/en/computer-use`

Enable computer use in the Claude Code CLI so Claude can open apps, click, type, and see your screen on macOS. Test native apps, debug visual issues, and automate GUI-only tools without leaving your terminal.

<Note>
  Computer use is a research preview on macOS that requires a Pro or Max plan. It is not available on Team or Enterprise plans. It requires Claude Code v2.1.85 or later and an interactive session, so it is not available in non-interactive mode with the `-p` flag.
</Note>

Computer use lets Claude open apps, control your screen, and work on your machine the way you would. From the CLI, Claude can compile a Swift app, launch it, click through every button, and screenshot the result, all in the same conversation where it wrote the code.

This page covers how computer use works in the CLI. For the Desktop app on macOS or Windows, see [computer use in Desktop](/docs/en/desktop#let-claude-use-your-computer).

## What you can do with computer use

Computer use handles tasks that require a GUI: anything you'd normally have to leave the terminal and do by hand.

* **Build and validate native apps**: ask Claude to build a macOS menu bar app. Claude writes the Swift, compiles it, launches it, and clicks through every control to verify it works before you ever open it.
* **End-to-end UI testing**: point Claude at a local Electron app and say "test the onboarding flow." Claude opens the app, clicks through signup, and screenshots each step. No Playwright config, no test harness.
* **Debug visual and layout issues**: tell Claude "the modal is clipping on small windows." Claude resizes the window, reproduces the bug, screenshots it, patches the CSS, and verifies the fix. Claude sees what you see.
* **Drive GUI-only tools**: interact with design tools, hardware control panels, the iOS Simulator, or proprietary apps that have no CLI or API.

## When computer use applies

Claude has several ways to interact with an app or service. Computer use is the broadest and slowest, so Claude tries the most precise tool first:

* If you have an [MCP server](/docs/en/mcp) for the service, Claude uses that.
* If the task is a shell command, Claude uses Bash.
* If the task is browser work and you have [Claude in Chrome](/docs/en/chrome) set up, Claude uses that.
* If none of those apply, Claude uses computer use.

Screen control is reserved for things nothing else can reach: native apps, simulators, and tools without an API.

## Enable computer use

Computer use is available as a built-in MCP server called `computer-use`. It's off by default until you enable it.

<Steps>
  <Step title="Open the MCP menu">
    In an interactive Claude Code session, run:

    ```text theme={null}
    /mcp
    ```

    Find `computer-use` in the server list. It shows as disabled.
  </Step>

  <Step title="Enable the server">
    Select `computer-use` and choose **Enable**. The setting persists per project, so you only do this once for each project where you want computer use.
  </Step>

  <Step title="Grant macOS permissions">
    The first time Claude tries to use your computer, you'll see a prompt to grant two macOS permissions:

    * **Accessibility**: lets Claude click, type, and scroll
    * **Screen Recording**: lets Claude see what's on your screen

    The prompt includes links to open the relevant System Settings pane. Grant both, then select **Try again** in the prompt. macOS may require you to restart Claude Code after granting Screen Recording.
  </Step>
</Steps>

After setup, ask Claude to do something that needs the GUI:

```text theme={null}
Build the app target, launch it, and click through each tab to make
sure nothing crashes. Screenshot any error states you find.
```

## Approve apps per session

Enabling the `computer-use` server doesn't grant Claude access to every app on your machine. The first time Claude needs a specific app in a session, a prompt appears in your terminal showing:

* Which apps Claude wants to control
* Any extra permissions requested, such as clipboard access
* How many other apps will be hidden while Claude works

Choose **Allow for this session** or **Deny**. Approvals last for the current session. You can approve multiple apps at once when Claude requests them together.

Apps with broad reach show an extra warning in the prompt so you know what approving them grants:

| Warning                    | Applies to                                                   |
| :------------------------- | :----------------------------------------------------------- |
| Equivalent to shell access | Terminal, iTerm, VS Code, Warp, and other terminals and IDEs |
| Can read or write any file | Finder                                                       |
| Can change system settings | System Settings                                              |

These apps aren't blocked. The warning lets you decide whether the task warrants that level of access.

Claude's level of control also varies by app category: browsers and trading platforms are view-only, terminals and IDEs are click-only, and everything else gets full control. See [app permissions in Desktop](/docs/en/desktop#app-permissions) for the complete tier breakdown.

## How Claude works on your screen

Understanding the flow helps you anticipate what Claude will do and how to intervene.

### One session at a time

Computer use holds a machine-wide lock while active. If another Claude Code session is already using your computer, new attempts fail with a message telling you which session holds the lock. Finish or exit that session first.

### Apps are hidden while Claude works

When Claude starts controlling your screen, other visible apps are hidden so Claude interacts with only the approved apps. Your terminal window stays visible and is excluded from screenshots, so you can watch the session and Claude never sees its own output.

When Claude finishes the turn, hidden apps are restored automatically.

### Screenshots are downscaled automatically

Claude Code downscales every screenshot before sending it to the model. You don't need to lower your display resolution or resize windows on Retina or other high-resolution displays. A 16-inch MacBook Pro at native Retina resolution captures at 3456×2234 and downscales to roughly 1372×887, preserving aspect ratio.

There is no setting to change the target size. If on-screen text or controls are too small for Claude to read after downscaling, increase their size in the app rather than changing your display resolution.

### Stop at any time

When Claude acquires the lock, a macOS notification appears: "Claude is using your computer · press Esc to stop." Press `Esc` anywhere to abort the current action immediately, or press `Ctrl+C` in the terminal. Either way, Claude releases the lock, unhides your apps, and returns control to you.

A second notification appears when Claude is done.

## Safety and the trust boundary

<Warning>
  Unlike the [sandboxed Bash tool](/docs/en/sandboxing), computer use runs on your actual desktop with access to the apps you approve. Claude checks each action and flags potential prompt injection from on-screen content, but the trust boundary is different. See the [computer use safety guide](https://support.claude.com/en/articles/14128542) for best practices.
</Warning>

The built-in guardrails reduce risk without requiring configuration:

* **Per-app approval**: Claude can only control apps you've approved in the current session.
* **Sentinel warnings**: apps that grant shell, filesystem, or system settings access are flagged before you approve.
* **Terminal excluded from screenshots**: Claude never sees your terminal window, so on-screen prompts in your session can't feed back into the model.
* **Global escape**: the `Esc` key aborts computer use from anywhere, and the key press is consumed so prompt injection can't use it to dismiss dialogs.
* **Lock file**: only one session can control your machine at a time.

## Example workflows

These examples show common ways to combine computer use with coding tasks.

### Validate a native build

After making changes to a macOS or iOS app, have Claude compile and verify in one pass:

```text theme={null}
Build the MenuBarStats target, launch it, open the preferences window,
and verify the interval slider updates the label. Screenshot the
preferences window when you're done.
```

Claude runs `xcodebuild`, launches the app, interacts with the UI, and reports what it finds.

### Reproduce a layout bug

When a visual bug only appears at certain window sizes, let Claude find it:

```text theme={null}
The settings modal clips its footer on narrow windows. Resize the app
window down until you can reproduce it, screenshot the clipped state,
then check the CSS for the modal container.
```

Claude resizes the window, captures the broken state, and reads the relevant stylesheets.

### Test a simulator flow

Drive the iOS Simulator without writing XCTest:

```text theme={null}
Open the iOS Simulator, launch the app, tap through the onboarding
screens, and tell me if any screen takes more than a second to load.
```

Claude controls the simulator the same way you would with a mouse.

## Differences from the Desktop app

The CLI and Desktop surfaces share the same computer use engine, with a few differences:

| Feature              | Desktop                                                  | CLI                             |
| :------------------- | :------------------------------------------------------- | :------------------------------ |
| Platforms            | macOS and Windows                                        | macOS only                      |
| Enable               | Toggle in **Settings > General** (under **Desktop app**) | Enable `computer-use` in `/mcp` |
| Denied apps list     | Configurable in Settings                                 | Not yet available               |
| Auto-unhide toggle   | Optional                                                 | Always on                       |
| Dispatch integration | Dispatch-spawned sessions can use computer use           | Not applicable                  |

## Troubleshooting

### "Computer use is in use by another Claude session"

Another Claude Code session holds the lock. Finish the task in that session or exit it. If the other session crashed, the lock is released automatically when Claude detects the process is no longer running.

### macOS permissions prompt keeps reappearing

macOS sometimes requires a restart of the requesting process after you grant Screen Recording. Quit Claude Code completely and start a new session. If the prompt persists, open **System Settings > Privacy & Security > Screen Recording** and confirm your terminal app is listed and enabled.

### `computer-use` doesn't appear in `/mcp`

The server only appears on eligible setups. Check that:

* You're on macOS. Computer use in the CLI is not available on Linux or Windows. On Windows, use [computer use in Desktop](/docs/en/desktop#let-claude-use-your-computer) instead.
* You're running Claude Code v2.1.85 or later. Run `claude --version` to check.
* You're on a Pro or Max plan. Run `/status` to confirm your subscription.
* You're authenticated through claude.ai. Computer use is not available with third-party providers like Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry. If you access Claude exclusively through a third-party provider, you need a separate claude.ai account to use this feature.
* You're in an interactive session. Computer use is not available in non-interactive mode with the `-p` flag.

## See also

* [Computer use in Desktop](/docs/en/desktop#let-claude-use-your-computer): the same capability with a graphical settings page
* [Claude in Chrome](/docs/en/chrome): browser automation for web-based tasks
* [MCP](/docs/en/mcp): connect Claude to structured tools and APIs
* [Sandboxing](/docs/en/sandboxing): how Claude's Bash tool isolates filesystem and network access
* [Computer use safety guide](https://support.claude.com/en/articles/14128542): best practices for safe computer use


---

## Continue local sessions from any device with Remote Control

`https://code.claude.com/docs/en/remote-control`

Continue a local Claude Code session from your phone, tablet, or any browser using Remote Control. Works with claude.ai/code and the Claude mobile app.

<Note>
  Remote Control is in research preview and available on all plans. On Team and Enterprise, it is off by default until an admin enables the Remote Control toggle in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code).
</Note>

Remote Control connects [claude.ai/code](https://claude.ai/code) or the Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) and [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude) to a Claude Code session running on your machine. Start a task at your desk, then pick it up from your phone on the couch or a browser on another computer.

When you start a Remote Control session on your machine, Claude keeps running locally the entire time, so nothing moves to the cloud. With Remote Control you can:

* **Use your full local environment remotely**: your filesystem, [MCP servers](/docs/en/mcp), tools, and project configuration all stay available, and typing `@` autocompletes file paths from your local project
* **Work from both surfaces at once**: the conversation stays in sync across all connected devices, so you can send messages from your terminal, browser, and phone interchangeably
* **Survive interruptions**: if your laptop sleeps or your network drops, the session reconnects automatically when your machine comes back online

Unlike [Claude Code on the web](/docs/en/claude-code-on-the-web), which runs on cloud infrastructure, Remote Control sessions run directly on your machine and interact with your local filesystem. The web and mobile interfaces are just a window into that local session.

<Note>
  Remote Control requires Claude Code v2.1.51 or later. Check your version with `claude --version`.
</Note>

This page covers setup, how to start and connect to sessions, and how Remote Control compares to Claude Code on the web.

## Requirements

Before using Remote Control, confirm that your environment meets these conditions:

* **Subscription**: available on Pro, Max, Team, and Enterprise plans. API keys are not supported. On Team and Enterprise, an admin must first enable the Remote Control toggle in [Claude Code admin settings](https://claude.ai/admin-settings/claude-code).
* **Authentication**: run `claude` and use `/login` to sign in through claude.ai if you haven't already.
* **Workspace trust**: run `claude` in your project directory at least once to accept the workspace trust dialog.

## Start a Remote Control session

You can start a Remote Control session from the CLI or the VS Code extension. The CLI offers three invocation modes; VS Code uses the `/remote-control` command.

<Tabs>
  <Tab title="Server mode">
    Navigate to your project directory and run:

    ```bash theme={null}
    claude remote-control
    ```

    The process stays running in your terminal in server mode, waiting for remote connections. It displays a session URL you can use to [connect from another device](#connect-from-another-device), and you can press spacebar to show a QR code for quick access from your phone. While a remote session is active, the terminal shows connection status and tool activity.

    Available flags:

    | Flag                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
    | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `--name "My Project"`                           | Set a custom session title visible in the session list at claude.ai/code.                                                                                                                                                                                                                                                                                                                                                                                                          |
    | `--remote-control-session-name-prefix <prefix>` | Prefix for auto-generated session names when no explicit name is set. Defaults to your machine's hostname, producing names like `myhost-graceful-unicorn`. Set `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX` for the same effect.                                                                                                                                                                                                                                                    |
    | `--spawn <mode>`                                | How the server creates sessions.<br />• `same-dir` (default): all sessions share the current working directory, so they can conflict if editing the same files.<br />• `worktree`: each on-demand session gets its own [git worktree](/docs/en/worktrees). Requires a git repository.<br />• `session`: single-session mode. Serves exactly one session and rejects additional connections. Set at startup only.<br />Press `w` at runtime to toggle between `same-dir` and `worktree`. |
    | `--capacity <N>`                                | Maximum number of concurrent sessions. Default is 32. Cannot be used with `--spawn=session`.                                                                                                                                                                                                                                                                                                                                                                                       |
    | `--verbose`                                     | Show detailed connection and session logs.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
    | `--sandbox` / `--no-sandbox`                    | Enable or disable [sandboxing](/docs/en/sandboxing) for filesystem and network isolation. Off by default.                                                                                                                                                                                                                                                                                                                                                                               |
  </Tab>

  <Tab title="Interactive session">
    To start a normal interactive Claude Code session with Remote Control enabled, use the `--remote-control` flag (or `--rc`):

    ```bash theme={null}
    claude --remote-control
    ```

    Optionally pass a name for the session:

    ```bash theme={null}
    claude --remote-control "My Project"
    ```

    This gives you a full interactive session in your terminal that you can also control from claude.ai or the Claude app. Unlike `claude remote-control` (server mode), you can type messages locally while the session is also available remotely.
  </Tab>

  <Tab title="From an existing session">
    If you're already in a Claude Code session and want to continue it remotely, use the `/remote-control` (or `/rc`) command:

    ```text theme={null}
    /remote-control
    ```

    Pass a name as an argument to set a custom session title:

    ```text theme={null}
    /remote-control My Project
    ```

    This starts a Remote Control session that carries over your current conversation history and displays a session URL and QR code you can use to [connect from another device](#connect-from-another-device). The `--verbose`, `--sandbox`, and `--no-sandbox` flags are not available with this command.
  </Tab>

  <Tab title="VS Code">
    In the [Claude Code VS Code extension](/docs/en/vs-code), type `/remote-control` or `/rc` in the prompt box, or open the command menu with `/` and select it. Requires Claude Code v2.1.79 or later.

    ```text theme={null}
    /remote-control
    ```

    A banner appears above the prompt box showing connection status. Once connected, click **Open in browser** in the banner to go directly to the session, or find it in the session list at [claude.ai/code](https://claude.ai/code). The session URL is also posted in the conversation.

    To disconnect, click the close icon on the banner or run `/remote-control` again.

    Unlike the CLI, the VS Code command does not accept a name argument or display a QR code. The session title is derived from your conversation history or first prompt.
  </Tab>
</Tabs>

### Connect from another device

Once a Remote Control session is active, you have a few ways to connect from another device:

* **Open the session URL** in any browser to go directly to the session on [claude.ai/code](https://claude.ai/code).
* **Scan the QR code** shown alongside the session URL to open it directly in the Claude app. With `claude remote-control`, press spacebar to toggle the QR code display.
* **Open [claude.ai/code](https://claude.ai/code) or the Claude app** and find the session by name in the session list. In the Claude mobile app, tap **Code** in the navigation to reach the session list. Remote Control sessions show a computer icon with a green status dot when online.

The remote session title is chosen in this order:

1. The name you passed to `--name`, `--remote-control`, or `/remote-control`
2. The title you set with `/rename`
3. The last meaningful message in existing conversation history
4. An auto-generated name like `myhost-graceful-unicorn`, where `myhost` is your machine's hostname or the prefix you set with `--remote-control-session-name-prefix`

If you didn't set an explicit name, the title updates to reflect your prompt once you send one. Renaming a session from claude.ai or the Claude app also updates the local title shown in `claude --resume`.

If the environment already has an active session, you'll be asked whether to continue it or start a new one.

If you don't have the Claude app yet, use the `/mobile` command inside Claude Code to display a download QR code for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) or [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude).

### Enable Remote Control for all sessions

By default, Remote Control only activates when you explicitly run `claude remote-control`, `claude --remote-control`, or `/remote-control`. To enable it automatically for every interactive session, run `/config` inside Claude Code and set **Enable Remote Control for all sessions** to `true`. Set it back to `false` to disable. In the Desktop app, you can also toggle this from **Settings → Claude Code → Enable remote control by default**.

With this setting on, each interactive Claude Code process registers one remote session. If you run multiple instances, each one gets its own environment and session. To run multiple concurrent sessions from a single process, use [server mode](#start-a-remote-control-session) instead.

## Connection and security

Your local Claude Code session makes outbound HTTPS requests only and never opens inbound ports on your machine. When you start Remote Control, it registers with the Anthropic API and polls for work. When you connect from another device, the server routes messages between the web or mobile client and your local session over a streaming connection.

All traffic travels through the Anthropic API over TLS, the same transport security as any Claude Code session. The connection uses multiple short-lived credentials, each scoped to a single purpose and expiring independently.

## Remote Control vs Claude Code on the web

Remote Control and [Claude Code on the web](/docs/en/claude-code-on-the-web) both use the claude.ai/code interface. The key difference is where the session runs: Remote Control executes on your machine, so your local MCP servers, tools, and project configuration stay available. Claude Code on the web executes in Anthropic-managed cloud infrastructure.

Use Remote Control when you're in the middle of local work and want to keep going from another device. Use Claude Code on the web when you want to kick off a task without any local setup, work on a repo you don't have cloned, or run multiple tasks in parallel.

## Mobile push notifications

When Remote Control is active, Claude can send push notifications to your phone.

Claude decides when to push. It typically sends one when a long-running task finishes or when it needs a decision from you to continue. You can also request a push in your prompt, for example `notify me when the tests finish`. Beyond the on/off toggle below, there is no per-event configuration.

<Note>
  Mobile push notifications require Claude Code v2.1.110 or later.
</Note>

To set up mobile push notifications:

<Steps>
  <Step title="Install the Claude mobile app">
    Download the Claude app for [iOS](https://apps.apple.com/us/app/claude-by-anthropic/id6473753684) or [Android](https://play.google.com/store/apps/details?id=com.anthropic.claude).
  </Step>

  <Step title="Sign in with your Claude Code account">
    Use the same account and organization you use for Claude Code in the terminal.
  </Step>

  <Step title="Allow notifications">
    Accept the notification permission prompt from the operating system.
  </Step>

  <Step title="Enable push in Claude Code">
    In your terminal, run `/config` and enable **Push when Claude decides**.
  </Step>
</Steps>

If notifications don't arrive:

* If `/config` shows **No mobile registered**, open the Claude app on your phone so it can refresh its push token. The warning clears the next time Remote Control connects.
* On iOS, Focus modes and notification summaries can suppress or delay pushes. Check Settings → Notifications → Claude.
* On Android, aggressive battery optimization can delay delivery. Exempt the Claude app from battery optimization in system settings.

## Limitations

* **One remote session per interactive process**: outside of server mode, each Claude Code instance supports one remote session at a time. Use [server mode](#start-a-remote-control-session) to run multiple concurrent sessions from a single process.
* **Local process must keep running**: Remote Control runs as a local process. If you close the terminal, quit VS Code, or otherwise stop the `claude` process, the session ends.
* **Extended network outage**: if your machine is awake but unable to reach the network for more than roughly 10 minutes, the session times out and the process exits. Run `claude remote-control` again to start a new session.
* **Ultraplan disconnects Remote Control**: starting an [ultraplan](/docs/en/ultraplan) session disconnects any active Remote Control session because both features occupy the claude.ai/code interface and only one can be connected at a time.
* **Some commands are local-only**: commands that open an interactive picker in the terminal, such as `/mcp`, `/plugin`, or `/resume`, work only from the local CLI. Commands that produce text output, including `/compact`, `/clear`, `/context`, `/usage`, `/exit`, `/usage-credits`, `/recap`, and `/reload-plugins`, work from mobile and web.

## Troubleshooting

### "Remote Control requires a claude.ai subscription"

You're not authenticated with a claude.ai account. Run `claude auth login` and choose the claude.ai option. If `ANTHROPIC_API_KEY` is set in your environment, unset it first.

### "Remote Control requires a full-scope login token"

You're authenticated with a long-lived token from `claude setup-token` or the `CLAUDE_CODE_OAUTH_TOKEN` environment variable. These tokens are limited to inference-only and cannot establish Remote Control sessions. Run `claude auth login` to authenticate with a full-scope session token instead.

### "Unable to determine your organization for Remote Control eligibility"

Your cached account information is stale or incomplete. Run `claude auth login` to refresh it.

### "Remote Control is not yet enabled for your account"

The eligibility check can fail with certain environment variables present:

* `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` or `DISABLE_TELEMETRY`: unset them and try again.
* `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, or `CLAUDE_CODE_USE_FOUNDRY`: Remote Control requires claude.ai authentication and does not work with third-party providers.

If none of these are set, run `/logout` then `/login` to refresh.

### "Remote Control is disabled by your organization's policy"

This error has four distinct causes. Run `/status` first to see which login method and subscription you're using.

* **You're authenticated with an API key or Console account**: Remote Control requires claude.ai OAuth. Run `/login` and choose the claude.ai option. If `ANTHROPIC_API_KEY` is set in your environment, unset it.
* **Your Team or Enterprise admin hasn't enabled it**: Remote Control is off by default on these plans. An admin can enable it at [claude.ai/admin-settings/claude-code](https://claude.ai/admin-settings/claude-code) by turning on the **Remote Control** toggle. This toggle is a server-side organization setting.
* **The admin toggle is grayed out**: your organization has a data retention or compliance configuration that is incompatible with Remote Control. This cannot be changed from the admin panel. Contact Anthropic support to discuss options.
* **The error mentions `disableRemoteControl`**: your IT administrator has disabled Remote Control on this device through [managed settings](/docs/en/settings#settings-files), independent of the organization-wide toggle.

### "Remote credentials fetch failed"

Claude Code could not obtain a short-lived credential from the Anthropic API to establish the connection. Re-run with `--verbose` to see the full error:

```bash theme={null}
claude remote-control --verbose
```

Common causes:

* Not signed in: run `claude` and use `/login` to authenticate with your claude.ai account. API key authentication is not supported for Remote Control.
* Network or proxy issue: a firewall or proxy may be blocking the outbound HTTPS request. Remote Control requires access to the Anthropic API on port 443.
* Session creation failed: if you also see `Session creation failed — see debug log`, the failure happened earlier in setup. Check that your subscription is active.

## Choose the right approach

Claude Code offers several ways to work when you're not at your terminal. They differ in what triggers the work, where Claude runs, and how much you need to set up.

|                                                | Trigger                                                                                        | Claude runs on                                                                               | Setup                                                                                                                                | Best for                                                      |
| :--------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| [Dispatch](/docs/en/desktop#sessions-from-dispatch) | Message a task from the Claude mobile app                                                      | Your machine (Desktop)                                                                       | [Pair the mobile app with Desktop](https://support.claude.com/en/articles/13947068)                                                  | Delegating work while you're away, minimal setup              |
| [Remote Control](/docs/en/remote-control)           | Drive a running session from [claude.ai/code](https://claude.ai/code) or the Claude mobile app | Your machine (CLI or VS Code)                                                                | Run `claude remote-control`                                                                                                          | Steering in-progress work from another device                 |
| [Channels](/docs/en/channels)                       | Push events from a chat app like Telegram or Discord, or your own server                       | Your machine (CLI)                                                                           | [Install a channel plugin](/docs/en/channels#quickstart) or [build your own](/docs/en/channels-reference)                                      | Reacting to external events like CI failures or chat messages |
| [Slack](/docs/en/slack)                             | Mention `@Claude` in a team channel                                                            | Anthropic cloud                                                                              | [Install the Slack app](/docs/en/slack#setting-up-claude-code-in-slack) with [Claude Code on the web](/docs/en/claude-code-on-the-web) enabled | PRs and reviews from team chat                                |
| [Scheduled tasks](/docs/en/scheduled-tasks)         | Set a schedule                                                                                 | [CLI](/docs/en/scheduled-tasks), [Desktop](/docs/en/desktop-scheduled-tasks), or [cloud](/docs/en/routines) | Pick a frequency                                                                                                                     | Recurring automation like daily reviews                       |

## Related resources

* [Claude Code on the web](/docs/en/claude-code-on-the-web): run sessions in Anthropic-managed cloud environments instead of on your machine
* [Ultraplan](/docs/en/ultraplan): launch a cloud planning session from your terminal and review the plan in your browser
* [Channels](/docs/en/channels): forward Telegram, Discord, or iMessage into a session so Claude reacts to messages while you're away
* [Dispatch](/docs/en/desktop#sessions-from-dispatch): message a task from your phone and it can spawn a Desktop session to handle it
* [Authentication](/docs/en/authentication): set up `/login` and manage credentials for claude.ai
* [CLI reference](/docs/en/cli-reference): full list of flags and commands including `claude remote-control`
* [Security](/docs/en/security): how Remote Control sessions fit into the Claude Code security model
* [Data usage](/docs/en/data-usage): what data flows through the Anthropic API during local and remote sessions


---

## How Claude Code uses prompt caching

`https://code.claude.com/docs/en/prompt-caching`

Claude Code manages prompt caching automatically. See why a model switch triggers a slow uncached turn, what `/compact` costs, why CLAUDE.md edits don't apply mid-session, and how to check your cache hit rate.

Prompt caching makes Claude Code faster and more cost-efficient. Without caching, the API would reprocess your full history on every turn. With caching, it reuses what it already processed and only does new work for what changed.

Claude Code handles prompt caching for you, unless you [disable it](#disable-prompt-caching). It is still useful to know how prompt caching works, because some actions invalidate the cache and make the next response slower and more expensive while it rebuilds. This page covers which actions those are, why some settings wait for a restart to apply, and how to check cache performance when usage looks high.

## How the cache is organized

Each time you send a message in Claude Code, it makes a new API request. The model doesn't remember anything between requests, so Claude Code re-sends the full context: the system prompt, your project context, every prior message and tool result, and your new message. New content is appended at the end, which means most of each request is identical to the one before it. Prompt caching is how the API avoids reprocessing the part that didn't change.

The API caches by matching the start of each request, called the prefix, against content it recently processed. On a normal turn, the prefix is the entire previous request and only the latest exchange is new. The match is exact, so a change anywhere in the prefix recomputes everything after it. There is no per-file or per-segment caching. See [how prompt caching works](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#how-prompt-caching-works) in the API reference for the underlying mechanism.

<img alt="Four turns shown as growing horizontal bars. Each turn's request contains everything from the previous turn plus the latest exchange appended at the end. On turns two and three, the unchanged prefix is read from cache and only the new exchange is processed. On turn four, the system prompt changed, so the prefix no longer matches and the entire request is reprocessed and written." />

<img alt="Four turns shown as growing horizontal bars. Each turn's request contains everything from the previous turn plus the latest exchange appended at the end. On turns two and three, the unchanged prefix is read from cache and only the new exchange is processed. On turn four, the system prompt changed, so the prefix no longer matches and the entire request is reprocessed and written." />

To get the most out of prefix matching, Claude Code orders each request so content that rarely changes between turns comes first:

| Layer           | Content                                           | Changes when                                                      |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| System prompt   | Core instructions, tool definitions, output style | An MCP server connects or disconnects, or Claude Code is upgraded |
| Project context | CLAUDE.md, auto memory, unscoped rules            | Session starts, or after `/clear` or `/compact`                   |
| Conversation    | Your messages, Claude's responses, tool results   | Every turn                                                        |

A change to the conversation layer leaves the system prompt and project context cached. A change to the system prompt invalidates everything, because all later content now sits behind a different prefix. The third column gives common triggers rather than an exhaustive list, and the sections below cover the full set, including content such as output style that is fixed at session start.

The prefix-match rule explains most of the behaviors on this page. [Plan mode](/docs/en/permission-modes#analyze-before-you-edit-with-plan-mode) and [skill loading](/docs/en/skills), for example, append their instructions as conversation messages, so the cached prefix stays intact.

Two settings aren't part of the prompt text at all, so they don't appear in the layer table, but both are part of the cache key:

* **Model**: each model has its own cache. Switching models recomputes the entire request even when the content is identical. See [Switching models](#switching-models) below.
* **Effort level**: each effort level has its own cache for the same model. Changing it mid-session recomputes the entire request, and Claude Code asks you to confirm before applying the change. See [Changing effort level](#changing-effort-level) below.

<Tip>
  Pick your model, effort level, and MCP servers at the top of a session, then save `/compact` for natural breaks between tasks. The fewer changes you make mid-task, the higher your cache hit rate.
</Tip>

### Where the cache lives

Caching happens server-side, in whichever infrastructure serves your model. Where that is depends on how you authenticate:

* **API key, Claude subscription, or [Claude Platform on AWS](/docs/en/claude-platform-on-aws)**: the cache lives in Anthropic's infrastructure, accessed through the [Claude API](https://platform.claude.com/docs)
* **Bedrock or Vertex AI**: the cache lives in your cloud provider's serving infrastructure
* **Foundry**: requests route to Anthropic's infrastructure
* **Custom `ANTHROPIC_BASE_URL` or [LLM gateway](/docs/en/llm-gateway)**: the cache lives wherever your requests are forwarded, and whether caching works depends on the gateway

For what each provider stores and processes, see [data usage](/docs/en/data-usage). Wherever the cache lives, entries expire after a period of inactivity, and [Cache lifetime](#cache-lifetime) below covers the TTL and how to extend it.

## Actions that invalidate the cache

These actions cause the next request to miss part or all of the cache. You see a one-time slower, more expensive turn, after which the new prefix is cached. Most of them are avoidable mid-task once you know they have a cost. A model switch or an MCP reconnect can feel free until you notice the slower turn that follows.

* [Switching models](#switching-models)
* [Changing effort level](#changing-effort-level)
* [Connecting or disconnecting an MCP server](#connecting-or-disconnecting-an-mcp-server)
* [Denying an entire tool](#denying-an-entire-tool)
* [Compacting the conversation](#compacting-the-conversation)
* [Upgrading Claude Code](#upgrading-claude-code)

### Switching models

Each model has its own cache. Switching with [`/model`](/docs/en/model-config#setting-your-model) means the next request reads the entire conversation history with no cache hits, even though the content is identical.

The [`opusplan` model setting](/docs/en/model-config#opusplan-model-setting) resolves to Opus during plan mode and Sonnet during execution, so each plan-mode toggle is a model switch and starts a fresh cache.

### Changing effort level

The cache is keyed by [effort level](/docs/en/model-config#adjust-effort-level) as well as model, so switching with `/effort` means the next request reads the entire conversation history with no cache hits. Once a conversation has started, Claude Code shows a confirmation dialog before applying an effort change that would invalidate the cache. A change that resolves to the same level already in effect, such as setting the model's default explicitly, skips the dialog and keeps the cache.

### Connecting or disconnecting an MCP server

Tool definitions sit in the system prompt layer, so the cache invalidates when the set of MCP tools available to Claude changes between turns. The most common cause is an [MCP server](/docs/en/mcp) connecting or disconnecting mid-session, which can happen without any action on your part: a stdio server's process exits, an HTTP session expires, or a server [reconnects automatically after a transient failure](/docs/en/mcp#automatic-reconnection). A connected server can also push a [dynamic tool update](/docs/en/mcp#dynamic-tool-updates) that changes its tool list.

Editing your MCP config does not by itself change the cache. The new config takes effect only after a restart, which is when the server connects or disconnects.

[MCP tool search](/docs/en/mcp#scale-with-mcp-tool-search) reduces how much each tool contributes to the prefix by deferring full tool definitions, but the set of tool names still has to stay stable for the cache to remain valid.

### Denying an entire tool

Adding a bare tool name like `Bash` or `WebFetch` as a [deny rule](/docs/en/permissions#manage-permissions) removes that tool from Claude's context entirely. Tool definitions sit in the system prompt layer, so adding or removing one of these rules mid-session invalidates the cache the same way an MCP server connecting or disconnecting does. The change takes effect on the next turn whether you add it through `/permissions` or by [editing a settings file directly](/docs/en/settings#when-edits-take-effect).

Only a bare tool name, or the equivalent `Bash(*)` form, has this effect. Scoped deny rules like `Bash(rm *)`, and all allow and ask rules, don't change which tools Claude sees. Claude Code checks them when Claude attempts a call, leaving the prefix intact.

### Compacting the conversation

[Compaction](/docs/en/context-window#what-survives-compaction) replaces your message history with a summary. By design, this invalidates the conversation layer, since the next request has a new, shorter history that doesn't share a prefix with the old one. Claude Code reuses the system prompt layer and reloads project context from disk, which cache-hits only if CLAUDE.md and memory are unchanged since the session started.

To produce the summary, Claude Code sends a one-off request with the same system prompt, tools, and history as your conversation, plus a summarization instruction appended as a final user message. Because it shares your prefix, that request reads the existing cache rather than reprocessing the full history. Most of compaction's time goes to generating the summary, not to a cache miss. The turn that follows rebuilds the conversation cache only for the much shorter summary, so the post-compaction turn is not the slow part.

<Tip>
  Compaction works in your favor when the context you discard is content you no longer need. To choose when its overhead happens, run `/compact` at a natural break in your work, such as between tasks, instead of waiting for auto-compaction to trigger mid-task. If you've gone down a path you want to abandon entirely, [`/rewind`](#rewinding-the-conversation) to an earlier turn instead. Rewinding truncates back to a prefix that is already cached, rather than building a new one as compaction does.
</Tip>

### Upgrading Claude Code

A new Claude Code version typically updates the system prompt or tool definitions, so the first request after an upgrade rebuilds the cache from the top. [Auto-update](/docs/en/setup#auto-updates) downloads new versions in the background but applies them on the next launch, never mid-session, so you see this as an uncached first turn after restarting rather than a surprise during a session. Set `DISABLE_AUTOUPDATER=1` to control when upgrades apply.

<Note>
  [Resuming a session](/docs/en/sessions#resume-a-session) after an upgrade reprocesses the entire conversation history with no cache hits, since the history now sits behind a different system prompt. The cost scales with how long the resumed conversation is, so the first turn back into a long session can be the most expensive request you send.
</Note>

## Actions that keep the cache

These actions either append to the end of the conversation or don't touch the request at all. Some of them, such as editing CLAUDE.md or changing output style, are also why a setting change waits for a restart to apply.

* [Editing files in your repository](#editing-files-in-your-repository)
* [Editing CLAUDE.md mid-session](#editing-claude-md-mid-session)
* [Changing output style](#changing-output-style)
* [Changing permission mode](#changing-permission-mode)
* [Invoking skills and commands](#invoking-skills-and-commands)
* [Running `/recap`](#running-%2Frecap)
* [Rewinding the conversation](#rewinding-the-conversation)
* [Spawning a subagent](#subagents-and-the-cache)

### Editing files in your repository

File contents enter context only when Claude reads them, and reads append to the conversation. Editing a file Claude previously read does not retroactively change the earlier read in history. Instead, Claude Code appends a `<system-reminder>` noting the file changed, and Claude re-reads it if needed.

### Editing CLAUDE.md mid-session

Your project-root and user-level CLAUDE.md files are read once at session start and held in memory. Editing them mid-session does not invalidate the cache, but the edit also doesn't apply. Claude keeps working with the version that was loaded at session start. The new content loads on the next `/clear`, `/compact`, or restart.

[Nested CLAUDE.md files in subdirectories](/docs/en/memory) and [rules with `paths:` frontmatter](/docs/en/memory#path-specific-rules) load later, when Claude first reads a matching file. Editing one before it loads does take effect. After it loads, the content is part of the conversation history, so a mid-session edit doesn't retroactively change it.

### Changing output style

[Output style](/docs/en/output-styles) is part of the system prompt, which Claude Code reads once at session start. Changing it via `/config` or the `outputStyle` setting mid-session does not invalidate the cache, but the change also doesn't apply. Claude keeps using the style that was loaded at session start. The new style loads on the next `/clear` or restart.

### Changing permission mode

Switching between [permission modes](/docs/en/permission-modes), such as from default to accept edits, does not change the system prompt or tool definitions, so mode changes are cache-safe. The exception is plan mode with the [`opusplan`](/docs/en/model-config#opusplan-model-setting) model setting, which switches the model between Opus and Sonnet as you enter or leave plan mode. That makes the mode toggle a [model switch](#switching-models).

### Invoking skills and commands

[Skills](/docs/en/skills) and [commands](/docs/en/commands) inject their instructions as user messages at the point of invocation. Nothing earlier in the conversation changes.

### Running `/recap`

[`/recap`](/docs/en/interactive-mode#session-recap) generates a summary for display in your terminal. Unlike `/compact`, it appends the summary as command output rather than replacing your message history, so the cached prefix stays intact.

### Rewinding the conversation

[`/rewind`](/docs/en/checkpointing) truncates your conversation back to an earlier turn. The remaining history is the same content the cache was built from at that point, and the system prompt and project context layers are unchanged, so the next request hits the earlier cache entry. Every turn since then has read through that prefix, which kept the entry warm even if the original turn was longer ago than the TTL.

Restoring file checkpoints alongside the conversation has no separate effect on the cache. File contents enter context only when Claude reads them, the same as [editing files in your repository](#editing-files-in-your-repository).

## Cache lifetime

Cached prefixes expire after a period of inactivity. Each request that hits the cache resets the timer, so the cache stays warm as long as you keep working. After a long enough gap, the next request recomputes the full input and re-establishes the cache, which is why the first turn back after stepping away can be noticeably slower.

The time to live (TTL) controls how long a gap the cache survives. The API offers two: a five-minute TTL, and a [one-hour TTL](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#1-hour-cache-duration) that keeps the cache warm through longer breaks but [bills cache writes at a higher rate](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#pricing). Claude Code picks the TTL for you based on how you authenticate, and you can override it with environment variables.

### On a Claude subscription

On a Claude subscription, Claude Code requests the one-hour TTL automatically. Usage is included in your plan rather than billed per token, so the longer TTL costs you nothing extra and only affects how long your cache stays warm.

If you've gone over your plan's usage limit and Claude Code is drawing on [usage credits](https://support.claude.com/en/articles/12429409-extra-usage-for-paid-claude-plans), you are billed for that usage, so Claude Code automatically drops the TTL to five minutes.

### On an API key or third-party provider

On an API key, Bedrock, Vertex, Foundry, or Claude Platform on AWS, you pay the per-token rates, so the TTL stays at the cheaper five minutes by default. To opt into the [one-hour TTL](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#1-hour-cache-duration), set `ENABLE_PROMPT_CACHING_1H=1`.

On Bedrock, prompt caching support, minimum cacheable prefix length, and one-hour TTL availability all vary by model. If cache token counts stay at zero, check [supported models, regions, and limits](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html#prompt-caching-models) in the Bedrock documentation.

### Override the TTL

Set `FORCE_PROMPT_CACHING_5M=1` to force the five-minute TTL regardless of authentication. This is useful when you're debugging cache behavior, comparing the two TTLs, or overriding an `ENABLE_PROMPT_CACHING_1H` set in [managed settings](/docs/en/settings#settings-files).

## Cache scope

In Claude Code, the cache is effectively scoped to one machine and directory. The system prompt embeds the working directory, platform, shell, OS version, and auto-memory paths, so two sessions in different directories build different prefixes and miss each other's cache. That includes worktrees of the same repository, since each worktree has its own working directory.

Sessions you run in parallel in the same directory build matching prefixes and read each other's cache. Sequential sessions share the prefix only when the git status snapshot at startup matches, since the system prompt also captures branch and recent commits.

The underlying API cache is broader. Caches are isolated between organizations, and on some providers, [between workspaces within an organization](https://platform.claude.com/docs/en/build-with-claude/prompt-caching#cache-storage-and-sharing). Within those boundaries, any two requests with the same model and prefix read the same cache. For Agent SDK callers running fleets of automated processes, see [improve prompt caching across users and machines](/docs/en/agent-sdk/modifying-system-prompts#improve-prompt-caching-across-users-and-machines) to suppress the per-machine sections of the system prompt and share the cache across machines.

## Check cache performance

Cache performance shows up as two token counts the API reports on every response. The most direct way to watch them live is a [statusline script](/docs/en/statusline) that reads the `current_usage` object:

| Field                         | Meaning                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `cache_creation_input_tokens` | Tokens written to the cache on this turn, billed at the cache write rate                |
| `cache_read_input_tokens`     | Tokens served from cache on this turn, billed at roughly 10% of the standard input rate |

A high read-to-creation ratio means caching is working well. If creation stays high turn after turn, something is changing in your prefix. The [actions that invalidate the cache](#actions-that-invalidate-the-cache) section lists the usual causes.

For visibility across an organization, the OpenTelemetry exporter reports cache read and creation tokens per user and session. See [Monitor usage](/docs/en/monitoring-usage) for the metric and event attribute reference.

## Subagents and the cache

A [subagent](/docs/en/sub-agents) starts its own conversation with its own system prompt and tool set, separate from the parent's. It builds its own cache, starting with no cache hits on its first call and warming up across its own turns. Subagents use the five-minute TTL even on a subscription, since the automatic one-hour TTL applies to the main conversation.

The parent's cache is unaffected. From the parent's side, the subagent's call and result append to the conversation, leaving the parent's prefix intact.

A [fork](/docs/en/sub-agents#fork-the-current-conversation), by contrast, inherits the parent's system prompt, tools, and conversation history exactly, so its first request reads the parent's cache. The compaction summarization call described in [Compacting the conversation](#compacting-the-conversation) uses the same prefix-sharing approach.

## Disable prompt caching

Disabling caching is occasionally useful when debugging caching behavior with a specific model or provider. To turn it off, set one of these environment variables to `1`:

| Variable                        | Effect                  |
| ------------------------------- | ----------------------- |
| `DISABLE_PROMPT_CACHING`        | Disable for all models  |
| `DISABLE_PROMPT_CACHING_HAIKU`  | Disable for Haiku only  |
| `DISABLE_PROMPT_CACHING_SONNET` | Disable for Sonnet only |
| `DISABLE_PROMPT_CACHING_OPUS`   | Disable for Opus only   |

To set caching policy across an organization, put any of these or the [TTL variables](#cache-lifetime) in the `env` block of [managed settings](/docs/en/settings#settings-files). For normal use, leave caching enabled.

## Related resources

* [Lessons from building Claude Code: Prompt caching is everything](https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything): the design rationale for plan mode, deferred tool loading, and compaction
* [Explore the context window](/docs/en/context-window): what loads into context and when
* [Reduce token usage](/docs/en/costs#reduce-token-usage): strategies beyond caching for managing context size
* [Track and reduce costs](/docs/en/agent-sdk/cost-tracking): cache token tracking and TTL configuration for Agent SDK callers
* [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching): the underlying API mechanism, breakpoints, and pricing
