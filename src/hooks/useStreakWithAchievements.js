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

      // Update streak first
      const newStreak = await streakService.updateStreak();

      // Check for new achievements after streak update
      const newAchievements = await achievementService.checkForNewAchievements(
        user.id
      );

      return { newStreak, newAchievements };
    },
    onSuccess: ({ newStreak, newAchievements }) => {
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries(["streak", user?.id]);
      queryClient.invalidateQueries(["earned-achievements", user?.id]);

      // Log new achievements for debugging
      if (newAchievements.length > 0) {
        console.log("🏆 New achievements earned:", newAchievements);
      }

      // Optionally show toast notifications for new achievements
      newAchievements.forEach((achievement) => {
        console.log(`🎉 Achievement unlocked: ${achievement.title}`);
      });
    },
    onError: (error) => {
      console.error("Error updating streak or checking achievements:", error);
    },
  });
}
