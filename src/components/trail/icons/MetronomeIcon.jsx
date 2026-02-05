/**
 * MetronomeIcon Component
 *
 * Custom SVG icon for metronome/rhythm with lucide-react compatible API.
 * Designed to be recognizable to 8-year-olds as a rhythm/timing device.
 */

const MetronomeIcon = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Metronome body - trapezoid shape (wider at bottom) */}
    <path d="M9 6L7 20L17 20L15 6Z" />
    {/* Pendulum arm - diagonal line through center */}
    <path d="M12 6L14 16" strokeWidth={strokeWidth * 1.2} />
    {/* Top cap */}
    <path d="M8 6L16 6" />
    {/* Pendulum weight - small circle at end */}
    <circle cx="14" cy="16" r="1.5" fill={color} />
  </svg>
);

export default MetronomeIcon;
