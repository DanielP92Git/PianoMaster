import React from "react";
import { Music, Grid } from "lucide-react";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

const games = [
  {
    id: "memory-game",
    name: "Memory Game",
    description: "Match notes with their names",
    icon: <Grid className="w-8 h-8 text-white" />,
    difficulty: "Easy",
    path: "/notes-reading-mode/memory-game",
  },
  {
    id: "notes-reading",
    name: "Notes Reading",
    description: "Identify notes on the staff",
    icon: <Music className="w-8 h-8 text-white" />,
    difficulty: "Medium",
    path: "/notes-reading-mode/notes-reading-game",
  },
];

export function NotesReadingMode() {
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
