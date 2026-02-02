/**
 * Trail System Constants
 *
 * Shared constants used across the trail system.
 * This file has no dependencies to avoid circular import issues.
 */

/**
 * Node categories for organization
 */
export const NODE_CATEGORIES = {
  TREBLE_CLEF: 'treble_clef',
  BASS_CLEF: 'bass_clef',
  RHYTHM: 'rhythm',
  BOSS: 'boss'
};

/**
 * Exercise types that can be used in nodes
 */
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: 'note_recognition',
  SIGHT_READING: 'sight_reading',
  RHYTHM: 'rhythm',
  MEMORY_GAME: 'memory_game',
  BOSS_CHALLENGE: 'boss_challenge'
};
