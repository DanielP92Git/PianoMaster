import React from "react";
import { Volume2, Music, Ear } from "lucide-react";
import { useTranslation } from "react-i18next";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

export function RhythmMasterMode() {
  const { t } = useTranslation("common");
  const games = [
    {
      id: "metronome-trainer",
      name: t("games.cards.metronomeTrainer.name"),
      description: t("games.cards.metronomeTrainer.description"),
      icon: <Volume2 className="h-12 w-12 text-white" />,
      difficulty: t("games.difficulties.allLevels"),
      path: "/rhythm-mode/metronome-trainer",
    },
    {
      id: "rhythm-reading-game",
      name: t("games.cards.rhythmReading.name"),
      description: t("games.cards.rhythmReading.description"),
      icon: <Music className="h-12 w-12 text-white" />,
      difficulty: t("games.difficulties.allLevels"),
      path: "/rhythm-mode/rhythm-reading-game",
    },
    {
      id: "rhythm-dictation-game",
      name: t("games.cards.rhythmDictation.name"),
      description: t("games.cards.rhythmDictation.description"),
      icon: <Ear className="h-12 w-12 text-white" />,
      difficulty: t("games.difficulties.allLevels"),
      path: "/rhythm-mode/rhythm-dictation-game",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-6">
      <div className="mb-4 flex items-center">
        <BackButton
          to="/practice-modes"
          name={t("games.backToModes")}
          className="text-white/80 hover:text-white"
        />
      </div>

      <GameModeGrid games={games} layout="column" />
    </div>
  );
}
