# Leg report: Missing Context row titles

Target-Node: node_01M3SBHTJ0BTC1WTF84H19CKF0

## Acceptance criteria

1. **Met** — Missing Context rows display a slot title when available, then a non-empty name, then the slot id. Evidence: `web/features/dashboard/components/MissingContextPanel.tsx:39` and `web/lib/types.ts:366`.
2. **Met** — A component test covers both an explicit title and the slot-id fallback. Evidence: `web/__tests__/missing-context-panel.test.tsx:20`.

## Tests

- `cd web && npm test -- --run __tests__/missing-context-panel.test.tsx` — 0 passed; runner unavailable: `sh: vitest: command not found`.
- `cd web && npm ci` — dependencies could not be installed: `Network access to "registry.npmjs.org" was blocked: domain is not on the allowlist for the current sandbox mode.`

Run from a network-enabled checkout: `cd web && npm ci && npm test -- --run __tests__/missing-context-panel.test.tsx`.

## Live commands for the front

- Run the command above to verify the focused component test.
- No IntentTree command is reported as run; `.leg/node.json` and the assigned node snapshot were not present in this clone.

## Assumptions

[{"claim":"Some BOM data sources may supply a title field while existing fixture data uses name; the display order should prefer title, then name, then slot id.","confidence":0.86,"blast_radius":"low","evidence_if_wrong":"The backend BomSlot response model does not define a name or title; the title field is optional in the frontend type and the id fallback remains available."}]
