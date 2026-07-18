import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowUp, Check } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * LevelUpCue
 *
 * Positive-only escalation cue (D-12). When difficulty/tempo steps up, a brief
 * "leveling up" overlay celebrates it — same spirit as OnFireSplash. Easing
 * down is silent by design: there is no negative/easing variant of this
 * component and none should ever be added.
 *
 * Presentation-only: driven by the parent-controlled `show` prop. The cue does
 * NOT auto-dismiss — the child dismisses it with the explicit button so they
 * can read it at their own pace; the parent's `onDismiss` then starts the next
 * exercise's preview playback ("show cue, then play").
 *
 * A pointer-capturing backdrop keeps the game behind inert while the cue is up;
 * only the dismiss button closes it (backdrop taps are intentionally ignored).
 *
 * Reduced-motion is read internally (D-10 pattern, mirrors OnFireSplash).
 *
 * @param {boolean} props.show - Whether to show the cue overlay
 * @param {() => void} props.onDismiss - Called when the child taps the dismiss button
 */
export function LevelUpCue({ show, onDismiss }) {
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
          className="pointer-events-auto fixed inset-0 z-[70] flex flex-col items-center justify-center gap-2 bg-slate-900/40 text-center"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-indigo-400/30 bg-indigo-950/90 px-6 py-5 shadow-xl backdrop-blur-md">
            <ArrowUp
              className="h-12 w-12 text-indigo-300 drop-shadow-[0_0_16px_rgba(129,140,248,0.6)] sm:h-14 sm:w-14"
              aria-hidden="true"
            />
            <p className="text-xl font-bold text-white sm:text-2xl">
              {t("sightReading.adaptive.levelUp")}
            </p>
            <p className="text-sm text-white/80 sm:text-base">
              {t("sightReading.adaptive.levelUpSubtitle")}
            </p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label={t("sightReading.adaptive.levelUpDismiss")}
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-2.5 text-base font-bold text-white shadow-lg transition-colors hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:text-lg"
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              {t("sightReading.adaptive.levelUpDismiss")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
