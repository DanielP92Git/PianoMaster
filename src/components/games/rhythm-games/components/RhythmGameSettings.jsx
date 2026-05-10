import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../../../ui/Modal";
import Button from "../../../ui/Button";
import {
  DIFFICULTY_LEVELS,
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
          <label className="mb-2 block text-sm font-medium text-white/70">
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
                  className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                    localSettings.difficulty === difficulty
                      ? "border-indigo-400 bg-indigo-500/30 text-white"
                      : "border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
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
          <label className="mb-2 block text-sm font-medium text-white/70">
            {t("gameSettings.steps.labels.timeSignature")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timeSignatures.map((timeSignature) => (
              <button
                key={timeSignature.name}
                onClick={() =>
                  setLocalSettings((prev) => ({ ...prev, timeSignature }))
                }
                className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                  localSettings.timeSignature.name === timeSignature.name
                    ? "border-indigo-400 bg-indigo-500/30 text-white"
                    : "border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                }`}
              >
                {timeSignature.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo Range */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
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
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/15"
          />
          <div className="mt-1 flex justify-between text-xs text-white/60">
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
