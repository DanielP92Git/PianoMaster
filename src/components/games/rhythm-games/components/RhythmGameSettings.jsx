import React, { useState, useEffect } from "react";
import { Modal } from "../../../ui/Modal";
import Button from "../../../ui/Button";
import {
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
  getAvailableDifficulties,
  getTimeSignatures,
} from "../RhythmPatternGenerator";

// Helper function to get difficulty descriptions
const getDifficultyInfo = (difficulty) => {
  const difficultyMap = {
    [DIFFICULTY_LEVELS.BEGINNER]: {
      name: "Beginner",
      description: "2 bars",
      bars: 2,
    },
    [DIFFICULTY_LEVELS.INTERMEDIATE]: {
      name: "Intermediate",
      description: "4 bars",
      bars: 4,
    },
    [DIFFICULTY_LEVELS.ADVANCED]: {
      name: "Advanced",
      description: "8 bars",
      bars: 8,
    },
  };
  return (
    difficultyMap[difficulty] || { name: difficulty, description: "", bars: 2 }
  );
};

/**
 * Rhythm game settings modal component
 * Provides configuration options for difficulty, time signature, tempo, etc.
 */
export function RhythmGameSettings({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  title = "Game Settings",
}) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const difficulties = getAvailableDifficulties();
  const timeSignatures = getTimeSignatures();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {/* Difficulty Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <div className="grid grid-cols-1 gap-2">
            {difficulties.map((difficulty) => {
              const diffInfo = getDifficultyInfo(difficulty);
              return (
                <button
                  key={difficulty}
                  onClick={() =>
                    setLocalSettings((prev) => ({ ...prev, difficulty }))
                  }
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    localSettings.difficulty === difficulty
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <div className="font-semibold">{diffInfo.name}</div>
                  <div className="text-xs opacity-75">
                    {diffInfo.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Signature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Signature
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timeSignatures.map((timeSignature) => (
              <button
                key={timeSignature.name}
                onClick={() =>
                  setLocalSettings((prev) => ({ ...prev, timeSignature }))
                }
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  localSettings.timeSignature.name === timeSignature.name
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                }`}
              >
                {timeSignature.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo: {localSettings.tempo} BPM
          </label>
          <input
            type="range"
            min="60"
            max="180"
            value={localSettings.tempo}
            onChange={(e) =>
              setLocalSettings((prev) => ({
                ...prev,
                tempo: parseInt(e.target.value),
              }))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>60 BPM</span>
            <span>180 BPM</span>
          </div>
        </div>

        {/* Adaptive Difficulty */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Adaptive Difficulty
          </label>
          <button
            onClick={() =>
              setLocalSettings((prev) => ({
                ...prev,
                adaptiveDifficulty: !prev.adaptiveDifficulty,
              }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.adaptiveDifficulty ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.adaptiveDifficulty
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RhythmGameSettings;
