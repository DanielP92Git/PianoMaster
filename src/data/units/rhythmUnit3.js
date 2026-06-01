// src/data/units/rhythmUnit3.js
// Phase 1 v3.5 — Unit 3: Whole + Whole Rest (Pulse-first extension per D-01).
// 6-node duration-unit arc per D-02. Chains in from boss_rhythm_2.
//
// Whole is framed as a 4-quarter extension (REQ-01 narrative). durations
// include 'q'/'h' as pulse context for early nodes so patterns/syllables
// stay anchored on the beat. focusDurations stays strictly within family
// {w, wr} so validateConceptPerUnit sees a clean w_wr family signature.
//
// Pattern tag inventory (verified against src/data/patterns/rhythmPatterns.js):
//   - "quarter-half-whole" : exists; resolves with durations [q, h, w] and
//                            broader contexts — single-onset bars (line 197,
//                            qhw_44_001) become whole notes when other
//                            durations are unavailable, supporting REQ-01
//                            "whole = 4 quarters held together" narrative.
//   - "whole-rest"         : exists (lines 165, 980, 988); resolves with
//                            durations containing wr + smaller notes.
//   - boss_rhythm_3 uses both with patternTagMode "any".

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 3;
const UNIT_NAME = "Whole + Whole Rest";
const CATEGORY = "rhythm";
const START_ORDER = 120;

const rhythmUnit3Nodes = [
  // ============================================
  // NODE 1: Whole Notes (Discovery — extension of pulse per REQ-01)
  // ============================================
  {
    id: "rhythm_3_1",
    name: "Whole Notes",
    description: "Whole notes — four beats each, like four quarters held.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["q", "h", "w"],
      focusDurations: ["w"], // Family w_wr only — q/h are contextual.
      contextDurations: ["q", "h"],
      patternTags: ["quarter-half-whole"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Whole Notes (4 beats)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "w" }, // REQ-04
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

    skills: ["quarter_note", "half_note", "whole_note"],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Whole Practice (Practice)
  // ============================================
  {
    id: "rhythm_3_2",
    name: "Whole Practice",
    description: "Mix wholes, halves, and quarters in steady patterns.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_3_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w"],
      focusDurations: [],
      contextDurations: ["q", "h", "w"],
      patternTags: ["quarter-half-whole"],
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

    skills: ["quarter_note", "half_note", "whole_note"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Whole Rest (Discovery — REQ-02 rest woven adjacent to w)
  // ============================================
  {
    id: "rhythm_3_3",
    name: "Whole Rest",
    description: "Meet the whole rest — a full bar of silence.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_3_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w", "wr"],
      focusDurations: ["wr"], // REQ-02: rest introduced in matching duration unit.
      contextDurations: ["q", "h", "w"],
      patternTags: ["whole-rest"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Whole Rest (4 beats of silence)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "wr" }, // REQ-04
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

    skills: ["whole_note", "whole_rest"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mixed Wholes & Rests (Practice)
  // ============================================
  {
    id: "rhythm_3_4",
    name: "Mixed Wholes & Rests",
    description: "Combine wholes, halves, quarters, and whole rests.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_3_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w", "wr"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "wr"],
      patternTags: ["quarter-half-whole", "whole-rest"],
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

    skills: ["quarter_note", "half_note", "whole_note", "whole_rest"],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Whole Speed (Speed Round)
  // ============================================
  {
    id: "rhythm_3_5",
    name: "Whole Speed",
    description: "How fast can you read wholes and whole rests?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_3_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w", "wr"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "wr"],
      patternTags: ["quarter-half-whole", "whole-rest"],
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

    skills: ["quarter_note", "half_note", "whole_note", "whole_rest"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Whole Boss (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_3",
    name: "Whole Boss",
    description: "Master wholes and whole rests!",
    unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_3_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w", "wr"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "wr"],
      patternTags: ["quarter-half-whole", "whole-rest"],
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

    skills: ["quarter_note", "half_note", "whole_note", "whole_rest"],
    xpReward: 120,
    accessoryUnlock: "rhythm_badge_3",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit3Nodes;
