import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * CountdownOverlay
 *
 * Visual 3-2-1-GO countdown per D-03 and UI-SPEC.
 * Full-screen overlay shown during count-in phase.
 *
 * Props:
 * - countdownValue: 3, 2, 1, 'GO', or null (hidden when null)
 * - reducedMotion: boolean from AccessibilityContext
 */
export function CountdownOverlay({ countdownValue, reducedMotion = false }) {
  const { t } = useTranslation('common');

  if (countdownValue === null || countdownValue === undefined) return null;

  const isGo = countdownValue === 'GO';
  const displayText = isGo ? t('games.rhythmReading.countdown.go') : String(countdownValue);

  // Color: numbers = yellow-400, GO = green-400 (matching UI-SPEC)
  const colorClass = isGo ? 'text-green-400' : 'text-yellow-400';

  // Animation: animate-pulse on each number change (skip if reducedMotion)
  const pulseClass = reducedMotion ? '' : 'animate-pulse';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div className={`text-3xl font-bold ${colorClass} ${pulseClass} select-none`}>
        {displayText}
      </div>
    </div>
  );
}

export default CountdownOverlay;
