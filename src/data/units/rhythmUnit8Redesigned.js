/**
 * Rhythm Unit 8: "Off-Beat Magic" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - 5-step syncopation ramp:
 *     1. q-h-q discovery + practice (strict, 1 bar)
 *     2. q-h-q longer (2 bars, mixed with basic q+h shapes)
 *     3. 8-q-8 discovery + practice (1 bar)
 *     4. 8-q-8 longer (2 bars, mixed with basic q+h shapes)
 *     5. q-h-q + 8-q-8 combined (2 bars, mixed with basic q+h shapes)
 * - Capstone unit of the rhythm path — builds on 6/8 compound meter (Unit 7)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 8 nodes total: 5 syncopation core + Mixed Practice + Speed Round + TRUE BOSS
 *
 * Duration: 30-35 minutes (3-4 min per node)
 * Goal: Master syncopation patterns, prove mastery of both 6/8 and 4/4 in epic final boss
 */

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 8;
const UNIT_NAME = "Syncopation";
const CATEGORY = "rhythm";
const START_ORDER = 144; // After Unit 7's 6 nodes (138-143)

/**
 * Unit 8 Nodes
 * Psychological journey: q-h-q Discovery -> q-h-q Longer 2-bar -> 8-q-8 Discovery ->
 *   8-q-8 Longer 2-bar -> Combined 2-bar -> Mixed Practice -> Speed -> TRUE BOSS
 * NOTE: This unit's final node is NODE_TYPES.BOSS (true boss) as the capstone of ALL rhythm content
 */
