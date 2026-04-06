/**
 * Rhythm Pattern Library
 *
 * Hand-crafted rhythm patterns organized by duration-set tags, following
 * Kodaly/Orff pedagogical principles and the app's custom duration order:
 * quarter → half → whole → eighth → rests → dotted → sixteenth → compound → syncopation
 *
 * Each pattern is a plain JS object with these fields:
 *   id           — unique string (tag_prefix_NN)
 *   description  — human-readable label
 *   beats        — array of arrays (one inner array per measure)
 *   durationSet  — unique VexFlow durations actually used
 *   tags         — one or more tags from PATTERN_TAGS
 *   timeSignature — '4/4' | '3/4' | '6/8'
 *   difficulty   — 'beginner' | 'intermediate' | 'advanced'
 *   measureCount — integer, equals beats.length
 *
 * VexFlow duration codes:
 *   'q'=4, 'h'=8, 'w'=16, '8'=2, '16'=1
 *   'qd'=6, 'hd'=12
 *   'qr'=4, 'hr'=8, 'wr'=16
 * Measure sums: 4/4=16, 3/4=12, 6/8=12
 */

// ─────────────────────────────────────────────
// PATTERN_TAGS — canonical list of all 15 tags
// ─────────────────────────────────────────────

export const PATTERN_TAGS = Object.freeze([
  'quarter-only',
  'quarter-half',
  'quarter-half-whole',
  'quarter-eighth',
  'with-quarter-rest',
  'with-half-rest',
  'with-whole-rest',
  'dotted-half',
  'dotted-quarter',
  'with-sixteenth',
  'compound-basic',
  'compound-mixed',
  'syncopation-basic',
  'syncopation-dotted',
  'three-four',
]);

// ─────────────────────────────────────────────────────────────────────────────
// TAG: quarter-only
// Unit 1, Node 1-2. Only quarter notes ('q'). No rests.
// Pedagogical rationale: Steady beat is the foundation of all rhythm learning.
// Children must feel the pulse before exploring any duration variety.
// Patterns progress from simple repeated cells to varied groupings across bars.
// ─────────────────────────────────────────────────────────────────────────────

const quarterOnlyPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'quarter_only_01',
    description: 'Four steady quarter notes',
    beats: [['q', 'q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'quarter_only_02',
    description: 'Eight steady quarter notes across two bars',
    beats: [['q', 'q', 'q', 'q'], ['q', 'q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'quarter_only_03',
    description: 'Sixteen steady quarter notes across four bars',
    beats: [
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'quarter_only_04',
    description: 'Four quarter notes — accent pattern emphasis',
    beats: [['q', 'q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'quarter_only_05',
    description: 'Two bars of four quarter notes — practice pulse',
    beats: [['q', 'q', 'q', 'q'], ['q', 'q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'quarter_only_06',
    description: 'Four-bar phrase of steady quarters — tempo challenge',
    beats: [
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'quarter_only_07',
    description: 'Four quarter notes — fast tempo mastery',
    beats: [['q', 'q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'quarter_only_08',
    description: 'Eight quarter notes — sustained precision',
    beats: [['q', 'q', 'q', 'q'], ['q', 'q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'quarter_only_09',
    description: 'Four-bar quarter note phrase — advanced tempo',
    beats: [
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: quarter-half
// Unit 1, Node 3-7. Combines quarter ('q') and half ('h') notes. No rests.
// Pedagogical rationale: The half note introduces duration contrast — the child
// learns that some beats last longer, creating natural phrase shape and breath.
// ─────────────────────────────────────────────────────────────────────────────

const quarterHalfPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'quarter_half_01',
    description: 'Half note then two quarter notes',
    beats: [['h', 'q', 'q']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'quarter_half_02',
    description: 'Two quarter notes then a half note',
    beats: [['q', 'q', 'h']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'quarter_half_03',
    description: 'Half note pattern alternating bars',
    beats: [['h', 'q', 'q'], ['q', 'q', 'h']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'quarter_half_04',
    description: 'Four-bar phrase introducing half notes',
    beats: [
      ['h', 'q', 'q'],
      ['q', 'q', 'h'],
      ['h', 'q', 'q'],
      ['q', 'q', 'h'],
    ],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'quarter_half_05',
    description: 'Quarter-half-quarter (off-center half)',
    beats: [['q', 'h', 'q']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'quarter_half_06',
    description: 'Two halves filling the bar',
    beats: [['h', 'h']],
    durationSet: ['h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'quarter_half_07',
    description: 'Mixed phrase with quarter start',
    beats: [['q', 'q', 'h'], ['h', 'h']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'quarter_half_08',
    description: 'Four-bar phrase with varied half placement',
    beats: [
      ['q', 'q', 'h'],
      ['h', 'q', 'q'],
      ['q', 'h', 'q'],
      ['h', 'h'],
    ],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'quarter_half_09',
    description: 'Quarter-quarter-half at speed',
    beats: [['q', 'q', 'h']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'quarter_half_10',
    description: 'Two-bar phrase with two halves bar',
    beats: [['h', 'q', 'q'], ['h', 'h']],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'quarter_half_11',
    description: 'Four-bar advanced phrase — dense half usage',
    beats: [
      ['h', 'h'],
      ['q', 'q', 'h'],
      ['h', 'h'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: quarter-half-whole
// Unit 2. Adds whole note ('w') to the known duration set. No rests.
// Pedagogical rationale: The whole note teaches the child that a single sound
// can fill an entire measure — a powerful moment of stillness and held breath.
// ─────────────────────────────────────────────────────────────────────────────

const quarterHalfWholePatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'quarter_half_whole_01',
    description: 'Whole note — hold for four beats',
    beats: [['w']],
    durationSet: ['w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'quarter_half_whole_02',
    description: 'Two quarter notes then a whole note',
    beats: [['q', 'q', 'h'], ['w']],
    durationSet: ['q', 'h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 2-bar ---
  {
    id: 'quarter_half_whole_03',
    description: 'Active bar followed by whole note bar',
    beats: [['h', 'q', 'q'], ['w']],
    durationSet: ['q', 'h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'quarter_half_whole_04',
    description: 'Four-bar phrase ending with whole note',
    beats: [
      ['q', 'q', 'h'],
      ['h', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['w'],
    ],
    durationSet: ['q', 'h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'quarter_half_whole_05',
    description: 'Whole note alone in one bar',
    beats: [['w']],
    durationSet: ['w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'quarter_half_whole_06',
    description: 'Whole note bar then active quarter bar',
    beats: [['w'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'quarter_half_whole_07',
    description: 'Phrase alternating whole and active bars',
    beats: [
      ['w'],
      ['q', 'q', 'h'],
      ['w'],
      ['h', 'q', 'q'],
    ],
    durationSet: ['q', 'h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'quarter_half_whole_08',
    description: 'Two halves — smooth two-beat grouping',
    beats: [['h', 'h']],
    durationSet: ['h'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'quarter_half_whole_09',
    description: 'Whole then two-half bar',
    beats: [['w'], ['h', 'h']],
    durationSet: ['h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'quarter_half_whole_10',
    description: 'Four-bar phrase mixing all three durations fluidly',
    beats: [
      ['h', 'h'],
      ['w'],
      ['q', 'q', 'q', 'q'],
      ['w'],
    ],
    durationSet: ['q', 'h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: quarter-eighth
// Unit 3. Adds eighth notes ('8') to the known set. No rests.
// Pedagogical rationale: Eighth notes halve the quarter — the child first
// experiences subdivision. Two eighths feel like "run-ning" paired notes.
// This is a high-frequency tag with 15+ patterns to serve many trail nodes.
// ─────────────────────────────────────────────────────────────────────────────

const quarterEighthPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'quarter_eighth_01',
    description: 'Two eighths then three quarter notes',
    beats: [['8', '8', 'q', 'q', 'q']],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'quarter_eighth_02',
    description: 'Two quarter notes then four eighth notes',
    beats: [['q', 'q', '8', '8', '8', '8']],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'quarter_eighth_03',
    description: 'Two-bar phrase introducing eighth pairs',
    beats: [['8', '8', 'q', 'q', 'q'], ['q', '8', '8', 'q', 'q']],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'quarter_eighth_04',
    description: 'Four-bar eighth-note introduction',
    beats: [
      ['8', '8', 'q', 'q', 'q'],
      ['q', 'q', 'q', '8', '8'],
      ['8', '8', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'quarter_eighth_05',
    description: 'Eighth-quarter-eighth-quarter alternation',
    beats: [['8', '8', '8', '8', 'q', 'q']],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'quarter_eighth_06',
    description: 'Half note and four eighth notes',
    beats: [['h', '8', '8', '8', '8']],
    durationSet: ['h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'quarter_eighth_07',
    description: 'Quarter then six eighth notes then quarter',
    beats: [['q', '8', '8', '8', '8', 'q']],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'quarter_eighth_08',
    description: 'Two-bar phrase with eighth runs',
    beats: [['8', '8', '8', '8', 'h'], ['q', '8', '8', 'q', 'q']],
    durationSet: ['q', 'h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  {
    id: 'quarter_eighth_09',
    description: 'Mixed bar then half bar',
    beats: [['q', 'q', '8', '8', '8', '8'], ['h', 'q', 'q']],
    durationSet: ['q', 'h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'quarter_eighth_10',
    description: 'Four-bar phrase with varied eighth use',
    beats: [
      ['8', '8', 'q', 'h'],
      ['q', '8', '8', 'q', 'q'],
      ['8', '8', '8', '8', 'q', 'q'],
      ['h', 'q', 'q'],
    ],
    durationSet: ['q', 'h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'quarter_eighth_11',
    description: 'Eight consecutive eighth notes',
    beats: [['8', '8', '8', '8', '8', '8', '8', '8']],
    durationSet: ['8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  {
    id: 'quarter_eighth_12',
    description: 'Eighth-run with half note resolution',
    beats: [['8', '8', '8', '8', 'h']],
    durationSet: ['h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'quarter_eighth_13',
    description: 'Dense eighth bar followed by sparse bar',
    beats: [
      ['8', '8', '8', '8', '8', '8', '8', '8'],
      ['h', 'h'],
    ],
    durationSet: ['h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'quarter_eighth_14',
    description: 'Four-bar advanced eighth phrase',
    beats: [
      ['8', '8', '8', '8', 'h'],
      ['8', '8', '8', '8', '8', '8', '8', '8'],
      ['q', '8', '8', 'q', 'q'],
      ['w'],
    ],
    durationSet: ['q', 'h', 'w', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
  {
    id: 'quarter_eighth_15',
    description: 'All-eighth bar then mixed phrase',
    beats: [
      ['8', '8', '8', '8', '8', '8', '8', '8'],
      ['q', 'q', 'q', '8', '8'],
      ['8', '8', '8', '8', 'h'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: with-quarter-rest
// Unit 4, Node 1-2. Adds quarter rest ('qr'). First encounter with rests.
// Pedagogical rationale: Silence is active — counting a rest requires the same
// internal pulse as playing a note. The quarter rest is short enough to feel
// immediate yet long enough to be heard clearly.
// ─────────────────────────────────────────────────────────────────────────────

const withQuarterRestPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'with_quarter_rest_01',
    description: 'Quarter rest on beat 4',
    beats: [['q', 'q', 'q', 'qr']],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'with_quarter_rest_02',
    description: 'Quarter rest on beat 1 (leading silence)',
    beats: [['qr', 'q', 'q', 'q']],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'with_quarter_rest_03',
    description: 'Rest at end of first bar',
    beats: [['q', 'q', 'q', 'qr'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'with_quarter_rest_04',
    description: 'Alternating bars with quarter rest',
    beats: [
      ['q', 'q', 'q', 'qr'],
      ['q', 'q', 'q', 'q'],
      ['q', 'qr', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'with_quarter_rest_05',
    description: 'Two quarter rests in one bar',
    beats: [['q', 'qr', 'q', 'qr']],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'with_quarter_rest_06',
    description: 'Half note then quarter rest then quarter',
    beats: [['h', 'qr', 'q']],
    durationSet: ['q', 'h', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'with_quarter_rest_07',
    description: 'Two bars with rests on different beats',
    beats: [['qr', 'q', 'q', 'q'], ['q', 'q', 'qr', 'q']],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'with_quarter_rest_08',
    description: 'Four bars with moving quarter rest position',
    beats: [
      ['qr', 'q', 'q', 'q'],
      ['q', 'qr', 'q', 'q'],
      ['q', 'q', 'qr', 'q'],
      ['q', 'q', 'q', 'qr'],
    ],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'with_quarter_rest_09',
    description: 'Eighth notes with embedded quarter rest',
    beats: [['8', '8', 'qr', '8', '8', 'q']],
    durationSet: ['q', '8', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'with_quarter_rest_10',
    description: 'Advanced phrase with two rests across bars',
    beats: [['q', 'qr', '8', '8', 'q'], ['h', 'qr', 'q']],
    durationSet: ['q', 'h', '8', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'with_quarter_rest_11',
    description: 'Four-bar advanced rest pattern',
    beats: [
      ['8', '8', 'qr', 'q', 'q'],
      ['q', 'qr', 'q', '8', '8'],
      ['qr', 'q', 'q', 'q'],
      ['h', 'qr', 'q'],
    ],
    durationSet: ['q', 'h', '8', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: with-half-rest
// Unit 4, Node 3-4. Adds half rest ('hr'). D-24: no pure-rest measures.
// Pedagogical rationale: Two beats of silence require internal counting across
// time. The half rest builds patience and inner pulse awareness.
// ─────────────────────────────────────────────────────────────────────────────

const withHalfRestPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'with_half_rest_01',
    description: 'Two quarter notes then half rest',
    beats: [['q', 'q', 'hr']],
    durationSet: ['q', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'with_half_rest_02',
    description: 'Half rest then two quarter notes',
    beats: [['hr', 'q', 'q']],
    durationSet: ['q', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'with_half_rest_03',
    description: 'Active bar then half rest bar',
    beats: [['q', 'q', 'q', 'q'], ['hr', 'q', 'q']],
    durationSet: ['q', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'with_half_rest_04',
    description: 'Four bars alternating activity and half rests',
    beats: [
      ['q', 'q', 'hr'],
      ['q', 'q', 'q', 'q'],
      ['hr', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'with_half_rest_05',
    description: 'Half note then half rest',
    beats: [['h', 'hr']],
    durationSet: ['h', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'with_half_rest_06',
    description: 'Half rest then half note',
    beats: [['hr', 'h']],
    durationSet: ['h', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'with_half_rest_07',
    description: 'Two bars — rest shifts position',
    beats: [['q', 'q', 'hr'], ['hr', 'h']],
    durationSet: ['q', 'h', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'with_half_rest_08',
    description: 'Four-bar phrase with half rest variety',
    beats: [
      ['hr', 'q', 'q'],
      ['h', 'hr'],
      ['q', 'q', 'hr'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'with_half_rest_09',
    description: 'Eighth notes then half rest',
    beats: [['8', '8', '8', '8', 'hr']],
    durationSet: ['8', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'with_half_rest_10',
    description: 'Advanced two-bar with eighth runs and half rest',
    beats: [['8', '8', 'q', 'hr'], ['hr', '8', '8', 'q']],
    durationSet: ['q', '8', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'with_half_rest_11',
    description: 'Four-bar advanced phrase with varied rests',
    beats: [
      ['8', '8', '8', '8', 'hr'],
      ['hr', 'q', 'q'],
      ['h', 'hr'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', '8', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: with-whole-rest
// Unit 4, Node 5-7. Adds whole rest ('wr'). D-24: no pure-rest measures.
// Pedagogical rationale: A whole-measure rest tests the child's ability to
// count silently through an entire bar. The skill is continuity of pulse.
// For 1-bar patterns: use 'qr'/'hr' combinations (cumulative tag includes those).
// 'wr' appears in 2-bar and 4-bar patterns where one measure is all silence.
// ─────────────────────────────────────────────────────────────────────────────

const withWholeRestPatterns = [
  // --- Beginner 1-bar (cannot use wr alone — use smaller rests, cumulative tag) ---
  {
    id: 'with_whole_rest_01',
    description: 'Half rest then two quarter notes (cumulative rest pattern)',
    beats: [['hr', 'q', 'q']],
    durationSet: ['q', 'hr'],
    tags: ['with-whole-rest', 'with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar (first real 'wr' pattern) ---
  {
    id: 'with_whole_rest_02',
    description: 'Active bar followed by whole rest bar',
    beats: [['q', 'q', 'q', 'q'], ['wr']],
    durationSet: ['q', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  {
    id: 'with_whole_rest_03',
    description: 'Whole rest bar then active bar',
    beats: [['wr'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'with_whole_rest_04',
    description: 'Active bars with a whole rest in bar 3',
    beats: [
      ['q', 'q', 'q', 'q'],
      ['h', 'q', 'q'],
      ['wr'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'with_whole_rest_05',
    description: 'Half then two quarter rests (all rests known, cumulative)',
    beats: [['h', 'qr', 'qr']],
    durationSet: ['h', 'qr'],
    tags: ['with-whole-rest', 'with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'with_whole_rest_06',
    description: 'Half note bar then whole rest bar',
    beats: [['h', 'q', 'q'], ['wr']],
    durationSet: ['q', 'h', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'with_whole_rest_07',
    description: 'Four bars with two whole rests',
    beats: [
      ['q', 'q', 'q', 'q'],
      ['wr'],
      ['h', 'q', 'q'],
      ['wr'],
    ],
    durationSet: ['q', 'h', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'with_whole_rest_08',
    description: 'Advanced rest combination: quarter + half rest',
    beats: [['q', 'qr', 'hr']],
    durationSet: ['q', 'qr', 'hr'],
    tags: ['with-whole-rest', 'with-quarter-rest', 'with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'with_whole_rest_09',
    description: 'Dense bar then whole rest',
    beats: [['8', '8', '8', '8', '8', '8', '8', '8'], ['wr']],
    durationSet: ['8', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'with_whole_rest_10',
    description: 'Four bars — two whole rests flanked by activity',
    beats: [
      ['wr'],
      ['8', '8', 'q', 'h'],
      ['wr'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', '8', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: dotted-half
// Unit 5, Node 1-2. Adds dotted half note ('hd'=12 sixteenths). 4/4 time.
// In 4/4: 'hd' (12) + 'q' (4) = 16. This is the canonical 1-bar pattern.
// Pedagogical rationale: The dotted half forces children to feel three beats —
// linking the concept of "dots add half" to the physical experience of waiting.
// ─────────────────────────────────────────────────────────────────────────────

const dottedHalfPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'dotted_half_01',
    description: 'Dotted half then quarter',
    beats: [['hd', 'q']],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'dotted_half_02',
    description: 'Quarter then dotted half',
    beats: [['q', 'hd']],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'dotted_half_03',
    description: 'Dotted half bar then active bar',
    beats: [['hd', 'q'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'dotted_half_04',
    description: 'Four bars alternating dotted half and quarters',
    beats: [
      ['hd', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'hd'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'dotted_half_05',
    description: 'Dotted half then quarter rest',
    beats: [['hd', 'qr']],
    durationSet: ['hd', 'qr'],
    tags: ['dotted-half', 'with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'dotted_half_06',
    description: 'Two dotted-half bars',
    beats: [['hd', 'q'], ['q', 'hd']],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'dotted_half_07',
    description: 'Four-bar phrase with dotted half in each bar',
    beats: [
      ['hd', 'q'],
      ['q', 'hd'],
      ['hd', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'dotted_half_08',
    description: 'Dotted half with quarter rest variation',
    beats: [['q', 'hd']],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'dotted_half_09',
    description: 'Dotted half bars with eighth pickup',
    beats: [['8', '8', 'hd'], ['q', 'hd']],
    durationSet: ['q', 'hd', '8'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'dotted_half_10',
    description: 'Four-bar advanced dotted-half phrase',
    beats: [
      ['hd', 'q'],
      ['8', '8', '8', '8', 'h'],
      ['q', 'hd'],
      ['h', 'h'],
    ],
    durationSet: ['q', 'h', 'hd', '8'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: dotted-quarter
// Unit 5, Node 4-5. Adds dotted quarter ('qd'=6) + eighth ('8'=2).
// The dotted-quarter always pairs with an eighth: qd(6) + 8(2) = 8 (one beat grouping).
// Example 4/4 bar: qd(6)+8(2)+q(4)+q(4) = 16.
// Pedagogical rationale: The dotted quarter creates a "long-short" lilt.
// This feeling is the basis of march rhythms and folk melodies.
// ─────────────────────────────────────────────────────────────────────────────

const dottedQuarterPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'dotted_quarter_01',
    description: 'Dotted-quarter eighth then two quarter notes',
    beats: [['qd', '8', 'q', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'dotted_quarter_02',
    description: 'Two quarters then dotted-quarter eighth',
    beats: [['q', 'q', 'qd', '8']],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'dotted_quarter_03',
    description: 'Dotted-quarter cell in first bar',
    beats: [['qd', '8', 'q', 'q'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'dotted_quarter_04',
    description: 'Four bars introducing dotted-quarter lilt',
    beats: [
      ['qd', '8', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'qd', '8'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'dotted_quarter_05',
    description: 'Two dotted-quarter pairs in one bar',
    beats: [['qd', '8', 'qd', '8']],
    durationSet: ['qd', '8'],
    tags: ['dotted-quarter', 'syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'dotted_quarter_06',
    description: 'Half note then dotted-quarter eighth',
    beats: [['h', 'qd', '8']],
    durationSet: ['h', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'dotted_quarter_07',
    description: 'Two bars both using dotted-quarter cell',
    beats: [['qd', '8', 'h'], ['h', 'qd', '8']],
    durationSet: ['h', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'dotted_quarter_08',
    description: 'Four bars with dotted-quarter patterns',
    beats: [
      ['qd', '8', 'q', 'q'],
      ['h', 'qd', '8'],
      ['qd', '8', 'qd', '8'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'dotted_quarter_09',
    description: 'Dotted-quarter pair then two eighths then quarter',
    beats: [['qd', '8', '8', '8', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'dotted_quarter_10',
    description: 'Advanced two bars with dense eighth integration',
    beats: [['qd', '8', '8', '8', 'q'], ['q', 'qd', '8', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'dotted_quarter_11',
    description: 'Four-bar advanced dotted-quarter phrase',
    beats: [
      ['qd', '8', '8', '8', 'q'],
      ['qd', '8', 'qd', '8'],
      ['8', '8', '8', '8', 'qd', '8'],
      ['q', 'q', 'h'],
    ],
    durationSet: ['q', 'h', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: with-sixteenth
// Unit 6. Adds sixteenth notes ('16'=1 sixteenth unit). 4/4 only.
// Example bar: 16+16+8+q+h = 1+1+2+4+8 = 16.
// Pedagogical rationale: Four sixteenths to a beat is the next subdivision.
// Children feel "digi-digi" as a fast double-subdivision within one beat.
// ─────────────────────────────────────────────────────────────────────────────

const withSixteenthPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'with_sixteenth_01',
    description: 'Four sixteenth notes then three quarter notes',
    // 16×4=4, q×3=12, total=16
    beats: [['16', '16', '16', '16', 'q', 'q', 'q']],
    durationSet: ['q', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'with_sixteenth_02',
    description: 'Quarter then two eighths then four sixteenths then quarter',
    // q=4, 8+8=4, 16×4=4, q=4, total=16
    beats: [['q', '8', '8', '16', '16', '16', '16', 'q']],
    durationSet: ['q', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'with_sixteenth_03',
    description: 'Sixteenth introduction in first bar',
    beats: [
      ['16', '16', '16', '16', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'with_sixteenth_04',
    description: 'Four bars with sixteenth group in bar 1',
    beats: [
      // 16×4=4, q=4, h=8, total=16
      ['16', '16', '16', '16', 'q', 'h'],
      ['q', 'q', 'q', 'q'],
      // q+q=8, 8+8=4, 16×4=4, total=16
      ['q', 'q', '8', '8', '16', '16', '16', '16'],
      ['h', 'h'],
    ],
    durationSet: ['q', 'h', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'with_sixteenth_05',
    description: 'Half note then eight sixteenth notes',
    // h=8, 16×8=8, total=16
    beats: [['h', '16', '16', '16', '16', '16', '16', '16', '16']],
    durationSet: ['h', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'with_sixteenth_06',
    description: 'Sixteenth-eighth alternation',
    // 16+16+8=4, 16+16+8=4, q+q=8, total=16
    beats: [['16', '16', '8', '16', '16', '8', 'q', 'q']],
    durationSet: ['q', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'with_sixteenth_07',
    description: 'Two-bar phrase with sixteenth runs',
    beats: [
      // 16×4=4, 8+8=4, q+q=8, total=16
      ['16', '16', '16', '16', '8', '8', 'q', 'q'],
      // q+q+q=12, 16+16+16+16=4, total=16
      ['q', 'q', 'q', '16', '16', '16', '16'],
    ],
    durationSet: ['q', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'with_sixteenth_08',
    description: 'Four-bar phrase with moving sixteenth groups',
    beats: [
      // q+q=8, 16×4=4, q=4, total=16
      ['q', 'q', '16', '16', '16', '16', 'q'],
      // q+q+q=12, 16×4=4, total=16
      ['q', 'q', 'q', '16', '16', '16', '16'],
      // 16×8=8, h=8, total=16
      ['16', '16', '16', '16', '16', '16', '16', '16', 'h'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'h', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'with_sixteenth_09',
    description: 'Sixteen consecutive sixteenth notes',
    // 16×16=16, total=16
    beats: [['16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16']],
    durationSet: ['16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'with_sixteenth_10',
    description: 'Dense sixteenth bar then sparse resolution',
    beats: [
      // 16×8=8, 8+8=4, q=4, total=16
      ['16', '16', '16', '16', '16', '16', '16', '16', '8', '8', 'q'],
      ['h', 'h'],
    ],
    durationSet: ['h', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'with_sixteenth_11',
    description: 'Four-bar advanced sixteenth phrase',
    beats: [
      // 16×4=4, 8+8=4, q+q=8, total=16
      ['16', '16', '16', '16', '8', '8', 'q', 'q'],
      // q+q=8, 16×4=4, 8=2, q=4... 8+4+2+2=16 ✓
      ['q', 'q', '16', '16', '8', 'q'],
      // 16×12=12, 8+8=4, total=16
      ['16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '16', '8', '8'],
      ['h', 'h'],
    ],
    durationSet: ['q', 'h', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: compound-basic
// Unit 7. 6/8 time. Uses ONLY dotted quarter ('qd'=6).
// Each 6/8 measure = 12 sixteenth units. Pattern: ['qd','qd'] = 6+6=12.
// Pedagogical rationale: Compound time groups into two dotted-quarter beats.
// The "ONE-and-a-TWO-and-a" feel is fundamentally different from simple time.
// Begin with the most basic cell so children internalize the new meter first.
// ─────────────────────────────────────────────────────────────────────────────

const compoundBasicPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'compound_basic_01',
    description: 'Two dotted quarter notes — basic 6/8 pulse',
    beats: [['qd', 'qd']],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'compound_basic_02',
    description: 'Two bars of basic 6/8 pulse',
    beats: [['qd', 'qd'], ['qd', 'qd']],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'compound_basic_03',
    description: 'Four bars of steady 6/8 dotted-quarter pulse',
    beats: [
      ['qd', 'qd'],
      ['qd', 'qd'],
      ['qd', 'qd'],
      ['qd', 'qd'],
    ],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'compound_basic_04',
    description: 'Basic 6/8 pulse — intermediate tempo',
    beats: [['qd', 'qd']],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'compound_basic_05',
    description: 'Two bars of 6/8 compound pulse at moderate tempo',
    beats: [['qd', 'qd'], ['qd', 'qd']],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'compound_basic_06',
    description: 'Four-bar 6/8 phrase — sustaining compound meter',
    beats: [
      ['qd', 'qd'],
      ['qd', 'qd'],
      ['qd', 'qd'],
      ['qd', 'qd'],
    ],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'compound_basic_07',
    description: 'Fast 6/8 dotted-quarter pattern',
    beats: [['qd', 'qd']],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'compound_basic_08',
    description: 'Two-bar fast compound pulse',
    beats: [['qd', 'qd'], ['qd', 'qd']],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'compound_basic_09',
    description: 'Four-bar compound basic — advanced tempo',
    beats: [
      ['qd', 'qd'],
      ['qd', 'qd'],
      ['qd', 'qd'],
      ['qd', 'qd'],
    ],
    durationSet: ['qd'],
    tags: ['compound-basic'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: compound-mixed
// Unit 7. 6/8 time. Uses 'qd', 'q', and '8'.
// Each 6/8 bar = 12 units. q(4)+8(2)+qd(6)=12; '8'×6=12; qd(6)+'8'×3=12; etc.
// Pedagogical rationale: After feeling the pure compound pulse, children learn
// to subdivide each dotted-quarter beat into its three-eighth-note components,
// creating the characteristic "ONE-and-a" compound subdivision.
// ─────────────────────────────────────────────────────────────────────────────

const compoundMixedPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'compound_mixed_01',
    description: 'Three quarter notes in 6/8 — fills the bar',
    beats: [['q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'compound_mixed_02',
    description: 'Dotted quarter then three eighth notes',
    beats: [['qd', '8', '8', '8']],
    durationSet: ['qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'compound_mixed_03',
    description: 'Mixed 6/8 pattern over two bars',
    beats: [['qd', '8', '8', '8'], ['q', '8', 'qd']],
    durationSet: ['q', 'qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'compound_mixed_04',
    description: 'Four-bar 6/8 phrase with eighth subdivisions',
    beats: [
      ['qd', '8', '8', '8'],
      ['q', 'q', 'q'],
      ['8', '8', '8', 'qd'],
      ['qd', 'qd'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'compound_mixed_05',
    description: 'Six eighth notes — full subdivision of 6/8',
    beats: [['8', '8', '8', '8', '8', '8']],
    durationSet: ['8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'compound_mixed_06',
    description: 'Quarter then eighth then dotted quarter',
    beats: [['q', '8', 'qd']],
    durationSet: ['q', 'qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'compound_mixed_07',
    description: 'Two-bar 6/8 with eighth groups',
    beats: [['8', '8', '8', 'qd'], ['qd', '8', '8', '8']],
    durationSet: ['qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'compound_mixed_08',
    description: 'Four-bar 6/8 with varied eighth-dotted mix',
    beats: [
      ['8', '8', '8', 'qd'],
      ['q', '8', 'qd'],
      ['8', '8', '8', '8', '8', '8'],
      ['qd', 'qd'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'compound_mixed_09',
    description: 'Advanced 6/8 bar — off-beat eighth grouping',
    // q=4, 8=2, q=4, 8=2, total=12
    beats: [['q', '8', 'q', '8']],
    durationSet: ['q', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'compound_mixed_10',
    description: 'Two-bar advanced 6/8 with varied density',
    beats: [
      ['8', '8', '8', '8', '8', '8'],
      ['qd', '8', '8', '8'],
    ],
    durationSet: ['qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'compound_mixed_11',
    description: 'Four-bar advanced 6/8 compound phrase',
    beats: [
      ['8', '8', '8', 'qd'],
      ['8', '8', '8', '8', '8', '8'],
      ['q', '8', 'qd'],
      ['qd', '8', '8', '8'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: syncopation-basic
// Unit 8. 4/4 time. Off-beat emphasis using '8' and 'q'.
// The syncopated cell is eighth-quarter-eighth: note starts on "the and."
// Example: 8(2)+q(4)+8(2)+q(4)+q(4)=16.
// Pedagogical rationale: Syncopation means the accent falls where you don't
// expect it — on the off-beat. This is a key rhythmic skill for all music.
// ─────────────────────────────────────────────────────────────────────────────

const syncopationBasicPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'syncopation_basic_01',
    description: 'Eighth-quarter-eighth syncopated cell then quarter',
    beats: [['8', 'q', '8', 'q', 'q']],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'syncopation_basic_02',
    description: 'Quarter then eighth-quarter-eighth syncopated cell',
    beats: [['q', '8', 'q', '8', 'q']],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'syncopation_basic_03',
    description: 'Syncopated cell in first bar, steady in second',
    beats: [['8', 'q', '8', 'q', 'q'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'syncopation_basic_04',
    description: 'Four bars with syncopated cells and steady bars',
    beats: [
      ['8', 'q', '8', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
      ['q', '8', 'q', '8', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'syncopation_basic_05',
    description: 'Two syncopated cells filling one bar',
    beats: [['8', 'q', '8', '8', 'q', '8']],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'syncopation_basic_06',
    description: 'Half-note then syncopated cell',
    beats: [['h', '8', 'q', '8']],
    durationSet: ['h', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'syncopation_basic_07',
    description: 'Two bars of syncopated patterns',
    beats: [['8', 'q', '8', 'q', 'q'], ['q', '8', 'q', '8', 'q']],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'syncopation_basic_08',
    description: 'Four-bar syncopation pattern',
    beats: [
      ['8', 'q', '8', 'q', 'q'],
      ['q', '8', 'q', '8', 'q'],
      ['8', 'q', '8', '8', 'q', '8'],
      ['h', 'q', 'q'],
    ],
    durationSet: ['q', 'h', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'syncopation_basic_09',
    description: 'Dense syncopated bar with multiple off-beats',
    beats: [['8', 'q', '8', 'q', '8', '8']],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'syncopation_basic_10',
    description: 'Advanced two-bar syncopated phrase',
    beats: [
      ['8', 'q', '8', '8', 'q', '8'],
      ['q', '8', 'q', '8', 'q'],
    ],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'syncopation_basic_11',
    description: 'Four-bar advanced syncopation phrase',
    beats: [
      ['8', 'q', '8', '8', 'q', '8'],
      ['q', '8', 'q', '8', 'q'],
      ['8', '8', 'q', '8', 'q', '8'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: syncopation-dotted
// Unit 8. 4/4 time. Dotted syncopation using 'qd' and '8'.
// The cell qd(6)+8(2) creates a "long-short" syncopated feel.
// Example: qd(6)+8(2)+qd(6)+8(2)=16. Also shares patterns with dotted-quarter.
// Pedagogical rationale: The dotted-quarter syncopated lilt is the signature
// of march, folk, and swing styles. It feels "bouncy" and deeply musical.
// ─────────────────────────────────────────────────────────────────────────────

const syncopationDottedPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'syncopation_dotted_01',
    description: 'Two dotted-quarter eighth pairs — basic dotted syncopation',
    beats: [['qd', '8', 'qd', '8']],
    durationSet: ['qd', '8'],
    tags: ['syncopation-dotted', 'dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'syncopation_dotted_02',
    description: 'Dotted-quarter eighth then two quarters',
    beats: [['qd', '8', 'q', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['syncopation-dotted', 'dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'syncopation_dotted_03',
    description: 'Two bars of dotted syncopation',
    beats: [['qd', '8', 'qd', '8'], ['q', 'q', 'q', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'syncopation_dotted_04',
    description: 'Four bars with dotted syncopation alternating',
    beats: [
      ['qd', '8', 'qd', '8'],
      ['q', 'q', 'q', 'q'],
      ['qd', '8', 'q', 'q'],
      // q=4, q=4, qd=6, 8=2 → 16 ✓
      ['q', 'q', 'qd', '8'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'syncopation_dotted_05',
    description: 'Dotted syncopation with half-note resolution',
    beats: [['qd', '8', 'h']],
    durationSet: ['h', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'syncopation_dotted_06',
    description: 'Eighth then dotted-quarter eighth then quarter',
    beats: [['8', 'qd', '8', '8', 'q']],
    durationSet: ['q', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'syncopation_dotted_07',
    description: 'Two-bar dotted syncopation phrase',
    // bar1: qd=6, 8=2, h=8 → 16 ✓  bar2: qd=6, 8=2, qd=6, 8=2 → 16 ✓
    beats: [['qd', '8', 'h'], ['qd', '8', 'qd', '8']],
    durationSet: ['h', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'syncopation_dotted_08',
    description: 'Four-bar phrase with dotted lilt throughout',
    beats: [
      ['qd', '8', 'qd', '8'],
      ['h', 'qd', '8'],
      ['qd', '8', 'q', 'q'],
      ['q', 'q', 'h'],
    ],
    durationSet: ['q', 'h', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'syncopation_dotted_09',
    description: 'Double dotted-quarter pair — dense dotted syncopation',
    // qd=6, 8=2, qd=6, 8=2 → 16 ✓
    beats: [['qd', '8', 'qd', '8']],
    durationSet: ['qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'syncopation_dotted_10',
    description: 'Advanced two-bar dotted syncopation',
    // bar1: qd=6, 8=2, qd=6, 8=2 → 16 ✓  bar2: qd=6, 8=2, q=4, q=4 → 16 ✓
    beats: [
      ['qd', '8', 'qd', '8'],
      ['qd', '8', 'q', 'q'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'syncopation_dotted_11',
    description: 'Four-bar advanced dotted syncopation phrase',
    // bar1: 16 ✓  bar2: qd=6,8=2,qd=6,8=2 → 16 ✓  bar3: qd=6,8=2,q=4,q=4 → 16 ✓  bar4: 16 ✓
    beats: [
      ['qd', '8', 'qd', '8'],
      ['qd', '8', 'qd', '8'],
      ['qd', '8', 'q', 'q'],
      ['h', 'qd', '8'],
    ],
    durationSet: ['q', 'h', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TAG: three-four
// Unit 5, Node 3. Exclusively 3/4 time. Each bar = 12 sixteenth units.
// Uses 'q'(4), 'h'(8), 'hd'(12). NOT combined with 4/4 cumulative tags (D-26).
// Example 1-bar patterns: ['q','q','q']=12, ['h','q']=12, ['hd']=12.
// Pedagogical rationale: Waltz time has a distinctive "ONE-two-three" feel.
// The strong downbeat and weak beats 2-3 create a swaying, lilting sensation.
// ─────────────────────────────────────────────────────────────────────────────

const threeFourPatterns = [
  // --- Beginner 1-bar ---
  {
    id: 'three_four_01',
    description: 'Three steady quarter notes — basic waltz',
    beats: [['q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  {
    id: 'three_four_02',
    description: 'Half note then quarter note',
    beats: [['h', 'q']],
    durationSet: ['q', 'h'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'beginner',
    measureCount: 1,
  },
  // --- Beginner 2-bar ---
  {
    id: 'three_four_03',
    description: 'Two bars of three quarter notes',
    beats: [['q', 'q', 'q'], ['q', 'q', 'q']],
    durationSet: ['q'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  {
    id: 'three_four_04',
    description: 'Half-quarter bar followed by quarter-quarter-quarter bar',
    beats: [['h', 'q'], ['q', 'q', 'q']],
    durationSet: ['q', 'h'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
  // --- Beginner 4-bar ---
  {
    id: 'three_four_05',
    description: 'Four-bar waltz phrase with simple durations',
    beats: [
      ['q', 'q', 'q'],
      ['h', 'q'],
      ['q', 'q', 'q'],
      ['h', 'q'],
    ],
    durationSet: ['q', 'h'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
  // --- Intermediate 1-bar ---
  {
    id: 'three_four_06',
    description: 'Dotted half note — hold for three beats',
    beats: [['hd']],
    durationSet: ['hd'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  {
    id: 'three_four_07',
    description: 'Quarter then half in 3/4',
    beats: [['q', 'h']],
    durationSet: ['q', 'h'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'intermediate',
    measureCount: 1,
  },
  // --- Intermediate 2-bar ---
  {
    id: 'three_four_08',
    description: 'Dotted half then three quarters',
    beats: [['hd'], ['q', 'q', 'q']],
    durationSet: ['q', 'hd'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'intermediate',
    measureCount: 2,
  },
  // --- Intermediate 4-bar ---
  {
    id: 'three_four_09',
    description: 'Four-bar 3/4 phrase with dotted half resolution',
    beats: [
      ['q', 'q', 'q'],
      ['h', 'q'],
      ['q', 'h'],
      ['hd'],
    ],
    durationSet: ['q', 'h', 'hd'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  // --- Advanced 1-bar ---
  {
    id: 'three_four_10',
    description: 'Quarter half in 3/4 at speed',
    beats: [['q', 'h']],
    durationSet: ['q', 'h'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'advanced',
    measureCount: 1,
  },
  // --- Advanced 2-bar ---
  {
    id: 'three_four_11',
    description: 'Dotted half then active 3/4 bar',
    beats: [['hd'], ['q', 'q', 'q']],
    durationSet: ['q', 'hd'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
  // --- Advanced 4-bar ---
  {
    id: 'three_four_12',
    description: 'Four-bar advanced waltz phrase with dotted halves',
    beats: [
      ['hd'],
      ['q', 'q', 'q'],
      ['hd'],
      ['h', 'q'],
    ],
    durationSet: ['q', 'h', 'hd'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL PATTERNS — bonus variety patterns to reach 130+ total
// Mixed-difficulty extra patterns for high-demand tags
// ─────────────────────────────────────────────────────────────────────────────

const extraQuarterHalfPatterns = [
  {
    id: 'quarter_half_12',
    description: 'Four-bar with all half-note bars',
    beats: [
      ['h', 'h'],
      ['h', 'h'],
      ['q', 'q', 'h'],
      ['h', 'h'],
    ],
    durationSet: ['q', 'h'],
    tags: ['quarter-half'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

const extraQuarterEighthPatterns = [
  {
    id: 'quarter_eighth_16',
    description: 'Four-bar with eighth groups in each bar',
    beats: [
      // 8+8+q+q+8+8 = 2+2+4+4+2+2 = 16 ✓
      ['8', '8', 'q', 'q', '8', '8'],
      // q+8+8+q+q = 4+2+2+4+4 = 16 ✓
      ['q', '8', '8', 'q', 'q'],
      // 8×4+q+q = 8+8 = 16 ✓
      ['8', '8', '8', '8', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
  {
    id: 'quarter_eighth_17',
    description: 'Eighth-pairs creating driving pulse',
    beats: [
      ['8', '8', '8', '8', '8', '8', '8', '8'],
      // q+q+q+8+8 = 4+4+4+2+2 = 16 ✓
      ['q', 'q', 'q', '8', '8'],
    ],
    durationSet: ['q', '8'],
    tags: ['quarter-eighth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
];

const extraWithQuarterRestPatterns = [
  {
    id: 'with_quarter_rest_12',
    description: 'Three bars with rests, final active bar',
    beats: [
      ['q', 'qr', 'q', 'q'],
      ['q', 'q', 'q', 'qr'],
      ['qr', 'q', 'qr', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'qr'],
    tags: ['with-quarter-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

const extraWithHalfRestPatterns = [
  {
    id: 'with_half_rest_12',
    description: 'Four-bar with half rest in every bar',
    beats: [
      ['hr', 'q', 'q'],
      ['q', 'q', 'hr'],
      ['h', 'hr'],
      ['hr', 'h'],
    ],
    durationSet: ['q', 'h', 'hr'],
    tags: ['with-half-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

const extraDottedQuarterPatterns = [
  {
    id: 'dotted_quarter_12',
    description: 'Four bars alternating dotted-quarter and plain quarters',
    beats: [
      ['qd', '8', 'q', 'q'],
      ['q', 'q', 'qd', '8'],
      ['qd', '8', 'qd', '8'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['dotted-quarter'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
];

const extraCompoundMixedPatterns = [
  {
    id: 'compound_mixed_12',
    description: 'Four-bar 6/8 with maximum subdivision contrast',
    beats: [
      ['8', '8', '8', '8', '8', '8'],
      ['qd', 'qd'],
      ['q', '8', 'qd'],
      ['8', '8', '8', 'qd'],
    ],
    durationSet: ['q', 'qd', '8'],
    tags: ['compound-mixed'],
    timeSignature: '6/8',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

const extraSyncopationBasicPatterns = [
  {
    id: 'syncopation_basic_12',
    description: 'Four bars of continuous syncopation',
    beats: [
      ['8', 'q', '8', 'q', 'q'],
      ['q', '8', 'q', '8', 'q'],
      ['8', '8', 'q', '8', 'q', '8'],
      ['h', '8', 'q', '8'],
    ],
    durationSet: ['q', 'h', '8'],
    tags: ['syncopation-basic'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

const extraSyncopationDottedPatterns = [
  {
    id: 'syncopation_dotted_12',
    description: 'Four-bar phrase with dotted lilt in every bar',
    beats: [
      ['qd', '8', 'qd', '8'],
      ['qd', '8', 'h'],
      ['h', 'qd', '8'],
      ['qd', '8', 'qd', '8'],
    ],
    durationSet: ['h', 'qd', '8'],
    tags: ['syncopation-dotted'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

const extraQuarterOnlyPatterns = [
  {
    id: 'quarter_only_10',
    description: 'Quarter note phrase for sight-reading drill',
    beats: [
      ['q', 'q', 'q', 'q'],
      ['q', 'q', 'q', 'q'],
    ],
    durationSet: ['q'],
    tags: ['quarter-only'],
    timeSignature: '4/4',
    difficulty: 'beginner',
    measureCount: 2,
  },
];

const extraQuarterHalfWholePatterns = [
  {
    id: 'quarter_half_whole_11',
    description: 'Whole note sequence with quarter fills',
    beats: [
      ['w'],
      ['q', 'q', 'q', 'q'],
      ['w'],
      ['h', 'h'],
    ],
    durationSet: ['q', 'h', 'w'],
    tags: ['quarter-half-whole'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
];

const extraThreeFourPatterns = [
  {
    id: 'three_four_13',
    description: 'Four-bar waltz with quarter-only bars',
    beats: [
      ['q', 'q', 'q'],
      ['q', 'q', 'q'],
      ['h', 'q'],
      ['hd'],
    ],
    durationSet: ['q', 'h', 'hd'],
    tags: ['three-four'],
    timeSignature: '3/4',
    difficulty: 'beginner',
    measureCount: 4,
  },
];

const extraWithSixteenthPatterns = [
  {
    id: 'with_sixteenth_12',
    description: 'Advanced sixteenth-with-dotted-quarter mix',
    beats: [
      // 16×8=8, qd=6, 8=2 → 16 ✓
      ['16', '16', '16', '16', '16', '16', '16', '16', 'qd', '8'],
      // qd=6, 8=2, 16×8=8 → 16 ✓
      ['qd', '8', '16', '16', '16', '16', '16', '16', '16', '16'],
    ],
    durationSet: ['qd', '8', '16'],
    tags: ['with-sixteenth'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 2,
  },
];

const extraDottedHalfPatterns = [
  {
    id: 'dotted_half_11',
    description: 'Four dotted-half bars for sustained phrase',
    beats: [
      ['hd', 'q'],
      ['hd', 'q'],
      ['q', 'hd'],
      ['hd', 'q'],
    ],
    durationSet: ['q', 'hd'],
    tags: ['dotted-half'],
    timeSignature: '4/4',
    difficulty: 'intermediate',
    measureCount: 4,
  },
];

const extraWithWholeRestPatterns = [
  {
    id: 'with_whole_rest_11',
    description: 'Whole rest flanked by eighth note bars',
    beats: [
      ['8', '8', '8', '8', '8', '8', '8', '8'],
      ['wr'],
      ['q', 'q', 'h'],
      ['wr'],
    ],
    durationSet: ['q', 'h', '8', 'wr'],
    tags: ['with-whole-rest'],
    timeSignature: '4/4',
    difficulty: 'advanced',
    measureCount: 4,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// RHYTHM_PATTERNS — flat array of all patterns
// ─────────────────────────────────────────────────────────────────────────────

export const RHYTHM_PATTERNS = [
  ...quarterOnlyPatterns,
  ...extraQuarterOnlyPatterns,
  ...quarterHalfPatterns,
  ...extraQuarterHalfPatterns,
  ...quarterHalfWholePatterns,
  ...extraQuarterHalfWholePatterns,
  ...quarterEighthPatterns,
  ...extraQuarterEighthPatterns,
  ...withQuarterRestPatterns,
  ...extraWithQuarterRestPatterns,
  ...withHalfRestPatterns,
  ...extraWithHalfRestPatterns,
  ...withWholeRestPatterns,
  ...extraWithWholeRestPatterns,
  ...dottedHalfPatterns,
  ...extraDottedHalfPatterns,
  ...dottedQuarterPatterns,
  ...extraDottedQuarterPatterns,
  ...withSixteenthPatterns,
  ...extraWithSixteenthPatterns,
  ...compoundBasicPatterns,
  ...compoundMixedPatterns,
  ...extraCompoundMixedPatterns,
  ...syncopationBasicPatterns,
  ...extraSyncopationBasicPatterns,
  ...syncopationDottedPatterns,
  ...extraSyncopationDottedPatterns,
  ...threeFourPatterns,
  ...extraThreeFourPatterns,
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all patterns that include a given tag.
 * @param {string} tag — one of PATTERN_TAGS
 * @returns {Object[]}
 */
export function getPatternsByTag(tag) {
  return RHYTHM_PATTERNS.filter((p) => p.tags.includes(tag));
}

/**
 * Get a pattern by its unique id.
 * @param {string} id
 * @returns {Object|null}
 */
export function getPatternById(id) {
  return RHYTHM_PATTERNS.find((p) => p.id === id) || null;
}

/**
 * Get all patterns matching both a tag and a difficulty level.
 * @param {string} tag — one of PATTERN_TAGS
 * @param {string} difficulty — 'beginner' | 'intermediate' | 'advanced'
 * @returns {Object[]}
 */
export function getPatternsByTagAndDifficulty(tag, difficulty) {
  return RHYTHM_PATTERNS.filter(
    (p) => p.tags.includes(tag) && p.difficulty === difficulty
  );
}

export default RHYTHM_PATTERNS;
