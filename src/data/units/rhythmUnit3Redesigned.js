/**
 * Rhythm Unit 3: "Running Notes" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces durations: Eighth notes (1/2 beat)
 * - Builds on Units 1-2: Quarter notes (1 beat) + Half notes (2 beats) + Whole notes (4 beats)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with variety (Discovery, Practice, Mix-Up, Speed Round, Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Feel the difference between walking (quarter) and running (eighth) notes
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 3;
const UNIT_NAME = 'Fast Note Friends';
const CATEGORY = 'rhythm';
const START_ORDER = 114;   // After Unit 2's 7 nodes (107-113)

/**
 * Unit 3 Nodes
 * Psychological journey: Discovery -> Practice -> Contrast -> Application -> Variety -> Speed -> Mastery
 */
export const rhythmUnit3Nodes = [
  // ============================================
  // NODE 1: Meet Eighth Notes (Discovery)
  // ============================================
  {
    id: 'rhythm_3_1',
    name: 'Meet Eighth Notes',
    description: 'Learn to play two notes per beat',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_rhythm_2'],   // Requires completing Unit 2

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration (NO noteConfig for rhythm-only nodes)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', '8'],
      focusDurations: ['8'],              // NEW: Eighth notes are being introduced
      contextDurations: ['q'],            // Quarter notes are already known
      patterns: ['quarter', 'eighth'],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Eighth Notes (1/2 beat)',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'eighth'],
          tempo: 75,
          measuresPerPattern: 1,
          timeSignature: '4/4',
          difficulty: 'intermediate'
        }
      }
    ],

    // Progression
    skills: ['quarter_note', 'eighth_note'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Practice Eighth Notes (Practice)
  // ============================================
  {
    id: 'rhythm_3_2',
    name: 'Practice Eighth Notes',
    description: 'Build confidence with two notes per beat',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['rhythm_3_1'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', '8'],
      focusDurations: [],
      contextDurations: ['q', '8'],
      patterns: ['quarter', 'eighth'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'eighth'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate'
        }
      }
    ],

    skills: ['quarter_note', 'eighth_note'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Running and Walking (Discovery - Contrast)
  // ============================================
  {
    id: 'rhythm_3_3',
    name: 'Running and Walking',
    description: 'Feel the difference between walking (quarter) and running (eighth)',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['rhythm_3_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', '8'],
      focusDurations: [],                 // Contrasting known durations
      contextDurations: ['q', 'h', '8'],
      patterns: ['quarter', 'half', 'eighth'],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Duration Contrast',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth'],
          tempo: 75,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'eighth_note'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Mix It Up (Practice)
  // ============================================
  {
    id: 'rhythm_3_4',
    name: 'Mix It Up',
    description: 'Practice mixing quarters, halves, and eighths',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['rhythm_3_3'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', '8'],
      focusDurations: [],
      contextDurations: ['q', 'h', '8'],
      patterns: ['quarter', 'half', 'eighth'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'eighth_note'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Rhythm Variety (Mix-Up)
  // ============================================
  {
    id: 'rhythm_3_5',
    name: 'Rhythm Variety',
    description: 'Play patterns with all your rhythm knowledge',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['rhythm_3_4'],

    nodeType: NODE_TYPES.MIX_UP,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', 'w', '8'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w', '8'],
      patterns: ['quarter', 'half', 'whole', 'eighth'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Pattern Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole', 'eighth'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          patternVariety: true
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note', 'eighth_note'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Speed Running (Speed Round)
  // ============================================
  {
    id: 'rhythm_3_6',
    name: 'Speed Running',
    description: 'How fast can you play running notes?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['rhythm_3_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', '8'],
      focusDurations: [],
      contextDurations: ['q', 'h', '8'],
      patterns: ['quarter', 'half', 'eighth'],
      tempo: { min: 90, max: 100, default: 95 },   // Fixed fast tempo
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth'],
          tempo: 95,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'eighth_note'],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Running Notes Master (Mini-Boss)
  // ============================================
  {
    id: 'boss_rhythm_3',
    name: 'Running Notes Master',
    description: 'Prove your mastery of running notes!',
    unlockHint: 'Complete all lessons in this unit to unlock the challenge!',
    category: 'boss',                      // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['rhythm_3_6'],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', 'w', '8'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w', '8'],
      patterns: ['quarter', 'half', 'whole', 'eighth'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Unit Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole', 'eighth'],
          tempo: 80,
          measuresPerPattern: 4,         // Longer patterns for boss
          timeSignature: '4/4',
          difficulty: 'intermediate',
          questionCount: 12
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note', 'eighth_note'],
    xpReward: 120,
    accessoryUnlock: 'rhythm_badge_3',
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default rhythmUnit3Nodes;
