/**
 * Minimal feature-flag helper.
 *
 * Flags are read from the build-time `NEXT_PUBLIC_FLAGS` env var, a
 * comma-separated list of enabled flag names (e.g. `miethe-ui-ds,foo`).
 * Because it is a `NEXT_PUBLIC_*` var, the value is inlined by Next at
 * build time and resolves identically in Server and Client Components.
 *
 * Known flags carry an explicit default so the shipped UI surfaces are on
 * without extra env wiring; the env var always wins when a flag is named in
 * it (presence = on), letting deployments opt additional flags on.
 */

/**
 * Per-flag default applied (in every environment) when the flag is not named
 * in NEXT_PUBLIC_FLAGS. The UI Polish Pass cutover (ADR-7) flipped these from
 * NODE_ENV-keyed dev-only defaults to unconditional defaults, making the new
 * UX the product default in dev and prod alike.
 */
const FLAG_DEFAULTS: Record<string, boolean> = {
  // @miethe/ui design-system adoption (UI Polish Pass P1). The token bridge /
  // ContentPane surfaces are the default presentation.
  "miethe-ui-ds": true,

  // EntityModal migration (UI Polish Pass P2b). The canonical tabbed modal is
  // the default for all 5 migrated detail surfaces; the master flag covers
  // every surface, so the per-surface overrides below stay off.
  "ui-tabbed-modal": true,

  // Per-surface overrides — enable a single surface when the master flag is
  // off (useful for incremental rollout or cherry-pick testing in non-dev).
  // All default false; the master flag above covers dev.
  "ui-tabbed-modal-asset": false,
  "ui-tabbed-modal-bom": false,
  "ui-tabbed-modal-coverage": false,
  "ui-tabbed-modal-template": false,
  "ui-tabbed-modal-inbox": false,
};

function parseFlagList(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

const enabledFlags = parseFlagList(process.env.NEXT_PUBLIC_FLAGS);

/**
 * Returns whether the named feature flag is enabled.
 *
 * Resolution order:
 *   1. If `name` appears in NEXT_PUBLIC_FLAGS → enabled.
 *   2. Otherwise fall back to the flag's default (applied in every
 *      environment) — known default-on flags are on by default (ADR-7).
 *   3. Otherwise off.
 *
 * Note: flags not in FLAG_DEFAULTS (e.g. `pptx-server-conversion`, which needs
 * a LibreOffice/Gotenberg backend) stay off until named in NEXT_PUBLIC_FLAGS.
 */
export function isFlagEnabled(name: string): boolean {
  if (enabledFlags.has(name)) return true;
  return FLAG_DEFAULTS[name] ?? false;
}
