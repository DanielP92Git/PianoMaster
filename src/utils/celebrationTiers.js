/**
 * Celebration Tier Determination Logic
 *
 * Determines the appropriate celebration tier based on performance metrics.
 * These tiers map directly to CELEBRATION_TIERS duration keys in celebrationConstants.js.
 *
 * @see src/utils/celebrationConstants.js for duration mappings:
 * - 'standard' → 500ms
 * - 'level-up' → 1000ms
 * - 'boss' → 3000ms
 */

/**
 * Determines the celebration tier based on performance
 *
 * @param {number} stars - Star rating earned (0-3)
 * @param {boolean} isBoss - Whether this is a boss node
 * @param {boolean} leveledUp - Whether the player leveled up
 * @param {number} scorePercentage - Score percentage (0-100)
 * @returns {'epic' | 'full' | 'standard' | 'minimal'} Celebration tier
 */
export function determineCelebrationTier(stars, isBoss, leveledUp, scorePercentage) {
  // Epic tier: Boss node with at least 1 star
  if (isBoss && stars >= 1) {
    return 'epic';
  }

  // Full tier: Perfect score (3 stars) or level up achievement
  if (stars === 3 || leveledUp) {
    return 'full';
  }

  // Standard tier: Earned at least 1 star
  if (stars >= 1) {
    return 'standard';
  }

  // Minimal tier: Failed to earn stars (< 60% score)
  return 'minimal';
}

/**
 * Gets configuration for a celebration tier
 *
 * @param {'epic' | 'full' | 'standard' | 'minimal'} tier - Celebration tier
 * @returns {Object} Configuration object
 * @property {string} duration - Duration tier key (maps to CELEBRATION_TIERS)
 * @property {boolean} confetti - Whether to show confetti
 * @property {string} animation - Animation style identifier
 * @property {string} messageIntensity - Message tone/intensity
 */
export function getCelebrationConfig(tier) {
  const configs = {
    minimal: {
      duration: 'standard',
      confetti: false,
      animation: 'fade',
      messageIntensity: 'neutral'
    },
    standard: {
      duration: 'standard',
      confetti: false,
      animation: 'bounce',
      messageIntensity: 'positive'
    },
    full: {
      duration: 'level-up',
      confetti: true,
      animation: 'bounce-glow',
      messageIntensity: 'excellent'
    },
    epic: {
      duration: 'boss',
      confetti: true,
      animation: 'epic',
      messageIntensity: 'epic'
    }
  };

  return configs[tier] || configs.minimal;
}
