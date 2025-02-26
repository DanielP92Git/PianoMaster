import React from "react";
import { Link } from "react-router-dom";
import { Music, Grid } from "lucide-react";
import BackButton from "../BackButton";

const games = [
  {
    id: "note-recognition",
    title: "Note Recognition",
    description:
      "Train your ear to identify musical notes quickly and accurately",
    icon: <Music className="w-12 h-12 text-white" />,
    path: "/note-recognition-mode/note-recognition-game",
    difficulty: "Beginner",
    color: "from-indigo-500 to-purple-500",
  },
  {
    id: "memory-game",
    title: "Musical Memory",
    description:
      "Match the musical notes with their names in this memory card game",
    icon: <Grid className="w-12 h-12 text-white" />,
    path: "/note-recognition-mode/memory-game",
    difficulty: "Intermediate",
    color: "from-emerald-500 to-teal-500",
  },
];

export function NoteRecognitionMode() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <BackButton
        to="/practice-modes"
        name="Game Modes"
        className="text-white/80 hover:text-white"
      />
      <h1 className="text-2xl font-bold text-white mb-4">
        Note Recognition Games
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Link key={game.id} to={game.path} className="relative group">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="bg-white/5 rounded-xl p-3">{game.icon}</div>
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-1 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/20">
                    {game.difficulty}
                  </span>
                </div>
                <div className="mt-6">
                  <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {game.title}
                  </h2>
                  <p className="mt-2 text-gray-300">{game.description}</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="inline-flex items-center justify-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors">
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
