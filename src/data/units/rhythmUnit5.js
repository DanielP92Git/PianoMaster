// src/data/units/rhythmUnit5.js
// Phase 1 v3.5 — Unit 5: Sixteenth Notes (second subdivision per D-01, D-05).
// 6-node NON-DURATION arc per D-02: Intro → Practice → Discovery (mixed contrast)
// → Practice → Speed → Mini-Boss.
// orderInUnit=3 is a mixed-contrast DISCOVERY with empty focusDurations
// (no new concept introduced — pairs sixteenths with prior q/8 for ear training).
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js
// on 2026-06-01):
//   - "sixteenth": sixteenth-bearing patterns (rhythm_5_1..5_4, boss_rhythm_5)
//   - "quarter-eighth": prior-subdivision contrast patterns (rhythm_5_3, rhythm_5_4)
//   - Cumulative U1–U5 tags on rhythm_5_5 + boss_rhythm_5 via patternTagMode "any"
//
// Concept family per D-14 validateConceptPerUnit: focusDurations stay within
// {16}. Only rhythm_5_1 carries a non-empty focusDurations array.
//
// XP arc (per 01-RESEARCH §"XP totals"): sixteenths technically harder than
// eighths, so per-node XP is slightly higher than U4 (rhythm_5_1=60 vs
// rhythm_4_1=55; boss_rhythm_5=130 vs boss_rhythm_4=120).

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 5;
const UNIT_NAME = "Sixteenth Notes";
const CATEGORY = "rhythm";
const START_ORDER = 140;

export const rhythmUnit5Nodes = [
  // ============================================
  // NODE 1: Meet Sixteenth Notes (Discovery — concept anchor)
  // ============================================
  {
    id: "rhythm_5_1",
    name: "Meet Sixteenth Notes",
    description:
      "Four fast notes per beat — the smallest classical subdivision",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_4"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "16"],
      focusDurations: ["16"], // NEW: sixteenth subdivision concept
      contextDurations: ["q"],
      patternTags: ["sixteenth"],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Sixteenth Notes (1/4 beat — four per pulse)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "16" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
          ],
        },
      },
    ],

    skills: ["quarter_note", "sixteenth_note"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice Sixteenth Notes (Practice)
  // ============================================
  {
    id: "rhythm_5_2",
    name: "Practice Sixteenth Notes",
    description: "Groups of four — one beat at a time",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_5_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "16"],
      focusDurations: [],
      contextDurations: ["q", "16"],
      patternTags: ["sixteenth"],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "syllable_matching" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["quarter_note", "sixteenth_note"],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Mixed Contrast — Eighths and Sixteenths (Discovery, no new concept)
  // ============================================
  // Non-duration arc: this Discovery is contrast/integration — pairs sixteenths
  // with prior q/8 durations for ear training. focusDurations: [] enforces
  // the "no new concept added" rule per D-14 validateConceptPerUnit. No
  // discovery_intro card here (REQ-04 scaffolding is only on the concept-anchor
  // Discovery, rhythm_5_1).
  {
    id: "rhythm_5_3",
    name: "Eighths and Sixteenths",
    description: "Tell apart 2-per-beat eighths from 4-per-beat sixteenths",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_5_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "8", "16"],
      focusDurations: [],
      contextDurations: ["q", "8", "16"],
      patternTags: ["sixteenth", "quarter-eighth"],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: "Subdivision Contrast",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["quarter_note", "eighth_note", "sixteenth_note"],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: All-Duration Mix (Practice)
  // ============================================
  {
    id: "rhythm_5_4",
    name: "All-Duration Mix",
    description: "Mix quarter, half, eighth, and sixteenth notes in patterns",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_5_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "8", "16"],
      focusDurations: [],
      contextDurations: ["q", "h", "8", "16"],
      patternTags: ["sixteenth", "quarter-eighth"],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "syllable_matching" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["quarter_note", "half_note", "eighth_note", "sixteenth_note"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Sixteenth-Note Speed Drill (Speed Round)
  // ============================================
  {
    id: "rhythm_5_5",
    name: "Sixteenth-Note Speed Drill",
    description: "How fast can you play every classical subdivision?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_5_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "8", "16"],
      focusDurations: [],
      contextDurations: ["q", "h", "8", "16"],
      // Cumulative U1-U5 speed pool (mirrors mini-boss cumulative D-06 pattern).
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "sixteenth",
      ],
      patternTagMode: "any",
      tempo: { min: 95, max: 105, default: 100 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Subdivision Speed Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          difficulty: "advanced",
        },
      },
    ],

    skills: ["quarter_note", "half_note", "eighth_note", "sixteenth_note"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Sixteenth-Note Boss (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_5",
    name: "Sixteenth-Note Boss",
    description: "Master every classical subdivision!",
    unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_5_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "w", "8", "16"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "8", "16"],
      // Cumulative boss pool (U1–U5) per D-06 OR-mode.
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "sixteenth",
      ],
      patternTagMode: "any",
      measureCount: 4,
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Unit Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
            { type: "syllable_matching" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
            { type: "syllable_matching" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: [
      "quarter_note",
      "half_note",
      "whole_note",
      "eighth_note",
      "sixteenth_note",
    ],
    xpReward: 130,
    accessoryUnlock: "rhythm_badge_5",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit5Nodes;
