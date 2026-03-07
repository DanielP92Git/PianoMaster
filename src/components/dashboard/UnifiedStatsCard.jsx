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
import flameIcon from '../../assets/icons/flame.png';

const UnifiedStatsCard = ({
  // XP data
  levelTitle = '',
  levelNumber = 1,
  progressPercentage = 0,
  xpCurrent = 0,
  xpTotal = 0,
  totalXP = 0,
  isPrestige = false,

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

  const gradientBorderStyle = {
    padding: '2px',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="relative rounded-2xl px-5 pt-4 pb-2">
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"
          style={gradientBorderStyle}
        />
        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex flex-1 flex-col items-center">
            <div className="mb-2 h-5 w-28 animate-pulse rounded bg-white/10" />
            <div className="h-[110px] w-[110px] animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="flex flex-1 flex-col gap-3 justify-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
              </div>
              <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div
      className="relative rounded-2xl bg-white/5 backdrop-blur-sm px-5 pt-4 pb-3"
      style={{
        boxShadow:
          '0 0 15px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Neon gradient border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-amber-400"
        style={gradientBorderStyle}
      />

      {/* Two equal halves */}
      <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Left half - title + XP ring */}
        <div className="flex flex-1 flex-col items-center">
          <h3
            className="mb-2 text-lg font-bold text-white leading-tight"
            style={{ textShadow: '0 0 10px rgba(167,139,250,0.7)' }}
          >
            {levelTitle}
          </h3>
          <XPRing
            progressPercentage={progressPercentage}
            xpCurrent={xpCurrent}
            xpTotal={xpTotal}
            isPrestige={isPrestige}
            size={130}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Right half - streak + goals */}
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          {/* Daily Streak */}
          <div className="flex flex-col items-center">
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span
                className="text-4xl font-black text-white leading-none"
                style={{ textShadow: '0 0 12px rgba(251,191,36,0.6), 0 0 30px rgba(251,191,36,0.3)' }}
              >
                {streakCount}
              </span>
              <img src={flameIcon} alt="" aria-hidden="true" className="-ml-1 -mr-2 -mt-1 h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
            </div>
            <span className="text-xs text-white/60 font-medium">
              {t('dashboard.stats.dailyStreak', { defaultValue: 'Daily Streak' })}
            </span>
            {freezeCount > 0 && (
              <span
                className="block text-xs text-cyan-300 font-medium"
                style={{ textShadow: '0 0 8px rgba(103,232,249,0.5)' }}
              >
                🛡️ {freezeCount}{' '}
                {freezeCount === 1
                  ? t('streak.shield', { defaultValue: 'shield' })
                  : t('streak.shields', { defaultValue: 'shields' })}
              </span>
            )}
          </div>

          {/* Daily Goals */}
          <div>
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-sm font-semibold text-white/70">
                {t('dashboard.dailyGoals.title', { defaultValue: 'Daily Goals' })}
              </span>
              <span className="text-sm font-bold text-white">
                {goalsCompleted}/{goalsTotal}
              </span>
              {goalsCompleted >= goalsTotal && (
                <span className="text-blue-400">✅</span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{
                  width: `${goalsPercent}%`,
                  transition: reducedMotion ? 'none' : 'width 0.5s ease-out',
                  boxShadow: '0 0 8px rgba(34,211,238,0.6), 0 0 20px rgba(34,211,238,0.3)',
                }}
              />
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
