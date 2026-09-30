# Author the M0 (artifact_atlas) child plan — estate-coherence

Read `/Users/miethe/dev/homelab/development/agentic_meta_dev/docs/project_plans/reports/estate-coherence-2026-09-29/briefs/SHARED-BRIEF.md` FIRST (no secrets; never read ~/.dotfiles, journal files, or the CHCW corpus). Your node: `node_01M3RA15KF42TXE9XD40K15JG3` (tree `tree_01M0G9CXTSEJAN3HPRS38H3YPQ`). cwd = this worktree (`artifact_atlas`, branch `plan/estate-coherence-m0`, off origin/development). PLANNING pass (Mode B): author ONE plan file and open a PR. No product code, no registry reclassification, no deletes. Foreground only; fan-out cap 5, depth ≤2.

## Inputs (in order)
1. The approved spine: `/Users/miethe/dev/homelab/development/agentic_meta_dev/docs/project_plans/campaigns/2026-09-29/estate-coherence-spine-v1.md` (req_01M3R26511C00VMQ7S61HJCSB7 approved; D11 = marks only, no deletes). Your milestone is **M0 "Readers and receipts tell the truth" — Atlas honest states**, reserved path `docs/project_plans/implementation_plans/estate-coherence/m0-honest-states-v1.md` (confirm absent on origin/development). M6 (registry classify/project) and M7 (curated reader) are LATER child plans — do not pull them in; M0 is only the honest-state work the nodes describe.
2. Sibling exemplar just merged: `/Users/miethe/dev/homelab/development/agentic_meta_dev/docs/project_plans/implementation_plans/infrastructure/estate-coherence-m0-truthful-readers-amd-v1.md` — match its shape. Schema: this repo's `.claude/skills/planning/references/plan-frontmatter-schema.md` (use only its keys).
3. Your nodes (`itt node get <id>`, body + ACs + edges): node_01M3QYTMSR2DYGWBB3T9Q424P9, node_01M3R0FSV30836Y4819H81D9VS, node_01M3R0HN9XWBCEVAN1FVNTYBEZ. The plan derives from the NODES.
4. Design context: `/Users/miethe/dev/homelab/development/agentic_meta_dev/docs/project_plans/reports/estate-coherence-2026-09-29/L5-atlas-audit.md`, `L5-stage2-design.md` (the honest-states section and §8 decisions), `mockups/honest-states-v1.png` + `mockups/MOCKUP-LEDGER.md`, and `screenshots/CAPTURE-LEDGER.md` for the current-state captures. Nick approved the mockup DIRECTION; the plan may cite the mockup but must not treat pixels as spec.
5. The code the nodes point at in THIS repo (projectors, drift readers, the states/labels the reader renders, population counts) — read enough for file:line-anchored tasks. Verify against the live Atlas (read-only) which states are currently misreported and cite it.

## Output — the child plan
- Schema v2 frontmatter: `doc_type: implementation_plan`, `intenttree_tree: tree_01M0G9CXTSEJAN3HPRS38H3YPQ`, `itt_node_id: node_01M3RA15KF42TXE9XD40K15JG3`, `status: not_started`, tier + gate lenses per the spine's M0 (security + validator), `related_documents`.
- Phases/tasks with `assigned_to` (chain ICA → Codex → CC-1x → CC-primary; visual verification needs a browser-capable lane, i.e. ICA or Claude Code, never Codex — cite `docs/rules/visual-verification.md` in agentic_meta_dev), `itt_node_id`, effort, real `files_affected`, ACs consistent with the node ACs. All three nodes exactly once; already-satisfied → verify-only table. Render/navigation paths make zero model calls (constraint 4) — say so in the plan.
- `## Validation`: baseline commands at the parent commit, two-sided tests for state logic (an honest "unknown/unverified" must render as such AND a verified state must still render verified), screenshot-based visual verification step on a browser-capable lane.
- Single-repo, executable by `/dev:execute-plan` here.

## Commit + PR
- `git add docs/project_plans/implementation_plans/estate-coherence/m0-honest-states-v1.md docs/project_plans/implementation_plans/estate-coherence/BRIEF-m0-honest-states.md` (pathspec only). Commit `docs(plan): estate-coherence M0 child plan — Atlas honest states (node_01M3RA15KF42TXE9XD40K15JG3)` + `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. `git log -1 --stat` before claiming.
- Try `git push -u origin plan/estate-coherence-m0`; if refused, report the commit SHA and stop (the front pushes). If pushed: `gh pr create --base development`, body = phases, coverage 3/3, lanes, `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Nick merges.
- `itt node add-evidence node_01M3RA15KF42TXE9XD40K15JG3 --kind other --label "M0 Atlas honest-states child plan" --ref <plan path>`; set the node `waiting_review`.

Signal ≤120 words: plan path, phase/task counts, coverage, live-state measurement one-liner, PR URL or SHA, failures verbatim.
