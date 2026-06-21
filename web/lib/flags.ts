/**
 * Minimal feature-flag helper.
 *
 * Flags are read from the build-time `NEXT_PUBLIC_FLAGS` env var, a
 * comma-separated list of enabled flag names (e.g. `miethe-ui-ds,foo`).
 * Because it is a `NEXT_PUBLIC_*` var, the value is inlined by Next at
 * build time and resolves identically in Server and Client Components.
 *
 * Known flags carry an explicit development default so local work picks
 * up in-progress UI without extra env wiring; the env var always wins
 * when a flag is named in it (presence = on).
 */

/** Per-flag default applied when the flag is not named in NEXT_PUBLIC_FLAGS. */
const FLAG_DEV_DEFAULTS: Record<string, boolean> = {
  // @miethe/ui design-system adoption (UI Polish Pass P1). On in dev so the
  // token bridge / ContentPane surfaces render without extra env setup.
  "miethe-ui-ds": true,

  // EntityModal migration (UI Polish Pass P2b). On in dev so all 5 migrated
  // surfaces render the new canonical modal without extra env wiring.
  // Post-P6 global cutover: add "ui-tabbed-modal" to NEXT_PUBLIC_FLAGS and
  // remove this dev default.
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
 *   2. Otherwise fall back to the flag's development default (when running
 *      in development) — known dev-default flags are on locally.
 *   3. Otherwise off.
 */
export function isFlagEnabled(name: string): boolean {
  if (enabledFlags.has(name)) return true;
  if (process.env.NODE_ENV === "development") {
    return FLAG_DEV_DEFAULTS[name] ?? false;
  }
  return false;
}
