/**
 * UnitProgressCard Component
 *
 * Glass-morphism card displaying unit progress as a visual chapter break.
 * Shows unit name, theme icon, completion count, and star progress.
 * Purely informational (no click/tap interactivity).
 */

import { useTranslation } from 'react-i18next';
import { translateUnitName } from '../../utils/translateNodeName';

const UnitProgressCard = ({
  unit,
  completedCount,
  totalCount,
  totalStars,
  maxStars,
  isUnitComplete
}) => {
  const { t } = useTranslation('trail');

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
        {/* Left side: icon + unit info */}
        <div className="flex items-center gap-3">
          {/* Unit theme icon */}
          <div className="text-2xl">
            {unit?.icon || '📚'}
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
