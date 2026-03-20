import { useEffect, useRef } from "react";
import { useVictoryState } from "../../hooks/useVictoryState";
import { ConfettiEffect } from '../celebrations/ConfettiEffect';
import { BossUnlockModal } from '../celebrations/BossUnlockModal';
import AccessoryUnlockModal from "../ui/AccessoryUnlockModal";
import RateLimitBanner from "../ui/RateLimitBanner";
import { Trophy, Zap } from "lucide-react";
import { translateNodeName } from "../../utils/translateNodeName";
import { getNodeById } from "../../data/skillTrail";
import { completeDailyChallenge } from "../../services/dailyChallengeService";
import GoldStar from "../ui/GoldStar";
import victoryBg from "../../assets/images/victory-background.webp";

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
  challengeMode = false, // Optional: daily challenge mode
  challengeId = null, // Optional: daily challenge ID
  challengeXpReward = null, // Optional: bonus XP for challenge
}) => {
  const {
    // Core display data
    stars,
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

    // Actions
    handleExit,
    handlePlayAgain,
    handleNavigateToTrail,
    handleEquipAccessory,
    navigateToNextNode,
    handleBossModalClose,
    setShowConfetti,
    setShowUnlockModal,
    setRateLimited,
    setRateLimitResetTime,

    // Modals
    showUnlockModal,
    unlockedAccessories,

    // Context values
    user,
    reducedMotion: _reducedMotion,
    t,
    i18n,
  } = useVictoryState({
    score,
    totalPossibleScore,
    onReset,
    timedMode,
    timeRemaining,
    initialTime,
    onExit,
    nodeId,
    exerciseIndex,
    totalExercises,
    exerciseType,
    onNextExercise,
  });

  // Mark daily challenge as complete
  const challengeCompletedRef = useRef(false);
  useEffect(() => {
    if (challengeMode && challengeId && user?.id && !challengeCompletedRef.current) {
      challengeCompletedRef.current = true;
      completeDailyChallenge(user.id, challengeId).catch(err =>
        console.error("Failed to complete daily challenge:", err)
      );
    }
  }, [challengeMode, challengeId, user?.id]);

  // Stars to display: trail uses calculated stars, free play uses effectiveStars from celebrationData
  const displayStars = celebrationData.effectiveStars;

  // Determine level title for level-up badge
  const levelTitle = levelProgressData?.currentLevel?.isPrestige
    ? t('xpLevels.prestigeTitle', { tier: levelProgressData.currentLevel.prestigeTier })
    : levelProgressData?.currentLevel?.title
      ? t(`xpLevels.${levelProgressData.currentLevel.title}`, { defaultValue: levelProgressData.currentLevel.title })
      : t('victory.levelLabel', { level: xpData?.newLevel });

  const isPrestige = levelProgressData?.isPrestige || (xpData?.newLevel >= 30);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-indigo-950 p-2 sm:p-4" style={{ backgroundImage: `url(${victoryBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>

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

      {/* Single centered column layout */}
      <div className="flex w-full max-w-md flex-col items-center my-auto landscape:max-w-lg gap-2">
          {/* Rate limit banner */}
          {rateLimited && rateLimitResetTime && (
            <div className="w-full mb-1">
              <RateLimitBanner
                resetTime={rateLimitResetTime}
                onComplete={() => {
                  setRateLimited(false);
                  setRateLimitResetTime(null);
                }}
              />
            </div>
          )}

          {/* Victory title - bow/arc shaped with curved banner backdrop */}
          <div className="w-full flex justify-center">
            <svg viewBox="0 0 300 90" className="w-full max-w-xs sm:max-w-sm h-auto overflow-visible" aria-label={rateLimited ? t('victory.greatPractice') : isProcessingTrail ? t('victory.loading') : celebrationData.message.title}>
              <defs>
                <path id="victory-arc" d="M 5,70 Q 150,5 295,70" fill="none" />
                <linearGradient id="victory-title-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                <linearGradient id="victory-banner-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
                </linearGradient>
                <filter id="banner-glow">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.4" />
                </filter>
              </defs>
              {/* Curved banner that follows the text arc */}
              <path
                d="M 2,76 Q 150,11 298,76 L 298,46 Q 150,-19 2,46 Z"
                fill="url(#victory-banner-grad)"
                stroke="#3b82f6"
                strokeWidth="1.2"
                strokeOpacity="0.4"
                filter="url(#banner-glow)"
              />
              <text
                fill="url(#victory-title-grad)"
                style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive", fontWeight: 700, filter: 'drop-shadow(0 2px 4px rgba(255,200,0,0.3))' }}
                fontSize="22"
                textAnchor="middle"
                letterSpacing="1.5"
              >
                <textPath href="#victory-arc" startOffset="50%">
                  {(rateLimited
                    ? t('victory.greatPractice')
                    : isProcessingTrail
                      ? t('victory.loading')
                      : celebrationData.message.title
                  ).toUpperCase()}
                </textPath>
              </text>
            </svg>
          </div>

          {/* Star rating display - below title */}
          {displayStars > 0 && (
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((starNum) => (
                <GoldStar
                  key={starNum}
                  size={36}
                  filled={starNum <= displayStars}
                  glow={starNum <= displayStars}
                  className="landscape:h-8 landscape:w-8"
                />
              ))}
            </div>
          )}

          {/* XP badge (trail mode) - polished glowing badge */}
          {nodeId && xpData && xpData.totalXP > 0 && (
            <div className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-indigo-900/90 to-slate-900/90 border-2 border-blue-400/50 px-5 py-1.5 shadow-[0_0_16px_rgba(96,165,250,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <p className="text-lg font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent" style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive" }}>
                {t('victory.xpEarned', { xp: animatedXPGain })}
              </p>
              {comebackActive && (
                <span className="inline-flex items-center rounded-full bg-amber-500/30 border border-amber-400/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                  2x
                </span>
              )}
            </div>
          )}

          {/* XP badge (free play mode) - polished glowing badge */}
          {!nodeId && xpData && xpData.totalXP > 0 && (
            <div className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-indigo-900/90 to-slate-900/90 border-2 border-blue-400/50 px-5 py-1.5 shadow-[0_0_16px_rgba(96,165,250,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <p className="text-lg font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent" style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive" }}>
                {t('victory.xpEarned', { xp: animatedXPGain })}
              </p>
              {comebackActive && (
                <span className="inline-flex items-center rounded-full bg-amber-500/30 border border-amber-400/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                  2x
                </span>
              )}
            </div>
          )}

          {/* Daily Challenge bonus XP badge */}
          {challengeMode && challengeXpReward && (
            <div className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-600/90 to-orange-900/90 border-2 border-amber-400/50 px-5 py-1.5 shadow-[0_0_16px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Zap className="w-4 h-4 text-amber-300" />
              <p className="text-lg font-bold bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent" style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive" }}>
                {t('dashboard.dailyChallenge.bonusXp', { xp: challengeXpReward, defaultValue: `Challenge Bonus: +${challengeXpReward} XP` })}
              </p>
            </div>
          )}

          {/* Level-up badge - inline pill, not bouncing card */}
          {xpData?.leveledUp && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-semibold ${
              isPrestige
                ? 'bg-amber-500/30 border border-amber-400/40 text-amber-200'
                : 'bg-purple-500/30 border border-purple-400/40 text-purple-200'
            }`}>
              {xpData.newLevel === 30
                ? t('victory.prestigeUnlocked')
                : `${t('victory.levelUp')} ${t('victory.youAreNow', { title: levelTitle })}`}
            </span>
          )}

          {/* Prestige entry text */}
          {xpData?.leveledUp && xpData.newLevel === 30 && (
            <p className="text-xs text-white/70 text-center">
              {t('victory.prestigeEntry')}
            </p>
          )}

          {/* Personal best indicator */}
          {isPersonalBest && !isProcessingTrail && (
            <div className="inline-flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-semibold text-amber-200">
                {t('victory.personalBest')}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex w-full flex-col gap-2 pt-1">
            {/* Trail mode buttons */}
            {nodeId ? (
              <>
                {/* Primary action button (full-width, polished badge style) */}
                {exercisesRemaining > 0 && onNextExercise ? (
                  <button
                    onClick={onNextExercise}
                    className="w-full rounded-full bg-gradient-to-b from-blue-500/90 to-indigo-900/90 border-2 border-blue-400/50 px-5 py-2.5 text-base font-bold text-white shadow-[0_0_16px_rgba(96,165,250,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(96,165,250,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {t('victory.nextExercise', { count: exercisesRemaining })}
                  </button>
                ) : isProcessingTrail || fetchingNextNode ? (
                  <button
                    disabled
                    className="w-full rounded-full bg-gradient-to-b from-emerald-500/90 to-emerald-900/90 border-2 border-emerald-400/50 px-5 py-2.5 text-base font-bold text-white opacity-80 shadow-[0_0_16px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] landscape:py-2"
                  >
                    <span className="inline-block animate-pulse">{t('victory.loading')}</span>
                  </button>
                ) : nodeComplete && nextNode ? (
                  <button
                    onClick={navigateToNextNode}
                    className="w-full rounded-full bg-gradient-to-b from-emerald-500/90 to-emerald-900/90 border-2 border-emerald-400/50 px-5 py-2.5 text-base font-bold text-white shadow-[0_0_16px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(52,211,153,0.5)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {t('victory.continueToNode', { name: translateNodeName(nextNode.name, t, i18n) })}
                  </button>
                ) : (
                  <button
                    onClick={handleNavigateToTrail}
                    className="w-full rounded-full bg-gradient-to-b from-emerald-500/90 to-emerald-900/90 border-2 border-emerald-400/50 px-5 py-2.5 text-base font-bold text-white shadow-[0_0_16px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(52,211,153,0.5)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {nodeComplete ? t('victory.backToTrail') : t('victory.continueLearning')}
                  </button>
                )}

                {/* Secondary row: Play Again + Exit to trail */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 rounded-full bg-gradient-to-b from-indigo-500/80 to-indigo-900/80 border-2 border-indigo-400/40 px-3 py-2 text-sm font-bold text-white shadow-[0_0_12px_rgba(129,140,248,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(129,140,248,0.45)] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {t("common.playAgain")}
                  </button>
                  <button
                    onClick={handleNavigateToTrail}
                    className="flex-1 rounded-full bg-gradient-to-b from-white/15 to-white/5 border-2 border-white/25 px-3 py-2 text-sm font-bold text-white/80 shadow-[0_0_12px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {t("victory.backToTrail")}
                  </button>
                </div>
              </>
            ) : challengeMode ? (
              /* Challenge mode: Back to Dashboard (primary) */
              <button
                onClick={handleExit}
                className="w-full rounded-full bg-gradient-to-b from-amber-500/90 to-amber-900/90 border-2 border-amber-400/50 px-5 py-2.5 text-base font-bold text-white shadow-[0_0_16px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 landscape:py-2"
              >
                {t("common.dashboard", "Back to Dashboard")}
              </button>
            ) : (
              /* Free play mode: 2 buttons - Play Again (primary) + Exit (secondary) */
              <>
                <button
                  onClick={handlePlayAgain}
                  className="w-full rounded-full bg-gradient-to-b from-indigo-500/90 to-indigo-900/90 border-2 border-indigo-400/50 px-5 py-2.5 text-base font-bold text-white shadow-[0_0_16px_rgba(129,140,248,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(129,140,248,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 landscape:py-2"
                >
                  {t("common.playAgain")}
                </button>
                <button
                  onClick={handleExit}
                  className="w-full rounded-full bg-gradient-to-b from-white/15 to-white/5 border-2 border-white/25 px-4 py-2 text-sm font-bold text-white/80 shadow-[0_0_12px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  {t("common.toGamesMode")}
                </button>
              </>
            )}
          </div>
      </div>

      {/* Accessory unlock modal */}
      {showUnlockModal && unlockedAccessories.length > 0 && (
        <AccessoryUnlockModal
          accessories={unlockedAccessories}
          onClose={() => setShowUnlockModal(false)}
          onEquip={handleEquipAccessory}
        />
      )}
    </div>
  );
};

export default VictoryScreen;
