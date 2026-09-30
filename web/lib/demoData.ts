/**
 * Demo-data gate (estate-coherence M0 / T1).
 *
 * Live Atlas reader queries must report what the API establishes: loading,
 * error, empty, or API-backed values. Fixture records are only permitted when
 * the build explicitly opts in with NEXT_PUBLIC_ATLAS_DEMO_DATA=1, and every
 * shell in that build renders a visible "DEMO DATA" banner (DemoDataBanner).
 *
 * Without the flag a failed query stays failed — callers render an error
 * state with retry, never a fixture substituted as catalog truth.
 */

/** True only when the build explicitly opted into demo fixtures. */
export function isDemoDataEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ATLAS_DEMO_DATA === "1";
}

/**
 * Run a live query; on failure return a demo fixture ONLY when demo mode is
 * enabled, otherwise rethrow so react-query surfaces `isError`.
 */
export async function liveOrDemo<T>(
  live: () => Promise<T>,
  demo: () => T,
): Promise<T> {
  try {
    return await live();
  } catch (err) {
    if (isDemoDataEnabled()) return demo();
    throw err;
  }
}

/** Demo fixtures in demo mode; otherwise `null` (there is no live source). */
export function demoOnly<T>(demo: () => T): T | null {
  return isDemoDataEnabled() ? demo() : null;
}
