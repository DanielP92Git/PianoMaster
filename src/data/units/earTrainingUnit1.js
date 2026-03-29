/**
 * Ear Training Unit 1: "Sound Direction"
 *
 * Educational psychology-driven design for 8-year-old learners.
 * - Direction Before Distance (D-01): learn higher/lower before measuring intervals
 * - Intervals shrink progressively per node (D-03): wide (6-12 semitones) → narrow (1-2)
 * - All exercises use PITCH_COMPARISON game type
 * - 7 nodes: 6 progression nodes + 1 mini-boss
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Build pitch direction awareness as foundation for interval work
 */

import { NODE_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 1;
const UNIT_NAME = 'Sound Direction';
const CATEGORY = 'ear_training';
const START_ORDER = 156;

/**
 * Unit 1 Nodes
 * Journey: Wide jumps → Narrower steps → Near-identical pitches → Speed mastery
 */
export const earTrainingUnit1Nodes = [
  // ============================================
  // NODE 1: Hear the Jump (Discovery)
  // ============================================
  {
    id: 'ear_1_1',
    name: 'Hear the Jump',
    description: 'Listen and decide — which note is higher?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: [],

    nodeType: NODE_TYPES.DISCOVERY,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'],
          questionCount: 10,
          intervalRange: { min: 6, max: 12 },
        },
      },
    ],

    skills: ['pitch_comparison_wide'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Big Steps (Practice)
  // ============================================
  {
    id: 'ear_1_2',
    name: 'Big Steps',
    description: 'Big jumps between notes — up or down?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['ear_1_1'],

    nodeType: NODE_TYPES.PRACTICE,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4'],
          questionCount: 10,
          intervalRange: { min: 5, max: 8 },
        },
      },
    ],

    skills: ['pitch_comparison_wide'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Medium Hops (Practice)
  // ============================================
  {
    id: 'ear_1_3',
    name: 'Medium Hops',
    description: 'Medium-sized jumps — getting trickier!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['ear_1_2'],

    nodeType: NODE_TYPES.PRACTICE,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4',
          ],
          questionCount: 10,
          intervalRange: { min: 3, max: 5 },
        },
      },
    ],

    skills: ['pitch_comparison_medium'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Small Steps (Challenge)
  // ============================================
  {
    id: 'ear_1_4',
    name: 'Small Steps',
    description: 'Small steps between notes — listen very carefully!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['ear_1_3'],

    nodeType: NODE_TYPES.CHALLENGE,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4',
          ],
          questionCount: 10,
          intervalRange: { min: 2, max: 3 },
        },
      },
    ],

    skills: ['pitch_comparison_narrow'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: Tricky Twins (Challenge)
  // ============================================
  {
    id: 'ear_1_5',
    name: 'Tricky Twins',
    description: 'Notes that are almost the same — can you tell them apart?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['ear_1_4'],

    nodeType: NODE_TYPES.CHALLENGE,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: [
            'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3',
            'A3', 'A#3', 'B3', 'C4',
          ],
          questionCount: 10,
          intervalRange: { min: 1, max: 2 },
        },
      },
    ],

    skills: ['pitch_comparison_very_narrow'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Sound Champ (Speed Round)
  // ============================================
  {
    id: 'ear_1_6',
    name: 'Sound Champ',
    description: 'Any interval, any size — show what you know!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['ear_1_5'],

    nodeType: NODE_TYPES.SPEED_ROUND,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4',
          ],
          questionCount: 10,
          intervalRange: { min: 1, max: 12 },
        },
      },
    ],

    skills: ['pitch_comparison_all'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 7: Sound Director (Mini-Boss)
  // ============================================
  {
    id: 'boss_ear_1',
    name: 'Sound Director',
    description: 'Prove you can hear every pitch direction!',
    unlockHint: 'Complete all 6 Sound Direction lessons to unlock!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['ear_1_6'],

    nodeType: NODE_TYPES.MINI_BOSS,

    exercises: [
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4',
          ],
          questionCount: 10,
          intervalRange: { min: 6, max: 12 },
        },
      },
      {
        type: EXERCISE_TYPES.PITCH_COMPARISON,
        config: {
          notePool: ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3'],
          questionCount: 10,
          intervalRange: { min: 1, max: 3 },
        },
      },
    ],

    skills: ['pitch_comparison_all'],
    xpReward: 100,
    accessoryUnlock: 'ear_sprout_badge',
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default earTrainingUnit1Nodes;
