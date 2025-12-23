import { useQuery } from "@tanstack/react-query";
import { useUser } from "../features/authentication/useUser";
import {
  getStudentScoreValues,
  getAchievementPointsTotal,
} from "../services/apiDatabase";
import { calculatePointsSummary } from "../utils/points";

export function useTotalPoints(options = {}) {
  const { user } = useUser();

  return useQuery({
    queryKey: ["total-points", user?.id],
    enabled: !!user?.id,
    staleTime: options.staleTime ?? 0,
    refetchInterval: options.refetchInterval ?? 5 * 60 * 1000,
    refetchOnMount: options.refetchOnMount ?? "always",
    keepPreviousData: options.keepPreviousData ?? true,
    queryFn: async () => {
      if (!user?.id) {
        return {
          totalPoints: 0,
          gameplayPoints: 0,
          achievementPoints: 0,
        };
      }

      const [scores, achievementPoints] = await Promise.all([
        getStudentScoreValues(user.id),
        getAchievementPointsTotal(user.id),
      ]);

      return calculatePointsSummary({
        scores,
        achievementPointsOverride: achievementPoints,
      });
    },
  });
}
