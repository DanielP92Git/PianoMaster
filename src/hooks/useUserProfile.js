import { useQuery } from "@tanstack/react-query";
import { useUser } from "../features/authentication/useUser";
import { useActiveChildId } from "./useActiveChildId";
import supabase from "../services/supabase";

export function useUserProfile() {
  const { user } = useUser();
  const { childId, ready } = useActiveChildId();
  // Teachers aren't child-scoped (useActiveChildId only resolves student/parent
  // roles) — their own profile row is keyed by their own auth id, unchanged.
  const profileId = user?.isTeacher ? user?.id : childId;

  return useQuery({
    queryKey: ["user-profile", profileId],
    queryFn: async () => {
      if (user?.isTeacher) {
        const { data } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", user.id)
          .single();
        return data;
      } else if (childId) {
        const { data } = await supabase
          .from("students")
          .select("*, avatars(*)")
          .eq("id", childId)
          .single();
        return data;
      }
      return null;
    },
    enabled: user?.isTeacher ? !!user?.id : ready && !!childId,
    staleTime: 30 * 60 * 1000, // 30 minutes - profile rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
  });
}
