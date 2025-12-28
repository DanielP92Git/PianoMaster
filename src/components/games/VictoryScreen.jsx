import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useStreakWithAchievements } from "../../hooks/useStreakWithAchievements";
import { useTotalPoints } from "../../hooks/useTotalPoints";
import { useAccessoriesList } from "../../hooks/useAccessories";
import { useGamesPlayed } from "../../hooks/useGamesPlayed";
import { useUserProfile } from "../../hooks/useUserProfile";
import { usePointBalance } from "../../hooks/useAccessories";
import { useAccessoryUnlockDetection } from "../../hooks/useAccessoryUnlockDetection";
import { useUser } from "../../features/authentication/useUser";
// eslint-disable-next-line no-unused-vars
import AccessoryUnlockModal from "../ui/AccessoryUnlockModal";
import { useTranslation } from "react-i18next";
const SHOWN_UNLOCKS_VERSION = 2;

const useCountUp = (start, end, duration = 1400, shouldAnimate = true) => {
  const [value, setValue] = useState(() => {
    if (!shouldAnimate) {
      return end ?? start ?? 0;
    }
    return start ?? 0;
  });

  useEffect(() => {
    if (start === undefined || end === undefined) return;
    if (!shouldAnimate || start === end) {
      setValue(end);
      return;
    }
    let frame;
    const startTime = performance.now();
    const change = end - start;

    const runFrame = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + change * easedProgress));

      if (progress < 1) {
        frame = requestAnimationFrame(runFrame);
      }
    };

    frame = requestAnimationFrame(runFrame);
    return () => cancelAnimationFrame(frame);
  }, [start, end, duration, shouldAnimate]);

  return value;
};

