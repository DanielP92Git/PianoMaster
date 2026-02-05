/**
 * Celebration Animation Constants
 *
 * Defines duration tiers, accessibility multipliers, and skip keycodes
 * for the celebration system. All future celebration features should
 * use these constants for consistency.
 */

/**
 * Duration tiers for different celebration types (in milliseconds)
 * - standard: Quick feedback for routine achievements (stars, XP)
 * - level-up: Mid-tier for significant progress milestones
 * - boss: Extended celebration for major accomplishments
 */
export const CELEBRATION_TIERS = {
  standard: 500,      // 0.5 seconds - quick feedback
  'level-up': 1000,   // 1 second - notable milestone
  boss: 3000          // 3 seconds - major achievement
};

/**
 * Multiplier applied to celebration durations when Extended Timeouts
 * accessibility setting is enabled (for cognitive accessibility)
 */
export const EXTENDED_TIMEOUT_MULTIPLIER = 1.5;

/**
 * Minimum duration for reduced motion mode (in milliseconds)
 * Provides enough visual feedback without complex animations
 */
export const REDUCED_MOTION_DURATION = 100;

/**
 * Keyboard shortcuts that dismiss celebrations
 * Supports Escape and Enter keys for accessibility
 */
export const SKIP_KEYS = ['Escape', 'Enter'];
