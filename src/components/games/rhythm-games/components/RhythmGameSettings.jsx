import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../../ui/Modal";
import Button from "../../../ui/Button";
import {
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
  getAvailableDifficulties,
  getTimeSignatures,
} from "../RhythmPatternGenerator";

// Helper function to get difficulty descriptions
const getDifficultyInfo = (difficulty, t) => {
  const difficultyMap = {
    [DIFFICULTY_LEVELS.BEGINNER]: {
      name: t("gameSettings.difficulty.levels.beginner.label"),
      description: t("gameSettings.difficulty.levels.beginner.bars_other", {
        count: 2,
      }),
      bars: 2,
    },
    [DIFFICULTY_LEVELS.INTERMEDIATE]: {
      name: t("gameSettings.difficulty.levels.intermediate.label"),
      description: t("gameSettings.difficulty.levels.intermediate.bars_other", {
        count: 4,
      }),
      bars: 4,
    },
    [DIFFICULTY_LEVELS.ADVANCED]: {
      name: t("gameSettings.difficulty.levels.advanced.label"),
      description: t("gameSettings.difficulty.levels.advanced.bars_other", {
        count: 8,
      }),
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
  const { t } = useTranslation("common");
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

  const modalTitle = title || t("gameControls.settings");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <div className="space-y-6">
        {/* Difficulty Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("gameSettings.steps.labels.difficulty")}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {difficulties.map((difficulty) => {
              const diffInfo = getDifficultyInfo(difficulty, t);
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
            {t("gameSettings.steps.labels.timeSignature")}
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
            {t("gameSettings.tempo.label", {
              tempo: localSettings.tempo,
            })}
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
            <span>{t("gameSettings.tempo.min", { value: 60 })}</span>
            <span>{t("gameSettings.tempo.max", { value: 180 })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            {t("gameSettings.buttons.cancel")}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {t("gameSettings.buttons.saveSettings")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RhythmGameSettings;
