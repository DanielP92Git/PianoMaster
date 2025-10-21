import React, { useState, useEffect } from "react";
import Button from "../../../ui/Button";
import BackButton from "../../../ui/BackButton";
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
  const [step, setStep] = useState(1);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleStart = () => {
    onUpdateSettings(localSettings);
    // Pass the updated settings directly to avoid stale state
    onStart(localSettings);
  };

  const handleNextStep = () => {
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const difficulties = getAvailableDifficulties();
  const timeSignatures = getTimeSignatures();

  // Step 1: Difficulty Selection
  const DifficultyStep = () => (
    <div
      className="flex flex-row gap-3 w-full max-w-5xl items-stretch"
      style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
    >
      <div className="flex-1 flex items-center overflow-hidden">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 h-full flex flex-col p-2.5 sm:p-3 w-full">
          <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
            Step 1 of 3: Choose Difficulty
          </h2>
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
              {difficulties.map((difficulty) => {
                const diffInfo = getDifficultyInfo(difficulty);
                return (
                  <button
                    key={difficulty}
                    onClick={() =>
                      setLocalSettings((prev) => ({ ...prev, difficulty }))
                    }
                    className={`p-2 sm:p-3 rounded-lg transition-colors ${
                      localSettings.difficulty === difficulty
                        ? "bg-indigo-600 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <div className="font-semibold text-sm sm:text-base">
                      {diffInfo.name}
                    </div>
                    <div className="text-xs opacity-75">
                      {diffInfo.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
        <button
          onClick={handleNextStep}
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Step 2: Time Signature Selection
  const TimeSignatureStep = () => (
    <div
      className="flex flex-row gap-3 w-full max-w-5xl items-stretch"
      style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
    >
      <div className="flex-1 flex items-center overflow-hidden">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 h-full flex flex-col p-2.5 sm:p-3 w-full">
          <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
            Step 2 of 3: Choose Time Signature
          </h2>
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {timeSignatures.map((timeSignature) => (
                <button
                  key={timeSignature.name}
                  onClick={() =>
                    setLocalSettings((prev) => ({ ...prev, timeSignature }))
                  }
                  className={`p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base ${
                    localSettings.timeSignature.name === timeSignature.name
                      ? "bg-indigo-600 text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {timeSignature.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
        <button
          onClick={handlePrevStep}
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Step 3: Tempo Selection
  const TempoStep = () => (
    <div
      className="flex flex-row gap-3 w-full max-w-5xl items-stretch"
      style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
    >
      <div className="flex-1 flex items-center overflow-hidden">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 h-full flex flex-col p-2.5 sm:p-3 w-full">
          <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
            Step 3 of 3: Set Tempo
          </h2>
          <div className="space-y-2 flex-1 flex flex-col justify-center">
            <div>
              <label className="block text-sm sm:text-base font-medium text-white mb-2 text-center">
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
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${
                    ((localSettings.tempo - 60) / (180 - 60)) * 100
                  }%, rgba(255,255,255,0.2) ${
                    ((localSettings.tempo - 60) / (180 - 60)) * 100
                  }%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-white/70 mt-2">
                <span>60 BPM</span>
                <span>180 BPM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
        <button
          onClick={handlePrevStep}
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
        >
          Back
        </button>
        <button
          onClick={handleStart}
          className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
        >
          Start Training
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white">
      <div className="p-2 flex-shrink-0">
        <BackButton
          to="/practice-modes"
          name="Game Modes"
          styling="text-white/80 hover:text-white text-sm"
        />
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden px-2 py-1">
        {step === 1 && <DifficultyStep />}
        {step === 2 && <TimeSignatureStep />}
        {step === 3 && <TempoStep />}
      </div>
    </div>
  );
}

export default PreGameSettingsScreen;
