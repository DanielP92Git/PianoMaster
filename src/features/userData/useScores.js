import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudentScores, updateStudentScore } from "../../services/apiScores";
import { useActiveChildId } from "../../hooks/useActiveChildId";
import toast from "react-hot-toast";

export function useScores() {
  const queryClient = useQueryClient();
  const { childId, ready } = useActiveChildId();

  // Fetch scores for the active child
  const {
    data: scores,
    error: fetchError,
    isLoading: isFetching,
  } = useQuery({
    queryKey: ["scores", childId],
    queryFn: () => getStudentScores(childId),
    enabled: ready && !!childId, // Only fetch once the active child id is resolved
    staleTime: 3 * 60 * 1000, // 3 minutes - scores can change during gameplay
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    onError: (error) => {
      console.error(error);
      toast.error("Failed to fetch scores");
    },
  });

  // Update active child's score
  const {
    mutate: updateScore,
    mutateAsync: updateScoreAsync,
    error: updateError,
    isLoading: isUpdating,
  } = useMutation({
    mutationFn: ({ score, gameType }) =>
      updateStudentScore(childId, score, gameType),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries(["scores", childId]),
        queryClient.invalidateQueries(["student-scores", childId]),
        queryClient.invalidateQueries(["point-balance", childId]),
        queryClient.invalidateQueries(["gamesPlayed"]),
        queryClient.invalidateQueries(["earned-achievements", childId]),
      ]);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to update score");
    },
  });

  return {
    scores,
    fetchError,
    isLoading: isFetching,
    updateScore,
    updateScoreAsync,
    updateError,
    isUpdating,
  };
}
