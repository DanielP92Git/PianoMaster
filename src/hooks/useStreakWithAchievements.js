import { useMutation, useQueryClient } from "@tanstack/react-query";
import { streakService } from "../services/streakService";
import { achievementService } from "../services/achievementService";
import { useUser } from "../features/authentication/useUser";

export function useStreakWithAchievements() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Update streak first — returns full result with freeze/comeback flags
      const streakResult = await streakService.updateStreak();

      // Check for new achievements after streak update
      const newAchievements = await achievementService.checkForNewAchievements(
        user.id
      );

      return { newStreak: streakResult, newAchievements };
    },
    onSuccess: ({ newStreak: _newStreak, newAchievements }) => {
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries(["streak", user?.id]);
      queryClient.invalidateQueries(["streak-state", user?.id]);
      queryClient.invalidateQueries(["earned-achievements", user?.id]);
      // Invalidate XP-related queries (achievements award XP)
      queryClient.invalidateQueries(["point-balance", user?.id]);
      queryClient.invalidateQueries(["student-xp", user?.id]);

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
