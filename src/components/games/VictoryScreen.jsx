import { useVictoryState } from "../../hooks/useVictoryState";
import { ConfettiEffect } from '../celebrations/ConfettiEffect';
import { BossUnlockModal } from '../celebrations/BossUnlockModal';
import AccessoryUnlockModal from "../ui/AccessoryUnlockModal";
import RateLimitBanner from "../ui/RateLimitBanner";
import { Trophy } from "lucide-react";
import { translateNodeName } from "../../utils/translateNodeName";
import { getNodeById } from "../../data/skillTrail";

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
    actualGain,

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
    reducedMotion,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-2 sm:p-4">
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

      {/* Two-panel layout in landscape, single column in portrait */}
      <div className="flex w-full max-w-md flex-col items-center my-auto landscape:max-w-3xl landscape:flex-row landscape:items-center landscape:gap-6">

        {/* LEFT PANEL: Avatar + Stars */}
        <div className="flex flex-col items-center gap-2 landscape:w-2/5 landscape:gap-3">
          {/* Video avatar */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl h-24 w-24 landscape:h-16 landscape:w-16">
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

          {/* Star rating display - shown for both trail and free play */}
          {displayStars > 0 && (
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3].map((starNum) => (
                <span
                  key={starNum}
                  className={`text-3xl landscape:text-2xl ${
                    starNum <= displayStars
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
                  &#11088;
                </span>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Message + XP/Points + Badges + Buttons */}
        <div className="flex w-full flex-col items-center gap-1.5 pt-3 landscape:w-3/5 landscape:items-start landscape:gap-2 landscape:pt-0">
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

          {/* Victory title */}
          <h2 className="w-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-xl font-bold text-transparent text-center landscape:text-left sm:text-2xl">
            {rateLimited
              ? t('victory.greatPractice')
              : isProcessingTrail
                ? t('victory.loading')
                : celebrationData.message.title}
          </h2>

          {/* Subtitle */}
          {!isProcessingTrail && !rateLimited && celebrationData.message.subtitle && (
            <p className="w-full text-sm text-white/80 text-center landscape:text-left">
              {celebrationData.message.subtitle}
            </p>
          )}

          {/* XP line (trail mode) - single bold line, not a card */}
          {nodeId && xpData && xpData.totalXP > 0 && (
            <div className="flex items-center gap-2 text-center landscape:text-left">
              <p className="text-lg font-bold text-blue-300">
                {t('victory.xpEarned', { xp: animatedXPGain })}
              </p>
              {comebackActive && (
                <span className="inline-flex items-center rounded-full bg-amber-500/30 border border-amber-400/40 px-2 py-0.5 text-xs font-bold text-amber-300">
                  2x
                </span>
              )}
            </div>
          )}

          {/* Points line (free play mode) */}
          {!nodeId && actualGain > 0 && (
            <p className="text-lg font-bold text-emerald-300 text-center landscape:text-left">
              {t('victory.pointsEarnedLine', { points: actualGain.toLocaleString() })}
            </p>
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
            <p className="text-xs text-white/70 text-center landscape:text-left">
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
                {/* Primary action button (full-width) */}
                {exercisesRemaining > 0 && onNextExercise ? (
                  <button
                    onClick={onNextExercise}
                    className="w-full rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-2.5 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-600 hover:to-purple-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {t('victory.nextExercise', { count: exercisesRemaining })}
                  </button>
                ) : isProcessingTrail || fetchingNextNode ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2.5 text-base font-bold text-white opacity-80 landscape:py-2"
                  >
                    <span className="inline-block animate-pulse">{t('victory.loading')}</span>
                  </button>
                ) : nodeComplete && nextNode ? (
                  <button
                    onClick={navigateToNextNode}
                    className="w-full rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2.5 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {t('victory.continueToNode', { name: translateNodeName(nextNode.name, t, i18n) })}
                  </button>
                ) : (
                  <button
                    onClick={handleNavigateToTrail}
                    className="w-full rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 px-4 py-2.5 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 landscape:py-2"
                  >
                    {nodeComplete ? t('victory.backToTrail') : t('victory.continueLearning')}
                  </button>
                )}

                {/* Secondary row: Play Again + Exit to trail */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayAgain}
                    className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {t("common.playAgain")}
                  </button>
                  <button
                    onClick={handleNavigateToTrail}
                    className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-semibold text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {t("victory.backToTrail")}
                  </button>
                </div>
              </>
            ) : (
              /* Free play mode: 2 buttons - Play Again (primary) + Exit (secondary) */
              <>
                <button
                  onClick={handlePlayAgain}
                  className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-2.5 text-base font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-indigo-600 hover:to-violet-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 landscape:py-2"
                >
                  {t("common.playAgain")}
                </button>
                <button
                  onClick={handleExit}
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  {t("common.toGamesMode")}
                </button>
              </>
            )}
          </div>
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
