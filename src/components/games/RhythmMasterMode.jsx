import React from "react";
import { Volume2 } from "lucide-react";
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
      icon: <Volume2 className="w-12 h-12 text-white" />,
      difficulty: t("games.difficulties.allLevels"),
      path: "/rhythm-mode/metronome-trainer",
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <BackButton
          to="/practice-modes"
          name={t("games.backToModes")}
          className="text-white/80 hover:text-white"
        />
      </div>

      <GameModeGrid games={games} />
    </div>
  );
}
