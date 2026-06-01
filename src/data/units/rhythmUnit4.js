// src/data/units/rhythmUnit4.js
// Phase 1 v3.5 — Unit 4: Eighth Notes (first subdivision per D-01, D-05).
// 6-node NON-DURATION arc per D-02: Intro → Practice → Discovery (mixed contrast)
// → Practice → Speed → Mini-Boss.
// orderInUnit=3 is a mixed-contrast DISCOVERY with empty focusDurations
// (no new concept introduced — pairs eighths with prior q/h for ear training).
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js
// on 2026-06-01):
//   - "quarter-eighth": eighth-bearing patterns over quarter pulse
//     (rhythm_4_1, rhythm_4_2, rhythm_4_3, rhythm_4_4)
//   - "quarter-half-whole-eighth": eighth-bearing patterns mixed with longer
//     durations (rhythm_4_3, rhythm_4_4, rhythm_4_5, boss_rhythm_4)
//   - Cumulative boss tags (U1–U4) on rhythm_4_5 + boss_rhythm_4 via
//     patternTagMode "any"
//
// Concept family per D-14 validateConceptPerUnit: focusDurations stay within
// {8, 8_pair}. Only rhythm_4_1 carries a non-empty focusDurations array.

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 4;
const UNIT_NAME = "Eighth Notes";
const CATEGORY = "rhythm";
const START_ORDER = 130;

export const rhythmUnit4Nodes = [
  // ============================================
  // NODE 1: Meet Eighth Notes (Discovery — concept anchor)
  // ============================================
  {
    id: "rhythm_4_1",
    name: "Meet Eighth Notes",
    description: "Two running notes per beat — feel the subdivision",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_3"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "8"],
      focusDurations: ["8_pair"], // NEW: eighth-pair subdivision concept
      contextDurations: ["q"],
      patternTags: ["quarter-eighth"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Eighth Notes (1/2 beat — two per pulse)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "8_pair" },
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

    skills: ["quarter_note", "eighth_note"],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice Eighth Notes (Practice)
  // ============================================
  {
    id: "rhythm_4_2",
    name: "Practice Eighth Notes",
    description: "Build confidence with steady eighth-note pairs",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_4_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "8"],
      focusDurations: [],
      contextDurations: ["q", "8"],
      patternTags: ["quarter-eighth"],
      tempo: { min: 75, max: 85, default: 80 },
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

    skills: ["quarter_note", "eighth_note"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Mixed Contrast — Walking and Running (Discovery, no new concept)
  // ============================================
  // Non-duration arc: this Discovery is contrast/integration — pairs eighths
  // with prior q/h durations for ear training. focusDurations: [] enforces
  // the "no new concept added" rule per D-14 validateConceptPerUnit. No
  // discovery_intro card here (REQ-04 scaffolding is only on the concept-anchor
  // Discovery, rhythm_4_1).
  {
    id: "rhythm_4_3",
    name: "Walking & Running Together",
    description: "Compare longer durations with running eighth notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_4_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      patternTags: ["quarter-eighth", "quarter-half-whole-eighth"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: "Duration Contrast",

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

    skills: ["quarter_note", "half_note", "eighth_note"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mix It Up (Practice — combined durations)
  // ============================================
  {
    id: "rhythm_4_4",
    name: "Quarters, Halves & Eighths Mix",
    description: "Mix quarter, half, and eighth notes in patterns",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_4_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      patternTags: ["quarter-eighth", "quarter-half-whole-eighth"],
      tempo: { min: 75, max: 85, default: 80 },
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

    skills: ["quarter_note", "half_note", "eighth_note"],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Eighth-Note Speed Drill (Speed Round)
  // ============================================
  {
    id: "rhythm_4_5",
    name: "Eighth-Note Speed Drill",
    description: "How fast can you play eighth-note runs?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_4_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "w", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "8"],
      // Cumulative U1-U4 speed pool (mirrors mini-boss D-06 cumulative pattern).
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
      ],
      patternTagMode: "any",
      tempo: { min: 90, max: 100, default: 95 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Speed Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          difficulty: "intermediate",
        },
      },
    ],

    skills: ["quarter_note", "half_note", "eighth_note"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Eighth-Note Boss (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_4",
    name: "Eighth-Note Boss",
    description: "Master eighth notes and combined rhythmic patterns!",
    unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_4_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "w", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "8"],
      // Cumulative boss pool (U1–U4) per D-06 OR-mode.
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
      ],
      patternTagMode: "any",
      measureCount: 4,
      tempo: { min: 75, max: 85, default: 80 },
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

    skills: ["quarter_note", "half_note", "whole_note", "eighth_note"],
    xpReward: 120,
    accessoryUnlock: "rhythm_badge_4",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit4Nodes;
