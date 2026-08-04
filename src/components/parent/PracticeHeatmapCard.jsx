/**
 * PracticeHeatmapCard — Parent portal monthly practice calendar
 *
 * Displays a month-view calendar showing the child's instrument practice history.
 * Parents navigate between months with prev/next arrows. Always visible regardless
 * of subscription status (D-02).
 *
 * States:
 *   1. Loading — animated pulse skeletons
 *   2. Empty  — full gray grid + encouraging message (D-10)
 *   3. Populated — gray (not practiced) + emerald (practiced) cells (D-05, D-06)
 *   4. Error — error message text
 *
 * RTL: Calendar grid always renders LTR (Sunday-left, standard in Israeli calendars).
 *   Card header, stats, and month navigation respect RTL via flex-row-reverse.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Piano, ChevronLeft, ChevronRight } from "lucide-react";
import {
  practiceLogService,
  computeLongestStreak,
} from "../../services/practiceLogService";
import { practiceStreakService } from "../../services/practiceStreakService";
import { getCalendarDate } from "../../utils/dateUtils";
import { useActiveChildId } from "../../hooks/useActiveChildId";

/**
 * PracticeHeatmapCard
 *
 * Resolves the active child id itself via useActiveChildId() — no id prop needed.
 * RLS still enforces the authenticated session can only reach children it owns.
 */
export default function PracticeHeatmapCard() {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const locale = i18n.language || "en";
  const { childId, ready } = useActiveChildId();

  // Month navigation state
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const goToPrevMonth = () => {
    setDisplayMonth((prev) => {
      const m = prev.month === 0 ? 11 : prev.month - 1;
      const y = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const goToNextMonth = () => {
    setDisplayMonth((prev) => {
      const m = prev.month === 11 ? 0 : prev.month + 1;
      const y = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: y, month: m };
    });
  };

  const now = new Date();
  const isCurrentMonth =
    displayMonth.year === now.getFullYear() &&
    displayMonth.month === now.getMonth();

  // Compute the 52-week date range for stats (363 days ago to today)
  const endDate = getCalendarDate();
  const startDate = useMemo(() => {
    const end = new Date(endDate + "T00:00:00");
    const start = new Date(end.getTime() - 363 * 24 * 60 * 60 * 1000);
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  }, [endDate]);

  // Query 1: 52 weeks of practice history
  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: ["practice-history", childId],
    queryFn: () =>
      practiceLogService.getHistoricalLogs(childId, startDate, endDate),
    enabled: ready && !!childId,
    staleTime: 5 * 60 * 1000,
  });

  // Query 2: current practice streak
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ["practice-streak", childId],
    queryFn: () => practiceStreakService.getPracticeStreak(childId),
    enabled: ready && !!childId,
    staleTime: 5 * 60 * 1000,
  });

  // Set of practiced date strings for fast lookup
  const practicedSet = useMemo(
    () => new Set((historyData ?? []).map((r) => r.practiced_on)),
    [historyData]
  );

  // Derived stats
  const totalDays = (historyData ?? []).length;
  const longestStreak = useMemo(
    () => computeLongestStreak(historyData ?? []),
    [historyData]
  );
  const currentStreak = streakData?.streakCount ?? 0;

  const bothLoading = historyLoading || streakLoading;

  // Locale-aware weekday names (Sun-Sat)
  const weekdayNames = useMemo(() => {
    // Jan 4, 2026 is a Sunday
    return Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
        new Date(2026, 0, 4 + i)
      )
    );
  }, [locale]);

  // Month/year label for the header
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(displayMonth.year, displayMonth.month, 1)),
    [locale, displayMonth]
  );

  // Calendar grid cells for the displayed month
  const calendarCells = useMemo(() => {
    const { year, month } = displayMonth;
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getCalendarDate();

    const cells = [];
    // Empty cells before the 1st
    for (let i = 0; i < startDow; i++) {
      cells.push({ key: `e-${i}`, day: null });
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        key: dateStr,
        day: d,
        practiced: practicedSet.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }
    return cells;
  }, [displayMonth, practicedSet]);

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  // ── Loading state ──
  if (bothLoading) {
    return (
      <section
        aria-label={t("parentPortal.practiceCalendar.ariaLabel")}
        data-section="practice-heatmap"
        className="rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
          <div className="h-5 w-36 animate-pulse rounded bg-white/10" />
        </div>
        <div
          role="status"
          aria-label={t("parentPortal.practiceCalendar.loadingLabel")}
        >
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-white/10"
              />
            ))}
          </div>
          <div className="h-40 w-full animate-pulse rounded bg-white/10" />
        </div>
      </section>
    );
  }

  // ── Populated / Empty / Error state ──
  return (
    <section
      aria-label={t("parentPortal.practiceCalendar.ariaLabel")}
      data-section="practice-heatmap"
      className="rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md"
    >
      {/* Card header */}
      <div
        className={`mb-4 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <Piano className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">
          {t("parentPortal.practiceCalendar.title")}
        </h2>
      </div>

      {/* Summary stats row */}
      <div
        className="mb-4 grid grid-cols-3 gap-2"
        dir={isRTL ? "rtl" : undefined}
      >
        <dl className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dd className="text-xl font-bold text-white">{totalDays}</dd>
          <dt className="text-xs text-white/60">
            {t("parentPortal.practiceCalendar.statTotalLabel")}
          </dt>
        </dl>
        <dl className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dd className="text-xl font-bold text-white">{currentStreak}</dd>
          <dt className="text-xs text-white/60">
            {t("parentPortal.practiceCalendar.statStreakLabel")}
          </dt>
        </dl>
        <dl className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <dd className="text-xl font-bold text-white">{longestStreak}</dd>
          <dt className="text-xs text-white/60">
            {t("parentPortal.practiceCalendar.statLongestLabel")}
          </dt>
        </dl>
      </div>

      {/* Month navigation */}
      <div
        className={`mb-3 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <button
          onClick={goToPrevMonth}
          aria-label={t("parentPortal.practiceCalendar.prevMonth")}
          className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <PrevIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white">{monthLabel}</span>
        <button
          onClick={goToNextMonth}
          disabled={isCurrentMonth}
          aria-label={t("parentPortal.practiceCalendar.nextMonth")}
          className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <NextIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1" dir="ltr">
        {weekdayNames.map((name, i) => (
          <div
            key={i}
            className="py-1 text-center text-xs font-medium text-white/40"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar day grid */}
      <div className="grid grid-cols-7 gap-1" dir="ltr">
        {calendarCells.map((cell) => (
          <div
            key={cell.key}
            className={`flex aspect-square items-center justify-center rounded-md text-xs font-medium ${
              !cell.day
                ? ""
                : cell.isFuture
                  ? "text-white/20"
                  : cell.practiced
                    ? "bg-emerald-400/80 text-white"
                    : "bg-white/15 text-white/50"
            } ${cell.isToday ? "ring-1 ring-white/40" : ""}`}
          >
            {cell.day}
          </div>
        ))}
      </div>

      {/* Empty state message */}
      {totalDays === 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-white/70">
            {t("parentPortal.practiceCalendar.emptyHeading")}
          </p>
          <p className="mt-1 text-sm text-white/60">
            {t("parentPortal.practiceCalendar.emptyBody")}
          </p>
        </div>
      )}

      {/* Error state */}
      {historyError && (
        <p className="mt-4 text-center text-sm text-red-300">
          {t("parentPortal.practiceCalendar.errorMessage")}
        </p>
      )}
    </section>
  );
}
