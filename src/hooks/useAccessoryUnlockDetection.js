import { useMemo } from "react";
import { checkAccessoryUnlock } from "../utils/accessoryUnlocks";

/**
 * Hook to detect newly unlocked accessories by comparing before/after states
 * @param {Array} accessories - List of all accessories
 * @param {Object} previousProgress - User progress before action (e.g., before game)
 * @param {Object} currentProgress - User progress after action (e.g., after game)
 * @returns {Array} - Array of newly unlocked accessories
 */
export function useAccessoryUnlockDetection(
  accessories,
  previousProgress,
  currentProgress
) {
  return useMemo(() => {
    if (!accessories || !previousProgress || !currentProgress) {
      return [];
    }

    const newlyUnlocked = [];

    accessories.forEach((accessory) => {
      // Skip if no unlock requirement
      if (!accessory.unlock_requirement) {
        return;
      }

      // Check previous state
      const wasLocked = !checkAccessoryUnlock(accessory, previousProgress)
        .unlocked;

      // Check current state
      const isNowUnlocked = checkAccessoryUnlock(accessory, currentProgress)
        .unlocked;

      // If it was locked before but is unlocked now, add to list
      if (wasLocked && isNowUnlocked) {
        newlyUnlocked.push(accessory);
      }
    });

    return newlyUnlocked;
  }, [accessories, previousProgress, currentProgress]);
}












