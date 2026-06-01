// src/data/units/rhythmUnit2.js
// Phase 1 v3.5 — Unit 2: Half + Half Rest (Pulse-first extension per D-01).
// 6-node duration-unit arc per D-02. Chains in from boss_rhythm_1.
//
// Half is framed as a 2-quarter extension (REQ-01 narrative): durations
// include 'q' as context for early nodes so patterns/syllables stay
// pulse-anchored. focusDurations stays strictly within family {h, hr} so
// validateConceptPerUnit sees a clean h_hr family signature.
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js):
//   - "quarter-half" : exists; resolves in durations [q, h] and broader contexts
//   - "half-rest"    : exists; resolves with durations containing h + hr
//   - boss_rhythm_2 uses both with patternTagMode "any" so resolveByTags can
//     pick either tag class per pattern bar (OR-mode cumulative coverage).

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 2;
const UNIT_NAME = "Half + Half Rest";
const CATEGORY = "rhythm";
const START_ORDER = 110;

const rhythmUnit2Nodes = [
  // ============================================
  // NODE 1: Half Notes (Discovery — extension of pulse per REQ-01)
  // ============================================
  {
    id: "rhythm_2_1",
    name: "Half Notes",
    description: "Half notes — two beats each, like two quarters joined.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_1"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["q", "h"],
      focusDurations: ["h"], // Family h_hr only — q is contextual, not "focus".
      contextDurations: ["q"],
      patternTags: ["quarter-half"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Half Notes (2 beats)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "h" }, // REQ-04
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

    skills: ["quarter_note", "half_note"],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Half Practice (Practice)
  // ============================================
  {
    id: "rhythm_2_2",
    name: "Half Practice",
    description: "Mix half notes and quarters in steady patterns.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_2_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h"],
      focusDurations: [],
      contextDurations: ["q", "h"],
      patternTags: ["quarter-half"],
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

    skills: ["quarter_note", "half_note"],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Half Rest (Discovery — REQ-02 rest woven adjacent to h)
  // ============================================
  {
    id: "rhythm_2_3",
    name: "Half Rest",
    description: "Meet the half rest — two beats of silence.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_2_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hr"],
      focusDurations: ["hr"], // REQ-02: rest introduced in matching duration unit.
      contextDurations: ["q", "h"],
      patternTags: ["half-rest"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Half Rest (2 beats of silence)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "hr" }, // REQ-04
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

    skills: ["half_note", "half_rest"],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mixed Halves & Rests (Practice)
  // ============================================
  {
    id: "rhythm_2_4",
    name: "Mixed Halves & Rests",
    description: "Combine halves, quarters, and half rests.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_2_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hr"],
      focusDurations: [],
      contextDurations: ["q", "h", "hr"],
      patternTags: ["quarter-half", "half-rest"],
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

    skills: ["quarter_note", "half_note", "half_rest"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Half Speed (Speed Round)
  // ============================================
  {
    id: "rhythm_2_5",
    name: "Half Speed",
    description: "How fast can you read halves and half rests?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_2_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hr"],
      focusDurations: [],
      contextDurations: ["q", "h", "hr"],
      patternTags: ["quarter-half", "half-rest"],
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

    skills: ["quarter_note", "half_note", "half_rest"],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Half Boss (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_2",
    name: "Half Boss",
    description: "Master halves and half rests!",
    unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_2_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hr"],
      focusDurations: [],
      contextDurations: ["q", "h", "hr"],
      patternTags: ["quarter-half", "half-rest"],
      patternTagMode: "any", // D-06: OR-mode cumulative coverage.
      tempo: { min: 70, max: 80, default: 75 },
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
          ],
        },
      },
    ],

    skills: ["quarter_note", "half_note", "half_rest"],
    xpReward: 110,
    accessoryUnlock: "rhythm_badge_2",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit2Nodes;
