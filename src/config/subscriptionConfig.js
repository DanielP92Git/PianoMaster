/**
 * Subscription Configuration — Free Tier Gate Definitions
 *
 * This is the SINGLE SOURCE OF TRUTH for which trail nodes are free
 * and which boss nodes are paywalled. Changing the free tier boundary
 * requires editing ONLY this file.
 *
 * Verification date: 2026-02-25
 * Source files audited:
 *   - src/data/units/trebleUnit1Redesigned.js (nodes treble_1_1 through treble_1_7, boss_treble_1)
 *   - src/data/units/bassUnit1Redesigned.js   (nodes bass_1_1 through bass_1_6, boss_bass_1)
 *   - src/data/units/rhythmUnit1Redesigned.js (nodes rhythm_1_1 through rhythm_1_6, boss_rhythm_1)
 *
 * Decision (locked): Static config with explicit IDs — NO dynamic resolution from unit files.
 * Reason: Avoids accidental paywall expansion if unit files grow; gate changes must be intentional.
 *
 * NOTE: Once the Israeli-market payment processor is confirmed during account registration,
 * update PAYWALL_BOSS_NODE_IDS and FREE_TIER_SUMMARY.bossNodeCount if the boss node count changes.
 */

// ─── Free Node IDs by Category ───────────────────────────────────────────────

/** Treble clef Unit 1 — 7 free nodes */
export const FREE_TREBLE_NODE_IDS = [
  'treble_1_1',
  'treble_1_2',
  'treble_1_3',
  'treble_1_4',
  'treble_1_5',
  'treble_1_6',
  'treble_1_7',
];

/** Bass clef Unit 1 — 6 free nodes */
export const FREE_BASS_NODE_IDS = [
  'bass_1_1',
  'bass_1_2',
  'bass_1_3',
  'bass_1_4',
  'bass_1_5',
  'bass_1_6',
];

/** Rhythm Unit 1 — 6 free nodes */
export const FREE_RHYTHM_NODE_IDS = [
  'rhythm_1_1',
  'rhythm_1_2',
  'rhythm_1_3',
  'rhythm_1_4',
  'rhythm_1_5',
  'rhythm_1_6',
];

// ─── Paywall Boss Node IDs ───────────────────────────────────────────────────

/**
 * Boss nodes that require a paid subscription.
 * These are the mini-boss challenges at the end of each Unit 1 path.
 */
export const PAYWALL_BOSS_NODE_IDS = [
  'boss_treble_1',
  'boss_bass_1',
  'boss_rhythm_1',
];

// ─── Derived Lookups ─────────────────────────────────────────────────────────

/**
 * Set of all free node IDs for O(1) membership lookup.
 * Includes treble, bass, and rhythm free nodes only (boss nodes are paywalled).
 */
export const FREE_NODE_IDS = new Set([
  ...FREE_TREBLE_NODE_IDS,
  ...FREE_BASS_NODE_IDS,
  ...FREE_RHYTHM_NODE_IDS,
]);

// ─── Summary Metadata ────────────────────────────────────────────────────────

/**
 * Human-readable summary of the free tier boundary.
 * Useful for display in upgrade prompts and marketing copy.
 */
export const FREE_TIER_SUMMARY = {
  treble: { count: 7 },
  bass: { count: 6 },
  rhythm: { count: 6 },
  total: 19,
  bossNodeCount: 3,
};

// ─── Gate Function ───────────────────────────────────────────────────────────

/**
 * Returns true if the given node ID is accessible on the free tier.
 *
 * @param {string} nodeId - Trail node ID (e.g. 'treble_1_1', 'boss_treble_1')
 * @returns {boolean}
 */
export function isFreeNode(nodeId) {
  return FREE_NODE_IDS.has(nodeId);
}
