/**
 * Celebration Messages
 *
 * Provides node-type-specific celebration messages for the trail system.
 * Uses hardcoded English strings (not i18n) per research findings for celebration immediacy.
 *
 * For 8-year-old learners, messages are:
 * - ALL CAPS for 3-star achievements (excitement!)
 * - Title case for 1-2 stars (positive but measured)
 * - Encouraging even at 0 stars (growth mindset)
 */

import { NODE_TYPES } from '../data/nodeTypes.js';

/**
 * Gets celebration message based on node type and performance
 *
 * @param {string|null} nodeType - Node type from NODE_TYPES (or null for free play)
 * @param {number} stars - Star rating earned (0-3)
 * @param {boolean} isBoss - Whether this is a boss node
 * @returns {Object} Message object with title and subtitle
 */
export function getCelebrationMessage(nodeType, stars, isBoss) {
  // Boss override: Special message for boss victories
  if (isBoss && stars >= 1) {
    return {
      title: stars === 3 ? 'PERFECT VICTORY!' : 'BOSS DEFEATED!',
      subtitle: 'You conquered the challenge!'
    };
  }

  // 3-star messages: Node-type-specific excitement
  if (stars === 3) {
    const perfectMessages = {
      [NODE_TYPES.DISCOVERY]: {
        title: 'NEW NOTES MASTERED!',
        subtitle: "You learned something new!"
      },
      [NODE_TYPES.PRACTICE]: {
        title: 'PRACTICE PERFECT!',
        subtitle: "You're getting really good!"
      },
      [NODE_TYPES.MIX_UP]: {
        title: 'GAME CHAMPION!',
        subtitle: 'You aced the memory game!'
      },
      [NODE_TYPES.SPEED_ROUND]: {
        title: 'LIGHTNING FAST!',
        subtitle: 'Wow, you beat the clock!'
      },
      [NODE_TYPES.REVIEW]: {
        title: 'YOU REMEMBERED!',
        subtitle: 'Those notes stuck with you!'
      },
      [NODE_TYPES.CHALLENGE]: {
        title: 'CHALLENGE CRUSHED!',
        subtitle: 'That was a tough one!'
      },
      [NODE_TYPES.MINI_BOSS]: {
        title: 'MINI-BOSS DOWN!',
        subtitle: 'Unit checkpoint completed!'
      }
    };

    // Return node-specific message or generic fallback
    return perfectMessages[nodeType] || {
      title: 'PERFECT!',
      subtitle: 'You got every single one!'
    };
  }

  // 2-star messages: Great performance
  if (stars === 2) {
    return {
      title: 'Great Job!',
      subtitle: 'You did really well!'
    };
  }

  // 1-star messages: Encouraging
  if (stars === 1) {
    return {
      title: 'Good Try!',
      subtitle: 'Keep practicing!'
    };
  }

  // 0-star messages: Growth mindset
  return {
    title: 'Nice Effort!',
    subtitle: 'Try again to earn stars!'
  };
}
