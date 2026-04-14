/**
 * Rhythm Unit 5: "Dotted Notes" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces durations: Dotted half note (3 beats), Dotted quarter note (1.5 beats)
 * - Introduces 3/4 time signature (waltz time)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with 4 Discovery nodes (one for each new concept)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Understand how dots add half the original value, experience 3/4 time
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 5;
const UNIT_NAME = "Magic Dots";
const CATEGORY = "rhythm";
const START_ORDER = 128; // After Unit 4's 7 nodes (121-127)

/**
 * Unit 5 Nodes
 * Psychological journey: Dotted Half -> Practice -> 3/4 Time -> Dotted Quarter -> Practice All -> Speed -> Mastery
 * NOTE: This unit has 4 Discovery nodes to properly introduce each new concept
 */
export const rhythmUnit5Nodes = [
  // ============================================
  // NODE 1: Meet Dotted Half Notes (Discovery)
  // ============================================
  {
    id: "rhythm_5_1",
    name: "Meet Dotted Half Notes",
    description: "Learn notes that last 3 beats",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_4"], // Requires completing Unit 4

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration with dotted notes
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "w", "8", "qr", "hr", "wr", "hd"],
      focusDurations: ["hd"], // NEW: Dotted half note is being introduced
      contextDurations: ["q", "h", "w", "8", "qr", "hr", "wr"],
      patternTags: ["dotted-half"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Dotted Half Note (3 beats)",

    // Exercises
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

    // Progression
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
    id: "rhythm_5_2",
    name: "Practice Dotted Halves",
    description: "Build confidence with 3-beat notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_5_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "w", "8", "qr", "hr", "wr", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "w", "8", "qr", "hr", "wr", "hd"],
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
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Waltz Time - 3/4 (Discovery)
  // ============================================
  {
    id: "rhythm_5_3",
    name: "Waltz Time (3/4)",
    description: "Learn to play in 3/4 time - 3 beats per measure",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_5_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "hd"],
      focusDurations: [], // Focus is on time signature, not new durations
      contextDurations: ["q", "hd"],
      patternTags: ["three-four"],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: "C4",
      timeSignature: "3/4",
      beatsPerMeasure: 3,
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "3/4 Time (Waltz)",

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "visual_recognition" },
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

    skills: ["three_four_time"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Meet Dotted Quarter Notes (Discovery)
  // ============================================
  {
    id: "rhythm_5_4",
    name: "Meet Dotted Quarter Notes",
    description: "Learn notes that last 1.5 beats",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_5_3"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "8", "qd"],
      focusDurations: ["qd"], // NEW: Dotted quarter is being introduced
      contextDurations: ["q", "8"], // Quarters and eighths are already known
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
  // NODE 5: Practice All Dotted Notes (Practice)
  // ============================================
  {
    id: "rhythm_5_5",
    name: "Practice All Dotted Notes",
    description: "Master both dotted half and dotted quarter notes",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_5_4"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "hd", "qd", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd", "qd", "8"],
      patternTags: ["dotted-half", "dotted-quarter"],
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

    skills: ["dotted_half_note", "dotted_quarter_note"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Speed Dots (Speed Round)
  // ============================================
  {
    id: "rhythm_5_6",
    name: "Speed Dots",
    description: "How fast can you play dotted rhythms?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_5_5"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "hd", "qd", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd", "qd", "8"],
      patternTags: ["dotted-half", "dotted-quarter"],
      tempo: { min: 90, max: 100, default: 95 }, // Fixed fast tempo
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

    skills: ["dotted_half_note", "dotted_quarter_note"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 7: Dotted Notes Master (Mini-Boss)
  // ============================================
  {
    id: "boss_rhythm_5",
    name: "Dotted Notes Master",
    description: "Prove your mastery of dotted notes and 3/4 time!",
    unlockHint: "Complete all lessons in this unit to unlock the challenge!",
    category: "boss", // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ["rhythm_5_6"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "hd", "qd", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd", "qd", "8"],
      patternTags: ["dotted-half", "dotted-quarter"],
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

    skills: ["dotted_half_note", "dotted_quarter_note", "three_four_time"],
    xpReward: 140,
    accessoryUnlock: "rhythm_badge_5",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit5Nodes;
