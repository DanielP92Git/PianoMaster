import { useNavigate } from "react-router-dom";
import { Loader2, Music2, Drum, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getGamesCategories } from "../services/apiGamesLibrary";
import { useQuery } from "@tanstack/react-query";

import { useStreakWithAchievements } from "../hooks/useStreakWithAchievements";

// Modes that are built but not yet released — shown as a disabled "Coming Soon"
// card (card press disabled). Re-enable by removing the type from this set.
const COMING_SOON_MODE_TYPES = new Set(["ear-training-mode"]);

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
    // Coming Soon modes are not yet playable — ignore the press.
    if (COMING_SOON_MODE_TYPES.has(modeType)) return;
    // Navigate immediately for instant feedback
    navigate(`/${modeType}`);
    // Update streak/achievements in background (fire-and-forget)
    updateStreakWithAchievements.mutate();
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <p className="animate-pulse text-white/80">
            {t("games.practiceModes.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-900 to-pink-900 p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-md">
          <h3 className="mb-4 text-2xl font-bold text-white">
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
    "ear-training-mode": {
      nameKey: "games.cards.earTraining.name",
      descriptionKey: "games.cards.earTraining.description",
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
      comingSoon: COMING_SOON_MODE_TYPES.has(mode.type),
      icon:
        mode.type === "rhythm-mode" ? (
          <Drum className="h-8 w-8 text-white" />
        ) : (
          <Music2 className="h-8 w-8 text-white" />
        ),
      displayName: translation ? t(translation.nameKey) : mode.name,
      displayDescription: translation
        ? t(translation.descriptionKey)
        : mode.description,
      displayDifficulty: difficultyKey ? t(difficultyKey) : mode.difficulty,
    };
  });

  return (
    <div
      ref={practiceModesSectionRef}
      className="mx-auto p-4 md:max-w-4xl lg:max-w-5xl lg:p-6 xl:max-w-7xl"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-4">
        {enhancedGameModes.map((mode) => (
          <div
            key={mode.id}
            onClick={(e) => handleStartMode(e, mode.type)}
            aria-disabled={mode.comingSoon || undefined}
            className={`group relative h-[200px] w-full md:h-[280px] lg:h-[240px] ${
              mode.comingSoon ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl border border-white/20 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm transition-all duration-300 ${
                mode.comingSoon
                  ? "opacity-60"
                  : "group-hover:from-indigo-600/30 group-hover:to-purple-600/30"
              }`}
            >
              <div className="flex h-full flex-col p-3 md:p-5 lg:p-4">
                <div className="flex items-start">
                  <div className="rounded-lg bg-white/5 p-1.5">{mode.icon}</div>
                </div>
                <div className="mt-2 flex-1">
                  <h2
                    className={`text-base font-semibold text-white transition-colors md:text-lg lg:text-base ${
                      mode.comingSoon ? "" : "group-hover:text-blue-200"
                    }`}
                  >
                    {mode.displayName || mode.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-300 md:text-sm lg:text-xs">
                    {mode.displayDescription || mode.description}
                  </p>
                </div>
                <div className="mt-2 flex justify-end">
                  {mode.comingSoon ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/70">
                      <Lock className="h-3 w-3" />
                      {t("games.comingSoon")}
                    </span>
                  ) : (
                    <button className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white backdrop-blur-md transition-colors hover:bg-white/20">
                      {t("games.practiceModes.startMode")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
