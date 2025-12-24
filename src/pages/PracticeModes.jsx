import { Link, useNavigate } from "react-router-dom";
import { Loader2, Music2, Drum } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGamesCategories } from "../services/apiGamesLibrary";
import { useQuery } from "@tanstack/react-query";
import StreakDisplay from "../components/streak/StreakDisplay";
import { useStreakWithAchievements } from "../hooks/useStreakWithAchievements";

export default function PracticeModes({ practiceModesSectionRef }) {
  const navigate = useNavigate();
  const updateStreakWithAchievements = useStreakWithAchievements();
  const { t } = useTranslation("common");

  const {
    isPending,
    data: gameModes,
    error,
  } = useQuery({
    queryKey: ["games-categories"],
    queryFn: getGamesCategories,
  });

  const handleStartMode = (e, modeType) => {
    e.preventDefault();
    // Navigate immediately for instant feedback
    navigate(`/${modeType}`);
    // Update streak/achievements in background (fire-and-forget)
    updateStreakWithAchievements.mutate();
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <p className="text-white/80 animate-pulse">
            {t("games.practiceModes.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-4">
            {t("games.practiceModes.errorTitle")}
          </h3>
          <p className="text-white/80">
            {t("games.practiceModes.errorMessage")}
          </p>
        </div>
      </div>
    );
  }

  const translationMap = {
    "rhythm-mode": {
      nameKey: "pages.rhythmMaster",
      descriptionKey: "games.cards.metronomeTrainer.description",
    },
    "notes-master-mode": {
      nameKey: "pages.notesMaster",
      descriptionKey: "games.cards.notesRecognition.description",
    },
    "sight-reading-mode": {
      nameKey: "games.cards.sightReading.name",
      descriptionKey: "games.cards.sightReading.description",
    },
  };

  const enhancedGameModes = gameModes.map((mode) => {
    const translation = translationMap[mode.type];
    const difficultyKey =
      mode.difficulty &&
      {
        easy: "games.difficulties.easy",
        medium: "games.difficulties.medium",
        advanced: "games.difficulties.advanced",
        "all levels": "games.difficulties.allLevels",
      }[mode.difficulty.toLowerCase()];

    return {
      ...mode,
      icon:
        mode.type === "rhythm-mode" ? (
          <Drum className="w-8 h-8 text-white" />
        ) : (
          <Music2 className="w-8 h-8 text-white" />
        ),
      displayName: translation ? t(translation.nameKey) : mode.name,
      displayDescription: translation
        ? t(translation.descriptionKey)
        : mode.description,
      displayDifficulty: difficultyKey ? t(difficultyKey) : mode.difficulty,
    };
  });

  return (
    <div ref={practiceModesSectionRef} className="p-4 lg:p-6 md:max-w-4xl lg:max-w-5xl xl:max-w-7xl mx-auto">
      <div className="flex items-center justify-end mb-4">
        <StreakDisplay />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 lg:gap-4">
        {enhancedGameModes.map((mode) => (
          <div
            key={mode.id}
            onClick={(e) => handleStartMode(e, mode.type)}
            className="relative group h-[200px] md:h-[280px] lg:h-[240px] w-full cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:from-indigo-600/30 group-hover:to-purple-600/30">
              <div className="h-full flex flex-col p-3 md:p-5 lg:p-4">
                <div className="flex items-start">
                  <div className="bg-white/5 rounded-lg p-1.5">{mode.icon}</div>
                </div>
                <div className="mt-2 flex-1">
                  <h2 className="text-base md:text-lg lg:text-base font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {mode.displayName || mode.name}
                  </h2>
                  <p className="mt-0.5 text-xs md:text-sm lg:text-xs text-gray-300">
                    {mode.displayDescription || mode.description}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  <button className="inline-flex items-center justify-center px-2 py-1 text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors">
                    {t("games.practiceModes.startMode")}
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
