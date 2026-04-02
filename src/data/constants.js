/**
 * Trail System Constants
 *
 * Shared constants used across the trail system.
 * This file has no dependencies on other src/ modules to avoid circular imports.
 */

// lucide-react is an external npm package — safe to import here.
// The "no dependencies" rule applies to src/ modules to prevent circular imports.
import { Drum, Ear } from "lucide-react";

// SVG imports via ?react are static assets (no circular dependency risk).
import TrebleClefTab from "../components/trail/icons/treble-clef-tab.svg?react";
import BassClefTab from "../components/trail/icons/bass-clef-tab.svg?react";

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
};

/**
 * Trail tab configuration array (D-09, D-10, D-11).
 *
 * Each entry describes one tab in the TrailMap tab bar.
 * Tab order is determined by array position (D-11).
 * Adding a new tab = one new array entry, zero code changes elsewhere (D-09).
 *
 * Fields:
 *   id          - URL-safe tab identifier
 *   label       - Display label (English; i18n key is tabs.<id>)
 *   categoryKey - Key into NODE_CATEGORIES for filtering nodes
 *   icon        - Lucide icon component reference
 *   colorActive   - Tailwind classes for active tab background
 *   colorInactive - Tailwind classes for inactive tab background (muted)
 *   colorBorder   - Tailwind classes for active tab border
 *   colorGlow     - Tailwind box-shadow classes for active tab glow
 *   bossPrefix  - Prefix string for boss node ID matching
 */
export const TRAIL_TAB_CONFIGS = [
  {
    id: "treble",
    label: "Treble",
    categoryKey: "TREBLE_CLEF",
    icon: TrebleClefTab,
    colorActive: "bg-gradient-to-br from-amber-400 to-orange-500",
    colorInactive: "bg-gradient-to-br from-amber-400/40 to-orange-500/40",
    colorBorder: "border-amber-300",
    colorGlow: "shadow-[0_0_15px_rgba(251,191,36,0.5)]",
    bossPrefix: "boss_treble",
  },
  {
    id: "bass",
    label: "Bass",
    categoryKey: "BASS_CLEF",
    icon: BassClefTab,
    colorActive: "bg-gradient-to-br from-blue-400 to-blue-600",
    colorInactive: "bg-gradient-to-br from-blue-400/40 to-blue-600/40",
    colorBorder: "border-blue-300",
    colorGlow: "shadow-[0_0_15px_rgba(96,165,250,0.5)]",
    bossPrefix: "boss_bass",
  },
  {
    id: "rhythm",
    label: "Rhythm",
    categoryKey: "RHYTHM",
    icon: Drum,
    colorActive: "bg-gradient-to-br from-emerald-400 to-green-600",
    colorInactive: "bg-gradient-to-br from-emerald-400/40 to-green-600/40",
    colorBorder: "border-emerald-300",
    colorGlow: "shadow-[0_0_15px_rgba(52,211,153,0.5)]",
    bossPrefix: "boss_rhythm",
  },
  {
    id: "ear_training",
    label: "Ear Training",
    categoryKey: "EAR_TRAINING",
    icon: Ear,
    colorActive: "bg-gradient-to-br from-purple-400 to-violet-600",
    colorInactive: "bg-gradient-to-br from-purple-400/40 to-violet-600/40",
    colorBorder: "border-purple-300",
    colorGlow: "shadow-[0_0_15px_rgba(192,132,252,0.5)]",
    bossPrefix: "boss_ear",
  },
];