export const rhythmUnit8Nodes = [
  // ============================================
  // NODE 1: Hold Across the Beat (q-h-q Discovery, strict)
  // ============================================
  {
    id: "rhythm_8_1",
    name: "Hold Across the Beat",
    description:
      "Discover syncopation using long notes — a half held over beat 3",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_7"],

    nodeType: NODE_TYPES.DISCOVERY,

    // Strict q-h-q: long-syncopation tag is scoped to ONLY q_44_003 in the pattern
    // library, so every rendered bar in this node is the canonical q | h | q.
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h"],
      focusDurations: ["h"],
      contextDurations: ["q"],
      patternTags: ["long-syncopation"],
      tempo: { min: 58, max: 65, default: 62 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Syncopation: Hold across the beat!",

    // Discovery mix biased toward listen-and-tap + notation reading so the
    // games immediately practice the q-h-q rhythm the intro just taught.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "h" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_long_value"],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Long-Value Phrases (q-h-q Practice, 2 bars + basic q+h)
  // ============================================
  {
    id: "rhythm_8_2",
    name: "Long-Note Off-Beats",
    description:
      "Practice 2-bar phrases mixing q-h-q syncopation with basic quarter/half rhythms",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_8_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h"],
      focusDurations: [],
      contextDurations: ["q", "h"],
      // OR-pool: q-h-q syncopation (long-syncopation) + non-syncopated q+h shapes
      // (quarter-half). Each of the 2 bars is drawn independently.
      patternTags: ["long-syncopation", "quarter-half"],
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 65, max: 72, default: 70 },
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

    skills: ["syncopation_long_value"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Between the Beats (8-q-8 Discovery)
  // ============================================
  {
    id: "rhythm_8_3",
    name: "Intro to Syncopation",
    description: "Discover syncopation — accents between the beats",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_8_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["8", "q"],
      focusDurations: ["8"],
      contextDurations: ["q"],
      patternTags: ["syncopation"],
      tempo: { min: 65, max: 70, default: 67 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: "Syncopation: Tap between the beats!",

    // Discovery mix biased toward listen-and-tap + notation reading so the
    // games immediately practice the 8-q-8 rhythm the intro just taught.
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "discovery_intro", focusDuration: "8" },
            { type: "rhythm_tap" },
            { type: "visual_recognition" },
            { type: "rhythm_reading" },
            { type: "syllable_matching" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
          ],
        },
      },
    ],

    skills: ["syncopation_eighth_quarter"],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Short-Value Phrases (8-q-8 Practice, 2 bars + basic q+h)
  // ============================================
  {
    id: "rhythm_8_4",
    name: "Between the Beats",
    description:
      "Practice 2-bar phrases mixing 8-q-8 syncopation with basic quarter/half rhythms",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_8_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      // OR-pool: 8-q-8 syncopation + non-syncopated q-only and q+h shapes for
      // breathing room. Each of the 2 bars is drawn independently.
      patternTags: ["syncopation", "quarter-only", "quarter-half"],
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 68, max: 75, default: 72 },
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

    skills: ["syncopation_eighth_quarter"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Combined Syncopation (q-h-q + 8-q-8, 2 bars + basic q+h)
  // ============================================
  {
    id: "rhythm_8_5",
    name: "Combined Syncopation",
    description:
      "Combine long-value and short-value syncopation in 2-bar phrases",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_8_4"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      // OR-pool: both syncopation families + simple value shapes. Each of the
      // 2 bars is drawn independently, producing phrases like
      //   | q h q | 8-q-8 q q |   or   | 8-q-8 q q | h h |.
      patternTags: [
        "long-syncopation",
        "syncopation",
        "quarter-only",
        "quarter-half",
      ],
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 70, max: 78, default: 74 },
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

    skills: ["syncopation_long_value", "syncopation_eighth_quarter"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Syncopation in Phrases (Mixed Syncopation Practice, strict)
  // ============================================
  {
    id: "rhythm_8_6",
    name: "Syncopation in Phrases",
    description: "Pure syncopation phrases — every bar carries q-h-q or 8-q-8",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_8_5"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      // Strict syncopation pool — no basic q+h fallback bars.
      patternTags: ["long-syncopation", "syncopation"],
      patternTagMode: "any",
      measureCount: 2,
      tempo: { min: 72, max: 80, default: 76 },
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

    skills: ["syncopation_long_value", "syncopation_eighth_quarter"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 7: Rapid Syncopation (Speed Round)
  // ============================================
  {
    id: "rhythm_8_7",
    name: "Syncopation Speed Drill",
    description: "How fast can you play syncopated rhythms?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ["rhythm_8_6"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ["q", "h", "8"],
      focusDurations: [],
      contextDurations: ["q", "h", "8"],
      // D-19 cumulative speed-pool — minus dotted-syncopation/dotted-quarter
      // (the dotted-quarter intro node was removed in favor of the combined
      // q-h-q + 8-q-8 node). U7 six-eight excluded — different time signature.
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "quarter-rest",
        "long-syncopation",
        "syncopation",
      ],
      patternTagMode: "any",
      tempo: { min: 80, max: 85, default: 83 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Syncopation Speed Challenge",

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          difficulty: "advanced",
        },
      },
    ],

    skills: ["syncopation_long_value", "syncopation_eighth_quarter"],
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 8: Rhythm Master (BOSS — capstone of ALL rhythm content)
  // ============================================
  {
    id: "boss_rhythm_8",
    name: "Syncopation Boss",
    description: "Master syncopation and combine it with 6/8!",
    unlockHint:
      "Master all syncopation patterns to face the ultimate rhythm challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ["rhythm_8_7"],

    nodeType: NODE_TYPES.BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      // Cumulative U1-U8 durations — qd retained because dotted quarter is
      // still introduced in earlier units (Unit 5/6/7). dotted-syncopation
      // tag dropped since Unit 8 no longer teaches that specific gesture.
      durations: ["q", "h", "w", "8", "16", "qr", "hr", "wr", "hd", "qd"],
      focusDurations: [],
      contextDurations: [
        "q",
        "h",
        "w",
        "8",
        "16",
        "qr",
        "hr",
        "wr",
        "hd",
        "qd",
      ],
      patternTags: [
        "quarter-only",
        "quarter-half",
        "quarter-half-whole",
        "quarter-eighth",
        "quarter-half-whole-eighth",
        "quarter-rest",
        "half-rest",
        "whole-rest",
        "dotted-half",
        "dotted-quarter",
        "sixteenth",
        "long-syncopation",
        "syncopation",
      ],
      patternTagMode: "any",
      measureCount: 4, // D-08: full BOSS uses 4-bar patterns
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "4/4",
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: "Ultimate Rhythm Challenge!",

    // Challenge-heavy question mix (dictation + reading emphasis, minimal tap)
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_dictation" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
            { type: "rhythm_reading" },
            { type: "rhythm_dictation" },
          ],
        },
      },
    ],

    skills: [
      "68_compound_meter",
      "syncopation_long_value",
      "syncopation_eighth_quarter",
    ],
    xpReward: 250,
    accessoryUnlock: "advanced_rhythm_badge",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit8Nodes;
