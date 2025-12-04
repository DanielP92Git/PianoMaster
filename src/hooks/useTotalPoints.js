import { useQuery } from "@tanstack/react-query";
import { useUser } from "../features/authentication/useUser";
import { getStudentScores } from "../services/apiDatabase";
import { achievementService } from "../services/achievementService";
import { calculatePointsSummary } from "../utils/points";

export function useTotalPoints(options = {}) {
  const { user } = useUser();

  return useQuery({
    queryKey: ["total-points", user?.id],
    enabled: !!user?.id,
    staleTime: options.staleTime ?? 3 * 60 * 1000,
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) {
        return {
          totalPoints: 0,
          gameplayPoints: 0,
          achievementPoints: 0,
        };
      }

      const [scores, earned] = await Promise.all([
        getStudentScores(user.id),
        achievementService.getEarnedAchievements(user.id),
      ]);

      return calculatePointsSummary({
        scores,
        earned,
      });
    },
  });
}
