import { useState, useRef, useCallback, useEffect } from "react";

export function useGameTimer(initialTime, onTimeUp) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  // Keep track of the latest initialTime
  const initialTimeRef = useRef(initialTime);
  useEffect(() => {
    initialTimeRef.current = initialTime;
  }, [initialTime]);

  const startTimer = useCallback(() => {
    // Clear any existing intervals first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only start if there's time remaining
    if (timeRemaining <= 0) {
      console.log("Cannot start timer with 0 or negative time remaining");
      return;
    }

    setIsActive(true);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsActive(false);
          // Call the callback if provided
          if (typeof onTimeUp === "function") {
            onTimeUp();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    console.log("Timer started with interval ID:", timerRef.current);
  }, [timeRemaining, onTimeUp]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      console.log("Pausing timer, clearing interval ID:", timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsActive(false);
    }
  }, []);

  const resetTimer = useCallback((newTime = undefined) => {
    // Clear any existing timer
    if (timerRef.current) {
      console.log("Clearing existing timer in resetTimer:", timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Use provided time or fall back to the latest initialTime
    const timeToSet = newTime !== undefined ? newTime : initialTimeRef.current;
    console.log("Resetting timer to:", timeToSet);

    setTimeRemaining(timeToSet);
    setIsActive(false);
  }, []);

  // Format time as MM:SS
  const formattedTime = useCallback(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, [timeRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        console.log("Cleaning up timer on unmount:", timerRef.current);
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    timeRemaining,
    formattedTime: formattedTime(),
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
  };
}
