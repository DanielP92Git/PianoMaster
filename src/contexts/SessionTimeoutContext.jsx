import React, { createContext, useContext, useCallback } from 'react';
import { useUser } from '../features/authentication/useUser';
import { useLogout } from '../features/authentication/useLogout';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import InactivityWarningModal from '../components/ui/InactivityWarningModal';

const SessionTimeoutContext = createContext(null);

/**
 * Provider for session timeout management.
 * Automatically logs out inactive users with role-based durations.
 * Shows warning modal 5 minutes before logout.
 *
 * @example
 * // Wrap app in provider
 * <SessionTimeoutProvider>
 *   <App />
 * </SessionTimeoutProvider>
 *
 * // Games can pause/resume timer during active gameplay
 * const { pauseTimer, resumeTimer } = useSessionTimeout();
 */
export function SessionTimeoutProvider({ children }) {
  const { isStudent, isAuthenticated } = useUser();
  const { logout } = useLogout();

  // Handle logout with inactivity message
  const handleInactivityLogout = useCallback(() => {
    // Store flag for login page to show message
    sessionStorage.setItem('logoutReason', 'inactivity');
    logout();
  }, [logout]);

  // Only run timer when authenticated
  const {
    showWarning,
    stayLoggedIn,
    pauseTimer,
    resumeTimer,
    getRemainingTime,
  } = useInactivityTimeout({
    isStudent,
    onLogout: handleInactivityLogout,
  });

  // Context value for game components to pause/resume timer
  const value = {
    pauseTimer,
    resumeTimer,
    isTimerActive: isAuthenticated,
  };

  // Don't render modal or provide timer when not authenticated
  if (!isAuthenticated) {
    return (
      <SessionTimeoutContext.Provider value={{ pauseTimer: () => {}, resumeTimer: () => {}, isTimerActive: false }}>
        {children}
      </SessionTimeoutContext.Provider>
    );
  }

  return (
    <SessionTimeoutContext.Provider value={value}>
      {children}
      <InactivityWarningModal
        isOpen={showWarning}
        onStayLoggedIn={stayLoggedIn}
        getRemainingTime={getRemainingTime}
      />
    </SessionTimeoutContext.Provider>
  );
}

/**
 * Hook to access session timeout controls.
 * Useful for games to pause timer during active gameplay.
 *
 * @returns {{ pauseTimer: Function, resumeTimer: Function, isTimerActive: boolean }}
 */
export function useSessionTimeout() {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error('useSessionTimeout must be used within SessionTimeoutProvider');
  }
  return context;
}
