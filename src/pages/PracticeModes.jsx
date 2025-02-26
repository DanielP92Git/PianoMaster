import { Link } from "react-router-dom";
import { GameModeCard } from "../components/games/GameModeCard";
import {
  ArrowLeft,
  Loader2,
  Music,
  Piano,
  Music as MusicNote,
  ChevronLeft,
} from "lucide-react";
import BackButton from "../components/BackButton";
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
        <Music className="w-full h-full text-white" />
      ) : mode.type === "notes" ? (
        <MusicNote className="w-full h-full text-white" />
      ) : (
        <Piano className="w-full h-full text-white" />
      ),
  }));

  return (
    <div ref={practiceModesSectionRef} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Practice Modes</h1>
          <p className="text-gray-300">Choose your musical challenge</p>
        </div>
        <BackButton
          to="/"
          name="Dashboard"
          className="flex items-center text-white/80 hover:text-white transition-colors"
        />
         
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enhancedGameModes.map((mode) => (
          <Link key={mode.id} to={`/${mode.type}`}>
            <GameModeCard mode={mode} onSelect={onSelect} />
          </Link>
        ))}
      </div>
    </div>
  );
}
