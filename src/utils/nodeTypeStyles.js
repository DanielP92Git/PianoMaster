/**
 * Node Type Styles Utility
 *
 * Centralized style system for trail nodes:
 * - Icon mapping (category + node type → React component)
 * - Category color palettes (accessible, child-friendly)
 * - State-based styling (locked, available, current, completed, mastered)
 */

import { Search, Gamepad2, Zap, RotateCcw, Dumbbell, Crown, Trophy } from 'lucide-react';
import TrebleClefIcon from '../components/trail/icons/TrebleClefIcon';
import BassClefIcon from '../components/trail/icons/BassClefIcon';
import MetronomeIcon from '../components/trail/icons/MetronomeIcon';
import { NODE_TYPES } from '../data/nodeTypes';
import { NODE_CATEGORIES } from '../data/constants';

/**
 * Get the icon component for a node based on type and category
 *
 * Priority order (first match wins):
 * 1. Boss nodes → Trophy (regardless of category)
 * 2. Mini-boss nodes → Crown (regardless of category)
 * 3. Category-specific icons → Treble/Bass/Metronome clef
 * 4. Node type icons → Activity-based icons
 *
 * @param {string} nodeType - Node type from NODE_TYPES
 * @param {string} category - Node category from NODE_CATEGORIES
 * @returns {React.Component} Icon component
 */
export const getNodeTypeIcon = (nodeType, category) => {
  // Boss nodes always get special icons (overrides category)
  if (nodeType === NODE_TYPES.BOSS) return Trophy;
  if (nodeType === NODE_TYPES.MINI_BOSS) return Crown;

  // Category-specific musical notation icons
  if (category === NODE_CATEGORIES.TREBLE_CLEF) return TrebleClefIcon;
  if (category === NODE_CATEGORIES.BASS_CLEF) return BassClefIcon;
  if (category === NODE_CATEGORIES.RHYTHM) return MetronomeIcon;

  // Fallback to node type icons for non-category-specific nodes
  const iconMap = {
    [NODE_TYPES.DISCOVERY]: Search,
    [NODE_TYPES.MIX_UP]: Gamepad2,
    [NODE_TYPES.SPEED_ROUND]: Zap,
    [NODE_TYPES.REVIEW]: RotateCcw,
    [NODE_TYPES.CHALLENGE]: Dumbbell,
  };

  return iconMap[nodeType] || Search;
};

/**
 * Get color classes for a node based on category and state
 *
 * State hierarchy (priority order):
 * 1. Locked → Gray (overrides all colors)
 * 2. Boss → Gold gradient (special treatment)
 * 3. Category colors → Blue/Purple/Green
 *
 * Colors chosen for:
 * - Accessible contrast (WCAG 2.1)
 * - Colorblind safety (maximally distinguishable hues)
 * - Child-friendly (bright but not overwhelming)
 *
 * @param {string} category - Node category from NODE_CATEGORIES
 * @param {string} state - Node state: 'locked' | 'available' | 'current' | 'completed' | 'mastered'
 * @returns {Object} { bg, border, text, icon, glow } - Tailwind class strings
 */
export const getCategoryColors = (category, state) => {
  // Locked state overrides everything - clear visual language that node is unavailable
  if (state === 'locked') {
    return {
      bg: 'bg-gray-700',
      border: 'border-gray-600',
      text: 'text-gray-500',
      icon: 'opacity-40',
      glow: ''
    };
  }

  // Boss nodes get gold treatment (distinct from regular categories)
  if (category === NODE_CATEGORIES.BOSS) {
    return {
      bg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      border: 'border-yellow-400',
      text: 'text-amber-900',
      icon: 'opacity-100',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]'
    };
  }

  // Category-specific colors (chosen for colorblind accessibility)
  // Blue, purple, green are maximally distinguishable in all colorblindness types
  const colorMap = {
    [NODE_CATEGORIES.TREBLE_CLEF]: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      border: 'border-blue-400',
      text: 'text-white',
      icon: 'opacity-100',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]'
    },
    [NODE_CATEGORIES.BASS_CLEF]: {
      bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      border: 'border-purple-400',
      text: 'text-white',
      icon: 'opacity-100',
      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]'
    },
    [NODE_CATEGORIES.RHYTHM]: {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      border: 'border-emerald-400',
      text: 'text-white',
      icon: 'opacity-100',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]'
    }
  };

  // Fallback to treble clef colors if category unknown
  return colorMap[category] || colorMap[NODE_CATEGORIES.TREBLE_CLEF];
};

/**
 * Get complete node state configuration
 *
 * Convenience function combining icon, colors, and state-specific styling.
 *
 * @param {string} nodeType - Node type from NODE_TYPES
 * @param {string} category - Node category from NODE_CATEGORIES
 * @param {string} state - Node state: 'locked' | 'available' | 'current' | 'completed' | 'mastered'
 * @param {boolean} isBoss - Whether this is a boss node
 * @returns {Object} { IconComponent, colors, sizeClass, pulseClass, crownVisible }
 */
export const getNodeStateConfig = (nodeType, category, state, isBoss = false) => {
  const IconComponent = getNodeTypeIcon(nodeType, category);
  const colors = getCategoryColors(isBoss ? NODE_CATEGORIES.BOSS : category, state);

  return {
    IconComponent,
    colors,
    sizeClass: isBoss ? 'h-14 w-14' : 'h-12 w-12', // Boss nodes 15% larger
    pulseClass: (state === 'current' || state === 'available') ? 'animate-pulse-subtle' : '',
    crownVisible: isBoss && state !== 'locked'
  };
};
