/**
 * Treble Clef Unit 3: "The Full Octave" (Redesigned)
 *
 * Completes the octave from C4 to C5
 * - Adds A4, B4, and C5 (one or two at a time)
 * - Starts with review of five-finger position
 * - NO EIGHTH NOTES (only quarters and halves)
 * - 10 nodes with celebration of major milestone
 * - BOSS completion unlocks eighth notes in Unit 4
 *
 * Duration: 35-40 minutes
 * Goal: Complete the octave - major achievement!
 * Reward: Golden Treble Clef ⭐ + Unlocks Section 2 (Eighth Notes)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 3;
const UNIT_NAME = 'Rainbow of Notes';
const CATEGORY = 'treble_clef';
const START_ORDER = 17;  // After Unit 2 (8 nodes starting at 9)

/**
 * Unit 3 Nodes
 * Key features: Review → Add A4 → Add B4 → Add C5 → Celebrate → BOSS unlocks eighth notes
 */
export const trebleUnit3Nodes = [
  // ============================================
  // NODE 1: Five Finger Warm-Up (Review)
  // ============================================
  {
    id: 'treble_3_1',
    name: 'Five Finger Warm-Up',
    description: 'Review the five-finger position',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_treble_2'],  // Requires Unit 2 completion

    nodeType: NODE_TYPES.REVIEW,

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
    newContentDescription: 'Spaced repetition',

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
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: true,
    reviewsUnits: [2]
  },

  // ============================================
  // NODE 2: Meet A (Discovery)
  // ============================================
  {
    id: 'treble_3_2',
    name: 'Meet A',
    description: 'Learn note A - continuing upward',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_3_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['G4', 'A4'],     // Focus on G-A transition
      focusNotes: ['A4'],
      contextNotes: ['G4'],
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
    newContentDescription: 'Note A',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['G4', 'A4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['G4', 'A4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: F-G-A Trio (Practice)
  // ============================================
  {
    id: 'treble_3_3',
    name: 'F-G-A Trio',
    description: 'Practice F, G, and A together',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_3_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['F4', 'G4', 'A4'],
      focusNotes: [],
      contextNotes: ['F4', 'G4', 'A4'],
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
    newContentDescription: 'Apply A in context',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['F4', 'G4', 'A4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['F4', 'G4', 'A4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet B (Discovery)
  // ============================================
  {
    id: 'treble_3_4',
    name: 'Meet B',
    description: 'Learn note B - almost there!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_3_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['A4', 'B4'],
      focusNotes: ['B4'],
      contextNotes: ['A4'],
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
    newContentDescription: 'Note B',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['A4', 'B4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['A4', 'B4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Almost There (Practice)
  // ============================================
  {
    id: 'treble_3_5',
    name: 'Almost There',
    description: 'Practice all seven notes learned so far',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_3_4'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
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
    newContentDescription: 'Seven notes!',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: High C! (Discovery)
  // ============================================
  {
    id: 'treble_3_6',
    name: 'High C!',
    description: 'Complete the octave with C5',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_3_5'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['B4', 'C5'],
      focusNotes: ['C5'],        // THE OCTAVE!
      contextNotes: ['B4'],
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
    newContentDescription: 'High C - The Octave!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['B4', 'C5'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['B4', 'C5'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Full Octave Songs (Practice)
  // ============================================
  {
    id: 'treble_3_7',
    name: 'Full Octave Songs',
    description: 'Play melodies across the full octave',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_3_6'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
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
    newContentDescription: 'Complete range',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Octave Memory (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'treble_3_8',
    name: 'Octave Memory',
    description: 'Celebrate the octave with a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['treble_3_7'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
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
    newContentDescription: 'Celebration',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          gridSize: '4x4',       // 8 pairs = 16 cards
          clef: 'treble',
          timeLimit: 180         // 3 minutes
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 9: Speed Octave (Speed Round)
  // ============================================
  {
    id: 'treble_3_9',
    name: 'Speed Octave',
    description: 'How fast can you recognize all the notes?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 8,
    orderInUnit: 9,
    prerequisites: ['treble_3_8'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
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
    newContentDescription: 'Speed test',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          questionCount: 20,
          clef: 'treble',
          timeLimit: 150000      // 2.5 minutes
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    xpReward: 70,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 10: Octave Master (BOSS - Unlocks Eighth Notes!)
  // ============================================
  {
    id: 'boss_treble_3',
    name: 'Octave Master',
    description: 'Master the full octave and unlock eighth notes!',
    unlockHint: 'Complete all lessons in this unit to unlock the big challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 9,
    orderInUnit: 10,
    prerequisites: ['treble_3_9'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
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
    newContentDescription: 'Section Complete - Unlocks Eighth Notes!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    xpReward: 150,
    accessoryUnlock: 'octave_master_badge',  // Golden Treble Clef ⭐
    isBoss: true,
    isReview: false,
    reviewsUnits: [],

    // Special: This boss unlocks Section 2 (Eighth Notes)
    unlocksSection: 'section_treble_speed_rhythm'
  }
];

export default trebleUnit3Nodes;
