// IDs renamed rhythm_8_* → rhythm_synco_* per D-10 (Phase 1 v3.5) to free numeric namespace for new U8 (3/4 Meter). HIDDEN-V1 marker in expandedNodes.js preserved.
/**
 * Rhythm Unit 8: "Off-Beat Magic" (Redesigned, v2 — quick task 260524-l3r)
 *
 * Pedagogically-correct syncopation unit for 8-year-old learners.
 * Locked PEDAGOGY-REVIEW design (Kodaly/Gordon/Orff/Dalcroze synthesis):
 *
 *   Node 1  rhythm_synco_1   "Hold-Across Warm-Up"          DISCOVERY    q-h-q, 1 bar, 60-66 BPM
 *   Node 2  rhythm_synco_2   "Surprise Beat: Listen & Echo" DISCOVERY    8-q-8, 1 bar, 64-70 BPM
 *   Node 3  rhythm_synco_3   "Read the Off-Beat"            PRACTICE     mixed, 2 bars, 70-78 BPM
 *   Node 4  rhythm_synco_4   "Body Split"                   PRACTICE     8-q-8, 2 bars, 66-74 BPM
 *   Node 5  rhythm_synco_5   "Build a Syncopation"          PRACTICE     compose tiles, 72-78 BPM
 *   Node 6  rhythm_synco_6   "Off-Beat Speed Drill"         SPEED_ROUND  arcade, 80-88 BPM
 *   Node 7  boss_rhythm_synco "Syncopation Boss"            BOSS         strict syncopation-heavy, 4 bars
 *
 * Design highlights:
 *   - Q-H-Q is reframed as "Hold Across the Beat" — NOT syncopation in
 *     child-facing copy (decision A). The word "syncopation" / "סינ-קו-פה"
 *     is reserved for Node 2 (8-q-8 discovery), Node 5 (compose), and Boss.
 *   - Each node specializes in ONE dominant modality (listen, read, split,
 *     compose, speed) — fixes the identical-question-manifold complaint.
 *   - Boss draws strictly [q, h, 8] against the curated `syncopation-heavy`
 *     pool (16 syncopated + 6 contrast bars = ~73% syncopation density).
 *   - Boss drops `68_compound_meter` skill — this is the syncopation
 *     capstone, not a rhythm-grandmaster finale.
 *   - XP arc: 60 / 80 / 85 / 85 / 100 / 90 / 250 (creative spike on Node 5).
 *
 * Duration: ~25-30 minutes total (3-4 min per regular node + 5-6 min boss).
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 8;
const UNIT_NAME = "Syncopation";
const CATEGORY = "rhythm";
const START_ORDER = 144; // After Unit 7's 6 nodes (138-143)

// ── Node 5 compose tile palette ────────────────────────────────────────────
// 4 tiles, each = 1 bar of 4/4 (16 sixteenth-note units). Tap notes are `1`,
// sustains/silences `0` per the project's binaryPatternToBeats semantics
// (see src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js).
//
// Tile lengths (must each sum to 16):
//   tile_qqqq  : q q q q              → 4+4+4+4 = 16
//   tile_qhq   : q h q (hold-across)  → 4+8+4   = 16
//   tile_8q8qq : 8-q-8 q q            → 2+4+2+4+4 = 16
//   tile_q8q8q : q 8-q-8 q            → 4+2+4+2+4 = 16
const NODE_5_COMPOSE_TILES = [
  {
    id: "tile_qqqq",
    binary: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    label: "q q q q",
  },
  {
    id: "tile_qhq",
    binary: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    label: "q h q",
  },
  {
    id: "tile_8q8qq",
    binary: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    label: "8-q-8 q q",
  },
  {
    id: "tile_q8q8q",
    binary: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    label: "q 8-q-8 q",
  },
];

export const rhythmUnit8Nodes = [
  // ============================================================================
  // NODE 1: Hold-Across Warm-Up (q-h-q, DISCOVERY)
  // Reframes q-h-q as "hold across the beat" — re-grounds 4/4 pulse after Unit 7's 6/8.
  // ============================================================================
  {
    id: "rhythm_synco_1",
    name: "Hold-Across Warm-Up",
    description:
      "Re-ground in 4/4 with long notes that hover over the beat (q-h-q)",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_7"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h"],
      focusDurations: ["h"],
      contextDurations: ["q"],
      patternTags: ["quarter-half"],
      tempo: { min: 60, max: 66, default: 63 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription:
      "Hold across the beat — long notes that hover over the pulse",

    // Listen → feel → see → echo (6 questions; visual_recognition included to
    // satisfy validateMultiAngleGames for a 2-duration node).
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            {
              type: "discovery_intro",
              focusDuration: "h",
              // Pattern mode — render q-h-q on a staff (canonical q_44_003
              // binary) and play it back at the node tempo so the child
              // experiences the figure, not the lone half note already taught
              // in Unit 1.
              focusPattern: {
                id: "qhq",
                binary: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                tempo: 62,
              },
            },
            { type: "pulse" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_long_value"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================================================
  // NODE 2: Surprise Beat — Listen & Echo (8-q-8, DISCOVERY, listen-first)
  // The headline syncopation moment — the "feeling moment" the previous unit lacked.
  // ============================================================================
  {
    id: "rhythm_synco_2",
    name: "Surprise Beat: Listen & Echo",
    description:
      "Hear an off-beat surprise — a sound where the beat isn't (8-q-8)",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_synco_1"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["8", "q"],
      focusDurations: ["8"],
      contextDurations: ["q"],
      patternTags: ["syncopation"], // strict — no fallback
      tempo: { min: 64, max: 70, default: 67 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Syncopation: a sound where the beat isn't!",

    // Listen-first arc — taps before the notation reveal, then echo + read.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            {
              type: "discovery_intro",
              focusDuration: "8",
              // Pattern mode — render the canonical "syn-co-pa syn-co-pa"
              // bar (syn_44_002 binary: 8r-8-q twice) and play it back at
              // node tempo. This is the figure the child is about to
              // recognize and echo, not a lone eighth note.
              focusPattern: {
                id: "synsyn",
                binary: [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
                tempo: 67,
              },
            },
            { type: "rhythm_tap" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_eighth_quarter"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================================================
  // NODE 3: Read the Off-Beat (PRACTICE, reading + detective)
  // Pure notation fluency for 8-q-8. No tap questions — visual-recognition is
  // re-framed as "detective mode": which bar has the off-beat?
  // ============================================================================
  {
    id: "rhythm_synco_3",
    name: "Read the Off-Beat",
    description: "Spot the syncopated bar — detective mode",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_synco_2"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      // OR-pool: syncopated 8-q-8 + calm q+h bars. Each of the 2 bars is drawn
      // independently so the child must SPOT the syncopated one.
      patternTags: ["syncopation", "quarter-half"],
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 70, max: 78, default: 74 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    // 6 questions: reading-heavy with 2 detective `visual_recognition` interleaved.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_eighth_quarter"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================================================
  // NODE 4: Body Split (PRACTICE, pulse + tap)
  // Dalcroze-style bodily integration — child taps off-beat with the metronome
  // as their persistent pulse. Visual-pulse renderer enhancement DEFERRED per
  // CONTEXT.md decision D — ships as plain `pulse` + `rhythm_tap` for now.
  // ============================================================================
  {
    id: "rhythm_synco_4",
    name: "Body Split",
    description: "Tap the pulse and the off-beat together",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_synco_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "8"],
      focusDurations: [],
      contextDurations: ["q", "8"],
      patternTags: ["syncopation"], // strict
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 66, max: 74, default: 70 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    // Pulse opens the node (re-grounds the beat), then tap-dominant practice.
    // Final `visual_recognition` satisfies validateMultiAngleGames AND gives
    // a brief detective break from the kinaesthetic tap focus.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "pulse" },
            { type: "rhythm_tap" },
            { type: "rhythm_tap" },
            { type: "rhythm_tap" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
          ],
        },
      },
    ],

    skills: ["syncopation_eighth_quarter"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================================================
  // NODE 5: Build a Syncopation (PRACTICE / creative milestone)
  // The single most morale-changing node in the unit — child arranges tiles
  // into a 2-bar phrase and hears it play back. 5 questions total
  // (1 compose + 2 tap echo + 2 reading verify).
  // ============================================================================
  {
    id: "rhythm_synco_5",
    name: "Build a Syncopation",
    description: "Pick tiles, build a 2-bar phrase, hear it play!",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_synco_4"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      // OR-pool for the 4 verify questions; the compose entry is pre-authored.
      patternTags: ["syncopation", "quarter-half"],
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 72, max: 78, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    // 5 questions: compose milestone, then echo + read verification.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            {
              type: "compose_rhythm",
              slotCount: 2,
              tiles: NODE_5_COMPOSE_TILES,
            },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_long_value", "syncopation_eighth_quarter"],
    xpReward: 100,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================================================
  // NODE 6: Off-Beat Speed Drill (SPEED_ROUND, ARCADE)
  // Speed + endurance on the new gesture. Tag pool tightened from previous
  // 8-tag cumulative to just syncopation + quarter-eighth so arcade tiles
  // skew syncopated.
  // ============================================================================
  {
    id: "rhythm_synco_6",
    name: "Off-Beat Speed Drill",
    description: "How fast can you tap syncopated rhythms?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_synco_5"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      patternTags: ["syncopation", "quarter-eighth"],
      patternTagMode: "any",
      tempo: { min: 80, max: 88, default: 84 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Syncopation Speed Drill",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          difficulty: "advanced",
        },
      },
    ],

    skills: ["syncopation_long_value", "syncopation_eighth_quarter"],
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================================================
  // NODE 7: Syncopation Boss (BOSS — strict syncopation capstone)
  // Strict [q,h,8] against the curated `syncopation-heavy` pool — ~73% of
  // bars carry syncopation. Drops the previous "kitchen-sink rhythm finale"
  // framing; this is the syncopation skill capstone only.
  // ============================================================================
  {
    id: "boss_rhythm_synco",
    name: "Syncopation Boss",
    description: "Master off-beat magic — the capstone of the unit!",
    unlockHint: "Master off-beat magic to face the syncopation boss!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ["rhythm_synco_6"],

    nodeType: NODE_TYPES.BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      // Strict syncopation-capstone duration set (decision D: drop dotted/sixteenth/rest).
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      patternTags: ["syncopation-heavy"],
      patternTagMode: "any",
      measureCount: 4, // D-08: full BOSS uses 4-bar patterns
      tempo: { min: 78, max: 88, default: 84 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Syncopation Capstone!",

    // 10 questions — reading/dictation-heavy mix.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_dictation" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_long_value", "syncopation_eighth_quarter"],
    xpReward: 250,
    accessoryUnlock: "advanced_rhythm_badge",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit8Nodes;
