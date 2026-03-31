import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useStreakWithAchievements } from "./useStreakWithAchievements";
import { useAccessoriesList } from "./useAccessories";
import { useGamesPlayed } from "./useGamesPlayed";
import { useUserProfile } from "./useUserProfile";
import { usePointBalance } from "./useAccessories";
import { useAccessoryUnlockDetection } from "./useAccessoryUnlockDetection";
import { useUser } from "../features/authentication/useUser";
import { updateNodeProgress, getNodeProgress, updateExerciseProgress, getNextNodeInPath, calculateStarsFromPercentage } from "../services/skillProgressService";
import { awardXP, calculateSessionXP, calculateFreePlayXP, getLevelProgress, PRESTIGE_XP_PER_TIER } from "../utils/xpSystem";
import { getNodeById, EXERCISE_TYPES } from "../data/skillTrail";
import { streakService } from "../services/streakService";
import { toast } from "react-hot-toast";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { determineCelebrationTier, getCelebrationConfig } from '../utils/celebrationTiers';
import { getCelebrationMessage } from '../utils/celebrationMessages';
import { hasLevelBeenCelebrated, markLevelCelebrated } from '../utils/levelUpTracking';
import { useBossUnlockTracking } from './useBossUnlockTracking';
import { useTranslation } from "react-i18next";

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
 * useVictoryState - Custom hook containing all VictoryScreen business logic.
 * Extracted from VictoryScreen.jsx for separation of concerns.
 * All behavior is identical to the original monolithic component.
 */
