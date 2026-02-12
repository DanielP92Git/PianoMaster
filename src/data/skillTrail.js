/**
 * Skill Trail Node Definitions
 *
 * Each node represents a learnable skill unit in the piano learning journey.
 * Nodes are organized into parallel paths: Treble Clef, Bass Clef, and Rhythm.
 */

// Import and re-export constants from shared file
import { NODE_CATEGORIES, EXERCISE_TYPES } from './constants.js';

export { NODE_CATEGORIES, EXERCISE_TYPES };

/**
 * Unit Metadata
 * Each unit represents a themed group of 5-8 nodes with progressive difficulty
 */
export const UNITS = {
  // ============================================
  // TREBLE CLEF UNITS
  // ============================================
  TREBLE_1: {
    id: 'treble_unit_1',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: 'First Position',
    description: 'Master C, D, and E in the treble clef',
    order: 1,
    theme: 'The Beginning',
    icon: '🌱',
    reward: {
      type: 'accessory',
      id: 'sprout_badge',
      name: 'Music Sprout Badge'
    }
  },
  TREBLE_2: {
    id: 'treble_unit_2',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: 'Five Finger Position',
    description: 'Extend your range from C to G',
    order: 2,
    theme: 'Growing Stronger',
    icon: '🌿',
    reward: {
      type: 'accessory',
      id: 'five_finger_badge',
      name: 'Five Finger Badge'
    }
  },
  TREBLE_3: {
    id: 'treble_unit_3',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: 'Full Octave',
    description: 'Complete the journey from C to C',
    order: 3,
    theme: 'The Full Journey',
    icon: '🎵',
    reward: {
      type: 'accessory',
      id: 'octave_master_badge',
      name: 'Octave Master Badge'
    }
  },
  TREBLE_4: {
    id: 'treble_unit_4',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: 'Extended Range',
    description: 'Explore ledger lines above and below the staff',
    order: 4,
    theme: 'Beyond the Staff',
    icon: '⭐',
    reward: {
      type: 'accessory',
      id: 'ledger_explorer_badge',
      name: 'Ledger Explorer Badge'
    }
  },
  TREBLE_5: {
    id: 'treble_unit_5',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: 'Accidentals',
    description: 'Master sharps and flats',
    order: 5,
    theme: 'The Sharp World',
    icon: '🎼',
    reward: {
      type: 'accessory',
      id: 'accidental_master_badge',
      name: 'Accidental Master Badge'
    }
  },

  // ============================================
  // BASS CLEF UNITS
  // ============================================
  BASS_1: {
    id: 'bass_unit_1',
    category: NODE_CATEGORIES.BASS_CLEF,
    name: 'Middle C Position',
    description: 'Start with C, B, and A in bass clef',
    order: 1,
    theme: 'The Bass Beginning',
    icon: '🌱',
    reward: {
      type: 'accessory',
      id: 'bass_sprout_badge',
      name: 'Bass Sprout Badge'
    }
  },
  BASS_2: {
    id: 'bass_unit_2',
    category: NODE_CATEGORIES.BASS_CLEF,
    name: 'Five Finger Low',
    description: 'Extend downward from C to F',
    order: 2,
    theme: 'Going Lower',
    icon: '🌿',
    reward: {
      type: 'accessory',
      id: 'bass_five_finger_badge',
      name: 'Bass Five Finger Badge'
    }
  },
  BASS_3: {
    id: 'bass_unit_3',
    category: NODE_CATEGORIES.BASS_CLEF,
    name: 'Full Octave Down',
    description: 'Complete the octave from C to C below',
    order: 3,
    theme: 'The Deep Journey',
    icon: '🎵',
    reward: {
      type: 'accessory',
      id: 'bass_octave_badge',
      name: 'Bass Octave Badge'
    }
  },
  BASS_4: {
    id: 'bass_unit_4',
    category: NODE_CATEGORIES.BASS_CLEF,
    name: 'Extended Bass',
    description: 'Explore the full bass range with ledger lines',
    order: 4,
    theme: 'Deep Exploration',
    icon: '⭐',
    reward: {
      type: 'accessory',
      id: 'bass_explorer_badge',
      name: 'Bass Explorer Badge'
    }
  },
  BASS_5: {
    id: 'bass_unit_5',
    category: NODE_CATEGORIES.BASS_CLEF,
    name: 'Bass Accidentals',
    description: 'Master sharps and flats in bass clef',
    order: 5,
    theme: 'Bass Mastery',
    icon: '🎼',
    reward: {
      type: 'accessory',
      id: 'bass_accidental_badge',
      name: 'Bass Accidental Badge'
    }
  },

  // ============================================
  // RHYTHM UNITS
  // ============================================
  RHYTHM_1: {
    id: 'rhythm_unit_1',
    category: NODE_CATEGORIES.RHYTHM,
    name: 'Steady Beat',
    description: 'Learn to keep time with quarter and half notes',
    order: 1,
    theme: 'Finding the Pulse',
    icon: '🥁',
    reward: {
      type: 'accessory',
      id: 'steady_beat_badge',
      name: 'Steady Beat Badge'
    }
  },
  RHYTHM_2: {
    id: 'rhythm_unit_2',
    category: NODE_CATEGORIES.RHYTHM,
    name: 'Eighth Notes',
    description: 'Master faster rhythms with eighth notes',
    order: 2,
    theme: 'Quick Steps',
    icon: '⚡',
    reward: {
      type: 'accessory',
      id: 'eighth_note_badge',
      name: 'Eighth Note Badge'
    }
  },
  RHYTHM_3: {
    id: 'rhythm_unit_3',
    category: NODE_CATEGORIES.RHYTHM,
    name: 'Whole Notes & Rests',
    description: 'Learn to count longer notes and silences',
    order: 3,
    theme: 'Patience & Silence',
    icon: '🎶',
    reward: {
      type: 'accessory',
      id: 'rest_master_badge',
      name: 'Rest Master Badge'
    }
  },
  RHYTHM_4: {
    id: 'rhythm_unit_4',
    category: NODE_CATEGORIES.RHYTHM,
    name: 'Dotted & Syncopation',
    description: 'Master advanced rhythms and syncopated patterns',
    order: 4,
    theme: 'Rhythm Mastery',
    icon: '🎼',
    reward: {
      type: 'accessory',
      id: 'syncopation_badge',
      name: 'Syncopation Badge'
    }
  }
};

