/**
 * Ear Training Unit 2: "Interval Explorer"
 *
 * Educational psychology-driven design for 8-year-old learners.
 * - Incremental interval categories (D-04): step → skip → leap → mixed → all → descending
 * - Split by game type (D-06): INTERVAL_ID for regular nodes, PITCH_COMPARISON in boss
 * - 7 nodes: 6 progression nodes + 1 mini-boss
 *
 * Duration: 25-30 minutes (3-4 min per node)
 * Goal: Build interval identification from simple steps to all interval categories
 */

import { NODE_TYPES } from '../nodeTypes.js';
import { EXERCISE_TYPES } from '../constants.js';

const UNIT_ID = 2;
const UNIT_NAME = 'Interval Explorer';
const CATEGORY = 'ear_training';
const START_ORDER = 163;

/**
 * Unit 2 Nodes
 * Journey: Steps → Skips → Leaps → Mixed → All → Descending → Boss challenge
 */
export const earTrainingUnit2Nodes = [
  // ============================================
  // NODE 1: Step by Step (Discovery)
  // ============================================
  {
    id: 'ear_2_1',
    name: 'Step by Step',
    description: 'Hear the smallest moves — steps between notes',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER,
    orderInUnit: 1,
    prerequisites: ['boss_ear_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4'],
          questionCount: 10,
          allowedCategories: ['step'],
          ascendingRatio: 0.8,
        },
      },
    ],

    skills: ['interval_step'],
    xpReward: 40,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 2: Little Skips (Discovery)
  // ============================================
  {
    id: 'ear_2_2',
    name: 'Little Skips',
    description: 'Bigger than steps — hear the skips!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 1,
    orderInUnit: 2,
    prerequisites: ['ear_2_1'],

    nodeType: NODE_TYPES.DISCOVERY,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
          questionCount: 10,
          allowedCategories: ['skip'],
          ascendingRatio: 0.8,
        },
      },
    ],

    skills: ['interval_skip'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 3: Big Leaps (Discovery)
  // ============================================
  {
    id: 'ear_2_3',
    name: 'Big Leaps',
    description: 'Giant jumps — these are leaps!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 2,
    orderInUnit: 3,
    prerequisites: ['ear_2_2'],

    nodeType: NODE_TYPES.DISCOVERY,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4',
          ],
          questionCount: 10,
          allowedCategories: ['leap'],
          ascendingRatio: 0.8,
        },
      },
    ],

    skills: ['interval_leap'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 4: Mix It Up (Practice)
  // ============================================
  {
    id: 'ear_2_4',
    name: 'Mix It Up',
    description: 'Steps and skips together — is it one or the other?',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 3,
    orderInUnit: 4,
    prerequisites: ['ear_2_3'],

    nodeType: NODE_TYPES.PRACTICE,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
          questionCount: 10,
          allowedCategories: ['step', 'skip'],
          ascendingRatio: 0.7,
        },
      },
    ],

    skills: ['interval_step', 'interval_skip'],
    xpReward: 45,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 5: All the Moves (Challenge)
  // ============================================
  {
    id: 'ear_2_5',
    name: 'All the Moves',
    description: 'Steps, skips, AND leaps — any could appear!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 4,
    orderInUnit: 5,
    prerequisites: ['ear_2_4'],

    nodeType: NODE_TYPES.CHALLENGE,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4',
          ],
          questionCount: 10,
          allowedCategories: ['step', 'skip', 'leap'],
          ascendingRatio: 0.6,
        },
      },
    ],

    skills: ['interval_all'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 6: Going Down (Challenge)
  // ============================================
  {
    id: 'ear_2_6',
    name: 'Going Down',
    description: 'Intervals going downward — a new challenge!',
    category: CATEGORY,
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 5,
    orderInUnit: 6,
    prerequisites: ['ear_2_5'],

    nodeType: NODE_TYPES.CHALLENGE,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4',
          ],
          questionCount: 10,
          allowedCategories: ['step', 'skip', 'leap'],
          ascendingRatio: 0.2,
        },
      },
    ],

    skills: ['interval_id_descending'],
    xpReward: 50,
    accessoryUnlock: null,
    isBoss: false,
    isReview: false,
    reviewsUnits: [],
  },

  // ============================================
  // NODE 7: Interval Master (Mini-Boss)
  // ============================================
  {
    id: 'boss_ear_2',
    name: 'Interval Master',
    description: 'Show your interval mastery — all types, any direction!',
    unlockHint: 'Complete all Interval Explorer lessons to unlock!',
    category: 'boss',
    unit: UNIT_ID,
    unitName: UNIT_NAME,
    order: START_ORDER + 6,
    orderInUnit: 7,
    prerequisites: ['ear_2_6'],

    nodeType: NODE_TYPES.MINI_BOSS,

    exercises: [
      {
        type: EXERCISE_TYPES.INTERVAL_ID,
        config: {
          notePool: [
            'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4',
          ],
          questionCount: 10,
          allowedCategories: ['step', 'skip', 'leap'],
          ascendingRatio: 0.5,
        },
      },
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

    skills: ['interval_id_all', 'pitch_comparison_all'],
    xpReward: 100,
    accessoryUnlock: 'interval_master_badge',
    isBoss: true,
    isReview: false,
    reviewsUnits: [],
  },
];

export default earTrainingUnit2Nodes;
