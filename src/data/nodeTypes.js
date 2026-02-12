/**
 * Node Types - Variety-Driven Learning System
 *
 * Each node type provides a distinct learning experience and psychological effect.
 * Following educational psychology principles for 8-year-old learners.
 */

/**
 * Node type classifications for the redesigned trail
 */
export const NODE_TYPES = {
  DISCOVERY: 'discovery',           // Introduce 1-2 new notes
  PRACTICE: 'practice',             // Drill recent notes
  MIX_UP: 'mix_up',                 // New game type (Memory Game)
  SPEED_ROUND: 'speed_round',       // Timed recognition challenge
  REVIEW: 'review',                 // Spaced repetition of previous units
  CHALLENGE: 'challenge',           // Increased difficulty
  MINI_BOSS: 'mini_boss',           // Unit checkpoint
  BOSS: 'boss'                      // Major milestone
};

/**
 * Node type metadata
 * Defines the psychological purpose, duration, and visual styling for each type
 */
export const NODE_TYPE_METADATA = {
  [NODE_TYPES.DISCOVERY]: {
    icon: '🔍',
    color: 'blue',
    label: 'Learn',
    duration: '3-4 min',
    purpose: 'Introduce new notes',
    childThinks: 'Ooh, something NEW!'
  },
  [NODE_TYPES.PRACTICE]: {
    icon: '🎹',
    color: 'green',
    label: 'Play',
    duration: '3-5 min',
    purpose: 'Drill recent notes',
    childThinks: "I'm getting better!"
  },
  [NODE_TYPES.MIX_UP]: {
    icon: '🎮',
    color: 'purple',
    label: 'Game',
    duration: '4-5 min',
    purpose: 'Fun game variation',
    childThinks: 'This is FUN!'
  },
  [NODE_TYPES.SPEED_ROUND]: {
    icon: '⚡',
    color: 'orange',
    label: 'Speed',
    duration: '2-3 min',
    purpose: 'Timed challenge',
    childThinks: 'Can I beat the clock?'
  },
  [NODE_TYPES.REVIEW]: {
    icon: '🔁',
    color: 'gray',
    label: 'Review',
    duration: '3-4 min',
    purpose: 'Spaced repetition',
    childThinks: 'I still remember!'
  },
  [NODE_TYPES.CHALLENGE]: {
    icon: '💪',
    color: 'amber',
    label: 'Challenge',
    duration: '4-5 min',
    purpose: 'Increased difficulty',
    childThinks: 'Harder... but I can do it!'
  },
  [NODE_TYPES.MINI_BOSS]: {
    icon: '👑',
    color: 'yellow',
    label: 'Mini-Boss',
    duration: '5-6 min',
    purpose: 'Unit checkpoint',
    childThinks: "I've learned SO MUCH!"
  },
  [NODE_TYPES.BOSS]: {
    icon: '🏆',
    color: 'red',
    label: 'Boss',
    duration: '6-8 min',
    purpose: 'Major milestone',
    childThinks: 'EPIC CHALLENGE!'
  }
};

/**
 * Rhythm complexity levels
 * Based on educational psychology - rhythm complexity is a reward for note mastery
 */
export const RHYTHM_COMPLEXITY = {
  SIMPLE: 'simple',       // Quarters only - for learning new notes
  MEDIUM: 'medium',       // Quarters + Halves - reward for mastery
  VARIED: 'varied',       // Quarters + Eighths - for challenges
  ALL: 'all'              // All rhythms - for boss nodes
};

/**
 * What's new content types
 * Used to highlight the new element in each node
 */
export const NEW_CONTENT_TYPES = {
  NOTE: 'note',
  RHYTHM: 'rhythm',
  EXERCISE_TYPE: 'exercise_type',
  CHALLENGE_TYPE: 'challenge_type',
  NONE: 'none'
};

/**
 * Get node type visual style
 * @param {string} nodeType - Node type from NODE_TYPES
 * @returns {Object} Style configuration
 */
export function getNodeTypeStyle(nodeType) {
  return NODE_TYPE_METADATA[nodeType] || NODE_TYPE_METADATA[NODE_TYPES.PRACTICE];
}

/**
 * Get node type icon
 * @param {string} nodeType - Node type from NODE_TYPES
 * @returns {string} Icon emoji
 */
export function getNodeTypeIcon(nodeType) {
  return NODE_TYPE_METADATA[nodeType]?.icon || '🎹';
}

/**
 * Get node type color class
 * @param {string} nodeType - Node type from NODE_TYPES
 * @returns {string} Tailwind color name
 */
export function getNodeTypeColor(nodeType) {
  return NODE_TYPE_METADATA[nodeType]?.color || 'green';
}
