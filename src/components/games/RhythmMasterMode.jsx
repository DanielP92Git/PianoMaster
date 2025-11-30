import React from "react";
import { Volume2 } from "lucide-react";
import BackButton from "../ui/BackButton";
import { GameModeGrid } from "./GameModeGrid";

const games = [
  {
    id: "metronome-trainer",
    name: "Metronome Rhythm Trainer",
    description:
      "Listen to rhythm patterns then tap them back with precise timing",
    icon: <Volume2 className="w-12 h-12 text-white" />,
    difficulty: "All Levels",
    path: "/rhythm-mode/metronome-trainer",
  },
];

export function RhythmMasterMode() {
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
