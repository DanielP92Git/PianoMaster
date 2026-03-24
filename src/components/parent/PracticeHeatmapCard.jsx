/**
 * PracticeHeatmapCard — Parent portal heatmap visualization
 *
 * Displays a 52-week GitHub-style activity calendar showing the child's
 * instrument practice history. Always visible regardless of subscription status (D-02).
 *
 * States:
 *   1. Loading — animated pulse skeletons
 *   2. Empty  — full 52-week gray grid + encouraging message (D-10)
 *   3. Populated — gray (not practiced) + emerald (practiced) cells (D-05, D-06)
 *   4. Error — error message text
 *
 * RTL (D-04): scaleX(-1) CSS transform on the ActivityCalendar element inside a
 * direction:ltr wrapper. showMonthLabels disabled in RTL to avoid mirrored text (Pitfall 4).
 *
 * v3 prop names verified (04-RESEARCH.md Pitfall 1):
 *   - showColorLegend={false}  (NOT hideColorLegend)
 *   - showTotalCount={false}   (NOT hideTotalCount)
 *   - NO interactive prop (removed in v3)
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ActivityCalendar } from 'react-activity-calendar';
import { Piano } from 'lucide-react';
import {
  practiceLogService,
  buildHeatmapData,
  computeLongestStreak,
} from '../../services/practiceLogService';
import { practiceStreakService } from '../../services/practiceStreakService';
import { getCalendarDate } from '../../utils/dateUtils';

/**
 * Return locale-aware short month names for the ActivityCalendar labels prop.
 * @param {string} locale - BCP 47 language tag (e.g. "en", "he")
 * @returns {string[]} 12 short month name strings
 */
function getMonthLabels(locale) {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2024, i, 1))
  );
}

/**
 * PracticeHeatmapCard
 *
 * @param {Object} props
 * @param {string} [props.studentId] - Used only for TanStack Query key.
 *   Supabase queries use session.user.id to enforce RLS (04-RESEARCH.md note).
 */
export default function PracticeHeatmapCard({ studentId }) {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const locale = i18n.language || 'en';

  // Compute the 52-week date range (363 days ago to today)
  const endDate = getCalendarDate(); // "YYYY-MM-DD" local timezone
  const startDate = useMemo(() => {
    const end = new Date(endDate + 'T00:00:00');
    const start = new Date(end.getTime() - 363 * 24 * 60 * 60 * 1000);
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  }, [endDate]);

  // Responsive block size: 10px on mobile (<640px), 12px on sm+
  const blockSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 12;

  // Query 1: 52 weeks of practice history
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ['practice-history', studentId],
    queryFn: () => practiceLogService.getHistoricalLogs(startDate, endDate),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  // Query 2: current practice streak
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['practice-streak', studentId],
    queryFn: () => practiceStreakService.getPracticeStreak(),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  // Derived stats (memoized)
  const heatmapData = useMemo(
    () => buildHeatmapData(historyData ?? [], new Date()),
    [historyData]
  );
  const totalDays = (historyData ?? []).length;
  const longestStreak = useMemo(
    () => computeLongestStreak(historyData ?? []),
    [historyData]
  );
  const currentStreak = streakData?.streakCount ?? 0;

  const bothLoading = historyLoading || streakLoading;

  // Month labels for LTR locale (not shown in RTL — Pitfall 4)
  const localeMonthNames = useMemo(() => getMonthLabels(locale), [locale]);

  // ── Loading state ──
  if (bothLoading) {
    return (
      <section
        aria-label={t('parentPortal.practiceCalendar.ariaLabel')}
        data-section="practice-heatmap"
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6"
      >
        {/* Card header skeleton */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white/10 animate-pulse rounded h-5 w-5" />
          <div className="bg-white/10 animate-pulse rounded h-5 w-36" />
        </div>

        {/* Stats skeleton */}
        <div role="status" aria-label={t('parentPortal.practiceCalendar.loadingLabel')}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white/10 animate-pulse rounded-lg h-14" />
            ))}
          </div>
          <div className="bg-white/10 animate-pulse rounded h-24 w-full" />
        </div>
      </section>
    );
  }

  // ── Populated / Empty / Error state ──
  return (
    <section
      aria-label={t('parentPortal.practiceCalendar.ariaLabel')}
      data-section="practice-heatmap"
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6"
    >
      {/* Card header */}
      <div className={`flex items-center gap-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Piano className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">
          {t('parentPortal.practiceCalendar.title')}
        </h2>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4" dir={isRTL ? 'rtl' : undefined}>
        {/* Stat 1: Total days practiced */}
        <dl className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <dd className="text-xl font-bold text-white">{totalDays}</dd>
          <dt className="text-xs text-white/60">{t('parentPortal.practiceCalendar.statTotalLabel')}</dt>
        </dl>

        {/* Stat 2: Current streak */}
        <dl className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <dd className="text-xl font-bold text-white">{currentStreak}</dd>
          <dt className="text-xs text-white/60">{t('parentPortal.practiceCalendar.statStreakLabel')}</dt>
        </dl>

        {/* Stat 3: Longest streak */}
        <dl className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
          <dd className="text-xl font-bold text-white">{longestStreak}</dd>
          <dt className="text-xs text-white/60">{t('parentPortal.practiceCalendar.statLongestLabel')}</dt>
        </dl>
      </div>

      {/* Heatmap grid — always rendered (even empty state shows all-gray grid per D-10) */}
      <div className="overflow-x-auto">
        {isRTL ? (
          // RTL: wrap in direction:ltr, apply scaleX(-1) to mirror the grid.
          // showMonthLabels disabled to avoid double-mirror of text labels (Pitfall 4).
          <div style={{ direction: 'ltr' }}>
            <ActivityCalendar
              style={{ transform: 'scaleX(-1)' }}
              data={heatmapData}
              maxLevel={1}
              theme={{ light: ['rgba(255,255,255,0.15)', '#34d399'] }}
              colorScheme="light"
              blockSize={blockSize}
              blockRadius={3}
              blockMargin={3}
              showColorLegend={false}
              showTotalCount={false}
              showWeekdayLabels={false}
              showMonthLabels={false}
              loading={historyLoading}
              aria-label={t('parentPortal.practiceCalendar.ariaLabel')}
            />
          </div>
        ) : (
          <ActivityCalendar
            data={heatmapData}
            maxLevel={1}
            theme={{ light: ['rgba(255,255,255,0.15)', '#34d399'] }}
            colorScheme="light"
            blockSize={blockSize}
            blockRadius={3}
            blockMargin={3}
            showColorLegend={false}
            showTotalCount={false}
            showWeekdayLabels={false}
            showMonthLabels={true}
            loading={historyLoading}
            labels={{ months: localeMonthNames }}
            aria-label={t('parentPortal.practiceCalendar.ariaLabel')}
          />
        )}
      </div>

      {/* Empty state message — shown below the all-gray grid (D-10) */}
      {!historyLoading && totalDays === 0 && (
        <div className="text-center mt-4">
          <p className="text-sm font-medium text-white/70">
            {t('parentPortal.practiceCalendar.emptyHeading')}
          </p>
          <p className="text-sm text-white/60 mt-1">
            {t('parentPortal.practiceCalendar.emptyBody')}
          </p>
        </div>
      )}

      {/* Error state */}
      {historyError && (
        <p className="text-sm text-red-300 mt-4 text-center">
          {t('parentPortal.practiceCalendar.errorMessage')}
        </p>
      )}
    </section>
  );
}
