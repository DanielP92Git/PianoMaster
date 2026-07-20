import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import flameIcon from "../../../../../assets/icons/flame-simple.png";
import { useMotionTokens } from "../../../../../utils/useMotionTokens";
import { useAccessibility } from "../../../../../contexts/AccessibilityContext";

/**
 * Reads the in-app reduced-motion setting without hard-requiring an
 * AccessibilityProvider. useAccessibility() throws when no provider is
 * mounted; this bar is shared across games and always mounted, so it degrades
 * to "motion allowed" rather than taking the whole game screen down.
 *
 * The hook is still called unconditionally on every render — useAccessibility
 * runs its useContext before it can throw — so hook order stays stable.
 */
function useReducedMotionSetting() {
  /*
   * The hook below is called unconditionally on every render — useAccessibility
   * runs its useContext before it can throw — so hook order stays stable and
   * only the "no provider" error is swallowed. rules-of-hooks cannot see that
   * distinction and flags any hook call inside a try block.
   *
   * Covered by the "renders without an AccessibilityProvider" case in
   * StreakHero.test.jsx, and required by SightReadingGame.micRestart.test.jsx,
   * which renders the real context module with no provider mounted.
   */
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return Boolean(useAccessibility()?.reducedMotion);
  } catch {
    return false;
  }
}

/**
 * StreakHero
 *
 * The celebratory element of the game top bar: a flame over the current
 * session streak (combo). Merges what used to be a separate ComboPill and
 * OnFireBadge — the old bar showed two flames for one concept.
 *
 * Two visual states, both always mounted so the bar never reflows mid-game:
 *   - dormant (value < min): muted glass, no animation
 *   - lit (value >= min): orange gradient, breathing glow, flickering flame
 *
 * Animation is encapsulated — the component detects increments internally via
 * prevValueRef (D-10). No animation-trigger props are accepted from the parent.
 *
 * Reads BOTH useMotionTokens().reduce (Framer) AND the in-app reducedMotion
 * toggle (CSS keyframe guard); the OS preference and the in-app setting are
 * independent and either one must suppress motion.
 *
 * The accessibility context is read directly rather than through
 * useAccessibility() so the component degrades to "motion allowed" outside an
 * AccessibilityProvider instead of throwing. This bar is always mounted during
 * a game and is shared across games, so it must not hard-require a provider.
 *
 * @param {number}  props.value    - Current streak/combo count
 * @param {boolean} [props.active] - On-fire state; exposes the on-fire label
 * @param {number}  [props.min]    - Threshold at which the hero lights up
 * @param {boolean} [props.showLabel] - Render the "Streak" caption
 */
export function StreakHero({
  value = 0,
  active = false,
  min = 2,
  showLabel = true,
  className = "",
}) {
  const { t } = useTranslation("common");
  const { reduce } = useMotionTokens();
  const reducedMotion = useReducedMotionSetting();
  const animate = !reduce && !reducedMotion;

  const prevValueRef = useRef(value);
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    if (value > prevValueRef.current) {
      setBumping(true);
      const timer = setTimeout(() => setBumping(false), 300);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  const lit = value >= min;

  return (
    <motion.div
      role="status"
      aria-label={t("games.engagement.combo")}
      animate={bumping && animate ? { scale: [1, 1.18, 1] } : undefined}
      transition={
        animate
          ? { type: "tween", duration: 0.22, ease: "easeInOut" }
          : undefined
      }
      className={`flex min-w-[52px] flex-col items-center justify-center rounded-2xl border px-3 py-1 transition-colors duration-300 motion-reduce:transition-none lg:min-w-[60px] lg:px-4 lg:py-1.5 ${
        lit
          ? "border-orange-400/55 bg-gradient-to-br from-orange-400/[0.28] to-orange-600/[0.22]"
          : "border-white/15 bg-white/[0.06]"
      } ${lit && animate ? "animate-streakGlow" : ""} ${className}`}
    >
      {showLabel && (
        <span className="font-hebrew text-[10px] font-semibold leading-tight text-white/60">
          {t("games.topBar.streakLabel")}
        </span>
      )}
      {/* Value row: the flame sits on the number's line rather than beside a
          stacked column, so this chip matches StatChip's box exactly. */}
      <span className="flex items-center gap-1">
        <span
          className={`font-fredoka text-base font-bold leading-tight lg:text-[17px] ${
            lit ? "text-orange-200" : "text-white/70"
          }`}
        >
          {value}
        </span>
        {active ? (
          <img
            src={flameIcon}
            role="img"
            aria-label={t("games.engagement.onFire")}
            className={`h-4 w-4 drop-shadow-[0_0_6px_rgba(251,146,60,0.9)] lg:h-[18px] lg:w-[18px] ${
              animate ? "animate-flameFlicker" : ""
            }`}
          />
        ) : (
          <img
            src={flameIcon}
            alt=""
            className={`h-4 w-4 lg:h-[18px] lg:w-[18px] ${
              lit
                ? `drop-shadow-[0_0_6px_rgba(251,146,60,0.9)] ${animate ? "animate-flameFlicker" : ""}`
                : "opacity-40 grayscale"
            }`}
          />
        )}
      </span>
    </motion.div>
  );
}
