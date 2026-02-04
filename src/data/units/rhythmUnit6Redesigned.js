/**
 * Rhythm Unit 6: "Sixteenth Notes" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces durations: Sixteenth notes (1/4 beat - groups of 4 per beat)
 * - FINAL UNIT of the rhythm path
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with variety and a TRUE BOSS node (not Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Master the fastest duration, complete the rhythm learning journey
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 6;
const UNIT_NAME = 'Sixteenth Notes';
const CATEGORY = 'rhythm';
const START_ORDER = 135;   // After Unit 5's 7 nodes (128-134)

/**
 * Unit 6 Nodes
 * Psychological journey: Sixteenths -> Practice -> Mix with Eighths -> More Practice -> All Rhythms -> Speed -> BOSS
 * NOTE: This unit's final node is NODE_TYPES.BOSS (true boss, not Mini-Boss) as the trail milestone
 */
export const rhythmUnit6Nodes = [
  // ============================================
  // NODE 1: Meet Sixteenth Notes (Discovery)
  // ============================================
  {
    id: 'rhythm_6_1',
    name: 'Meet Sixteenth Notes',
    description: 'Learn to play four notes per beat',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_rhythm_5'],   // Requires completing Unit 5

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration with sixteenth notes
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', '16'],
      focusDurations: ['16'],              // NEW: Sixteenth notes being introduced
      contextDurations: ['q'],             // Quarters for contrast
      patterns: ['quarter', 'sixteenth'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Sixteenth Notes (1/4 beat)',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'sixteenth'],
          tempo: 80,
          measuresPerPattern: 1,
          timeSignature: '4/4',
          difficulty: 'advanced'
        }
      }
    ],

    // Progression
    skills: ['sixteenth_note'],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Practice Sixteenth Notes (Practice)
  // ============================================
  {
    id: 'rhythm_6_2',
    name: 'Practice Sixteenth Notes',
    description: 'Groups of four - one beat at a time',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['rhythm_6_1'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', '16'],
      focusDurations: [],
      contextDurations: ['q', '16'],
      patterns: ['quarter', 'sixteenth'],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'sixteenth'],
          tempo: 85,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced'
        }
      }
    ],

    skills: ['sixteenth_note'],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Sixteenths and Eighths (Discovery)
  // ============================================
  {
    id: 'rhythm_6_3',
    name: 'Sixteenths and Eighths',
    description: 'Mix sixteenth notes with eighth notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['rhythm_6_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', '8', '16'],
      focusDurations: [],                  // Mixing known durations
      contextDurations: ['q', '8', '16'],
      patterns: ['quarter', 'eighth', 'sixteenth'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Duration Mixing',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'eighth', 'sixteenth'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced'
        }
      }
    ],

    skills: ['eighth_note', 'sixteenth_note'],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Fast and Faster (Practice)
  // ============================================
  {
    id: 'rhythm_6_4',
    name: 'Fast and Faster',
    description: 'Practice mixing fast and slow rhythms',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['rhythm_6_3'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', 'h', '8', '16'],
      focusDurations: [],
      contextDurations: ['q', 'h', '8', '16'],
      patterns: ['quarter', 'half', 'eighth', 'sixteenth'],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth', 'sixteenth'],
          tempo: 85,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'eighth_note', 'sixteenth_note'],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: All Rhythms (Mix-Up)
  // ============================================
  {
    id: 'rhythm_6_5',
    name: 'All Rhythms',
    description: 'Every duration you have learned',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['rhythm_6_4'],

    nodeType: NODE_TYPES.MIX_UP,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', 'h', 'w', '8', '16', 'qd', 'hd'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w', '8', '16', 'qd', 'hd'],
      patterns: ['quarter', 'half', 'whole', 'eighth', 'sixteenth', 'dotted-quarter', 'dotted-half'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Complete Rhythm Review',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole', 'eighth', 'sixteenth', 'dotted-quarter', 'dotted-half'],
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced',
          patternVariety: true
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note', 'eighth_note', 'sixteenth_note', 'dotted_quarter_note', 'dotted_half_note'],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Speed Master (Speed Round)
  // ============================================
  {
    id: 'rhythm_6_6',
    name: 'Speed Master',
    description: 'The ultimate speed challenge!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['rhythm_6_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', 'h', '8', '16'],
      focusDurations: [],
      contextDurations: ['q', 'h', '8', '16'],
      patterns: ['quarter', 'half', 'eighth', 'sixteenth'],
      tempo: { min: 95, max: 105, default: 100 },   // Fastest tempo in rhythm path
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Ultimate Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'eighth', 'sixteenth'],
          tempo: 100,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced'
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'eighth_note', 'sixteenth_note'],
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Rhythm Champion (BOSS - True Boss, not Mini-Boss)
  // ============================================
  {
    id: 'boss_rhythm_6',
    name: 'Rhythm Champion',
    description: 'Prove your mastery of ALL rhythms!',
    category: 'boss',                      // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['rhythm_6_6'],

    // TRUE BOSS node (not Mini-Boss) - Trail milestone unlocked!
    nodeType: NODE_TYPES.BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['q', 'h', 'w', '8', '16', 'qd', 'hd'],
      focusDurations: [],
      contextDurations: ['q', 'h', 'w', '8', '16', 'qd', 'hd'],
      patterns: ['quarter', 'half', 'whole', 'eighth', 'sixteenth', 'dotted-quarter', 'dotted-half'],
      tempo: { min: 80, max: 90, default: 85 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Rhythm Path Complete!',

    exercises: [
      {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: ['quarter', 'half', 'whole', 'eighth', 'sixteenth', 'dotted-quarter', 'dotted-half'],
          tempo: 85,
          measuresPerPattern: 4,         // Longest patterns in rhythm path
          timeSignature: '4/4',
          difficulty: 'advanced',
          questionCount: 15              // Most questions in rhythm path
        }
      }
    ],

    skills: ['quarter_note', 'half_note', 'whole_note', 'eighth_note', 'sixteenth_note', 'dotted_quarter_note', 'dotted_half_note'],
    xpReward: 200,                        // Highest XP reward in rhythm path
    accessoryUnlock: 'rhythm_champion_badge',
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default rhythmUnit6Nodes;
