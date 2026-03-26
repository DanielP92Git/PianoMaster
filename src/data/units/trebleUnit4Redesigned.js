/**
 * Treble Clef Unit 4: "Sharp Notes" (Redesigned — Phase 03 replacement)
 *
 * Introduces 3 sharps: F#4, C#4, and G#4 (expanded from Phase 02's F#4/C#4 only)
 * - One Discovery node per sharp — nearest-neighbor naturals (e.g. F4, F#4, G4)
 * - Practice nodes use SIGHT_READING (mic outputs F#4/C#4/G#4 matching exactly — safe)
 * - Mix-Up uses Memory Game for variety
 * - Speed Round reinforces recognition under time pressure
 * - Boss node has 2 exercises (NOTE_RECOGNITION + SIGHT_READING)
 * - All nodes have accidentals: true in noteConfig
 *
 * This file replaces the Phase 02 version (which covered only F#4 and C#4, 7 nodes).
 * Phase 03 version: 8 nodes (orders 27-34), 3 Discovery nodes.
 *
 * Duration: 30-35 minutes
 * Goal: Recognize F#4, C#4, and G#4 confidently among natural notes
 * Prerequisite: boss_treble_3 (Unit 3 completion)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 4;
const UNIT_NAME = 'Sharp Notes';
const CATEGORY = 'treble_clef';
const START_ORDER = 27;  // After Unit 3 (10 nodes starting at 17, so ends at 26)

/**
 * Unit 4 Nodes — Phase 03 version with G#4 added
 * Key features: F#4 Discovery → C#4 Discovery → G#4 Discovery → All-sharps Practice
 *               → Sharps+naturals Practice → Memory → Speed → Boss
 */
export const trebleUnit4Nodes = [
  // ============================================
  // NODE 1: Meet F Sharp (Discovery)
  // ============================================
  {
    id: 'treble_4_1',
    name: 'Meet F Sharp',
    description: 'Discover the sharp note F#',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_treble_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['F4', 'F#4', 'G4'],
      focusNotes: ['F#4'],
      contextNotes: ['F4', 'G4'],
      clef: 'treble',
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
    newContentDescription: 'Note F#',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['F4', 'F#4', 'G4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['F4', 'F#4', 'G4'],
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
    id: 'treble_4_2',
    name: 'Meet C Sharp',
    description: 'Discover the sharp note C#',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_4_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'C#4', 'D4'],
      focusNotes: ['C#4'],
      contextNotes: ['C4', 'D4'],
      clef: 'treble',
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
    newContentDescription: 'Note C#',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'C#4', 'D4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Meet G Sharp (Discovery) — NEW in Phase 03
  // ============================================
  {
    id: 'treble_4_3',
    name: 'Meet G Sharp',
    description: 'Discover the sharp note G#',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_4_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['G4', 'G#4', 'A4'],
      focusNotes: ['G#4'],
      contextNotes: ['G4', 'A4'],
      clef: 'treble',
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
    newContentDescription: 'Note G#',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['G4', 'G#4', 'A4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['G4', 'G#4', 'A4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: All Three Sharps (Practice)
  // SIGHT_READING safe -- mic outputs F#4/C#4/G#4 matching exactly
  // Pool includes surrounding naturals so patterns sound like real melodies
  // ============================================
  {
    id: 'treble_4_4',
    name: 'Sharps Together',
    description: 'Play F#, C#, and G# mixed with natural notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_4_3'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
      clef: 'treble',
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
        // SIGHT_READING is safe for sharps -- mic outputs F#4/C#4/G#4 matching exactly
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter'],
          tempo: 65
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Sharps and Friends (Practice)
  // ============================================
  {
    id: 'treble_4_5',
    name: 'Sharps and Friends',
    description: 'Mix sharps with natural notes in melodies',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_4_4'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
      clef: 'treble',
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
    newContentDescription: 'Sharps in context',

    exercises: [
      {
        // SIGHT_READING safe for sharps -- mic outputs sharp-form only
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Sharp Memory (Mix-Up - Memory Game)
  // Full C4-C5 octave + all 3 sharps = 11 notes
  // ============================================
  {
    id: 'treble_4_6',
    name: 'Sharp Memory',
    description: 'Match sharp notes in a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_4_5'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
      clef: 'treble',
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
    newContentDescription: 'Memory challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.MEMORY_GAME,
        config: {
          notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
          gridSize: '4x4',     // picks 8 pairs from 11-note pool
          clef: 'treble',
          timeLimit: 180       // 3 minutes
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
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
    id: 'treble_4_7',
    name: 'Sharp Speed',
    description: 'Race the clock to name sharp notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_4_6'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
      clef: 'treble',
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
          notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
          questionCount: 20,
          clef: 'treble',
          timeLimit: 150000    // 2.5 minutes
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Sharp Star (BOSS — boss_treble_4)
  // ============================================
  {
    id: 'boss_treble_4',
    name: 'Sharp Star',
    description: 'Master all three sharp notes in the ultimate challenge!',
    unlockHint: 'Complete all sharp note lessons to unlock this challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['treble_4_7'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
      clef: 'treble',
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
    newContentDescription: 'Sharp Notes Boss',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'B4', 'C5'],
    xpReward: 150,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default trebleUnit4Nodes;
