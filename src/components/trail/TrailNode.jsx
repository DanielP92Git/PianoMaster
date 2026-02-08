/**
 * TrailNode Component
 *
 * Displays a single node on the skill trail map with game-like visual styling
 * States: locked (gray+padlock), available (blue+play), in-progress (blue+play), completed (green+checkmark)
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { translateNodeName } from '../../utils/translateNodeName';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getNodeStateConfig } from '../../utils/nodeTypeStyles';

const TrailNode = ({ node, progress, isUnlocked, isCompleted, isCurrent, isFirstNode, onClick }) => {
  const { t, i18n } = useTranslation('trail');
  const { reducedMotion } = useAccessibility();

  // Determine node state
  const nodeState = useMemo(() => {
    if (!isUnlocked) return 'locked';
    if (isCompleted && progress?.stars === 3) return 'mastered';
    if (isCompleted) return 'completed';
    if (isCurrent) return 'current';
    return 'available';
  }, [isUnlocked, isCompleted, isCurrent, progress]);

  const stars = progress?.stars || 0;
  const bestScore = progress?.best_score || 0;
  const isBoss = node.isBoss;

  const handleClick = () => {
    // Allow clicking for unlocked nodes OR locked boss nodes (to show unlock explanation)
    if (isUnlocked || isBoss) {
      onClick(node);
    }
  };

  // Get node styling from centralized system
  const { IconComponent, colors, sizeClass, pulseClass, crownVisible } = useMemo(() => {
    return getNodeStateConfig(node.nodeType, node.category, nodeState, isBoss);
  }, [node.nodeType, node.category, nodeState, isBoss]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Stars display - always show 3 star slots above the node */}
      <div className="mb-0.5 flex gap-0.5">
        {[1, 2, 3].map((starNum) => (
          <svg
            key={starNum}
            className={`h-4 w-4 ${
              starNum <= stars
                ? 'text-yellow-400 drop-shadow-[0_0_3px_rgba(250,204,21,0.8)]'
                : 'text-gray-600'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>

      {/* Node button */}
      <button
        onClick={handleClick}
        disabled={!isUnlocked && !isBoss}
        className={`
          relative flex items-center justify-center
          ${sizeClass}
          ${isBoss ? 'rounded-full' : 'rounded-xl'}
          border-2
          transition-all duration-300
          ${colors.bg}
          ${colors.border}
          ${colors.glow}
          ${isUnlocked || isBoss ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-60'}
          ${!reducedMotion ? pulseClass : ''}
        `}
        aria-label={`${translateNodeName(node.name, t, i18n)} - ${nodeState}`}
      >
        {/* Boss crown indicator */}
        {crownVisible && (
          <div className="absolute -top-4 text-lg drop-shadow-lg">
            <Crown size={18} className="text-yellow-400 fill-yellow-400" />
          </div>
        )}

        {/* Locked boss badge - shows on top of locked boss nodes */}
        {isBoss && !isUnlocked && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-bold text-yellow-900 shadow-md border border-yellow-500">
              <span>🔒</span>
              <span>{t('node.bossLocked', { defaultValue: 'Complete all lessons' })}</span>
            </div>
          </div>
        )}

        {/* Node type icon */}
        <IconComponent
          size={isBoss ? 22 : 20}
          className={`${colors.text} ${colors.icon}`}
          strokeWidth={2}
        />

        {/* Current indicator label */}
        {isCurrent && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-lg">
            {isFirstNode && !progress ? t('node.startHere') : t('node.continue')}
          </div>
        )}
      </button>

      {/* Node name */}
      <div className="mt-1 max-w-[70px] text-center">
        <div className={`text-[10px] font-semibold leading-tight ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
          {translateNodeName(node.name, t, i18n)}
        </div>
        {/* Best score */}
        {bestScore > 0 && (
          <div className="text-[9px] font-medium text-white/60">
            {Math.round(bestScore)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailNode;
