/**
 * XPProgressCard Component
 *
 * Displays student's XP progress with level identity, progress bar, and XP stats.
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../../features/authentication/useUser';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getStudentXP, getLevelProgress, XP_LEVELS, calculateLevel, PRESTIGE_XP_PER_TIER } from '../../utils/xpSystem';

const XPProgressCard = () => {
  const { user } = useUser();
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const { reducedMotion } = useAccessibility();

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

  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
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

  const levelData = calculateLevel(totalXP);
  const isPrestige = levelData.isPrestige;
  const rawLevelTitle = levelData.title || 'Beginner';
  const levelTitle = isPrestige
    ? t('xpLevels.prestigeTitle', { tier: levelData.prestigeTier })
    : t(`xpLevels.${rawLevelTitle}`, { defaultValue: rawLevelTitle });
  const xpInCurrentLevel = progress.xpInCurrentLevel || 0;
  const xpNeededForNext = progress.xpNeededForNext || 0;
  const nextLevelXP = progress.nextLevelXP || 0;
  const currentLevelXP = level > 1 ? XP_LEVELS[level - 2].xpRequired : 0;
  const xpRange = nextLevelXP - currentLevelXP;
  const progressPercentage = progress.progressPercentage || 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(99,102,241,0.22)] backdrop-blur-md">
      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-bold text-white/90 drop-shadow ${isRTL ? 'text-right' : ''}`}>
          {t('dashboard.xpProgress.title', { defaultValue: 'Your Progress' })}
        </h3>
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
          {isPrestige
            ? t('xpLevels.prestigeTitle', { tier: levelData.prestigeTier })
            : t('dashboard.xpProgress.levelLabel', { defaultValue: 'Level {{level}}', level })}
        </p>
      </div>

      {/* Horizontal progress bar */}
      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full ${isPrestige ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500' : 'bg-gradient-to-r from-blue-400 to-indigo-600'} ${
            reducedMotion
              ? 'transition-opacity duration-100'
              : 'transition-all duration-500'
          }`}
          style={{
            width: `${progressPercentage}%`,
            ...(isPrestige ? { boxShadow: '0 0 8px rgba(251,191,36,0.6)' } : {}),
          }}
        />
      </div>

      {/* XP stats row */}
      <div className={`flex items-center justify-between text-xs font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-white/70">
          {t('dashboard.xpProgress.currentXP', {
            defaultValue: '{{current}} / {{total}} XP',
            current: xpInCurrentLevel,
            total: isPrestige ? PRESTIGE_XP_PER_TIER : xpRange,
          })}
        </span>
        <span className={isPrestige ? "text-amber-300" : "text-blue-300"}>
          {t('dashboard.xpProgress.xpToNext', {
            defaultValue: '{{xp}} XP to Level {{nextLevel}}',
            xp: xpNeededForNext,
            nextLevel: level + 1,
          })}
        </span>
      </div>
    </div>
  );
};

export default XPProgressCard;
