/**
 * Node Generator Utility
 *
 * Generates consistent skill trail nodes using templates and configuration.
 * Used to create the expanded 90-node trail system with rhythm tiers.
 */

// Import constants from shared file
import { NODE_CATEGORIES, EXERCISE_TYPES } from '../data/constants.js';

/**
 * Rhythm tier configurations
 * Each tier represents a level of rhythm complexity
 */
export const RHYTHM_TIERS = {
  TIER_1: {
    id: 1,
    name: 'Quarters Only',
    patterns: ['quarter'],
    allowedDurations: ['q'],
    tempo: { min: 60, max: 70, default: 65 }
  },
  TIER_2: {
    id: 2,
    name: 'Quarters + Halves',
    patterns: ['quarter', 'half'],
    allowedDurations: ['q', 'h'],
    tempo: { min: 60, max: 75, default: 70 }
  },
  TIER_3: {
    id: 3,
    name: 'Quarters + Eighths',
    patterns: ['quarter', 'eighth'],
    allowedDurations: ['q', '8'],
    tempo: { min: 65, max: 75, default: 70 }
  },
  TIER_4: {
    id: 4,
    name: 'All Rhythms',
    patterns: ['quarter', 'half', 'eighth', 'whole'],
    allowedDurations: ['q', 'h', '8', 'w'],
    tempo: { min: 70, max: 80, default: 75 }
  },
  TIER_5: {
    id: 5,
    name: 'Advanced + Rests',
    patterns: ['quarter', 'half', 'eighth', 'whole', 'dotted'],
    allowedDurations: ['q', 'h', '8', 'w', 'qd', 'qr'],
    tempo: { min: 70, max: 90, default: 80 }
  }
};

/**
 * Generate a single node with enhanced metadata
 *
 * @param {Object} config - Node configuration
 * @returns {Object} - Complete node definition
 */
export const generateNode = (config) => {
  const {
    id,
    name,
    description,
    category,
    unit,
    unitName,
    order,
    orderInUnit,
    prerequisites = [],
    notePool,
    clef,
    rhythmTier = 1,
    exerciseTypes = [EXERCISE_TYPES.NOTE_RECOGNITION, EXERCISE_TYPES.SIGHT_READING],
    xpReward = 50,
    accessoryUnlock = null,
    isBoss = false,
    isReview = false,
    reviewsUnits = [],
    measuresPerPattern = 1,
    questionCount = 10,
    timeLimit = null
  } = config;

  const rhythmConfig = RHYTHM_TIERS[`TIER_${rhythmTier}`];

  // Build exercises array based on types
  const exercises = exerciseTypes.map(type => {
    if (type === EXERCISE_TYPES.NOTE_RECOGNITION) {
      return {
        type: EXERCISE_TYPES.NOTE_RECOGNITION,
        config: {
          notePool,
          questionCount,
          clef,
          timeLimit
        }
      };
    }

    if (type === EXERCISE_TYPES.SIGHT_READING) {
      return {
        type: EXERCISE_TYPES.SIGHT_READING,
        config: {
          notePool,
          measuresPerPattern,
          clef,
          timeSignature: '4/4',
          rhythmPatterns: rhythmConfig.patterns,
          tempo: rhythmConfig.tempo.default
        }
      };
    }

    if (type === EXERCISE_TYPES.RHYTHM) {
      return {
        type: EXERCISE_TYPES.RHYTHM,
        config: {
          rhythmPatterns: rhythmConfig.patterns,
          tempo: rhythmConfig.tempo.default,
          measuresPerPattern,
          timeSignature: '4/4'
        }
      };
    }

    if (type === EXERCISE_TYPES.BOSS_CHALLENGE) {
      return {
        type: EXERCISE_TYPES.BOSS_CHALLENGE,
        config: {
          notePool,
          questionCount: questionCount || 20,
          clef,
          timeLimit: timeLimit || 180000, // 3 minutes
          difficulty: 'hard',
          rhythmPatterns: rhythmConfig.patterns
        }
      };
    }

    return null;
  }).filter(Boolean);

  return {
    id,
    name,
    description,
    category,

    // Unit metadata
    unit,
    unitName,
    order,
    orderInUnit,

    // Configuration
    noteConfig: {
      notePool,
      clef,
      ledgerLines: false,
      accidentals: false
    },

    rhythmConfig: {
      tier: rhythmTier,
      patterns: rhythmConfig.patterns,
      allowedDurations: rhythmConfig.allowedDurations,
      tempo: rhythmConfig.tempo
    },

    // Existing fields
    prerequisites,
    skills: notePool || rhythmConfig.patterns,
    exercises,
    xpReward,
    accessoryUnlock,
    isBoss,

    // New fields
    isReview,
    reviewsUnits
  };
};

/**
 * Generate an entire unit with progressive rhythm tiers
 *
 * @param {Object} config - Unit configuration
 * @returns {Array} - Array of node definitions
 */
