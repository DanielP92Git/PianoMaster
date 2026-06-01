// src/data/units/rhythmUnit7.js
// Phase 1 v3.5 — Unit 7: Dotted Quarter Notes (concept family {qd} per D-04 strict separation).
// 6-node NON-DURATION arc per D-02: Intro -> Practice -> Discovery (mixed contrast) -> Practice -> Speed -> Mini-Boss.
//
// Strict concept-per-unit (D-14 validator): focusDurations across all U7 nodes union to {qd} only.
// Dotted Half (hd) lives in U6 — DO NOT mix here.
// Dotted quarter subdivides q + 8 (durationUnits: 6 = quarter (4) + eighth (2)).
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js 2026-06-01):
//   - "dotted-quarter": used across U7 content nodes
//   - boss_rhythm_7 cumulative tags include U1-U7 (quarter-only, quarter-half,
//     quarter-eighth, quarter-half-whole-eighth, dotted-half, dotted-quarter)
//     with patternTagMode='any'.

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 7;
const UNIT_NAME = "Dotted Quarter Notes";
const CATEGORY = "rhythm";
const START_ORDER = 160;

const rhythmUnit7Nodes = [
  // ============================================
  // NODE 1: Meet Dotted Quarter Notes (Discovery)
  // ============================================
  {
    id: "rhythm_7_1",
    name: "Meet Dotted Quarter Notes",
    description:
      "Dotted quarter — 1½ beats. Often paired with an eighth note to fill 2 beats.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_6"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "8", "qd"],
      focusDurations: ["qd"], // NEW concept anchor — U7 introduces dotted quarter
      contextDurations: ["q", "8"],
      patternTags: ["dotted-quarter"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Dotted Quarter Note (1.5 beats)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "qd" },
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

    skills: ["dotted_quarter_note"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice Dotted Quarters (Practice)
  // ============================================
  {
    id: "rhythm_7_2",
    name: "Practice Dotted Quarters",
    description: "Build confidence with 1.5-beat notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_7_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "8", "qd"],
      focusDurations: [],
      contextDurations: ["q", "8", "qd"],
      patternTags: ["dotted-quarter"],
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

    skills: ["dotted_quarter_note"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Dotted Quarters in Context (Discovery, contrast-only)
  // ============================================
  {
    id: "rhythm_7_3",
    name: "Dotted Quarters in Context",
    description: "Hear dotted quarters paired with eighths and quarters",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_7_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "8", "qd"],
      focusDurations: [], // contrast-only — no NEW concept introduced
      contextDurations: ["q", "8", "qd"],
      patternTags: ["dotted-quarter"],
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
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["dotted_quarter_note"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Dotted Quarter Practice (Practice)
  // ============================================
  {
    id: "rhythm_7_4",
    name: "Dotted Quarter Practice",
    description: "Mix dotted quarters with steady beat work",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_7_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "8", "qd"],
      focusDurations: [],
      contextDurations: ["q", "8", "qd"],
      patternTags: ["dotted-quarter"],
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
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_dictation" },
            { type: "syllable_matching" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["dotted_quarter_note"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Dotted Quarter Speed (Speed Round)
  // ============================================
  {
    id: "rhythm_7_5",
    name: "Dotted Quarter Speed Drill",
    description: "How fast can you play dotted quarter rhythms?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_7_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "8", "qd"],
      focusDurations: [],
      contextDurations: ["q", "8", "qd"],
      // D-19 cumulative speed-pool tags through U7
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "dotted-half",
        "dotted-quarter",
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

    skills: ["dotted_quarter_note"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Dotted Quarter Mini-Boss
  // ============================================
  {
    id: "boss_rhythm_7",
    name: "Dotted Quarter Boss",
    description: "Master dotted quarter notes!",
    unlockHint: "Complete all lessons in this unit to unlock the challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_7_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "8", "qd"],
      focusDurations: [],
      contextDurations: ["q", "8", "qd"],
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "dotted-half",
        "dotted-quarter",
      ],
      patternTagMode: "any", // D-06 cumulative boss patterns
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

    skills: ["dotted_quarter_note"],
    xpReward: 150,
    accessoryUnlock: "rhythm_badge_7",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit7Nodes;
