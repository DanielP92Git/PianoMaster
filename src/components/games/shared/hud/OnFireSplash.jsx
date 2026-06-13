import { AnimatePresence, motion } from "framer-motion";
import flameIcon from "../../../../assets/icons/flame.png";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * OnFireSplash
 *
 * Full-screen flame overlay that appears when the player first enters on-fire
 * mode. Renders as a fixed inset-0 z-[70] overlay — must be placed at the
 * root of the game render tree (not inside a StageCard or scrollable container)
 * to avoid clipping.
 *
 * Reduced-motion is read internally (D-10).
 *
 * @param {boolean} props.show - Whether to show the splash overlay
 */
export function OnFireSplash({ show }) {
  const { reduce } = useMotionTokens();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="fire-splash"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
          animate={
            reduce ? { opacity: 1 } : { opacity: 1, scale: [1, 1.15, 1] }
          }
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
        >
          <img
            src={flameIcon}
            alt=""
            className="h-24 w-24 drop-shadow-[0_0_16px_rgba(251,146,60,0.6)] sm:h-28 sm:w-28"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
