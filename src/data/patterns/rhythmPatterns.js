/**
 * Curated rhythm pattern library.
 *
 * CRITICAL: This file must be Node-safe (no VexFlow, React, or browser imports).
 * It is consumed by validateTrail.mjs at build time (Phase 22).
 *
 * Pattern binary arrays use sixteenth-note units:
 *   4/4 -> 16 slots   3/4 -> 12 slots   6/8 -> 12 slots
 *   1 = note onset   0 = sustain/rest
 *
 * Each pattern MUST have:
 *   id: unique string (format: {tag_prefix}_{timesig_slug}_{seq})
 *   timeSignature: '4/4' | '3/4' | '6/8'
 *   tags: string[] from valid taxonomy
 *   measures: 1 (all patterns are single-measure)
 *   pattern: number[] of 0s and 1s, length = measureLength
 *
 * NOTE: Binary arrays cannot distinguish between a rest and note sustain
 * (both are 0). When a binary pattern is valid for multiple tag categories,
 * it appears ONCE with multiple tags (no duplicate binary arrays within
 * the same time signature).
 */

export const RHYTHM_PATTERNS = [
  // ============================================================================
  // QUARTER-ONLY / QUARTER-HALF / QUARTER-HALF-WHOLE (4/4, 16 slots)
  // Patterns using only q (4 slots) and h (8 slots) onsets.
  // Multi-tagged because binary representation is ambiguous between
  // "quarter rest" and "half note sustain".
  // ============================================================================

  // q q q q  (4 quarter notes)
  {
    id: "q_44_001",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // h/q.  q q  (onset beat 1, onset beat 3, onset beat 4)
  {
    id: "q_44_002",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q  h/q.  q  (onset beat 1, onset beat 2, onset beat 4)
  {
    id: "q_44_003",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q  h/q.  (onset beat 1, onset beat 2, onset beat 3)
  {
    id: "q_44_004",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // .  q q q  (onset beats 2, 3, 4)
  {
    id: "q_44_005",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half-whole"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // w/h.  q  (onset beat 1, onset beat 4) -- interpretable as h+.+q or w-sustain variant
  {
    id: "q_44_006",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // .  q . q  (onset beats 2 and 4)
  {
    id: "q_44_007",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // . . q q  (onset beats 3 and 4)
  {
    id: "q_44_008",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half-whole"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // h h  (onset beats 1 and 3)
  {
    id: "qh_44_001",
    timeSignature: "4/4",
    tags: ["quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // . q h  (onset beats 2 and 3)
  {
    id: "qh_44_002",
    timeSignature: "4/4",
    tags: ["quarter-half"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // q h .  (onset beats 1 and 2)
  {
    id: "qh_44_003",
    timeSignature: "4/4",
    tags: ["quarter-half"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // w  (whole note -- single onset, 16 slots sustain)
  {
    id: "qhw_44_001",
    timeSignature: "4/4",
    tags: ["quarter-half", "quarter-half-whole"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // . . . q  (onset only on beat 4)
  {
    id: "qhw_44_002",
    timeSignature: "4/4",
    tags: ["quarter-half-whole"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // . . h  (onset on beat 3 only)
  {
    id: "qhw_44_003",
    timeSignature: "4/4",
    tags: ["quarter-half-whole"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // . q . .  (onset on beat 2 only)
  {
    id: "qhw_44_005",
    timeSignature: "4/4",
    tags: ["quarter-half-whole"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  // ============================================================================
  // QUARTER-EIGHTH (4/4, 16 slots) -- 10 patterns
  // Available durations: q (4 slots), 8th (2 slots)
  // ============================================================================

  // 8 8 8 8 8 8 8 8  (eight eighths = 2*8 = 16)
  {
    id: "qe_44_001",
    timeSignature: "4/4",
    tags: ["quarter-eighth", "quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  // q 8 8 q q  (4+2+2+4+4 = 16)
  {
    id: "qe_44_002",
    timeSignature: "4/4",
    tags: ["quarter-eighth", "quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // 8 8 q q q  (2+2+4+4+4 = 16)
  {
    id: "qe_44_003",
    timeSignature: "4/4",
    tags: ["quarter-eighth", "quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q 8 8 q  (4+4+2+2+4 = 16)
  {
    id: "qe_44_004",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q q q 8 8  (4+4+4+2+2 = 16)
  {
    id: "qe_44_005",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 8 8 q q  (2+2+2+2+4+4 = 16)
  {
    id: "qe_44_006",
    timeSignature: "4/4",
    tags: ["quarter-eighth", "quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q 8 8 8 8  (4+4+2+2+2+2 = 16)
  {
    id: "qe_44_007",
    timeSignature: "4/4",
    tags: ["quarter-eighth", "quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  // 8 8 q 8 8 q  (2+2+4+2+2+4 = 16)
  {
    id: "qe_44_008",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q 8 8 8 8 q  (4+2+2+2+2+4 = 16)
  {
    id: "qe_44_009",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 8 q q 8 8  (2+2+4+4+2+2 = 16)
  {
    id: "qe_44_010",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },

  // ============================================================================
  // QUARTER-HALF-WHOLE-EIGHTH (4/4, 16 slots) -- additional patterns
  // Available durations: q (4), h (8), w (16), 8th (2)
  // (several already covered via multi-tagging on qe_44_* above)
  // ============================================================================

  // h q 8 8  (8+4+2+2 = 16)
  {
    id: "qhwe_44_001",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 h q  (2+2+8+4 = 16)
  {
    id: "qhwe_44_002",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // q 8 8 h  (4+2+2+8 = 16)
  {
    id: "qhwe_44_003",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // h 8 8 q  (8+2+2+4 = 16)
  {
    id: "qhwe_44_004",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 8 q h  (2+2+4+8 = 16)
  {
    id: "qhwe_44_005",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // 8 8 8 8 h  (2+2+2+2+8 = 16)
  {
    id: "qhwe_44_006",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // h 8 8 8 8  (8+2+2+2+2 = 16)
  {
    id: "qhwe_44_007",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  // q h 8 8  (4+8+2+2 = 16)
  {
    id: "qhwe_44_008",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 8 8 8 8 q  (2+2+2+2+2+2+4 = 16)
  {
    id: "qhwe_44_009",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q 8 8 8 8 8 8  (4+2+2+2+2+2+2 = 16)
  {
    id: "qhwe_44_010",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
];
