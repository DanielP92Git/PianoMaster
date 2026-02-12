/**
 * TrailNode Component
 *
 * Displays a single node on the skill trail map with game-like visual styling
 * States: locked (gray+padlock), available (blue+play), in-progress (blue+play), completed (green+checkmark)
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Lock } from 'lucide-react';
import { translateNodeName } from '../../utils/translateNodeName';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getNodeStateConfig } from '../../utils/nodeTypeStyles';
import { getNodeById } from '../../data/skillTrail';

const TrailNode = ({ node, progress, isUnlocked, isCompleted, isCurrent, isFirstNode, onClick }) => {
  const { t, i18n } = useTranslation('trail');
  const { reducedMotion } = useAccessibility();
  const [showTooltip, setShowTooltip] = useState(false);

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
    // Locked node: show tooltip
    if (!isUnlocked && !isBoss) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    // Allow clicking for unlocked nodes OR locked boss nodes (to show unlock explanation)
    if (isUnlocked || isBoss) {
      onClick(node);
    }
  };

  // Get node styling from centralized system
  const { IconComponent, colors, sizeClass, crownVisible } = useMemo(() => {
    return getNodeStateConfig(node.nodeType, node.category, nodeState, isBoss);
  }, [node.nodeType, node.category, nodeState, isBoss]);

  // Get prerequisite name for tooltip
  const prerequisiteName = useMemo(() => {
    if (node.prerequisites && node.prerequisites.length > 0) {
      const prereqNode = getNodeById(node.prerequisites[0]);
      return prereqNode ? translateNodeName(prereqNode.name, t, i18n) : '';
    }
    return '';
  }, [node.prerequisites, t, i18n]);

  // Determine CSS class for node state
  const nodeCssClass = useMemo(() => {
    if (nodeState === 'current') return 'node-3d-active';
    if (nodeState === 'mastered' || nodeState === 'completed') return 'node-3d-completed';
    if (nodeState === 'locked' && isBoss) return 'node-3d-locked-boss';
    if (nodeState === 'locked') return 'node-3d-locked';
    return 'node-3d-available';
  }, [nodeState, isBoss]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Locked boss badge - positioned above everything */}
      {isBoss && !isUnlocked && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[9px] font-bold text-yellow-900 shadow-md border border-yellow-500">
            <Lock size={10} className="text-yellow-900" />
            <span>{t('node.bossLocked', { defaultValue: 'Complete all lessons' })}</span>
          </div>
        </div>
      )}

      {/* Locked node tooltip */}
      {showTooltip && prerequisiteName && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-gray-900 px-3 py-1.5 text-xs text-white rounded-lg shadow-lg">
          {t('node.completeFirst', { defaultValue: `Complete ${prerequisiteName} first`, name: prerequisiteName })}
        </div>
      )}

      {/* Node button */}
      <button
        onClick={handleClick}
        disabled={false}
        className={`
          relative flex items-center justify-center
          ${sizeClass}
          ${isBoss ? 'rounded-full' : 'rounded-xl'}
          ${nodeCssClass}
          touch-action-manipulation
          ${isUnlocked || isBoss ? 'cursor-pointer hover:scale-110' : 'cursor-pointer'}
        `}
        aria-label={`${translateNodeName(node.name, t, i18n)} - ${nodeState}${isCompleted && stars > 0 ? ` - ${stars} stars` : ''}`}
        aria-roledescription="skill node"
      >
        {/* Boss crown indicator */}
        {crownVisible && (
          <div className="absolute -top-4 text-lg drop-shadow-lg">
            <Crown size={18} className={nodeState === 'locked' ? 'text-yellow-600/60 fill-yellow-600/60' : 'text-yellow-400 fill-yellow-400'} />
          </div>
        )}

        {/* Node content: stars for completed, lock for locked, icon otherwise */}
        {isCompleted && stars > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
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
        ) : nodeState === 'locked' ? (
          <Lock size={18} className="text-white opacity-60" />
        ) : (
          <IconComponent
            size={isBoss ? 22 : 20}
            className={`${colors.text} ${colors.icon}`}
            strokeWidth={2}
          />
        )}

        {/* Current indicator label */}
        {isCurrent && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-lg">
            {isFirstNode && !progress ? t('node.startHere') : t('node.continue')}
          </div>
        )}
      </button>

      {/* Node name */}
      <div className="mt-2.5 max-w-[70px] text-center">
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
