import { useEffect, useState } from "react";
import { getAvatar } from "../services/apiAvatars";
import { Check, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BackButton from "./ui/BackButton";
import { useUser } from "../features/authentication/useUser";
import { updateUserAvatar } from "../services/apiAuth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import supabase from "../services/supabase";

function Avatars() {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const {
    isPending,
    data: avatars,
    error,
  } = useQuery({
    queryKey: ["avatars"],
    queryFn: getAvatar,
  });

  // Query for user's current avatar (student or teacher)
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
  });

  // Set initial selected avatar from profile
  useEffect(() => {
    if (profileData?.avatars) {
      // Student has avatar relationship
      setSelectedAvatar(profileData.avatars);
    } else if (profileData?.avatar_url && avatars) {
      // Teacher has avatar_url - find matching avatar from list
      const matchingAvatar = avatars.find(
        (avatar) => avatar.image_url === profileData.avatar_url
      );
      if (matchingAvatar) {
        setSelectedAvatar(matchingAvatar);
      }
    }
  }, [profileData, avatars]);

  // Mutation to update avatar
  const updateAvatarMutation = useMutation({
    mutationFn: ({ userId, avatarId }) => updateUserAvatar(userId, avatarId),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile-with-avatar", user?.id]);
    },
    onError: () => {
      toast.error("Failed to update avatar");
    },
  });

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    if (user?.id) {
      updateAvatarMutation.mutate({
        userId: user.id,
        avatarId: avatar.id,
      });
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mx-4 my-4 space-y-6">
      <BackButton to="/settings" name="Settings" />
      <h2 className="text-xl font-semibold text-white">Choose Your Avatar</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => handleAvatarSelect(avatar)}
            className={`relative group aspect-square rounded-xl overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              selectedAvatar?.id === avatar.id
                ? "ring-2 ring-indigo-600"
                : "ring-1 ring-gray-200"
            }`}
          >
            <img
              src={avatar.image_url}
              alt={`Avatar ${avatar.id}`}
              className="w-full h-full object-cover"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity" />

            {/* Selection Indicator */}
            {selectedAvatar?.id === avatar.id && (
              <div className="absolute inset-0 bg-indigo-600 bg-opacity-20 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Preview of Selected Avatar */}
      {selectedAvatar && (
        <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
          <div className="flex items-center space-x-4">
            <img
              src={selectedAvatar.image_url}
              alt="Selected Avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <p className="text-sm font-medium text-white">Selected Avatar</p>
              <p className="text-sm text-gray-300">
                {updateAvatarMutation.isPending
                  ? "Saving your selection..."
                  : "Click another avatar to change your selection"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Avatars;
