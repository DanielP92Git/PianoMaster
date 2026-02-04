/**
 * Rhythm Unit 4: "The Sound of Silence" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Dedicated rests unit: Silence is a skill to be learned
 * - Introduces: Quarter rest (1 beat), Half rest (2 beats), Whole rest (4 beats)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with 3 Discovery nodes (one for each rest type)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Learn that silence is intentional, not absence - counting rests is as important as playing notes
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 4;
const UNIT_NAME = 'The Sound of Silence';
const CATEGORY = 'rhythm';
const START_ORDER = 121;   // After Unit 3's 7 nodes (114-120)

/**
 * Unit 4 Nodes
 * Psychological journey: Quarter Rest -> Practice -> Half Rest -> Practice -> Whole Rest -> Speed -> Mastery
 * NOTE: This unit has 3 Discovery nodes (one for each rest type) instead of the usual 2
 */
export const rhythmUnit4Nodes = [
  // ============================================
  // NODE 1: Meet Quarter Rest (Discovery)
  // ============================================
  {
    id: 'rhythm_4_1',
    name: 'Meet Quarter Rest',
    description: 'Learn to count silence - 1 beat of rest',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_rhythm_3'],   // Requires completing Unit 3

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration with rests
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'qr'],
      focusDurations: ['qr'],             // NEW: Quarter rest is being introduced
      contextDurations: ['q'],            // Quarter notes are already known
      patterns: ['quarter', 'quarter-rest'],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Quarter Rest (1 beat silence)',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'quarter-rest'],
          tempo: 65,
          measuresPerPattern: 1,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          includeRests: true
        }
      }
    ],

    // Progression
    skills: ['quarter_note', 'quarter_rest'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Practice Quarter Rests (Practice)
  // ============================================
  {
    id: 'rhythm_4_2',
    name: 'Practice Quarter Rests',
    description: 'Build confidence counting silence',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['rhythm_4_1'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'qr'],
      focusDurations: [],
      contextDurations: ['q', 'qr'],
      patterns: ['quarter', 'quarter-rest'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'quarter-rest'],
          tempo: 70,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          includeRests: true
        }
      }
    ],

    skills: ['quarter_note', 'quarter_rest'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Meet Half Rest (Discovery)
  // ============================================
  {
    id: 'rhythm_4_3',
    name: 'Meet Half Rest',
    description: 'Learn 2 beats of silence',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['rhythm_4_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'qr', 'hr'],
      focusDurations: ['hr'],             // NEW: Half rest is being introduced
      contextDurations: ['q', 'h', 'qr'], // Quarters, halves, and quarter rest already known
      patterns: ['quarter', 'half', 'quarter-rest', 'half-rest'],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Half Rest (2 beats silence)',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'quarter-rest', 'half-rest'],
          tempo: 65,
          measuresPerPattern: 1,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          includeRests: true
        }
      }
    ],

    skills: ['quarter_rest', 'half_rest'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Practice Rests (Practice)
  // ============================================
  {
    id: 'rhythm_4_4',
    name: 'Practice Rests',
    description: 'Practice quarter and half rests together',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['rhythm_4_3'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      durations: ['q', 'h', 'qr', 'hr'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'qr', 'hr'],
      patterns: ['quarter', 'half', 'quarter-rest', 'half-rest'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'quarter-rest', 'half-rest'],
          tempo: 70,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          includeRests: true
        }
      }
    ],

    skills: ['quarter_rest', 'half_rest'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Meet Whole Rest (Discovery)
  // ============================================
  {
    id: 'rhythm_4_5',
    name: 'Meet Whole Rest',
    description: 'Learn 4 beats of silence - a full measure of rest',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['rhythm_4_4'],

    // Discovery node instead of Mix-Up to introduce whole rest
    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', 'w', 'qr', 'hr', 'wr'],
      focusDurations: ['wr'],             // NEW: Whole rest is being introduced
      contextDurations: ['q', 'h', 'w', 'qr', 'hr'],
      patterns: ['quarter', 'half', 'whole', 'quarter-rest', 'half-rest', 'whole-rest'],
      tempo: { min: 60, max: 70, default: 65 },
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Whole Rest (4 beats silence)',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole', 'quarter-rest', 'half-rest', 'whole-rest'],
          tempo: 65,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          includeRests: true
        }
      }
    ],

    skills: ['quarter_rest', 'half_rest', 'whole_rest'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Speed Silence (Speed Round)
  // ============================================
  {
    id: 'rhythm_4_6',
    name: 'Speed Silence',
    description: 'How fast can you count silence?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['rhythm_4_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', 'qr', 'hr'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'qr', 'hr'],
      patterns: ['quarter', 'half', 'quarter-rest', 'half-rest'],
      tempo: { min: 85, max: 95, default: 90 },   // Fixed fast tempo
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'quarter-rest', 'half-rest'],
          tempo: 90,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'intermediate',
          includeRests: true
        }
      }
    ],

    skills: ['quarter_rest', 'half_rest'],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Silence Master (Mini-Boss)
  // ============================================
  {
    id: 'boss_rhythm_4',
    name: 'Silence Master',
    description: 'Prove your mastery of counting silence!',
    category: 'boss',                      // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['rhythm_4_6'],

    nodeType: NODE_TYPES.MINI_BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['q', 'h', 'qr', 'hr', 'wr'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'qr', 'hr', 'wr'],
      patterns: ['quarter', 'half', 'quarter-rest', 'half-rest', 'whole-rest'],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: 'C4',
      timeSignature: '4/4',
      includeRests: true
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Unit Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'quarter-rest', 'half-rest', 'whole-rest'],
          tempo: 75,
          measuresPerPattern: 4,         // Longer patterns for boss
          timeSignature: '4/4',
          difficulty: 'intermediate',
          questionCount: 12,
          includeRests: true
        }
      }
    ],

    skills: ['quarter_rest', 'half_rest', 'whole_rest'],
    xpReward: 130,
    accessoryUnlock: 'rhythm_badge_4',
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default rhythmUnit4Nodes;
