/**
 * MetronomeIcon Component
 *
 * Wrapper for the high-quality metronome SVG with lucide-react compatible API.
 * Uses the professional metronome SVG from src/assets/icons/metronome.svg
 */

import metronomeSvg from '../../../assets/icons/metronome.svg';

const MetronomeIcon = ({
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
      src={metronomeSvg}
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

export default MetronomeIcon;
