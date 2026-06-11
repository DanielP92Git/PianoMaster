import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * ProgressBar
 *
 * X-of-N progress bar with gradient fill, Framer Motion spring animation,
 * and checkpoint dots at 0/25/50/75/100%. Reads reduced-motion internally.
 *
 * Props:
 * @param {number} props.current - Number of questions answered (0-indexed count)
 * @param {number} props.total   - Total questions in the session
 */
export function ProgressBar({ current, total }) {
  const { t } = useTranslation("common");
  const { soft } = useMotionTokens();
  const progressPercent = Math.min(100, (current / total) * 100);
  return (
    <div className="w-full">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10" />
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 shadow-[0_4px_16px_rgba(99,102,241,0.2)]"
          animate={{ scaleX: progressPercent / 100 }}
          initial={false}
          transition={soft}
          style={{ willChange: "transform" }}
        />
        {[0, 25, 50, 75, 100].map((p) => {
          const isStart = p === 0;
          const isEnd = p === 100;
          const xClass = isStart
            ? "translate-x-0"
            : isEnd
              ? "-translate-x-full"
              : "-translate-x-1/2";
          return (
            <span
              key={p}
              className={`absolute top-1/2 h-2.5 w-2.5 ${xClass} -translate-y-1/2 rounded-full border ${
                progressPercent >= p
                  ? "border-white/40 bg-white/80"
                  : "border-white/20 bg-white/10"
              }`}
              style={{ left: isStart ? "0%" : isEnd ? "100%" : `${p}%` }}
            />
          );
        })}
      </div>
      <div className="mt-2 text-xs font-semibold text-white/75">
        <span>
          {t("noteRecognition.questionProgress", {
            current: Math.min(total, Math.max(1, current + 1)),
            total,
          })}
        </span>
      </div>
    </div>
  );
}
