import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { prepareGameLandscape } from "../../utils/pwa";

/**
 * Reusable game mode grid component
 * - Shows max 3 cards per row on mobile
 * - If less than 3 cards, they span the full width evenly
 * - Maintains consistent layout across all game mode screens
 */
export function GameModeGrid({ games }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  const handleEnterGame = async (event, path) => {
    event.preventDefault();

    // Best-effort: try to enter fullscreen and lock landscape *from the user gesture*.
    // Even if this fails (browser policy), navigation should still proceed.
    try {
      await prepareGameLandscape();
    } catch {
      // ignore
    }

    navigate(path);
  };
  // Determine grid columns based on number of games
  const getGridClass = () => {
    if (games.length >= 3) {
      return "grid-cols-3";
    } else if (games.length === 2) {
      return "grid-cols-2";
    } else {
      return "grid-cols-1";
    }
  };

  return (
    <div className={`grid ${getGridClass()} gap-3`}>
      {games.map((game) => (
        <Link
          key={game.id}
          to={game.path}
          onClick={(e) => handleEnterGame(e, game.path)}
          className="relative group h-[200px] w-full"
        >
          <div className="h-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-md rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:from-indigo-600/30 hover:to-purple-600/30">
            <div className="h-full flex flex-col p-3">
              <div className="flex items-start justify-between">
                <div className="bg-white/5 rounded-lg p-1.5">{game.icon}</div>
                <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/20">
                  {game.displayDifficulty ||
                    (game.difficultyKey
                      ? t(game.difficultyKey)
                      : game.difficulty)}
                </span>
              </div>
              <div className="mt-2 flex-1">
                <h2 className="text-base font-semibold text-white group-hover:text-blue-200 transition-colors">
                  {game.displayName ||
                    (game.nameKey ? t(game.nameKey) : game.name)}
                </h2>
                <p className="mt-0.5 text-xs text-gray-300">
                  {game.displayDescription ||
                    (game.descriptionKey
                      ? t(game.descriptionKey)
                      : game.description)}
                </p>
              </div>
              <div className="mt-2 flex justify-end">
                <button className="inline-flex items-center justify-center px-2 py-1 text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors">
                  {t("games.actions.start")}
                </button>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
