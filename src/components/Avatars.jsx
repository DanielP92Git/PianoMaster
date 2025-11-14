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
      return "Ludwig van Beethoven";
    }
    if (isBachAvatar(avatar)) {
      return "Johann Sebastian Bach";
    }
    if (isMozartAvatar(avatar)) {
      return "Wolfgang Amadeus Mozart";
    }
    if (isBrahmsAvatar(avatar)) {
      return "Johannes Brahms";
    }
    if (isSchubertAvatar(avatar)) {
      return "Franz Schubert";
    }
    if (isChopinAvatar(avatar)) {
      return "Frédéric Chopin";
    }
    if (isSchumannAvatar(avatar)) {
      return "Robert Schumann";
    }
    if (isHandelAvatar(avatar)) {
      return "George Frideric Handel";
    }
    if (isVivaldiAvatar(avatar)) {
      return "Antonio Vivaldi";
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
      return "A German composer who wrote amazing music even after he became deaf! He loved nature and took long walks to get inspiration for his powerful symphonies.";
    }
    if (isBachAvatar(avatar)) {
      return "A German composer who was a master of the organ and harpsichord. He came from a family of musicians and had 20 children, many of whom became musicians too!";
    }
    if (isMozartAvatar(avatar)) {
      return "An Austrian musical genius who started composing at age 5! He wrote over 600 pieces of music and loved to make people laugh with his jokes and pranks.";
    }
    if (isBrahmsAvatar(avatar)) {
      return "A German composer with a big beard who loved classical music and was friends with Clara Schumann. He was shy but his music was full of warm, beautiful melodies.";
    }
    if (isSchubertAvatar(avatar)) {
      return "An Austrian composer who loved writing songs and melodies. He was very friendly and had a group of artist friends who would gather to hear his latest music!";
    }
    if (isChopinAvatar(avatar)) {
      return "A Polish-French composer known as the 'poet of the piano.' He wrote beautiful, dreamy music mostly for the piano and was born near Warsaw, Poland.";
    }
    if (isSchumannAvatar(avatar)) {
      return "A German composer who loved literature and poetry. He married the famous pianist Clara and wrote music that told stories and painted pictures with sound.";
    }
    if (isHandelAvatar(avatar)) {
      return "A German-British composer famous for his 'Messiah' with the Hallelujah Chorus! He loved writing music for big celebrations and royal events.";
    }
    if (isVivaldiAvatar(avatar)) {
      return "An Italian composer with bright red hair who was also a priest! He taught music to orphan girls in Venice and wrote 'The Four Seasons,' music that sounds like spring, summer, fall, and winter.";
    }
    return null;
  };

  // Helper function to get fun fact
  const getComposerFunFact = (avatar) => {
    if (isBeethovenAvatar(avatar)) {
      return "🎵 Fun Fact: Beethoven loved coffee so much that he counted exactly 60 beans for each cup!";
    }
    if (isBachAvatar(avatar)) {
      return "🎵 Fun Fact: Bach once walked 250 miles just to hear a famous organist play!";
    }
    if (isMozartAvatar(avatar)) {
      return "🎵 Fun Fact: Mozart had a pet starling bird that could sing one of his piano pieces!";
    }
    if (isBrahmsAvatar(avatar)) {
      return "🎵 Fun Fact: When Brahms was a young boy, he helped support his family by playing piano in local inns and taverns—kind of like being a small-town piano superstar!";
    }
    if (isSchubertAvatar(avatar)) {
      return "🎵 Fun Fact: Schubert wrote over 600 songs and sometimes composed up to 8 songs in a single day!";
    }
    if (isChopinAvatar(avatar)) {
      return "🎵 Fun Fact: Chopin gave his first piano concert when he was only 7 years old!";
    }
    if (isSchumannAvatar(avatar)) {
      return "🎵 Fun Fact: Schumann hurt his hand trying to make it stronger with a finger device, so he focused on composing instead!";
    }
    if (isHandelAvatar(avatar)) {
      return "🎵 Fun Fact: Handel wrote his famous 'Messiah' in just 24 days!";
    }
    if (isVivaldiAvatar(avatar)) {
      return "🎵 Fun Fact: Vivaldi wrote over 500 concertos and was nicknamed 'The Red Priest' because of his red hair!";
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
      return "/avatars/Beethoven_Animation_Bowing.mp4";
    }
    if (isBachAvatar(avatar)) {
      return "/avatars/Bach_Animation_Generation.mp4";
    }
    if (isMozartAvatar(avatar)) {
      return "/avatars/Mozart_Animation_Bowing.mp4";
    }
    // New composers - videos not yet added, will work with just images
    if (isBrahmsAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Brahms_Animation.mp4"
    }
    if (isSchubertAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Schubert_Animation.mp4"
    }
    if (isChopinAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Chopin_Animation.mp4"
    }
    if (isSchumannAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Schumann_Animation.mp4"
    }
    if (isHandelAvatar(avatar)) {
      return null; // Add video path when ready: "/avatars/Handel_Animation.mp4"
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
      <BackButton to="/settings" name="Settings" />

      <h2 className="text-xl font-semibold text-white text-center">
        Choose Your Avatar
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
