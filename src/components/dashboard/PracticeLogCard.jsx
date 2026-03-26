/**
 * PracticeLogCard Component
 *
 * Displays a daily instrument practice logging card with 4 states:
 *   1. Loading skeleton
 *   2. Active prompt (not yet logged today)
 *   3. Logging in progress (2-second hold after tap)
 *   4. Completed (practiced today)
 *
 * Per D-01: glass card pattern matching DailyChallengeCard
 * Per D-03: practice streak lives inline in this card
 * Per D-09: Piano icon (not Flame — visually distinct from app-usage streak)
 * Per D-10: emerald/green accent color scheme
 * Per D-15/INFRA-05: all text via i18n keys under 'practice' namespace
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Piano, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../../features/authentication/useUser';
import { practiceLogService } from '../../services/practiceLogService';
import { practiceStreakService } from '../../services/practiceStreakService';
import { getCalendarDate } from '../../utils/dateUtils';
import { useMotionTokens } from '../../utils/useMotionTokens';
import { MilestoneCelebrationModal } from '../celebrations/MilestoneCelebrationModal';

// Milestone thresholds — module-level constant (never changes, avoids dep churn)
const MILESTONES = [5, 10, 21, 30];

const PracticeLogCard = () => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { reduce } = useMotionTokens();

  // Local state for button/card transition (per D-06, D-07)
  // 'idle' -> 'logging' -> 'settled'
  const [logState, setLogState] = useState('idle');

  // Celebration state — set when a milestone streak is reached (D-01, D-02)
  const [celebrationMilestone, setCelebrationMilestone] = useState(null);

  const localDate = getCalendarDate();

  // Query: today's practice log status
  const { data: logStatus, isLoading: logLoading } = useQuery({
    queryKey: ['practice-log-today', user?.id, localDate],
    queryFn: () => practiceLogService.getTodayStatus(localDate),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Query: practice streak
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['practice-streak', user?.id],
    queryFn: () => practiceStreakService.getPracticeStreak(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const streakCount = streakData?.streakCount ?? 0;
  const isLoading = logLoading || streakLoading;

  // On mount: if already logged today, set to settled immediately (D-08 — no flash of idle state)
  useEffect(() => {
    if (logStatus?.logged === true && logState === 'idle') {
      setLogState('settled');
    }
  }, [logStatus?.logged, logState]);

  // Mutation: log practice
  const logMutation = useMutation({
    mutationFn: (date) => practiceLogService.logPractice(date),
  });

  const handleLog = useCallback(() => {
    if (logState !== 'idle') return;
    setLogState('logging');

    logMutation.mutate(localDate, {
      onSuccess: async ({ inserted }) => {
        if (inserted) {
          // Update practice streak when a new log was inserted
          const weekendPass = queryClient.getQueryData(['streak-state', user?.id]);
          const wpEnabled = weekendPass?.weekendPassEnabled ?? false;
          const streakResult = await practiceStreakService.updatePracticeStreak(localDate, wpEnabled);
          queryClient.invalidateQueries({ queryKey: ['practice-streak', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['xp'] }); // refresh XP display

          // Milestone detection (D-01, D-02, D-07)
          // CRITICAL: use streakResult (fresh return value), NOT streakData (stale cache) — Pitfall 3
          const { streakCount: newStreakCount, lastMilestoneCelebrated } = streakResult;
          const eligible = MILESTONES.filter(
            (m) => newStreakCount >= m && m > (lastMilestoneCelebrated ?? 0)
          );
          if (eligible.length > 0) {
            const milestone = eligible.at(-1); // largest eligible milestone (D-07: >= not ===)
            setCelebrationMilestone(milestone);
            // Fire-and-forget: update DB so milestone won't re-trigger (D-14, Pitfall 4)
            practiceStreakService.updateLastMilestoneCelebrated(milestone).catch(() => {});
          }
        }
        // Instant cache update — prevents loading flash when navigating back (D-08)
        queryClient.setQueryData(['practice-log-today', user?.id, localDate], { logged: true });

        // 2-second hold before settling to completed state (D-07)
        setTimeout(() => setLogState('settled'), 2000);
      },
      onError: () => {
        // Silent failure — revert to idle so user can retry (D-07 error state)
        setLogState('idle');
      },
    });
  }, [logState, localDate, user?.id, logMutation, queryClient]);

  const handleDismissCelebration = useCallback(() => {
    setCelebrationMilestone(null);
  }, []);

  // ─── State 1: Loading skeleton ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-10 animate-pulse rounded-lg bg-white/5" />
        </div>
        {celebrationMilestone && (
          <MilestoneCelebrationModal
            milestone={celebrationMilestone}
            onClose={handleDismissCelebration}
          />
        )}
      </>
    );
  }

  const isCompleted = logState === 'settled' || logStatus?.logged === true;
  const isLogging = logState === 'logging';

  // ─── State 4: Completed (practiced today) ────────────────────────────────────
  if (isCompleted) {
    return (
      <>
        <div className="rounded-xl border border-emerald-400/30 bg-white/10 p-4 shadow-lg backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
            <Piano className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-white">{t('practice.card.title')}</h3>
          </div>

          {/* Completed content area */}
          <div className="mt-3 rounded-lg border border-green-400/30 bg-green-500/10 p-3">
            <div className="flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
              <CheckCircle className="h-5 w-5 shrink-0 text-green-400" aria-hidden="true" />
              <div>
                <div className="text-sm font-bold text-green-300">
                  {t('practice.card.completedHeading')}
                </div>
                <div className="text-xs text-white/60">
                  {t('practice.card.xpEarned', { xp: 25 })}
                </div>
              </div>
            </div>

            {/* Streak row — only visible when streak >= 1 */}
            {streakCount > 0 && (
              <div className="mt-2" dir={isRTL ? 'rtl' : 'ltr'}>
                <span className="text-xs text-white/60">
                  {streakCount} {t('practice.streak.dayLabel', { count: streakCount })}
                </span>
              </div>
            )}
          </div>
        </div>
        {celebrationMilestone && (
          <MilestoneCelebrationModal
            milestone={celebrationMilestone}
            onClose={handleDismissCelebration}
          />
        )}
      </>
    );
  }

  // ─── State 2 + 3: Active prompt / Logging in progress ────────────────────────
  return (
    <>
      <div className="rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center gap-2" dir={isRTL ? 'rtl' : 'ltr'}>
          <Piano className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h3 className="text-sm font-bold text-white">{t('practice.card.title')}</h3>
        </div>

        {/* Content area */}
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-white/70">{t('practice.card.prompt')}</p>

          {/* Streak row — only visible when streak >= 1 */}
          {streakCount > 0 && (
            <div className="mt-2" dir={isRTL ? 'rtl' : 'ltr'}>
              <span className="text-sm font-bold text-green-300">{streakCount}</span>
              <span className="text-xs text-white/60">
                {' '}{t('practice.streak.dayLabel', { count: streakCount })}
              </span>
            </div>
          )}
        </div>

        {/* Log button */}
        <button
          className={`mt-3 w-full min-h-[44px] rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors ${
            isLogging
              ? 'cursor-default bg-emerald-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          onClick={handleLog}
          disabled={isLogging}
          aria-disabled={isLogging}
        >
          {isLogging ? (
            <span className="flex items-center justify-center gap-2">
              {/* CheckCircle with scale-in animation (skipped for reduced-motion) */}
              {reduce ? (
                <CheckCircle className="h-4 w-4 text-white" aria-hidden="true" />
              ) : (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  style={{ display: 'inline-flex' }}
                >
                  <CheckCircle className="h-4 w-4 text-white" aria-hidden="true" />
                </motion.span>
              )}
              {t('practice.card.loggingText')}
              <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs font-bold text-emerald-300">
                {t('practice.card.xpBadge')}
              </span>
            </span>
          ) : (
            t('practice.card.logButton')
          )}
        </button>
      </div>
      {celebrationMilestone && (
        <MilestoneCelebrationModal
          milestone={celebrationMilestone}
          onClose={handleDismissCelebration}
        />
      )}
    </>
  );
};

export default PracticeLogCard;
