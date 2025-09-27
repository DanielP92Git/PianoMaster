import { Menu, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../features/authentication/useUser";
import supabase from "../../services/supabase";

export default function Header({ onMenuClick }) {
  const { user } = useUser();

  // Fetch profile data (student or teacher) with avatar
  const { data: profileData } = useQuery({
    queryKey: ["profile-with-avatar", user?.id],
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
    staleTime: 10 * 60 * 1000, // 10 minutes - profile data rarely changes
  });

  return (
    <nav className="shadow-lg lg:ml-72">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {(profileData?.avatars || profileData?.avatar_url) && (
              <Link to="/avatars">
                <img
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 hover:ring-white transition-all cursor-pointer"
                  src={profileData.avatars?.image_url || profileData.avatar_url}
                  alt="User avatar"
                />
              </Link>
            )}
            <Link to={"/"} className="flex items-center">
              <Music2 className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-white">
                PianoMaster
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-lg lg:hidden hover:bg-white/10 transition-colors"
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6 text-white hover:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
