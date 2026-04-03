/**
 * Skill Trail Node Definitions
 *
 * Each node represents a learnable skill unit in the piano learning journey.
 * Nodes are organized into parallel paths: Treble Clef, Bass Clef, and Rhythm.
 */

// Import and re-export constants from shared file
import { NODE_CATEGORIES, EXERCISE_TYPES } from "./constants.js";

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
    id: "treble_unit_1",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "First Position",
    description: "Master C, D, and E in the treble clef",
    order: 1,
    theme: "The Beginning",
    icon: "🌱",
    reward: {
      type: "accessory",
      id: "sprout_badge",
      name: "Music Sprout Badge",
    },
  },
  TREBLE_2: {
    id: "treble_unit_2",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "Five Finger Position",
    description: "Extend your range from C to G",
    order: 2,
    theme: "Growing Stronger",
    icon: "🌿",
    reward: {
      type: "accessory",
      id: "five_finger_badge",
      name: "Five Finger Badge",
    },
  },
  TREBLE_3: {
    id: "treble_unit_3",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "Full Octave",
    description: "Complete the journey from C to C",
    order: 3,
    theme: "The Full Journey",
    icon: "🎵",
    reward: {
      type: "accessory",
      id: "octave_master_badge",
      name: "Octave Master Badge",
    },
  },
  TREBLE_4: {
    id: "treble_unit_4",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "Extended Range",
    description: "Explore ledger lines above and below the staff",
    order: 4,
    theme: "Beyond the Staff",
    icon: "⭐",
    reward: {
      type: "accessory",
      id: "ledger_explorer_badge",
      name: "Ledger Explorer Badge",
    },
  },
  TREBLE_5: {
    id: "treble_unit_5",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "Accidentals",
    description: "Master sharps and flats",
    order: 5,
    theme: "The Sharp World",
    icon: "🎼",
    reward: {
      type: "accessory",
      id: "accidental_master_badge",
      name: "Accidental Master Badge",
    },
  },

  // ============================================
  // KEY SIGNATURE UNITS (TREBLE)
  // ============================================
  TREBLE_6: {
    id: "treble_unit_6",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "Key Signatures: Sharps",
    description: "Read music in G major and D major",
    order: 6,
    theme: "Sharp Keys",
    reward: {
      type: "accessory",
      id: "treble_keysig_sharps_badge",
      name: "Sharp Keys Badge",
    },
  },
  TREBLE_7: {
    id: "treble_unit_7",
    category: NODE_CATEGORIES.TREBLE_CLEF,
    name: "Key Signatures: Mixed",
    description: "Master all six major key signatures",
    order: 7,
    theme: "Key Mastery",
    reward: {
      type: "accessory",
      id: "treble_keysig_master_badge",
      name: "Key Signature Master Badge",
    },
  },

  // ============================================
  // BASS CLEF UNITS
  // ============================================
  BASS_1: {
    id: "bass_unit_1",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Middle C Position",
    description: "Start with C, B, and A in bass clef",
    order: 1,
    theme: "The Bass Beginning",
    icon: "🌱",
    reward: {
      type: "accessory",
      id: "bass_sprout_badge",
      name: "Bass Sprout Badge",
    },
  },
  BASS_2: {
    id: "bass_unit_2",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Five Finger Low",
    description: "Extend downward from C to F",
    order: 2,
    theme: "Going Lower",
    icon: "🌿",
    reward: {
      type: "accessory",
      id: "bass_five_finger_badge",
      name: "Bass Five Finger Badge",
    },
  },
  BASS_3: {
    id: "bass_unit_3",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Full Octave Down",
    description: "Complete the octave from C to C below",
    order: 3,
    theme: "The Deep Journey",
    icon: "🎵",
    reward: {
      type: "accessory",
      id: "bass_octave_badge",
      name: "Bass Octave Badge",
    },
  },
  BASS_4: {
    id: "bass_unit_4",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Extended Bass",
    description: "Explore the full bass range with ledger lines",
    order: 4,
    theme: "Deep Exploration",
    icon: "⭐",
    reward: {
      type: "accessory",
      id: "bass_explorer_badge",
      name: "Bass Explorer Badge",
    },
  },
  BASS_5: {
    id: "bass_unit_5",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Bass Accidentals",
    description: "Master sharps and flats in bass clef",
    order: 5,
    theme: "Bass Mastery",
    icon: "🎼",
    reward: {
      type: "accessory",
      id: "bass_accidental_badge",
      name: "Bass Accidental Badge",
    },
  },

  // ============================================
  // KEY SIGNATURE UNITS (BASS)
  // ============================================
  BASS_6: {
    id: "bass_unit_6",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Key Signatures: Sharps",
    description: "Read bass clef music in G major and D major",
    order: 6,
    theme: "Bass Sharp Keys",
    reward: {
      type: "accessory",
      id: "bass_keysig_sharps_badge",
      name: "Bass Sharp Keys Badge",
    },
  },
  BASS_7: {
    id: "bass_unit_7",
    category: NODE_CATEGORIES.BASS_CLEF,
    name: "Key Signatures: Mixed",
    description: "Master all six major key signatures in bass clef",
    order: 7,
    theme: "Bass Key Mastery",
    reward: {
      type: "accessory",
      id: "bass_keysig_master_badge",
      name: "Bass Key Signature Master Badge",
    },
  },

  // ============================================
  // RHYTHM UNITS
  // ============================================
  RHYTHM_1: {
    id: "rhythm_unit_1",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Steady Beat",
    description: "Learn to keep time with quarter and half notes",
    order: 1,
    theme: "Finding the Pulse",
    icon: "🥁",
    reward: {
      type: "accessory",
      id: "steady_beat_badge",
      name: "Steady Beat Badge",
    },
  },
  RHYTHM_2: {
    id: "rhythm_unit_2",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Eighth Notes",
    description: "Master faster rhythms with eighth notes",
    order: 2,
    theme: "Quick Steps",
    icon: "⚡",
    reward: {
      type: "accessory",
      id: "eighth_note_badge",
      name: "Eighth Note Badge",
    },
  },
  RHYTHM_3: {
    id: "rhythm_unit_3",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Whole Notes & Rests",
    description: "Learn to count longer notes and silences",
    order: 3,
    theme: "Patience & Silence",
    icon: "🎶",
    reward: {
      type: "accessory",
      id: "rest_master_badge",
      name: "Rest Master Badge",
    },
  },
  RHYTHM_4: {
    id: "rhythm_unit_4",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Dotted & Syncopation",
    description: "Master advanced rhythms and syncopated patterns",
    order: 4,
    theme: "Rhythm Mastery",
    icon: "🎼",
    reward: {
      type: "accessory",
      id: "syncopation_badge",
      name: "Syncopation Badge",
    },
  },
  RHYTHM_5: {
    id: "rhythm_unit_5",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Magic Dots",
    description: "Dotted notes and 3/4 time",
    order: 5,
    theme: "The Power of the Dot",
    reward: {
      type: "accessory",
      id: "rhythm_badge_5",
      name: "Rhythm Badge V",
    },
  },
  RHYTHM_6: {
    id: "rhythm_unit_6",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Speed Champions",
    description: "Master sixteenth notes — the fastest duration",
    order: 6,
    theme: "Speed Mastery",
    reward: {
      type: "accessory",
      id: "rhythm_champion_badge",
      name: "Rhythm Champion Badge",
    },
  },
  RHYTHM_7: {
    id: "rhythm_unit_7",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Six-Eight Time",
    description: "Feel two big beats — each worth three eighth notes",
    order: 7,
    theme: "Compound Meter",
    reward: {
      type: "accessory",
      id: "compound_badge",
      name: "Compound Meter Badge",
    },
  },
  RHYTHM_8: {
    id: "rhythm_unit_8",
    category: NODE_CATEGORIES.RHYTHM,
    name: "Off-Beat Magic",
    description: "Master syncopation and off-beat patterns",
    order: 8,
    theme: "Syncopation",
    reward: {
      type: "accessory",
      id: "advanced_rhythm_badge",
      name: "Advanced Rhythm Badge",
    },
  },

  // ============================================
  // EAR TRAINING UNITS
  // ============================================
  EAR_1: {
    id: "ear_unit_1",
    category: NODE_CATEGORIES.EAR_TRAINING,
    name: "Sound Direction",
    description: "Learn to tell which note is higher or lower",
    order: 1,
    theme: "Direction Before Distance",
    icon: "👂",
    reward: {
      type: "accessory",
      id: "ear_sprout_badge",
      name: "Ear Sprout Badge",
    },
  },
  EAR_2: {
    id: "ear_unit_2",
    category: NODE_CATEGORIES.EAR_TRAINING,
    name: "Interval Explorer",
    description: "Identify steps, skips, and leaps between notes",
    order: 2,
    theme: "Measuring the Distance",
    icon: "🎵",
    reward: {
      type: "accessory",
      id: "interval_master_badge",
      name: "Interval Master Badge",
    },
  },
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
import expandedNodes from "./expandedNodes.js";