/**
 * Skill Trail Nodes
 * Each node contains:
 * - id: Unique identifier
 * - name: Display name
 * - description: What the student will learn
 * - category: Which path this belongs to
 * - order: Position in the path
 * - unit: Unit number (for grouping)
 * - unitName: Display name of the unit
 * - orderInUnit: Position within the unit
 * - prerequisites: Array of node IDs that must be completed (empty for start nodes)
 * - skills: Array of note names or rhythm patterns covered
 * - noteConfig: Configuration for note-based exercises (notePool, clef, etc.)
 * - rhythmConfig: Configuration for rhythm (tier, patterns, tempo)
 * - exercises: Array of exercise configurations
 * - xpReward: Base XP reward (multiplied by stars earned)
 * - accessoryUnlock: Optional accessory to unlock on completion (null if none)
 * - isBoss: Whether this is a boss battle node
 * - isReview: Whether this is a review node
 * - reviewsUnits: Array of unit numbers this node reviews
 */

// Import expanded nodes (generated programmatically)
import expandedNodes from './expandedNodes.js';

// v1.3: All nodes now come from expandedNodes (redesigned system)
export const SKILL_NODES = [
  ...expandedNodes
];

/**
 * Get nodes by category (excluding legacy)
 */
export const getNodesByCategory = (category) => {
  return SKILL_NODES.filter(node => node.category === category)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get node by ID
 */
export const getNodeById = (nodeId) => {
  return SKILL_NODES.find(node => node.id === nodeId);
};

/**
 * Get all boss nodes
 */
export const getBossNodes = () => {
  return SKILL_NODES.filter(node => node.isBoss)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get starting nodes (no prerequisites)
 */
export const getStartingNodes = () => {
  return SKILL_NODES.filter(node => node.prerequisites.length === 0);
};

/**
 * Check if a node is unlocked for a student based on completed nodes
 */
export const isNodeUnlocked = (nodeId, completedNodeIds) => {
  const node = getNodeById(nodeId);
  if (!node) return false;

  // Check if all prerequisites are completed
  return node.prerequisites.every(prereqId => completedNodeIds.includes(prereqId));
};

/**
 * Get all unlocked nodes for a student
 */
export const getUnlockedNodes = (completedNodeIds) => {
  return SKILL_NODES.filter(node => isNodeUnlocked(node.id, completedNodeIds));
};

/**
 * Get all skill nodes
 */
export const getAllNodes = () => {
  return SKILL_NODES;
};

/**
 * Get unit by ID
 */
export const getUnitById = (unitId) => {
  return Object.values(UNITS).find(unit => unit.id === unitId);
};

/**
 * Get units by category
 */
export const getUnitsByCategory = (category) => {
  return Object.values(UNITS)
    .filter(unit => unit.category === category)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get nodes in a unit
 */
export const getNodesInUnit = (unitNumber, category) => {
  return SKILL_NODES.filter(node =>
    node.unit === unitNumber &&
    (node.category === category || (node.isBoss && node.category === NODE_CATEGORIES.BOSS))
  ).sort((a, b) => a.orderInUnit - b.orderInUnit);
};

/**
 * Get current unit for a student based on progress
 */
export const getCurrentUnit = (completedNodeIds, category) => {
  const categoryNodes = SKILL_NODES.filter(node =>
    node.category === category && !node.isBoss
  );

  // Find the first incomplete node
  const nextNode = categoryNodes.find(node => !completedNodeIds.includes(node.id));

  if (!nextNode) {
    // All nodes complete, return last unit
    const lastNode = categoryNodes[categoryNodes.length - 1];
    return lastNode?.unit || 1;
  }

  return nextNode.unit || 1;
};

export default SKILL_NODES;
