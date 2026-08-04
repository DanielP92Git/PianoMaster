import { useMutation, useQueryClient } from "@tanstack/react-query";
import { streakService } from "../services/streakService";
import { achievementService } from "../services/achievementService";

/**
 * @param {string|null} childId - the active child id (row target for the streak
 *   update + achievement check; RLS still enforces the authenticated session can
 *   only reach children it owns). Required — streakService.updateStreak() now
 *   requires an explicit childId (Plan 04).
 */
export function useStreakWithAchievements(childId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!childId) throw new Error("No active child");

      // Update streak first — returns full result with freeze/comeback flags
      const streakResult = await streakService.updateStreak(childId);

      // Check for new achievements after streak update
      const newAchievements =
        await achievementService.checkForNewAchievements(childId);

      return { newStreak: streakResult, newAchievements };
    },
    onSuccess: ({ newStreak: _newStreak, newAchievements }) => {
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries(["streak", childId]);
      queryClient.invalidateQueries(["streak-state", childId]);
      queryClient.invalidateQueries(["earned-achievements", childId]);
      // Invalidate XP-related queries (achievements award XP)
      queryClient.invalidateQueries(["point-balance", childId]);
      queryClient.invalidateQueries(["student-xp", childId]);

      // Log new achievements for debugging
      if (newAchievements.length > 0) {
        console.info("New achievements unlocked:", newAchievements.length);
      }
    },
    onError: (error) => {
      console.error("Error updating streak or checking achievements:", error);
    },
  });
}