// v1.3: All nodes now come from expandedNodes (redesigned system)
export const SKILL_NODES = [...expandedNodes];

/**
 * Get nodes by category (excluding legacy)
 */
export const getNodesByCategory = (category) => {
  return SKILL_NODES.filter((node) => node.category === category).sort(
    (a, b) => a.order - b.order
  );
};

/**
 * Get node by ID
 */
export const getNodeById = (nodeId) => {
  return SKILL_NODES.find((node) => node.id === nodeId);
};

/**
 * Map node category to trail tab query-param value.
 * Boss nodes use their ID prefix to determine the parent trail.
 */
const CATEGORY_TO_TRAIL_TAB = {
  treble_clef: "treble",
  bass_clef: "bass",
  rhythm: "rhythm",
  ear_training: "ear_training",
};

export const getTrailTabForNode = (nodeId) => {
  if (!nodeId) return null;
  const node = getNodeById(nodeId);
  if (!node) return null;
  if (node.category === "boss") {
    if (nodeId.startsWith("boss_treble")) return "treble";
    if (nodeId.startsWith("boss_bass")) return "bass";
    if (nodeId.startsWith("boss_rhythm")) return "rhythm";
    if (nodeId.startsWith("boss_ear")) return "ear_training";
    return null;
  }
  return CATEGORY_TO_TRAIL_TAB[node.category] || null;
};

