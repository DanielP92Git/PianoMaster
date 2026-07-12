import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * LevelUpCue
 *
 * Positive-only escalation cue (D-12). When difficulty/tempo steps up, a brief
 * "leveling up" overlay celebrates it — same spirit as OnFireSplash. Easing
 * down is silent by design: there is no negative/easing variant of this
 * component and none should ever be added.
 *
 * Presentation-only: driven entirely by the parent-controlled `show` prop.
 * The parent owns the trigger + auto-dismiss timing.
 *
 * Reduced-motion is read internally (D-10 pattern, mirrors OnFireSplash).
 *
 * @param {boolean} props.show - Whether to show the cue overlay
 */
export function LevelUpCue({ show }) {
  const { t } = useTranslation();
  const { reduce } = useMotionTokens();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="level-up-cue"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={
            reduce ? { opacity: 1 } : { opacity: 1, scale: [1, 1.15, 1] }
          }
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[70] flex flex-col items-center justify-center gap-2 text-center"
        >
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md">
            <ArrowUp
              className="h-12 w-12 text-indigo-300 drop-shadow-[0_0_16px_rgba(129,140,248,0.6)] sm:h-14 sm:w-14"
              aria-hidden="true"
            />
            <p className="text-xl font-bold text-white sm:text-2xl">
              {t("sightReading.adaptive.levelUp")}
            </p>
            <p className="text-sm text-white/70 sm:text-base">
              {t("sightReading.adaptive.levelUpSubtitle")}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
