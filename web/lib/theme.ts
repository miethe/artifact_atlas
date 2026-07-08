/**
 * Theme preference helper (DM-4).
 *
 * Persisted preference is "light" | "dark" | "system" (default "system").
 * The resolved `data-theme` attribute on <html> is always "light" or
 * "dark" — the inline no-FOUC script in app/layout.tsx resolves "system"
 * via `matchMedia` before paint. Keep STORAGE_KEY in sync with that
 * inline script (it can't import this module).
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "aa-theme";

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  // MINOR fix: localStorage can throw (private/incognito mode, storage
  // quota, disabled storage via browser policy) — reading the preference
  // must never crash theme resolution; fall back to "system".
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function applyTheme(pref: ThemePreference): void {
  if (typeof document === "undefined") return;
  // Theme application must succeed even when persistence is blocked — only
  // the resolved data-theme attribute is required for correct rendering;
  // failing to *persist* the preference is a degraded-but-working state,
  // not a crash (MINOR fix).
  document.documentElement.dataset.theme = resolveTheme(pref);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage blocked/unavailable (private mode, quota, policy) — the
    // in-memory/DOM theme is still applied above; persistence is best-effort.
  }
}