export const generateUnit = (config) => {
  const {
    category,
    unitNumber,
    unitName,
    theme,
    baseNotePool,
    clef,
    startOrder,
    rhythmTiers = [1, 2, 3, 4],
    includeIntro = true,
    includeBoss = true,
    bossConfig = {}
  } = config;

  const nodes = [];
  let currentOrder = startOrder;
  let orderInUnit = 1;
  const unitId = `${category}_unit_${unitNumber}`;

  // Convert category to prefix (treble_clef -> treble, bass_clef -> bass)
  const prefix = category.split('_')[0];

  // Generate intro node (Tier 1, Note Recognition only)
  if (includeIntro) {
    nodes.push(generateNode({
      id: `${prefix}_${unitNumber}_${orderInUnit}`,
      name: `${unitName} - Introduction`,
      description: `Learn the ${unitName} notes`,
      category,
      unit: unitNumber,
      unitName,
      order: currentOrder++,
      orderInUnit: orderInUnit++,
      prerequisites: nodes.length > 0 ? [nodes[nodes.length - 1].id] : [],
      notePool: baseNotePool,
      clef,
      rhythmTier: 1,
      exerciseTypes: [EXERCISE_TYPES.NOTE_RECOGNITION],
      xpReward: 40,
      questionCount: 8
    }));
  }

  // Generate nodes for each rhythm tier
  rhythmTiers.forEach((tier, index) => {
    const prevNodeId = nodes[nodes.length - 1]?.id || null;
    const tierName = RHYTHM_TIERS[`TIER_${tier}`].name;

    nodes.push(generateNode({
      id: `${prefix}_${unitNumber}_${orderInUnit}`,
      name: `${unitName} - ${tierName}`,
      description: `Practice ${unitName} with ${tierName.toLowerCase()}`,
      category,
      unit: unitNumber,
      unitName,
      order: currentOrder++,
      orderInUnit: orderInUnit++,
      prerequisites: prevNodeId ? [prevNodeId] : [],
      notePool: baseNotePool,
      clef,
      rhythmTier: tier,
      exerciseTypes: [EXERCISE_TYPES.NOTE_RECOGNITION, EXERCISE_TYPES.SIGHT_READING],
      xpReward: 45 + (tier * 5),
      measuresPerPattern: tier <= 2 ? 2 : tier === 3 ? 3 : 4,
      questionCount: 10 + (tier * 2)
    }));
  });

  // Generate boss node
  if (includeBoss) {
    const prevNodeId = nodes[nodes.length - 1]?.id;
    const prefix = category.split('_')[0];
    nodes.push(generateNode({
      id: `boss_${prefix}_${unitNumber}`,
      name: `${unitName} Challenge`,
      description: `Master the ${unitName} unit!`,
      category: NODE_CATEGORIES.BOSS,
      unit: unitNumber,
      unitName,
      order: currentOrder++,
      orderInUnit: orderInUnit++,
      prerequisites: [prevNodeId],
      notePool: baseNotePool,
      clef,
      rhythmTier: 4,
      exerciseTypes: [EXERCISE_TYPES.BOSS_CHALLENGE],
      xpReward: 150,
      isBoss: true,
      questionCount: 20,
      timeLimit: 120000 + (unitNumber * 30000), // 2min + 30s per unit
      ...bossConfig
    }));
  }

  return nodes;
};

/**
 * Generate standalone rhythm unit (no pitch)
 *
 * @param {Object} config - Rhythm unit configuration
 * @returns {Array} - Array of rhythm node definitions
 */
export const generateRhythmUnit = (config) => {
  const {
    unitNumber,
    unitName,
    rhythmTiers = [1, 2, 3, 4],
    startOrder,
    includeBoss = true
  } = config;

  const nodes = [];
  let currentOrder = startOrder;
  let orderInUnit = 1;

  // Generate nodes for each rhythm tier
  rhythmTiers.forEach((tier, index) => {
    const prevNodeId = nodes[nodes.length - 1]?.id || null;
    const tierConfig = RHYTHM_TIERS[`TIER_${tier}`];

    nodes.push(generateNode({
      id: `rhythm_${unitNumber}_${orderInUnit}`,
      name: `${unitName} - ${tierConfig.name}`,
      description: `Master ${tierConfig.name.toLowerCase()} rhythms`,
      category: NODE_CATEGORIES.RHYTHM,
      unit: unitNumber,
      unitName,
      order: currentOrder++,
      orderInUnit: orderInUnit++,
      prerequisites: prevNodeId ? [prevNodeId] : [],
      notePool: null,
      clef: null,
      rhythmTier: tier,
      exerciseTypes: [EXERCISE_TYPES.RHYTHM],
      xpReward: 50 + (tier * 5),
      measuresPerPattern: 2 + tier,
      questionCount: null
    }));
  });

  // Generate boss node
  if (includeBoss) {
    const prevNodeId = nodes[nodes.length - 1]?.id;
    const highestTier = Math.max(...rhythmTiers);
    const tierConfig = RHYTHM_TIERS[`TIER_${highestTier}`];

    nodes.push(generateNode({
      id: `boss_rhythm_${unitNumber}`,
      name: `${unitName} Challenge`,
      description: `Test your ${unitName.toLowerCase()} mastery!`,
      category: NODE_CATEGORIES.BOSS,
      unit: unitNumber,
      unitName,
      order: currentOrder++,
      orderInUnit: orderInUnit++,
      prerequisites: [prevNodeId],
      notePool: null,
      clef: null,
      rhythmTier: highestTier,
      exerciseTypes: [EXERCISE_TYPES.BOSS_CHALLENGE],
      xpReward: 150,
      isBoss: true,
      questionCount: null,
      timeLimit: 120000,
      measuresPerPattern: 4
    }));
  }

  return nodes;
};

export default {
  generateNode,
  generateUnit,
  generateRhythmUnit,
  RHYTHM_TIERS
};
