import { AnimatePresence, motion } from "framer-motion";
import flameIcon from "../../../../assets/icons/flame.png";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { useAccessibility } from "../../../../contexts/AccessibilityContext";

/**
 * OnFireBadge
 *
 * Inline flame badge shown when the player is on a hot streak.
 * Reads BOTH useMotionTokens().reduce (for Framer animate props) AND
 * useAccessibility().reducedMotion (for CSS animate-pulse guard) — the
 * dual-source reduced-motion pattern is required because the two settings
 * can differ (OS pref vs in-app toggle).
 *
 * @param {boolean} props.active - Whether to show the badge
 */
export function OnFireBadge({ active }) {
  const { reduce } = useMotionTokens();
  const { reducedMotion } = useAccessibility();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="fire-badge"
          initial={reduce ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className={reduce || reducedMotion ? "" : "animate-pulse"}
        >
          <img src={flameIcon} alt="" className="h-10 w-10" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
