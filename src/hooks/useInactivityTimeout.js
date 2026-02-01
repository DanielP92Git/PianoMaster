import { useIdleTimer } from 'react-idle-timer';
import { useState, useCallback } from 'react';

/**
 * Hook for managing inactivity timeout with role-based durations.
 * Uses react-idle-timer for cross-tab synchronization.
 *
 * @param {Object} options
 * @param {boolean} options.isStudent - If true, uses 30min timeout; otherwise 2hr
 * @param {Function} options.onLogout - Callback when timeout expires
 * @returns {Object} Timer controls and warning state
 */
export function useInactivityTimeout({ isStudent, onLogout }) {
  // State for warning modal visibility
  const [showWarning, setShowWarning] = useState(false);

  // Calculate timeout based on role
  // Student: 30 minutes (30 * 60 * 1000 = 1,800,000 ms)
  // Teacher: 2 hours (2 * 60 * 60 * 1000 = 7,200,000 ms)
  const timeout = isStudent ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000;
  const promptBeforeIdle = 5 * 60 * 1000; // 5 minutes warning

  // Handlers
  const handlePrompt = useCallback(() => setShowWarning(true), []);
  const handleIdle = useCallback(() => {
    setShowWarning(false);
    onLogout();
  }, [onLogout]);

  // Configure useIdleTimer
  const { getRemainingTime, activate, pause, start, isIdle } = useIdleTimer({
    timeout,
    promptBeforeIdle,
    onPrompt: handlePrompt,
    onIdle: handleIdle,
    events: ['click', 'keydown'], // Only clicks and keypress per requirements
    crossTab: true, // Sync across tabs
    leaderElection: true, // One tab coordinates
    throttle: 500, // Process events at most every 500ms
    startManually: false, // Auto-start
  });

  // Stay logged in handler - resets timer
  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    activate();
  }, [activate]);

  return {
    showWarning,
    getRemainingTime,
    stayLoggedIn,
    pauseTimer: pause,
    resumeTimer: start,
    activate,
    isIdle,
  };
}
