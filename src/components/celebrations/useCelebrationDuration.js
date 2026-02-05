import { useMemo } from 'react';
import {
  CELEBRATION_TIERS,
  EXTENDED_TIMEOUT_MULTIPLIER,
  REDUCED_MOTION_DURATION
} from '../../utils/celebrationConstants';

/**
 * Custom hook that calculates celebration duration based on tier and accessibility settings
 *
 * @param {string} tier - Celebration tier: 'standard', 'level-up', or 'boss'
 * @param {Object} options - Accessibility settings
 * @param {boolean} options.reducedMotion - If true, uses minimal duration (100ms)
 * @param {boolean} options.extendedTimeouts - If true, extends duration by 1.5x
 * @returns {number} Duration in milliseconds
 *
 * @example
 * const duration = useCelebrationDuration('standard', { reducedMotion: false, extendedTimeouts: true });
 * // Returns 750ms (500ms * 1.5)
 */
export function useCelebrationDuration(tier, options = {}) {
  const { reducedMotion = false, extendedTimeouts = false } = options;

  const duration = useMemo(() => {
    // Reduced motion takes precedence - use minimal duration
    if (reducedMotion) {
      return REDUCED_MOTION_DURATION;
    }

    // Get base duration for this tier (fallback to standard if tier not found)
    let baseDuration = CELEBRATION_TIERS[tier] || CELEBRATION_TIERS.standard;

    // Apply extended timeout multiplier if enabled
    if (extendedTimeouts) {
      baseDuration = Math.round(baseDuration * EXTENDED_TIMEOUT_MULTIPLIER);
    }

    return baseDuration;
  }, [tier, reducedMotion, extendedTimeouts]);

  return duration;
}
