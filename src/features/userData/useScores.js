import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStudentScores, updateStudentScore } from "../../services/apiScores";
import toast from "react-hot-toast";

export function useScores() {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(["user"]); // Retrieve the user data from the QueryClient
  const studentId = user?.id;

  // Fetch student scores
  const {
    data: scores,
    error: fetchError,
    isLoading: isFetching,
  } = useQuery({
    queryKey: ["scores"],
    queryFn: () => getStudentScores(studentId),
    enabled: !!studentId, // Only fetch scores if the student ID is available
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
