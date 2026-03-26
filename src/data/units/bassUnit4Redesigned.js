/**
 * Bass Clef Unit 4: "Sharp Notes" (Redesigned)
 *
 * Introduces bass accidentals: F#3, C#3, G#3 (three sharps)
 * - Each Discovery node introduces exactly ONE new sharp with nearest-neighbor naturals
 *   (F3/G3 for F#3, C3/D3 for C#3, G3/A3 for G#3)
 * - SIGHT_READING is SAFE for all sharps nodes — mic outputs F#3/C#3/G#3 matching exactly
 * - All 4 game modes used: NOTE_RECOGNITION, SIGHT_READING, MEMORY_GAME, timed NOTE_RECOGNITION
 * - Boss node has 2 exercises (NOTE_RECOGNITION + SIGHT_READING)
 * - All nodes have accidentals: true in noteConfig
 *
 * Duration: 25-35 minutes
 * Goal: Recognize F#3, C#3, and G#3 confidently among natural bass notes
 * Prerequisite: boss_bass_3 (Unit 3 completion — full bass octave C3-C4)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 4;
const UNIT_NAME = 'Sharp Notes';
const CATEGORY = 'bass_clef';
const START_ORDER = 76;  // After Unit 3 (10 nodes at orders 66-75)

// Full bass octave + all 3 sharps (used in MIX_UP, SPEED_ROUND, and BOSS)
const FULL_SHARP_POOL = ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'F#3', 'C#3', 'G#3'];

/**
 * Unit 4 Nodes
 * Key features: F#3 Discovery → C#3 Discovery → G#3 Discovery → Practice together →
 *               Practice with full context → Memory Mix-Up → Speed Round → BOSS
 */
export const bassUnit4Nodes = [
  // ============================================
  // NODE 1: Meet F Sharp (Discovery)
  // ============================================
  {
    id: 'bass_4_1',
    name: 'Meet F Sharp',
    description: 'Discover the sharp note F#3 — it sits just above F!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_bass_3'],  // Requires Unit 3 completion

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['F3', 'F#3', 'G3'],
      focusNotes: ['F#3'],
      contextNotes: ['F3', 'G3'],
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
    newContentDescription: 'Note F#3',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['F3', 'F#3', 'G3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['F3', 'F#3', 'G3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 2: Meet C Sharp (Discovery)
  // ============================================
  {
    id: 'bass_4_2',
    name: 'Meet C Sharp',
    description: 'Discover C#3 — it lives between C and D',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['bass_4_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C3', 'C#3', 'D3'],
      focusNotes: ['C#3'],
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
    newContentDescription: 'Note C#3',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C3', 'C#3', 'D3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['C3', 'C#3', 'D3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Meet G Sharp (Discovery)
  // ============================================
  {
    id: 'bass_4_3',
    name: 'Meet G Sharp',
    description: 'Discover G#3 — squeezed between G and A!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['bass_4_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['G3', 'G#3', 'A3'],
      focusNotes: ['G#3'],
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
    newContentDescription: 'Note G#3',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['G3', 'G#3', 'A3'],
          questionCount: 8,
          clef: 'bass',
          timeLimit: null
        }
      }
    ],

    skills: ['G3', 'G#3', 'A3'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Sharps Together (Practice - Sight Reading)
  // Pool includes surrounding naturals so patterns sound like real melodies
  // ============================================
  {
    id: 'bass_4_4',
    name: 'Sharps Together',
    description: 'Play F#, C#, and G# mixed with natural notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['bass_4_3'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C3', 'C#3', 'D3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
      focusNotes: [],
      contextNotes: ['C3', 'C#3', 'D3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
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
    newContentDescription: 'All three sharps',

    exercises: [
      {
        // SIGHT_READING is safe for sharps — mic outputs F#3/C#3/G#3 matching exactly
        // keySignature 'A' ensures only in-key notes (F#, C#, G#) appear -- no F/C/G naturals
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C3', 'C#3', 'D3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter'],
          tempo: 65,
          keySignature: 'A'
        }
      }
    ],

    skills: ['C3', 'C#3', 'D3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Sharps in Context (Practice - Expanded Pool)
  // ============================================
  {
    id: 'bass_4_5',
    name: 'Sharps in Context',
    description: 'Mix sharps with familiar bass notes in real melodies',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['bass_4_4'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['B3', 'C4', 'A3', 'F#3', 'C#3', 'G#3'],
      focusNotes: [],
      contextNotes: ['B3', 'C4', 'A3', 'F#3', 'C#3', 'G#3'],
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
    newContentDescription: 'Sharps with BCA context',

    exercises: [
      {
        // keySignature 'A' ensures only in-key notes (F#, C#, G#) appear -- no F/C/G naturals
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['B3', 'C4', 'A3', 'F#3', 'C#3', 'G#3'],
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70,
          keySignature: 'A'
        }
      }
    ],

    skills: ['B3', 'C4', 'A3', 'F#3', 'C#3', 'G#3'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Sharp Memory (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'bass_4_6',
    name: 'Sharp Memory',
    description: 'Match sharp notes in a bass clef memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['bass_4_5'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: FULL_SHARP_POOL,
      focusNotes: [],
      contextNotes: FULL_SHARP_POOL,
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
    newContentDescription: 'Full octave + sharps memory',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: FULL_SHARP_POOL,
          gridSize: '4x4',       // picks 8 pairs from pool
          clef: 'bass',
          timeLimit: 180         // 3 minutes
        }
      }
    ],

    skills: FULL_SHARP_POOL,
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Sharp Speed (Speed Round)
  // ============================================
  {
    id: 'bass_4_7',
    name: 'Sharp Speed',
    description: 'Race the clock — how fast can you name those sharps?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['bass_4_6'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: FULL_SHARP_POOL,
      focusNotes: [],
      contextNotes: FULL_SHARP_POOL,
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
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: FULL_SHARP_POOL,
          questionCount: 20,
          clef: 'bass',
          timeLimit: 150000      // 2.5 minutes
        }
      }
    ],

    skills: FULL_SHARP_POOL,
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Sharp Star (BOSS - boss_bass_4)
  // ============================================
  {
    id: 'boss_bass_4',
    name: 'Sharp Star',
    description: 'Master all three sharp notes in the ultimate bass challenge!',
    unlockHint: 'Complete all sharp note lessons to unlock this challenge!',
    category: 'boss',   // String literal — NOT the CATEGORY constant
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['bass_4_7'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: FULL_SHARP_POOL,
      focusNotes: [],
      contextNotes: FULL_SHARP_POOL,
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
    newContentDescription: 'Bass Sharps Boss',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: FULL_SHARP_POOL,
          questionCount: 15,
          clef: 'bass',
          timeLimit: null
        }
      },
      {
        // keySignature 'A' ensures only in-key notes (F#, C#, G#) appear -- no F/C/G naturals
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: FULL_SHARP_POOL,
          measuresPerPattern: 2,
          clef: 'bass',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70,
          keySignature: 'A'
        }
      }
    ],

    skills: FULL_SHARP_POOL,
    xpReward: 150,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default bassUnit4Nodes;
