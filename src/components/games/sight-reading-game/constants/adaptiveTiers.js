// Phase 03 — Adaptive Pedagogy (ADAPT-01/02/03). Values are Claude's-discretion picks
// inside the CONTEXT.md envelopes: tempo ±10-15 BPM/step (D-06), clamp 0.75x-1.25x base (D-06),
// weak-note min-attempts 3-5 (D-11), ease on a run of misses (D-03).

// 5-tier symmetric ladder; index 0 == node's authored baseline (RESEARCH.md Open Question 3).
// tempoDeltaBpm is added to the node's BASE tempo, then clamped by the fractions below.
// widenNotes: union the node's superset pool into selectedNotes (D-02) — only at positive tiers.
// includeRests: true forces rests on, false strips them, null == leave the node's own rhythmSettings.
export const ADAPTIVE_TIERS = [
  { index: -2, tempoDeltaBpm: -24, widenNotes: false, includeRests: false },
  { index: -1, tempoDeltaBpm: -12, widenNotes: false, includeRests: false },
  { index: 0, tempoDeltaBpm: 0, widenNotes: false, includeRests: null },
  { index: 1, tempoDeltaBpm: 12, widenNotes: true, includeRests: true },
  { index: 2, tempoDeltaBpm: 24, widenNotes: true, includeRests: true },
];

export const BASELINE_TIER_INDEX = 0;
export const MIN_TIER_INDEX = -2;
export const MAX_TIER_INDEX = 2;

// Tempo clamp fractions of the node's base tempo (D-06).
export const BASE_TEMPO_CLAMP_MIN_FRACTION = 0.75;
export const BASE_TEMPO_CLAMP_MAX_FRACTION = 1.25;

// Escalation: N consecutive "success" exercises before stepping up one tier (D-01/D-05).
export const ESCALATE_SUCCESS_STREAK = 2;
// A success exercise: accuracy >= this AND missed-note count <= SUCCESS_MAX_MISSES.
export const SUCCESS_ACCURACY = 90;
export const SUCCESS_MAX_MISSES = 1;
// Easing: interpret D-03's "run of misses" as >= this many missed notes WITHIN one exercise,
// evaluated at the exercise boundary (D-04). One qualifying exercise eases one tier immediately.
export const EASE_MISS_RUN = 3;

// Weak-note targeting (D-09/D-11). A pitch must have >= MASTERY_MIN_ATTEMPTS recorded attempts
// before its accuracy is trusted; below WEAK_ACCURACY_THRESHOLD it gets a weight of
// WEAK_NOTE_WEIGHT (vs. 1 for everyone else) in the per-pitch weight map patternBuilder's
// weighted random pick uses to favor it (see CR-01, 03-REVIEW.md).
export const MASTERY_MIN_ATTEMPTS = 4;
export const WEAK_ACCURACY_THRESHOLD = 75;
export const WEAK_NOTE_WEIGHT = 3;
