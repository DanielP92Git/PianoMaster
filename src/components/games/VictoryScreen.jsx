import { useVictoryState } from "../../hooks/useVictoryState";
import { ConfettiEffect } from '../celebrations/ConfettiEffect';
import { BossUnlockModal } from '../celebrations/BossUnlockModal';
import AccessoryUnlockModal from "../ui/AccessoryUnlockModal";
import RateLimitBanner from "../ui/RateLimitBanner";
import { Trophy } from "lucide-react";
import { translateNodeName } from "../../utils/translateNodeName";
import { getNodeById } from "../../data/skillTrail";
import { PRESTIGE_XP_PER_TIER } from "../../utils/xpSystem";

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
    percentileMessage,
    showConfetti,
    showBossModal,
    nextNode,
    fetchingNextNode,
    rateLimited,
    rateLimitResetTime,
    comebackActive,
    animatedTotal,
    actualGain,
    showUnlockModal,
    unlockedAccessories,
    totalPointsData,
    timeUsed,
    scorePercentage,

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
      <div className="flex w-full max-w-md flex-col items-center my-auto landscape:max-w-2xl">
        {/* Video avatar */}
        <div className="relative z-10 -mb-2 landscape:-mb-1 sm:-mb-3">
          <div
            className="overflow-hidden rounded-2xl bg-white shadow-xl h-[clamp(130px,15vh,160px)] w-[clamp(130px,15vh,160px)] landscape:h-[clamp(70px,12vh,90px)] landscape:w-[clamp(70px,12vh,90px)]"
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
        <div className="w-full space-y-1.5 px-2 pt-4 text-center landscape:space-y-1 landscape:pt-1 sm:space-y-2 sm:px-4 sm:pt-2">
          {/* Victory title */}
          <h2 className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
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
                <div className="flex items-center justify-center gap-1.5 text-center">
                  <p className="text-sm font-bold text-blue-600 sm:text-base">
                    {t('victory.xpEarned', { xp: animatedXPGain })}
                  </p>
                  {comebackActive && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      2x
                    </span>
                  )}
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

                  {/* Comeback bonus multiplier */}
                  {comebackActive && xpData.comebackMultiplier > 1 && (
                    <div className="flex justify-between text-amber-600">
                      <span>{t('victory.comebackBonus')}</span>
                      <span className="font-semibold">x{xpData.comebackMultiplier}</span>
                    </div>
                  )}
                </div>

                {/* Mini XP progress bar - shows level context */}
                {levelProgressData && !xpData.leveledUp && (
                  <div className={`mt-2 space-y-1 rounded-lg p-2 ${levelProgressData.isPrestige ? 'bg-amber-50/80' : 'bg-blue-50/80'}`}>
                    <div className={`flex items-center justify-between text-xs font-semibold ${levelProgressData.isPrestige ? 'text-amber-900' : 'text-blue-900'}`}>
                      <span>
                        {levelProgressData.currentLevel.isPrestige
                          ? t('xpLevels.prestigeTitle', { tier: levelProgressData.currentLevel.prestigeTier })
                          : t(`xpLevels.${levelProgressData.currentLevel.title}`)}
                      </span>
                      <span>{t('victory.levelLabel', { level: levelProgressData.currentLevel.level })}</span>
                    </div>
                    <div className={`h-2 w-full overflow-hidden rounded-full ${levelProgressData.isPrestige ? 'bg-amber-200' : 'bg-blue-200'}`}>
                      <div
                        className={`h-full ${levelProgressData.isPrestige ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} ${
                          reducedMotion ? 'transition-opacity duration-100' : 'transition-all duration-1000'
                        }`}
                        style={{ width: `${levelProgressData.progressPercentage}%` }}
                      />
                    </div>
                    <div className={`text-center text-xs ${levelProgressData.isPrestige ? 'text-amber-700' : 'text-blue-700'}`}>
                      {t('victory.xpProgress', {
                        current: levelProgressData.xpInCurrentLevel,
                        total: levelProgressData.isPrestige
                          ? PRESTIGE_XP_PER_TIER
                          : levelProgressData.nextLevelXP - levelProgressData.currentLevel.xpRequired
                      })}
                    </div>
                  </div>
                )}

                {/* Level up indicator - enhanced with level name and prestige support */}
                {xpData.leveledUp && (
                  <div className={`${reducedMotion ? '' : 'animate-bounce'} mt-2 rounded-lg px-3 py-2 text-center shadow-lg ${
                    levelProgressData?.isPrestige || xpData.newLevel >= 30
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    <div className="text-xs font-semibold text-white/90">
                      {xpData.newLevel === 30
                        ? t('victory.prestigeUnlocked')
                        : t('victory.levelUp')}
                    </div>
                    <div className="text-base font-bold text-white">
                      {levelProgressData?.currentLevel?.isPrestige
                        ? t('xpLevels.prestigeTitle', { tier: levelProgressData.currentLevel.prestigeTier })
                        : t('victory.youAreNow', {
                            title: levelProgressData?.currentLevel?.title
                              ? t(`xpLevels.${levelProgressData.currentLevel.title}`, { defaultValue: levelProgressData.currentLevel.title })
                              : t('victory.levelLabel', { level: xpData.newLevel })
                          })}
                    </div>
                    {xpData.newLevel === 30 && (
                      <div className="mt-1 text-xs text-white/80">
                        {t('victory.prestigeEntry')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal best badge */}
          {isPersonalBest && !isProcessingTrail && (
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 px-3 py-1">
              <Trophy className="h-4 w-4 text-amber-300" />
              <span className="text-sm font-bold text-amber-200">
                {t('victory.personalBest')}
              </span>
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
          <div className="flex flex-col gap-2 pt-1 sm:pt-2">
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
                    onClick={handleNavigateToTrail}
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
                    onClick={handleNavigateToTrail}
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
          onEquip={handleEquipAccessory}
        />
      )}
    </div>
  );
};

export default VictoryScreen;
