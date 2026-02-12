import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getAvatar } from "../services/apiAvatars";
import { Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BackButton from "./ui/BackButton";
import { useUser } from "../features/authentication/useUser";
import { updateUserAvatar } from "../services/apiAuth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AnimatedAvatar, { ACCESSORY_SLOT_STYLES } from "./ui/AnimatedAvatar";
import {
  useAccessoriesList,
  useUserAccessories as useOwnedAccessories,
  usePointBalance,
  usePurchaseAccessory,
  useEquipAccessory,
  useUnequipAccessory,
  useUpdateAccessoryMetadata,
} from "../hooks/useAccessories";
import { getAvatarImageSource } from "../utils/avatarAssets";
import { useUserProfile } from "../hooks/useUserProfile";
import { useGamesPlayed } from "../hooks/useGamesPlayed";
import { DraggableAccessory } from "./ui/DraggableAccessory";
import {
  groupAccessoriesByCategory,
  checkAccessoryUnlock,
  ACCESSORY_CATEGORIES,
} from "../utils/accessoryUnlocks";
import { Lock } from "lucide-react";
import UnlockRequirementModal from "./ui/UnlockRequirementModal";

const POINT_FORMATTER = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const formatPoints = (value) =>
  POINT_FORMATTER.format(Math.max(0, Math.round(value || 0)));

function AvatarPreview({
  avatar,
  accessories = [],
  placeholder,
  isEditMode = false,
  onAccessoryPositionChange = null,
}) {
  const imageSrc = getAvatarImageSource(avatar);
  const layers = Array.isArray(accessories)
    ? accessories.filter(
        (item) => item && (item.image_url || item?.accessory?.image_url)
      )
    : [];

  return (
    <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl border border-white/20 bg-black/10 shadow-lg sm:h-40 sm:w-40">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Avatar preview"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-sm text-white/70">
          {placeholder || "Select an avatar to preview"}
        </div>
      )}

      {layers.map((item) => {
        const imageUrl = item.image_url || item.accessory?.image_url;
        if (!imageUrl) return null;

        const slot =
          item.slot || item.category || item.accessory?.category || "accessory";
        const slotStyle =
          ACCESSORY_SLOT_STYLES[slot] || ACCESSORY_SLOT_STYLES.accessory;
        const slotClass = slotStyle.className || "";
        const baseTransform = slotStyle.baseTransform || "";
        const metadata = item.metadata || item.accessory?.metadata || {};

        return (
          <DraggableAccessory
            key={`${item.accessory_id || item.id}-${slot}`}
            item={item}
            slotClass={slotClass}
            baseTransform={baseTransform}
            initialMetadata={metadata}
            isEditMode={isEditMode}
            onPositionChange={(newMeta) =>
              onAccessoryPositionChange?.(item.accessory_id || item.id, newMeta)
            }
          />
        );
      })}
    </div>
  );
}
function Avatars() {
  const { t } = useTranslation("common");
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [currentlyAnimatingId, setCurrentlyAnimatingId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempScales, setTempScales] = useState({});
  const [unlockModalAccessory, setUnlockModalAccessory] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: accessoriesCatalog = [], isPending: isAccessoriesLoading } =
    useAccessoriesList();

  const { data: ownedAccessories = [], isPending: isOwnedAccessoriesLoading } =
    useOwnedAccessories();

  const { data: pointsBalance, isPending: isPointBalanceLoading } =
    usePointBalance();

  const purchaseAccessoryMutation = usePurchaseAccessory({
    onSuccess: () => {
      toast.success(t("avatars.shop.purchaseSuccess"));
    },
    onError: (error) => {
      toast.error(error?.message || t("common.error"));
    },
  });

  const equipAccessoryMutation = useEquipAccessory({
    onSuccess: () => {
      toast.success(t("avatars.shop.equipSuccess"));
    },
    onError: (error) => {
      toast.error(error?.message || t("common.error"));
    },
  });

  const unequipAccessoryMutation = useUnequipAccessory({
    onSuccess: () => {
      toast.success(t("avatars.shop.unequipSuccess"));
    },
    onError: (error) => {
      toast.error(error?.message || t("common.error"));
    },
  });

  const updateMetadataMutation = useUpdateAccessoryMetadata({
    onSuccess: (data, variables) => {
      // Clear temp scale after successful save
      if (variables?.accessoryId) {
        setTempScales((prev) => {
          const newScales = { ...prev };
          delete newScales[variables.accessoryId];
          return newScales;
        });
      }
    },
    onError: (error) => {
      toast.error(error?.message || t("common.error"));
    },
  });

  const { data: profileData } = useUserProfile();

  const availablePoints = pointsBalance?.available ?? 0;
  const spentPoints = Math.max(0, -(pointsBalance?.ledgerDelta ?? 0));
  const earnedPoints = pointsBalance?.earned ?? 0;

  // Fetch games played count from students_score table
  const { data: gamesPlayedCount, isLoading: gamesPlayedLoading } =
    useGamesPlayed();

  // Calculate user progress for unlock requirements
  const userProgress = useMemo(() => {
    return {
      achievements: profileData?.achievements || [],
      gamesPlayed: gamesPlayedCount || 0,
      totalPoints: pointsBalance?.earned || 0,
      currentStreak: profileData?.current_streak || 0,
      perfectGames: profileData?.perfect_games || 0,
      level: profileData?.level || 1,
    };
  }, [profileData, pointsBalance, gamesPlayedCount]);

  // Group accessories by category
  const accessoriesByCategory = useMemo(
    () => groupAccessoriesByCategory(accessoriesCatalog),
    [accessoriesCatalog]
  );

  const ownedAccessoryMap = useMemo(() => {
    const map = new Map();
    (ownedAccessories || []).forEach((item) => {
      map.set(item.accessory_id, item);
    });
    return map;
  }, [ownedAccessories]);

  const equippedAccessories = useMemo(
    () => (ownedAccessories || []).filter((item) => item.is_equipped),
    [ownedAccessories]
  );

  const previewAccessories = useMemo(
    () =>
      equippedAccessories.map((item) => {
        const baseMetadata = item.accessory?.metadata || {};
        const customMetadata = item.custom_metadata || {};
        // Apply temp scale if it exists, otherwise use saved scale
        const tempScale = tempScales[item.accessory_id];
        const finalMetadata = { ...baseMetadata, ...customMetadata };
        if (tempScale !== undefined) {
          finalMetadata.scale = tempScale;
        }
        // Merge: custom metadata overrides base metadata
        return {
          ...item,
          image_url: item.accessory?.image_url || item.image_url,
          category: item.accessory?.category,
          metadata: finalMetadata,
        };
      }),
    [equippedAccessories, tempScales]
  );

  const previewAvatar = selectedAvatar || profileData?.avatars || null;

  const {
    isPending,
    data: avatars,
    error,
  } = useQuery({
    queryKey: ["avatars"],
    queryFn: getAvatar,
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

  const handlePurchaseAccessory = (accessory) => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    purchaseAccessoryMutation.mutate({
      accessoryId: accessory.id,
      slotOverride: accessory.category,
      userId: user.id,
    });
  };

  const handleEquipAccessory = (ownership) => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    equipAccessoryMutation.mutate({
      accessoryId: ownership.accessory_id,
      slot: ownership.slot || ownership.accessory?.category,
      userId: user.id,
    });
  };

  const handleUnequipAccessory = (ownership) => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    unequipAccessoryMutation.mutate({
      accessoryId: ownership.accessory_id,
      userId: user.id,
    });
  };

  const handleAccessoryPositionChange = (accessoryId, newMetadata) => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    // Auto-save on drag end - save offsetX, offsetY, and scale
    updateMetadataMutation.mutate({
      accessoryId,
      customMetadata: {
        offsetX: Math.round(newMetadata.offsetX || 0),
        offsetY: Math.round(newMetadata.offsetY || 0),
        scale: newMetadata.scale || 1,
      },
    });
  };

  const handleShowUnlockRequirements = (accessory) => {
    setUnlockModalAccessory(accessory);
  };

  const handleRefreshPoints = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries(["point-balance", user?.id]),
      queryClient.invalidateQueries(["total-points", user?.id]),
      queryClient.invalidateQueries(["student-scores", user?.id]),
      queryClient.invalidateQueries(["earned-achievements", user?.id]),
    ]);
    // Small delay for UX
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAccessoryScaleChange = (accessoryId, newScale) => {
    // Update local state immediately for smooth UI
    setTempScales((prev) => ({
      ...prev,
      [accessoryId]: newScale,
    }));
  };

  const handleAccessoryScaleSave = (accessoryId, newScale) => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    // Find the current accessory to preserve its position
    const accessory = equippedAccessories.find(
      (item) => item.accessory_id === accessoryId
    );
    const currentCustomMetadata = accessory?.custom_metadata || {};

    // Save scale along with existing position
    // Temp scale will be cleared in mutation's onSuccess
    updateMetadataMutation.mutate({
      accessoryId,
      customMetadata: {
        offsetX: currentCustomMetadata.offsetX || 0,
        offsetY: currentCustomMetadata.offsetY || 0,
        scale: newScale,
      },
    });
  };

  if (isPending) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-4 my-4 space-y-6 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
      <BackButton to="/settings" name={t("navigation.links.settings")} />

      <h2 className="text-center text-xl font-semibold text-white">
        {t("avatars.title")}
      </h2>

      {/* Avatar Grid - Smaller size to fit in one row */}
      <div className="flex flex-wrap justify-center gap-3 px-2">
        {avatars.map((avatar) => (
          <div key={avatar.id} className="h-20 w-20 sm:h-24 sm:w-24">
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
        <div className="mt-6 space-y-4 rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          {/* Composer Name and Years */}
          <div className="space-y-1 text-center">
            <h1 className="font-rounded text-3xl font-bold text-white md:text-4xl">
              {getComposerFullName(selectedAvatar)}
            </h1>
            <p className="font-rounded text-lg font-semibold text-white/80 md:text-xl">
              {getComposerLifeYears(selectedAvatar)}
            </p>
          </div>

          {/* Description */}
          <div className="rounded-lg bg-white/5 p-4">
            <p className="font-rounded text-base leading-relaxed text-white/90 md:text-lg">
              {getComposerDescription(selectedAvatar)}
            </p>
          </div>

          {/* Fun Fact */}
          <div className="rounded-lg border border-purple-300/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4">
            <p className="font-rounded text-base font-semibold leading-relaxed text-white md:text-lg">
              ✨ {t("avatars.funFact")}:
            </p>
            <p className="font-rounded text-base font-semibold leading-relaxed text-white md:text-lg">
              {getComposerFunFact(selectedAvatar)}
            </p>
          </div>
        </div>
      )}

      {/* Simple selection status for non-composer avatars */}
      {selectedAvatar && !isComposerAvatar(selectedAvatar) && (
        <div className="mt-6 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <img
              src={getAvatarImageSource(selectedAvatar)}
              alt="Selected Avatar"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
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

      {/* Avatar Preview + Points */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex w-full items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {t("avatars.shop.previewTitle")}
            </h3>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                isEditMode
                  ? "bg-amber-500 text-white hover:bg-amber-400"
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              }`}
            >
              {isEditMode
                ? t("avatars.customization.doneEditing")
                : t("avatars.customization.editPositions")}
            </button>
          </div>
          <AvatarPreview
            avatar={previewAvatar}
            accessories={previewAccessories}
            placeholder={t("avatars.shop.previewPlaceholder")}
            isEditMode={isEditMode}
            onAccessoryPositionChange={handleAccessoryPositionChange}
          />
          {isEditMode ? (
            <div className="w-full space-y-3">
              <p className="text-center text-sm text-white/70">
                {t("avatars.customization.dragHint")}
              </p>
              {equippedAccessories.length > 0 && (
                <div className="space-y-2 rounded-lg bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {t("avatars.customization.scaleControls")}
                  </p>
                  {equippedAccessories.map((item) => {
                    const customMetadata = item.custom_metadata || {};
                    const baseMetadata = item.accessory?.metadata || {};
                    const savedScale =
                      customMetadata.scale ?? baseMetadata.scale ?? 1;
                    const currentScale =
                      tempScales[item.accessory_id] ?? savedScale;

                    return (
                      <div
                        key={item.accessory_id}
                        className="flex items-center gap-3"
                      >
                        <label className="min-w-0 flex-1 text-xs text-white/80">
                          {item.accessory?.name ||
                            t("avatars.shop.unknownAccessory")}
                        </label>
                        <input
                          type="range"
                          min="0.2"
                          max="2"
                          step="0.01"
                          value={currentScale}
                          onChange={(e) =>
                            handleAccessoryScaleChange(
                              item.accessory_id,
                              parseFloat(e.target.value)
                            )
                          }
                          onMouseUp={(e) =>
                            handleAccessoryScaleSave(
                              item.accessory_id,
                              parseFloat(e.target.value)
                            )
                          }
                          onTouchEnd={(e) =>
                            handleAccessoryScaleSave(
                              item.accessory_id,
                              parseFloat(e.target.value)
                            )
                          }
                          className="h-1 w-24 cursor-pointer appearance-none rounded-lg bg-white/20"
                          style={{
                            background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${
                              ((currentScale - 0.2) / (2 - 0.2)) * 100
                            }%, rgb(255 255 255 / 0.2) ${
                              ((currentScale - 0.2) / (2 - 0.2)) * 100
                            }%, rgb(255 255 255 / 0.2) 100%)`,
                          }}
                        />
                        <span className="min-w-[2.5rem] text-right text-xs text-white/70">
                          {Math.round(currentScale * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-sm text-white/70">
              {t("avatars.shop.previewDescription")}
            </p>
          )}
        </div>
        <div className="flex flex-col justify-between rounded-lg border border-white/30 bg-gradient-to-br from-violet-500/30 to-indigo-500/30 p-4 backdrop-blur">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">
                {t("avatars.shop.availableToSpend")}
              </p>
              <button
                onClick={handleRefreshPoints}
                disabled={isRefreshing || isPointBalanceLoading}
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh points"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            {isPointBalanceLoading ? (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-white">
                  {formatPoints(availablePoints)} {t("common.points")}
                </p>
                <div className="mt-2 flex flex-col gap-0.5 text-xs text-white/60">
                  <span>
                    {t("avatars.shop.totalEarned")}:{" "}
                    {formatPoints(earnedPoints)}
                  </span>
                  <span>
                    {t("avatars.shop.totalSpent")}: {formatPoints(spentPoints)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Owned accessories */}
      <section className="space-y-4 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t("avatars.shop.ownedTitle")}
            </h3>
            <p className="text-sm text-white/70">
              {t("avatars.shop.ownedDescription")}
            </p>
          </div>
          <span className="text-sm text-white/80">
            {t("avatars.shop.availablePoints", {
              points: formatPoints(availablePoints),
            })}
          </span>
        </div>

        {isOwnedAccessoriesLoading ? (
          <div className="flex items-center justify-center py-8 text-white/80">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            {t("common.loading")}
          </div>
        ) : ownedAccessories.length === 0 ? (
          <div className="py-6 text-center text-white/70">
            {t("avatars.shop.ownedEmpty")}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ownedAccessories.map((ownership) => {
              const accessory = ownership.accessory;
              const isEquipped = ownership.is_equipped;
              const isActing =
                (equipAccessoryMutation.isPending &&
                  equipAccessoryMutation.variables?.accessoryId ===
                    ownership.accessory_id) ||
                (unequipAccessoryMutation.isPending &&
                  unequipAccessoryMutation.variables?.accessoryId ===
                    ownership.accessory_id);

              return (
                <div
                  key={ownership.id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <img
                    src={accessory?.image_url}
                    alt={accessory?.name || "Accessory"}
                    className="h-16 w-16 rounded-lg border border-white/20 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {accessory?.name || t("avatars.shop.unknownAccessory")}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      {accessory?.category}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {isEquipped && (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">
                          {t("avatars.shop.equipped")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      isEquipped
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-indigo-500 text-white hover:bg-indigo-400"
                    } ${isActing ? "cursor-wait opacity-70" : ""}`}
                    onClick={() =>
                      isEquipped
                        ? handleUnequipAccessory(ownership)
                        : handleEquipAccessory(ownership)
                    }
                    disabled={isActing}
                  >
                    {isEquipped
                      ? t("avatars.shop.unequip")
                      : t("avatars.shop.equip")}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Accessories Shop */}
      <section className="space-y-6 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t("avatars.shop.title")}
            </h3>
            <p className="text-sm text-white/70">
              {t("avatars.shop.subtitle")}
            </p>
          </div>
        </div>

        {isAccessoriesLoading ? (
          <div className="flex items-center justify-center py-8 text-white/80">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            {t("common.loading")}
          </div>
        ) : accessoriesCatalog.length === 0 ? (
          <div className="py-6 text-center text-white/70">
            {t("avatars.shop.shopEmpty")}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(accessoriesByCategory).map(
              ([category, accessories]) => {
                const categoryInfo =
                  ACCESSORY_CATEGORIES[category] || ACCESSORY_CATEGORIES.other;

                return (
                  <div key={category} className="space-y-3">
                    <h4 className="flex items-center gap-2 text-base font-semibold text-white">
                      <span className="text-xl">{categoryInfo.icon}</span>
                      <span>{categoryInfo.name}</span>
                      <span className="text-xs font-normal text-white/60">
                        ({accessories.length})
                      </span>
                    </h4>
                    <div className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 flex gap-4 overflow-x-auto pb-2">
                      {accessories.map((accessory) => {
                        const ownedRecord = ownedAccessoryMap.get(accessory.id);
                        const isOwned = Boolean(ownedRecord);
                        const isEquipped = ownedRecord?.is_equipped;
                        const insufficientPoints =
                          availablePoints < accessory.price_points;
                        const isPurchasing =
                          purchaseAccessoryMutation.isPending &&
                          purchaseAccessoryMutation.variables?.accessoryId ===
                            accessory.id;

                        const unlockStatus = checkAccessoryUnlock(
                          accessory,
                          userProgress
                        );
                        const isLocked = !unlockStatus.unlocked;

                        return (
                          <div
                            key={accessory.id}
                            className={`flex w-44 flex-shrink-0 flex-col gap-2 rounded-xl border border-white/10 p-3 ${
                              isLocked
                                ? "bg-black/30 opacity-75"
                                : "bg-black/15"
                            }`}
                          >
                            <div className="relative">
                              <img
                                src={accessory.image_url}
                                alt={accessory.name}
                                className={`h-24 w-full rounded-lg border border-white/10 object-cover ${
                                  isLocked ? "grayscale filter" : ""
                                }`}
                              />
                              {isLocked && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                                  <Lock className="h-8 w-8 text-white/80" />
                                </div>
                              )}
                              {isOwned && !isLocked && (
                                <span className="absolute right-1 top-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-gray-900">
                                  {isEquipped
                                    ? t("avatars.shop.equipped")
                                    : t("avatars.shop.purchased")}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">
                                {accessory.name}
                              </p>
                              {isLocked && unlockStatus.requirement && (
                                <p className="text-xs text-amber-300/90">
                                  🔒 {unlockStatus.requirement}
                                </p>
                              )}
                              {isLocked && unlockStatus.progress > 0 && (
                                <div className="mt-1">
                                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                                    <div
                                      className="h-full bg-amber-400 transition-all"
                                      style={{
                                        width: `${unlockStatus.progress * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="mt-0.5 text-xs text-white/60">
                                    {Math.round(unlockStatus.progress * 100)}%
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-white/80">
                              <span>
                                {formatPoints(accessory.price_points)}{" "}
                                {t("common.points")}
                              </span>
                              {isOwned && (
                                <span className="text-emerald-300">
                                  {t("avatars.shop.ownedLabel")}
                                </span>
                              )}
                            </div>
                            <button
                              className={`w-full rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                isLocked
                                  ? "cursor-pointer bg-amber-600/30 text-amber-200 hover:bg-amber-600/40"
                                  : isOwned
                                    ? "cursor-default bg-white/10 text-white"
                                    : insufficientPoints
                                      ? "bg-gray-500/30 cursor-not-allowed text-gray-200"
                                      : "bg-indigo-500 text-white hover:bg-indigo-400"
                              } ${isPurchasing ? "cursor-wait opacity-70" : ""}`}
                              disabled={
                                (!isLocked && isOwned) ||
                                insufficientPoints ||
                                isPurchasing
                              }
                              onClick={() =>
                                isLocked
                                  ? handleShowUnlockRequirements(accessory)
                                  : handlePurchaseAccessory(accessory)
                              }
                            >
                              {isLocked
                                ? `🔒 ${t("avatars.shop.howToUnlock")}`
                                : isOwned
                                  ? t("avatars.shop.purchased")
                                  : insufficientPoints
                                    ? t("avatars.shop.notEnoughPoints")
                                    : t("avatars.shop.purchase", {
                                        points: formatPoints(
                                          accessory.price_points
                                        ),
                                      })}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* Unlock Requirements Modal */}
      {unlockModalAccessory && (
        <UnlockRequirementModal
          isOpen={!!unlockModalAccessory}
          onClose={() => setUnlockModalAccessory(null)}
          accessory={unlockModalAccessory}
          unlockStatus={checkAccessoryUnlock(
            unlockModalAccessory,
            userProgress
          )}
          userProgress={userProgress}
        />
      )}
    </div>
  );
}

export default Avatars;
