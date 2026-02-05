/**
 * BassClefIcon Component
 *
 * Custom SVG icon for bass clef (F-clef) with lucide-react compatible API.
 * Designed to be recognizable to 8-year-olds as "the dots music symbol".
 */

const BassClefIcon = ({
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
    {/* Simplified bass clef - backwards C shape */}
    <path d="M8 6C6 7 5 9 5 11C5 13 6 15 8 16C9 16.5 10 17 10 17" />
    {/* Curved body extending upward */}
    <path d="M8 6C9 5 10 4 11 4" />
    {/* Two characteristic dots of F-clef */}
    <circle cx="14" cy="10" r="1.2" fill={color} />
    <circle cx="14" cy="14" r="1.2" fill={color} />
  </svg>
);

export default BassClefIcon;
