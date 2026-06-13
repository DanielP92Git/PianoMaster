import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * LivesDisplay
 *
 * Animated hearts row showing lives remaining. Reduced-motion is read
 * internally (D-10) — parent must NOT pass a reducedMotion prop.
 *
 * @param {number} props.lives       - Current lives remaining
 * @param {number} props.totalLives  - Total lives (renders this many hearts)
 */
export function LivesDisplay({ lives, totalLives = 3 }) {
  const { reduce } = useMotionTokens();

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${lives} lives remaining`}
      role="group"
    >
      {Array.from({ length: totalLives }).map((_, i) => (
        <AnimatePresence key={i} mode="wait">
          {i < lives ? (
            <motion.div
              key={`heart-${i}-alive`}
              initial={false}
              exit={
                reduce ? undefined : { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
              }
              transition={{ duration: 0.3 }}
            >
              <Heart
                className="h-5 w-5 fill-red-400 text-red-400 sm:h-6 sm:w-6"
                aria-hidden="true"
              />
            </motion.div>
          ) : (
            <motion.div
              key={`heart-${i}-dead`}
              initial={reduce ? undefined : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.3 }}
              transition={{ duration: 0.2 }}
            >
              <Heart
                className="h-5 w-5 text-white/30 sm:h-6 sm:w-6"
                aria-hidden="true"
              />
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );
}
