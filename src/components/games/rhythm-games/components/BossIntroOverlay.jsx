import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { useAccessibility } from "../../../../contexts/AccessibilityContext";

/**
 * BossIntroOverlay (D-18, Phase 33 Plan 33-08).
 *
 * Full-screen amber/gold intro overlay shown before the first question of a
 * full BOSS node. Displays "BOSS FIGHT" title (i18n) plus optional boss name
 * for ~2 seconds, then auto-dismisses via onDismiss.
 *
 * Per CONTEXT D-18 scope guardrails: intro overlay + victory VFX only.
 *   - NO music swap or boss-specific music sting
 *   - NO new game mechanics
 *   - NO boss-specific HUD beyond this overlay
 *
 * Mounts only when node.isBoss && node.nodeType === "boss" (full BOSS).
 * Does NOT mount for mini_boss (per PATTERNS §7).
 *
 * Respects reducedMotion (skips pulse/scale animation, shows static text)
 * and i18n (EN + HE) per AccessibilityContext + CLAUDE.md.
 *
 * @param {Object} props
 * @param {string} [props.bossName] - Optional boss node name to display under title
 * @param {Function} [props.onDismiss] - Callback fired when overlay auto-dismisses (after 2s)
 */
export function BossIntroOverlay({ bossName, onDismiss }) {
  const { t, i18n } = useTranslation("trail");
  const { fade } = useMotionTokens();
  const { reducedMotion } = useAccessibility();
  const isRTL = i18n.dir() === "rtl";
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          dir={isRTL ? "rtl" : "ltr"}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-900/95 via-orange-900/95 to-red-900/95 px-4 backdrop-blur-md"
        >
          <Crown className="h-16 w-16 text-amber-300" aria-hidden="true" />
          {reducedMotion ? (
            <h1
              className="select-none text-center text-5xl font-extrabold text-amber-300"
              style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive" }}
            >
              {t("boss.intro.title", "BOSS FIGHT")}
            </h1>
          ) : (
            <motion.h1
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.1, 1] }}
              transition={{ duration: 0.6 }}
              className="select-none text-center text-5xl font-extrabold text-amber-300"
              style={{ fontFamily: "'Fredoka One', 'Fredoka', cursive" }}
            >
              {t("boss.intro.title", "BOSS FIGHT")}
            </motion.h1>
          )}
          {bossName && (
            <p className="text-center text-xl text-white/90">{bossName}</p>
          )}
          <p className="text-center text-base text-white/70">
            {t("boss.intro.subtitle", "Show what you've learned!")}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BossIntroOverlay;
