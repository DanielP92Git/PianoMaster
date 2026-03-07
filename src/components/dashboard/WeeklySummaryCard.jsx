/**
 * WeeklySummaryCard Component
 *
 * Displays rolling 7-day progress: days practiced, nodes completed, exercises done.
 * Shows a golden celebration border when the student practiced every day.
 */

import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';

const CircularProgress = ({ value, max, size = 40, strokeWidth = 3 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(129,140,248)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-xs font-bold"
        fontSize={size * 0.3}
      >
        {value}
      </text>
    </svg>
  );
};

const WeeklySummaryCard = ({ data, isLoading = false }) => {
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div className="mb-4 h-5 w-28 rounded bg-white/10" />
        <div className="flex justify-around">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div className="h-3 w-12 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPerfectWeek = data.allSevenDays;

  return (
    <div
      className={`rounded-3xl border p-6 shadow-xl backdrop-blur-md ${
        isPerfectWeek
          ? 'border-amber-400/40 bg-white/5'
          : 'border-white/10 bg-white/5'
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-indigo-300" />
        <h3 className="text-sm font-semibold text-white/90">
          {t('dashboard.weeklySummary.title')}
        </h3>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-around">
        {/* Days practiced */}
        <div className="flex flex-col items-center gap-1.5">
          <CircularProgress value={data.daysPracticed} max={7} />
          <span className="text-xs text-white/60">
            {t('dashboard.weeklySummary.daysPracticed')}
          </span>
        </div>

        {/* Nodes completed */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl font-bold text-white/90">
            {data.nodesCompleted}
          </span>
          <span className="text-xs text-white/60">
            {t('dashboard.weeklySummary.nodesCompleted')}
          </span>
        </div>

        {/* Exercises done */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl font-bold text-white/90">
            {data.exercisesCompleted}
          </span>
          <span className="text-xs text-white/60">
            {t('dashboard.weeklySummary.exercisesDone')}
          </span>
        </div>
      </div>

      {/* Perfect week celebration */}
      {isPerfectWeek && (
        <p className="mt-3 text-center text-xs font-medium text-amber-300">
          {t('dashboard.weeklySummary.perfectWeek')}
        </p>
      )}
    </div>
  );
};

export default WeeklySummaryCard;
