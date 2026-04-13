/**
 * holdScoringUtils.js
 *
 * Utilities for scoring long-press (hold) notes in rhythm games.
 *
 * Design decisions:
 * - D-03: PERFECT threshold at 70% of required hold duration
 * - D-04: GOOD threshold at 40-69%; below 40% = MISS
 * - D-05: Duration calculated from durationUnits (sixteenth-note units) and tempo
 * - D-06: Hold notes defined as durationUnits >= 8 (half, dotted half, whole)
 */

/**
 * Hold scoring thresholds (as ratios of required hold duration).
 * @type {{ PERFECT: number, GOOD: number }}
 */
export const HOLD_THRESHOLDS = {
  PERFECT: 0.7, // 70%+ of required hold duration (per D-03)
  GOOD: 0.4, // 40-69% (per D-04)
};

/**
 * Score a hold note based on actual vs required hold duration.
 *
 * Returns the same quality strings as scoreTap() for consistency:
 * 'PERFECT' | 'GOOD' | 'MISS'
 *
 * @param {number} actualHoldMs - How long the user actually held (ms)
 * @param {number} requiredHoldMs - How long the note requires holding (ms)
 * @returns {'PERFECT' | 'GOOD' | 'MISS'}
 */
export function scoreHold(actualHoldMs, requiredHoldMs) {
  if (requiredHoldMs <= 0) return "MISS";
  const ratio = actualHoldMs / requiredHoldMs;
  if (ratio >= HOLD_THRESHOLDS.PERFECT) return "PERFECT";
  if (ratio >= HOLD_THRESHOLDS.GOOD) return "GOOD";
  return "MISS";
}

/**
 * Determine if a note with the given durationUnits is a hold note.
 *
 * Hold notes are half (8), dotted half (12), and whole (16) notes.
 * Quarter (4), dotted quarter (6), eighth (2), etc. are tap notes.
 *
 * @param {number} durationUnits - Sixteenth-note units from DURATION_INFO
 * @returns {boolean}
 */
export function isHoldNote(durationUnits) {
  return durationUnits >= 8; // half (8), dotted half (12), whole (16)
}

/**
 * Calculate the required hold duration in milliseconds.
 *
 * Formula: (durationUnits / 4) * (60000 / tempo)
 * - durationUnits / 4 converts sixteenth-note units to quarter-note beats
 * - 60000 / tempo gives milliseconds per beat at the given tempo
 *
 * Examples at 120 BPM:
 * - Half note (8 units): (8/4) * (60000/120) = 2 * 500 = 1000ms
 * - Whole note (16 units): (16/4) * (60000/120) = 4 * 500 = 2000ms
 *
 * @param {number} durationUnits - Sixteenth-note units from DURATION_INFO
 * @param {number} tempo - Beats per minute
 * @returns {number} Duration in milliseconds
 */
export function calcHoldDurationMs(durationUnits, tempo) {
  return (durationUnits / 4) * (60000 / tempo);
}
