# Git vs tracker remeasurement — 2026-09-08 ET

This is the recorded output of the laptop-side measurement contract in
`scripts/measure_tracker_divergence.py`. Figures are observations, not interchangeable units:
commits measure code activity while nodes measure declared work.

| Figure | Value | Measured by | Provenance |
|---|---:|---|---|
| Prototype membership | 14 rows / 13 unique repositories | de-duplicate resolved git top-levels | prototype `_build/collect.py`; Hermes shares the launchpad repository |
| Commits in 30 days, all refs | 3,183 | `git log --all --since=30 days ago --format=%H` | 13 unique prototype repositories |
| Commits in 30 days, HEAD | 1,339 | `git log HEAD --since=30 days ago --format=%H` | same 13 repositories |
| Tracker nodes | 6,499 total / 3,864 open | full paginated IntentTree export; open excludes completed/archived | prototype tree bindings |
| KnitWit | 25 all-ref commits / 9 HEAD commits vs 102 total / 79 open nodes | same git commands and tracker export | KnitWit repository/tree |
| Current fleet registry | 45 apps | count `apps[]` | `agentic_meta_dev/docs/05-app-registry.yaml` at measurement time |
| Original-map registry coverage | 13 mapped / 1 unmapped | slug join | only `meatywiki-portal` was unmapped among the original 14 rows |

The 2026-08 prototype baselinement quoted 1,880 commits/30d, 735 open nodes, four unbound
projects, and KnitWit at 609 commits versus one node. Those older numbers are retained only as
historical context. The 2026-09 run uses both `--all` and HEAD because branch topology and fetch
state materially change the activity count. The conclusion is narrower than “git is truth”:
registry owns membership/topology, IntentTree owns declared status, git owns code activity, and
Atlas owns latest hosted report resolution. The overview must show these lanes side by side.
