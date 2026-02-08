/**
 * ConfettiEffect Component
 *
 * Accessible confetti animation wrapper for celebration moments.
 * Respects reduced motion preferences and provides tier-based configurations.
 */

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useAccessibility } from '../../contexts/AccessibilityContext';

/**
 * Confetti tier configurations
 */
const TIER_CONFIGS = {
  epic: {
    numberOfPieces: 500,
    gravity: 0.3,
    initialVelocityY: 20,
    colors: ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#9370DB']
  },
  full: {
    numberOfPieces: 200,
    gravity: 0.5,
    initialVelocityY: 15,
    colors: ['#FFD700', '#FFA500', '#87CEEB', '#98FB98']
  }
};

/**
 * ConfettiEffect component
 *
 * @param {Object} props
 * @param {'epic' | 'full'} props.tier - Celebration tier
 * @param {Function} props.onComplete - Called when confetti completes
 */
export function ConfettiEffect({ tier = 'full', onComplete }) {
  // Call all hooks unconditionally at the top
  const { reducedMotion } = useAccessibility();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isRunning, setIsRunning] = useState(true);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle confetti completion
  useEffect(() => {
    const handleComplete = () => {
      setIsRunning(false);
      onComplete?.();
    };

    // Store handler for cleanup
    const timeoutId = !isRunning ? setTimeout(handleComplete, 100) : null;

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isRunning, onComplete]);

  // Reduced motion: Skip confetti entirely
  useEffect(() => {
    if (reducedMotion) {
      onComplete?.();
    }
  }, [reducedMotion, onComplete]);

  // Return early if reduced motion is enabled
  if (reducedMotion) {
    return null;
  }

  // Get configuration for tier
  const config = TIER_CONFIGS[tier] || TIER_CONFIGS.full;

  const handleConfettiComplete = () => {
    setIsRunning(false);
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={isRunning ? config.numberOfPieces : 0}
        recycle={false}
        gravity={config.gravity}
        initialVelocityY={config.initialVelocityY}
        colors={config.colors}
        onConfettiComplete={handleConfettiComplete}
      />
    </div>
  );
}
