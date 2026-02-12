/**
 * BassClefIcon Component
 *
 * Wrapper for the high-quality bass clef SVG with lucide-react compatible API.
 * Uses the professional musical notation SVG from src/assets/noteImages/bass/bass-clef.svg
 */

import bassClefSvg from '../../../assets/noteImages/bass/bass-clef.svg';

const BassClefIcon = ({
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
      src={bassClefSvg}
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

export default BassClefIcon;
