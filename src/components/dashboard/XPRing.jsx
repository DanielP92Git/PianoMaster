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
  // 80% arc (288°) — open at bottom
  const arcFraction = 0.8;
  const arcLength = circumference * arcFraction;
  const gapLength = circumference - arcLength;
  const clampedProgress = Math.max(0, Math.min(100, progressPercentage));
  const progressLength = arcLength * (clampedProgress / 100);
  // Rotate so the gap is centered at the bottom (90° in SVG).
  // Arc starts at startAngle, draws 288°, gap follows for 72°.
  // Gap center = startAngle + 288 + 36 = startAngle + 324 = 90 + 360 → startAngle = 126°
  const startAngle = 126;

  return (
    <div className="flex flex-col items-center">
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
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <filter id="xp-ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track (80% arc) */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
          transform={`rotate(${startAngle} 60 60)`}
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
          strokeDasharray={`${progressLength} ${circumference - progressLength}`}
          transform={`rotate(${startAngle} 60 60)`}
          filter="url(#xp-ring-glow)"
          style={
            reducedMotion
              ? undefined
              : { transition: 'stroke-dasharray 1s ease-out' }
          }
        />

        {/* GoldStar - upper center inside ring */}
        <foreignObject x="32" y="22" width="56" height="46">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="flex h-full w-full items-center justify-center"
          >
            <GoldStar size={28} filled glow />
          </div>
        </foreignObject>

        {/* XP text inside ring - bottom area */}
        <text x="60" y="78" textAnchor="middle" className="fill-white/80 text-[13px] font-bold">
          {isMaxLevel ? xpCurrent : `${xpCurrent}/${xpTotal}`}
        </text>
        <text x="60" y="94" textAnchor="middle" className="fill-white/50 text-[13px] font-semibold">
          XP
        </text>
      </svg>
    </div>
  );
};

export default XPRing;
