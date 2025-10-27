import React from "react";
import { Link } from "react-router-dom";
import { Music2, Grid } from "lucide-react";
import BackButton from "../ui/BackButton";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className="relative group h-[200px] w-full"
          >
            <div className="h-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:from-indigo-600/30 hover:to-purple-600/30">
              <div className="h-full flex flex-col p-3">
                <div className="flex items-start justify-between">
                  <div className="bg-white/5 rounded-lg p-1.5">{game.icon}</div>
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/20">
                    {game.difficulty}
                  </span>
                </div>
                <div className="mt-2 flex-1">
                  <h2 className="text-base font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {game.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-300">
                    {game.description}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="inline-flex items-center justify-center px-2 py-1 text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors">
                    Start Game
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
