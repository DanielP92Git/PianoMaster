/**
 * Treble Clef Unit 6: "Key Signatures: Sharps"
 *
 * Introduces key signatures G major (1 sharp) and D major (2 sharps)
 * via sight-reading exercises. Each key gets one Discovery node and
 * one Practice node.
 *
 * KEY DIFFERENCE from Units 1-5: These nodes use `keySignature` in
 * exercise config (not `accidentals: true` in noteConfig). The key
 * signature glyph on the staff implies the accidentals — note pools
 * use natural note names only (C4-C5 octave).
 *
 * Duration: 15-20 minutes
 * Goal: Read music confidently in G major and D major
 * Prerequisite: boss_treble_accidentals (Unit 5 completion)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 6;
const UNIT_NAME = 'Key Signatures: Sharps';
const CATEGORY = 'treble_clef';
const START_ORDER = 45;  // After Unit 5 (10 nodes at orders 35-44)

const TREBLE_FULL_OCTAVE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export const trebleUnit6Nodes = [
  // ============================================
  // NODE 1: Meet G Major (Discovery)
  // ============================================
  {
    id: 'treble_6_1',
    name: 'Meet G Major',
    description: 'Discover the key of G major \u2014 one sharp on every F',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_treble_accidentals'],

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
    newContentDescription: 'Key of G Major (1\u266F)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'G',
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
  // NODE 2: G Major Practice
  // ============================================
  {
    id: 'treble_6_2',
    name: 'G Major Practice',
    description: 'Read music in G major \u2014 watch for that sharp F!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_6_1'],

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
    newContentDescription: 'G Major Practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'G',
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
  // NODE 3: Meet D Major (Discovery)
  // ============================================
  {
    id: 'treble_6_3',
    name: 'Meet D Major',
    description: 'Discover the key of D major \u2014 two sharps on F and C',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_6_2'],

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
    newContentDescription: 'Key of D Major (2\u266F)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'D',
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
  // NODE 4: D Major Practice
  // ============================================
  {
    id: 'treble_6_4',
    name: 'D Major Practice',
    description: 'Read music in D major \u2014 sharps on F and C!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_6_3'],

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
    newContentDescription: 'D Major Practice',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: TREBLE_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          keySignature: 'D',
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
  }
];

export default trebleUnit6Nodes;
