import React from "react";
import { GitCompareArrows, Music } from "lucide-react";
import { useTranslation } from "react-i18next";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

export function EarTrainingMode() {
  const { t } = useTranslation("common");
  const games = [
    {
      id: "note-comparison-game",
      name: t("games.cards.noteComparison.name"),
      description: t("games.cards.noteComparison.description"),
      icon: <GitCompareArrows className="h-8 w-8 text-white" />,
      difficulty: t("games.difficulties.easy"),
      path: "/ear-training-mode/note-comparison-game",
    },
    {
      id: "interval-game",
      name: t("games.cards.intervalGame.name"),
      description: t("games.cards.intervalGame.description"),
      icon: <Music className="h-8 w-8 text-white" />,
      difficulty: t("games.difficulties.medium"),
      path: "/ear-training-mode/interval-game",
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
