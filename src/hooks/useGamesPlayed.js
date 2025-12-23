import { useQuery } from "@tanstack/react-query";
import supabase from "../services/supabase";

/**
 * Fetch the count of games played by the current user
 * Counts records from students_score table
 */
async function getGamesPlayedCount() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { count, error } = await supabase
    .from("students_score")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id);

  if (error) {
    console.error("Error fetching games played count:", error);
    throw error;
  }

  return count || 0;
}

/**
 * Hook to get the number of games played by the current user
 */
export function useGamesPlayed() {
  return useQuery({
    queryKey: ["gamesPlayed"],
    queryFn: getGamesPlayedCount,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
