import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Flame } from "lucide-react";
import { useMotionTokens } from "../../../../utils/useMotionTokens";

/**
 * ComboPill
 *
 * Combo pill with internal shake/scale animation and optional on-fire styling.
 * Animation is encapsulated — the component detects combo changes via prevComboRef
 * internally (D-10). Parent must NOT pass a comboShake or shouldShake prop.
 *
 * @param {number}  props.combo    - Current combo count
 * @param {boolean} [props.isOnFire] - When true, shows Flame icon instead of Zap
 */
export function ComboPill({ combo, isOnFire = false }) {
  const { reduce } = useMotionTokens();
  const prevComboRef = useRef(combo);
  const [shaking, setShaking] = useState(false);
  const [scaling, setScaling] = useState(false);

  useEffect(() => {
    if (combo < prevComboRef.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 300);
      prevComboRef.current = combo;
      return () => clearTimeout(t);
    }
    if (combo > prevComboRef.current) {
      setScaling(true);
      const t = setTimeout(() => setScaling(false), 300);
      prevComboRef.current = combo;
      return () => clearTimeout(t);
    }
    prevComboRef.current = combo;
  }, [combo]);

  return (
    <motion.div
      animate={
        shaking
          ? { x: [0, -6, 6, -4, 4, 0] }
          : scaling
            ? { scale: [1, 1.18, 1] }
            : undefined
      }
      transition={
        reduce
          ? undefined
          : { type: "tween", duration: 0.22, ease: "easeInOut" }
      }
      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none ${
        combo >= 8
          ? "border-yellow-400/40 bg-yellow-500/20"
          : combo >= 3
            ? "border-amber-400/30 bg-amber-500/15"
            : "border-white/20 bg-white/10"
      }`}
    >
      {isOnFire ? (
        <Flame
          className={`h-4 w-4 ${combo >= 8 ? "text-orange-300" : "text-orange-400"}`}
        />
      ) : (
        <Zap
          className={`h-4 w-4 ${combo >= 8 ? "fill-yellow-300 text-yellow-300" : combo >= 3 ? "fill-amber-300 text-amber-300" : "text-white/70"}`}
        />
      )}
      <span className="font-mono text-sm font-bold tracking-wide text-white sm:text-base">
        {combo}
      </span>
    </motion.div>
  );
}
