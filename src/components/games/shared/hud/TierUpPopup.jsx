import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * TierUpPopup
 *
 * Full-screen overlay that announces a combo-tier upgrade (DOUBLE XP! / TRIPLE XP!).
 * Appears at center, then flies to the score pill position. Rendered as
 * `fixed inset-0 z-[70]` — must be placed at the root of the game render tree.
 *
 * Reduced-motion is read internally (D-10).
 *
 * @param {2|3|null} props.multiplier  - Current tier multiplier; null = hidden
 * @param {{x: number, y: number}} [props.target] - Fly-to coordinates from
 *   scorePillRef.current.getBoundingClientRect() — computed in parent
 */
export function TierUpPopup({ multiplier, target = { x: 0, y: 0 } }) {
  const { t } = useTranslation("common");
  const { reduce } = useMotionTokens();

  return (
    <AnimatePresence>
      {multiplier && (
        <motion.div
          key={`tier-${multiplier}`}
          initial={
            reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5, x: 0, y: 0 }
          }
          animate={
            reduce
              ? { opacity: [1, 1, 0] }
              : {
                  opacity: [0, 1, 1, 1],
                  scale: [0.5, 1, 1, 0.3],
                  x: [0, 0, 0, target.x],
                  y: [0, 0, 0, target.y],
                }
          }
          transition={
            reduce
              ? { duration: 1.2 }
              : { duration: 1.2, times: [0, 0.15, 0.6, 1], ease: "easeInOut" }
          }
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
        >
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/90 to-yellow-500/90 px-8 py-5 text-center shadow-2xl shadow-amber-500/30 backdrop-blur-sm">
            <div className="text-3xl font-black text-white drop-shadow-lg">
              {multiplier >= 3
                ? t("games.engagement.triplePoints")
                : t("games.engagement.doublePoints")}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
