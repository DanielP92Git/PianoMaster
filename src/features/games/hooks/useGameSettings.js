import { useState, useRef } from "react";

const TIME_LIMITS = {
  Easy: 60,
  Medium: 45,
  Hard: 30,
};

export function useGameSettings(initialSettings = {}) {
  // Track previous values to prevent unnecessary updates
  const prevValues = useRef({
    timedMode: initialSettings.timedMode,
    timeLimit: initialSettings.timeLimit || TIME_LIMITS.Medium,
  });

  const [settings, setSettings] = useState({
    clef: initialSettings.clef || "Treble",
    selectedNotes: initialSettings.selectedNotes || [],
    timedMode:
      initialSettings.timedMode !== undefined
        ? initialSettings.timedMode
        : false,
    difficulty: initialSettings.difficulty || "Medium",
    timeLimit: initialSettings.timeLimit || TIME_LIMITS.Medium,
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      // Don't update if timedMode hasn't changed
      if (
        newSettings.timedMode !== undefined &&
        prevValues.current.timedMode === newSettings.timedMode
      ) {
        return prev; // Return previous state unchanged if timedMode hasn't changed
      }

      // Calculate the new time limit based on difficulty or use provided value
      const newTimeLimit =
        newSettings.timeLimit !== undefined
          ? newSettings.timeLimit
          : newSettings.difficulty
            ? TIME_LIMITS[newSettings.difficulty]
            : prev.timeLimit;

      // IMPORTANT: Make sure timedMode is correctly handled
      // If timedMode is explicitly provided in newSettings, use that value
      // Otherwise keep the previous value
      const updatedTimedMode =
        newSettings.timedMode !== undefined
          ? newSettings.timedMode
          : prev.timedMode;

      // Update our ref to track the new values
      prevValues.current = {
        timedMode: updatedTimedMode,
        timeLimit: newTimeLimit,
      };

      // Create a new settings object with the updates
      const updatedSettings = {
        ...prev,
        ...newSettings,
      };

      // IMPORTANT: Explicitly set timedMode to ensure it's not overwritten
      updatedSettings.timedMode = updatedTimedMode;
      updatedSettings.timeLimit = newTimeLimit;

      return updatedSettings;
    });
  };

  const resetSettings = () => {
    // Update our ref with the reset values
    prevValues.current = {
      timedMode: false,
      timeLimit: TIME_LIMITS.Medium,
    };

    setSettings({
      clef: "Treble",
      selectedNotes: [],
      timedMode: false,
      difficulty: "Medium",
      timeLimit: TIME_LIMITS.Medium,
    });
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
