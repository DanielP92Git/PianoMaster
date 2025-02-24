import { Link } from "react-router-dom";
import { GameModeCard } from "../components/GameModeCard";
import { ArrowLeft, Loader2 } from "lucide-react";
import BackButton from "../components/BackButton";
import { getGamesCategories } from "../services/apiGamesLibrary";
import { useQuery } from "@tanstack/react-query";

function PracticeModes({ practiceModesSectionRef, onSelect }) {
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
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <section ref={practiceModesSectionRef}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Practice Modes</h2>
      <BackButton to={"/"} name={"Dashboard"} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameModes.map((mode) => (
          <Link key={mode.id} to={`/${mode.type}`}>
            <GameModeCard mode={mode} onSelect={onSelect} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PracticeModes;
