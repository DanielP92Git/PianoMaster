import React, { useState, useEffect } from "react";
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
 * Pre-game settings screen component
 * Full-screen configuration interface for rhythm training games
 */
export function PreGameSettingsScreen({
  settings,
  onUpdateSettings,
  onStart,
  title = "Metronome Rhythm Trainer",
  subtitle = "Configure your rhythm training session",
}) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleStart = () => {
    onUpdateSettings(localSettings);
    // Pass the updated settings directly to avoid stale state
    onStart(localSettings);
  };

  const difficulties = getAvailableDifficulties();
  const timeSignatures = getTimeSignatures();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-gray-200 text-lg">{subtitle}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 space-y-8">
          {/* Difficulty Selection */}
          <div>
            <label className="block text-lg font-medium text-white mb-4">
              Difficulty Level
            </label>
            <div className="grid grid-cols-1 gap-3">
              {difficulties.map((difficulty) => {
                const diffInfo = getDifficultyInfo(difficulty);
                return (
                  <button
                    key={difficulty}
                    onClick={() =>
                      setLocalSettings((prev) => ({ ...prev, difficulty }))
                    }
                    className={`p-4 rounded-lg border text-base font-medium transition-all ${
                      localSettings.difficulty === difficulty
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white/10 text-white border-white/30 hover:border-blue-300 hover:bg-white/20"
                    }`}
                  >
                    <div className="font-semibold">{diffInfo.name}</div>
                    <div className="text-sm opacity-75">
                      {diffInfo.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Signature */}
          <div>
            <label className="block text-lg font-medium text-white mb-4">
              Time Signature
            </label>
            <div className="grid grid-cols-2 gap-3">
              {timeSignatures.map((timeSignature) => (
                <button
                  key={timeSignature.name}
                  onClick={() =>
                    setLocalSettings((prev) => ({ ...prev, timeSignature }))
                  }
                  className={`p-4 rounded-lg border text-base font-medium transition-all ${
                    localSettings.timeSignature.name === timeSignature.name
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white/10 text-white border-white/30 hover:border-blue-300 hover:bg-white/20"
                  }`}
                >
                  {timeSignature.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo Range */}
          <div>
            <label className="block text-lg font-medium text-white mb-4">
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
              className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  ((localSettings.tempo - 60) / (180 - 60)) * 100
                }%, rgba(255,255,255,0.2) ${
                  ((localSettings.tempo - 60) / (180 - 60)) * 100
                }%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
            <div className="flex justify-between text-sm text-gray-300 mt-2">
              <span>60 BPM</span>
              <span>180 BPM</span>
            </div>
          </div>

          {/* Adaptive Difficulty */}
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-white">
              Adaptive Difficulty
            </label>
            <button
              onClick={() =>
                setLocalSettings((prev) => ({
                  ...prev,
                  adaptiveDifficulty: !prev.adaptiveDifficulty,
                }))
              }
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                localSettings.adaptiveDifficulty ? "bg-blue-600" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  localSettings.adaptiveDifficulty
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Start Button */}
          <div className="text-center pt-6">
            <Button
              onClick={handleStart}
              variant="primary"
              className="px-12 py-4 text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Start Training
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreGameSettingsScreen;
