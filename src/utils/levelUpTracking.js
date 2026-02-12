/**
 * Level-Up Tracking Utility
 *
 * Manages level-up celebration state using localStorage to prevent
 * duplicate celebrations across dashboard visits.
 *
 * Pattern: Similar to VictoryScreen's accessory unlock tracking (SHOWN_UNLOCKS_VERSION)
 */

const STORAGE_VERSION = 'v1';

/**
 * Get array of level numbers that have already been celebrated
 * @param {string} userId - Student UUID
 * @returns {number[]} Array of celebrated level numbers
 */
export const getCelebratedLevels = (userId) => {
  if (!userId) return [];

  const key = `celebrated-levels-${userId}-${STORAGE_VERSION}`;
  const stored = localStorage.getItem(key);

  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing celebrated levels:', error);
    return [];
  }
};

/**
 * Mark a level as celebrated
 * @param {string} userId - Student UUID
 * @param {number} level - Level number to mark as celebrated
 */
export const markLevelCelebrated = (userId, level) => {
  if (!userId || !level) return;

  const key = `celebrated-levels-${userId}-${STORAGE_VERSION}`;
  const celebrated = getCelebratedLevels(userId);

  if (!celebrated.includes(level)) {
    celebrated.push(level);
    localStorage.setItem(key, JSON.stringify(celebrated));
  }
};

/**
 * Check if a level has been celebrated
 * @param {string} userId - Student UUID
 * @param {number} level - Level number to check
 * @returns {boolean} True if level has been celebrated
 */
export const hasLevelBeenCelebrated = (userId, level) => {
  if (!userId || !level) return false;
  return getCelebratedLevels(userId).includes(level);
};

/**
 * Get the last level number the user saw on dashboard
 * Used to trigger badge animation when level changes
 * @param {string} userId - Student UUID
 * @returns {number|null} Last seen level number, or null if never set
 */
export const getLastSeenLevel = (userId) => {
  if (!userId) return null;

  const key = `last-seen-level-${userId}`;
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    return parseInt(stored, 10);
  } catch (error) {
    console.error('Error parsing last seen level:', error);
    return null;
  }
};

/**
 * Update the last seen level
 * @param {string} userId - Student UUID
 * @param {number} level - Current level number
 */
export const setLastSeenLevel = (userId, level) => {
  if (!userId || !level) return;

  const key = `last-seen-level-${userId}`;
  localStorage.setItem(key, level.toString());
};

export default {
  getCelebratedLevels,
  markLevelCelebrated,
  hasLevelBeenCelebrated,
  getLastSeenLevel,
  setLastSeenLevel,
};
