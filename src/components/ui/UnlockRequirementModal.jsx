import { X, Lock, Target, TrendingUp, Flame, Star, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const UnlockRequirementModal = ({
  isOpen,
  onClose,
  accessory,
  unlockStatus,
  userProgress,
}) => {
  const { t } = useTranslation("common");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Simply prevent body scroll without shifting position
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Calculate scrollbar width to prevent content shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  if (!isOpen || !accessory) return null;

  const requirement = accessory.unlock_requirement;
  if (!requirement) return null;

  const getRequirementDetails = () => {
    const { type } = requirement;

    switch (type) {
      case "achievement": {
        const achievementName = requirement.name || requirement.id;
        const isUnlocked = unlockStatus.unlocked;
        return {
          icon: <Trophy className="h-6 w-6 text-amber-400 sm:h-7 sm:w-7" />,
          title: t("avatars.unlockModal.achievement"),
          description: t("avatars.unlockModal.achievementDescription", {
            name: achievementName,
          }),
          progress: unlockStatus.progress,
          current: isUnlocked ? 1 : 0,
          required: 1,
          tip: isUnlocked
            ? t("avatars.unlockModal.achievementCompleted", {
                name: achievementName,
              })
            : t("avatars.unlockModal.achievementTipDetailed", {
                name: achievementName,
              }),
        };
      }

      case "games_played": {
        const required = requirement.count;
        const current = userProgress.gamesPlayed || 0;
        const remaining = Math.max(0, required - current);
        return {
          icon: <Target className="h-6 w-6 text-blue-400 sm:h-7 sm:w-7" />,
          title: t("avatars.unlockModal.gamesPlayed"),
          description: t("avatars.unlockModal.gamesPlayedDescription", {
            count: required,
          }),
          progress: unlockStatus.progress,
          current: Math.min(current, required),
          required,
          tip:
            remaining > 0
              ? t("avatars.unlockModal.gamesPlayedTipDetailed", {
                  count: remaining,
                })
              : t("avatars.unlockModal.gamesPlayedCompleted", {
                  count: required,
                }),
        };
      }

      case "points_earned": {
        const required = requirement.amount;
        const current = userProgress.totalPoints || 0;
        const remaining = Math.max(0, required - current);
        return {
          icon: <TrendingUp className="h-6 w-6 text-green-400 sm:h-7 sm:w-7" />,
          title: t("avatars.unlockModal.pointsEarned"),
          description: t("avatars.unlockModal.pointsEarnedDescription", {
            amount: required.toLocaleString(),
          }),
          progress: unlockStatus.progress,
          current: Math.min(current, required),
          required,
          tip:
            remaining > 0
              ? t("avatars.unlockModal.pointsEarnedTipDetailed", {
                  amount: remaining.toLocaleString(),
                })
              : t("avatars.unlockModal.pointsEarnedCompleted", {
                  amount: required.toLocaleString(),
                }),
        };
      }

      case "streak": {
        const required = requirement.days;
        const current = userProgress.currentStreak || 0;
        const remaining = Math.max(0, required - current);
        return {
          icon: <Flame className="h-6 w-6 text-orange-400 sm:h-7 sm:w-7" />,
          title: t("avatars.unlockModal.streak"),
          description: t("avatars.unlockModal.streakDescription", {
            days: required,
          }),
          progress: unlockStatus.progress,
          current: Math.min(current, required),
          required,
          tip:
            remaining > 0
              ? t("avatars.unlockModal.streakTipDetailed", { days: remaining })
              : t("avatars.unlockModal.streakCompleted", { days: required }),
        };
      }

      case "perfect_games": {
        const required = requirement.count;
        const current = userProgress.perfectGames || 0;
        const remaining = Math.max(0, required - current);
        return {
          icon: <Star className="h-6 w-6 text-yellow-400 sm:h-7 sm:w-7" />,
          title: t("avatars.unlockModal.perfectGames"),
          description: t("avatars.unlockModal.perfectGamesDescription", {
            count: required,
          }),
          progress: unlockStatus.progress,
          current: Math.min(current, required),
          required,
          tip:
            remaining > 0
              ? t("avatars.unlockModal.perfectGamesTipDetailed", {
                  count: remaining,
                })
              : t("avatars.unlockModal.perfectGamesCompleted", {
                  count: required,
                }),
        };
      }

      case "level": {
        const required = requirement.level;
        const current = userProgress.level || 1;
        const remaining = Math.max(0, required - current);
        return {
          icon: <Trophy className="h-6 w-6 text-purple-400 sm:h-7 sm:w-7" />,
          title: t("avatars.unlockModal.level"),
          description: t("avatars.unlockModal.levelDescription", {
            level: required,
          }),
          progress: unlockStatus.progress,
          current: Math.min(current, required),
          required,
          tip:
            remaining > 0
              ? t("avatars.unlockModal.levelTipDetailed", { levels: remaining })
              : t("avatars.unlockModal.levelCompleted", { level: required }),
        };
      }

      default:
        return null;
    }
  };

  const details = getRequirementDetails();
  if (!details) return null;

  // Use floor to avoid showing 100% when not complete, with 1 decimal place
  const progressPercent = Math.floor(details.progress * 1000) / 10;

  const modalContent = (
    <div
      className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      style={{ overflow: "hidden" }}
    >
      <div
        className="scrollbar-thin relative w-full max-w-md overflow-y-auto rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-2xl sm:max-w-lg sm:p-5 landscape:max-w-3xl"
        style={{ maxHeight: "92svh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white sm:right-4 sm:top-4 sm:h-8 sm:w-8"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>

        {/* Header */}
        <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 sm:h-14 sm:w-14 sm:rounded-xl">
            <Lock className="h-6 w-6 text-amber-400 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white sm:text-xl">
              {accessory.name}
            </h3>
            <p className="text-xs text-white/60 sm:text-sm">
              {t("avatars.unlockModal.locked")}
            </p>
          </div>
        </div>

        {/* Body: stack on portrait, 2-col on landscape (better for forced-landscape phones) */}
        <div className="space-y-3 landscape:grid landscape:grid-cols-[220px_1fr] landscape:items-start landscape:gap-4 landscape:space-y-0">
          {/* Accessory preview */}
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20 sm:rounded-xl landscape:self-start landscape:h-[min(240px,60svh)]">
            <img
              src={accessory.image_url}
              alt={accessory.name}
              className="h-24 w-full object-contain grayscale filter sm:h-28 landscape:h-full"
            />
          </div>

          {/* Requirement details */}
          <div className="space-y-3 landscape:space-y-2">
            <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-3 sm:gap-3 sm:rounded-xl">
              {details.icon}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white sm:text-sm">
                  {details.title}
                </p>
                <p className="truncate text-xs text-white/70">
                  {details.description}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-white/70">
                  {t("avatars.unlockModal.progress")}
                </span>
                <span className="font-semibold text-white">
                  {details.current} / {details.required}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 sm:h-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-center text-xs font-semibold text-amber-400">
                {progressPercent}% {t("avatars.unlockModal.complete")}
              </p>
            </div>

            {/* Tip */}
            <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 sm:rounded-xl">
              <p className="text-xs text-white/80 sm:text-sm">
                💡{" "}
                <span className="font-semibold">
                  {t("avatars.unlockModal.tip")}:
                </span>{" "}
                {details.tip}
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-600 sm:rounded-xl sm:py-3 sm:text-base"
            >
              {t("avatars.unlockModal.gotIt")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UnlockRequirementModal;
