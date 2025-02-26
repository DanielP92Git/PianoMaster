import { Link } from "react-router-dom";
import { GameModeCard } from "../components/games/GameModeCard";
import {
  ArrowLeft,
  Loader2,
  Music,
  Piano,
  Music as MusicNote,
  Timer,
  Glasses,
  Search,
} from "lucide-react";
import BackButton from "../components/ui/BackButton";
import { getGamesCategories } from "../services/apiGamesLibrary";
import { useQuery } from "@tanstack/react-query";

export default function PracticeModes({ practiceModesSectionRef, onSelect }) {
  const {
    isPending,
    data: gameModes,
    error,
  } = useQuery({
    queryKey: ["games-categories"],
    queryFn: getGamesCategories,
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <p className="text-white/80 animate-pulse">
            Loading your musical journey...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">Oops!</h3>
          <p className="text-white/80">{error}</p>
        </div>
      </div>
    );
  }

  // Mock data structure to match the design
  // This code takes the game modes data and enhances it with additional properties:
  // 1. Adds a random difficulty score between 0.2 and 1
  // 2. Adds a random progress percentage between 0-100
  // 3. Assigns an icon based on the game mode type:
  //    - Rhythm modes get a Music icon
  //    - Notes modes get a MusicNote icon
  //    - All other modes get a Piano icon

  const enhancedGameModes = gameModes.map((mode) => ({
    ...mode,
    // difficulty: Math.random() * 0.8 + 0.2, // Random difficulty between 0.2 and 1
    progress: Math.floor(Math.random() * 100), // Random progress
    icon:
      mode.type === "rhythm-mode" ? (
        <Music className="w-8 h-8 text-white" />
      ) : mode.type === "note-recognition-mode" ? (
        <Search className="w-8 h-8 text-white" />
      ) : (
        <Glasses className="w-8 h-8 text-white" />
      ),
  }));

  return (
    <div ref={practiceModesSectionRef} className="space-y-6">
      <BackButton
        to="/"
        name="Dashboard"
        className="text-white/80 hover:text-white transition-colors"
      />

      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Practice Modes</h1>
        <p className="text-gray-300">Choose your musical challenge</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {enhancedGameModes.map((mode) => (
          <Link key={mode.id} to={`/${mode.type}`} className="relative group">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="bg-white/5 rounded-lg p-1.5">{mode.icon}</div>
                  <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/20">
                    {mode.difficulty}
                  </span>
                </div>
                <div className="mt-2">
                  <h2 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {mode.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-300">
                    {mode.description}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="inline-flex items-center justify-center px-2 py-1 text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors">
                    Start Mode
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
