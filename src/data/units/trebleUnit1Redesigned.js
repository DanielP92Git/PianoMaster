/**
 * Treble Clef Unit 1: "First Steps" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces notes ONE AT A TIME (C4, then D4, then E4)
 * - Each node introduces exactly ONE new element
 * - NO EIGHTH NOTES (only quarters and halves)
 * - 8 nodes with variety (Discovery, Practice, Mix-Up, Speed Round, Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Build confidence, establish that learning is FUN
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 1;
const UNIT_NAME = 'Note Adventure Begins';
const CATEGORY = 'treble_clef';
const START_ORDER = 1;

/**
 * Unit 1 Nodes
 * Psychological journey: Curiosity → Discovery → Application → Joy → Expansion → Reward → Challenge → Mastery
 */
export const trebleUnit1Nodes = [
  // ============================================
  // NODE 1: Meet Middle C (Discovery)
  // ============================================
  {
    id: 'treble_1_1',
    name: 'Meet Middle C',
    description: 'Learn your very first piano note',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: [],

    // Node type classification
    nodeType: NODE_TYPES.DISCOVERY,

    // Enhanced note configuration
    noteConfig: {
      notePool: ['C4'],
      focusNotes: ['C4'],        // NEW: C4 is the new note
      contextNotes: [],          // No previous notes yet
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    // Simplified rhythm (auto-assigned based on node type)
    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],    // Quarters only
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    // UI display hints
    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note C',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4'],
          questionCount: 6,        // Short first session
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    // Progression
    skills: ['C4'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: C and D (Discovery)
  // ============================================
  {
    id: 'treble_1_2',
    name: 'C and D',
    description: 'Add note D to your collection',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_1_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'D4'],
      focusNotes: ['D4'],        // D4 is new
      contextNotes: ['C4'],      // C4 is already known
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note D',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'D4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Play C and D (Practice)
  // ============================================
  {
    id: 'treble_1_3',
    name: 'Play C and D',
    description: 'Practice reading C and D on the staff',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_1_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'D4'],
      focusNotes: [],            // No new notes
      contextNotes: ['C4', 'D4'],
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Sight Reading',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4'],
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: ['C4', 'D4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Note Pairs (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'treble_1_4',
    name: 'Note Pairs',
    description: 'Match notes in a fun memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_1_3'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'D4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4'],
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Memory Game',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: ['C4', 'D4'],
          gridSize: '2x4',       // 4 pairs = 8 cards
          clef: 'treble',
          timeLimit: 90          // 90 seconds
        }
      }
    ],

    skills: ['C4', 'D4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Meet E (Discovery)
  // ============================================
  {
    id: 'treble_1_5',
    name: 'Meet E',
    description: 'Add the third note to your collection',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_1_4'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4'],
      focusNotes: ['E4'],        // E4 is new
      contextNotes: ['C4', 'D4'],
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note E',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'D4', 'E4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Three Note Songs (Practice)
  // ============================================
  {
    id: 'treble_1_6',
    name: 'Three Note Songs',
    description: 'Play simple melodies with C, D, and E',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_1_5'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4'],
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,  // REWARD: Add half notes
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 60, max: 75, default: 70 }
    },

    newContent: NEW_CONTENT_TYPES.RHYTHM,
    newContentDescription: 'Half Notes',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Speed C-D-E (Speed Round)
  // ============================================
  {
    id: 'treble_1_7',
    name: 'Speed C-D-E',
    description: 'How fast can you recognize C, D, and E?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_1_6'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4'],
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: 120000      // 2 minutes
        }
      }
    ],

    skills: ['C4', 'D4', 'E4'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: First Steps Challenge (Mini-Boss)
  // ============================================
  {
    id: 'boss_treble_1',
    name: 'First Steps Challenge',
    description: 'Complete your first unit!',
    unlockHint: 'Complete all 7 lessons above to unlock this challenge!',
    category: 'boss',          // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['treble_1_7'],

    nodeType: NODE_TYPES.MINI_BOSS,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4'],
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 60, max: 75, default: 70 }
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Unit Complete',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4'],
    xpReward: 100,
    accessoryUnlock: 'sprout_badge',  // Music Sprout Badge 🌱
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default trebleUnit1Nodes;
