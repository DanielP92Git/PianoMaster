/**
 * Bass Clef Unit 2: "Five Finger Low" (Redesigned)
 *
 * Adds G3 and F3 to complete the five-finger position
 * - Starts with REVIEW node (spaced repetition of Unit 1)
 * - Introduces G3 and F3 separately (one at a time)
 * - NO EIGHTH NOTES (only quarters and halves)
 * - Node 7 explicitly mixes old + new notes (interleaving via Challenge)
 * - 8 nodes with variety
 *
 * Duration: 25-30 minutes
 * Goal: Expand range while maintaining automaticity
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 2;
const UNIT_NAME = 'Five Finger Low';
const CATEGORY = 'bass_clef';
const START_ORDER = 58;  // After Unit 1 (7 nodes starting at 51)

/**
 * Unit 2 Nodes
 * Key features: Spaced repetition -> New notes (G, F) -> Interleaving -> Mini-Boss
 */
export const bassUnit2Nodes = [
  // ============================================
  // NODE 1: Remember Unit 1 (Review)
  // ============================================
  {
    id: 'bass_2_1',
    name: 'Remember Unit 1',
    description: 'Review what you learned in Unit 1',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_bass_1'],  // Requires Unit 1 completion

    nodeType: NODE_TYPES.REVIEW,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3'],
      clef: 'bass',
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
          notePool: ['C4', 'B3', 'A3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: true,
    reviewsUnits: [1]
  },

  // ============================================
  // NODE 2: Meet G (Discovery)
  // ============================================
  {
    id: 'bass_2_2',
    name: 'Meet G',
    description: 'Learn note G - the fourth finger',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['bass_2_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3'],
      focusNotes: ['G3'],        // G3 is new
      contextNotes: ['C4', 'B3', 'A3'],
      clef: 'bass',
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
    newContentDescription: 'Note G',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Play with G (Practice)
  // ============================================
  {
    id: 'bass_2_3',
    name: 'Play with G',
    description: 'Practice reading with G',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['bass_2_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3'],
      clef: 'bass',
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
    newContentDescription: 'Apply G in melodies',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet F (Discovery)
  // ============================================
  {
    id: 'bass_2_4',
    name: 'Meet F',
    description: 'Complete the five-finger position with F',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['bass_2_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
      focusNotes: ['F3'],        // F3 is new - five fingers complete!
      contextNotes: ['C4', 'B3', 'A3', 'G3'],
      clef: 'bass',
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
    newContentDescription: 'Note F - Five fingers complete!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Five Note Mix (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'bass_2_5',
    name: 'Five Note Mix',
    description: 'Celebrate with a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['bass_2_4'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3'],
      clef: 'bass',
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
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          gridSize: '3x4',       // 6 pairs = 12 cards
          clef: 'bass',
          timeLimit: 120         // 2 minutes
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Five Finger Songs (Practice)
  // ============================================
  {
    id: 'bass_2_6',
    name: 'Five Finger Songs',
    description: 'Play melodies using all five notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['bass_2_5'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3'],
      clef: 'bass',
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
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Mix It Up (Challenge - Interleaving)
  // ============================================
  {
    id: 'bass_2_7',
    name: 'Mix It Up',
    description: 'Challenge yourself with mixed practice',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['bass_2_6'],

    nodeType: NODE_TYPES.CHALLENGE,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3'],
      clef: 'bass',
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
    newContentDescription: 'Interleaving Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          questionCount: 12,
          clef: 'bass',
          timeLimit: 90000      // 90 seconds
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
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
    id: 'boss_bass_2',
    name: 'Five Finger Master',
    description: 'Master the bass clef five-finger position!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['bass_2_7'],

    nodeType: NODE_TYPES.MINI_BOSS,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3'],
      clef: 'bass',
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
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3'],
    xpReward: 100,
    accessoryUnlock: 'bass_five_finger_badge',  // Bass Five Finger Champion Badge
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default bassUnit2Nodes;
