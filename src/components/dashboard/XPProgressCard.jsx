/**
 * XPProgressCard Component
 *
 * Displays student's XP progress with level identity, progress bar, and XP stats.
 * Badge animates on first visit after level change (not every page load).
 */

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../../features/authentication/useUser';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getStudentXP, getLevelProgress, XP_LEVELS } from '../../utils/xpSystem';
import { getLastSeenLevel, setLastSeenLevel } from '../../utils/levelUpTracking';

const XPProgressCard = () => {
  const { user } = useUser();
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const { reducedMotion } = useAccessibility();
  const badgeRef = useRef(null);

  // Fetch student XP data
  const { data: xpData, isLoading } = useQuery({
    queryKey: ['student-xp', user?.id],
    queryFn: () => getStudentXP(user.id),
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const level = xpData?.levelData?.level || 1;
  const totalXP = xpData?.totalXP || 0;
  const progress = xpData?.progress || getLevelProgress(0);

  // Badge color progression (colorblind-safe)
  const getBadgeGradient = (lvl) => {
    if (lvl <= 3) return 'from-gray-400 to-gray-500'; // Bronze/starter
    if (lvl <= 6) return 'from-blue-400 to-blue-600'; // Silver
    if (lvl <= 9) return 'from-amber-400 to-amber-600'; // Gold
    if (lvl <= 12) return 'from-purple-400 to-purple-600'; // Platinum
    return 'from-pink-400 via-purple-500 to-indigo-600'; // Legend/Rainbow
  };

  // Badge animation trigger: compare last seen level with current level
  useEffect(() => {
    if (!user?.id || isLoading || reducedMotion) return;

    const lastSeenLevel = getLastSeenLevel(user.id);

    // If level changed since last dashboard visit, trigger animation
    if (lastSeenLevel !== null && lastSeenLevel !== level) {
      // Apply pulse animation
      if (badgeRef.current) {
        badgeRef.current.style.animation = 'pulse 1s ease-in-out 2';
      }

      // Update last seen level after animation
      setTimeout(() => {
        setLastSeenLevel(user.id, level);
      }, 2000); // Wait for 2 pulses
    } else if (lastSeenLevel === null) {
      // First visit - set level without animation
      setLastSeenLevel(user.id, level);
    }
  }, [user?.id, level, isLoading, reducedMotion]);

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mb-2 h-8 w-40 animate-pulse rounded bg-white/10 mx-auto" />
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-white/10 mx-auto" />
        <div className="mb-2 h-3 w-full animate-pulse rounded-full bg-white/10" />
        <div className="flex justify-between">
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    );
  }

  const isMaxLevel = level >= 15;
  const levelTitle = XP_LEVELS[level - 1]?.title || 'Beginner';
  const levelIcon = XP_LEVELS[level - 1]?.icon || '🌱';
  const xpInCurrentLevel = progress.xpInCurrentLevel || 0;
  const xpNeededForNext = progress.xpNeededForNext || 0;
  const nextLevelXP = progress.nextLevelXP || 0;
  const currentLevelXP = level > 1 ? XP_LEVELS[level - 2].xpRequired : 0;
  const xpRange = nextLevelXP - currentLevelXP;
  const progressPercentage = progress.progressPercentage || 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(99,102,241,0.22)] backdrop-blur-md">
      {/* Header row */}
      <div className={`mb-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h3 className="text-lg font-bold text-white/90 drop-shadow">
          {t('dashboard.xpProgress.title', { defaultValue: 'Your Progress' })}
        </h3>

        {/* Level badge icon */}
        <div
          ref={badgeRef}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${getBadgeGradient(level)} shadow-lg`}
        >
          <span className="text-xl">{levelIcon}</span>
        </div>
      </div>

      {/* Level name headline */}
      <div className="text-center mb-1">
        <h2 className="text-2xl font-bold text-white drop-shadow">
          {levelTitle}
        </h2>
      </div>

      {/* Level subtext */}
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-white/60">
          {isMaxLevel
            ? t('dashboard.xpProgress.maxLevel', { defaultValue: 'MAX LEVEL' })
            : t('dashboard.xpProgress.levelLabel', { defaultValue: 'Level {{level}}', level })}
        </p>
      </div>

      {/* Horizontal progress bar */}
      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full bg-gradient-to-r from-blue-400 to-indigo-600 ${
            reducedMotion
              ? 'transition-opacity duration-100'
              : 'transition-all duration-500'
          }`}
          style={{ width: `${isMaxLevel ? 100 : progressPercentage}%` }}
        />
      </div>

      {/* XP stats row */}
      <div className={`flex items-center justify-between text-xs font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-white/70">
          {isMaxLevel
            ? t('dashboard.xpProgress.maxXP', { defaultValue: '{{xp}} XP', xp: totalXP })
            : t('dashboard.xpProgress.currentXP', {
                defaultValue: '{{current}} / {{total}} XP',
                current: xpInCurrentLevel,
                total: xpRange,
              })}
        </span>
        {!isMaxLevel && (
          <span className="text-blue-300">
            {t('dashboard.xpProgress.xpToNext', {
              defaultValue: '{{xp}} XP to Level {{nextLevel}}',
              xp: xpNeededForNext,
              nextLevel: level + 1,
            })}
          </span>
        )}
      </div>
    </div>
  );
};

export default XPProgressCard;
