import { useCallback, useRef, useEffect } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

// Custom hook for screen reader announcements
export const useScreenReader = () => {
  const { announcements, screenReaderOptimized } = useAccessibility();
  const liveRegionRef = useRef(null);
  const politeRegionRef = useRef(null);
  const assertiveRegionRef = useRef(null);

  // Create live regions if they don't exist
  useEffect(() => {
    if (!announcements) return;

    // Create or find polite live region
    if (!politeRegionRef.current) {
      politeRegionRef.current = document.getElementById("sr-live-polite");
      if (!politeRegionRef.current) {
        politeRegionRef.current = document.createElement("div");
        politeRegionRef.current.id = "sr-live-polite";
        politeRegionRef.current.setAttribute("aria-live", "polite");
        politeRegionRef.current.setAttribute("aria-atomic", "true");
        politeRegionRef.current.className = "sr-only";
        document.body.appendChild(politeRegionRef.current);
      }
    }

    // Create or find assertive live region
    if (!assertiveRegionRef.current) {
      assertiveRegionRef.current = document.getElementById("sr-live-assertive");
      if (!assertiveRegionRef.current) {
        assertiveRegionRef.current = document.createElement("div");
        assertiveRegionRef.current.id = "sr-live-assertive";
        assertiveRegionRef.current.setAttribute("aria-live", "assertive");
        assertiveRegionRef.current.setAttribute("aria-atomic", "true");
        assertiveRegionRef.current.className = "sr-only";
        document.body.appendChild(assertiveRegionRef.current);
      }
    }

    liveRegionRef.current = politeRegionRef.current;
  }, [announcements]);

  // Announce message to screen readers
  const announce = useCallback(
    (message, priority = "polite") => {
      if (!announcements || !message) return;

      const region =
        priority === "assertive"
          ? assertiveRegionRef.current
          : politeRegionRef.current;

      if (region) {
        region.textContent = "";
        setTimeout(() => {
          region.textContent = message;
        }, 100);
        setTimeout(() => {
          region.textContent = "";
        }, 3000);
      }
    },
    [announcements]
  );

  const announcePolite = useCallback(
    (message) => {
      announce(message, "polite");
    },
    [announce]
  );

  const announceAssertive = useCallback(
    (message) => {
      announce(message, "assertive");
    },
    [announce]
  );

  // Announce game events
  const announceGameEvent = useCallback(
    (event, details = "") => {
      if (!announcements) return;

      const gameEventMessages = {
        correct: `Correct! ${details}`,
        incorrect: `Incorrect. ${details}`,
        gameStart: `Game started. ${details}`,
        gameEnd: `Game finished. ${details}`,
        scoreUpdate: `Score updated. ${details}`,
        levelUp: `Level up! ${details}`,
        achievement: `Achievement unlocked! ${details}`,
      };

      const message = gameEventMessages[event] || details;
      if (message) {
        announce(
          message,
          event === "timeWarning" || event === "gameOver"
            ? "assertive"
            : "polite"
        );
      }
    },
    [announce, announcements]
  );

  return {
    announce,
    announcePolite,
    announceAssertive,
    announceGameEvent,
  };
};
