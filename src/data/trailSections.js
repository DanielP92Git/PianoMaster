/**
 * Trail Sections - Organizational Structure for Learning Phases
 *
 * Sections provide clear milestone moments and structure the learning journey.
 * Each section has a specific focus and unlocks new capabilities.
 */

import { NODE_CATEGORIES } from './constants.js';

/**
 * Trail section definitions
 * Sections group units into meaningful learning phases
 */
export const TRAIL_SECTIONS = [
  // ============================================
  // TREBLE CLEF SECTIONS
  // ============================================
  {
    id: 'section_treble_learning_keys',
    name: 'Learning the Keys',
    description: 'Master all treble clef notes C4-C5',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    units: [1, 2, 3],
    unlocks: 'eighth_notes',
    icon: '📚',
    color: 'blue',
    order: 1
  },
  {
    id: 'section_treble_speed_rhythm',
    name: 'Speed & Rhythm',
    description: 'Add speed with eighth notes',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    units: [4],
    requires: 'section_treble_learning_keys',
    icon: '⚡',
    color: 'orange',
    order: 2
  },
  {
    id: 'section_treble_extended_range',
    name: 'Extended Range',
    description: 'Explore ledger lines and wider range',
    category: NODE_CATEGORIES.TREBLE_CLEF,
    units: [5],
    requires: 'section_treble_speed_rhythm',
    icon: '⭐',
    color: 'purple',
    order: 3
  },

  // ============================================
  // BASS CLEF SECTIONS
  // ============================================
  {
    id: 'section_bass_learning_keys',
    name: 'Learning the Bass Keys',
    description: 'Master bass clef notes',
    category: NODE_CATEGORIES.BASS_CLEF,
    units: [1, 2, 3],
    unlocks: 'bass_eighth_notes',
    icon: '📚',
    color: 'green',
    order: 1
  },
  {
    id: 'section_bass_speed_rhythm',
    name: 'Bass Speed & Rhythm',
    description: 'Add speed to bass clef reading',
    category: NODE_CATEGORIES.BASS_CLEF,
    units: [4],
    requires: 'section_bass_learning_keys',
    icon: '⚡',
    color: 'teal',
    order: 2
  },

  // ============================================
  // RHYTHM SECTIONS
  // ============================================
  {
    id: 'section_rhythm_basics',
    name: 'Rhythm Basics',
    description: 'Master fundamental rhythms',
    category: NODE_CATEGORIES.RHYTHM,
    units: [1, 2],
    icon: '🥁',
    color: 'amber',
    order: 1
  },
  {
    id: 'section_rhythm_advanced',
    name: 'Advanced Rhythms',
    description: 'Complex patterns and syncopation',
    category: NODE_CATEGORIES.RHYTHM,
    units: [3, 4],
    requires: 'section_rhythm_basics',
    icon: '🎵',
    color: 'yellow',
    order: 2
  }
];

/**
 * Get section by ID
 * @param {string} sectionId - Section identifier
 * @returns {Object|null} Section object or null
 */
export function getSectionById(sectionId) {
  return TRAIL_SECTIONS.find(section => section.id === sectionId) || null;
}

/**
 * Get sections by category
 * @param {string} category - Category from NODE_CATEGORIES
 * @returns {Array} Array of sections
 */
export function getSectionsByCategory(category) {
  return TRAIL_SECTIONS
    .filter(section => section.category === category)
    .sort((a, b) => a.order - b.order);
}

/**
 * Check if a section is completed
 * @param {string} sectionId - Section identifier
 * @param {Array} completedNodeIds - Array of completed node IDs
 * @returns {boolean} True if all units in section are complete
 */
export function isSectionComplete(sectionId, completedNodeIds) {
  const section = getSectionById(sectionId);
  if (!section) return false;

  // Section is complete if all its units' boss nodes are completed
  return section.units.every(unitNumber => {
    const prefix = section.category.split('_')[0]; // treble_clef -> treble
    const bossNodeId = `boss_${prefix}_${unitNumber}`;
    return completedNodeIds.includes(bossNodeId);
  });
}

/**
 * Get the unlock event for completing a section
 * @param {string} sectionId - Section identifier
 * @returns {Object|null} Unlock event configuration or null
 */
export function getSectionUnlock(sectionId) {
  const section = getSectionById(sectionId);
  if (!section || !section.unlocks) return null;

  // Define unlock events
  const unlockEvents = {
    'eighth_notes': {
      id: 'eighth_notes',
      title: '🎵 NEW SKILL UNLOCKED! 🎵',
      subtitle: '♪ ♪  EIGHTH NOTES  ♪ ♪',
      description: "You've mastered the notes from C to C. Now let's speed things up!",
      nextSection: 'section_treble_speed_rhythm',
      badge: 'speed_demon_preview',
      icon: '⚡'
    },
    'bass_eighth_notes': {
      id: 'bass_eighth_notes',
      title: '🎵 NEW SKILL UNLOCKED! 🎵',
      subtitle: '♪ ♪  BASS EIGHTH NOTES  ♪ ♪',
      description: "You've mastered the bass notes. Time to add some speed!",
      nextSection: 'section_bass_speed_rhythm',
      badge: 'bass_speed_demon',
      icon: '⚡'
    }
  };

  return unlockEvents[section.unlocks] || null;
}

/**
 * Get current section for a student based on progress
 * @param {Array} completedNodeIds - Array of completed node IDs
 * @param {string} category - Category from NODE_CATEGORIES
 * @returns {Object|null} Current section or null
 */
export function getCurrentSection(completedNodeIds, category) {
  const sections = getSectionsByCategory(category);

  // Find the first incomplete section
  for (const section of sections) {
    if (!isSectionComplete(section.id, completedNodeIds)) {
      return section;
    }
  }

  // All sections complete, return last section
  return sections[sections.length - 1] || null;
}
