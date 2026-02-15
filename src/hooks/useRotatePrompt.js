import { useState, useEffect, useRef } from "react";
import { useOrientation } from "./useOrientation";
import { useIsMobile } from "./useIsMobile";
import { isAndroidDevice, isInStandaloneMode } from "../utils/pwaDetection";

/**
 * Prompt visibility logic with permanent dismiss and re-show-once behavior.
 *
 * Logic:
 * - Permanent dismiss via localStorage
 * - Auto-dismiss when rotated to landscape
 * - Re-show once after first auto-dismiss (if user rotates back to portrait)
 * - Desktop filter (never show on desktop)
 */
export function useRotatePrompt() {
  const { isPortrait } = useOrientation();
  const isMobile = useIsMobile();

  // Android PWA suppression (API-based lock available)
  const [isAndroidPWA] = useState(() => isAndroidDevice() && isInStandaloneMode());

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
    if (previousIsPortrait.current === false && isPortrait === true && hasAutoDismissed && !reshowUsed.current) {
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
    isPortrait &&
    !(hasAutoDismissed && reshowUsed.current);

  return {
    shouldShowPrompt,
    dismissPrompt
  };
}
