import React from "react";
import { Music, Grid } from "lucide-react";
import { useTranslation } from "react-i18next";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

export function NotesReadingMode() {
  const { t } = useTranslation("common");
  const games = [
    {
      id: "memory-game",
      name: t("games.cards.memory.name"),
      description: t("games.cards.memory.description"),
      icon: <Grid className="w-8 h-8 text-white" />,
      difficulty: t("games.difficulties.easy"),
      path: "/notes-reading-mode/memory-game",
    },
    {
      id: "notes-reading",
      name: t("games.cards.notesReading.name"),
      description: t("games.cards.notesReading.description"),
      icon: <Music className="w-8 h-8 text-white" />,
      difficulty: t("games.difficulties.medium"),
      path: "/notes-reading-mode/notes-reading-game",
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
