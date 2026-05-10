/**
 * measuresOverride.js
 *
 * Dev-only URL-param override for rhythm pattern measure count.
 * Used by Phase 34 UAT to validate the needsLandscape heuristic against
 * long patterns from free-play (which otherwise hardcodes to 1 measure).
 *
 * Production builds ALWAYS return null (param ignored). The override exists
 * solely to enable manual UAT verification of NOTATION-01/NOTATION-02
 * (Phase 34 success criteria SC #2 + SC #3 long-pattern rows).
 *
 * Removable: this helper is intended to stay in the codebase but is
 * harmless in production (no shipped UI references it).
 *
 * @returns {number|null} Integer in [1, 4] when DEV + valid param; otherwise null.
 */
export function getMeasuresOverride() {
  // Production gate — bail immediately so production behavior is identical to no-override.
  if (!import.meta.env.DEV) return null;

  // SSR / non-browser safety
  if (typeof window === "undefined" || !window.location) return null;

  let raw;
  try {
    const params = new URLSearchParams(window.location.search);
    raw = params.get("measures");
  } catch {
    return null;
  }

  if (raw === null) return null; // Param not present — no override

  // Strict integer parse: reject decimals, hex, non-numerics
  const parsed = /^-?\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 4) {
    console.warn(
      `[measuresOverride] Invalid ?measures=${raw} — expected integer in [1, 4]; ignoring.`
    );
    return null;
  }

  return parsed;
}
