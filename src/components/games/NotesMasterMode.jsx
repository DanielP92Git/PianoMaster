import React from "react";
import { Music2, Grid, Eye } from "lucide-react";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

const games = [
  {
    id: "memory-game",
    name: "Memory Game",
    description: "Match notes with their names",
    icon: <Grid className="w-8 h-8 text-white" />,
    difficulty: "Easy",
    path: "/notes-master-mode/memory-game",
  },
  {
    id: "notes-recognition",
    name: "Notes Recognition",
    description: "Identify notes on the staff",
    icon: <Music2 className="w-8 h-8 text-white" />,
    difficulty: "Medium",
    path: "/notes-master-mode/notes-recognition-game",
  },
  {
    id: "sight-reading",
    name: "Sight Reading",
    description: "Play patterns with accurate pitch and timing",
    icon: <Eye className="w-8 h-8 text-white" />,
    difficulty: "Advanced",
    path: "/notes-master-mode/sight-reading-game",
  },
];

export function NotesMasterMode() {
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-4">
        <BackButton
          to="/practice-modes"
          name="Game Modes"
          className="text-white/80 hover:text-white"
        />
      </div>

      <GameModeGrid games={games} />
    </div>
  );
}
