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
 * it appears ONCE with multiple tags. This is by design -- the same onset
 * pattern [1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0] could represent "h q q" or
 * "q qr q q" depending on rendering context. The game engine (Phase 22)
 * selects appropriate VexFlow rendering based on the node's duration set.
 *
 * D-12 (Phase 33 Plan 33-04): rest-bearing patterns removed from quarter-half tag pool.
 * resolveByTags()'s patternNeedsRests filter is the runtime guard; this is belt-and-suspenders cleanup.
 * Audit date: 2026-05-03. See .planning/phases/33-rhythm-issues-cleanup/33-RESEARCH.md §3 Unit 1.
 * Backlog: quarter-only rest-pool audit deferred to follow-up if UAT issue 2/9 surfaces it system-wide.
 */

export const RHYTHM_PATTERNS = [
  // ============================================================================
  // GROUP 1: QUARTER-BEAT PATTERNS (4/4, 16 slots)
  // Onsets only at quarter-note positions (0, 4, 8, 12).
  // Multi-tagged: quarter-only, quarter-half, quarter-half-whole,
  //   quarter-rest, half-rest, whole-rest, dotted-half
  // (binary can't distinguish q+qr from h, or hd from q+h, etc.)
  // ============================================================================

  // q q q q  -- 4 onsets
  {
    id: "q_44_001",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half", "quarter-half-whole", "dotted-half"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // h/q+qr  q  q  -- 3 onsets (beats 1, 3, 4)
  {
    id: "q_44_002",
    timeSignature: "4/4",
    tags: [
      "quarter-only",
      "quarter-half",
      "quarter-half-whole",
      "quarter-rest",
      "dotted-half",
    ],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q  h/q+qr  q  -- 3 onsets (beats 1, 2, 4)
  {
    id: "q_44_003",
    timeSignature: "4/4",
    tags: [
      "quarter-only",
      "quarter-half",
      "quarter-half-whole",
      "quarter-rest",
      "dotted-half",
    ],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // q  q  h/q+qr  -- 3 onsets (beats 1, 2, 3)
  {
    id: "q_44_004",
    timeSignature: "4/4",
    tags: [
      "quarter-only",
      "quarter-half",
      "quarter-half-whole",
      "quarter-rest",
      "dotted-half",
    ],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // qr  q  q  q  -- 3 onsets (beats 2, 3, 4)
  {
    id: "q_44_005",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half-whole", "quarter-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // hd/h+qr/q+qr+qr  q  -- 2 onsets (beats 1, 4)
  {
    id: "q_44_006",
    timeSignature: "4/4",
    // D-12: removed "quarter-half" — pattern needs rests in [q,h] context (gap 12 between onsets ∉ {4,8})
    tags: [
      "quarter-only",
      "quarter-half-whole",
      "quarter-rest",
      "half-rest",
      "dotted-half",
    ],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // qr  q  qr  q  -- 2 onsets (beats 2, 4)
  {
    id: "q_44_007",
    timeSignature: "4/4",
    // D-12: removed "quarter-half" — pattern has leading rest (first onset at slot 4, not 0)
    tags: ["quarter-only", "quarter-half-whole", "quarter-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // qr+qr/hr  q  q  -- 2 onsets (beats 3, 4)
  {
    id: "q_44_008",
    timeSignature: "4/4",
    tags: ["quarter-only", "quarter-half-whole", "quarter-rest", "half-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // h  h  /  q+qr  q+qr  -- 2 onsets (beats 1, 3)
  {
    id: "qh_44_001",
    timeSignature: "4/4",
    tags: ["quarter-half", "quarter-half-whole", "quarter-rest", "dotted-half"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // qr  q  h  /  qr  q+qr  q  -- 2 onsets (beats 2, 3)
  {
    id: "qh_44_002",
    timeSignature: "4/4",
    // D-12: removed "quarter-half" — pattern has leading rest (first onset at slot 4, not 0)
    tags: ["whole-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // q  h  qr  /  q+qr+qr  q  -- 2 onsets (beats 1, 2)
  {
    id: "qh_44_003",
    timeSignature: "4/4",
    // D-12: removed "quarter-half" — pattern has trailing rest (gap from onset 4 to end = 12 ∉ {4,8})
    tags: ["half-rest", "dotted-half"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // w  /  h+hr  /  q+qr+hr  -- 1 onset (beat 1)
  {
    id: "qhw_44_001",
    timeSignature: "4/4",
    // D-12 audit (Phase 33 Plan 33-04): "quarter-half" tag RETAINED.
    // In [q,h] context (rhythm_1_3) this pattern needs rests, but the runtime
    // patternNeedsRests filter in resolveByTags blocks it. In [q,h,w] context
    // (rhythm_2_4) this pattern is rest-free (single onset → whole note) and
    // is required for whole-note variety. Removing the tag broke the
    // DATA-04 variety test for rhythm_2_4. Belt-and-suspenders cleanup
    // does not apply here — runtime filter is the safety net.
    tags: [
      "quarter-half",
      "quarter-half-whole",
      "half-rest",
      "whole-rest",
      "dotted-half",
    ],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // hr+qr  q  /  qr+qr+qr  q  -- 1 onset (beat 4)
  {
    id: "qhw_44_002",
    timeSignature: "4/4",
    tags: ["quarter-half-whole", "half-rest", "whole-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // hr  h  /  qr+qr  q+qr  -- 1 onset (beat 3)
  {
    id: "qhw_44_003",
    timeSignature: "4/4",
    tags: ["quarter-half-whole", "half-rest", "whole-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // qr  q  qr+qr  -- 1 onset (beat 2)
  {
    id: "qhw_44_004",
    timeSignature: "4/4",
    tags: ["quarter-half-whole", "whole-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  // ============================================================================
  // GROUP 2: EIGHTH-NOTE PATTERNS (4/4, 16 slots)
  // Mix of q (4 slots) and 8th (2 slots). Onsets at even positions.
  // Multi-tagged: quarter-eighth, quarter-half-whole-eighth
  // ============================================================================

  // 8 8 8 8 8 8 8 8  (2*8 = 16)
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
  // GROUP 3: HALF+EIGHTH MIX PATTERNS (4/4, 16 slots)
  // quarter-half-whole-eighth exclusive patterns (use h with 8th notes)
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
    tags: ["quarter-half-whole-eighth", "quarter-rest"],
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
    tags: ["quarter-half-whole-eighth", "quarter-eighth"],
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
    tags: ["quarter-half-whole-eighth", "quarter-rest"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 8 8 8 8 q  (2*6+4 = 16)
  {
    id: "qhwe_44_009",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q 8 8 8 8 8 8  (4+2*6 = 16)
  {
    id: "qhwe_44_010",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },

  // ============================================================================
  // GROUP 4: THREE-FOUR (3/4, 12 slots) -- 8 patterns
  // Available durations: hd (12), q (4), h (8)
  // ============================================================================

  // hd  (dotted half fills entire 3/4 bar = 12)
  {
    id: "tf_34_001",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // q q q  (4+4+4 = 12)
  {
    id: "tf_34_002",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // h q  (8+4 = 12)
  {
    id: "tf_34_003",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // q h  (4+8 = 12)
  {
    id: "tf_34_004",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // qr q q  (rest + q + q = 4+4+4 = 12)
  {
    id: "tf_34_005",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // qr qr q  (rest + rest + q = 4+4+4 = 12)
  {
    id: "tf_34_007",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // ============================================================================
  // GROUP 5: DOTTED-QUARTER / SYNCOPATION / DOTTED-SYNCOPATION (4/4, 16 slots)
  // These share many binary patterns, so they are heavily multi-tagged.
  // qd = 6 slots, 8 = 2 slots. Common pair: qd+8 = 8 slots.
  // Syncopation: 8-q-8 = [..,1,0,1,0,0,0,..] onset on "and"
  // ============================================================================

  // qd 8 qd 8  (6+2+6+2 = 16)
  {
    id: "dq_44_001",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },
  // qd 8 q q  /  q syn(8-q-8) q  (6+2+4+4 = 16)
  {
    id: "dq_44_002",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "syncopation", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q qd 8  (4+4+6+2 = 16)
  {
    id: "dq_44_003",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },
  // q qd 8 q  /  q q syn(8-q-8)  (4+6+2+4 = 16)
  {
    id: "dq_44_004",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "syncopation", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 qd q q  (2+6+4+4 = 16)
  {
    id: "dq_44_005",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "dotted-syncopation", "quarter-rest"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q 8 qd  (4+4+2+6 = 16)
  {
    id: "dq_44_006",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  },
  // qd 8 h  (6+2+8 = 16)
  {
    id: "dq_44_007",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // h qd 8  (8+6+2 = 16)
  {
    id: "dq_44_008",
    timeSignature: "4/4",
    tags: ["dotted-quarter", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },

  // ── Syncopation-only patterns (not matching dotted-quarter shapes) ──

  // syn(8-q-8) q q  (onset on "and" of 1 = pos 2, then beats 2,3,4)
  {
    id: "syn_44_001",
    timeSignature: "4/4",
    tags: ["syncopation", "quarter-eighth"],
    measures: 1,
    pattern: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // syn(8-q-8) syn(8-q-8)  (two syncopated pairs = 8+8 = 16)
  {
    id: "syn_44_002",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // syn(8-q-8) h  (syncopated pair + half = 8+8 = 16)
  {
    id: "syn_44_003",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // h syn(8-q-8)  (half + syncopated pair = 8+8 = 16)
  {
    id: "syn_44_004",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 8 syn(8-q-8) q  (2+2 + 8 + 4 = 16) -- eighths lead into syncopation
  {
    id: "syn_44_005",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q syn(8-q-8) 8 8  (4+8+2+2 = 16)
  {
    id: "syn_44_006",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // q 8 q 8 q  (alternating syncopation: 4+2+4+2+4 = 16)
  {
    id: "syn_44_007",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 q 8 h  (offbeat emphasis: 2+4+2+8 = 16)
  {
    id: "syn_44_008",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  // 8 8 q syn(8-q-8)  (2+2+4+8 = 16) -- straight start into syncopation
  {
    id: "syn_44_009",
    timeSignature: "4/4",
    tags: ["syncopation", "dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // syn(8-q-8) q 8 8  (8+4+2+2 = 16)
  {
    id: "syn_44_010",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },

  // ── Dotted-syncopation-only patterns (unique from dotted-quarter) ──

  // 8 qd qd 8  (2+6+6+2 = 16) -- starts with pickup eighth
  {
    id: "dsyn_44_001",
    timeSignature: "4/4",
    tags: ["dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },
  // qd 8 8 8 q  (6+2+2+2+4 = 16)
  {
    id: "dsyn_44_002",
    timeSignature: "4/4",
    tags: ["dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q 8 8 qd 8  (4+2+2+6+2 = 16)
  {
    id: "dsyn_44_003",
    timeSignature: "4/4",
    tags: ["dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },

  // ============================================================================
  // GROUP 6: SIXTEENTH-NOTE PATTERNS (4/4, 16 slots) -- 8 patterns
  // Available durations: q (4), 8th (2), 16th (1)
  // Sixteenth = 1 slot (a `1` at any position)
  // ============================================================================

  // 16 16 16 16 q q q  (1+1+1+1+4+4+4 = 16)
  {
    id: "sx_44_001",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q 16 16 16 16 q q  (4+1+1+1+1+4+4 = 16)
  {
    id: "sx_44_002",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q 16 16 16 16 q  (4+4+1+1+1+1+4 = 16)
  {
    id: "sx_44_003",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  },
  // q q q 16 16 16 16  (4+4+4+1+1+1+1 = 16)
  {
    id: "sx_44_004",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1],
  },
  // 8 16 16 q q q  (2+1+1+4+4+4 = 16)
  {
    id: "sx_44_005",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q 8 16 16 q  (4+4+2+1+1+4 = 16)
  {
    id: "sx_44_006",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0],
  },
  // 16 16 8 q q q  (1+1+2+4+4+4 = 16)
  {
    id: "sx_44_007",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q 16 16 8 q q  (4+1+1+2+4+4 = 16)
  {
    id: "sx_44_008",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },

  // ============================================================================
  // GROUP 7: SIX-EIGHT (6/8, 12 slots) -- 10 patterns
  // Beat unit = dotted quarter (6 slots). Two beats at pos 0 and 6.
  // 8th notes fall at EVEN positions: 0, 2, 4, 6, 8, 10
  // Available durations: qd (6), q (4), 8th (2)
  // ============================================================================

  // qd qd  (two dotted quarters = 6+6 = 12)
  {
    id: "se_68_001",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  },
  // 8 8 8 8 8 8  (six eighths = 2*6 = 12)
  {
    id: "se_68_002",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  // qd 8 8 8  (6+2+2+2 = 12)
  {
    id: "se_68_003",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  },
  // 8 8 8 qd  (2+2+2+6 = 12)
  {
    id: "se_68_004",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  },
  // q 8 qd  (4+2+6 = 12)
  {
    id: "se_68_005",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  },
  // qd q 8  (6+4+2 = 12)
  {
    id: "se_68_006",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  },
  // 8 q 8 q  (2+4+2+4 = 12)
  {
    id: "se_68_007",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // q 8 q 8  (4+2+4+2 = 12)
  {
    id: "se_68_008",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  },
  // 8 8 8 q 8  (2+2+2+4+2 = 12)
  {
    id: "se_68_009",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  },
  // 8 q 8 8 8  (2+4+2+2+2 = 12)
  {
    id: "se_68_010",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  },

  // ============================================================================
  // GROUP 8: EXTRA PATTERNS to reach 120+ total
  // Additional unique patterns across various tag categories
  // ============================================================================

  // ── Extra quarter-eighth patterns ──

  // q 8 8 q 8 8  (4+2+2+4+2+2 = 16)
  {
    id: "qe_44_012",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },

  // ── Extra six-eight patterns ──

  // . qd 8 8 8  (rest + 6+2+2+2 = 12) -- pickup to beat 2
  {
    id: "se_68_011",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  },
  // 8 8 qd .  (2+2+6+rest = 12) -- early notes only
  {
    id: "se_68_012",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },

  // ── Extra syncopation patterns ──

  // 8 q q q 8  (2+4+4+4+2 = 16) -- pickup and end on offbeat
  {
    id: "syn_44_011",
    timeSignature: "4/4",
    tags: ["syncopation", "quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  },
  // 8 8 8 q 8 q  (2+2+2+4+2+4 = 16) -- offbeat groove
  {
    id: "syn_44_012",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },

  // ── Extra dotted-syncopation patterns ──

  // qd qd 8 8  (6+6+2+2 = 16)
  {
    id: "dsyn_44_004",
    timeSignature: "4/4",
    tags: ["dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 qd qd  (2+2+6+6 = 16) -- but that's only 2+2+6+6=16, need unique
  {
    id: "dsyn_44_005",
    timeSignature: "4/4",
    tags: ["dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  },

  // ── Extra three-four patterns ──

  // 8 8 8 q q  (2+2+2+4+4 -- wait, that's 14 not 12)
  // Actually: 8 8 q q  (2+2+4+4 = 12)
  {
    id: "tf_34_009",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q 8 8 q  (4+2+2+4 = 12)
  {
    id: "tf_34_010",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q q 8 8  (4+4+2+2 = 12)
  {
    id: "tf_34_011",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 8 8 q  (2+2+2+2+4 = 12)
  {
    id: "tf_34_012",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },

  // ── Extra sixteenth patterns ──

  // 16 16 16 16 16 16 16 16 q q  (8*1 + 4 + 4 = 16)
  {
    id: "sx_44_009",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // q q 16 16 8 8  (4+4+1+1+2+2+2 -- wait that's 16? 4+4+1+1+2+2+2=16)
  // Actually: q 16 16 q 8 8  (4+1+1+4+2+2+2 -- no)
  // Let me be precise: q q 16 16 16 16 8  (4+4+1+1+1+1+2+2 = 16) -- too many
  // q 8 16 16 q q  (4+2+1+1+4+4 = 16)
  {
    id: "sx_44_010",
    timeSignature: "4/4",
    tags: ["sixteenth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0],
  },

  // ── Extra dotted-half patterns ──

  // hd 8 8  (12+2+2 = 16) -- dotted half + two eighths
  {
    id: "dhalf_44_001",
    timeSignature: "4/4",
    tags: ["dotted-half", "half-rest"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 hd  (2+2+12 = 16) -- two eighths + dotted half
  {
    id: "dhalf_44_002",
    timeSignature: "4/4",
    tags: ["dotted-half"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },

  // ── Extra quarter-rest patterns (with 8th notes for uniqueness) ──

  // q 8 8 qr q  (4+2+2+4+4 = 16)
  {
    id: "qrest_44_002",
    timeSignature: "4/4",
    tags: ["quarter-rest"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // ── Extra half-rest patterns (with 8th notes for uniqueness) ──

  // 8 8 hr q  (2+2+8+4 = 16)
  {
    id: "hrest_44_001",
    timeSignature: "4/4",
    tags: ["half-rest"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  // ── Extra whole-rest patterns (with 8th notes for uniqueness) ──

  // 8 8 qr hr  (2+2+4+8 = 16)
  {
    id: "wrest_44_001",
    timeSignature: "4/4",
    tags: ["whole-rest"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  // hr 8 8 qr  (8+2+2+4 = 16)
  {
    id: "wrest_44_002",
    timeSignature: "4/4",
    tags: ["whole-rest"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  },

  // ── Extra unique mixed patterns to ensure 120+ ──

  // 8 q 8 q 8 8  (2+4+2+4+2+2 = 16) -- offbeat groove
  {
    id: "qe_44_013",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // h 8 q 8  (8+2+4+2 = 16) -- half + mixed
  {
    id: "qhwe_44_011",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  },
  // 8 h 8 q  (2+8+2+4 = 16)
  {
    id: "qhwe_44_012",
    timeSignature: "4/4",
    tags: ["quarter-half-whole-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 q 8 8 q  (2+4+2+2+4+2 -- that's 16? 2+4+2+2+4=14, need +2)
  // Actually: 8 q 8 8 8 q  (2+4+2+2+2+4 = 16)
  {
    id: "qe_44_015",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q 8 q 8 8 8  (4+2+4+2+2+2 = 16)
  {
    id: "qe_44_016",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  },

  // ── Extra 6/8 patterns ──

  // q q q  (4+4+4 = 12) in 6/8 -- three quarter notes
  {
    id: "se_68_013",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // 8 8 q qd  (2+2+4+4 -- no, qd=6: 2+2+4+6=14, too many)
  // Actually: 8 q qd  (2+4+6 = 12)
  {
    id: "se_68_014",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  },

  // ── Extra dotted-quarter patterns ──

  // qd 8 8 8 8 8  (6+2+2+2+2+2 = 16)
  {
    id: "dq_44_009",
    timeSignature: "4/4",
    tags: ["dotted-quarter"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  // 8 8 8 8 qd 8  (2+2+2+2+6+2 = 16)
  {
    id: "dq_44_010",
    timeSignature: "4/4",
    tags: ["dotted-quarter"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },

  // ── Extra three-four with eighths ──

  // 8 8 8 8 8 8  (2*6 = 12) in 3/4 -- six eighths
  {
    id: "tf_34_013",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  // q 8 8 8 8  (4+2+2+2+2 = 12) in 3/4
  {
    id: "tf_34_014",
    timeSignature: "3/4",
    tags: ["three-four"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },

  // ============================================================================
  // GROUP 9: ADDITIONAL PATTERNS to exceed 120 minimum
  // ============================================================================

  // 8 8 8 q 8 8  (2+2+2+4+2+2+2 -- 2+2+2+4+2+2=14, need 16)
  // Actually: q 8 8 8 8 8 8  already exists (qhwe_44_010)
  // Use: . 8 8 8 8 q q  (rest+2+2+2+2+4+4 = 16)
  {
    id: "qe_44_017",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // . q q 8 8 q  (rest+4+4+2+2+4 = 16)
  {
    id: "qe_44_018",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q . 8 8 q q  (4+rest+2+2+4+4 = 16)
  {
    id: "qe_44_019",
    timeSignature: "4/4",
    tags: ["quarter-eighth"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0],
  },
  // syn(8-q-8) 8 8 q  (8+2+2+4 = 16) -- syncopation into straight
  {
    id: "syn_44_013",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
  },
  // q q syn(8-q-8) -- but check: q=4, q=4, 8-q-8=8 -> [1,0,0,0, 1,0,0,0, 0,0,1,0, 1,0,0,0]
  // Wait that's dq_44_004 binary. Try: . syn(8-q-8) q q  (rest+8+4+4 = 16)
  {
    id: "syn_44_014",
    timeSignature: "4/4",
    tags: ["syncopation"],
    measures: 1,
    pattern: [0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  // qd 8 8 qd  (6+2+2+6 -- wait 6+2+2+6=16? yes 16)
  {
    id: "dsyn_44_006",
    timeSignature: "4/4",
    tags: ["dotted-syncopation", "dotted-quarter"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0],
  },
  // q qd 8 8 8  (4+6+2+2+2 = 16) -- quarter into dotted-quarter swing
  {
    id: "dsyn_44_007",
    timeSignature: "4/4",
    tags: ["dotted-syncopation"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
  },
  // . qd 8 q q  (rest+6+2+4+4 -- 4+6+2+4=16? yes, rest=4 slots)
  {
    id: "dq_44_011",
    timeSignature: "4/4",
    tags: ["dotted-quarter"],
    measures: 1,
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
  },
  // 8 8 8 8 8 8 in 6/8 with rest: . 8 8 qd  (rest+2+2+6+rest -- no)
  // Actually: qd . 8 8  (6+rest+2+2 -- wait, 6+2+2+2=12)
  // qd rest(2) 8 8 = [1,0,0,0,0,0, 0,0, 1,0, 1,0] = 12
  {
    id: "se_68_015",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 q 8 8  (2+2+4+2+2 = 12) in 6/8
  {
    id: "se_68_016",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // q q 8 8  (4+4+2+2 = 12) in 6/8
  {
    id: "se_68_017",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
  },
  // 8 8 q q  (2+2+4+4 = 12) in 6/8
  {
    id: "se_68_018",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    pattern: [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
];
