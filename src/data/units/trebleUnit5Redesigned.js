/**
 * Treble Clef Unit 5: "Flat Notes" (Redesigned)
 *
 * Introduces accidentals: Bb4 and Eb4
 * - Discovery nodes introduce each flat with nearest-neighbor context
 * - Regular practice nodes use NOTE_RECOGNITION ONLY (no SIGHT_READING)
 *   REASON: Mic pitch detection outputs A#4 (not Bb4) and D#4 (not Eb4).
 *   Using SIGHT_READING with flat notePools causes silent scoring failure.
 *   Fix (INTG-03) is in Phase 04. Boss nodes are inert until Phase 04 wires
 *   them into expandedNodes.js, so SIGHT_READING in boss nodes is safe to define.
 * - No F#4 or C#4 in regular node notePools (flats unit is strictly flat-only)
 * - All nodes have accidentals: true in noteConfig
 * - Accidentals boss (boss_treble_accidentals) mixes all 4 accidentals + full octave
 *
 * Duration: 30-35 minutes
 * Goal: Recognize Bb4 and Eb4 confidently among natural notes
 * Prerequisite: boss_treble_4 (Unit 4 / sharps completion)
 */

import { NODE_TYPES, RHYTHM_COMPLEXITY, NEW_CONTENT_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 5;
const UNIT_NAME = 'Flat Notes';
const CATEGORY = 'treble_clef';
const START_ORDER = 34;  // After Unit 4 (7 nodes starting at 27, so ends at 33)

/**
 * Unit 5 Nodes
 * Key features: Bb4 Discovery → Eb4 Discovery → Practice (NR only) → Memory → Speed → Boss → Accidentals Boss
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
  // NODE 3: Flats Together (Practice)
  // NOTE: NOTE_RECOGNITION only -- mic outputs A#4/D#4, not Bb4/Eb4
  // ============================================
  {
    id: 'treble_5_3',
    name: 'Flats Together',
    description: 'Play Bb and Eb side by side',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['treble_5_2'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['Bb4', 'Eb4'],
      focusNotes: [],
      contextNotes: ['Bb4', 'Eb4'],
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
    newContentDescription: 'Both flats',

    exercises: [
      {
        // NOTE_RECOGNITION (NOT sight reading -- enharmonic mic bug: mic outputs A#4/D#4)
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['Bb4', 'Eb4'],
          questionCount: 10,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['Bb4', 'Eb4'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 4: Flats and Friends (Practice)
  // NOTE: NOTE_RECOGNITION only -- enharmonic mic bug
  // ============================================
  {
    id: 'treble_5_4',
    name: 'Flats and Friends',
    description: 'Mix flats with natural notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['treble_5_3'],

    nodeType: NODE_TYPES.PRACTICE,

    noteConfig: {
      notePool: ['D4', 'Eb4', 'E4', 'A4', 'Bb4', 'B4'],
      focusNotes: [],
      contextNotes: ['D4', 'Eb4', 'E4', 'A4', 'Bb4', 'B4'],
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
        // NOTE_RECOGNITION (NOT sight reading -- enharmonic mic bug)
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool: ['D4', 'Eb4', 'E4', 'A4', 'Bb4', 'B4'],
          questionCount: 12,
          clef: 'treble',
          timeLimit: null
        }
      }
    ],

    skills: ['D4', 'Eb4', 'E4', 'A4', 'Bb4', 'B4'],
    xpReward: 55,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 5: Flat Memory (Mix-Up - Memory Game)
  // ============================================
  {
    id: 'treble_5_5',
    name: 'Flat Memory',
    description: 'Match flat notes in a memory game',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['treble_5_4'],

    nodeType: NODE_TYPES.MIX_UP,

    noteConfig: {
      notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
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
          notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          gridSize: '4x4',     // picks 8 pairs from pool
          clef: 'treble',
          timeLimit: 180       // 3 minutes
        }
      }
    ],

    skills: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 60,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 6: Flat Speed (Speed Round)
  // ============================================
  {
    id: 'treble_5_6',
    name: 'Flat Speed',
    description: 'Race the clock to name flat notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['treble_5_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    noteConfig: {
      notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
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
          notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          questionCount: 20,
          clef: 'treble',
          timeLimit: 150000    // 2.5 minutes
        }
      }
    ],

    skills: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 65,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 7: Flat Star (BOSS - boss_treble_5)
  // NOTE: SIGHT_READING included here -- boss is inert until Phase 04 wires it
  //       into expandedNodes.js, so no runtime impact before INTG-03 is fixed
  // ============================================
  {
    id: 'boss_treble_5',
    name: 'Flat Star',
    description: 'Master all flat notes in the ultimate challenge!',
    unlockHint: 'Complete all flat note lessons to unlock this challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['treble_5_6'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
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
          notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        // SIGHT_READING safe here -- boss is inert until Phase 04 wires it in (INTG-03 fix)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'D4', 'Eb4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 150,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  },

  // ============================================
  // NODE 8: Accidentals Master (BOSS - boss_treble_accidentals)
  // The cross-unit boss challenge mixing ALL 4 accidentals + full C4-C5 octave
  // This is the ONLY node in this file with F#4 and C#4 in its notePool
  // NOTE: Both SIGHT_READING exercises are safe -- node is inert until Phase 04
  // ============================================
  {
    id: 'boss_treble_accidentals',
    name: 'Accidentals Master',
    description: 'Face all four accidentals in one epic challenge!',
    unlockHint: 'Beat both the Sharp Star and Flat Star to face the ultimate accidentals challenge!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: 'Accidentals Master',   // Override UNIT_NAME for this cross-unit boss
    order: START_ORDER + 7,
    orderInUnit: 8,
    prerequisites: ['boss_treble_5'],

    nodeType: NODE_TYPES.BOSS,

    noteConfig: {
      // All 4 accidentals (F#4, C#4, Bb4, Eb4) + full C4-C5 octave = 12 notes
      notePool: ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
      focusNotes: [],
      contextNotes: ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
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
          notePool: ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          questionCount: 15,
          clef: 'treble',
          timeLimit: null
        }
      },
      {
        // SIGHT_READING safe here -- boss is inert until Phase 04 wires it in (INTG-03 fix)
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool: ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
          measuresPerPattern: 2,
          clef: 'treble',
          timeSignature: '4/4',
          rhythmPatterns: ['quarter', 'half'],
          tempo: 70
        }
      }
    ],

    skills: ['C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'A4', 'Bb4', 'B4', 'C5'],
    xpReward: 200,
    accessoryUnlock: null,
    isBoss: true,
    isReview: false,
    reviewsUnits: []
  }
];

export default trebleUnit5Nodes;
