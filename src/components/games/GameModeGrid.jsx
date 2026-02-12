import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { prepareGameLandscape } from "../../utils/pwa";

/**
 * Reusable game mode grid component
 * - Shows max 3 cards per row on mobile (default)
 * - If less than 3 cards, they span the full width evenly
 * - Maintains consistent layout across all game mode screens
 * - Supports column layout for portrait mode via `layout="column"` prop
 */
export function GameModeGrid({ games, layout = "grid" }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  const handleEnterGame = (event, path) => {
    event.preventDefault();

    // Best-effort: try to enter fullscreen and lock landscape *from the user gesture*.
    // Fire-and-forget: don't block navigation if this fails or takes time.
    prepareGameLandscape().catch(() => {
      // Silently ignore failures - navigation should proceed regardless
    });

    // Navigate immediately, don't wait for fullscreen
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

  // Use column layout if specified
  const containerClass =
    layout === "column"
      ? "flex flex-col gap-3"
      : `grid ${getGridClass()} gap-3`;

  return (
    <div className={containerClass}>
      {games.map((game) => (
        <Link
          key={game.id}
          to={game.path}
          onClick={(e) => handleEnterGame(e, game.path)}
          className="group relative block h-[200px] w-full cursor-pointer"
        >
          <div className="h-full transform rounded-xl border border-white/20 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:from-indigo-600/30 hover:to-purple-600/30 hover:shadow-2xl">
            <div className="flex h-full flex-col p-3">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-white/5 p-1.5">{game.icon}</div>
                <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/20">
                  {game.displayDifficulty ||
                    (game.difficultyKey
                      ? t(game.difficultyKey)
                      : game.difficulty)}
                </span>
              </div>
              <div className="mt-2 flex-1">
                <h2 className="text-base font-semibold text-white transition-colors group-hover:text-blue-200">
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
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white backdrop-blur-md transition-colors"
                >
                  {t("games.actions.start")}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
