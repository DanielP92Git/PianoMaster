/**
 * PathConnector Component
 *
 * Renders an SVG path between two nodes with smooth Bezier S-curves.
 * Supports both vertical (zigzag mobile) and horizontal (desktop) orientations.
 * Applies viewport-optimized glow effects only when visible to improve performance.
 */

import { useRef } from 'react';
import { useVisibleNodes } from '../../hooks/useVisibleNodes';

const PathConnector = ({ startX, startY, endX, endY, isCompleted, isLocked }) => {
  const groupRef = useRef(null);
  const isVisible = useVisibleNodes(groupRef);

  // Calculate deltas
  const dx = endX - startX;
  const dy = endY - startY;

  // Determine connection orientation (vertical zigzag vs horizontal desktop)
  const isVertical = Math.abs(dy) > Math.abs(dx);

  // Build path with cubic Bezier S-curve
  let path;
  if (isVertical) {
    // Vertical connection: control points offset horizontally
    const cp1x = startX;
    const cp1y = startY + dy * 0.4;
    const cp2x = endX;
    const cp2y = endY - dy * 0.4;
    path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  } else {
    // Horizontal connection: control points offset vertically
    const cp1x = startX + dx * 0.4;
    const cp1y = startY;
    const cp2x = endX - dx * 0.4;
    const cp2y = endY;
    path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }

  // Determine stroke styling based on state
  const strokeColor = isCompleted ? '#00FFFF' : 'rgba(255, 255, 255, 0.15)';
  const strokeWidth = 2;
  const strokeDasharray = isCompleted ? 'none' : '12 8';

  return (
    <g ref={groupRef}>
      {/* Background glow path - only render when visible AND completed */}
      {isVisible && isCompleted && (
        <path
          d={path}
          fill="none"
          stroke="rgba(0, 242, 255, 0.3)"
          strokeWidth="8"
          strokeLinecap="round"
          style={{ filter: 'blur(3px)' }}
        />
      )}

      {/* Main path line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
      />
    </g>
  );
};

export default PathConnector;
