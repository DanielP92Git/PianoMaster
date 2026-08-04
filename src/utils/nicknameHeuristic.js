/**
 * nicknameHeuristic
 *
 * Conservative, non-blocking heuristic that flags a child-profile nickname
 * as "looks like a full name" (D-14, Phase 4 CONTEXT.md). This is a soft UX
 * nudge only — it must never be treated as validation and never blocks save.
 *
 * Rule (deliberately conservative to minimize false positives on
 * hyphenated names and legitimate two-word nicknames):
 *   true  ONLY when the trimmed value is exactly two whitespace-separated
 *         tokens, BOTH tokens start with an uppercase ASCII letter (/^[A-Z]/),
 *         AND neither token contains a hyphen.
 *   false for: empty/blank, a single token, 3+ tokens, any token whose
 *         first character is not an uppercase ASCII letter (this
 *         deliberately excludes Hebrew and other non-cased scripts, so
 *         Hebrew nicknames never trigger the warning), and any hyphenated
 *         token (e.g. "Anna-Marie").
 */

/**
 * @param {string} nickname
 * @returns {boolean} true when the nickname looks like a full name
 */
export function looksLikeFullName(nickname) {
  if (typeof nickname !== "string") return false;

  const trimmed = nickname.trim();
  if (!trimmed) return false;

  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 2) return false;

  return tokens.every((token) => /^[A-Z]/.test(token) && !token.includes("-"));
}
