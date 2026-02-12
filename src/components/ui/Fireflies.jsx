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
            ? "w-3 h-3 sm:w-4 sm:h-4"
            : "w-2 h-2 sm:w-3 sm:h-3",
        opacityClass: i % 4 === 0 ? "opacity-100" : "opacity-90",
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
            // Base color - bright white/yellow center
            "bg-white",
            // Mix blend for glowing effect
            "mix-blend-screen",
          ].join(" ")}
          style={{
            top: f.pos.top,
            left: f.pos.left,
            // Radial gradient using background image
            background: `radial-gradient(circle, rgba(255, 255, 200, 1) 0%, rgba(255, 255, 180, 0.8) 30%, rgba(255, 255, 160, 0.4) 60%, transparent 100%)`,
            // Multi-layered glow effect with box-shadow
            boxShadow: `
              0 0 10px rgba(255, 255, 200, 1),
              0 0 20px rgba(255, 255, 180, 0.8),
              0 0 30px rgba(255, 255, 160, 0.6),
              0 0 40px rgba(255, 255, 140, 0.4),
              inset 0 0 10px rgba(255, 255, 255, 0.6)
            `,
            // Blur filter for soft, diffused edges
            filter: "blur(1.5px)",
          }}
          variants={fireflyVariants}
          animate="animate"
          custom={f.motion}
        />
      ))}
    </div>
  );
}

