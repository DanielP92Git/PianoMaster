/**
 * Rhythm Unit 9: "Six-Eight Time" (Phase 1 v3.5 — pedagogical restructure)
 *
 * Second meter unit — compound 6/8 meter (two big beats per bar).
 * Repositions today's 6/8 content (was OLD U7) as the second meter unit,
 * following 3/4 (U8) in the new pedagogical order.
 *
 * 6-node arc per D-02 (non-duration unit):
 *   Discovery → Practice → Discovery (mixed contrast) → Practice → Speed → Mini-Boss
 *
 * Prerequisite: boss_rhythm_8 (3/4 Meter mini-boss).
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 9;
const UNIT_NAME = "Six-Eight Time";
const CATEGORY = "rhythm";
const START_ORDER = 180; // After U8 (170-175)

export const rhythmUnit9Nodes = [
  // ============================================
  // NODE 1: 6/8 Meter Intro (Discovery)
  // ============================================
  {
    id: "rhythm_9_1",
    name: "Meet 6/8 Time",
    description: "Feel the two big beats — compound meter introduced",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_8"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["qd", "q", "8"],
      focusDurations: ["6_8"], // Meter concept ID — DiscoveryIntroQuestion looks up cards["6_8"]
      contextDurations: [],
      patternTags: ["six-eight-basic"],
      tempo: { min: 55, max: 65, default: 60 },
      pitch: "C4",
      timeSignature: "6/8",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "6/8 Time: Two big beats per bar",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "6_8" },
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
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
  // NODE 2: 6/8 Practice
  // ============================================
  {
    id: "rhythm_9_2",
    name: "6/8 Pulse Practice",
    description: "Count six eighth notes per bar in 6/8 time",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_9_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight-basic"],
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
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: 6/8 with Eighth Subdivisions (Discovery)
  // ============================================
  {
    id: "rhythm_9_3",
    name: "Eighths in 6/8",
    description: "Add eighth-note subdivisions — three per big beat",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_9_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight-qd-eighths"],
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
            { type: "visual_recognition" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "visual_recognition" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["68_compound_meter", "eighth_note_68"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mixed 6/8 Practice
  // ============================================
  {
    id: "rhythm_9_4",
    name: "Mixed 6/8 Patterns",
    description: "Mix dotted-quarter, quarter, and eighth in 6/8",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_9_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight-basic", "six-eight-qd-eighths"],
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
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: 6/8 Speed Round
  // ============================================
  {
    id: "rhythm_9_5",
    name: "6/8 Speed Drill",
    description: "How fast can you play 6/8 patterns?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_9_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight-basic", "six-eight-qd-eighths"],
      patternTagMode: "any", // Speed round spans both tags; AND-mode would resolve 0 patterns.
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

    skills: ["68_compound_meter", "eighth_note_68"],
    xpReward: 95,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: 6/8 Mini-Boss
  // ============================================
  {
    id: "boss_rhythm_9",
    name: "6/8 Meter Boss",
    description: "Master 6/8 compound meter!",
    unlockHint: "Complete all 6/8 lessons to unlock this challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_9_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["qd", "q", "8"],
      focusDurations: [],
      contextDurations: ["qd", "q", "8"],
      patternTags: ["six-eight-basic", "six-eight-qd-eighths"],
      patternTagMode: "any",
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
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
            { type: "syllable_matching" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
          ],
        },
      },
    ],

    skills: ["68_compound_meter", "dotted_quarter_note", "eighth_note_68"],
    xpReward: 170,
    accessoryUnlock: "rhythm_six_eight_badge",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit9Nodes;
