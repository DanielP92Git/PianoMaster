import React from "react";
import { Music2, Grid, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

export function NotesMasterMode() {
  const { t } = useTranslation("common");
  const games = [
    {
      id: "memory-game",
      name: t("games.cards.memory.name"),
      description: t("games.cards.memory.description"),
      icon: <Grid className="w-8 h-8 text-white" />,
      difficulty: t("games.difficulties.easy"),
      path: "/notes-master-mode/memory-game",
    },
    {
      id: "notes-recognition",
      name: t("games.cards.notesRecognition.name"),
      description: t("games.cards.notesRecognition.description"),
      icon: <Music2 className="w-8 h-8 text-white" />,
      difficulty: t("games.difficulties.medium"),
      path: "/notes-master-mode/notes-recognition-game",
    },
    {
      id: "sight-reading",
      name: t("games.cards.sightReading.name"),
      description: t("games.cards.sightReading.description"),
      icon: <Eye className="w-8 h-8 text-white" />,
      difficulty: t("games.difficulties.advanced"),
      path: "/notes-master-mode/sight-reading-game",
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
