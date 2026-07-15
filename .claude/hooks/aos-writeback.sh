#!/usr/bin/env bash
# aos-writeback.sh — materialized AOS writeback hook (installed by `op new`, T3+).
#
# WHY THIS EXISTS: the launchpad audit found that AOS integrations decay to prose the moment
# they depend on an agent *remembering* a mid-loop CLI call. This hook removes the memory: it
# fires automatically on the Claude Code **Stop** event and flows this project's lessons and
# decisions into the Agentic OS with no agent action required.
#
#   • AAR / retro files            → `op story capture`   (stages into the node story inbox)
#   • DECISIONS.md + docs/aars/*   → `meatywiki ingest`    (into the node knowledge vault)
#
# CONTRACT:
#   - Degrade, never fail: exits 0 always. No-ops silently when `op`/`meatywiki` are absent
#     (off-LAN, AOS_TARGET unset) or when nothing matching changed. A hook must never block a turn.
#   - Idempotent: a per-file content-hash marker (.claude/.aos-writeback-state) means re-runs
#     dedup instead of re-capturing. Editing an AAR re-captures it once at the new content.
#   - Cheap on the hot path: the only unconditional work is two local `git` reads; the node is
#     touched only when a new/changed writeback file actually appears.
#
# The `op`/`meatywiki` names resolve through the aos-target shims to the node instances
# (`aos-target set node`). This script intentionally hard-codes no host — targeting is the shim's job.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$root" 2>/dev/null || exit 0

marker="$root/.claude/.aos-writeback-state"
mkdir -p "$root/.claude" 2>/dev/null || exit 0
touch "$marker" 2>/dev/null || true

# Candidate writeback files — tracked + untracked, matched by convention. Anything named like an
# AAR/retro/decisions doc, or living under docs/aars/. Array-free (portable to bash 3.2 / macOS).
matches="$(
  { git ls-files 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null; } \
    | grep -iE '(^|/)(aar|retro|decisions)[^/]*\.(md|markdown)$|(^|/)docs/aars/[^/]+\.(md|markdown)$' \
    | sort -u
)"
[ -n "$matches" ] || exit 0

have_op=0; command -v op        >/dev/null 2>&1 && have_op=1
have_mw=0; command -v meatywiki >/dev/null 2>&1 && have_mw=1
[ "$have_op" = 0 ] && [ "$have_mw" = 0 ] && exit 0

printf '%s\n' "$matches" | while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] || continue
  h="$(shasum "$f" 2>/dev/null | cut -d' ' -f1)"
  [ -n "$h" ] || continue
  key="${f}::${h}"
  grep -qxF "$key" "$marker" 2>/dev/null && continue   # already handled at this content

  handled=0
  low="$(printf '%s' "$f" | tr '[:upper:]' '[:lower:]')"

  # Lessons: AARs/retros → op story capture (the shim scp-stages the local file to the node inbox).
  case "$low" in
    *aar*|*retro*)
      if [ "$have_op" = 1 ]; then
        op story capture "$f" >/dev/null 2>&1 && handled=1
      fi
      ;;
  esac

  # Knowledge: decisions + AARs → meatywiki ingest (file content as a note into the node vault).
  case "$low" in
    *decisions*|*aar*|*/docs/aars/*)
      if [ "$have_mw" = 1 ]; then
        meatywiki ingest --text "$(cat "$f" 2>/dev/null)" --type note >/dev/null 2>&1 && handled=1
      fi
      ;;
  esac

  [ "$handled" = 1 ] && printf '%s\n' "$key" >> "$marker"
done

exit 0
