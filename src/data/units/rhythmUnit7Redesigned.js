/**
 * Rhythm Unit 7: "Big Beats" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces: 6/8 compound meter (two big beats per bar)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 6 nodes: Discovery -> Practice -> Discovery -> Practice -> Speed -> Mini-Boss
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
const START_ORDER = 138; // After Unit 6's 6 nodes (132-137)

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

    // Rhythm configuration — dotted-quarter only, very slow for discovery
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["qd"],
      focusDurations: ["qd"], // NEW: Dotted-quarter as the primary 6/8 beat
      contextDurations: [],
      patternTags: ["six-eight"],
      tempo: { min: 55, max: 60, default: 58 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "6/8 Time: Two big beats per bar",

    // Exercises
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
      patternTags: ["six-eight"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "6/8",
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
      focusDurations: ["q"], // NEW: Quarter notes in 6/8
      contextDurations: ["qd"],
      patternTags: ["six-eight"],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Quarter Notes in 6/8",

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

    skills: ["68_compound_meter", "quarter_note_68"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mixing It Up (Practice)
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

    nodeType: NODE_TYPES.PRACTICE,

    // Add eighth notes — the subdivision unit in 6/8 time
    // ONE-CONCEPT FIX: focusDurations cleared (eighth notes already known from Unit 3;
    // their use in 6/8 is contextual reinforcement, not a new concept)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["qd", "q", "8"],
      focusDurations: [], // FIXED: was ['8'] — eighth notes already known from Unit 3
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight"],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: "C4",
      timeSignature: "6/8",
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

    skills: ["68_compound_meter", "eighth_note_68"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Quick Beats (Speed Round)
  // ============================================
  {
    id: "rhythm_7_6",
    name: "Quick Beats",
    description: "Fast 6/8 patterns — how quick can you go?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_7_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight"],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "6/8 Speed Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
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
  // NODE 6: Compound Commander (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_7",
    name: "Compound Commander",
    description: "Prove your mastery of 6/8 compound meter!",
    unlockHint: "Complete all 6/8 lessons to unlock this challenge!",
    category: "boss", // Mini-Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_7_6"],

    // MINI-BOSS node (not a true Boss) — unit checkpoint
    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight"], // 6/8 is a standalone time signature pool
      patternTagMode: "any", // D-06: OR-mode for consistency with other boss nodes
      tempo: { min: 80, max: 90, default: 85 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "6/8 Mastery Check",

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

    skills: ["68_compound_meter", "dotted_quarter_note", "eighth_note"],
    xpReward: 150,
    accessoryUnlock: "compound_badge",
    isBoss: false, // MINI_BOSS does NOT set isBoss: true
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit7Nodes;
