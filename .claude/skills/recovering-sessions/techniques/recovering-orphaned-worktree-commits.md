# Recovering Orphaned Worktree Commits

When an `EnterWorktree` session closes, the harness can **remove the worktree and delete its branch**. Committed work then survives only as **dangling (unreachable) commits** in the shared object store — invisible to `git branch`, `git worktree list`, and `git log`, and `development..<branch>` fails with `unknown revision`. The commits are **not lost** (they persist until `git gc`, typically ~2 weeks), just unreferenced.

This is distinct from the log-based recovery in the main skill: the work was *committed*, not left as uncommitted edits, so on-disk verification and log parsing don't apply. You recover the commits themselves.

## Symptoms

- A prior session reports a worktree/branch is "still active," but `git worktree list` and `git branch --list '*<slug>*'` show nothing.
- `git rev-parse <branch>` → `fatal: Needed a single revision`.
- The implementation is missing from the target branch, but only the *plan/SPIKE* docs commit is present.

## Recovery procedure

### 1. List dangling commits

```bash
git fsck --no-reflogs --dangling | grep 'dangling commit' | awk '{print $3}'
```

This includes truly unreachable tips (reflog-orphaned), which is what a deleted branch produces.

### 2. Identify the real tip by CONTENT, not subject

The tip is usually the **last** commit (often a `docs(retro)` / closeout commit), not a `feat` one. Find it by a file only the branch had — an execution retro is ideal:

```bash
for c in $(git fsck --no-reflogs --dangling | awk '/dangling commit/{print $3}'); do
  git cat-file -p "$c:.claude/findings/<feature>-execution-retro.md" >/dev/null 2>&1 \
    && echo "TIP CANDIDATE: $(git log -1 --format='%h %ci %s' "$c")"
done
```

Fallback: grep subjects for the workstream's phase markers:

```bash
for c in $(git fsck --no-reflogs --dangling | awk '/dangling commit/{print $3}'); do
  git log -1 --format='%h|%ci|%s' "$c"
done | grep -iE 'P[0-9]|<feature-keyword>' | sort -t'|' -k2
```

### 3. Verify lineage before trusting it

```bash
BASE=$(git merge-base development <tip>)
git log --oneline "$BASE".."<tip>"          # expect the full phase chain
git rev-list --count "$BASE".."<tip>"        # matches expected commit count?
git merge-base --is-ancestor development <tip> \
  && echo "linear ahead" || echo "divergent (development advanced since fork — normal)"
```

### 4. Anchor IMMEDIATELY (before anything else)

A recovery branch protects the commits from `gc` and gives a clean name to merge from:

```bash
git branch recover/<slug> <tip>
```

Keep this branch until the work is safely merged **and** you no longer need the granular per-commit history — a squash merge creates a *new* commit, so the original commits become reachable only via `recover/<slug>`.

## Safe squash-merge in a shared working tree

Other live sessions may have uncommitted changes in the same tree. Never `git add -A`. Prove no overlap first (see also `references/prevention-patterns.md` and project memory `feedback_scoped_git_staging_shared_repo`):

```bash
BASE=$(git merge-base development recover/<slug>)
git diff --name-only "$BASE"..recover/<slug> | sort > /tmp/branch.txt
git diff --name-only "$BASE"..development     | sort > /tmp/dev.txt
git status --porcelain | awk '{print $2}'    | sort > /tmp/foreign.txt

comm -12 /tmp/branch.txt /tmp/dev.txt      # empty ⇒ clean squash guaranteed (no conflicts)
comm -12 /tmp/branch.txt /tmp/foreign.txt  # empty ⇒ merge won't touch another session's work
```

Then merge, **verify the staged set excludes foreign files**, and commit explicitly:

```bash
git merge --squash recover/<slug>
git diff --cached --name-only          # MUST equal branch.txt; MUST NOT contain any foreign file
# (optional) import/build smoke on the merged tree before committing
git commit -m "feat(<area>): <feature> (squash, recovered from closed worktree)"
# Note: no `-a`. Foreign uncommitted files stay uncommitted and untouched.
```

If `comm -12 branch vs dev` is **non-empty**, those files are genuine 3-way conflict candidates — resolve them by hand and never stage a foreign session's file to do so.

## Cleanup

Once merged and verified, the recovery branch is redundant (work is on `development`):

```bash
git branch -D recover/<slug>
```

Defer deletion if you may still need the granular commit history for audit.

## See also

- Project memory: `gotcha_worktree_session_close_orphans_commits`, `feedback_execute_plan_in_worktree_mechanics`, `gotcha_concurrent_session_sweeps_uncommitted_work`
- `./techniques/verifying-on-disk-state.md` — for the uncommitted-work case (log-based recovery)
