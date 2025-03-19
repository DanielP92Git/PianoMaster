import { useState } from "react";

const TIME_LIMITS = {
  Easy: 60,
  Medium: 45,
  Hard: 30,
};

export function useGameSettings(initialSettings = {}) {
  const [settings, setSettings] = useState({
    clef: initialSettings.clef || "Treble",
    selectedNotes: initialSettings.selectedNotes || [],
    timedMode: initialSettings.timedMode || false,
    difficulty: initialSettings.difficulty || "Medium",
    timeLimit: initialSettings.timeLimit || TIME_LIMITS.Medium,
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      // Use explicit timeLimit if provided, otherwise calculate it based on difficulty
      const newTimeLimit =
        newSettings.timeLimit !== undefined
          ? newSettings.timeLimit
          : newSettings.difficulty
          ? TIME_LIMITS[newSettings.difficulty]
          : prev.timeLimit;

      console.log("Updating settings with time limit:", newTimeLimit);

      return {
        ...prev,
        ...newSettings,
        timeLimit: newTimeLimit,
      };
    });
  };

  const resetSettings = () => {
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
