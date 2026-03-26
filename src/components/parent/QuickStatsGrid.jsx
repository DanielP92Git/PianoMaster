import { useTranslation } from 'react-i18next';
import SKILL_NODES from '../../data/skillTrail';

/**
 * Single stat card — glass card with centered value + label.
 * Shows loading skeleton when `loading` is true.
 * Shows em dash when value is null/undefined (fetch error per UI-SPEC).
 */
function StatCard({ label, value, loading }) {
  if (loading) {
    return <div className="animate-pulse bg-white/10 rounded-xl h-20" />;
  }
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col items-center justify-center">
      <span className="text-2xl font-bold text-indigo-300" dir="ltr">
        {value !== null && value !== undefined ? value : '\u2014'}
      </span>
      <span className="text-sm text-white/70 mt-1">{label}</span>
    </div>
  );
}

/**
 * QuickStatsGrid — 2x2 grid of stat cards showing child's progress snapshot.
 * Per D-08: simple glass cards with numbers, no charts, no per-path breakdown.
 *
 * Props:
 *   xpData        - from getStudentXP() query result (or undefined if loading/error)
 *   progressData  - from getStudentProgress() query result (or undefined)
 *   streakState   - from streakService.getStreakState() query result (or undefined)
 *   isLoading     - true while any data query is in flight
 */
export default function QuickStatsGrid({ xpData, progressData, streakState, isLoading }) {
  const { t } = useTranslation('common');

  const level = xpData?.levelData?.level ?? null;
  const totalStars = progressData
    ? progressData.reduce((sum, p) => sum + (p.stars || 0), 0)
    : null;
  const validNodeIds = new Set(SKILL_NODES.map(n => n.id));
  const nodesCompleted = progressData
    ? progressData.filter(p => p.stars > 0 && validNodeIds.has(p.node_id)).length
    : null;
  const streak = streakState?.streakCount ?? null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        label={t('parentPortal.statLevel')}
        value={level}
        loading={isLoading}
      />
      <StatCard
        label={t('parentPortal.statStars')}
        value={totalStars}
        loading={isLoading}
      />
      <StatCard
        label={t('parentPortal.statNodes')}
        value={nodesCompleted !== null ? `${nodesCompleted}/${SKILL_NODES.length}` : null}
        loading={isLoading}
      />
      <StatCard
        label={t('parentPortal.statStreak')}
        value={streak}
        loading={isLoading}
      />
    </div>
  );
}
