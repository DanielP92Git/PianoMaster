/**
 * Treble Clef Unit 7: "Key Signatures: Mixed"
 *
 * Continues key signature training with A major (3 sharps), then
 * introduces flat keys: F major (1 flat), Bb major (2 flats),
 * Eb major (3 flats). Ends with a Memory Mix-Up variety node
 * and a multi-exercise boss challenge covering all 6 keys.
 *
 * Duration: 40-50 minutes
 * Goal: Read music confidently in all 6 major key signatures
 * Prerequisite: treble_6_4 (Unit 6 completion)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 7;
const UNIT_NAME = 'Key Signatures: Mixed';
const CATEGORY = 'treble_clef';
const START_ORDER = 49;  // After Unit 6 (4 nodes at orders 45-48)

const TREBLE_FULL_OCTAVE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export const trebleUnit7Nodes = [
  // ============================================
  // NODE 1: Meet A Major (Discovery)
  // ============================================
  {
    id: 'treble_7_1',
    name: 'Meet A Major',
    description: 'Discover the key of A major \u2014 three sharps on F, C, and G',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['treble_6_4'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
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
    newContentDescription: 'Key of A Major (3\u266F)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'A',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: A Major Practice
  // ============================================
  {
    id: 'treble_7_2',
    name: 'A Major Practice',
    description: 'Read music in A major \u2014 three sharps to remember!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_7_1'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 80, default: 72 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'A Major Practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'A',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 72
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Meet F Major (Discovery)
  // ============================================
  {
    id: 'treble_7_3',
    name: 'Meet F Major',
    description: 'Discover the key of F major \u2014 one flat on every B',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_7_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
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
    newContentDescription: 'Key of F Major (1\u266D)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'F',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: F Major Practice
  // ============================================
  {
    id: 'treble_7_4',
    name: 'F Major Practice',
    description: 'Read music in F major \u2014 watch for that flat B!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_7_3'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 80, default: 72 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'F Major Practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'F',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 72
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Meet Bb Major (Discovery)
  // ============================================
  {
    id: 'treble_7_5',
    name: 'Meet Bb Major',
    description: 'Discover the key of Bb major \u2014 two flats on B and E',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_7_4'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
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
    newContentDescription: 'Key of B\u266D Major (2\u266D)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'Bb',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Bb Major Practice
  // ============================================
  {
    id: 'treble_7_6',
    name: 'Bb Major Practice',
    description: 'Read music in Bb major \u2014 flats on B and E!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_7_5'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 80, default: 72 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Bb Major Practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'Bb',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 72
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Meet Eb Major (Discovery)
  // ============================================
  {
    id: 'treble_7_7',
    name: 'Meet Eb Major',
    description: 'Discover the key of Eb major \u2014 three flats on B, E, and A',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_7_6'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
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
    newContentDescription: 'Key of E\u266D Major (3\u266D)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'Eb',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Eb Major Practice
  // ============================================
  {
    id: 'treble_7_8',
    name: 'Eb Major Practice',
    description: 'Read music in Eb major \u2014 three flats to watch!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['treble_7_7'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 80, default: 72 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Eb Major Practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'Eb',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 72
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 9: Key Sig Memory Mix-Up (MIX_UP)
  // Mixed-key note pool with explicit accidental forms for variety
  // No keySignature field -- MEMORY_GAME does not use staff rendering
  // ============================================
  {
    id: 'treble_7_9',
    name: 'Key Sig Memory Mix-Up',
    description: 'Match notes from all 6 key signatures',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 8,
    orderInUnit: 9,
    prerequisites: ['treble_7_8'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
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
    newContentDescription: 'Key signature memory challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          gridSize: '4x4',
          clef: 'treble',
          timeLimit: 180
        }
      }
    ],

    skills: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 10: Key Signature Master (BOSS — boss_treble_keysig)
  // 3 exercises covering all 6 key signatures
  // category: 'boss' (string literal, NOT CATEGORY constant)
  // ============================================
  {
    id: 'boss_treble_keysig',
    name: 'Key Signature Master',
    description: 'Face all 6 key signatures in one epic challenge!',
    unlockHint: 'Complete all key signature lessons to unlock this challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 9,
    orderInUnit: 10,
    prerequisites: ['treble_7_9'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: TREBLE_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: TREBLE_FULL_OCTAVE,
      clef: 'treble',
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.VARIED,
      allowedDurations: ['q', 'h', '8'],
      patterns: ['quarter', 'half', 'eighth'],
      tempo: { min: 70, max: 90, default: 80 }
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Key Signatures Boss',

    exercises: [
      {
        // Exercise 1: Sharp keys — A major (3 sharps = superset of G+D+A)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'A',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 80
        }
      },
      {
        // Exercise 2: Flat keys — Eb major (3 flats = superset of F+Bb+Eb)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'Eb',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 80
        }
      },
      {
        // Exercise 3: Mixed — D major (middle-difficulty representative, 2 sharps)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'D',
          rhythmPatterns: ['quarter', 'half', 'eighth'],
          tempo: 80
        }
      }
    ],

    skills: TREBLE_FULL_OCTAVE,
    xpReward: 150,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default trebleUnit7Nodes;
