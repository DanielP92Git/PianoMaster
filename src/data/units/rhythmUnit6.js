// src/data/units/rhythmUnit6.js
// Phase 1 v3.5 — Unit 6: Dotted Half Notes (concept family {hd} per D-04 strict separation).
// 6-node NON-DURATION arc per D-02: Intro -> Practice -> Discovery (mixed contrast) -> Practice -> Speed -> Mini-Boss.
//
// Strict concept-per-unit (D-14 validator): focusDurations across all U6 nodes union to {hd} only.
// Dotted Quarter (qd) lives in U7 — DO NOT mix here.
// Meter introduction (3/4) is U8 — every U6 node uses timeSignature='4/4'.
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js 2026-06-01):
//   - "dotted-half": used across U6 content nodes (45+ pattern matches in rhythmPatterns.js)
//   - boss_rhythm_6 uses ["quarter-half", "quarter-half-whole-eighth", "dotted-half"]
//     with patternTagMode='any' (OR-mode) — cumulative-style mini-boss per D-06.

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 6;
const UNIT_NAME = "Dotted Half Notes";
const CATEGORY = "rhythm";
const START_ORDER = 150;

const rhythmUnit6Nodes = [
  // ============================================
  // NODE 1: Meet Dotted Half Notes (Discovery)
  // ============================================
  {
    id: "rhythm_6_1",
    name: "Meet Dotted Half Notes",
    description:
      "Dotted half — three beats. The dot adds half the note's value.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_5"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: ["hd"], // NEW concept anchor — U6 introduces dotted half
      contextDurations: ["q", "h"],
      patternTags: ["dotted-half"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Dotted Half Note (3 beats)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "hd" },
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

    skills: ["dotted_half_note"],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice Dotted Halves (Practice)
  // ============================================
  {
    id: "rhythm_6_2",
    name: "Practice Dotted Halves",
    description: "Build confidence with 3-beat notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_6_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["dotted-half"],
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

    skills: ["dotted_half_note"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Mixed Dotted Halves (Discovery, contrast-only — no new concept)
  // ============================================
  {
    id: "rhythm_6_3",
    name: "Dotted Halves in Context",
    description: "Hear dotted halves alongside quarters and halves",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_6_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [], // contrast-only — no NEW concept introduced (D-14 concept-per-unit)
      contextDurations: ["q", "h", "hd"],
      patternTags: ["dotted-half"],
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

    skills: ["dotted_half_note"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Practice All Dotted Halves (Practice)
  // ============================================
  {
    id: "rhythm_6_4",
    name: "Dotted Half Practice",
    description: "Mix dotted halves with steady beat work",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_6_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["dotted-half"],
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

    skills: ["dotted_half_note"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Dotted Half Speed (Speed Round)
  // ============================================
  {
    id: "rhythm_6_5",
    name: "Dotted Half Speed Drill",
    description: "How fast can you play dotted half rhythms?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_6_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      // D-19 (Phase 33 Plan 33-09) cumulative speed-pool tags through U6
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "dotted-half",
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

    skills: ["dotted_half_note"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Dotted Half Mini-Boss
  // ============================================
  {
    id: "boss_rhythm_6",
    name: "Dotted Half Boss",
    description: "Master dotted half notes!",
    unlockHint: "Complete all lessons in this unit to unlock the challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_6_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["quarter-half", "quarter-half-whole", "dotted-half"],
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

    skills: ["dotted_half_note"],
    xpReward: 140,
    accessoryUnlock: "rhythm_badge_6",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit6Nodes;
