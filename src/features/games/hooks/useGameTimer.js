import { useState, useRef, useCallback, useEffect } from "react";

export function useGameTimer(options) {
  // Extract options with defaults
  const initialTime = options?.initialTime || 45;
  const onTimeUp = options?.onTimeUp;
  const isTimedMode =
    options?.isTimedMode !== undefined ? Boolean(options.isTimedMode) : true;

  // Debug mode - set to false to disable most logs
  const DEBUG = false;

  // Only log if debug mode is enabled
  const debugLog = (message, data) => {
    if (DEBUG) console.log(message, data);
  };

  debugLog("useGameTimer initialized with:", { initialTime, isTimedMode });

  // Core timer state
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Ref for timer interval and current time
  const timerRef = useRef(null);
  const currentTimeRef = useRef(initialTime);

  // Keep the ref in sync with state
  useEffect(() => {
    currentTimeRef.current = timeRemaining;
  }, [timeRemaining]);

  // Format time as MM:SS
  const formattedTime = () => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Clean up any existing timer
  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      debugLog("Cleaning up timer:", timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Start the timer
  const startTimer = useCallback(() => {
    debugLog("Starting timer, isTimedMode:", isTimedMode);

    // Don't start if timed mode is disabled
    if (!isTimedMode) {
      debugLog("Timer not started - timed mode is disabled");
      return;
    }

    // Clean up any existing timer first
    cleanupTimer();

    // Don't start if time is 0
    if (currentTimeRef.current <= 0) {
      debugLog("Timer not started - time remaining is 0 or negative");
      return;
    }

    // Set timer state to active
    setIsActive(true);
    setIsPaused(false);

    // Create the actual interval using the ref value
    timerRef.current = setInterval(() => {
      // Use the current ref value to ensure we have the latest time
      const currentTime = currentTimeRef.current;

      if (currentTime <= 1) {
        // Time's up
        debugLog("Timer reached zero");
        cleanupTimer();
        setTimeRemaining(0);
        setIsActive(false);

        if (typeof onTimeUp === "function") {
          debugLog("Calling onTimeUp callback");
          setTimeout(onTimeUp, 0);
        }
      } else {
        // Decrement time
        const newTime = currentTime - 1;
        debugLog("Timer update:", { from: currentTime, to: newTime });
        setTimeRemaining(newTime);
      }
    }, 1000);

    debugLog("Timer started, interval ID:", timerRef.current);
  }, [isTimedMode, onTimeUp, cleanupTimer]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    debugLog("Pausing timer");
    cleanupTimer();
    setIsActive(false);
    setIsPaused(true);
  }, [cleanupTimer]);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    debugLog("Resuming timer");

    if (isPaused && currentTimeRef.current > 0 && isTimedMode) {
      setIsActive(true);
      setIsPaused(false);

      // Create new interval using the current ref value
      timerRef.current = setInterval(() => {
        // Use the current ref value to ensure we have the latest time
        const currentTime = currentTimeRef.current;

        if (currentTime <= 1) {
          // Time's up
          debugLog("Timer reached zero on resume");
          cleanupTimer();
          setTimeRemaining(0);
          setIsActive(false);

          if (typeof onTimeUp === "function") {
            setTimeout(onTimeUp, 0);
          }
        } else {
          // Decrement time
          const newTime = currentTime - 1;
          debugLog("Timer resume update:", { from: currentTime, to: newTime });
          setTimeRemaining(newTime);
        }
      }, 1000);

      debugLog("Timer resumed, interval ID:", timerRef.current);
    } else {
      debugLog("Cannot resume timer:", {
        isPaused,
        timeRemaining: currentTimeRef.current,
        isTimedMode,
      });
    }
  }, [isPaused, isTimedMode, onTimeUp, cleanupTimer]);

  // Reset the timer
  const resetTimer = useCallback(
    (newTime = undefined) => {
      const timeToSet = newTime !== undefined ? newTime : initialTime;
      debugLog("Resetting timer to:", timeToSet);

      // Clean up any existing timer
      cleanupTimer();

      // Set new time in both state and ref
      setTimeRemaining(timeToSet);
      currentTimeRef.current = timeToSet;
      setIsActive(false);
      setIsPaused(false);

      debugLog("Timer reset complete");
    },
    [cleanupTimer, initialTime]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanupTimer();
    };
  }, [cleanupTimer]);

  return {
    timeRemaining,
    formattedTime: formattedTime(),
    isActive,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
}
