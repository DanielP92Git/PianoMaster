/**
 * Rhythm Unit 7: "Big Beats" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces: 6/8 compound meter (two big beats per bar)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes: Discovery -> Practice -> Discovery -> Discovery -> Mix-Up -> Speed -> Mini-Boss
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Feel "two big beats per bar" before encountering syncopation in Unit 8
 *
 * Prerequisite: boss_rhythm_6 (completes Unit 6 — Speed Champions)
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 7;
const UNIT_NAME = "Big Beats";
const CATEGORY = "rhythm";
const START_ORDER = 142; // After Unit 6's 7 nodes (135-141)

/**
 * Unit 7 Nodes
 * Psychological journey: Discover compound meter -> Build confidence -> Add quarters ->
 * Mix all 6/8 durations -> Mix-Up game -> Speed challenge -> Mini-Boss
 */
export const rhythmUnit7Nodes = [
  // ============================================
  // NODE 1: Two Big Beats (Discovery)
  // ============================================
  {
    id: "rhythm_7_1",
    name: "Two Big Beats",
    description: "Feel the swing of 6/8 time — two big beats per bar",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_6"],

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration — compound-basic patterns, very slow for discovery
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["qd"],
      focusDurations: [], // C-01 fix: concept is 6/8 meter, not the duration 'qd'
      contextDurations: [],
      patterns: ["dotted-quarter"],
      tempo: { min: 55, max: 60, default: 58 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "6/8 Compound Meter (Two Big Beats)", // C-01 fix

    // Exercises
    exercises: [
      {
        // G-34: RHYTHM -> RHYTHM_TAP (DISCOVERY policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["compound-basic"],
          tempo: 58,
          measureCount: 1,
          timeSignature: "6/8",
          difficulty: "beginner",
        },
      },
    ],

    // Progression
    skills: ["68_compound_meter"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Feel the Pulse (Practice)
  // ============================================
  {
    id: "rhythm_7_2",
    name: "Feel the Pulse",
    description: "Build confidence with the 6/8 groove",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_7_1"],

    nodeType: NODE_TYPES.PRACTICE,

    // Still dotted-quarter only — building confidence before introducing new durations
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["qd"],
      focusDurations: [],
      contextDurations: ["qd"],
      patterns: ["dotted-quarter"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        // G-35: RHYTHM -> RHYTHM_TAP (PRACTICE policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["compound-basic"],
          tempo: 65,
          measureCount: 2,
          timeSignature: "6/8",
          difficulty: "beginner",
        },
      },
    ],

    skills: ["68_compound_meter"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Adding Quarters (Discovery)
  // ============================================
  {
    id: "rhythm_7_3",
    name: "Adding Quarters",
    description: "Quarter notes fit two eighth-note subdivisions in 6/8",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_7_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    // Introduce quarter notes in 6/8 (2 eighth-note subdivisions)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["qd", "q"],
      focusDurations: [], // C-02 fix: concept is 'Quarter Notes within 6/8 Context'
      contextDurations: ["qd"],
      patterns: ["dotted-quarter", "quarter"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Quarter Notes within 6/8 Context", // C-02 fix

    exercises: [
      {
        // Already RHYTHM_TAP — correct per DISCOVERY policy
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["compound-basic"],
          tempo: 65,
          measureCount: 1,
          timeSignature: "6/8",
          difficulty: "beginner",
        },
      },
    ],

    skills: ["68_compound_meter", "quarter_note_68"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mixing It Up (Discovery — changed from Practice per C-03)
  // ============================================
  {
    id: "rhythm_7_4",
    name: "Mixing It Up",
    description: "Add eighth notes — the natural subdivision of 6/8",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_7_3"],

    // C-03 fix: changed from NODE_TYPES.PRACTICE to NODE_TYPES.DISCOVERY
    // This node introduces eighth notes in 6/8 context — a new concept
    nodeType: NODE_TYPES.DISCOVERY,

    // Add eighth notes — the subdivision unit in 6/8 time
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["qd", "q", "8"],
      focusDurations: [], // C-03 fix: concept is 'Eighth Notes within 6/8 Context'
      contextDurations: ["qd", "q"],
      patterns: ["dotted-quarter", "quarter", "eighth"],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Eighth Notes within 6/8 Context", // C-03 fix

    exercises: [
      {
        // G-36: RHYTHM_DICTATION -> RHYTHM_TAP (DISCOVERY policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["compound-mixed"],
          tempo: 70,
          measureCount: 1,
          timeSignature: "6/8",
          difficulty: "intermediate",
        },
      },
    ],

    skills: ["68_compound_meter", "eighth_note_68"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Compound Cocktail (Mix-Up)
  // ============================================
  {
    id: "rhythm_7_5",
    name: "Compound Cocktail",
    description: "All 6/8 rhythms together in a fun mix",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_7_4"],

    nodeType: NODE_TYPES.MIX_UP,

    // All 6/8 durations freely mixed
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patterns: ["dotted-quarter", "quarter", "eighth"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: "All 6/8 Rhythms",

    exercises: [
      {
        // G-37: RHYTHM_TAP -> RHYTHM_DICTATION (MIX_UP policy)
        type: EXERCISE_TYPES.RHYTHM_DICTATION,
        config: {
          patternTags: ["compound-basic", "compound-mixed"],
          tempo: 75,
          measureCount: 1,
          timeSignature: "6/8",
          difficulty: "intermediate",
        },
      },
    ],

    skills: ["68_compound_meter", "quarter_note_68", "eighth_note_68"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Quick Beats (Speed Round)
  // ============================================
  {
    id: "rhythm_7_6",
    name: "Quick Beats",
    description: "Fast 6/8 patterns — how quick can you go?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_7_5"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patterns: ["dotted-quarter", "quarter", "eighth"],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "6/8 Speed Challenge",

    exercises: [
      {
        // G-38: RHYTHM -> ARCADE_RHYTHM (SPEED_ROUND policy)
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          patternTags: ["compound-basic", "compound-mixed"],
          tempo: 85,
          measureCount: 4,
          timeSignature: "6/8",
          difficulty: "advanced",
        },
      },
    ],

    skills: ["68_compound_meter", "quarter_note_68", "eighth_note_68"],
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 7: Compound Commander (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_7",
    name: "Compound Commander",
    description: "Prove your mastery of 6/8 compound meter!",
    unlockHint: "Complete all 6/8 lessons to unlock this challenge!",
    category: "boss", // Mini-Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ["rhythm_7_6"],

    // MINI-BOSS node (not a true Boss) — unit checkpoint
    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patterns: ["dotted-quarter", "quarter", "eighth"],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "6/8 Mastery Check",

    exercises: [
      {
        // G-39: ARCADE_RHYTHM -> RHYTHM_TAP (MINI_BOSS policy)
        type: EXERCISE_TYPES.RHYTHM_TAP,
        config: {
          patternTags: ["compound-basic", "compound-mixed"],
          tempo: 85,
          measureCount: 4,
          timeSignature: "6/8",
          difficulty: "intermediate",
          questionCount: 10,
        },
      },
    ],

    skills: ["68_compound_meter", "dotted_quarter_note", "eighth_note"],
    xpReward: 150,
    accessoryUnlock: "compound_badge",
    isBoss: false, // MINI_BOSS does NOT set isBoss: true
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit7Nodes;