/**
 * Returns the next node in the same category with a higher order.
 * Used by auto-grow to find pedagogically-appropriate next notes.
 */
export const getNextNodeInCategory = (nodeId) => {
  const currentNode = getNodeById(nodeId);
  if (!currentNode) return null;

  return (
    SKILL_NODES.filter(
      (n) =>
        n.category === currentNode.category &&
        n.order > currentNode.order &&
        !n.isBoss
    ).sort((a, b) => a.order - b.order)[0] || null
  );
};

/**
 * Get all boss nodes
 */
export const getBossNodes = () => {
  return SKILL_NODES.filter((node) => node.isBoss).sort(
    (a, b) => a.order - b.order
  );
};

/**
 * Get starting nodes (no prerequisites)
 */
export const getStartingNodes = () => {
  return SKILL_NODES.filter((node) => node.prerequisites.length === 0);
};

/**
 * Check if a node is unlocked for a student based on completed nodes
 */
export const isNodeUnlocked = (nodeId, completedNodeIds) => {
  const node = getNodeById(nodeId);
  if (!node) return false;

  // Check if all prerequisites are completed
  return node.prerequisites.every((prereqId) =>
    completedNodeIds.includes(prereqId)
  );
};

/**
 * Get all unlocked nodes for a student
 */
export const getUnlockedNodes = (completedNodeIds) => {
  return SKILL_NODES.filter((node) =>
    isNodeUnlocked(node.id, completedNodeIds)
  );
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
  return Object.values(UNITS).find((unit) => unit.id === unitId);
};

/**
 * Get units by category
 */
export const getUnitsByCategory = (category) => {
  return Object.values(UNITS)
    .filter((unit) => unit.category === category)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get nodes in a unit
 */
export const getNodesInUnit = (unitNumber, category) => {
  return SKILL_NODES.filter(
    (node) =>
      node.unit === unitNumber &&
      (node.category === category ||
        (node.isBoss && node.category === NODE_CATEGORIES.BOSS))
  ).sort((a, b) => a.orderInUnit - b.orderInUnit);
};

/**
 * Get current unit for a student based on progress
 */
export const getCurrentUnit = (completedNodeIds, category) => {
  const categoryNodes = SKILL_NODES.filter(
    (node) => node.category === category && !node.isBoss
  );

  // Find the first incomplete node
  const nextNode = categoryNodes.find(
    (node) => !completedNodeIds.includes(node.id)
  );

  if (!nextNode) {
    // All nodes complete, return last unit
    const lastNode = categoryNodes[categoryNodes.length - 1];
    return lastNode?.unit || 1;
  }

  return nextNode.unit || 1;
};

export default SKILL_NODES;
