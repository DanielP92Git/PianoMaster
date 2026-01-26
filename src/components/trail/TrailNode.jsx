/**
 * TrailNode Component
 *
 * Displays a single node on the skill trail map with game-like visual styling
 * States: locked (gray+padlock), available (blue+play), in-progress (blue+play), completed (green+checkmark)
 */

import { useMemo } from 'react';

const TrailNode = ({ node, progress, isUnlocked, isCompleted, isCurrent, isFirstNode, onClick }) => {
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
    if (isUnlocked) {
      onClick(node);
    }
  };

  // State-specific styling with game-like colors
  const stateConfig = {
    locked: {
      bgGradient: 'from-gray-600 to-gray-700',
      borderColor: 'border-gray-500',
      glowColor: '',
      iconBg: 'bg-gray-500',
      icon: (
        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
        </svg>
      ),
    },
    available: {
      bgGradient: 'from-cyan-500 to-blue-600',
      borderColor: 'border-cyan-400',
      glowColor: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]',
      iconBg: 'bg-white/20',
      icon: (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      ),
    },
    current: {
      bgGradient: 'from-cyan-400 to-blue-500',
      borderColor: 'border-cyan-300',
      glowColor: 'shadow-[0_0_20px_rgba(34,211,238,0.6)]',
      iconBg: 'bg-white/30',
      icon: (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      ),
      pulse: true,
    },
    completed: {
      bgGradient: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-400',
      glowColor: 'shadow-[0_0_15px_rgba(74,222,128,0.4)]',
      iconBg: 'bg-white/20',
      icon: (
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      ),
    },
    mastered: {
      bgGradient: 'from-green-400 to-emerald-500',
      borderColor: 'border-yellow-400',
      glowColor: 'shadow-[0_0_18px_rgba(74,222,128,0.5)]',
      iconBg: 'bg-white/30',
      icon: (
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      ),
    },
  };

  const config = stateConfig[nodeState];

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
        disabled={!isUnlocked}
        className={`
          relative flex h-12 w-12 items-center justify-center
          rounded-xl border-2 bg-gradient-to-br
          transition-all duration-300
          ${config.bgGradient}
          ${config.borderColor}
          ${config.glowColor}
          ${isUnlocked ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed opacity-60'}
          ${config.pulse ? 'animate-pulse' : ''}
          ${isBoss ? 'h-14 w-14 rounded-full' : ''}
        `}
        aria-label={`${node.name} - ${nodeState}`}
      >
        {/* Boss crown indicator */}
        {isBoss && (
          <div className="absolute -top-4 text-xl drop-shadow-lg">&#128081;</div>
        )}

        {/* State icon */}
        <div className={`flex items-center justify-center rounded-md p-0.5 ${config.iconBg}`}>
          {config.icon}
        </div>

        {/* Current indicator label */}
        {isCurrent && (
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cyan-500 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-lg">
            {isFirstNode && !progress ? 'Start Here!' : 'Continue'}
          </div>
        )}
      </button>

      {/* Node name */}
      <div className="mt-1 max-w-[70px] text-center">
        <div className={`text-[10px] font-semibold leading-tight ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
          {node.name}
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
