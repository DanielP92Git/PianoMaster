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
  <div
    style={{
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <img
      src={trebleClefSvg}
      alt=""
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: color === 'currentColor' ? 'none' : `brightness(0) saturate(100%)`,
        color: color
      }}
      {...props}
    />
  </div>
);

export default TrebleClefIcon;
