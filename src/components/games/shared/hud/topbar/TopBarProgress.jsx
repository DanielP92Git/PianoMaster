import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMotionTokens } from "../../../../../utils/useMotionTokens";

/**
 * TopBarProgress
 *
 * Question-progress column for the game top bar: a counter row over a slim
 * gradient track.
 *
 * Deliberately separate from shared/hud/ProgressBar.jsx rather than a variant
 * of it — that component is a taller track with checkpoint dots and its own
 * label placement, and nearly every line would have to branch.
 *
 * @param {number} props.current  - Questions answered (0-indexed count)
 * @param {number} props.total    - Total questions in the session
 * @param {boolean} [props.compact] - Narrow variant for landscape ("4/10")
 * @param {string} [props.label]  - Overrides the counter string
 */
export function TopBarProgress({
  current = 0,
  total = 0,
  compact = false,
  label,
  className = "",
}) {
  const { t } = useTranslation("common");
  const { soft } = useMotionTokens();

  // Guard against total=0/undefined, which would otherwise render NaN%.
  const safeTotal = Number(total) > 0 ? Number(total) : 0;
  const safeCurrent = Math.max(0, Number(current) || 0);
  const percent = safeTotal
    ? Math.min(100, Math.round((safeCurrent / safeTotal) * 100))
    : 0;
  const displayCurrent = safeTotal
    ? Math.min(safeTotal, safeCurrent + 1)
    : safeCurrent;

  const counterText =
    label ??
    (compact
      ? t("games.topBar.progressCompact", {
          current: displayCurrent,
          total: safeTotal,
        })
      : t("games.topBar.questionProgress", {
          current: displayCurrent,
          total: safeTotal,
        }));

  return (
    <div
      className={`flex w-[150px] flex-col gap-1.5 lg:w-[230px] ${className}`}
    >
      {/* Counter only. A percent readout alongside "4/10" says the same thing
          twice; the percentage is still exposed to assistive tech below. */}
      <div className="flex items-center font-hebrew text-[11px] font-semibold text-white/85 lg:text-xs">
        <span>{counterText}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("games.topBar.progressAria", { value: percent })}
        className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.12] lg:h-[9px]"
      >
        <motion.div
          className="absolute inset-y-0 start-0 w-full origin-[left_center] rounded-full bg-gradient-to-r from-green-500 to-green-400 rtl:origin-[right_center]"
          animate={{ scaleX: percent / 100 }}
          initial={false}
          transition={soft}
          style={{ willChange: "transform" }}
        />
      </div>
    </div>
  );
}
