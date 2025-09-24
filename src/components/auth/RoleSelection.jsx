import { useState } from "react";
import { GraduationCap, Users, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "../../services/supabase";
import toast from "react-hot-toast";

export function RoleSelection({ user, onRoleSelected }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const queryClient = useQueryClient();

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: async (role) => {
      const firstName =
        user.user_metadata?.full_name?.split(" ")[0] ||
        user.email?.split("@")[0] ||
        "";
      const lastName =
        user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "";

      if (role === "teacher") {
        const { data, error } = await supabase
          .from("teachers")
          .insert([
            {
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: user.email,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("students")
          .insert([
            {
              id: user.id,
              first_name: firstName,
              email: user.email,
              username: `user${Math.random().toString(36).substr(2, 4)}`,
              level: "Beginner",
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success("Profile created successfully!");
      // Invalidate user query to refetch with new profile
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onRoleSelected && onRoleSelected();
    },
    onError: (error) => {
      toast.error("Failed to create profile. Please try again.");
      console.error("Profile creation error:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    createProfile(selectedRole);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6 border border-white/20">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">
              Welcome to PianoMaster!
            </h1>
            <p className="text-white/80">
              Please select your role to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === "student"
                    ? "border-indigo-500 bg-indigo-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedRole("student")}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-medium text-white">Student</h3>
                    <p className="text-sm text-white/60">
                      Learn piano with interactive lessons and games
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === "teacher"
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedRole("teacher")}
              >
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-medium text-white">Teacher</h3>
                    <p className="text-sm text-white/60">
                      Manage students and track their progress
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedRole || isPending}
              className="w-full h-12 flex items-center justify-center px-6 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
