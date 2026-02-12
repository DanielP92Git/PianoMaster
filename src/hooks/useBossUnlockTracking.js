/**
 * Boss Unlock Tracking Hook
 *
 * Tracks which boss unlock celebrations have been shown using localStorage.
 * Each user+node combination gets a unique key to ensure celebrations
 * fire once per boss node per user per browser.
 *
 * Pattern follows: src/utils/levelUpTracking.js (localStorage access style)
 *
 * Edge cases handled:
 * - Safari private mode (localStorage throws QuotaExceededError)
 * - Missing userId or nodeId (returns shouldShow: false)
 * - localStorage unavailable (falls back to show once per session)
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for tracking boss unlock celebration state.
 *
 * @param {string|null} userId - Student UUID (required)
 * @param {string|null} nodeId - Boss node ID (required)
 * @returns {{ shouldShow: boolean, markAsShown: () => void, isLoading: boolean }}
 */
export const useBossUnlockTracking = (userId, nodeId) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If either param is missing, don't show and stop loading
  const isValid = Boolean(userId) && Boolean(nodeId);
  const storageKey = isValid ? `boss-unlocked-${userId}-${nodeId}` : null;

  useEffect(() => {
    if (!isValid) {
      setShouldShow(false);
      setIsLoading(false);
      return;
    }

    try {
      const hasShown = localStorage.getItem(storageKey);
      // Show if key doesn't exist (first time seeing this boss unlock)
      setShouldShow(hasShown === null);
    } catch (error) {
      // Safari private mode or localStorage unavailable
      // Fall back to showing once per session (state starts as true)
      console.warn('localStorage not available for boss unlock tracking:', error);
      setShouldShow(true);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, isValid]);

  const markAsShown = useCallback(() => {
    try {
      if (storageKey) {
        localStorage.setItem(storageKey, 'true');
      }
    } catch (error) {
      // Silently fail — celebration was shown this session regardless
      console.warn('Failed to persist boss unlock tracking:', error);
    }
    setShouldShow(false);
  }, [storageKey]);

  return { shouldShow, markAsShown, isLoading };
};

export default useBossUnlockTracking;