export function useVictoryState({
  score,
  totalPossibleScore,
  onReset,
  timedMode,
  timeRemaining,
  initialTime,
  onExit,
  nodeId = null,
  exerciseIndex = null,
  totalExercises = null,
  exerciseType = null,
  onNextExercise = null,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isTeacher } = useUser();
  const { reducedMotion } = useAccessibility();
  const { shouldShow: shouldShowBossModal, markAsShown: markBossAsShown } = useBossUnlockTracking(user?.id, nodeId);
  const scorePercentage = (score / totalPossibleScore) * 100;

  // Fetch streak state to check comeback bonus (for 2x XP display)
  const { data: streakState } = useQuery({
    queryKey: ["streak-state", user?.id],
    queryFn: () => streakService.getStreakState(),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
  const comebackActive = streakState?.comebackBonus?.active === true;
  const timeUsed = timedMode ? initialTime - timeRemaining : null;
  const updateStreakWithAchievements = useStreakWithAchievements();
  const [shownUnlocksLoaded, setShownUnlocksLoaded] = useState(false);

  const storageKey = useMemo(
    () => (user?.id ? `shown-accessory-unlocks-${user.id}` : null),
    [user?.id]
  );
  const shownUnlocksRef = useRef(new Set());

  // Trail/XP system state (declared early because useCountUp below references xpData)
  const [xpData, setXpData] = useState(null);

  // XP count-up animation (1 second)
  const animatedXPGain = useCountUp(0, xpData?.totalXP || 0, 1000, !!xpData?.totalXP, reducedMotion);

  const refreshQueries = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student-scores", user.id] }),
      queryClient.invalidateQueries({
        queryKey: ["earned-achievements", user.id],
      }),
    ]);
  }, [queryClient, user?.id]);

  const handleExit = useCallback(() => {
    refreshQueries();
    if (onExit) {
      onExit();
    } else {
      navigate("/practice-modes");
    }
  }, [refreshQueries, onExit, navigate]);

  const handlePlayAgain = useCallback(() => {
    refreshQueries();
    onReset?.();
  }, [refreshQueries, onReset]);

  const handleGoToDashboard = useCallback(() => {
    refreshQueries();
    navigate("/");
  }, [navigate, refreshQueries]);

  const handleNavigateToTrail = useCallback(() => {
    navigate('/trail');
  }, [navigate]);

  const handleEquipAccessory = useCallback(() => {
    if (user?.id) {
      queryClient.invalidateQueries({
        queryKey: ["user-accessories", user.id],
      });
    }
  }, [queryClient, user?.id]);

  // Accessory unlock detection
  const { data: accessories } = useAccessoriesList();
  const { data: gamesPlayedCount } = useGamesPlayed();
  const { data: profileData } = useUserProfile();
  const { data: pointsBalance } = usePointBalance();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedAccessories, setUnlockedAccessories] = useState([]);

  // Trail/XP system state
  const [stars, setStars] = useState(0);
  const [nodeData, _setNodeData] = useState(null);
  const [_isFirstComplete, setIsFirstComplete] = useState(false);
  const [exercisesRemaining, setExercisesRemaining] = useState(0);
  const [nodeComplete, setNodeComplete] = useState(false);
  const [nextNode, setNextNode] = useState(null);
  const [fetchingNextNode, setFetchingNextNode] = useState(false);
  // Track if we're still processing completion (show loading until done)
  const [isProcessingTrail, setIsProcessingTrail] = useState(true);
  const hasProcessedTrail = useRef(false);
  const hasCalledStreakUpdate = useRef(false);

  // Personal best detection state
  const [isPersonalBest, setIsPersonalBest] = useState(false);

  // Celebration system state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBossModal, setShowBossModal] = useState(false);
  // Rate limiting state
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState(null);

  // isTeacher is DB-verified from useUser() above (not user_metadata, which is user-editable)

  // Celebration tier and messaging (derived from existing state)
  const celebrationData = useMemo(() => {
    const node = nodeId ? getNodeById(nodeId) : null;
    const isBoss = node?.isBoss || false;
    const nodeType = node?.nodeType || null;

    // For free play, calculate stars from score percentage
    const effectiveStars = nodeId ? stars : calculateStarsFromPercentage(scorePercentage);

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
        totalXP: pointsBalance?.earned || 0,
        currentStreak: profileData?.current_streak || 0,
        perfectGames: profileData?.perfect_games || 0,
        level: profileData?.level || 1,
      });
    }
  }, [
    gamesPlayedCount,
    profileData,
    pointsBalance,
    setBaselineProgress,
  ]);

  // Current progress state (after game completion)
  const currentProgress = useMemo(() => {
    return {
      achievements: profileData?.achievements || [],
      gamesPlayed: gamesPlayedCount || 0,
      totalXP: pointsBalance?.earned || 0,
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
        onSuccess: ({ newStreak }) => {
          // Show freeze-earned toast with a short delay so it doesn't overlap XP animation
          if (newStreak?.freezeEarned) {
            setTimeout(() => {
              toast.success(t('streak.freezeEarned'));
            }, 1500);
          }
        },
      });
    }
  }, [scorePercentage, updateStreakWithAchievements, t]);

  // Trail system: Calculate stars, update progress, and award XP
  useEffect(() => {
    const processTrailCompletion = async () => {
      // Prevent multiple executions
      if (hasProcessedTrail.current) return;
      if (!user?.id) return;

      // Calculate stars
      const earnedStars = calculateStarsFromPercentage(scorePercentage);
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
              // Fetch pre-update progress for personal best detection
              const preUpdateProgress = await getNodeProgress(user.id, nodeId);
              const existingExercise = preUpdateProgress?.exercise_progress?.find(
                (ep) => ep.index === exerciseIndex
              );
              if (
                existingExercise &&
                existingExercise.bestScore > 0 &&
                Math.round(Math.min(scorePercentage, 100)) > existingExercise.bestScore
              ) {
                setIsPersonalBest(true);
              }

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
                  isFirstComplete: true,
                  comebackMultiplier: comebackActive ? 2 : 1
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

              // Personal best detection (only if not first completion)
              if (
                existingProgress &&
                existingProgress.best_score > 0 &&
                Math.round(Math.min(scorePercentage, 100)) > existingProgress.best_score
              ) {
                setIsPersonalBest(true);
              }

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
                isFirstComplete: isFirst,
                comebackMultiplier: comebackActive ? 2 : 1
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
        // Free play: award XP based on score
        if (user?.id && scorePercentage > 0) {
          try {
            const freePlayXP = calculateFreePlayXP(scorePercentage, comebackActive ? 2 : 1);
            if (freePlayXP > 0) {
              const xpResult = await awardXP(user.id, freePlayXP);
              setXpData({ totalXP: freePlayXP, ...xpResult });
              queryClient.invalidateQueries({ queryKey: ["student-xp", user.id] });
            }
          } catch (error) {
            console.error("Error awarding free play XP:", error);
          }
        }
        setIsProcessingTrail(false);
      }
    };

    processTrailCompletion();
  }, [user?.id, nodeId, score, totalPossibleScore, scorePercentage, exerciseIndex, totalExercises, exerciseType, queryClient, isTeacher, comebackActive]);

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
    if (!nextNode) {
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
      case EXERCISE_TYPES.RHYTHM_TAP:
        navigate('/rhythm-mode/rhythm-reading-game', { state: navState });
        break;
      case EXERCISE_TYPES.RHYTHM_DICTATION:
        navigate('/rhythm-mode/rhythm-dictation-game', { state: navState });
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

  return {
    // Core display data
    stars,
    scorePercentage,
    celebrationData,
    xpData,
    animatedXPGain,
    levelProgressData,
    isProcessingTrail,
    nodeComplete,
    exercisesRemaining,
    isPersonalBest,
    showConfetti,
    showBossModal,
    nextNode,
    fetchingNextNode,
    rateLimited,
    rateLimitResetTime,
    comebackActive,
    showUnlockModal,
    unlockedAccessories,
    nodeData,
    timeUsed,

    // Actions
    handleExit,
    handlePlayAgain,
    handleGoToDashboard,
    handleNavigateToTrail,
    handleEquipAccessory,
    navigateToNextNode,
    handleBossModalClose,
    setShowConfetti,
    setShowBossModal,
    setShowUnlockModal,
    setRateLimited,
    setRateLimitResetTime,

    // Context values needed by render
    user,
    nodeId,
    reducedMotion,
    t,
    i18n,

    // Props passthrough for render convenience
    onNextExercise,
    exerciseIndex,
    totalExercises,
    PRESTIGE_XP_PER_TIER,
  };
}
