/**
 * Rhythm Unit 2: "Complete Basics" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces durations: Whole notes (4 beats)
 * - Builds on Unit 1: Quarter notes (1 beat) + Half notes (2 beats)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with variety (Discovery, Practice, Mix-Up, Speed Round, Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Complete basic duration vocabulary, feel the difference between long and short
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 2;
const UNIT_NAME = 'Complete Basics';
const CATEGORY = 'rhythm';
const START_ORDER = 107;   // After Unit 1's 7 nodes (100-106)

/**
 * Unit 2 Nodes
 * Psychological journey: Discovery -> Consolidation -> Contrast -> Application -> Variety -> Speed -> Mastery
 */
export const rhythmUnit2Nodes = [
  // ============================================
  // NODE 1: Meet Whole Notes (Discovery)
  // ============================================
  {
    id: 'rhythm_2_1',
    name: 'Meet Whole Notes',
    description: 'Learn to hold notes for 4 full beats',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_rhythm_1'],   // Requires completing Unit 1

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration (NO noteConfig for rhythm-only nodes)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'w'],
      focusDurations: ['w'],            // NEW: Whole notes are being introduced
      contextDurations: ['q', 'h'],     // Quarters and halves are already known
      patterns: ['quarter', 'half', 'whole'],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Whole Notes (4 beats)',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole'],
          tempo: 65,
          measuresPerPattern: 1,
          timeSignature: '4/4',
          difficulty: 'easy'
        }
      }
    ],

    // Progression
    skills: ['quarter_note', 'half_note', 'whole_note'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Practice Whole Notes (Practice)
  // ============================================
  {
    id: 'rhythm_2_2',
    name: 'Practice Whole Notes',
    description: 'Build confidence holding notes for 4 beats',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['rhythm_2_1'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'w'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w'],
      patterns: ['quarter', 'half', 'whole'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole'],
          tempo: 70,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'easy'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Long and Short (Discovery - Contrast)
  // ============================================
  {
    id: 'rhythm_2_3',
    name: 'Long and Short',
    description: 'Feel the difference between long and short notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['rhythm_2_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'w'],             // Focus on extremes: shortest vs longest
      focusDurations: [],                // Contrasting known durations
      contextDurations: ['q', 'w'],
      patterns: ['quarter', 'whole'],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Duration Contrast',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'whole'],
          tempo: 65,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'easy'
        }
      }
    ],

    skills: ['quarter_note', 'whole_note'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: All Basic Durations (Practice)
  // ============================================
  {
    id: 'rhythm_2_4',
    name: 'All Basic Durations',
    description: 'Practice with quarters, halves, and wholes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['rhythm_2_3'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'w'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w'],
      patterns: ['quarter', 'half', 'whole'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole'],
          tempo: 70,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'easy'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Duration Mix (Mix-Up)
  // ============================================
  {
    id: 'rhythm_2_5',
    name: 'Duration Mix',
    description: 'Mix all basic durations in creative patterns',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['rhythm_2_4'],

    nodeType: NODE_TYPES.MIX_UP,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'w'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w'],
      patterns: ['quarter', 'half', 'whole'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Pattern Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole'],
          tempo: 70,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'easy',
          patternVariety: true
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Speed Basics (Speed Round)
  // ============================================
  {
    id: 'rhythm_2_6',
    name: 'Speed Basics',
    description: 'How fast can you play all basic durations?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['rhythm_2_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'w'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w'],
      patterns: ['quarter', 'half', 'whole'],
      tempo: { min: 85, max: 95, default: 90 },   // Fixed fast tempo
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole'],
          tempo: 90,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Duration Master (Mini-Boss)
  // ============================================
  {
    id: 'boss_rhythm_2',
    name: 'Duration Master',
    description: 'Prove your mastery of all basic durations!',
    category: 'boss',                    // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['rhythm_2_6'],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'w'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w'],
      patterns: ['quarter', 'half', 'whole'],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Unit Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole'],
          tempo: 75,
          measuresPerPattern: 4,       // Longer patterns for boss
          timeSignature: '4/4',
          difficulty: 'intermediate',
          questionCount: 12
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note'],
    xpReward: 110,
    accessoryUnlock: 'rhythm_badge_2',
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default rhythmUnit2Nodes;
