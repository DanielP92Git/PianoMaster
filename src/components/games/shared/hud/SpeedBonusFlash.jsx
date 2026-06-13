import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

/**
 * SpeedBonusFlash
 *
 * Displays a "FAST!" flash badge when the player answers quickly.
 * The outer h-7 wrapper reserves layout space so the content below
 * does not shift when the flash appears or disappears.
 *
 * @param {boolean} props.show       - Whether to show the flash
 * @param {number}  [props.flashKey] - Increment to force remount for repeated triggers
 *                                     (see Pitfall 5 in RESEARCH.md)
 */
export function SpeedBonusFlash({ show, flashKey = 0 }) {
  const { t } = useTranslation("common");

  return (
    <div className="pointer-events-none flex h-7 items-center justify-center">
      <AnimatePresence>
        {show && (
          <motion.span
            key={flashKey}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.35 }}
            className="rounded-full bg-amber-400/20 px-4 py-1 text-sm font-bold text-amber-300 backdrop-blur-sm sm:text-base"
          >
            {t("games.engagement.fast")}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
