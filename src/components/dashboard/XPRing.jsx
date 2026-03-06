/**
 * XPRing - Circular SVG progress ring with gold star center icon.
 *
 * Pure presentational component - receives all data via props.
 * Used inside UnifiedStatsCard to display XP progress visually.
 */

import GoldStar from '../ui/GoldStar';

const XPRing = ({
  progressPercentage = 0,
  xpCurrent = 0,
  xpTotal = 0,
  isMaxLevel = false,
  size = 100,
  reducedMotion = false,
}) => {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(100, progressPercentage));
  const offset = circumference * (1 - clampedProgress / 100);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="block"
      >
        <defs>
          <linearGradient id="xp-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="8"
        />

        {/* Progress arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#xp-ring-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={
            reducedMotion
              ? undefined
              : { transition: 'stroke-dashoffset 1s ease-out' }
          }
        />

        {/* GoldStar center - positioned via foreignObject */}
        <foreignObject x="32" y="32" width="56" height="56">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="flex h-full w-full items-center justify-center"
          >
            <GoldStar size={28} filled glow />
          </div>
        </foreignObject>
      </svg>

      {/* XP text below ring */}
      <span className="text-xs font-medium text-white/70">
        {isMaxLevel ? `${xpCurrent} XP` : `${xpCurrent}/${xpTotal} XP`}
      </span>
    </div>
  );
};

export default XPRing;
