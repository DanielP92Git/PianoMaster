/**
 * Treble Clef Unit 2: "Growing Range" (Redesigned)
 *
 * Adds F4 and G4 to complete the five-finger position
 * - Starts with REVIEW node (spaced repetition of Unit 1)
 * - Introduces F4 and G4 separately (one at a time)
 * - NO EIGHTH NOTES (only quarters and halves)
 * - Node 7 explicitly mixes old + new notes (interleaving)
 * - 8 nodes with variety
 *
 * Duration: 25-30 minutes
 * Goal: Expand range while maintaining automaticity
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 2;
const UNIT_NAME = 'Growing Range';
const CATEGORY = 'treble_clef';
const START_ORDER = 9;  // After Unit 1 (8 nodes)

/**
 * Unit 2 Nodes
 * Key features: Spaced repetition → New notes (F, G) → Interleaving → Mini-Boss
 */
export const trebleUnit2Nodes = [
  // ============================================
  // NODE 1: Remember C-D-E (Review)
  // ============================================
  {
    id: 'treble_2_1',
    name: 'Remember C-D-E',
    description: 'Review what you learned in Unit 1',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_treble_1'],  // Requires Unit 1 completion

    nodeType: NODE_TYPES.REVIEW,

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

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Spaced Repetition',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'D4', 'E4'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: true,
    reviewsUnits: [1]
  },

  // ============================================
  // NODE 2: Meet F (Discovery)
  // ============================================
  {
    id: 'treble_2_2',
    name: 'Meet F',
    description: 'Learn note F - the fourth finger',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_2_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4'],
      focusNotes: ['F4'],        // F4 is new
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

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note F',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: C to F Journey (Practice)
  // ============================================
  {
    id: 'treble_2_3',
    name: 'C to F Journey',
    description: 'Practice reading from C to F',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_2_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4'],
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

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Apply F in melodies',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet G (Discovery)
  // ============================================
  {
    id: 'treble_2_4',
    name: 'Meet G',
    description: 'Complete the five-finger position with G',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_2_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
      focusNotes: ['G4'],        // G4 is new - five fingers complete!
      contextNotes: ['C4', 'D4', 'E4', 'F4'],
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
    newContentDescription: 'Note G - Five fingers complete!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Five Finger Fun (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'treble_2_5',
    name: 'Five Finger Fun',
    description: 'Celebrate with a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_2_4'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
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

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Celebrate milestone',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          gridSize: '3x4',       // 6 pairs = 12 cards
          clef: 'treble',
          timeLimit: 120         // 2 minutes
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Five Note Songs (Practice)
  // ============================================
  {
    id: 'treble_2_6',
    name: 'Five Note Songs',
    description: 'Play melodies using all five notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_2_5'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
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

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Full five-finger position',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Mix: Units 1+2 (Challenge - Interleaving)
  // ============================================
  {
    id: 'treble_2_7',
    name: 'Mix: Units 1+2',
    description: 'Challenge yourself with mixed practice',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_2_6'],

    nodeType: NODE_TYPES.CHALLENGE,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
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
    newContentDescription: 'Interleaving practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          measuresPerPattern: 3,    // Longer patterns
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Five Finger Master (Mini-Boss)
  // ============================================
  {
    id: 'boss_treble_2',
    name: 'Five Finger Master',
    description: 'Master the five-finger position!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['treble_2_7'],

    nodeType: NODE_TYPES.MINI_BOSS,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4'],
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
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          questionCount: 12,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4'],
    xpReward: 100,
    accessoryUnlock: 'five_finger_badge',  // Five Finger Champion Badge 🏅
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default trebleUnit2Nodes;
