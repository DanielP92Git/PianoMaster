import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import UnifiedGameSettings from "../../shared/UnifiedGameSettings";
import {
  DIFFICULTY_LEVELS,
  TIME_SIGNATURES,
  getAvailableDifficulties,
} from "../RhythmPatternGenerator";

export function RhythmGameSetup({
  settings,
  onUpdateSettings,
  onStart,
  backRoute = "/rhythm-mode",
}) {
  const { t } = useTranslation("common");

  const steps = useMemo(() => {
    const difficulties = getAvailableDifficulties();
    const difficultyOptions = difficulties.map((difficulty) => ({
      value: difficulty,
      name: t(`gameSettings.difficulty.levels.${difficulty}.label`, {
        defaultValue: difficulty,
      }),
      description: t(
        `gameSettings.difficulty.levels.${difficulty}.bars_other`,
        {
          count:
            difficulty === DIFFICULTY_LEVELS.BEGINNER
              ? 2
              : difficulty === DIFFICULTY_LEVELS.INTERMEDIATE
                ? 4
                : 8,
        }
      ),
    }));

    return [
      {
        id: "difficulty",
        title: "gameSettings.steps.labels.difficulty",
        component: "DifficultySelection",
        config: {
          difficulties: difficultyOptions,
        },
      },
      {
        id: "timeSignature",
        title: "gameSettings.steps.labels.timeSignature",
        component: "TimeSignatureSelection",
        config: {
          timeSignatures: [
            TIME_SIGNATURES.FOUR_FOUR,
            TIME_SIGNATURES.THREE_FOUR,
            TIME_SIGNATURES.TWO_FOUR,
            TIME_SIGNATURES.SIX_EIGHT,
          ],
        },
      },
      {
        id: "tempo",
        title: "gameSettings.steps.labels.tempo",
        component: "TempoSelection",
        config: { minTempo: 60, maxTempo: 180 },
      },
    ];
  }, [t]);

  const handleStart = (finalSettings) => {
    onUpdateSettings?.(finalSettings);
    onStart?.(finalSettings);
  };

  return React.createElement(UnifiedGameSettings, {
    gameType: "rhythm",
    steps,
    initialSettings: settings,
    onStart: handleStart,
    backRoute,
    noteData: { trebleNotes: [], bassNotes: [] },
  });
}

export default RhythmGameSetup;
