/**
 * Bass Clef Unit 3: "The Full Octave" (Redesigned)
 *
 * Completes the bass clef octave from C4 to C3
 * - Adds E3, D3, and C3 (one at a time)
 * - Starts with review of five-finger position
 * - NO EIGHTH NOTES (only quarters and halves)
 * - 10 nodes with celebration of major milestone
 * - BOSS completion unlocks next section
 *
 * Duration: 35-40 minutes
 * Goal: Complete the bass octave - major achievement!
 * Reward: Golden Bass Clef badge + Unlocks next trail section
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 3;
const UNIT_NAME = 'The Full Octave';
const CATEGORY = 'bass_clef';
const START_ORDER = 66;  // After Unit 2 (8 nodes starting at 58)

/**
 * Unit 3 Nodes
 * Key features: Review -> Add E3 -> Add D3 -> Add C3 -> Celebrate -> BOSS unlocks next section
 */
export const bassUnit3Nodes = [
  // ============================================
  // NODE 1: Five Finger Warm-Up (Review)
  // ============================================
  {
    id: 'bass_3_1',
    name: 'Five Finger Warm-Up',
    description: 'Review the five-finger position',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_bass_2'],  // Requires Unit 2 completion

    nodeType: NODE_TYPES.REVIEW,

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
    newContentDescription: 'Spaced repetition',

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
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: true,
    reviewsUnits: [2]
  },

  // ============================================
  // NODE 2: Meet E (Discovery)
  // ============================================
  {
    id: 'bass_3_2',
    name: 'Meet E',
    description: 'Learn note E - continuing downward',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['bass_3_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
      focusNotes: ['E3'],
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

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note E',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Play with E (Practice)
  // ============================================
  {
    id: 'bass_3_3',
    name: 'Play with E',
    description: 'Practice reading with E',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['bass_3_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
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
    newContentDescription: 'Apply E in context',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet D (Discovery)
  // ============================================
  {
    id: 'bass_3_4',
    name: 'Meet D',
    description: 'Learn note D - almost there!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['bass_3_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
      focusNotes: ['D3'],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3'],
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
    newContentDescription: 'Note D',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Play with D (Practice)
  // ============================================
  {
    id: 'bass_3_5',
    name: 'Play with D',
    description: 'Practice all seven notes learned so far',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['bass_3_4'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
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
    newContentDescription: 'Seven notes!',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Meet Low C (Discovery)
  // ============================================
  {
    id: 'bass_3_6',
    name: 'Meet Low C',
    description: 'Complete the octave with C3',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['bass_3_5'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
      focusNotes: ['C3'],        // THE OCTAVE!
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3'],
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
    newContentDescription: 'Low C - Octave Complete!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Octave Mix (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'bass_3_7',
    name: 'Octave Mix',
    description: 'Celebrate the octave with a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['bass_3_6'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
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

    newContent: NEW_CONTENT_TYPES.EXERCISE_TYPE,
    newContentDescription: 'Full Octave Memory',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          gridSize: '4x4',       // 8 pairs = 16 cards
          clef: 'bass',
          timeLimit: 150         // 2.5 minutes
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Full Octave Songs (Practice)
  // ============================================
  {
    id: 'bass_3_8',
    name: 'Full Octave Songs',
    description: 'Play melodies across the full octave',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['bass_3_7'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
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
    newContentDescription: 'Complete range',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 9: Speed Octave (Speed Round)
  // ============================================
  {
    id: 'bass_3_9',
    name: 'Speed Octave',
    description: 'How fast can you recognize all the notes?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 8,
    orderInUnit: 9,
    prerequisites: ['bass_3_8'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
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

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Speed Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          questionCount: 20,
          clef: 'bass',
          timeLimit: 150000      // 2.5 minutes
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 10: Bass Clef Master (BOSS - Unlocks Next Section!)
  // ============================================
  {
    id: 'boss_bass_3',
    name: 'Bass Clef Master',
    description: 'Master the full bass clef octave!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 9,
    orderInUnit: 10,
    prerequisites: ['bass_3_9'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
      focusNotes: [],
      contextNotes: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
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
    newContentDescription: 'Bass Clef Complete!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          questionCount: 15,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
          measuresPerPattern: 3,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'],
    xpReward: 150,
    accessoryUnlock: 'golden_bass_badge',  // Golden Bass Clef Badge
    isBoss: true,
    isReview: false,
    reviewsUnits: [],

    // Special: This boss unlocks the next trail section
    unlocksSection: 'section_bass_advanced'
  }
];

export default bassUnit3Nodes;
