/**
 * Rhythm Unit 8: "Off-Beat Magic" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces syncopation: eighth-quarter-eighth and dotted quarter-eighth patterns
 * - Capstone unit of the rhythm path — builds on 6/8 compound meter (Unit 7)
 * - Single pitch (C4) throughout for pure rhythm focus
 * - 7 nodes with variety and a TRUE BOSS node mixing 6/8 and 4/4 syncopation
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Master syncopation patterns, prove mastery of both 6/8 and 4/4 in epic final boss
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 8;
const UNIT_NAME = 'Off-Beat Magic';
const CATEGORY = 'rhythm';
const START_ORDER = 149;   // After Unit 7's nodes (142-148)

/**
 * Unit 8 Nodes
 * Psychological journey: Syncopation Discovery -> Practice -> Dotted Discovery -> Practice -> Mix-Up -> Speed -> TRUE BOSS
 * NOTE: This unit's final node is NODE_TYPES.BOSS (true boss) as the capstone of ALL rhythm content
 */
export const rhythmUnit8Nodes = [
  // ============================================
  // NODE 1: Off-Beat Surprise (Discovery)
  // ============================================
  {
    id: 'rhythm_8_1',
    name: 'Off-Beat Surprise',
    description: 'Discover the magic of playing between the beats',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_rhythm_7'],   // Requires completing Unit 7

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Rhythm configuration: eighth-quarter-eighth syncopation
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['8', 'q'],
      focusDurations: ['8'],              // NEW: Eighth notes for syncopation
      contextDurations: ['q'],            // Quarters for contrast
      patternTags: ['syncopation'],
      tempo: { min: 65, max: 70, default: 67 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Syncopation: Tap between the beats!',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'rhythm_tap' },
            { type: 'visual_recognition' }, { type: 'syllable_matching' }, { type: 'rhythm_tap' },
          ]
        }
      }
    ],

    // Progression
    skills: ['syncopation_eighth_quarter'],
    xpReward: 75,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Between the Beats (Practice)
  // ============================================
  {
    id: 'rhythm_8_2',
    name: 'Between the Beats',
    description: 'Practice tapping on the off-beats',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['rhythm_8_1'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['8', 'q'],
      focusDurations: [],
      contextDurations: ['8', 'q'],
      patternTags: ['syncopation'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'visual_recognition' },
          ]
        }
      }
    ],

    skills: ['syncopation_eighth_quarter'],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Dotted Groove (Discovery)
  // ============================================
  {
    id: 'rhythm_8_3',
    name: 'Dotted Groove',
    description: 'Learn the dotted quarter-eighth syncopation pattern',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['rhythm_8_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      durations: ['qd', '8', 'q'],         // Introduce dotted quarter-eighth pattern
      focusDurations: ['qd'],               // NEW: Dotted quarter being introduced
      contextDurations: ['8', 'q'],
      patternTags: ['dotted-syncopation'],
      tempo: { min: 65, max: 75, default: 70 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Dotted Quarter-Eighth Syncopation',

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'rhythm_tap' },
            { type: 'visual_recognition' }, { type: 'syllable_matching' }, { type: 'rhythm_tap' },
          ]
        }
      }
    ],

    skills: ['syncopation_dotted_quarter'],
    xpReward: 80,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Swing and Sway (Practice)
  // ============================================
  {
    id: 'rhythm_8_4',
    name: 'Swing and Sway',
    description: 'Practice the dotted quarter groove',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['rhythm_8_3'],

    nodeType: NODE_TYPES.PRACTICE,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['qd', '8', 'q'],
      focusDurations: [],
      contextDurations: ['qd', '8', 'q'],
      patternTags: ['syncopation', 'dotted-syncopation'],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: null,

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'visual_recognition' },
          ]
        }
      }
    ],

    skills: ['syncopation_eighth_quarter', 'syncopation_dotted_quarter'],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Syncopation Shuffle (Mix-Up)
  // ============================================
  {
    id: 'rhythm_8_5',
    name: 'Syncopation Shuffle',
    description: 'Mix all syncopation patterns with half notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['rhythm_8_4'],

    nodeType: NODE_TYPES.MIX_UP,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['qd', '8', 'q', 'h'],    // Add half notes for variety
      focusDurations: [],
      contextDurations: ['qd', '8', 'q', 'h'],
      patternTags: ['syncopation', 'dotted-syncopation'],
      tempo: { min: 70, max: 80, default: 75 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'All Syncopation Patterns',

    exercises: [
      {
        type: EXERCISE_TYPES.MIXED_LESSON,
        config: {
          questions: [
            { type: 'visual_recognition' }, { type: 'rhythm_tap' }, { type: 'syllable_matching' },
            { type: 'visual_recognition' }, { type: 'syllable_matching' },
            { type: 'rhythm_tap' }, { type: 'visual_recognition' }, { type: 'syllable_matching' },
          ]
        }
      }
    ],

    skills: ['syncopation_eighth_quarter', 'syncopation_dotted_quarter'],
    xpReward: 85,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Rapid Syncopation (Speed Round)
  // ============================================
  {
    id: 'rhythm_8_6',
    name: 'Rapid Syncopation',
    description: 'How fast can you tap those syncopated rhythms?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['rhythm_8_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['qd', '8', 'q'],
      focusDurations: [],
      contextDurations: ['qd', '8', 'q'],
      patternTags: ['syncopation', 'dotted-syncopation'],
      tempo: { min: 80, max: 85, default: 83 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Syncopation Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          difficulty: 'advanced'
        }
      }
    ],

    skills: ['syncopation_eighth_quarter', 'syncopation_dotted_quarter'],
    xpReward: 90,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Rhythm Master (BOSS - True Boss, capstone of ALL rhythm content)
  // ============================================
  {
    id: 'boss_rhythm_8',
    name: 'Rhythm Master',
    description: 'Prove your mastery of 6/8 compound meter AND syncopation!',
    unlockHint: 'Master all syncopation patterns to face the ultimate rhythm challenge!',
    category: 'boss',                      // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['rhythm_8_6'],

    // TRUE BOSS node — capstone of ALL rhythm content
    nodeType: NODE_TYPES.BOSS,

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.ALL,
      durations: ['qd', '8', 'q', 'h'],
      focusDurations: [],
      contextDurations: ['qd', '8', 'q', 'h'],
      patternTags: ['syncopation', 'dotted-syncopation'],
      tempo: { min: 75, max: 85, default: 80 },
      pitch: 'C4',
      timeSignature: '4/4'
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Ultimate Rhythm Challenge!',

    // 3 exercises, 5 questions each = 15 total questions (intended design — no violation per audit)
    exercises: [
      {
        // Exercise 1: 6/8 compound meter review (from Unit 7)
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          tempo: 75,
          measuresPerPattern: 2,
          timeSignature: '6/8',
          difficulty: 'advanced',
          questionCount: 5
        }
      },
      {
        // Exercise 2: Eighth-quarter-eighth syncopation in 4/4
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          tempo: 75,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced',
          questionCount: 5
        }
      },
      {
        // Exercise 3: Combined challenge — all syncopation patterns at higher tempo
        type: EXERCISE_TYPES.ARCADE_RHYTHM,
        config: {
          tempo: 80,
          measuresPerPattern: 2,
          timeSignature: '4/4',
          difficulty: 'advanced',
          questionCount: 5
        }
      }
    ],

    skills: ['68_compound_meter', 'syncopation_eighth_quarter', 'syncopation_dotted_quarter'],
    xpReward: 250,                            // Highest XP in entire rhythm path — capstone boss
    accessoryUnlock: 'advanced_rhythm_badge',
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default rhythmUnit8Nodes;
