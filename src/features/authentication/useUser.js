import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../services/apiAuth";

export function useUser() {
  const { isLoading, data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes - user auth state doesn't change often
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors, but not for auth errors
      if (failureCount < 2 && !error.message?.includes("invalid")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff, max 3s
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
