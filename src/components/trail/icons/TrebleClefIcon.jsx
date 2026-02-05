/**
 * TrebleClefIcon Component
 *
 * Custom SVG icon for treble clef (G-clef) with lucide-react compatible API.
 * Designed to be recognizable to 8-year-olds as "the curly music symbol".
 */

const TrebleClefIcon = ({
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
    {/* Simplified treble clef - recognizable curved S-shape with loop at top */}
    {/* Upper loop */}
    <path d="M12 3C13.5 3 15 4 15 5.5C15 7 13.5 8 12 8" />
    {/* Vertical stem through middle */}
    <path d="M12 8L12 20" />
    {/* Lower curl */}
    <path d="M12 20C10 20 9 19 9 17.5C9 16 10 15 12 15" />
    {/* Crossing horizontal line (staff line indicator) */}
    <circle cx="12" cy="14" r="0.8" fill={color} />
  </svg>
);

export default TrebleClefIcon;
