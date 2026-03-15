/**
 * Bass Clef Unit 5: "Flat Notes" (Redesigned)
 *
 * Introduces bass accidentals: Bb3, Eb3, Ab3, Db3 (four flats, circle-of-fifths progression)
 *
 * CRITICAL CONSTRAINT — Enharmonic mic issue:
 *   Mic input outputs SHARP-FORM only (A#3, D#3, G#3, C#3), NOT flat names.
 *   Therefore SIGHT_READING is NOT safe for regular flats practice nodes.
 *   Regular nodes (bass_5_1 through bass_5_8) use NOTE_RECOGNITION or MEMORY_GAME ONLY.
 *
 * Boss nodes (boss_bass_5, boss_bass_accidentals) MAY include SIGHT_READING.
 *   These are INERT until Phase 04 wires them into expandedNodes.js.
 *
 * Cross-unit boss node:
 *   boss_bass_accidentals mixes ALL 7 bass accidentals (F#3, C#3, G#3, Bb3, Eb3, Ab3, Db3)
 *   plus the full C3-C4 natural range = 15 notes total. xpReward: 200.
 *
 * Duration: 35-45 minutes
 * Goal: Recognize Bb3, Eb3, Ab3, Db3 confidently; master all 7 bass accidentals
 * Prerequisite: boss_bass_4 (Unit 4 completion — bass sharps F#3, C#3, G#3)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 5;
const UNIT_NAME = 'Flat Notes';
const CATEGORY = 'bass_clef';
const START_ORDER = 84;  // After Unit 4 (8 nodes at orders 76-83)

// Full bass octave + all 4 flats (used in MIX_UP, SPEED_ROUND, boss_bass_5)
const FULL_FLAT_POOL = ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'Bb3', 'Eb3', 'Ab3', 'Db3'];

// All 7 bass accidentals + full natural octave (used only in boss_bass_accidentals)
const ALL_ACCIDENTALS_POOL = ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'F#3', 'C#3', 'G#3', 'Bb3', 'Eb3', 'Ab3', 'Db3'];

/**
 * Unit 5 Nodes
 * Key features: Bb3 Discovery → Eb3 Discovery → Ab3 Discovery → Db3 Discovery →
 *               Practice flats-only → Practice flats in BCA context →
 *               Memory Mix-Up → Speed Round → Unit Boss → Accidentals Master Boss
 */
