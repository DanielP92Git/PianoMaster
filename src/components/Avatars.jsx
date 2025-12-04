import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("common");
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

  // Helper function to detect if an avatar is Brahms
  const isBrahmsAvatar = (avatar) => {
    return avatar.image_url?.toLowerCase().includes("brahms");
  };

  // Helper function to detect if an avatar is Schubert
  const isSchubertAvatar = (avatar) => {
    return avatar.image_url?.toLowerCase().includes("schubert");
  };

  // Helper function to detect if an avatar is Chopin
  const isChopinAvatar = (avatar) => {
    return avatar.image_url?.toLowerCase().includes("chopin");
  };

  // Helper function to detect if an avatar is Schumann
  const isSchumannAvatar = (avatar) => {
    return avatar.image_url?.toLowerCase().includes("schumann");
  };

  // Helper function to detect if an avatar is Handel
  const isHandelAvatar = (avatar) => {
    return avatar.image_url?.toLowerCase().includes("handel");
  };

  // Helper function to detect if an avatar is Vivaldi
  const isVivaldiAvatar = (avatar) => {
    return avatar.image_url?.toLowerCase().includes("vivaldi");
  };

  // Helper function to get the full composer name
  const getComposerFullName = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return t("avatars.beethoven.name");
    }
    if (isBachAvatar(avatar)) {
      return t("avatars.bach.name");
    }
    if (isMozartAvatar(avatar)) {
      return t("avatars.mozart.name");
    }
    if (isBrahmsAvatar(avatar)) {
      return t("avatars.brahms.name");
    }
    if (isSchubertAvatar(avatar)) {
      return t("avatars.schubert.name");
    }
    if (isChopinAvatar(avatar)) {
      return t("avatars.chopin.name");
    }
    if (isSchumannAvatar(avatar)) {
      return t("avatars.schumann.name");
    }
    if (isHandelAvatar(avatar)) {
      return t("avatars.handel.name");
    }
    if (isVivaldiAvatar(avatar)) {
      return t("avatars.vivaldi.name");
    }
    return null;
  };

  // Helper function to get composer life years
  const getComposerLifeYears = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return "1770 – 1827";
    }
    if (isBachAvatar(avatar)) {
      return "1685 – 1750";
    }
    if (isMozartAvatar(avatar)) {
      return "1756 – 1791";
    }
    if (isBrahmsAvatar(avatar)) {
      return "1833 – 1897";
    }
    if (isSchubertAvatar(avatar)) {
      return "1797 – 1828";
    }
    if (isChopinAvatar(avatar)) {
      return "1810 – 1849";
    }
    if (isSchumannAvatar(avatar)) {
      return "1810 – 1856";
    }
    if (isHandelAvatar(avatar)) {
      return "1685 – 1759";
    }
    if (isVivaldiAvatar(avatar)) {
      return "1678 – 1741";
    }
    return null;
  };

  // Helper function to get composer description
  const getComposerDescription = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return t("avatars.beethoven.description");
    }
    if (isBachAvatar(avatar)) {
      return t("avatars.bach.description");
    }
    if (isMozartAvatar(avatar)) {
      return t("avatars.mozart.description");
    }
    if (isBrahmsAvatar(avatar)) {
      return t("avatars.brahms.description");
    }
    if (isSchubertAvatar(avatar)) {
      return t("avatars.schubert.description");
    }
    if (isChopinAvatar(avatar)) {
      return t("avatars.chopin.description");
    }
    if (isSchumannAvatar(avatar)) {
      return t("avatars.schumann.description");
    }
    if (isHandelAvatar(avatar)) {
      return t("avatars.handel.description");
    }
    if (isVivaldiAvatar(avatar)) {
      return t("avatars.vivaldi.description");
    }
    return null;
  };

  // Helper function to get fun fact
  const getComposerFunFact = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return t("avatars.beethoven.fun_fact");
    }
    if (isBachAvatar(avatar)) {
      return t("avatars.bach.fun_fact");
    }
    if (isMozartAvatar(avatar)) {
      return t("avatars.mozart.fun_fact");
    }
    if (isBrahmsAvatar(avatar)) {
      return t("avatars.brahms.fun_fact");
    }
    if (isSchubertAvatar(avatar)) {
      return t("avatars.schubert.fun_fact");
    }
    if (isChopinAvatar(avatar)) {
      return t("avatars.chopin.fun_fact");
    }
    if (isSchumannAvatar(avatar)) {
      return t("avatars.schumann.fun_fact");
    }
    if (isHandelAvatar(avatar)) {
      return t("avatars.handel.fun_fact");
    }
    if (isVivaldiAvatar(avatar)) {
      return t("avatars.vivaldi.fun_fact");
    }
    return null;
  };

  // Helper function to check if an avatar is a composer
  const isComposerAvatar = (avatar) => {
    return (
      isBeethovenAvatar(avatar) ||
      isBachAvatar(avatar) ||
      isMozartAvatar(avatar) ||
      isBrahmsAvatar(avatar) ||
      isSchubertAvatar(avatar) ||
      isChopinAvatar(avatar) ||
      isSchumannAvatar(avatar) ||
      isHandelAvatar(avatar) ||
      isVivaldiAvatar(avatar)
    );
  };

  // Get animation video URL for composer avatars
  // Note: Videos are optional - if null is returned, only the static image will show
  const getAnimationVideoUrl = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return "/avatars/Beethoven_Animation.mp4";
    }
    if (isBachAvatar(avatar)) {
      return "/avatars/Bach_Animation.mp4";
    }
    if (isMozartAvatar(avatar)) {
      return "/avatars/Mozart_Animation.mp4";
    }
    // New composers - videos not yet added, will work with just images
    if (isBrahmsAvatar(avatar)) {
      return "/avatars/Brahms_Animation.mp4";
    }
    if (isSchubertAvatar(avatar)) {
      return "/avatars/Schubert_Animation.mp4";
    }
    if (isHandelAvatar(avatar)) {
      return "/avatars/Handel_Animation.mp4";
    }
    if (isChopinAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Chopin_Animation.mp4"
    }
    if (isSchumannAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Schumann_Animation.mp4"
    }
    if (isVivaldiAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Vivaldi_Animation.mp4"
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
      <BackButton to="/settings" name={t("navigation.links.settings")} />

      <h2 className="text-xl font-semibold text-white text-center">
        {t("avatars.title")}
      </h2>

      {/* Avatar Grid - Smaller size to fit in one row */}
      <div className="flex flex-wrap justify-center gap-3 px-2">
        {avatars.map((avatar) => (
          <div key={avatar.id} className="w-20 h-20 sm:w-24 sm:h-24">
            <AnimatedAvatar
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
          </div>
        ))}
      </div>

      {/* Composer Information - shown when a composer avatar is selected */}
      {selectedAvatar && isComposerAvatar(selectedAvatar) && (
        <div className="mt-6 p-6 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 space-y-4">
          {/* Composer Name and Years */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl md:text-4xl font-rounded font-bold text-white">
              {getComposerFullName(selectedAvatar)}
            </h1>
            <p className="text-lg md:text-xl font-rounded font-semibold text-white/80">
              {getComposerLifeYears(selectedAvatar)}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-base md:text-lg font-rounded text-white/90 leading-relaxed">
              {getComposerDescription(selectedAvatar)}
            </p>
          </div>

          {/* Fun Fact */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-300/30">
            <p className="text-base md:text-lg font-rounded font-semibold text-white leading-relaxed">
              ✨ {t("avatars.funFact")}:
            </p>
            <p className="text-base md:text-lg font-rounded font-semibold text-white leading-relaxed">
              {getComposerFunFact(selectedAvatar)}
            </p>
          </div>
        </div>
      )}

      {/* Simple selection status for non-composer avatars */}
      {selectedAvatar && !isComposerAvatar(selectedAvatar) && (
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
          <div className="flex items-center space-x-4">
            <img
              src={selectedAvatar.image_url}
              alt="Selected Avatar"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <p className="text-sm font-medium text-white">
                {t("avatars.selected_avatar")}
              </p>
              <p className="text-sm text-gray-300">
                {updateAvatarMutation.isPending
                  ? t("common.saving")
                  : t("avatars.click_another_avatar")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Avatars;
