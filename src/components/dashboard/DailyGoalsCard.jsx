/**
 * DailyGoalsCard Component
 *
 * Displays today's 3 daily goals with progress tracking
 */

import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle } from 'lucide-react';

const DailyGoalsCard = ({ goals = [], isLoading = false }) => {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
        <div className="mb-4 h-6 w-32 animate-pulse rounded bg-white/10" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const completedCount = goals.filter(g => g.completed).length;
  const allCompleted = completedCount === goals.length && goals.length > 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(99,102,241,0.22)] backdrop-blur-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between" dir={isRTL ? 'rtl' : 'ltr'}>
        <h3 className="text-lg font-bold text-white/90 drop-shadow">
          {t('dashboard.dailyGoals.title', { defaultValue: 'Daily Goals' })}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white/70">
            {completedCount}/{goals.length}
          </span>
          {allCompleted && (
            <span className="text-xl">🎉</span>
          )}
        </div>
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {goals.map((goal, index) => {
          const progressPercentage = Math.min((goal.progress / goal.target) * 100, 100);

          return (
            <div
              key={goal.id || `goal-${index}`}
              className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-300 ${
                goal.completed ? 'bg-green-500/10 border-green-400/30' : ''
              }`}
            >
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-xl">
                  {goal.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <span>{goal.icon}</span>
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${goal.completed ? 'text-green-300' : 'text-white/90'}`}>
                        {goal.nameKey
                          ? t(`dashboard.dailyGoals.goals.${goal.nameKey}.name`)
                          : goal.name || 'Goal'}
                      </div>
                      <div className="mt-0.5 text-xs text-white/60">
                        {goal.descriptionKey
                          ? t(`dashboard.dailyGoals.goals.${goal.descriptionKey}.description`, { target: goal.target })
                          : goal.description || 'Complete this goal'}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-white/70">
                      {Math.min(goal.progress, goal.target)}/{goal.target}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        goal.completed
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* All completed message */}
      {allCompleted && (
        <div className="mt-4 rounded-xl border border-green-400/30 bg-green-500/10 p-3 text-center">
          <div className="text-sm font-semibold text-green-300">
            {t('dashboard.dailyGoals.allComplete', { defaultValue: 'All goals completed today!' })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="py-8 text-center">
          <Circle className="mx-auto mb-2 h-12 w-12 text-white/20" />
          <p className="text-sm text-white/60">
            {t('dashboard.dailyGoals.noGoals', { defaultValue: 'No goals available' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyGoalsCard;
