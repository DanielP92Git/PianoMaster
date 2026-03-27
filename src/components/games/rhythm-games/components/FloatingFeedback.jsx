import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * FloatingFeedback
 *
 * Animated floating feedback text per D-04 and UI-SPEC.
 * Renders PERFECT/GOOD/MISS text that floats upward and fades out on each tap.
 *
 * Props:
 * - quality: 'PERFECT' | 'GOOD' | 'MISS' | null
 * - feedbackKey: unique key to trigger new animation on each tap (passed via key prop)
 * - reducedMotion: boolean from AccessibilityContext
 */
export function FloatingFeedback({ quality, feedbackKey, reducedMotion = false }) {
  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!quality) return;

    // Clear any running animation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show text immediately
    setVisible(true);
    setAnimating(false);

    // Start float-up animation after a brief delay (allows render before transition)
    const startDelay = setTimeout(() => {
      setAnimating(true);
    }, 16); // one frame

    // Hide after animation completes
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      setAnimating(false);
    }, 850);

    return () => {
      clearTimeout(startDelay);
      clearTimeout(timeoutRef.current);
    };
  }, [feedbackKey, quality]);

  if (!visible || !quality) return null;

  const colorClass =
    quality === 'PERFECT'
      ? 'text-green-400'
      : quality === 'GOOD'
        ? 'text-yellow-400'
        : 'text-red-400';

  const labelMap = {
    PERFECT: t('games.rhythmReading.tapArea.accuracy.perfect'),
    GOOD: t('games.rhythmReading.tapArea.accuracy.good'),
    MISS: t('games.rhythmReading.tapArea.accuracy.miss'),
  };

  const label = labelMap[quality] || quality;

  const baseStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: '100%',
    marginBottom: '8px',
    pointerEvents: 'none',
    transition: animating ? 'transform 800ms ease-out, opacity 800ms ease-out' : 'none',
  };

  const animatedStyle = animating
    ? {
        opacity: 0,
        transform: reducedMotion
          ? 'translateX(-50%) translateY(0)' // no vertical motion for reduced-motion
          : 'translateX(-50%) translateY(-40px)',
      }
    : {
        opacity: 1,
        transform: 'translateX(-50%) translateY(0)',
      };

  return (
    // aria-live region so screen readers announce tap results
    <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <span
        className={`text-3xl font-bold ${colorClass}`}
        style={{ ...baseStyle, ...animatedStyle }}
      >
        {label}
      </span>
    </div>
  );
}

export default FloatingFeedback;
