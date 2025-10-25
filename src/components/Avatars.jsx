import { useEffect, useState } from "react";
import { getAvatar } from "../services/apiAvatars";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BackButton from "./ui/BackButton";
import { useUser } from "../features/authentication/useUser";
import { updateUserAvatar } from "../services/apiAuth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AnimatedAvatar from "./ui/AnimatedAvatar";
import { useUserProfile } from "../hooks/useUserProfile";

function Avatars() {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [currentlyAnimatingId, setCurrentlyAnimatingId] = useState(null);

  const {
    isPending,
    data: avatars,
    error,
  } = useQuery({
    queryKey: ["avatars"],
    queryFn: getAvatar,
  });

  // Query for user's current avatar (student or teacher)
  const { data: profileData } = useUserProfile();

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
      queryClient.invalidateQueries(["user-profile", user?.id]);
    },
    onError: () => {
      toast.error("Failed to update avatar");
    },
  });

  // Helper function to detect if an avatar is Beethoven
  const isBeethovenAvatar = (avatar) => {
    // Check if the avatar image URL contains 'beethoven' (case insensitive)
    return avatar.image_url?.toLowerCase().includes("beethoven");
  };

  // Helper function to detect if an avatar is Bach
  const isBachAvatar = (avatar) => {
    // Check if the avatar image URL contains 'bach' (case insensitive)
    return avatar.image_url?.toLowerCase().includes("bach");
  };

  // Helper function to detect if an avatar is Mozart
  const isMozartAvatar = (avatar) => {
    // Check if the avatar image URL contains 'mozart' (case insensitive)
    return avatar.image_url?.toLowerCase().includes("mozart");
  };

  // Get animation video URL for composer avatars
  const getAnimationVideoUrl = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return "/avatars/Beethoven_Animation_Bowing.mp4";
    }
    if (isBachAvatar(avatar)) {
      return "/avatars/Bach_Animation_Generation.mp4";
    }
    if (isMozartAvatar(avatar)) {
      return "/avatars/Mozart_Animation_Bowing.mp4";
    }
    return null;
  };

  const handleAnimationStart = (avatarId) => {
    // Set the currently animating avatar ID to stop others
    setCurrentlyAnimatingId(avatarId);
  };

  const handleAnimationEnd = (avatarId) => {
    // Clear the currently animating ID when animation ends
    if (currentlyAnimatingId === avatarId) {
      setCurrentlyAnimatingId(null);
    }
  };

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
          <AnimatedAvatar
            key={avatar.id}
            avatar={avatar}
            isSelected={selectedAvatar?.id === avatar.id}
            onClick={handleAvatarSelect}
            animationVideoUrl={getAnimationVideoUrl(avatar)}
            onAnimationStart={handleAnimationStart}
            onAnimationEnd={handleAnimationEnd}
            shouldStopAnimation={
              currentlyAnimatingId !== null &&
              currentlyAnimatingId !== avatar.id
            }
          />
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
