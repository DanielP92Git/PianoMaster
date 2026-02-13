import { motion, AnimatePresence } from "framer-motion";
import { Smartphone } from "lucide-react";
import { useMotionTokens } from "../../utils/useMotionTokens";

/**
 * Full-screen rotate prompt overlay component.
 * Displays animated tilting phone icon with playful text for 8-year-olds.
 *
 * @param {Object} props
 * @param {Function} props.onDismiss - Callback when user taps "Play anyway"
 */
export function RotatePromptOverlay({ onDismiss }) {
  const { fade } = useMotionTokens();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 flex flex-col items-center justify-center gap-8 px-4"
      >
        {/* Animated phone icon with piano keys illustration */}
        <div className="relative">
          {/* TODO Phase 05: Gate animation with AccessibilityContext reducedMotion */}
          <motion.div
            animate={{
              rotate: [-15, 80]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="relative"
          >
            {/* Smartphone icon */}
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

          {/* Music note emoji for playfulness */}
          <div className="absolute -top-4 -right-4 text-4xl">
            🎵
          </div>
        </div>

        {/* Playful text for 8-year-olds */}
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-3xl font-bold text-white text-center">
            Turn Your Phone Sideways!
          </h2>
          <p className="text-lg text-white/80 text-center px-8">
            Games work best when your phone is sideways
          </p>
        </div>

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="text-white/60 hover:text-white transition-colors text-base px-6 py-2"
        >
          Play anyway
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
