import { useTranslation } from "react-i18next";

export function GameModeCard({ mode }) {
  const { t } = useTranslation("common");
  const nameKey = mode.nameKey || mode.translationKey?.nameKey;
  const descriptionKey =
    mode.descriptionKey || mode.translationKey?.descriptionKey;
  const title = mode.displayName || (nameKey ? t(nameKey) : mode.name);
  const description =
    mode.displayDescription ||
    (descriptionKey ? t(descriptionKey) : mode.description);

  return (
    <div className="h-[400px] flex flex-col bg-white/10 backdrop-blur-md rounded-3xl p-6 hover:transform hover:scale-[1.02] transition-all duration-300 border border-white/20 group relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>

      {/* Content */}
      <div className="relative flex flex-col flex-1">
        {/* Header with icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center p-3">
            {mode.icon}
          </div>
          <div className="flex">
            {/* {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < difficultyLevel
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-400/30"
                }`}
              />
            ))} */}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>

        {/* Stats bars */}
        <div className="space-y-3 mb-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/60">
                {t("games.modeCard.progress")}
              </span>
              <span className="text-white/80">{mode.progress || 0}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                style={{ width: `${mode.progress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-white/70 text-sm mb-auto line-clamp-2">
          {description}
        </p>

        {/* Play button */}
        <button className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
          {t("games.modeCard.playNow")}
        </button>
      </div>
    </div>
  );
}
