import { useTranslation } from "react-i18next";
import { Clock3 } from "lucide-react";

/**
 * TimerDisplay
 *
 * Timed-mode clock pill showing label and formatted time.
 *
 * @param {string} props.formattedTime - Pre-formatted "MM:SS" string from parent timer logic
 */
export function TimerDisplay({ formattedTime }) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <Clock3 className="h-4 w-4 text-white/80" />
      <span className="text-xs font-semibold text-white/80 sm:text-sm">
        {t("games.time")}
      </span>
      <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
        {formattedTime || "00:00"}
      </span>
    </div>
  );
}
