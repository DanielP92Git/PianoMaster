import React, { useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useCelebrationDuration } from './useCelebrationDuration';
import { SKIP_KEYS } from '../../utils/celebrationConstants';
import './CelebrationWrapper.css';

/**
 * CelebrationWrapper Component
 *
 * Wraps celebration content with accessibility-aware animation handling,
 * auto-dismiss timer, and skip functionality via click/keyboard.
 *
 * Features:
 * - Respects reducedMotion and extendedTimeouts from AccessibilityContext
 * - Auto-dismisses after calculated duration
 * - Skip on click (unless clicking interactive elements)
 * - Skip on Escape or Enter key
 * - Shows "Tap to continue" hint for 8-year-olds
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Celebration content to wrap
 * @param {string} props.tier - 'standard', 'level-up', or 'boss'
 * @param {Function} props.onComplete - Callback when celebration completes/skips
 * @param {boolean} props.autoStart - If true, auto-dismiss after duration
 * @param {string} props.className - Additional CSS classes
 */
export function CelebrationWrapper({
  children,
  tier = 'standard',
  onComplete,
  autoStart = true,
  className = ''
}) {
  const { reducedMotion, extendedTimeouts } = useAccessibility();
  const duration = useCelebrationDuration(tier, { reducedMotion, extendedTimeouts });

  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date to avoid stale closures
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle skip - clear timeout and call onComplete
  const handleSkip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onCompleteRef.current?.();
  }, []);

  // Handle click - skip unless clicking interactive element
  const handleClick = useCallback((e) => {
    // Check if click target is an interactive element (button, link, etc.)
    const interactiveElement = e.target.closest('button, a, [role="button"], [role="link"]');

    // If clicking an interactive element, let it handle the click
    if (interactiveElement) {
      return;
    }

    // Otherwise, treat as skip
    handleSkip();
  }, [handleSkip]);

  // Keyboard skip - Escape or Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (SKIP_KEYS.includes(e.key)) {
        e.preventDefault();
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSkip]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoStart && onCompleteRef.current) {
      timeoutRef.current = setTimeout(() => {
        onCompleteRef.current?.();
      }, duration);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [autoStart, duration]);

  // Determine wrapper classes
  const wrapperClasses = [
    'celebration-wrapper',
    reducedMotion ? 'celebration-reduced' : 'celebration-full',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapperRef}
      className={wrapperClasses}
      onClick={handleClick}
      role="presentation"
      aria-label="Celebration animation. Click or press Escape to skip."
      style={{
        '--celebration-duration': `${duration}ms`
      }}
    >
      {children}

      {/* Skip hint for 8-year-olds */}
      <span className="celebration-skip-hint" aria-hidden="true">
        Tap to continue
      </span>
    </div>
  );
}

export default CelebrationWrapper;
