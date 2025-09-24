import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudentScores, updateStudentScore } from "../../services/apiScores";
import toast from "react-hot-toast";

export function useScores() {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(["user"]); // Retrieve the user data from the QueryClient
  const studentId = user?.id;
  const isStudent = user?.isStudent; // Check if user is actually a student

  // Fetch student scores (only for students)
  const {
    data: scores,
    error: fetchError,
    isLoading: isFetching,
  } = useQuery({
    queryKey: ["scores"],
    queryFn: () => getStudentScores(studentId),
    enabled: !!studentId && isStudent, // Only fetch scores if the user is a student
    staleTime: 3 * 60 * 1000, // 3 minutes - scores can change during gameplay
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    onError: (error) => {
      console.error(error);
      toast.error("Failed to fetch scores");
    },
  });

  // Update student score
  const {
    mutate: updateScore,
    error: updateError,
    isLoading: isUpdating,
  } = useMutation({
    mutationFn: ({ score, gameType }) =>
      updateStudentScore(studentId, score, gameType),
    onSuccess: () => {
      queryClient.invalidateQueries(["scores"]);
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
    updateError,
    isUpdating,
  };
}
