import { useQuery } from "@tanstack/react-query";
import { getChildProfiles } from "../services/apiChildProfiles";
import { useUser } from "../features/authentication/useUser";

/**
 * Reads the child_profiles rows owned by the current authenticated parent.
 * Mirrors useAccessories.js's React Query wrapper conventions
 * (queryKey shape, enabled gate on the id).
 */
export function useChildProfiles(options = {}) {
  const { user } = useUser();
  const parentId = user?.id;

  return useQuery({
    queryKey: ["child-profiles", parentId],
    queryFn: () => getChildProfiles(parentId),
    enabled: !!parentId,
    staleTime: options.staleTime ?? 60 * 1000,
  });
}
