import { motion, AnimatePresence } from "framer-motion";
import { Smartphone } from "lucide-react";
import { useMotionTokens } from "../../utils/useMotionTokens";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { useTranslation } from "react-i18next";

/**
 * Full-screen rotate prompt overlay component.
 * Displays animated tilting phone icon with playful text for 8-year-olds.
 * Integrated with accessibility (reducedMotion), i18n (EN/HE), and RTL support.
 *
 * @param {Object} props
 * @param {Function} props.onDismiss - Callback when user taps "Play anyway"
 */
export function RotatePromptOverlay({ onDismiss }) {
  const { fade } = useMotionTokens();
  const { reducedMotion } = useAccessibility();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        dir={isRTL ? "rtl" : "ltr"}
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 flex flex-col items-center justify-center gap-8 px-4"
      >
        {/* ARIA live region for screen reader announcement */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {t("rotatePrompt.screenReaderAnnouncement")}
        </div>

        {/* Phone icon with piano keys illustration */}
        <div className="relative">
          {reducedMotion ? (
            // Static phone icon when reduced motion is enabled
            <div className="relative">
              <Smartphone
                size={120}
                className="text-blue-400"
                strokeWidth={1.5}
              />

              {/* Mini piano keys overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-0.5 scale-[0.35] origin-center">
                  {/* White key */}
                  <div className="w-3 h-8 bg-white border border-gray-300 rounded-b-sm" />
                  {/* Black key */}
                  <div className="w-2 h-5 bg-gray-900 border border-gray-800 rounded-b-sm -mx-0.5 relative z-10" />
                  {/* White key */}
                  <div className="w-3 h-8 bg-white border border-gray-300 rounded-b-sm" />
                  {/* Black key */}
                  <div className="w-2 h-5 bg-gray-900 border border-gray-800 rounded-b-sm -mx-0.5 relative z-10" />
                  {/* White key */}
                  <div className="w-3 h-8 bg-white border border-gray-300 rounded-b-sm" />
                </div>
              </div>
            </div>
          ) : (
            // Animated phone icon when motion is allowed
            <motion.div
              animate={{
                rotate: [0, 0, -90, -90, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                times: [0, 0.1, 0.4, 0.75, 0.75],
                ease: "easeInOut"
              }}
              className="relative"
            >
              <Smartphone
                size={120}
                className="text-blue-400"
                strokeWidth={1.5}
              />

              {/* Mini piano keys overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-0.5 scale-[0.35] origin-center">
                  {/* White key */}
                  <div className="w-3 h-8 bg-white border border-gray-300 rounded-b-sm" />
                  {/* Black key */}
                  <div className="w-2 h-5 bg-gray-900 border border-gray-800 rounded-b-sm -mx-0.5 relative z-10" />
                  {/* White key */}
                  <div className="w-3 h-8 bg-white border border-gray-300 rounded-b-sm" />
                  {/* Black key */}
                  <div className="w-2 h-5 bg-gray-900 border border-gray-800 rounded-b-sm -mx-0.5 relative z-10" />
                  {/* White key */}
                  <div className="w-3 h-8 bg-white border border-gray-300 rounded-b-sm" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Playful text for 8-year-olds */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl font-bold text-white text-center">
            {t("rotatePrompt.title")}
          </h2>
          <p className="text-lg text-white/80 text-center px-8">
            {t("rotatePrompt.description")}
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label={t("rotatePrompt.dismissButton")}
          className="text-white/60 hover:text-white transition-colors text-base px-6 py-2"
        >
          {t("rotatePrompt.dismissButton")}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
