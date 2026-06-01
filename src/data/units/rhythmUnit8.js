// src/data/units/rhythmUnit8.js
// Phase 1 v3.5 — Unit 8: Three-Four Time (3/4 Meter — first meter unit per D-01).
// Occupies the rhythm_8_* namespace freed by Plan 02 (hidden syncopation renamed
// to the synco_* namespace; see Plan 02 for the rename map).
//
// 6-node arc per D-02 (meter-flavor non-duration):
//   Intro -> Practice -> Discovery (mixed contrast) -> Practice -> Speed -> Mini-Boss
//
// Meter-unit concept signal (D-14 validateConceptPerUnit):
//   timeSignature='3/4' on EVERY node — this is how the validator detects meter units.
//
// rhythm_8_1 first question is { type: 'discovery_intro', focusDuration: '3_4' }.
// '3_4' is a META concept ID (not a DURATION_INFO code) — DiscoveryIntroQuestion
// looks it up in its CONCEPT_CARDS map (per Plan 09 extension) which mirrors
// common.json's `game.discovery.cards["3_4"]` block authored in Plan 03.
//
// Allowed durations in 3/4: q (1 beat), h (2 beats), hd (3 beats — full measure).
// Waltz-friendly note values. dotted-half fills the bar.
//
// Pattern tags (verified against src/data/patterns/rhythmPatterns.js 2026-06-01):
//   - "three-four": 14+ pattern matches in rhythmPatterns.js (resolveByTags returns non-null in 3/4)

import {
  NODE_TYPES,
  RHYTHM_COMPLEXITY,
  NEW_CONTENT_TYPES,
} from "../nodeTypes.js";
import { EXERCISE_TYPES } from "../constants.js";

const UNIT_ID = 8;
const UNIT_NAME = "Three-Four Time";
const CATEGORY = "rhythm";
const START_ORDER = 170;

const rhythmUnit8Nodes = [
  // ============================================
  // NODE 1: Meet 3/4 Time (Discovery)
  // ============================================
  {
    id: "rhythm_8_1",
    name: "Meet 3/4 Time",
    description: "Waltz time — three beats per measure. Feel the new pulse.",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ["boss_rhythm_7"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: ["3_4"], // meter concept ID (per D-08); not a duration code
      contextDurations: ["q", "h", "hd"],
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
            { type: "discovery_intro", focusDuration: "3_4" },
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
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Practice 3/4 Time (Practice)
  // ============================================
  {
    id: "rhythm_8_2",
    name: "Practice 3/4 Time",
    description: "Build confidence with three-beat measures",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ["rhythm_8_1"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["three-four"],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "3/4",
      beatsPerMeasure: 3,
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

    skills: ["three_four_time"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: 3/4 in Context (Discovery, contrast-only)
  // ============================================
  {
    id: "rhythm_8_3",
    name: "Three-Four in Context",
    description: "Mix waltz rhythms with familiar durations",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ["rhythm_8_2"],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [], // contrast-only
      contextDurations: ["q", "h", "hd"],
      patternTags: ["three-four"],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "3/4",
      beatsPerMeasure: 3,
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
            { type: "syllable_matching" },
            { type: "rhythm_dictation" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["three_four_time"],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: 3/4 Practice (Practice)
  // ============================================
  {
    id: "rhythm_8_4",
    name: "Three-Four Practice",
    description: "Strengthen your 3/4 reading and tapping",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ["rhythm_8_3"],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["three-four"],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "3/4",
      beatsPerMeasure: 3,
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
            { type: "rhythm_dictation" },
            { type: "syllable_matching" },
            { type: "visual_recognition" },
            { type: "rhythm_tap" },
            { type: "rhythm_reading" },
            { type: "rhythm_tap" },
          ],
        },
      },
    ],

    skills: ["three_four_time"],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: 3/4 Speed (Speed Round)
  // ============================================
  {
    id: "rhythm_8_5",
    name: "Three-Four Speed Drill",
    description: "How fast can you play 3/4 rhythms?",
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ["rhythm_8_4"],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["three-four"],
      patternTagMode: "any",
      tempo: { min: 90, max: 100, default: 95 },
      pitch: "C4",
      timeSignature: "3/4",
      beatsPerMeasure: 3,
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

    skills: ["three_four_time"],
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: 3/4 Mini-Boss
  // ============================================
  {
    id: "boss_rhythm_8",
    name: "Three-Four Boss",
    description: "Master 3/4 time!",
    unlockHint: "Complete all lessons in this unit to unlock the challenge!",
    category: "boss",
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ["rhythm_8_5"],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ["q", "h", "hd"],
      focusDurations: [],
      contextDurations: ["q", "h", "hd"],
      patternTags: ["three-four"],
      patternTagMode: "any", // D-06 cumulative boss patterns (3/4 single-tag family)
      tempo: { min: 75, max: 85, default: 80 },
      pitch: "C4",
      timeSignature: "3/4",
      beatsPerMeasure: 3,
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

    skills: ["three_four_time"],
    xpReward: 160,
    accessoryUnlock: "rhythm_badge_8",
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default rhythmUnit8Nodes;