export const bassUnit5Nodes = [
  // ============================================
  // NODE 1: Meet B Flat (Discovery)
  // ============================================
  {
    id: 'bass_5_1',
    name: 'Meet B Flat',
    description: 'Discover Bb3 — it sits just below B!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_bass_4'],  // Requires Unit 4 completion

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['A3', 'Bb3', 'B3'],
      focusNotes: ['Bb3'],
      contextNotes: ['A3', 'B3'],
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note Bb3',

    exercises: [
      {
        // NOTE_RECOGNITION only — mic outputs A#3, not Bb3 (enharmonic constraint)
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['A3', 'Bb3', 'B3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['A3', 'Bb3', 'B3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Meet E Flat (Discovery)
  // ============================================
  {
    id: 'bass_5_2',
    name: 'Meet E Flat',
    description: 'Discover Eb3 — tucked between D and E',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['bass_5_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['D3', 'Eb3', 'E3'],
      focusNotes: ['Eb3'],
      contextNotes: ['D3', 'E3'],
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note Eb3',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['D3', 'Eb3', 'E3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['D3', 'Eb3', 'E3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Meet A Flat (Discovery)
  // ============================================
  {
    id: 'bass_5_3',
    name: 'Meet A Flat',
    description: 'Discover Ab3 — just below A, higher than G',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['bass_5_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['G3', 'Ab3', 'A3'],
      focusNotes: ['Ab3'],
      contextNotes: ['G3', 'A3'],
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note Ab3',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['G3', 'Ab3', 'A3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['G3', 'Ab3', 'A3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet D Flat (Discovery)
  // ============================================
  {
    id: 'bass_5_4',
    name: 'Meet D Flat',
    description: 'Discover Db3 — between C and D at the bottom of the bass!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['bass_5_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C3', 'Db3', 'D3'],
      focusNotes: ['Db3'],
      contextNotes: ['C3', 'D3'],
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NOTE,
    newContentDescription: 'Note Db3',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C3', 'Db3', 'D3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C3', 'Db3', 'D3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Flats Together (Practice - NOTE_RECOGNITION only)
  // ============================================
  {
    id: 'bass_5_5',
    name: 'Flats Together',
    description: 'Identify all four flat notes together',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['bass_5_4'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['Bb3', 'Eb3', 'Ab3', 'Db3'],
      focusNotes: [],
      contextNotes: ['Bb3', 'Eb3', 'Ab3', 'Db3'],
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'All four flats',

    exercises: [
      {
        // NOTE_RECOGNITION only — SIGHT_READING not safe for flats (mic enharmonic issue)
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['Bb3', 'Eb3', 'Ab3', 'Db3'],
          questionCount: 10,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['Bb3', 'Eb3', 'Ab3', 'Db3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Flats in Context (Practice - NOTE_RECOGNITION only)
  // ============================================
  {
    id: 'bass_5_6',
    name: 'Flats in Context',
    description: 'Find flat notes mixed with familiar bass notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['bass_5_5'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['B3', 'C4', 'A3', 'Bb3', 'Eb3', 'Ab3', 'Db3'],
      focusNotes: [],
      contextNotes: ['B3', 'C4', 'A3', 'Bb3', 'Eb3', 'Ab3', 'Db3'],
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 75, default: 70 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Flats with BCA context',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['B3', 'C4', 'A3', 'Bb3', 'Eb3', 'Ab3', 'Db3'],
          questionCount: 12,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['B3', 'C4', 'A3', 'Bb3', 'Eb3', 'Ab3', 'Db3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Flat Memory (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'bass_5_7',
    name: 'Flat Memory',
    description: 'Match all flat notes in a bass clef memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['bass_5_6'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: FULL_FLAT_POOL,
      focusNotes: [],
      contextNotes: FULL_FLAT_POOL,
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.NONE,
    newContentDescription: 'Full octave + flats memory',

    exercises: [
      {
        // MEMORY_GAME — no mic input, safe for flats
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: FULL_FLAT_POOL,
          gridSize: '4x4',       // picks 8 pairs from pool
          clef: 'bass',
          timeLimit: 180         // 3 minutes
        }
      }
    ],

    skills: FULL_FLAT_POOL,
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Flat Speed (Speed Round)
  // ============================================
  {
    id: 'bass_5_8',
    name: 'Flat Speed',
    description: 'Race the clock — spot those flat notes fast!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['bass_5_7'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: FULL_FLAT_POOL,
      focusNotes: [],
      contextNotes: FULL_FLAT_POOL,
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.SIMPLE,
      allowedDurations: ['q'],
      patterns: ['quarter'],
      tempo: { min: 60, max: 70, default: 65 }
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Speed challenge',

    exercises: [
      {
        // NOTE_RECOGNITION only — SIGHT_READING not safe for flats
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: FULL_FLAT_POOL,
          questionCount: 20,
          clef: 'bass',
          timeLimit: 150000      // 2.5 minutes
        }
      }
    ],

    skills: FULL_FLAT_POOL,
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 9: Flat Master (BOSS - boss_bass_5)
  // ============================================
  {
    id: 'boss_bass_5',
    name: 'Flat Master',
    description: 'Master all four flat notes in the ultimate bass challenge!',
    unlockHint: 'Complete all flat note lessons to unlock this challenge!',
    category: 'boss',   // String literal — NOT the CATEGORY constant
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 8,
    orderInUnit: 9,
    prerequisites: ['bass_5_8'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: FULL_FLAT_POOL,
      focusNotes: [],
      contextNotes: FULL_FLAT_POOL,
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 75, default: 70 }
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Bass Flats Boss',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: FULL_FLAT_POOL,
          questionCount: 15,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        // SIGHT_READING included for boss — INERT until Phase 04 wires into expandedNodes.js
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: FULL_FLAT_POOL,
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: FULL_FLAT_POOL,
    xpReward: 150,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 10: Accidentals Master (Cross-Unit BOSS - boss_bass_accidentals)
  // Covers ALL 7 bass accidentals: F#3, C#3, G#3, Bb3, Eb3, Ab3, Db3
  // Plus full C3-C4 natural range = 15 notes total
  // ============================================
  {
    id: 'boss_bass_accidentals',
    name: 'Accidentals Master',
    description: 'The ultimate challenge — all 7 bass accidentals plus the full octave!',
    unlockHint: 'Complete the Flat Master boss to unlock this epic challenge!',
    category: 'boss',   // String literal — NOT the CATEGORY constant
    unit: UNIT_ID,
    unitName: 'Accidentals Master',
    order: START_ORDER + 9,
    orderInUnit: 10,
    prerequisites: ['boss_bass_5'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: ALL_ACCIDENTALS_POOL,  // 15 notes: full octave + all 7 accidentals
      focusNotes: [],
      contextNotes: ALL_ACCIDENTALS_POOL,
      clef: 'bass',
      ledgerLines: false,
      accidentals: true
    },

    rhythmConfig: {
      complexity: RHYTHM_COMPLEXITY.MEDIUM,
      allowedDurations: ['q', 'h'],
      patterns: ['quarter', 'half'],
      tempo: { min: 65, max: 75, default: 70 }
    },

    newContent: NEW_CONTENT_TYPES.CHALLENGE_TYPE,
    newContentDescription: 'Bass Accidentals Complete!',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ALL_ACCIDENTALS_POOL,
          questionCount: 15,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        // SIGHT_READING included — INERT until Phase 04 wires into expandedNodes.js
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ALL_ACCIDENTALS_POOL,
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ALL_ACCIDENTALS_POOL,
    xpReward: 200,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default bassUnit5Nodes;
