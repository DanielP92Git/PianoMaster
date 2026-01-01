import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../services/apiAuth";

export function useUser() {
  const { isLoading, data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes - user auth state doesn't change often
    retry: (failureCount, error) => {
      // Don't retry on network errors - they're handled by circuit breaker in getCurrentUser
      const errorMessage = String(error?.message || "").toLowerCase();
      const isNetworkError =
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("network error") ||
        errorMessage.includes("insufficient resources") ||
        errorMessage.includes("network request failed");

      // Don't retry network errors or invalid auth errors
      if (isNetworkError || errorMessage.includes("invalid")) {
        return false;
      }

      // Retry up to 1 time for other errors
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff, max 3s
    // Prevent refetching on window focus when there are network issues
    refetchOnWindowFocus: false,
    // Increase refetch interval to reduce load
    refetchInterval: false,
  });

  return {
    user,
    isAuthenticated: user?.role === "authenticated",
    isTeacher: user?.isTeacher || false,
    isStudent: user?.isStudent || false,
    userRole: user?.userRole,
    profile: user?.profile,
    isLoading,
  };
}
