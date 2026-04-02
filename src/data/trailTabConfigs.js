/**
 * Trail Tab Configurations
 *
 * UI-specific tab configs for the TrailMap tab bar.
 * Separated from constants.js because this file imports React components
 * (SVG icons, lucide-react) which cannot be resolved by Node.js scripts.
 *
 * Adding a new tab = one new array entry here, zero code changes elsewhere (D-09).
 */

import { Drum, Ear } from "lucide-react";
import TrebleClefTab from "../components/trail/icons/treble-clef-tab.svg?react";
import BassClefTab from "../components/trail/icons/bass-clef-tab.svg?react";

/**
 * Each entry describes one tab in the TrailMap tab bar.
 * Tab order is determined by array position (D-11).
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
