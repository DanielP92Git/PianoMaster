/**
 * UnifiedStatsCard - Single card consolidating level, XP ring, streak, and daily goals summary.
 *
 * Replaces the previous 4 separate stat cards + XPProgressCard with one
 * visually engaging card featuring a gradient border effect.
 *
 * Pure presentational - all data passed via props from Dashboard.jsx.
 */

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import XPRing from './XPRing';

const UnifiedStatsCard = ({
  // XP data
  levelTitle = '',
  levelNumber = 1,
  progressPercentage = 0,
  xpCurrent = 0,
  xpTotal = 0,
  totalXP = 0,
  isMaxLevel = false,

  // Streak data
  streakCount = 0,
  freezeCount = 0,
  inGraceWindow = false,

  // Daily goals summary
  goalsCompleted = 0,
  goalsTotal = 3,

  // Layout
  isRTL = false,
  reducedMotion = false,
  isLoading = false,
}) => {
  const { t } = useTranslation('common');

  // Goals progress percentage (clamped 0-100)
  const goalsPercent =
    goalsTotal > 0 ? Math.min(100, Math.round((goalsCompleted / goalsTotal) * 100)) : 0;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="rounded-2xl p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500">
        <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md p-5">
          <div className={`flex flex-col sm:flex-row gap-5 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            {/* Left skeleton - XP ring area */}
            <div className="flex flex-col items-center gap-2 sm:w-2/5">
              <div className="h-5 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
              <div className="h-[90px] w-[90px] animate-pulse rounded-full bg-white/10" />
            </div>
            {/* Right skeleton - stats */}
            <div className="flex flex-col gap-4 sm:w-3/5 justify-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded bg-white/10" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-5 w-12 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="rounded-2xl p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500">
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-md p-5">
        <div
          className={`flex flex-col sm:flex-row gap-5 ${isRTL ? 'sm:flex-row-reverse' : ''}`}
        >
          {/* Left column - XP ring area */}
          <div
            className={`flex flex-col items-center gap-1 sm:w-2/5 ${isRTL ? 'sm:text-right' : ''}`}
          >
            {/* Level title */}
            <h3 className="text-lg font-bold text-white leading-tight">
              {levelTitle}
            </h3>

            {/* Level subtitle */}
            <p className="text-xs text-white/60 mb-1">
              {isMaxLevel
                ? t('dashboard.xpProgress.maxLevel', { defaultValue: 'MAX LEVEL' })
                : t('dashboard.xpProgress.levelLabel', {
                    defaultValue: 'Level {{level}}',
                    level: levelNumber,
                  })}
            </p>

            {/* XP Ring */}
            <XPRing
              progressPercentage={progressPercentage}
              xpCurrent={xpCurrent}
              xpTotal={xpTotal}
              isMaxLevel={isMaxLevel}
              size={90}
              reducedMotion={reducedMotion}
            />
          </div>

          {/* Right column - streak + goals */}
          <div
            className={`flex flex-col gap-4 sm:w-3/5 justify-center ${isRTL ? 'items-end text-right' : ''}`}
          >
            {/* Daily Streak row */}
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-3xl font-black text-white leading-none">
                {streakCount}
              </span>
              <span className="text-2xl" aria-hidden="true">
                \uD83D\uDD25
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-white/60 font-medium">
                  {t('dashboard.stats.dailyStreak', { defaultValue: 'Daily Streak' })}
                </span>
                {/* Freeze (shield) count badge */}
                {freezeCount > 0 && (
                  <span className="text-xs text-blue-300 font-medium">
                    \uD83D\uDEE1\uFE0F {freezeCount}{' '}
                    {freezeCount === 1
                      ? t('streak.shield', { defaultValue: 'shield' })
                      : t('streak.shields', { defaultValue: 'shields' })}
                  </span>
                )}
                {/* Grace window warning */}
                {inGraceWindow && (
                  <span className="text-xs text-amber-300 font-medium">
                    {t('streak.graceWarning', { defaultValue: 'Practice soon!' })}
                  </span>
                )}
              </div>
            </div>

            {/* Daily Goals row */}
            <div>
              <div className={`flex items-center gap-2 mb-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-lg font-bold text-white">
                  {goalsCompleted}/{goalsTotal}
                </span>
                <span className="text-xs text-white/60 font-medium">
                  {t('dashboard.dailyGoals.title', { defaultValue: 'Daily Goals' })}
                </span>
              </div>

              {/* Thin progress bar */}
              <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                  style={{
                    width: `${goalsPercent}%`,
                    transition: reducedMotion ? 'none' : 'width 0.5s ease-out',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap in motion.div for entrance animation when reducedMotion is off
  if (reducedMotion) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {content}
    </motion.div>
  );
};

export default UnifiedStatsCard;
