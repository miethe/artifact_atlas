/**
 * Shared relative-time label (estate-coherence M0 / T3).
 *
 * One helper for every "3h ago" display. Missing or unparseable dates return
 * `fallback` (default "—") instead of the "NaNd ago" that the per-component
 * copies produced when a field was absent or misnamed. Future timestamps
 * (clock skew) read as "just now".
 */

export const UNKNOWN_TIME = "—";

/** Parse an ISO-ish date; `null` when missing or invalid. */
export function parseDate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function relativeTime(
  iso: string | null | undefined,
  { fallback = UNKNOWN_TIME, now = Date.now() }: { fallback?: string; now?: number } = {},
): string {
  const then = parseDate(iso);
  if (then === null) return fallback;
  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
