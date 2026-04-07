/**
 * Rhythm Unit 1: "Basic Beats" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces durations: Quarter notes (1 beat), then Half notes (2 beats)
 * - Each node introduces exactly ONE new element
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with variety (Discovery, Practice, Mix-Up, Speed Round, Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Build confidence with steady beat, establish that learning is FUN
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 1;
const UNIT_NAME = "Rhythm Starters";
const CATEGORY = "rhythm";
const START_ORDER = 100;

/**
 * Unit 1 Nodes
 * Psychological journey: Curiosity -> Discovery -> Application -> Expansion -> Joy -> Speed -> Mastery
 */
export const rhythmUnit1Nodes = [
  // ============================================
  // NODE 1: Meet Quarter Notes (Discovery)
  // ============================================
  {
    id: "rhythm_1_1",
    name: "Meet Quarter Notes",
    description: "Learn to play steady quarter notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: [],

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration (NO noteConfig for rhythm-only nodes)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["q"],
      focusDurations: ["q"], // NEW: Quarter notes are being introduced
      contextDurations: [], // No previous durations yet
      patterns: ["quarter"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Quarter Notes (1 beat)",

    // Exercises
    exercises: [
      {
        // Pulse exercise: feel the beat before reading notation (CURR-05)
        type: EXERCISE_TYPES.RHYTHM_PULSE,
        config: {
          pulseOnly: true,
          tempo: 65,
          beats: 8,
          measureCount: 2,
          timeSignature: "4/4",
          pitch: "C4",
        },
      },
      {
        // G-01: RHYTHM -> RHYTHM_TAP (DISCOVERY policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["quarter-only"],
          tempo: 65,
          measureCount: 1,
          timeSignature: "4/4",
          difficulty: "beginner",
        },
      },
    ],

    // Progression
    skills: ["quarter_note"],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice Quarter Notes (Practice)
  // ============================================
  {
    id: "rhythm_1_2",
    name: "Practice Quarter Notes",
    description: "Build confidence with steady quarter notes",
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
      focusDurations: [], // No new durations
      contextDurations: ["q"],
      patterns: ["quarter"],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        // G-02: RHYTHM -> RHYTHM_TAP (PRACTICE policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["quarter-only"],
          tempo: 70,
          measureCount: 2,
          timeSignature: "4/4",
          difficulty: "beginner",
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
  // NODE 3: Meet Half Notes (Discovery)
  // ============================================
  {
    id: "rhythm_1_3",
    name: "Meet Half Notes",
    description: "Learn to hold notes for 2 beats",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_1_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h"],
      focusDurations: ["h"], // NEW: Half notes are being introduced
      contextDurations: ["q"], // Quarters are already known
      patterns: ["quarter", "half"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Half Notes (2 beats)",

    exercises: [
      {
        // Already RHYTHM_TAP — correct per DISCOVERY policy
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["quarter-half"],
          tempo: 65,
          measureCount: 1,
          timeSignature: "4/4",
          difficulty: "beginner",
        },
      },
    ],

    skills: ["quarter_note", "half_note"],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Practice Quarters and Halves (Practice)
  // ============================================
  {
    id: "rhythm_1_4",
    name: "Practice Quarters and Halves",
    description: "Combine quarter notes and half notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_1_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h"],
      focusDurations: [],
      contextDurations: ["q", "h"],
      patterns: ["quarter", "half"],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        // G-03: RHYTHM_DICTATION -> RHYTHM_TAP (PRACTICE policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["quarter-half"],
          tempo: 70,
          measureCount: 2,
          timeSignature: "4/4",
          difficulty: "beginner",
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
  // NODE 5: Rhythm Patterns (Mix-Up)
  // ============================================
  {
    id: "rhythm_1_5",
    name: "Rhythm Patterns",
    description: "Mix quarters and halves in fun patterns",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_1_4"],

    nodeType: NODE_TYPES.MIX_UP,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h"],
      focusDurations: [],
      contextDurations: ["q", "h"],
      patterns: ["quarter", "half"],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: "Pattern Challenge",

    exercises: [
      {
        // G-04: RHYTHM_TAP -> RHYTHM_DICTATION (MIX_UP policy)
        type: EXERCISE_TYPES.RHYTHM_DICTATION,
        config: {
          patternTags: ["quarter-half"],
          tempo: 70,
          measureCount: 1,
          timeSignature: "4/4",
          difficulty: "beginner",
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
  // NODE 6: Speed Challenge (Speed Round)
  // ============================================
  {
    id: "rhythm_1_6",
    name: "Speed Challenge",
    description: "How fast can you play quarters and halves?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_1_5"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h"],
      focusDurations: [],
      contextDurations: ["q", "h"],
      patterns: ["quarter", "half"],
      tempo: { min: 85, max: 95, default: 90 }, // Fixed fast tempo
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Speed Challenge",

    exercises: [
      {
        // G-05: RHYTHM -> ARCADE_RHYTHM (SPEED_ROUND policy)
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          patternTags: ["quarter-half"],
          tempo: 90,
          measureCount: 4,
          timeSignature: "4/4",
          difficulty: "intermediate",
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
  // NODE 7: Basic Beats Master (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_1",
    name: "Basic Beats Master",
    description: "Prove your mastery of quarters and halves!",
    unlockHint: "Complete all rhythm lessons above to unlock this challenge!",
    category: "boss", // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ["rhythm_1_6"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h"],
      focusDurations: [],
      contextDurations: ["q", "h"],
      patterns: ["quarter", "half"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Unit Challenge",

    exercises: [
      {
        // G-06: ARCADE_RHYTHM -> RHYTHM_TAP (MINI_BOSS policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["quarter-half"],
          tempo: 75,
          measureCount: 4,
          timeSignature: "4/4",
          difficulty: "intermediate",
          questionCount: 12, // More exercises
        },
      },
    ],

    skills: ["quarter_note", "half_note"],
    xpReward: 100,
    accessoryUnlock: "rhythm_badge_1",
    isBoss: false, // MINI_BOSS does NOT set isBoss: true
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit1Nodes;
