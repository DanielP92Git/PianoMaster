import { useState, useEffect, useRef } from "react";
import { useOrientation } from "./useOrientation";
import { useIsMobile } from "./useIsMobile";
import { isAndroidDevice, isInStandaloneMode } from "../utils/pwaDetection";

/**
 * Reactive `(min-width: 768px)` viewport check. Used by useRotatePrompt to
 * enforce Phase 34 SC #3 ("tablet ≥768: rotate prompt NEVER appears"). The
 * existing isMobile helper matches tablets through `pointer: coarse`, so an
 * explicit viewport-width gate is required here regardless of pointer kind.
 */
function useIsTabletOrLarger() {
  const query = "(min-width: 768px)";
  const get = () => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return false;
    return window.matchMedia(query).matches;
  };
  const [match, setMatch] = useState(get);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return match;
}

/**
 * Prompt visibility logic with permanent dismiss and re-show-once behavior.
 *
 * Logic:
 * - Permanent dismiss via localStorage
 * - Auto-dismiss when rotated to landscape
 * - Re-show once after first auto-dismiss (if user rotates back to portrait)
 * - Desktop filter (never show on desktop)
 * - Tablet filter (never show on ≥768px viewports — Phase 34 SC #3)
 */
export function useRotatePrompt() {
  const { isPortrait } = useOrientation();
  const isMobile = useIsMobile();
  const isTabletOrLarger = useIsTabletOrLarger();

  // Android PWA suppression (API-based lock available)
  const [isAndroidPWA] = useState(
    () => isAndroidDevice() && isInStandaloneMode()
  );

  // Permanent dismiss state
  const [permanentlyDismissed, setPermanentlyDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pianoapp-rotate-dismissed") === "true";
  });

  // Auto-dismiss tracking
  const [hasAutoDismissed, setHasAutoDismissed] = useState(false);

  // Re-show once tracking (use ref to avoid extra renders)
  const reshowUsed = useRef(false);
  const previousIsPortrait = useRef(isPortrait);

  // Auto-dismiss effect: when rotating to landscape
  useEffect(() => {
    if (!isPortrait && !hasAutoDismissed && !permanentlyDismissed && isMobile) {
      setHasAutoDismissed(true);
    }

    // Re-show once logic: after first auto-dismiss, allow ONE more show
    if (
      previousIsPortrait.current === false &&
      isPortrait === true &&
      hasAutoDismissed &&
      !reshowUsed.current
    ) {
      reshowUsed.current = true;
    }

    previousIsPortrait.current = isPortrait;
  }, [isPortrait, hasAutoDismissed, permanentlyDismissed, isMobile]);

  const dismissPrompt = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pianoapp-rotate-dismissed", "true");
    }
    setPermanentlyDismissed(true);
  };

  // Determine if prompt should be shown
  const shouldShowPrompt =
    !isAndroidPWA &&
    !permanentlyDismissed &&
    isMobile &&
    !isTabletOrLarger &&
    isPortrait &&
    !(hasAutoDismissed && reshowUsed.current);

  return {
    shouldShowPrompt,
    dismissPrompt,
  };
}
