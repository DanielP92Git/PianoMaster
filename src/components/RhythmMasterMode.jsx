import React, { useState } from "react";
// import { ArrowLeft, Play, Mic, Volume2, Plus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ListenAndRepeat } from "./rhythm-games/ListenAndRepeat";
import { YourGroove } from "./rhythm-games/YourGroove";
import { RhythmProvider } from "../reducers/RhythmReducer";
import BackButton from "./BackButton";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "../services/apiGames";
import Spinner from "../ui/Spinner";

export function RhythmMasterMode({}) {
  const [selectedGame, setSelectedGame] = useState(null);

  const {
    isPending,
    data: games,
    error,
  } = useQuery({
    queryKey: ["games"],
    queryFn: getGames,
  });

  if (selectedGame === "listen-repeat") {
    return (
      <RhythmProvider>
        <ListenAndRepeat onBack={() => setSelectedGame(null)} />
      </RhythmProvider>
    );
  }

  if (selectedGame === "create-own") {
    return (
      <RhythmProvider>
        <YourGroove onBack={() => setSelectedGame(null)} />
      </RhythmProvider>
    );
  }

  if (isPending) {
    return <Spinner />;
  }

  if (error) {
    return <Error error={error} />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-4xl mx-auto">
        <BackButton to={"/"} name={"Dashboard"} />

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">
            Rhythm Master
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map(({ id, name, description, icon }) => {
              const Icon = LucideIcons[icon];
              return (
                <button
                  key={id}
                  onClick={() => setSelectedGame(id)}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left border-2 border-gray-100 hover:border-indigo-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {name}
                  </h3>
                  <p className="text-gray-600">{description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
