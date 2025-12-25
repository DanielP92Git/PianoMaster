import { useEffect } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

/**
 * WelcomeText
 *
 * Drop-in animated text overlay for the dashboard hero image.
 *
 * Props:
 * - title: React.ReactNode
 * - subtitle: React.ReactNode
 * - holdMs?: number (default 3000)  // how long to stay fully visible
 * - enterY?: number (default -50)   // starting y offset (px)
 * - exitY?: number (default 50)     // ending y offset (px)
 * - entranceBounce?: boolean (default true)
 * - className?: string             // wrapper className override/extend
 */
export default function WelcomeText({
  title,
  subtitle,
  holdMs = 3000,
  enterY = -50,
  exitY = 50,
  entranceBounce = true,
  className = "",
}) {
  const controls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Enter
      await controls.start({
        y: 0,
        opacity: 1,
        transition: prefersReducedMotion
          ? { duration: 0.35, ease: "easeOut" }
          : entranceBounce
            ? {
                type: "spring",
                stiffness: 140,
                damping: 12,
                bounce: 0.25,
              }
            : { duration: 0.45, ease: "easeOut" },
      });

      // Hold
      await new Promise((r) => setTimeout(r, holdMs));
      if (cancelled) return;

      // Exit
      await controls.start({
        y: prefersReducedMotion ? 0 : exitY,
        opacity: 0,
        transition: { duration: 0.55, ease: "easeInOut" },
      });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [controls, entranceBounce, exitY, holdMs, prefersReducedMotion]);

  return (
    <motion.div
      initial={{ y: prefersReducedMotion ? 0 : enterY, opacity: 0 }}
      animate={controls}
      className={`absolute inset-0 flex items-center justify-center px-4 text-center ${className}`}
    >
      <div className="space-y-2 sm:space-y-3">
        <motion.h1 className="text-3xl font-bold text-white drop-shadow-2xl sm:text-4xl lg:text-5xl">
          {title}
        </motion.h1>
        <motion.p className="text-base text-white/90 drop-shadow-lg sm:text-lg">
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
}



