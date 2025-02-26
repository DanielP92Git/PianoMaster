import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../services/apiAuth";

export function useUser() {
  const { isLoading, data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    staleTime: 0,
    retry: false,
  });

  return {
    user,
    isAuthenticated: user?.role === "authenticated",
    isLoading,
  };
}
