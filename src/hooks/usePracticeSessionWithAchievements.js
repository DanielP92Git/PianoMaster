import { useMutation, useQueryClient } from "@tanstack/react-query";
import { practiceService } from "../services/practiceService";
import { achievementService } from "../services/achievementService";
import { useUser } from "../features/authentication/useUser";
import toast from "react-hot-toast";

export function usePracticeSessionWithAchievements() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recordingBlob,
      notes,
      recordingDuration,
      options,
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Upload practice session first
      const session = await practiceService.uploadPracticeSession(
        recordingBlob,
        user.id,
        notes,
        recordingDuration,
        options
      );

      // Check for new achievements after session upload
      const newAchievements = await achievementService.checkForNewAchievements(
        user.id
      );

      return { session, newAchievements };
    },
    onSuccess: ({ session, newAchievements }) => {
      // Show success message
      toast.success("Practice session submitted successfully!");

      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries(["earned-achievements", user?.id]);
      queryClient.invalidateQueries(["practice-sessions", user?.id]);

      // Show achievement notifications
      if (newAchievements.length > 0) {

        newAchievements.forEach((achievement) => {
          toast.success(`🎉 Achievement unlocked: ${achievement.title}!`, {
            duration: 5000,
          });
          
        });
      }

      return { session, newAchievements };
    },
    onError: (error) => {
      console.error(
        "Error uploading practice session or checking achievements:",
        error
      );
      toast.error("Failed to upload recording");
    },
  });
}
