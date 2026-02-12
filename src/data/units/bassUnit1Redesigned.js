/**
 * Bass Clef Unit 1: "Middle C Position" (Redesigned)
 *
 * Educational psychology-driven design for 8-year-old learners
 * - Introduces notes: C4 (Middle C), then B3, then A3
 * - Each node introduces exactly ONE new element
 * - NO EIGHTH NOTES (only quarters and halves)
 * - 7 nodes with variety (Discovery, Practice, Mix-Up, Speed Round, Mini-Boss)
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Build confidence with bass clef, establish that learning is FUN
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 1;
const UNIT_NAME = 'Bass Note Detective';
const CATEGORY = 'bass_clef';
const START_ORDER = 51;

/**
 * Unit 1 Nodes
 * Psychological journey: Curiosity -> Discovery -> Application -> Expansion -> Joy -> Speed -> Mastery
 */
export const bassUnit1Nodes = [
  // ============================================
  // NODE 1: Meet Middle C (Discovery)
  // ============================================
  {
    id: 'bass_1_1',
    name: 'Meet Middle C',
    description: 'Learn Middle C in bass clef',
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
      clef: 'bass',
      ledgerLines: true,         // C4 is on a ledger line in bass clef
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
    newContentDescription: 'Note C (Bass)',

    // Exercises
    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4'],
          questionCount: 6,        // Short first session
          clef: 'bass',
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
  // NODE 2: C and B (Discovery)
  // ============================================
  {
    id: 'bass_1_2',
    name: 'C and B',
    description: 'Add note B to your bass clef collection',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['bass_1_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3'],
      focusNotes: ['B3'],        // B3 is new
      contextNotes: ['C4'],      // C4 is already known
      clef: 'bass',
      ledgerLines: true,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note B',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Play C and B (Practice)
  // ============================================
  {
    id: 'bass_1_3',
    name: 'Play C and B',
    description: 'Practice reading C and B in bass clef',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['bass_1_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'B3'],
      focusNotes: [],            // No new notes
      contextNotes: ['C4', 'B3'],
      clef: 'bass',
      ledgerLines: true,
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
          notePool: ['C4', 'B3'],
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: ['C4', 'B3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet A (Discovery)
  // ============================================
  {
    id: 'bass_1_4',
    name: 'Meet A',
    description: 'Add note A to your bass clef collection',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['bass_1_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3'],
      focusNotes: ['A3'],        // A3 is new
      contextNotes: ['C4', 'B3'],
      clef: 'bass',
      ledgerLines: true,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note A',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Note Pairs (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'bass_1_5',
    name: 'Note Pairs',
    description: 'Match bass clef notes in a fun memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['bass_1_4'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3'],
      clef: 'bass',
      ledgerLines: true,
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
          notePool: ['C4', 'B3', 'A3'],
          gridSize: '2x4',       // 4 pairs = 8 cards
          clef: 'bass',
          timeLimit: 90          // 90 seconds
        }
      }
    ],

    skills: ['C4', 'B3', 'A3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Speed C-B-A (Speed Round)
  // ============================================
  {
    id: 'bass_1_6',
    name: 'Speed C-B-A',
    description: 'How fast can you recognize C, B, and A in bass clef?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['bass_1_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3'],
      clef: 'bass',
      ledgerLines: true,
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
          notePool: ['C4', 'B3', 'A3'],
          questionCount: 15,
          clef: 'bass',
          timeLimit: 120000      // 2 minutes
        }
      }
    ],

    skills: ['C4', 'B3', 'A3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: First Bass Challenge (Mini-Boss)
  // ============================================
  {
    id: 'boss_bass_1',
    name: 'First Bass Challenge',
    description: 'Complete your first bass clef unit!',
    unlockHint: 'Complete all bass clef lessons above to unlock this challenge!',
    category: 'boss',          // Boss nodes have their own category
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['bass_1_6'],

    nodeType: NODE_TYPES.MINI_BOSS,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3'],
      clef: 'bass',
      ledgerLines: true,
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
          notePool: ['C4', 'B3', 'A3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3'],
    xpReward: 100,
    accessoryUnlock: 'bass_sprout_badge',  // Bass Sprout Badge
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default bassUnit1Nodes;
