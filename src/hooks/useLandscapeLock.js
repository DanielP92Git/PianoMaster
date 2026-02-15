import { useEffect } from "react";
import { isAndroidDevice, isInStandaloneMode } from "../utils/pwaDetection";

/**
 * Android PWA landscape lock hook.
 *
 * On Android PWA, enters fullscreen and locks orientation to landscape.
 * On iOS, desktop, or non-PWA contexts, does nothing.
 *
 * Handles the fullscreen prerequisite, orientation lock sequence, Escape key
 * edge case, and proper cleanup on unmount.
 */
export function useLandscapeLock() {
  useEffect(() => {
    // Platform guard: only proceed on Android PWA
    if (!isAndroidDevice() || !isInStandaloneMode()) {
      return;
    }

    // API support guard
    if (!document.documentElement.requestFullscreen || !screen.orientation?.lock) {
      console.warn("Landscape lock not supported: missing fullscreen or orientation API");
      return;
    }

    let didEnterFullscreen = false;

    // Lock sequence: fullscreen → orientation lock
    const lockOrientation = async () => {
      try {
        // Step 1: Enter fullscreen (required for orientation lock on Android)
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        didEnterFullscreen = true;

        // Step 2: Lock to landscape after fullscreen
        await screen.orientation.lock("landscape");
      } catch (error) {
        console.error("Orientation lock failed:", error);
      }
    };

    // Escape key handling: unlock orientation when user exits fullscreen
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    };

    // Add fullscreenchange listener for Escape key handling
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Execute lock sequence
    lockOrientation();

    // Cleanup function
    return () => {
      // Remove event listener
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      // Unlock orientation
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }

      // Exit fullscreen if we entered it
      if (didEnterFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Swallow error since component is unmounting
        });
      }
    };
  }, []); // Run once on mount, cleanup on unmount
}
