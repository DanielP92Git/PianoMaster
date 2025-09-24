import { Link, useNavigate } from "react-router-dom";
import { Loader2, Music, Glasses, Search } from "lucide-react";
import BackButton from "../components/ui/BackButton";
import { getGamesCategories } from "../services/apiGamesLibrary";
import { useQuery } from "@tanstack/react-query";
import StreakDisplay from "../components/streak/StreakDisplay";
import { streakService } from "../services/streakService";

export default function PracticeModes({ practiceModesSectionRef }) {
  const navigate = useNavigate();
  const {
    isPending,
    data: gameModes,
    error,
  } = useQuery({
    queryKey: ["games-categories"],
    queryFn: getGamesCategories,
  });

  const handleStartMode = async (e, modeType) => {
    e.preventDefault();
    await streakService.updateStreak();
    navigate(`/${modeType}`);
  };

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

  const enhancedGameModes = gameModes.map((mode) => ({
    ...mode,
    progress: Math.floor(Math.random() * 100),
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
    <div ref={practiceModesSectionRef} className="space-y-6 p-4">
      <BackButton to="/" name="Dashboard" styling="mb-12" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Practice Modes</h1>
          <p className="text-gray-300">Choose your musical challenge</p>
        </div>
        <StreakDisplay />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {enhancedGameModes.map((mode) => (
          <div
            key={mode.id}
            onClick={(e) => handleStartMode(e, mode.type)}
            className="relative group h-[250px] w-full cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:from-indigo-600/30 group-hover:to-purple-600/30">
              <div className="h-full flex flex-col p-6">
                <div className="flex items-center justify-between mb-4">
                  {mode.icon}
                  <div className="text-sm text-white/60">
                    {mode.progress}% Complete
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {mode.name}
                </h3>
                <p className="text-white/60 text-sm mb-auto">
                  {mode.description}
                </p>
                <div className="mt-4">
                  <button className="w-full py-2 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                    Start Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
