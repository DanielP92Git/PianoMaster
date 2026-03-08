/**
 * UnitProgressCard Component
 *
 * Glass-morphism card displaying unit progress as a visual chapter break.
 * Shows unit number badge with gradient border glow, unit name, completion count, and star progress.
 * Purely informational (no click/tap interactivity).
 */

import { useTranslation } from 'react-i18next';
import { translateUnitName } from '../../utils/translateNodeName';

// Color scheme per unit number — gradient borders + glow
const UNIT_BADGE_COLORS = {
  1: {
    border: 'linear-gradient(135deg, #60a5fa, #3b82f6)',  // blue
    glow: 'rgba(59, 130, 246, 0.4)',
    text: '#93c5fd',
  },
  2: {
    border: 'linear-gradient(135deg, #fbbf24, #f59e0b)',  // yellow/amber
    glow: 'rgba(245, 158, 11, 0.4)',
    text: '#fcd34d',
  },
  3: {
    border: 'linear-gradient(135deg, #34d399, #10b981)',  // green/emerald
    glow: 'rgba(16, 185, 129, 0.4)',
    text: '#6ee7b7',
  },
  4: {
    border: 'linear-gradient(135deg, #c084fc, #a855f7)',  // purple
    glow: 'rgba(168, 85, 247, 0.4)',
    text: '#d8b4fe',
  },
  5: {
    border: 'linear-gradient(135deg, #f472b6, #ec4899)',  // pink
    glow: 'rgba(236, 72, 153, 0.4)',
    text: '#f9a8d4',
  },
  6: {
    border: 'linear-gradient(135deg, #fb923c, #f97316)',  // orange
    glow: 'rgba(249, 115, 22, 0.4)',
    text: '#fdba74',
  },
};

function getBadgeColors(unitOrder) {
  return UNIT_BADGE_COLORS[unitOrder] || UNIT_BADGE_COLORS[1];
}

const UnitProgressCard = ({
  unit,
  completedCount,
  totalCount,
  totalStars,
  maxStars,
  isUnitComplete
}) => {
  const { t } = useTranslation('trail');
  const unitOrder = unit?.order || 1;
  const colors = getBadgeColors(unitOrder);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden">
      {/* Glass background layer with frosted effect */}
      <div
        className="absolute inset-0 trail-unit-card-fallback"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)'
        }}
      />

      {/* Semi-opaque contrast overlay for WCAG 4.5:1 compliance */}
      <div className="absolute inset-0 bg-slate-900/40" />

      {/* Completed unit border glow (conditional) */}
      {isUnitComplete && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: '1.5px solid rgba(74, 222, 128, 0.5)',
            boxShadow: '0 0 10px rgba(74, 222, 128, 0.3), inset 0 0 6px rgba(74, 222, 128, 0.15)'
          }}
        />
      )}

      {/* Content layer */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        {/* Left side: numbered badge + unit info */}
        <div className="flex items-center gap-3">
          {/* Unit number badge with gradient border glow */}
          <div
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7)) padding-box, ${colors.border} border-box`,
              border: '2px solid transparent',
              boxShadow: `0 0 12px ${colors.glow}, 0 0 4px ${colors.glow}`,
            }}
          >
            <span
              className="text-sm font-extrabold"
              style={{ color: colors.text }}
            >
              {unitOrder}
            </span>
          </div>

          {/* Unit name and completion text */}
          <div className="flex flex-col">
            <div className="text-white font-bold text-sm drop-shadow-md font-quicksand">
              {translateUnitName(unit?.name, t) || t('units.unitLabel')}
            </div>
            <div className="text-white/80 text-xs">
              {completedCount}/{totalCount} {t('stats.complete', { defaultValue: 'complete' })}
            </div>
          </div>
        </div>

        {/* Right side: star display */}
        <div className="flex items-center gap-1 text-white/90 text-xs font-semibold">
          <span>{totalStars}/{maxStars}</span>
          <svg
            className="h-4 w-4 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default UnitProgressCard;
