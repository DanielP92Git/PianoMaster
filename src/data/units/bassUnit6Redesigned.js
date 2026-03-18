/**
 * Bass Clef Unit 6: "Key Signatures: Sharps"
 *
 * Introduces key signatures G major (1 sharp) and D major (2 sharps)
 * via sight-reading exercises in bass clef range (C3-C4).
 * Mirrors treble Unit 6 exactly in structure, naming, node types,
 * and difficulty params.
 *
 * KEY DIFFERENCE from Units 1-5: These nodes use `keySignature` in
 * exercise config (not `accidentals: true` in noteConfig). The key
 * signature glyph on the staff implies the accidentals — note pools
 * use natural note names only (C3-C4 octave).
 *
 * Duration: 15-20 minutes
 * Goal: Read bass clef music confidently in G major and D major
 * Prerequisite: boss_bass_accidentals (Unit 5 completion)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 6;
const UNIT_NAME = 'Key Signatures: Sharps';
const CATEGORY = 'bass_clef';
const START_ORDER = 94;  // After Unit 5 (10 nodes at orders 84-93)

const BASS_FULL_OCTAVE = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'];

export const bassUnit6Nodes = [
  // ============================================
  // NODE 1: Meet G Major (Discovery)
  // ============================================
  {
    id: 'bass_6_1',
    name: 'Meet G Major',
    description: 'Discover the key of G major \u2014 one sharp on every F',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_bass_accidentals'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: BASS_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: BASS_FULL_OCTAVE,
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
    newContentDescription: 'Key of G Major (1\u266F)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: BASS_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4',
          keySignature: 'G',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: BASS_FULL_OCTAVE,
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: G Major Practice (Practice)
  // ============================================
  {
    id: 'bass_6_2',
    name: 'G Major Practice',
    description: 'Read bass clef music in G major \u2014 watch for that sharp F!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['bass_6_1'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: BASS_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: BASS_FULL_OCTAVE,
      clef: 'bass',
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
          notePool: BASS_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          keySignature: 'G',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 72
        }
      }
    ],

    skills: BASS_FULL_OCTAVE,
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
    id: 'bass_6_3',
    name: 'Meet D Major',
    description: 'Discover the key of D major \u2014 two sharps on F and C',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['bass_6_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: BASS_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: BASS_FULL_OCTAVE,
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
    newContentDescription: 'Key of D Major (2\u266F)',

    exercises: [
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: BASS_FULL_OCTAVE,
          measuresPerPattern: 1,
          clef: 'bass',
          timeSignature: '4/4',
          keySignature: 'D',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: BASS_FULL_OCTAVE,
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: D Major Practice (Practice)
  // ============================================
  {
    id: 'bass_6_4',
    name: 'D Major Practice',
    description: 'Read bass clef music in D major \u2014 sharps on F and C!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['bass_6_3'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: BASS_FULL_OCTAVE,
      focusNotes: [],
      contextNotes: BASS_FULL_OCTAVE,
      clef: 'bass',
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
          notePool: BASS_FULL_OCTAVE,
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          keySignature: 'D',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 72
        }
      }
    ],

    skills: BASS_FULL_OCTAVE,
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  }
];

export default bassUnit6Nodes;
