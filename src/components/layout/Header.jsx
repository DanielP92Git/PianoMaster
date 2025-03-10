import { Menu, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../features/authentication/useUser";
import supabase from "../../services/supabase";

export default function Header({ onMenuClick }) {
  const { user } = useUser();

  const { data: student } = useQuery({
    queryKey: ["student", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*, avatars(*)")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <nav className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            {student?.avatars && (
              <Link to="/avatars">
                <img
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 hover:ring-white transition-all cursor-pointer"
                  src={student.avatars.image_url}
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
            <button className="p-2 rounded-lg lg:hidden" onClick={onMenuClick}>
              <Menu className="h-6 w-6 text-white hover:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
