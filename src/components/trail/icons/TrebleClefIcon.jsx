/**
 * TrebleClefIcon Component
 *
 * Wrapper for the high-quality treble clef SVG with lucide-react compatible API.
 * Uses the professional musical notation SVG from src/assets/musicSymbols/treble-clef.svg
 */

import trebleClefSvg from '../../../assets/musicSymbols/treble-clef.svg';

const TrebleClefIcon = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}) => (
  <img
    src={trebleClefSvg}
    alt=""
    width={size}
    height={size}
    className={className}
    style={{
      filter: color === 'currentColor' ? 'none' : `brightness(0) saturate(100%)`,
      color: color
    }}
    {...props}
  />
);

export default TrebleClefIcon;
