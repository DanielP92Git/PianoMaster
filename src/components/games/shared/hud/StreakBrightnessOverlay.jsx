import { useMotionTokens } from "../../../../utils/useMotionTokens";
import { useAccessibility } from "../../../../contexts/AccessibilityContext";

/**
 * StreakBrightnessOverlay
 *
 * A pointer-events-none white veil that brightens the game background as the
 * player's correct-answer streak (`combo`) grows, and snaps back to fully dark
 * (transparent) when the streak breaks (combo resets to 0 on a wrong answer).
 * Gives ambient, peripheral feedback of a hot streak vs. a miss — separate from
 * the combo pill / on-fire badge, which are explicit HUD elements.
 *
 * Placement: render as a child of a `relative` container, BEFORE the game's
 * `relative z-10` content so it sits behind the UI (same role as a background
 * accent layer). It never intercepts pointer events.
 *
 * Opacity ramps linearly from combo 1 and is capped at `maxOpacity` to preserve
 * white-text contrast for young readers (accessibility). The fade is suppressed
 * (applied instantly) under reduced motion — read dual-source from the motion
 * tokens AND the in-app accessibility toggle, mirroring the shared HUD pattern.
 *
 * @param {number} props.combo - Current correct-answer streak (0 = fully dark).
 * @param {number} [props.maxOpacity=0.2] - Brightness ceiling (contrast cap).
 * @param {number} [props.perStep=0.028] - Opacity added per combo step.
 */
export function StreakBrightnessOverlay({
  combo,
  maxOpacity = 0.2,
  perStep = 0.028,
}) {
  const { reduce } = useMotionTokens();
  const { reducedMotion } = useAccessibility();
  const noMotion = reduce || reducedMotion;

  const safeCombo = Math.max(0, combo || 0);
  const opacity = Math.min(maxOpacity, safeCombo * perStep);

  return (
    <div
      aria-hidden="true"
      data-testid="streak-brightness-overlay"
      className="pointer-events-none absolute inset-0 bg-white"
      style={{
        opacity,
        transition: noMotion ? "none" : "opacity 0.5s ease-out",
      }}
    />
  );
}
