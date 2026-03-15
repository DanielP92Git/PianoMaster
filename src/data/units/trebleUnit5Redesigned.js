/**
 * Treble Clef Unit 5: "Flat Notes" (Redesigned — Phase 03 replacement)
 *
 * Introduces 4 flats: Bb4, Eb4, Ab4, and Db4 (expanded from Phase 02's Bb4/Eb4 only)
 * - One Discovery node per flat — nearest-neighbor naturals (e.g. A4, Bb4, B4)
 * - Regular practice nodes use NOTE_RECOGNITION ONLY (no SIGHT_READING)
 *   REASON: Mic pitch detection outputs A#4/D#4/G#4/C#4 (not Bb4/Eb4/Ab4/Db4).
 *   Using SIGHT_READING with flat notePools causes silent scoring failure (INTG-03).
 *   Fix is in Phase 04. Boss nodes are inert until Phase 04 wires them into
 *   expandedNodes.js, so SIGHT_READING in boss nodes is safe to define now.
 * - No sharps (F#4, C#4, G#4) in any regular node notePools
 * - All nodes have accidentals: true in noteConfig
 * - boss_treble_accidentals mixes ALL 7 treble accidentals + full C4-C5 octave (15 notes)
 *
 * This file replaces the Phase 02 version (which covered only Bb4 and Eb4, 8 nodes).
 * Phase 03 version: 10 nodes (orders 35-44), 4 Discovery nodes, 2 Boss nodes.
 *
 * Duration: 35-40 minutes
 * Goal: Recognize Bb4, Eb4, Ab4, and Db4 confidently among natural notes
 * Prerequisite: boss_treble_4 (Unit 4 / sharps completion)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 5;
const UNIT_NAME = 'Flat Notes';
const CATEGORY = 'treble_clef';
const START_ORDER = 35;  // After Unit 4 (8 nodes starting at 27, so ends at 34)

/**
 * Unit 5 Nodes — Phase 03 version with Ab4 and Db4 added
 * Key features: Bb4 Discovery → Eb4 Discovery → Ab4 Discovery → Db4 Discovery
 *               → All-flats Practice (NR only) → Flats+naturals Practice (NR only)
 *               → Memory → Speed → Flat Boss → Accidentals Master Boss
 */
