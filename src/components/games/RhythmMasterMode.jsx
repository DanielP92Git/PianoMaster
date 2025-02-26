import React, { useState } from "react";
import { Music, Plus } from "lucide-react";
import BackButton from "../ui/BackButton";
import { Link } from "react-router-dom";

const games = [
  {
    id: "listen-repeat",
    name: "Listen & Repeat",
    description: "Listen to a rhythm pattern and repeat it back",
    icon: <Music className="w-12 h-12 text-white" />,
    difficulty: "Beginner",
    path: "/rhythm-mode/listen-and-repeat",
  },
  {
    id: "create-own",
    name: "Your Groove",
    description: "Create your own rhythm patterns",
    icon: <Plus className="w-12 h-12 text-white" />,
    difficulty: "Intermediate",
    path: "/rhythm-mode/create-own",
  },
];

// const GAME_COMPONENTS = {
//   "listen-repeat": ListenAndRepeat,
//   "create-own": YourGroove,
// };

export function RhythmMasterMode() {
  // const [selectedGame, setSelectedGame] = useState(null);

  // if (selectedGame) {
  //   const GameComponent = GAME_COMPONENTS[selectedGame];
  //   return (
  //     // Only wrap YourGroove with RhythmProvider
  //     selectedGame === "create-own" ? (
  //       <RhythmProvider>
  //         <GameComponent onBack={() => setSelectedGame(null)} />
  //       </RhythmProvider>
  //     ) : (
  //       <GameComponent onBack={() => setSelectedGame(null)} />
  //     )
  //   );
  // }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <BackButton
        to="/practice-modes"
        name="Game Modes"
        className="text-white/80 hover:text-white"
      />
      <h1 className="text-2xl font-bold text-white mb-4">
        Rhythm Master Games
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {games.map((game) => (
          <Link key={game.id} to={game.path} className="relative group">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="bg-white/5 rounded-lg p-1.5">{game.icon}</div>
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/20">
                    {game.difficulty}
                  </span>
                </div>
                <div className="mt-2">
                  <h2 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
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