const VictoryScreen = ({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
  onExit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const scorePercentage = (score / totalPossibleScore) * 100;
  const timeUsed = timedMode ? initialTime - timeRemaining : null;
  const updateStreakWithAchievements = useStreakWithAchievements();
  const { data: totalPointsData } = useTotalPoints({
    staleTime: 0,
    refetchOnMount: "always",
    keepPreviousData: false,
  });
  const [achievementBonus, setAchievementBonus] = useState(0);
  const [shownUnlocksLoaded, setShownUnlocksLoaded] = useState(false);
  const predictedPointsEarned = Math.max(score, 0) + achievementBonus;

  const finalTotalPoints = totalPointsData?.totalPoints ?? 0;
  const storageKey = useMemo(
    () => (user?.id ? `shown-accessory-unlocks-${user.id}` : null),
    [user?.id]
  );
  const shownUnlocksRef = useRef(new Set());
  const cachedPreTotal =
    user && queryClient.getQueryData(["pre-total-points", user.id]);

  const basePoints = useMemo(() => {
    if (typeof cachedPreTotal === "number") {
      return cachedPreTotal;
    }
    return Math.max(finalTotalPoints - predictedPointsEarned, 0);
  }, [cachedPreTotal, finalTotalPoints, predictedPointsEarned]);

  const [hasAnimated, setHasAnimated] = useState(false);
  const shouldAnimate =
    !hasAnimated &&
    typeof cachedPreTotal === "number" &&
    finalTotalPoints > basePoints;

  useEffect(() => {
    if (shouldAnimate) {
      setHasAnimated(true);
    }
  }, [shouldAnimate]);

  const pointsTarget = finalTotalPoints || basePoints;
  const animatedTotal = useCountUp(
    basePoints,
    pointsTarget,
    1400,
    shouldAnimate
  );

  const actualGain = Math.max(
    finalTotalPoints > basePoints
      ? finalTotalPoints - basePoints
      : predictedPointsEarned,
    0
  );

  useEffect(() => {
    if (
      user &&
      cachedPreTotal !== null &&
      cachedPreTotal !== undefined &&
      typeof cachedPreTotal === "number"
    ) {
      queryClient.setQueryData(["pre-total-points", user.id], null);
    }
  }, [user, cachedPreTotal, queryClient]);

  const refreshPointQueries = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student-scores", user.id] }),
      queryClient.invalidateQueries({
        queryKey: ["earned-achievements", user.id],
      }),
      queryClient.invalidateQueries({ queryKey: ["total-points", user.id] }),
    ]);
  }, [queryClient, user?.id]);

  const handleExit = useCallback(() => {
    refreshPointQueries();
    if (onExit) {
      onExit();
    } else {
      navigate("/practice-modes");
    }
  }, [refreshPointQueries, onExit, navigate]);

  const handlePlayAgain = useCallback(() => {
    refreshPointQueries();
    onReset?.();
  }, [refreshPointQueries, onReset]);

  const handleGoToDashboard = useCallback(() => {
    refreshPointQueries();
    navigate("/");
  }, [navigate, refreshPointQueries]);

  // Accessory unlock detection
  const { data: accessories } = useAccessoriesList();
  const { data: gamesPlayedCount } = useGamesPlayed();
  const { data: profileData } = useUserProfile();
  const { data: pointsBalance } = usePointBalance();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedAccessories, setUnlockedAccessories] = useState([]);

  // Capture initial progress state (before game completion)
  const initialProgressRef = useRef(null);
  const lastScoreRef = useRef(score);
  const setBaselineProgress = useCallback((progress) => {
    if (!progress) return;
    initialProgressRef.current = {
      ...progress,
      achievements: [...(progress.achievements || [])],
    };
  }, []);

  useEffect(() => {
    if (lastScoreRef.current !== score) {
      lastScoreRef.current = score;
      initialProgressRef.current = null;
    }
  }, [score]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") {
      setShownUnlocksLoaded(true);
      return;
    }

    try {
      const storedPayload = window.localStorage.getItem(storageKey);
      if (storedPayload) {
        const parsed = JSON.parse(storedPayload);
        if (
          parsed &&
          parsed.version === SHOWN_UNLOCKS_VERSION &&
          Array.isArray(parsed.ids)
        ) {
          // Normalize IDs to strings to avoid type mismatch (number vs string) across sessions/builds.
          shownUnlocksRef.current = new Set(parsed.ids.map((id) => String(id)));
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch (err) {
      console.warn("Failed to load shown accessory unlocks:", err);
      shownUnlocksRef.current = new Set();
    } finally {
      setShownUnlocksLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!initialProgressRef.current && gamesPlayedCount !== undefined) {
      setBaselineProgress({
        achievements: profileData?.achievements || [],
        gamesPlayed: Math.max(0, gamesPlayedCount - 1), // Subtract the just-completed game
        totalPoints: (pointsBalance?.earned || 0) - predictedPointsEarned,
        currentStreak: profileData?.current_streak || 0,
        perfectGames: profileData?.perfect_games || 0,
        level: profileData?.level || 1,
      });
    }
  }, [
    gamesPlayedCount,
    profileData,
    pointsBalance,
    predictedPointsEarned,
    setBaselineProgress,
  ]);

  // Current progress state (after game completion)
  const currentProgress = useMemo(() => {
    return {
      achievements: profileData?.achievements || [],
      gamesPlayed: gamesPlayedCount || 0,
      totalPoints: pointsBalance?.earned || 0,
      currentStreak: profileData?.current_streak || 0,
      perfectGames: profileData?.perfect_games || 0,
      level: profileData?.level || 1,
    };
  }, [profileData, pointsBalance, gamesPlayedCount]);

  // Detect newly unlocked accessories
  const newlyUnlocked = useAccessoryUnlockDetection(
    accessories,
    initialProgressRef.current,
    currentProgress
  );

  // Note: Query invalidation is handled by useScores mutation

  useEffect(() => {
    if (scorePercentage >= 80) {
      updateStreakWithAchievements.mutate(undefined, {
        onSuccess: ({ newAchievements }) => {
          const bonus = newAchievements?.reduce(
            (sum, achievement) => sum + (achievement?.points || 0),
            0
          );
          if (bonus) {
            setAchievementBonus(bonus);
          }
        },
      });
    }
  }, [scorePercentage, updateStreakWithAchievements]);

  // Check for newly unlocked accessories after stats update
  useEffect(() => {
    if (!shownUnlocksLoaded || !newlyUnlocked || newlyUnlocked.length === 0) {
      return;
    }

    const unseenUnlocks = newlyUnlocked.filter((accessory) => {
      if (!accessory?.id) return false;
      return !shownUnlocksRef.current.has(String(accessory.id));
    });

    if (unseenUnlocks.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setUnlockedAccessories(unseenUnlocks);
      setShowUnlockModal(true);
      setBaselineProgress(currentProgress);

      unseenUnlocks.forEach((accessory) => {
        shownUnlocksRef.current.add(String(accessory.id));
      });

      if (storageKey && typeof window !== "undefined") {
        const trimmedIds = Array.from(shownUnlocksRef.current).slice(-50);
        const payload = {
          version: SHOWN_UNLOCKS_VERSION,
          timestamp: Date.now(),
          ids: trimmedIds,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      }

      queryClient.invalidateQueries({ queryKey: ["accessories"] });
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: ["user-accessories", user.id],
        });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    newlyUnlocked,
    queryClient,
    shownUnlocksLoaded,
    storageKey,
    user?.id,
    currentProgress,
    setBaselineProgress,
  ]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-2 sm:p-4">
      {/* Main content container - fits within viewport */}
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Video avatar */}
        <div className="relative z-10 -mb-2 sm:-mb-3">
          <div
            className="overflow-hidden rounded-2xl bg-white shadow-xl"
            style={{
              width: "clamp(130px, 15vh, 160px)",
              height: "clamp(130px, 15vh, 160px)",
            }}
          >
            <video
              src="/avatars/mozart_happy.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label="Mozart celebration animation"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="w-full space-y-1.5 px-2 pt-4 text-center sm:space-y-2 sm:px-4 sm:pt-2">
          {/* Victory title */}
          <h2 className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            Victory!
          </h2>

          {/* Score display */}
          <p className="text-sm text-white/90 sm:text-base">
            Final Score: {score}/{totalPossibleScore}
          </p>

          {/* Timed mode info */}
          {timedMode && timeUsed !== null && (
            <p className="text-xs text-white/70">
              Time used: {Math.floor(timeUsed / 60)}:
              {(timeUsed % 60).toString().padStart(2, "0")}
            </p>
          )}

          {/* Points celebration */}
          {totalPointsData && actualGain > 0 && (
            <div className="relative mt-1 sm:mt-2">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/40 via-pink-200/30 to-indigo-200/40 opacity-70 blur-lg" />
              <div className="relative flex items-center justify-between gap-2 rounded-xl border-white/60 bg-white/90 px-3 py-2 shadow-lg sm:px-4 sm:py-2.5">
                <div className="text-left">
                  <p className="text-[10px] text-gray-500 sm:text-xs">
                    Points earned
                  </p>
                  <p className="text-sm font-bold text-emerald-500 sm:text-base">
                    +{actualGain.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs">
                    Total Points
                  </p>
                  <p className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                    {animatedTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1 sm:gap-3 sm:pt-2">
            <button
              onClick={handleExit}
              className="flex-1 transform rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:from-gray-200 hover:to-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:py-2.5 sm:text-base"
            >
              {t("common.toGamesMode")}
            </button>
            <button
              onClick={handleGoToDashboard}
              className="flex-1 transform rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-amber-600 hover:to-orange-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 sm:py-2.5 sm:text-base"
            >
              {t("common.dashboard")}
            </button>
            <button
              onClick={handlePlayAgain}
              className="flex-1 transform rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:py-2.5 sm:text-base"
            >
              {t("common.playAgain")}
            </button>
          </div>
        </div>
      </div>

      {/* Accessory unlock modal */}
      {showUnlockModal && unlockedAccessories.length > 0 && (
        <AccessoryUnlockModal
          accessories={unlockedAccessories}
          onClose={() => setShowUnlockModal(false)}
          onEquip={() => {
            if (user?.id) {
              queryClient.invalidateQueries({
                queryKey: ["user-accessories", user.id],
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default VictoryScreen;
