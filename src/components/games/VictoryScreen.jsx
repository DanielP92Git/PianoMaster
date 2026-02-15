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
import { updateNodeProgress, getNodeProgress, updateExerciseProgress, getNextNodeInPath } from "../../services/skillProgressService";
import { awardXP, calculateSessionXP, getLevelProgress } from "../../utils/xpSystem";
import { getNodeById, EXERCISE_TYPES } from "../../data/skillTrail";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { determineCelebrationTier, getCelebrationConfig } from '../../utils/celebrationTiers';
import { getCelebrationMessage } from '../../utils/celebrationMessages';
import { ConfettiEffect } from '../celebrations/ConfettiEffect';
import { calculateScorePercentile, getPercentileMessage } from '../../services/scoreComparisonService';
import { hasLevelBeenCelebrated, markLevelCelebrated } from '../../utils/levelUpTracking';
import { BossUnlockModal } from '../celebrations/BossUnlockModal';
import { useBossUnlockTracking } from '../../hooks/useBossUnlockTracking';

import AccessoryUnlockModal from "../ui/AccessoryUnlockModal";
import RateLimitBanner from "../ui/RateLimitBanner";
import { useTranslation } from "react-i18next";
import { translateNodeName } from "../../utils/translateNodeName";
const SHOWN_UNLOCKS_VERSION = 2;

