/**
 * Rhythm Unit 2: "Complete Basics" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces durations: Whole notes (4 beats)
 * - Builds on Unit 1: Quarter notes (1 beat) + Half notes (2 beats)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 6 nodes with variety (Discovery, Practice, Speed Round, Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Complete basic duration vocabulary, feel the difference between long and short
 *
 * Phase 22 migration: patternTags replace patterns field; exercise types corrected per audit.
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 2;
const UNIT_NAME = "Beat Builders";
const CATEGORY = "rhythm";
const START_ORDER = 106; // After Unit 1's 6 nodes (100-105)

/**
 * Unit 2 Nodes
 * Psychological journey: Discovery -> Consolidation -> Contrast -> Application -> Variety -> Speed -> Mastery
 */
export const rhythmUnit2Nodes = [
  // ============================================
  // NODE 1: Meet Whole Notes (Discovery)
  // ============================================
  {
    id: "rhythm_2_1",
    name: "Meet Whole Notes",
    description: "Learn to hold notes for 4 full beats",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_1"], // Requires completing Unit 1

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration (NO noteConfig for rhythm-only nodes)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w"],
      focusDurations: ["w"], // NEW: Whole notes are being introduced
      contextDurations: ["q", "h"], // Quarters and halves are already known
      patternTags: ["quarter-half-whole"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Whole Notes (4 beats)",

    // Exercises — DISCOVERY: notation-weighted question sequence
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "w" },
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

    // Progression
    skills: ["quarter_note", "half_note", "whole_note"],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice Whole Notes (Practice)
  // ============================================
  {
    id: "rhythm_2_2",
    name: "Practice Whole Notes",
    description: "Build confidence holding notes for 4 beats",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_2_1"],

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
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Long and Short (Discovery - Contrast)
  // ============================================
  {
    id: "rhythm_2_3",
    name: "Long and Short",
    description: "Feel the difference between long and short notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_2_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w"],
      focusDurations: [], // Contrasting known durations
      contextDurations: ["q", "h", "w"],
      patternTags: ["quarter-half", "quarter-half-whole"],
      tempo: { min: 60, max: 70, default: 65 },
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
            { type: "discovery_intro", focusDuration: "q" },
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

    skills: ["quarter_note", "half_note", "whole_note"],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: All Basic Durations (Practice)
  // ============================================
  {
    id: "rhythm_2_4",
    name: "All Basic Durations",
    description: "Practice with quarters, halves, and wholes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_2_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w"],
      focusDurations: [],
      contextDurations: ["q", "h", "w"],
      patternTags: ["quarter-half", "quarter-half-whole"],
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
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Speed Basics (Speed Round)
  // ============================================
  {
    id: "rhythm_2_6",
    name: "Speed Basics",
    description: "How fast can you play all basic durations?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_2_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w"],
      focusDurations: [],
      contextDurations: ["q", "h", "w"],
      patternTags: ["quarter-half", "quarter-half-whole"],
      tempo: { min: 85, max: 95, default: 90 }, // Fixed fast tempo
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

    skills: ["quarter_note", "half_note", "whole_note"],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Duration Master (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_2",
    name: "Duration Master",
    description: "Prove your mastery of all basic durations!",
    unlockHint: "Complete all lessons in this unit to unlock the challenge!",
    category: "boss", // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_2_6"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "w"],
      focusDurations: [],
      contextDurations: ["q", "h", "w"],
      patternTags: ["quarter-only", "quarter-half", "quarter-half-whole"], // D-06: cumulative U1+U2
      patternTagMode: "any", // D-06: OR-mode for cumulative boss patterns
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
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["quarter_note", "half_note", "whole_note"],
    xpReward: 110,
    accessoryUnlock: "rhythm_badge_2",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit2Nodes;