export const trebleUnit5Nodes = [
  // ============================================
  // NODE 1: Meet B Flat (Discovery)
  // ============================================
  {
    id: 'treble_5_1',
    name: 'Meet B Flat',
    description: 'Discover the flat note Bb',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_treble_4'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['A4', 'Bb4', 'B4'],
      focusNotes: ['Bb4'],
      contextNotes: ['A4', 'B4'],
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
    newContentDescription: 'Note Bb',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['A4', 'Bb4', 'B4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['A4', 'Bb4', 'B4'],
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
    id: 'treble_5_2',
    name: 'Meet E Flat',
    description: 'Discover the flat note Eb',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['treble_5_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['D4', 'Eb4', 'E4'],
      focusNotes: ['Eb4'],
      contextNotes: ['D4', 'E4'],
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
    newContentDescription: 'Note Eb',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['D4', 'Eb4', 'E4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['D4', 'Eb4', 'E4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 3: Meet A Flat (Discovery) — NEW in Phase 03
  // ============================================
  {
    id: 'treble_5_3',
    name: 'Meet A Flat',
    description: 'Discover the flat note Ab',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_5_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['G4', 'Ab4', 'A4'],
      focusNotes: ['Ab4'],
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
    newContentDescription: 'Note Ab',

    exercises: [
      {
        // NOTE_RECOGNITION only -- mic outputs G#4 (not Ab4) for this note
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['G4', 'Ab4', 'A4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['G4', 'Ab4', 'A4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Meet D Flat (Discovery) — NEW in Phase 03
  // ============================================
  {
    id: 'treble_5_4',
    name: 'Meet D Flat',
    description: 'Discover the flat note Db',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_5_3'],

    nodeType: NODE_TYPES.DISCOVERY,

    noteConfig: {
      notePool: ['C4', 'Db4', 'D4'],
      focusNotes: ['Db4'],
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
    newContentDescription: 'Note Db',

    exercises: [
      {
        // NOTE_RECOGNITION only -- mic outputs C#4 (not Db4) for this note
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'Db4', 'D4'],
          questionCount: 8,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'Db4', 'D4'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: All Four Flats (Practice)
  // NOTE: NOTE_RECOGNITION only -- mic outputs enharmonic sharps for all 4 flats
  // ============================================
  {
    id: 'treble_5_5',
    name: 'Flats Together',
    description: 'Play Bb, Eb, Ab, and Db side by side',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_5_4'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['Bb4', 'Eb4', 'Ab4', 'Db4'],
      focusNotes: [],
      contextNotes: ['Bb4', 'Eb4', 'Ab4', 'Db4'],
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
    newContentDescription: 'All four flats',

    exercises: [
      {
        // NOTE_RECOGNITION only -- enharmonic mic bug: mic outputs A#4/D#4/G#4/C#4
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['Bb4', 'Eb4', 'Ab4', 'Db4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['Bb4', 'Eb4', 'Ab4', 'Db4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Flats and Friends (Practice)
  // NOTE: NOTE_RECOGNITION only -- enharmonic mic bug
  // ============================================
  {
    id: 'treble_5_6',
    name: 'Flats and Friends',
    description: 'Mix flats with natural notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_5_5'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4'],
      focusNotes: [],
      contextNotes: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4'],
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
    newContentDescription: 'Flats in context',

    exercises: [
      {
        // NOTE_RECOGNITION only -- enharmonic mic bug for all flats
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4'],
          questionCount: 12,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Flat Memory (Mix-Up - Memory Game)
  // Full C4-C5 octave + all 4 flats = 12 notes
  // ============================================
  {
    id: 'treble_5_7',
    name: 'Flat Memory',
    description: 'Match flat notes in a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_5_6'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
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
          notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
          gridSize: '4x4',     // picks 8 pairs from 12-note pool
          clef: 'treble',
          timeLimit: 180       // 3 minutes
        }
      }
    ],

    skills: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Flat Speed (Speed Round)
  // NOTE: NOTE_RECOGNITION only -- enharmonic mic bug
  // ============================================
  {
    id: 'treble_5_8',
    name: 'Flat Speed',
    description: 'Race the clock to name flat notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['treble_5_7'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
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
        // NOTE_RECOGNITION only -- enharmonic mic bug for all flats
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
          questionCount: 20,
          clef: 'treble',
          timeLimit: 150000    // 2.5 minutes
        }
      }
    ],

    skills: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 9: Flat Star (BOSS — boss_treble_5)
  // NOTE: SIGHT_READING included here -- boss is inert until Phase 04 wires it
  //       into expandedNodes.js, so no runtime impact before INTG-03 is fixed
  // ============================================
  {
    id: 'boss_treble_5',
    name: 'Flat Star',
    description: 'Master all four flat notes in the ultimate challenge!',
    unlockHint: 'Complete all flat note lessons to unlock this challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 8,
    orderInUnit: 9,
    prerequisites: ['treble_5_8'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
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
    newContentDescription: 'Flat Notes Boss',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        // SIGHT_READING safe here -- boss is inert until Phase 04 wires it in (INTG-03 fix)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 150,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 10: Accidentals Master (BOSS — boss_treble_accidentals)
  // Cross-unit boss mixing ALL 7 treble accidentals + full C4-C5 octave = 15 notes
  // This is the ONLY node in this file with sharps (F#4, C#4, G#4) in its notePool
  // NOTE: SIGHT_READING is safe -- node is inert until Phase 04 wires it in
  // ============================================
  {
    id: 'boss_treble_accidentals',
    name: 'Accidentals Master',
    description: 'Face all seven accidentals in one epic challenge!',
    unlockHint: 'Beat both the Sharp Star and Flat Star to face the ultimate accidentals challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: 'Accidentals Master',   // Override UNIT_NAME for this cross-unit boss
    order: START_ORDER + 9,
    orderInUnit: 10,
    prerequisites: ['boss_treble_5'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      // All 7 accidentals (F#4, C#4, G#4, Bb4, Eb4, Ab4, Db4) + full C4-C5 octave = 15 notes
      notePool: ['C4', 'C#4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
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
    newContentDescription: 'Accidentals Master Challenge',

    exercises: [
      {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['C4', 'C#4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        // SIGHT_READING safe here -- boss is inert until Phase 04 wires it in (INTG-03 fix)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'C#4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'C#4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 200,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default trebleUnit5Nodes;
