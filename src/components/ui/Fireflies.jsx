import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const fireflyVariants = {
  animate: ({ dx1, dx2, dy1, dy2, duration, delay }) => ({
    x: [0, dx1, dx2, 0],
    y: [0, dy1, dy2, 0],
    transition: {
      repeat: Infinity,
      duration,
      delay,
      ease: "easeInOut",
    },
  }),
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Fireflies
 *
 * Animated fireflies overlay intended to sit above a hero background image.
 *
 * Props:
 * - count?: number (default 10)
 * - positions?: Array<{ top: string, left: string }>
 * - className?: string
 */
export default function Fireflies({ count = 5, positions, className = "" }) {
  const prefersReducedMotion = useReducedMotion();

  const resolved = useMemo(() => {
    const base = [
      { top: "18%", left: "28%" },
      { top: "34%", left: "62%" },
      { top: "46%", left: "18%" },
      { top: "64%", left: "52%" },
      { top: "26%", left: "82%" },
    ];

    const targetCount = clamp(count, 1, 24);
    const basePositions = positions?.length
      ? positions
      : base.slice(0, targetCount);

    // If caller provides fewer positions than count, repeat cycling through them.
    const finalPositions =
      basePositions.length >= targetCount
        ? basePositions.slice(0, targetCount)
        : Array.from({ length: targetCount }).map(
            (_, i) => basePositions[i % basePositions.length]
          );

    return finalPositions.map((pos, i) => {
      // Stagger + de-sync: vary amplitude/duration/delay slightly per firefly.
      const amp = prefersReducedMotion ? 0 : 6 + ((i * 7) % 9); // 6..14
      const amp2 = prefersReducedMotion ? 0 : -6 - ((i * 5) % 9); // -6..-14
      const duration = 3.6 + ((i * 13) % 12) / 10; // 3.6..4.7
      const delay = ((i * 17) % 20) / 10; // 0..1.9

      return {
        pos,
        motion: {
          dx1: amp,
          dx2: amp2,
          dy1: -amp,
          dy2: -amp2,
          duration,
          delay,
        },
        sizeClass:
          i % 3 === 0
            ? "w-1.5 h-1.5 sm:w-2 sm:h-2"
            : "w-1 h-1 sm:w-1.5 sm:h-1.5",
        opacityClass: i % 4 === 0 ? "opacity-90" : "opacity-75",
      };
    });
  }, [count, positions, prefersReducedMotion]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    >
      {resolved.map((f, i) => (
        <motion.div
          key={`${f.pos.top}-${f.pos.left}-${i}`}
          className={[
            "absolute rounded-full",
            f.sizeClass,
            f.opacityClass,
            // Color + blend
            "bg-purple-200/90 mix-blend-screen",
            // Glow
            "drop-shadow-[0_0_10px_rgba(255,255,170,0.9)]",
          ].join(" ")}
          style={{ top: f.pos.top, left: f.pos.left }}
          variants={fireflyVariants}
          animate="animate"
          custom={f.motion}
        />
      ))}
    </div>
  );
}

