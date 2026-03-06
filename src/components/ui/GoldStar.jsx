/**
 * GoldStar — a polished, gradient-filled SVG star used for ratings and rewards.
 *
 * Props:
 *   size    — width/height in px (default 24)
 *   filled  — true = gold gradient, false = dim outline (default true)
 *   glow    — adds a gold drop-shadow (default false)
 *   className — extra classes on the wrapper <svg>
 */
const GoldStar = ({ size = 24, filled = true, glow = false, className = '' }) => {
  const gradId = `gold-star-grad-${filled ? 'on' : 'off'}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={glow && filled ? { filter: 'drop-shadow(0 0 6px rgba(255,200,0,0.55))' } : undefined}
      aria-hidden="true"
    >
      <defs>
        {filled ? (
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFD43B" />
            <stop offset="100%" stopColor="#F59F00" />
          </linearGradient>
        ) : (
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6B7280" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4B5563" stopOpacity="0.25" />
          </linearGradient>
        )}
      </defs>

      {/* five-point star path */}
      <path
        d="M12 2l2.93 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.07-1.01L12 2z"
        fill={`url(#${gradId})`}
        stroke={filled ? '#E8A200' : '#6B7280'}
        strokeWidth={filled ? 0.7 : 0.9}
        strokeLinejoin="round"
      />

      {/* subtle highlight on upper-left facet for 3-D feel */}
      {filled && (
        <path
          d="M12 2l2.93 6.26L22 9.27l-5 4.87"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};

export default GoldStar;
