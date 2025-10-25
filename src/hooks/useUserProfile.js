import { useQuery } from "@tanstack/react-query";
import { useUser } from "../features/authentication/useUser";
import supabase from "../services/supabase";

export function useUserProfile() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (user?.isStudent) {
        const { data } = await supabase
          .from("students")
          .select("*, avatars(*)")
          .eq("id", user.id)
          .single();
        return data;
      } else if (user?.isTeacher) {
        const { data } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", user.id)
          .single();
        return data;
      }
      return null;
    },
    enabled: !!user?.id && (user?.isStudent || user?.isTeacher),
    staleTime: 30 * 60 * 1000, // 30 minutes - profile rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
  });
}
