// src/data/units/rhythmUnit1.js
// Phase 1 v3.5 — Unit 1: Quarter + Quarter Rest (Pulse-first concept anchor per D-01).
// 6-node duration-unit arc per D-02: Duration Intro → Practice → Rest Intro
// → Combined Practice → Speed Round → Mini-Boss.
//
// Replaces legacy src/data/units/rhythmUnit1Redesigned.js (Plan 01-08 wires
// this file into expandedNodes.js; Plan 01-10 deletes the legacy *.Redesigned
// counterpart).
//
// Principle satisfaction:
//   REQ-01 (Pulse-first):       rhythm_1_1 is the first rhythm-content node and
//                               its focusDurations is ['q'].
//   REQ-02 (Rests-woven):       rhythm_1_3 introduces 'qr' adjacent to 'q'.
//   REQ-03 (Concept-per-unit):  union of all focusDurations = {q, qr} ⊆ family q_qr.
//   REQ-04 (Scaffolding):       every DISCOVERY node opens with
//                               { type: 'discovery_intro', focusDuration: '<x>' }.
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js
// on 2026-06-01 — see Plan 01-05 Task 1 STEP 0):
//   - "quarter-only"  : exists; resolves with durations [q] and [q, qr]
//   - "quarter-rest"  : exists; resolves with durations [q, qr]
//   - boss_rhythm_1 uses ["quarter-only", "quarter-rest"] with patternTagMode "any"
//     so resolveByTags can pick either tag class per pattern bar.

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 1;
const UNIT_NAME = "Quarter + Quarter Rest";
const CATEGORY = "rhythm";
const START_ORDER = 100;

const rhythmUnit1Nodes = [
  // ============================================
  // NODE 1: Quarter Notes (Discovery — REQ-01 anchor)
  // ============================================
  {
    id: "rhythm_1_1",
    name: "Quarter Notes",
    description: "Meet the steady quarter note — one beat each.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: [],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["q"],
      focusDurations: ["q"], // REQ-01: pulse anchor.
      contextDurations: [],
      patternTags: ["quarter-only"],
      tempo: { min: 60, max: 75, default: 68 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Quarter Notes (1 beat)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "q" }, // REQ-04
            { type: "syllable_matching" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
          ],
        },
      },
    ],

    skills: ["quarter_note"],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Quarter Practice (Practice)
  // ============================================
  {
    id: "rhythm_1_2",
    name: "Quarter Practice",
    description: "Lock in steady quarter notes across a full bar.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_1_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["q"],
      focusDurations: [],
      contextDurations: ["q"],
      patternTags: ["quarter-only"],
      tempo: { min: 65, max: 75, default: 70 },
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

    skills: ["quarter_note"],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Quarter Rest (Discovery — REQ-02 rest woven adjacent to q)
  // ============================================
  {
    id: "rhythm_1_3",
    name: "Quarter Rest",
    description: "Meet the quarter rest — one beat of silence.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_1_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["q", "qr"],
      focusDurations: ["qr"], // REQ-02: rest introduced in the same unit as its duration.
      contextDurations: ["q"],
      patternTags: ["quarter-rest"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Quarter Rest (1 beat of silence)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "qr" }, // REQ-04
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["quarter_note", "quarter_rest"],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mixed Quarters & Rests (Practice)
  // ============================================
  {
    id: "rhythm_1_4",
    name: "Mixed Quarters & Rests",
    description: "Combine quarter notes and rests in steady patterns.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_1_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "qr"],
      focusDurations: [],
      contextDurations: ["q", "qr"],
      patternTags: ["quarter-only", "quarter-rest"],
      tempo: { min: 65, max: 75, default: 70 },
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

    skills: ["quarter_note", "quarter_rest"],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Quarter Speed (Speed Round)
  // ============================================
  {
    id: "rhythm_1_5",
    name: "Quarter Speed",
    description: "How fast can you tap quarter notes and rests?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_1_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "qr"],
      focusDurations: [],
      contextDurations: ["q", "qr"],
      patternTags: ["quarter-only", "quarter-rest"],
      tempo: { min: 85, max: 95, default: 90 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Speed Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          difficulty: "beginner",
        },
      },
    ],

    skills: ["quarter_note", "quarter_rest"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Quarter Boss (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_1",
    name: "Quarter Boss",
    description: "Master quarter notes and quarter rests!",
    unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_1_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "qr"],
      focusDurations: [],
      contextDurations: ["q", "qr"],
      patternTags: ["quarter-only", "quarter-rest"],
      patternTagMode: "any", // D-06: OR-mode for cumulative boss patterns.
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Unit Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON, // MINI_BOSS → MIXED_LESSON per validateGameTypePolicy.
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
          ],
        },
      },
    ],

    skills: ["quarter_note", "quarter_rest"],
    xpReward: 100,
    accessoryUnlock: "rhythm_badge_1",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit1Nodes;
