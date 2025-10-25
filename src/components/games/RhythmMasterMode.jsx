import React from "react";
import { Volume2 } from "lucide-react";
import BackButton from "../ui/BackButton";
import { Link } from "react-router-dom";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            to={game.path}
            className="relative group h-[200px] w-full"
          >
            <div
              className={`h-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-md rounded-xl border shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:from-indigo-600/30 hover:to-purple-600/30 ${
                game.featured
                  ? "border-yellow-400/50 ring-2 ring-yellow-400/20"
                  : "border-white/20"
              }`}
            >
              {game.featured && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  NEW!
                </div>
              )}
              <div className="h-full flex flex-col p-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-lg p-1.5 ${game.featured ? "bg-yellow-400/20" : "bg-white/5"}`}
                  >
                    {game.icon}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      game.featured
                        ? "bg-yellow-400/20 text-yellow-300 ring-yellow-400/40"
                        : "bg-white/5 text-white/80 ring-white/20"
                    }`}
                  >
                    {game.difficulty}
                  </span>
                </div>
                <div className="mt-2 flex-1">
                  <h2
                    className={`text-base font-semibold transition-colors ${
                      game.featured
                        ? "text-yellow-300 group-hover:text-yellow-400"
                        : "text-white group-hover:text-blue-200"
                    }`}
                  >
                    {game.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-300">
                    {game.description}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    className={`inline-flex items-center justify-center px-2 py-1 text-xs backdrop-blur-md border rounded-lg transition-colors ${
                      game.featured
                        ? "bg-yellow-400/20 border-yellow-400/40 text-yellow-300 hover:bg-yellow-400/30"
                        : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    }`}
                  >
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