const useCountUp = (start, end, duration = 1400, shouldAnimate = true, reducedMotion = false) => {
  const [value, setValue] = useState(() => {
    if (reducedMotion || !shouldAnimate) {
      return end ?? start ?? 0;
    }
    return start ?? 0;
  });

  useEffect(() => {
    if (start === undefined || end === undefined) return;
    if (reducedMotion || !shouldAnimate || start === end) {
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
  }, [start, end, duration, shouldAnimate, reducedMotion]);

  return value;
};

/**
 * Calculate stars based on score percentage
 * @param {number} percentage - Score percentage (0-100)
 * @returns {number} Stars earned (0-3)
 */
const calculateStars = (percentage) => {
  if (percentage >= 95) return 3;
  if (percentage >= 80) return 2;
  if (percentage >= 60) return 1;
  return 0;
};

const VictoryScreen = ({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
  onExit,
  nodeId = null, // Optional: node ID if playing from trail
  exerciseIndex = null, // Optional: current exercise index (0-based)
  totalExercises = null, // Optional: total number of exercises in node
  exerciseType = null, // Optional: type of exercise (e.g., 'note_recognition')
  onNextExercise = null, // Optional: callback to navigate to next exercise
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { reducedMotion } = useAccessibility();
  const { shouldShow: shouldShowBossModal, markAsShown: markBossAsShown } = useBossUnlockTracking(user?.id, nodeId);
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
    shouldAnimate,
    reducedMotion
  );

  // Trail/XP system state (declared early because useCountUp below references xpData)
  const [xpData, setXpData] = useState(null);

  // XP count-up animation (1 second)
  const animatedXPGain = useCountUp(0, xpData?.totalXP || 0, 1000, !!xpData?.totalXP, reducedMotion);

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

  // Trail/XP system state
  const [stars, setStars] = useState(0);
  const [nodeData, setNodeData] = useState(null);
  const [isFirstComplete, setIsFirstComplete] = useState(false);
  const [exercisesRemaining, setExercisesRemaining] = useState(0);
  const [nodeComplete, setNodeComplete] = useState(false);
  const [nextNode, setNextNode] = useState(null);
  const [fetchingNextNode, setFetchingNextNode] = useState(false);
  // Track if we're still processing trail completion (show loading until done)
  const [isProcessingTrail, setIsProcessingTrail] = useState(!!nodeId);
  const hasProcessedTrail = useRef(false);
  const hasCalledStreakUpdate = useRef(false);

  // Celebration system state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBossModal, setShowBossModal] = useState(false);
  const [percentileMessage, setPercentileMessage] = useState(null);

  // Rate limiting state
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState(null);

  // Check if current user is a teacher (teachers bypass rate limiting)
  const isTeacher = user?.user_metadata?.role === 'teacher';

  // Celebration tier and messaging (derived from existing state)
  const celebrationData = useMemo(() => {
    const node = nodeId ? getNodeById(nodeId) : null;
    const isBoss = node?.isBoss || false;
    const nodeType = node?.nodeType || null;

    // For free play, calculate stars from score percentage
    const effectiveStars = nodeId ? stars : calculateStars(scorePercentage);

    const tier = determineCelebrationTier(
      effectiveStars,
      isBoss,
      xpData?.leveledUp || false,
      scorePercentage
    );
    const config = getCelebrationConfig(tier);
    const message = getCelebrationMessage(nodeType, effectiveStars, isBoss, t);

    return { tier, config, message, isBoss, nodeType, effectiveStars };
  }, [nodeId, stars, xpData?.leveledUp, scorePercentage, t]);

  // Mini XP progress bar data (after XP is awarded, shows level context)
  const levelProgressData = useMemo(() => {
    if (!xpData?.newTotalXP) return null;
    return getLevelProgress(xpData.newTotalXP);
  }, [xpData?.newTotalXP]);

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
    if (scorePercentage >= 80 && !hasCalledStreakUpdate.current) {
      hasCalledStreakUpdate.current = true;
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

  // Trail system: Calculate stars, update progress, and award XP
  useEffect(() => {
    const processTrailCompletion = async () => {
      // Prevent multiple executions
      if (hasProcessedTrail.current) return;
      if (!user?.id) return;

      // Calculate stars
      const earnedStars = calculateStars(scorePercentage);
      setStars(earnedStars);

      // If this is a trail node, update progress and award XP
      if (nodeId) {
        hasProcessedTrail.current = true; // Mark as processed

        try {
          // Get node data
          const node = getNodeById(nodeId);

          if (node) {
            // setNodeData(node); // Unused - kept for future features

            // Teachers skip rate limiting entirely
            const progressOptions = isTeacher ? { skipRateLimit: true } : {};

            // If exerciseIndex is provided, use exercise-level progress tracking
            if (exerciseIndex !== null && totalExercises !== null) {
              // Update exercise-level progress
              const result = await updateExerciseProgress(
                user.id,
                nodeId,
                exerciseIndex,
                exerciseType || node.exercises?.[exerciseIndex]?.type || 'unknown',
                earnedStars,
                Math.round(Math.min(scorePercentage, 100)),
                totalExercises,
                progressOptions
              );

              // Check if rate limited
              if (result.rateLimited) {
                setRateLimited(true);
                setRateLimitResetTime(result.resetTime);
                // Still show stars earned but don't save progress or award XP
                setExercisesRemaining(0);
                setNodeComplete(false);
                setIsProcessingTrail(false);
                return;
              }

              setExercisesRemaining(result.exercisesRemaining);
              setNodeComplete(result.nodeComplete);

              // Check if this was first completion of this exercise
              const isFirst = true; // For exercise-level, always treat as first for XP
              setIsFirstComplete(isFirst);

              // Only award XP when the entire node is complete
              if (result.nodeComplete) {
                const sessionData = {
                  score,
                  maxScore: totalPossibleScore,
                  nodeId,
                  isFirstComplete: true
                };
                const xpBreakdown = calculateSessionXP(sessionData);

                if (xpBreakdown.totalXP > 0) {
                  const xpResult = await awardXP(user.id, xpBreakdown.totalXP);
                  setXpData({ ...xpBreakdown, ...xpResult });
                  queryClient.invalidateQueries({ queryKey: ["student-xp", user.id] });
                }
              }
            } else {
              // Legacy path: single exercise nodes or old behavior
              const existingProgress = await getNodeProgress(user.id, nodeId);
              const isFirst = !existingProgress || existingProgress.stars === 0;
              setIsFirstComplete(isFirst);

              // Update node progress (pass percentage, not raw score)
              const result = await updateNodeProgress(
                user.id,
                nodeId,
                earnedStars,
                Math.round(Math.min(scorePercentage, 100)),
                progressOptions
              );

              // Check if rate limited
              if (result.rateLimited) {
                setRateLimited(true);
                setRateLimitResetTime(result.resetTime);
                // Still show stars earned but don't save progress or award XP
                setNodeComplete(false);
                setExercisesRemaining(0);
                setIsProcessingTrail(false);
                return;
              }

              setNodeComplete(true);
              setExercisesRemaining(0);

              // Calculate and award XP
              const sessionData = {
                score,
                maxScore: totalPossibleScore,
                nodeId,
                isFirstComplete: isFirst
              };
              const xpBreakdown = calculateSessionXP(sessionData);

              if (xpBreakdown.totalXP > 0) {
                const xpResult = await awardXP(user.id, xpBreakdown.totalXP);
                setXpData({ ...xpBreakdown, ...xpResult });
                queryClient.invalidateQueries({ queryKey: ["student-xp", user.id] });
              }
            }
          }
        } catch (error) {
          console.error("Error processing trail completion:", error);
        } finally {
          setIsProcessingTrail(false);
        }
      } else {
        // Not a trail node, no processing needed
        setIsProcessingTrail(false);
      }
    };

    processTrailCompletion();
  }, [user?.id, nodeId, score, totalPossibleScore, scorePercentage, exerciseIndex, totalExercises, exerciseType, queryClient, isTeacher]);

  // Trigger confetti for full/epic tiers (non-blocking, after trail processing)
  useEffect(() => {
    if (!isProcessingTrail && celebrationData.config.confetti && !reducedMotion) {
      setShowConfetti(true);
    }
  }, [isProcessingTrail, celebrationData.config.confetti, reducedMotion]);

  // Level-up celebration with deduplication
  useEffect(() => {
    if (!xpData?.leveledUp || !user?.id) return;
    if (reducedMotion) return;

    // Check if this level was already celebrated
    if (hasLevelBeenCelebrated(user.id, xpData.newLevel)) {
      return;
    }

    // Show confetti for level-up (this may already be showing from the tier-based trigger)
    setShowConfetti(true);

    // Mark as celebrated so it doesn't repeat
    markLevelCelebrated(user.id, xpData.newLevel);
  }, [xpData?.leveledUp, xpData?.newLevel, user?.id, reducedMotion]);

  // Trigger boss unlock modal (after trail processing completes)
  useEffect(() => {
    if (!isProcessingTrail && nodeComplete && celebrationData.isBoss && shouldShowBossModal) {
      // Short delay to let VictoryScreen render first
      const timer = setTimeout(() => setShowBossModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isProcessingTrail, nodeComplete, celebrationData.isBoss, shouldShowBossModal]);

  // Boss modal close handler
  const handleBossModalClose = useCallback(() => {
    markBossAsShown();
    setShowBossModal(false);
  }, [markBossAsShown]);

  // Calculate percentile in background (non-blocking, never delays rendering)
  useEffect(() => {
    if (!nodeId || !user?.id || isProcessingTrail) return;

    const loadPercentile = async () => {
      const percentile = await calculateScorePercentile(
        user.id,
        Math.round(Math.min(scorePercentage, 100)),
        nodeId
      );
      const message = getPercentileMessage(percentile, t);
      setPercentileMessage(message);
    };

    loadPercentile();
  }, [nodeId, user?.id, scorePercentage, isProcessingTrail]);

  // Fetch next recommended node when current node is complete
  useEffect(() => {
    const fetchNextNode = async () => {
      if (!user?.id || !nodeId || !nodeComplete) return;

      setFetchingNextNode(true);
      try {
        const recommendedNode = await getNextNodeInPath(user.id, nodeId);
        setNextNode(recommendedNode);
      } catch (error) {
        console.error("Error fetching next node:", error);
        setNextNode(null);
      } finally {
        setFetchingNextNode(false);
      }
    };

    fetchNextNode();
  }, [user?.id, nodeId, nodeComplete]);

  // Navigation helper for moving to next node
  const navigateToNextNode = useCallback(() => {
    console.log('[VictoryScreen] navigateToNextNode called:', { nextNode });

    if (!nextNode) {
      console.log('[VictoryScreen] No nextNode, navigating to /trail');
      // Fallback to trail map if no next node
      navigate('/trail');
      return;
    }

    // Get first exercise of next node
    const firstExercise = nextNode.exercises?.[0];
    if (!firstExercise) {
      console.warn("Next node has no exercises");
      navigate('/trail');
      return;
    }

    // Build navigation state for the next node
    const navState = {
      nodeId: nextNode.id,
      nodeConfig: firstExercise.config,
      exerciseIndex: 0,
      totalExercises: nextNode.exercises.length,
      exerciseType: firstExercise.type
    };

    console.log('[VictoryScreen] Navigating to next node with state:', navState);

    // Route based on exercise type
    switch (firstExercise.type) {
      case EXERCISE_TYPES.NOTE_RECOGNITION:
        navigate('/notes-master-mode/notes-recognition-game', { state: navState });
        break;
      case EXERCISE_TYPES.SIGHT_READING:
        navigate('/notes-master-mode/sight-reading-game', { state: navState });
        break;
      case EXERCISE_TYPES.MEMORY_GAME:
        navigate('/notes-master-mode/memory-game', { state: navState });
        break;
      case EXERCISE_TYPES.RHYTHM:
        navigate('/rhythm-mode/metronome-trainer', { state: navState });
        break;
      case EXERCISE_TYPES.BOSS_CHALLENGE:
        // Boss challenges use note recognition game with special config
        navigate('/notes-master-mode/notes-recognition-game', { state: navState });
        break;
      default:
        console.warn('Unknown exercise type:', firstExercise.type);
        navigate('/trail');
    }
  }, [nextNode, navigate]);

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
    <div className="fixed inset-0 z-[9999] flex justify-center overflow-y-auto p-2 landscape:items-center landscape:p-3 sm:p-4">
      {/* Confetti overlay for full/epic celebrations */}
      {showConfetti && (
        <ConfettiEffect
          tier={celebrationData.tier}
          onComplete={() => setShowConfetti(false)}
        />
      )}

      {/* Boss unlock celebration modal (renders on top at z-[10000]) */}
      {showBossModal && (
        <BossUnlockModal
          nodeId={nodeId}
          nodeName={getNodeById(nodeId)?.name || 'Boss'}
          nextNode={nextNode}
          stars={stars}
          onClose={handleBossModalClose}
          onNavigateToNext={() => {
            handleBossModalClose();
            navigateToNextNode();
          }}
        />
      )}

      {/* Main content container - fits within viewport */}
      <div className="flex w-full max-w-md flex-col items-center my-auto landscape:max-w-3xl landscape:flex-row landscape:flex-wrap landscape:items-start landscape:gap-4">
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

        {/* Rate limit banner - shown at top when rate limited */}
        {rateLimited && rateLimitResetTime && (
          <div className="w-full px-2 mb-2">
            <RateLimitBanner
              resetTime={rateLimitResetTime}
              onComplete={() => {
                setRateLimited(false);
                setRateLimitResetTime(null);
              }}
            />
          </div>
        )}

        {/* Content area */}
        <div className="w-full space-y-1.5 px-2 pt-4 text-center landscape:grid landscape:grid-cols-2 landscape:gap-4 landscape:space-y-0 landscape:py-1 landscape:text-left sm:space-y-2 sm:px-4 sm:pt-2">
          {/* Victory title */}
          <h2 className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-xl font-bold text-transparent landscape:col-span-2 landscape:text-center sm:text-2xl">
            {rateLimited
              ? t('victory.greatPractice')
              : isProcessingTrail
                ? t('victory.loading')
                : celebrationData.message.title}
          </h2>

          {/* Subtitle (only for trail nodes after processing completes) */}
          {!isProcessingTrail && !rateLimited && nodeId && (
            <p className="text-sm text-white/80">
              {celebrationData.message.subtitle}
            </p>
          )}

          {/* Exercise indicator (if multi-exercise node) */}
          {nodeId && totalExercises > 1 && exerciseIndex !== null && (
            <p className="text-xs text-white/70">
              {t('victory.exerciseIndicator', { current: exerciseIndex + 1, total: totalExercises })}
              {!nodeComplete && exercisesRemaining > 0 && (
                <span className="ml-1">{t('victory.exercisesRemaining', { count: exercisesRemaining })}</span>
              )}
            </p>
          )}

          {/* Score display */}
          <p className="text-sm text-white/90 sm:text-base">
            {t('victory.finalScore', { score, total: totalPossibleScore })}
          </p>

          {/* Star rating display (if trail node) */}
          {nodeId && stars > 0 && (
            <div className="flex items-center justify-center gap-1 py-1">
              {[1, 2, 3].map((starNum) => (
                <span
                  key={starNum}
                  className={`text-3xl ${
                    starNum <= stars
                      ? reducedMotion
                        ? 'text-yellow-400 drop-shadow-lg'
                        : 'animate-bounce text-yellow-400 drop-shadow-lg'
                      : 'text-gray-400/30'
                  } ${!reducedMotion ? 'transition-all duration-300' : 'transition-opacity duration-100'}`}
                  style={reducedMotion ? {} : {
                    animationDelay: `${starNum * 100}ms`,
                    animationDuration: '600ms'
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          )}

          {/* XP gained display with breakdown (if trail node) */}
          {xpData && xpData.totalXP > 0 && (
            <div className="relative mt-1 sm:mt-2">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 via-purple-200/30 to-pink-200/40 opacity-70 blur-lg" />
              <div className="relative space-y-1.5 rounded-xl border-white/60 bg-white/90 px-3 py-2 shadow-lg sm:px-4 sm:py-2.5">
                {/* Total XP header with count-up animation */}
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 sm:text-base">
                    {t('victory.xpEarned', { xp: animatedXPGain })}
                  </p>
                </div>

                {/* XP Breakdown */}
                <div className="space-y-0.5 text-xs text-gray-600">
                  {/* Stars earned */}
                  <div className="flex justify-between">
                    <span>{t('victory.starsEarned', { count: xpData.stars })}</span>
                    <span className="font-semibold text-blue-600">+{xpData.baseXP}</span>
                  </div>

                  {/* Bonus: First time */}
                  {xpData.bonuses?.firstTime && (
                    <div className="flex justify-between text-purple-600">
                      <span>{t('victory.firstTimeBonus')}</span>
                      <span className="font-semibold">+25</span>
                    </div>
                  )}

                  {/* Bonus: Perfect score */}
                  {xpData.bonuses?.perfect && (
                    <div className="flex justify-between text-amber-600">
                      <span>{t('victory.perfectScore')}</span>
                      <span className="font-semibold">+50</span>
                    </div>
                  )}

                  {/* Bonus: Three stars */}
                  {xpData.bonuses?.threeStars && (
                    <div className="flex justify-between text-yellow-600">
                      <span>{t('victory.threeStars')}</span>
                      <span className="font-semibold">+50</span>
                    </div>
                  )}
                </div>

                {/* Mini XP progress bar - shows level context */}
                {levelProgressData && !xpData.leveledUp && (
                  <div className="mt-2 space-y-1 rounded-lg bg-blue-50/80 p-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                      <span>{t(`xpLevels.${levelProgressData.currentLevel.title}`)}</span>
                      <span>{t('victory.levelLabel', { level: levelProgressData.currentLevel.level })}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                      <div
                        className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600 ${
                          reducedMotion ? 'transition-opacity duration-100' : 'transition-all duration-1000'
                        }`}
                        style={{ width: `${levelProgressData.progressPercentage}%` }}
                      />
                    </div>
                    <div className="text-center text-xs text-blue-700">
                      {t('victory.xpProgress', { current: levelProgressData.xpInCurrentLevel, total: levelProgressData.nextLevelXP - levelProgressData.currentLevel.xpRequired })}
                    </div>
                  </div>
                )}

                {/* Level up indicator - enhanced with level name */}
                {xpData.leveledUp && (
                  <div className={`${reducedMotion ? '' : 'animate-bounce'} mt-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-center shadow-lg`}>
                    <div className="text-xs font-semibold text-white/90">{t('victory.levelUp')}</div>
                    <div className="text-base font-bold text-white">
                      {levelProgressData?.currentLevel?.title ? t(`xpLevels.${levelProgressData.currentLevel.title}`) : t('victory.levelLabel', { level: xpData.newLevel })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score percentile comparison (loads async, trail nodes only) */}
          {percentileMessage && (
            <div className="mt-1 rounded-lg bg-white/20 px-3 py-1.5 text-center text-sm text-white/90 sm:mt-2">
              {percentileMessage}
            </div>
          )}

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
                    {t('victory.pointsEarned')}
                  </p>
                  <p className="text-sm font-bold text-emerald-500 sm:text-base">
                    +{actualGain.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-xs">
                    {t('victory.totalPoints')}
                  </p>
                  <p className="text-lg font-black tracking-tight text-gray-900 sm:text-xl">
                    {animatedTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1 landscape:col-span-2 sm:pt-2">
            {/* If trail node: Show exercise-aware buttons */}
            {nodeId ? (
              <>
                {/* Primary action: Next Exercise or Continue to Next Node */}
                {exercisesRemaining > 0 && onNextExercise ? (
                  <button
                    onClick={onNextExercise}
                    className="w-full transform rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-3 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-600 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {t('victory.nextExercise', { count: exercisesRemaining })}
                  </button>
                ) : isProcessingTrail || fetchingNextNode ? (
                  <button
                    disabled
                    className="w-full transform rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-3 text-base font-bold text-white opacity-80 landscape:py-2"
                  >
                    <span className="inline-block animate-pulse">{t('victory.loading')}</span>
                  </button>
                ) : nodeComplete && nextNode ? (
                  <button
                    onClick={navigateToNextNode}
                    className="w-full transform rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-3 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {t('victory.continueToNode', { name: translateNodeName(nextNode.name, t, i18n) })}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/trail')}
                    className="w-full transform rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-3 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {nodeComplete ? t('victory.backToTrail') : t('victory.continueLearning')}
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 transform rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:py-2.5"
                  >
                    {t("common.playAgain")}
                  </button>
                  <button
                    onClick={() => navigate('/trail')}
                    className="flex-1 transform rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:scale-[1.02] hover:from-gray-200 hover:to-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 sm:py-2.5"
                  >
                    {t("victory.backToTrail")}
                  </button>
                </div>
              </>
            ) : (
              /* Free play mode: Show original buttons */
              <div className="flex gap-2">
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
            )}
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
