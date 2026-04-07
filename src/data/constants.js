/**
 * Trail System Constants
 *
 * Shared constants used across the trail system.
 * This file has no dependencies on other src/ modules to avoid circular imports.
 *
 * IMPORTANT: Keep this file free of Vite-specific imports (e.g. .svg?react,
 * React components) — it is imported by the Node.js prebuild validator
 * (scripts/validateTrail.mjs). UI-specific configs live in trailTabConfigs.js.
 */

/**
 * Node categories for organization
 */
export const NODE_CATEGORIES = {
  TREBLE_CLEF: "treble_clef",
  BASS_CLEF: "bass_clef",
  RHYTHM: "rhythm",
  BOSS: "boss",
  EAR_TRAINING: "ear_training",
};

/**
 * Exercise types that can be used in nodes
 */
export const EXERCISE_TYPES = {
  NOTE_RECOGNITION: "note_recognition",
  SIGHT_READING: "sight_reading",
  RHYTHM: "rhythm",
  MEMORY_GAME: "memory_game",
  BOSS_CHALLENGE: "boss_challenge",
  NOTE_CATCH: "note_catch",
  // v2.9 new game types
  RHYTHM_TAP: "rhythm_tap",
  RHYTHM_DICTATION: "rhythm_dictation",
  ARCADE_RHYTHM: "arcade_rhythm",
  PITCH_COMPARISON: "pitch_comparison",
  INTERVAL_ID: "interval_id",
  // v3.2 new game types
  RHYTHM_PULSE: "rhythm_pulse",
};
