/**
 * Celebration Messages
 *
 * Provides node-type-specific celebration messages for the trail system.
 * Uses i18n translation keys for multilingual support.
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
 * @param {Function} [t] - i18next translation function. If provided, returns translated strings.
 * @returns {Object} Message object with title and subtitle
 */
export function getCelebrationMessage(nodeType, stars, isBoss, t) {
  // Boss override: Special message for boss victories
  if (isBoss && stars >= 1) {
    if (t) {
      return {
        title: stars === 3 ? t('celebration.boss.perfectVictory') : t('celebration.boss.defeated'),
        subtitle: t('celebration.boss.subtitle')
      };
    }
    return {
      title: stars === 3 ? 'PERFECT VICTORY!' : 'BOSS DEFEATED!',
      subtitle: 'You conquered the challenge!'
    };
  }

  // 3-star messages: Node-type-specific excitement
  if (stars === 3) {
    if (t) {
      const typeKey = nodeType || 'default';
      const keyMap = {
        [NODE_TYPES.DISCOVERY]: 'discovery',
        [NODE_TYPES.PRACTICE]: 'practice',
        [NODE_TYPES.MIX_UP]: 'mix_up',
        [NODE_TYPES.SPEED_ROUND]: 'speed_round',
        [NODE_TYPES.REVIEW]: 'review',
        [NODE_TYPES.CHALLENGE]: 'challenge',
        [NODE_TYPES.MINI_BOSS]: 'mini_boss'
      };
      const key = keyMap[typeKey] || 'default';
      return {
        title: t(`celebration.threeStars.${key}.title`),
        subtitle: t(`celebration.threeStars.${key}.subtitle`)
      };
    }

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

    return perfectMessages[nodeType] || {
      title: 'PERFECT!',
      subtitle: 'You got every single one!'
    };
  }

  // 2-star messages
  if (stars === 2) {
    if (t) {
      return {
        title: t('celebration.twoStars.title'),
        subtitle: t('celebration.twoStars.subtitle')
      };
    }
    return {
      title: 'Great Job!',
      subtitle: 'You did really well!'
    };
  }

  // 1-star messages
  if (stars === 1) {
    if (t) {
      return {
        title: t('celebration.oneStar.title'),
        subtitle: t('celebration.oneStar.subtitle')
      };
    }
    return {
      title: 'Good Try!',
      subtitle: 'Keep practicing!'
    };
  }

  // 0-star messages
  if (t) {
    return {
      title: t('celebration.zeroStars.title'),
      subtitle: t('celebration.zeroStars.subtitle')
    };
  }
  return {
    title: 'Nice Effort!',
    subtitle: 'Try again to earn stars!'
  };
}
